from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone

from core.permissions import IsCompany, IsAdmin, IsStudent
from .models import CompanyProfile, Job
from .serializers import (
    CompanyProfileSerializer,
    JobSerializer,
    JobListSerializer,
    PublicJobListSerializer,
)
from .permissions import IsJobOwner, IsVerifiedCompany


class CompanyListView(generics.ListAPIView):
    """GET /api/companies/ → list companies for students/admin."""
    queryset = CompanyProfile.objects.select_related('user')
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['company_name', 'industry', 'location']
    filterset_fields = ['is_verified', 'industry']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'student':
            return queryset.filter(is_verified=True)
        return queryset


# ── Company Profile ───────────────────────────────────────────

class CompanyProfileView(APIView):
    """
    GET   /api/companies/profile/   → own profile
    PUT   /api/companies/profile/   → full update
    PATCH /api/companies/profile/   → partial update
    """
    permission_classes = [IsCompany]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        profile, _ = CompanyProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get(self, request):
        serializer = CompanyProfileSerializer(
            self.get_object(), context={'request': request}
        )
        return Response(serializer.data)

    def put(self, request):
        serializer = CompanyProfileSerializer(
            self.get_object(), data=request.data, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        serializer = CompanyProfileSerializer(
            self.get_object(), data=request.data,
            partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CompanyPublicDetailView(generics.RetrieveAPIView):
    """GET /api/companies/<id>/  → public company profile"""
    queryset = CompanyProfile.objects.select_related('user')
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class CompanyAdminDetailView(APIView):
    """PATCH /api/companies/admin/<id>/  → admin verification/status updates"""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        profile = get_object_or_404(CompanyProfile.objects.select_related('user'), pk=pk)
        serializer = CompanyProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        if serializer.is_valid():
            updated_profile = serializer.save()

            if 'is_verified' in request.data:
                is_verified = request.data.get('is_verified') in (True, 'true', 'True', '1', 1)
                updated_profile.is_verified = is_verified
                if is_verified and updated_profile.verified_at is None:
                    updated_profile.verified_at = timezone.now()
                elif not is_verified:
                    updated_profile.verified_at = None
                updated_profile.save(update_fields=['is_verified', 'verified_at'])

            return Response(CompanyProfileSerializer(updated_profile, context={'request': request}).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Jobs ──────────────────────────────────────────────────────

class JobListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/companies/jobs/   → browse all active jobs (students)
    POST /api/companies/jobs/   → create job (verified companies only)
    Supports: ?search=python&type=remote&location=kathmandu&status=active
    """
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title', 'description', 'required_skills__name', 'company__company_name']
    filterset_fields = ['type', 'status', 'location']

    def get_queryset(self):
        qs = Job.objects.select_related('company').prefetch_related('required_skills')
        # Students only see active jobs from verified companies
        if self.request.user.role == 'student':
            return qs.filter(status='active', company__is_verified=True)
        # Companies see their own jobs
        if self.request.user.role == 'company':
            return qs.filter(company__user=self.request.user)
        # Admin sees all
        return qs

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return JobListSerializer
        return JobSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsVerifiedCompany()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        company = self.request.user.company_profile
        serializer.save(company=company)


class PublicJobListView(generics.ListAPIView):
    """GET /api/companies/jobs/public/ → browse public active jobs pre-auth."""
    serializer_class = PublicJobListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title', 'description', 'required_skills__name', 'company__company_name']
    filterset_fields = ['type', 'location']

    def get_queryset(self):
        return Job.objects.filter(
            status='active',
            company__is_verified=True,
        ).select_related('company').prefetch_related('required_skills')

    def get_serializer_context(self):
        return {'request': self.request}


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/companies/jobs/<id>/   → job detail
    PUT    /api/companies/jobs/<id>/   → update (owner only)
    PATCH  /api/companies/jobs/<id>/   → partial update (owner only)
    DELETE /api/companies/jobs/<id>/   → delete (owner only)
    """
    queryset = Job.objects.select_related('company').prefetch_related('required_skills')
    serializer_class = JobSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsCompany(), IsJobOwner()]

    def get_serializer_context(self):
        return {'request': self.request}


class CompanyJobsView(generics.ListAPIView):
    """GET /api/companies/<id>/jobs/  → all active jobs by a specific company"""
    serializer_class = JobListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(
            company_id=self.kwargs['pk'],
            status='active'
        ).prefetch_related('required_skills')

    def get_serializer_context(self):
        return {'request': self.request}