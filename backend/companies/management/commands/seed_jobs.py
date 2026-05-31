from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from companies.models import CompanyProfile, Job
from students.models import Skill


TITLES = [
    'Software Engineer Intern',
    'Frontend Developer Intern',
    'Backend Developer Intern',
    'Data Science Intern',
    'Product Management Intern',
    'QA Engineer Intern',
    'DevOps Intern',
    'Mobile Developer Intern',
    'UI/UX Designer Intern',
    'Machine Learning Intern',
]

LOCATIONS = ['Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Bengaluru, India', 'London, UK']

DESCRIPTION_TPL = (
    "{title} at {company}.\n\n"
    "We are looking for a motivated intern to join our {dept} team. "
    "You will work on real-world projects, collaborate with engineers and product, "
    "and get mentorship from experienced professionals."
)

RESPONSIBILITIES_TPL = (
    "- Contribute to the {dept} codebase and ship features.\n"
    "- Collaborate with cross-functional teams.\n"
    "- Write tests, documentation, and participate in design discussions."
)

REQUIREMENTS_TPL = (
    "Experience with {skills}. Familiarity with software development lifecycle, "
    "strong problem solving and communication skills."
)


class Command(BaseCommand):
    help = 'Seed job postings across existing companies'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=200, help='Number of job posts to create')
        parser.add_argument('--force', action='store_true', help='Allow creating even if no companies')

    def handle(self, *args, **options):
        count = options['count']
        companies = list(CompanyProfile.objects.all())
        if not companies:
            if options['force']:
                self.stdout.write(self.style.WARNING('No companies found, exiting (force used)'))
            else:
                self.stdout.write(self.style.ERROR('No companies found. Create companies first or pass --force'))
            return

        skills = list(Skill.objects.all())
        skill_names = [s.name for s in skills]

        created = 0
        for i in range(count):
            comp = random.choice(companies)
            title = random.choice(TITLES)
            dept = title.split()[0].lower()
            location = comp.location or random.choice(LOCATIONS)
            job_type = random.choice([t[0] for t in Job.TYPE_CHOICES])
            stipend_min = random.choice([0, 500, 1000, 1500])
            stipend_max = stipend_min + random.choice([500, 1000, 1500]) if stipend_min else None
            duration_months = random.choice([1, 2, 3, 6, None])
            openings = random.choice([1, 2, 3])
            deadline = timezone.now().date() + timedelta(days=random.randint(7, 90))

            # pick 2-6 skills if available
            req_skills = []
            if skills:
                req_skills = random.sample(skills, min(len(skills), random.randint(2, 6)))
            req_skill_names = ', '.join([s.name for s in req_skills]) if req_skills else 'relevant technologies'

            description = DESCRIPTION_TPL.format(title=title, company=comp.company_name, dept=dept)
            responsibilities = RESPONSIBILITIES_TPL.format(dept=dept)
            requirements = REQUIREMENTS_TPL.format(skills=req_skill_names)

            job = Job.objects.create(
                company=comp,
                title=title,
                description=description,
                requirements=requirements,
                responsibilities=responsibilities,
                location=location,
                type=job_type,
                status='active',
                stipend_min=stipend_min,
                stipend_max=stipend_max,
                duration_months=duration_months,
                openings=openings,
                deadline=deadline,
            )

            if req_skills:
                job.required_skills.add(*req_skills)

            created += 1
            if created % 25 == 0:
                self.stdout.write(self.style.SUCCESS(f'Created {created} jobs...'))

        self.stdout.write(self.style.SUCCESS(f'Done. Created {created} job postings across {len(companies)} companies.'))
