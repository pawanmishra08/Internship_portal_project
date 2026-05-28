"""
Core skill-matching algorithm.

Score breakdown (total = 100):
  - Skill match        → 60 pts  (matched / total required skills)
  - GPA bonus          → 10 pts  (GPA >= 3.5 = 10, >= 3.0 = 5)
  - Availability       → 10 pts
  - Location match     → 10 pts
  - Profile completeness → 10 pts

Only jobs where score >= MIN_SCORE are returned.
Results are sorted by score descending.
"""

from companies.models import Job
from students.models import StudentProfile

MIN_SCORE = 20  # Minimum match % to include


def _skill_score(student_skills: set, job_skills: set) -> float:
    """60-point skill matching component."""
    if not job_skills:
        return 60.0  # No requirements = full score
    matched = student_skills & job_skills
    return round((len(matched) / len(job_skills)) * 60, 2)


def _gpa_score(gpa) -> float:
    """10-point GPA bonus."""
    if gpa is None:
        return 0
    if gpa >= 3.5:
        return 10.0
    if gpa >= 3.0:
        return 5.0
    return 0


def _availability_score(student: StudentProfile) -> float:
    """10-point availability component."""
    return 10.0 if student.is_available else 0


def _location_score(student_location: str, job_location: str) -> float:
    """10-point location match. Remote jobs always score full."""
    if not job_location or job_location.lower() == 'remote':
        return 10.0
    if not student_location:
        return 0
    if student_location.lower() in job_location.lower() or \
       job_location.lower() in student_location.lower():
        return 10.0
    return 0


def _completeness_score(student: StudentProfile) -> float:
    """10-point profile completeness bonus."""
    fields = [
        student.bio, student.phone, student.university,
        student.degree, student.resume, student.linkedin_url,
    ]
    filled = sum(1 for f in fields if f)
    return round((filled / len(fields)) * 10, 2)


def get_recommendations(student: StudentProfile, limit: int = 20) -> list:
    """
    Returns a list of dicts sorted by score:
    [
      {
        'job': Job instance,
        'score': 85.5,
        'matched_skills': ['Python', 'Django'],
        'missing_skills': ['React'],
        'breakdown': { 'skill': 60, 'gpa': 10, ... }
      },
      ...
    ]
    """
    student_skill_ids = set(student.skills.values_list('id', flat=True))
    student_skill_names = set(student.skills.values_list('name', flat=True))

    active_jobs = Job.objects.filter(
        status='active',
        company__is_verified=True,
    ).prefetch_related('required_skills').select_related('company')

    # Exclude already-applied jobs
    applied_job_ids = set(
        student.applications.values_list('job_id', flat=True)
    )

    results = []

    for job in active_jobs:
        if job.id in applied_job_ids:
            continue

        job_skill_ids = set(job.required_skills.values_list('id', flat=True))
        job_skill_names = set(job.required_skills.values_list('name', flat=True))

        skill_pts    = _skill_score(student_skill_ids, job_skill_ids)
        gpa_pts      = _gpa_score(student.gpa)
        avail_pts    = _availability_score(student)
        loc_pts      = _location_score(student.location, job.location)
        complete_pts = _completeness_score(student)

        total = skill_pts + gpa_pts + avail_pts + loc_pts + complete_pts

        if total < MIN_SCORE:
            continue

        matched = student_skill_names & job_skill_names
        missing = job_skill_names - student_skill_names

        results.append({
            'job': job,
            'score': round(total, 1),
            'matched_skills': sorted(matched),
            'missing_skills': sorted(missing),
            'breakdown': {
                'skill_match': skill_pts,
                'gpa': gpa_pts,
                'availability': avail_pts,
                'location': loc_pts,
                'profile_completeness': complete_pts,
            }
        })

    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:limit]