import type { Project, Sprint, Task, Team, TeamMember } from "../types";

export const projects: Project[] = [
  {
    id: 1,
    name: "Customer Portal Refresh",
    clientName: "Northwind Labs",
    description: "Refresh the customer portal dashboard and reporting workflow.",
    longDescription:
      "Northwind Labs needs a clearer customer-facing portal for tracking account health, support requests, and delivery reports. The current work focuses on a refreshed dashboard, reliable project reporting, and a simpler task flow for internal operators.",
    budgetHours: 420,
    usedHours: 236,
    deadline: "2026-08-21",
    status: "At Risk",
    importance: "High",
    riskNotes: "Budget usage is moving faster than task completion."
  },
  {
    id: 2,
    name: "Internal Billing Console",
    clientName: "Acme Finance",
    description: "Build an internal console for invoice review and budget reporting.",
    longDescription:
      "Acme Finance wants an internal tool for reviewing invoices, tracking billable hours, and spotting budget drift before monthly close. The project is still early, with the team focused on safe data flows and a clean approval experience.",
    budgetHours: 260,
    usedHours: 82,
    deadline: "2026-09-12",
    status: "On Track",
    importance: "Medium",
    riskNotes: "Discovery is complete and implementation is moving steadily."
  },
  {
    id: 3,
    name: "Partner Support Portal",
    clientName: "Globex Partners",
    description: "Create a support portal for partner onboarding and ticket routing.",
    longDescription:
      "Globex Partners needs a structured support portal where partner teams can submit onboarding requests, route tickets, and monitor response progress. The main delivery risk is an external API dependency that is still blocked by security review.",
    budgetHours: 340,
    usedHours: 312,
    deadline: "2026-07-30",
    status: "Blocked",
    importance: "Critical",
    riskNotes: "External API access is delayed by the client security review."
  }
];

