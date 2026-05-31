from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsStudent
from .algorithm import get_recommendations
from .serializers import RecommendationSerializer


class RecommendationView(APIView):
    """
    GET /api/recommendations/
    Returns ranked job recommendations for the authenticated student.
    Query params:
      ?limit=10    → number of results (default 20, max 50)
      ?top=3       → return only top N (for dashboard widget)
    """
    permission_classes = [IsStudent]

    @staticmethod
    def _parse_int(value, default, min_value=1, max_value=50):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return default
        return max(min(parsed, max_value), min_value)

    def get(self, request):
        try:
            student = request.user.student_profile
        except Exception:
            return Response(
                {'error': 'Student profile not found. Please complete your profile first.'},
                status=404
            )

        if not student.skills.exists():
            return Response(
                {'error': 'Add skills to your profile to get recommendations.'},
                status=400
            )

        limit = self._parse_int(request.query_params.get('limit'), default=20, max_value=50)
        top = request.query_params.get('top')

        results = get_recommendations(student, limit=limit)

        if top:
            top_value = self._parse_int(top, default=limit, max_value=limit)
            results = results[:top_value]

        serializer = RecommendationSerializer(results, many=True)
        return Response({
            'count': len(results),
            'results': serializer.data,
        })