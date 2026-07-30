from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from pulse.models import (
    Employee,
    Importance,
    Job,
    Project,
    ProjectMembership,
    Sprint,
    Task,
    Team,
    TeamMembership,
    UserProfile,
)


JOBS = [
    ("Frontend Developer", "48.00", 40, "Engineering"),
    ("Backend Developer", "52.00", 40, "Engineering"),
    ("Full-stack Developer", "55.00", 40, "Engineering"),
    ("Mobile Developer", "50.00", 40, "Engineering"),
    ("QA Engineer", "42.00", 36, "Quality"),
    ("UX/UI Designer", "46.00", 36, "Design"),
    ("Product Manager", "58.00", 40, "Product"),
    ("DevOps Engineer", "56.00", 40, "Platform"),
]

EMPLOYEES = [
    (
        "ari.chen@example.com",
        "Ari",
        "Chen",
        "+39 02 555 0101",
        "Frontend Developer",
        "Frontend specialist focused on accessible product interfaces.",
    ),
    (
        "luca.rossi@example.com",
        "Luca",
        "Rossi",
        "+39 02 555 0102",
        "Backend Developer",
        "Backend engineer responsible for APIs and data integrity.",
    ),
    (
        "sara.bianchi@example.com",
        "Sara",
        "Bianchi",
        "+39 02 555 0103",
        "QA Engineer",
        "QA engineer focused on risk-based testing and release confidence.",
    ),
    (
        "giulia.conti@example.com",
        "Giulia",
        "Conti",
        "+39 02 555 0104",
        "UX/UI Designer",
        "Product designer who turns complex workflows into clear experiences.",
    ),
    (
        "marco.esposito@example.com",
        "Marco",
        "Esposito",
        "+39 02 555 0105",
        "Full-stack Developer",
        "Full-stack engineer experienced in dashboards and workflow automation.",
    ),
    (
        "elena.romano@example.com",
        "Elena",
        "Romano",
        "+39 02 555 0106",
        "Product Manager",
        "Product manager focused on measurable outcomes and stakeholder alignment.",
    ),
    (
        "davide.greco@example.com",
        "Davide",
        "Greco",
        "+39 02 555 0107",
        "DevOps Engineer",
        "Platform engineer specialising in delivery pipelines and observability.",
    ),
    (
        "sofia.martin@example.com",
        "Sofia",
        "Martin",
        "+39 02 555 0108",
        "Mobile Developer",
        "Mobile engineer building reliable cross-platform customer applications.",
    ),
    (
        "matteo.ferrari@example.com",
        "Matteo",
        "Ferrari",
        "+39 02 555 0109",
        "Backend Developer",
        "Backend engineer focused on integrations and high-volume services.",
    ),
    (
        "chiara.gallo@example.com",
        "Chiara",
        "Gallo",
        "+39 02 555 0110",
        "Frontend Developer",
        "Frontend developer with a strong eye for performance and design systems.",
    ),
    (
        "andrea.villa@example.com",
        "Andrea",
        "Villa",
        "+39 02 555 0111",
        "QA Engineer",
        "Automation specialist covering API, browser, and regression testing.",
    ),
    (
        "valentina.rizzo@example.com",
        "Valentina",
        "Rizzo",
        "+39 02 555 0112",
        "UX/UI Designer",
        "UX researcher and designer focused on inclusive digital services.",
    ),
    (
        "tommaso.mancini@example.com",
        "Tommaso",
        "Mancini",
        "+39 02 555 0113",
        "Full-stack Developer",
        "Full-stack developer experienced in rapid product validation.",
    ),
    (
        "federica.lombardi@example.com",
        "Federica",
        "Lombardi",
        "+39 02 555 0114",
        "Product Manager",
        "Delivery-focused product manager for multi-team programmes.",
    ),
    (
        "simone.moretti@example.com",
        "Simone",
        "Moretti",
        "+39 02 555 0115",
        "DevOps Engineer",
        "Cloud and security engineer supporting scalable product platforms.",
    ),
    (
        "marta.costa@example.com",
        "Marta",
        "Costa",
        "+39 02 555 0116",
        "Mobile Developer",
        "Mobile developer focused on offline-first field applications.",
    ),
]

