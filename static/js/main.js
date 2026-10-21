/* ==========================================================================
   FamBam — Smart Household Expense, Inventory & Bill Management
   Frontend Application Logic (Vanilla ES6+ JavaScript)
   ========================================================================== */

const AppState = {
  selectedMonth: "2026-10",
  data: null,
  activeTab: "dashboard",
  selectedDashPriceItem: "",
  selectedFullPriceItem: "",
  charts: {
    donut: null,
    dashPrice: null,
    fullPrice: null,
    reportsMom: null,
  },
};

if (typeof Chart !== "undefined") {
  Chart.defaults.font.family = "'Open Sans', sans-serif";
}

const CATEGORY_COLORS = {
  "Housing & Shelter": "#02007d",
  "Utilities & Connectivity": "#1e64cc",
  "Food & Household Groceries": "#2e7d32",
  "Home Maintenance & Upkeep": "#e65100",
  "Healthcare & Personal Care": "#c2185b",
  "Transportation & Personal Lifestyle": "#6a1b9a",
  "Miscellaneous": "#546e7a",
};

const STORE_COLORS = {
  Palengke: "#02007d",
  Puregold: "#e09f3e",
  Savemore: "#48bb78",
  "Mercury Drug": "#e06d75",
};

const HOUSEHOLD_CATEGORY_CATALOG = {
  "Housing & Shelter": [
    "Rent / Bahay",
    "Mortgage",
    "Apartment",
    "HOA Dues",
  ],
  "Utilities & Connectivity": [
    "Meralco / Electricity",
    "Maynilad / Water",
    "LPG Gasul / Solane",
    "PLDT / Converge Wifi",
    "Globe / Smart Load",
  ],
  "Food & Household Groceries": [
    "Bigas",
    "Fish (Tilapia, Bangus)",
    "Chicken (Manok)",
    "Pork / Beef",
    "Gulay at Prutas",
    "Condiments (Toyo, Suka, Mantika)",
    "Can foods (Sardinas, Tuna)",
    "Itlog at Tinapay",
    "Kape at Gatas",
  ],
  "Home Maintenance & Upkeep": [
    "Dishwashing liquid (Joy)",
    "Bar sabon / Laundry Powder",
    "Downy Fabcon",
    "Zonrox Bleach",
    "Sponge / Walis / Mop",
    "Home Repairs / Hardware",
  ],
  "Healthcare & Personal Care": [
    "Shampoo (Palmolive, Clear)",
    "Safeguard / Bath Soap",
    "Toothpaste (Colgate)",
    "Deodorant (Milcu, Rexona)",
    "Sanitary pad (Modess)",
    "Gamot / Vitamins / First Aid",
  ],
  "Transportation & Personal Lifestyle": [
    "Pamasahe (Jeep, Tricycle, Bus)",
    "Gasolina / Diesel",
    "Toll / RFID (Easytrip, Autosweep)",
    "Grab / Taxi / Angkas",
    "Motor / Car Wash & Maintenance",
  ],
  "Miscellaneous": [
    "Other Household Expenses",
  ],
};

const ITEM_KEYWORD_TO_CATEGORY = {
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
};

function detectCategoryForItem(itemName) {
  const norm = (itemName || "").toLowerCase().trim();
  if (!norm) return "Miscellaneous";
  for (const [cat, keywords] of Object.entries(ITEM_KEYWORD_TO_CATEGORY)) {
    if (keywords.some((kw) => norm.includes(kw))) {
      return cat;
    }
  }
  return "Miscellaneous";
}

const CUSTOM_ITEM_CATEGORY_STORAGE_KEY = "fambam_custom_item_categories";

