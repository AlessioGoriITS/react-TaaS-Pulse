from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers

from .models import (
    Employee,
    Importance,
    Job,
    Project,
    ProjectMembership,
    Sprint,
    Task,
    Team,
    TeamMembership,
)


PROJECT_STATUS_FROM_API = {
    "On Track": (Project.Status.ACTIVE, Project.Risk.LOW),
    "At Risk": (Project.Status.ACTIVE, Project.Risk.MEDIUM),
    "Blocked": (Project.Status.PAUSED, Project.Risk.HIGH),
}
SPRINT_STATUS_FROM_API = {label: value for value, label in Sprint.Status.choices}
TASK_STATUS_FROM_API = {label: value for value, label in Task.Status.choices}
TASK_PRIORITY_FROM_API = {label: value for value, label in Task.Priority.choices}
IMPORTANCE_FROM_API = {label: value for value, label in Importance.choices}


class CurrentUserSerializer(serializers.ModelSerializer):
    displayName = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    employeeId = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["email", "displayName", "role", "employeeId"]

    def get_displayName(self, obj) -> str:
        return obj.get_full_name() or obj.username

    def get_role(self, obj) -> str:
        return "admin" if obj.is_staff else "user"

    def get_employeeId(self, obj) -> int | None:
        profile = getattr(obj, "profile", None)
        return profile.employee_id if profile else None


class LoginRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class LoginResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    tokenType = serializers.CharField()
    user = CurrentUserSerializer()


class CurrentUserResponseSerializer(serializers.Serializer):
    user = CurrentUserSerializer()


class LogoutResponseSerializer(serializers.Serializer):
    ok = serializers.BooleanField()


class HealthResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    service = serializers.CharField()


