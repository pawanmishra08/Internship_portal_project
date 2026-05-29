from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsStudent, IsCompany
from .models import Application
from .serializers import (
    ApplicationSerializer,
    ApplicantSerializer,
    StatusUpdateSerializer,
)


class StudentApplicationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/applications/           → student's own applications
    POST /api/applications/           → apply to a job
    Supports: ?status=pending
    """
    serializer_class = ApplicationSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        qs = Application.objects.filter(
            student=self.request.user.student_profile
        ).select_related('job__company').prefetch_related('job__required_skills')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_serializer_context(self):
        return {'request': self.request}


class StudentApplicationDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/applications/<id>/   → detail of own application
    DELETE /api/applications/<id>/   → withdraw application
    """
    serializer_class = ApplicationSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return Application.objects.filter(student=self.request.user.student_profile)

    def destroy(self, request, *args, **kwargs):
        application = self.get_object()
        if application.status in ['accepted', 'rejected']:
            return Response(
                {'error': 'Cannot withdraw an application that has been decided.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        application.status = 'withdrawn'
        application.save()
        return Response({'message': 'Application withdrawn.'})

    def get_serializer_context(self):
        return {'request': self.request}


class JobApplicantsView(generics.ListAPIView):
    """
    GET /api/applications/job/<job_id>/applicants/
    Company sees all applicants for one of their jobs.
    Supports: ?status=shortlisted
    """
    serializer_class = ApplicantSerializer
    permission_classes = [IsCompany]

    def get_queryset(self):
        job_id = self.kwargs['job_id']
        # Ensure job belongs to this company
        qs = Application.objects.filter(
            job_id=job_id,
            job__company__user=self.request.user
        ).select_related('student__user').prefetch_related('student__skills')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_serializer_context(self):
        return {'request': self.request}


class ApplicationStatusUpdateView(APIView):
    """
    PATCH /api/applications/<id>/status/
    Company updates the status of an application.
    """
    permission_classes = [IsCompany]

    def patch(self, request, pk):
        try:
            application = Application.objects.get(
                pk=pk,
                job__company__user=request.user
            )
        except Application.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = StatusUpdateSerializer(application, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ApplicantSerializer(
                application, context={'request': request}
            ).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)