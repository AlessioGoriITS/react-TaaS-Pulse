import { useMemo } from "react";
import { MetricCard } from "./components/MetricCard";
import { TaskBoard } from "./components/TaskBoard";
import { project, sprint, tasks, teamMembers } from "./data/demoData";
import {
  getBudgetUsagePercent,
  getDeliveryRisk,
  getTaskCompletionPercent
} from "./lib/projectMetrics";

function App() {
  const budgetUsage = useMemo(() => getBudgetUsagePercent(project), []);
  const taskCompletion = useMemo(() => getTaskCompletionPercent(tasks), []);
  const deliveryRisk = useMemo(() => getDeliveryRisk(project, tasks), []);
  const totalCapacity = teamMembers.reduce(
    (total, member) => total + member.weeklyCapacityHours,
    0
  );

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">TaaS Pulse</p>
          <h1>{project.name}</h1>
          <p>
            A compact project-health dashboard for tracking budget, sprint progress,
            team capacity, and delivery risk.
          </p>
        </div>
        <div className="project-status">
          <span>Client</span>
          <strong>{project.clientName}</strong>
          <small>Deadline: {project.deadline}</small>
        </div>
      </header>

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
          helper={`${teamMembers.length} team members assigned`}
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

      <TaskBoard tasks={tasks} teamMembers={teamMembers} />
    </main>
  );
}

export default App;
