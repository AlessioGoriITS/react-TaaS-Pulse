import type { Project, Sprint, Task, Team, TeamMember } from "../types";

export const project: Project = {
  id: 1,
  name: "Customer Portal Refresh",
  clientName: "Northwind Labs",
  description: "Refresh the customer portal dashboard and reporting workflow.",
  budgetHours: 420,
  usedHours: 236,
  deadline: "2026-08-21",
  status: "At Risk",
  riskNotes: "Budget usage is moving faster than task completion."
};

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Ari",
    surname: "Chen",
    email: "ari.chen@example.com",
    phoneNumber: "+39 333 010 1001",
    role: "Frontend Developer",
    hourlyWage: 45,
    weeklyCapacityHours: 32,
    projectIds: [1],
    bio: "Owns dashboard UI implementation."
  },
  {
    id: 2,
    name: "Marta",
    surname: "Rossi",
    email: "marta.rossi@example.com",
    phoneNumber: "+39 333 010 1002",
    role: "Backend Developer",
    hourlyWage: 50,
    weeklyCapacityHours: 30,
    projectIds: [1],
    bio: "Owns API design and data modeling."
  },
  {
    id: 3,
    name: "Jon",
    surname: "Bell",
    email: "jon.bell@example.com",
    phoneNumber: "+39 333 010 1003",
    role: "Product Designer",
    hourlyWage: 42,
    weeklyCapacityHours: 18,
    projectIds: [1],
    bio: "Reviews user experience and empty states."
  },
  {
    id: 4,
    name: "Lea",
    surname: "Singh",
    email: "lea.singh@example.com",
    phoneNumber: "+39 333 010 1004",
    role: "QA Engineer",
    hourlyWage: 38,
    weeklyCapacityHours: 24,
    projectIds: [1],
    bio: "Owns regression checks and risk validation."
  }
];

export const teams: Team[] = [
  {
    id: 1,
    name: "Portal Delivery Squad",
    focusArea: "Customer-facing product delivery",
    leadId: 2,
    memberIds: [1, 2, 3, 4],
    projectIds: [1],
    notes: "Small cross-functional team covering frontend, backend, UX, and QA."
  }
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
