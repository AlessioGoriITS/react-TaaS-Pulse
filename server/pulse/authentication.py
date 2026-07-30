from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class CookieTokenAuthentication(TokenAuthentication):
    """Accept DRF tokens from the standard header or an HttpOnly cookie."""

    def authenticate(self, request):
        header_result = super().authenticate(request)
        if header_result is not None:
            return self._reject_expired(*header_result)

        token = request.COOKIES.get(settings.TOKEN_COOKIE_NAME)
        if not token:
            return None
        return self._reject_expired(*self.authenticate_credentials(token))

    @staticmethod
    def _reject_expired(user, token):
        age = (timezone.now() - token.created).total_seconds()
        if age >= settings.TOKEN_MAX_AGE_SECONDS:
            token.delete()
            raise AuthenticationFailed("Authentication token has expired.")
        return user, token
