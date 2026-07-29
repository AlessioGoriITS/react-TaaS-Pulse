from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase

from pulse.models import Employee, Job, Project, ProjectMembership, Sprint, Task


class ModelValidationTests(TestCase):
    def setUp(self):
        self.job = Job.objects.create(
            title="Engineer",
            hourly_wage=Decimal("50.00"),
            weekly_hours=40,
        )
        self.employee = Employee.objects.create(
            first_name="Test",
            last_name="Engineer",
            email="engineer@example.com",
            job=self.job,
        )
        self.project = Project.objects.create(
            name="Project A",
            client_name="Client",
            description="A test project.",
            budget_hours=100,
            deadline=date(2026, 12, 1),
        )
        ProjectMembership.objects.create(
            project=self.project,
            employee=self.employee,
            weekly_allocated_hours=20,
        )

    def test_task_assignee_must_belong_to_project(self):
        outsider = Employee.objects.create(
            first_name="Outside",
            last_name="Person",
            email="outside@example.com",
            job=self.job,
        )
        task = Task(project=self.project, assignee=outsider, title="Invalid")
        with self.assertRaises(ValidationError):
            task.full_clean()

    def test_task_sprint_must_belong_to_project(self):
        other_project = Project.objects.create(
            name="Project B",
            client_name="Client",
            description="Another project.",
            budget_hours=100,
            deadline=date(2026, 12, 1),
        )
        sprint = Sprint.objects.create(
            project=other_project,
            name="Sprint 1",
            goal="Test",
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 14),
        )
        task = Task(project=self.project, sprint=sprint, title="Invalid")
        with self.assertRaises(ValidationError):
            task.full_clean()
