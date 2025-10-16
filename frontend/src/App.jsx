import { useState, useEffect } from 'react'
import Home from './pages/Home'
import ReceiptScan from './pages/ReceiptScan'
import MealPlan from './pages/MealPlan'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import Allergies from './pages/Allergies'
import LandingPage from './pages/LandingPage'
import './App.css'

function App() {
  // 🟢 Set default page to 'signup'
  const [currentPage, setCurrentPage] = useState('LandingPage')

  // Function to handle navigation when buttons/links are clicked
  const navigate = (page) => {
    setCurrentPage(page)
    window.history.pushState({ page }, '', `#${page}`)
  }

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.page) {
        setCurrentPage(event.state.page)
      } else {
        // Use hash if available, fallback to signup
        const hash = window.location.hash.replace('#', '')
        setCurrentPage(hash || 'LandingPage')
      }
    }

    // Listen for back/forward navigation
    window.addEventListener('popstate', handlePopState)

    // Check URL hash on first load
    const initialHash = window.location.hash.replace('#', '')
    if (initialHash) setCurrentPage(initialHash)

    // Cleanup listener when component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Function to decide which page component to render
  const renderPage = () => {
    switch (currentPage) {
      case 'LandingPage':
        return <LandingPage onNavigate={navigate} />
      case 'receipt-scan':
        return <ReceiptScan onNavigate={navigate} />
      case 'meal-plan':
        return <MealPlan onNavigate={navigate} />
      case 'about':
        return <AboutUs onNavigate={navigate} />
      case 'contact':
        return <ContactUs onNavigate={navigate} />
      case 'allergies':
        return <Allergies onNavigate={navigate} />
      default:
        return <Home onNavigate={navigate} />
    }
  }

  return <div className="app">{renderPage()}</div>
}

export default App