function getCustomItemCategories() {
  try {
    const raw = localStorage.getItem(CUSTOM_ITEM_CATEGORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function saveCustomItemCategory(itemName, category) {
  const name = (itemName || "").trim().toLowerCase();
  if (!name || !category) return;
  const custom = getCustomItemCategories();
  custom[name] = category;
  try {
    localStorage.setItem(CUSTOM_ITEM_CATEGORY_STORAGE_KEY, JSON.stringify(custom));
  } catch (err) {
    console.error("Failed to save custom item category", err);
  }
}

function getAllAvailableCategories() {
  return [
    "Housing & Shelter",
    "Utilities & Connectivity",
    "Food & Household Groceries",
    "Home Maintenance & Upkeep",
    "Healthcare & Personal Care",
    "Transportation & Personal Lifestyle",
    "Miscellaneous",
  ];
}


function detectCategoryFromItem(itemName, fallbackCategory = "") {
  const val = (itemName || "").trim().toLowerCase();
  if (!val) return "";

  // 1. Check custom user-saved overrides
  const customCats = getCustomItemCategories();
  if (customCats[val]) {
    return customCats[val];
  }

  // 2. Check previous expenses logged in AppState
  if (AppState && AppState.data && Array.isArray(AppState.data.expenses)) {
    const prev = AppState.data.expenses.find(
      (e) => (e.title || "").trim().toLowerCase() === val && e.category
    );
    if (prev && prev.category) {
      return prev.category;
    }
  }

  // 3. Exact catalog match
  for (const [cat, items] of Object.entries(HOUSEHOLD_CATEGORY_CATALOG)) {
    if (items.some((i) => i.toLowerCase() === val)) {
      return cat;
    }
  }

  // 4. Keyword match
  for (const [cat, keywords] of Object.entries(ITEM_KEYWORD_TO_CATEGORY)) {
    if (keywords.some((kw) => val.includes(kw))) {
      return cat;
    }
  }

  return fallbackCategory;
}

// ==========================================
// UTILITY HELPERS
// ==========================================
function formatPHP(amount) {
  const num = Number(amount || 0);
  return "₱" + num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMoney(amount) {
  const num = Number(amount || 0);
  return num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function animateCountUp(element, endVal, prefix = "", suffix = "", duration = 750) {
  if (!element) return;
  const target = Number(endVal) || 0;
  const start = element._countUpVal !== undefined ? element._countUpVal : 0;
  element._countUpVal = target;
  const startTime = performance.now();

  function updateCount(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Smooth easeOutExpo
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const current = start + (target - start) * easeProgress;
    element.textContent = `${prefix}${formatMoney(current)}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      element.textContent = `${prefix}${formatMoney(target)}${suffix}`;
    }
  }
  requestAnimationFrame(updateCount);
}

function formatMonthHuman(ym) {
  if (!ym || !ym.includes("-")) return ym;
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getOrdinalDay(day) {
  const d = Number(day);
  if (d > 3 && d < 21) return `${d}th`;
  switch (d % 10) {
    case 1: return `${d}st`;
    case 2: return `${d}nd`;
    case 3: return `${d}rd`;
    default: return `${d}th`;
  }
}

function getInitials(name) {
  if (!name) return "FB";
  const cleaned = name.replace(/\(.*?\)/g, "").trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}


function computeStockStatus(stockVal) {
  const n = parseInt(stockVal, 10);
  if (isNaN(n) || n <= 0) return "Out of Stock";
  if (n <= 3) return "Low";
  return "High";
}

function syncInventoryStockStatus() {
  const unitInp = document.getElementById("invUnitInput");
  const statusInp = document.getElementById("invStatusInput");
  if (!unitInp || !statusInp) return;
  let numVal = parseInt(unitInp.value, 10);
  if (isNaN(numVal) || numVal < 0) numVal = 0;
  statusInp.value = computeStockStatus(numVal);
}

function getStatusBadgeClass(status) {
  if (status === "High" || status === "In Stock") return "badge-sage";
  if (status === "Low" || status === "Paubos Na") return "badge-amber";
  return "badge-terracotta";
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast-msg";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3400);
}

let pendingUndoAction = null;

function showUndoDeleteToast({ name, onUndo, onConfirm, duration = 5000 }) {
  if (pendingUndoAction) {
    if (pendingUndoAction.interval) clearInterval(pendingUndoAction.interval);
    if (pendingUndoAction.timer) clearTimeout(pendingUndoAction.timer);
    pendingUndoAction.onConfirm?.();
    pendingUndoAction.element?.remove();
    pendingUndoAction = null;
  }

  const container = document.getElementById("toastContainer");
  if (!container) {
    onConfirm?.();
    return;
  }

  let remainingSec = 5;

  const toast = document.createElement("div");
  toast.className = "undo-toast-snackbar";
  toast.innerHTML = `
    <span class="undo-toast-text">Removed &ldquo;${escapeHtml(name)}&rdquo;</span>
    <button type="button" class="undo-toast-btn" aria-label="Undo deletion">
      <span class="undo-toast-label">Undo</span>
      <span class="undo-toast-timer-number" id="undoToastTimer">${remainingSec}</span>
    </button>
    <button type="button" class="undo-toast-close" aria-label="Dismiss">&times;</button>
  `;

  container.appendChild(toast);

  let hasDismissed = false;

  const dismiss = (cancelled = false) => {
    if (hasDismissed) return;
    hasDismissed = true;
    if (pendingUndoAction) {
      if (pendingUndoAction.timer) clearTimeout(pendingUndoAction.timer);
      if (pendingUndoAction.interval) clearInterval(pendingUndoAction.interval);
    }
    pendingUndoAction = null;
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px) scale(0.95)";
    toast.style.transition = "all 0.2s ease";
    setTimeout(() => toast.remove(), 220);

    if (cancelled) {
      onUndo?.();
    } else {
      onConfirm?.();
    }
  };

  const timerEl = toast.querySelector("#undoToastTimer");
  const interval = setInterval(() => {
    remainingSec -= 1;
    if (remainingSec > 0) {
      if (timerEl) timerEl.textContent = `${remainingSec}`;
    } else {
      clearInterval(interval);
    }
  }, 1000);

  const timer = setTimeout(() => {
    dismiss(false);
  }, 5000);

  pendingUndoAction = {
    timer,
    interval,
    element: toast,
    onConfirm,
  };

  toast.querySelector(".undo-toast-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dismiss(true);
  });

  toast.querySelector(".undo-toast-close")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dismiss(false);
  });
}

window.addEventListener("beforeunload", () => {
  if (pendingUndoAction) {
    if (pendingUndoAction.interval) clearInterval(pendingUndoAction.interval);
    if (pendingUndoAction.timer) clearTimeout(pendingUndoAction.timer);
    pendingUndoAction.onConfirm?.();
  }
});

// ==========================================
// DIALOG HELPERS & LIGHT-DISMISS FALLBACK
// ==========================================
function initDialogBehaviors() {
  const dialogs = document.querySelectorAll("dialog");
  dialogs.forEach((dialog) => {
    // Fallback for browsers without declarative closedby="any" support
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    }
  });

  document.querySelectorAll("[data-close-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-close-dialog");
      const dlg = document.getElementById(targetId);
      if (dlg && dlg.open) dlg.close();
    });
  });
}

function openModal(dialogId) {
  const dlg = document.getElementById(dialogId);
  if (dlg && !dlg.open) {
    dlg.showModal();
  }
}

function closeModal(dialogId) {
  const dlg = document.getElementById(dialogId);
  if (dlg && dlg.open) {
    dlg.close();
  }
}

function openConfirmModal({ title, message, confirmText = "Delete", danger = true, onConfirm }) {
  const modal = document.getElementById("confirmModal");
  if (!modal) return;
  const titleEl = document.getElementById("confirmModalTitle");
  const bodyEl = document.getElementById("confirmModalBody");
  const actionBtn = document.getElementById("confirmModalActionBtn");

  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.textContent = message;
  if (actionBtn) {
    actionBtn.textContent = confirmText;
    actionBtn.className = danger ? "btn-primary btn-terracotta" : "btn-primary";
    actionBtn.onclick = async () => {
      closeModal("confirmModal");
      if (onConfirm) await onConfirm();
    };
  }
  openModal("confirmModal");
}

window.openAddExpenseModal = function () { openQuickAddModal("expense"); };
window.openAddBillModal = function () { openQuickAddModal("bill"); };
window.openAddInventoryModal = function () { openQuickAddModal("inventory"); };

// ==========================================
// API DATA FETCH & BOOTSTRAP
// ==========================================
async function loadBootstrapData(month = AppState.selectedMonth) {
  try {
    const res = await fetch(`/api/bootstrap?month=${encodeURIComponent(month)}`);
    if (!res.ok) throw new Error("Failed to fetch bootstrap data");
    const data = await res.json();
    AppState.data = data;
    AppState.selectedMonth = data.selected_month;
    renderAll();
  } catch (err) {
    console.error(err);
    showToast("Error loading data from server.");
  }
}

function renderAll() {
  if (!AppState.data) return;
  syncThemeUI(AppState.data.settings.theme_preference);
  renderHeaderAndNavBadges();
  populateMemberSelects();
  renderDashboardKpis();
  renderDashboardBreakdown();
  renderDashboardBills();
  renderDashboardInventory();
  renderDashboardTransactions();

  // Render full tab views
  renderFullExpensesTab();
  renderActivityTab();
  renderFullShoppingTab();
  renderFullInventoryTab();
  renderFullBillsTab();
  renderFullReportsTab();
  updateQuickAddKpiCards();
  populateBillCompanySelect();
  syncBillActionButtons();
}

// ==========================================
// THEME & HEADER UI
// ==========================================
function syncThemeUI(theme) {
  const saved = theme || localStorage.getItem("fambam_theme") || "dark";
  const currentTheme = saved === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  try {
    localStorage.setItem("fambam_theme", currentTheme);
  } catch (e) {}

  const icon = document.getElementById("themeToggleIcon");
  if (icon) {
    icon.textContent = currentTheme === "dark" ? "light_mode" : "dark_mode";
  }
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    const label = currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
    btn.setAttribute("title", label);
    btn.setAttribute("aria-label", label);
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", currentTheme === "dark" ? "#12151b" : "#f2f4fa");
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = current === "dark" ? "light" : "dark";
  syncThemeUI(newTheme);
  if (window.AppState && AppState.data && AppState.data.settings) {
    AppState.data.settings.theme_preference = newTheme;
  }
}

function updateHeaderClock() {
  const timeEl = document.getElementById("headerClockTime");
  const dateEl = document.getElementById("headerClockDate");
  if (!timeEl && !dateEl) return;
  const now = new Date();
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (dateEl) {
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yyyy = now.getFullYear();
    dateEl.textContent = `${mm}/${dd}/${yyyy}`;
  }
}
setInterval(updateHeaderClock, 1000);

function renderNotificationsModal() {
  if (!AppState.data) return;
  const bills = AppState.data.recurring_bills || [];
  const unpaidBills = bills.filter((b) => (b.last_paid_month || "") !== AppState.selectedMonth);

  const invItems = AppState.data.inventory_items || [];
  const lowStockItems = invItems.filter(
    (i) => (i.status || "").toLowerCase() === "low" || (i.status || "").toLowerCase() === "out of stock"
  );

  // 1. Due Bills List
  const billsBadge = document.getElementById("notifBillsCountBadge");
  if (billsBadge) {
    billsBadge.textContent = unpaidBills.length;
    billsBadge.className = `status-badge ${unpaidBills.length > 0 ? "badge-amber" : "badge-sage"}`;
  }
  const billsListEl = document.getElementById("notifBillsList");
  if (billsListEl) {
    if (unpaidBills.length === 0) {
      billsListEl.innerHTML = `
        <div class="notif-empty-state">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          <span>All recurring bills paid for this month.</span>
        </div>
      `;
    } else {
      billsListEl.innerHTML = unpaidBills
        .map(
          (b) => `
          <div class="notif-item-row">
            <div class="notif-item-info">
              <span class="notif-item-title">${escapeHtml(b.bill_name)}</span>
              <span class="notif-item-sub">Due day ${b.due_day || 1} • ₱${formatMoney(b.default_amount)}</span>
            </div>
            <button type="button" class="btn-xs btn-sage" onclick="payBillFromNotif(${b.id})">Pay</button>
          </div>
        `
        )
        .join("");
    }
  }

  // 2. Low Stock Items List
  const stockBadge = document.getElementById("notifStockCountBadge");
  if (stockBadge) {
    stockBadge.textContent = lowStockItems.length;
    stockBadge.className = `status-badge ${lowStockItems.length > 0 ? "badge-terracotta" : "badge-sage"}`;
  }
  const stockListEl = document.getElementById("notifStockList");
  if (stockListEl) {
    if (lowStockItems.length === 0) {
      stockListEl.innerHTML = `
        <div class="notif-empty-state">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          <span>All shopping items are stocked.</span>
        </div>
      `;
    } else {
      stockListEl.innerHTML = lowStockItems
        .map(
          (i) => `
          <div class="notif-item-row">
            <div class="notif-item-info">
              <span class="notif-item-title">${escapeHtml(i.item_name)}</span>
              <span class="notif-item-sub">Stock: ${escapeHtml(i.unit)} (${escapeHtml(i.status || "Low")})</span>
            </div>
            <button type="button" class="btn-xs btn-sage" onclick="restockFromNotif(${i.id})">Restock</button>
          </div>
        `
        )
        .join("");
    }
  }
}

window.payBillFromNotif = async function(billId) {
  closeModal("notificationsModal");
  await payRecurringBill(billId);
};

window.restockFromNotif = function(itemId) {
  closeModal("notificationsModal");
  openConvertShoppingModal(itemId);
};

function openNotificationsModal() {
  renderNotificationsModal();
  openModal("notificationsModal");
}

function renderHeaderAndNavBadges() {
  const { selected_month, available_months, kpi, shopping_list } = AppState.data;

  // Month Filter Dropdown (Custom UI + hidden select fallback)
  const monthLabel = document.getElementById("selectedMonthLabel");
  if (monthLabel) {
    monthLabel.textContent = formatMonthHuman(selected_month);
  }

  const monthList = document.getElementById("monthDropdownList");
  if (monthList) {
    const filteredMonths = (available_months || []).filter((m) => m !== "2026-09");
    monthList.innerHTML = filteredMonths
      .map(
        (m) => `
        <button type="button" class="month-dropdown-item ${m === selected_month ? "active" : ""}" onclick="selectCustomMonth('${escapeHtml(m)}')">
          <span>${formatMonthHuman(m)}</span>
          ${
            m === selected_month
              ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
              : ""
          }
        </button>
      `
      )
      .join("");
  }

  const monthSelect = document.getElementById("monthFilterSelect");
  if (monthSelect) {
    monthSelect.innerHTML = (available_months || []).filter((m) => m !== "2026-09")
      .map(
        (m) =>
          `<option value="${escapeHtml(m)}" ${m === selected_month ? "selected" : ""}>${formatMonthHuman(m)}</option>`
      )
      .join("");
  }

  // Live Digital Clock & Date Update (No seconds)
  updateHeaderClock();

  // Notification Bell (Bills, Low Stock Items, Web App Version)
  const unpaidCount = Number(kpi.unpaid_bills_count) || 0;
  const invItems = AppState.data.inventory_items || [];
  const lowStockCount = invItems.filter(
    (i) => (i.status || "").toLowerCase() === "low" || (i.status || "").toLowerCase() === "out of stock"
  ).length;
  const totalNotifs = unpaidCount + lowStockCount;
  const notifBadge = document.getElementById("notifBadgeCount");
  if (notifBadge) {
    notifBadge.textContent = totalNotifs;
    notifBadge.classList.toggle("hidden", totalNotifs === 0);
  }

  const navBillsBadge = document.getElementById("navBillsBadge");
  if (navBillsBadge) {
    if (unpaidCount > 0) {
      navBillsBadge.textContent = unpaidCount;
      navBillsBadge.classList.remove("hidden");
    } else {
      navBillsBadge.textContent = "";
      navBillsBadge.classList.add("hidden");
    }
  }

  const shoppingCount = (shopping_list || []).length;
  const navShoppingBadge = document.getElementById("navShoppingBadge");
  if (navShoppingBadge) {
    if (shoppingCount > 0) {
      navShoppingBadge.textContent = shoppingCount;
      navShoppingBadge.classList.remove("hidden");
    } else {
      navShoppingBadge.textContent = "";
      navShoppingBadge.classList.add("hidden");
    }
  }
}


function populateMemberSelects() {
  const members = AppState.data.members || [];
  const optionsHtml =
    members.length > 0
      ? members.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("")
      : `<option value="">Admin</option>`;

  const expPaidBy = document.getElementById("expPaidBy");
  if (expPaidBy) expPaidBy.innerHTML = optionsHtml;

  const convertPaidBy = document.getElementById("convertPaidBySelect");
  if (convertPaidBy) convertPaidBy.innerHTML = optionsHtml;

  const filterSelect = document.getElementById("expenseMemberFilter");
  if (filterSelect) {
    const currentVal = filterSelect.value || "ALL";
    filterSelect.innerHTML =
      `<option value="ALL">All Payers</option>` +
      members.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
    filterSelect.value = currentVal;
  }

  // Update Sidebar Profile Card from Settings profile
  const sidebarCard = document.getElementById("sidebarProfileCard");
  if (sidebarCard) {
    const settings = AppState.data.settings || {};
    const avatarEl = sidebarCard.querySelector(".admin-avatar");
    const nameEl = sidebarCard.querySelector(".admin-name");
    const displayName = settings.admin_name || "Admin";

    if (nameEl) nameEl.textContent = displayName;

    if (avatarEl) {
      if (settings.admin_photo) {
        avatarEl.innerHTML = `<img src="${escapeHtml(settings.admin_photo)}" alt="${escapeHtml(displayName)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'material-symbols-rounded\\' style=\\'font-size:22px;color:#fff;\\'>person</span>';" />`;
      } else {
        avatarEl.innerHTML = `<span class="material-symbols-rounded" style="font-size:22px;color:#fff;">person</span>`;
      }
    }
  }

  // Inventory items datalist for price logging
  const invDatalist = document.getElementById("inventoryItemsDatalist");
  if (invDatalist) {
    invDatalist.innerHTML = (AppState.data.inventory_items || [])
      .map((i) => `<option value="${escapeHtml(i.item_name)}"></option>`)
      .join("");
  }
}

// ==========================================
// DASHBOARD ROW 1: 6 EXPANDING KPI CARDS
// ==========================================
function renderDashboardKpis() {
  const { kpi, selected_month, members } = AppState.data;

  // 1. Total Expenses
  const monthLabel = document.getElementById("kpiMonthLabel");
  if (monthLabel) monthLabel.textContent = formatMonthHuman(selected_month);
  const totalExpEl = document.getElementById("kpiTotalExpenses");
  if (totalExpEl) animateCountUp(totalExpEl, kpi.total_expenses);

  // Predictive Budget Progress Bar Calculation
  const budgetTarget = Number(AppState.data?.settings?.monthly_budget) || 15000;
  const spentSoFar = Number(kpi.total_expenses || 0);
  const budgetPct = Math.min(Math.round((spentSoFar / budgetTarget) * 100), 100);
  const progressBar = document.getElementById("kpiBudgetProgressBar");
  const budgetPctEl = document.getElementById("kpiBudgetPercentText");
  const budgetPaceEl = document.getElementById("kpiBudgetPaceText");

  if (progressBar) {
    progressBar.style.width = `${budgetPct}%`;
    progressBar.classList.toggle("warning", budgetPct >= 75 && budgetPct < 90);
    progressBar.classList.toggle("danger", budgetPct >= 90);
  }
  if (budgetPctEl) budgetPctEl.textContent = `${budgetPct}% of ₱${formatMoney(budgetTarget)}`;
  if (budgetPaceEl) {
    if (budgetPct >= 100) {
      budgetPaceEl.textContent = "Budget exceeded";
      budgetPaceEl.style.color = "#e06d75";
    } else if (budgetPct >= 80) {
      budgetPaceEl.textContent = "Approaching budget";
      budgetPaceEl.style.color = "#e09f3e";
    } else {
      budgetPaceEl.textContent = "On track";
      budgetPaceEl.style.color = "#48bb78";
    }
  }

  // 2. Daily Average Spending
  const dailyAvgEl = document.getElementById("kpiDailyAvgValue");
  if (dailyAvgEl) animateCountUp(dailyAvgEl, kpi.daily_avg_spending || 0, "₱");
  const dailyAvgSub = document.getElementById("kpiDailyAvgSub");
  if (dailyAvgSub) {
    dailyAvgSub.textContent = `${kpi.days_elapsed || 1} day(s) elapsed in ${formatMonthHuman(selected_month)}`;
  }

  // 3. Top Spending Category
  const topCatEl = document.getElementById("kpiTopCategoryValue");
  if (topCatEl) topCatEl.textContent = escapeHtml(kpi.top_category_name || "None");
  const topCatSub = document.getElementById("kpiTopCategorySub");
  if (topCatSub) {
    topCatSub.textContent = (kpi.top_category_amount || 0) > 0
      ? `${formatPHP(kpi.top_category_amount)} (${kpi.top_category_pct}%)`
      : "No expenses recorded";
  }

  // 4. Projected Month-End Balance
  const projBalEl = document.getElementById("kpiProjectedValue");
  if (projBalEl) animateCountUp(projBalEl, kpi.projected_month_end_balance || 0, "₱");
  const projSub = document.getElementById("kpiProjectedSub");
  if (projSub) {
    projSub.textContent = `Est. spend: ${formatPHP(kpi.projected_month_end_spend || 0)}`;
  }

  // 5. Upcoming Due Bills
  const unpaidBadge = document.getElementById("kpiUnpaidBillsBadge");
  if (unpaidBadge) {
    if (kpi.unpaid_bills_count > 0) {
      unpaidBadge.textContent = `${kpi.unpaid_bills_count} Unpaid`;
      unpaidBadge.className = "status-badge badge-amber";
      unpaidBadge.classList.remove("hidden");
    } else {
      unpaidBadge.textContent = "";
      unpaidBadge.classList.add("hidden");
    }
  }
  const unpaidBillsEl = document.getElementById("kpiUnpaidBillsTotal");
  if (unpaidBillsEl) unpaidBillsEl.textContent = formatPHP(kpi.unpaid_bills_total);
  const paidBillsSub = document.getElementById("kpiPaidBillsSubtext");
  if (paidBillsSub) {
    paidBillsSub.textContent = `${kpi.paid_bills_count} bill(s) paid in ${formatMonthHuman(selected_month)}`;
  }

  // 6. Pantry Stock
  const invItems = AppState.data.inventory_items || [];
  const lowStockCount = invItems.filter(
    (i) => (i.status || "").toLowerCase() === "low" || (i.status || "").toLowerCase() === "out of stock"
  ).length;
  const pantryTotalEl = document.getElementById("kpiPantryTotal");
  if (pantryTotalEl) pantryTotalEl.textContent = `${invItems.length} Items`;
  const lowBadge = document.getElementById("kpiLowStockBadge");
  if (lowBadge) {
    if (lowStockCount > 0) {
      lowBadge.textContent = `${lowStockCount} Low`;
      lowBadge.className = "status-badge badge-terracotta";
      lowBadge.classList.remove("hidden");
    } else {
      lowBadge.textContent = "";
      lowBadge.classList.add("hidden");
    }
  }
}

function showKpiDetailModal(type) {
  const { kpi, selected_month, previous_month, recurring_bills } = AppState.data;
  const titleEl = document.getElementById("kpiDetailTitle");
  const subEl = document.getElementById("kpiDetailSubtitle");
  const bodyEl = document.getElementById("kpiDetailBody");

  if (type === "expenses") {
    titleEl.textContent = `Granular Expense Breakdown (${formatMonthHuman(selected_month)})`;
    subEl.textContent = ""; subEl.classList.add("hidden");
    const cats = kpi.category_breakdown || {};
    const totalSpent = Number(kpi.total_expenses || 0);
    bodyEl.innerHTML = `
      <div class="report-summary-grid">
        <div class="report-stat-box">
          <div class="kpi-label">Selected Month (${escapeHtml(selected_month)})</div>
          <div class="kpi-value">${formatPHP(kpi.total_expenses)}</div>
        </div>
        <div class="report-stat-box">
          <div class="kpi-label">Previous Month (${escapeHtml(previous_month)})</div>
          <div class="kpi-value">${formatPHP(kpi.prev_month_expenses)}</div>
        </div>
      </div>
      <table class="fambam-table">
        <thead>
          <tr>
            <th>Category</th>
            <th class="text-right">Spent</th>
            <th class="text-right">% Share</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(cats)
            .map(([cat, info]) => {
              const sharePct = totalSpent > 0 ? ((Number(info.spent || 0) / totalSpent) * 100).toFixed(1) : "0.0";
              return `
            <tr>
              <td><strong>${escapeHtml(cat)}</strong></td>
              <td class="text-right">${formatPHP(info.spent)}</td>
              <td class="text-right"><span class="status-badge badge-sage">${sharePct}%</span></td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `;
  } else if (type === "daily_avg") {
    titleEl.textContent = `Daily Average Spending (${formatMonthHuman(selected_month)})`;
    subEl.textContent = ""; subEl.classList.add("hidden");
    const daysElapsed = Math.max(1, kpi.days_elapsed || 1);
    const totalDays = kpi.total_days_in_month || 30;
    const cats = kpi.category_breakdown || {};
    bodyEl.innerHTML = `
      <div class="report-summary-grid">
        <div class="report-stat-box">
          <div class="kpi-label">Daily Burn Rate</div>
          <div class="kpi-value">${formatPHP(kpi.daily_avg_spending || 0)}</div>
        </div>
        <div class="report-stat-box">
          <div class="kpi-label">Days Elapsed / Total</div>
          <div class="kpi-value">${daysElapsed} / ${totalDays}</div>
        </div>
      </div>
      <table class="fambam-table" style="margin-top:1rem;">
        <thead>
          <tr>
            <th>Category</th>
            <th class="text-right">Total Spent</th>
            <th class="text-right">Daily Avg</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(cats).map(([cat, info]) => {
            const catDaily = (Number(info.spent || 0) / daysElapsed).toFixed(2);
            return `
              <tr>
                <td><strong>${escapeHtml(cat)}</strong></td>
                <td class="text-right">${formatPHP(info.spent)}</td>
                <td class="text-right">${formatPHP(catDaily)}/day</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  } else if (type === "top_category") {
    titleEl.textContent = `Top Spending Category (${formatMonthHuman(selected_month)})`;
    const topCat = kpi.top_category_name || "None";
    subEl.textContent = (kpi.top_category_amount || 0) > 0
      ? `${escapeHtml(topCat)} accounts for ${kpi.top_category_pct}% of total spending`
      : `No expenses recorded yet`;
    const expenses = (AppState.data.expenses || []).filter(e => e.category === topCat);
    bodyEl.innerHTML = `
      <div class="report-summary-grid">
        <div class="report-stat-box">
          <div class="kpi-label">Top Category</div>
          <div class="kpi-value" style="font-size:1.15rem;">${escapeHtml(topCat)}</div>
        </div>
        <div class="report-stat-box">
          <div class="kpi-label">Total Category Spend</div>
          <div class="kpi-value">${formatPHP(kpi.top_category_amount || 0)}</div>
        </div>
      </div>
      <div style="margin-top:1rem;">
        <h4 style="font-size:0.85rem;margin-bottom:0.6rem;color:var(--text-secondary);">Transactions in ${escapeHtml(topCat)}</h4>
        ${expenses.length === 0 ? `<p class="kpi-subtext">No transactions found.</p>` : `
          <table class="fambam-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item / Title</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map(e => `
                <tr>
                  <td>${escapeHtml(e.date_incurred)}</td>
                  <td>${escapeHtml(e.title)}</td>
                  <td class="text-right">${formatPHP(e.amount)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}
      </div>
    `;
  } else if (type === "projected") {
    titleEl.textContent = `Projected Month-End Forecast (${formatMonthHuman(selected_month)})`;
    subEl.textContent = ""; subEl.classList.add("hidden");
    const isDeficit = (kpi.projected_month_end_balance || 0) < 0;
    bodyEl.innerHTML = `
      <div class="report-summary-grid">
        <div class="report-stat-box">
          <div class="kpi-label">Projected Month-End Spend</div>
          <div class="kpi-value">${formatPHP(kpi.projected_month_end_spend || 0)}</div>
        </div>
        <div class="report-stat-box">
          <div class="kpi-label">Projected Balance (Net)</div>
          <div class="kpi-value" style="color: ${isDeficit ? 'var(--accent-terracotta)' : 'var(--accent-sage-text)'};">
            ${formatPHP(kpi.projected_month_end_balance || 0)}
          </div>
        </div>
      </div>
      <div style="margin-top:1.1rem;display:flex;flex-direction:column;gap:0.5rem;font-size:0.82rem;color:var(--text-secondary);">
        <div style="display:flex;justify-content:space-between;">
          <span>Monthly Budget Limit:</span>
          <strong>${formatPHP(kpi.budget_limit || 0)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>Current Spent:</span>
          <strong>${formatPHP(kpi.total_expenses || 0)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>Unpaid Recurring Bills:</span>
          <strong>${formatPHP(kpi.unpaid_bills_total || 0)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>Projected Variable Spend:</span>
          <strong>${formatPHP((kpi.daily_avg_spending || 0) * (kpi.total_days_in_month || 30))}</strong>
        </div>
      </div>
    `;
  } else if (type === "bills") {
    titleEl.textContent = `Recurring Bills Status (${formatMonthHuman(selected_month)})`;
    subEl.textContent = `${kpi.unpaid_bills_count} unpaid (${formatPHP(kpi.unpaid_bills_total)}) • ${kpi.paid_bills_count} paid`;
    bodyEl.innerHTML = (recurring_bills || [])
      .map(
        (b) => `
      <div class="bill-row-item">
        <div class="bill-row-info">
          <span class="bill-row-title">${escapeHtml(b.bill_name)}</span>
          <span class="bill-row-meta">Due every ${getOrdinalDay(b.due_day)} • ${escapeHtml(b.category)}</span>
        </div>
        <div class="bill-row-actions">
          <span class="bill-amount-tag">${formatPHP(b.default_amount)}</span>
          ${
            b.is_paid_current_month
              ? `<span class="status-badge badge-sage">Paid</span>`
              : `<button type="button" class="btn-xs btn-sage" onclick="payRecurringBill(${b.id})">PAY</button>`
          }
        </div>
      </div>`
      )
      .join("");
  } else if (type === "pantry") {
    switchTab("shopping");
    return;
  }

  openModal("kpiDetailModal");
}

// ==========================================
// DASHBOARD ROW 2: DONUT CHART & BILLS CHECKLIST
// ==========================================
function renderDashboardBreakdown() {
  const { kpi } = AppState.data;
  const cats = kpi.category_breakdown || {};
  const labels = Object.keys(cats);
  const values = labels.map((l) => cats[l].spent);

  document.getElementById("donutCenterTotal").textContent =
    Math.round(kpi.total_expenses || 0).toLocaleString("en-PH");

  const ctx = document.getElementById("expenseDonutChart");
  if (ctx && window.Chart) {
    if (AppState.charts.donut) {
      AppState.charts.donut.data.labels = labels;
      AppState.charts.donut.data.datasets[0].data = values;
      AppState.charts.donut.update();
    } else {
      AppState.charts.donut = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: labels.map((l) => CATEGORY_COLORS[l] || "#64748b"),
              borderColor: "rgba(15, 23, 42, 0.75)",
              borderWidth: 2,
              hoverOffset: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.label}: ${formatPHP(context.raw)}`,
              },
            },
          },
        },
      });
    }
  }

  // Render Category Spending Bars
  const barsContainer = document.getElementById("dashboardCategoryBars");
  if (barsContainer) {
    const totalSpent = Number(kpi.total_expenses || 0);
    barsContainer.innerHTML = labels
      .map((cat) => {
        const info = cats[cat];
        const spent = Number(info.spent || 0);
        const sharePct = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;
        const widthPct = Math.min(100, Math.max(0, sharePct));
        return `
          <div class="cat-bar-item">
            <div class="cat-bar-header">
              <span class="cat-bar-name">
                <span class="cat-dot" style="background:${CATEGORY_COLORS[cat]}"></span>
                ${escapeHtml(cat)}
              </span>
              <span class="cat-bar-numbers">${formatPHP(spent)} (${sharePct}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill sage" style="width:${widthPct}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }
}

function renderDashboardBills() {
  const bills = AppState.data.recurring_bills || [];
  const container = document.getElementById("dashboardBillsList");
  if (!container) return;

  if (bills.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <p class="empty-state-title">No recurring bills</p>
        <p class="empty-state-sub">Add monthly commitments like electricity, water, or rent to track due dates.</p>
        <button type="button" class="btn-primary btn-sm" onclick="openAddBillModal()">Add bill</button>
      </div>
    `;
    return;
  }

  container.innerHTML = bills
    .map((b) => {
      const isPaid = b.is_paid_current_month;
      return `
        <div class="bill-row-item">
          <div class="bill-row-info">
            <span class="bill-row-title">${escapeHtml(b.bill_name)}</span>
            <span class="bill-row-meta">Due every ${getOrdinalDay(b.due_day)} • ${escapeHtml(b.category)}</span>
          </div>
          <div class="bill-row-actions">
            <span class="bill-amount-tag">${formatPHP(b.default_amount)}</span>
            <span class="status-badge ${isPaid ? "badge-sage" : "badge-amber"}">
              ${isPaid ? "Paid" : "Unpaid"}
            </span>
            ${
              !isPaid
                ? `<button type="button" class="btn-xs btn-sage" onclick="payRecurringBill(${b.id})">Pay bill</button>`
                : `<button type="button" class="btn-action-icon btn-action-edit" onclick="editBillModal(${b.id})" title="Edit" aria-label="Edit"><span class="material-symbols-rounded" style="font-size:16px;">edit</span></button>`
            }
          </div>
        </div>
      `;
    })
    .join("");
}

// ==========================================
// DASHBOARD ROW 3: INVENTORY, PRICE COMPARISON & TRANSACTIONS
// ==========================================
function renderDashboardInventory() {
  const items = AppState.data.inventory_items || [];
  const container = document.getElementById("dashboardInventoryList");
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <p class="empty-state-title">No shopping items</p>
        <p class="empty-state-sub">Track stock levels and grocery prices for your household essentials.</p>
        <button type="button" class="btn-primary btn-sm" onclick="openAddInventoryModal()">Add item</button>
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const displayStatus = item.status || "Low";
      const statusKey = displayStatus.toLowerCase().replace(/\s+/g, "-");
      return `
        <div class="inv-quick-item">
          <div class="inv-item-left">
            <span class="inv-item-title">${escapeHtml(item.item_name)} <span class="stock-unit-pill">${escapeHtml(item.unit)}</span> <small class="kpi-sub-inline">&bull; ${escapeHtml(item.category || "Essential")}</small></span>
          </div>
          <div class="inv-item-right">
            <span class="status-badge-box ${statusKey}">${escapeHtml(displayStatus)}</span>
            <button
              type="button"
              class="btn-put-expense"
              onclick="openConvertShoppingModal(${item.id})"
              title="Put to expense &amp; restock"
            >
              Put to expense
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderDashboardPriceComparison() {
  const comparisons = AppState.data.price_comparison || [];
  const selectEl = document.getElementById("dashPriceItemSelect");
  const badgesEl = document.getElementById("dashPriceStoreBadges");
  if (!selectEl) return;

  if (comparisons.length === 0) {
    selectEl.innerHTML = `<option value="">No items</option>`;
    if (badgesEl) badgesEl.innerHTML = `<p class="kpi-subtext" style="grid-column:span 3;">No store price history recorded yet.</p>`;
    if (AppState.charts.dashPrice) {
      AppState.charts.dashPrice.destroy();
      AppState.charts.dashPrice = null;
    }
    return;
  }

  const itemNames = comparisons.map((c) => c.item_name);
  if (!itemNames.includes(AppState.selectedDashPriceItem)) {
    AppState.selectedDashPriceItem = itemNames[0];
  }

  selectEl.innerHTML = itemNames
    .map(
      (name) =>
        `<option value="${escapeHtml(name)}" ${name === AppState.selectedDashPriceItem ? "selected" : ""}>${escapeHtml(name)}</option>`
    )
    .join("");

  const currentComp =
    comparisons.find((c) => c.item_name === AppState.selectedDashPriceItem) || comparisons[0];

  // Render Store Comparison Pills
  if (badgesEl && currentComp) {
    const storesEntries = Object.entries(currentComp.stores || {});
    badgesEl.innerHTML = storesEntries
      .map(([storeName, sInfo]) => {
        const isCheapest = storeName === currentComp.cheapest_store;
        return `
          <div class="store-pill-card ${isCheapest ? "cheapest" : ""}">
            <div class="store-pill-name">
              <span>${escapeHtml(storeName)}</span>
              ${isCheapest ? `<span class="status-badge badge-sage" style="font-size:0.58rem;padding:0.08rem 0.38rem;">BEST</span>` : ""}
            </div>
            <div class="store-pill-price">${formatPHP(sInfo.price)}</div>
          </div>
        `;
      })
      .join("");
  }

  // Render Smooth Area/Line Price History Chart
  renderPriceLineChart("dashPriceHistoryChart", "dashPrice", currentComp);
}

function renderPriceLineChart(canvasId, chartKey, compData) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart || !compData) return;

  const history = compData.history || [];
  const allDates = Array.from(new Set(history.map((h) => h.recorded_date))).sort();
  const stores = Array.from(new Set(history.map((h) => h.store_name)));

  const datasets = stores.map((storeName, idx) => {
    const color =
      STORE_COLORS[storeName] ||
      ["#02007d", "#1c25a0", "#3341b8", "#5364fc"][idx % 4];
    const dataPoints = allDates.map((d) => {
      const match = history.filter((h) => h.store_name === storeName && h.recorded_date <= d).pop();
      return match ? Number(match.price) : null;
    });

    return {
      label: storeName,
      data: dataPoints,
      borderColor: color,
      backgroundColor: color + "28",
      fill: true,
      tension: 0.38,
      pointRadius: 4,
      pointHoverRadius: 6,
      spanGaps: true,
    };
  });

  if (AppState.charts[chartKey]) {
    AppState.charts[chartKey].destroy();
  }

  AppState.charts[chartKey] = new Chart(ctx, {
    type: "line",
    data: {
      labels: allDates.map((d) => d.slice(5)),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#94a3b8", boxWidth: 10, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (c) => ` ${c.dataset.label}: ${formatPHP(c.raw)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#64748b", font: { size: 10 } },
          grid: { color: "rgba(148, 163, 184, 0.08)" },
        },
        y: {
          ticks: {
            color: "#64748b",
            font: { size: 10 },
            callback: (val) => "₱" + val,
          },
          grid: { color: "rgba(148, 163, 184, 0.08)" },
        },
      },
    },
  });
}

function renderDashboardTransactions() {
  const expenses = AppState.data?.expenses || [];
  const container = document.getElementById("dashboardTransactionList");
  if (!container) return;

  const emptyHtml = `
    <div class="empty-state-card">
      <svg class="empty-state-svg" viewBox="0 0 120 120" width="68" height="68" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" opacity="0.25"/>
        <path d="M42 46h36v32H42z" rx="4" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
        <path d="M50 56h20M50 64h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        <circle cx="60" cy="38" r="4" fill="currentColor" opacity="0.5"/>
      </svg>
      <p class="empty-state-title">No expenses this month</p>
      <p class="empty-state-sub">Log daily grocery trips, bills, and household purchases to monitor spending.</p>
      <button type="button" class="btn-primary btn-sm" onclick="openAddExpenseModal()">Add expense</button>
    </div>
  `;

  if (expenses.length === 0) {
    container.innerHTML = emptyHtml;
    return;
  }

  const list = expenses.slice(0, 8);

  container.innerHTML = list
    .map((exp) => {
      const hasReceipt = Boolean(exp.receipt_path);
      return `
        <div class="tx-log-item">
          <div class="tx-left">
            <div class="tx-chips-row">
              <span class="tx-chip-box tx-chip-name">${escapeHtml(exp.title)}</span>
              <span class="tx-chip-box tx-chip-qty">Qty: ${escapeHtml(exp.quantity || 1)}</span>
              <span class="tx-chip-box tx-chip-amount">${formatPHP(exp.amount)}</span>
              <span class="tx-chip-box tx-chip-date">${escapeHtml(exp.date_incurred)}</span>
              <span class="tx-chip-box tx-chip-cat">${escapeHtml(exp.category)}</span>
            </div>
          </div>
          <div class="tx-right">
            ${
              hasReceipt
                ? `<button type="button" class="btn-xs btn-ghost-sm" onclick="previewReceipt('${escapeHtml(exp.receipt_path)}', '${escapeHtml(exp.title)}')" title="View Attached Receipt">Receipt</button>`
                : ""
            }
            <button type="button" class="btn-action-icon btn-action-edit" onclick="openEditExpenseModal(${exp.id})" title="Edit Expense" aria-label="Edit Expense">
              <span class="material-symbols-rounded" style="font-size:16px;">edit</span>
            </button>
            <button type="button" class="btn-action-icon btn-action-delete" onclick="deleteExpense(${exp.id})" title="Delete Expense" aria-label="Delete Expense">
              <span class="material-symbols-rounded" style="font-size:16px;">delete</span>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderActivityTab() {
  const container = document.getElementById("activityTransactionList");
  if (!container) return;

  const expenses = AppState.data?.expenses || [];
  const catFilterEl = document.getElementById("activityCategoryFilter");

  if (catFilterEl) {
    const currentVal = catFilterEl.value || "ALL";
    const allCats = getAllAvailableCategories();
    catFilterEl.innerHTML =
      `<option value="ALL">All Categories</option>` +
      allCats.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("");
    catFilterEl.value = allCats.includes(currentVal) ? currentVal : "ALL";
  }

  const selectedCat = catFilterEl ? catFilterEl.value : "ALL";
  const searchVal = (document.getElementById("globalSearchInput")?.value || "").toLowerCase().trim();

  let filtered = expenses;
  if (selectedCat !== "ALL") {
    filtered = filtered.filter((exp) => (exp.category || "").toLowerCase() === selectedCat.toLowerCase());
  }
  if (searchVal) {
    filtered = filtered.filter((exp) => {
      const corpus = `${exp.title || ""} ${exp.category || ""} ${exp.store_name || ""} ${exp.paid_by_name || ""} ${exp.notes || ""}`.toLowerCase();
      return corpus.includes(searchVal);
    });
  }

  if (expenses.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <svg class="empty-state-svg" viewBox="0 0 120 120" width="68" height="68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="50" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" opacity="0.25"/>
          <path d="M42 46h36v32H42z" rx="4" stroke="currentColor" stroke-width="2.5" opacity="0.6"/>
          <path d="M50 56h20M50 64h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
          <circle cx="60" cy="38" r="4" fill="currentColor" opacity="0.5"/>
        </svg>
        <p class="empty-state-title">No expenses this month</p>
        <p class="empty-state-sub">Log daily grocery trips, bills, and household purchases to monitor spending.</p>
        <button type="button" class="btn-primary btn-sm" onclick="openAddExpenseModal()">Add expense</button>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <p class="empty-state-title">No matching activity</p>
        <p class="empty-state-sub">Try selecting another category or clearing your search filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((exp) => {
      const hasReceipt = Boolean(exp.receipt_path);
      return `
        <div class="tx-log-item">
          <div class="tx-left">
            <div class="tx-chips-row">
              <span class="tx-chip-box tx-chip-name">${escapeHtml(exp.title)}</span>
              <span class="tx-chip-box tx-chip-qty">Qty: ${escapeHtml(exp.quantity || 1)}</span>
              <span class="tx-chip-box tx-chip-amount">${formatPHP(exp.amount)}</span>
              <span class="tx-chip-box tx-chip-date">${escapeHtml(exp.date_incurred)}</span>
              <span class="tx-chip-box tx-chip-cat">${escapeHtml(exp.category)}</span>
            </div>
          </div>
          <div class="tx-right">
            ${
              hasReceipt
                ? `<button type="button" class="btn-xs btn-ghost-sm" onclick="previewReceipt('${escapeHtml(exp.receipt_path)}', '${escapeHtml(exp.title)}')" title="View Attached Receipt">Receipt</button>`
                : ""
            }
            <button type="button" class="btn-action-icon btn-action-edit" onclick="openEditExpenseModal(${exp.id})" title="Edit Expense" aria-label="Edit Expense">
              <span class="material-symbols-rounded" style="font-size:16px;">edit</span>
            </button>
            <button type="button" class="btn-action-icon btn-action-delete" onclick="deleteExpense(${exp.id})" title="Delete Expense" aria-label="Delete Expense">
              <span class="material-symbols-rounded" style="font-size:16px;">delete</span>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

// ==========================================
// FULL SIDEBAR TABS RENDERING
// ==========================================
function renderFullExpensesTab() {
  const { expenses, kpi } = AppState.data;

  const catFilterEl = document.getElementById("expenseCategoryFilter");
  if (catFilterEl) {
    const currentVal = catFilterEl.value || "ALL";
    const allCats = getAllAvailableCategories();
    const existingOptions = Array.from(catFilterEl.options).map((o) => o.value);
    const hasAll = allCats.every((c) => existingOptions.includes(c));
    if (!hasAll) {
      catFilterEl.innerHTML = `
        <option value="ALL">All Categories</option>
        ${allCats.map((c) => `<option value="${escapeHtml(c)}" ${c === currentVal ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
      `;
    }
  }

  const searchVal = (document.getElementById("globalSearchInput")?.value || "").toLowerCase().trim();

  const filtered = (expenses || []).filter((e) => {
    if (searchVal) {
      const hay = `${e.title} ${e.category} ${e.notes}`.toLowerCase();
      if (!hay.includes(searchVal)) return false;
    }
    return true;
  });

  const tbody = document.getElementById("fullExpensesTableBody");
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-state-row" style="background:transparent !important;">
        <td colspan="3" style="padding:2.2rem 1rem; background:transparent !important;">
          <div class="empty-state-card" style="margin:0 auto;max-width:420px; background:transparent !important;">
            <p class="empty-state-title">No matching expenses</p>
            <p class="empty-state-sub">No expenses logged for this month yet.</p>
            <button type="button" class="btn-primary btn-sm" onclick="openAddExpenseModal()">Add expense</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (e) => `
      <tr class="expense-compact-row">
        <td class="exp-cell-name">
          <strong class="exp-name-title">${escapeHtml(e.title)}</strong>
        </td>
        <td class="text-right exp-cell-amount">
          <span class="exp-amount-num">${formatPHP(e.amount)}</span>
        </td>
        <td class="text-right exp-cell-action">
          <button type="button" class="btn-secondary btn-sm exp-view-btn" onclick="openExpenseDetailsModal(${e.id})">View Details</button>
        </td>
      </tr>
    `
    )
    .join("");
}

function renderFullShoppingTab() {
  const { shopping_list, inventory_items } = AppState.data;
  const activeBadge = document.getElementById("shoppingActiveCountBadge");
  if (activeBadge) {
    const needCount = (shopping_list || []).length;
    if (needCount > 0) {
      activeBadge.textContent = `${needCount} Needs Restock`;
      activeBadge.classList.remove("hidden");
    } else {
      activeBadge.textContent = "";
      activeBadge.classList.add("hidden");
    }
  }

  const activeContainer = document.getElementById("activeShoppingListContainer");
  if (activeContainer) {
    if (!shopping_list || shopping_list.length === 0) {
      activeContainer.innerHTML = `
        <div class="empty-state-card">
          <p class="empty-state-title">All shopping items stocked</p>
          <p class="empty-state-sub">Items marked low or out of stock will automatically appear here for your next grocery run.</p>
        </div>
      `;
    } else {
      activeContainer.innerHTML = shopping_list
        .map(
          (item) => {
            const statusKey = (item.status || "low").toLowerCase().replace(/\s+/g, "-");
            return `
            <div class="inv-quick-item">
              <div class="inv-item-left">
                <span class="inv-item-title">${escapeHtml(item.item_name)} <span class="stock-unit-pill">${escapeHtml(item.unit)}</span></span>
              </div>
              <div class="inv-item-right">
                <span class="status-badge-box ${statusKey}">${escapeHtml(item.status || "Low")}</span>
                <button type="button" class="btn-put-expense" onclick="openConvertShoppingModal(${item.id})" title="Put to expense">Put to expense</button>
              </div>
            </div>
          `;
          }
        )
        .join("");
    }
  }

  renderFullInventoryTab();
}

function renderFullInventoryTab() {
  const { inventory_items } = AppState.data || {};
  const fullContainer = document.getElementById("fullInventoryListContainer");
  const navBadge = document.getElementById("navInventoryBadge");

  if (navBadge) {
    const lowCount = (inventory_items || []).filter(
      (i) => i.status === "LOW" || i.status === "OUT"
    ).length;
    if (lowCount > 0) {
      navBadge.textContent = `${lowCount} Low`;
      navBadge.classList.remove("hidden");
    } else {
      navBadge.textContent = "";
      navBadge.classList.add("hidden");
    }
  }

  if (fullContainer) {
    const filterStatus = document.getElementById("inventoryStatusFilter")?.value || "ALL";
    const filteredInv = (inventory_items || []).filter(
      (i) => filterStatus === "ALL" || i.status === filterStatus
    );
    if (filteredInv.length === 0) {
      fullContainer.innerHTML = `
        <div class="empty-state-card">
          <p class="empty-state-title">No inventory items found</p>
          <p class="empty-state-sub">Add household essentials to monitor stock counts and price history.</p>
          <button type="button" class="btn-primary btn-sm" onclick="openAddInventoryModal()">Add item</button>
        </div>
      `;
      return;
    }
    fullContainer.innerHTML = filteredInv
      .map(
        (item) => `
        <div class="inv-quick-item">
          <div class="inv-item-left">
            <span class="inv-item-title">${escapeHtml(item.item_name)} <span class="stock-unit-pill">${escapeHtml(item.unit)}</span> <small class="kpi-sub-inline">&bull; ${escapeHtml(item.category || "Essential")}</small></span>
          </div>
          <div class="inv-item-right">
            <button type="button" class="btn-action-icon btn-action-edit" onclick="editInventoryModal(${item.id})" title="Edit" aria-label="Edit">
              <span class="material-symbols-rounded" style="font-size:16px;">edit</span>
            </button>
            <button type="button" class="btn-action-icon btn-action-delete" onclick="deleteInventoryItem(${item.id})" title="Delete" aria-label="Delete">
              <span class="material-symbols-rounded" style="font-size:16px;">delete</span>
            </button>
          </div>
        </div>
      `
      )
      .join("");
  }
}

function renderFullBillsTab() {
  const bills = AppState.data.recurring_bills || [];
  const grid = document.getElementById("fullBillsGrid");
  if (!grid) return;

  if (bills.length === 0) {
    grid.innerHTML = `
      <div class="empty-state-card" style="grid-column: 1 / -1;">
        <p class="empty-state-title">No recurring bills</p>
        <p class="empty-state-sub">Keep track of monthly utilities, rent, and subscriptions with due date reminders.</p>
        <button type="button" class="btn-primary btn-sm" onclick="openAddBillModal()">Add bill</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = bills
    .map((b) => {
      const isPaid = b.is_paid_current_month;
      const logoUrl = b.company_logo || "";
      const logoBadgeHtml = logoUrl
        ? `<div class="bill-company-logo-badge" title="${escapeHtml(b.company_name || b.bill_name)}">
             <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(b.company_name || b.bill_name)}" class="bill-company-logo-img" />
           </div>`
        : `<div class="bill-company-logo-badge bill-company-logo-placeholder" title="${escapeHtml(b.bill_name)}">
             <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
               <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
             </svg>
           </div>`;

      return `
        <div class="glass-card bento-widget bill-card">
          <div class="kpi-card-top">
            <span class="status-badge badge-slate">${escapeHtml(b.category)}</span>
            <span class="status-badge ${isPaid ? "badge-sage" : "badge-amber"}">
              ${isPaid ? "Paid (" + escapeHtml(AppState.selectedMonth) + ")" : "Unpaid"}
            </span>
          </div>
          <div class="bill-card-middle">
            <div class="bill-card-info">
              <h3 class="widget-title">${escapeHtml(b.bill_name)}</h3>
              <p class="widget-subtitle">Due every ${getOrdinalDay(b.due_day)} of the month</p>
              <div class="kpi-value" style="font-size:1.35rem; margin-top:0.35rem;">${formatPHP(b.default_amount)}</div>
            </div>
            <div class="bill-card-center-right-logo">
              ${logoBadgeHtml}
            </div>
          </div>
          <div class="kpi-footer" style="margin-top:0.5rem;">
            <div style="display:flex;gap:0.4rem;align-items:center;">
              <button type="button" class="btn-action-icon btn-action-edit" onclick="editBillModal(${b.id})" title="Edit" aria-label="Edit">
                <span class="material-symbols-rounded" style="font-size:16px;">edit</span>
              </button>
              <button type="button" class="btn-action-icon" onclick="downloadSingleBillIcs(${b.id})" title="Calendar Reminder (.ics)" aria-label="Calendar Reminder">
                <span class="material-symbols-rounded" style="font-size:16px;">event</span>
              </button>
              <button type="button" class="btn-action-icon btn-action-delete" onclick="deleteRecurringBill(${b.id})" title="Delete" aria-label="Delete">
                <span class="material-symbols-rounded" style="font-size:16px;">delete</span>
              </button>
            </div>
            ${
              !isPaid
                ? `<button type="button" class="btn-primary" style="padding:0.4rem 0.85rem;" onclick="payRecurringBill(${b.id})">Pay bill</button>`
                : `<span class="kpi-subtext">Last paid: ${escapeHtml(b.last_paid_month)}</span>`
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderFullPricesTab() {
  const comparisons = AppState.data.price_comparison || [];
  const history = AppState.data.price_history || [];

  // Winner Cards Grid
  const winnersGrid = document.getElementById("priceWinnersGrid");
  if (winnersGrid) {
    if (comparisons.length === 0) {
      winnersGrid.innerHTML = "";
    } else {
      winnersGrid.innerHTML = comparisons
        .map(
          (c) => `
          <div class="glass-card kpi-card" onclick="selectFullPriceItem('${escapeHtml(c.item_name)}')">
            <div class="kpi-card-top">
              <span class="kpi-label">${escapeHtml(c.item_name)}</span>
              <span class="status-badge badge-sage">Best: ${escapeHtml(c.cheapest_store)}</span>
            </div>
            <div class="kpi-value" style="font-size:1.3rem;">${formatPHP(c.cheapest_price)}</div>
            <div class="kpi-footer">
              <span class="kpi-subtext">Save ${formatPHP(c.max_savings)} vs ${escapeHtml(c.highest_store)} (${formatPHP(c.highest_price)})</span>
            </div>
          </div>
        `
        )
        .join("");
    }
  }

  // Dropdown & Full Chart
  const selectEl = document.getElementById("fullPriceItemSelect");
  const subEl = document.getElementById("fullPriceChartSubtitle");
  if (selectEl) {
    if (comparisons.length === 0) {
      selectEl.innerHTML = `<option value="">No items</option>`;
      if (subEl) subEl.textContent = "No store price entries recorded yet";
      if (AppState.charts.fullPrice) {
        AppState.charts.fullPrice.destroy();
        AppState.charts.fullPrice = null;
      }
    } else {
      const names = comparisons.map((c) => c.item_name);
      if (!names.includes(AppState.selectedFullPriceItem)) {
        AppState.selectedFullPriceItem = names[0];
      }
      selectEl.innerHTML = names
        .map(
          (n) =>
            `<option value="${escapeHtml(n)}" ${n === AppState.selectedFullPriceItem ? "selected" : ""}>${escapeHtml(n)}</option>`
        )
        .join("");

      const activeComp =
        comparisons.find((c) => c.item_name === AppState.selectedFullPriceItem) || comparisons[0];
      if (subEl && activeComp) {
        subEl.textContent = `${activeComp.item_name} — Cheapest at ${activeComp.cheapest_store} (${formatPHP(activeComp.cheapest_price)})`;
      }
      renderPriceLineChart("fullPriceHistoryChart", "fullPrice", activeComp);
    }
  }

  // Price Logs Table
  const tbody = document.getElementById("priceLogsTableBody");
  if (tbody) {
    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1.4rem;">No store price logs recorded yet.</td></tr>`;
    } else {
      const reversed = [...history].reverse();
      tbody.innerHTML = reversed
        .map(
          (log) => `
          <tr>
            <td>${escapeHtml(log.recorded_date)}</td>
            <td><strong>${escapeHtml(log.item_name)}</strong></td>
            <td><span class="status-badge badge-slate">${escapeHtml(log.store_name)}</span></td>
            <td class="text-right"><strong>${formatPHP(log.price)}</strong></td>
            <td class="text-right">
              <button type="button" class="btn-action-icon btn-action-delete" onclick="deletePriceLog(${log.id})" title="Delete" aria-label="Delete">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </td>
          </tr>
        `
        )
        .join("");
    }
  }
}

function renderFullReportsTab() {
  const { selected_month, kpi, monthly_trend } = AppState.data;
  const heading = document.getElementById("reportMonthHeading");
  if (heading && selected_month) {
    const parts = selected_month.split("-");
    heading.textContent = parts.length === 2 ? `${parts[1]}/${parts[0]}` : selected_month;
  }

  const summaryGrid = document.getElementById("reportSummaryStatsGrid");
  if (summaryGrid) {
    summaryGrid.innerHTML = `
      <div class="report-stat-box">
        <div class="kpi-label">Total Monthly Spend</div>
        <div class="kpi-value" style="font-size:1.25rem;">${formatPHP(kpi.total_expenses)}</div>
      </div>
      <div class="report-stat-box">
        <div class="kpi-label">Previous Month Spend</div>
        <div class="kpi-value" style="font-size:1.25rem;">${formatPHP(kpi.prev_month_expenses)}</div>
      </div>
      <div class="report-stat-box">
        <div class="kpi-label">MoM Change</div>
        <div class="kpi-value" style="font-size:1.25rem;">${kpi.mom_percentage >= 0 ? "+" : ""}${kpi.mom_percentage}%</div>
      </div>
    `;
  }

  const catTbody = document.getElementById("reportCategoryTableBody");
  if (catTbody && kpi.category_breakdown) {
    const totalSpent = Number(kpi.total_expenses || 0);
    catTbody.innerHTML = Object.entries(kpi.category_breakdown)
      .map(([cat, info]) => {
        const spent = Number(info.spent || 0);
        const sharePct = totalSpent > 0 ? ((spent / totalSpent) * 100).toFixed(1) : "0.0";
        return `
          <tr>
            <td><strong>${escapeHtml(cat)}</strong></td>
            <td class="text-right">${formatPHP(spent)}</td>
            <td class="text-right"><span class="status-badge badge-sage">${sharePct}%</span></td>
          </tr>
        `;
      })
      .join("");
  }

  // Month-over-Month Chart
  const ctx = document.getElementById("reportsMomChart");
  if (ctx && window.Chart && monthly_trend) {
    if (AppState.charts.reportsMom) {
      AppState.charts.reportsMom.destroy();
    }
    const labels = monthly_trend.map((m) => formatMonthHuman(m.month));
    AppState.charts.reportsMom = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Essential",
            data: monthly_trend.map((m) => m.Essential || 0),
            backgroundColor: CATEGORY_COLORS.Essential,
            borderRadius: 8,
          },
          {
            label: "Condiments",
            data: monthly_trend.map((m) => m.Condiments || 0),
            backgroundColor: CATEGORY_COLORS.Condiments,
            borderRadius: 8,
          },
          {
            label: "Meat and Vegetables",
            data: monthly_trend.map((m) => m["Meat and Vegetables"] || 0),
            backgroundColor: CATEGORY_COLORS["Meat and Vegetables"],
            borderRadius: 8,
          },
          {
            label: "Bills",
            data: monthly_trend.map((m) => m.Bills || 0),
            backgroundColor: CATEGORY_COLORS.Bills,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#94a3b8", boxWidth: 12 },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(148, 163, 184, 0.08)" },
          },
          y: {
            stacked: true,
            ticks: {
              color: "#94a3b8",
              callback: (v) => "₱" + v.toLocaleString(),
            },
            grid: { color: "rgba(148, 163, 184, 0.08)" },
          },
        },
      },
    });
  }
}

// ==========================================
// CATEGORY AUTO-DETECTION ON ITEM TYPING
// ==========================================
function setExpenseCategoryEditMode(isEditing) {
  const displayEl = document.getElementById("expCategoryDisplay");
  const inputEl = document.getElementById("expCategory");
  const btn = document.getElementById("toggleExpCatEditBtn");
  const pencilIcon = document.getElementById("expCatEditPencilIcon");
  const checkIcon = document.getElementById("expCatEditCheckIcon");

  if (!displayEl || !inputEl) return;

  if (isEditing) {
    displayEl.classList.add("hidden");
    inputEl.classList.remove("hidden");
    if (pencilIcon) pencilIcon.classList.add("hidden");
    if (checkIcon) checkIcon.classList.remove("hidden");
    if (btn) {
      btn.classList.add("active");
      btn.setAttribute("title", "Save category");
      btn.setAttribute("aria-label", "Save category");
      btn.setAttribute("aria-expanded", "true");
    }
    inputEl.focus();
    inputEl.select();
  } else {
    const val = inputEl.value.trim() || "Essential";
    inputEl.value = val;
    displayEl.textContent = val;
    displayEl.classList.remove("hidden");
    inputEl.classList.add("hidden");
    if (pencilIcon) pencilIcon.classList.remove("hidden");
    if (checkIcon) checkIcon.classList.add("hidden");
    if (btn) {
      btn.classList.remove("active");
      btn.setAttribute("title", "Edit category");
      btn.setAttribute("aria-label", "Edit category");
      btn.setAttribute("aria-expanded", "false");
    }
  }
}

function setInventoryCategoryEditMode(isEditing) {
  const displayEl = document.getElementById("invCategoryDisplay");
  const inputEl = document.getElementById("invCategorySelect");
  const btn = document.getElementById("toggleInvCatEditBtn");
  const pencilIcon = document.getElementById("invCatEditPencilIcon");
  const checkIcon = document.getElementById("invCatEditCheckIcon");

  if (!displayEl || !inputEl) return;

  if (isEditing) {
    displayEl.classList.add("hidden");
    inputEl.classList.remove("hidden");
    if (pencilIcon) pencilIcon.classList.add("hidden");
    if (checkIcon) checkIcon.classList.remove("hidden");
    if (btn) {
      btn.classList.add("active");
      btn.setAttribute("title", "Save category");
      btn.setAttribute("aria-label", "Save category");
      btn.setAttribute("aria-expanded", "true");
    }
    inputEl.focus();
    inputEl.select();
  } else {
    const val = inputEl.value.trim() || "Essential";
    inputEl.value = val;
    displayEl.textContent = val;
    displayEl.classList.remove("hidden");
    inputEl.classList.add("hidden");
    if (pencilIcon) pencilIcon.classList.remove("hidden");
    if (checkIcon) checkIcon.classList.add("hidden");
    if (btn) {
      btn.classList.remove("active");
      btn.setAttribute("title", "Edit category");
      btn.setAttribute("aria-label", "Edit category");
      btn.setAttribute("aria-expanded", "false");
    }
  }
}


function syncAllCategoryAutoSelectors() {
  const expTitle = (document.getElementById("expTitle")?.value || "").trim();
  const expCat = document.getElementById("expCategory");
  const expDisplay = document.getElementById("expCategoryDisplay");
  const expCatGroup = document.getElementById("expCategoryGroup");

  if (expCatGroup) {
    if (expTitle.length > 0) {
      expCatGroup.classList.remove("hidden");
    } else {
      expCatGroup.classList.add("hidden");
    }
  }

  if (expCat) {
    const detected = detectCategoryFromItem(expTitle, "");
    if (detected) {
      expCat.value = detected;
      if (expDisplay) expDisplay.textContent = detected;
    } else if (expTitle.length === 0) {
      expCat.value = "Essential";
      if (expDisplay) expDisplay.textContent = "";
    }
  }

  const billName = (document.getElementById("billNameInput")?.value || "").trim();
  const billCat = document.getElementById("billCategoryInput");
  if (billCat) billCat.value = detectCategoryFromItem(billName, "Bills");

  const invName = (document.getElementById("invNameInput")?.value || "").trim();
  const invCat = document.getElementById("invCategorySelect");
  const invDisplay = document.getElementById("invCategoryDisplay");
  if (invCat) {
    const detected = detectCategoryFromItem(invName, "");
    if (detected) {
      invCat.value = detected;
      if (invDisplay) invDisplay.textContent = detected;
    }
  }
}

// ==========================================
// INTERACTIVE CRUD ACTIONS & HANDLERS
// ==========================================

// 1. Update Quick Add KPI Selection Cards & Switch Mode (Expense / Bill / Inventory)
function updateQuickAddKpiCards() {
  if (!AppState.data) return;
  const { kpi, recurring_bills, inventory_items } = AppState.data;

  const expVal = document.getElementById("qKpiExpenseValue");
  if (expVal) expVal.textContent = formatPHP((kpi && kpi.total_expenses) || 0);

  const billVal = document.getElementById("qKpiBillValue");
  if (billVal) billVal.textContent = `${(recurring_bills || []).length}`;

  const invVal = document.getElementById("qKpiInventoryValue");
  if (invVal) invVal.textContent = `${(inventory_items || []).length}`;
}

function switchQuickAddMode(mode = null) {
  const hasMode = Boolean(mode);
  const modeTitles = {
    expense: "Add expense",
    bill: "Add recurring bill",
    inventory: "Add shopping item",
  };
  const modeSubtitles = {
    expense: "",
    bill: "",
    inventory: "",
  };

  // Hide the KPI selection cards grid when a card is selected
  const kpiGrid = document.getElementById("quickAddModeTabs");
  if (kpiGrid) {
    kpiGrid.classList.toggle("hidden", hasMode);
  }

  document.querySelectorAll("#quickAddModeTabs .q-tab").forEach((btn) => {
    const isSelected = hasMode && btn.getAttribute("data-qmode") === mode;
    btn.classList.toggle("active", isSelected);
  });

  const headerBackBtn = document.getElementById("modalHeaderBackBtn");
  if (headerBackBtn) {
    headerBackBtn.classList.add("hidden");
  }

  const modalTitle = document.getElementById("expenseModalTitle");
  const modalSubtitle = document.getElementById("expenseModalSubtitle");
  if (modalTitle) {
    modalTitle.textContent = hasMode && modeTitles[mode] ? modeTitles[mode] : "Quick log";
  }
  if (modalSubtitle) {
    modalSubtitle.textContent = "";
  }

  document.getElementById("expenseForm").classList.toggle("hidden", mode !== "expense");
  document.getElementById("billForm").classList.toggle("hidden", mode !== "bill");
  document.getElementById("inventoryForm").classList.toggle("hidden", mode !== "inventory");
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateButtonLabel(ymd) {
  if (!ymd || !ymd.includes("-")) return ymd || "";
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


function syncBillDueDateButtonLabel() {
  const dateInput = document.getElementById("billDueDayInput");
  const labelEl = document.getElementById("billDueDateBtnLabel");
  if (dateInput && labelEl) {
    const val = (dateInput.value || "").trim();
    labelEl.textContent = val ? formatDateButtonLabel(val) : "Date";
  }
}

function setBillDueDateExpanded(expanded) {
  const wrap = document.getElementById("billDueDateWrap");
  const btn = document.getElementById("toggleBillDueDateBtn");
  if (wrap) {
    wrap.classList.toggle("hidden", !expanded);
  }
  if (btn) {
    btn.classList.toggle("active", expanded);
    btn.setAttribute("aria-expanded", expanded ? "true" : "false");
  }
}

function setExpenseNotesExpanded(expanded) {
  // Notes is now an integrated, persistent field aligned beside Date in the form grid
}

function openQuickAddModal(mode = null) {
  const todayStr = getTodayDateString();
  document.getElementById("expenseModalTitle").textContent = "Add";
  document.getElementById("expenseForm").reset();
  document.getElementById("expenseIdInput").value = "";
  document.getElementById("expDate").value = todayStr;
  const expQtyEl = document.getElementById("expQuantity");
  if (expQtyEl) expQtyEl.value = "1";
  const expCatEl = document.getElementById("expCategory");
  const expDisplayEl = document.getElementById("expCategoryDisplay");
  if (expCatEl) expCatEl.value = "Essential";
  if (expDisplayEl) expDisplayEl.textContent = "Essential";
  setExpenseCategoryEditMode(false);
  document.getElementById("customSplitsContainer")?.classList.add("hidden");
  setExpenseNotesExpanded(false);

  document.getElementById("billForm").reset();
  document.getElementById("billIdInput").value = "";
  document.getElementById("billCategoryInput").value = "Bills";
  document.getElementById("billDueDayInput").value = todayStr;
  syncBillDueDateButtonLabel();
  setBillDueDateExpanded(false);
  populateBillCompanySelect();

  document.getElementById("inventoryForm").reset();
  document.getElementById("invIdInput").value = "";
  const invUnitEl = document.getElementById("invUnitInput");
  if (invUnitEl) invUnitEl.value = "1";
  const invCatEl = document.getElementById("invCategorySelect");
  const invDisplayEl = document.getElementById("invCategoryDisplay");
  if (invCatEl) invCatEl.value = "Essential";
  if (invDisplayEl) invDisplayEl.textContent = "Essential";
  setInventoryCategoryEditMode(false);
  syncInventoryStockStatus();

  syncAllCategoryAutoSelectors();
  updateQuickAddKpiCards();
  switchQuickAddMode(mode);
  openModal("expenseModal");
}

window.openEditExpenseModal = function (expenseId) {
  const exp = (AppState.data.expenses || []).find((e) => e.id === expenseId);
  if (!exp) return;

  switchQuickAddMode("expense");
  document.getElementById("expenseModalTitle").textContent = "Edit expense";
  document.getElementById("expenseIdInput").value = exp.id;
  
  const titleInput = document.getElementById("expTitle");
  if (titleInput) titleInput.value = exp.title || "";
  
  const expCatGroup = document.getElementById("expCategoryGroup");
  if (expCatGroup) {
    expCatGroup.classList.toggle("hidden", !(exp.title || "").trim());
  }

  const expCatInput = document.getElementById("expCategory");
  const expDisplay = document.getElementById("expCategoryDisplay");
  const catVal = exp.category || "Essential";
  if (expCatInput) expCatInput.value = catVal;
  if (expDisplay) expDisplay.textContent = catVal;
  setExpenseCategoryEditMode(false);
  const expQtyEl = document.getElementById("expQuantity");
  if (expQtyEl) expQtyEl.value = exp.quantity || 1;
  document.getElementById("expAmount").value = exp.amount;
  document.getElementById("expStore").value = exp.store_name || "";
  document.getElementById("expDate").value = exp.date_incurred;
  const paidByEl = document.getElementById("expPaidBy");
  if (paidByEl) paidByEl.value = exp.paid_by_member_id || "";
  const notesVal = exp.notes || "";
  document.getElementById("expNotes").value = notesVal;
  setExpenseNotesExpanded(Boolean(notesVal.trim()));

  openModal("expenseModal");
};

window.deleteExpense = function (expenseId) {
  const expenses = AppState.data?.expenses || [];
  const expIndex = expenses.findIndex((e) => e.id === expenseId);
  if (expIndex === -1) return;
  const removedExp = expenses[expIndex];
  const name = removedExp.title || "Expense";

  // Optimistically remove from AppState and re-render
  expenses.splice(expIndex, 1);
  renderDashboardTransactions();
  renderFullExpensesTab();
  renderActivityTab();
  if (typeof updateKpis === "function") updateKpis();

  showUndoDeleteToast({
    name,
    onUndo: () => {
      expenses.splice(expIndex, 0, removedExp);
      renderDashboardTransactions();
      renderFullExpensesTab();
      renderActivityTab();
      if (typeof updateKpis === "function") updateKpis();
      showToast(`Restored "${name}"`);
    },
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
        if (res.ok) {
          await loadBootstrapData();
        }
      } catch (err) {
        console.error("Failed to delete expense:", err);
      }
    },
  });
};

window.payRecurringBill = async function (billId) {
  const res = await fetch(`/api/bills/${billId}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      month: AppState.selectedMonth,
      paid_by_member_id: null,
    }),
  });
  const result = await res.json();
  if (res.ok) {
    showToast(result.message ? "Bill marked paid and logged to expenses" : "Bill paid and logged to expenses");
    closeModal("kpiDetailModal");
    await loadBootstrapData();
  } else {
    showToast(result.error || "Could not pay bill");
  }
};

window.editBillModal = function (billId) {
  const bill = (AppState.data.recurring_bills || []).find((b) => b.id === billId);
  if (!bill) return;
  populateBillCompanySelect(bill.company_name || bill.bill_name);
  switchQuickAddMode("bill");
  document.getElementById("expenseModalTitle").textContent = "Edit recurring bill";
  document.getElementById("billIdInput").value = bill.id;
  document.getElementById("billNameInput").value = bill.bill_name;
  document.getElementById("billCategoryInput").value = bill.category || "Bills";
  document.getElementById("billAmountInput").value = bill.default_amount;
  const dueDayPadded = String(bill.due_day || 1).padStart(2, "0");
  document.getElementById("billDueDayInput").value = `${AppState.selectedMonth}-${dueDayPadded}`;
  document.getElementById("billLastPaidInput").value = bill.last_paid_month || "";
  syncBillDueDateButtonLabel();
  setBillDueDateExpanded(false);
  openModal("expenseModal");
};

window.deleteRecurringBill = function (billId) {
  const bills = AppState.data?.recurring_bills || [];
  const billIndex = bills.findIndex((b) => b.id === billId);
  if (billIndex === -1) return;
  const removedBill = bills[billIndex];
  const name = removedBill.bill_name || "Bill";

  bills.splice(billIndex, 1);
  renderFullBillsTab();

  showUndoDeleteToast({
    name,
    onUndo: () => {
      bills.splice(billIndex, 0, removedBill);
      renderFullBillsTab();
      showToast(`Restored "${name}"`);
    },
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/bills/${billId}`, { method: "DELETE" });
        if (res.ok) {
          await loadBootstrapData();
        }
      } catch (err) {
        console.error("Failed to delete bill:", err);
      }
    },
  });
};

