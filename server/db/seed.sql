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
  (4, 'Lea', 'Singh', 'lea.singh@example.com', '+39 333 010 1004', 4, 'Owns regression checks and risk validation.'),
  (5, 'Elena', 'Marino', 'elena.marino@example.com', '+39 333 010 1005', 1, 'Builds reusable frontend components.'),
  (6, 'Marco', 'Bianchi', 'marco.bianchi@example.com', '+39 333 010 1006', 2, 'Maintains backend service endpoints.'),
  (7, 'Sofia', 'Greco', 'sofia.greco@example.com', '+39 333 010 1007', 3, 'Designs onboarding and dashboard flows.'),
  (8, 'Daniel', 'Costa', 'daniel.costa@example.com', '+39 333 010 1008', 4, 'Runs manual QA passes before releases.'),
  (9, 'Nadia', 'Ferrari', 'nadia.ferrari@example.com', '+39 333 010 1009', 1, 'Focuses on responsive UI implementation.'),
  (10, 'Luca', 'Romano', 'luca.romano@example.com', '+39 333 010 1010', 2, 'Owns database query optimization.'),
  (11, 'Priya', 'Nair', 'priya.nair@example.com', '+39 333 010 1011', 3, 'Creates design systems and prototypes.'),
  (12, 'Thomas', 'Meyer', 'thomas.meyer@example.com', '+39 333 010 1012', 4, 'Writes acceptance test scenarios.'),
  (13, 'Giulia', 'Conti', 'giulia.conti@example.com', '+39 333 010 1013', 1, 'Implements client-side data views.'),
  (14, 'Noah', 'Schmidt', 'noah.schmidt@example.com', '+39 333 010 1014', 2, 'Builds authentication and authorization logic.'),
  (15, 'Aisha', 'Khan', 'aisha.khan@example.com', '+39 333 010 1015', 3, 'Improves product usability and information architecture.'),
  (16, 'Matteo', 'Ricci', 'matteo.ricci@example.com', '+39 333 010 1016', 4, 'Coordinates regression testing.'),
  (17, 'Camille', 'Dubois', 'camille.dubois@example.com', '+39 333 010 1017', 1, 'Builds accessible React interfaces.'),
  (18, 'Andrea', 'Gallo', 'andrea.gallo@example.com', '+39 333 010 1018', 2, 'Maintains API integrations.'),
  (19, 'Mina', 'Sato', 'mina.sato@example.com', '+39 333 010 1019', 3, 'Designs reporting and data visualization flows.'),
  (20, 'Oscar', 'Rinaldi', 'oscar.rinaldi@example.com', '+39 333 010 1020', 4, 'Owns bug triage and verification.'),
  (21, 'Laura', 'Moretti', 'laura.moretti@example.com', '+39 333 010 1021', 1, 'Works on frontend performance improvements.'),
  (22, 'Ethan', 'Walker', 'ethan.walker@example.com', '+39 333 010 1022', 2, 'Builds background processing utilities.'),
  (23, 'Sara', 'De Luca', 'sara.deluca@example.com', '+39 333 010 1023', 3, 'Refines user journeys and interface copy.'),
  (24, 'Hugo', 'Martin', 'hugo.martin@example.com', '+39 333 010 1024', 4, 'Prepares release quality checklists.'),
  (25, 'Irene', 'Villa', 'irene.villa@example.com', '+39 333 010 1025', 1, 'Implements forms and validation states.'),
  (26, 'Samir', 'Patel', 'samir.patel@example.com', '+39 333 010 1026', 2, 'Works on data access and service reliability.'),
  (27, 'Clara', 'Fontana', 'clara.fontana@example.com', '+39 333 010 1027', 3, 'Creates high-fidelity UI mockups.'),
  (28, 'Ben', 'Taylor', 'ben.taylor@example.com', '+39 333 010 1028', 4, 'Tests cross-browser behavior.'),
  (29, 'Vera', 'Leone', 'vera.leone@example.com', '+39 333 010 1029', 1, 'Maintains dashboard interaction patterns.'),
  (30, 'Diego', 'Russo', 'diego.russo@example.com', '+39 333 010 1030', 2, 'Improves backend error handling.'),
  (31, 'Olivia', 'Stone', 'olivia.stone@example.com', '+39 333 010 1031', 3, 'Supports product discovery workshops.'),
  (32, 'Enzo', 'Ferraro', 'enzo.ferraro@example.com', '+39 333 010 1032', 4, 'Builds QA documentation.'),
  (33, 'Maya', 'Silva', 'maya.silva@example.com', '+39 333 010 1033', 1, 'Develops reusable dashboard widgets.'),
  (34, 'Riccardo', 'Esposito', 'riccardo.esposito@example.com', '+39 333 010 1034', 2, 'Supports database migrations and API reviews.');

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
VALUES
  (
    2,
    'Internal Billing Console',
    'Acme Finance',
    'Build an internal console for invoice review and budget reporting.',
    'active',
    260,
    82,
    '2026-07-01',
    '2026-09-12',
    'low',
    'Discovery is complete and implementation is moving steadily.'
  ),
  (
    3,
    'Partner Support Portal',
    'Globex Partners',
    'Create a support portal for partner onboarding and ticket routing.',
    'paused',
    340,
    312,
    '2026-05-18',
    '2026-07-30',
    'high',
    'External API access is delayed by the client security review.'
  );

INSERT INTO teams (id, name, focus_area, lead_employee_id, notes)
VALUES (
  1,
  'Portal Delivery Squad',
  'Customer-facing product delivery',
  2,
  'Small cross-functional team covering frontend, backend, UX, and QA.'
);

INSERT INTO team_memberships (team_id, employee_id, team_role)
VALUES
  (1, 1, 'Frontend owner'),
  (1, 2, 'Team lead and backend owner'),
  (1, 3, 'UX reviewer'),
  (1, 4, 'QA owner');

INSERT INTO team_projects (team_id, project_id)
VALUES
  (1, 1);

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