export const project = projects[0];

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
  },
  {
    id: 5,
    name: "Elena",
    surname: "Marino",
    email: "elena.marino@example.com",
    phoneNumber: "+39 333 010 1005",
    role: "Frontend Developer",
    hourlyWage: 45,
    weeklyCapacityHours: 32,
    projectIds: [2],
    bio: "Builds reusable frontend components."
  },
  {
    id: 6,
    name: "Marco",
    surname: "Bianchi",
    email: "marco.bianchi@example.com",
    phoneNumber: "+39 333 010 1006",
    role: "Backend Developer",
    hourlyWage: 50,
    weeklyCapacityHours: 30,
    projectIds: [2],
    bio: "Maintains backend service endpoints."
  },
  {
    id: 7,
    name: "Sofia",
    surname: "Greco",
    email: "sofia.greco@example.com",
    phoneNumber: "+39 333 010 1007",
    role: "Product Designer",
    hourlyWage: 42,
    weeklyCapacityHours: 18,
    projectIds: [2],
    bio: "Designs onboarding and dashboard flows."
  },
  {
    id: 8,
    name: "Daniel",
    surname: "Costa",
    email: "daniel.costa@example.com",
    phoneNumber: "+39 333 010 1008",
    role: "QA Engineer",
    hourlyWage: 38,
    weeklyCapacityHours: 24,
    projectIds: [2],
    bio: "Runs manual QA passes before releases."
  },
  {
    id: 9,
    name: "Nadia",
    surname: "Ferrari",
    email: "nadia.ferrari@example.com",
    phoneNumber: "+39 333 010 1009",
    role: "Frontend Developer",
    hourlyWage: 45,
    weeklyCapacityHours: 32,
    projectIds: [3],
    bio: "Focuses on responsive UI implementation."
  },
  {
    id: 10,
    name: "Luca",
    surname: "Romano",
    email: "luca.romano@example.com",
    phoneNumber: "+39 333 010 1010",
    role: "Backend Developer",
    hourlyWage: 50,
    weeklyCapacityHours: 30,
    projectIds: [3],
    bio: "Owns database query optimization."
  },
  {
    id: 11,
    name: "Priya",
    surname: "Nair",
    email: "priya.nair@example.com",
    phoneNumber: "+39 333 010 1011",
    role: "Product Designer",
    hourlyWage: 42,
    weeklyCapacityHours: 18,
    projectIds: [3],
    bio: "Creates design systems and prototypes."
  },
  {
    id: 12,
    name: "Thomas",
    surname: "Meyer",
    email: "thomas.meyer@example.com",
    phoneNumber: "+39 333 010 1012",
    role: "QA Engineer",
    hourlyWage: 38,
    weeklyCapacityHours: 24,
    projectIds: [3],
    bio: "Writes acceptance test scenarios."
  },
  {
    id: 13,
    name: "Giulia",
    surname: "Conti",
    email: "giulia.conti@example.com",
    phoneNumber: "+39 333 010 1013",
    role: "Frontend Developer",
    hourlyWage: 45,
    weeklyCapacityHours: 32,
    projectIds: [],
    bio: "Implements client-side data views."
  },
  {
    id: 14,
    name: "Noah",
    surname: "Schmidt",
    email: "noah.schmidt@example.com",
    phoneNumber: "+39 333 010 1014",
    role: "Backend Developer",
    hourlyWage: 50,
    weeklyCapacityHours: 30,
    projectIds: [],
    bio: "Builds authentication and authorization logic."
  },
  {
    id: 15,
    name: "Aisha",
    surname: "Khan",
    email: "aisha.khan@example.com",
    phoneNumber: "+39 333 010 1015",
    role: "Product Designer",
    hourlyWage: 42,
    weeklyCapacityHours: 18,
    projectIds: [],
    bio: "Improves product usability and information architecture."
  },
  {
    id: 16,
    name: "Matteo",
    surname: "Ricci",
    email: "matteo.ricci@example.com",
    phoneNumber: "+39 333 010 1016",
    role: "QA Engineer",
    hourlyWage: 38,
    weeklyCapacityHours: 24,
    projectIds: [],
    bio: "Coordinates regression testing."
  },
  {
    id: 17,
    name: "Camille",
    surname: "Dubois",
    email: "camille.dubois@example.com",
    phoneNumber: "+39 333 010 1017",
    role: "Frontend Developer",
    hourlyWage: 45,
    weeklyCapacityHours: 32,
    projectIds: [],
    bio: "Builds accessible React interfaces."
  },
  {
    id: 18,
    name: "Andrea",
    surname: "Gallo",
    email: "andrea.gallo@example.com",
    phoneNumber: "+39 333 010 1018",
    role: "Backend Developer",
    hourlyWage: 50,
    weeklyCapacityHours: 30,
    projectIds: [],
    bio: "Maintains API integrations."
  },
  {
    id: 19,
    name: "Mina",
    surname: "Sato",
    email: "mina.sato@example.com",
    phoneNumber: "+39 333 010 1019",
    role: "Product Designer",
    hourlyWage: 42,
    weeklyCapacityHours: 18,
    projectIds: [],
    bio: "Designs reporting and data visualization flows."
  },
  {
    id: 20,
    name: "Oscar",
    surname: "Rinaldi",
    email: "oscar.rinaldi@example.com",
    phoneNumber: "+39 333 010 1020",
    role: "QA Engineer",
    hourlyWage: 38,
    weeklyCapacityHours: 24,
    projectIds: [],
    bio: "Owns bug triage and verification."
  },
  {
    id: 21,
    name: "Laura",
    surname: "Moretti",
    email: "laura.moretti@example.com",
    phoneNumber: "+39 333 010 1021",
    role: "Frontend Developer",
    hourlyWage: 45,
    weeklyCapacityHours: 32,
    projectIds: [],
    bio: "Works on frontend performance improvements."
  },
  {
    id: 22,
    name: "Ethan",
    surname: "Walker",
    email: "ethan.walker@example.com",
    phoneNumber: "+39 333 010 1022",
    role: "Backend Developer",
    hourlyWage: 50,
    weeklyCapacityHours: 30,
    projectIds: [],
    bio: "Builds background processing utilities."
  },
  {
    id: 23,
    name: "Sara",
    surname: "De Luca",
    email: "sara.deluca@example.com",
    phoneNumber: "+39 333 010 1023",
    role: "Product Designer",
    hourlyWage: 42,
    weeklyCapacityHours: 18,
    projectIds: [],
    bio: "Refines user journeys and interface copy."
  },
  {
    id: 24,
    name: "Hugo",
    surname: "Martin",
    email: "hugo.martin@example.com",
    phoneNumber: "+39 333 010 1024",
    role: "QA Engineer",
    hourlyWage: 38,
    weeklyCapacityHours: 24,
    projectIds: [],
    bio: "Prepares release quality checklists."
  },
  {
    id: 25,
    name: "Irene",
    surname: "Villa",
    email: "irene.villa@example.com",
    phoneNumber: "+39 333 010 1025",
    role: "Frontend Developer",
    hourlyWage: 45,
    weeklyCapacityHours: 32,
    projectIds: [],
    bio: "Implements forms and validation states."
  },
  {
    id: 26,
    name: "Samir",
    surname: "Patel",
    email: "samir.patel@example.com",
    phoneNumber: "+39 333 010 1026",
    role: "Backend Developer",
    hourlyWage: 50,
    weeklyCapacityHours: 30,
    projectIds: [],
    bio: "Works on data access and service reliability."
  },
  {
    id: 27,
    name: "Clara",
    surname: "Fontana",
    email: "clara.fontana@example.com",
    phoneNumber: "+39 333 010 1027",
    role: "Product Designer",
    hourlyWage: 42,
    weeklyCapacityHours: 18,
    projectIds: [],
    bio: "Creates high-fidelity UI mockups."
  },
  {
    id: 28,
    name: "Ben",
    surname: "Taylor",
    email: "ben.taylor@example.com",
    phoneNumber: "+39 333 010 1028",
    role: "QA Engineer",
    hourlyWage: 38,
    weeklyCapacityHours: 24,
    projectIds: [],
    bio: "Tests cross-browser behavior."
  },
  {
    id: 29,
    name: "Vera",
    surname: "Leone",
    email: "vera.leone@example.com",
    phoneNumber: "+39 333 010 1029",
    role: "Frontend Developer",
    hourlyWage: 45,
    weeklyCapacityHours: 32,
    projectIds: [],
    bio: "Maintains dashboard interaction patterns."
  },
  {
    id: 30,
    name: "Diego",
    surname: "Russo",
    email: "diego.russo@example.com",
    phoneNumber: "+39 333 010 1030",
    role: "Backend Developer",
    hourlyWage: 50,
    weeklyCapacityHours: 30,
    projectIds: [],
    bio: "Improves backend error handling."
  },
  {
    id: 31,
    name: "Olivia",
    surname: "Stone",
    email: "olivia.stone@example.com",
    phoneNumber: "+39 333 010 1031",
    role: "Product Designer",
    hourlyWage: 42,
    weeklyCapacityHours: 18,
    projectIds: [],
    bio: "Supports product discovery workshops."
  },
  {
    id: 32,
    name: "Enzo",
    surname: "Ferraro",
    email: "enzo.ferraro@example.com",
    phoneNumber: "+39 333 010 1032",
    role: "QA Engineer",
    hourlyWage: 38,
    weeklyCapacityHours: 24,
    projectIds: [],
    bio: "Builds QA documentation."
  },
  {
    id: 33,
    name: "Maya",
    surname: "Silva",
    email: "maya.silva@example.com",
    phoneNumber: "+39 333 010 1033",
    role: "Frontend Developer",
    hourlyWage: 45,
    weeklyCapacityHours: 32,
    projectIds: [],
    bio: "Develops reusable dashboard widgets."
  },
  {
    id: 34,
    name: "Riccardo",
    surname: "Esposito",
    email: "riccardo.esposito@example.com",
    phoneNumber: "+39 333 010 1034",
    role: "Backend Developer",
    hourlyWage: 50,
    weeklyCapacityHours: 30,
    projectIds: [],
    bio: "Supports database migrations and API reviews."
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
  },
  {
    id: 2,
    name: "Billing Platform Team",
    focusArea: "Finance operations and reporting",
    leadId: 6,
    memberIds: [5, 6, 7, 8],
    projectIds: [2],
    notes: "Delivery team focused on billing workflows, approval screens, and reliable reporting."
  },
  {
    id: 3,
    name: "Partner Experience Team",
    focusArea: "Partner onboarding and support",
    leadId: 10,
    memberIds: [9, 10, 11, 12],
    projectIds: [3],
    notes: "Team assigned to partner-facing support flows and third-party API coordination."
  }
];

