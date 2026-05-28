from django.db import models
from django.conf import settings
from students.models import Skill


class CompanyProfile(models.Model):
    INDUSTRY_CHOICES = [
        ('technology', 'Technology'),
        ('finance', 'Finance'),
        ('healthcare', 'Healthcare'),
        ('education', 'Education'),
        ('ecommerce', 'E-Commerce'),
        ('media', 'Media'),
        ('consulting', 'Consulting'),
        ('manufacturing', 'Manufacturing'),
        ('other', 'Other'),
    ]
    SIZE_CHOICES = [
        ('1-10', '1–10'),
        ('11-50', '11–50'),
        ('51-200', '51–200'),
        ('201-500', '201–500'),
        ('500+', '500+'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='company_profile'
    )
    company_name = models.CharField(max_length=255)
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES, blank=True)
    size = models.CharField(max_length=10, choices=SIZE_CHOICES, blank=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=150, blank=True)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    linkedin_url = models.URLField(blank=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name


class Job(models.Model):
    TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('remote', 'Remote'),
        ('hybrid', 'Hybrid'),
        ('on_site', 'On Site'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('paused', 'Paused'),
    ]

    company = models.ForeignKey(
        CompanyProfile,
        on_delete=models.CASCADE,
        related_name='jobs'
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    responsibilities = models.TextField(blank=True)
    location = models.CharField(max_length=150, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='on_site')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    stipend_min = models.PositiveIntegerField(null=True, blank=True)
    stipend_max = models.PositiveIntegerField(null=True, blank=True)
    duration_months = models.PositiveIntegerField(null=True, blank=True)
    openings = models.PositiveIntegerField(default=1)
    deadline = models.DateField(null=True, blank=True)
    required_skills = models.ManyToManyField(Skill, blank=True, related_name='jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} @ {self.company.company_name}"