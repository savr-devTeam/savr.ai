import { useState } from 'react'
import { uploadReceipt, parseReceipt, analyzeReceiptAI } from '../services/api'
import './ReceiptScan.css'

const ReceiptScan = ({ onNavigate, sessionId }) => {
  const [receiptFile, setReceiptFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStep, setUploadStep] = useState(null) // 'uploading', 'parsing', 'analyzing'
  const [error, setError] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image (JPG, PNG) or PDF file')
        setReceiptFile(null)
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        setReceiptFile(null)
        return
      }
      
      setReceiptFile(file)
      setError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!sessionId) {
      setError('Session not initialized. Please refresh the page.')
      return
    }

    if (!receiptFile) {
      setError('Please select a receipt file')
      return
    }

    setIsProcessing(true)
    setError(null)
    setUploadProgress(0)
    setParsedData(null)
    setAiAnalysis(null)

    try {
      // Step 1: Upload file to S3
      console.log('📤 Uploading receipt to S3...')
      setUploadStep('uploading')
      setUploadProgress(25)
      const uploadResult = await uploadReceipt(receiptFile, sessionId)
      
      console.log('✅ Upload successful:', uploadResult)
      setUploadProgress(50)

      // Step 2: Parse receipt
      console.log('🔍 Parsing receipt...')
      setUploadStep('parsing')
      const parseResult = await parseReceipt(uploadResult.s3Key, sessionId)
      
      console.log('✅ Parse successful:', parseResult)
      setParsedData(parseResult)
      setUploadProgress(75)

      // Step 3: AI Analysis
      console.log('🤖 Running AI analysis...')
      setUploadStep('analyzing')
      try {
        const analysisResult = await analyzeReceiptAI(uploadResult.s3Key, sessionId)
        console.log('✅ AI analysis complete:', analysisResult)
        setAiAnalysis(analysisResult)
      } catch (aiErr) {
        console.warn('⚠️ AI analysis skipped:', aiErr.message)
        // Don't fail the whole process if AI analysis fails
        setAiAnalysis({ error: 'AI analysis not available', message: aiErr.message })
      }
      
      setUploadProgress(100)
      
      // Reset form
      setReceiptFile(null)
      document.getElementById('receipt-upload').value = ''
    } catch (err) {
      const errorMsg = err.message || 'Failed to process receipt. Please try again.'
      setError(errorMsg)
      console.error('❌ Error processing receipt:', err)
    } finally {
      setIsProcessing(false)
      setUploadProgress(0)
      setUploadStep(null)
    }
  }

  return (
    <div className="receipt-scan-page">
      <header className="header">
        <div className="logo-container" onClick={() => onNavigate('home')}>
          <img src="/savricon.png" alt="Savr Logo" className="logo-image" />
          <h1 className="logo">Savr</h1>
        </div>
        <nav className="nav-menu">
          <button onClick={() => onNavigate('home')} className="nav-link">Home</button>
          <button onClick={() => onNavigate('about')} className="nav-link">About Us</button>
          <button onClick={() => onNavigate('contact')} className="nav-link">Contact Us</button>
        </nav>
      </header>

      <main className="main-content">
        <section className="scan-section">
          <h2>Receipt Scanner</h2>
          <p>Upload your grocery receipt to track spending and manage your food inventory</p>

          {/* Error Alert */}
          {error && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              <div>
                <strong>Error:</strong> {error}
              </div>
              <button onClick={() => setError(null)} className="close-btn">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="receipt-form">
            <div className="form-group">
              <label htmlFor="receipt-upload">Upload Receipt</label>
              <input
                type="file"
                id="receipt-upload"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                required
                disabled={isProcessing}
              />
              <small className="form-hint">JPG, PNG, or PDF (max 10MB)</small>
            </div>

            {receiptFile && (
              <div className="file-info">
                <p>✓ Selected file: <strong>{receiptFile.name}</strong></p>
                <p className="file-size">Size: {(receiptFile.size / 1024 / 1024).toFixed(2)}MB</p>
              </div>
            )}

            {/* Upload Progress Bar with Steps */}
            {isProcessing && uploadProgress > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="progress-text">
                  {uploadStep === 'uploading' && '📤 Uploading receipt...'}
                  {uploadStep === 'parsing' && '🔍 Parsing receipt data...'}
                  {uploadStep === 'analyzing' && '🤖 Running AI analysis...'}
                  {uploadProgress === 100 && '✅ Complete!'}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={!receiptFile || isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing Receipt...
                </>
              ) : (
                'Scan Receipt'
              )}
            </button>
          </form>
        </section>

        {/* Parsed Receipt Data Display */}
        {parsedData && (
          <section className="parsed-receipt">
            <h3>Parsed Receipt Data ✅</h3>
            <div className="receipt-content">
              <pre className="code-block">
                {JSON.stringify(parsedData, null, 2)}
              </pre>
            </div>

            {/* AI Analysis Display */}
            {aiAnalysis && (
              <div className="ai-analysis-section">
                <h4>🤖 AI Analysis</h4>
                {aiAnalysis.error ? (
                  <p className="ai-error">{aiAnalysis.message}</p>
                ) : (
                  <div className="ai-insights">
                    <pre className="code-block">
                      {JSON.stringify(aiAnalysis, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => { setParsedData(null); setAiAnalysis(null); }} className="secondary-button">
              Scan Another Receipt
            </button>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Savr. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default ReceiptScan

