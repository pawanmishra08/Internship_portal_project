from django.urls import path
from .views import (
    StudentApplicationListCreateView,
    StudentApplicationDetailView,
    JobApplicantsView,
    ApplicationStatusUpdateView,
    ApplicationDocumentDownloadView,
)

urlpatterns = [
    path('', StudentApplicationListCreateView.as_view()),           # list / apply
    path('<int:pk>/', StudentApplicationDetailView.as_view()),       # detail / withdraw
    path('job/<int:job_id>/applicants/', JobApplicantsView.as_view()),  # company view
    path('<int:pk>/status/', ApplicationStatusUpdateView.as_view()),     # status update
    path('<int:pk>/document/', ApplicationDocumentDownloadView.as_view()),
]