import './AboutUs.css'

const AboutUs = () => {
  const navigate = useNavigation();
  return (
    <div className="about-page">
      <header className="header">
        <div className="logo-container" onClick={() => navigate('home')}>
          <img src="/savricon.png" alt="Savr Logo" className="logo-image" />
          <h1 className="logo">Savr</h1>
        </div>
        <nav className="nav-menu">
          <button onClick={() => navigate('home')} className="nav-link">Home</button>
          <button onClick={() => navigate('about')} className="nav-link active">About Us</button>
          <button onClick={() => navigate('contact')} className="nav-link">Contact Us</button>
        </nav>
      </header>

      <main className="main-content">
        <section className="about-section">
          <h2>About Savr</h2>

          <div className="mission-statement">
            <h3>Our Mission</h3>
            <p>
              At Savr, we're on a mission to revolutionize the way people plan their meals and manage their grocery budgets.
              We believe that eating well shouldn't break the bank, and that smart meal planning should be accessible to everyone.
            </p>
          </div>

          <div className="vision-section">
            <h3>What We Do</h3>
            <p>
              Savr is an intelligent meal planning assistant that combines your dietary preferences, nutrition goals,
              and budget constraints to create personalized meal plans that work for you. Our platform helps you:
            </p>
            <ul className="feature-list">
              <li><strong>Plan Smarter:</strong> Get customized meal plans based on your unique needs and budget</li>
              <li><strong>Save Money:</strong> Track your grocery spending and optimize your food budget</li>
              <li><strong>Eat Better:</strong> Meet your nutrition goals with balanced, delicious meals</li>
              <li><strong>Reduce Waste:</strong> Manage your food inventory and minimize waste</li>
            </ul>
          </div>

          <div className="values-section">
            <h3>Our Values</h3>
            <div className="values-grid">
              <div className="value-card">
                <h4>Personalization</h4>
                <p>Every person has unique dietary needs and preferences. We tailor our recommendations to fit your lifestyle.</p>
              </div>
              <div className="value-card">
                <h4>Affordability</h4>
                <p>Good nutrition shouldn't be a luxury. We help you eat well while staying within your budget.</p>
              </div>
              <div className="value-card">
                <h4>Sustainability</h4>
                <p>We're committed to helping you reduce food waste and make environmentally conscious choices.</p>
              </div>
              <div className="value-card">
                <h4>Innovation</h4>
                <p>We leverage cutting-edge technology to make meal planning effortless and enjoyable.</p>
              </div>
            </div>
          </div>

          <div className="story-section">
            <h3>Our Story</h3>
            <p>
              Savr was born from a simple observation: too many people struggle with the daily question of "what's for dinner?"
              while also trying to manage their budgets and health goals. We set out to create a solution that makes meal
              planning intuitive, affordable, and tailored to each individual's needs.
            </p>
            <p>
              Today, Savr helps people save time, money, and stress by providing smart meal planning solutions that adapt
              to your life, not the other way around.
            </p>
          </div>

          <div className="cta-section">
            <h3>Ready to Start Saving?</h3>
            <p>Join Savr today and transform the way you plan your meals.</p>
            <button onClick={() => navigate('meal-plan')} className="cta-button">
              Get Started
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Savr. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default AboutUs

