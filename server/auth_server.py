from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import hashlib
import hmac
import json
import secrets
import sqlite3
from http.cookies import SimpleCookie
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "server" / "data" / "taas_pulse.db"
HOST = "127.0.0.1"
PORT = 3000
SESSION_COOKIE = "taas_pulse_session"
SESSION_HOURS = 8
MAX_FAILED_ATTEMPTS = 5
LOCK_MINUTES = 15
ALLOWED_ORIGIN = "http://127.0.0.1:5173"

# Il database usa valori piu vicini allo storage, mentre React usa label leggibili.
# Queste mappe tengono separati schema DB e UI, evitando conversioni sparse nel codice.
PROJECT_STATUS_TO_CLIENT = {
    "planning": "On Track",
    "active": "On Track",
    "paused": "Blocked",
    "completed": "On Track",
    "cancelled": "Blocked",
}
CLIENT_PROJECT_STATUS_TO_DB = {
    "On Track": ("active", "low"),
    "At Risk": ("active", "medium"),
    "Blocked": ("paused", "high"),
}
SPRINT_STATUS_TO_CLIENT = {
    "planned": "Planned",
    "active": "Active",
    "completed": "Completed",
    "blocked": "Blocked",
}
CLIENT_SPRINT_STATUS_TO_DB = {
    "Planned": "planned",
    "Active": "active",
    "Completed": "completed",
    "Blocked": "blocked",
}
TASK_STATUS_TO_CLIENT = {
    "todo": "Todo",
    "in_progress": "In Progress",
    "review": "Review",
    "done": "Done",
}
TASK_PRIORITY_TO_CLIENT = {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_db_time(value: datetime) -> str:
    return value.isoformat()


def from_db_time(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def hash_password(password: str, salt_hex: str, iterations: int) -> str:
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt_hex),
        iterations,
    )
    return password_hash.hex()


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def open_db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    # Necessario per rendere effettivi ON DELETE CASCADE / SET NULL in SQLite.
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


