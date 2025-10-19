import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigation } from '../hooks/useNavigation'
import { generateMealPlan } from '../services/api'
import './MealPlan.css'

const MealPlan = () => {
  const navigate = useNavigation();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    budget: '',
    dietaryRestrictions: '',
    nutritionGoal: 'none',
    caloricTarget: '',
    proteinTarget: '',
    carbTarget: '',
    fatTarget: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatedPlan, setGeneratedPlan] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts editing
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user?.userId) {
      setError('You must be logged in to generate a meal plan')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const mealPlan = await generateMealPlan(preferences, user.userId)
      setGeneratedPlan(mealPlan)
      console.log('✅ Meal plan generated:', mealPlan)
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate meal plan. Please try again.'
      setError(errorMsg)
      console.error('❌ Error generating meal plan:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="meal-plan-page">
      <header className="header">
        <div className="logo-container" onClick={() => navigate('home')}>
          <img src="/savricon.png" alt="Savr Logo" className="logo-image" />
          <h1 className="logo">Savr</h1>
        </div>
        <nav className="nav-menu">
          <button onClick={() => navigate('home')} className="nav-link">Home</button>
          <button onClick={() => navigate('about')} className="nav-link">About Us</button>
          <button onClick={() => navigate('contact')} className="nav-link">Contact Us</button>
        </nav>
      </header>

      <main className="main-content">
        <section className="preferences-section">
          <h2>Create Your Meal Plan</h2>
          <p>Customize your meal plan based on your budget, dietary needs, and nutrition goals</p>

          {/* Error Alert */}
          {error && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              <div>
                <strong>Error:</strong> {error}
              </div>
              <button onClick={() => setError(null)} className="close-btn">×</button>
            </div>
          )}

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

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Generating Meal Plan...
                </>
              ) : (
                'Generate Meal Plan'
              )}
            </button>
          </form>
        </section>

        {/* Generated Meal Plan Display */}
        {generatedPlan && (
          <section className="meal-plan-results">
            <h3>Your Generated Meal Plan ✅</h3>
            <div className="meal-plan-content">
              <pre className="code-block">
                {JSON.stringify(generatedPlan, null, 2)}
              </pre>
            </div>
            <button onClick={() => setGeneratedPlan(null)} className="secondary-button">
              Generate Another Plan
            </button>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Savr. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default MealPlan

