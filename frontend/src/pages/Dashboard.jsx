import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { getUserPreferences, saveUserPreferences, generateMealPlan } from "../services/api";

const MEALPLAN_KEY = "mealPlan.v1";

// Format YYYY-MM-DD in local time
function isoDate(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

// TODO: Replace with your AI-backed generator later
async function generateMealPlanStub() {
  const today = new Date();
  const labels = ["Breakfast", "Lunch", "Dinner"];
  const names = {
    Breakfast: "Vegetable Omelette",
    Lunch: "Turkey and Avocado Wrap",
    Dinner: "Chickpea Curry",
  };
  const ingredients = {
    Breakfast: ["eggs", "spinach", "tomato"],
    Lunch: ["tortilla", "turkey", "avocado"],
    Dinner: ["chickpeas", "onion", "curry paste"],
  };
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const date = isoDate(d);
    const meals = {};
    labels.forEach((L) => {
      meals[L] = { name: names[L], ingredients: ingredients[L] };
    });
    return { date, meals };
  });
  return { generatedAt: new Date().toISOString(), days };
}

const Dashboard = ({ onNavigate, sessionId }) => {
  const [showAllergyPopup, setShowAllergyPopup] = useState(false);
  const [showBudgetPopup, setShowBudgetPopup] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [savedAllergies, setSavedAllergies] = useState([]);

  const [budget, setBudget] = useState(0);
  const [newBudget, setNewBudget] = useState("");
  const [spent, setSpent] = useState(0);
  const [newExpense, setNewExpense] = useState("");
  const [lastReset, setLastReset] = useState(null);
  const [expenseAdded, setExpenseAdded] = useState(false);
  const [askAnything, setAskAnything] = useState("");
  
  // Loading and error states for API calls
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mealPlanLoading, setMealPlanLoading] = useState(false);
  const [mealPlanError, setMealPlanError] = useState(null);

  // Popup toggles
  const toggleAllergyPopup = () => setShowAllergyPopup(!showAllergyPopup);
  const toggleBudgetPopup = () => setShowBudgetPopup(!showBudgetPopup);

  // Add expense handler
  const handleAddExpense = () => {
    const expenseAmount = Number(newExpense);
    if (expenseAmount && expenseAmount > 0) {
      setSpent((prev) => prev + expenseAmount);
      setNewExpense("");
      setExpenseAdded(true);
      setTimeout(() => setExpenseAdded(false), 2000);
    }
  };

  // Select allergies
  const toggleAllergy = (item) => {
    setSelectedAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  // Save allergies to dashboard and backend
  const saveAllergies = async () => {
    setSavedAllergies(selectedAllergies);
    toggleAllergyPopup();
    
    // Also save to backend
    try {
      await saveUserPreferences(sessionId, {
        allergies: selectedAllergies,
        budget,
        spent
      });
      console.log('Allergies saved to backend');
    } catch (err) {
      console.error('Failed to save allergies to backend:', err);
      setError('Failed to save allergies');
    }
  };

  // Progress bar logic - allows over 100% for overspending
  const getProgress = () => {
    if (budget === 0) return 0;
    return (spent / budget) * 100;
  };

  // Get progress bar color based on spending
  const getProgressColor = () => {
    const progress = getProgress();
    if (progress > 100) return "#dc2626"; // darker red for over budget
    if (progress >= 90) return "#ef4444"; // red
    if (progress >= 70) return "#f59e0b"; // orange
    return "#10b981"; // green
  };

  // Reset budget spending
  const handleResetBudget = async () => {
    setSpent(0);
    setExpenseAdded(false);
    localStorage.setItem("spent", "0");
    localStorage.setItem("lastReset", new Date().toISOString());
    try {
      await saveUserPreferences(sessionId, {
        allergies: selectedAllergies,
        budget,
        spent: 0
      });
    } catch (err) {
      console.error('Failed to save budget reset to backend:', err);
      setError('Failed to reset budget');
    }
  };

  // Load user preferences from backend on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading preferences for sessionId:', sessionId);
        
        const response = await getUserPreferences(sessionId);
        console.log('Loaded preferences:', response);
        
        if (response && response.preferences) {
          const prefs = response.preferences;
          
          // Load allergies
          if (prefs.allergies && Array.isArray(prefs.allergies)) {
            setSavedAllergies(prefs.allergies);
            setSelectedAllergies(prefs.allergies);
          }
          
          // Load budget
          if (prefs.budget) {
            setBudget(Number(prefs.budget));
          }
          
          // Load spent amount
          if (prefs.spent) {
            setSpent(Number(prefs.spent));
          }
          
          console.log('Preferences loaded successfully');
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
        setError('Could not load preferences. Using defaults.');
        // Fall back to localStorage
        const savedBudget = localStorage.getItem("budget");
        const savedSpent = localStorage.getItem("spent");
        if (savedBudget) setBudget(Number(savedBudget));
        if (savedSpent) setSpent(Number(savedSpent));
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionId) {
      loadPreferences();
    }
  }, [sessionId]);

  // Load & auto-reset spending every 7 days
