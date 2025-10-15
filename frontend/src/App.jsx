import { useState, useEffect } from 'react'
import Home from './pages/Home'
import ReceiptScan from './pages/ReceiptScan'
import MealPlan from './pages/MealPlan'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import Allergies from './pages/Allergies'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  // Handle manual navigation
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
        // default if there's no state
        const hash = window.location.hash.replace('#', '')
        setCurrentPage(hash || 'home')
      }
    }

    // Listen for back/forward navigation
    window.addEventListener('popstate', handlePopState)

    
    const initialHash = window.location.hash.replace('#', '')
    if (initialHash) setCurrentPage(initialHash)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'receipt-scan':
        return <ReceiptScan onNavigate={navigate} />
      case 'meal-plan':
        return <MealPlan onNavigate={navigate} />
      case 'about':
        return <AboutUs onNavigate={setCurrentPage} />
      case 'contact':
        return <ContactUs onNavigate={setCurrentPage} />
      case 'allergies':
        return <Allergies onNavigate={setCurrentPage} />
      default:
        return <Home onNavigate={navigate} />
    }
  }

  return <div className="app">{renderPage()}</div>
}

export default App
