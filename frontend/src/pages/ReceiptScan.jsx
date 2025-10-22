import { useState } from 'react'
import { uploadReceipt, parseReceipt, analyzeReceipt } from '../services/api'
import './ReceiptScan.css'

const ReceiptScan = ({ onNavigate, sessionId }) => {
  console.log('ReceiptScan component mounted')
  const [receiptFile, setReceiptFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStep, setUploadStep] = useState(null) // 'uploading', 'parsing', 'analyzing'
  const [error, setError] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [aiInsights, setAiInsights] = useState(null)
  const [pendingReceiptId, setPendingReceiptId] = useState(null)

  const fetchAiResults = async () => {
    if (!pendingReceiptId) return

    try {
      setIsProcessing(true)
      setError('Fetching Claude 4.5 results...')
      const userId = user?.userId || 'anonymous'
      const aiAnalysis = await analyzeReceipt(pendingReceiptId, userId)
      console.log('AI Results fetched:', aiAnalysis)
      setAiInsights(aiAnalysis.insights)
      setError(null)
      setPendingReceiptId(null)
    } catch (err) {
      setError('Results are still processing. Please wait 30 more seconds and try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e) => {
    console.log('File input changed:', e.target.files)
    const file = e.target.files[0]
    if (file) {
      console.log('File selected:', { name: file.name, type: file.type, size: file.size })

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        console.error('Invalid file type:', file.type)
        setError('Please upload a valid image (JPG, PNG) or PDF file')
        setReceiptFile(null)
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error('File too large:', file.size)
        setError('File size must be less than 10MB')
        setReceiptFile(null)
        return
      }

      console.log('File validated and set')
      setReceiptFile(file)
      setError(null)
    } else {
      console.log('No file selected')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!receiptFile) {
      setError('Please select a receipt file')
      return
    }

    setIsProcessing(true)
    setError(null)
    setUploadProgress(0)
    setParsedData(null)
    setAiInsights(null)

    try {
      // Use logged in user ID or fallback to anonymous (matches backend)
      const userId = user?.userId || 'anonymous'

      // Step 1: Upload file to S3
      console.log('Uploading receipt to S3...')
      setUploadProgress(25)
      const uploadResult = await uploadReceipt(receiptFile)

      console.log('Upload successful:', uploadResult)
      setUploadProgress(50)

      // Step 2: Parse receipt with Textract
      console.log('Parsing receipt with Textract...')
      const parseResult = await parseReceipt(uploadResult.s3Key)

      console.log('Parse successful:', parseResult)
      setParsedData(parseResult)
      setUploadProgress(75)

      // Step 3: Analyze with Claude 4.5 AI
      console.log('Analyzing with Claude 4.5 AI (this takes 30-60 seconds)...')
      const receiptId = parseResult.result?.receipt_id
      if (receiptId) {
        try {
          const aiAnalysis = await analyzeReceipt(receiptId, userId)
          console.log('AI Analysis complete:', aiAnalysis)
          setAiInsights(aiAnalysis.insights)
        } catch (aiError) {
          console.warn('AI analysis timeout (expected - Claude 4.5 takes 30+ seconds)')
          // Store receipt ID for manual fetch
          setPendingReceiptId(receiptId)
          setError('Claude 4.5 is analyzing your receipt (takes 30-60 seconds). Click "Fetch Results" in 30 seconds.')
        }
      }

      setUploadProgress(100)

      // Reset form
      setReceiptFile(null)
      document.getElementById('receipt-upload').value = ''
    } catch (err) {
      const errorMsg = err.message || 'Failed to process receipt. Please try again.'
      setError(errorMsg)
      console.error('Error processing receipt:', err)
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
              <span className="error-icon">!</span>
              <div>
                <strong>Error:</strong> {error}
              </div>
              <button onClick={() => setError(null)} className="close-btn">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="receipt-form">
            {/* Drag and Drop Area */}
            <div
              className={`drag-drop-area ${receiptFile ? 'has-file' : ''}`}
              onClick={() => document.getElementById('receipt-upload')?.click()}
            >
              <input
                type="file"
                id="receipt-upload"
                accept="image/jpeg,image/png,image/jpg,.pdf"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="file-input"
              />

              {receiptFile ? (
                <div className="file-selected">
                  <div className="file-icon">📄</div>
                  <p className="file-name">{receiptFile.name}</p>
                  <p className="file-size">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    type="button"
                    className="change-file-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      document.getElementById('receipt-upload').value = ''
                      setReceiptFile(null)
                    }}
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="drag-drop-content">
                  <div className="upload-icon">📸</div>
                  <p className="drag-text">Drag and drop your receipt here</p>
                  <p className="or-text">or</p>
                  <button type="button" className="browse-btn">Browse Device</button>
                  <p className="hint-text">JPG, PNG, or PDF (max 10MB)</p>
                </div>
              )}
            </div>

            {receiptFile && (
              <div className="file-info">
                <p>Selected file: <strong>{receiptFile.name}</strong></p>
                <p className="file-size">Size: {(receiptFile.size / 1024 / 1024).toFixed(2)}MB</p>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isProcessing && uploadProgress > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="progress-text">
                  {uploadProgress === 25 && 'Uploading to S3...'}
                  {uploadProgress === 50 && 'Parsing with Textract...'}
                  {uploadProgress === 75 && 'Analyzing with Claude 4.5 AI...'}
                  {uploadProgress === 100 && 'Analysis Complete!'}
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
                '🔍 Scan Receipt'
              )}
            </button>
          </form>
        </section>

        {/* Parsed Receipt Data Display */}
        {parsedData && (
          <section className="parsed-receipt">
            <h3>Parsed Receipt Data</h3>
            <div className="receipt-content">
              <pre className="code-block">
                {JSON.stringify(parsedData, null, 2)}
              </pre>
            </div>

            {/* Fetch AI Results Button */}
            {pendingReceiptId && !aiInsights && (
              <button
                onClick={fetchAiResults}
                className="fetch-results-btn"
                disabled={isProcessing}
              >
                {isProcessing ? 'Fetching...' : 'Fetch Claude 4.5 Results'}
              </button>
            )}
          </section>
        )}

        {/* AI Insights Display */}
        {aiInsights && (
          <section className="ai-insights">
            <h3>Claude 4.5 AI Analysis</h3>

            {/* Health Score */}
            <div className="insight-card health-score">
              <h4>Health Score</h4>
              <div className="score-display">
                <span className="score-number">{aiInsights.nutritionalAssessment?.healthScore || 'N/A'}</span>
                <span className="score-max">/10</span>
              </div>
              <p className="score-description">
                {aiInsights.nutritionalAssessment?.balanceDescription}
              </p>
              <div className="item-counts">
                <span className="healthy">Healthy items: {aiInsights.nutritionalAssessment?.healthyItemsCount || 0}</span>
                <span className="unhealthy">Unhealthy items: {aiInsights.nutritionalAssessment?.unhealthyItemsCount || 0}</span>
              </div>
            </div>

            {/* Budget Analysis */}
            <div className="insight-card budget">
              <h4>Budget Analysis</h4>
              <p><strong>Total Spent:</strong> ${aiInsights.budgetAnalysis?.totalSpent || 0}</p>
              <p><strong>Status:</strong> {aiInsights.budgetAnalysis?.budgetStatus || 'N/A'}</p>
              {aiInsights.budgetAnalysis?.averageItemCost && (
                <p><strong>Average per item:</strong> ${aiInsights.budgetAnalysis.averageItemCost}</p>
              )}
              {aiInsights.budgetAnalysis?.savingsOpportunities?.length > 0 && (
                <div className="savings">
                  <strong>Savings Opportunities:</strong>
                  <ul>
                    {aiInsights.budgetAnalysis.savingsOpportunities.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Categories */}
            {aiInsights.categories && (
              <div className="insight-card categories">
                <h4>Item Categories</h4>
                <div className="category-grid">
                  {Object.entries(aiInsights.categories).map(([category, items]) => (
                    items.length > 0 && (
                      <div key={category} className="category-section">
                        <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                        <ul>
                          {items.map((item, idx) => (
                            <li key={idx}>{item.name} - ${item.price}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Recipe Suggestions */}
            {aiInsights.recipeSuggestions?.length > 0 && (
              <div className="insight-card recipes">
                <h4>Recipe Suggestions</h4>
                <div className="recipe-grid">
                  {aiInsights.recipeSuggestions.map((recipe, idx) => (
                    <div key={idx} className="recipe-card">
                      <h5>{recipe.name}</h5>
                      <p><strong>Prep time:</strong> {recipe.prepTime}</p>
                      <p><strong>Servings:</strong> {recipe.servings}</p>
                      <p><strong>Estimated cost:</strong> ${recipe.estimatedCost}</p>
                      {recipe.ingredients?.length > 0 && (
                        <div className="ingredients">
                          <strong>Ingredients:</strong>
                          <ul>
                            {recipe.ingredients.map((ing, i) => (
                              <li key={i}>{ing}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Plan Ideas */}
            {aiInsights.mealPlanIdeas?.length > 0 && (
              <div className="insight-card meal-plans">
                <h4>Meal Plan Ideas</h4>
                <ul className="meal-list">
                  {aiInsights.mealPlanIdeas.map((meal, idx) => (
                    <li key={idx}>{meal}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Health Tips */}
            {aiInsights.healthTips?.length > 0 && (
              <div className="insight-card health-tips">
                <h4>Health Tips</h4>
                <ul className="tips-list">
                  {aiInsights.healthTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Essentials */}
            {aiInsights.missingEssentials?.length > 0 && (
              <div className="insight-card missing-items">
                <h4>Missing Essentials</h4>
                <ul>
                  {aiInsights.missingEssentials.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={() => {
              setParsedData(null)
              setAiInsights(null)
            }} className="secondary-button">
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

