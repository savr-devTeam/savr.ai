import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import ReceiptScan from "./pages/ReceiptScan";
import MealPlan from "./pages/MealPlan";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Allergies from "./pages/Allergies";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import AuthCallback from "./pages/AuthCallback";
import "./App.css";

function App() {
  // Start on the LandingPage by default
  const [currentPage, setCurrentPage] = useState("LandingPage");

  // Handle navigation between pages
  const navigate = (page) => {
    setCurrentPage(page);
    window.history.pushState({ page }, "", `#${page}`);
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

  // Check for auth callback on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('code')) {
      setCurrentPage('auth-callback');
    }
  }, []);

  // Render the correct page based on current state
  const renderPage = () => {
    switch (currentPage) {
      case "LandingPage":
      case "home":
        return <LandingPage onNavigate={navigate} />;
      case "Dashboard":
        return <Dashboard onNavigate={navigate} />;
      case "auth-callback":
        return <AuthCallback onNavigate={navigate} />;
      case "receipt-scan":
        return <ReceiptScan onNavigate={navigate} />;
      case "meal-plan":
        return <MealPlan onNavigate={navigate} />;
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
    <AuthProvider>
      <div className="app">{renderPage()}</div>
    </AuthProvider>
  );
}

export default App;


