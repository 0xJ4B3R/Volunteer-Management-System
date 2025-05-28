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

  return (
    <div className="homepage">
      {/* Header */}
      <header className="header">
        <nav className="nav">
          <a href="#" className="logo">VolunteerHub</a>
          <ul className="nav-links">
            <li><a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')}>Features</a></li>
            <li><a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, '#how-it-works')}>How It Works</a></li>
            <li><a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')}>About</a></li>
            <li><a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>Contact</a></li>
            <li><button onClick={handleLogin} className="login-btn">Login</button></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Making a Difference Together</h1>
          <p>Connect with meaningful volunteer opportunities and manage your community service with ease. Join thousands of volunteers making an impact every day.</p>
          <div className="cta-buttons">
            <button onClick={handleGetStarted} className="btn btn-primary">
              <span>Get Started</span>
              <span>→</span>
            </button>
            <button onClick={(e) => handleSmoothScroll(e, '#how-it-works')} className="btn btn-secondary">
              <span>Learn More</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Why Choose VolunteerHub?</h2>
            <p>Our platform makes volunteering accessible, organized, and impactful for everyone involved.</p>
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
              <p>Easily browse and sign up for volunteer opportunities that fit your schedule. Get real-time updates and confirmations.</p>
            </div>
            <div 
              className="feature-card fade-in"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="feature-icon">
                👥
              </div>
              <h3>Community Connection</h3>
              <p>Connect with like-minded volunteers and organizations. Build lasting relationships while making a difference.</p>
            </div>
            <div 
              className="feature-card fade-in"
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="feature-icon">
                📊
              </div>
              <h3>Impact Tracking</h3>
              <p>Track your volunteer hours, see your impact, and earn recognition for your community service contributions.</p>
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

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item fade-in">
              <h3>5,000+</h3>
              <p>Active Volunteers</p>
            </div>
            <div className="stat-item fade-in">
              <h3>250+</h3>
              <p>Partner Organizations</p>
            </div>
            <div className="stat-item fade-in">
              <h3>50,000+</h3>
              <p>Hours Contributed</p>
            </div>
            <div className="stat-item fade-in">
              <h3>1,000+</h3>
              <p>Lives Impacted</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header fade-in">
            <h2>How It Works</h2>
            <p>Getting started with volunteer work has never been easier. Follow these simple steps to begin making a difference.</p>
          </div>
          <div className="steps">
            <div className="step fade-in">
              <div className="step-number">1</div>
              <h3>Create Your Profile</h3>
              <p>Sign up and tell us about your interests, skills, and availability. This helps us match you with the perfect opportunities.</p>
            </div>
            <div className="step fade-in">
              <div className="step-number">2</div>
              <h3>Browse Opportunities</h3>
              <p>Explore volunteer opportunities in your area. Filter by cause, time commitment, and skills needed to find your perfect match.</p>
            </div>
            <div className="step fade-in">
              <div className="step-number">3</div>
              <h3>Sign Up & Attend</h3>
              <p>Register for sessions that interest you. Get confirmation, reminders, and all the details you need to make an impact.</p>
            </div>
            <div className="step fade-in">
              <div className="step-number">4</div>
              <h3>Track Your Impact</h3>
              <p>Log your hours, share your experiences, and see the difference you're making in your community over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')}>About Us</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#support">Support</a>
            <a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>Contact</a>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 VolunteerHub. All rights reserved. Making communities stronger, one volunteer at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;