// ==========================================
// COMPANY DETAILS MANAGEMENT
// ==========================================
function populateBillCompanySelect(selectedName = "") {
  const select = document.getElementById("billCompanySelect");
  const label = document.getElementById("billCompanySelectLabel");
  const btn = document.getElementById("billCompanySelectBtn");
  const list = document.getElementById("billCompanySelectList");
  const companies = (AppState.data && AppState.data.companies) || [];

  const normalizedSelected = (selectedName || "").trim().toLowerCase();
  const matchedCompany = companies.find((c) => c.name.toLowerCase() === normalizedSelected);
  const currentVal = matchedCompany ? matchedCompany.name : (selectedName ? selectedName.trim() : "");

  if (select) {
    select.innerHTML =
      '<option value="">Select registered company (optional)</option>' +
      companies
        .map(
          (c) =>
            `<option value="${escapeHtml(c.name)}" ${
              c.name.toLowerCase() === currentVal.toLowerCase() ? "selected" : ""
            }>${escapeHtml(c.name)}</option>`
        )
        .join("");
    select.value = currentVal;
  }

  if (label && btn) {
    if (currentVal) {
      label.textContent = currentVal;
      btn.classList.remove("has-placeholder");
    } else {
      label.textContent = "Select registered company (optional)";
      btn.classList.add("has-placeholder");
    }
  }

  if (list) {
    let itemsHtml = `
      <button type="button" class="company-select-item ${!currentVal ? "active" : ""}" data-comp-name="">
        <span class="company-select-item-placeholder-logo">—</span>
        <span>Select registered company (optional)</span>
      </button>
    `;
    companies.forEach((c) => {
      const isAct = c.name.toLowerCase() === currentVal.toLowerCase();
      const logoHtml = c.logo
        ? `<img src="${escapeHtml(c.logo)}" class="company-select-item-logo" alt="${escapeHtml(c.name)}" />`
        : `<span class="company-select-item-placeholder-logo">${escapeHtml((c.name.charAt(0) || "C").toUpperCase())}</span>`;
      itemsHtml += `
        <button type="button" class="company-select-item ${isAct ? "active" : ""}" data-comp-name="${escapeHtml(c.name)}">
          ${logoHtml}
          <span>${escapeHtml(c.name)}</span>
        </button>
      `;
    });
    list.innerHTML = itemsHtml;

    list.querySelectorAll(".company-select-item").forEach((itemBtn) => {
      itemBtn.addEventListener("click", () => {
        const compName = itemBtn.getAttribute("data-comp-name") || "";
        selectCompanyInBillForm(compName);
      });
    });
  }
}

