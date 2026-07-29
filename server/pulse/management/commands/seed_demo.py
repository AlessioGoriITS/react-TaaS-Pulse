from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from pulse.models import (
    Employee,
    Job,
    Project,
    ProjectMembership,
    Sprint,
    Task,
    Team,
    TeamMembership,
    UserProfile,
)


class Command(BaseCommand):
    help = "Create or refresh non-sensitive demo data and accounts."

    @transaction.atomic
    def handle(self, *args, **options):
        frontend, _ = Job.objects.update_or_create(
            title="Frontend Developer",
            defaults={
                "hourly_wage": Decimal("48.00"),
                "weekly_hours": 40,
                "department": "Engineering",
            },
        )
        backend, _ = Job.objects.update_or_create(
            title="Backend Developer",
            defaults={
                "hourly_wage": Decimal("52.00"),
                "weekly_hours": 40,
                "department": "Engineering",
            },
        )
        qa, _ = Job.objects.update_or_create(
            title="QA Engineer",
            defaults={
                "hourly_wage": Decimal("42.00"),
                "weekly_hours": 36,
                "department": "Quality",
            },
        )

        ari, _ = Employee.objects.update_or_create(
            email="ari.chen@example.com",
            defaults={
                "first_name": "Ari",
                "last_name": "Chen",
                "phone_number": "+39 02 555 0101",
                "job": frontend,
                "bio": "Frontend specialist focused on accessible product interfaces.",
            },
        )
        luca, _ = Employee.objects.update_or_create(
            email="luca.rossi@example.com",
            defaults={
                "first_name": "Luca",
                "last_name": "Rossi",
                "phone_number": "+39 02 555 0102",
                "job": backend,
                "bio": "Backend engineer responsible for APIs and data integrity.",
            },
        )
        sara, _ = Employee.objects.update_or_create(
            email="sara.bianchi@example.com",
            defaults={
                "first_name": "Sara",
                "last_name": "Bianchi",
                "phone_number": "+39 02 555 0103",
                "job": qa,
                "bio": "QA engineer focused on risk-based testing and release confidence.",
            },
        )

        portal, _ = Project.objects.update_or_create(
            name="Customer Portal",
            client_name="Northstar Retail",
            defaults={
                "description": "Self-service customer portal for orders, invoices, and support.",
                "status": Project.Status.ACTIVE,
                "budget_hours": 720,
                "used_hours": 408,
                "start_date": date(2026, 5, 4),
                "deadline": date(2026, 9, 18),
                "risk_level": Project.Risk.MEDIUM,
                "risk_notes": "Payment provider integration needs an early technical spike.",
            },
        )
        ops, _ = Project.objects.update_or_create(
            name="Operations Dashboard",
            client_name="TaaS Internal",
            defaults={
                "description": "Internal dashboard for delivery capacity and portfolio risk.",
                "status": Project.Status.ACTIVE,
                "budget_hours": 420,
                "used_hours": 190,
                "start_date": date(2026, 6, 1),
                "deadline": date(2026, 10, 30),
                "risk_level": Project.Risk.LOW,
                "risk_notes": "No material risk recorded.",
            },
        )

        for employee, project, hours in [
            (ari, portal, 32),
            (luca, portal, 32),
            (sara, portal, 24),
            (ari, ops, 8),
            (luca, ops, 8),
        ]:
            ProjectMembership.objects.update_or_create(
                employee=employee,
                project=project,
                defaults={
                    "assigned_role": employee.job.title,
                    "weekly_allocated_hours": hours,
                },
            )

        team, _ = Team.objects.update_or_create(
            name="Pulse Delivery",
            defaults={
                "focus_area": "Full-stack product delivery",
                "lead": luca,
                "notes": "Cross-functional squad serving the active portfolio.",
            },
        )
        team.projects.set([portal, ops])
        for employee, role in [(ari, "Frontend"), (luca, "Lead"), (sara, "Quality")]:
            TeamMembership.objects.update_or_create(
                team=team,
                employee=employee,
                defaults={"team_role": role},
            )

        sprint, _ = Sprint.objects.update_or_create(
            project=portal,
            name="Sprint 8",
            defaults={
                "goal": "Complete secure invoice download and payment-provider spike.",
                "start_date": date(2026, 7, 20),
                "end_date": date(2026, 7, 31),
                "status": Sprint.Status.ACTIVE,
            },
        )
        for title, assignee, status_value, priority, estimate, spent in [
            ("Invoice list UI", ari, Task.Status.DONE, Task.Priority.HIGH, 12, 11),
            ("Invoice download API", luca, Task.Status.IN_PROGRESS, Task.Priority.HIGH, 16, 10),
            ("Payment provider test plan", sara, Task.Status.REVIEW, Task.Priority.MEDIUM, 8, 6),
        ]:
            Task.objects.update_or_create(
                project=portal,
                sprint=sprint,
                title=title,
                defaults={
                    "assignee": assignee,
                    "status": status_value,
                    "priority": priority,
                    "estimate_hours": estimate,
                    "spent_hours": spent,
                },
            )

        admin, _ = User.objects.update_or_create(
            username="admin@taaspulse.local",
            defaults={
                "email": "admin@taaspulse.local",
                "first_name": "Demo",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        admin.set_password("AdminPass!2026")
        admin.save()

        demo_user, _ = User.objects.update_or_create(
            username="ari.chen@example.com",
            defaults={
                "email": "ari.chen@example.com",
                "first_name": "Ari",
                "last_name": "Chen",
                "is_staff": False,
                "is_superuser": False,
                "is_active": True,
            },
        )
        demo_user.set_password("EmployeePass!2026")
        demo_user.save()
        UserProfile.objects.update_or_create(user=demo_user, defaults={"employee": ari})

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        self.stdout.write("Admin: admin@taaspulse.local / AdminPass!2026")
        self.stdout.write("User: ari.chen@example.com / EmployeePass!2026")
