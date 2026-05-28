from rest_framework import serializers
from students.serializers import SkillSerializer
from .models import CompanyProfile, Job


class CompanyProfileSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = CompanyProfile
        fields = [
            'id', 'email', 'company_name', 'tagline', 'description',
            'industry', 'size', 'website', 'location',
            'logo', 'logo_url', 'linkedin_url',
            'is_verified', 'verified_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_verified', 'verified_at', 'created_at', 'updated_at']
        extra_kwargs = {'logo': {'write_only': True}}

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url)
        return None


class CompanyProfileListSerializer(serializers.ModelSerializer):
    """Lightweight — used in job cards and admin lists."""
    class Meta:
        model = CompanyProfile
        fields = ['id', 'company_name', 'industry', 'location', 'is_verified', 'logo_url']

    logo_url = serializers.SerializerMethodField()

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url)
        return None


class JobSerializer(serializers.ModelSerializer):
    required_skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=__import__('students.models', fromlist=['Skill']).Skill.objects.all(),
        many=True, write_only=True, source='required_skills', required=False,
    )
    company = CompanyProfileListSerializer(read_only=True)
    application_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'company',
            'title', 'description', 'requirements', 'responsibilities',
            'location', 'type', 'status',
            'stipend_min', 'stipend_max', 'duration_months',
            'openings', 'deadline',
            'required_skills', 'skill_ids',
            'application_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'company', 'created_at', 'updated_at']

    def get_application_count(self, obj):
        return obj.applications.count()

    def create(self, validated_data):
        skills = validated_data.pop('required_skills', [])
        job = Job.objects.create(**validated_data)
        job.required_skills.set(skills)
        return job

    def update(self, instance, validated_data):
        skills = validated_data.pop('required_skills', None)
        instance = super().update(instance, validated_data)
        if skills is not None:
            instance.required_skills.set(skills)
        return instance


class JobListSerializer(serializers.ModelSerializer):
    """Card-level data — used in browse/list views."""
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    company_location = serializers.CharField(source='company.location', read_only=True)
    is_verified = serializers.BooleanField(source='company.is_verified', read_only=True)
    skill_names = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'company_name', 'company_location',
            'is_verified', 'location', 'type', 'status',
            'stipend_min', 'stipend_max', 'duration_months',
            'deadline', 'skill_names', 'created_at',
        ]

    def get_skill_names(self, obj):
        return list(obj.required_skills.values_list('name', flat=True))