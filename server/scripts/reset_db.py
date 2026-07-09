from pathlib import Path
import sqlite3


ROOT = Path(__file__).resolve().parents[2]
DB_DIR = ROOT / "server" / "data"
DB_PATH = DB_DIR / "taas_pulse.db"
SCHEMA_PATH = ROOT / "server" / "db" / "schema.sql"
SEED_PATH = ROOT / "server" / "db" / "seed.sql"


def main() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)

    if DB_PATH.exists():
        DB_PATH.unlink()

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON;")
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        connection.executescript(SEED_PATH.read_text(encoding="utf-8"))

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


if __name__ == "__main__":
    main()
