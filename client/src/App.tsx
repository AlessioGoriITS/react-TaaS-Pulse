import { FormEvent, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login, logout } from "./api/auth";
import { MetricCard } from "./components/MetricCard";
import { TaskBoard } from "./components/TaskBoard";
import { project, projects, sprint, tasks, teamMembers, teams } from "./data/demoData";
import {
  getBudgetUsagePercent,
  getDeliveryRisk,
  getTaskCompletionPercent
} from "./lib/projectMetrics";
import type { AuthUser, ViewId } from "./types";

const navigationItems: Array<{ id: ViewId; label: string; helper: string }> = [
  { id: "dashboard", label: "Dashboard", helper: "Project health" },
  { id: "dependents", label: "Dependents Info", helper: "People directory" },
  { id: "team", label: "Team Info", helper: "Squads and capacity" },
  { id: "projects", label: "Projects", helper: "Client delivery" },
  { id: "tasks", label: "Task Board", helper: "Sprint execution" }
];

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

function App() {
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(project.id);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("admin@taaspulse.local");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isEmployeeAutocompleteOpen, setIsEmployeeAutocompleteOpen] = useState(false);
  const [employeeJobFilter, setEmployeeJobFilter] = useState("all");
  const [employeeProjectFilter, setEmployeeProjectFilter] = useState("all");

  const isAdmin = authUser?.role === "admin";
  const loggedEmployee = authUser?.employeeId
    ? teamMembers.find((member) => member.id === authUser.employeeId)
    : undefined;
  const accessibleProjectIds = isAdmin
    ? projects.map((projectItem) => projectItem.id)
    : loggedEmployee?.projectIds ?? [];
  const selectedProject =
    projects.find(
      (projectItem) =>
        projectItem.id === selectedProjectId && accessibleProjectIds.includes(projectItem.id)
    ) ??
    projects.find((projectItem) => accessibleProjectIds.includes(projectItem.id)) ??
    projects[0];
  const selectedProjectTasks = tasks.filter((task) => task.projectId === selectedProject.id);
  const visibleTeam =
    isAdmin || !loggedEmployee
      ? teams[0]
      : teams.find((team) => team.memberIds.includes(loggedEmployee.id)) ?? teams[0];
  const visibleTeamMembers = teamMembers.filter((member) =>
    visibleTeam.memberIds.includes(member.id)
  );

  const budgetUsage = useMemo(() => getBudgetUsagePercent(selectedProject), [selectedProject]);
  const taskCompletion = useMemo(
    () => getTaskCompletionPercent(selectedProjectTasks),
    [selectedProjectTasks]
  );
  const deliveryRisk = useMemo(
    () => getDeliveryRisk(selectedProject, selectedProjectTasks),
    [selectedProject, selectedProjectTasks]
  );
  const totalCapacity = visibleTeamMembers.reduce(
    (total, member) => total + member.weeklyCapacityHours,
    0
  );
  const teamLead = teamMembers.find((member) => member.id === visibleTeam.leadId);
  const jobOptions = Array.from(new Set(teamMembers.map((member) => member.role))).sort();
  const employeeSearchValue = employeeSearch.trim().toLowerCase();
  const normalizedEmployeePhoneSearch = normalizePhoneSearch(employeeSearch);
  const employeeSuggestions =
    employeeSearchValue.length === 0
      ? []
      : teamMembers
          .filter((member) => {
            const fullName = `${member.name} ${member.surname}`.toLowerCase();
            const memberPhone = normalizePhoneSearch(member.phoneNumber);
            return (
              fullName.includes(employeeSearchValue) ||
              member.email.toLowerCase().includes(employeeSearchValue) ||
              member.phoneNumber.toLowerCase().includes(employeeSearchValue) ||
              (normalizedEmployeePhoneSearch.length > 0 &&
                memberPhone.includes(normalizedEmployeePhoneSearch))
            );
          })
          .slice(0, 8);
  const filteredTeamMembers = teamMembers.filter((member) => {
    const fullName = `${member.name} ${member.surname}`.toLowerCase();
    const memberPhone = normalizePhoneSearch(member.phoneNumber);
    const matchesSearch =
      employeeSearchValue.length === 0 ||
      fullName.includes(employeeSearchValue) ||
      member.email.toLowerCase().includes(employeeSearchValue) ||
      member.phoneNumber.toLowerCase().includes(employeeSearchValue) ||
      (normalizedEmployeePhoneSearch.length > 0 &&
        memberPhone.includes(normalizedEmployeePhoneSearch));
    const matchesJob = employeeJobFilter === "all" || member.role === employeeJobFilter;
    const matchesProject =
      employeeProjectFilter === "all" ||
      member.projectIds.includes(Number(employeeProjectFilter));

    return matchesSearch && matchesJob && matchesProject;
  });

  useEffect(() => {
    if (authUser?.role === "user" && activeView === "dependents") {
      setActiveView("dashboard");
    }
  }, [activeView, authUser]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setAuthUser(user);
        setAuthStatus(user ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        setAuthUser(null);
        setAuthStatus("unauthenticated");
      });
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setIsSubmittingLogin(true);

    try {
      const user = await login(loginEmail, loginPassword);
      setAuthUser(user);
      setAuthStatus("authenticated");
      setLoginPassword("");
      setIsAccountMenuOpen(false);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmittingLogin(false);
    }
  }

  async function handleLogout() {
    await logout();
    setAuthUser(null);
    setAuthStatus("unauthenticated");
    setIsAccountMenuOpen(false);
  }

  function handleNavigation(viewId: ViewId) {
    if (authUser?.role === "user" && viewId === "dependents") {
      return;
    }

    setActiveView(viewId);
  }

  function canOpenProject(projectId: number) {
    return accessibleProjectIds.includes(projectId);
  }

  if (authStatus === "checking") {
    return (
      <main className="login-screen">
        <section className="login-card">
          <p className="eyebrow">TaaS Pulse</p>
          <h1>Checking session</h1>
          <p>Preparing your workspace access.</p>
        </section>
      </main>
    );
  }

  if (!authUser) {
    return (
      <main className="login-screen">
        <section className="login-card" aria-labelledby="login-title">
          <div>
            <p className="eyebrow">Customer Portal</p>
            <h1 id="login-title">Sign in to TaaS Pulse</h1>
            <p>
              Access is required before viewing dashboards, employees, teams, projects,
              or sprint tasks.
            </p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                autoComplete="email"
                name="email"
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                autoComplete="current-password"
                name="password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
              />
            </label>

            {loginError && <p className="form-error">{loginError}</p>}

            <button type="submit" disabled={isSubmittingLogin}>
              {isSubmittingLogin ? "Checking..." : "Sign in"}
            </button>
          </form>

          <div className="demo-accounts">
            <strong>Local demo accounts</strong>
            <span>Admin: admin@taaspulse.local / AdminPass!2026</span>
            <span>User: user@taaspulse.local / UserPass!2026</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand-block">
          <span>TaaS</span>
          <strong>Pulse</strong>
        </div>

        <nav className="fast-nav" aria-label="Fast navigation">
          {navigationItems.map((item) => (
            <button
              className={[
                "nav-item",
                activeView === item.id ? "nav-item--active" : "",
                authUser.role === "user" && item.id === "dependents" ? "nav-item--disabled" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={authUser.role === "user" && item.id === "dependents"}
              key={item.id}
              type="button"
              onClick={() => handleNavigation(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.helper}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="app-shell">
        <header className="app-header">
          <div className="app-header__main">
            <p className="eyebrow">Customer Portal</p>
            <h1>TaaS Pulse Workspace</h1>
            <span>
              {selectedProject.clientName} / {selectedProject.name}
            </span>
          </div>

          <div className="app-header__actions">
            <button className="ghost-button" type="button">
              Export report
            </button>

            <div className="account-menu">
              <button
                className="account-trigger"
                type="button"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
              >
                <span className="account-avatar">{authUser.displayName.charAt(0)}</span>
                <span>
                  <strong>{authUser.displayName}</strong>
                  <small>{authUser.role}</small>
                </span>
                <span className="account-caret">v</span>
              </button>

              {isAccountMenuOpen && (
                <div className="account-dropdown" role="menu">
                  <div className="account-dropdown__summary">
                    <strong>{authUser.displayName}</strong>
                    <span>{authUser.email}</span>
                  </div>

                  <button type="button" role="menuitem" onClick={() => handleNavigation("dashboard")}>
                    Dashboard
                  </button>
                  <button type="button" role="menuitem" onClick={() => handleNavigation("projects")}>
                    Project overview
                  </button>

                  {authUser.role === "admin" && (
                    <button type="button" role="menuitem" onClick={() => handleNavigation("team")}>
                      Admin team tools
                    </button>
                  )}

                  <div className="account-dropdown__separator" />

                  <button className="danger-menu-item" type="button" role="menuitem" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeView === "dashboard" && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Dashboard"
              title={selectedProject.name}
              description="A compact project-health dashboard for tracking budget, sprint progress, team capacity, and delivery risk."
            />

            <section className="metrics-grid" aria-label="Project metrics">
              <MetricCard
                label="Budget used"
                value={`${budgetUsage}%`}
                helper={`${selectedProject.usedHours} of ${selectedProject.budgetHours} hours`}
                tone={budgetUsage > 70 ? "warning" : "neutral"}
              />
              <MetricCard
                label="Task completion"
                value={`${taskCompletion}%`}
                helper={`${selectedProjectTasks.filter((task) => task.status === "Done").length} of ${selectedProjectTasks.length} tasks done`}
                tone="success"
              />
              <MetricCard
                label="Weekly capacity"
                value={`${totalCapacity}h`}
                helper={`${teamMembers.length} people assigned`}
              />
              <MetricCard
                label="Delivery risk"
                value={deliveryRisk}
                helper={`Project status: ${selectedProject.status}`}
                tone={deliveryRisk === "Medium" ? "warning" : "neutral"}
              />
            </section>

            <section className="sprint-summary">
              <div>
                <p className="eyebrow">Current sprint</p>
                <h2>{sprint.name}</h2>
                <p>{sprint.goal}</p>
              </div>
              <span>
                {sprint.startDate} to {sprint.endDate}
              </span>
            </section>
          </>
        )}

        {activeView === "dependents" && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Dependents Info"
              title="Employee directory"
              description="People available for project delivery, with contact data, job information, and capacity."
            />

            <section className="filter-panel" aria-label="Employee filters">
              <div className="autocomplete-field">
                <label htmlFor="employee-search">Search</label>
                <input
                  id="employee-search"
                  type="search"
                  value={employeeSearch}
                  onBlur={() => setIsEmployeeAutocompleteOpen(false)}
                  onChange={(event) => {
                    setEmployeeSearch(event.target.value);
                    setIsEmployeeAutocompleteOpen(true);
                  }}
                  onFocus={() => setIsEmployeeAutocompleteOpen(true)}
                  placeholder="Name, email, phone"
                />

                {isEmployeeAutocompleteOpen && employeeSuggestions.length > 0 && (
                  <div className="autocomplete-list" role="listbox">
                    {employeeSuggestions.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        role="option"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setEmployeeSearch(`${member.name} ${member.surname}`);
                          setIsEmployeeAutocompleteOpen(false);
                        }}
                      >
                        <strong>
                          {member.name} {member.surname}
                        </strong>
                        <span>{member.email}</span>
                        <small>{member.phoneNumber}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label>
                Job
                <select
                  value={employeeJobFilter}
                  onChange={(event) => setEmployeeJobFilter(event.target.value)}
                >
                  <option value="all">All jobs</option>
                  {jobOptions.map((job) => (
                    <option key={job} value={job}>
                      {job}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Project
                <select
                  value={employeeProjectFilter}
                  onChange={(event) => setEmployeeProjectFilter(event.target.value)}
                >
                  <option value="all">All projects</option>
                  {projects.map((projectItem) => (
                    <option key={projectItem.id} value={projectItem.id}>
                      {projectItem.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  setEmployeeSearch("");
                  setIsEmployeeAutocompleteOpen(false);
                  setEmployeeJobFilter("all");
                  setEmployeeProjectFilter("all");
                }}
              >
                Reset
              </button>
            </section>

            <p className="result-summary">
              Showing {filteredTeamMembers.length} of {teamMembers.length} employees.
            </p>

            <section className="table-panel" aria-label="Employee directory">
              <div className="table-row table-row--head">
                <span>Name</span>
                <span>Job</span>
                <span>Email</span>
                <span>Phone</span>
                <span>Weekly hours</span>
              </div>

              {filteredTeamMembers.map((member) => (
                <div className="table-row" key={member.id}>
                  <span>
                    <strong>
                      {member.name} {member.surname}
                    </strong>
                    <small>{member.bio}</small>
                  </span>
                  <span>
                    {member.role}
                    <small>{member.hourlyWage} EUR/hour</small>
                  </span>
                  <span>{member.email}</span>
                  <span>{member.phoneNumber}</span>
                  <span>{member.weeklyCapacityHours}h</span>
                </div>
              ))}

              {filteredTeamMembers.length === 0 && (
                <div className="empty-table-state">
                  No employees match the selected filters.
                </div>
              )}
            </section>
          </>
        )}

        {activeView === "team" && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Team Info"
              title={visibleTeam.name}
              description="Team view for understanding ownership, capacity, focus area, and project assignment."
            />

            <section className="detail-grid">
              <article className="detail-panel">
                <p className="eyebrow">Focus area</p>
                <h2>{visibleTeam.focusArea}</h2>
                <p>{visibleTeam.notes}</p>
              </article>

              <article className="detail-panel">
                <p className="eyebrow">Team lead</p>
                <h2>
                  {teamLead ? `${teamLead.name} ${teamLead.surname}` : "No lead assigned"}
                </h2>
                <p>{teamLead?.role}</p>
              </article>

              <article className="detail-panel">
                <p className="eyebrow">Capacity</p>
                <h2>{totalCapacity}h/week</h2>
                <p>{visibleTeam.memberIds.length} people in this team.</p>
              </article>
            </section>
          </>
        )}

        {activeView === "projects" && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Projects"
              title="Client delivery overview"
              description={
                isAdmin
                  ? "Admin users can open every client project."
                  : "Projects outside your assignment are visible but locked."
              }
            />

            <section className="project-list" aria-label="Project access list">
              {projects.map((projectItem) => {
                const isAccessible = canOpenProject(projectItem.id);

                return (
                  <button
                    className={[
                      "project-access-card",
                      selectedProject.id === projectItem.id ? "project-access-card--active" : "",
                      !isAccessible ? "project-access-card--locked" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={!isAccessible}
                    key={projectItem.id}
                    type="button"
                    onClick={() => setSelectedProjectId(projectItem.id)}
                  >
                    <span className="eyebrow">{projectItem.clientName}</span>
                    <strong>{projectItem.name}</strong>
                    <span>{projectItem.description}</span>
                    <small>
                      {isAccessible ? `Deadline: ${projectItem.deadline}` : "Locked: not assigned"}
                    </small>
                  </button>
                );
              })}
            </section>
          </>
        )}

        {activeView === "tasks" && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Task Board"
              title="Sprint execution"
              description="A quick board for seeing what is open, in progress, under review, and done."
            />
            <TaskBoard tasks={selectedProjectTasks} teamMembers={teamMembers} />
          </>
        )}

        <footer className="app-footer">
          <span>(c) 2026 TaaS Pulse</span>
          <a href="#terms">Terms of Service</a>
          <a href="#privacy">Privacy Notice</a>
          <a href="#security">Security Info</a>
          <span>Demo system. Do not use real credentials.</span>
        </footer>
      </main>
    </div>
  );
}

type PageHeaderProps = {
  currentProject: typeof project;
  eyebrow: string;
  title: string;
  description: string;
};

function normalizePhoneSearch(value: string) {
  return value.replace(/\D/g, "");
}

function PageHeader({ currentProject, eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="project-status">
        <span>Client</span>
        <strong>{currentProject.clientName}</strong>
        <small>Deadline: {currentProject.deadline}</small>
      </div>
    </header>
  );
}

export default App;
