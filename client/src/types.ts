export type ProjectStatus = "On Track" | "At Risk" | "Blocked";

export type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";

export type ViewId = "dashboard" | "dependents" | "team" | "projects" | "sprints" | "tasks";

export type UserRole = "admin" | "user";

export type AuthUser = {
  email: string;
  displayName: string;
  role: UserRole;
  employeeId: number | null;
};

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
  projectId: number;
  sprintId: number;
  title: string;
  status: TaskStatus;
  assigneeId: number;
  estimateHours: number;
  spentHours: number;
  priority: "Low" | "Medium" | "High";
};

export type Sprint = {
  id: number;
  projectId: number;
  name: string;
  goal: string;
  longDescription?: string;
  startDate: string;
  endDate: string;
  status: "Planned" | "Active" | "Completed" | "Blocked";
};

export type Project = {
  id: number;
  name: string;
  clientName: string;
  description: string;
  longDescription?: string;
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