function selectCompanyInBillForm(compName) {
  const select = document.getElementById("billCompanySelect");
  const label = document.getElementById("billCompanySelectLabel");
  const btn = document.getElementById("billCompanySelectBtn");
  const menu = document.getElementById("billCompanySelectMenu");

  const cleanName = (compName || "").trim();
  if (select) {
    select.value = cleanName;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (label && btn) {
    if (cleanName) {
      label.textContent = cleanName;
      btn.classList.remove("has-placeholder");
    } else {
      label.textContent = "Select registered company (optional)";
      btn.classList.add("has-placeholder");
    }
  }

  if (menu) {
    menu.classList.add("hidden");
    btn?.classList.remove("open");
    btn?.setAttribute("aria-expanded", "false");
  }

  const list = document.getElementById("billCompanySelectList");
  if (list) {
    list.querySelectorAll(".company-select-item").forEach((el) => {
      const c = el.getAttribute("data-comp-name") || "";
      el.classList.toggle("active", c.toLowerCase() === cleanName.toLowerCase());
    });
  }
}

const COMPANY_SAVE_ICON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`;

let isCompanySelectMode = false;

window.openCompanyDetailsModal = function () {
  const form = document.getElementById("companyDetailsForm");
  if (form) form.reset();
  const editIdInput = document.getElementById("companyEditIdInput");
  if (editIdInput) editIdInput.value = "";
  const previewImg = document.getElementById("companyLogoPreviewImg");
  const emptyState = document.getElementById("companyLogoEmptyState") || document.getElementById("companyLogoDefaultIcon");
  if (previewImg) {
    previewImg.src = "";
    previewImg.classList.add("hidden");
  }
  if (emptyState) emptyState.classList.remove("hidden");

  const cancelBtn = document.getElementById("companyCancelEditBtn");
  if (cancelBtn) cancelBtn.classList.add("hidden");
  const submitBtn = document.getElementById("companySubmitBtn");
  if (submitBtn) {
    submitBtn.innerHTML = COMPANY_SAVE_ICON_SVG;
    submitBtn.setAttribute("title", "Save company");
    submitBtn.setAttribute("aria-label", "Save company");
  }

  isCompanySelectMode = false;
  const hint = document.getElementById("companyEditHintText");
  const btnText = document.getElementById("companyEditSelectBtnText");
  if (hint) hint.classList.add("hidden");
  if (btnText) btnText.textContent = "Edit";

  renderCompanyList();
  openModal("companyDetailsModal");
};

window.toggleCompanySelectMode = function () {
  isCompanySelectMode = !isCompanySelectMode;
  const hint = document.getElementById("companyEditHintText");
  const btnText = document.getElementById("companyEditSelectBtnText");
  if (hint) hint.classList.toggle("hidden", !isCompanySelectMode);
  if (btnText) btnText.textContent = isCompanySelectMode ? "Cancel" : "Edit";
  document.querySelectorAll(".company-card-43").forEach(card => {
    card.classList.toggle("selectable-mode", isCompanySelectMode);
  });
};

window.chooseCompanyToEdit = function (companyId) {
  editCompanyDetails(companyId);
  isCompanySelectMode = false;
  const hint = document.getElementById("companyEditHintText");
  const btnText = document.getElementById("companyEditSelectBtnText");
  if (hint) hint.classList.add("hidden");
  if (btnText) btnText.textContent = "Edit";
  document.querySelectorAll(".company-card-43").forEach(card => {
    card.classList.remove("selectable-mode");
    card.classList.toggle("is-editing", parseInt(card.dataset.companyId, 10) === companyId);
  });
};

function renderCompanyList() {
  const container = document.getElementById("companyListContainer");
  if (!container) return;
  const companies = (AppState.data && AppState.data.companies) || [];
  if (companies.length === 0) {
    container.innerHTML = `<p class="kpi-subtext" style="padding:0.75rem 0;">No companies registered yet. Add one above.</p>`;
    return;
  }
  const currentEditId = parseInt(document.getElementById("companyEditIdInput")?.value || "0", 10);
  container.innerHTML = companies.map(c => {
    const thumbHtml = c.logo_path
      ? `<img src="${escapeHtml(c.logo_path)}" alt="${escapeHtml(c.name)}" />`
      : `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`;
    const isEditing = currentEditId === c.id;

    return `
      <div class="company-card-43 ${isEditing ? 'is-editing' : ''} ${isCompanySelectMode ? 'selectable-mode' : ''}" data-company-id="${c.id}" onclick="chooseCompanyToEdit(${c.id})" role="button" tabindex="0" title="Click to choose ${escapeHtml(c.name)}">
        <button type="button" class="btn-company-card-del" onclick="event.stopPropagation(); deleteCompanyDetails(${c.id})" title="Delete ${escapeHtml(c.name)}" aria-label="Delete company">
          <span class="material-symbols-rounded" style="font-size:15px; color:#ff6b6b;">delete</span>
        </button>
        <div class="company-card-43-logo">${thumbHtml}</div>
        <span class="company-card-43-name">${escapeHtml(c.name)}</span>
      </div>
    `;
  }).join("");
}

window.editCompanyDetails = function (companyId) {
  const comp = (AppState.data?.companies || []).find(c => c.id === companyId);
  if (!comp) return;
  document.getElementById("companyEditIdInput").value = comp.id;
  document.getElementById("companyNameInput").value = comp.name;
  const previewImg = document.getElementById("companyLogoPreviewImg");
  const emptyState = document.getElementById("companyLogoEmptyState") || document.getElementById("companyLogoDefaultIcon");
  if (comp.logo_path) {
    if (previewImg) {
      previewImg.src = comp.logo_path;
      previewImg.classList.remove("hidden");
    }
    if (emptyState) emptyState.classList.add("hidden");
  } else {
    if (previewImg) {
      previewImg.src = "";
      previewImg.classList.add("hidden");
    }
    if (emptyState) emptyState.classList.remove("hidden");
  }
  document.getElementById("companyCancelEditBtn")?.classList.remove("hidden");
  document.getElementById("companyDeleteBtn")?.classList.remove("hidden");
  const submitBtn = document.getElementById("companySubmitBtn");
  if (submitBtn) {
    submitBtn.innerHTML = COMPANY_SAVE_ICON_SVG;
    submitBtn.setAttribute("title", "Update company");
    submitBtn.setAttribute("aria-label", "Update company");
  }
  document.querySelectorAll(".company-card-43").forEach(card => {
    card.classList.toggle("is-editing", parseInt(card.dataset.companyId, 10) === companyId);
  });
  document.getElementById("companyNameInput")?.focus();
};

window.cancelCompanyEdit = function () {
  const form = document.getElementById("companyDetailsForm");
  if (form) form.reset();
  document.getElementById("companyEditIdInput").value = "";
  const previewImg = document.getElementById("companyLogoPreviewImg");
  const emptyState = document.getElementById("companyLogoEmptyState") || document.getElementById("companyLogoDefaultIcon");
  if (previewImg) {
    previewImg.src = "";
    previewImg.classList.add("hidden");
  }
  if (emptyState) emptyState.classList.remove("hidden");
  document.getElementById("companyCancelEditBtn")?.classList.add("hidden");
  document.getElementById("companyDeleteBtn")?.classList.add("hidden");
  const submitBtn = document.getElementById("companySubmitBtn");
  if (submitBtn) {
    submitBtn.innerHTML = COMPANY_SAVE_ICON_SVG;
    submitBtn.setAttribute("title", "Save company");
    submitBtn.setAttribute("aria-label", "Save company");
  }
  document.querySelectorAll(".company-card-43").forEach(card => {
    card.classList.remove("is-editing");
  });
};

window.deleteCompanyDetails = function (companyId) {
  const comp = (AppState.data?.companies || []).find(c => c.id === companyId);
  const name = comp ? `"${comp.name}"` : "company";
  openConfirmModal({
    title: `Delete ${name}?`,
    message: "This will remove the company profile. Existing bills will remain intact.",
    confirmText: "Delete company",
    danger: true,
    onConfirm: async () => {
      const res = await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Company removed");
        await loadBootstrapData();
        renderCompanyList();
        populateBillCompanySelect();
      } else {
        const err = await res.json();
        showToast(err.error || "Could not delete company");
      }
    },
  });
};

window.cycleInventoryStatus = async function (itemId, currentStatus) {
  const order = ["Out of Stock", "Low", "High"];
  const nextIdx = (order.indexOf(currentStatus) + 1) % order.length;
  const nextStatus = order[nextIdx];
  await updateInventoryStatusDirect(itemId, nextStatus);
};

window.updateInventoryStatusDirect = async function (itemId, newStatus) {
  const res = await fetch(`/api/inventory/${itemId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  if (res.ok) {
    showToast(`Item status updated to ${newStatus}`);
    await loadBootstrapData();
  }
};

window.editInventoryModal = function (itemId) {
  const item = (AppState.data.inventory_items || []).find((i) => i.id === itemId);
  if (!item) return;
  switchQuickAddMode("inventory");
  document.getElementById("expenseModalTitle").textContent = "Edit shopping item";
  document.getElementById("invIdInput").value = item.id;
  document.getElementById("invNameInput").value = item.item_name;
  const invCat = document.getElementById("invCategorySelect");
  const invDisplay = document.getElementById("invCategoryDisplay");
  const currentCat = item.category || detectCategoryFromItem(item.item_name, "Essential");
  if (invCat) invCat.value = currentCat;
  if (invDisplay) invDisplay.textContent = currentCat;
  setInventoryCategoryEditMode(false);
  const parsedStock = parseInt(item.unit, 10);
  document.getElementById("invUnitInput").value = isNaN(parsedStock) ? 1 : parsedStock;
  syncInventoryStockStatus();
  document.getElementById("invPriceInput").value = item.last_price || 0;
  document.getElementById("invStoreInput").value = item.preferred_store || "";
  openModal("expenseModal");
};

window.deleteInventoryItem = function (itemId) {
  const invItems = AppState.data?.inventory_items || [];
  const itemIndex = invItems.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) return;
  const removedItem = invItems[itemIndex];
  const name = removedItem.item_name || "Item";

  const shopList = AppState.data?.shopping_list || [];
  const shopIndex = shopList.findIndex((i) => i.id === itemId);
  const removedShop = shopIndex !== -1 ? shopList[shopIndex] : null;

  invItems.splice(itemIndex, 1);
  if (shopIndex !== -1) shopList.splice(shopIndex, 1);

  renderFullShoppingTab();
  renderDashboardInventory();

  showUndoDeleteToast({
    name,
    onUndo: () => {
      invItems.splice(itemIndex, 0, removedItem);
      if (removedShop && shopIndex !== -1) {
        shopList.splice(shopIndex, 0, removedShop);
      }
      renderFullShoppingTab();
      renderDashboardInventory();
      showToast(`Restored "${name}"`);
    },
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/inventory/${itemId}`, { method: "DELETE" });
        if (res.ok) {
          await loadBootstrapData();
        }
      } catch (err) {
        console.error("Failed to delete shopping item:", err);
      }
    },
  });
};

window.openConvertShoppingModal = function (itemId) {
  const item = (AppState.data.inventory_items || []).find((i) => i.id === itemId);
  if (!item) return;
  document.getElementById("convertItemId").value = item.id;
  document.getElementById("convertItemDisplay").value = `${item.item_name} (${item.unit})`;
  document.getElementById("convertPriceInput").value = item.last_price || "";
  document.getElementById("convertStoreInput").value = item.preferred_store || "";
  const todayStr = getTodayDateString();
  document.getElementById("convertDateInput").value = todayStr.startsWith(AppState.selectedMonth)
    ? todayStr
    : `${AppState.selectedMonth}-01`;
  document.getElementById("convertReceiptInput").value = "";
  openModal("convertShoppingModal");
};

window.selectFullPriceItem = function (itemName) {
  AppState.selectedFullPriceItem = itemName;
  renderFullPricesTab();
};

window.deletePriceLog = function (logId) {
  openConfirmModal({
    title: "Delete price entry?",
    message: "This recorded store price point will be removed from historical comparisons.",
    confirmText: "Delete price",
    danger: true,
    onConfirm: async () => {
      const res = await fetch(`/api/price-history/${logId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Price entry deleted");
        await loadBootstrapData();
      }
    },
  });
};

