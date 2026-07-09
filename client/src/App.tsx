import { FormEvent, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login, logout } from "./api/auth";
import { MetricCard } from "./components/MetricCard";
import { TaskBoard } from "./components/TaskBoard";
import { project, sprint, tasks, teamMembers, teams } from "./data/demoData";
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
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("admin@taaspulse.local");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const budgetUsage = useMemo(() => getBudgetUsagePercent(project), []);
  const taskCompletion = useMemo(() => getTaskCompletionPercent(tasks), []);
  const deliveryRisk = useMemo(() => getDeliveryRisk(project, tasks), []);
  const totalCapacity = teamMembers.reduce(
    (total, member) => total + member.weeklyCapacityHours,
    0
  );
  const activeTeam = teams[0];
  const teamLead = teamMembers.find((member) => member.id === activeTeam.leadId);

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
              className={activeView === item.id ? "nav-item nav-item--active" : "nav-item"}
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
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
              {project.clientName} / {project.name}
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

                  <button type="button" role="menuitem" onClick={() => setActiveView("dashboard")}>
                    Dashboard
                  </button>
                  <button type="button" role="menuitem" onClick={() => setActiveView("projects")}>
                    Project overview
                  </button>

                  {authUser.role === "admin" && (
                    <button type="button" role="menuitem" onClick={() => setActiveView("team")}>
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
              eyebrow="Dashboard"
              title={project.name}
              description="A compact project-health dashboard for tracking budget, sprint progress, team capacity, and delivery risk."
            />

            <section className="metrics-grid" aria-label="Project metrics">
              <MetricCard
                label="Budget used"
                value={`${budgetUsage}%`}
                helper={`${project.usedHours} of ${project.budgetHours} hours`}
                tone={budgetUsage > 70 ? "warning" : "neutral"}
              />
              <MetricCard
                label="Task completion"
                value={`${taskCompletion}%`}
                helper={`${tasks.filter((task) => task.status === "Done").length} of ${tasks.length} tasks done`}
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
                helper={`Project status: ${project.status}`}
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
              eyebrow="Dependents Info"
              title="Employee directory"
              description="People available for project delivery, with contact data, job information, and capacity."
            />

            <section className="table-panel" aria-label="Employee directory">
              <div className="table-row table-row--head">
                <span>Name</span>
                <span>Job</span>
                <span>Email</span>
                <span>Phone</span>
                <span>Weekly hours</span>
              </div>

              {teamMembers.map((member) => (
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
            </section>
          </>
        )}

        {activeView === "team" && (
          <>
            <PageHeader
              eyebrow="Team Info"
              title={activeTeam.name}
              description="Team view for understanding ownership, capacity, focus area, and project assignment."
            />

            <section className="detail-grid">
              <article className="detail-panel">
                <p className="eyebrow">Focus area</p>
                <h2>{activeTeam.focusArea}</h2>
                <p>{activeTeam.notes}</p>
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
                <p>{activeTeam.memberIds.length} people in this team.</p>
              </article>
            </section>
          </>
        )}

        {activeView === "projects" && (
          <>
            <PageHeader
              eyebrow="Projects"
              title="Client delivery overview"
              description="Project-level information used to understand budget, deadline, and delivery risk."
            />

            <section className="project-card">
              <div>
                <p className="eyebrow">{project.clientName}</p>
                <h2>{project.name}</h2>
                <p>{project.description}</p>
              </div>
              <dl>
                <div>
                  <dt>Deadline</dt>
                  <dd>{project.deadline}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{project.status}</dd>
                </div>
                <div>
                  <dt>Risk notes</dt>
                  <dd>{project.riskNotes}</dd>
                </div>
              </dl>
            </section>
          </>
        )}

        {activeView === "tasks" && (
          <>
            <PageHeader
              eyebrow="Task Board"
              title="Sprint execution"
              description="A quick board for seeing what is open, in progress, under review, and done."
            />
            <TaskBoard tasks={tasks} teamMembers={teamMembers} />
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
  eyebrow: string;
  title: string;
  description: string;
};

function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="project-status">
        <span>Client</span>
        <strong>{project.clientName}</strong>
        <small>Deadline: {project.deadline}</small>
      </div>
    </header>
  );
}

export default App;
