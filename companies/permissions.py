from rest_framework.permissions import BasePermission


class IsJobOwner(BasePermission):
    """Only the company that owns the job can edit or delete it."""
    def has_object_permission(self, request, view, obj):
        return obj.company.user == request.user


class IsVerifiedCompany(BasePermission):
    """Only admin-verified companies can post jobs."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role != 'company':
            return False
        try:
            return request.user.company_profile.is_verified
        except Exception:
            return False