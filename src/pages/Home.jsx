import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Home.css';

const Homepage = () => {
  const navigate = useNavigate();
  const observerRef = useRef(null);

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all elements with fade-in class
    document.querySelectorAll('.fade-in').forEach(el => {
      observerRef.current.observe(el);
    });

    // Header background change on scroll
    const handleScroll = () => {
      const header = document.querySelector('.header');
      if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
      } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Smooth scroll function
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Navigation handlers
  const handleLogin = () => {
    navigate('/login');
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  // Feature card hover handlers
  const handleCardMouseEnter = (e) => {
    e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
  };

  const handleCardMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
  };

  // Contact form handler
  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Add your contact form submission logic here
    alert('Thank you for your message! We will get back to you soon.');
  };

  return (
    <div className="homepage">
      {/* Header */}
      <header className="header">
        <nav className="nav">
          <a href="#" className="logo">Neveh Horim</a>
          <ul className="nav-links">
            <li><a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>Contact</a></li>
            <li><a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')}>Features</a></li>
            <li><a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')}>About</a></li>
            <li><button onClick={handleLogin} className="login-btn">Login</button></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero" id="about">
        <div className="hero-content">
          <h1>Dedicated Care In a Family Atmosphere</h1>
          <p>We believe that every person, regardless of who they are, deserves to age with dignity while preserving their respect, independence, and quality of life. We believe that every resident in the home has the right to privacy and dignity both during care and beyond.</p>
          <div className="cta-buttons">
            <button onClick={handleGetStarted} className="btn btn-primary">
              <span>Get Started</span>
              <span>→</span>
            </button>
            <button onClick={(e) => handleSmoothScroll(e, '#contact')} className="btn btn-secondary">
              <span>Contact Us</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header fade-in">
            <h2>The platform makes volunteering accessible, organized, and impactful for everyone involved.</h2>
          </div>
          <div className="features-grid">
            <div 
              className="feature-card fade-in"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="feature-icon">
                📅
              </div>
              <h3>Smart Scheduling</h3>
              <p>Easily browse and sign up for volunteer opportunities that fit your schedule.</p>
            </div>
            <div 
              className="feature-card fade-in"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="feature-icon">
                🎯
              </div>
              <h3>Personalized Matching</h3>
              <p>Find opportunities that match your skills, interests, and availability. Make every hour count.</p>
            </div>
            <div 
              className="feature-card fade-in"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="feature-icon">
                📱
              </div>
              <h3>Mobile Friendly</h3>
              <p>Access your volunteer dashboard anywhere. Confirm attendance, check schedules, and stay connected on the go.</p>
            </div>
            <div 
              className="feature-card fade-in"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="feature-icon">
                🏆
              </div>
              <h3>Achievement System</h3>
              <p>Earn badges and recognition for your volunteer work. Celebrate milestones and inspire others to get involved.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="contact-us" id="contact">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Contact Us</h2>
            <p>Get in touch with our team. We're here to help and answer any questions you may have.</p>
          </div>
          <div className="contact-content">
            <div className="contact-info fade-in">
              <div className="contact-item">
                <div className="contact-icon">
                  📍
                </div>
                <div className="contact-details">
                  <h3>Location</h3>
                  <p>Ma'ale Ze'ev Street 3<br />Jerusalem, Israel</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  📞
                </div>
                <div className="contact-details">
                  <h3>Phone</h3>
                  <p>02-6403333</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  ✉️
                </div>
                <div className="contact-details">
                  <h3>Email</h3>
                  <p>mazkirut.nevehhorim@gmail.com</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  🖨️
                </div>
                <div className="contact-details">
                  <h3>Fax</h3>
                  <p>02-6792504</p>
                </div>
              </div>
            </div>
            <div className="contact-form fade-in">
              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" name="name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <select id="subject" name="subject" required>
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="volunteer">Volunteer Opportunities</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows="5" required></textarea>
                </div>
                <button type="submit" className="btn btn-primary contact-submit-btn">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="about">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')}>About Us</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#support">Support</a>
            <a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>Contact</a>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Neveh Horim. All rights reserved. Making communities stronger, one volunteer at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;