class ProjectSerializer(serializers.ModelSerializer):
    clientName = serializers.CharField(source="client_name")
    longDescription = serializers.CharField(source="description")
    budgetHours = serializers.IntegerField(source="budget_hours", min_value=1)
    usedHours = serializers.IntegerField(source="used_hours", min_value=0)
    riskNotes = serializers.CharField(source="risk_notes", allow_blank=True, required=False)
    status = serializers.ChoiceField(choices=list(PROJECT_STATUS_FROM_API))
    importance = serializers.ChoiceField(choices=list(IMPORTANCE_FROM_API), required=False)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "clientName",
            "description",
            "longDescription",
            "budgetHours",
            "usedHours",
            "deadline",
            "status",
            "importance",
            "riskNotes",
        ]
        read_only_fields = ["id", "description"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["description"] = instance.description
        data["longDescription"] = instance.description
        data["status"] = (
            "Blocked"
            if instance.risk_level == Project.Risk.HIGH
            else "At Risk"
            if instance.risk_level == Project.Risk.MEDIUM
            else "On Track"
        )
        data["importance"] = instance.get_importance_display()
        return data

    def validate(self, attrs):
        used = attrs.get("used_hours", getattr(self.instance, "used_hours", 0))
        budget = attrs.get("budget_hours", getattr(self.instance, "budget_hours", 0))
        if used > budget:
            raise serializers.ValidationError(
                {"usedHours": "Used hours cannot exceed the project budget."}
            )
        return attrs

    def _apply_status(self, validated_data):
        api_status = validated_data.pop("status", None)
        if api_status is not None:
            status, risk = PROJECT_STATUS_FROM_API[api_status]
            validated_data["status"] = status
            validated_data["risk_level"] = risk
        if "importance" in validated_data:
            validated_data["importance"] = IMPORTANCE_FROM_API[validated_data["importance"]]
        return validated_data

    def create(self, validated_data):
        return super().create(self._apply_status(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._apply_status(validated_data))


class SprintSerializer(serializers.ModelSerializer):
    projectId = serializers.PrimaryKeyRelatedField(
        source="project",
        queryset=Project.objects.all(),
    )
    longDescription = serializers.CharField(source="goal", required=False)
    startDate = serializers.DateField(source="start_date")
    endDate = serializers.DateField(source="end_date")
    status = serializers.ChoiceField(choices=list(SPRINT_STATUS_FROM_API))
    importance = serializers.ChoiceField(choices=list(IMPORTANCE_FROM_API), required=False)
    capacityHours = serializers.IntegerField(
        source="capacity_hours",
        min_value=1,
        required=False,
    )
    focusArea = serializers.CharField(source="focus_area", allow_blank=True, required=False)
    definitionOfDone = serializers.CharField(
        source="definition_of_done",
        allow_blank=True,
        required=False,
    )
    riskNotes = serializers.CharField(source="risk_notes", allow_blank=True, required=False)
    backlogNotes = serializers.CharField(source="backlog_notes", allow_blank=True, required=False)

    class Meta:
        model = Sprint
        fields = [
            "id",
            "projectId",
            "name",
            "goal",
            "longDescription",
            "startDate",
            "endDate",
            "status",
            "importance",
            "capacityHours",
            "focusArea",
            "definitionOfDone",
            "riskNotes",
            "backlogNotes",
        ]
        read_only_fields = ["id", "goal"]

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError(
                {"endDate": "The end date cannot be before the start date."}
            )
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["goal"] = instance.goal
        data["longDescription"] = instance.goal
        data["status"] = instance.get_status_display()
        data["importance"] = instance.get_importance_display()
        return data

    def _translate(self, validated_data):
        if "status" in validated_data:
            validated_data["status"] = SPRINT_STATUS_FROM_API[validated_data["status"]]
        if "importance" in validated_data:
            validated_data["importance"] = IMPORTANCE_FROM_API[validated_data["importance"]]
        return validated_data

    def create(self, validated_data):
        return super().create(self._translate(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._translate(validated_data))


class EmployeeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name")
    surname = serializers.CharField(source="last_name")
    phoneNumber = serializers.CharField(source="phone_number", allow_blank=True, required=False)
    role = serializers.CharField(write_only=True)
    hourlyWage = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        min_value=0,
        write_only=True,
    )
    weeklyCapacityHours = serializers.IntegerField(min_value=1, write_only=True)
    projectIds = serializers.PrimaryKeyRelatedField(
        source="projects",
        queryset=Project.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Employee
        fields = [
            "id",
            "name",
            "surname",
            "email",
            "phoneNumber",
            "role",
            "hourlyWage",
            "weeklyCapacityHours",
            "projectIds",
            "bio",
        ]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "name": instance.first_name,
            "surname": instance.last_name,
            "email": instance.email,
            "phoneNumber": instance.phone_number,
            "role": instance.job.title,
            "hourlyWage": float(instance.job.hourly_wage),
            "weeklyCapacityHours": instance.job.weekly_hours,
            "projectIds": list(instance.projects.values_list("id", flat=True)),
            "bio": instance.bio,
        }

    @transaction.atomic
    def create(self, validated_data):
        projects = validated_data.pop("projects", [])
        role = validated_data.pop("role")
        hourly_wage = validated_data.pop("hourlyWage")
        weekly_hours = validated_data.pop("weeklyCapacityHours")
        job, _ = Job.objects.update_or_create(
            title=role,
            defaults={
                "hourly_wage": hourly_wage,
                "weekly_hours": weekly_hours,
                "department": "Delivery",
            },
        )
        employee = Employee.objects.create(job=job, **validated_data)
        self._replace_projects(employee, projects, weekly_hours)
        return employee

    @transaction.atomic
    def update(self, instance, validated_data):
        projects = validated_data.pop("projects", None)
        role = validated_data.pop("role", instance.job.title)
        hourly_wage = validated_data.pop("hourlyWage", instance.job.hourly_wage)
        weekly_hours = validated_data.pop(
            "weeklyCapacityHours",
            instance.job.weekly_hours,
        )
        job, _ = Job.objects.update_or_create(
            title=role,
            defaults={
                "hourly_wage": hourly_wage,
                "weekly_hours": weekly_hours,
                "department": "Delivery",
            },
        )
        instance.job = job
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if projects is not None:
            self._replace_projects(instance, projects, weekly_hours)
        return instance

    @staticmethod
    def _replace_projects(employee, projects, weekly_hours):
        ProjectMembership.objects.filter(employee=employee).delete()
        ProjectMembership.objects.bulk_create(
            [
                ProjectMembership(
                    employee=employee,
                    project=project,
                    assigned_role=employee.job.title,
                    weekly_allocated_hours=weekly_hours,
                )
                for project in projects
            ]
        )


class TeamSerializer(serializers.ModelSerializer):
    focusArea = serializers.CharField(source="focus_area")
    leadId = serializers.PrimaryKeyRelatedField(
        source="lead",
        queryset=Employee.objects.all(),
        allow_null=True,
        required=False,
    )
    memberIds = serializers.PrimaryKeyRelatedField(
        source="members",
        queryset=Employee.objects.all(),
        many=True,
    )
    projectIds = serializers.PrimaryKeyRelatedField(
        source="projects",
        queryset=Project.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "focusArea",
            "leadId",
            "memberIds",
            "projectIds",
            "notes",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        lead = attrs.get("lead", getattr(self.instance, "lead", None))
        members = attrs.get("members")
        if members is None and self.instance:
            members = list(self.instance.members.all())
        if lead and members is not None and lead not in members:
            raise serializers.ValidationError(
                {"leadId": "The team lead must also be included in memberIds."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        members = validated_data.pop("members", [])
        projects = validated_data.pop("projects", [])
        team = Team.objects.create(**validated_data)
        self._replace_members(team, members)
        team.projects.set(projects)
        return team

    @transaction.atomic
    def update(self, instance, validated_data):
        members = validated_data.pop("members", None)
        projects = validated_data.pop("projects", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if members is not None:
            self._replace_members(instance, members)
        if projects is not None:
            instance.projects.set(projects)
        return instance

    @staticmethod
    def _replace_members(team, members):
        TeamMembership.objects.filter(team=team).delete()
        TeamMembership.objects.bulk_create(
            [TeamMembership(team=team, employee=employee) for employee in members]
        )


class TaskSerializer(serializers.ModelSerializer):
    projectId = serializers.PrimaryKeyRelatedField(
        source="project",
        queryset=Project.objects.all(),
    )
    sprintId = serializers.PrimaryKeyRelatedField(
        source="sprint",
        queryset=Sprint.objects.all(),
        allow_null=True,
        required=False,
    )
    assigneeId = serializers.PrimaryKeyRelatedField(
        source="assignee",
        queryset=Employee.objects.all(),
        allow_null=True,
        required=False,
    )
    estimateHours = serializers.IntegerField(source="estimate_hours", min_value=0)
    spentHours = serializers.IntegerField(source="spent_hours", min_value=0)
    status = serializers.ChoiceField(choices=list(TASK_STATUS_FROM_API))
    priority = serializers.ChoiceField(choices=list(TASK_PRIORITY_FROM_API))

    class Meta:
        model = Task
        fields = [
            "id",
            "projectId",
            "sprintId",
            "assigneeId",
            "title",
            "description",
            "status",
            "priority",
            "estimateHours",
            "spentHours",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        project = attrs.get("project", getattr(self.instance, "project", None))
        sprint = attrs.get("sprint", getattr(self.instance, "sprint", None))
        assignee = attrs.get("assignee", getattr(self.instance, "assignee", None))
        if sprint and project and sprint.project_id != project.id:
            raise serializers.ValidationError(
                {"sprintId": "The sprint must belong to the selected project."}
            )
        if assignee and project and not ProjectMembership.objects.filter(
            project=project,
            employee=assignee,
        ).exists():
            raise serializers.ValidationError(
                {"assigneeId": "The assignee must be a member of the project."}
            )
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["sprintId"] = instance.sprint_id or 0
        data["assigneeId"] = instance.assignee_id or 0
        data["status"] = instance.get_status_display()
        data["priority"] = instance.get_priority_display()
        return data

    def _translate(self, validated_data):
        if "status" in validated_data:
            validated_data["status"] = TASK_STATUS_FROM_API[validated_data["status"]]
        if "priority" in validated_data:
            validated_data["priority"] = TASK_PRIORITY_FROM_API[validated_data["priority"]]
        return validated_data

    def create(self, validated_data):
        return super().create(self._translate(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._translate(validated_data))


class WorkspaceDataSerializer(serializers.Serializer):
    projects = ProjectSerializer(many=True)
    teamMembers = EmployeeSerializer(many=True)
    teams = TeamSerializer(many=True)
    sprints = SprintSerializer(many=True)
    tasks = TaskSerializer(many=True)


class WorkspaceResponseSerializer(serializers.Serializer):
    workspace = WorkspaceDataSerializer()
