from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsStudent, IsAdmin
from .models import StudentProfile, Skill
from .serializers import (
    StudentProfileSerializer,
    StudentProfileListSerializer,
    SkillSerializer,
)


class StudentProfileView(APIView):
    """
    GET  /api/students/profile/        → get own profile
    PUT  /api/students/profile/        → full update
    PATCH /api/students/profile/       → partial update
    """
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get(self, request):
        serializer = StudentProfileSerializer(
            self.get_object(), context={'request': request}
        )
        return Response(serializer.data)

    def put(self, request):
        serializer = StudentProfileSerializer(
            self.get_object(), data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        serializer = StudentProfileSerializer(
            self.get_object(), data=request.data,
            partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentProfileDetailView(generics.RetrieveAPIView):
    """
    GET /api/students/<id>/   → public profile view (for companies)
    """
    queryset = StudentProfile.objects.select_related('user').prefetch_related('skills')
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class SkillListView(generics.ListAPIView):
    """
    GET /api/students/skills/   → list all available skills
    Supports ?search=python and ?category=backend
    """
    queryset = Skill.objects.all().order_by('category', 'name')
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['category']


class AdminStudentListView(generics.ListAPIView):
    """
    GET /api/students/   → admin-only list of all students
    Supports ?search=name&is_available=true
    """
    queryset = StudentProfile.objects.select_related('user').prefetch_related('skills')
    serializer_class = StudentProfileListSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['user__full_name', 'user__email', 'university']
    filterset_fields = ['is_available', 'degree']


class AdminSkillListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/students/skills/admin/    → list all skills (admin only)
    POST /api/students/skills/admin/    → create a new skill (admin only)
    """
    queryset = Skill.objects.all().order_by('category', 'name')
    serializer_class = SkillSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['category']


class AdminSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/students/skills/admin/<pk>/   → retrieve
    PATCH  /api/students/skills/admin/<pk>/   → partial update
    PUT    /api/students/skills/admin/<pk>/   → full update
    DELETE /api/students/skills/admin/<pk>/   → delete
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsAdmin]