import { useState, useEffect } from 'react'
import { useNavigation } from '../hooks/useNavigation'
import { generateMealPlan } from '../services/api'
import './MealPlan.css'

const MealPlan = ({ sessionId }) => {
  const navigate = useNavigation();
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
      console.log('✅ Meal plan generated:', mealPlan)
    } catch (err) {
      const errorMsg = err.message || 'Failed to generate meal plan. Please try again.'
      setError(errorMsg)
      console.error('❌ Error generating meal plan:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    navigate('home')
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Your Meal Plan</h2>
            <button onClick={handleBackToDashboard} className="secondary-button">
              ← Back to Dashboard
            </button>
          </div>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>✅ Your Generated Meal Plan</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setGeneratedPlan(null)} className="secondary-button">
                  ← New Plan
                </button>
                <button onClick={handleBackToDashboard} className="submit-button">
                  Back to Dashboard
                </button>
              </div>
            </div>
            
            <div className="meal-plan-content">
              {/* Display meal plan data - handles various response formats */}
              {generatedPlan.meals ? (
                <div>
                  <h4>Meals for the Week:</h4>
                  {Array.isArray(generatedPlan.meals) ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {generatedPlan.meals.map((meal, idx) => (
                        <li key={idx} style={{ 
                          marginBottom: '15px', 
                          padding: '15px', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: '8px',
                          borderLeft: '4px solid #10b981'
                        }}>
                          <strong>{meal.name || meal.title || `Meal ${idx + 1}`}</strong>
                          {meal.description && <p>{meal.description}</p>}
                          {meal.ingredients && (
                            <>
                              <p><strong>Ingredients:</strong></p>
                              <ul>{Array.isArray(meal.ingredients) ? 
                                meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)
                                : <li>{meal.ingredients}</li>
                              }</ul>
                            </>
                          )}
                          {meal.nutrition && (
                            <p><strong>Nutrition:</strong> {typeof meal.nutrition === 'string' ? meal.nutrition : JSON.stringify(meal.nutrition)}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <pre style={{ overflow: 'auto', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                      {JSON.stringify(generatedPlan.meals, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <pre style={{ overflow: 'auto', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                  {JSON.stringify(generatedPlan, null, 2)}
                </pre>
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

