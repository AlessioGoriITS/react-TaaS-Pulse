export type ProjectStatus = "On Track" | "At Risk" | "Blocked";

export type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  weeklyCapacityHours: number;
};

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  assigneeId: number;
  estimateHours: number;
  spentHours: number;
  priority: "Low" | "Medium" | "High";
};

export type Sprint = {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
};

export type Project = {
  id: number;
  name: string;
  clientName: string;
  budgetHours: number;
  usedHours: number;
  deadline: string;
  status: ProjectStatus;
};
