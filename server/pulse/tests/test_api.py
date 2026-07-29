from datetime import date

from django.contrib.auth.models import User
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from pulse.models import Project, Sprint, Task


class ApiTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", verbosity=0)
        cls.admin = User.objects.get(username="admin@taaspulse.local")
        cls.user = User.objects.get(username="ari.chen@example.com")

    def login(self, email="admin@taaspulse.local", password="AdminPass!2026"):
        return self.client.post(
            reverse("login"),
            {"email": email, "password": password},
            format="json",
        )

    def authenticate(self, user=None):
        self.client.force_authenticate(user=user or self.admin)

    def test_health_is_public(self):
        response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")

    def test_login_returns_token_and_http_only_cookie(self):
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["tokenType"], "Token")
        self.assertTrue(response.cookies["taas_pulse_token"]["httponly"])
        self.assertEqual(response.data["user"]["role"], "admin")

    def test_invalid_login_is_json_unauthorized(self):
        response = self.login(password="wrong-password")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"], "Invalid email or password.")

    def test_protected_endpoint_rejects_anonymous_user(self):
        response = self.client.get(reverse("workspace"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", response.data)

    def test_token_header_authenticates(self):
        token = self.login().data["token"]
        self.client.cookies.clear()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["email"], self.admin.email)

    def test_regular_user_sees_only_assigned_projects(self):
        self.authenticate(self.user)
        response = self.client.get(reverse("workspace"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project_ids = {project["id"] for project in response.data["workspace"]["projects"]}
        employee = self.user.profile.employee
        self.assertEqual(project_ids, set(employee.projects.values_list("id", flat=True)))

    def test_regular_user_cannot_create_project(self):
        self.authenticate(self.user)
        response = self.client.post(
            reverse("project-list"),
            {
                "name": "Forbidden",
                "clientName": "Example",
                "longDescription": "Regular users cannot write.",
                "budgetHours": 100,
                "usedHours": 0,
                "deadline": "2026-12-01",
                "status": "On Track",
                "riskNotes": "",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_project_with_frontend_contract(self):
        self.authenticate()
        response = self.client.post(
            reverse("project-list"),
            {
                "name": "New Delivery",
                "clientName": "Example Client",
                "longDescription": "A complete project description.",
                "budgetHours": 120,
                "usedHours": 10,
                "deadline": "2026-12-01",
                "status": "At Risk",
                "riskNotes": "Pending discovery.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project = Project.objects.get(pk=response.data["item"]["id"])
        self.assertEqual(project.risk_level, Project.Risk.MEDIUM)
        self.assertIn("workspace", response.data)

    def test_project_rejects_used_hours_above_budget(self):
        self.authenticate()
        response = self.client.post(
            reverse("project-list"),
            {
                "name": "Invalid Budget",
                "clientName": "Example Client",
                "longDescription": "Invalid hours should not be stored.",
                "budgetHours": 10,
                "usedHours": 11,
                "deadline": "2026-12-01",
                "status": "On Track",
                "riskNotes": "",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("usedHours", response.data["details"])

    def test_sprint_rejects_reversed_dates(self):
        self.authenticate()
        project = Project.objects.first()
        response = self.client.post(
            reverse("sprint-list"),
            {
                "projectId": project.id,
                "name": "Invalid Sprint",
                "longDescription": "Invalid date range.",
                "startDate": "2026-09-10",
                "endDate": "2026-09-01",
                "status": "Planned",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("endDate", response.data["details"])

    def test_task_rejects_sprint_from_another_project(self):
        self.authenticate()
        first = Project.objects.first()
        second = Project.objects.exclude(pk=first.pk).first()
        sprint = Sprint.objects.create(
            project=second,
            name="Other Sprint",
            goal="Belongs elsewhere",
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 14),
        )
        response = self.client.post(
            reverse("task-list"),
            {
                "projectId": first.id,
                "sprintId": sprint.id,
                "assigneeId": None,
                "title": "Invalid task",
                "description": "",
                "status": "Todo",
                "priority": "Medium",
                "estimateHours": 4,
                "spentHours": 0,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sprintId", response.data["details"])

    def test_missing_resource_returns_json_404(self):
        self.authenticate()
        response = self.client.get(reverse("project-detail", args=[999999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_filter_search_and_ordering_are_enabled(self):
        self.authenticate()
        project = Project.objects.first()
        response = self.client.get(
            reverse("task-list"),
            {"project": project.id, "search": "invoice", "ordering": "-spent_hours"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all("invoice" in item["title"].lower() for item in response.data))

    def test_logout_revokes_token(self):
        login_response = self.login()
        token = login_response.data["token"]
        response = self.client.post(reverse("logout"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.cookies.clear()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
