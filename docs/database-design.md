# TaaS Pulse Database Design

## What The Program Is For

TaaS Pulse is a small project-health dashboard for a Team as a Service workflow.

The database should answer practical delivery questions:

- Which projects are active?
- Who is assigned to each project?
- How much team capacity is available?
- How much budget has been used?
- Which sprint is currently running?
- Which tasks are still open?
- Is the project delivery risk low, medium, or high?

This means the database is not only an address book for employees. It connects people,
jobs, projects, sprints, and tasks so the app can calculate project health.

## Tables

### employees

Stores the real people who can work on projects.

Important fields:

- `id`: internal database id
- `first_name`: employee name
- `last_name`: employee surname
- `email`: work email, unique
- `phone_number`: contact number
- `job_id`: the employee's role/job
- `bio`: simple free-text field for various info
- `is_active`: whether the employee can still be assigned to projects

Why `job_id` instead of writing the job name directly here?

Because many employees can share the same job. If the hourly wage or weekly hours for
"Frontend Developer" changes, we update one job row instead of many employee rows.

### jobs

Stores work positions such as Frontend Developer, Backend Developer, QA Engineer.

Important fields:

- `id`: internal database id
- `title`: job name
- `hourly_wage`: cost per hour
- `weekly_hours`: normal weekly capacity
- `department`: optional grouping
- `description`: free-text work info

### projects

Stores client projects that the team is delivering.

Fields included:

- `id`: internal database id
- `name`: project name
- `client_name`: client/customer name
- `description`: what the project is about
- `status`: planning, active, paused, completed, cancelled
- `budget_hours`: total planned budget in hours
- `used_hours`: hours already consumed
- `start_date`: when the project starts
- `deadline`: expected delivery date
- `risk_level`: low, medium, high
- `risk_notes`: short explanation of the risk

Why these fields?

They match the dashboard we already started: budget, deadline, progress, and risk.
Later the backend can calculate part of this automatically from tasks and assignments.

### project_memberships

Connects employees to projects.

This table is needed because the relationship is many-to-many:

- one employee can work on many projects
- one project can have many employees

Important fields:

- `project_id`: project
- `employee_id`: employee
- `assigned_role`: role on that specific project
- `weekly_allocated_hours`: how many hours per week this person gives this project

This is better than putting a `projects` text column inside `employees`, because it lets
the app query assignments cleanly and calculate capacity.

### teams

Stores stable delivery squads.

Important fields:

- `id`: internal database id
- `name`: team name
- `focus_area`: what kind of work the team usually handles
- `lead_employee_id`: optional employee who leads the team
- `notes`: extra team context

A team is useful because a TaaS company usually sells capacity as a group, not only as
separate individuals.

### team_memberships

Connects employees to teams.

This is another many-to-many table:

- one team has many employees
- one employee could later belong to more than one team

### team_projects

Connects teams to projects.

This keeps the model flexible. A project can be assigned to a whole team, while
`project_memberships` can still store the exact employee-level allocation.

### sprints

Stores time-boxed work periods for a project.

Important fields:

- `project_id`: project this sprint belongs to
- `name`: sprint name
- `goal`: sprint objective
- `start_date`: sprint start
- `end_date`: sprint end
- `status`: planned, active, completed

### tasks

Stores work items for the task board.

Important fields:

- `project_id`: owning project
- `sprint_id`: optional sprint
- `assignee_id`: optional employee
- `title`: task title
- `description`: task details
- `status`: todo, in_progress, review, done
- `priority`: low, medium, high
- `estimate_hours`: expected work
- `spent_hours`: actual work spent

Tasks are what make project progress measurable.

## MVP Rule

For now, do not add authentication, invoices, files, comments, or audit logs.
Those can come later. The MVP database should stay focused on project health.
