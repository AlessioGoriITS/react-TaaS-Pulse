from django.contrib import admin

from .models import (
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


class ProjectMembershipInline(admin.TabularInline):
    model = ProjectMembership
    extra = 0
    autocomplete_fields = ["employee"]


class TeamMembershipInline(admin.TabularInline):
    model = TeamMembership
    extra = 0
    autocomplete_fields = ["employee"]


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ["title", "department", "hourly_wage", "weekly_hours"]
    list_filter = ["department"]
    search_fields = ["title", "department", "description"]
    ordering = ["title"]


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ["last_name", "first_name", "email", "job", "is_active"]
    list_filter = ["is_active", "job", "job__department"]
    search_fields = ["first_name", "last_name", "email", "job__title"]
    autocomplete_fields = ["job"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["last_name", "first_name"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "client_name",
        "status",
        "importance",
        "risk_level",
        "budget_hours",
        "used_hours",
        "deadline",
    ]
    list_filter = ["status", "importance", "risk_level", "deadline"]
    search_fields = ["name", "client_name", "description"]
    date_hierarchy = "deadline"
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["deadline"]
    inlines = [ProjectMembershipInline]


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ["name", "focus_area", "lead", "member_count"]
    search_fields = ["name", "focus_area", "lead__first_name", "lead__last_name"]
    autocomplete_fields = ["lead", "projects"]
    inlines = [TeamMembershipInline]

    @admin.display(description="Members")
    def member_count(self, obj):
        return obj.members.count()


@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "project",
        "status",
        "importance",
        "capacity_hours",
        "focus_area",
        "start_date",
        "end_date",
    ]
    list_filter = ["status", "importance", "project"]
    search_fields = ["name", "goal", "project__name"]
    autocomplete_fields = ["project"]
    date_hierarchy = "start_date"


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "project",
        "sprint",
        "assignee",
        "status",
        "priority",
        "estimate_hours",
        "spent_hours",
    ]
    list_filter = ["status", "priority", "project", "sprint"]
    search_fields = [
        "title",
        "description",
        "project__name",
        "assignee__first_name",
        "assignee__last_name",
    ]
    autocomplete_fields = ["project", "sprint", "assignee"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["project", "status", "-priority"]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "employee", "created_at"]
    search_fields = ["user__username", "user__email", "employee__email"]
    autocomplete_fields = ["user", "employee"]


@admin.register(ProjectMembership)
class ProjectMembershipAdmin(admin.ModelAdmin):
    list_display = ["project", "employee", "assigned_role", "weekly_allocated_hours"]
    list_filter = ["project"]
    search_fields = ["project__name", "employee__first_name", "employee__last_name"]
    autocomplete_fields = ["project", "employee"]


@admin.register(TeamMembership)
class TeamMembershipAdmin(admin.ModelAdmin):
    list_display = ["team", "employee", "team_role"]
    list_filter = ["team"]
    search_fields = ["team__name", "employee__first_name", "employee__last_name"]
    autocomplete_fields = ["team", "employee"]
