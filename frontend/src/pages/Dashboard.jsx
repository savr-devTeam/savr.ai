import React, { useState, useEffect } from "react";
import "./Dashboard.css";

const Dashboard = ({ onNavigate }) => {
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
      prev.includes(item)
        ? prev.filter((a) => a !== item)
        : [...prev, item]
    );
  };

  // Save allergies to dashboard
  const saveAllergies = () => {
    setSavedAllergies(selectedAllergies);
    toggleAllergyPopup();
  };

  // Progress bar logic - allows over 100% for overspending
  const getProgress = () => {
    if (budget === 0) return 0;
    return (spent / budget) * 100;
  };

  // Get progress bar color based on spending
  const getProgressColor = () => {
    const progress = getProgress();
    if (progress > 100) return '#dc2626'; // darker red for over budget
    if (progress >= 90) return '#ef4444'; // red
    if (progress >= 70) return '#f59e0b'; // orange
    return '#10b981'; // green
  };

  // Reset budget spending
  const handleResetBudget = () => {
    setSpent(0);
    setExpenseAdded(false);
    localStorage.setItem("spent", "0");
    localStorage.setItem("lastReset", new Date().toISOString());
  };

  // Load & auto-reset spending every 7 days
useEffect(() => {
  const savedBudget = localStorage.getItem("budget");
  const savedSpent = localStorage.getItem("spent");

  if (savedBudget) setBudget(Number(savedBudget));
  if (savedSpent) setSpent(Number(savedSpent));

  const now = new Date();
  const savedLastReset = localStorage.getItem("lastReset");
  const lastResetDate = savedLastReset ? new Date(savedLastReset) : null;

  // find the most recent Sunday 11:59:59 PM
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - ((now.getDay() + 7) % 7)); // go back to Sunday
  lastSunday.setHours(23, 59, 59, 999);

  // if last reset was before the most recent Sunday night → reset
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

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="pacifico-regular logo" onClick={() => onNavigate('home')} style={{cursor: 'pointer'}}>Savr</h1>
      </header>

      <hr className="divider" />

      {/* Main Content */}
      <main className="dashboard-content">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="help-section">
            <img src="/savricon.png" alt="Savr Icon" className="help-icon" />
            <h3>How can I help you?</h3>

            <button className="action-btn">Find a substitute ingredient</button>
            <button className="action-btn">Start meal planning for next week</button>
            <button className="action-btn">Upload receipt</button>
          </div>

          <div className="ask-section">
            <input type="text" placeholder="Ask Anything" className="ask-input" />
            <button className="attach-btn">
              <img src="/attachclip.png" className="attach-icon" alt="Attach" /> Attach
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {/* Meal Plan */}
          <section className="card meal-plan">
            <h2>Today's Meal</h2>
            <p className="date">Tuesday, October 23</p>

            <button className="meal-item">
              <h4>Breakfast</h4>
              <div className="meal-detail">
                <div className="meal-image-placeholder">🍳</div>
                <div>
                  <p className="meal-name">Vegetable Omelette</p>
                  <p className="ingredients">List ingredients here</p>
                </div>
              </div>
            </button>

            <button className="meal-item">
              <h4>Lunch</h4>
              <div className="meal-detail">
                <div className="meal-image-placeholder">🌯</div>
                <div>
                  <p className="meal-name">Turkey and Avocado Wrap</p>
                  <p className="ingredients">List ingredients here</p>
                </div>
              </div>
            </button>

            <button className="meal-item">
              <h4>Dinner</h4>
              <div className="meal-detail">
                <div className="meal-image-placeholder">🍛</div>
                <div>
                  <p className="meal-name">Chickpea Curry</p>
                  <p className="ingredients">List ingredients here</p>
                </div>
              </div>
            </button>

            <button className="view-meal-btn">View Meal Plan 🍽️</button>
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
                    transition: 'all 0.3s ease'
                  }}
                ></div>
              </div>

              {spent <= budget ? (
                <p className="remaining">
                  ${(budget - spent).toFixed(2)} remaining
                  {spent > 0 && <span style={{marginLeft: '8px', fontSize: '0.9em', opacity: 0.7}}>
                    (${spent.toFixed(2)} spent)
                  </span>}
                </p>
              ) : (
                <p className="remaining" style={{color: '#dc2626'}}>
                  ${(spent - budget).toFixed(2)} over budget!
                  <span style={{marginLeft: '8px', fontSize: '0.9em', opacity: 0.7}}>
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
                  onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
                  className="popup-input"
                  min="0"
                  step="0.01"
                />
                <button
                  className="save-btn"
                  onClick={handleAddExpense}
                  disabled={!newExpense || Number(newExpense) <= 0}
                  style={{
                    opacity: (!newExpense || Number(newExpense) <= 0) ? 0.5 : 1,
                    cursor: (!newExpense || Number(newExpense) <= 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Add
                </button>
              </div>
              {expenseAdded && (
                <p style={{
                  color: '#10b981',
                  fontSize: '0.9em',
                  marginTop: '8px',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  ✓ Expense added successfully!
                </p>
              )}
              
              {spent > 0 && (
                <button 
                  className="reset-budget-btn"
                  onClick={handleResetBudget}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    backgroundColor: spent > budget ? '#dc2626' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = '0.9'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  {spent > budget ? '🔄 Reset Budget (Over Limit!)' : '🔄 Reset Budget'}
                </button>
              )}
            </section>
             {/* Grocery List Card */}
            <section className="card grocery-list">
              <div className="card-header">
                <h3>🛒 Grocery List</h3>
              </div>
              <ul>
                <li><input type="checkbox" /> 1 lb Chicken breast</li>
                <li><input type="checkbox" /> 5 lbs Russet Potatoes</li>
                <li><input type="checkbox" /> 1 Garlic clove</li>
                <li><input type="checkbox" /> 1 Roma Tomato</li>
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
            <h2>Edit Weekly Budget</h2>
            <input
              type="number"
              className="popup-input"
              placeholder="Enter new budget amount..."
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
            />
            <div className="popup-buttons">
              <button onClick={toggleBudgetPopup}>Cancel</button>
              <button
                className="save-btn"
                onClick={() => {
                  const budgetAmount = Number(newBudget);
                  if (budgetAmount >= 0) {
                    setBudget(budgetAmount);
                    setNewBudget("");
                    toggleBudgetPopup();
                  }
                }}
                disabled={!newBudget || Number(newBudget) < 0}
                style={{
                  opacity: (!newBudget || Number(newBudget) < 0) ? 0.5 : 1,
                  cursor: (!newBudget || Number(newBudget) < 0) ? 'not-allowed' : 'pointer'
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

