import { useState, useEffect } from 'react'
import { generateMealPlan } from '../services/api'
import MealCard from '../components/MealCard'
import './MealPlan.css'

const MealPlan = ({ sessionId, onNavigate }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [userPreferences, setUserPreferences] = useState(null)

  // Load preferences from props or generate new plan
  useEffect(() => {
    if (sessionId) {
      console.log('MealPlan loaded with sessionId:', sessionId)
    }
  }, [sessionId])

  const handleGenerateNewPlan = async (e) => {
    e?.preventDefault()
    
    if (!sessionId) {
      setError('Session ID is required to generate a meal plan')
      return
    }

    if (!userPreferences || (!userPreferences.budget && !userPreferences.allergies?.length)) {
      setError('Please set at least a budget or dietary preferences on the dashboard first')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const mealPlan = await generateMealPlan(userPreferences, sessionId)
      setGeneratedPlan(mealPlan)
      console.log('Meal plan generated:', mealPlan)
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate meal plan. Please try again.'
      setError(errorMsg)
      console.error('Error generating meal plan:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    onNavigate('home')
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Your Meal Plan</h2>
            <button onClick={handleBackToDashboard} className="secondary-button">
              ← Back to Dashboard
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="error-alert">
              <span className="error-icon">!</span>
              <div>
                <strong>Error:</strong> {error}
              </div>
              <button onClick={() => setError(null)} className="close-btn">×</button>
            </div>
          )}

          {!generatedPlan ? (
            <>
              <p>Start by setting your preferences on the Dashboard, then return here to generate your personalized meal plan.</p>
              <button 
                onClick={handleGenerateNewPlan} 
                className="submit-button"
                disabled={isLoading || !sessionId}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Generating Meal Plan...
                  </>
                ) : (
                  '🍽️ Generate Meal Plan'
                )}
              </button>
            </>
          ) : null}
        </section>

        {/* Generated Meal Plan Display */}
        {generatedPlan && (
          <section className="meal-plan-results">
            <h3>Your Generated Meal Plan</h3>
            <div className="meal-plan-content">
              <pre className="code-block">
                {JSON.stringify(generatedPlan, null, 2)}
              </pre>
            </div>
            
            <div className="meal-plan-content">
              {/* Display meal plan using MealCard component */}
              {generatedPlan.meals && Array.isArray(generatedPlan.meals) ? (
                <div className="meals-grid">
                  {generatedPlan.meals.map((meal, idx) => (
                    <MealCard
                      key={idx}
                      mealType={meal.type || meal.mealType || `Meal ${idx + 1}`}
                      mealName={meal.name || meal.title || 'Untitled Meal'}
                      ingredients={
                        Array.isArray(meal.ingredients) 
                          ? meal.ingredients 
                          : meal.ingredients 
                            ? [meal.ingredients] 
                            : []
                      }
                      nutrition={meal.nutrition || {}}
                      prepTime={meal.prepTime || meal.prep_time}
                    />
                  ))}
                </div>
              ) : generatedPlan.days && Array.isArray(generatedPlan.days) ? (
                <div>
                  {generatedPlan.days.map((day, dayIdx) => (
                    <div key={dayIdx} className="day-section">
                      <h4>{day.date || `Day ${dayIdx + 1}`}</h4>
                      <div className="meals-grid">
                        {day.meals && Object.entries(day.meals).map(([mealType, meal], mealIdx) => (
                          <MealCard
                            key={`${dayIdx}-${mealIdx}`}
                            mealType={mealType}
                            mealName={meal?.name || 'TBD'}
                            ingredients={
                              Array.isArray(meal?.ingredients) 
                                ? meal.ingredients 
                                : meal?.ingredients 
                                  ? [meal.ingredients] 
                                  : []
                            }
                            nutrition={meal?.nutrition || {}}
                            prepTime={meal?.prepTime || meal?.prep_time}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fallback-display">
                  <p>Meal plan data:</p>
                  <pre style={{ overflow: 'auto', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                    {JSON.stringify(generatedPlan, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <button onClick={() => setGeneratedPlan(null)} className="secondary-button" style={{ marginTop: '20px' }}>
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

