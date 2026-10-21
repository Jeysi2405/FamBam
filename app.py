import json
import os
import io
import csv
import uuid
import calendar
from datetime import datetime
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    send_from_directory,
    Response,
)
from werkzeug.utils import secure_filename
from database import get_db_connection, init_db

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads", "receipts")
COMPANY_UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads", "companies")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "svg"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(COMPANY_UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.json.sort_keys = False
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max upload


@app.after_request
def add_no_cache_headers(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_receipt_file(file_obj):
    if not file_obj or file_obj.filename == "":
        return ""
    if allowed_file(file_obj.filename):
        ext = secure_filename(file_obj.filename).rsplit(".", 1)[1].lower()
        unique_name = f"receipt_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.{ext}"
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
        file_obj.save(save_path)
        return f"/static/uploads/receipts/{unique_name}"
    return ""


def save_company_logo(file_obj):
    if not file_obj or file_obj.filename == "":
        return ""
    if allowed_file(file_obj.filename):
        ext = secure_filename(file_obj.filename).rsplit(".", 1)[1].lower()
        unique_name = f"company_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.{ext}"
        save_path = os.path.join(COMPANY_UPLOAD_FOLDER, unique_name)
        file_obj.save(save_path)
        return f"/static/uploads/companies/{unique_name}"
    return ""


def get_previous_month(month_str):
    try:
        year, month = map(int, month_str.split("-"))
        if month == 1:
            return f"{year - 1:04d}-12"
        return f"{year:04d}-{month - 1:02d}"
    except Exception:
        return "2026-09"


def resolve_member_id(conn, raw_id):
    if not raw_id or not str(raw_id).strip().isdigit():
        return None
    mid = int(str(raw_id).strip())
    cur = conn.cursor()
    cur.execute("SELECT id FROM members WHERE id = ?", (mid,))
    return mid if cur.fetchone() else None


VALID_CATEGORIES = (
    "Housing & Shelter",
    "Utilities & Connectivity",
    "Food & Household Groceries",
    "Home Maintenance & Upkeep",
    "Healthcare & Personal Care",
    "Transportation & Personal Lifestyle",
    "Miscellaneous",
)

LEGACY_CATEGORY_MAP = {
    "Essential": "Food & Household Groceries",
    "Condiments": "Food & Household Groceries",
    "Meat and Vegetables": "Food & Household Groceries",
    "Bills": "Utilities & Connectivity",
    "Groceries": "Food & Household Groceries",
}

CATEGORY_KEYWORDS = {
    "Housing & Shelter": [
        "house", "rent", "upa", "bahay", "mortgage", "apartment", "hoa",
        "condo", "dues", "lease", "amortization", "6k",
    ],
    "Utilities & Connectivity": [
        "electric", "kuryente", "meralco", "water", "tubig", "maynilad",
        "manila water", "primewater", "lpg", "gas", "gasul", "solane",
        "internet", "wifi", "pldt", "converge", "globe", "smart", "dito",
        "load", "cable", "cignal", "netflix", "utility", "bill",
    ],
    "Food & Household Groceries": [
        "bigas", "rice", "suka", "vinegar", "toyo", "soy sauce", "patis",
        "mantika", "cooking oil", "oil", "sibuyas", "onion", "bawang", "garlic",
        "luya", "ginger", "paminta", "pepper", "magic sarap", "knorr",
        "sinigang mix", "asin", "salt", "asukal", "sugar", "tomato",
        "ketchup", "mayo", "sili", "chili", "kape", "coffee", "kopiko",
        "nescafe", "milo", "gatas", "milk", "water (jag)", "mineral water",
        "jag", "fish", "isda", "tilapia", "bangus", "chicken", "manok",
        "adobo", "tinola", "pork", "baboy", "beef", "baka", "karne",
        "gulay", "vegetable", "talong", "kangkong", "repolyo", "sitaw",
        "kalabasa", "potato", "patatas", "cucumber", "pipino", "kamatis",
        "pechay", "okra", "ampalaya", "sayote", "malunggay", "monggo",
        "miswa", "odong", "bihon", "canton", "pancit", "spaghetti",
        "can foods", "canned", "delata", "sardinas", "tuna", "century",
        "corned beef", "spam", "noodles", "lucky me", "itlog", "egg",
        "hotdog", "tocino", "tinapay", "bread", "grocery", "food", "snack",
    ],
    "Home Maintenance & Upkeep": [
        "dishwashing", "joy", "bar sabon", "powder", "tide", "surf",
        "ariel", "breeze", "downy", "fabcon", "bleach", "zonrox",
        "sponge", "scrub", "walis", "mop", "trash bag", "bulb",
        "repair", "faucet", "gripo", "hardware", "paint", "cleaning", "upkeep",
    ],
    "Healthcare & Personal Care": [
        "shampoo", "palmolive", "clear men", "clear", "safeguard", "silca",
        "body wash", "bath soap", "toothpaste", "colgate", "close up",
        "toothbrush", "deo", "deodorant", "milcu", "rexona", "sanitary",
        "modes", "modess", "whisper", "napkin", "tissue", "wet wipes",
        "alcohol", "cotton", "lotion", "gamot", "medicine", "biogesic",
        "neozep", "paracetamol", "vitamins", "band aid", "betadine",
        "doctor", "clinic", "dental",
    ],
    "Transportation & Personal Lifestyle": [
        "pamasahe", "fare", "jeep", "jeepney", "tricycle", "trike", "bus",
        "mrt", "lrt", "grab", "taxi", "angkas", "joyride", "gasoline",
        "diesel", "petron", "shell", "caltex", "parking", "toll", "rfid",
        "easytrip", "autosweep", "car wash", "motor", "motorcycle", "gym",
        "cinema", "movie", "shopping", "clothes", "damit", "shoes",
    ],
}

def infer_category_from_title(title, fallback="Miscellaneous"):
    t = (title or "").strip().lower()
    if not t:
        return fallback
    import re
    words = set(re.findall(r"[a-zA-Z0-9]+", t))
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            kw_lower = kw.lower()
            if " " in kw_lower:
                if kw_lower in t:
                    return cat
            elif len(kw_lower) <= 4:
                if kw_lower in words:
                    return cat
            else:
                if kw_lower in t:
                    return cat
    return fallback



def compute_stock_status(stock_val):
    try:
        n = int(float(str(stock_val).strip()))
    except (ValueError, TypeError):
        n = 0
    if n <= 0:
        return "Out of Stock"
    if n <= 3:
        return "Low"
    return "High"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/manifest.webmanifest")
def pwa_manifest():
    res = send_from_directory("static", "manifest.webmanifest", mimetype="application/manifest+json")
    res.headers["Cache-Control"] = "public, max-age=86400"
    return res


@app.route("/sw.js")
def service_worker():
    res = send_from_directory("static", "sw.js", mimetype="application/javascript")
    res.headers["Service-Worker-Allowed"] = "/"
    res.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return res


@app.route("/api/bootstrap", methods=["GET"])
def api_bootstrap():
    selected_month = request.args.get("month", "2026-10").strip()
    if not selected_month or len(selected_month) != 7:
        selected_month = "2026-10"
    prev_month = get_previous_month(selected_month)

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Settings
    cursor.execute("SELECT * FROM settings WHERE id = 1")
    settings_row = cursor.fetchone()
    settings = dict(settings_row) if settings_row else {
        "id": 1,
        "monthly_budget_limit": 0.0,
        "budget_groceries": 0.0,
        "budget_utilities": 0.0,
        "budget_maintenance": 0.0,
        "budget_others": 0.0,
        "theme_preference": "dark",
    }

    # 2. Members
    cursor.execute("SELECT * FROM members ORDER BY id ASC")
    members = [dict(r) for r in cursor.fetchall()]

    # 3. Available Months
    cursor.execute("""
        SELECT DISTINCT substr(date_incurred, 1, 7) as m
        FROM expenses
        WHERE length(date_incurred) >= 7
        ORDER BY m DESC
    """)
    db_months = [r["m"] for r in cursor.fetchall() if r["m"]]
    default_months = ["2026-10"]
    available_months = sorted(list(set(db_months + default_months + [selected_month])), reverse=True)
    available_months = [m for m in available_months if m != "2026-09"]

    # 4. Expenses for Selected Month
    cursor.execute(
        """
        SELECT e.*, m.name as paid_by_name, m.avatar_color as paid_by_color
        FROM expenses e
        LEFT JOIN members m ON e.paid_by_member_id = m.id
        WHERE substr(e.date_incurred, 1, 7) = ?
        ORDER BY e.date_incurred DESC, e.id DESC
        """,
        (selected_month,),
    )
    expenses = [dict(r) for r in cursor.fetchall()]

    # 5. Previous Month Total for MoM Comparison
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE substr(date_incurred, 1, 7) = ?
        """,
        (prev_month,),
    )
    prev_month_total = round(float(cursor.fetchone()["total"]), 2)

    current_month_total = round(sum(float(e["amount"]) for e in expenses), 2)
    if prev_month_total > 0:
        mom_percentage = round(((current_month_total - prev_month_total) / prev_month_total) * 100, 1)
    else:
        mom_percentage = 0.0 if current_month_total == 0 else 100.0

    # 6. Category Breakdown & Category Budgets
    default_cats = [
        "Housing & Shelter",
        "Utilities & Connectivity",
        "Food & Household Groceries",
        "Home Maintenance & Upkeep",
        "Healthcare & Personal Care",
        "Transportation & Personal Lifestyle",
        "Miscellaneous",
    ]
    extra_cats = sorted(list(set(e["category"] for e in expenses if e.get("category") and e["category"] not in default_cats)))
    categories = default_cats + extra_cats
    cat_budget_keys = {
        "Housing & Shelter": float(settings.get("budget_housing", 0.0)),
        "Utilities & Connectivity": float(settings.get("budget_utilities", 0.0)),
        "Food & Household Groceries": float(settings.get("budget_groceries", 0.0)),
        "Home Maintenance & Upkeep": float(settings.get("budget_maintenance", 0.0)),
        "Healthcare & Personal Care": float(settings.get("budget_healthcare", 0.0)),
        "Transportation & Personal Lifestyle": float(settings.get("budget_lifestyle", 0.0)),
        "Miscellaneous": float(settings.get("budget_others", 0.0)),
    }
    category_breakdown = {}
    for cat in categories:
        spent = round(sum(float(e["amount"]) for e in expenses if e["category"] == cat), 2)
        b_limit = cat_budget_keys.get(cat, 0.0)
        pct = round((spent / b_limit) * 100, 1) if b_limit > 0 else 0.0
        category_breakdown[cat] = {
            "spent": spent,
            "budget": b_limit,
            "remaining": round(b_limit - spent, 2) if b_limit > 0 else 0.0,
            "pct": pct,
        }

    # 7. Monthly Trend (for MoM comparison chart)
    try:
        sm_year, sm_month_num = map(int, selected_month.split("-"))
    except Exception:
        sm_year, sm_month_num = 2026, 10

    trailing_months = []
    curr_y, curr_m = sm_year, sm_month_num
    for _ in range(6):
        trailing_months.append(f"{curr_y:04d}-{curr_m:02d}")
        curr_m -= 1
        if curr_m < 1:
            curr_m = 12
            curr_y -= 1
    trailing_months.reverse()

    cursor.execute("SELECT DISTINCT substr(date_incurred, 1, 7) as m FROM expenses WHERE date_incurred IS NOT NULL")
    db_months = [r["m"] for r in cursor.fetchall() if r["m"]]

    trend_months = sorted(list(set(trailing_months + db_months + [selected_month, prev_month])))
    if len(trend_months) > 12:
        trend_months = trend_months[-12:]

    monthly_trend = []
    for tm in trend_months:
        cursor.execute(
            """
            SELECT category, COALESCE(SUM(amount), 0) as cat_total
            FROM expenses
            WHERE substr(date_incurred, 1, 7) = ?
            GROUP BY category
            """,
            (tm,),
        )
        cat_rows = {r["category"]: round(float(r["cat_total"]), 2) for r in cursor.fetchall()}
        tm_total = round(sum(cat_rows.values()), 2)

        trend_item = {
            "month": tm,
            "total": tm_total,
        }
        for cat in VALID_CATEGORIES:
            trend_item[cat] = cat_rows.get(cat, 0.0)

        # Merge legacy categories into their modern standard equivalent
        for leg_cat, target_cat in LEGACY_CATEGORY_MAP.items():
            if leg_cat in cat_rows and leg_cat not in VALID_CATEGORIES:
                trend_item[target_cat] = round(trend_item[target_cat] + cat_rows[leg_cat], 2)

        # Include custom categories if any
        for cat, val in cat_rows.items():
            if cat not in trend_item:
                trend_item[cat] = val

        # Retain backward compatibility legacy aliases
        trend_item["Essential"] = trend_item.get("Food & Household Groceries", 0.0)
        trend_item["Condiments"] = 0.0
        trend_item["Meat and Vegetables"] = 0.0
        trend_item["Bills"] = trend_item.get("Utilities & Connectivity", 0.0)

        monthly_trend.append(trend_item)

    # 8. Recurring Bills
    cursor.execute("SELECT * FROM recurring_bills ORDER BY due_day ASC, id ASC")
    bills_raw = [dict(r) for r in cursor.fetchall()]
    recurring_bills = []
    unpaid_bills_total = 0.0
    unpaid_bills_count = 0
    paid_bills_count = 0

    # 8.5 Companies
    cursor.execute("SELECT * FROM companies ORDER BY name ASC")
    companies = [dict(r) for r in cursor.fetchall()]

    for b in bills_raw:
        is_paid = b["last_paid_month"] == selected_month
        b["is_paid_current_month"] = is_paid
        if is_paid:
            paid_bills_count += 1
        else:
            unpaid_bills_count += 1
            unpaid_bills_total += float(b["default_amount"])
        if not b.get("company_logo"):
            for comp in companies:
                if comp["name"].strip().lower() in [
                    (b.get("company_name") or "").strip().lower(),
                    (b.get("bill_name") or "").strip().lower(),
                ]:
                    b["company_logo"] = comp["logo_path"]
                    if not b.get("company_name"):
                        b["company_name"] = comp["name"]
                    break
        recurring_bills.append(b)

    unpaid_bills_total = round(unpaid_bills_total, 2)

    # 9. Inventory & Shopping List
    cursor.execute("SELECT * FROM inventory_items ORDER BY id ASC")
    inventory_items = []
    for r in cursor.fetchall():
        row_dict = dict(r)
        computed = compute_stock_status(row_dict.get("unit"))
        if row_dict.get("status") != computed:
            row_dict["status"] = computed
            cursor.execute("UPDATE inventory_items SET status = ? WHERE id = ?", (computed, row_dict["id"]))
        inventory_items.append(row_dict)
    conn.commit()
    status_order = {"Out of Stock": 1, "Low": 2, "High": 3}
    inventory_items.sort(key=lambda x: (status_order.get(x["status"], 3), (x.get("item_name") or "").lower()))
    shopping_list = [item for item in inventory_items if item["status"] in ("Out of Stock", "Low")]

    # 10. Price History & Store Comparison
    cursor.execute("SELECT * FROM price_history ORDER BY recorded_date ASC, id ASC")
    price_history = [dict(r) for r in cursor.fetchall()]

    items_comparison = {}
    for ph in price_history:
        iname = ph["item_name"]
        if iname not in items_comparison:
            items_comparison[iname] = {
                "item_name": iname,
                "item_id": ph["item_id"],
                "stores": {},
                "history": [],
            }
        items_comparison[iname]["history"].append(ph)
        # Keep latest price per store
        items_comparison[iname]["stores"][ph["store_name"]] = {
            "price": float(ph["price"]),
            "recorded_date": ph["recorded_date"],
        }

    comparison_list = []
    for iname, data in items_comparison.items():
        store_map = data["stores"]
        if store_map:
            sorted_stores = sorted(store_map.items(), key=lambda x: x[1]["price"])
            cheapest_store, cheapest_info = sorted_stores[0]
            highest_store, highest_info = sorted_stores[-1]
            savings = round(highest_info["price"] - cheapest_info["price"], 2)
        else:
            cheapest_store, cheapest_info = ("N/A", {"price": 0.0, "recorded_date": ""})
            highest_store, highest_info = ("N/A", {"price": 0.0, "recorded_date": ""})
            savings = 0.0

        comparison_list.append({
            "item_name": iname,
            "item_id": data["item_id"],
            "stores": store_map,
            "cheapest_store": cheapest_store,
            "cheapest_price": cheapest_info["price"],
            "highest_store": highest_store,
            "highest_price": highest_info["price"],
            "max_savings": savings,
            "history": data["history"],
        })

    budget_limit = float(settings["monthly_budget_limit"])
    budget_remaining = round(budget_limit - current_month_total, 2)
    budget_used_pct = round((current_month_total / budget_limit) * 100, 1) if budget_limit > 0 else 0.0

    # Calculate 3 KPIs: Daily Average Spending, Top Spending Category, Projected Month-End Balance
    try:
        ym_year, ym_month = map(int, selected_month.split("-"))
        _, total_days_in_month = calendar.monthrange(ym_year, ym_month)
    except Exception:
        total_days_in_month = 31
        ym_year, ym_month = 2026, 10

    now = datetime.now()
    if now.year == ym_year and now.month == ym_month:
        days_elapsed = max(1, now.day)
    elif (now.year > ym_year) or (now.year == ym_year and now.month > ym_month):
        days_elapsed = total_days_in_month
    else:
        days_elapsed = 1

    daily_avg_spending = round(current_month_total / days_elapsed, 2)

    top_category_name = "None"
    top_category_amount = 0.0
    top_category_pct = 0.0
    if current_month_total > 0:
        sorted_cats = sorted(category_breakdown.items(), key=lambda x: x[1]["spent"], reverse=True)
        if sorted_cats and sorted_cats[0][1]["spent"] > 0:
            top_category_name = sorted_cats[0][0]
            top_category_amount = sorted_cats[0][1]["spent"]
            top_category_pct = round((top_category_amount / current_month_total) * 100, 1)

    projected_month_end_spend = round((daily_avg_spending * total_days_in_month) + unpaid_bills_total, 2)
    projected_month_end_balance = round(budget_limit - projected_month_end_spend, 2)

    conn.close()

    return jsonify({
        "selected_month": selected_month,
        "previous_month": prev_month,
        "available_months": available_months,
        "settings": settings,
        "members": members,
        "kpi": {
            "total_expenses": current_month_total,
            "prev_month_expenses": prev_month_total,
            "mom_percentage": mom_percentage,
            "budget_limit": budget_limit,
            "budget_remaining": budget_remaining,
            "budget_used_pct": budget_used_pct,
            "unpaid_bills_total": unpaid_bills_total,
            "unpaid_bills_count": unpaid_bills_count,
            "paid_bills_count": paid_bills_count,
            "daily_avg_spending": daily_avg_spending,
            "days_elapsed": days_elapsed,
            "total_days_in_month": total_days_in_month,
            "top_category_name": top_category_name,
            "top_category_amount": top_category_amount,
            "top_category_pct": top_category_pct,
            "projected_month_end_spend": projected_month_end_spend,
            "projected_month_end_balance": projected_month_end_balance,
            "category_breakdown": category_breakdown,
        },
        "categories": list(category_breakdown.keys()),
        "expenses": expenses,
        "monthly_trend": monthly_trend,
        "recurring_bills": recurring_bills,
        "companies": companies,
        "inventory_items": inventory_items,
        "shopping_list": shopping_list,
        "price_history": price_history,
        "price_comparison": comparison_list,
    })


# ==========================================
# SETTINGS API
# ==========================================
@app.route("/api/settings", methods=["PUT"])
def update_settings():
    data = request.get_json(force=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM settings WHERE id = 1")
    current = dict(cursor.fetchone())

    monthly_budget_limit = float(data.get("monthly_budget_limit", current["monthly_budget_limit"]))
    budget_groceries = float(data.get("budget_groceries", current["budget_groceries"]))
    budget_utilities = float(data.get("budget_utilities", current["budget_utilities"]))
    budget_maintenance = float(data.get("budget_maintenance", current["budget_maintenance"]))
    budget_others = float(data.get("budget_others", current["budget_others"]))
    theme_preference = data.get("theme_preference", current["theme_preference"])

    cursor.execute(
        """
        UPDATE settings
        SET monthly_budget_limit = ?,
            budget_groceries = ?,
            budget_utilities = ?,
            budget_maintenance = ?,
            budget_others = ?,
            theme_preference = ?
        WHERE id = 1
        """,
        (
            monthly_budget_limit,
            budget_groceries,
            budget_utilities,
            budget_maintenance,
            budget_others,
            theme_preference,
        ),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Settings updated successfully."})


@app.route("/api/profile", methods=["POST", "PUT"])
def update_profile():
    conn = get_db_connection()
    cursor = conn.cursor()

    name = (request.form.get("name") or "").strip() or "Admin"
    birthday = (request.form.get("birthday") or "").strip()
    address = (request.form.get("address") or "").strip()

    photo_file = request.files.get("photo")
    photo_path = save_receipt_file(photo_file) if photo_file else None

    if photo_path:
        cursor.execute(
            """
            UPDATE settings
            SET admin_name = ?, admin_birthday = ?, admin_address = ?, admin_photo = ?
            WHERE id = 1
            """,
            (name, birthday, address, photo_path),
        )
    else:
        cursor.execute(
            """
            UPDATE settings
            SET admin_name = ?, admin_birthday = ?, admin_address = ?
            WHERE id = 1
            """,
            (name, birthday, address),
        )

    conn.commit()
    cursor.execute("SELECT * FROM settings WHERE id = 1")
    updated = dict(cursor.fetchone())
    conn.close()

    return jsonify({"status": "success", "message": "Profile updated successfully.", "settings": updated})


# ==========================================
# EXPENSES CRUD API
# ==========================================
@app.route("/api/expenses", methods=["POST"])
def create_expense():
    if request.form or request.files or (request.content_type and "multipart/form-data" in request.content_type):
        form = request.form
        file_obj = request.files.get("receipt")
        receipt_path = save_receipt_file(file_obj)
    else:
        form = request.get_json(silent=True) or {}
        receipt_path = form.get("receipt_path", "")

    title = (form.get("title") or "").strip()
    raw_category = (form.get("category") or "").strip()
    if not raw_category:
        category = infer_category_from_title(title, fallback="Food & Household Groceries")
    else:
        category = LEGACY_CATEGORY_MAP.get(raw_category, raw_category)

    try:
        amount = round(float(form.get("amount", 0)), 2)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    if not title or amount <= 0:
        return jsonify({"error": "Title and a positive amount are required."}), 400

    try:
        quantity = max(1, int(float(form.get("quantity", 1))))
    except (ValueError, TypeError):
        quantity = 1

    store_name = (form.get("store_name") or "").strip()
    paid_by_raw = form.get("paid_by_member_id")

    date_incurred = (form.get("date_incurred") or datetime.now().strftime("%Y-%m-%d")).strip()
    notes = (form.get("notes") or "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    paid_by_member_id = resolve_member_id(conn, paid_by_raw)

    cursor.execute(
        """
        INSERT INTO expenses (
            title, category, amount, quantity, store_name, paid_by_member_id,
            receipt_path, date_incurred, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            title,
            category,
            amount,
            quantity,
            store_name,
            paid_by_member_id,
            receipt_path,
            date_incurred,
            notes,
        ),
    )
    expense_id = cursor.lastrowid

    # Optional: log to price_history if requested or if matching inventory item
    log_price_flag = str(form.get("log_price_history", "")).lower() in ("1", "true", "yes", "on")
    if store_name and (log_price_flag or category != "Bills"):
        cursor.execute(
            "SELECT id, item_name FROM inventory_items WHERE lower(item_name) = lower(?)",
            (title,),
        )
        matched_item = cursor.fetchone()
        if matched_item or log_price_flag:
            item_id = matched_item["id"] if matched_item else None
            item_name_for_log = matched_item["item_name"] if matched_item else title
            cursor.execute(
                """
                INSERT INTO price_history (item_id, item_name, store_name, price, recorded_date)
                VALUES (?, ?, ?, ?, ?)
                """,
                (item_id, item_name_for_log, store_name, amount, date_incurred),
            )
            if item_id:
                cursor.execute(
                    "UPDATE inventory_items SET last_price = ?, preferred_store = ? WHERE id = ?",
                    (amount, store_name, item_id),
                )

    conn.commit()
    conn.close()
    return jsonify({"status": "success", "id": expense_id, "message": "Expense logged successfully."}), 201


