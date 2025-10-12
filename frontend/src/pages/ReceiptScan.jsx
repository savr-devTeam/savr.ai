import { useState } from 'react'
import './ReceiptScan.css'

const ReceiptScan = ({ onNavigate }) => {
  const [receiptFile, setReceiptFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setReceiptFile(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsProcessing(true)
    // TODO: Implement receipt processing logic
    console.log('Processing receipt:', receiptFile)
  }

  return (
    <div className="receipt-scan-page">
      <header className="header">
        <div className="logo-container" onClick={() => onNavigate('home')}>
          <img src="/savricon.png" alt="Savr Logo" className="logo-image" />
          <h1 className="logo">Savr</h1>
        </div>
        <nav>
          <button onClick={() => onNavigate('home')} className="nav-link">Home</button>
        </nav>
      </header>

      <main className="main-content">
        <section className="scan-section">
          <h2>Receipt Scanner</h2>
          <p>Upload your grocery receipt to track spending and manage your food inventory</p>

          <form onSubmit={handleSubmit} className="receipt-form">
            <div className="form-group">
              <label htmlFor="receipt-upload">Upload Receipt</label>
              <input
                type="file"
                id="receipt-upload"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                required
              />
            </div>

            {receiptFile && (
              <div className="file-info">
                <p>Selected file: {receiptFile.name}</p>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={!receiptFile || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Scan Receipt'}
            </button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Savr. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default ReceiptScan