useEffect(() => {
  const savedBudget = localStorage.getItem("budget");
  const savedSpent = localStorage.getItem("spent");

  if (savedBudget) setBudget(Number(savedBudget));
  if (savedSpent) setSpent(Number(savedSpent));

    const now = new Date();
    const savedLastReset = localStorage.getItem("lastReset");
    const lastResetDate = savedLastReset ? new Date(savedLastReset) : null;

    // most recent Sunday 11:59:59 PM
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

  // save updates to localStorage
  useEffect(() => {
    localStorage.setItem("budget", budget.toString());
  }, [budget]);

  useEffect(() => {
    localStorage.setItem("spent", spent.toString());
  }, [spent]);

  // Handle "Start meal planning for next week" button
  const handleMealPlanning = async () => {
    setMealPlanLoading(true);
    setMealPlanError(null);
    
    try {
      const preferences = {
        allergies: selectedAllergies,
        budget: budget,
        customPreferences: askAnything
      };
      
      console.log('Generating meal plan with preferences:', preferences);
      
      const mealPlan = await generateMealPlan(preferences, sessionId);
      console.log('✅ Meal plan generated:', mealPlan);
      
      // Clear the ask anything field after successful generation
      setAskAnything("");
      
      // Navigate to meal plan page
      onNavigate('meals');
    } catch (err) {
      console.error('❌ Error generating meal plan:', err);
      setMealPlanError(err.message || 'Failed to generate meal plan. Please try again.');
    } finally {
      setMealPlanLoading(false);
    }
  };

  // Handle "Upload receipt" button
  const handleUploadReceipt = () => {
    onNavigate('receipts');
  };

  // Handle "Find a substitute ingredient" button
  const handleFindSubstitute = async () => {
    if (!askAnything.trim()) {
      setMealPlanError('Please describe what substitute you\'re looking for.');
      return;
    }
    
    setMealPlanLoading(true);
    setMealPlanError(null);
    
    try {
      // This could be used for a future "ingredient substitute" feature
      // For now, we'll show a simple alert
      alert(`🔍 Searching for substitutes for: ${askAnything}`);
      setAskAnything("");
    } catch (err) {
      console.error('Error finding substitutes:', err);
      setMealPlanError('Failed to find substitutes. Please try again.');
    } finally {
      setMealPlanLoading(false);
    }
  };

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

      {/* Main Content */}
      <main className="dashboard-content">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="help-section">
            <img src="/savricon.png" alt="Savr Icon" className="help-icon" />
            <h3>How can I help you?</h3>

            <button 
              className="action-btn"
              onClick={handleFindSubstitute}
              disabled={mealPlanLoading}
            >
              Find a substitute ingredient
            </button>
            <button 
              className="action-btn"
              onClick={handleMealPlanning}
              disabled={mealPlanLoading}
            >
              {mealPlanLoading ? '⏳ Generating...' : 'Start meal planning for next week'}
            </button>
            <button 
              className="action-btn"
              onClick={handleUploadReceipt}
              disabled={mealPlanLoading}
            >
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

          {/* Error message for meal plan generation */}
          {mealPlanError && (
            <div className="error-message" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fee', borderRadius: '5px', color: '#c00' }}>
              ⚠️ {mealPlanError}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {/* Meal Plan */}
          <section className="card meal-plan">
            <div
              className="card-header"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
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

              {mealPlan ? (
                <button
                  className="view-meal-btn"
                  onClick={() => onNavigate("MealPlan")}
                >
                  View Meal Plan 🍽️
                </button>
              ) : null}
            </div>

            {/* Empty state (default) */}
            {!mealPlan ? (
              <div className="empty-plan">
                <p style={{ margin: "8px 0 16px", opacity: 0.8 }}>
                  No meal plan yet.
                </p>
                <button className="primary-btn" onClick={startPlanning}>
                  Start planning with Savr
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
                    <span style={{ marginLeft: "8px", fontSize: "0.9em", opacity: 0.7 }}>
                      (${spent.toFixed(2)} spent)
                    </span>
                  )}
                </p>
              ) : (
                <p className="remaining" style={{ color: "#dc2626" }}>
                  ${(spent - budget).toFixed(2)} over budget!
                  <span style={{ marginLeft: "8px", fontSize: "0.9em", opacity: 0.7 }}>
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
                  onKeyPress={(e) => e.key === "Enter" && handleAddExpense()}
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
                    cursor: !newExpense || Number(newExpense) <= 0 ? "not-allowed" : "pointer",
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
                    marginTop: "8px",
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
                    marginTop: "12px",
                    padding: "8px 16px",
                    backgroundColor: spent > budget ? "#dc2626" : "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.9em",
                    fontWeight: "500",
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

            {/* Grocery List Card */}
            <section className="card grocery-list">
              <div className="card-header">
                <h3>🛒 Grocery List</h3>
              </div>
              <ul>
                <li>
                  <input type="checkbox" /> 1 lb Chicken breast
                </li>
                <li>
                  <input type="checkbox" /> 5 lbs Russet Potatoes
                </li>
                <li>
                  <input type="checkbox" /> 1 Garlic clove
                </li>
                <li>
                  <input type="checkbox" /> 1 Roma Tomato
                </li>
              </ul>
              <button className="view-more-btn">View More</button>
            </section>
          </div>
        </div>
      </main>

      {/* POPUP: Edit Allergies */}
      {showAllergyPopup && (
        <div className="popup-overlay" onClick={toggleAllergyPopup}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="cancel-btn" onClick={toggleAllergyPopup}>
              ✖
            </button>
            <div className="allergy-section">
              <h2>Allergies</h2>
              <h3>
                We want every meal to be safe and delicious — select any allergies you have below.
              </h3>
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
                  className={`allergy-option ${
                    selectedAllergies.includes(item) ? "selected" : ""
                  }`}
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

      {/* POPUP: Edit Budget */}
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
                  const budgetAmount = Number(newBudget);
                  if (budgetAmount >= 0) {
                    setBudget(budgetAmount);
                    setNewBudget("");
                    toggleBudgetPopup();
                    try {
                      await saveUserPreferences(sessionId, {
                        allergies: selectedAllergies,
                        budget: budgetAmount,
                        spent
                      });
                    } catch (err) {
                      console.error('Failed to save budget to backend:', err);
                      setError('Failed to save budget');
                    }
                  }
                }}
                disabled={!newBudget || Number(newBudget) < 0}
                style={{
                  opacity: !newBudget || Number(newBudget) < 0 ? 0.5 : 1,
                  cursor: !newBudget || Number(newBudget) < 0 ? "not-allowed" : "pointer",
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
