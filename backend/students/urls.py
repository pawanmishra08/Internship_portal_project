from django.urls import path
from .views import (
    StudentProfileView,
    StudentProfileDetailView,
    SkillListView,
    AdminStudentListView,
    AdminSkillListCreateView,
    AdminSkillDetailView,
)

urlpatterns = [
    path('', AdminStudentListView.as_view()),           # GET  /api/students/
    path('profile/', StudentProfileView.as_view()),     # GET/PUT/PATCH /api/students/profile/
    path('skills/', SkillListView.as_view()),           # GET  /api/students/skills/
    path('skills/admin/', AdminSkillListCreateView.as_view()),  # GET/POST admin CRUD
    path('skills/admin/<int:pk>/', AdminSkillDetailView.as_view()),  # GET/PATCH/PUT/DELETE admin
    path('<int:pk>/', StudentProfileDetailView.as_view()),  # GET  /api/students/<id>/
]