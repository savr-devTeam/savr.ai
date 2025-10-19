import { useState } from 'react'
import { useNavigation } from '../hooks/useNavigation'
import './Allergies.css'

const Allergies = () => {
  const navigate = useNavigation();
  const [selectedAllergies, setSelectedAllergies] = useState([])
  const [customAllergy, setCustomAllergy] = useState('')
  const [isSaved, setIsSaved] = useState(false)

  // All food allergens
  const allAllergies = [
    // Common food allergens
    { id: 'milk', name: 'Milk & Dairy', category: 'common' },
    { id: 'eggs', name: 'Eggs', category: 'common' },
    { id: 'peanuts', name: 'Peanuts', category: 'common' },
    { id: 'tree-nuts', name: 'Tree Nuts (Almonds, Walnuts, Cashews)', category: 'common' },
    { id: 'soy', name: 'Soy', category: 'common' },
    { id: 'wheat', name: 'Wheat & Gluten', category: 'common' },
    { id: 'fish', name: 'Fish', category: 'common' },
    { id: 'shellfish', name: 'Shellfish (Shrimp, Crab, Lobster)', category: 'common' },
    { id: 'sesame', name: 'Sesame', category: 'common' },
    // Additional allergens
    { id: 'corn', name: 'Corn', category: 'additional' },
    { id: 'garlic', name: 'Garlic', category: 'additional' },
    { id: 'onion', name: 'Onion', category: 'additional' },
    { id: 'mustard', name: 'Mustard', category: 'additional' },
    { id: 'celery', name: 'Celery', category: 'additional' },
    { id: 'lupin', name: 'Lupin', category: 'additional' },
    { id: 'molluscs', name: 'Molluscs', category: 'additional' },
    { id: 'sulfites', name: 'Sulfites', category: 'additional' },
    { id: 'nightshades', name: 'Nightshades (Tomatoes, Peppers, Eggplant)', category: 'additional' },
    { id: 'citrus', name: 'Citrus Fruits', category: 'additional' },
    { id: 'strawberries', name: 'Strawberries', category: 'additional' },
    { id: 'kiwi', name: 'Kiwi', category: 'additional' },
    { id: 'banana', name: 'Banana', category: 'additional' },
    { id: 'avocado', name: 'Avocado', category: 'additional' },
    { id: 'coconut', name: 'Coconut', category: 'additional' },
    { id: 'mango', name: 'Mango', category: 'additional' },
  ]

  const commonAllergies = allAllergies.filter(a => a.category === 'common')
  const additionalAllergies = allAllergies.filter(a => a.category === 'additional')

  const handleToggleAllergy = (allergyId) => {
    setSelectedAllergies(prev =>
      prev.includes(allergyId)
        ? prev.filter(id => id !== allergyId)
        : [...prev, allergyId]
    )
    setIsSaved(false)
  }

  const handleAddCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.toLowerCase())) {
      setSelectedAllergies(prev => [...prev, customAllergy.toLowerCase()])
      setCustomAllergy('')
      setIsSaved(false)
    }
  }

  const handleRemoveCustomAllergy = (allergyId) => {
    setSelectedAllergies(prev => prev.filter(id => id !== allergyId))
    setIsSaved(false)
  }

  const handleSave = () => {
    // TODO: Save allergies to backend/local storage
    console.log('Saved allergies:', selectedAllergies)
    setIsSaved(true)

    setTimeout(() => {
      setIsSaved(false)
    }, 3000)
  }

  const handleClearAll = () => {
    setSelectedAllergies([])
    setIsSaved(false)
  }

  const isCustomAllergy = (allergyId) => {
    return !allAllergies.some(a => a.id === allergyId)
  }

  return (
    <div className="allergies-page">
      <header className="header">
        <div className="logo-container" onClick={() => navigate('home')}>
          <img src="/savricon.png" alt="Savr Logo" className="logo-image" />
          <h1 className="logo">Savr</h1>
        </div>
        <nav className="nav-menu">
          <button onClick={() => navigate('home')} className="nav-link">Home</button>
          <button onClick={() => navigate('meal-plan')} className="nav-link">Meal Plan</button>
          <button onClick={() => navigate('about')} className="nav-link">About Us</button>
        </nav>
      </header>

      <main className="main-content">
        <section className="allergies-section">
          <div className="section-header">
            <h2>Manage Your Allergies</h2>
            <p className="section-description">
              Select all foods you're allergic to. Our meal planning algorithm will ensure these ingredients are excluded from your recommendations.
            </p>
          </div>

          {isSaved && (
            <div className="save-notification">
              ✓ Allergies saved successfully!
            </div>
          )}

          {/* Common Allergies */}
          <div className="allergies-group">
            <h3 className="group-title">Common Food Allergens</h3>
            <div className="allergies-checkbox-list">
              {commonAllergies.map(allergy => (
                <label key={allergy.id} className="allergy-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedAllergies.includes(allergy.id)}
                    onChange={() => handleToggleAllergy(allergy.id)}
                    className="allergy-checkbox-input"
                  />
                  <span className="allergy-checkbox-label">{allergy.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Allergies */}
          <div className="allergies-group">
            <h3 className="group-title">Additional Allergens</h3>
            <div className="allergies-checkbox-list">
              {additionalAllergies.map(allergy => (
                <label key={allergy.id} className="allergy-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedAllergies.includes(allergy.id)}
                    onChange={() => handleToggleAllergy(allergy.id)}
                    className="allergy-checkbox-input"
                  />
                  <span className="allergy-checkbox-label">{allergy.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Allergies */}
          <div className="allergies-group">
            <h3 className="group-title">Add Custom Allergy</h3>
            <div className="custom-allergy-input">
              <input
                type="text"
                placeholder="Enter allergy (e.g., papaya, coconut)"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomAllergy()}
              />
              <button
                className="btn-add"
                onClick={handleAddCustomAllergy}
                disabled={!customAllergy.trim()}
              >
                Add
              </button>
            </div>

            {/* Custom Allergies List */}
            {selectedAllergies.filter(isCustomAllergy).length > 0 && (
              <div className="custom-allergies-list">
                <h4>Your Custom Allergies:</h4>
                <div className="custom-chips">
                  {selectedAllergies.filter(isCustomAllergy).map(allergy => (
                    <div key={allergy} className="custom-chip">
                      <span>{allergy}</span>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveCustomAllergy(allergy)}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Summary */}
          {selectedAllergies.length > 0 && (
            <div className="allergies-summary">
              <h3>Selected Allergies ({selectedAllergies.length})</h3>
              <p>These ingredients will be excluded from your meal plans.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="btn-secondary"
              onClick={handleClearAll}
              disabled={selectedAllergies.length === 0}
            >
              Clear All
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={selectedAllergies.length === 0}
            >
              Save Allergies
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Savr. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Allergies

