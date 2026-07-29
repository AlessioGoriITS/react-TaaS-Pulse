from django.conf import settings
from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Employee, Project, Sprint, Task, Team
from .permissions import IsAdminOrReadOnly
from .serializers import (
    CurrentUserSerializer,
    CurrentUserResponseSerializer,
    EmployeeSerializer,
    HealthResponseSerializer,
    LoginRequestSerializer,
    LoginResponseSerializer,
    LogoutResponseSerializer,
    ProjectSerializer,
    SprintSerializer,
    TaskSerializer,
    TeamSerializer,
    WorkspaceResponseSerializer,
)


def accessible_project_ids(user):
    if user.is_staff:
        return Project.objects.values_list("id", flat=True)
    profile = getattr(user, "profile", None)
    if not profile or not profile.employee_id:
        return Project.objects.none().values_list("id", flat=True)
    return profile.employee.projects.values_list("id", flat=True)


class ScopedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]

    def mutation_response(self, item, http_status=status.HTTP_200_OK):
        return Response(
            {
                "ok": True,
                "item": {"id": item.id},
                "workspace": build_workspace(self.request.user),
            },
            status=http_status,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        return self.mutation_response(item, status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object(), data=request.data)
        serializer.is_valid(raise_exception=True)
        return self.mutation_response(serializer.save())

    def partial_update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(),
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        return self.mutation_response(serializer.save())

    def destroy(self, request, *args, **kwargs):
        item = self.get_object()
        item_id = item.id
        item.delete()
        return Response(
            {
                "ok": True,
                "item": {"id": item_id},
                "workspace": build_workspace(request.user),
            }
        )


class ProjectViewSet(ScopedModelViewSet):
    serializer_class = ProjectSerializer
    filterset_fields = ["status", "risk_level", "deadline"]
    search_fields = ["name", "client_name", "description"]
    ordering_fields = ["name", "deadline", "budget_hours", "used_hours"]

    def get_queryset(self):
        queryset = Project.objects.all()
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(id__in=accessible_project_ids(self.request.user))


class SprintViewSet(ScopedModelViewSet):
    serializer_class = SprintSerializer
    filterset_fields = ["project", "status", "start_date", "end_date"]
    search_fields = ["name", "goal"]
    ordering_fields = ["name", "start_date", "end_date"]

    def get_queryset(self):
        queryset = Sprint.objects.select_related("project")
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(project_id__in=accessible_project_ids(self.request.user))


class EmployeeViewSet(ScopedModelViewSet):
    serializer_class = EmployeeSerializer
    filterset_fields = ["job", "is_active"]
    search_fields = ["first_name", "last_name", "email", "job__title"]
    ordering_fields = ["first_name", "last_name", "email"]

    def get_queryset(self):
        queryset = Employee.objects.select_related("job").prefetch_related("projects")
        if self.request.user.is_staff:
            return queryset
        profile = getattr(self.request.user, "profile", None)
        if not profile or not profile.employee_id:
            return queryset.none()
        team_ids = profile.employee.teams.values_list("id", flat=True)
        return queryset.filter(
            Q(id=profile.employee_id) | Q(teams__id__in=team_ids)
        ).distinct()


class TeamViewSet(ScopedModelViewSet):
    serializer_class = TeamSerializer
    filterset_fields = ["lead"]
    search_fields = ["name", "focus_area", "notes"]
    ordering_fields = ["name", "focus_area"]

    def get_queryset(self):
        queryset = Team.objects.select_related("lead").prefetch_related("members", "projects")
        if self.request.user.is_staff:
            return queryset
        profile = getattr(self.request.user, "profile", None)
        if not profile or not profile.employee_id:
            return queryset.none()
        return queryset.filter(members=profile.employee)


class TaskViewSet(ScopedModelViewSet):
    serializer_class = TaskSerializer
    filterset_fields = ["project", "sprint", "assignee", "status", "priority"]
    search_fields = ["title", "description"]
    ordering_fields = ["title", "priority", "status", "estimate_hours", "spent_hours"]

    def get_queryset(self):
        queryset = Task.objects.select_related("project", "sprint", "assignee")
        if self.request.user.is_staff:
            return queryset
        profile = getattr(self.request.user, "profile", None)
        if not profile or not profile.employee_id:
            return queryset.none()
        return queryset.filter(
            project_id__in=accessible_project_ids(self.request.user)
        ).filter(Q(assignee=profile.employee) | Q(assignee__isnull=True))


def build_workspace(user):
    request_like = type("RequestLike", (), {"user": user})()
    viewsets_and_serializers = [
        (ProjectViewSet, ProjectSerializer, "projects"),
        (EmployeeViewSet, EmployeeSerializer, "teamMembers"),
        (TeamViewSet, TeamSerializer, "teams"),
        (SprintViewSet, SprintSerializer, "sprints"),
        (TaskViewSet, TaskSerializer, "tasks"),
    ]
    data = {}
    for view_class, serializer_class, key in viewsets_and_serializers:
        view = view_class()
        view.request = request_like
        queryset = view.get_queryset()
        data[key] = serializer_class(queryset, many=True).data
    return data


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        request=LoginRequestSerializer,
        responses={200: LoginResponseSerializer},
    )
    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        password = str(request.data.get("password", ""))
        user = authenticate(request, username=email, password=password)
        if not user:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        payload = {
            "token": token.key,
            "tokenType": "Token",
            "user": CurrentUserSerializer(user).data,
        }
        response = Response(payload)
        response.set_cookie(
            settings.TOKEN_COOKIE_NAME,
            token.key,
            max_age=settings.TOKEN_COOKIE_MAX_AGE,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
        )
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: CurrentUserResponseSerializer})
    def get(self, request):
        return Response({"user": CurrentUserSerializer(request.user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={200: LogoutResponseSerializer})
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        response = Response({"ok": True})
        response.delete_cookie(settings.TOKEN_COOKIE_NAME)
        return response


@extend_schema(responses={200: HealthResponseSerializer})
@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "service": "TaaS Pulse API"})


@extend_schema(responses={200: WorkspaceResponseSerializer})
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def workspace(request):
    return Response({"workspace": build_workspace(request.user)})
