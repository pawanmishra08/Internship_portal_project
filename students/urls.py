from django.urls import path
from .views import (
    StudentProfileView,
    StudentProfileDetailView,
    SkillListView,
    AdminStudentListView,
)

urlpatterns = [
    path('', AdminStudentListView.as_view()),           # GET  /api/students/
    path('profile/', StudentProfileView.as_view()),     # GET/PUT/PATCH /api/students/profile/
    path('skills/', SkillListView.as_view()),           # GET  /api/students/skills/
    path('<int:pk>/', StudentProfileDetailView.as_view()),  # GET  /api/students/<id>/
]