window.previewReceipt = function (receiptPath, expenseTitle) {
  if (!receiptPath) return;
  document.getElementById("receiptModalSubtitle").textContent = expenseTitle || "Attached Receipt";
  document.getElementById("receiptLightboxImg").src = receiptPath;
  document.getElementById("receiptDownloadLink").href = receiptPath;
  openModal("receiptModal");
};

// ==========================================
// PROFILE MODAL CRUD
// ==========================================

let isProfileEditMode = false;

function setProfileModalMode(isEditing) {
  isProfileEditMode = Boolean(isEditing);
  const nameInput = document.getElementById("profileNameInput");
  const bdayInput = document.getElementById("profileBirthdayInput");
  const addrInput = document.getElementById("profileAddressInput");
  const nameDisplay = document.getElementById("profileNameDisplay");
  const bdayDisplay = document.getElementById("profileBirthdayDisplay");
  const addrDisplay = document.getElementById("profileAddressDisplay");
  const overlay = document.getElementById("profilePhotoOverlay");
  const saveBtn = document.getElementById("saveProfileBtn");
  const btnText = document.getElementById("profileBtnText");
  const saveIcon = document.getElementById("profileBtnSaveIcon");
  const editIcon = document.getElementById("profileBtnEditIcon");
  const modalTitle = document.getElementById("membersModalTitle");

  // Edit wrappers
  const nameWrap = document.getElementById("profileNameEditWrap");
  const bdayWrap = document.getElementById("profileBirthdayEditWrap");
  const addrWrap = document.getElementById("profileAddressEditWrap");

  if (isProfileEditMode) {
    if (modalTitle) modalTitle.textContent = "Edit Profile";
    // Show input boxes with their background boxes
    nameWrap?.classList.remove("hidden");
    bdayWrap?.classList.remove("hidden");
    addrWrap?.classList.remove("hidden");

    // Hide plain text displays
    nameDisplay?.classList.add("hidden");
    bdayDisplay?.classList.add("hidden");
    addrDisplay?.classList.add("hidden");

    // Show photo button & Add photo text inside photo
    overlay?.classList.remove("hidden");

    // Button is Save
    if (saveBtn) {
      saveBtn.type = "submit";
      saveBtn.title = "Save profile";
    }
    if (btnText) btnText.textContent = "Save";
    saveIcon?.classList.remove("hidden");
    editIcon?.classList.add("hidden");
  } else {
    if (modalTitle) modalTitle.textContent = "Profile";
    // Update display values
    const currentName = nameInput?.value || "Admin";
    const currentBday = bdayInput?.value || "";
    const currentAddr = addrInput?.value || "";

    if (nameDisplay) nameDisplay.textContent = currentName;
    if (bdayDisplay) {
      bdayDisplay.textContent = currentBday ? formatDateButtonLabel(currentBday) : "Not set";
    }
    if (addrDisplay) {
      addrDisplay.textContent = currentAddr || "Not set";
    }

    // Hide input boxes (remove bg boxes)
    nameWrap?.classList.add("hidden");
    bdayWrap?.classList.add("hidden");
    addrWrap?.classList.add("hidden");

    // Show clean plain text displays without background boxes
    nameDisplay?.classList.remove("hidden");
    bdayDisplay?.classList.remove("hidden");
    addrDisplay?.classList.remove("hidden");

    // Hide photo button & Add photo text inside photo
    overlay?.classList.add("hidden");

    // Button is Edit
    if (saveBtn) {
      saveBtn.type = "button";
      saveBtn.title = "Edit profile";
    }
    if (btnText) btnText.textContent = "Edit";
    saveIcon?.classList.add("hidden");
    editIcon?.classList.remove("hidden");
  }
}

function openProfileModal(startInEdit = false) {
  const settings = (AppState.data && AppState.data.settings) || {};
  const nameInput = document.getElementById("profileNameInput");
  const bdayInput = document.getElementById("profileBirthdayInput");
  const addrInput = document.getElementById("profileAddressInput");
  const previewImg = document.getElementById("profilePhotoPreviewImg");
  const defaultAvatar = document.getElementById("profilePhotoDefaultAvatar");
  const fileInput = document.getElementById("profilePhotoInput");

  if (fileInput) fileInput.value = "";
  if (nameInput) nameInput.value = settings.admin_name || "Admin";
  if (bdayInput) bdayInput.value = settings.admin_birthday || "";
  if (addrInput) addrInput.value = settings.admin_address || "";

  if (previewImg && defaultAvatar) {
    if (settings.admin_photo) {
      previewImg.src = settings.admin_photo;
      previewImg.classList.remove("hidden");
      defaultAvatar.classList.add("hidden");
      previewImg.onerror = function() {
        this.classList.add("hidden");
        defaultAvatar.classList.remove("hidden");
      };
    } else {
      previewImg.src = "";
      previewImg.classList.add("hidden");
      defaultAvatar.classList.remove("hidden");
    }
  }

  setProfileModalMode(startInEdit);
  openModal("membersModal");
}

