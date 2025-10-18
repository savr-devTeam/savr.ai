import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const Dashboard = ({ onNavigate }) => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [showAllergyPopup, setShowAllergyPopup] = useState(false);
  const [showBudgetPopup, setShowBudgetPopup] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [savedAllergies, setSavedAllergies] = useState([]);
  const [budget, setBudget] = useState(0);
  const [newBudget, setNewBudget] = useState("");
  const [spent, setSpent] = useState(0);
  const [newExpense, setNewExpense] = useState("");
  const [lastReset, setLastReset] = useState(null);

  // Popup toggles
  const toggleAllergyPopup = () => setShowAllergyPopup(!showAllergyPopup);
  const toggleBudgetPopup = () => setShowBudgetPopup(!showBudgetPopup);

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

  // Progress bar logic
  const getProgress = () => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to landing page if not authenticated
      onNavigate('LandingPage');
    }
  }, [isAuthenticated, loading, onNavigate]);

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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="pacifico-regular logo">Savr</h1>
        <div className="dashboard-user-section">
          <span className="user-name">
            {user?.name || user?.email?.split('@')[0] || 'User'}
          </span>
          <button 
            className="logout-btn"
            onClick={logout}
            title="Sign Out"
          >
            Sign Out
          </button>
        </div>
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

              <h2>${budget}</h2>

              <div className="progress-bar">
                <div className="progress" style={{ width: `${getProgress()}%` }}></div>
              </div>

              <p className="remaining">${Math.max(budget - spent, 0)} remaining</p>

              <div className="spend-section">
                <input
                  type="number"
                  placeholder="Add expense..."
                  value={newExpense}
                  onChange={(e) => setNewExpense(e.target.value)}
                  className="popup-input"
                />
                <button
                  className="save-btn"
                  onClick={() => {
                    setSpent((prev) => prev + Number(newExpense || 0));
                    setNewExpense("");
                  }}
                >
                  Add
                </button>
              </div>
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
                  setBudget(Number(newBudget) || 0);
                  toggleBudgetPopup();
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

