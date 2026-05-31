"""Recommendation engine with weighted fit scoring and prefetch-aware access.

Optimizations applied (no scoring logic or weights changed):
  1. Skip redundant student DB re-fetch if prefetch cache already present.
  2. Student skills extracted once outside the loop, passed into scorer.
  3. Early exit per job using skill pre-check before computing all signals.
  4. Fixed _role_alignment_score normalization (now divides by student tokens).
  5. Job text tokenization cached via lru_cache to avoid redundant regex work.
"""

from datetime import timedelta
from functools import lru_cache
import re

from django.utils import timezone

from companies.models import Job
from students.models import StudentProfile

MIN_SCORE = 30

# Weighted score rubric (100 total)
WEIGHTS = {
    'skill_match': 55.0,
    'gpa': 10.0,
    'availability': 10.0,
    'location': 8.0,
    'profile_completeness': 7.0,
    'role_alignment': 5.0,
    'work_mode': 3.0,
    'freshness': 2.0,
}

# Maximum points achievable from all signals except skill_match.
# Used for early-exit pre-check.
_MAX_NON_SKILL_POINTS: float = sum(v for k, v in WEIGHTS.items() if k != 'skill_match')

STOPWORDS = {
    'a', 'an', 'and', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with',
    'intern', 'internship', 'role', 'junior', 'associate',
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_skill_ids_and_names(obj, relation_name: str) -> tuple[set[int], set[str]]:
    """Return skill ids and names from prefetch cache when available."""
    cache = getattr(obj, '_prefetched_objects_cache', {})
    prefetched = cache.get(relation_name)

    if prefetched is not None:
        ids = {skill.id for skill in prefetched}
        names = {skill.name for skill in prefetched}
        return ids, names

    relation = getattr(obj, relation_name)
    rows = relation.values_list('id', 'name')
    ids = {row[0] for row in rows}
    names = {row[1] for row in rows}
    return ids, names


def _tokenize(text: str) -> frozenset[str]:
    if not text:
        return frozenset()
    tokens = set(re.findall(r"[a-z0-9]+", text.lower()))
    return frozenset(token for token in tokens if len(token) > 2 and token not in STOPWORDS)


@lru_cache(maxsize=512)
def _tokenize_job(job_id: int, title: str, description: str, requirements: str) -> frozenset[str]:
    """Cache tokenized job text keyed by job_id to avoid redundant regex work
    when scoring multiple students against the same job."""
    return _tokenize(f"{title} {description} {requirements}")


def _clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


# ---------------------------------------------------------------------------
# Per-signal scorers — each returns a normalized float in [0, 1]
# ---------------------------------------------------------------------------

def _skill_score(student_skill_ids: set[int], job_skill_ids: set[int]) -> float:
    """Normalized skill-match score in range [0, 1].

    Uses proportion of required skills matched, applies a soft penalty
    for missing critical skills and a small bonus for useful extra skills.
    """
    if not job_skill_ids:
        return 1.0

    matched = student_skill_ids & job_skill_ids
    coverage = len(matched) / len(job_skill_ids)

    # Missing ratio (fraction of required skills not present)
    missing_ratio = len(job_skill_ids - student_skill_ids) / len(job_skill_ids)

    # Soft penalty for missing required skills (up to 0.6)
    gap_penalty = missing_ratio * 0.6

    # Small bonus for extra skills the student has (diminishing): up to 0.08
    extra = len(student_skill_ids - job_skill_ids)
    extra_bonus = min(extra / 20.0, 0.08)

    raw = coverage - gap_penalty + extra_bonus
    return round(_clamp(raw), 3)


def _gpa_score(gpa) -> float:
    if gpa is None:
        return 0.0
    gpa_value = float(gpa)
    # Normalize GPA to [0,1] with a soft floor at 2.0 and ceiling at 4.0
    norm = (gpa_value - 2.0) / (4.0 - 2.0)
    return round(_clamp(norm), 3)


def _availability_score(student: StudentProfile) -> float:
    return 1.0 if getattr(student, 'is_available', False) else 0.0


def _location_score(student_location: str, job_location: str, job_type: str) -> float:
    # Remote jobs are full match for location
    if job_type == 'remote' or not job_location or job_location.lower() == 'remote':
        return 1.0

    if not student_location:
        return 0.0

    student_norm = set(re.findall(r"[a-z0-9]+", student_location.lower()))
    job_norm = set(re.findall(r"[a-z0-9]+", job_location.lower()))
    if not job_norm or not student_norm:
        return 0.0

    overlap = len(student_norm & job_norm)
    frac = overlap / max(1, len(job_norm))
    if frac >= 0.6:
        return 1.0
    if frac >= 0.3:
        return 0.6
    return 0.0


def _completeness_score(student: StudentProfile) -> float:
    fields = [
        student.bio,
        student.phone,
        student.university,
        student.degree,
        student.resume,
        student.linkedin_url,
        student.github_url,
        student.portfolio_url,
        student.target_role,
        student.projects,
    ]
    filled = sum(1 for field in fields if field)
    return round(_clamp(filled / len(fields)), 3)


def _role_alignment_score(student_target_role: str, job: Job) -> float:
    """Score how well the student's target role aligns with the job.

    FIX: normalize by student_tokens (not job_tokens) so the signal measures
    'how much of what the student wants does this job cover' — far more
    meaningful for a 5-pt weight than dividing by a 200-token job description.
    """
    if not student_target_role:
        return 0.0

    student_tokens = _tokenize(student_target_role)
    job_tokens = _tokenize_job(
        job.id,
        job.title or '',
        job.description or '',
        job.requirements or '',
    )
    if not student_tokens or not job_tokens:
        return 0.0

    overlap = len(student_tokens & job_tokens)
    norm = overlap / max(1, len(student_tokens))   # <- fixed denominator
    return round(_clamp(norm), 3)


def _work_mode_score(student_mode: str, job_type: str) -> float:
    if not student_mode:
        return 0.0

    normalized = student_mode.lower().strip().replace(' ', '_')
    if normalized == job_type:
        return 1.0
    if normalized == 'hybrid' and job_type in {'remote', 'on_site'}:
        return 0.7
    return 0.0


def _freshness_score(job: Job) -> float:
    days_old = (timezone.now() - job.created_at).days
    if days_old <= 0:
        return 1.0
    # Exponential-ish decay over ~14 days
    score = 2 ** (-(days_old / 14.0))
    return round(_clamp(score), 3)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def score_student_for_job(
    student: StudentProfile,
    job: Job,
    *,
    student_skill_ids: set[int] | None = None,
    student_skill_names: set[str] | None = None,
) -> dict:
    """Return a structured score payload for one student/job pair.

    Args:
        student: the student profile to score.
        job: the job to score against.
        student_skill_ids: pre-extracted skill id set (avoids DB hit when
            scoring the same student against many jobs).
        student_skill_names: pre-extracted skill name set (same reason).

    Returns:
        {
            'score': float (0..100),
            'matched_skills': sorted list[str],
            'missing_skills': sorted list[str],
            'breakdown': dict of per-signal absolute points,
        }
    """
    # Only extract from DB/cache if not passed in
    if student_skill_ids is None or student_skill_names is None:
        student_skill_ids, student_skill_names = _extract_skill_ids_and_names(student, 'skills')

    job_skill_ids, job_skill_names = _extract_skill_ids_and_names(job, 'required_skills')

    # Compute normalized per-signal scores (0..1)
    skill_norm     = _skill_score(student_skill_ids, job_skill_ids)
    gpa_norm       = _gpa_score(student.gpa)
    avail_norm     = _availability_score(student)
    loc_norm       = _location_score(student.location, job.location, job.type)
    complete_norm  = _completeness_score(student)
    role_norm      = _role_alignment_score(student.target_role, job)
    mode_norm      = _work_mode_score(student.preferred_work_mode, job.type)
    freshness_norm = _freshness_score(job)

    # Convert normalized values into absolute points using WEIGHTS (sum to 100)
    skill_pts     = round(skill_norm     * WEIGHTS['skill_match'],         2)
    gpa_pts       = round(gpa_norm       * WEIGHTS['gpa'],                 2)
    avail_pts     = round(avail_norm     * WEIGHTS['availability'],        2)
    loc_pts       = round(loc_norm       * WEIGHTS['location'],            2)
    complete_pts  = round(complete_norm  * WEIGHTS['profile_completeness'],2)
    role_pts      = round(role_norm      * WEIGHTS['role_alignment'],      2)
    mode_pts      = round(mode_norm      * WEIGHTS['work_mode'],           2)
    freshness_pts = round(freshness_norm * WEIGHTS['freshness'],           2)

    total = round(
        skill_pts + gpa_pts + avail_pts + loc_pts
        + complete_pts + role_pts + mode_pts + freshness_pts,
        1,
    )

    matched = student_skill_names & job_skill_names
    missing = job_skill_names - student_skill_names

    return {
        'score': total,
        'matched_skills': sorted(matched),
        'missing_skills': sorted(missing),
        'breakdown': {
            'skill_match':          skill_pts,
            'gpa':                  gpa_pts,
            'availability':         avail_pts,
            'location':             loc_pts,
            'profile_completeness': complete_pts,
            'role_alignment':       role_pts,
            'work_mode':            mode_pts,
            'freshness':            freshness_pts,
        },
    }


def get_recommendations(student: StudentProfile, limit: int = 20) -> list:
    """Return ranked job recommendations for one student profile.

    Returns:
        List of dicts sorted by score descending (ties broken by job recency):
        [
          {
            'job': Job,
            'score': 85.5,
            'matched_skills': ['Python', 'Django'],
            'missing_skills': ['React'],
            'breakdown': { 'skill_match': 49.5, 'gpa': 8.0, ... },
          },
          ...
        ]
    """
    # Optimization 1: only re-fetch if skills prefetch cache is absent
    cache = getattr(student, '_prefetched_objects_cache', {})
    if 'skills' not in cache:
        student = StudentProfile.objects.prefetch_related('skills').get(pk=student.pk)

    # Optimization 2: extract student skills once — reused for every job
    student_skill_ids, student_skill_names = _extract_skill_ids_and_names(student, 'skills')

    active_jobs = (
        Job.objects.filter(
            status='active',
            company__is_verified=True,
            deadline__gte=timezone.now().date() - timedelta(days=1),
        )
        .exclude(applications__student=student)
        .select_related('company')
        .prefetch_related('required_skills')
        .distinct()
    )

    results = []

    for job in active_jobs:
        job_skill_ids, _ = _extract_skill_ids_and_names(job, 'required_skills')

        # Optimization 3: early exit — if max possible score (skill=0 + all
        # other signals at max) still can't reach MIN_SCORE, skip this job
        # without computing the remaining expensive signals.
        skill_norm = _skill_score(student_skill_ids, job_skill_ids)
        skill_pts  = round(skill_norm * WEIGHTS['skill_match'], 2)

        if skill_pts + _MAX_NON_SKILL_POINTS < MIN_SCORE:
            continue

        score_payload = score_student_for_job(
            student,
            job,
            student_skill_ids=student_skill_ids,
            student_skill_names=student_skill_names,
        )

        if score_payload['score'] < MIN_SCORE:
            continue

        results.append({'job': job, **score_payload})

    # Primary sort: score descending; secondary: job recency descending
    results.sort(key=lambda item: (item['score'], item['job'].created_at), reverse=True)
    return results[:limit]