// ==========================================
// EXPORT FUNCTIONS (PDF)
// ==========================================
function exportMonthlyPDF() {
  if (!AppState.data) return;
  const { selected_month, kpi, expenses } = AppState.data;

  if (window.jspdf && window.jspdf.jsPDF) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`FamBam Household Summary Report (${selected_month})`, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Total Spent: PHP ${Number(kpi.total_expenses).toLocaleString()}`,
      14,
      26
    );

    // Table 1: Category Breakdown
    const catBody = Object.entries(kpi.category_breakdown || {}).map(([cat, info]) => [
      cat,
      `PHP ${Number(info.spent || 0).toLocaleString()}`,
    ]);

    if (doc.autoTable) {
      doc.autoTable({
        startY: 32,
        head: [["Category", "Actual Spent"]],
        body: catBody,
        headStyles: { fillColor: [59, 130, 246] },
      });

      const expBody = (expenses || []).map((e) => [
        e.date_incurred,
        e.title,
        e.quantity || 1,
        e.category,
        `PHP ${Number(e.amount).toFixed(2)}`,
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Date", "Expense Title", "Qty", "Category", "Amount"]],
        body: expBody,
        headStyles: { fillColor: [30, 41, 59] },
      });
    }

    doc.save(`FamBam_Report_${selected_month}.pdf`);
    showToast(`Exported PDF report for ${selected_month}`);
  } else if (window.html2pdf) {
    const element = document.getElementById("printableReportArea");
    window.html2pdf().from(element).save(`FamBam_Report_${selected_month}.pdf`);
    showToast(`Exported PDF report for ${selected_month}`);
  }
}

// ==========================================
// GLOBAL SEARCH BAR LOGIC
// ==========================================
function handleGlobalSearch(query) {
  const dropdown = document.getElementById("globalSearchDropdown");
  const clearBtn = document.getElementById("clearSearchBtn");
  const q = (query || "").trim().toLowerCase();

  if (clearBtn) clearBtn.classList.toggle("hidden", q.length === 0);
  renderFullExpensesTab();
  renderActivityTab();

  if (!q || !AppState.data) {
    if (dropdown) dropdown.classList.add("hidden");
    return;
  }

  const results = [];

  // Search Expenses
  (AppState.data.expenses || []).forEach((e) => {
    if (`${e.title} ${e.category} ${e.paid_by_name}`.toLowerCase().includes(q)) {
      results.push({
        type: "Expense",
        badge: "badge-slate",
        label: `${e.title} (${formatPHP(e.amount)})`,
        sub: `${e.date_incurred} • ${e.category}`,
        action: () => {
          switchTab("expenses");
          dropdown.classList.add("hidden");
        },
      });
    }
  });

  // Search Recurring Bills
  (AppState.data.recurring_bills || []).forEach((b) => {
    if (`${b.bill_name} ${b.category}`.toLowerCase().includes(q)) {
      results.push({
        type: "Bill",
        badge: b.is_paid_current_month ? "badge-sage" : "badge-amber",
        label: `${b.bill_name} (${formatPHP(b.default_amount)})`,
        sub: `Due every ${getOrdinalDay(b.due_day)} • ${b.is_paid_current_month ? "Paid" : "Unpaid"}`,
        action: () => {
          switchTab("bills");
          dropdown.classList.add("hidden");
        },
      });
    }
  });

  // Search Inventory & Shopping List
  (AppState.data.inventory_items || []).forEach((item) => {
    if (`${item.item_name} ${item.status}`.toLowerCase().includes(q)) {
      results.push({
        type: item.status,
        badge: getStatusBadgeClass(item.status),
        label: `${item.item_name} (${item.unit})`,
        sub: `Est. ${formatPHP(item.last_price)}`,
        action: () => {
          switchTab("shopping");
          dropdown.classList.add("hidden");
        },
      });
    }
  });

  if (results.length === 0) {
    dropdown.innerHTML = `<div class="search-result-item"><span class="kpi-subtext">Walang nahanap para sa "${escapeHtml(query)}"</span></div>`;
  } else {
    dropdown.innerHTML = results
      .slice(0, 8)
      .map(
        (r, i) => `
        <div class="search-result-item" data-search-idx="${i}">
          <div>
            <div style="font-weight:600;color:var(--text-primary);">${escapeHtml(r.label)}</div>
            <div class="kpi-subtext">${escapeHtml(r.sub)}</div>
          </div>
          <span class="status-badge ${r.badge}">${escapeHtml(r.type)}</span>
        </div>
      `
      )
      .join("");

    dropdown.querySelectorAll(".search-result-item").forEach((el) => {
      const idx = Number(el.getAttribute("data-search-idx"));
      if (results[idx] && results[idx].action) {
        el.addEventListener("click", results[idx].action);
      }
    });
  }

  dropdown.classList.remove("hidden");
}

// ==========================================
// NAVIGATION & EVENT LISTENERS INIT
// ==========================================
function switchTab(tabName) {
  AppState.activeTab = tabName;
  try {
    localStorage.setItem("fambam_active_tab", tabName);
  } catch (e) {}
  document.querySelectorAll(".sidebar-nav .nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
  });
  document.querySelectorAll(".tab-view").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `tab-${tabName}`);
  });
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebarBackdrop")?.classList.add("hidden");
  document.body.style.overflow = "";

  if (tabName === "reports") renderFullReportsTab();
  if (tabName === "activity") renderActivityTab();
  if (tabName === "expenses") renderFullExpensesTab();
  if (tabName === "bills") renderFullBillsTab();
  if (tabName === "shopping") renderFullShoppingTab();
  if (tabName === "inventory") renderFullInventoryTab();

  const mainWrap = document.querySelector(".main-wrapper");
  if (mainWrap) {
    if (tabName === "dashboard" && isDesktopLandscapeMode()) {
      mainWrap.classList.add("desktop-dashboard-steady");
      mainWrap.scrollTop = 0;
    } else {
      mainWrap.classList.remove("desktop-dashboard-steady");
    }
  }
}

function isDesktopLandscapeMode() {
  const isLandscape = window.matchMedia("(orientation: landscape)").matches || window.innerWidth > window.innerHeight;
  return window.innerWidth >= 1025 && isLandscape && (window.innerWidth / window.innerHeight >= 1.15);
}

function isMobileOrDrawerMode() {
  return !isDesktopLandscapeMode();
}

document.addEventListener("DOMContentLoaded", () => {
  initDialogBehaviors();

  // Date input click handler to open native picker smoothly
  document.querySelectorAll('.date-input-wrap input[type="date"]').forEach((inp) => {
    inp.addEventListener("click", () => {
      try {
        if (typeof inp.showPicker === "function") {
          inp.showPicker();
        }
      } catch (err) {
        // Fallback for browsers with restricted activation states
      }
    });
  });

  loadBootstrapData("2026-10");
  if (isDesktopLandscapeMode()) {
    const curTab = AppState.activeTab || "dashboard";
    if (curTab === "dashboard") {
      document.querySelector(".main-wrapper")?.classList.add("desktop-dashboard-steady");
    }
  } else {
    document.querySelector(".main-wrapper")?.classList.remove("desktop-dashboard-steady");
  }

  // Restore saved active tab on page refresh
  try {
    const savedTab = localStorage.getItem("fambam_active_tab");
    if (savedTab && document.getElementById(`tab-${savedTab}`)) {
      switchTab(savedTab);
    }
  } catch (err) {}

  // PWA Install state check & trigger
  checkPwaInstallState();
  document.getElementById("pwaInstallBtn")?.addEventListener("click", triggerPwaDownload);

  // Sidebar Navigation
  document.querySelectorAll(".sidebar-nav .nav-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.getAttribute("data-tab"));
    });
  });

  // Desktop & Mobile Sidebar Logic (Desktop Sidebar is Steady)
  const appShell = document.querySelector(".app-shell");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const sidebarOpenBtn = document.getElementById("sidebarOpenBtn");

  // Ensure desktop sidebar is steady and active on landscape desktop
  if (appShell && isDesktopLandscapeMode()) {
    appShell.classList.remove("sidebar-closed");
  }
  localStorage.removeItem("fambam_sidebar_closed");

  function closeSidebar() {
    // Only close mobile overlay drawer
    if (isMobileOrDrawerMode()) {
      closeMobileNav();
    }
  }

  function openSidebar() {
    if (isMobileOrDrawerMode()) {
      openMobileNav();
    }
  }

  sidebarCloseBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeSidebar();
  });

  sidebarOpenBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    openSidebar();
  });

  // Mobile Menu & Sidebar Backdrop Handlers
  function openMobileNav() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar) sidebar.classList.add("open");
    if (backdrop) backdrop.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeMobileNav() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.add("hidden");
    document.body.style.overflow = "";
  }

  document.getElementById("mobileMenuBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const sidebar = document.getElementById("sidebar");
    if (sidebar?.classList.contains("open")) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  });

  document.getElementById("sidebarCloseBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMobileNav();
  });

  document.getElementById("sidebarBackdrop")?.addEventListener("click", () => {
    closeMobileNav();
  });

  // Auto-close sidebar on mobile when navigating
  document.querySelectorAll(".sidebar .nav-link, #sidebarProfileCard").forEach((el) => {
    el.addEventListener("click", () => {
      if (isMobileOrDrawerMode()) {
        closeMobileNav();
      }
    });
  });

  // Handle dynamic screen resizing / orientation changes (e.g. 1080x2340 or device rotation)
  window.addEventListener("resize", () => {
    const mainWrapEl = document.querySelector(".main-wrapper");
    if (!isDesktopLandscapeMode()) {
      mainWrapEl?.classList.remove("desktop-dashboard-steady");
    } else {
      const curTab = AppState.activeTab || "dashboard";
      if (curTab === "dashboard") {
        mainWrapEl?.classList.add("desktop-dashboard-steady");
      }
      closeMobileNav();
    }
  });

  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("mobileMenuBtn");
    if (
      sidebar &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      (!menuBtn || !menuBtn.contains(e.target))
    ) {
      closeMobileNav();
    }
  });

  // Theme Toggle (Dark / Light Mode)
  const themeToggle = document.getElementById("themeToggleBtn");
  themeToggle?.addEventListener("click", () => {
    toggleTheme();
  });

  // Month Filter Dropdown Trigger & Outside Click
  const monthBtn = document.getElementById("monthDropdownBtn");
  monthBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = document.getElementById("monthDropdownMenu");
    if (!menu) return;
    const isClosed = menu.classList.contains("hidden");
    if (isClosed) {
      menu.classList.remove("hidden");
      monthBtn.classList.add("open");
      monthBtn.setAttribute("aria-expanded", "true");
    } else {
      menu.classList.add("hidden");
      monthBtn.classList.remove("open");
      monthBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", (e) => {
    const wrap = document.getElementById("headerMonthWrap");
    if (wrap && !wrap.contains(e.target)) {
      document.getElementById("monthDropdownMenu")?.classList.add("hidden");
      document.getElementById("monthDropdownBtn")?.classList.remove("open");
      document.getElementById("monthDropdownBtn")?.setAttribute("aria-expanded", "false");
    }
  });

  window.selectCustomMonth = function (m) {
    document.getElementById("monthDropdownMenu")?.classList.add("hidden");
    document.getElementById("monthDropdownBtn")?.classList.remove("open");
    document.getElementById("monthDropdownBtn")?.setAttribute("aria-expanded", "false");
    const monthSelect = document.getElementById("monthFilterSelect");
    if (monthSelect) monthSelect.value = m;
    loadBootstrapData(m);
  };

  document.getElementById("monthFilterSelect")?.addEventListener("change", (e) => {
    loadBootstrapData(e.target.value);
  });

  // Global Search Toggle & Slide Animation
  const searchInput = document.getElementById("globalSearchInput");
  const searchSlideWrap = document.getElementById("searchSlideExpandWrap");
  const searchToggleBtn = document.getElementById("headerSearchToggleBtn");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  searchToggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!searchSlideWrap) return;
    const isHidden = searchSlideWrap.classList.contains("hidden");
    if (isHidden) {
      searchSlideWrap.classList.remove("hidden");
      searchInput?.focus();
    } else {
      searchSlideWrap.classList.add("hidden");
      document.getElementById("globalSearchDropdown")?.classList.add("hidden");
    }
  });

  clearSearchBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    handleGlobalSearch("");
    searchSlideWrap?.classList.add("hidden");
    document.getElementById("globalSearchDropdown")?.classList.add("hidden");
  });

  searchInput?.addEventListener("input", (e) => handleGlobalSearch(e.target.value));

  document.addEventListener("click", (e) => {
    const searchContainer = document.getElementById("headerSearchContainer");
    if (searchContainer && !searchContainer.contains(e.target)) {
      searchSlideWrap?.classList.add("hidden");
      document.getElementById("globalSearchDropdown")?.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && searchSlideWrap && !searchSlideWrap.classList.contains("hidden")) {
      searchSlideWrap.classList.add("hidden");
      document.getElementById("globalSearchDropdown")?.classList.add("hidden");
    }
  });

  // Native Date Pickers Default Handling
  function initNativeDatePickers() {
    document.querySelectorAll('.date-input-wrap input[type="date"], .date-custom-input').forEach((inputEl) => {
      if (!inputEl.value) {
        inputEl.value = getTodayDateString();
      }
    });
  }
  initNativeDatePickers();

  // Expanding Circle Controls in Expense Modal (Date, Notes)
  function initExpandingCircleControls() {
    const config = [
      { trigger: "expDateTriggerBtn", tray: "expDateTray" },
      { trigger: "expNotesTriggerBtn", tray: "expNotesTray" },
    ];

    config.forEach(({ trigger, tray }) => {
      const btn = document.getElementById(trigger);
      const trayEl = document.getElementById(tray);
      if (btn && trayEl) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isHidden = trayEl.classList.toggle("hidden");
          btn.classList.toggle("active", !isHidden);
          if (!isHidden) {
            const input = trayEl.querySelector("input");
            input?.focus();
          }
        });
      }
    });
  }
  initExpandingCircleControls();

  // Activity Tab Category Filter Event Listener
  document.getElementById("activityCategoryFilter")?.addEventListener("change", () => {
    renderActivityTab();
  });

  // Ambient Hover Glow Tracking on KPI Cards
  document.querySelectorAll(".ambient-glow-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--glow-x", `${x}px`);
      card.style.setProperty("--glow-y", `${y}px`);
    });
  });

  // Enhanced Command Palette (Ctrl + K)
  const paletteModal = document.getElementById("commandPaletteModal");
  const paletteInput = document.getElementById("paletteSearchInput");
  const paletteResults = document.getElementById("paletteResultsList");

  const COMMAND_ITEMS = [
    { title: "Dashboard Overview", action: () => switchTab("dashboard"), shortcut: "Tab 1", icon: "dashboard" },
    { title: "View Expenses Table", action: () => switchTab("expenses"), shortcut: "Tab 2", icon: "receipt_long" },
    { title: "Open Shopping List", action: () => switchTab("shopping"), shortcut: "Tab 3", icon: "shopping_bag" },
    { title: "Open Inventory Stock", action: () => switchTab("inventory"), shortcut: "Tab 4", icon: "inventory_2" },
    { title: "Manage Recurring Bills", action: () => switchTab("bills"), shortcut: "Tab 5", icon: "calendar_month" },
    { title: "Household Activity Log", action: () => switchTab("activity"), shortcut: "Tab 6", icon: "history" },
    { title: "Financial Reports", action: () => switchTab("reports"), shortcut: "Tab 7", icon: "bar_chart" },
    { title: "Add New Expense", action: () => openQuickAddModal("expense"), shortcut: "N", icon: "add_circle" },
    { title: "Add Recurring Bill", action: () => openQuickAddModal("bill"), shortcut: "B", icon: "event_repeat" },
    { title: "Add Inventory Item", action: () => openQuickAddModal("inventory"), shortcut: "S", icon: "post_add" },
    
  ];

  function renderPaletteCommands(query = "") {
    if (!paletteResults) return;
    const q = query.trim().toLowerCase();
    const cmdMatches = COMMAND_ITEMS.filter((item) =>
      item.title.toLowerCase().includes(q) || item.shortcut.toLowerCase().includes(q)
    );

    const dataResults = [];
    if (q && AppState.data) {
      (AppState.data.expenses || []).slice(0, 5).forEach((e) => {
        if (`${e.title} ${e.category} ${e.paid_by_name}`.toLowerCase().includes(q)) {
          dataResults.push({
            title: `Expense: ${e.title} (${formatPHP(e.amount)})`,
            shortcut: e.category || "Expense",
            icon: "receipt_long",
            action: () => switchTab("expenses"),
          });
        }
      });
      (AppState.data.inventory_items || []).slice(0, 5).forEach((i) => {
        if (i.item_name && i.item_name.toLowerCase().includes(q)) {
          dataResults.push({
            title: `Item: ${i.item_name} (Qty: ${i.quantity || 0})`,
            shortcut: i.status || "Stock",
            icon: "inventory_2",
            action: () => switchTab("inventory"),
          });
        }
      });
    }

    const filtered = [...cmdMatches, ...dataResults];

    if (filtered.length === 0) {
      paletteResults.innerHTML = `<div class="empty-state-card"><p class="empty-state-sub">No results matching "${escapeHtml(query)}"</p></div>`;
      return;
    }

    paletteResults.innerHTML = filtered
      .map(
        (cmd, idx) => `
      <div class="palette-item ${idx === 0 ? "active" : ""}" data-cmd-idx="${idx}" role="menuitem" tabindex="0">
        <div class="palette-item-left">
          <span class="material-symbols-rounded" style="color:#02007d;font-size:20px;">${cmd.icon}</span>
          <span class="palette-item-title">${escapeHtml(cmd.title)}</span>
        </div>
        <span class="palette-item-shortcut">${escapeHtml(cmd.shortcut)}</span>
      </div>
    `
      )
      .join("");

    paletteResults.querySelectorAll(".palette-item").forEach((itemEl, idx) => {
      itemEl.addEventListener("click", () => {
        closeModal("commandPaletteModal");
        filtered[idx].action();
      });
    });
  }

  paletteInput?.addEventListener("input", (e) => renderPaletteCommands(e.target.value));

  paletteInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const activeItem = paletteResults?.querySelector(".palette-item.active");
      if (activeItem) {
        activeItem.click();
      }
    }
  });

  // Keyboard Shortcuts: Ctrl+K for Command Palette, N for Quick Log
  document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      if (e.key === "Escape") {
        e.target.blur();
        closeModal("commandPaletteModal");
        searchSlideWrap?.classList.add("hidden");
        document.getElementById("globalSearchDropdown")?.classList.add("hidden");
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      renderPaletteCommands("");
      if (paletteInput) paletteInput.value = "";
      openModal("commandPaletteModal");
      setTimeout(() => paletteInput?.focus(), 80);
    } else if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      openQuickAddModal(null);
    }
  });

  // Swipeable Action Rows on Mobile / Tablet
  function initSwipeableActionRows() {
    let startX = 0;
    let currentX = 0;
    let activeRow = null;

    document.addEventListener("touchstart", (e) => {
      const row = e.target.closest(".tx-log-item, .inv-quick-item, .bill-row-item");
      if (!row) return;
      activeRow = row;
      startX = e.touches[0].clientX;
      currentX = startX;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      if (!activeRow) return;
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      if (diffX < 0 && diffX > -100) {
        activeRow.style.transform = `translateX(${diffX}px)`;
        activeRow.style.transition = "none";
      }
    }, { passive: true });

    document.addEventListener("touchend", () => {
      if (!activeRow) return;
      const diffX = currentX - startX;
      activeRow.style.transition = "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
      if (diffX < -50) {
        activeRow.style.transform = "translateX(-8px)";
        setTimeout(() => {
          if (activeRow) activeRow.style.transform = "translateX(0)";
        }, 600);
      } else {
        activeRow.style.transform = "translateX(0)";
      }
      activeRow = null;
    });
  }
  initSwipeableActionRows();

  // Registered Companies Collapsible Toggle via Apartment Icon Button
  const compCollapseBtn = document.getElementById("companyListCollapseToggleBtn");
  const compContainer = document.getElementById("companyListContainer");
  compCollapseBtn?.addEventListener("click", () => {
    if (!compContainer) return;
    const isCollapsed = compContainer.classList.toggle("collapsed");
    compCollapseBtn.classList.toggle("is-collapsed", isCollapsed);
    compCollapseBtn.setAttribute("title", isCollapsed ? "Expand Registered Companies" : "Collapse Registered Companies");
  });

  // KPI Cards Detailed Modal & Tab Switches
  document.getElementById("kpiCardExpenses")?.addEventListener("click", () => showKpiDetailModal("expenses"));
  document.getElementById("kpiCardDailyAvg")?.addEventListener("click", () => showKpiDetailModal("daily_avg"));
  document.getElementById("kpiCardTopCategory")?.addEventListener("click", () => showKpiDetailModal("top_category"));
  document.getElementById("kpiCardProjected")?.addEventListener("click", () => showKpiDetailModal("projected"));
  document.getElementById("kpiCardBills")?.addEventListener("click", () => switchTab("bills"));
  document.getElementById("notifBellBtn")?.addEventListener("click", () => openNotificationsModal());
  document.getElementById("kpiCardPantry")?.addEventListener("click", (e) => {
    if (e.target.closest(".kpi-card-collapse-btn")) return;
    switchTab("shopping");
  });

  // Feature 1: Bill Push Reminders & Calendar Export
  document.getElementById("billsPushReminderBtn")?.addEventListener("click", () => requestBillPushNotifications(true));
  document.getElementById("billsExportIcsBtn")?.addEventListener("click", () => handleCalendarAction());
  syncBillActionButtons();

  // Feature 3: In-Store Shopping Checklist Mode
  document.getElementById("toggleShoppingTripModeBtn")?.addEventListener("click", toggleShoppingTripMode);
  document.getElementById("tripAddItemBtn")?.addEventListener("click", () => openQuickAddModal("inventory"));
  document.getElementById("btnFinishShoppingTrip")?.addEventListener("click", finishShoppingTripAndLog);
  document.getElementById("btnExitShoppingTrip")?.addEventListener("click", () => exitShoppingTripMode());

  // Quick Add FAB & Direct Form Triggers
  document.getElementById("fabQuickAddBtn")?.addEventListener("click", () => openQuickAddModal(null));
  document.getElementById("fabHomeBtn")?.addEventListener("click", () => switchTab("dashboard"));
  document.getElementById("headerHomeBtn")?.addEventListener("click", () => switchTab("dashboard"));
  document.getElementById("viewAddExpenseBtn")?.addEventListener("click", () => openQuickAddModal("expense"));
  document.getElementById("dashAddBillBtn")?.addEventListener("click", () => openQuickAddModal("bill"));
  document.getElementById("viewAddBillBtn")?.addEventListener("click", () => openQuickAddModal("bill"));
  document.getElementById("viewCompanyDetailsBtn")?.addEventListener("click", () => openCompanyDetailsModal());
  document.getElementById("dashAddInventoryBtn")?.addEventListener("click", () => openQuickAddModal("inventory"));
  document.getElementById("viewAddInventoryBtn")?.addEventListener("click", () => openQuickAddModal("inventory"));
  document.getElementById("viewAddShoppingItemBtn")?.addEventListener("click", () => openQuickAddModal("inventory"));
  document.getElementById("fabSearchBtn")?.addEventListener("click", () => {
    const paletteInput = document.getElementById("paletteSearchInput");
    renderPaletteCommands("");
    if (paletteInput) paletteInput.value = "";
    openModal("commandPaletteModal");
    setTimeout(() => paletteInput?.focus(), 80);
  });

  document.querySelectorAll("#quickAddModeTabs .q-tab").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      const targetMode = tabBtn.getAttribute("data-qmode");
      switchQuickAddMode(targetMode);
    });
  });

  document.getElementById("backToKpiCardsBtn")?.addEventListener("click", () => {
    switchQuickAddMode(null);
  });

  document.getElementById("modalHeaderBackBtn")?.addEventListener("click", () => {
    switchQuickAddMode(null);
  });

  // Auto-Detection of Category when Typing Item & Auto-Expand for New Items
  syncAllCategoryAutoSelectors();

  document.getElementById("expTitle")?.addEventListener("input", (e) => {
    const val = (e.target.value || "").trim();
    const catEl = document.getElementById("expCategory");
    const displayEl = document.getElementById("expCategoryDisplay");
    const detected = detectCategoryFromItem(val, "");

    if (detected) {
      if (catEl) catEl.value = detected;
      if (displayEl) displayEl.textContent = detected;
      setExpenseCategoryEditMode(false);
    }

    if (val.toLowerCase() === "house (6k)") {
      const amtEl = document.getElementById("expAmount");
      if (amtEl && !amtEl.value) amtEl.value = "6000";
    }
  });

  // Expense Category Edit Controls (Toggles input box replacing text itself)
  document.getElementById("toggleExpCatEditBtn")?.addEventListener("click", () => {
    const inputEl = document.getElementById("expCategory");
    const isCurrentlyEditing = inputEl && !inputEl.classList.contains("hidden");
    setExpenseCategoryEditMode(!isCurrentlyEditing);
  });

  document.getElementById("expCategory")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setExpenseCategoryEditMode(false);
    }
  });

  document.getElementById("expCategory")?.addEventListener("change", (e) => {
    const val = e.target.value.trim();
    const displayEl = document.getElementById("expCategoryDisplay");
    if (displayEl && val) displayEl.textContent = val;
    const titleVal = (document.getElementById("expTitle")?.value || "").trim();
    if (val && titleVal) {
      saveCustomItemCategory(titleVal, val);
      showToast(`Category set to "${val}" for ${titleVal}`);
    }
  });

  document.getElementById("expCategory")?.addEventListener("blur", () => {
    const inputEl = document.getElementById("expCategory");
    const displayEl = document.getElementById("expCategoryDisplay");
    if (inputEl && displayEl) {
      const val = inputEl.value.trim() || "Essential";
      inputEl.value = val;
      displayEl.textContent = val;
    }
  });

  document.getElementById("billNameInput")?.addEventListener("input", (e) => {
    const val = e.target.value;
    const catEl = document.getElementById("billCategoryInput");
    if (catEl) {
      catEl.value = detectCategoryFromItem(val, "Bills");
    }
    if (val.trim().toLowerCase() === "house (6k)") {
      const amtEl = document.getElementById("billAmountInput");
      if (amtEl && !amtEl.value) amtEl.value = "6000";
    }
  });

  document.getElementById("invNameInput")?.addEventListener("input", (e) => {
    const val = (e.target.value || "").trim();
    const catEl = document.getElementById("invCategorySelect");
    const displayEl = document.getElementById("invCategoryDisplay");
    const detected = detectCategoryFromItem(val, "");

    if (detected) {
      if (catEl) catEl.value = detected;
      if (displayEl) displayEl.textContent = detected;
      setInventoryCategoryEditMode(false);
    }
  });

  // Inventory Category Edit Controls (Toggles input box replacing text itself)
  document.getElementById("toggleInvCatEditBtn")?.addEventListener("click", () => {
    const inputEl = document.getElementById("invCategorySelect");
    const isCurrentlyEditing = inputEl && !inputEl.classList.contains("hidden");
    setInventoryCategoryEditMode(!isCurrentlyEditing);
  });

  document.getElementById("invCategorySelect")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setInventoryCategoryEditMode(false);
    }
  });

  document.getElementById("invCategorySelect")?.addEventListener("change", (e) => {
    const val = e.target.value.trim();
    const displayEl = document.getElementById("invCategoryDisplay");
    if (displayEl && val) displayEl.textContent = val;
    const nameVal = (document.getElementById("invNameInput")?.value || "").trim();
    if (val && nameVal) {
      saveCustomItemCategory(nameVal, val);
      showToast(`Category set to "${val}" for ${nameVal}`);
    }
  });

  document.getElementById("invCategorySelect")?.addEventListener("blur", () => {
    const inputEl = document.getElementById("invCategorySelect");
    const displayEl = document.getElementById("invCategoryDisplay");
    if (inputEl && displayEl) {
      const val = inputEl.value.trim() || "Essential";
      inputEl.value = val;
      displayEl.textContent = val;
    }
  });

  // Inventory Stock Stepper & Auto-Computed Stock Status (Low / Medium / High)
  syncInventoryStockStatus();

  document.getElementById("invUnitInput")?.addEventListener("input", () => {
    syncInventoryStockStatus();
  });

  document.getElementById("invUnitInput")?.addEventListener("change", () => {
    const unitInp = document.getElementById("invUnitInput");
    if (unitInp) {
      let val = parseInt(unitInp.value, 10);
      if (isNaN(val) || val < 0) val = 0;
      unitInp.value = String(val);
    }
    syncInventoryStockStatus();
  });

  document.getElementById("invStockDecBtn")?.addEventListener("click", () => {
    const unitInp = document.getElementById("invUnitInput");
    if (!unitInp) return;
    let val = parseInt(unitInp.value, 10);
    if (isNaN(val)) val = 1;
    val = Math.max(0, val - 1);
    unitInp.value = String(val);
    syncInventoryStockStatus();
  });

  document.getElementById("invStockIncBtn")?.addEventListener("click", () => {
    const unitInp = document.getElementById("invUnitInput");
    if (!unitInp) return;
    let val = parseInt(unitInp.value, 10);
    if (isNaN(val)) val = 0;
    val = val + 1;
    unitInp.value = String(val);
    syncInventoryStockStatus();
  });

  // Expense Quantity Stepper
  document.getElementById("expQtyDecBtn")?.addEventListener("click", () => {
    const qtyInp = document.getElementById("expQuantity");
    if (!qtyInp) return;
    let val = parseInt(qtyInp.value, 10);
    if (isNaN(val)) val = 1;
    val = Math.max(1, val - 1);
    qtyInp.value = String(val);
  });

  document.getElementById("expQtyIncBtn")?.addEventListener("click", () => {
    const qtyInp = document.getElementById("expQuantity");
    if (!qtyInp) return;
    let val = parseInt(qtyInp.value, 10);
    if (isNaN(val)) val = 1;
    val = val + 1;
    qtyInp.value = String(val);
  });

  document.getElementById("expQuantity")?.addEventListener("change", () => {
    const qtyInp = document.getElementById("expQuantity");
    if (qtyInp) {
      let val = parseInt(qtyInp.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      qtyInp.value = String(val);
    }
  });

  // Notes prefix icon click to focus input
  document.getElementById("toggleNotesBtn")?.addEventListener("click", () => {
    document.getElementById("expNotes")?.focus();
  });

  // Recurring Bill Date input sync
  document.getElementById("billDueDayInput")?.addEventListener("change", () => {
    syncBillDueDateButtonLabel();
  });

  document.getElementById("billDueDayInput")?.addEventListener("input", () => {
    syncBillDueDateButtonLabel();
  });

  // Submit Form A: Expense Form
  document.getElementById("expenseForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const expId = document.getElementById("expenseIdInput").value;
    const formData = new FormData(e.target);
    const logPriceChecked = Boolean(document.getElementById("expLogPriceHistory")?.checked);
    formData.set("log_price_history", logPriceChecked ? "1" : "0");

    const url = expId ? `/api/expenses/${expId}` : "/api/expenses";
    const method = expId ? "PUT" : "POST";

    const res = await fetch(url, { method, body: formData });
    if (res.ok) {
      closeModal("expenseModal");
      showToast(expId ? "Expense updated" : "Expense saved");
      await loadBootstrapData();
    } else {
      const err = await res.json();
      showToast(err.error || "Could not save expense");
    }
  });

  // Submit Form B: Recurring Bill Form
  document.getElementById("billForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const billId = document.getElementById("billIdInput").value;
    const dueRaw = (document.getElementById("billDueDayInput").value || "").trim();
    if (!dueRaw) {
      document.getElementById("billDueDayInput")?.focus();
      showToast("Select a date");
      return;
    }
    const parsedDueDay = dueRaw.includes("-")
      ? parseInt(dueRaw.split("-")[2], 10)
      : parseInt(dueRaw, 10);

    const billName = (document.getElementById("billNameInput").value || "").trim();
    if (!billName) return;

    // Prevent duplicate recurring bill name
    const existingBills = (AppState.data && AppState.data.recurring_bills) || [];
    const isDupBill = existingBills.some(
      (b) => b.bill_name.trim().toLowerCase() === billName.toLowerCase() && String(b.id) !== String(billId)
    );
    if (isDupBill) {
      showToast(`Recurring bill "${billName}" already exists`);
      return;
    }

    const compSelect = document.getElementById("billCompanySelect");
    const payload = {
      bill_name: billName,
      company_name: compSelect ? compSelect.value.trim() : "",
      category: document.getElementById("billCategoryInput").value || "Bills",
      default_amount: parseFloat(document.getElementById("billAmountInput").value),
      due_day: parsedDueDay || 1,
      last_paid_month: document.getElementById("billLastPaidInput").value || "",
    };

    const url = billId ? `/api/bills/${billId}` : "/api/bills";
    const method = billId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      closeModal("expenseModal");
      showToast(billId ? "Recurring bill updated" : "Recurring bill saved");
      await loadBootstrapData();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Could not save recurring bill");
    }
  });

  // Company Details Modal Form & Controls
  document.getElementById("companyCancelEditBtn")?.addEventListener("click", () => {
    cancelCompanyEdit();
  });

  document.getElementById("companyEditSelectBtn")?.addEventListener("click", () => {
    toggleCompanySelectMode();
  });

  document.getElementById("companyLogoInput")?.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    const previewImg = document.getElementById("companyLogoPreviewImg");
    const emptyState = document.getElementById("companyLogoEmptyState") || document.getElementById("companyLogoDefaultIcon");
    if (file && previewImg) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        previewImg.src = evt.target.result;
        previewImg.classList.remove("hidden");
        if (emptyState) emptyState.classList.add("hidden");
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById("companyDetailsForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editId = (document.getElementById("companyEditIdInput")?.value || "").trim();
    const name = (document.getElementById("companyNameInput")?.value || "").trim();
    if (!name) {
      document.getElementById("companyNameInput")?.focus();
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    const fileInput = document.getElementById("companyLogoInput");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append("logo_file", fileInput.files[0]);
    }

    const url = editId ? `/api/companies/${editId}` : "/api/companies";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, { method, body: formData });
    const result = await res.json().catch(() => ({}));
    if (res.ok) {
      showToast(editId ? "Company details updated" : "Company registered");
      cancelCompanyEdit();
      await loadBootstrapData();
      renderCompanyList();
      populateBillCompanySelect();
    } else {
      showToast(result.error || "Could not save company");
    }
  });

  // Custom Company Dropdown Toggle & Close
  const compBtn = document.getElementById("billCompanySelectBtn");
  const compMenu = document.getElementById("billCompanySelectMenu");
  compBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!compMenu) return;
    const isClosed = compMenu.classList.contains("hidden");
    if (isClosed) {
      compMenu.classList.remove("hidden");
      compBtn.classList.add("open");
      compBtn.setAttribute("aria-expanded", "true");
    } else {
      compMenu.classList.add("hidden");
      compBtn.classList.remove("open");
      compBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#billCompanySelectWrap")) {
      document.getElementById("billCompanySelectMenu")?.classList.add("hidden");
      document.getElementById("billCompanySelectBtn")?.classList.remove("open");
      document.getElementById("billCompanySelectBtn")?.setAttribute("aria-expanded", "false");
    }
  });

  document.getElementById("billCompanySelect")?.addEventListener("change", (e) => {
    const selectedVal = e.target.value;
    const billNameInput = document.getElementById("billNameInput");
    if (selectedVal && billNameInput && (!billNameInput.value || billNameInput.value.trim() === "")) {
      billNameInput.value = selectedVal;
    }
  });

  // Submit Form C: Inventory Item Form
  document.getElementById("inventoryForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const itemId = document.getElementById("invIdInput").value;
    const itemName = (document.getElementById("invNameInput").value || "").trim();
    if (!itemName) return;

    // Prevent duplicate inventory item name
    const existingItems = (AppState.data && AppState.data.inventory_items) || [];
    const isDupItem = existingItems.some(
      (i) => i.item_name.trim().toLowerCase() === itemName.toLowerCase() && String(i.id) !== String(itemId)
    );
    if (isDupItem) {
      showToast(`Shopping item "${itemName}" already exists`);
      return;
    }

    const itemCat = (document.getElementById("invCategorySelect")?.value || "").trim() || "Essential";
    if (itemName && itemCat) {
      saveCustomItemCategory(itemName, itemCat);
    }
    const payload = {
      item_name: itemName,
      category: itemCat,
      unit: document.getElementById("invUnitInput").value,
      status: document.getElementById("invStatusInput").value,
      last_price: parseFloat(document.getElementById("invPriceInput").value || 0),
      preferred_store: document.getElementById("invStoreInput").value,
    };

    const url = itemId ? `/api/inventory/${itemId}` : "/api/inventory";
    const method = itemId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      closeModal("expenseModal");
      showToast(itemId ? "Shopping item updated" : "Shopping item saved");
      await loadBootstrapData();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Could not save shopping item");
    }
  });



  // Submit Convert Shopping Item to Expense Form
  document.getElementById("convertShoppingForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const itemId = document.getElementById("convertItemId").value;
    const formData = new FormData(e.target);

    const res = await fetch(`/api/inventory/${itemId}/convert-to-expense`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (res.ok) {
      closeModal("convertShoppingModal");
      showToast(result.message ? "Item converted to expense and restocked" : "Item converted to expense");
      await loadBootstrapData();
    } else {
      showToast(result.error || "Could not convert item");
    }
  });

  // Update Profile Modal & Form (Settings)
  document.getElementById("openMembersModalBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    openProfileModal();
  });
  document.getElementById("sidebarProfileCard")?.addEventListener("click", openProfileModal);

  document.getElementById("profilePhotoInput")?.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    const previewImg = document.getElementById("profilePhotoPreviewImg");
    const defaultAvatar = document.getElementById("profilePhotoDefaultAvatar");
    if (file && previewImg && defaultAvatar) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewImg.src = ev.target.result;
        previewImg.classList.remove("hidden");
        defaultAvatar.classList.add("hidden");
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById("saveProfileBtn")?.addEventListener("click", (e) => {
    if (!isProfileEditMode) {
      e.preventDefault();
      setProfileModalMode(true);
      document.getElementById("profileNameInput")?.focus();
    }
  });

  document.getElementById("profileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await fetch("/api/profile", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (res.ok) {
      if (result.settings) {
        AppState.data.settings = result.settings;
      }
      showToast("Profile updated");
      await loadBootstrapData();
      setProfileModalMode(false);
    } else {
      showToast(result.error || "Could not update profile");
    }
  });

  // Export PDF Button (Activity + Reports Tab)
  document.getElementById("activityExportPdfBtn")?.addEventListener("click", exportMonthlyPDF);
  document.getElementById("quickExportPdfBtn")?.addEventListener("click", exportMonthlyPDF);
  document.getElementById("reportExportPdfBtn")?.addEventListener("click", exportMonthlyPDF);
});

// ==========================================
// PWA SERVICE WORKER & OFFLINE DETECTION
// ==========================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.log("FamBam Service Worker registration:", err);
    });
  });
}

function updateOnlineStatus() {
  const badge = document.getElementById("pwaOfflineBadge");
  if (badge) {
    if (!navigator.onLine) {
      badge.classList.remove("hidden");
      showToast("Offline Mode: Browsing cached household records");
    } else {
      if (!badge.classList.contains("hidden")) {
        badge.classList.add("hidden");
        showToast("Back online! Synchronizing data...");
        loadBootstrapData();
      }
    }
  }
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// ==========================================
// PWA INSTALL / DOWNLOAD FAMBAM APP
// ==========================================
let deferredInstallPrompt = null;

function checkPwaInstallState() {
  const isInstalled =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    localStorage.getItem("fambam_app_installed") === "true";

  const wrap = document.getElementById("sidebarDownloadWrap");
  if (wrap) {
    if (isInstalled) {
      wrap.classList.add("hidden");
    } else {
      wrap.classList.remove("hidden");
    }
  }
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  checkPwaInstallState();
});

window.addEventListener("appinstalled", () => {
  try {
    localStorage.setItem("fambam_app_installed", "true");
  } catch (e) {}
  checkPwaInstallState();
  showToast("FamBam App has been downloaded!");
});

async function triggerPwaDownload() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === "accepted") {
      try {
        localStorage.setItem("fambam_app_installed", "true");
      } catch (e) {}
      checkPwaInstallState();
      showToast("FamBam App downloaded successfully!");
    }
    deferredInstallPrompt = null;
  } else {
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    if (isIos) {
      showToast("To download FamBam: tap Share in Safari, then 'Add to Home Screen'");
    } else {
      showToast("To download: tap browser menu (⋮) and select 'Install app'");
    }
  }
}

// ==========================================
// BILL DUE DATE PUSH & CALENDAR REMINDERS
// ==========================================
function generateIcsContent(events) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FamBam//Household Finance//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  events.forEach((ev) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:fambam-${ev.id}-${Date.now()}@fambam.local`);
    lines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
    lines.push(`DTSTART;VALUE=DATE:${ev.startDate}`);
    lines.push(`SUMMARY:${ev.summary}`);
    lines.push(`DESCRIPTION:${ev.description}`);
    if (ev.rrule) lines.push(`RRULE:${ev.rrule}`);
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:Reminder: ${ev.summary}`);
    lines.push("TRIGGER:-P1D");
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function formatIcsDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function downloadIcsFile(filename, content) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.downloadSingleBillIcs = function (billId) {
  const bill = (AppState.data?.recurring_bills || []).find((b) => b.id === billId);
  if (!bill) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const dueDay = String(bill.due_day || 1).padStart(2, "0");
  const startDate = `${year}${month}${dueDay}`;

  const event = {
    id: bill.id,
    startDate,
    summary: `[FamBam] ${bill.bill_name} Due (₱${formatMoney(bill.default_amount)})`,
    description: `Monthly recurring bill for ${bill.bill_name}. Amount: ₱${formatMoney(bill.default_amount)}. Category: ${bill.category}. Logged via FamBam.`,
    rrule: `FREQ=MONTHLY;BYMONTHDAY=${bill.due_day || 1}`,
  };

  const ics = generateIcsContent([event]);
  const safeName = (bill.bill_name || "bill").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  downloadIcsFile(`${safeName}_reminder.ics`, ics);
  showToast(`Downloaded calendar reminder for ${bill.bill_name}`);
};

window.downloadAllBillsIcs = function () {
  const bills = AppState.data?.recurring_bills || [];
  if (bills.length === 0) {
    showToast("No recurring bills to export to calendar.");
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const events = bills.map((b) => {
    const dueDay = String(b.due_day || 1).padStart(2, "0");
    return {
      id: b.id,
      startDate: `${year}${month}${dueDay}`,
      summary: `[FamBam] ${b.bill_name} Due (₱${formatMoney(b.default_amount)})`,
      description: `Monthly recurring bill for ${b.bill_name}. Amount: ₱${formatMoney(b.default_amount)}. Category: ${b.category}. Logged via FamBam.`,
      rrule: `FREQ=MONTHLY;BYMONTHDAY=${b.due_day || 1}`,
    };
  });

  const ics = generateIcsContent(events);
  downloadIcsFile("fambam_recurring_bills.ics", ics);
  showToast(`Downloaded ${bills.length} recurring bill reminders for Calendar`);
};

window.requestBillPushNotifications = async function (explicitUserClick = true) {
  if (!("Notification" in window)) {
    if (explicitUserClick) showToast("Browser push notifications are not supported.");
    return;
  }

  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      if (explicitUserClick) showToast("Notification permission was denied.");
      return;
    }
  } else if (Notification.permission === "denied") {
    if (explicitUserClick) showToast("Notifications are blocked in browser site settings.");
    return;
  }

  // Once clicked and agreed to allow push notifications, remove text & change to icon only
  localStorage.setItem("fambam_push_agreed", "true");
  syncBillActionButtons();
  checkDueBillsAndNotify(explicitUserClick);
};

window.handleCalendarAction = function () {
  const isAgreed = localStorage.getItem("fambam_calendar_agreed") === "true";
  if (!isAgreed) {
    openConfirmModal({
      title: "Allow Calendar Reminders?",
      message: "Sync and download your recurring bills to your calendar (.ics).",
      confirmText: "Allow calendar",
      onConfirm: () => {
        localStorage.setItem("fambam_calendar_agreed", "true");
        syncBillActionButtons();
        downloadAllBillsIcs();
      },
    });
  } else {
    downloadAllBillsIcs();
  }
};

function syncBillActionButtons() {
  const pushBtn = document.getElementById("billsPushReminderBtn");
  const pushText = document.getElementById("billsPushReminderText");
  const isPushAllowed =
    ("Notification" in window && Notification.permission === "granted") ||
    localStorage.getItem("fambam_push_agreed") === "true";

  if (isPushAllowed) {
    if (pushText) pushText.remove();
    if (pushBtn) {
      pushBtn.classList.add("btn-icon-only");
      pushBtn.setAttribute("title", "Due Date Push Alerts Active");
      pushBtn.setAttribute("aria-label", "Due Date Push Alerts Active");
    }
  }

  const calBtn = document.getElementById("billsExportIcsBtn");
  const calText = document.getElementById("billsCalendarText");
  const isCalAllowed = localStorage.getItem("fambam_calendar_agreed") === "true";

  if (isCalAllowed) {
    if (calText) calText.remove();
    if (calBtn) {
      calBtn.classList.add("btn-icon-only");
      calBtn.setAttribute("title", "Export Bills to Calendar (.ics)");
      calBtn.setAttribute("aria-label", "Export Bills to Calendar");
    }
  }
}

function checkDueBillsAndNotify(explicitCheck = false) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const bills = AppState.data?.recurring_bills || [];
  const now = new Date();
  const currentDay = now.getDate();

  const dueSoon = bills.filter((b) => {
    if (b.is_paid_current_month) return false;
    const diff = (b.due_day || 1) - currentDay;
    return diff >= 0 && diff <= 3;
  });

  if (dueSoon.length > 0) {
    dueSoon.forEach((b) => {
      const diff = (b.due_day || 1) - currentDay;
      const dueLabel = diff === 0 ? "DUE TODAY" : `due in ${diff} day(s)`;
      try {
        new Notification(`FamBam Bill Alert: ${b.bill_name}`, {
          body: `₱${formatMoney(b.default_amount)} is ${dueLabel} (Day ${b.due_day} of month).`,
          icon: "/static/icons/icon-192.png",
        });
      } catch (e) {
        console.log("Notification error:", e);
      }
    });
    if (explicitCheck) {
      showToast(`Push reminder sent for ${dueSoon.length} upcoming bill(s).`);
    }
  } else if (explicitCheck) {
    showToast("All recurring bills are up to date! Push alerts active.");
  }
}

// ==========================================
// IN-STORE SHOPPING CHECKLIST MODE
// ==========================================
let ShoppingTripState = {
  active: false,
  items: [],
};

window.toggleShoppingTripMode = function () {
  if (ShoppingTripState.active) {
    exitShoppingTripMode();
  } else {
    enterShoppingTripMode();
  }
};

window.enterShoppingTripMode = function () {
  ShoppingTripState.active = true;
  const container = document.getElementById("shoppingTripModeContainer");
  const layout = document.getElementById("shoppingStandardLayout");
  const btnText = document.getElementById("shoppingTripModeBtnText");
  const topAddItemBtn = document.getElementById("viewAddShoppingItemBtn");
  if (container) container.classList.remove("hidden");
  if (layout) layout.classList.add("hidden");
  if (btnText) btnText.textContent = "Exit Trip";
  if (topAddItemBtn) topAddItemBtn.classList.add("hidden");

  const invItems = AppState.data?.inventory_items || [];
  const lowItems = invItems.filter(
    (i) => (i.status || "").toLowerCase() === "low" || (i.status || "").toLowerCase() === "out of stock"
  );
  const sourceItems = lowItems.length > 0 ? lowItems : invItems;
  const priceComp = AppState.data?.price_comparison || [];

  ShoppingTripState.items = sourceItems.map((item) => {
    const comp = priceComp.find((p) => (p.item_name || "").toLowerCase() === (item.item_name || "").toLowerCase());
    const estPrice = comp ? comp.cheapest_price : 0;
    return {
      id: item.id,
      item_name: item.item_name,
      category: item.category || "Essential",
      unit: item.unit || "1",
      checked: false,
      price: estPrice > 0 ? estPrice : 50.0,
    };
  });

  renderShoppingTripItems();
  updateTripCartSummary();
};

window.exitShoppingTripMode = function () {
  ShoppingTripState.active = false;
  const container = document.getElementById("shoppingTripModeContainer");
  const layout = document.getElementById("shoppingStandardLayout");
  const btnText = document.getElementById("shoppingTripModeBtnText");
  const topAddItemBtn = document.getElementById("viewAddShoppingItemBtn");
  if (container) container.classList.add("hidden");
  if (layout) layout.classList.remove("hidden");
  if (btnText) btnText.textContent = "Trip Mode";
  if (topAddItemBtn) topAddItemBtn.classList.remove("hidden");
};

function renderShoppingTripItems() {
  const container = document.getElementById("tripChecklistItems");
  if (!container) return;

  if (ShoppingTripState.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <p class="empty-state-title">No items in checklist</p>
        <p class="empty-state-sub">Add pantry items to your inventory to start an in-store checklist trip.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = ShoppingTripState.items
    .map(
      (item) => `
    <div class="trip-check-card ${item.checked ? "checked" : ""}" onclick="toggleTripItemChecked(${item.id})">
      <div class="trip-check-left">
        <div class="trip-checkbox">
          ${
            item.checked
              ? `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          `
              : ""
          }
        </div>
        <div class="trip-check-info">
          <span class="trip-item-title">${escapeHtml(item.item_name)}</span>
          <span class="trip-item-meta">${escapeHtml(item.category)} • Stock: ${escapeHtml(item.unit)}</span>
        </div>
      </div>
      <div class="trip-check-right" onclick="event.stopPropagation()">
        <div class="trip-price-input-wrap">
          <span class="trip-price-prefix">₱</span>
          <input type="number" step="0.01" min="0" class="trip-price-input" value="${Number(item.price).toFixed(2)}" oninput="updateTripItemPrice(${item.id}, this.value)" aria-label="Item Price" />
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