export const sprints: Sprint[] = [
  {
    id: 1,
    projectId: 1,
    name: "Sprint 4",
    goal: "Stabilize the dashboard and finish the reporting flow.",
    longDescription:
      "This sprint is focused on making the Customer Portal Refresh stable enough for a client-facing walkthrough. The team is tightening dashboard metrics, reviewing empty states, validating risk calculations, and preparing reliable demo data.",
    startDate: "2026-07-06",
    endDate: "2026-07-17",
    status: "Active",
    importance: "High"
  },
  {
    id: 2,
    projectId: 2,
    name: "Sprint 1",
    goal: "Validate invoice review screens and budget summary data.",
    longDescription:
      "This sprint starts the Internal Billing Console by validating the core invoice review flow, early budget summary screens, and the minimum dataset needed for finance operators to trust the tool.",
    startDate: "2026-07-20",
    endDate: "2026-07-31",
    status: "Planned",
    importance: "Medium"
  },
  {
    id: 3,
    projectId: 3,
    name: "Recovery Sprint",
    goal: "Unblock partner API integration and document fallback routing.",
    longDescription:
      "This sprint is a recovery pass for the Partner Support Portal. The team is trying to unblock the external API, document fallback routing, and reduce delivery risk before the deadline gets too close.",
    startDate: "2026-07-13",
    endDate: "2026-07-24",
    status: "Blocked",
    importance: "Critical"
  }
];

