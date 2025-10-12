import { useState } from 'react'
import Home from './pages/Home'
import ReceiptScan from './pages/ReceiptScan'
import MealPlan from './pages/MealPlan'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'receipt-scan':
        return <ReceiptScan onNavigate={setCurrentPage} />
      case 'meal-plan':
        return <MealPlan onNavigate={setCurrentPage} />
      default:
        return <Home onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="app">
      {renderPage()}
import Home from './pages/Home'
import './App.css'

function App() {
  return (
    <div className="app">
      <Home />
    </div>
  )
}

export default App

