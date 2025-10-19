import { useState, useEffect } from "react";
import ReceiptScan from "./pages/ReceiptScan";
import MealPlan from "./pages/MealPlan";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Allergies from "./pages/Allergies";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import "./App.css";

// Initialize session ID on first load
const initializeSession = () => {
  let sessionId = localStorage.getItem('savr_session_id');
  if (!sessionId) {
    // Generate a unique session ID (UUID v4 format)
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('savr_session_id', sessionId);
  }
  return sessionId;
};

function App() {
  // Initialize session on app load
  const [sessionId] = useState(() => initializeSession());
  
  // Start on the LandingPage by default
  const [currentPage, setCurrentPage] = useState("LandingPage");

  // Handle navigation between pages
  const navigate = (page) => {
    console.log('Navigating to:', page);
    setCurrentPage(page);
    window.history.pushState({ page }, "", `#${page}`);
    window.scrollTo(0, 0);
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.page) {
        setCurrentPage(event.state.page);
      } else {
        // Use hash if available, fallback to LandingPage
        const hash = window.location.hash.replace("#", "");
        setCurrentPage(hash || "LandingPage");
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Check hash on first load
    const initialHash = window.location.hash.replace("#", "");
    if (initialHash) setCurrentPage(initialHash);
    else setCurrentPage("LandingPage");

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Render the correct page based on current state
  const renderPage = () => {
    switch (currentPage) {
      case "LandingPage":
      case "home":
        return <LandingPage onNavigate={navigate} />;
      case "Dashboard":
        return <Dashboard onNavigate={navigate} sessionId={sessionId} />;
      case "meals":
      case "meal-plan":
        return <MealPlan onNavigate={navigate} sessionId={sessionId} />;
      case "receipts":
      case "receipt-scan":
        return <ReceiptScan onNavigate={navigate} sessionId={sessionId} />;
      case "about":
        return <AboutUs onNavigate={navigate} />;
      case "contact":
        return <ContactUs onNavigate={navigate} />;
      case "allergies":
        return <Allergies onNavigate={navigate} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="app">{renderPage()}</div>
  );
}

export default App;


