import { useState } from 'react'
import { useNavigation } from '../hooks/useNavigation'
import './ContactUs.css'

const ContactUs = () => {
  const navigate = useNavigation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement contact form submission logic
    console.log('Contact form submitted:', formData)
    setIsSubmitted(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' })
      setIsSubmitted(false)
    }, 3000)
  }

  return (
    <div className="contact-page">
      <header className="header">
        <div className="logo-container" onClick={() => navigate('home')}>
          <img src="/savricon.png" alt="Savr Logo" className="logo-image" />
          <h1 className="logo">Savr</h1>
        </div>
        <nav className="nav-menu">
          <button onClick={() => navigate('home')} className="nav-link">Home</button>
          <button onClick={() => navigate('about')} className="nav-link">About Us</button>
          <button onClick={() => navigate('contact')} className="nav-link active">Contact Us</button>
        </nav>
      </header>

      <main className="main-content">
        <section className="contact-section">
          <h2>Contact Us</h2>
          <p className="contact-intro">
            Have questions, feedback, or suggestions? We'd love to hear from you!
            Fill out the form below and we'll get back to you as soon as possible.
          </p>

          <div className="contact-container">
            <div className="contact-info">
              <h3>Get In Touch</h3>
              <div className="info-item">
                <div>
                  <h4>Email</h4>
                  <p>support@savr.ai</p>
                </div>
              </div>
              <div className="info-item">
                <div>
                  <h4>Support</h4>
                  <p>Available Monday - Friday, 9am - 5pm EST</p>
                </div>
              </div>
              <div className="info-item">
                <div>
                  <h4>Social Media</h4>
                  <p>Follow us for updates and tips</p>
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              {isSubmitted ? (
                <div className="success-message">
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. We'll get back to you soon!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      rows="6"
                      required
                    />
                  </div>

                  <button type="submit" className="submit-button">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Savr. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default ContactUs

