from rest_framework import serializers
from companies.serializers import JobListSerializer


class BreakdownSerializer(serializers.Serializer):
    skill_match = serializers.FloatField()
    gpa = serializers.FloatField()
    availability = serializers.FloatField()
    location = serializers.FloatField()
    profile_completeness = serializers.FloatField()


class RecommendationSerializer(serializers.Serializer):
    job = JobListSerializer()
    score = serializers.FloatField()
    matched_skills = serializers.ListField(child=serializers.CharField())
    missing_skills = serializers.ListField(child=serializers.CharField())
    breakdown = BreakdownSerializer()