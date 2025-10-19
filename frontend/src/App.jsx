import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/receipt-scan" element={<ReceiptScan />} />
            <Route path="/meal-plan" element={<MealPlan />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/allergies" element={<Allergies />} />
            {/* Redirect old hash routes to new routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