@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Expense not found"}), 404

    if request.form or request.files or (request.content_type and "multipart/form-data" in request.content_type):
        form = request.form
        file_obj = request.files.get("receipt")
        new_receipt = save_receipt_file(file_obj)
        receipt_path = new_receipt if new_receipt else existing["receipt_path"]
        if form.get("remove_receipt") == "1":
            receipt_path = ""
    else:
        form = request.get_json(silent=True) or {}
        receipt_path = form.get("receipt_path", existing["receipt_path"])

    title = (form.get("title") or existing["title"]).strip()
    raw_category = (form.get("category") or existing["category"]).strip()
    category = LEGACY_CATEGORY_MAP.get(raw_category, raw_category)
    amount = round(float(form.get("amount", existing["amount"])), 2)
    try:
        raw_qty = form.get("quantity") if "quantity" in form else existing["quantity"]
        quantity = max(1, int(float(raw_qty)))
    except (ValueError, TypeError, KeyError):
        quantity = 1
    store_name = (form.get("store_name") if "store_name" in form else existing["store_name"]).strip()
    paid_by_raw = form.get("paid_by_member_id", existing["paid_by_member_id"])
    paid_by_member_id = resolve_member_id(conn, paid_by_raw)
    date_incurred = (form.get("date_incurred") or existing["date_incurred"]).strip()
    notes = (form.get("notes") if "notes" in form else existing["notes"]).strip()

    cursor.execute(
        """
        UPDATE expenses
        SET title = ?,
            category = ?,
            amount = ?,
            quantity = ?,
            store_name = ?,
            paid_by_member_id = ?,
            receipt_path = ?,
            date_incurred = ?,
            notes = ?
        WHERE id = ?
        """,
        (
            title,
            category,
            amount,
            quantity,
            store_name,
            paid_by_member_id,
            receipt_path,
            date_incurred,
            notes,
            expense_id,
        ),
    )

    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Expense updated successfully."})


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Expense deleted."})


