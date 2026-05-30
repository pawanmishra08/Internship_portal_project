from rest_framework import serializers
from .models import Application
from students.serializers import StudentProfileSerializer
from companies.serializers import JobListSerializer
from recommendations.algorithm import score_student_for_job


class ApplicationSerializer(serializers.ModelSerializer):
    """Full detail — used by students to see their own applications."""
    job = JobListSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=__import__('companies.models', fromlist=['Job']).Job.objects.filter(status='active'),
        write_only=True,
        source='job',
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id', 'job', 'job_id',
            'status', 'status_display',
            'cover_letter',
            'applied_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'applied_at', 'updated_at']

    def validate(self, attrs):
        student = self.context['request'].user.student_profile
        job = attrs['job']
        if Application.objects.filter(student=student, job=job).exists():
            raise serializers.ValidationError("You have already applied for this job.")
        if job.status != 'active':
            raise serializers.ValidationError("This job is no longer accepting applications.")
        return attrs

    def create(self, validated_data):
        student = self.context['request'].user.student_profile
        # Snapshot resume at time of apply
        resume = student.resume or None
        return Application.objects.create(
            student=student,
            resume_snapshot=resume,
            **validated_data
        )


class ApplicantSerializer(serializers.ModelSerializer):
    """Used by companies to see who applied to their jobs."""
    student = StudentProfileSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    resume_url = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'student',
            'status', 'status_display',
            'cover_letter', 'resume_url',
            'match_score', 'download_url',
            'company_notes',
            'applied_at', 'updated_at',
        ]
        read_only_fields = ['id', 'student', 'applied_at', 'updated_at']

    def get_resume_url(self, obj):
        request = self.context.get('request')
        resume = obj.resume_snapshot or (obj.student.resume if obj.student.resume else None)
        if resume and request:
            return request.build_absolute_uri(resume.url)
        return None

    def get_match_score(self, obj):
        return score_student_for_job(obj.student, obj.job)['score']

    def get_download_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/applications/{obj.pk}/document/')
        return f'/api/applications/{obj.pk}/document/'


class StatusUpdateSerializer(serializers.ModelSerializer):
    """Used by companies to update application status."""
    ALLOWED = ['reviewing', 'shortlisted', 'rejected', 'accepted']

    class Meta:
        model = Application
        fields = ['status', 'company_notes']

    def validate_status(self, value):
        if value not in self.ALLOWED:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join(self.ALLOWED)}"
            )
        return value