PROJECTS = [
    {
        "name": "Customer Portal",
        "client": "Northstar Retail",
        "description": "Self-service customer portal for orders, invoices, and support.",
        "status": Project.Status.ACTIVE,
        "budget": 720,
        "used": 408,
        "start": date(2026, 5, 4),
        "deadline": date(2026, 9, 18),
        "risk": Project.Risk.MEDIUM,
        "importance": Importance.HIGH,
        "notes": "Payment provider integration needs an early technical spike.",
        "members": [
            "ari.chen@example.com",
            "luca.rossi@example.com",
            "sara.bianchi@example.com",
            "giulia.conti@example.com",
            "elena.romano@example.com",
        ],
    },
    {
        "name": "Operations Dashboard",
        "client": "TaaS Internal",
        "description": "Internal dashboard for delivery capacity and portfolio risk.",
        "status": Project.Status.ACTIVE,
        "budget": 420,
        "used": 190,
        "start": date(2026, 6, 1),
        "deadline": date(2026, 10, 30),
        "risk": Project.Risk.LOW,
        "importance": Importance.MEDIUM,
        "notes": "No material risk recorded.",
        "members": [
            "marco.esposito@example.com",
            "chiara.gallo@example.com",
            "andrea.villa@example.com",
            "federica.lombardi@example.com",
        ],
    },
    {
        "name": "Fleet Tracking Mobile",
        "client": "Atlas Logistics",
        "description": "Mobile tracking, proof of delivery, and route exception management.",
        "status": Project.Status.ACTIVE,
        "budget": 960,
        "used": 612,
        "start": date(2026, 3, 16),
        "deadline": date(2026, 8, 28),
        "risk": Project.Risk.HIGH,
        "importance": Importance.CRITICAL,
        "notes": "Offline synchronisation is behind plan on older Android devices.",
        "members": [
            "sofia.martin@example.com",
            "marta.costa@example.com",
            "matteo.ferrari@example.com",
            "andrea.villa@example.com",
            "simone.moretti@example.com",
        ],
    },
    {
        "name": "Healthcare Booking",
        "client": "Salus Clinics",
        "description": "Appointment booking and reminder platform for a regional clinic network.",
        "status": Project.Status.ACTIVE,
        "budget": 840,
        "used": 356,
        "start": date(2026, 4, 20),
        "deadline": date(2026, 11, 13),
        "risk": Project.Risk.MEDIUM,
        "importance": Importance.HIGH,
        "notes": "Privacy review may affect the reminder notification workflow.",
        "members": [
            "ari.chen@example.com",
            "matteo.ferrari@example.com",
            "valentina.rizzo@example.com",
            "sara.bianchi@example.com",
            "federica.lombardi@example.com",
        ],
    },
    {
        "name": "Energy Insights Platform",
        "client": "Verde Energia",
        "description": "Consumption analytics and forecasting for commercial energy customers.",
        "status": Project.Status.PLANNING,
        "budget": 1100,
        "used": 96,
        "start": date(2026, 7, 6),
        "deadline": date(2027, 2, 26),
        "risk": Project.Risk.LOW,
        "importance": Importance.MEDIUM,
        "notes": "Data contracts are being validated with the metering provider.",
        "members": [
            "marco.esposito@example.com",
            "luca.rossi@example.com",
            "giulia.conti@example.com",
            "davide.greco@example.com",
            "elena.romano@example.com",
        ],
    },
    {
        "name": "Learning Management Hub",
        "client": "Nova Academy",
        "description": "Course delivery, assessments, certificates, and learner analytics.",
        "status": Project.Status.ACTIVE,
        "budget": 680,
        "used": 470,
        "start": date(2026, 2, 9),
        "deadline": date(2026, 9, 4),
        "risk": Project.Risk.MEDIUM,
        "importance": Importance.HIGH,
        "notes": "Content migration volume is higher than originally estimated.",
        "members": [
            "chiara.gallo@example.com",
            "tommaso.mancini@example.com",
            "valentina.rizzo@example.com",
            "andrea.villa@example.com",
            "elena.romano@example.com",
        ],
    },
    {
        "name": "Smart Warehouse",
        "client": "Mercurio Distribution",
        "description": "Warehouse control centre for inventory, picking, and device monitoring.",
        "status": Project.Status.PAUSED,
        "budget": 1240,
        "used": 522,
        "start": date(2026, 1, 12),
        "deadline": date(2026, 12, 18),
        "risk": Project.Risk.HIGH,
        "importance": Importance.CRITICAL,
        "notes": "Paused while the client replaces the warehouse scanner supplier.",
        "members": [
            "marta.costa@example.com",
            "matteo.ferrari@example.com",
            "tommaso.mancini@example.com",
            "sara.bianchi@example.com",
            "simone.moretti@example.com",
        ],
    },
    {
        "name": "Travel Rewards",
        "client": "Orizzonte Travel",
        "description": "Loyalty programme with partner offers, points, and personalised journeys.",
        "status": Project.Status.COMPLETED,
        "budget": 560,
        "used": 538,
        "start": date(2025, 10, 6),
        "deadline": date(2026, 5, 29),
        "risk": Project.Risk.LOW,
        "importance": Importance.LOW,
        "notes": "Production handover completed; warranty support remains active.",
        "members": [
            "sofia.martin@example.com",
            "ari.chen@example.com",
            "luca.rossi@example.com",
            "giulia.conti@example.com",
            "davide.greco@example.com",
        ],
    },
]

