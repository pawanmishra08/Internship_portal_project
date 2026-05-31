from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.utils.text import slugify
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

from core.permissions import IsStudent, IsCompany
from .models import Application
from .serializers import (
    ApplicationSerializer,
    ApplicantSerializer,
    StatusUpdateSerializer,
)
from recommendations.algorithm import score_student_for_job


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
        ).select_related('student__user', 'job').prefetch_related('student__skills', 'job__required_skills')

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


class ApplicationDocumentDownloadView(APIView):
    """GET /api/applications/<id>/document/ → resume if available, otherwise a PDF profile export."""
    permission_classes = [IsCompany]

    def _build_profile_pdf(self, application):
        student = application.student
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        left = 18 * mm
        top = height - 18 * mm

        def write_line(text, y, size=10, bold=False):
            pdf.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
            pdf.drawString(left, y, text)

        def wrap_text(text, max_chars=95):
            words = str(text or '').split()
            lines = []
            current = ''
            for word in words:
                candidate = f'{current} {word}'.strip()
                if len(candidate) > max_chars and current:
                    lines.append(current)
                    current = word
                else:
                    current = candidate
            if current:
                lines.append(current)
            return lines or ['']

        y = top
        pdf.setTitle(f'{student.user.full_name} - Profile')
        write_line('Student Profile', y, size=18, bold=True)
        y -= 12 * mm
        write_line(student.user.full_name, y, size=14, bold=True)
        y -= 7 * mm
        write_line(student.user.email, y, size=10)

        sections = [
            ('Contact & Overview', [
                f'Phone: {student.phone or "Not set"}',
                f'Location: {student.location or "Not set"}',
                f'University: {student.university or "Not set"}',
                f'Degree: {student.degree or "Not set"}',
                f'Field of study: {student.field_of_study or "Not set"}',
                f'Target role: {student.target_role or "Not set"}',
                f'Preferred work mode: {student.preferred_work_mode or "Not set"}',
                f'Graduation year: {student.graduation_year or "Not set"}',
                f'GPA: {student.gpa or "Not set"}',
                f'Available from: {student.available_from or "Not set"}',
                f'Currently available: {"Yes" if student.is_available else "No"}',
            ]),
            ('Bio', [student.bio or 'No bio provided.']),
            ('Skills', [', '.join(student.skills.values_list('name', flat=True)) or 'No skills listed.']),
            ('Education Preferences', [
                f"{item.get('level', 'education').title()}: {item.get('institution', '')} — {item.get('field_of_study', '')} ({item.get('graduation_year', 'N/A')})"
                for item in (student.degree_preferences or [])
            ] or ['None added.']),
            ('Projects', [
                f"{item.get('title', 'Project')} ({item.get('year', 'N/A')}) - {item.get('description', '')}"
                for item in (student.projects or [])
            ] or ['None added.']),
            ('Links', [
                f'LinkedIn: {student.linkedin_url or "Not set"}',
                f'GitHub: {student.github_url or "Not set"}',
                f'Portfolio: {student.portfolio_url or "Not set"}',
            ]),
        ]

        for title, lines in sections:
            y -= 9 * mm
            if y < 35 * mm:
                pdf.showPage()
                y = top
            write_line(title, y, size=12, bold=True)
            y -= 5 * mm
            for line in lines:
                wrapped_lines = wrap_text(line)
                for wrapped_line in wrapped_lines:
                    if y < 25 * mm:
                        pdf.showPage()
                        y = top
                    write_line(f'- {wrapped_line}', y, size=10)
                    y -= 5 * mm
            y -= 2 * mm

        pdf.save()
        buffer.seek(0)
        filename = f"{slugify(student.user.full_name) or 'student-profile'}.pdf"
        return buffer, filename

    def get(self, request, pk):
        try:
            application = Application.objects.select_related('student__user', 'job__company').prefetch_related('student__skills').get(
                pk=pk,
                job__company__user=request.user,
            )
        except Application.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        resume = application.resume_snapshot or application.student.resume
        if resume:
            response = FileResponse(resume.open('rb'), as_attachment=True, filename=resume.name.split('/')[-1])
            return response

        buffer, filename = self._build_profile_pdf(application)
        return FileResponse(buffer, as_attachment=True, filename=filename, content_type='application/pdf')