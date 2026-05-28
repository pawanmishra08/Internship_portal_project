"""
Run: python manage.py seed_skills
Populates the Skill table with a default set grouped by category.
"""
from django.core.management.base import BaseCommand
from students.models import Skill

SKILLS = {
    'Programming': [
        'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#',
        'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby',
    ],
    'Frontend': [
        'React', 'Vue.js', 'Angular', 'Next.js', 'HTML', 'CSS',
        'Tailwind CSS', 'Sass', 'Redux', 'GraphQL',
    ],
    'Backend': [
        'Django', 'FastAPI', 'Node.js', 'Express', 'Spring Boot',
        'Laravel', 'Ruby on Rails', 'REST API', 'gRPC',
    ],
    'Database': [
        'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite',
        'Elasticsearch', 'Firebase',
    ],
    'DevOps': [
        'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
        'CI/CD', 'GitHub Actions', 'Terraform', 'Linux',
    ],
    'Data & ML': [
        'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy',
        'TensorFlow', 'PyTorch', 'Scikit-learn', 'Data Analysis',
        'SQL', 'Tableau', 'Power BI',
    ],
    'Design': [
        'Figma', 'Adobe XD', 'UI/UX Design', 'Sketch',
        'Canva', 'Wireframing', 'Prototyping',
    ],
    'Soft Skills': [
        'Communication', 'Teamwork', 'Problem Solving',
        'Project Management', 'Leadership', 'Agile', 'Scrum',
    ],
}

class Command(BaseCommand):
    help = 'Seed the database with initial skills'

    def handle(self, *args, **kwargs):
        created = 0
        for category, skills in SKILLS.items():
            for name in skills:
                _, was_created = Skill.objects.get_or_create(
                    name=name,
                    defaults={'category': category}
                )
                if was_created:
                    created += 1
        self.stdout.write(
            self.style.SUCCESS(f'Done. {created} new skills added.')
        )