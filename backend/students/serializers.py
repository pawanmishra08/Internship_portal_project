from rest_framework import serializers
from .models import StudentProfile, Skill

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category']


class StudentProfileSerializer(serializers.ModelSerializer):
    # Read: nested skill objects
    skills = SkillSerializer(many=True, read_only=True)
    # Write: accept list of skill IDs
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        many=True,
        write_only=True,
        source='skills',
        required=False,
    )
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'email', 'full_name',
            'bio', 'phone', 'location',
            'university', 'degree', 'field_of_study',
            'graduation_year', 'gpa',
            'resume', 'resume_url',
            'linkedin_url', 'github_url', 'portfolio_url',
            'skills', 'skill_ids',
            'available_from', 'is_available',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {'resume': {'write_only': True}}

    def get_resume_url(self, obj):
        request = self.context.get('request')
        if obj.resume and request:
            return request.build_absolute_uri(obj.resume.url)
        return None

    def update(self, instance, validated_data):
        # Handle M2M separately
        skills = validated_data.pop('skills', None)
        instance = super().update(instance, validated_data)
        if skills is not None:
            instance.skills.set(skills)
        return instance


class StudentProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (admin use)."""
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    skill_count = serializers.IntegerField(source='skills.count', read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'full_name', 'email',
            'university', 'degree', 'location',
            'is_available', 'skill_count', 'created_at',
        ]