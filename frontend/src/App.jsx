import { useState, useEffect } from 'react'
import Home from './pages/Home'
import ReceiptScan from './pages/ReceiptScan'
import MealPlan from './pages/MealPlan'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import Allergies from './pages/Allergies'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'

import './App.css'

function App() {
  // Start on the LandingPage by default
  const [currentPage, setCurrentPage] = useState('LandingPage')

  // Handle navigation
  const navigate = (page) => {
    setCurrentPage(page)
    window.history.pushState({ page }, '', `#${page}`)
  }

  // Handle browser back/forward arrows
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.page) {
        setCurrentPage(event.state.page)
      } else {
        // Use hash if available, fallback to LandingPage
        const hash = window.location.hash.replace('#', '')
        setCurrentPage(hash || 'LandingPage')
      }
    }

    window.addEventListener('popstate', handlePopState)

    // Check hash on first load
    const initialHash = window.location.hash.replace('#', '')
    if (initialHash) setCurrentPage(initialHash)
    else setCurrentPage('LandingPage')

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Render correct page
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

