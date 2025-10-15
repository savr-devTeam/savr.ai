import './Home.css'

const Home = ({ onNavigate }) => {
  return (
    <div className="welcome-page">
      {/* Header */}
      <header className="welcome-header">
        <div className="logo-section">
          <img src="/savricon.png" alt="Savr Logo" className="welcome-logo-image" />
          <h1 className="welcome-logo-text">Savr</h1>
        </div>
        
        <nav className="welcome-nav-icons">
          <button className="icon-btn" title="Today">
            <svg width="39" height="34" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </button>
          <button className="icon-btn" title="Saved">
            <svg width="33" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
          <button className="icon-btn" title="Profile">
            <svg width="30" height="29" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </button>
          <button className="icon-btn" title="Home">
            <svg width="29" height="29" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
        </nav>
      </header>

      {/* Divider Line */}
      <div className="divider-line"></div>

      {/* Main Content */}
      <main className="welcome-main">
        {/* Today Section */}
        <section className="today-section">
          <h2 className="section-title">Today</h2>
          <div className="recipe-card">
            <div className="recipe-image">
              <div className="recipe-tags">
                <span className="recipe-tag">Dinner</span>
                <span className="recipe-tag">30 mins</span>
              </div>
            </div>
            <h3 className="recipe-title">Southern Fried Chicken</h3>
          </div>
          <button className="btn-primary weekly-menu-btn" onClick={() => onNavigate('meal-plan')}>
            Weekly menu
          </button>
        </section>

        {/* Grocery List Section */}
        <section className="grocery-section">
          <h2 className="section-title">Grocery List</h2>
          <div className="grocery-list-card">
            <div className="grocery-item">
              <input type="checkbox" id="item1" className="grocery-checkbox" />
              <label htmlFor="item1" className="grocery-label">2 lbs chicken breast</label>
            </div>
            <div className="grocery-item">
              <input type="checkbox" id="item2" className="grocery-checkbox" />
              <label htmlFor="item2" className="grocery-label">1 pint Heavy Cream</label>
            </div>
            <div className="grocery-item">
              <input type="checkbox" id="item3" className="grocery-checkbox" />
              <label htmlFor="item3" className="grocery-label">Whole garlic</label>
            </div>
            <div className="grocery-item">
              <input type="checkbox" id="item4" className="grocery-checkbox" />
              <label htmlFor="item4" className="grocery-label">5 lbs petite potatoes</label>
            </div>
            <a href="#" className="view-more-link">View more</a>
          </div>
          <button className="btn-primary add-items-btn" onClick={() => onNavigate('receipt-scan')}>
            Add items
          </button>
        </section>
      </main>

      {/* Bottom Action Cards */}
      <footer className="welcome-footer">
        <button className="action-card action-card-red">
          Virtual Pantry
        </button>
        <button className="action-card action-card-red" onClick={() => onNavigate('allergies')}>
          Allergies
        </button>
        <button className="action-card action-card-green">
          Food Prefrences
        </button>
      </footer>
    </div>
  )
}

export default Home


