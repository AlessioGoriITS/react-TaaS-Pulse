import { useMemo, useState } from "react";
import { MetricCard } from "./components/MetricCard";
import { TaskBoard } from "./components/TaskBoard";
import { project, sprint, tasks, teamMembers, teams } from "./data/demoData";
import {
  getBudgetUsagePercent,
  getDeliveryRisk,
  getTaskCompletionPercent
} from "./lib/projectMetrics";
import type { ViewId } from "./types";

const navigationItems: Array<{ id: ViewId; label: string; helper: string }> = [
  { id: "dashboard", label: "Dashboard", helper: "Project health" },
  { id: "dependents", label: "Dependents Info", helper: "People directory" },
  { id: "team", label: "Team Info", helper: "Squads and capacity" },
  { id: "projects", label: "Projects", helper: "Client delivery" },
  { id: "tasks", label: "Task Board", helper: "Sprint execution" }
];

function App() {
  const [activeView, setActiveView] = useState<ViewId>("dashboard");

  const budgetUsage = useMemo(() => getBudgetUsagePercent(project), []);
  const taskCompletion = useMemo(() => getTaskCompletionPercent(tasks), []);
  const deliveryRisk = useMemo(() => getDeliveryRisk(project, tasks), []);
  const totalCapacity = teamMembers.reduce(
    (total, member) => total + member.weeklyCapacityHours,
    0
  );
  const activeTeam = teams[0];
  const teamLead = teamMembers.find((member) => member.id === activeTeam.leadId);

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
