import React from "react";
import "./Dashboard.css";


const Dashboard = ({ onNavigate }) => {
  return (
    <div className="dashboard">
      <header className="header">
        <h1 className="logo" onClick={() => onNavigate("LandingPage")}>
          Savr
        </h1>
      </header>

      <main className="content">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="assistant-box">
            <h2>How can I help you?</h2>
            <button onClick={() => onNavigate("substitute")}>
              Find a substitute ingredient
            </button>
            <button onClick={() => onNavigate("meal-plan")}>
              Start meal planning for next week
            </button>
            <button onClick={() => onNavigate("receipt-scan")}>
              Upload receipt
            </button>
          </div>

          <div className="chat-box">
            <input type="text" placeholder="Ask Anything" />
            <button className="attach-btn">@ Attach</button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="meal-plan card">
            <h2>Meal Plan</h2>
            <p className="date">Tuesday, October 23</p>
            <div className="meal-item">
              <h3>Breakfast</h3>
              <p className="meal-title">Vegetable Omelette</p>
              <p className="meal-ingredients">List ingredients here</p>
            </div>
            <div className="meal-item">
              <h3>Lunch</h3>
              <p className="meal-title">Turkey and Avocado Wrap</p>
              <p className="meal-ingredients">List ingredients here</p>
            </div>
            <div className="meal-item">
              <h3>Dinner</h3>
              <p className="meal-title">Chickpea Curry</p>
              <p className="meal-ingredients">List ingredients here</p>
            </div>
            <p className="view-more">View More</p>
          </div>

          <div className="card allergies">
            <div className="card-header">
              <h3>Allergies</h3>
              <FaEdit />
            </div>
            <div className="tags">
              <span>Almonds</span>
              <span>Gluten</span>
              <span>Dairy</span>
            </div>
          </div>

          <div className="card budget">
            <div className="card-header">
              <h3>Weekly Budget</h3>
              <FaEdit />
            </div>
            <h2>$150</h2>
            <div className="progress-bar">
              <div className="progress" style={{ width: "60%" }}></div>
            </div>
            <p>$60 remaining</p>
          </div>

          <div className="card grocery-list">
            <h3>Grocery List 🛒</h3>
            <ul>
              <li><input type="checkbox" /> 1 lb Chicken breast</li>
              <li><input type="checkbox" /> 5 lbs Russet Potatoes</li>
              <li><input type="checkbox" /> 1 Garlic Clove</li>
              <li><input type="checkbox" /> 1 Roma Tomato</li>
            </ul>
            <p className="view-more">View More</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

