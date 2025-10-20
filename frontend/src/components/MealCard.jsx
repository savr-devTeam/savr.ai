import React from 'react'
import './MealCard.css'

/**
 * Reusable MealCard component displaying meal information
 * @param {Object} props - Component props
 * @param {string} props.mealType - Type of meal (Breakfast, Lunch, Dinner)
 * @param {string} props.mealName - Name of the meal
 * @param {Array<string>} props.ingredients - List of ingredients
 * @param {Object} props.nutrition - Nutrition information (calories, protein, carbs, fat)
 * @param {number} props.prepTime - Preparation time in minutes
 * @param {Function} props.onClick - Optional click handler
 * @param {boolean} props.isLoading - Show loading state
 */
const MealCard = ({ 
  mealType = 'Meal', 
  mealName = 'TBD', 
  ingredients = [], 
  nutrition = {},
  prepTime = null,
  onClick,
  isLoading = false 
}) => {
  const handleClick = () => {
    if (onClick && !isLoading) {
      onClick()
    }
  }

  return (
    <div 
      className={`meal-card ${isLoading ? 'loading' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : -1}
    >
      {/* Meal Type Badge */}
      <div className="meal-badge">{mealType}</div>

      {/* Meal Image Placeholder */}
      <div className="meal-image-placeholder">
        {isLoading ? (
          <span className="spinner"></span>
        ) : (
          '🍽️'
        )}
      </div>

      {/* Meal Content */}
      <div className="meal-content">
        {/* Meal Name */}
        <h3 className="meal-name">
          {isLoading ? <span className="skeleton"></span> : mealName}
        </h3>

        {/* Prep Time */}
        {prepTime && !isLoading && (
          <p className="prep-time">⏱️ {prepTime} mins</p>
        )}

        {/* Ingredients List */}
        {ingredients && ingredients.length > 0 && (
          <div className="ingredients-section">
            <p className="ingredients-label">Ingredients:</p>
            <ul className="ingredients-list">
              {ingredients.slice(0, 3).map((ingredient, idx) => (
                <li key={idx} className="ingredient-item">
                  {ingredient}
                </li>
              ))}
              {ingredients.length > 3 && (
                <li className="ingredient-more">
                  +{ingredients.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Nutrition Info */}
        {nutrition && Object.keys(nutrition).length > 0 && (
          <div className="nutrition-section">
            <p className="nutrition-label">Nutrition:</p>
            <div className="nutrition-grid">
              {nutrition.calories && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{nutrition.calories}</span>
                  <span className="nutrition-unit">cal</span>
                </div>
              )}
              {nutrition.protein && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{nutrition.protein}g</span>
                  <span className="nutrition-unit">protein</span>
                </div>
              )}
              {nutrition.carbs && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{nutrition.carbs}g</span>
                  <span className="nutrition-unit">carbs</span>
                </div>
              )}
              {nutrition.fat && (
                <div className="nutrition-item">
                  <span className="nutrition-value">{nutrition.fat}g</span>
                  <span className="nutrition-unit">fat</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click Hint */}
      {onClick && (
        <div className="click-hint">
          <p>ℹ️ Click for more details</p>
        </div>
      )}
    </div>
  )
}

export default MealCard
