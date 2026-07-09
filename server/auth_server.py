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


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "server" / "data" / "taas_pulse.db"
HOST = "127.0.0.1"
PORT = 3000
SESSION_COOKIE = "taas_pulse_session"
SESSION_HOURS = 8
MAX_FAILED_ATTEMPTS = 5
LOCK_MINUTES = 15
ALLOWED_ORIGIN = "http://127.0.0.1:5173"


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
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


class AuthHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/api/health":
            self.send_json({"ok": True})
            return

        if self.path == "/api/auth/me":
            self.handle_me()
            return

        self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        if self.path == "/api/auth/login":
            self.handle_login()
            return

        if self.path == "/api/auth/logout":
            self.handle_logout()
            return

        self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

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
                SELECT id, email, display_name, role, password_hash, password_salt,
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
                SELECT u.email, u.display_name, u.role, s.expires_at
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
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

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
