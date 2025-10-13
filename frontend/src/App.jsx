import { useState } from 'react'
import Home from './pages/Home'
import ReceiptScan from './pages/ReceiptScan'
import MealPlan from './pages/MealPlan'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'receipt-scan':
        return <ReceiptScan onNavigate={setCurrentPage} />
      case 'meal-plan':
        return <MealPlan onNavigate={setCurrentPage} />
      case 'about':
        return <AboutUs onNavigate={setCurrentPage} />
      case 'contact':
        return <ContactUs onNavigate={setCurrentPage} />
      default:
        return <Home onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="app">
      {renderPage()}
    </div>
  )
}

export default App


