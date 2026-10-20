import os
import sqlite3

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "fambam.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    conn = get_db_connection()
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
        cursor.execute("INSERT INTO recurring_bills_new (id, bill_name, category, default_amount, due_day, last_paid_month) SELECT id, bill_name, category, default_amount, due_day, last_paid_month FROM recurring_bills")
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
        cursor.execute("ALTER TABLE inventory_items ADD COLUMN category TEXT NOT NULL DEFAULT 'Essential'")

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
