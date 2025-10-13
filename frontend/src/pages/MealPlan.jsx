import { useState } from 'react'
import './MealPlan.css'

const MealPlan = ({ onNavigate }) => {
  const [preferences, setPreferences] = useState({
    budget: '',
    dietaryRestrictions: '',
    nutritionGoal: 'none',
    caloricTarget: '',
    proteinTarget: '',
    carbTarget: '',
    fatTarget: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement meal plan generation logic
    console.log('Generating meal plan with preferences:', preferences)
  }

  return (
    <div className="meal-plan-page">
      <header className="header">
        <div className="logo-container" onClick={() => onNavigate('home')}>
          <img src="/savricon.png" alt="Savr Logo" className="logo-image" />
          <h1 className="logo">Savr</h1>
        </div>
        <nav className="nav-menu">
          <button onClick={() => onNavigate('home')} className="nav-link">Home</button>
          <button onClick={() => onNavigate('about')} className="nav-link">About Us</button>
          <button onClick={() => onNavigate('contact')} className="nav-link">Contact Us</button>
        </nav>
      </header>

      <main className="main-content">
        <section className="preferences-section">
          <h2>Create Your Meal Plan</h2>
          <p>Customize your meal plan based on your budget, dietary needs, and nutrition goals</p>

          <form onSubmit={handleSubmit} className="preferences-form">
            
            <div className="form-group">
              <label htmlFor="budget">Weekly Budget ($)</label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={preferences.budget}
                onChange={handleChange}
                placeholder="Enter your weekly grocery budget (e.g., 100)"
                min="0"
                step="0.01"
                required
              />
              <small className="form-hint">Enter your weekly grocery budget in dollars</small>
            </div>

            <div className="form-group">
              <label htmlFor="dietaryRestrictions">Dietary Restrictions / Allergies</label>
              <textarea
                id="dietaryRestrictions"
                name="dietaryRestrictions"
                value={preferences.dietaryRestrictions}
                onChange={handleChange}
                placeholder="Enter any allergies or dietary restrictions (e.g., peanuts, gluten, dairy, vegetarian, vegan)"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nutritionGoal">Nutrition Goal</label>
              <select
                id="nutritionGoal"
                name="nutritionGoal"
                value={preferences.nutritionGoal}
                onChange={handleChange}
                required
              >
                <option value="none">No Specific Goal</option>
                <option value="weight-loss">Weight Loss / Diet</option>
                <option value="muscle-gain">Muscle Gain / Bodybuilding</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            {preferences.nutritionGoal !== 'none' && (
              <>
                <div className="form-group">
                  <label htmlFor="caloricTarget">Daily Caloric Target (kcal)</label>
                  <input
                    type="number"
                    id="caloricTarget"
                    name="caloricTarget"
                    value={preferences.caloricTarget}
                    onChange={handleChange}
                    placeholder="e.g., 2000"
                    min="0"
                  />
                </div>

                <div className="macro-targets">
                  <h3>Macro Targets (Optional)</h3>
                  
                  <div className="form-group">
                    <label htmlFor="proteinTarget">Protein (g)</label>
                    <input
                      type="number"
                      id="proteinTarget"
                      name="proteinTarget"
                      value={preferences.proteinTarget}
                      onChange={handleChange}
                      placeholder="e.g., 150"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="carbTarget">Carbohydrates (g)</label>
                    <input
                      type="number"
                      id="carbTarget"
                      name="carbTarget"
                      value={preferences.carbTarget}
                      onChange={handleChange}
                      placeholder="e.g., 200"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fatTarget">Fat (g)</label>
                    <input
                      type="number"
                      id="fatTarget"
                      name="fatTarget"
                      value={preferences.fatTarget}
                      onChange={handleChange}
                      placeholder="e.g., 65"
                      min="0"
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="submit-button">
              Generate Meal Plan
            </button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Savr. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default MealPlan

