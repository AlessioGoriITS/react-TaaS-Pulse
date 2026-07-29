import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";
import { getCurrentUser, login, logout } from "./api/auth";
import {
  deleteEmployee,
  deleteProject,
  deleteSprint,
  getWorkspace,
  saveEmployee,
  saveProject,
  saveSprint,
  saveTeam,
  type WorkspaceData
} from "./api/workspace";
import { MetricCard } from "./components/MetricCard";
import { TaskBoard } from "./components/TaskBoard";
import {
  projects as initialProjects,
  sprints as initialSprints,
  tasks as initialTasks,
  teamMembers as initialTeamMembers,
  teams as initialTeams
} from "./data/demoData";
import {
  getBudgetUsagePercent,
  getDeliveryRisk,
  getTaskCompletionPercent
} from "./lib/projectMetrics";
import type { AuthUser, Project, Sprint, Task, Team, TeamMember, ViewId } from "./types";

const defaultProject = initialProjects[0];
const defaultSprint = initialSprints[0];
const defaultTeamMember = initialTeamMembers[0];
const defaultTeam = initialTeams[0];
const defaultDefinitionOfDone = "Code reviewed, tested, documented, and ready for demo.";

const navigationItems: Array<{ id: ViewId; label: string; helper: string }> = [
  { id: "dashboard", label: "Overview", helper: "Portfolio health" },
  { id: "projects", label: "Projects", helper: "Client delivery" },
  { id: "sprints", label: "Sprints", helper: "Planning cycles" },
  { id: "tasks", label: "Tasks", helper: "Sprint execution" },
  { id: "dependents", label: "People", helper: "Team directory" },
  { id: "team", label: "Teams", helper: "Capacity and roles" },
  { id: "admin", label: "Data management", helper: "Workspace settings" }
];

type AuthStatus = "checking" | "authenticated" | "unauthenticated";
type DashboardInsightId =
  | "portfolio-projects"
  | "portfolio-tasks"
  | "portfolio-capacity"
  | "portfolio-budget"
  | "portfolio-risk"
  | "portfolio-completion"
  | "portfolio-workload"
  | "employee-projects"
  | "employee-tasks"
  | "employee-load"
  | "employee-priority"
  | "employee-completion"
  | "employee-teams"
  | "focused-sprint"
  | `person:${number}`;

