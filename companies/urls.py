from django.urls import path
from .views import (
    CompanyProfileView,
    CompanyPublicDetailView,
    JobListCreateView,
    JobDetailView,
    CompanyJobsView,
)

urlpatterns = [
    path('profile/', CompanyProfileView.as_view()),          # own profile
    path('<int:pk>/', CompanyPublicDetailView.as_view()),    # public profile
    path('<int:pk>/jobs/', CompanyJobsView.as_view()),       # jobs by company
    path('jobs/', JobListCreateView.as_view()),              # browse / create
    path('jobs/<int:pk>/', JobDetailView.as_view()),         # detail / edit / delete
]