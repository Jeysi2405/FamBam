"""FamBam SQLite to PostgreSQL Data Migration Script

Use this script to migrate existing data from your local SQLite database (`fambam.db`)
directly into your Render Managed PostgreSQL instance.

Usage:
    # Set your Render PostgreSQL Internal/External Database URL and run:
    python migrate_sqlite_to_pg.py
    # or:
    DATABASE_URL="postgresql://user:pass@host:5432/dbname" python migrate_sqlite_to_pg.py
"""

import os
import sqlite3
import sys

from database import DB_PATH, get_database_url, init_db, is_postgres

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("Error: psycopg2-binary is required. Run 'pip install psycopg2-binary' first.")
    sys.exit(1)


def migrate():
    pg_url = get_database_url()
    if not pg_url:
        print("Error: DATABASE_URL environment variable is not set.")
        print("Please export DATABASE_URL='postgresql://...' before running this script.")
        sys.exit(1)

    if not os.path.exists(DB_PATH):
        print(f"Error: Local SQLite database '{DB_PATH}' was not found.")
        sys.exit(1)

    print("Step 1: Initializing PostgreSQL schema...")
    init_db()

    print(f"Step 2: Reading local records from SQLite ({DB_PATH})...")
    sqlite_conn = sqlite3.connect(DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    s_cur = sqlite_conn.cursor()

    pg_conn = psycopg2.connect(pg_url)
    p_cur = pg_conn.cursor()

    tables = [
        "members",
        "companies",
        "inventory_items",
        "expenses",
        "recurring_bills",
        "price_history",
    ]

    try:
        # Migrate Settings
        s_cur.execute("SELECT * FROM settings WHERE id = 1")
        s_row = s_cur.fetchone()
        if s_row:
            s_dict = dict(s_row)
            cols = [k for k in s_dict.keys() if k != "id"]
            set_clauses = [f"{k} = %s" for k in cols]
            vals = [s_dict[k] for k in cols]
            p_cur.execute(
                f"UPDATE settings SET {', '.join(set_clauses)} WHERE id = 1",
                vals,
            )
            print("  [OK] Migrated settings")

        for table in tables:
            s_cur.execute(f"SELECT * FROM {table} ORDER BY id ASC")
            rows = s_cur.fetchall()
            if not rows:
                print(f"  [--] {table}: 0 records to migrate")
                continue

            # Clear existing table data to prevent duplicate primary keys
            p_cur.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;")

            first_dict = dict(rows[0])
            columns = list(first_dict.keys())
            col_names = ", ".join(columns)
            placeholders = ", ".join(["%s"] * len(columns))
            insert_sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})"

            for r in rows:
                p_cur.execute(insert_sql, [r[c] for c in columns])

            # Update PostgreSQL sequence to match maximum id
            p_cur.execute(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1), true);"
            )
            print(f"  [OK] {table}: migrated {len(rows)} records")

        pg_conn.commit()
        print("\nAll data migrated successfully from SQLite to PostgreSQL!")
    except Exception as e:
        pg_conn.rollback()
        print(f"\nMigration failed with error: {e}")
        sys.exit(1)
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    migrate()