def serialize_workspace(connection: sqlite3.Connection, user: sqlite3.Row | None = None) -> dict:
    # Lo stesso endpoint serve admin e dipendenti, ma non con gli stessi dati.
    # Admin riceve tutto; un dipendente riceve solo progetti assegnati, membri del suo team
    # e task rilevanti. La UI resta pulita, ma la protezione vera rimane lato server.
    is_admin = user is None or user["role"] == "admin"
    employee_id = user["employee_id"] if user and user["employee_id"] else None
    accessible_project_ids: set[int] | None = None
    visible_employee_ids: set[int] | None = None
    visible_team_ids: set[int] | None = None

    if not is_admin and employee_id:
        accessible_project_ids = {
            row["project_id"]
            for row in connection.execute(
                "SELECT project_id FROM project_memberships WHERE employee_id = ?;",
                (employee_id,),
            ).fetchall()
        }
        visible_team_ids = {
            row["team_id"]
            for row in connection.execute(
                "SELECT team_id FROM team_memberships WHERE employee_id = ?;",
                (employee_id,),
            ).fetchall()
        }
        visible_employee_ids = {employee_id}
        if visible_team_ids:
            placeholders = ",".join("?" for _ in visible_team_ids)
            visible_employee_ids.update(
                row["employee_id"]
                for row in connection.execute(
                    f"SELECT employee_id FROM team_memberships WHERE team_id IN ({placeholders});",
                    tuple(visible_team_ids),
                ).fetchall()
            )

    projects = [
        {
            "id": row["id"],
            "name": row["name"],
            "clientName": row["client_name"],
            "description": row["description"] or "",
            "longDescription": row["description"] or "",
            "budgetHours": row["budget_hours"],
            "usedHours": row["used_hours"],
            "deadline": row["deadline"],
            "status": "Blocked"
            if row["risk_level"] == "high"
            else "At Risk"
            if row["risk_level"] == "medium"
            else PROJECT_STATUS_TO_CLIENT.get(row["status"], "On Track"),
            "riskNotes": row["risk_notes"] or "No risk notes recorded.",
        }
        for row in connection.execute("SELECT * FROM projects ORDER BY id;").fetchall()
    ]

    project_ids_by_employee: dict[int, list[int]] = {}
    for row in connection.execute("SELECT employee_id, project_id FROM project_memberships;").fetchall():
        project_ids_by_employee.setdefault(row["employee_id"], []).append(row["project_id"])

    employees = [
        {
            "id": row["id"],
            "name": row["first_name"],
            "surname": row["last_name"],
            "email": row["email"],
            "phoneNumber": row["phone_number"] or "",
            "role": row["job_title"],
            "hourlyWage": row["hourly_wage"],
            "weeklyCapacityHours": row["weekly_hours"],
            "projectIds": project_ids_by_employee.get(row["id"], []),
            "bio": row["bio"] or "",
        }
        for row in connection.execute(
            """
            SELECT e.*, j.title AS job_title, j.hourly_wage, j.weekly_hours
            FROM employees e
            JOIN jobs j ON j.id = e.job_id
            WHERE e.is_active = 1
            ORDER BY e.id;
            """
        ).fetchall()
        if is_admin or (visible_employee_ids is not None and row["id"] in visible_employee_ids)
    ]

    member_ids_by_team: dict[int, list[int]] = {}
    for row in connection.execute("SELECT team_id, employee_id FROM team_memberships;").fetchall():
        member_ids_by_team.setdefault(row["team_id"], []).append(row["employee_id"])

    project_ids_by_team: dict[int, list[int]] = {}
    for row in connection.execute("SELECT team_id, project_id FROM team_projects;").fetchall():
        project_ids_by_team.setdefault(row["team_id"], []).append(row["project_id"])

    teams = [
        {
            "id": row["id"],
            "name": row["name"],
            "focusArea": row["focus_area"],
            "leadId": row["lead_employee_id"] or 0,
            "memberIds": member_ids_by_team.get(row["id"], []),
            "projectIds": project_ids_by_team.get(row["id"], []),
            "notes": row["notes"] or "",
        }
        for row in connection.execute("SELECT * FROM teams ORDER BY id;").fetchall()
        if is_admin or (visible_team_ids is not None and row["id"] in visible_team_ids)
    ]

    sprints = [
        {
            "id": row["id"],
            "projectId": row["project_id"],
            "name": row["name"],
            "goal": row["goal"] or "",
            "longDescription": row["goal"] or "",
            "startDate": row["start_date"],
            "endDate": row["end_date"],
            "status": SPRINT_STATUS_TO_CLIENT.get(row["status"], "Planned"),
        }
        for row in connection.execute("SELECT * FROM sprints ORDER BY id;").fetchall()
    ]

    tasks = [
        {
            "id": row["id"],
            "projectId": row["project_id"],
            "sprintId": row["sprint_id"] or 0,
            "title": row["title"],
            "status": TASK_STATUS_TO_CLIENT.get(row["status"], "Todo"),
            "assigneeId": row["assignee_id"] or 0,
            "estimateHours": row["estimate_hours"],
            "spentHours": row["spent_hours"],
            "priority": TASK_PRIORITY_TO_CLIENT.get(row["priority"], "Medium"),
        }
        for row in connection.execute("SELECT * FROM tasks ORDER BY id;").fetchall()
        if is_admin
        or (
            accessible_project_ids is not None
            and row["project_id"] in accessible_project_ids
            and (row["assignee_id"] == employee_id or row["assignee_id"] is None)
        )
    ]

    return {
        "projects": projects,
        "teamMembers": employees,
        "teams": teams,
        "sprints": sprints,
        "tasks": tasks,
    }


def require_id(method: str, item_id: int | None) -> int:
    if method in {"PUT", "DELETE"} and item_id is None:
        raise ValueError("Missing item id.")
    return int(item_id or 0)


