import './Home.css'

const Home = () => {
  return (
    <div className="home-page">
      <header className="header">
        <h1 className="logo">Savr</h1>
      </header>

      <main className="main-content">
        <section className="hero">
          <h2 className="hero-title">Welcome to Savr</h2>
          <p className="hero-subtitle">
            Your intelligent meal planning assistant
          </p>
          <p className="hero-description">
            Save time and money with personalized meal plans based on your preferences and budget
          </p>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>Smart Meal Planning</h3>
            <p>Get personalized meal plans tailored to your dietary preferences and budget</p>
          </div>

          <div className="feature-card">
            <h3>Receipt Scanner</h3>
            <p>Scan your grocery receipts to track spending and manage your food inventory</p>
          </div>

          <div className="feature-card">
            <h3>Budget Tracking</h3>
            <p>Monitor your grocery spending and stay within your budget goals</p>
          </div>
        </section>

        <section className="cta-section">
          <h2>Coming Soon</h2>
          <p>We're working hard to bring you the best meal planning experience</p>
          <button className="cta-button" disabled>
            Launching Soon
          </button>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Savr. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Home