export const sprint = sprints[0];

export const tasks: Task[] = [
  {
    id: 1,
    projectId: 1,
    sprintId: 1,
    title: "Build dashboard summary cards",
    status: "Done",
    assigneeId: 1,
    estimateHours: 10,
    spentHours: 9,
    priority: "High"
  },
  {
    id: 2,
    projectId: 1,
    sprintId: 1,
    title: "Define project report API shape",
    status: "In Progress",
    assigneeId: 2,
    estimateHours: 14,
    spentHours: 11,
    priority: "High"
  },
  {
    id: 3,
    projectId: 1,
    sprintId: 1,
    title: "Review task board empty states",
    status: "Review",
    assigneeId: 3,
    estimateHours: 6,
    spentHours: 5,
    priority: "Medium"
  },
  {
    id: 4,
    projectId: 1,
    sprintId: 1,
    title: "Add risk calculation tests",
    status: "Todo",
    assigneeId: 4,
    estimateHours: 8,
    spentHours: 0,
    priority: "Medium"
  },
  {
    id: 5,
    projectId: 1,
    sprintId: 1,
    title: "Prepare demo data for interview walkthrough",
    status: "Todo",
    assigneeId: 1,
    estimateHours: 5,
    spentHours: 0,
    priority: "Low"
  },
  {
    id: 6,
    projectId: 2,
    sprintId: 2,
    title: "Map invoice approval states",
    status: "Todo",
    assigneeId: 6,
    estimateHours: 8,
    spentHours: 0,
    priority: "High"
  },
  {
    id: 7,
    projectId: 2,
    sprintId: 2,
    title: "Prototype billing summary panel",
    status: "Todo",
    assigneeId: 5,
    estimateHours: 10,
    spentHours: 0,
    priority: "Medium"
  },
  {
    id: 8,
    projectId: 3,
    sprintId: 3,
    title: "Document partner API blockers",
    status: "In Progress",
    assigneeId: 10,
    estimateHours: 6,
    spentHours: 3,
    priority: "High"
  },
  {
    id: 9,
    projectId: 3,
    sprintId: 3,
    title: "Design fallback ticket routing",
    status: "Review",
    assigneeId: 11,
    estimateHours: 7,
    spentHours: 5,
    priority: "High"
  }
];
