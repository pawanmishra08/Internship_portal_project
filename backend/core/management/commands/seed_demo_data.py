"""Create demo users, profiles, jobs, applications, and export credentials."""

from __future__ import annotations

import csv
import json
import random
from datetime import timedelta
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from applications.models import Application
from companies.models import CompanyProfile, Job
from students.management.commands.seed_skills import SKILLS
from students.models import Skill, StudentProfile

User = get_user_model()

STUDENT_TEMPLATES = [
    {
        'full_name': 'Aarav Sharma',
        'location': 'Kathmandu',
        'university': 'Kathmandu University',
        'field_of_study': 'Computer Science',
        'target_role': 'Backend Developer Intern',
        'preferred_work_mode': 'hybrid',
        'gpa': 3.72,
    },
    {
        'full_name': 'Priya Singh',
        'location': 'Pokhara',
        'university': 'Pokhara University',
        'field_of_study': 'Software Engineering',
        'target_role': 'Frontend Developer Intern',
        'preferred_work_mode': 'remote',
        'gpa': 3.68,
    },
    {
        'full_name': 'Nabin Rai',
        'location': 'Lalitpur',
        'university': 'Tribhuvan University',
        'field_of_study': 'Information Systems',
        'target_role': 'Data Analyst Intern',
        'preferred_work_mode': 'on_site',
        'gpa': 3.4,
    },
    {
        'full_name': 'Sushmita Karki',
        'location': 'Biratnagar',
        'university': 'Purbanchal University',
        'field_of_study': 'Computer Engineering',
        'target_role': 'ML Engineer Intern',
        'preferred_work_mode': 'remote',
        'gpa': 3.79,
    },
    {
        'full_name': 'Rohan Thapa',
        'location': 'Butwal',
        'university': 'Kathmandu University',
        'field_of_study': 'Computer Science',
        'target_role': 'DevOps Intern',
        'preferred_work_mode': 'hybrid',
        'gpa': 3.21,
    },
    {
        'full_name': 'Anisha Gurung',
        'location': 'Chitwan',
        'university': 'Mid-West University',
        'field_of_study': 'Information Technology',
        'target_role': 'Product Design Intern',
        'preferred_work_mode': 'on_site',
        'gpa': 3.55,
    },
]

COMPANY_TEMPLATES = [
    {
        'full_name': 'NovaLabs Hiring Team',
        'company_name': 'NovaLabs',
        'tagline': 'Modern software products for global startups',
        'industry': 'technology',
        'size': '51-200',
        'location': 'Kathmandu',
        'website': 'https://novalabs.example.com',
    },
    {
        'full_name': 'FinPeak Talent',
        'company_name': 'FinPeak Analytics',
        'tagline': 'Data and finance intelligence platform',
        'industry': 'finance',
        'size': '11-50',
        'location': 'Lalitpur',
        'website': 'https://finpeak.example.com',
    },
    {
        'full_name': 'CloudBridge Careers',
        'company_name': 'CloudBridge Systems',
        'tagline': 'Cloud-native systems and managed infrastructure',
        'industry': 'technology',
        'size': '201-500',
        'location': 'Remote',
        'website': 'https://cloudbridge.example.com',
    },
    {
        'full_name': 'BrightCart Team',
        'company_name': 'BrightCart',
        'tagline': 'E-commerce growth platform',
        'industry': 'ecommerce',
        'size': '51-200',
        'location': 'Pokhara',
        'website': 'https://brightcart.example.com',
    },
]

JOB_TEMPLATES = [
    {
        'title': 'Backend Engineering Intern',
        'type': 'hybrid',
        'location': 'Kathmandu',
        'duration_months': 4,
        'stipend_min': 18000,
        'stipend_max': 28000,
        'skills': ['Python', 'Django', 'REST API', 'PostgreSQL'],
    },
    {
        'title': 'Frontend React Intern',
        'type': 'remote',
        'location': 'Remote',
        'duration_months': 3,
        'stipend_min': 15000,
        'stipend_max': 25000,
        'skills': ['React', 'TypeScript', 'Tailwind CSS', 'HTML'],
    },
    {
        'title': 'Data Analyst Intern',
        'type': 'on_site',
        'location': 'Lalitpur',
        'duration_months': 5,
        'stipend_min': 17000,
        'stipend_max': 26000,
        'skills': ['SQL', 'Pandas', 'Data Analysis', 'Tableau'],
    },
    {
        'title': 'ML Engineer Intern',
        'type': 'remote',
        'location': 'Remote',
        'duration_months': 6,
        'stipend_min': 22000,
        'stipend_max': 32000,
        'skills': ['Python', 'PyTorch', 'Scikit-learn', 'Deep Learning'],
    },
    {
        'title': 'DevOps Intern',
        'type': 'hybrid',
        'location': 'Kathmandu',
        'duration_months': 4,
        'stipend_min': 20000,
        'stipend_max': 30000,
        'skills': ['Docker', 'Linux', 'AWS', 'CI/CD'],
    },
    {
        'title': 'Product Design Intern',
        'type': 'on_site',
        'location': 'Pokhara',
        'duration_months': 3,
        'stipend_min': 14000,
        'stipend_max': 22000,
        'skills': ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping'],
    },
]


