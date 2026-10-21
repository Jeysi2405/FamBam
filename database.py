import os
import sqlite3
from typing import Optional

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "fambam.db")


def get_database_url() -> Optional[str]:
    """Retrieves and normalizes the DATABASE_URL environment variable.

    Render typically sets `postgres://...` which is converted to `postgresql://...`
    for compatibility with modern PostgreSQL drivers.
    Returns None if DATABASE_URL is not set or empty (falls back to local SQLite).
    """
    raw_url = os.environ.get("DATABASE_URL", "").strip()
    if not raw_url:
        return None

    # Render convention: convert postgres:// to postgresql://
    if raw_url.startswith("postgres://"):
        raw_url = "postgresql://" + raw_url[len("postgres://") :]
    return raw_url


def is_postgres() -> bool:
    """Returns True if the application is configured to use PostgreSQL."""
    return get_database_url() is not None


class PgRow:
    """Row wrapper providing identical interface to sqlite3.Row for PostgreSQL results."""

    def __init__(self, description, values):
        self._keys = [
            d[0].lower() if isinstance(d, (list, tuple)) else d.name.lower()
            for d in description
        ]
        self._values = list(values)
        self._map = dict(zip(self._keys, self._values))

    def __getitem__(self, item):
        if isinstance(item, int):
            return self._values[item]
        return self._map[item.lower()]

    def __iter__(self):
        return iter(self._keys)

    def __len__(self):
        return len(self._values)

    def keys(self):
        return list(self._keys)

    def values(self):
        return list(self._values)

    def items(self):
        return list(self._map.items())

    def get(self, key, default=None):
        return self._map.get(key.lower(), default)

    def __repr__(self):
        return f"<PgRow {self._map}>"


def _translate_query(sql: str) -> str:
    """Translates DB-API '?' placeholders to psycopg2 '%s' while preserving string literals."""
    out = []
    in_single = False
    in_double = False
    for ch in sql:
        if ch == "'" and not in_double:
            in_single = not in_single
            out.append(ch)
        elif ch == '"' and not in_single:
            in_double = not in_double
            out.append(ch)
        elif ch == "?" and not in_single and not in_double:
            out.append("%s")
        else:
            out.append(ch)
    return "".join(out)


class PgCursor:
    """Cursor wrapper that translates '?' to '%s' and populates cursor.lastrowid on INSERTs."""

    def __init__(self, raw_cursor):
        self._cursor = raw_cursor
        self.lastrowid = None
        self._last_insert = False

    def execute(self, sql, params=None):
        translated = _translate_query(sql)
        stripped = translated.strip().rstrip(";")
        is_insert = stripped.upper().startswith("INSERT INTO") and "RETURNING" not in stripped.upper()

        if is_insert:
            translated = stripped + " RETURNING id"
            self._last_insert = True
        else:
            self._last_insert = False

        if params is not None:
            self._cursor.execute(translated, params)
        else:
            self._cursor.execute(translated)

        if is_insert:
            try:
                ret = self._cursor.fetchone()
                if ret is not None:
                    self.lastrowid = ret[0]
            except Exception:
                self.lastrowid = None
        else:
            self.lastrowid = None
        return self

    def fetchone(self):
        val = self._cursor.fetchone()
        if val is None:
            return None
        return PgRow(self._cursor.description, val)

    def fetchall(self):
        desc = self._cursor.description
        if not desc:
            return []
        rows = self._cursor.fetchall()
        return [PgRow(desc, r) for r in rows]

    @property
    def rowcount(self):
        return self._cursor.rowcount

    @property
    def description(self):
        return self._cursor.description

    def close(self):
        self._cursor.close()

    def __iter__(self):
        desc = self._cursor.description
        for r in self._cursor:
            yield PgRow(desc, r)


class PgConnection:
    """Connection wrapper for psycopg2 matching sqlite3.Connection semantics."""

    def __init__(self, raw_conn):
        self._conn = raw_conn

    def cursor(self):
        return PgCursor(self._conn.cursor())

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    @property
    def closed(self):
        return self._conn.closed

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()


