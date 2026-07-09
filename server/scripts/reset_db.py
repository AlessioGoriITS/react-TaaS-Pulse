from pathlib import Path
import hashlib
import os
import sqlite3


ROOT = Path(__file__).resolve().parents[2]
DB_DIR = ROOT / "server" / "data"
DB_PATH = DB_DIR / "taas_pulse.db"
SCHEMA_PATH = ROOT / "server" / "db" / "schema.sql"
SEED_PATH = ROOT / "server" / "db" / "seed.sql"
PASSWORD_ITERATIONS = 210_000


DEMO_USERS = [
    {
        "email": "admin@taaspulse.local",
        "display_name": "Admin User",
        "role": "admin",
        "password": "AdminPass!2026",
    },
    {
        "email": "user@taaspulse.local",
        "display_name": "Standard User",
        "role": "user",
        "password": "UserPass!2026",
    },
]


def hash_password(password: str, salt: bytes) -> str:
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    return password_hash.hex()


def seed_demo_users(connection: sqlite3.Connection) -> None:
    for demo_user in DEMO_USERS:
        salt = os.urandom(16)
        connection.execute(
            """
            INSERT INTO users (
              email,
              display_name,
              role,
              password_hash,
              password_salt,
              password_iterations
            )
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            (
                demo_user["email"],
                demo_user["display_name"],
                demo_user["role"],
                hash_password(demo_user["password"], salt),
                salt.hex(),
                PASSWORD_ITERATIONS,
            ),
        )


def main() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)

    if DB_PATH.exists():
        DB_PATH.unlink()

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON;")
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        connection.executescript(SEED_PATH.read_text(encoding="utf-8"))
        seed_demo_users(connection)

        tables = connection.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
            """
        ).fetchall()

    print(f"Database created: {DB_PATH}")
    print("Tables:")
    for (table_name,) in tables:
        print(f"- {table_name}")
    print("Demo users:")
    for demo_user in DEMO_USERS:
        print(f"- {demo_user['email']} / {demo_user['password']} ({demo_user['role']})")


if __name__ == "__main__":
    main()