class Command(BaseCommand):
    help = 'Seed robust demo data and export credentials for login handoff.'

    def add_arguments(self, parser):
        parser.add_argument('--students', type=int, default=8, help='Number of student users to create.')
        parser.add_argument('--companies', type=int, default=4, help='Number of company users to create.')
        parser.add_argument('--jobs-per-company', type=int, default=20, help='How many jobs each company should have.')
        parser.add_argument('--applications-per-student', type=int, default=2, help='How many jobs each student applies to.')
        parser.add_argument('--password', default='DemoPass123!', help='Password used for all demo users.')
        parser.add_argument('--seed', type=int, default=42, help='Random seed for repeatable assignment.')
        parser.add_argument('--reset', action='store_true', help='Delete existing demo users/data before reseeding.')
        parser.add_argument('--export-file', default='demo_credentials.json', help='Credential export path (json/csv/env).')
        parser.add_argument('--no-export', action='store_true', help='Skip credential export file generation.')

    def handle(self, *args, **options):
        students_count = options['students']
        companies_count = options['companies']
        jobs_per_company = options['jobs_per_company']
        apps_per_student = options['applications_per_student']
        password = options['password']
        seed = options['seed']
        export_file = Path(options['export_file'])

        if min(students_count, companies_count, jobs_per_company, apps_per_student) < 0:
            raise CommandError('Counts must be non-negative integers.')

        rng = random.Random(seed)

        with transaction.atomic():
            if options['reset']:
                self._reset_demo_data()

            skills_by_name = self._ensure_skills()
            students = self._ensure_students(students_count, password, rng, skills_by_name)
            companies = self._ensure_companies(companies_count, password)
            jobs = self._ensure_jobs(companies, jobs_per_company, skills_by_name)
            applications_created = self._ensure_applications(students, jobs, apps_per_student, rng)
            credentials = self._build_credentials(students, companies, password)

        if not options['no_export']:
            self._write_credentials_file(export_file, credentials)
            self.stdout.write(self.style.SUCCESS(f'Credentials exported to: {export_file.resolve()}'))

        self.stdout.write(self.style.SUCCESS('Demo seed complete.'))
        self.stdout.write(
            self.style.WARNING(
                f'Users: {len(students) + len(companies) + 1}, Jobs: {len(jobs)}, New applications: {applications_created}'
            )
        )

    def _reset_demo_data(self):
        demo_users = User.objects.filter(email__startswith='demo.')
        deleted = demo_users.count()
        demo_users.delete()
        self.stdout.write(f'Reset: removed {deleted} demo users and related records.')

    def _ensure_skills(self):
        skills_by_name = {}
        for category, names in SKILLS.items():
            for name in names:
                skill, _ = Skill.objects.get_or_create(name=name, defaults={'category': category})
                if not skill.category:
                    skill.category = category
                    skill.save(update_fields=['category'])
                skills_by_name[name] = skill
        return skills_by_name

    def _ensure_students(self, count, password, rng, skills_by_name):
        students = []
        degrees = ['bachelor', 'master']
        available_skill_names = list(skills_by_name.keys())

        for i in range(count):
            template = STUDENT_TEMPLATES[i % len(STUDENT_TEMPLATES)]
            email = f'demo.student{i + 1:02d}@example.com'

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': template['full_name'],
                    'role': 'student',
                },
            )
            if created:
                user.set_password(password)
                user.save()
            else:
                user.full_name = template['full_name']
                user.role = 'student'
                user.set_password(password)
                user.save(update_fields=['full_name', 'role', 'password'])

            profile, _ = StudentProfile.objects.get_or_create(user=user)
            profile.bio = f"{template['full_name']} is actively seeking {template['target_role'].lower()} opportunities."
            profile.phone = f'+977-980000{i + 100:03d}'
            profile.location = template['location']
            profile.university = template['university']
            profile.degree = degrees[i % len(degrees)]
            profile.field_of_study = template['field_of_study']
            profile.target_role = template['target_role']
            profile.preferred_work_mode = template['preferred_work_mode']
            profile.graduation_year = 2026 + (i % 2)
            profile.gpa = template['gpa']
            profile.linkedin_url = f'https://linkedin.com/in/demo-student-{i + 1:02d}'
            profile.github_url = f'https://github.com/demo-student-{i + 1:02d}'
            profile.is_available = i % 5 != 0
            profile.save()

            picked_skills = rng.sample(available_skill_names, k=min(8, len(available_skill_names)))
            profile.skills.set([skills_by_name[name] for name in picked_skills])
            students.append(profile)

        return students

    def _ensure_companies(self, count, password):
        companies = []

        for i in range(count):
            template = COMPANY_TEMPLATES[i % len(COMPANY_TEMPLATES)]
            email = f'demo.company{i + 1:02d}@example.com'

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': template['full_name'],
                    'role': 'company',
                },
            )
            if created:
                user.set_password(password)
                user.save()
            else:
                user.full_name = template['full_name']
                user.role = 'company'
                user.set_password(password)
                user.save(update_fields=['full_name', 'role', 'password'])

            profile, _ = CompanyProfile.objects.get_or_create(user=user)
            profile.company_name = template['company_name']
            profile.tagline = template['tagline']
            profile.description = f"{template['company_name']} is hiring strong intern talent for product teams."
            profile.industry = template['industry']
            profile.size = template['size']
            profile.website = template['website']
            profile.location = template['location']
            profile.linkedin_url = f"https://linkedin.com/company/{template['company_name'].lower().replace(' ', '-') }"
            profile.is_verified = True
            profile.verified_at = profile.verified_at or timezone.now()
            profile.save()
            companies.append(profile)

        self._ensure_admin(password)
        return companies

    def _ensure_admin(self, password):
        admin_user, created = User.objects.get_or_create(
            email='demo.admin@example.com',
            defaults={
                'full_name': 'Demo Platform Admin',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin_user.full_name = 'Demo Platform Admin'
        admin_user.role = 'admin'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password(password)
        if created:
            admin_user.save()
        else:
            admin_user.save(update_fields=['full_name', 'role', 'is_staff', 'is_superuser', 'password'])

    def _ensure_jobs(self, companies, jobs_per_company, skills_by_name):
        jobs = []
        if jobs_per_company == 0:
            return jobs

        today = timezone.now().date()

        for company_index, company in enumerate(companies):
            for i in range(jobs_per_company):
                template = JOB_TEMPLATES[(company_index + i) % len(JOB_TEMPLATES)]
                title = f"{template['title']} #{i + 1}"
                job, _ = Job.objects.update_or_create(
                    company=company,
                    title=title,
                    defaults={
                        'description': f"Join {company.company_name} as a {template['title']} and work on real product features.",
                        'requirements': 'Strong communication, ownership mindset, and practical problem solving.',
                        'responsibilities': 'Collaborate with mentors, ship weekly tasks, and present demo outcomes.',
                        'location': template['location'],
                        'type': template['type'],
                        'status': 'active',
                        'stipend_min': template['stipend_min'],
                        'stipend_max': template['stipend_max'],
                        'duration_months': template['duration_months'],
                        'openings': 2,
                        'deadline': today + timedelta(days=40 + (i * 7)),
                    },
                )
                job.required_skills.set(
                    [skills_by_name[name] for name in template['skills'] if name in skills_by_name]
                )
                jobs.append(job)

        return jobs

    def _ensure_applications(self, students, jobs, applications_per_student, rng):
        if not jobs or applications_per_student == 0:
            return 0

        created_count = 0
        for student in students:
            selected_jobs = rng.sample(jobs, k=min(applications_per_student, len(jobs)))
            for job in selected_jobs:
                _, created = Application.objects.get_or_create(
                    student=student,
                    job=job,
                    defaults={
                        'cover_letter': (
                            f"Hello {job.company.company_name}, I am interested in {job.title} because "
                            'my skills align with the role requirements and I can contribute quickly.'
                        )
                    },
                )
                if created:
                    created_count += 1

        return created_count

    def _build_credentials(self, students, companies, password):
        rows = [
            {
                'role': 'admin',
                'name': 'Demo Platform Admin',
                'email': 'demo.admin@example.com',
                'password': password,
            }
        ]

        rows.extend(
            {
                'role': 'student',
                'name': student.user.full_name,
                'email': student.user.email,
                'password': password,
            }
            for student in students
        )

        rows.extend(
            {
                'role': 'company',
                'name': company.company_name,
                'email': company.user.email,
                'password': password,
            }
            for company in companies
        )
        return rows

    def _write_credentials_file(self, export_file: Path, credentials):
        suffix = export_file.suffix.lower().lstrip('.')
        export_file.parent.mkdir(parents=True, exist_ok=True)

        if suffix in {'', 'json'}:
            payload = {
                'generated_at': timezone.now().isoformat(),
                'count': len(credentials),
                'credentials': credentials,
            }
            export_file.write_text(json.dumps(payload, indent=2), encoding='utf-8')
            return

        if suffix == 'csv':
            with export_file.open('w', newline='', encoding='utf-8') as handle:
                writer = csv.DictWriter(handle, fieldnames=['role', 'name', 'email', 'password'])
                writer.writeheader()
                writer.writerows(credentials)
            return

        if suffix == 'env':
            lines = []
            for idx, row in enumerate(credentials, start=1):
                key = row['role'].upper()
                lines.append(f'DEMO_{key}_{idx}_EMAIL={row["email"]}')
                lines.append(f'DEMO_{key}_{idx}_PASSWORD={row["password"]}')
                lines.append(f'DEMO_{key}_{idx}_NAME={row["name"]}')
            export_file.write_text('\n'.join(lines) + '\n', encoding='utf-8')
            return

        raise CommandError('Unsupported export extension. Use .json, .csv, or .env')