TEAMS = [
    {
        "name": "Pulse Delivery",
        "focus": "Customer platforms and portfolio tooling",
        "lead": "luca.rossi@example.com",
        "members": [
            ("luca.rossi@example.com", "Tech Lead"),
            ("ari.chen@example.com", "Frontend"),
            ("sara.bianchi@example.com", "Quality"),
            ("giulia.conti@example.com", "Design"),
            ("elena.romano@example.com", "Product"),
        ],
        "projects": ["Customer Portal", "Energy Insights Platform"],
    },
    {
        "name": "Orbit Squad",
        "focus": "Mobile products and field operations",
        "lead": "sofia.martin@example.com",
        "members": [
            ("sofia.martin@example.com", "Mobile Lead"),
            ("marta.costa@example.com", "Mobile"),
            ("matteo.ferrari@example.com", "Backend"),
            ("andrea.villa@example.com", "Quality"),
            ("simone.moretti@example.com", "Platform"),
        ],
        "projects": ["Fleet Tracking Mobile", "Smart Warehouse"],
    },
    {
        "name": "Care Connect",
        "focus": "Healthcare and privacy-sensitive services",
        "lead": "federica.lombardi@example.com",
        "members": [
            ("federica.lombardi@example.com", "Product Lead"),
            ("ari.chen@example.com", "Frontend"),
            ("matteo.ferrari@example.com", "Backend"),
            ("valentina.rizzo@example.com", "Design"),
            ("sara.bianchi@example.com", "Quality"),
        ],
        "projects": ["Healthcare Booking"],
    },
    {
        "name": "Studio Nova",
        "focus": "Learning experiences and internal analytics",
        "lead": "marco.esposito@example.com",
        "members": [
            ("marco.esposito@example.com", "Tech Lead"),
            ("chiara.gallo@example.com", "Frontend"),
            ("tommaso.mancini@example.com", "Full-stack"),
            ("valentina.rizzo@example.com", "Design"),
            ("andrea.villa@example.com", "Quality"),
        ],
        "projects": ["Learning Management Hub", "Operations Dashboard"],
    },
    {
        "name": "Venture Lab",
        "focus": "Rapid discovery and new digital products",
        "lead": "elena.romano@example.com",
        "members": [
            ("elena.romano@example.com", "Product Lead"),
            ("giulia.conti@example.com", "Design"),
            ("tommaso.mancini@example.com", "Full-stack"),
            ("davide.greco@example.com", "Platform"),
            ("sofia.martin@example.com", "Mobile"),
        ],
        "projects": ["Travel Rewards"],
    },
]

SPRINT_NAMES = ("Foundation", "Feature Delivery", "Release Readiness")
SPRINT_OFFSETS = ((0, 13), (14, 27), (28, 41))
SPRINT_STATUSES = (Sprint.Status.COMPLETED, Sprint.Status.ACTIVE, Sprint.Status.PLANNED)

TASK_TEMPLATES = [
    ("Discovery and acceptance criteria", Task.Status.DONE, Task.Priority.MEDIUM, 8, 8),
    ("Core experience implementation", Task.Status.IN_PROGRESS, Task.Priority.HIGH, 24, 13),
    ("API and data integration", Task.Status.IN_PROGRESS, Task.Priority.HIGH, 20, 11),
    ("Accessibility and responsive review", Task.Status.REVIEW, Task.Priority.MEDIUM, 10, 7),
    ("Automated regression coverage", Task.Status.TODO, Task.Priority.MEDIUM, 14, 2),
    ("Release runbook and monitoring", Task.Status.TODO, Task.Priority.LOW, 8, 0),
]


