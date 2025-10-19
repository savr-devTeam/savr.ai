import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "../hooks/useNavigation";
import { generateMealPlan, getMealPlans, uploadReceipt, parseReceipt, getUserPreferences, saveUserPreferences as savePreferencesToBackend } from "../services/api";
import { getUserId } from "../utils/userUtils";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigation();
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

  // Backend integration state
  const [todaysMeals, setTodaysMeals] = useState(null);
  const [groceryItems, setGroceryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [askInput, setAskInput] = useState("");
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState(null);


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
  const saveAllergies = async () => {
    setSavedAllergies(selectedAllergies);

    if (!user?.userId) {
      console.error('User ID not available');
      return;
    }

    try {
      setPreferencesLoading(true);
      setPreferencesError(null);

      // Save to backend
      const preferences = {
        dietaryRestrictions: selectedAllergies,
        allergies: selectedAllergies,
        budget: budget
      };

      await savePreferencesToBackend(user.userId, preferences);
      console.log('✅ Preferences saved to backend');

      // Also save to localStorage as fallback
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      toggleAllergyPopup();
    } catch (error) {
      const errorMsg = error.message || 'Failed to save preferences';
      setPreferencesError(errorMsg);
      console.error('❌ Error saving preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
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
      navigate('LandingPage');
    }
  }, [isAuthenticated, loading, navigate]);

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

  // Load today's meals when user is available
  useEffect(() => {
    if (user && isAuthenticated) {
      loadTodaysMeals();
      loadUserPreferences();
    }
  }, [user, isAuthenticated]);

  // Load user preferences from backend
  const loadUserPreferences = async () => {
    if (!user?.userId) return;

    try {
      setPreferencesLoading(true);
      setPreferencesError(null);
      
      const preferences = await getUserPreferences(user.userId);
      console.log('✅ Preferences loaded from backend:', preferences);

      // Update state from backend
      if (preferences.budget) {
        setBudget(preferences.budget);
      }

      if (preferences.dietaryRestrictions && Array.isArray(preferences.dietaryRestrictions)) {
        setSavedAllergies(preferences.dietaryRestrictions);
        setSelectedAllergies(preferences.dietaryRestrictions);
      } else if (preferences.allergies && Array.isArray(preferences.allergies)) {
        setSavedAllergies(preferences.allergies);
        setSelectedAllergies(preferences.allergies);
      }

      // Cache in localStorage as fallback
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      // If backend fails, try to load from localStorage
      const cached = localStorage.getItem('userPreferences');
      if (cached) {
        console.log('⚠️ Using cached preferences from localStorage');
        const prefs = JSON.parse(cached);
        if (prefs.budget) setBudget(prefs.budget);
        if (prefs.dietaryRestrictions) setSavedAllergies(prefs.dietaryRestrictions);
      }
      console.error('❌ Error loading preferences:', error.message);
      setPreferencesError(error.message);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const loadTodaysMeals = async () => {
    if (!user) return;

    try {
      const userId = getUserId(user);
      const today = new Date().toISOString().split('T')[0];
      const response = await getMealPlans(userId, today);

      if (response.success && response.mealPlans?.length > 0) {
        const todayPlan = response.mealPlans[0];
        const weeklyPlan = todayPlan.mealPlan?.weeklyPlan;

        if (weeklyPlan) {
          const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          setTodaysMeals(weeklyPlan[dayName]);
        }

        // Update grocery list from meal plan
        if (todayPlan.mealPlan?.shoppingList) {
          setGroceryItems(todayPlan.mealPlan.shoppingList.slice(0, 4));
        }
      }
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  };

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

  // Handler functions for backend integration
  const handleQuickAction = async (action) => {
    switch (action) {
      case 'substitute':
        alert('🤖 Ingredient substitution feature coming soon!');
        break;

      case 'meal-plan':
        await generateQuickMealPlan();
        break;

      case 'upload':
        document.getElementById('receipt-upload').click();
        break;
    }
  };

  const generateQuickMealPlan = async () => {
    setIsLoading(true);
    try {
      const userId = getUserId(user);
      const preferences = {
        budget: budget,
        dietaryRestrictions: savedAllergies.join(', '),
        nutritionGoal: 'maintenance',
        caloricTarget: 2000
      };

      saveUserPreferences(preferences);
      const response = await generateMealPlan(preferences, userId);

      if (response.success) {
        await loadTodaysMeals();
        alert('✅ New meal plan generated!');
      } else {
        alert('❌ Failed to generate meal plan');
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Upload receipt
      const uploadResult = await uploadReceipt(file);

      // Parse receipt
      const parseResult = await parseReceipt(uploadResult.s3Key);

      if (parseResult.success) {
        // Update grocery list with parsed items
        const newItems = parseResult.result.items?.map(item => item.name) || [];
        setGroceryItems(prev => [...new Set([...prev, ...newItems.slice(0, 4)])]);

        alert(`✅ Receipt processed! Found ${parseResult.result.items?.length || 0} items`);
      } else {
        alert('❌ Failed to process receipt');
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!askInput.trim()) return;

    setIsLoading(true);
    try {
      // For now, we'll handle specific queries and generate meal plans based on the ask
      const lowerInput = askInput.toLowerCase();

      if (lowerInput.includes('meal') || lowerInput.includes('recipe') || lowerInput.includes('cook')) {
        // Generate meal plan based on the question
        const userId = getUserId(user);
        const preferences = {
          budget: budget,
          dietaryRestrictions: savedAllergies.join(', '),
          nutritionGoal: 'maintenance',
          caloricTarget: 2000,
          customRequest: askInput // Add the user's specific request
        };

        const response = await generateMealPlan(preferences, userId);

        if (response.success) {
          await loadTodaysMeals();
          alert(`✅ Generated meal plan based on: "${askInput}"`);
        } else {
          alert('❌ Failed to generate meal plan');
        }
      } else if (lowerInput.includes('substitute') || lowerInput.includes('replace')) {
        alert(`🤖 Savr AI: For ingredient substitutions, try our meal planning feature! We can suggest alternatives based on your dietary needs.`);
      } else if (lowerInput.includes('budget') || lowerInput.includes('cost') || lowerInput.includes('price')) {
        alert(`💰 Your current weekly budget is $${budget}. You've spent $${spent}, leaving $${budget - spent} remaining.`);
      } else if (lowerInput.includes('allerg') || lowerInput.includes('dietary')) {
        const allergyText = savedAllergies.length > 0 ? savedAllergies.join(', ') : 'none set';
        alert(`🚫 Your current allergies/restrictions: ${allergyText}`);
      } else {
        alert(`🤖 Savr AI: "${askInput}" - I can help with meal planning, recipes, ingredient substitutes, budget tracking, and dietary restrictions!`);
      }

      setAskInput('');
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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

            <button
              className="action-btn"
              onClick={() => handleQuickAction('substitute')}
            >
              Find a substitute ingredient
            </button>
            <button
              className="action-btn"
              onClick={() => handleQuickAction('meal-plan')}
              disabled={isLoading}
            >
              {isLoading ? '🤖 Generating...' : 'Start meal planning for next week'}
            </button>
            <button
              className="action-btn"
              onClick={() => handleQuickAction('upload')}
            >
              Upload receipt
            </button>
          </div>

          <div className="ask-section">
            <form onSubmit={handleAskSubmit}>
              <input
                type="text"
                placeholder="Ask Anything"
                className="ask-input"
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="attach-btn"
                disabled={isLoading || !askInput.trim()}
              >
                <img src="/attachclip.png" className="attach-icon" alt="Ask" />
                {isLoading ? 'Thinking...' : 'Ask'}
              </button>
            </form>

            {/* Hidden file input for receipt upload */}
            <input
              type="file"
              id="receipt-upload"
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={handleReceiptUpload}
            />
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
                  <p className="meal-name">
                    {todaysMeals?.breakfast?.name || "Vegetable Omelette"}
                  </p>
                  <p className="ingredients">
                    {todaysMeals?.breakfast?.ingredients?.join(', ') || "List ingredients here"}
                  </p>
                </div>
              </div>
            </button>

            <button className="meal-item">
              <h4>Lunch</h4>
              <div className="meal-detail">
                <div className="meal-image-placeholder">🌯</div>
                <div>
                  <p className="meal-name">
                    {todaysMeals?.lunch?.name || "Turkey and Avocado Wrap"}
                  </p>
                  <p className="ingredients">
                    {todaysMeals?.lunch?.ingredients?.join(', ') || "List ingredients here"}
                  </p>
                </div>
              </div>
            </button>

            <button className="meal-item">
              <h4>Dinner</h4>
              <div className="meal-detail">
                <div className="meal-image-placeholder">🍛</div>
                <div>
                  <p className="meal-name">
                    {todaysMeals?.dinner?.name || "Chickpea Curry"}
                  </p>
                  <p className="ingredients">
                    {todaysMeals?.dinner?.ingredients?.join(', ') || "List ingredients here"}
                  </p>
                </div>
              </div>
            </button>

            <button
              className="view-meal-btn"
              onClick={() => navigate('meal-plan')}
            >
              View Meal Plan 🍽️
            </button>
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
                {groceryItems.length > 0 ? (
                  groceryItems.map((item, index) => (
                    <li key={index}>
                      <input type="checkbox" /> {item}
                    </li>
                  ))
                ) : (
                  <>
                    <li><input type="checkbox" /> 1 lb Chicken breast</li>
                    <li><input type="checkbox" /> 5 lbs Russet Potatoes</li>
                    <li><input type="checkbox" /> 1 Garlic clove</li>
                    <li><input type="checkbox" /> 1 Roma Tomato</li>
                  </>
                )}
              </ul>
              <button
                className="view-more-btn"
                onClick={() => handleQuickAction('upload')}
              >
                Add More Items
              </button>
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
                  className={`allergy-option ${selectedAllergies.includes(item) ? "selected" : ""
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
                onClick={async () => {
                  const newBudgetValue = Number(newBudget) || 0;
                  setBudget(newBudgetValue);
                  
                  // Save to backend
                  if (user?.userId) {
                    try {
                      setPreferencesLoading(true);
                      const preferences = {
                        budget: newBudgetValue,
                        dietaryRestrictions: savedAllergies,
                        allergies: savedAllergies
                      };
                      await savePreferencesToBackend(user.userId, preferences);
                      console.log('✅ Budget saved to backend');
                      localStorage.setItem('userPreferences', JSON.stringify(preferences));
                    } catch (error) {
                      console.error('❌ Error saving budget:', error);
                      setPreferencesError(error.message);
                    } finally {
                      setPreferencesLoading(false);
                    }
                  }
                  
                  toggleBudgetPopup();
                }}
                disabled={preferencesLoading}
              >
                {preferencesLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

