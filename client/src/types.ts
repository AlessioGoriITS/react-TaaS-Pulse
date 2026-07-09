export type ProjectStatus = "On Track" | "At Risk" | "Blocked";

export type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";

export type ViewId = "dashboard" | "dependents" | "team" | "projects" | "tasks";

export type TeamMember = {
  id: number;
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  role: string;
  hourlyWage: number;
  weeklyCapacityHours: number;
  projectIds: number[];
  bio: string;
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
  description: string;
  budgetHours: number;
  usedHours: number;
  deadline: string;
  status: ProjectStatus;
  riskNotes: string;
};

export type Team = {
  id: number;
  name: string;
  focusArea: string;
  leadId: number;
  memberIds: number[];
  projectIds: number[];
  notes: string;
};