def ensure_job(connection: sqlite3.Connection, title: str, hourly_wage: float, weekly_hours: int) -> int:
    # L'editor dipendenti lavora con un campo "role" semplice.
    # Qui lo riconciliamo con la tabella normalizzata jobs, creando il job se manca.
    existing = connection.execute("SELECT id FROM jobs WHERE title = ?;", (title,)).fetchone()
    if existing:
        connection.execute(
            """
            UPDATE jobs
            SET hourly_wage = ?, weekly_hours = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (hourly_wage, weekly_hours, existing["id"]),
        )
        return existing["id"]

    cursor = connection.execute(
        """
        INSERT INTO jobs (title, hourly_wage, weekly_hours, department, description)
        VALUES (?, ?, ?, ?, ?);
        """,
        (title, hourly_wage, weekly_hours, "Operations", f"{title} role."),
    )
    return int(cursor.lastrowid)


def sync_project_memberships(
    connection: sqlite3.Connection, employee_id: int, project_ids: list[int], weekly_hours: int
) -> None:
    # Strategia semplice e sicura per un editor demo: riscrivere le membership del dipendente
    # evita diff complessi tra vecchie e nuove assegnazioni.
    connection.execute("DELETE FROM project_memberships WHERE employee_id = ?;", (employee_id,))
    for project_id in project_ids:
        connection.execute(
            """
            INSERT OR IGNORE INTO project_memberships
              (project_id, employee_id, assigned_role, weekly_allocated_hours)
            VALUES (?, ?, ?, ?);
            """,
            (project_id, employee_id, "Contributor", max(1, weekly_hours)),
        )


def mutate_project(connection: sqlite3.Connection, method: str, item_id: int | None, body: dict) -> dict:
    if method == "DELETE":
        project_id = require_id(method, item_id)
        connection.execute("DELETE FROM projects WHERE id = ?;", (project_id,))
        return {"id": project_id}

    status, risk_level = CLIENT_PROJECT_STATUS_TO_DB.get(body.get("status"), ("active", "low"))
    values = (
        str(body.get("name", "")).strip(),
        str(body.get("clientName", "")).strip(),
        str(body.get("longDescription") or body.get("description") or "").strip(),
        status,
        int(body.get("budgetHours", 1)),
        int(body.get("usedHours", 0)),
        str(body.get("deadline", "")).strip(),
        risk_level,
        str(body.get("riskNotes", "")).strip(),
    )
    if not values[0] or not values[1] or not values[2] or not values[6]:
        raise ValueError("Project name, client, description, and deadline are required.")

    if method == "POST":
        cursor = connection.execute(
            """
            INSERT INTO projects
              (name, client_name, description, status, budget_hours, used_hours, deadline, risk_level, risk_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            values,
        )
        project_id = int(cursor.lastrowid)
    else:
        project_id = require_id(method, item_id)
        connection.execute(
            """
            UPDATE projects
            SET name = ?, client_name = ?, description = ?, status = ?, budget_hours = ?,
                used_hours = ?, deadline = ?, risk_level = ?, risk_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (*values, project_id),
        )
    return {"id": project_id}


def mutate_sprint(connection: sqlite3.Connection, method: str, item_id: int | None, body: dict) -> dict:
    if method == "DELETE":
        sprint_id = require_id(method, item_id)
        connection.execute("DELETE FROM sprints WHERE id = ?;", (sprint_id,))
        return {"id": sprint_id}

    values = (
        int(body.get("projectId", 0)),
        str(body.get("name", "")).strip(),
        str(body.get("longDescription") or body.get("goal") or "").strip(),
        str(body.get("startDate", "")).strip(),
        str(body.get("endDate", "")).strip(),
        CLIENT_SPRINT_STATUS_TO_DB.get(body.get("status"), "planned"),
    )
    if not values[0] or not values[1] or not values[2] or not values[3] or not values[4]:
        raise ValueError("Sprint project, name, goal, start date, and end date are required.")

    if method == "POST":
        cursor = connection.execute(
            """
            INSERT INTO sprints (project_id, name, goal, start_date, end_date, status)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            values,
        )
        sprint_id = int(cursor.lastrowid)
    else:
        sprint_id = require_id(method, item_id)
        connection.execute(
            """
            UPDATE sprints
            SET project_id = ?, name = ?, goal = ?, start_date = ?, end_date = ?,
                status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (*values, sprint_id),
        )
    return {"id": sprint_id}


def mutate_employee(connection: sqlite3.Connection, method: str, item_id: int | None, body: dict) -> dict:
    if method == "DELETE":
        employee_id = require_id(method, item_id)
        connection.execute("DELETE FROM employees WHERE id = ?;", (employee_id,))
        return {"id": employee_id}

    role = str(body.get("role", "")).strip()
    hourly_wage = float(body.get("hourlyWage", 0))
    weekly_hours = int(body.get("weeklyCapacityHours", 1))
    job_id = ensure_job(connection, role, hourly_wage, weekly_hours)
    values = (
        str(body.get("name", "")).strip(),
        str(body.get("surname", "")).strip(),
        str(body.get("email", "")).strip().lower(),
        str(body.get("phoneNumber", "")).strip(),
        job_id,
        str(body.get("bio", "")).strip(),
    )
    if not values[0] or not values[1] or not values[2] or not role:
        raise ValueError("Employee name, surname, email, and role are required.")

    if method == "POST":
        cursor = connection.execute(
            """
            INSERT INTO employees (first_name, last_name, email, phone_number, job_id, bio)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            values,
        )
        employee_id = int(cursor.lastrowid)
    else:
        employee_id = require_id(method, item_id)
        connection.execute(
            """
            UPDATE employees
            SET first_name = ?, last_name = ?, email = ?, phone_number = ?, job_id = ?,
                bio = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (*values, employee_id),
        )

    sync_project_memberships(
        connection,
        employee_id,
        [int(project_id) for project_id in body.get("projectIds", [])],
        weekly_hours,
    )
    return {"id": employee_id}


def mutate_team(connection: sqlite3.Connection, method: str, item_id: int | None, body: dict) -> dict:
    if method == "DELETE":
        team_id = require_id(method, item_id)
        connection.execute("DELETE FROM teams WHERE id = ?;", (team_id,))
        return {"id": team_id}

    values = (
        str(body.get("name", "")).strip(),
        str(body.get("focusArea", "")).strip(),
        int(body.get("leadId", 0)) or None,
        str(body.get("notes", "")).strip(),
    )
    if not values[0] or not values[1] or not values[3]:
        raise ValueError("Team name, focus area, and notes are required.")

    if method == "POST":
        cursor = connection.execute(
            """
            INSERT INTO teams (name, focus_area, lead_employee_id, notes)
            VALUES (?, ?, ?, ?);
            """,
            values,
        )
        team_id = int(cursor.lastrowid)
    else:
        team_id = require_id(method, item_id)
        connection.execute(
            """
            UPDATE teams
            SET name = ?, focus_area = ?, lead_employee_id = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (*values, team_id),
        )

    connection.execute("DELETE FROM team_memberships WHERE team_id = ?;", (team_id,))
    for employee_id in body.get("memberIds", []):
        connection.execute(
            "INSERT OR IGNORE INTO team_memberships (team_id, employee_id, team_role) VALUES (?, ?, ?);",
            (team_id, int(employee_id), "Member"),
        )

    connection.execute("DELETE FROM team_projects WHERE team_id = ?;", (team_id,))
    for project_id in body.get("projectIds", []):
        connection.execute(
            "INSERT OR IGNORE INTO team_projects (team_id, project_id) VALUES (?, ?);",
            (team_id, int(project_id)),
        )

    return {"id": team_id}


def mutate_task(connection: sqlite3.Connection, method: str, item_id: int | None, body: dict) -> dict:
    if method == "DELETE":
        task_id = require_id(method, item_id)
        connection.execute("DELETE FROM tasks WHERE id = ?;", (task_id,))
        return {"id": task_id}

    status_to_db = {
        "Todo": "todo",
        "In Progress": "in_progress",
        "Review": "review",
        "Done": "done",
    }
    priority_to_db = {
        "Low": "low",
        "Medium": "medium",
        "High": "high",
    }
    values = (
        int(body.get("projectId", 0)),
        int(body.get("sprintId", 0)) or None,
        int(body.get("assigneeId", 0)) or None,
        str(body.get("title", "")).strip(),
        str(body.get("description", "")).strip(),
        status_to_db.get(body.get("status"), "todo"),
        priority_to_db.get(body.get("priority"), "medium"),
        int(body.get("estimateHours", 0)),
        int(body.get("spentHours", 0)),
    )
    if not values[0] or not values[3]:
        raise ValueError("Task project and title are required.")

    if method == "POST":
        cursor = connection.execute(
            """
            INSERT INTO tasks
              (project_id, sprint_id, assignee_id, title, description, status, priority, estimate_hours, spent_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            values,
        )
        task_id = int(cursor.lastrowid)
    else:
        task_id = require_id(method, item_id)
        connection.execute(
            """
            UPDATE tasks
            SET project_id = ?, sprint_id = ?, assignee_id = ?, title = ?, description = ?,
                status = ?, priority = ?, estimate_hours = ?, spent_hours = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (*values, task_id),
        )

    return {"id": task_id}


class AuthHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path

        if path == "/api/health":
            self.send_json({"ok": True})
            return

        if path == "/api/auth/me":
            self.handle_me()
            return
        
        if path == "/api/workspace":
            self.handle_workspace()
            return

        self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        path = urlparse(self.path).path

        if path == "/api/auth/login":
            self.handle_login()
            return

        if path == "/api/auth/logout":
            self.handle_logout()
            return
        
        if path in {"/api/projects", "/api/sprints", "/api/employees", "/api/teams", "/api/tasks"}:
            self.handle_crud(path, "POST")
            return

        self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_PUT(self) -> None:
        self.handle_crud(urlparse(self.path).path, "PUT")

    def do_DELETE(self) -> None:
        self.handle_crud(urlparse(self.path).path, "DELETE")

    def current_user(self, connection: sqlite3.Connection) -> sqlite3.Row | None:
        token = self.get_session_token()
        if not token:
            return None

        session = connection.execute(
            """
            SELECT u.id, u.email, u.display_name, u.role, u.employee_id, s.expires_at
            FROM user_sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = ?;
            """,
            (hash_token(token),),
        ).fetchone()

        if not session or from_db_time(session["expires_at"]) <= utc_now():
            connection.execute("DELETE FROM user_sessions WHERE token_hash = ?;", (hash_token(token),))
            return None

        return session

    def require_admin(self, connection: sqlite3.Connection) -> sqlite3.Row | None:
        user = self.current_user(connection)
        if not user:
            self.send_json({"error": "Authentication required"}, HTTPStatus.UNAUTHORIZED)
            return None

        if user["role"] != "admin":
            self.send_json({"error": "Admin access required"}, HTTPStatus.FORBIDDEN)
            return None

        return user

    def handle_workspace(self) -> None:
        with open_db() as connection:
            user = self.current_user(connection)
            if not user:
                self.send_json({"error": "Authentication required"}, HTTPStatus.UNAUTHORIZED)
                return

            self.send_json({"workspace": serialize_workspace(connection, user)})

    def handle_crud(self, path: str, method: str) -> None:
        # Router CRUD minimale: niente framework esterni, ma una sola entrata per
        # controllare sessione, ruolo admin, parsing body e risposta workspace aggiornata.
        parts = [part for part in path.split("/") if part]
        if len(parts) < 2 or parts[0] != "api":
            self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
            return

        resource = parts[1]
        item_id = int(parts[2]) if len(parts) == 3 and parts[2].isdigit() else None

        with open_db() as connection:
            if not self.require_admin(connection):
                return

            body = self.read_json_body() if method in {"POST", "PUT"} else {}

            try:
                if resource == "projects":
                    result = mutate_project(connection, method, item_id, body)
                elif resource == "sprints":
                    result = mutate_sprint(connection, method, item_id, body)
                elif resource == "employees":
                    result = mutate_employee(connection, method, item_id, body)
                elif resource == "teams":
                    result = mutate_team(connection, method, item_id, body)
                elif resource == "tasks":
                    result = mutate_task(connection, method, item_id, body)
                else:
                    self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
                    return
            except ValueError as error:
                self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
                return

            self.send_json({"ok": True, "item": result, "workspace": serialize_workspace(connection)})

    def handle_login(self) -> None:
        body = self.read_json_body()
        email = str(body.get("email", "")).strip().lower()
        password = str(body.get("password", ""))

        if not email or not password:
            self.send_json({"error": "Invalid email or password"}, HTTPStatus.UNAUTHORIZED)
            return

        with open_db() as connection:
            user = connection.execute(
                """
                SELECT id, email, display_name, role, employee_id, password_hash, password_salt,
                       password_iterations, failed_login_attempts, locked_until
                FROM users
                WHERE email = ?;
                """,
                (email,),
            ).fetchone()

            if not user:
                self.send_json({"error": "Invalid email or password"}, HTTPStatus.UNAUTHORIZED)
                return

            locked_until = from_db_time(user["locked_until"])
            if locked_until and locked_until > utc_now():
                self.send_json(
                    {"error": "Account temporarily locked. Try again later."},
                    HTTPStatus.TOO_MANY_REQUESTS,
                )
                return

            candidate_hash = hash_password(
                password,
                user["password_salt"],
                user["password_iterations"],
            )
            password_ok = hmac.compare_digest(candidate_hash, user["password_hash"])

            if not password_ok:
                failed_attempts = user["failed_login_attempts"] + 1
                locked_value = None
                if failed_attempts >= MAX_FAILED_ATTEMPTS:
                    locked_value = to_db_time(utc_now() + timedelta(minutes=LOCK_MINUTES))

                connection.execute(
                    """
                    UPDATE users
                    SET failed_login_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?;
                    """,
                    (failed_attempts, locked_value, user["id"]),
                )
                self.send_json({"error": "Invalid email or password"}, HTTPStatus.UNAUTHORIZED)
                return

            token = secrets.token_urlsafe(32)
            expires_at = utc_now() + timedelta(hours=SESSION_HOURS)
            connection.execute(
                """
                INSERT INTO user_sessions (user_id, token_hash, expires_at)
                VALUES (?, ?, ?);
                """,
                (user["id"], hash_token(token), to_db_time(expires_at)),
            )
            connection.execute(
                """
                UPDATE users
                SET failed_login_attempts = 0,
                    locked_until = NULL,
                    last_login_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?;
                """,
                (user["id"],),
            )

        self.send_json(
            {
                "user": {
                    "email": user["email"],
                    "displayName": user["display_name"],
                    "role": user["role"],
                    "employeeId": user["employee_id"],
                }
            },
            extra_headers=[self.session_cookie_header(token, SESSION_HOURS * 60 * 60)],
        )

    def handle_me(self) -> None:
        token = self.get_session_token()
        if not token:
            self.send_json({"user": None}, HTTPStatus.UNAUTHORIZED)
            return

        with open_db() as connection:
            session = connection.execute(
                """
                SELECT u.email, u.display_name, u.role, u.employee_id, s.expires_at
                FROM user_sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = ?;
                """,
                (hash_token(token),),
            ).fetchone()

            if not session or from_db_time(session["expires_at"]) <= utc_now():
                connection.execute(
                    "DELETE FROM user_sessions WHERE token_hash = ?;",
                    (hash_token(token),),
                )
                self.send_json({"user": None}, HTTPStatus.UNAUTHORIZED)
                return

        self.send_json(
            {
                "user": {
                    "email": session["email"],
                    "displayName": session["display_name"],
                    "role": session["role"],
                    "employeeId": session["employee_id"],
                }
            }
        )

    def handle_logout(self) -> None:
        token = self.get_session_token()
        if token:
            with open_db() as connection:
                connection.execute(
                    "DELETE FROM user_sessions WHERE token_hash = ?;",
                    (hash_token(token),),
                )

        self.send_json(
            {"ok": True},
            extra_headers=[self.session_cookie_header("", 0)],
        )

    def read_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length else b"{}"
        try:
            return json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def get_session_token(self) -> str | None:
        cookie_header = self.headers.get("Cookie")
        if not cookie_header:
            return None

        cookies = SimpleCookie(cookie_header)
        session_cookie = cookies.get(SESSION_COOKIE)
        return session_cookie.value if session_cookie else None

    def session_cookie_header(self, value: str, max_age: int) -> tuple[str, str]:
        cookie = (
            f"{SESSION_COOKIE}={value}; Path=/; Max-Age={max_age}; "
            "HttpOnly; SameSite=Lax"
        )
        return ("Set-Cookie", cookie)

    def send_json(
        self,
        payload: dict,
        status: HTTPStatus = HTTPStatus.OK,
        extra_headers: list[tuple[str, str]] | None = None,
    ) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))

        for header, value in extra_headers or []:
            self.send_header(header, value)

        self.end_headers()
        self.wfile.write(body)

    def send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

    def log_message(self, format: str, *args: object) -> None:
        print(f"[auth] {self.address_string()} - {format % args}")


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit("Database not found. Run: npm run db:reset")

    server = ThreadingHTTPServer((HOST, PORT), AuthHandler)
    print(f"Auth API running at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
