import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import {
  getUserPreferences,
  saveUserPreferences,
  generateMealPlan,
} from "../services/api";

const MEALPLAN_KEY = "mealPlan.v1";
const GROCERY_KEY = "groceryList.v1";

/* ---------- utils ---------- */
function isoDate(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
const uid =
  () =>
    (crypto?.randomUUID?.() ||
      `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

function planSignature(plan) {
  if (!plan?.days?.length) return "";
  const all = [];
  for (const day of plan.days) {
    for (const L of ["Breakfast", "Lunch", "Dinner"]) {
      (day.meals?.[L]?.ingredients || []).forEach((x) =>
        all.push(String(x).trim().toLowerCase())
      );
    }
  }
  return all.filter(Boolean).sort().join("|");
}

/* ---------- component ---------- */
const Dashboard = ({ onNavigate, sessionId }) => {
  // popups
  const [showAllergyPopup, setShowAllergyPopup] = useState(false);
  const [showBudgetPopup, setShowBudgetPopup] = useState(false);

  // allergies
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [savedAllergies, setSavedAllergies] = useState([]);

  // budget
  const [budget, setBudget] = useState(0);
  const [newBudget, setNewBudget] = useState("");
  const [spent, setSpent] = useState(0);
  const [newExpense, setNewExpense] = useState("");
  const [lastReset, setLastReset] = useState(null);
  const [expenseAdded, setExpenseAdded] = useState(false);

  // meal plan & UI state
  const [mealPlan, setMealPlan] = useState(null);
  const [askAnything, setAskAnything] = useState("");
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [error, setError] = useState("");
  const [mealPlanLoading, setMealPlanLoading] = useState(false);
  const [mealPlanError, setMealPlanError] = useState("");

  // grocery list
  const [groceryList, setGroceryList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(GROCERY_KEY)) ?? [];
    } catch {
      return [];
    }
  });
  const [newItem, setNewItem] = useState("");

  /* ---------- derived ---------- */
  const getProgress = () => (budget === 0 ? 0 : (spent / budget) * 100);
  const getProgressColor = () => {
    const p = getProgress();
    if (p > 100) return "#dc2626";
    if (p >= 90) return "#ef4444";
    if (p >= 70) return "#f59e0b";
    return "#10b981";
  };

  const todayMeals = (() => {
    if (!mealPlan) return null;
    const today = isoDate();
    const day = mealPlan.days?.find((d) => d.date === today) ?? mealPlan.days?.[0];
    return day?.meals || null;
  })();

  /* ---------- effects ---------- */
  // Persist groceries
  useEffect(() => {
    localStorage.setItem(GROCERY_KEY, JSON.stringify(groceryList));
  }, [groceryList]);

  // Load prefs from backend (fallback to localStorage) + load meal plan if present
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingPrefs(true);
        setError("");
        // load backend prefs
        if (sessionId) {
          const res = await getUserPreferences(sessionId);
          const prefs = res?.preferences || {};
          if (Array.isArray(prefs.allergies)) {
            setSavedAllergies(prefs.allergies);
            setSelectedAllergies(prefs.allergies);
          }
          if (prefs.budget != null) setBudget(Number(prefs.budget));
          if (prefs.spent != null) setSpent(Number(prefs.spent));
        } else {
          // fallback to localStorage
          const savedBudget = localStorage.getItem("budget");
          const savedSpent = localStorage.getItem("spent");
          if (savedBudget) setBudget(Number(savedBudget));
          if (savedSpent) setSpent(Number(savedSpent));
        }
        // meal plan from localStorage
        const savedPlan = localStorage.getItem(MEALPLAN_KEY);
        if (savedPlan) {
          try {
            setMealPlan(JSON.parse(savedPlan));
          } catch {
            setMealPlan(null);
          }
        }
      } catch (e) {
        setError("Could not load preferences. Using defaults.");
      } finally {
        setLoadingPrefs(false);
      }
    };
    load();
  }, [sessionId]);

  // Weekly auto-reset (most recent Sunday 11:59:59 PM)
  useEffect(() => {
    const now = new Date();
    const savedLastReset = localStorage.getItem("lastReset");
    const lastResetDate = savedLastReset ? new Date(savedLastReset) : null;
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - ((now.getDay() + 7) % 7));
    lastSunday.setHours(23, 59, 59, 999);

    if (!lastResetDate || lastResetDate < lastSunday) {
      setSpent(0);
      localStorage.setItem("spent", "0");
      localStorage.setItem("lastReset", now.toISOString());
      setLastReset(now);
    } else {
      setLastReset(lastResetDate);
    }
  }, []);

  // Persist budget & spent
  useEffect(() => {
    localStorage.setItem("budget", String(budget));
  }, [budget]);
  useEffect(() => {
    localStorage.setItem("spent", String(spent));
  }, [spent]);

  // Auto-sync groceries when meal plan changes (dedupe)
  useEffect(() => {
    if (!mealPlan) return;
    const sig = planSignature(mealPlan);
    const prev = localStorage.getItem("mealPlan.ingredients.sig");
    if (sig && sig !== prev) {
      addItemsFromPlan(mealPlan);
      localStorage.setItem("mealPlan.ingredients.sig", sig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealPlan]);

  /* ---------- handlers ---------- */
  const toggleAllergyPopup = () => setShowAllergyPopup((s) => !s);
  const toggleBudgetPopup = () => setShowBudgetPopup((s) => !s);

  const toggleAllergy = (item) => {
    setSelectedAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const saveAllergies = async () => {
    setSavedAllergies(selectedAllergies);
    setShowAllergyPopup(false);
    try {
      if (sessionId) {
        await saveUserPreferences(sessionId, {
          allergies: selectedAllergies,
          budget,
          spent,
        });
      }
    } catch {
      setError("Failed to save allergies");
    }
  };

  const handleAddExpense = () => {
    const amount = Number(newExpense);
    if (amount > 0) {
      setSpent((s) => s + amount);
      setNewExpense("");
      setExpenseAdded(true);
      setTimeout(() => setExpenseAdded(false), 2000);
    }
  };

  const handleResetBudget = async () => {
    setSpent(0);
    setExpenseAdded(false);
    localStorage.setItem("spent", "0");
    localStorage.setItem("lastReset", new Date().toISOString());
    try {
      if (sessionId) {
        await saveUserPreferences(sessionId, {
          allergies: selectedAllergies,
          budget,
          spent: 0,
        });
      }
    } catch {
      setError("Failed to reset budget");
    }
  };

  // Grocery list helpers
  function addManualItem() {
    const text = newItem.trim();
    if (!text) return;
    setGroceryList((prev) => [
      { id: uid(), text, checked: false, source: "manual" },
      ...prev,
    ]);
    setNewItem("");
  }
  function toggleGrocery(id) {
    setGroceryList((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  }
  function removeGrocery(id) {
    setGroceryList((prev) => prev.filter((it) => it.id !== id));
  }
  function clearAllItems() {
    setGroceryList([]);
    localStorage.removeItem("mealPlan.ingredients.sig");
  }
  function addItemsFromPlan(plan) {
    if (!plan?.days?.length) return;
    const existing = new Set(groceryList.map((i) => i.text.toLowerCase()));
    const incoming = [];
    for (const day of plan.days) {
      for (const label of ["Breakfast", "Lunch", "Dinner"]) {
        const ings = day.meals?.[label]?.ingredients || [];
        for (const raw of ings) {
          const t = String(raw).trim();
          if (!t) continue;
          const k = t.toLowerCase();
          if (existing.has(k)) continue;
          existing.add(k);
          incoming.push({ id: uid(), text: t, checked: false, source: "ai" });
        }
      }
    }
    if (incoming.length) setGroceryList((prev) => [...incoming, ...prev]);
  }

  // Generate plan via backend
  const handleMealPlanning = async () => {
    setMealPlanLoading(true);
    setMealPlanError("");
    try {
      const payload = {
        allergies: selectedAllergies,
        budget: budget || undefined,
        customPreferences: askAnything || undefined,
      };
      const plan = await generateMealPlan(payload, sessionId);
      setMealPlan(plan);
      localStorage.setItem(MEALPLAN_KEY, JSON.stringify(plan));
      setAskAnything("");
      // navigate if you want
      // onNavigate("meals");
    } catch (e) {
      setMealPlanError(e.message || "Failed to generate meal plan. Please try again.");
    } finally {
      setMealPlanLoading(false);
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1
          className="pacifico-regular logo"
          onClick={() => onNavigate("home")}
          style={{ cursor: "pointer" }}
        >
          Savr
        </h1>
      </header>

      <hr className="divider" />

      <main className="dashboard-content">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="help-section">
            <img src="/savricon.png" alt="Savr Icon" className="help-icon" />
            <h3>How can I help you?</h3>

            <button
              className="action-btn"
              onClick={handleMealPlanning}
              disabled={mealPlanLoading}
            >
              {mealPlanLoading ? "⏳ Generating…" : "Start meal planning for next week"}
            </button>

            <button className="action-btn" onClick={() => onNavigate("receipts")}>
              Upload receipt
            </button>
          </div>

          <div className="ask-section">
            <input
              type="text"
              placeholder="Ask Anything"
              className="ask-input"
              value={askAnything}
              onChange={(e) => setAskAnything(e.target.value)}
              disabled={mealPlanLoading}
            />
            <button className="attach-btn" disabled={mealPlanLoading}>
              <img src="/attachclip.png" className="attach-icon" alt="Attach" /> Attach
            </button>
          </div>

          {(error || mealPlanError) && (
            <div
              className="error-message"
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: "#fee",
                borderRadius: 6,
                color: "#c00",
              }}
            >
              ⚠️ {error || mealPlanError}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {/* Meal Plan */}
          <section className="card meal-plan">
            <div
              className="card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2>Today's Meal</h2>
                <p className="date">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {mealPlan && (
                <button className="view-meal-btn" onClick={() => onNavigate("MealPlan")}>
                  View Meal Plan 🍽️
                </button>
              )}
            </div>

            {!mealPlan ? (
              <div className="empty-plan">
                <p style={{ margin: "8px 0 16px", opacity: 0.8 }}>No meal plan yet.</p>
                <button
                  className="primary-btn"
                  onClick={handleMealPlanning}
                  disabled={mealPlanLoading}
                >
                  {mealPlanLoading ? "⏳ Generating…" : "Start planning with Savr"}
                </button>
              </div>
            ) : !todayMeals ? (
              <p>Loading today’s meals…</p>
            ) : (
              <>
                {["Breakfast", "Lunch", "Dinner"].map((label) => {
                  const meal = todayMeals[label];
                  return (
                    <button key={label} className="meal-item">
                      <h4>{label}</h4>
                      <div className="meal-detail">
                        <div className="meal-image-placeholder">🍽️</div>
                        <div>
                          <p className="meal-name">{meal?.name || "TBD"}</p>
                          <p className="ingredients">
                            {meal?.ingredients?.length
                              ? `Ingredients: ${meal.ingredients.join(", ")}`
                              : "List ingredients here"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </section>

          {/* Bottom Row */}
          <div className="bottom-row">
            {/* Allergies */}
            <section className="card allergies">
              <div className="card-header">
                <h3>Allergies</h3>
                <img
                  src="/editicon.png"
                  className="edit-allergy-btn"
                  alt="Edit"
                  onClick={toggleAllergyPopup}
                />
              </div>
              <div className="tags">
                {savedAllergies.length > 0 ? (
                  savedAllergies.map((a) => <span key={a}>{a}</span>)
                ) : (
                  <p className="placeholder-text">No allergies selected yet</p>
                )}
              </div>
            </section>

            {/* Weekly Budget */}
            <section className="card budget">
              <div className="card-header">
                <h3>Weekly Budget</h3>
                <img
                  src="/editicon.png"
                  className="edit-budget-btn"
                  alt="Edit"
                  onClick={toggleBudgetPopup}
                />
              </div>

              <h2>${budget.toFixed(2)}</h2>

              <div className="progress-bar">
                <div
                  className="progress"
                  style={{
                    width: `${Math.min(getProgress(), 100)}%`,
                    backgroundColor: getProgressColor(),
                    transition: "all 0.3s ease",
                  }}
                ></div>
              </div>

              {spent <= budget ? (
                <p className="remaining">
                  ${(budget - spent).toFixed(2)} remaining
                  {spent > 0 && (
                    <span style={{ marginLeft: 8, fontSize: "0.9em", opacity: 0.7 }}>
                      (${spent.toFixed(2)} spent)
                    </span>
                  )}
                </p>
              ) : (
                <p className="remaining" style={{ color: "#dc2626" }}>
                  ${(spent - budget).toFixed(2)} over budget!
                  <span style={{ marginLeft: 8, fontSize: "0.9em", opacity: 0.7 }}>
                    (${spent.toFixed(2)} spent of ${budget.toFixed(2)})
                  </span>
                </p>
              )}

              <div className="spend-section">
                <input
                  type="number"
                  placeholder="Add expense..."
                  value={newExpense}
                  onChange={(e) => setNewExpense(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddExpense()}
                  className="popup-input"
                  min="0"
                  step="0.01"
                />
                <button
                  className="save-btn"
                  onClick={handleAddExpense}
                  disabled={!newExpense || Number(newExpense) <= 0}
                  style={{
                    opacity: !newExpense || Number(newExpense) <= 0 ? 0.5 : 1,
                    cursor:
                      !newExpense || Number(newExpense) <= 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Add
                </button>
              </div>

              {expenseAdded && (
                <p
                  style={{
                    color: "#10b981",
                    fontSize: "0.9em",
                    marginTop: 8,
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  ✓ Expense added successfully!
                </p>
              )}

              {spent > 0 && (
                <button
                  className="reset-budget-btn"
                  onClick={handleResetBudget}
                  style={{
                    marginTop: 12,
                    padding: "8px 16px",
                    backgroundColor: spent > budget ? "#dc2626" : "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: "0.9em",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    width: "100%",
                  }}
                  onMouseOver={(e) => (e.target.style.opacity = "0.9")}
                  onMouseOut={(e) => (e.target.style.opacity = "1")}
                >
                  {spent > budget ? "🔄 Reset Budget (Over Limit!)" : "🔄 Reset Budget"}
                </button>
              )}
            </section>

            {/* Grocery List */}
            <section className="card grocery-list">
              <div
                className="card-header"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <h3>🛒 Grocery List</h3>
              </div>

              {groceryList.length === 0 ? (
                <p className="placeholder-text" style={{ marginTop: 6 }}>
                  No items yet.
                </p>
              ) : (
                <div className="grocery-scroll">
                  <ul className="grocery-ul">
                    {groceryList.map((item) => (
                      <li
                        key={item.id}
                        className={`grocery-li ${item.checked ? "checked" : ""}`}
                      >
                        <label className="grocery-row">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleGrocery(item.id)}
                          />
                          <span className="grocery-text">{item.text}</span>
                          {item.source === "ai" && <span className="chip"></span>}
                        </label>
                        <button
                          className="icon-btn"
                          aria-label="Remove"
                          onClick={() => removeGrocery(item.id)}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, margin: "8px 0 14px", marginTop: "auto" }}>
                <input
                  type="text"
                  className="ask-input"
                  placeholder="Add an item..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addManualItem()}
                />
                <button className="save-btn" onClick={addManualItem} disabled={!newItem.trim()}>
                  Add
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 12 }}>
                <button className="mini-btn danger" onClick={clearAllItems}>
                  Clear all
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* POPUP: Allergies */}
      {showAllergyPopup && (
        <div className="popup-overlay" onClick={toggleAllergyPopup}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="cancel-btn" onClick={toggleAllergyPopup}>
              ✖
            </button>
            <div className="allergy-section">
              <h2>Allergies</h2>
              <h3>We want every meal to be safe and delicious — select any allergies you have below.</h3>
            </div>

            <div className="allergy-options">
              {[
                "Peanuts",
                "Tree Nuts",
                "Gluten",
                "Dairy",
                "Shellfish",
                "Eggs",
                "Soy",
                "Sesame",
                "Fish",
                "Wheat",
                "Other",
              ].map((item) => (
                <button
                  key={item}
                  className={`allergy-option ${selectedAllergies.includes(item) ? "selected" : ""}`}
                  onClick={() => toggleAllergy(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="popup-buttons">
              <button className="save-btn" onClick={saveAllergies}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Budget */}
      {showBudgetPopup && (
        <div className="popup-overlay" onClick={toggleBudgetPopup}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h2>Enter weekly budget for groceries</h2>
            <input
              type="number"
              className="budget-input"
              placeholder="Enter new budget amount..."
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
            />
            <div className="popup-buttons">
              <button className="cancel-btn" onClick={toggleBudgetPopup}>
                ✖
              </button>
              <button
                className="save-btn"
                onClick={async () => {
                  const amount = Number(newBudget);
                  if (amount >= 0) {
                    setBudget(amount);
                    setNewBudget("");
                    setShowBudgetPopup(false);
                    try {
                      if (sessionId) {
                        await saveUserPreferences(sessionId, {
                          allergies: selectedAllergies,
                          budget: amount,
                          spent,
                        });
                      }
                    } catch {
                      setError("Failed to save budget");
                    }
                  }
                }}
                disabled={!newBudget || Number(newBudget) < 0}
                style={{
                  opacity: !newBudget || Number(newBudget) < 0 ? 0.5 : 1,
                  cursor:
                    !newBudget || Number(newBudget) < 0 ? "not-allowed" : "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