function App() {
  const dashboardDrawerRef = useRef<HTMLElement>(null);
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProject.id);
  const [dashboardProjectId, setDashboardProjectId] = useState(defaultProject.id);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [workspaceError, setWorkspaceError] = useState("");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [dashboardInsightId, setDashboardInsightId] =
    useState<DashboardInsightId | null>(null);
  const [dashboardInsightHistory, setDashboardInsightHistory] =
    useState<DashboardInsightId[]>([]);
  const isDashboardDrawerOpen = dashboardInsightId !== null;
  const detailOriginScrollRef = useRef(0);
  const [loginEmail, setLoginEmail] = useState("admin@taaspulse.local");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isEmployeeAutocompleteOpen, setIsEmployeeAutocompleteOpen] = useState(false);
  const [employeeJobFilter, setEmployeeJobFilter] = useState("all");
  const [employeeProjectFilter, setEmployeeProjectFilter] = useState("all");
  const [openedDependentId, setOpenedDependentId] = useState<number | null>(null);
  const [teamMemberRecords, setTeamMemberRecords] =
    useState<TeamMember[]>(initialTeamMembers);
  const [teamRecords, setTeamRecords] = useState<Team[]>(initialTeams);
  const [selectedTeamId, setSelectedTeamId] = useState(defaultTeam.id);
  const [projectRecords, setProjectRecords] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projectSearch, setProjectSearch] = useState("");
  const [openedProjectId, setOpenedProjectId] = useState<number | null>(null);
  const [sprintSearch, setSprintSearch] = useState("");
  const [sprintRecords, setSprintRecords] = useState<Sprint[]>(initialSprints);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [openedSprintId, setOpenedSprintId] = useState<number | null>(null);
  const [sprintFormMode, setSprintFormMode] = useState<"create" | "edit">("create");
  const [editedSprintId, setEditedSprintId] = useState(String(defaultSprint.id));
  const [newSprintProjectId, setNewSprintProjectId] = useState(String(defaultProject.id));
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");
  const [newSprintDescription, setNewSprintDescription] = useState("");
  const [newSprintStartDate, setNewSprintStartDate] = useState("");
  const [newSprintEndDate, setNewSprintEndDate] = useState("");
  const [newSprintStatus, setNewSprintStatus] = useState<Sprint["status"]>("Planned");
  const [newSprintCapacityHours, setNewSprintCapacityHours] = useState("80");
  const [newSprintFocus, setNewSprintFocus] = useState("Feature delivery");
  const [newSprintDefinitionOfDone, setNewSprintDefinitionOfDone] =
    useState(defaultDefinitionOfDone);
  const [newSprintRisks, setNewSprintRisks] = useState("");
  const [newSprintBacklogNotes, setNewSprintBacklogNotes] = useState("");
  const [sprintCreatorMessage, setSprintCreatorMessage] = useState("");
  const [adminEditSection, setAdminEditSection] =
    useState<"sprints" | "projects" | "teams" | "dependents">("sprints");
  const [projectFormMode, setProjectFormMode] = useState<"create" | "edit">("edit");
  const [editedProjectId, setEditedProjectId] = useState(String(defaultProject.id));
  const [editedProjectName, setEditedProjectName] = useState(defaultProject.name);
  const [editedProjectClientName, setEditedProjectClientName] = useState(defaultProject.clientName);
  const [editedProjectDescription, setEditedProjectDescription] = useState(
    defaultProject.description
  );
  const [editedProjectLongDescription, setEditedProjectLongDescription] = useState(
    defaultProject.longDescription ?? ""
  );
  const [editedProjectBudgetHours, setEditedProjectBudgetHours] = useState(
    String(defaultProject.budgetHours)
  );
  const [editedProjectUsedHours, setEditedProjectUsedHours] = useState(
    String(defaultProject.usedHours)
  );
  const [editedProjectDeadline, setEditedProjectDeadline] = useState(defaultProject.deadline);
  const [editedProjectStatus, setEditedProjectStatus] = useState<Project["status"]>(
    defaultProject.status
  );
  const [editedProjectRiskNotes, setEditedProjectRiskNotes] = useState(defaultProject.riskNotes);
  const [projectEditorMessage, setProjectEditorMessage] = useState("");
  const [dependentFormMode, setDependentFormMode] = useState<"create" | "edit">("edit");
  const [editedDependentId, setEditedDependentId] = useState(String(defaultTeamMember.id));
  const [dependentName, setDependentName] = useState(defaultTeamMember.name);
  const [dependentSurname, setDependentSurname] = useState(defaultTeamMember.surname);
  const [dependentEmail, setDependentEmail] = useState(defaultTeamMember.email);
  const [dependentPhoneNumber, setDependentPhoneNumber] = useState(defaultTeamMember.phoneNumber);
  const [dependentRole, setDependentRole] = useState(defaultTeamMember.role);
  const [dependentHourlyWage, setDependentHourlyWage] = useState(
    String(defaultTeamMember.hourlyWage)
  );
  const [dependentWeeklyCapacityHours, setDependentWeeklyCapacityHours] = useState(
    String(defaultTeamMember.weeklyCapacityHours)
  );
  const [dependentProjectIds, setDependentProjectIds] = useState<string[]>(
    defaultTeamMember.projectIds.map(String)
  );
  const [dependentBio, setDependentBio] = useState(defaultTeamMember.bio);
  const [dependentEditorMessage, setDependentEditorMessage] = useState("");
  const [teamFormMode, setTeamFormMode] = useState<"create" | "edit">("edit");
  const [editedTeamId, setEditedTeamId] = useState(String(defaultTeam.id));
  const [teamName, setTeamName] = useState(defaultTeam.name);
  const [teamFocusArea, setTeamFocusArea] = useState(defaultTeam.focusArea);
  const [teamLeadId, setTeamLeadId] = useState(String(defaultTeam.leadId));
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>(
    defaultTeam.memberIds.map(String)
  );
  const [teamProjectIds, setTeamProjectIds] = useState<string[]>(
    defaultTeam.projectIds.map(String)
  );
  const [teamNotes, setTeamNotes] = useState(defaultTeam.notes);
  const [teamEditorMessage, setTeamEditorMessage] = useState("");

  const isAdmin = authUser?.role === "admin";
  const activeNavigationItem =
    navigationItems.find((item) => item.id === activeView) ?? navigationItems[0];
  const loggedEmployee = authUser?.employeeId
    ? teamMemberRecords.find((member) => member.id === authUser.employeeId)
    : undefined;
  const accessibleProjectIds = isAdmin
    ? projectRecords.map((projectItem) => projectItem.id)
    : loggedEmployee?.projectIds ?? [];
  const selectedProject =
    projectRecords.find(
      (projectItem) =>
        projectItem.id === selectedProjectId && accessibleProjectIds.includes(projectItem.id)
    ) ??
    projectRecords.find((projectItem) => accessibleProjectIds.includes(projectItem.id)) ??
    projectRecords[0];
  const selectedProjectSprints = sprintRecords.filter(
    (sprintItem) => sprintItem.projectId === selectedProject.id
  );
  const selectedProjectTasks = tasks.filter((task) => task.projectId === selectedProject.id);
  const selectedSprint =
    selectedProjectSprints.find((sprintItem) => sprintItem.id === selectedSprintId) ?? null;
  const selectedSprintTasks = selectedSprint
    ? selectedProjectTasks.filter((task) => task.sprintId === selectedSprint.id)
    : selectedProjectTasks;
  const visibleTeam =
    isAdmin || !loggedEmployee
      ? teamRecords.find((team) => team.id === selectedTeamId) ?? teamRecords[0]
      : teamRecords.find((team) => team.memberIds.includes(loggedEmployee.id)) ?? teamRecords[0];
  const visibleTeamMembers = teamMemberRecords.filter((member) =>
    visibleTeam.memberIds.includes(member.id)
  );

  const totalCapacity = visibleTeamMembers.reduce(
    (total, member) => total + member.weeklyCapacityHours,
    0
  );
  const teamLead = teamMemberRecords.find((member) => member.id === visibleTeam.leadId);
  const jobOptions = Array.from(new Set(teamMemberRecords.map((member) => member.role))).sort();
  const employeeSearchValue = employeeSearch.trim().toLowerCase();
  const normalizedEmployeePhoneSearch = normalizePhoneSearch(employeeSearch);
  const employeeSuggestions =
    employeeSearchValue.length === 0
      ? []
      : teamMemberRecords
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
  const filteredTeamMembers = teamMemberRecords.filter((member) => {
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
  const openedDependent = openedDependentId
    ? teamMemberRecords.find((member) => member.id === openedDependentId)
    : undefined;
  const openedDependentProjects = openedDependent
    ? projectRecords.filter((projectItem) => openedDependent.projectIds.includes(projectItem.id))
    : [];
  const openedDependentTeams = openedDependent
    ? teamRecords.filter((team) => team.memberIds.includes(openedDependent.id))
    : [];
  const openedDependentTasks = openedDependent
    ? tasks.filter((task) => task.assigneeId === openedDependent.id)
    : [];
  const projectSearchValue = projectSearch.trim().toLowerCase();
  const filteredProjects = projectRecords.filter((projectItem) => {
    if (projectSearchValue.length === 0) {
      return true;
    }

    return (
      projectItem.name.toLowerCase().includes(projectSearchValue) ||
      projectItem.clientName.toLowerCase().includes(projectSearchValue)
    );
  });
  const openedProject = openedProjectId
    ? projectRecords.find((projectItem) => projectItem.id === openedProjectId)
    : undefined;
  const openedProjectTeam = openedProject
    ? teamRecords.find((team) => team.projectIds.includes(openedProject.id))
    : undefined;
  const openedProjectTeamMembers = openedProjectTeam
    ? teamMemberRecords.filter((member) => openedProjectTeam.memberIds.includes(member.id))
    : [];
  const openedProjectSprints = openedProject
    ? sprintRecords.filter((sprintItem) => sprintItem.projectId === openedProject.id)
    : [];
  const sprintSearchValue = sprintSearch.trim().toLowerCase();
  const filteredSprints = sprintRecords.filter((sprintItem) => {
    const sprintProject = projectRecords.find(
      (projectItem) => projectItem.id === sprintItem.projectId
    );

    if (sprintSearchValue.length === 0) {
      return true;
    }

    return (
      sprintItem.name.toLowerCase().includes(sprintSearchValue) ||
      sprintItem.goal.toLowerCase().includes(sprintSearchValue) ||
      (sprintProject?.name.toLowerCase().includes(sprintSearchValue) ?? false) ||
      (sprintProject?.clientName.toLowerCase().includes(sprintSearchValue) ?? false)
    );
  });
  const openedSprint = openedSprintId
    ? sprintRecords.find((sprintItem) => sprintItem.id === openedSprintId)
    : undefined;
  const openedSprintProject = openedSprint
    ? projectRecords.find((projectItem) => projectItem.id === openedSprint.projectId)
    : undefined;
  const openedSprintTeam = openedSprintProject
    ? teamRecords.find((team) => team.projectIds.includes(openedSprintProject.id))
    : undefined;
  const openedSprintTeamMembers = openedSprintTeam
    ? teamMemberRecords.filter((member) => openedSprintTeam.memberIds.includes(member.id))
    : [];
  const openedSprintTasks = openedSprint
    ? tasks.filter((task) => task.sprintId === openedSprint.id)
    : [];
  const selectedProjectTeam = teamRecords.find((team) => team.projectIds.includes(selectedProject.id));
  const selectedProjectTeamMembers = selectedProjectTeam
    ? teamMemberRecords.filter((member) => selectedProjectTeam.memberIds.includes(member.id))
    : [];
  const sprintExecutionTitle = selectedSprint ? selectedSprint.name : "All sprint work";
  const sprintExecutionGoal = selectedSprint
    ? selectedSprint.goal
    : "Portfolio view for every sprint task assigned to this project.";
  const sprintExecutionDateRange = selectedSprint
    ? `${selectedSprint.startDate} to ${selectedSprint.endDate}`
    : `${selectedProjectSprints.length} sprints in scope`;
  const sprintEstimateHours = selectedSprintTasks.reduce(
    (total, task) => total + task.estimateHours,
    0
  );
  const sprintSpentHours = selectedSprintTasks.reduce((total, task) => total + task.spentHours, 0);
  const sprintCompletion = getTaskCompletionPercent(selectedSprintTasks);
  const openHighPriorityTasks = selectedSprintTasks.filter(
    (task) => task.priority === "High" && task.status !== "Done"
  );
  const activeTaskCount = selectedSprintTasks.filter((task) =>
    ["In Progress", "Review"].includes(task.status)
  ).length;
  const sprintStatusBreakdown = [
    { label: "Todo", count: selectedSprintTasks.filter((task) => task.status === "Todo").length },
    {
      label: "In progress",
      count: selectedSprintTasks.filter((task) => task.status === "In Progress").length
    },
    {
      label: "Review",
      count: selectedSprintTasks.filter((task) => task.status === "Review").length
    },
    { label: "Done", count: selectedSprintTasks.filter((task) => task.status === "Done").length }
  ];
  const sprintTeamLoad = selectedProjectTeamMembers.map((member) => {
    const memberTasks = selectedSprintTasks.filter((task) => task.assigneeId === member.id);
    const plannedHours = memberTasks.reduce((total, task) => total + task.estimateHours, 0);

    return {
      member,
      taskCount: memberTasks.length,
      plannedHours,
      loadPercent:
        member.weeklyCapacityHours > 0
          ? Math.min(Math.round((plannedHours / member.weeklyCapacityHours) * 100), 100)
          : 0
    };
  });
  const dashboardProject =
    projectRecords.find((projectItem) => projectItem.id === dashboardProjectId) ??
    projectRecords[0];
  const dashboardProjectIndex = Math.max(
    projectRecords.findIndex((projectItem) => projectItem.id === dashboardProject.id),
    0
  );
  const dashboardProjectTasks = tasks.filter((task) => task.projectId === dashboardProject.id);
  const dashboardProjectSprints = sprintRecords.filter(
    (sprintItem) => sprintItem.projectId === dashboardProject.id
  );
  const dashboardCurrentSprint =
    dashboardProjectSprints.find((sprintItem) => sprintItem.status === "Active") ??
    dashboardProjectSprints[0] ??
    defaultSprint;
  const openDashboardTasks = dashboardProjectTasks.filter((task) => task.status !== "Done");
  const highPriorityDashboardTasks = openDashboardTasks.filter(
    (task) => task.priority === "High"
  );
  const dashboardBudgetUsage = getBudgetUsagePercent(dashboardProject);
  const dashboardTaskCompletion = getTaskCompletionPercent(dashboardProjectTasks);
  const dashboardDeliveryRisk = getDeliveryRisk(dashboardProject, dashboardProjectTasks);
  const dashboardCurrentSprintTasks = dashboardProjectTasks.filter(
    (task) => task.sprintId === dashboardCurrentSprint.id
  );
  const dashboardCurrentSprintCompletion = getTaskCompletionPercent(
    dashboardCurrentSprintTasks
  );
  const dashboardProjectTaskHours = dashboardProjectTasks.reduce(
    (total, task) => total + task.estimateHours,
    0
  );
  const dashboardProjectTeam = teamRecords.find((team) =>
    team.projectIds.includes(dashboardProject.id)
  );
  const dashboardProjectTeamMembers = dashboardProjectTeam
    ? teamMemberRecords.filter((member) => dashboardProjectTeam.memberIds.includes(member.id))
    : [];
  const dashboardTeamCapacity = dashboardProjectTeamMembers.reduce(
    (total, member) => total + member.weeklyCapacityHours,
    0
  );
  const dashboardTeamUtilization =
    dashboardTeamCapacity > 0
      ? Math.min(Math.round((dashboardProjectTaskHours / dashboardTeamCapacity) * 100), 100)
      : 0;
  const portfolioBudgetHours = projectRecords.reduce(
    (total, projectItem) => total + projectItem.budgetHours,
    0
  );
  const portfolioUsedHours = projectRecords.reduce(
    (total, projectItem) => total + projectItem.usedHours,
    0
  );
  const portfolioBudgetUsage =
    portfolioBudgetHours > 0 ? Math.round((portfolioUsedHours / portfolioBudgetHours) * 100) : 0;
  const portfolioDoneTasks = tasks.filter((task) => task.status === "Done");
  const portfolioCompletion =
    tasks.length > 0 ? Math.round((portfolioDoneTasks.length / tasks.length) * 100) : 0;
  const portfolioOpenTasks = tasks.filter((task) => task.status !== "Done");
  const atRiskProjectCount = projectRecords.filter(
    (projectItem) => projectItem.status !== "On Track"
  ).length;
  const portfolioCapacity = teamMemberRecords.reduce(
    (total, member) => total + member.weeklyCapacityHours,
    0
  );
  const portfolioPlannedHours = portfolioOpenTasks.reduce(
    (total, task) => total + task.estimateHours,
    0
  );
  const riskLabel =
    atRiskProjectCount > 0 || portfolioBudgetUsage > 75
      ? "Immediate action"
      : portfolioOpenTasks.length > portfolioDoneTasks.length
        ? "Watch closely"
        : "Portfolio healthy";
  const portfolioRiskTone =
    riskLabel === "Immediate action"
      ? "warning"
      : riskLabel === "Portfolio healthy"
        ? "positive"
        : "neutral";
  const projectHealthItems = [
    { label: "Budget", value: `${dashboardBudgetUsage}% used` },
    { label: "Progress", value: `${dashboardTaskCompletion}% complete` },
    { label: "Sprint", value: `${dashboardCurrentSprintCompletion}% complete` },
    { label: "Team load", value: `${dashboardTeamUtilization}% planned` }
  ];
  const dashboardFocusItems = [
    {
      id: "portfolio-projects" as const,
      title: "Active projects",
      value: String(projectRecords.length),
      helper: `${atRiskProjectCount} need attention`,
      icon: "projects" as const,
      tone: atRiskProjectCount > 0 ? "warning" : "positive",
      progress:
        projectRecords.length > 0
          ? Math.round(((projectRecords.length - atRiskProjectCount) / projectRecords.length) * 100)
          : 0
    },
    {
      id: "portfolio-tasks" as const,
      title: "Open work",
      value: String(portfolioOpenTasks.length),
      helper: `${portfolioCompletion}% portfolio task completion`,
      icon: "tasks" as const,
      tone: "brand",
      progress: portfolioCompletion
    },
    {
      id: "portfolio-capacity" as const,
      title: "Total capacity",
      value: `${portfolioCapacity}h`,
      helper: `${teamMemberRecords.length} people in the workspace`,
      icon: "capacity" as const,
      tone: "neutral",
      progress: Math.min(
        Math.round((portfolioPlannedHours / Math.max(portfolioCapacity, 1)) * 100),
        100
      )
    }
  ];
  const topTeamLoads = dashboardProjectTeamMembers.map((member) => {
    const assignedHours = dashboardProjectTasks
      .filter((task) => task.assigneeId === member.id)
      .reduce((total, task) => total + task.estimateHours, 0);

    return {
      member,
      assignedHours,
      loadPercent:
        member.weeklyCapacityHours > 0
          ? Math.min(Math.round((assignedHours / member.weeklyCapacityHours) * 100), 100)
          : 0
    };
  });
  const dashboardActivityItems = [
    ...highPriorityDashboardTasks.slice(0, 2).map((task) => ({
      title: task.title,
      meta: `${task.status} / ${task.priority} priority`
    })),
    ...openDashboardTasks.slice(0, 3).map((task) => ({
      title: task.title,
      meta: `${task.status} / ${task.estimateHours}h estimate`
    }))
  ].slice(0, 4);
  const employeeProjects = loggedEmployee
    ? projectRecords.filter((projectItem) => loggedEmployee.projectIds.includes(projectItem.id))
    : [];
  const employeeTasks = loggedEmployee
    ? tasks.filter((task) => task.assigneeId === loggedEmployee.id)
    : [];
  const employeeOpenTasks = employeeTasks.filter((task) => task.status !== "Done");
  const employeeDoneTasks = employeeTasks.filter((task) => task.status === "Done");
  const employeeHighPriorityTasks = employeeOpenTasks.filter((task) => task.priority === "High");
  const employeeCompletion =
    employeeTasks.length > 0 ? Math.round((employeeDoneTasks.length / employeeTasks.length) * 100) : 0;
  const employeePlannedHours = employeeOpenTasks.reduce(
    (total, task) => total + task.estimateHours,
    0
  );
  const employeeLoad =
    loggedEmployee && loggedEmployee.weeklyCapacityHours > 0
      ? Math.min(Math.round((employeePlannedHours / loggedEmployee.weeklyCapacityHours) * 100), 100)
      : 0;
  const employeeTeams = loggedEmployee
    ? teamRecords.filter((team) => team.memberIds.includes(loggedEmployee.id))
    : [];
  const employeeSprints = sprintRecords.filter((sprintItem) =>
    employeeProjects.some((projectItem) => projectItem.id === sprintItem.projectId)
  );
  const employeeActiveSprints = employeeSprints.filter(
    (sprintItem) => sprintItem.status === "Active" || sprintItem.status === "Blocked"
  );
  const employeeNextProject = [...employeeProjects].sort((firstProject, secondProject) =>
    firstProject.deadline.localeCompare(secondProject.deadline)
  )[0];
  const employeeDashboardStatus =
    employeeHighPriorityTasks.length > 0
      ? "Priority work needs you"
      : employeeOpenTasks.length > 0
        ? "Your work is in progress"
        : "All assigned work is clear";
  const employeeFocusItems = [
    {
      id: "employee-projects" as const,
      title: "My projects",
      value: String(employeeProjects.length),
      helper: employeeNextProject
        ? `Next deadline: ${formatDate(employeeNextProject.deadline)}`
        : "No assigned project",
      icon: "projects" as const,
      tone: "brand",
      progress: employeeProjects.length > 0 ? 100 : 0
    },
    {
      id: "employee-tasks" as const,
      title: "My open tasks",
      value: String(employeeOpenTasks.length),
      helper: `${employeeCompletion}% of your tasks complete`,
      icon: "tasks" as const,
      tone: employeeHighPriorityTasks.length > 0 ? "warning" : "positive",
      progress: employeeCompletion
    },
    {
      id: "employee-load" as const,
      title: "Weekly load",
      value: `${employeeLoad}%`,
      helper: loggedEmployee
        ? `${employeePlannedHours}h planned / ${loggedEmployee.weeklyCapacityHours}h capacity`
        : "No employee profile linked",
      icon: "capacity" as const,
      tone: employeeLoad > 90 ? "warning" : "neutral",
      progress: employeeLoad
    }
  ];
  const employeeImportantTasks = [
    ...employeeHighPriorityTasks,
    ...employeeOpenTasks.filter((task) => task.priority !== "High")
  ].slice(0, 5);

  function applyWorkspace(workspace: WorkspaceData) {
    setProjectRecords(workspace.projects.length > 0 ? workspace.projects : initialProjects);
    setTeamMemberRecords(
      workspace.teamMembers.length > 0 ? workspace.teamMembers : initialTeamMembers
    );
    setTeamRecords(workspace.teams.length > 0 ? workspace.teams : initialTeams);
    setSprintRecords(workspace.sprints.length > 0 ? workspace.sprints : initialSprints);
    setTasks(workspace.tasks);

    const firstProject = workspace.projects[0];
    if (firstProject) {
      setSelectedProjectId((currentId) =>
        workspace.projects.some((projectItem) => projectItem.id === currentId)
          ? currentId
          : firstProject.id
      );
      setDashboardProjectId((currentId) =>
        workspace.projects.some((projectItem) => projectItem.id === currentId)
          ? currentId
          : firstProject.id
      );
    }
  }

  useEffect(() => {
    if (authUser?.role === "user" && (activeView === "dependents" || activeView === "admin")) {
      setActiveView("dashboard");
    }
  }, [activeView, authUser]);

  useEffect(() => {
    if (
      selectedSprintId &&
      !sprintRecords.some(
        (sprintItem) =>
          sprintItem.projectId === selectedProject.id && sprintItem.id === selectedSprintId
      )
    ) {
      setSelectedSprintId(null);
    }
  }, [selectedProject.id, selectedSprintId, sprintRecords]);

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

  useEffect(() => {
    if (!authUser) {
      return;
    }

    getWorkspace()
      .then((workspace) => {
        applyWorkspace(workspace);
        setWorkspaceError("");
      })
      .catch((error) => {
        setWorkspaceError(
          error instanceof Error ? error.message : "Could not load database workspace."
        );
      });
  }, [authUser]);

  useEffect(() => {
    if (!isDashboardDrawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    function handleDrawerKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDashboardInsight();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = dashboardDrawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener("keydown", handleDrawerKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDrawerKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [isDashboardDrawerOpen]);

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

  function populateSprintForm(sprintToEdit: Sprint) {
    setNewSprintProjectId(String(sprintToEdit.projectId));
    setNewSprintName(sprintToEdit.name);
    setNewSprintGoal(sprintToEdit.goal);
    setNewSprintDescription(sprintToEdit.longDescription ?? "");
    setNewSprintStartDate(sprintToEdit.startDate);
    setNewSprintEndDate(sprintToEdit.endDate);
    setNewSprintStatus(sprintToEdit.status);
    setNewSprintCapacityHours(String(sprintToEdit.capacityHours ?? 80));
    setNewSprintFocus(sprintToEdit.focusArea ?? "Feature delivery");
    setNewSprintDefinitionOfDone(sprintToEdit.definitionOfDone ?? defaultDefinitionOfDone);
    setNewSprintRisks(sprintToEdit.riskNotes ?? "");
    setNewSprintBacklogNotes(sprintToEdit.backlogNotes ?? "");
  }

  function populateProjectForm(projectToEdit: Project) {
    setEditedProjectName(projectToEdit.name);
    setEditedProjectClientName(projectToEdit.clientName);
    setEditedProjectDescription(projectToEdit.description);
    setEditedProjectLongDescription(projectToEdit.longDescription ?? "");
    setEditedProjectBudgetHours(String(projectToEdit.budgetHours));
    setEditedProjectUsedHours(String(projectToEdit.usedHours));
    setEditedProjectDeadline(projectToEdit.deadline);
    setEditedProjectStatus(projectToEdit.status);
    setEditedProjectRiskNotes(projectToEdit.riskNotes);
  }

  function toggleSelection(currentValues: string[], selectedValue: string) {
    return currentValues.includes(selectedValue)
      ? currentValues.filter((value) => value !== selectedValue)
      : [...currentValues, selectedValue];
  }

  function populateDependentForm(memberToEdit: TeamMember) {
    setDependentName(memberToEdit.name);
    setDependentSurname(memberToEdit.surname);
    setDependentEmail(memberToEdit.email);
    setDependentPhoneNumber(memberToEdit.phoneNumber);
    setDependentRole(memberToEdit.role);
    setDependentHourlyWage(String(memberToEdit.hourlyWage));
    setDependentWeeklyCapacityHours(String(memberToEdit.weeklyCapacityHours));
    setDependentProjectIds(memberToEdit.projectIds.map(String));
    setDependentBio(memberToEdit.bio);
  }

  function populateTeamForm(teamToEdit: Team) {
    setTeamName(teamToEdit.name);
    setTeamFocusArea(teamToEdit.focusArea);
    setTeamLeadId(String(teamToEdit.leadId));
    setTeamMemberIds(teamToEdit.memberIds.map(String));
    setTeamProjectIds(teamToEdit.projectIds.map(String));
    setTeamNotes(teamToEdit.notes);
  }

  function loadSprintForEdit(sprintId: string) {
    const sprintToEdit = sprintRecords.find((sprintItem) => sprintItem.id === Number(sprintId));

    if (!sprintToEdit) {
      return;
    }

    setSprintFormMode("edit");
    setEditedSprintId(sprintId);
    populateSprintForm(sprintToEdit);
    setSprintCreatorMessage("");
  }

  function loadProjectForEdit(projectId: string) {
    const projectToEdit = projectRecords.find(
      (projectItem) => projectItem.id === Number(projectId)
    );

    if (!projectToEdit) {
      return;
    }

    setProjectFormMode("edit");
    setEditedProjectId(projectId);
    populateProjectForm(projectToEdit);
    setProjectEditorMessage("");
  }

  function loadDependentForEdit(memberId: string) {
    const memberToEdit = teamMemberRecords.find((member) => member.id === Number(memberId));

    if (!memberToEdit) {
      return;
    }

    setDependentFormMode("edit");
    setEditedDependentId(memberId);
    populateDependentForm(memberToEdit);
    setDependentEditorMessage("");
  }

  function loadTeamForEdit(teamId: string) {
    const teamToEdit = teamRecords.find((team) => team.id === Number(teamId));

    if (!teamToEdit) {
      return;
    }

    setTeamFormMode("edit");
    setEditedTeamId(teamId);
    populateTeamForm(teamToEdit);
    setTeamEditorMessage("");
  }

  function resetSprintForm() {
    setSprintFormMode("create");
    setNewSprintProjectId(String(selectedProject.id));
    setNewSprintName("");
    setNewSprintGoal("");
    setNewSprintDescription("");
    setNewSprintStartDate("");
    setNewSprintEndDate("");
    setNewSprintStatus("Planned");
    setNewSprintCapacityHours("80");
    setNewSprintFocus("Feature delivery");
    setNewSprintDefinitionOfDone(defaultDefinitionOfDone);
    setNewSprintRisks("");
    setNewSprintBacklogNotes("");
    setSprintCreatorMessage("");
  }

  function resetProjectForm() {
    setProjectFormMode("create");
    setEditedProjectName("");
    setEditedProjectClientName("");
    setEditedProjectDescription("");
    setEditedProjectLongDescription("");
    setEditedProjectBudgetHours("120");
    setEditedProjectUsedHours("0");
    setEditedProjectDeadline("");
    setEditedProjectStatus("On Track");
    setEditedProjectRiskNotes("");
    setProjectEditorMessage("");
  }

  function resetDependentForm() {
    setDependentFormMode("create");
    setDependentName("");
    setDependentSurname("");
    setDependentEmail("");
    setDependentPhoneNumber("");
    setDependentRole("Frontend Developer");
    setDependentHourlyWage("45");
    setDependentWeeklyCapacityHours("32");
    setDependentProjectIds([String(selectedProject.id)]);
    setDependentBio("");
    setDependentEditorMessage("");
  }

  function resetTeamForm() {
    setTeamFormMode("create");
    setTeamName("");
    setTeamFocusArea("");
    setTeamLeadId(String(teamMemberRecords[0]?.id ?? defaultTeamMember.id));
    setTeamMemberIds([]);
    setTeamProjectIds([String(selectedProject.id)]);
    setTeamNotes("");
    setTeamEditorMessage("");
  }

  async function handleSaveSprint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSprintCreatorMessage("");

    if (!isAdmin) {
      setSprintCreatorMessage("Only admin users can save sprints.");
      return;
    }

    const projectId = Number(newSprintProjectId);
    const capacityHours = Number(newSprintCapacityHours);

    if (!newSprintName.trim() || !newSprintGoal.trim() || !newSprintStartDate || !newSprintEndDate) {
      setSprintCreatorMessage("Name, goal, start date, and end date are required.");
      return;
    }

    if (new Date(newSprintEndDate) < new Date(newSprintStartDate)) {
      setSprintCreatorMessage("End date must be after the start date.");
      return;
    }

    if (!Number.isFinite(capacityHours) || capacityHours <= 0) {
      setSprintCreatorMessage("Capacity must be a positive number of hours.");
      return;
    }

    const savedSprint: Sprint = {
      id:
        sprintFormMode === "edit"
          ? Number(editedSprintId)
          : Math.max(0, ...sprintRecords.map((sprintItem) => sprintItem.id)) + 1,
      projectId,
      name: newSprintName.trim(),
      goal: newSprintGoal.trim(),
      longDescription: newSprintDescription.trim() || newSprintGoal.trim(),
      startDate: newSprintStartDate,
      endDate: newSprintEndDate,
      status: newSprintStatus,
      capacityHours,
      focusArea: newSprintFocus,
      definitionOfDone: newSprintDefinitionOfDone.trim(),
      riskNotes: newSprintRisks.trim(),
      backlogNotes: newSprintBacklogNotes.trim()
    };

    const mode = sprintFormMode;
    try {
      const response = await saveSprint(savedSprint, mode);
      applyWorkspace(response.workspace);
      const savedSprintId = response.item?.id ?? savedSprint.id;
      setOpenedSprintId(savedSprintId);
      setEditedSprintId(String(savedSprintId));
    } catch (error) {
      setSprintCreatorMessage(
        error instanceof Error ? error.message : "Could not save sprint to the database."
      );
      return;
    }
    setSelectedProjectId(projectId);
    setSprintFormMode("edit");
    setSprintCreatorMessage(
      mode === "edit" ? "Sprint updated in the database." : "Sprint created in the database."
    );
  }

  async function handleDeleteOpenedSprint(sprintToDelete: Sprint) {
    const confirmed = window.confirm(
      `Delete "${sprintToDelete.name}"? This removes the sprint from the demo workspace.`
    );

    if (!confirmed) {
      return;
    }

    const remainingSprints = sprintRecords.filter(
      (sprintItem) => sprintItem.id !== sprintToDelete.id
    );
    const nextEditableSprint = remainingSprints[0];

    try {
      const response = await deleteSprint(sprintToDelete.id);
      applyWorkspace(response.workspace);
    } catch (error) {
      setSprintCreatorMessage(
        error instanceof Error ? error.message : "Could not delete sprint from the database."
      );
      return;
    }
    setOpenedSprintId(null);

    if (selectedSprintId === sprintToDelete.id) {
      setSelectedSprintId(null);
    }

    if (editedSprintId === String(sprintToDelete.id)) {
      setSprintFormMode(nextEditableSprint ? "edit" : "create");
      setEditedSprintId(
        nextEditableSprint ? String(nextEditableSprint.id) : String(defaultSprint.id)
      );
      setSprintCreatorMessage("Sprint deleted from the database.");
    }
  }

  function handleDashboardProjectMove(direction: -1 | 1) {
    if (projectRecords.length === 0) {
      return;
    }

    const nextIndex =
      (dashboardProjectIndex + direction + projectRecords.length) % projectRecords.length;
    setDashboardProjectId(projectRecords[nextIndex].id);
  }

  async function handleDeleteOpenedProject(projectToDelete: Project) {
    if (projectRecords.length <= 1) {
      window.alert("You cannot delete the last project in the demo workspace.");
      return;
    }

    const linkedSprints = sprintRecords.filter(
      (sprintItem) => sprintItem.projectId === projectToDelete.id
    );
    const confirmed = window.confirm(
      `Delete "${projectToDelete.name}" and ${linkedSprints.length} linked sprint(s)?`
    );

    if (!confirmed) {
      return;
    }

    const remainingProjects = projectRecords.filter(
      (projectItem) => projectItem.id !== projectToDelete.id
    );
    const remainingSprints = sprintRecords.filter(
      (sprintItem) => sprintItem.projectId !== projectToDelete.id
    );
    const nextProject = remainingProjects[0];
    const nextSprint = remainingSprints[0];

    try {
      const response = await deleteProject(projectToDelete.id);
      applyWorkspace(response.workspace);
    } catch (error) {
      setProjectEditorMessage(
        error instanceof Error ? error.message : "Could not delete project from the database."
      );
      return;
    }
    setOpenedProjectId(null);

    if (nextProject && selectedProjectId === projectToDelete.id) {
      setSelectedProjectId(nextProject.id);
    }

    if (nextProject && dashboardProjectId === projectToDelete.id) {
      setDashboardProjectId(nextProject.id);
    }

    if (openedSprint?.projectId === projectToDelete.id) {
      setOpenedSprintId(null);
    }

    if (selectedSprint?.projectId === projectToDelete.id) {
      setSelectedSprintId(null);
    }

    if (editedProjectId === String(projectToDelete.id)) {
      setProjectFormMode(nextProject ? "edit" : "create");
      setEditedProjectId(nextProject ? String(nextProject.id) : String(defaultProject.id));
      if (nextProject) {
        populateProjectForm(nextProject);
      }
      setProjectEditorMessage("Project deleted from the database.");
    }

    if (newSprintProjectId === String(projectToDelete.id) && nextProject) {
      setNewSprintProjectId(String(nextProject.id));
    }

    if (
      editedSprintId &&
      linkedSprints.some((sprintItem) => String(sprintItem.id) === editedSprintId)
    ) {
      setSprintFormMode(nextSprint ? "edit" : "create");
      setEditedSprintId(nextSprint ? String(nextSprint.id) : String(defaultSprint.id));
      if (nextSprint) {
        populateSprintForm(nextSprint);
      }
      setSprintCreatorMessage("Linked sprint(s) deleted with the project.");
    }
  }

  async function handleSaveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProjectEditorMessage("");

    if (!isAdmin) {
      setProjectEditorMessage("Only admin users can edit projects.");
      return;
    }

    const budgetHours = Number(editedProjectBudgetHours);
    const usedHours = Number(editedProjectUsedHours);
    const projectId = Number(editedProjectId);

    if (
      !editedProjectName.trim() ||
      !editedProjectClientName.trim() ||
      !editedProjectDescription.trim() ||
      !editedProjectDeadline
    ) {
      setProjectEditorMessage("Name, client, short description, and deadline are required.");
      return;
    }

    if (!Number.isFinite(budgetHours) || budgetHours <= 0) {
      setProjectEditorMessage("Budget hours must be a positive number.");
      return;
    }

    if (!Number.isFinite(usedHours) || usedHours < 0) {
      setProjectEditorMessage("Used hours cannot be negative.");
      return;
    }

    const savedProject: Project = {
      id:
        projectFormMode === "edit"
          ? projectId
          : Math.max(0, ...projectRecords.map((projectItem) => projectItem.id)) + 1,
      name: editedProjectName.trim(),
      clientName: editedProjectClientName.trim(),
      description: editedProjectDescription.trim(),
      longDescription: editedProjectLongDescription.trim() || editedProjectDescription.trim(),
      budgetHours,
      usedHours,
      deadline: editedProjectDeadline,
      status: editedProjectStatus,
      riskNotes: editedProjectRiskNotes.trim() || "No risk notes recorded."
    };

    const mode = projectFormMode;
    try {
      const response = await saveProject(savedProject, mode);
      applyWorkspace(response.workspace);
      const savedProjectId = response.item?.id ?? savedProject.id;
      setSelectedProjectId(savedProjectId);
      setOpenedProjectId(savedProjectId);
      setEditedProjectId(String(savedProjectId));
    } catch (error) {
      setProjectEditorMessage(
        error instanceof Error ? error.message : "Could not save project to the database."
      );
      return;
    }
    setProjectFormMode("edit");
    setProjectEditorMessage(
      mode === "edit" ? "Project updated in the database." : "Project created in the database."
    );
  }

  async function handleSaveDependent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDependentEditorMessage("");

    if (!isAdmin) {
      setDependentEditorMessage("Only admin users can save employees.");
      return;
    }

    const hourlyWage = Number(dependentHourlyWage);
    const weeklyCapacityHours = Number(dependentWeeklyCapacityHours);

    if (
      !dependentName.trim() ||
      !dependentSurname.trim() ||
      !dependentEmail.trim() ||
      !dependentPhoneNumber.trim() ||
      !dependentRole.trim()
    ) {
      setDependentEditorMessage("Name, surname, email, phone, and role are required.");
      return;
    }

    if (!Number.isFinite(hourlyWage) || hourlyWage <= 0) {
      setDependentEditorMessage("Hourly wage must be a positive number.");
      return;
    }

    if (!Number.isFinite(weeklyCapacityHours) || weeklyCapacityHours <= 0) {
      setDependentEditorMessage("Weekly capacity must be a positive number.");
      return;
    }

    const savedDependent: TeamMember = {
      id:
        dependentFormMode === "edit"
          ? Number(editedDependentId)
          : Math.max(0, ...teamMemberRecords.map((member) => member.id)) + 1,
      name: dependentName.trim(),
      surname: dependentSurname.trim(),
      email: dependentEmail.trim(),
      phoneNumber: dependentPhoneNumber.trim(),
      role: dependentRole.trim(),
      hourlyWage,
      weeklyCapacityHours,
      projectIds: dependentProjectIds.map(Number),
      bio: dependentBio.trim() || "No profile notes added yet."
    };

    const mode = dependentFormMode;
    try {
      const response = await saveEmployee(savedDependent, mode);
      applyWorkspace(response.workspace);
      setEditedDependentId(String(response.item?.id ?? savedDependent.id));
    } catch (error) {
      setDependentEditorMessage(
        error instanceof Error ? error.message : "Could not save employee to the database."
      );
      return;
    }
    setDependentFormMode("edit");
    setDependentEditorMessage(
      mode === "edit" ? "Employee updated in the database." : "Employee created in the database."
    );
  }

  async function handleDeleteOpenedDependent(memberToDelete: TeamMember) {
    if (teamMemberRecords.length <= 1) {
      window.alert("You cannot delete the last employee in the demo workspace.");
      return;
    }

    const assignedTaskCount = tasks.filter(
      (task) => task.assigneeId === memberToDelete.id
    ).length;
    const assignedTeamCount = teamRecords.filter((team) =>
      team.memberIds.includes(memberToDelete.id)
    ).length;
    const confirmed = window.confirm(
      `Delete "${memberToDelete.name} ${memberToDelete.surname}"? This removes the employee from ${memberToDelete.projectIds.length} project assignment(s), ${assignedTeamCount} team(s), and ${assignedTaskCount} sprint task assignment(s).`
    );

    if (!confirmed) {
      return;
    }

    const remainingMembers = teamMemberRecords.filter((member) => member.id !== memberToDelete.id);
    const fallbackLeadId = remainingMembers[0]?.id ?? defaultTeamMember.id;

    try {
      const response = await deleteEmployee(memberToDelete.id);
      applyWorkspace(response.workspace);
    } catch (error) {
      setDependentEditorMessage(
        error instanceof Error ? error.message : "Could not delete employee from the database."
      );
      return;
    }
    setOpenedDependentId(null);

    if (editedDependentId === String(memberToDelete.id)) {
      const nextEditableMember = remainingMembers[0];
      setDependentFormMode(nextEditableMember ? "edit" : "create");
      setEditedDependentId(
        nextEditableMember ? String(nextEditableMember.id) : String(defaultTeamMember.id)
      );
      if (nextEditableMember) {
        populateDependentForm(nextEditableMember);
      }
      setDependentEditorMessage("Employee deleted from the database.");
    }

    if (teamLeadId === String(memberToDelete.id)) {
      setTeamLeadId(String(fallbackLeadId));
    }

    if (teamMemberIds.includes(String(memberToDelete.id))) {
      setTeamMemberIds((currentIds) =>
        currentIds.filter((memberId) => memberId !== String(memberToDelete.id))
      );
    }
  }

  async function handleSaveTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTeamEditorMessage("");

    if (!isAdmin) {
      setTeamEditorMessage("Only admin users can save teams.");
      return;
    }

    if (!teamName.trim() || !teamFocusArea.trim() || !teamNotes.trim()) {
      setTeamEditorMessage("Team name, focus area, and notes are required.");
      return;
    }

    if (teamMemberIds.length === 0) {
      setTeamEditorMessage("Select at least one team member.");
      return;
    }

    const leadId = Number(teamLeadId);
    const memberIds = Array.from(new Set([...teamMemberIds, teamLeadId])).map(Number);

    const savedTeam: Team = {
      id:
        teamFormMode === "edit"
          ? Number(editedTeamId)
          : Math.max(0, ...teamRecords.map((team) => team.id)) + 1,
      name: teamName.trim(),
      focusArea: teamFocusArea.trim(),
      leadId,
      memberIds,
      projectIds: teamProjectIds.map(Number),
      notes: teamNotes.trim()
    };

    const mode = teamFormMode;
    try {
      const response = await saveTeam(savedTeam, mode);
      applyWorkspace(response.workspace);
      setEditedTeamId(String(response.item?.id ?? savedTeam.id));
    } catch (error) {
      setTeamEditorMessage(
        error instanceof Error ? error.message : "Could not save team to the database."
      );
      return;
    }
    setTeamFormMode("edit");
    setTeamMemberIds(memberIds.map(String));
    setTeamProjectIds(savedTeam.projectIds.map(String));
    setTeamEditorMessage(
      mode === "edit" ? "Team updated in the database." : "Team created in the database."
    );
  }

  function handleNavigation(viewId: ViewId) {
    if (authUser?.role === "user" && (viewId === "dependents" || viewId === "admin")) {
      return;
    }

    setActiveView(viewId);
  }

  function openDashboardInsight(insightId: DashboardInsightId) {
    if (dashboardInsightId) {
      setDashboardInsightHistory((currentHistory) => [
        ...currentHistory,
        dashboardInsightId
      ]);
    }

    setDashboardInsightId(insightId);
  }

  function closeDashboardInsight() {
    setDashboardInsightId(null);
    setDashboardInsightHistory([]);
  }

  function goBackDashboardInsight() {
    const previousInsight =
      dashboardInsightHistory[dashboardInsightHistory.length - 1];

    if (!previousInsight) {
      closeDashboardInsight();
      return;
    }

    setDashboardInsightHistory((currentHistory) => currentHistory.slice(0, -1));
    setDashboardInsightId(previousInsight);
  }

  function goToDashboardInsightHistory(historyIndex: number) {
    const targetInsight = dashboardInsightHistory[historyIndex];

    if (!targetInsight) {
      return;
    }

    setDashboardInsightHistory((currentHistory) =>
      currentHistory.slice(0, historyIndex)
    );
    setDashboardInsightId(targetInsight);
  }

  function rememberDetailOrigin() {
    detailOriginScrollRef.current = window.scrollY;
  }

  function returnFromDetail(closeDetail: () => void) {
    closeDetail();
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: detailOriginScrollRef.current, behavior: "auto" });
    });
  }

  function canOpenProject(projectId: number) {
    return accessibleProjectIds.includes(projectId);
  }

  function getDashboardInsightMeta(
    insightId: DashboardInsightId | null = dashboardInsightId
  ) {
    switch (insightId) {
      case "portfolio-projects":
        return {
          eyebrow: "Portfolio",
          title: "Project health",
          description: "Status, budget, deadlines, and open work across every project."
        };
      case "portfolio-tasks":
      case "portfolio-workload":
        return {
          eyebrow: "Workload",
          title: "Open work",
          description: "Current task distribution and the work that needs attention."
        };
      case "portfolio-capacity":
        return {
          eyebrow: "Capacity",
          title: "Workspace capacity",
          description: "Weekly availability across the people in this workspace."
        };
      case "portfolio-budget":
        return {
          eyebrow: "Budget",
          title: "Budget allocation",
          description: "Used and remaining hours for each active project."
        };
      case "portfolio-risk":
        return {
          eyebrow: "Delivery risk",
          title: "Projects needing attention",
          description: "Blocked and at-risk delivery with the reason behind each status."
        };
      case "portfolio-completion":
        return {
          eyebrow: "Progress",
          title: "Task completion",
          description: "A complete breakdown of task status across the portfolio."
        };
      case "employee-projects":
        return {
          eyebrow: "My work",
          title: "Assigned projects",
          description: "Projects connected to your profile and their current delivery status."
        };
      case "employee-tasks":
      case "employee-priority":
        return {
          eyebrow: "My work",
          title: "Assigned tasks",
          description: "Your open tasks, priorities, estimates, and current progress."
        };
      case "employee-load":
        return {
          eyebrow: "Capacity",
          title: "Weekly workload",
          description: "How your planned work compares with your available weekly hours."
        };
      case "employee-completion":
        return {
          eyebrow: "Progress",
          title: "My completion",
          description: "Completed and remaining work connected to your profile."
        };
      case "employee-teams":
        return {
          eyebrow: "Collaboration",
          title: "My teams",
          description: "Your teams, colleagues, and delivery focus."
        };
      case "focused-sprint":
        return {
          eyebrow: "Sprint",
          title: dashboardCurrentSprint.name,
          description: dashboardCurrentSprint.goal
        };
      default:
        if (insightId?.startsWith("person:")) {
          const memberId = Number(insightId.split(":")[1]);
          const member = teamMemberRecords.find((person) => person.id === memberId);

          return {
            eyebrow: "Person",
            title: member ? `${member.name} ${member.surname}` : "Team member",
            description: "Profile, assignments, and active work."
          };
        }

        return {
          eyebrow: "Person",
          title: "Team member",
          description: "Profile, assignments, and active work."
        };
    }
  }

  function renderDashboardInsightContent(): ReactNode {
    const projectInsightItems =
      dashboardInsightId === "employee-projects" ? employeeProjects : projectRecords;

    if (
      dashboardInsightId === "portfolio-projects" ||
      dashboardInsightId === "employee-projects"
    ) {
      return (
        <div className="insight-list">
          {projectInsightItems.map((projectItem) => {
            const projectTasks = tasks.filter((task) => task.projectId === projectItem.id);
            const openTasks = projectTasks.filter((task) => task.status !== "Done").length;

            return (
              <button
                className="insight-list-row"
                key={projectItem.id}
                type="button"
                onClick={() => {
                  detailOriginScrollRef.current = 0;
                  setSelectedProjectId(projectItem.id);
                  setOpenedProjectId(projectItem.id);
                  closeDashboardInsight();
                  setActiveView("projects");
                }}
              >
                <span>
                  <strong>{projectItem.name}</strong>
                  <small>{projectItem.clientName}</small>
                </span>
                <span>
                  <strong>{projectItem.status}</strong>
                  <small>{openTasks} open tasks</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (
      dashboardInsightId === "portfolio-tasks" ||
      dashboardInsightId === "portfolio-workload" ||
      dashboardInsightId === "employee-tasks" ||
      dashboardInsightId === "employee-priority" ||
      dashboardInsightId === "employee-load" ||
      dashboardInsightId === "employee-completion"
    ) {
      const insightTasks = dashboardInsightId.startsWith("employee") ? employeeTasks : tasks;
      const visibleInsightTasks =
        dashboardInsightId === "employee-priority"
          ? insightTasks.filter((task) => task.priority === "High" && task.status !== "Done")
          : insightTasks.filter((task) => task.status !== "Done");
      const completedTasks = insightTasks.filter((task) => task.status === "Done");
      const plannedHours = visibleInsightTasks.reduce(
        (total, task) => total + task.estimateHours,
        0
      );

      return (
        <>
          <div className="insight-stat-grid">
            <InsightStat label="Open" value={String(visibleInsightTasks.length)} />
            <InsightStat label="Completed" value={String(completedTasks.length)} />
            <InsightStat label="Planned" value={`${plannedHours}h`} />
          </div>
          <div className="insight-list">
            {visibleInsightTasks.slice(0, 10).map((task) => {
              const taskProject = projectRecords.find(
                (projectItem) => projectItem.id === task.projectId
              );

              return (
                <div className="insight-list-row insight-list-row--static" key={task.id}>
                  <span>
                    <strong>{task.title}</strong>
                    <small>{taskProject?.name ?? "Unknown project"}</small>
                  </span>
                  <span>
                    <strong>{task.priority}</strong>
                    <small>
                      {task.status} · {task.estimateHours}h
                    </small>
                  </span>
                </div>
              );
            })}
            {visibleInsightTasks.length === 0 && (
              <p className="insight-empty-state">There is no open work in this view.</p>
            )}
          </div>
          <button
            className="insight-primary-action"
            type="button"
            onClick={() => {
              closeDashboardInsight();
              handleNavigation("tasks");
            }}
          >
            Open task board <span aria-hidden="true">→</span>
          </button>
        </>
      );
    }

    if (dashboardInsightId === "portfolio-budget") {
      return (
        <div className="insight-list">
          {projectRecords.map((projectItem) => {
            const usage = getBudgetUsagePercent(projectItem);

            return (
              <div className="insight-progress-row" key={projectItem.id}>
                <div>
                  <strong>{projectItem.name}</strong>
                  <span>
                    {projectItem.usedHours}/{projectItem.budgetHours}h · {usage}% used
                  </span>
                </div>
                <div className="dashboard-progress">
                  <span style={{ width: `${usage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (dashboardInsightId === "portfolio-risk") {
      const riskProjects = projectRecords.filter(
        (projectItem) => projectItem.status !== "On Track"
      );

      return (
        <div className="insight-list">
          {riskProjects.map((projectItem) => (
            <button
              className="insight-risk-row"
              key={projectItem.id}
              type="button"
              onClick={() => {
                detailOriginScrollRef.current = 0;
                setSelectedProjectId(projectItem.id);
                setOpenedProjectId(projectItem.id);
                closeDashboardInsight();
                setActiveView("projects");
              }}
            >
              <span>{projectItem.status}</span>
              <strong>{projectItem.name}</strong>
              <span className="insight-risk-copy">{projectItem.riskNotes}</span>
              <small>Due {formatDate(projectItem.deadline)} · Open project →</small>
            </button>
          ))}
          {riskProjects.length === 0 && (
            <p className="insight-empty-state">No project currently needs attention.</p>
          )}
        </div>
      );
    }

    if (dashboardInsightId === "portfolio-completion") {
      return (
        <div className="insight-status-breakdown">
          {(["Todo", "In Progress", "Review", "Done"] as const).map((status) => {
            const count = tasks.filter((task) => task.status === status).length;
            const percent = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;

            return (
              <div className="insight-progress-row" key={status}>
                <div>
                  <strong>{status}</strong>
                  <span>{count} tasks · {percent}%</span>
                </div>
                <div className="dashboard-progress">
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (dashboardInsightId === "portfolio-capacity") {
      return (
        <>
          <div className="insight-stat-grid">
            <InsightStat label="People" value={String(teamMemberRecords.length)} />
            <InsightStat label="Weekly capacity" value={`${portfolioCapacity}h`} />
            <InsightStat label="Planned work" value={`${portfolioPlannedHours}h`} />
          </div>
          <div className="insight-list">
            {[...teamMemberRecords]
              .sort(
                (firstMember, secondMember) =>
                  secondMember.weeklyCapacityHours - firstMember.weeklyCapacityHours
              )
              .slice(0, 10)
              .map((member) => (
                <button
                  className="insight-list-row"
                  key={member.id}
                  type="button"
                  onClick={() => openDashboardInsight(`person:${member.id}`)}
                >
                  <span>
                    <strong>{member.name} {member.surname}</strong>
                    <small>{member.role}</small>
                  </span>
                  <span>
                    <strong>{member.weeklyCapacityHours}h</strong>
                    <small>Weekly capacity</small>
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              ))}
          </div>
        </>
      );
    }

    if (dashboardInsightId === "employee-teams") {
      return (
        <div className="insight-list">
          {employeeTeams.map((team) => (
            <div className="insight-risk-row" key={team.id}>
              <span>{team.memberIds.length} people</span>
              <strong>{team.name}</strong>
              <p>{team.focusArea}</p>
              <small>{team.notes}</small>
            </div>
          ))}
        </div>
      );
    }

    if (dashboardInsightId === "focused-sprint") {
      return (
        <>
          <div className="insight-stat-grid">
            <InsightStat label="Status" value={dashboardCurrentSprint.status} />
            <InsightStat label="Completion" value={`${dashboardCurrentSprintCompletion}%`} />
            <InsightStat label="Tasks" value={String(dashboardCurrentSprintTasks.length)} />
          </div>
          <div className="insight-detail-copy">
            <strong>
              {formatDate(dashboardCurrentSprint.startDate)} –{" "}
              {formatDate(dashboardCurrentSprint.endDate)}
            </strong>
            <p>{dashboardCurrentSprint.longDescription ?? dashboardCurrentSprint.goal}</p>
          </div>
          <button
            className="insight-primary-action"
            type="button"
            onClick={() => {
              setSelectedProjectId(dashboardCurrentSprint.projectId);
              setSelectedSprintId(dashboardCurrentSprint.id);
              closeDashboardInsight();
              setActiveView("tasks");
            }}
          >
            Explore sprint work <span aria-hidden="true">→</span>
          </button>
        </>
      );
    }

    if (dashboardInsightId?.startsWith("person:")) {
      const memberId = Number(dashboardInsightId.split(":")[1]);
      const member = teamMemberRecords.find((person) => person.id === memberId);

      if (!member) {
        return <p className="insight-empty-state">This profile is no longer available.</p>;
      }

      const memberProjects = projectRecords.filter((projectItem) =>
        member.projectIds.includes(projectItem.id)
      );
      const memberTasks = tasks.filter((task) => task.assigneeId === member.id);

      return (
        <>
          <div className="insight-person">
            <span>{member.name.charAt(0)}{member.surname.charAt(0)}</span>
            <div>
              <h3>{member.name} {member.surname}</h3>
              <p>{member.role}</p>
            </div>
          </div>
          <div className="insight-contact-grid">
            <a href={`mailto:${member.email}`}>{member.email}</a>
            <a href={`tel:${member.phoneNumber}`}>{member.phoneNumber}</a>
          </div>
          <p className="insight-profile-copy">{member.bio}</p>
          <div className="insight-stat-grid">
            <InsightStat label="Projects" value={String(memberProjects.length)} />
            <InsightStat
              label="Open tasks"
              value={String(memberTasks.filter((task) => task.status !== "Done").length)}
            />
            <InsightStat label="Capacity" value={`${member.weeklyCapacityHours}h`} />
          </div>
        </>
      );
    }

    return null;
  }

  if (authStatus === "checking") {
    return (
      <main className="login-screen">
        <section className="login-card session-skeleton" aria-label="Loading workspace">
          <p className="eyebrow">TaaS Pulse</p>
          <h1>Checking session</h1>
          <p>Preparing your workspace access.</p>
          <div aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>
      </main>
    );
  }

  if (!authUser) {
    return (
      <main className="login-screen">
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card__intro">
            <div className="login-brand" aria-label="TaaS Pulse">
              <span>TP</span>
              <strong>TaaS Pulse</strong>
            </div>
            <p className="eyebrow">Delivery operations</p>
            <h1 id="login-title">Welcome back</h1>
            <p>
              Sign in to review delivery health, team capacity, and current work.
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

          <div className="demo-accounts" aria-label="Demo access">
            <div>
              <strong>Explore the demo</strong>
              <span>Choose a role to fill in the local demo credentials.</span>
            </div>
            <div className="demo-account-actions">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("admin@taaspulse.local");
                  setLoginPassword("AdminPass!2026");
                }}
              >
                <strong>Administrator</strong>
                <span>Full workspace access</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("ari.chen@example.com");
                  setLoginPassword("EmployeePass!2026");
                }}
              >
                <strong>Team member</strong>
                <span>Personal work view</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">TP</span>
          <span>
            <strong>TaaS Pulse</strong>
            <small>Delivery operations</small>
          </span>
        </div>

        <label className="mobile-nav-select">
          <span>Menu</span>
          <select
            value={activeView}
            onChange={(event) => handleNavigation(event.target.value as ViewId)}
          >
            {navigationItems.map((item) => (
              <option
                disabled={authUser.role === "user" && ["dependents", "admin"].includes(item.id)}
                key={item.id}
                value={item.id}
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <nav className="fast-nav" aria-label="Primary navigation">
          <p className="nav-section-label">Workspace</p>
          {navigationItems.map((item) => (
            <button
              className={[
                "nav-item",
                activeView === item.id ? "nav-item--active" : "",
                authUser.role === "user" && ["dependents", "admin"].includes(item.id)
                  ? "nav-item--disabled"
                  : ""
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={authUser.role === "user" && ["dependents", "admin"].includes(item.id)}
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
            <p className="eyebrow">Workspace</p>
            <h1>{activeNavigationItem.label}</h1>
            <span>{activeNavigationItem.helper}</span>
          </div>

          <div className="app-header__actions">

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
                  <small>{authUser.role === "admin" ? "Administrator" : "Team member"}</small>
                </span>
                <span className="account-caret" aria-hidden="true">⌄</span>
              </button>

              {isAccountMenuOpen && (
                <div className="account-dropdown" role="menu">
                  <div className="account-dropdown__summary">
                    <strong>{authUser.displayName}</strong>
                    <span>{authUser.email}</span>
                  </div>

                  <button type="button" role="menuitem" onClick={() => handleNavigation("dashboard")}>
                    Overview
                  </button>
                  <button type="button" role="menuitem" onClick={() => handleNavigation("projects")}>
                    Project overview
                  </button>

                  {authUser.role === "admin" && (
                    <button type="button" role="menuitem" onClick={() => handleNavigation("team")}>
                      Team management
                    </button>
                  )}

                  <div className="account-dropdown__separator" />

                  <button className="danger-menu-item" type="button" role="menuitem" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {workspaceError && <p className="form-error">{workspaceError}</p>}

        {activeView === "dashboard" && !isAdmin && loggedEmployee && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Dashboard"
              title={`Welcome, ${loggedEmployee.name}`}
              description="Your assigned projects, active work, sprint context, and team information in one place."
            />

            <DashboardToolbar
              message={`${employeeOpenTasks.length} tasks ready for review`}
              actions={[
                { label: "View my projects", view: "projects", primary: true },
                { label: "Open task board", view: "tasks" }
              ]}
              onNavigate={handleNavigation}
            />

            <section className="dashboard-overview" aria-label="Employee dashboard overview">
              <div className="dashboard-hero-panel dashboard-hero-panel--employee">
                <div className="dashboard-hero-panel__top">
                  <div className="dashboard-risk-copy">
                    <p className="eyebrow">My workspace</p>
                    <div
                      className={`dashboard-risk-heading dashboard-risk-heading--${
                        employeeHighPriorityTasks.length > 0 ? "warning" : "positive"
                      }`}
                    >
                      <span aria-hidden="true" />
                      <h2>{employeeDashboardStatus}</h2>
                    </div>
                    <p>
                      You are assigned to {employeeProjects.length} project
                      {employeeProjects.length === 1 ? "" : "s"}, {employeeActiveSprints.length} active
                      sprint{employeeActiveSprints.length === 1 ? "" : "s"}, and{" "}
                      {employeeOpenTasks.length} open task
                      {employeeOpenTasks.length === 1 ? "" : "s"}.
                    </p>
                  </div>
                  <DashboardProgressRing
                    label="Weekly load"
                    percent={employeeLoad}
                    helper={`${employeePlannedHours}/${loggedEmployee.weeklyCapacityHours}h`}
                    onClick={() => openDashboardInsight("employee-load")}
                  />
                </div>

                <div className="dashboard-signal-grid" aria-label="Employee work signals">
                  <button
                    type="button"
                    title="Open tasks marked as high priority"
                    onClick={() => openDashboardInsight("employee-priority")}
                  >
                    <DashboardIcon name="risk" />
                    <span>High priority</span>
                    <strong>{employeeHighPriorityTasks.length}</strong>
                    <small>Open assigned tasks</small>
                  </button>
                  <button
                    type="button"
                    title="Share of your assigned tasks already completed"
                    onClick={() => openDashboardInsight("employee-completion")}
                  >
                    <DashboardIcon name="progress" />
                    <span>Completion</span>
                    <strong>{employeeCompletion}%</strong>
                    <small>{employeeDoneTasks.length} tasks closed</small>
                  </button>
                  <button
                    type="button"
                    title="Teams available to your account"
                    onClick={() => openDashboardInsight("employee-teams")}
                  >
                    <DashboardIcon name="capacity" />
                    <span>Teams</span>
                    <strong>{employeeTeams.length}</strong>
                    <small>Your team access</small>
                  </button>
                </div>
              </div>

              <div className="dashboard-focus-grid">
                {employeeFocusItems.map((item) => (
                  <button
                    className={`dashboard-focus-card dashboard-focus-card--${item.tone}`}
                    key={item.title}
                    type="button"
                    onClick={() => openDashboardInsight(item.id)}
                  >
                    <span className="dashboard-focus-card__top">
                      <span>{item.title}</span>
                      <DashboardIcon name={item.icon} />
                    </span>
                    <strong>{item.value}</strong>
                    <p>{item.helper}</p>
                    <span className="dashboard-mini-track" aria-label={`${item.progress}%`}>
                      <span style={{ width: `${item.progress}%` }} />
                    </span>
                    <span className="dashboard-card-hint">Explore details →</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="dashboard-main-grid" aria-label="Employee dashboard details">
              <article className="dashboard-panel dashboard-panel--wide">
                <div className="dashboard-panel__header">
                  <div>
                    <p className="eyebrow">My projects</p>
                    <h2>Assigned project list</h2>
                  </div>
                  <span>{employeeProjects.length}</span>
                </div>

                <div className="employee-project-list">
                  {employeeProjects.length > 0 ? (
                    employeeProjects.map((projectItem) => {
                      const projectTasks = employeeTasks.filter(
                        (task) => task.projectId === projectItem.id
                      );
                      const projectOpenTasks = projectTasks.filter((task) => task.status !== "Done");
                      const projectCompletion = getTaskCompletionPercent(projectTasks);

                      return (
                        <button
                          className="project-access-card"
                          key={projectItem.id}
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(projectItem.id);
                            setActiveView("projects");
                          }}
                        >
                          <span>
                            <span className="eyebrow">{projectItem.clientName}</span>
                            <strong>{projectItem.name}</strong>
                            <span>{projectItem.description}</span>
                          </span>
                          <span className="project-access-card__meta">
                            <small>Status: {projectItem.status}</small>
                            <small>{projectOpenTasks.length} open tasks for you</small>
                            <small>{projectCompletion}% of your tasks complete</small>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p>No projects assigned to your account.</p>
                  )}
                </div>
              </article>

              <article className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <div>
                    <p className="eyebrow">Important work</p>
                    <h2>Your task queue</h2>
                  </div>
                  <span>{employeeOpenTasks.length}</span>
                </div>
                <div className="dashboard-list">
                  {employeeImportantTasks.length > 0 ? (
                    employeeImportantTasks.map((task) => {
                      const taskProject = projectRecords.find(
                        (projectItem) => projectItem.id === task.projectId
                      );

                      return (
                        <button
                          className="dashboard-list-item dashboard-list-item--interactive"
                          key={task.id}
                          type="button"
                          onClick={() => openDashboardInsight("employee-tasks")}
                        >
                          <strong>{task.title}</strong>
                          <span>
                            {taskProject?.name ?? "Unknown project"} / {task.status} /{" "}
                            {task.priority} priority
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p>No open assigned tasks.</p>
                  )}
                </div>
              </article>

              <article className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <div>
                    <p className="eyebrow">Team info</p>
                    <h2>{employeeTeams[0]?.name ?? "No team assigned"}</h2>
                  </div>
                  <span>{visibleTeamMembers.length} people</span>
                </div>
                <p>{employeeTeams[0]?.notes ?? "Your account is not attached to a team yet."}</p>
                <div className="dashboard-list">
                  {visibleTeamMembers.slice(0, 5).map((member) => (
                    <button
                      className="dashboard-list-item dashboard-list-item--interactive"
                      key={member.id}
                      type="button"
                      onClick={() => openDashboardInsight(`person:${member.id}`)}
                    >
                      <strong>
                        {member.name} {member.surname}
                      </strong>
                      <span>{member.role}</span>
                      <span className="dashboard-row-arrow" aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="dashboard-panel dashboard-panel--wide">
                <div className="dashboard-panel__header">
                  <div>
                    <p className="eyebrow">Sprint context</p>
                    <h2>Active sprint access</h2>
                  </div>
                  <span>{employeeActiveSprints.length}</span>
                </div>
                <div className="dashboard-list">
                  {employeeActiveSprints.length > 0 ? (
                    employeeActiveSprints.map((sprintItem) => {
                      const sprintProject = projectRecords.find(
                        (projectItem) => projectItem.id === sprintItem.projectId
                      );

                      return (
                        <button
                          className="dashboard-list-item dashboard-list-item--interactive"
                          key={sprintItem.id}
                          type="button"
                          onClick={() => {
                            setDashboardProjectId(sprintItem.projectId);
                            openDashboardInsight("focused-sprint");
                          }}
                        >
                          <strong>{sprintItem.name}</strong>
                          <span>
                            {sprintProject?.name ?? "Unknown project"} / {sprintItem.startDate} to{" "}
                            {sprintItem.endDate}
                          </span>
                          <span className="dashboard-row-arrow" aria-hidden="true">→</span>
                        </button>
                      );
                    })
                  ) : (
                    <p>No active sprint currently assigned to your projects.</p>
                  )}
                </div>
              </article>
            </section>
          </>
        )}

        {activeView === "dashboard" && (isAdmin || !loggedEmployee) && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Dashboard"
              title="Portfolio dashboard"
              description="Monitor delivery health, capacity, budget, and the work that needs attention now."
            />

            <DashboardToolbar
              message={`${atRiskProjectCount} projects need attention`}
              actions={[
                { label: "Review projects", view: "projects", primary: true },
                { label: "Open task board", view: "tasks" },
                { label: "Manage data", view: "admin" }
              ]}
              onNavigate={handleNavigation}
            />

            <section className="dashboard-overview" aria-label="Dashboard overview">
              <div className="dashboard-hero-panel dashboard-hero-panel--admin">
                <div className="dashboard-hero-panel__top">
                  <div className="dashboard-risk-copy">
                    <p className="eyebrow">Workspace overview</p>
                    <div
                      className={`dashboard-risk-heading dashboard-risk-heading--${portfolioRiskTone}`}
                    >
                      <span aria-hidden="true" />
                      <h2>{riskLabel}</h2>
                    </div>
                    <p>
                      {projectRecords.length} active projects, {sprintRecords.length} sprint
                      plans, and {portfolioOpenTasks.length} open tasks across the workspace.
                    </p>
                  </div>
                  <DashboardProgressRing
                    label="Portfolio budget"
                    percent={portfolioBudgetUsage}
                    helper={`${portfolioUsedHours}/${portfolioBudgetHours}h`}
                    onClick={() => openDashboardInsight("portfolio-budget")}
                  />
                </div>

                <div className="dashboard-signal-grid" aria-label="Portfolio signals">
                  <button
                    type="button"
                    title="Projects currently at risk or blocked"
                    onClick={() => openDashboardInsight("portfolio-risk")}
                  >
                    <DashboardIcon name="risk" />
                    <span>Risk projects</span>
                    <strong>{atRiskProjectCount}</strong>
                    <small>Require attention</small>
                  </button>
                  <button
                    type="button"
                    title="Share of all workspace tasks already completed"
                    onClick={() => openDashboardInsight("portfolio-completion")}
                  >
                    <DashboardIcon name="progress" />
                    <span>Completion</span>
                    <strong>{portfolioCompletion}%</strong>
                    <small>{portfolioDoneTasks.length} tasks closed</small>
                  </button>
                  <button
                    type="button"
                    title="Tasks that have not reached Done"
                    onClick={() => openDashboardInsight("portfolio-workload")}
                  >
                    <DashboardIcon name="workload" />
                    <span>Open workload</span>
                    <strong>{portfolioOpenTasks.length}</strong>
                    <small>Tasks still active</small>
                  </button>
                </div>
              </div>

              <div className="dashboard-focus-grid">
                {dashboardFocusItems.map((item) => (
                  <button
                    className={`dashboard-focus-card dashboard-focus-card--${item.tone}`}
                    key={item.title}
                    type="button"
                    onClick={() => openDashboardInsight(item.id)}
                  >
                    <span className="dashboard-focus-card__top">
                      <span>{item.title}</span>
                      <DashboardIcon name={item.icon} />
                    </span>
                    <strong>{item.value}</strong>
                    <p>{item.helper}</p>
                    <span className="dashboard-mini-track" aria-label={`${item.progress}%`}>
                      <span style={{ width: `${item.progress}%` }} />
                    </span>
                    <span className="dashboard-card-hint">Explore details →</span>
                  </button>
                ))}
              </div>
            </section>

           

            <section className="dashboard-main-grid" aria-label="Dashboard detail panels">
              <article className="dashboard-panel dashboard-panel--wide">
                <div className="dashboard-panel__header">
                  <div>
                    <p className="eyebrow">Project carousel</p>
                    <h2>{dashboardProject.name}</h2>
                  </div>
                  <div className="dashboard-carousel-controls">
                    <span>
                      {dashboardProjectIndex + 1}/{projectRecords.length}
                    </span>
                    <button type="button" onClick={() => handleDashboardProjectMove(-1)}>
                      <span aria-hidden="true">←</span> Previous
                    </button>
                    <button type="button" onClick={() => handleDashboardProjectMove(1)}>
                      Next <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
                <p>
                  {dashboardProject.clientName} / {dashboardProject.description}
                </p>
                <small>{dashboardProject.riskNotes}</small>

                <div className="dashboard-health-list">
                  {projectHealthItems.map((item) => (
                    <div className="dashboard-health-row" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <small>
                  Delivery risk: {dashboardDeliveryRisk} / Project status:{" "}
                  {dashboardProject.status}
                </small>
                <button
                  className="dashboard-text-action"
                  type="button"
                  onClick={() => {
                    detailOriginScrollRef.current = 0;
                    setSelectedProjectId(dashboardProject.id);
                    setOpenedProjectId(dashboardProject.id);
                    setActiveView("projects");
                  }}
                >
                  Open project details <span aria-hidden="true">→</span>
                </button>
              </article>

              <article className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <div>
                    <p className="eyebrow">Focused sprint</p>
                    <h2>{dashboardCurrentSprint.name}</h2>
                  </div>
                  <span>{dashboardCurrentSprint.status}</span>
                </div>
                <p>{dashboardCurrentSprint.goal}</p>
                <div className="dashboard-progress">
                  <span style={{ width: `${dashboardCurrentSprintCompletion}%` }} />
                </div>
                <small>
                  {formatDate(dashboardCurrentSprint.startDate)} –{" "}
                  {formatDate(dashboardCurrentSprint.endDate)} ·{" "}
                  {dashboardCurrentSprintCompletion}% complete
                </small>
                <button
                  className="dashboard-text-action"
                  type="button"
                  onClick={() => openDashboardInsight("focused-sprint")}
                >
                  Explore sprint details <span aria-hidden="true">→</span>
                </button>
              </article>

              <article className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <div>
                    <p className="eyebrow">Needs attention</p>
                    <h2>Focused open work</h2>
                  </div>
                  <span>{openDashboardTasks.length}</span>
                </div>
                <div className="dashboard-list">
                  {dashboardActivityItems.length > 0 ? (
                    dashboardActivityItems.map((item) => (
                      <button
                        className="dashboard-list-item dashboard-list-item--interactive"
                        key={`${item.title}-${item.meta}`}
                        type="button"
                        onClick={() => openDashboardInsight("portfolio-workload")}
                      >
                        <strong>{item.title}</strong>
                        <span>{item.meta}</span>
                        <span className="dashboard-row-arrow" aria-hidden="true">→</span>
                      </button>
                    ))
                  ) : (
                    <p>No open task needs attention for this project.</p>
                  )}
                </div>
                <button
                  className="dashboard-text-action"
                  type="button"
                  onClick={() => handleNavigation("tasks")}
                >
                  Review open work <span aria-hidden="true">→</span>
                </button>
              </article>

              <article className="dashboard-panel dashboard-panel--wide">
                <div className="dashboard-panel__header">
                  <div>
                    <p className="eyebrow">Team workload</p>
                    <h2>{dashboardProjectTeam?.name ?? "Assigned team"}</h2>
                  </div>
                  <span>{dashboardProjectTeamMembers.length} people</span>
                </div>
                <div className="dashboard-workload">
                  {topTeamLoads.length > 0 ? (
                    topTeamLoads.map((loadItem) => (
                      <div
                        className="dashboard-workload-row dashboard-workload-row--interactive"
                        key={loadItem.member.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openDashboardInsight(`person:${loadItem.member.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openDashboardInsight(`person:${loadItem.member.id}`);
                          }
                        }}
                      >
                        <div>
                          <strong>
                            {loadItem.member.name} {loadItem.member.surname}
                          </strong>
                          <span>
                            {loadItem.assignedHours}h / {loadItem.member.weeklyCapacityHours}h
                          </span>
                        </div>
                        <div className="dashboard-progress">
                          <span style={{ width: `${loadItem.loadPercent}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No assigned team for this project.</p>
                  )}
                </div>
              </article>
            </section>
          </>
        )}

        {activeView === "dependents" && (
          <>
            {!openedDependent ? (
              <>
                <PageHeader
                  currentProject={selectedProject}
                  eyebrow="People"
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
                      {projectRecords.map((projectItem) => (
                        <option key={projectItem.id} value={projectItem.id}>
                          {projectItem.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    disabled={
                      employeeSearch.length === 0 &&
                      employeeJobFilter === "all" &&
                      employeeProjectFilter === "all"
                    }
                    onClick={() => {
                      setEmployeeSearch("");
                      setIsEmployeeAutocompleteOpen(false);
                      setEmployeeJobFilter("all");
                      setEmployeeProjectFilter("all");
                    }}
                  >
                    Clear filters
                  </button>
                </section>

                <p className="result-summary">
                  Showing {filteredTeamMembers.length} of {teamMemberRecords.length} employees.
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
                    <button
                      className="table-row table-row--button"
                      key={member.id}
                      type="button"
                      onClick={() => {
                        rememberDetailOrigin();
                        setOpenedDependentId(member.id);
                      }}
                    >
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
                    </button>
                  ))}

                  {filteredTeamMembers.length === 0 && (
                    <div className="empty-table-state">
                      No employees match the selected filters.
                    </div>
                  )}
                </section>
              </>
            ) : (
              <section className="project-detail-page" aria-label="Opened employee detail">
                <div className="detail-action-row">
                  <DetailNavigation
                    sectionLabel="People"
                    currentLabel={`${openedDependent.name} ${openedDependent.surname}`}
                    onBack={() => returnFromDetail(() => setOpenedDependentId(null))}
                    onDashboard={() => {
                      setOpenedDependentId(null);
                      handleNavigation("dashboard");
                    }}
                  />

                  {isAdmin && (
                    <button
                      className="delete-detail-button"
                      type="button"
                      onClick={() => handleDeleteOpenedDependent(openedDependent)}
                    >
                      Delete person
                    </button>
                  )}
                </div>

                <div className="project-detail-panel__header">
                  <div>
                    <p className="eyebrow">{openedDependent.role}</p>
                    <h2>
                      {openedDependent.name} {openedDependent.surname}
                    </h2>
                    <p>{openedDependent.bio}</p>
                  </div>
                </div>

                <div className="project-detail-grid">
                  <article>
                    <span>Email</span>
                    <strong>{openedDependent.email}</strong>
                  </article>
                  <article>
                    <span>Phone</span>
                    <strong>{openedDependent.phoneNumber}</strong>
                  </article>
                  <article>
                    <span>Hourly wage</span>
                    <strong>{openedDependent.hourlyWage} EUR/hour</strong>
                  </article>
                  <article>
                    <span>Weekly capacity</span>
                    <strong>{openedDependent.weeklyCapacityHours}h</strong>
                  </article>
                </div>

                <div className="project-detail-columns">
                  <article>
                    <h3>Assigned projects</h3>
                    {openedDependentProjects.length > 0 ? (
                      <ul>
                        {openedDependentProjects.map((projectItem) => (
                          <li key={projectItem.id}>
                            <strong>{projectItem.name}</strong>
                            <span>{projectItem.clientName}</span>
                            <p>{projectItem.status}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No project assignments.</p>
                    )}
                  </article>

                  <article>
                    <h3>Assigned teams</h3>
                    {openedDependentTeams.length > 0 ? (
                      <ul>
                        {openedDependentTeams.map((team) => (
                          <li key={team.id}>
                            <strong>{team.name}</strong>
                            <span>{team.focusArea}</span>
                            <p>{team.leadId === openedDependent.id ? "Team lead" : "Team member"}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No team assignments.</p>
                    )}
                  </article>

                  <article>
                    <h3>Sprint task assignments</h3>
                    {openedDependentTasks.length > 0 ? (
                      <ul>
                        {openedDependentTasks.map((task) => {
                          const taskProject = projectRecords.find(
                            (projectItem) => projectItem.id === task.projectId
                          );
                          const taskSprint = sprintRecords.find(
                            (sprintItem) => sprintItem.id === task.sprintId
                          );

                          return (
                            <li key={task.id}>
                              <strong>{task.title}</strong>
                              <span>{taskSprint?.name ?? "Unknown sprint"}</span>
                              <p>
                                {taskProject?.name ?? "Unknown project"} / {task.status}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p>No sprint task assignments.</p>
                    )}
                  </article>
                </div>
              </section>
            )}
          </>
        )}

        {activeView === "team" && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Teams"
              title={visibleTeam.name}
              description="Team view for understanding ownership, capacity, focus area, and project assignment."
            />

            {isAdmin && (
              <section className="context-switcher" aria-label="Team selection">
                <label htmlFor="team-view-select">Viewing team</label>
                <select
                  id="team-view-select"
                  value={visibleTeam.id}
                  onChange={(event) => setSelectedTeamId(Number(event.target.value))}
                >
                  {teamRecords.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <span>{visibleTeam.focusArea}</span>
              </section>
            )}

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
            {!openedProject ? (
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
                  <div className="project-search-bar">
                    <label htmlFor="project-search">Filter projects</label>
                    <input
                      id="project-search"
                      type="search"
                      value={projectSearch}
                      onChange={(event) => setProjectSearch(event.target.value)}
                      placeholder="Project name or client"
                    />
                  </div>

                  {filteredProjects.map((projectItem) => {
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
                        onClick={() => {
                          if (isAccessible) {
                            rememberDetailOrigin();
                            setSelectedProjectId(projectItem.id);
                            setOpenedProjectId(projectItem.id);
                          }
                        }}
                      >
                        <span>
                          <span className="eyebrow">{projectItem.clientName}</span>
                          <strong>{projectItem.name}</strong>
                          <span>{projectItem.description}</span>
                        </span>
                        <span className="project-access-card__meta">
                          <small>Status: {projectItem.status}</small>
                          <small>Due {formatDate(projectItem.deadline)}</small>
                          <small>{isAccessible ? "Open project →" : "Locked · Not assigned"}</small>
                        </span>
                      </button>
                    );
                  })}

                  {filteredProjects.length === 0 && (
                    <div className="empty-table-state">No projects match the current filter.</div>
                  )}
                </section>
              </>
            ) : (
              <section className="project-detail-page" aria-label="Opened project detail">
                <div className="detail-action-row">
                  <DetailNavigation
                    sectionLabel="Projects"
                    currentLabel={openedProject.name}
                    onBack={() => returnFromDetail(() => setOpenedProjectId(null))}
                    onDashboard={() => {
                      setOpenedProjectId(null);
                      handleNavigation("dashboard");
                    }}
                  />

                  {isAdmin && (
                    <button
                      className="delete-detail-button"
                      type="button"
                      onClick={() => handleDeleteOpenedProject(openedProject)}
                    >
                      Delete project
                    </button>
                  )}
                </div>

                <div className="project-detail-panel__header">
                  <div>
                    <p className="eyebrow">{openedProject.clientName}</p>
                    <h2>{openedProject.name}</h2>
                    <p>{openedProject.longDescription ?? openedProject.description}</p>
                  </div>
                </div>

                <div className="project-detail-grid">
                  <article>
                    <span>Budget</span>
                    <strong>
                      {openedProject.usedHours}/{openedProject.budgetHours}h
                    </strong>
                  </article>
                  <article>
                    <span>Status</span>
                    <strong>{openedProject.status}</strong>
                  </article>
                  <article>
                    <span>Deadline</span>
                    <strong>{openedProject.deadline}</strong>
                  </article>
                  <article>
                    <span>Risk notes</span>
                    <strong>{openedProject.riskNotes}</strong>
                  </article>
                </div>

                <div className="project-detail-columns">
                  <article>
                    <h3>Assigned team</h3>
                    {openedProjectTeam ? (
                      <>
                        <strong>{openedProjectTeam.name}</strong>
                        <p>{openedProjectTeam.notes}</p>
                        <ul>
                          {openedProjectTeamMembers.map((member) => (
                            <li key={member.id}>
                              {member.name} {member.surname} - {member.role}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p>No team assigned.</p>
                    )}
                  </article>

                  <article>
                    <h3>Sprints to do</h3>
                    {openedProjectSprints.length > 0 ? (
                      <ul>
                        {openedProjectSprints.map((sprintItem) => (
                          <li key={sprintItem.id}>
                            <strong>{sprintItem.name}</strong>
                            <span>
                              {sprintItem.startDate} to {sprintItem.endDate}
                            </span>
                            <p>{sprintItem.goal}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No sprint plan available yet.</p>
                    )}
                  </article>
                </div>
              </section>
            )}
          </>
        )}

        {activeView === "sprints" && (
          <>
            {!openedSprint || !openedSprintProject ? (
              <>
                <PageHeader
                  currentProject={selectedProject}
                  eyebrow="Sprints"
                  title="Sprint planning overview"
                  description={
                    isAdmin
                      ? "Admin users can open every sprint across every project."
                      : "Sprints outside your project assignment are visible but locked."
                  }
                />

                <section className="project-list" aria-label="Sprint access list">
                  <div className="project-search-bar">
                    <label htmlFor="sprint-search">Filter sprints</label>
                    <input
                      id="sprint-search"
                      type="search"
                      value={sprintSearch}
                      onChange={(event) => setSprintSearch(event.target.value)}
                      placeholder="Sprint, project, client, goal"
                    />
                  </div>

                  {filteredSprints.map((sprintItem) => {
                    const sprintProject = projectRecords.find(
                      (projectItem) => projectItem.id === sprintItem.projectId
                    );
                    const isAccessible = canOpenProject(sprintItem.projectId);

                    return (
                      <button
                        className={[
                          "project-access-card",
                          openedSprint?.id === sprintItem.id ? "project-access-card--active" : "",
                          !isAccessible ? "project-access-card--locked" : ""
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        disabled={!isAccessible}
                        key={sprintItem.id}
                        type="button"
                        onClick={() => {
                          if (isAccessible) {
                            rememberDetailOrigin();
                            setSelectedProjectId(sprintItem.projectId);
                            setOpenedSprintId(sprintItem.id);
                          }
                        }}
                      >
                        <span>
                          <span className="eyebrow">{sprintProject?.clientName ?? "No client"}</span>
                          <strong>{sprintItem.name}</strong>
                          <span>{sprintItem.goal}</span>
                        </span>
                        <span className="project-access-card__meta">
                          <small>Project: {sprintProject?.name ?? "Unknown project"}</small>
                          <small>Status: {sprintItem.status}</small>
                          <small>
                            {formatDate(sprintItem.startDate)} – {formatDate(sprintItem.endDate)}
                          </small>
                          <small>{isAccessible ? "Open sprint →" : "Locked · Not assigned"}</small>
                        </span>
                      </button>
                    );
                  })}

                  {filteredSprints.length === 0 && (
                    <div className="empty-table-state">No sprints match the current filter.</div>
                  )}
                </section>
              </>
            ) : (
              <section className="project-detail-page" aria-label="Opened sprint detail">
                <div className="detail-action-row">
                  <DetailNavigation
                    sectionLabel="Sprints"
                    currentLabel={openedSprint.name}
                    onBack={() => returnFromDetail(() => setOpenedSprintId(null))}
                    onDashboard={() => {
                      setOpenedSprintId(null);
                      handleNavigation("dashboard");
                    }}
                  />

                  {isAdmin && (
                    <button
                      className="delete-detail-button"
                      type="button"
                      onClick={() => handleDeleteOpenedSprint(openedSprint)}
                    >
                      Delete sprint
                    </button>
                  )}
                </div>

                <div className="project-detail-panel__header">
                  <div>
                    <p className="eyebrow">{openedSprintProject.name}</p>
                    <h2>{openedSprint.name}</h2>
                    <p>{openedSprint.longDescription ?? openedSprint.goal}</p>
                  </div>
                </div>

                <div className="project-detail-grid">
                  <article>
                    <span>Client</span>
                    <strong>{openedSprintProject.clientName}</strong>
                  </article>
                  <article>
                    <span>Status</span>
                    <strong>{openedSprint.status}</strong>
                  </article>
                  <article>
                    <span>Start</span>
                    <strong>{openedSprint.startDate}</strong>
                  </article>
                  <article>
                    <span>End</span>
                    <strong>{openedSprint.endDate}</strong>
                  </article>
                  <article>
                    <span>Capacity</span>
                    <strong>
                      {openedSprint.capacityHours ? `${openedSprint.capacityHours}h` : "Not set"}
                    </strong>
                  </article>
                  <article>
                    <span>Focus area</span>
                    <strong>{openedSprint.focusArea ?? "Not set"}</strong>
                  </article>
                </div>

                <div className="project-detail-columns">
                  <article>
                    <h3>Assigned team</h3>
                    {openedSprintTeam ? (
                      <>
                        <strong>{openedSprintTeam.name}</strong>
                        <p>{openedSprintTeam.notes}</p>
                        <ul>
                          {openedSprintTeamMembers.map((member) => (
                            <li key={member.id}>
                              {member.name} {member.surname} - {member.role}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p>No team assigned.</p>
                    )}
                  </article>

                  <article>
                    <h3>Tasks in this sprint</h3>
                    {openedSprintTasks.length > 0 ? (
                      <ul>
                        {openedSprintTasks.map((task) => (
                          <li key={task.id}>
                            <strong>{task.title}</strong>
                            <span>
                              {task.status} / {task.priority} priority
                            </span>
                            <p>
                              {task.spentHours}/{task.estimateHours}h used
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No tasks have been assigned to this sprint yet.</p>
                    )}
                  </article>

                  <article>
                    <h3>Backlog notes</h3>
                    <p>{openedSprint.backlogNotes || "No backlog notes added yet."}</p>
                    <h3>Definition of done</h3>
                    <p>{openedSprint.definitionOfDone || "No definition of done added yet."}</p>
                  </article>

                  <article>
                    <h3>Risks and dependencies</h3>
                    <p>{openedSprint.riskNotes || "No sprint risks recorded."}</p>
                  </article>
                </div>
              </section>
            )}
          </>
        )}

        {activeView === "admin" && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Administration"
              title="Data management"
              description="Create and maintain workspace data from one protected area."
            />

            <section className="admin-edit-shell" aria-label="Data management tools">
              <aside className="admin-edit-sidebar">
                <p className="eyebrow">Edit categories</p>
                <button
                  className={
                    adminEditSection === "sprints"
                      ? "admin-edit-tab admin-edit-tab--active"
                      : "admin-edit-tab"
                  }
                  type="button"
                  onClick={() => setAdminEditSection("sprints")}
                >
                  <strong>Sprints</strong>
                  <span>Create sprint plans and planning metadata</span>
                </button>
                <button
                  className={
                    adminEditSection === "projects"
                      ? "admin-edit-tab admin-edit-tab--active"
                      : "admin-edit-tab"
                  }
                  type="button"
                  onClick={() => setAdminEditSection("projects")}
                >
                  <strong>Projects</strong>
                  <span>Edit project identity, budget, status, and risk</span>
                </button>
                <button
                  className={
                    adminEditSection === "teams"
                      ? "admin-edit-tab admin-edit-tab--active"
                      : "admin-edit-tab"
                  }
                  type="button"
                  onClick={() => setAdminEditSection("teams")}
                >
                  <strong>Teams</strong>
                  <span>Create teams, assign leads, members, and projects</span>
                </button>
                <button
                  className={
                    adminEditSection === "dependents"
                      ? "admin-edit-tab admin-edit-tab--active"
                      : "admin-edit-tab"
                  }
                  type="button"
                  onClick={() => setAdminEditSection("dependents")}
                >
                  <strong>People</strong>
                  <span>Create team members and edit their assignments</span>
                </button>
              </aside>

              {adminEditSection === "sprints" && (
                <section className="sprint-creator" aria-label="Sprint creator">
                  <div className="sprint-creator__intro">
                    <div>
                      <p className="eyebrow">Sprint manager</p>
                      <h2>
                        {sprintFormMode === "create"
                          ? "Create a sprint plan"
                          : "Edit sprint data"}
                      </h2>
                      <p>
                        Create a new sprint or update an existing one by changing its timebox, goal,
                        capacity, backlog notes, and quality expectations.
                      </p>
                    </div>
                    <span>Admin editable</span>
                  </div>

                  <div className="form-mode-toggle" aria-label="Sprint form mode">
                    <button
                      className={sprintFormMode === "create" ? "form-mode-toggle__active" : ""}
                      type="button"
                      onClick={resetSprintForm}
                    >
                      Create new
                    </button>
                    <button
                      className={sprintFormMode === "edit" ? "form-mode-toggle__active" : ""}
                      type="button"
                      onClick={() => loadSprintForEdit(editedSprintId)}
                    >
                      Edit existing
                    </button>
                  </div>

                  <form className="sprint-creator-form" onSubmit={handleSaveSprint}>
                    {sprintFormMode === "edit" && (
                      <label>
                        Sprint to edit
                        <select
                          value={editedSprintId}
                          onChange={(event) => loadSprintForEdit(event.target.value)}
                        >
                          {sprintRecords.map((sprintItem) => {
                            const sprintProject = projectRecords.find(
                              (projectItem) => projectItem.id === sprintItem.projectId
                            );

                            return (
                              <option key={sprintItem.id} value={sprintItem.id}>
                                {sprintItem.name} - {sprintProject?.name ?? "Unknown project"}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    )}

                    <label>
                      Project
                      <select
                        value={newSprintProjectId}
                        onChange={(event) => setNewSprintProjectId(event.target.value)}
                      >
                        {projectRecords.map((projectItem) => (
                          <option key={projectItem.id} value={projectItem.id}>
                            {projectItem.name} - {projectItem.clientName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Sprint name
                      <input
                        value={newSprintName}
                        onChange={(event) => setNewSprintName(event.target.value)}
                        placeholder="Example: Sprint 5 - Reporting polish"
                      />
                    </label>

                    <label>
                      Status
                      <select
                        value={newSprintStatus}
                        onChange={(event) =>
                          setNewSprintStatus(event.target.value as Sprint["status"])
                        }
                      >
                        <option value="Planned">Planned</option>
                        <option value="Active">Active</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </label>

                    <label>
                      Start date
                      <input
                        type="date"
                        value={newSprintStartDate}
                        onChange={(event) => setNewSprintStartDate(event.target.value)}
                      />
                    </label>

                    <label>
                      End date
                      <input
                        type="date"
                        value={newSprintEndDate}
                        onChange={(event) => setNewSprintEndDate(event.target.value)}
                      />
                    </label>

                    <label>
                      Capacity hours
                      <input
                        min="1"
                        type="number"
                        value={newSprintCapacityHours}
                        onChange={(event) => setNewSprintCapacityHours(event.target.value)}
                      />
                    </label>

                    <label>
                      Focus area
                      <select
                        value={newSprintFocus}
                        onChange={(event) => setNewSprintFocus(event.target.value)}
                      >
                        <option>Feature delivery</option>
                        <option>Bug fixing</option>
                        <option>Technical debt</option>
                        <option>Discovery</option>
                        <option>Release hardening</option>
                        <option>Client feedback</option>
                      </select>
                    </label>

                    <label className="sprint-creator-form__wide">
                      Sprint goal
                      <textarea
                        value={newSprintGoal}
                        onChange={(event) => setNewSprintGoal(event.target.value)}
                        placeholder="What valuable outcome should the team achieve by the end?"
                        rows={3}
                      />
                    </label>

                    <label className="sprint-creator-form__wide">
                      Extended description
                      <textarea
                        value={newSprintDescription}
                        onChange={(event) => setNewSprintDescription(event.target.value)}
                        placeholder="Context, expected outcome, stakeholders, or delivery notes."
                        rows={4}
                      />
                    </label>

                    <label className="sprint-creator-form__wide">
                      Backlog notes
                      <textarea
                        value={newSprintBacklogNotes}
                        onChange={(event) => setNewSprintBacklogNotes(event.target.value)}
                        placeholder="Which work should be pulled into this sprint?"
                        rows={3}
                      />
                    </label>

                    <label className="sprint-creator-form__wide">
                      Definition of done
                      <textarea
                        value={newSprintDefinitionOfDone}
                        onChange={(event) => setNewSprintDefinitionOfDone(event.target.value)}
                        rows={3}
                      />
                    </label>

                    <label className="sprint-creator-form__wide">
                      Risks or dependencies
                      <textarea
                        value={newSprintRisks}
                        onChange={(event) => setNewSprintRisks(event.target.value)}
                        placeholder="External blockers, unclear requirements, unavailable people..."
                        rows={3}
                      />
                    </label>

                    <div className="sprint-creator-actions">
                      <p>{sprintCreatorMessage}</p>
                      <button type="submit">
                        {sprintFormMode === "create" ? "Create sprint" : "Save sprint changes"}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {adminEditSection === "projects" && (
                <section className="sprint-creator" aria-label="Project editor">
                  <div className="sprint-creator__intro">
                    <div>
                      <p className="eyebrow">Project manager</p>
                      <h2>
                        {projectFormMode === "create"
                          ? "Create project data"
                          : "Edit project data"}
                      </h2>
                      <p>
                        Create a project or update identity, client, delivery status, budget hours,
                        deadline, descriptions, and risk notes used across the portal.
                      </p>
                    </div>
                    <span>Admin editable</span>
                  </div>

                  <div className="form-mode-toggle" aria-label="Project form mode">
                    <button
                      className={projectFormMode === "create" ? "form-mode-toggle__active" : ""}
                      type="button"
                      onClick={resetProjectForm}
                    >
                      Create new
                    </button>
                    <button
                      className={projectFormMode === "edit" ? "form-mode-toggle__active" : ""}
                      type="button"
                      onClick={() => loadProjectForEdit(editedProjectId)}
                    >
                      Edit existing
                    </button>
                  </div>

                  <form className="sprint-creator-form" onSubmit={handleSaveProject}>
                    {projectFormMode === "edit" && (
                      <label>
                        Project to edit
                        <select
                          value={editedProjectId}
                          onChange={(event) => loadProjectForEdit(event.target.value)}
                        >
                          {projectRecords.map((projectItem) => (
                            <option key={projectItem.id} value={projectItem.id}>
                              {projectItem.name} - {projectItem.clientName}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label>
                      Project name
                      <input
                        value={editedProjectName}
                        onChange={(event) => setEditedProjectName(event.target.value)}
                      />
                    </label>

                    <label>
                      Client name
                      <input
                        value={editedProjectClientName}
                        onChange={(event) => setEditedProjectClientName(event.target.value)}
                      />
                    </label>

                    <label>
                      Status
                      <select
                        value={editedProjectStatus}
                        onChange={(event) =>
                          setEditedProjectStatus(event.target.value as Project["status"])
                        }
                      >
                        <option value="On Track">On Track</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </label>

                    <label>
                      Budget hours
                      <input
                        min="1"
                        type="number"
                        value={editedProjectBudgetHours}
                        onChange={(event) => setEditedProjectBudgetHours(event.target.value)}
                      />
                    </label>

                    <label>
                      Used hours
                      <input
                        min="0"
                        type="number"
                        value={editedProjectUsedHours}
                        onChange={(event) => setEditedProjectUsedHours(event.target.value)}
                      />
                    </label>

                    <label>
                      Deadline
                      <input
                        type="date"
                        value={editedProjectDeadline}
                        onChange={(event) => setEditedProjectDeadline(event.target.value)}
                      />
                    </label>

                    <label className="sprint-creator-form__wide">
                      Short description
                      <textarea
                        value={editedProjectDescription}
                        onChange={(event) => setEditedProjectDescription(event.target.value)}
                        rows={3}
                      />
                    </label>

                    <label className="sprint-creator-form__wide">
                      Extended description
                      <textarea
                        value={editedProjectLongDescription}
                        onChange={(event) => setEditedProjectLongDescription(event.target.value)}
                        rows={4}
                      />
                    </label>

                    <label className="sprint-creator-form__wide">
                      Risk notes
                      <textarea
                        value={editedProjectRiskNotes}
                        onChange={(event) => setEditedProjectRiskNotes(event.target.value)}
                        rows={3}
                      />
                    </label>

                    <div className="sprint-creator-actions">
                      <p>{projectEditorMessage}</p>
                      <button type="submit">
                        {projectFormMode === "create" ? "Create project" : "Save project changes"}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {adminEditSection === "teams" && (
                <section className="sprint-creator" aria-label="Team editor">
                  <div className="sprint-creator__intro">
                    <div>
                      <p className="eyebrow">Team manager</p>
                      <h2>{teamFormMode === "create" ? "Create team" : "Edit team"}</h2>
                      <p>
                        Create or update squads by choosing a lead, members, assigned projects,
                        focus area, and operational notes.
                      </p>
                    </div>
                    <span>Admin editable</span>
                  </div>

                  <div className="form-mode-toggle" aria-label="Team form mode">
                    <button
                      className={teamFormMode === "create" ? "form-mode-toggle__active" : ""}
                      type="button"
                      onClick={resetTeamForm}
                    >
                      Create new
                    </button>
                    <button
                      className={teamFormMode === "edit" ? "form-mode-toggle__active" : ""}
                      type="button"
                      onClick={() => loadTeamForEdit(editedTeamId)}
                    >
                      Edit existing
                    </button>
                  </div>

                  <form className="sprint-creator-form" onSubmit={handleSaveTeam}>
                    {teamFormMode === "edit" && (
                      <label>
                        Team to edit
                        <select
                          value={editedTeamId}
                          onChange={(event) => loadTeamForEdit(event.target.value)}
                        >
                          {teamRecords.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label>
                      Team name
                      <input value={teamName} onChange={(event) => setTeamName(event.target.value)} />
                    </label>

                    <label>
                      Focus area
                      <input
                        value={teamFocusArea}
                        onChange={(event) => setTeamFocusArea(event.target.value)}
                      />
                    </label>

                    <label>
                      Team lead
                      <select value={teamLeadId} onChange={(event) => setTeamLeadId(event.target.value)}>
                        {teamMemberRecords.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} {member.surname} - {member.role}
                          </option>
                        ))}
                      </select>
                    </label>

                    <fieldset className="checkbox-group">
                      <legend>Assigned members</legend>
                      {teamMemberRecords.map((member) => (
                        <label key={member.id}>
                          <input
                            checked={teamMemberIds.includes(String(member.id))}
                            type="checkbox"
                            onChange={() =>
                              setTeamMemberIds((currentIds) =>
                                toggleSelection(currentIds, String(member.id))
                              )
                            }
                          />
                          <span>
                            {member.name} {member.surname} / {member.role}
                          </span>
                        </label>
                      ))}
                    </fieldset>

                    <fieldset className="checkbox-group">
                      <legend>Assigned projects</legend>
                      {projectRecords.map((projectItem) => (
                        <label key={projectItem.id}>
                          <input
                            checked={teamProjectIds.includes(String(projectItem.id))}
                            type="checkbox"
                            onChange={() =>
                              setTeamProjectIds((currentIds) =>
                                toggleSelection(currentIds, String(projectItem.id))
                              )
                            }
                          />
                          <span>{projectItem.name}</span>
                        </label>
                      ))}
                    </fieldset>

                    <label className="sprint-creator-form__wide">
                      Team notes
                      <textarea
                        value={teamNotes}
                        onChange={(event) => setTeamNotes(event.target.value)}
                        rows={4}
                      />
                    </label>

                    <div className="sprint-creator-actions">
                      <p>{teamEditorMessage}</p>
                      <button type="submit">
                        {teamFormMode === "create" ? "Create team" : "Save team changes"}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {adminEditSection === "dependents" && (
                <section className="sprint-creator" aria-label="People editor">
                  <div className="sprint-creator__intro">
                    <div>
                      <p className="eyebrow">People manager</p>
                      <h2>
                        {dependentFormMode === "create" ? "Create employee" : "Edit employee"}
                      </h2>
                      <p>
                        Create or update employee contact data, job details, capacity, project
                        assignments, and profile notes.
                      </p>
                    </div>
                    <span>Admin editable</span>
                  </div>

                  <div className="form-mode-toggle" aria-label="Dependent form mode">
                    <button
                      className={
                        dependentFormMode === "create" ? "form-mode-toggle__active" : ""
                      }
                      type="button"
                      onClick={resetDependentForm}
                    >
                      Create new
                    </button>
                    <button
                      className={dependentFormMode === "edit" ? "form-mode-toggle__active" : ""}
                      type="button"
                      onClick={() => loadDependentForEdit(editedDependentId)}
                    >
                      Edit existing
                    </button>
                  </div>

                  <form className="sprint-creator-form" onSubmit={handleSaveDependent}>
                    {dependentFormMode === "edit" && (
                      <label>
                        Employee to edit
                        <select
                          value={editedDependentId}
                          onChange={(event) => loadDependentForEdit(event.target.value)}
                        >
                          {teamMemberRecords.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} {member.surname} - {member.email}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label>
                      Name
                      <input value={dependentName} onChange={(event) => setDependentName(event.target.value)} />
                    </label>

                    <label>
                      Surname
                      <input
                        value={dependentSurname}
                        onChange={(event) => setDependentSurname(event.target.value)}
                      />
                    </label>

                    <label>
                      Email
                      <input
                        type="email"
                        value={dependentEmail}
                        onChange={(event) => setDependentEmail(event.target.value)}
                      />
                    </label>

                    <label>
                      Phone number
                      <input
                        value={dependentPhoneNumber}
                        onChange={(event) => setDependentPhoneNumber(event.target.value)}
                      />
                    </label>

                    <label>
                      Job role
                      <input
                        value={dependentRole}
                        onChange={(event) => setDependentRole(event.target.value)}
                      />
                    </label>

                    <label>
                      Hourly wage
                      <input
                        min="1"
                        type="number"
                        value={dependentHourlyWage}
                        onChange={(event) => setDependentHourlyWage(event.target.value)}
                      />
                    </label>

                    <label>
                      Weekly capacity
                      <input
                        min="1"
                        type="number"
                        value={dependentWeeklyCapacityHours}
                        onChange={(event) => setDependentWeeklyCapacityHours(event.target.value)}
                      />
                    </label>

                    <fieldset className="checkbox-group">
                      <legend>Assigned projects</legend>
                      {projectRecords.map((projectItem) => (
                        <label key={projectItem.id}>
                          <input
                            checked={dependentProjectIds.includes(String(projectItem.id))}
                            type="checkbox"
                            onChange={() =>
                              setDependentProjectIds((currentIds) =>
                                toggleSelection(currentIds, String(projectItem.id))
                              )
                            }
                          />
                          <span>{projectItem.name}</span>
                        </label>
                      ))}
                    </fieldset>

                    <label className="sprint-creator-form__wide">
                      Bio / notes
                      <textarea
                        value={dependentBio}
                        onChange={(event) => setDependentBio(event.target.value)}
                        rows={4}
                      />
                    </label>

                    <div className="sprint-creator-actions">
                      <p>{dependentEditorMessage}</p>
                      <button type="submit">
                        {dependentFormMode === "create"
                          ? "Create employee"
                          : "Save employee changes"}
                      </button>
                    </div>
                  </form>
                </section>
              )}
            </section>
          </>
        )}

        {activeView === "tasks" && (
          <>
            <PageHeader
              currentProject={selectedProject}
              eyebrow="Sprint Execution"
              title="Sprint execution"
              description="A focused delivery workspace for sprint health, team load, priority risk, and the live task board."
            />

            <section className="execution-hero" aria-label="Sprint execution summary">
              <div>
                <p className="eyebrow">{selectedProject.clientName}</p>
                <h2>{sprintExecutionTitle}</h2>
                <p>{sprintExecutionGoal}</p>
              </div>

              <div className="execution-hero__meta">
                <span>{sprintExecutionDateRange}</span>
                <strong>{selectedSprint?.status ?? "Project scope"}</strong>
              </div>
            </section>

            <section className="execution-kpis" aria-label="Sprint execution metrics">
              <MetricCard
                label="Completion"
                value={`${sprintCompletion}%`}
                helper={`${selectedSprintTasks.filter((task) => task.status === "Done").length}/${
                  selectedSprintTasks.length
                } tasks done`}
                tone={sprintCompletion >= 70 ? "success" : "neutral"}
              />
              <MetricCard
                label="Hours used"
                value={`${sprintSpentHours}/${sprintEstimateHours}h`}
                helper="Spent hours against planned effort"
                tone={sprintSpentHours > sprintEstimateHours ? "warning" : "neutral"}
              />
              <MetricCard
                label="Active work"
                value={String(activeTaskCount)}
                helper="Tasks currently in progress or review"
              />
              <MetricCard
                label="Priority risk"
                value={String(openHighPriorityTasks.length)}
                helper="High priority tasks not done yet"
                tone={openHighPriorityTasks.length > 0 ? "warning" : "success"}
              />
            </section>

            <section className="execution-layout" aria-label="Sprint execution workspace">
              <aside className="execution-panel">
                <div className="execution-panel__header">
                  <div>
                    <p className="eyebrow">Sprint backlog</p>
                    <h2>Select scope</h2>
                  </div>
                  <span>{selectedProjectSprints.length}</span>
                </div>

                <div className="execution-sprint-list">
                  <button
                    className={
                      !selectedSprint
                        ? "execution-sprint-card execution-sprint-card--active"
                        : "execution-sprint-card"
                    }
                    type="button"
                    onClick={() => setSelectedSprintId(null)}
                  >
                    <span>All sprint work</span>
                    <strong>Project task flow</strong>
                    <small>{selectedProjectTasks.length} tasks across this project</small>
                  </button>

                  {selectedProjectSprints.map((sprintItem) => {
                    const sprintTasks = selectedProjectTasks.filter(
                      (task) => task.sprintId === sprintItem.id
                    );
                    const sprintDoneTasks = sprintTasks.filter((task) => task.status === "Done");
                    const sprintProgress =
                      sprintTasks.length > 0
                        ? Math.round((sprintDoneTasks.length / sprintTasks.length) * 100)
                        : 0;

                    return (
                      <button
                        className={
                          selectedSprint?.id === sprintItem.id
                            ? "execution-sprint-card execution-sprint-card--active"
                            : "execution-sprint-card"
                        }
                        key={sprintItem.id}
                        type="button"
                        onClick={() => setSelectedSprintId(sprintItem.id)}
                      >
                        <span>{sprintItem.status}</span>
                        <strong>{sprintItem.name}</strong>
                        <small>{sprintItem.goal}</small>
                        <div className="mini-progress" aria-label={`${sprintProgress}% complete`}>
                          <span style={{ width: `${sprintProgress}%` }} />
                        </div>
                        <small>
                          {sprintDoneTasks.length}/{sprintTasks.length} tasks done
                        </small>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="execution-main">
                <section className="execution-health">
                  <article className="execution-panel">
                    <div className="execution-panel__header">
                      <div>
                        <p className="eyebrow">Sprint health</p>
                        <h2>Status flow</h2>
                      </div>
                      <span>{sprintCompletion}%</span>
                    </div>

                    <div className="status-flow">
                      {sprintStatusBreakdown.map((statusItem) => (
                        <div className="status-flow__row" key={statusItem.label}>
                          <span>{statusItem.label}</span>
                          <div>
                            <span
                              style={{
                                width:
                                  selectedSprintTasks.length > 0
                                    ? `${Math.round(
                                        (statusItem.count / selectedSprintTasks.length) * 100
                                      )}%`
                                    : "0%"
                              }}
                            />
                          </div>
                          <strong>{statusItem.count}</strong>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="execution-panel">
                    <div className="execution-panel__header">
                      <div>
                        <p className="eyebrow">Team load</p>
                        <h2>{selectedProjectTeam?.name ?? "Assigned team"}</h2>
                      </div>
                      <span>{selectedProjectTeamMembers.length}</span>
                    </div>

                    <div className="team-load-list">
                      {sprintTeamLoad.map((loadItem) => (
                        <div className="team-load-row" key={loadItem.member.id}>
                          <div>
                            <strong>
                              {loadItem.member.name} {loadItem.member.surname}
                            </strong>
                            <span>
                              {loadItem.taskCount} tasks / {loadItem.plannedHours}h planned
                            </span>
                          </div>
                          <div className="mini-progress" aria-label={`${loadItem.loadPercent}% load`}>
                            <span style={{ width: `${loadItem.loadPercent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>

                <section className="execution-board-header">
                  <div>
                    <p className="eyebrow">Live board</p>
                    <h2>{sprintExecutionTitle}</h2>
                  </div>
                  <p>Select a sprint to focus the board, workload, and status metrics.</p>
                </section>

                <TaskBoard tasks={selectedSprintTasks} teamMembers={teamMemberRecords} />
              </div>
            </section>
          </>
        )}

        {dashboardInsightId && (
          <div
            className="dashboard-drawer-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDashboardInsight();
              }
            }}
          >
            <aside
              ref={dashboardDrawerRef}
              className="dashboard-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dashboard-drawer-title"
            >
              <header className="dashboard-drawer__header">
                <div className="dashboard-drawer__topbar">
                  <button
                    className="dashboard-drawer__back"
                    autoFocus
                    type="button"
                    onClick={goBackDashboardInsight}
                  >
                    <span aria-hidden="true">←</span>
                    {dashboardInsightHistory.length > 0
                      ? `Back to ${
                          getDashboardInsightMeta(
                            dashboardInsightHistory[
                              dashboardInsightHistory.length - 1
                            ]
                          ).title
                        }`
                      : "Back to dashboard"}
                  </button>
                  <button
                    className="dashboard-drawer__close"
                    type="button"
                    aria-label="Close details"
                    onClick={closeDashboardInsight}
                  >
                    ×
                  </button>
                </div>
                <nav className="dashboard-drawer__breadcrumb" aria-label="Breadcrumb">
                  <button type="button" onClick={closeDashboardInsight}>
                    Dashboard
                  </button>
                  <span aria-hidden="true">/</span>
                  {dashboardInsightHistory.map((insightId, historyIndex) => (
                    <span className="dashboard-drawer__breadcrumb-level" key={`${insightId}-${historyIndex}`}>
                      <button
                        type="button"
                        onClick={() => goToDashboardInsightHistory(historyIndex)}
                      >
                        {getDashboardInsightMeta(insightId).title}
                      </button>
                      <span aria-hidden="true">/</span>
                    </span>
                  ))}
                  <span aria-current="page">{getDashboardInsightMeta().title}</span>
                </nav>
                <div className="dashboard-drawer__title">
                  <p className="eyebrow">{getDashboardInsightMeta().eyebrow}</p>
                  <h2 id="dashboard-drawer-title">{getDashboardInsightMeta().title}</h2>
                  <p>{getDashboardInsightMeta().description}</p>
                </div>
              </header>
              <div className="dashboard-drawer__body">{renderDashboardInsightContent()}</div>
            </aside>
          </div>
        )}

        <footer className="app-footer">
          <span>© 2026 TaaS Pulse</span>
          <span>Local demo workspace · Do not use real credentials</span>
        </footer>
      </main>
    </div>
  );
}

type PageHeaderProps = {
  currentProject: Project;
  eyebrow: string;
  title: string;
  description: string;
};

function DetailNavigation({
  sectionLabel,
  currentLabel,
  onBack,
  onDashboard
}: {
  sectionLabel: string;
  currentLabel: string;
  onBack: () => void;
  onDashboard: () => void;
}) {
  return (
    <div className="detail-navigation">
      <button className="back-button" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        Back to {sectionLabel.toLowerCase()}
      </button>
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={onDashboard}>
          Dashboard
        </button>
        <span aria-hidden="true">/</span>
        <button type="button" onClick={onBack}>
          {sectionLabel}
        </button>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{currentLabel}</span>
      </nav>
    </div>
  );
}

type DashboardIconName =
  | "projects"
  | "tasks"
  | "capacity"
  | "risk"
  | "progress"
  | "workload";

type DashboardToolbarProps = {
  message: string;
  actions: Array<{ label: string; view: ViewId; primary?: boolean }>;
  onNavigate: (view: ViewId) => void;
};

function DashboardToolbar({ message, actions, onNavigate }: DashboardToolbarProps) {
  return (
    <section className="dashboard-toolbar" aria-label="Dashboard actions">
      <div className="dashboard-live-status">
        <span aria-hidden="true" />
        <p>
          <strong>Current snapshot</strong>
          {message}
        </p>
      </div>
      <div className="dashboard-toolbar__actions">
        {actions.map((action) => (
          <button
            className={action.primary ? "dashboard-cta dashboard-cta--primary" : "dashboard-cta"}
            key={action.view}
            type="button"
            onClick={() => onNavigate(action.view)}
          >
            {action.label}
            <span aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DashboardProgressRing({
  label,
  percent,
  helper,
  onClick
}: {
  label: string;
  percent: number;
  helper: string;
  onClick: () => void;
}) {
  const safePercent = Math.min(Math.max(percent, 0), 100);
  const ringStyle = { "--progress": `${safePercent}%` } as CSSProperties;

  return (
    <button
      className="dashboard-progress-ring-card"
      type="button"
      title={`${label}: ${safePercent}% — open details`}
      onClick={onClick}
    >
      <span
        className="dashboard-progress-ring"
        style={ringStyle}
        role="img"
        aria-label={`${label}: ${safePercent}%`}
      >
        <span>{safePercent}%</span>
      </span>
      <span className="dashboard-progress-ring-copy">
        <span>{label}</span>
        <strong>{safePercent}%</strong>
        <small>{helper}</small>
      </span>
      <span className="dashboard-ring-hint" aria-hidden="true">→</span>
    </button>
  );
}

function InsightStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="insight-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DashboardIcon({ name }: { name: DashboardIconName }) {
  const paths: Record<DashboardIconName, ReactNode> = {
    projects: (
      <>
        <path d="M4 7.5h16v11H4z" />
        <path d="M4 7.5 7 4.5h4l2 3" />
      </>
    ),
    tasks: (
      <>
        <path d="m5 7 1.5 1.5L9 6" />
        <path d="M11 7h8" />
        <path d="m5 13 1.5 1.5L9 12" />
        <path d="M11 13h8" />
        <path d="M5 19h14" />
      </>
    ),
    capacity: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16.5" cy="9" r="2.5" />
        <path d="M3.5 19c.5-3.5 2-5.5 4.5-5.5s4 2 4.5 5.5" />
        <path d="M13 19c.3-2.7 1.5-4.3 3.5-4.3S20 16.3 20.5 19" />
      </>
    ),
    risk: (
      <>
        <path d="M12 3.5 21 20H3z" />
        <path d="M12 9v4.5" />
        <path d="M12 17h.01" />
      </>
    ),
    progress: (
      <>
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 3v9h9" />
      </>
    ),
    workload: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19H2" />
      </>
    )
  };

  return (
    <span className={`dashboard-icon dashboard-icon--${name}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {paths[name]}
      </svg>
    </span>
  );
}

function normalizePhoneSearch(value: string) {
  return value.replace(/\D/g, "");
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
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
        <span>Current project</span>
        <strong>{currentProject.name}</strong>
        <small>{currentProject.clientName} · Due {formatDate(currentProject.deadline)}</small>
      </div>
    </header>
  );
}

export default App;
