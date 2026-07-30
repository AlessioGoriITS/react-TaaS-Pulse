from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):
    dependencies = [
        ("pulse", "0002_project_importance_sprint_importance"),
    ]

    operations = [
        migrations.AddField(
            model_name="sprint",
            name="backlog_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="sprint",
            name="capacity_hours",
            field=models.PositiveIntegerField(default=80),
        ),
        migrations.AddField(
            model_name="sprint",
            name="definition_of_done",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="sprint",
            name="focus_area",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name="sprint",
            name="risk_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddConstraint(
            model_name="sprint",
            constraint=models.CheckConstraint(
                condition=Q(capacity_hours__gt=0),
                name="sprint_capacity_positive",
            ),
        ),
    ]
