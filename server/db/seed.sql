PRAGMA foreign_keys = ON;

INSERT INTO jobs (id, title, hourly_wage, weekly_hours, department, description)
VALUES
  (1, 'Frontend Developer', 45, 32, 'Engineering', 'Builds React interfaces and client-side workflows.'),
  (2, 'Backend Developer', 50, 30, 'Engineering', 'Builds APIs, database logic, and service integrations.'),
  (3, 'Product Designer', 42, 18, 'Design', 'Designs user flows, wireframes, and product UI.'),
  (4, 'QA Engineer', 38, 24, 'Quality', 'Tests features and validates delivery quality.');

INSERT INTO employees (id, first_name, last_name, email, phone_number, job_id, bio)
VALUES
  (1, 'Ari', 'Chen', 'ari.chen@example.com', '+39 333 010 1001', 1, 'Owns dashboard UI implementation.'),
  (2, 'Marta', 'Rossi', 'marta.rossi@example.com', '+39 333 010 1002', 2, 'Owns API design and data modeling.'),
  (3, 'Jon', 'Bell', 'jon.bell@example.com', '+39 333 010 1003', 3, 'Reviews user experience and empty states.'),
  (4, 'Lea', 'Singh', 'lea.singh@example.com', '+39 333 010 1004', 4, 'Owns regression checks and risk validation.');

INSERT INTO projects (
  id,
  name,
  client_name,
  description,
  status,
  budget_hours,
  used_hours,
  start_date,
  deadline,
  risk_level,
  risk_notes
)
VALUES (
  1,
  'Customer Portal Refresh',
  'Northwind Labs',
  'Refresh the customer portal dashboard and reporting workflow.',
  'active',
  420,
  236,
  '2026-06-15',
  '2026-08-21',
  'medium',
  'Budget usage is moving faster than task completion.'
);

INSERT INTO project_memberships (project_id, employee_id, assigned_role, weekly_allocated_hours)
VALUES
  (1, 1, 'Frontend owner', 24),
  (1, 2, 'Backend owner', 22),
  (1, 3, 'UX reviewer', 10),
  (1, 4, 'QA owner', 16);

INSERT INTO sprints (id, project_id, name, goal, start_date, end_date, status)
VALUES (
  1,
  1,
  'Sprint 4',
  'Stabilize the dashboard and finish the reporting flow.',
  '2026-07-06',
  '2026-07-17',
  'active'
);

INSERT INTO tasks (
  id,
  project_id,
  sprint_id,
  assignee_id,
  title,
  description,
  status,
  priority,
  estimate_hours,
  spent_hours
)
VALUES
  (1, 1, 1, 1, 'Build dashboard summary cards', 'Create the main dashboard metric cards.', 'done', 'high', 10, 9),
  (2, 1, 1, 2, 'Define project report API shape', 'Draft the response shape for project health reports.', 'in_progress', 'high', 14, 11),
  (3, 1, 1, 3, 'Review task board empty states', 'Check the board behavior when columns have no tasks.', 'review', 'medium', 6, 5),
  (4, 1, 1, 4, 'Add risk calculation tests', 'Validate risk rules against sample project data.', 'todo', 'medium', 8, 0),
  (5, 1, 1, 1, 'Prepare demo data for interview walkthrough', 'Make sure demo data tells a clear project story.', 'todo', 'low', 5, 0);