# ==========================================
# RECURRING BILLS CRUD & 1-CLICK PAY API
# ==========================================
@app.route("/api/bills", methods=["POST"])
def create_bill():
    data = request.get_json(force=True) or {}
    bill_name = (data.get("bill_name") or "").strip()
    category = (data.get("category") or "").strip()
    if not category:
        category = infer_category_from_title(bill_name, fallback="Bills")
    default_amount = round(float(data.get("default_amount", 0)), 2)
    due_day = max(1, min(31, int(data.get("due_day", 15))))
    last_paid_month = (data.get("last_paid_month") or "").strip()
    company_name = (data.get("company_name") or "").strip()
    company_logo = (data.get("company_logo") or "").strip()

    if not bill_name or default_amount <= 0:
        return jsonify({"error": "Bill name and positive amount are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    if not company_logo:
        lookup_name = company_name or bill_name
        cursor.execute("SELECT name, logo_path FROM companies WHERE lower(trim(name)) = lower(trim(?))", (lookup_name,))
        matched_comp = cursor.fetchone()
        if matched_comp:
            company_name = matched_comp["name"]
            company_logo = matched_comp["logo_path"]

    cursor.execute(
        "SELECT id, bill_name FROM recurring_bills WHERE lower(trim(bill_name)) = lower(trim(?))",
        (bill_name,),
    )
    existing_bill = cursor.fetchone()
    if existing_bill:
        conn.close()
        return jsonify({"error": f"Recurring bill '{existing_bill['bill_name']}' already exists."}), 409

    cursor.execute(
        """
        INSERT INTO recurring_bills (bill_name, category, default_amount, due_day, last_paid_month, company_name, company_logo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (bill_name, category, default_amount, due_day, last_paid_month, company_name, company_logo),
    )
    bill_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "id": bill_id, "message": "Recurring bill added."}), 201


@app.route("/api/bills/<int:bill_id>", methods=["PUT"])
def update_bill(bill_id):
    data = request.get_json(force=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recurring_bills WHERE id = ?", (bill_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Bill not found"}), 404

    bill_name = (data.get("bill_name") or existing["bill_name"]).strip()
    category = (data.get("category") or existing["category"]).strip()
    default_amount = round(float(data.get("default_amount", existing["default_amount"])), 2)
    due_day = max(1, min(31, int(data.get("due_day", existing["due_day"]))))
    last_paid_month = data.get("last_paid_month", existing["last_paid_month"])
    company_name = (data.get("company_name") if "company_name" in data else existing["company_name"] or "").strip()
    company_logo = (data.get("company_logo") if "company_logo" in data else existing["company_logo"] or "").strip()

    if not company_logo:
        lookup_name = company_name or bill_name
        cursor.execute("SELECT name, logo_path FROM companies WHERE lower(trim(name)) = lower(trim(?))", (lookup_name,))
        matched_comp = cursor.fetchone()
        if matched_comp:
            company_name = matched_comp["name"]
            company_logo = matched_comp["logo_path"]

    cursor.execute(
        "SELECT id, bill_name FROM recurring_bills WHERE lower(trim(bill_name)) = lower(trim(?)) AND id != ?",
        (bill_name, bill_id),
    )
    dup_bill = cursor.fetchone()
    if dup_bill:
        conn.close()
        return jsonify({"error": f"Another recurring bill named '{dup_bill['bill_name']}' already exists."}), 409

    cursor.execute(
        """
        UPDATE recurring_bills
        SET bill_name = ?, category = ?, default_amount = ?, due_day = ?, last_paid_month = ?, company_name = ?, company_logo = ?
        WHERE id = ?
        """,
        (bill_name, category, default_amount, due_day, last_paid_month, company_name, company_logo, bill_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Recurring bill updated."})


@app.route("/api/bills/<int:bill_id>", methods=["DELETE"])
def delete_bill(bill_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM recurring_bills WHERE id = ?", (bill_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Recurring bill removed."})


# ==========================================
# COMPANIES API
# ==========================================
@app.route("/api/companies", methods=["GET"])
def get_companies():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM companies ORDER BY name ASC")
    companies = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"companies": companies})


@app.route("/api/companies", methods=["POST"])
def add_company():
    if request.content_type and "multipart/form-data" in request.content_type:
        name = (request.form.get("name") or "").strip()
        logo_path = save_company_logo(request.files.get("logo_file"))
        if not logo_path and request.form.get("logo_path"):
            logo_path = request.form.get("logo_path").strip()
    else:
        data = request.get_json(force=True) or {}
        name = (data.get("name") or "").strip()
        logo_path = (data.get("logo_path") or "").strip()

    if not name:
        return jsonify({"error": "Company name is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM companies WHERE lower(trim(name)) = lower(trim(?))", (name,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return jsonify({"error": f"Company '{name}' already exists."}), 409

    cursor.execute("INSERT INTO companies (name, logo_path) VALUES (?, ?)", (name, logo_path))
    company_id = cursor.lastrowid

    # Auto-link any existing recurring bills with matching name and no logo
    if logo_path:
        cursor.execute("""
            UPDATE recurring_bills 
            SET company_name = ?, company_logo = ? 
            WHERE (lower(trim(bill_name)) = lower(trim(?)) OR lower(trim(company_name)) = lower(trim(?)))
              AND (company_logo IS NULL OR company_logo = '')
        """, (name, logo_path, name, name))

    conn.commit()
    conn.close()
    return jsonify({"status": "success", "id": company_id, "message": "Company registered successfully."}), 201


@app.route("/api/companies/<int:company_id>", methods=["PUT"])
def update_company(company_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM companies WHERE id = ?", (company_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Company not found."}), 404

    if request.content_type and "multipart/form-data" in request.content_type:
        name = (request.form.get("name") or existing["name"]).strip()
        uploaded = save_company_logo(request.files.get("logo_file"))
        logo_path = uploaded if uploaded else (request.form.get("logo_path") or existing["logo_path"] or "")
    else:
        data = request.get_json(force=True) or {}
        name = (data.get("name") or existing["name"]).strip()
        logo_path = data.get("logo_path", existing["logo_path"] or "").strip()

    if not name:
        conn.close()
        return jsonify({"error": "Company name is required."}), 400

    cursor.execute("SELECT id FROM companies WHERE lower(trim(name)) = lower(trim(?)) AND id != ?", (name, company_id))
    dup = cursor.fetchone()
    if dup:
        conn.close()
        return jsonify({"error": f"Another company named '{name}' already exists."}), 409

    cursor.execute("UPDATE companies SET name = ?, logo_path = ? WHERE id = ?", (name, logo_path, company_id))

    # Synchronize bills
    cursor.execute("""
        UPDATE recurring_bills 
        SET company_name = ?, company_logo = ? 
        WHERE lower(trim(company_name)) = lower(trim(?)) OR lower(trim(bill_name)) = lower(trim(?))
    """, (name, logo_path, existing["name"], name))

    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Company details updated."})


@app.route("/api/companies/<int:company_id>", methods=["DELETE"])
def delete_company(company_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM companies WHERE id = ?", (company_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Company not found."}), 404

    cursor.execute("DELETE FROM companies WHERE id = ?", (company_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Company removed."})


@app.route("/api/bills/<int:bill_id>/pay", methods=["POST"])
def pay_bill(bill_id):
    data = request.get_json(force=True) or {}
    month = (data.get("month") or "2026-10").strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recurring_bills WHERE id = ?", (bill_id,))
    bill = cursor.fetchone()
    if not bill:
        conn.close()
        return jsonify({"error": "Bill not found"}), 404

    paid_by_member_id = resolve_member_id(conn, data.get("paid_by_member_id"))
    amount = round(float(data.get("amount", bill["default_amount"])), 2)
    today_str = datetime.now().strftime("%Y-%m-%d")
    if today_str.startswith(month):
        date_incurred = today_str
    else:
        due_day_padded = f"{int(bill['due_day']):02d}"
        date_incurred = f"{month}-{due_day_padded}"

    cursor.execute(
        "UPDATE recurring_bills SET last_paid_month = ? WHERE id = ?",
        (month, bill_id),
    )

    expense_title = f"{bill['bill_name']} ({month})"
    cursor.execute(
        """
        INSERT INTO expenses (
            title, category, amount, quantity, store_name, paid_by_member_id,
            receipt_path, date_incurred, notes
        ) VALUES (?, ?, ?, 1, ?, ?, '', ?, ?)
        """,
        (
            expense_title,
            bill["category"] if bill["category"] in VALID_CATEGORIES else "Bills",
            amount,
            "Bills Payment",
            paid_by_member_id,
            date_incurred,
            f"Auto-logged via 1-Click PAY for {bill['bill_name']}",
        ),
    )
    expense_id = cursor.lastrowid

    conn.commit()
    conn.close()
    return jsonify({
        "status": "success",
        "expense_id": expense_id,
        "message": f"Paid {bill['bill_name']} and logged ₱{amount:,.2f} to Expenses!",
    })


# ==========================================
# INVENTORY & SHOPPING LIST API
# ==========================================
@app.route("/api/inventory", methods=["POST"])
def create_inventory_item():
    data = request.get_json(force=True) or {}
    item_name = (data.get("item_name") or "").strip()
    raw_unit = str(data.get("unit") if data.get("unit") is not None else "1").strip()
    try:
        stock_num = max(0, int(float(raw_unit)))
    except (ValueError, TypeError):
        stock_num = 1
    unit = str(stock_num)
    status = compute_stock_status(stock_num)
    last_price = round(float(data.get("last_price") or 0), 2)
    preferred_store = (data.get("preferred_store") or "").strip()
    raw_cat = (data.get("category") or "").strip()
    category = LEGACY_CATEGORY_MAP.get(raw_cat, raw_cat) or infer_category_from_title(item_name, fallback="Food & Household Groceries")

    if not item_name:
        return jsonify({"error": "Item name is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, item_name FROM inventory_items WHERE lower(trim(item_name)) = lower(trim(?))",
        (item_name,),
    )
    existing_item = cursor.fetchone()
    if existing_item:
        conn.close()
        return jsonify({"error": f"Item '{existing_item['item_name']}' already exists in Pantry."}), 409

    cursor.execute(
        """
        INSERT INTO inventory_items (item_name, category, unit, status, last_price, preferred_store)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (item_name, category, unit, status, last_price, preferred_store),
    )
    item_id = cursor.lastrowid

    if last_price > 0 and preferred_store:
        cursor.execute(
            """
            INSERT INTO price_history (item_id, item_name, store_name, price, recorded_date)
            VALUES (?, ?, ?, ?, ?)
            """,
            (item_id, item_name, preferred_store, last_price, datetime.now().strftime("%Y-%m-%d")),
        )

    conn.commit()
    conn.close()
    return jsonify({"status": "success", "id": item_id, "message": "Inventory item added."}), 201


@app.route("/api/inventory/<int:item_id>", methods=["PUT"])
def update_inventory_item(item_id):
    data = request.get_json(force=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inventory_items WHERE id = ?", (item_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Item not found"}), 404

    item_name = (data.get("item_name") or existing["item_name"]).strip()
    existing_cat = existing["category"] if "category" in existing.keys() else "Food & Household Groceries"
    raw_cat = (data.get("category") or existing_cat).strip()
    category = LEGACY_CATEGORY_MAP.get(raw_cat, raw_cat) or infer_category_from_title(item_name, fallback="Food & Household Groceries")
    raw_unit = str(data.get("unit") if data.get("unit") is not None else existing["unit"]).strip()
    try:
        stock_num = max(0, int(float(raw_unit)))
        unit = str(stock_num)
    except (ValueError, TypeError):
        unit = raw_unit
        stock_num = 1
    status = compute_stock_status(stock_num)
    last_price = round(float(data.get("last_price", existing["last_price"]) or 0), 2)
    preferred_store = (data.get("preferred_store") if "preferred_store" in data else existing["preferred_store"]).strip()

    cursor.execute(
        "SELECT id, item_name FROM inventory_items WHERE lower(trim(item_name)) = lower(trim(?)) AND id != ?",
        (item_name, item_id),
    )
    dup_item = cursor.fetchone()
    if dup_item:
        conn.close()
        return jsonify({"error": f"Another item named '{dup_item['item_name']}' already exists in Pantry."}), 409

    cursor.execute(
        """
        UPDATE inventory_items
        SET item_name = ?, category = ?, unit = ?, status = ?, last_price = ?, preferred_store = ?
        WHERE id = ?
        """,
        (item_name, category, unit, status, last_price, preferred_store, item_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Inventory item updated."})


@app.route("/api/inventory/<int:item_id>/status", methods=["PATCH"])
def toggle_inventory_status(item_id):
    data = request.get_json(force=True) or {}
    new_status = (data.get("status") or "").strip()
    if new_status not in ("Out of Stock", "Low", "High"):
        return jsonify({"error": "Invalid status"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE inventory_items SET status = ? WHERE id = ?", (new_status, item_id))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "new_status": new_status})


@app.route("/api/inventory/<int:item_id>", methods=["DELETE"])
def delete_inventory_item(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM inventory_items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Inventory item deleted."})


@app.route("/api/inventory/<int:item_id>/convert-to-expense", methods=["POST"])
def convert_inventory_to_expense(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inventory_items WHERE id = ?", (item_id,))
    item = cursor.fetchone()
    if not item:
        conn.close()
        return jsonify({"error": "Inventory item not found"}), 404

    if request.content_type and "multipart/form-data" in request.content_type:
        form = request.form
        file_obj = request.files.get("receipt")
        receipt_path = save_receipt_file(file_obj)
    else:
        form = request.get_json(force=True) or {}
        receipt_path = form.get("receipt_path", "")

    amount = round(float(form.get("amount") or form.get("price") or item["last_price"] or 0), 2)
    if amount <= 0:
        conn.close()
        return jsonify({"error": "Please enter a valid price greater than 0."}), 400

    store_name = (form.get("store_name") or item["preferred_store"] or "").strip()
    paid_by_raw = form.get("paid_by_member_id")
    paid_by_member_id = resolve_member_id(conn, paid_by_raw)
    date_incurred = (form.get("date_incurred") or datetime.now().strftime("%Y-%m-%d")).strip()
    raw_cat = (form.get("category") or "").strip()
    item_cat = item["category"] if "category" in item.keys() and item["category"] else ""
    cat_candidate = raw_cat or item_cat or infer_category_from_title(item["item_name"], fallback="Food & Household Groceries")
    category = LEGACY_CATEGORY_MAP.get(cat_candidate, cat_candidate)
    notes = (form.get("notes") or f"Restocked {item['item_name']} (Stock: {item['unit']})").strip()

    expense_title = f"{item['item_name']}"

    try:
        quantity = max(1, int(float(form.get("quantity", 1))))
    except (ValueError, TypeError):
        quantity = 1

    # 1. Insert Expense
    cursor.execute(
        """
        INSERT INTO expenses (
            title, category, amount, quantity, store_name, paid_by_member_id,
            receipt_path, date_incurred, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            expense_title,
            category,
            amount,
            quantity,
            store_name,
            paid_by_member_id,
            receipt_path,
            date_incurred,
            notes,
        ),
    )
    expense_id = cursor.lastrowid

    # 2. Restock Inventory Item (ensure stock >= 4 so status is 'High') & update latest price/store
    try:
        curr_stock = int(float(str(item["unit"]).strip()))
    except (ValueError, TypeError):
        curr_stock = 0
    restocked_unit = str(max(4, curr_stock + 4))
    cursor.execute(
        """
        UPDATE inventory_items
        SET unit = ?, status = 'High', last_price = ?, preferred_store = ?
        WHERE id = ?
        """,
        (restocked_unit, amount, store_name, item_id),
    )

    # 3. Log into Price History
    if store_name:
        cursor.execute(
            """
            INSERT INTO price_history (item_id, item_name, store_name, price, recorded_date)
            VALUES (?, ?, ?, ?, ?)
            """,
            (item_id, item["item_name"], store_name, amount, date_incurred),
        )

    conn.commit()
    conn.close()
    return jsonify({
        "status": "success",
        "expense_id": expense_id,
        "message": f"{item['item_name']} restocked, logged to Expenses & Price History!",
    })


# ==========================================
# PRICE HISTORY CRUD API
# ==========================================
@app.route("/api/price-history", methods=["POST"])
def create_price_log():
    data = request.get_json(force=True) or {}
    item_id = data.get("item_id")
    item_id = int(item_id) if item_id and str(item_id).isdigit() else None
    item_name = (data.get("item_name") or "").strip()
    store_name = (data.get("store_name") or "").strip()
    price = round(float(data.get("price", 0)), 2)
    recorded_date = (data.get("recorded_date") or datetime.now().strftime("%Y-%m-%d")).strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    if item_id and not item_name:
        cursor.execute("SELECT item_name FROM inventory_items WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        if row:
            item_name = row["item_name"]
    elif item_name and not item_id:
        cursor.execute("SELECT id FROM inventory_items WHERE lower(item_name) = lower(?)", (item_name,))
        row = cursor.fetchone()
        if row:
            item_id = row["id"]

    if not item_name or price <= 0:
        conn.close()
        return jsonify({"error": "Item name and positive price are required."}), 400

    cursor.execute(
        """
        INSERT INTO price_history (item_id, item_name, store_name, price, recorded_date)
        VALUES (?, ?, ?, ?, ?)
        """,
        (item_id, item_name, store_name, price, recorded_date),
    )
    log_id = cursor.lastrowid

    if item_id:
        if store_name:
            cursor.execute(
                "UPDATE inventory_items SET last_price = ?, preferred_store = ? WHERE id = ?",
                (price, store_name, item_id),
            )
        else:
            cursor.execute(
                "UPDATE inventory_items SET last_price = ? WHERE id = ?",
                (price, item_id),
            )

    conn.commit()
    conn.close()
    return jsonify({"status": "success", "id": log_id, "message": "Store price logged."}), 201


@app.route("/api/price-history/<int:log_id>", methods=["PUT"])
def update_price_log(log_id):
    data = request.get_json(force=True) or {}
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM price_history WHERE id = ?", (log_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Price record not found"}), 404

    item_name = (data.get("item_name") or existing["item_name"]).strip()
    store_name = (data.get("store_name") or existing["store_name"]).strip()
    price = round(float(data.get("price", existing["price"])), 2)
    recorded_date = (data.get("recorded_date") or existing["recorded_date"]).strip()

    cursor.execute(
        """
        UPDATE price_history
        SET item_name = ?, store_name = ?, price = ?, recorded_date = ?
        WHERE id = ?
        """,
        (item_name, store_name, price, recorded_date, log_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Price record updated."})


@app.route("/api/price-history/<int:log_id>", methods=["DELETE"])
def delete_price_log(log_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM price_history WHERE id = ?", (log_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Price record deleted."})


# ==========================================
# HOUSEHOLD MEMBERS API
# ==========================================
@app.route("/api/members", methods=["POST"])
def create_member():
    if request.content_type and "multipart/form-data" in request.content_type:
        data = request.form
        photo_path = save_receipt_file(request.files.get("photo"))
    else:
        data = request.get_json(force=True) or {}
        photo_path = (data.get("photo_path") or "").strip()

    name = (data.get("name") or "").strip()
    avatar_color = (data.get("avatar_color") or "#2563eb").strip()
    role = (data.get("role") or "Profile").strip()

    if not name:
        return jsonify({"error": "Profile name is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO members (name, avatar_color, role, photo_path) VALUES (?, ?, ?, ?)",
        (name, avatar_color, role, photo_path),
    )
    member_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "id": member_id, "photo_path": photo_path, "message": "Profile added."}), 201


@app.route("/api/members/<int:member_id>", methods=["PUT"])
def update_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM members WHERE id = ?", (member_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Profile not found"}), 404

    if request.content_type and "multipart/form-data" in request.content_type:
        data = request.form
        uploaded_photo = save_receipt_file(request.files.get("photo"))
        photo_path = uploaded_photo if uploaded_photo else (existing["photo_path"] or "")
    else:
        data = request.get_json(force=True) or {}
        photo_path = (data.get("photo_path") or existing["photo_path"] or "").strip()

    name = (data.get("name") or existing["name"]).strip()
    avatar_color = (data.get("avatar_color") or existing["avatar_color"]).strip()
    role = (data.get("role") or existing["role"]).strip()

    cursor.execute(
        "UPDATE members SET name = ?, avatar_color = ?, role = ?, photo_path = ? WHERE id = ?",
        (name, avatar_color, role, photo_path, member_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Profile updated."})


@app.route("/api/members/<int:member_id>", methods=["DELETE"])
def delete_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM members WHERE id = ?", (member_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Member removed."})


# ==========================================
# SERVER-SIDE CSV EXPORT API
# ==========================================
@app.route("/api/export/csv", methods=["GET"])
def export_csv():
    month = request.args.get("month", "2026-10").strip()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT e.*, m.name as paid_by_name
        FROM expenses e
        LEFT JOIN members m ON e.paid_by_member_id = m.id
        WHERE substr(e.date_incurred, 1, 7) = ?
        ORDER BY e.date_incurred DESC, e.id DESC
        """,
        (month,),
    )
    expenses = [dict(r) for r in cursor.fetchall()]
    conn.close()

    output = io.StringIO()
    output.write("\ufeff")  # UTF-8 BOM for Excel compatibility
    writer = csv.writer(output)

    writer.writerow([f"FamBam Household Report — {month}"])
    writer.writerow(["Generated On", datetime.now().strftime("%Y-%m-%d %H:%M")])
    writer.writerow([])

    total_spent = sum(float(e["amount"]) for e in expenses)
    writer.writerow(["SUMMARY METRICS"])
    writer.writerow(["Month", month])
    writer.writerow(["Total Expenses (PHP)", f"{total_spent:.2f}"])
    writer.writerow(["Total Transactions", len(expenses)])
    writer.writerow([])

    writer.writerow(["ITEMIZED EXPENSE LOG"])
    writer.writerow(["Date", "Title / Item", "Category", "Quantity", "Paid By", "Amount (PHP)", "Notes"])
    for e in expenses:
        writer.writerow([
            e["date_incurred"],
            e["title"],
            e["category"],
            e.get("quantity", 1),
            e["paid_by_name"] or "Admin",
            f"{float(e['amount']):.2f}",
            e["notes"] or "",
        ])

    csv_content = output.getvalue()
    output.close()

    filename = f"FamBam_Report_{month}.csv"
    return Response(
        csv_content,
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() in ("true", "1")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
else:
    init_db()