window.toggleTripItemChecked = function (itemId) {
  const item = ShoppingTripState.items.find((i) => i.id === itemId);
  if (!item) return;
  item.checked = !item.checked;
  renderShoppingTripItems();
  updateTripCartSummary();
};

window.updateTripItemPrice = function (itemId, val) {
  const item = ShoppingTripState.items.find((i) => i.id === itemId);
  if (!item) return;
  const num = parseFloat(val);
  item.price = isNaN(num) || num < 0 ? 0 : num;
  updateTripCartSummary();
};

function updateTripCartSummary() {
  const totalItems = ShoppingTripState.items.length;
  const checkedItems = ShoppingTripState.items.filter((i) => i.checked);
  const cartCountEl = document.getElementById("tripCartCount");
  const cartTotalEl = document.getElementById("tripCartTotal");

  const totalSum = checkedItems.reduce((acc, curr) => acc + Number(curr.price || 0), 0);

  if (cartCountEl) cartCountEl.textContent = `${checkedItems.length} / ${totalItems}`;
  if (cartTotalEl) cartTotalEl.textContent = formatPHP(totalSum);
}

window.finishShoppingTripAndLog = async function () {
  const checkedItems = ShoppingTripState.items.filter((i) => i.checked);
  if (checkedItems.length === 0) {
    showToast("Please check at least one item put in your cart.");
    return;
  }

  const totalSum = checkedItems.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const itemNames = checkedItems.map((i) => i.item_name).join(", ");

  // Pre-fill and open quick add expense modal
  openQuickAddModal("expense");
  const titleInput = document.getElementById("expTitle");
  const amountInput = document.getElementById("expAmount");
  const notesInput = document.getElementById("expNotes");
  const catInput = document.getElementById("expCategory");
  const catDisplay = document.getElementById("expCategoryDisplay");

  if (titleInput) titleInput.value = "In-Store Grocery Trip";
  if (amountInput) amountInput.value = totalSum.toFixed(2);
  if (notesInput) notesInput.value = `Bought in-store: ${itemNames}`;
  if (catInput) catInput.value = "Essential";
  if (catDisplay) catDisplay.textContent = "Essential";

  exitShoppingTripMode();
  showToast(`Trip total: ${formatPHP(totalSum)} (${checkedItems.length} items). Please review & save expense.`);
};

