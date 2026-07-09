import type { Project, Sprint, Task, TeamMember } from "../types";

export const project: Project = {
  id: 1,
  name: "Customer Portal Refresh",
  clientName: "Northwind Labs",
  budgetHours: 420,
  usedHours: 236,
  deadline: "2026-08-21",
  status: "At Risk"
};

export const teamMembers: TeamMember[] = [
  { id: 1, name: "Ari Chen", role: "Frontend Developer", weeklyCapacityHours: 32 },
  { id: 2, name: "Marta Rossi", role: "Backend Developer", weeklyCapacityHours: 30 },
  { id: 3, name: "Jon Bell", role: "Product Designer", weeklyCapacityHours: 18 },
  { id: 4, name: "Lea Singh", role: "QA Engineer", weeklyCapacityHours: 24 }
];

export const sprint: Sprint = {
  id: 1,
  name: "Sprint 4",
  goal: "Stabilize the dashboard and finish the reporting flow.",
  startDate: "2026-07-06",
  endDate: "2026-07-17"
};

export const tasks: Task[] = [
  {
    id: 1,
    title: "Build dashboard summary cards",
    status: "Done",
    assigneeId: 1,
    estimateHours: 10,
    spentHours: 9,
    priority: "High"
  },
  {
    id: 2,
    title: "Define project report API shape",
    status: "In Progress",
    assigneeId: 2,
    estimateHours: 14,
    spentHours: 11,
    priority: "High"
  },
  {
    id: 3,
    title: "Review task board empty states",
    status: "Review",
    assigneeId: 3,
    estimateHours: 6,
    spentHours: 5,
    priority: "Medium"
  },
  {
    id: 4,
    title: "Add risk calculation tests",
    status: "Todo",
    assigneeId: 4,
    estimateHours: 8,
    spentHours: 0,
    priority: "Medium"
  },
  {
    id: 5,
    title: "Prepare demo data for interview walkthrough",
    status: "Todo",
    assigneeId: 1,
    estimateHours: 5,
    spentHours: 0,
    priority: "Low"
  }
];
