import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="pacifico-regular logo">Savr</h1>
        <nav className="dashboard-icons">
          <i className="fa-regular fa-heart"></i>
          <i className="fa-regular fa-user"></i>
          <i className="fa-solid fa-house"></i>
        </nav>
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
              <img src= "/attachclip.png" 
              className="attach-icon"/> Attach
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          {/* Meal Plan Section */}
          <section className="card meal-plan">
            <h2>Today's Meal</h2>
            <p className="date">Tuesday, October 23</p>

            <button className="meal-item">
              <h4>Breakfast</h4>
              <div className="meal-detail">
                <img src="/omelette.jpg" alt="Omelette" />
                <div>
                  <p className="meal-name">Vegetable Omelette</p>
                  <p className="ingredients">List ingredients here</p>
                </div>
              </div>
            </button>

            <button className="meal-item">
              <h4>Lunch</h4>
              <div className="meal-detail">
                <img src="/wrap.jpg" alt="Wrap" />
                <div>
                  <p className="meal-name">Turkey and Avocado Wrap</p>
                  <p className="ingredients">List ingredients here</p>
                </div>
              </div>
            </button>

            <button className="meal-item">
              <h4>Dinner</h4>
              <div className="meal-detail">
                <img src="/curry.jpg" alt="Curry" />
                <div>
                  <p className="meal-name">Chickpea Curry</p>
                  <p className="ingredients">List ingredients here</p>
                </div>
              </div>
            </button>

            <button className="view-meal-btn">View Meal Plan 🍽️</button>
          </section>

          {/* Bottom Row (Allergies, Budget, Grocery List) */}
          <div className="bottom-row">
            {/* Allergies Card */}
            <section className="card allergies">
              <div className="card-header">
                <h3>Allergies</h3>
                <img src= '/editicon.png' className="edit-allergy-btn" />
                <i className="fa-regular fa-pen-to-square"></i>
              </div>
              <div className="tags">
                <span>Almonds</span>
                <span>Gluten</span>
                <span>Dairy</span>
              </div>
            </section>

            {/* Weekly Budget Card */}
            <section className="card budget">
              <div className="card-header">
                <h3>Weekly Budget</h3>
                <img src= "/editicon.png" className="edit-budget-btn"/>
                <i className="fa-regular fa-pen-to-square"></i>
              </div>
              <h2>$150</h2>
              <div className="progress-bar">
                <div className="progress" style={{ width: "60%" }}></div>
              </div>
              <p className="remaining">$60 remaining</p>
            </section>

            {/* Grocery List Card */}
            <section className="card grocery-list">
              <div className="card-header">
                <h3>🛒 Grocery List</h3>
              </div>
              <ul>
                <li>
                  <input type="checkbox" /> 1 lb Chicken breast
                </li>
                <li>
                  <input type="checkbox" /> 5 lbs Russet Potatoes
                </li>
                <li>
                  <input type="checkbox" /> 1 Garlic clove
                </li>
                <li>
                  <input type="checkbox" /> 1 Roma Tomato
                </li>
              </ul>
              <button className="view-more-btn">View More</button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
