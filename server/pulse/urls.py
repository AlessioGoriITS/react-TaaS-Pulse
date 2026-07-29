from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EmployeeViewSet,
    LoginView,
    LogoutView,
    MeView,
    ProjectViewSet,
    SprintViewSet,
    TaskViewSet,
    TeamViewSet,
    health,
    workspace,
)


router = DefaultRouter(trailing_slash=False)
router.register("projects", ProjectViewSet, basename="project")
router.register("sprints", SprintViewSet, basename="sprint")
router.register("employees", EmployeeViewSet, basename="employee")
router.register("teams", TeamViewSet, basename="team")
router.register("tasks", TaskViewSet, basename="task")

urlpatterns = [
    path("health/", health, name="health"),
    path("workspace", workspace, name="workspace"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("token/", LoginView.as_view(), name="token"),
    path("auth/me", MeView.as_view(), name="me"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("", include(router.urls)),
]
