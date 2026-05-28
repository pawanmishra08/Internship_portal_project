from django.db import models
from students.models import StudentProfile
from companies.models import Job


class Application(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewing', 'Reviewing'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
        ('accepted', 'Accepted'),
        ('withdrawn', 'Withdrawn'),
    ]

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    cover_letter = models.TextField(blank=True)
    # Snapshot the resume at time of application
    resume_snapshot = models.FileField(upload_to='application_resumes/', null=True, blank=True)
    company_notes = models.TextField(blank=True)  # internal, not shown to student
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # One student can only apply once per job
        unique_together = [('student', 'job')]
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.student.user.full_name} → {self.job.title}"