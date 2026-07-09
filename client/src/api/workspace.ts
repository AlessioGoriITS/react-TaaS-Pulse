import type { Project, Sprint, Task, Team, TeamMember } from "../types";

const API_BASE_URL = "http://127.0.0.1:3000";

// Forma dati usata dalla UI React. Il backend traduce lo schema SQLite
// snake_case in queste chiavi camelCase, cosi i componenti non dipendono
// direttamente dai nomi delle colonne del database.
export type WorkspaceData = {
  projects: Project[];
  teamMembers: TeamMember[];
  teams: Team[];
  sprints: Sprint[];
  tasks: Task[];
};

type WorkspaceResponse = {
  workspace: WorkspaceData;
  // Presente dopo create/update/delete: serve alla UI per selezionare
  // subito il record appena creato dal DB, senza inventare ID lato client.
  item?: { id: number };
  error?: string;
};

async function requestWorkspace(path: string, init?: RequestInit) {
  // Le letture semplici hanno bisogno solo dello snapshot aggiornato del workspace.
  const data = await requestWorkspaceResponse(path, init);
  return data.workspace;
}

async function requestWorkspaceResponse(path: string, init?: RequestInit) {
  // Centralizziamo fetch, cookie e gestione errori in un solo punto:
  // se cambiano URL API, auth o formato errore, non tocchiamo tutti gli editor.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
  const data = (await response.json()) as WorkspaceResponse;

  if (!response.ok) {
    // Il backend restituisce messaggi gia pensati per l'utente/admin.
    // Se manca `error`, usiamo un fallback generico.
    throw new Error(data.error ?? "Workspace request failed");
  }

  return data;
}

export function getWorkspace() {
  // Caricamento iniziale dopo il login: e' gia filtrato lato server in base al ruolo.
  return requestWorkspace("/api/workspace");
}

export function saveProject(project: Project, mode: "create" | "edit") {
  // POST crea, PUT aggiorna. Dopo la mutazione il server rimanda il workspace completo,
  // cosi React riallinea progetti, team, sprint e task in un'unica operazione.
  return requestWorkspaceResponse(mode === "edit" ? `/api/projects/${project.id}` : "/api/projects", {
    method: mode === "edit" ? "PUT" : "POST",
    body: JSON.stringify(project)
  });
}

export function deleteProject(projectId: number) {
  // La cancellazione dei dati collegati, come sprint e relazioni team/progetto,
  // viene gestita dal DB tramite foreign key e cascade.
  return requestWorkspaceResponse(`/api/projects/${projectId}`, { method: "DELETE" });
}

export function saveSprint(sprint: Sprint, mode: "create" | "edit") {
  return requestWorkspaceResponse(mode === "edit" ? `/api/sprints/${sprint.id}` : "/api/sprints", {
    method: mode === "edit" ? "PUT" : "POST",
    body: JSON.stringify(sprint)
  });
}

export function deleteSprint(sprintId: number) {
  return requestWorkspaceResponse(`/api/sprints/${sprintId}`, { method: "DELETE" });
}

export function saveEmployee(employee: TeamMember, mode: "create" | "edit") {
  return requestWorkspaceResponse(mode === "edit" ? `/api/employees/${employee.id}` : "/api/employees", {
    method: mode === "edit" ? "PUT" : "POST",
    body: JSON.stringify(employee)
  });
}

export function deleteEmployee(employeeId: number) {
  return requestWorkspaceResponse(`/api/employees/${employeeId}`, { method: "DELETE" });
}

export function saveTeam(team: Team, mode: "create" | "edit") {
  return requestWorkspaceResponse(mode === "edit" ? `/api/teams/${team.id}` : "/api/teams", {
    method: mode === "edit" ? "PUT" : "POST",
    body: JSON.stringify(team)
  });
}

export function deleteTeam(teamId: number) {
  return requestWorkspaceResponse(`/api/teams/${teamId}`, { method: "DELETE" });
}

export function saveTask(task: Task, mode: "create" | "edit") {
  return requestWorkspaceResponse(mode === "edit" ? `/api/tasks/${task.id}` : "/api/tasks", {
    method: mode === "edit" ? "PUT" : "POST",
    body: JSON.stringify(task)
  });
}

export function deleteTask(taskId: number) {
  return requestWorkspaceResponse(`/api/tasks/${taskId}`, { method: "DELETE" });
}