// ==========================================
// EXPENSE FULL DETAILS MODAL
// ==========================================
window.openExpenseDetailsModal = function (expenseId) {
  const exp = (AppState.data?.expenses || []).find((e) => e.id === expenseId);
  if (!exp) return;

  const modal = document.getElementById("expenseDetailsModal");
  const bodyEl = document.getElementById("expenseDetailsModalBody");
  if (!modal || !bodyEl) return;

  const qty = exp.quantity || 1;
  const unitPrice = qty > 1 ? formatPHP(exp.amount / qty) : formatPHP(exp.amount);

  bodyEl.innerHTML = `
    <div class="report-summary-grid">
      <div class="report-stat-box">
        <div class="kpi-label">Item / Name</div>
        <div class="kpi-value" style="font-size:1.05rem; font-weight:700;">${escapeHtml(exp.title)}</div>
      </div>
      <div class="report-stat-box">
        <div class="kpi-label">Category</div>
        <div class="kpi-value" style="font-size:0.95rem;">
          <span class="status-badge badge-slate" style="font-size:0.85rem; padding:0.25rem 0.65rem; border-radius:6px; display:inline-block;">${escapeHtml(exp.category || "Miscellaneous")}</span>
        </div>
      </div>
    </div>
    <div class="report-summary-grid">
      <div class="report-stat-box">
        <div class="kpi-label">Date of Purchase</div>
        <div class="kpi-value" style="font-size:0.98rem; letter-spacing:0.04em;">${escapeHtml(exp.date_incurred)}</div>
      </div>
      <div class="report-stat-box">
        <div class="kpi-label">Total Amount</div>
        <div class="kpi-value" style="font-size:1.1rem; color:#4d8bf5; font-weight:700; letter-spacing:0.04em;">${formatPHP(exp.amount)}</div>
      </div>
    </div>
    <div class="report-summary-grid">
      <div class="report-stat-box">
        <div class="kpi-label">Quantity</div>
        <div class="kpi-value" style="font-size:0.98rem; letter-spacing:0.04em;">${escapeHtml(qty)}</div>
      </div>
      <div class="report-stat-box">
        <div class="kpi-label">Price of Item (Per Unit)</div>
        <div class="kpi-value" style="font-size:0.98rem; letter-spacing:0.04em;">${unitPrice}</div>
      </div>
    </div>
    ${
      exp.store_name || exp.paid_by_name
        ? `
    <div class="report-summary-grid">
      ${
        exp.store_name
          ? `<div class="report-stat-box">
              <div class="kpi-label">Store / Merchant</div>
              <div class="kpi-value" style="font-size:0.95rem;">${escapeHtml(exp.store_name)}</div>
            </div>`
          : ""
      }
      ${
        exp.paid_by_name
          ? `<div class="report-stat-box">
              <div class="kpi-label">Paid By</div>
              <div class="kpi-value" style="font-size:0.95rem;">${escapeHtml(exp.paid_by_name)}</div>
            </div>`
          : ""
      }
    </div>
    `
        : ""
    }
    ${
      exp.notes
        ? `<div class="report-stat-box" style="margin-top:0.35rem;">
            <div class="kpi-label">Notes</div>
            <div class="kpi-value" style="font-size:0.88rem; font-weight:normal; color:var(--text-secondary); margin-top:0.2rem;">${escapeHtml(exp.notes)}</div>
          </div>`
        : ""
    }
    <div class="report-stat-box" style="margin-top:0.35rem;">
      <div class="kpi-label">Receipt</div>
      <div style="margin-top: 0.45rem;">
        ${
          exp.receipt_path
            ? `<div style="display:flex; align-items:center; gap:0.75rem;">
                 <img src="${escapeHtml(exp.receipt_path)}" alt="Receipt thumbnail" style="width:56px; height:56px; object-fit:cover; border-radius:8px; cursor:pointer;" onclick="previewReceipt('${escapeHtml(exp.receipt_path)}', '${escapeHtml(exp.title)}')" />
                 <button type="button" class="btn-secondary btn-sm" onclick="previewReceipt('${escapeHtml(exp.receipt_path)}', '${escapeHtml(exp.title)}')">View Full Receipt</button>
               </div>`
            : `<span class="kpi-subtext">No receipt attached</span>`
        }
      </div>
    </div>
  `;

  const editBtn = document.getElementById("expenseDetailsEditBtn");
  if (editBtn) {
    editBtn.onclick = () => {
      closeModal("expenseDetailsModal");
      openEditExpenseModal(exp.id);
    };
  }

  const deleteBtn = document.getElementById("expenseDetailsDeleteBtn");
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      closeModal("expenseDetailsModal");
      deleteExpense(exp.id);
    };
  }

  openModal("expenseDetailsModal");
};

// Dialog helpers
window.openDialog = function (dialog) {
  if (!dialog) return;
  if (typeof dialog === "string") openModal(dialog);
  else if (dialog.id) openModal(dialog.id);
  else if (dialog.showModal && !dialog.open) dialog.showModal();
};

window.closeDialog = function (dialog) {
  if (!dialog) return;
  if (typeof dialog === "string") closeModal(dialog);
  else if (dialog.id) closeModal(dialog.id);
  else if (dialog.close && dialog.open) dialog.close();
};

window.deleteCompanyDetailsFromForm = function () {
  const currentEditId = parseInt(document.getElementById("companyEditIdInput")?.value || "0", 10);
  if (currentEditId > 0) {
    deleteCompanyDetails(currentEditId);
  }
};
