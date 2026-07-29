from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Importance(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    CRITICAL = "critical", "Critical"


class Job(TimestampedModel):
    title = models.CharField(max_length=120, unique=True)
    hourly_wage = models.DecimalField(max_digits=8, decimal_places=2)
    weekly_hours = models.PositiveSmallIntegerField(default=40)
    department = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["title"]
        constraints = [
            models.CheckConstraint(
                condition=Q(hourly_wage__gte=0),
                name="job_hourly_wage_non_negative",
            ),
            models.CheckConstraint(
                condition=Q(weekly_hours__gt=0),
                name="job_weekly_hours_positive",
            ),
        ]

    def __str__(self) -> str:
        return self.title


class Employee(TimestampedModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=40, blank=True)
    job = models.ForeignKey(Job, on_delete=models.PROTECT, related_name="employees")
    bio = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"


class UserProfile(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    employee = models.OneToOneField(
        Employee,
        on_delete=models.SET_NULL,
        related_name="user_profile",
        null=True,
        blank=True,
    )

    def __str__(self) -> str:
        return f"Profile: {self.user.username}"


class Project(TimestampedModel):
    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Risk(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    name = models.CharField(max_length=180)
    client_name = models.CharField(max_length=180)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNING)
    budget_hours = models.PositiveIntegerField()
    used_hours = models.PositiveIntegerField(default=0)
    start_date = models.DateField(null=True, blank=True)
    deadline = models.DateField()
    importance = models.CharField(
        max_length=10,
        choices=Importance.choices,
        default=Importance.MEDIUM,
    )
    risk_level = models.CharField(max_length=10, choices=Risk.choices, default=Risk.LOW)
    risk_notes = models.TextField(blank=True)
    members = models.ManyToManyField(
        Employee,
        through="ProjectMembership",
        related_name="projects",
    )

    class Meta:
        ordering = ["deadline", "name"]
        constraints = [
            models.CheckConstraint(
                condition=Q(budget_hours__gt=0),
                name="project_budget_positive",
            ),
            models.CheckConstraint(
                condition=Q(used_hours__gte=0),
                name="project_used_hours_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.client_name})"


class ProjectMembership(TimestampedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    assigned_role = models.CharField(max_length=120, blank=True)
    weekly_allocated_hours = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["project", "employee"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "employee"],
                name="unique_project_employee",
            ),
            models.CheckConstraint(
                condition=Q(weekly_allocated_hours__gt=0),
                name="membership_hours_positive",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.employee} on {self.project.name}"


class Team(TimestampedModel):
    name = models.CharField(max_length=150, unique=True)
    focus_area = models.CharField(max_length=200)
    lead = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        related_name="led_teams",
        null=True,
        blank=True,
    )
    notes = models.TextField(blank=True)
    members = models.ManyToManyField(
        Employee,
        through="TeamMembership",
        related_name="teams",
    )
    projects = models.ManyToManyField(Project, related_name="teams", blank=True)

    class Meta:
        ordering = ["name"]

    def clean(self) -> None:
        if self.pk and self.lead_id and not self.members.filter(pk=self.lead_id).exists():
            raise ValidationError({"lead": "The team lead must also be a team member."})

    def __str__(self) -> str:
        return self.name


class TeamMembership(TimestampedModel):
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    team_role = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["team", "employee"]
        constraints = [
            models.UniqueConstraint(
                fields=["team", "employee"],
                name="unique_team_employee",
            )
        ]

    def __str__(self) -> str:
        return f"{self.employee} in {self.team}"


class Sprint(TimestampedModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        BLOCKED = "blocked", "Blocked"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="sprints")
    name = models.CharField(max_length=180)
    goal = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    importance = models.CharField(
        max_length=10,
        choices=Importance.choices,
        default=Importance.MEDIUM,
    )

    class Meta:
        ordering = ["-start_date", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                name="unique_sprint_name_per_project",
            ),
            models.CheckConstraint(
                condition=Q(end_date__gte=F("start_date")),
                name="sprint_end_not_before_start",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.project.name}: {self.name}"


class Task(TimestampedModel):
    class Status(models.TextChoices):
        TODO = "todo", "Todo"
        IN_PROGRESS = "in_progress", "In Progress"
        REVIEW = "review", "Review"
        DONE = "done", "Done"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.SET_NULL,
        related_name="tasks",
        null=True,
        blank=True,
    )
    assignee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        related_name="tasks",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    estimate_hours = models.PositiveIntegerField(default=0)
    spent_hours = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["project", "priority", "title"]

    def clean(self) -> None:
        errors = {}
        if self.sprint_id and self.sprint.project_id != self.project_id:
            errors["sprint"] = "The sprint must belong to the selected project."
        if self.assignee_id and not ProjectMembership.objects.filter(
            project_id=self.project_id,
            employee_id=self.assignee_id,
        ).exists():
            errors["assignee"] = "The assignee must be a member of the project."
        if errors:
            raise ValidationError(errors)

    def __str__(self) -> str:
        return self.title
