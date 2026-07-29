from django.conf import settings
from rest_framework.authentication import TokenAuthentication


class CookieTokenAuthentication(TokenAuthentication):
    """Accept DRF tokens from the standard header or an HttpOnly cookie."""

    def authenticate(self, request):
        header_result = super().authenticate(request)
        if header_result is not None:
            return header_result

        token = request.COOKIES.get(settings.TOKEN_COOKIE_NAME)
        if not token:
            return None
        return self.authenticate_credentials(token)