_psycopg2_initialized = False


def _init_psycopg2():
    """Configures psycopg2 typecasters (e.g. converting numeric/decimal to float)."""
    global _psycopg2_initialized
    if _psycopg2_initialized:
        return
    import psycopg2
    import psycopg2.extensions

    # Register float caster for PostgreSQL DECIMAL / NUMERIC types to ensure JSON serialization
    try:
        DEC2FLOAT = psycopg2.extensions.new_type(
            psycopg2.extensions.DECIMAL.values,
            "DEC2FLOAT",
            lambda value, curs: float(value) if value is not None else None,
        )
        psycopg2.extensions.register_type(DEC2FLOAT)
    except Exception:
        pass
    _psycopg2_initialized = True


def get_db_connection():
    """Returns a database connection.

    If `DATABASE_URL` is set, connects to Render Managed PostgreSQL.
    Otherwise, falls back to local SQLite (`fambam.db`).
    """
    db_url = get_database_url()
    if db_url:
        _init_psycopg2()
        import psycopg2

        raw_conn = psycopg2.connect(db_url)
        return PgConnection(raw_conn)

    # Local SQLite Fallback
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def _init_postgres_db(conn):
    """Initializes schema and seeds for PostgreSQL."""
    cursor = conn.cursor()

    # 1. Settings Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            monthly_budget_limit DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            budget_groceries DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            budget_utilities DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            budget_maintenance DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            budget_others DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            theme_preference TEXT NOT NULL DEFAULT 'dark',
            admin_name TEXT NOT NULL DEFAULT 'Admin',
            admin_birthday TEXT NOT NULL DEFAULT '',
            admin_address TEXT NOT NULL DEFAULT '',
            admin_photo TEXT NOT NULL DEFAULT ''
        );
    """)
    cursor.execute("ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_name TEXT NOT NULL DEFAULT 'Admin';")
    cursor.execute("ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_birthday TEXT NOT NULL DEFAULT '';")
    cursor.execute("ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_address TEXT NOT NULL DEFAULT '';")
    cursor.execute("ALTER TABLE settings ADD COLUMN IF NOT EXISTS admin_photo TEXT NOT NULL DEFAULT '';")

    # 2. Household Members Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS members (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            avatar_color TEXT NOT NULL DEFAULT '#2563eb',
            role TEXT NOT NULL DEFAULT 'Member',
            photo_path TEXT NOT NULL DEFAULT ''
        );
    """)
    cursor.execute("ALTER TABLE members ADD COLUMN IF NOT EXISTS photo_path TEXT NOT NULL DEFAULT '';")

    # 3. Expenses Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            store_name TEXT DEFAULT '',
            paid_by_member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
            receipt_path TEXT DEFAULT '',
            date_incurred TEXT NOT NULL,
            notes TEXT DEFAULT ''
        );
    """)
    cursor.execute("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;")

    # 4. Recurring Bills Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recurring_bills (
            id SERIAL PRIMARY KEY,
            bill_name TEXT NOT NULL,
            category TEXT NOT NULL,
            default_amount DOUBLE PRECISION NOT NULL,
            due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
            last_paid_month TEXT DEFAULT '',
            company_name TEXT DEFAULT '',
            company_logo TEXT DEFAULT ''
        );
    """)
    cursor.execute("ALTER TABLE recurring_bills ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '';")
    cursor.execute("ALTER TABLE recurring_bills ADD COLUMN IF NOT EXISTS company_logo TEXT DEFAULT '';")

    # 5. Companies Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            logo_path TEXT DEFAULT ''
        );
    """)
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_lower ON companies (LOWER(name));")

    # Seed default popular companies if not present
    seed_companies = [
        ("Meralco", "/static/icons/companies/meralco.svg"),
        ("Maynilad", "/static/icons/companies/maynilad.svg"),
        ("PLDT", "/static/icons/companies/pldt.svg"),
    ]
    for c_name, c_logo in seed_companies:
        cursor.execute("INSERT INTO companies (name, logo_path) VALUES (?, ?) ON CONFLICT (name) DO NOTHING", (c_name, c_logo))

    # Auto-link Meralco bill to Meralco logo
    cursor.execute("""
        UPDATE recurring_bills
        SET company_name = 'Meralco', company_logo = '/static/icons/companies/meralco.svg'
        WHERE lower(trim(bill_name)) = 'meralco' AND (company_logo IS NULL OR company_logo = '')
    """)

    # 6. Inventory Items Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory_items (
            id SERIAL PRIMARY KEY,
            item_name TEXT NOT NULL,
            unit TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Low',
            last_price DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            preferred_store TEXT DEFAULT '',
            category TEXT NOT NULL DEFAULT 'Food & Household Groceries'
        );
    """)
    cursor.execute("ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Food & Household Groceries';")

    # 7. Price History Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            id SERIAL PRIMARY KEY,
            item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
            item_name TEXT NOT NULL,
            store_name TEXT NOT NULL,
            price DOUBLE PRECISION NOT NULL,
            recorded_date TEXT NOT NULL
        );
    """)

    # 8. Ensure default single settings row exists
    cursor.execute("SELECT COUNT(*) as cnt FROM settings")
    row = cursor.fetchone()
    if not row or row["cnt"] == 0:
        cursor.execute("""
            INSERT INTO settings (
                id, monthly_budget_limit, budget_groceries, budget_utilities,
                budget_maintenance, budget_others, theme_preference
            ) VALUES (1, 0.0, 0.0, 0.0, 0.0, 0.0, 'dark')
        """)

    conn.commit()
    conn.close()


def _init_sqlite_db(conn):
    """Initializes schema and migrations for local SQLite database."""
    cursor = conn.cursor()

    # 1. Settings Table (includes overall & per-category budgets)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            monthly_budget_limit REAL NOT NULL DEFAULT 0.0,
            budget_groceries REAL NOT NULL DEFAULT 0.0,
            budget_utilities REAL NOT NULL DEFAULT 0.0,
            budget_maintenance REAL NOT NULL DEFAULT 0.0,
            budget_others REAL NOT NULL DEFAULT 0.0,
            theme_preference TEXT NOT NULL DEFAULT 'dark',
            admin_name TEXT NOT NULL DEFAULT 'Admin',
            admin_birthday TEXT NOT NULL DEFAULT '',
            admin_address TEXT NOT NULL DEFAULT '',
            admin_photo TEXT NOT NULL DEFAULT ''
        )
    """)

    # Ensure admin profile columns exist on existing settings table
    cursor.execute("PRAGMA table_info(settings)")
    settings_cols = [col["name"] for col in cursor.fetchall()]
    if "admin_name" not in settings_cols:
        cursor.execute("ALTER TABLE settings ADD COLUMN admin_name TEXT NOT NULL DEFAULT 'Admin'")
    if "admin_birthday" not in settings_cols:
        cursor.execute("ALTER TABLE settings ADD COLUMN admin_birthday TEXT NOT NULL DEFAULT ''")
    if "admin_address" not in settings_cols:
        cursor.execute("ALTER TABLE settings ADD COLUMN admin_address TEXT NOT NULL DEFAULT ''")
    if "admin_photo" not in settings_cols:
        cursor.execute("ALTER TABLE settings ADD COLUMN admin_photo TEXT NOT NULL DEFAULT ''")

    # 2. Household Members Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            avatar_color TEXT NOT NULL DEFAULT '#2563eb',
            role TEXT NOT NULL DEFAULT 'Member',
            photo_path TEXT NOT NULL DEFAULT ''
        )
    """)

    # Ensure photo_path column exists on existing members table
    cursor.execute("PRAGMA table_info(members)")
    member_cols = [col["name"] for col in cursor.fetchall()]
    if "photo_path" not in member_cols:
        cursor.execute("ALTER TABLE members ADD COLUMN photo_path TEXT NOT NULL DEFAULT ''")

    # 3. Expenses Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            store_name TEXT DEFAULT '',
            paid_by_member_id INTEGER,
            receipt_path TEXT DEFAULT '',
            date_incurred TEXT NOT NULL,
            notes TEXT DEFAULT '',
            FOREIGN KEY (paid_by_member_id) REFERENCES members(id) ON DELETE SET NULL
        )
    """)

    # Ensure quantity column exists on existing expenses table
    cursor.execute("PRAGMA table_info(expenses)")
    expense_cols = [col["name"] for col in cursor.fetchall()]
    if "quantity" not in expense_cols:
        cursor.execute("ALTER TABLE expenses ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1")

    # 4. Recurring Bills Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recurring_bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_name TEXT NOT NULL,
            category TEXT NOT NULL,
            default_amount REAL NOT NULL,
            due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
            last_paid_month TEXT DEFAULT '',
            company_name TEXT DEFAULT '',
            company_logo TEXT DEFAULT ''
        )
    """)

    # Ensure company_name and company_logo columns exist on recurring_bills
    cursor.execute("PRAGMA table_info(recurring_bills)")
    bill_cols = [col["name"] for col in cursor.fetchall()]
    if "company_name" not in bill_cols:
        cursor.execute("ALTER TABLE recurring_bills ADD COLUMN company_name TEXT DEFAULT ''")
    if "company_logo" not in bill_cols:
        cursor.execute("ALTER TABLE recurring_bills ADD COLUMN company_logo TEXT DEFAULT ''")

    # Migrate legacy CHECK constraint on expenses & recurring_bills if present
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='expenses'")
    exp_sql = (cursor.fetchone() or {"sql": ""})["sql"] or ""
    if "CHECK (category IN ('Groceries'" in exp_sql:
        cursor.execute("PRAGMA foreign_keys = OFF;")
        cursor.execute("""
            CREATE TABLE expenses_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                store_name TEXT DEFAULT '',
                paid_by_member_id INTEGER,
                receipt_path TEXT DEFAULT '',
                date_incurred TEXT NOT NULL,
                notes TEXT DEFAULT '',
                FOREIGN KEY (paid_by_member_id) REFERENCES members(id) ON DELETE SET NULL
            )
        """)
        cursor.execute("INSERT INTO expenses_new SELECT * FROM expenses")
        cursor.execute("DROP TABLE expenses")
        cursor.execute("ALTER TABLE expenses_new RENAME TO expenses")
        cursor.execute("PRAGMA foreign_keys = ON;")

    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='recurring_bills'")
    bill_sql = (cursor.fetchone() or {"sql": ""})["sql"] or ""
    if "CHECK (category IN ('Groceries'" in bill_sql:
        cursor.execute("""
            CREATE TABLE recurring_bills_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bill_name TEXT NOT NULL,
                category TEXT NOT NULL,
                default_amount REAL NOT NULL,
                due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
                last_paid_month TEXT DEFAULT '',
                company_name TEXT DEFAULT '',
                company_logo TEXT DEFAULT ''
            )
        """)
        cursor.execute(
            "INSERT INTO recurring_bills_new (id, bill_name, category, default_amount, due_day, last_paid_month) "
            "SELECT id, bill_name, category, default_amount, due_day, last_paid_month FROM recurring_bills"
        )
        cursor.execute("DROP TABLE recurring_bills")
        cursor.execute("ALTER TABLE recurring_bills_new RENAME TO recurring_bills")

    # 4.5 Companies Table (for utility / bill providers)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE COLLATE NOCASE,
            logo_path TEXT DEFAULT ''
        )
    """)

    # Seed default popular companies if not present
    seed_companies = [
        ("Meralco", "/static/icons/companies/meralco.svg"),
        ("Maynilad", "/static/icons/companies/maynilad.svg"),
        ("PLDT", "/static/icons/companies/pldt.svg"),
    ]
    for c_name, c_logo in seed_companies:
        cursor.execute("INSERT OR IGNORE INTO companies (name, logo_path) VALUES (?, ?)", (c_name, c_logo))

    # Auto-link Meralco bill to Meralco logo
    cursor.execute("""
        UPDATE recurring_bills
        SET company_name = 'Meralco', company_logo = '/static/icons/companies/meralco.svg'
        WHERE lower(trim(bill_name)) = 'meralco' AND (company_logo IS NULL OR company_logo = '')
    """)

    # 5. Inventory Items Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            unit TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Low',
            last_price REAL NOT NULL DEFAULT 0.0,
            preferred_store TEXT DEFAULT ''
        )
    """)

    # Migrate legacy CHECK constraint on inventory_items if present
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='inventory_items'")
    inv_sql_row = cursor.fetchone()
    inv_sql = (inv_sql_row["sql"] if inv_sql_row else "") or ""
    if "CHECK (status IN ('In Stock'" in inv_sql:
        cursor.execute("""
            CREATE TABLE inventory_items_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NOT NULL,
                unit TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Low',
                last_price REAL NOT NULL DEFAULT 0.0,
                preferred_store TEXT DEFAULT ''
            )
        """)
        cursor.execute("INSERT INTO inventory_items_new SELECT * FROM inventory_items")
        cursor.execute("DROP TABLE inventory_items")
        cursor.execute("ALTER TABLE inventory_items_new RENAME TO inventory_items")

    # Ensure category column exists on inventory_items table
    cursor.execute("PRAGMA table_info(inventory_items)")
    inv_cols = [col["name"] for col in cursor.fetchall()]
    if "category" not in inv_cols:
        cursor.execute("ALTER TABLE inventory_items ADD COLUMN category TEXT NOT NULL DEFAULT 'Food & Household Groceries'")

    # Migrate legacy category names across tables to the unified 7-category taxonomy
    legacy_cat_updates = [
        ("Essential", "Food & Household Groceries"),
        ("Condiments", "Food & Household Groceries"),
        ("Meat and Vegetables", "Food & Household Groceries"),
        ("Bills", "Utilities & Connectivity"),
        ("Groceries", "Food & Household Groceries"),
    ]
    for old_cat, new_cat in legacy_cat_updates:
        cursor.execute("UPDATE expenses SET category = ? WHERE category = ?", (new_cat, old_cat))
        cursor.execute("UPDATE recurring_bills SET category = ? WHERE category = ?", (new_cat, old_cat))
        cursor.execute("UPDATE inventory_items SET category = ? WHERE category = ?", (new_cat, old_cat))

    # 6. Price History Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER,
            item_name TEXT NOT NULL,
            store_name TEXT NOT NULL,
            price REAL NOT NULL,
            recorded_date TEXT NOT NULL,
            FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE SET NULL
        )
    """)

    # Drop legacy ambahan_settlements table if exists
    cursor.execute("DROP TABLE IF EXISTS ambahan_settlements;")

    # Ensure single default settings row exists with zeroed budgets (no pre-populated data)
    cursor.execute("SELECT COUNT(*) as cnt FROM settings")
    if cursor.fetchone()["cnt"] == 0:
        cursor.execute("""
            INSERT INTO settings (
                id, monthly_budget_limit, budget_groceries, budget_utilities,
                budget_maintenance, budget_others, theme_preference
            ) VALUES (1, 0.0, 0.0, 0.0, 0.0, 0.0, 'dark')
        """)

    conn.commit()
    conn.close()


def init_db():
    """Initializes the database schema and seeds on startup.

    Delegates to PostgreSQL or SQLite based on the environment configuration.
    """
    conn = get_db_connection()
    if is_postgres():
        _init_postgres_db(conn)
    else:
        _init_sqlite_db(conn)


if __name__ == "__main__":
    target = "PostgreSQL" if is_postgres() else f"SQLite ({DB_PATH})"
    print(f"Initializing FamBam database targeting {target}...")
    init_db()
    print("Database initialization completed successfully.")
