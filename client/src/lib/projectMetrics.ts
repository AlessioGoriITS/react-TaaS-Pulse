import type { Project, Task } from "../types";

export function getBudgetUsagePercent(project: Project) {
  return Math.round((project.usedHours / project.budgetHours) * 100);
}

export function getTaskCompletionPercent(tasks: Task[]) {
  if (tasks.length === 0) {
    return 0;
  }

  const doneTasks = tasks.filter((task) => task.status === "Done").length;
  return Math.round((doneTasks / tasks.length) * 100);
}

export function getDeliveryRisk(project: Project, tasks: Task[]) {
  const budgetUsage = getBudgetUsagePercent(project);
  const taskCompletion = getTaskCompletionPercent(tasks);

  if (project.status === "Blocked" || budgetUsage >= 90) {
    return "High";
  }

  if (project.status === "At Risk" || budgetUsage > taskCompletion + 25) {
    return "Medium";
  }

  return "Low";
}
