from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrReadOnly(BasePermission):
    message = "Only administrators may modify workspace data."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.method in SAFE_METHODS or request.user.is_staff)
        )
