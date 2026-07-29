from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    if isinstance(response.data, dict) and "detail" in response.data:
        response.data = {
            "error": str(response.data["detail"]),
            "details": response.data,
        }
    else:
        response.data = {
            "error": "The request could not be completed.",
            "details": response.data,
        }
    return response