class Command(BaseCommand):
    help = "Create or refresh a rich, non-sensitive demo dataset and accounts."

    @transaction.atomic
    def handle(self, *args, **options):
        jobs = {}
        for title, wage, weekly_hours, department in JOBS:
            jobs[title], _ = Job.objects.update_or_create(
                title=title,
                defaults={
                    "hourly_wage": Decimal(wage),
                    "weekly_hours": weekly_hours,
                    "department": department,
                    "description": f"{title} role in the {department} practice.",
                },
            )

        employees = {}
        for email, first_name, last_name, phone, job_title, bio in EMPLOYEES:
            employees[email], _ = Employee.objects.update_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "phone_number": phone,
                    "job": jobs[job_title],
                    "bio": bio,
                    "is_active": True,
                },
            )

        projects = {}
        for spec in PROJECTS:
            project, _ = Project.objects.update_or_create(
                name=spec["name"],
                client_name=spec["client"],
                defaults={
                    "description": spec["description"],
                    "status": spec["status"],
                    "budget_hours": spec["budget"],
                    "used_hours": spec["used"],
                    "start_date": spec["start"],
                    "deadline": spec["deadline"],
                    "importance": spec["importance"],
                    "risk_level": spec["risk"],
                    "risk_notes": spec["notes"],
                },
            )
            projects[spec["name"]] = project

            for index, email in enumerate(spec["members"]):
                employee = employees[email]
                ProjectMembership.objects.update_or_create(
                    project=project,
                    employee=employee,
                    defaults={
                        "assigned_role": employee.job.title,
                        "weekly_allocated_hours": 32 if index < 3 else 16,
                    },
                )

        for spec in TEAMS:
            team, _ = Team.objects.update_or_create(
                name=spec["name"],
                defaults={
                    "focus_area": spec["focus"],
                    "lead": employees[spec["lead"]],
                    "notes": f"Cross-functional team focused on {spec['focus'].lower()}.",
                },
            )
            team.projects.set(projects[name] for name in spec["projects"])
            for email, role in spec["members"]:
                TeamMembership.objects.update_or_create(
                    team=team,
                    employee=employees[email],
                    defaults={"team_role": role},
                )

        for project_index, spec in enumerate(PROJECTS):
            project = projects[spec["name"]]
            sprint_start = spec["start"]
            project_members = [employees[email] for email in spec["members"]]

            sprints = []
            for sprint_index, (offset_start, offset_end) in enumerate(SPRINT_OFFSETS):
                sprint, _ = Sprint.objects.update_or_create(
                    project=project,
                    name=f"Sprint {sprint_index + 1} - {SPRINT_NAMES[sprint_index]}",
                    defaults={
                        "goal": (
                            f"{SPRINT_NAMES[sprint_index]} milestone for "
                            f"{project.name.lower()}."
                        ),
                        "start_date": date.fromordinal(sprint_start.toordinal() + offset_start),
                        "end_date": date.fromordinal(sprint_start.toordinal() + offset_end),
                        "status": (
                            Sprint.Status.COMPLETED
                            if project.status == Project.Status.COMPLETED
                            else Sprint.Status.BLOCKED
                            if project.status == Project.Status.PAUSED
                            and sprint_index == 1
                            else SPRINT_STATUSES[sprint_index]
                        ),
                        "importance": (
                            Importance.CRITICAL
                            if spec["importance"] == Importance.CRITICAL
                            and sprint_index == 1
                            else Importance.HIGH
                            if sprint_index == 1
                            else Importance.MEDIUM
                            if sprint_index == 2
                            else Importance.LOW
                        ),
                        "capacity_hours": 80 + (sprint_index * 16),
                        "focus_area": spec["name"],
                        "definition_of_done": (
                            "Acceptance criteria met, code reviewed, tests passing, "
                            "and stakeholder notes updated."
                        ),
                        "risk_notes": spec["notes"] if sprint_index == 1 else "",
                        "backlog_notes": (
                            f"Prioritize the {SPRINT_NAMES[sprint_index].lower()} milestone "
                            "and review blocked work daily."
                        ),
                    },
                )
                sprints.append(sprint)

            for task_index, template in enumerate(TASK_TEMPLATES):
                title, status_value, priority, estimate, spent = template
                sprint = sprints[min(task_index // 2, len(sprints) - 1)]
                if project.status == Project.Status.COMPLETED:
                    status_value = Task.Status.DONE
                    spent = estimate
                elif project.status == Project.Status.PAUSED and task_index in (2, 3):
                    status_value = Task.Status.TODO

                Task.objects.update_or_create(
                    project=project,
                    sprint=sprint,
                    title=title,
                    defaults={
                        "description": f"{title} for the {project.name} delivery stream.",
                        "assignee": project_members[
                            (task_index + project_index) % len(project_members)
                        ],
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
        UserProfile.objects.update_or_create(
            user=demo_user,
            defaults={"employee": employees["ari.chen@example.com"]},
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Demo data ready: "
                f"{Job.objects.count()} jobs, "
                f"{Employee.objects.count()} employees, "
                f"{Project.objects.count()} projects, "
                f"{Team.objects.count()} teams, "
                f"{Sprint.objects.count()} sprints, "
                f"{Task.objects.count()} tasks."
            )
        )
        self.stdout.write("Admin: admin@taaspulse.local / AdminPass!2026")
        self.stdout.write("User: ari.chen@example.com / EmployeePass!2026")
