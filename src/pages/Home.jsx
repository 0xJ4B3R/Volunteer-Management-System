import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Home.css';

// Services Carousel Component
const ServicesCarousel = () => {
  const [currentService, setCurrentService] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const services = [
    {
      icon: "🏥",
      title: "24-Hour Medical and Nursing Care",
      description: "Provided by the home's skilled staff, including consultations with specialist doctors."
    },
    {
      icon: "👥",
      title: "Social Services",
      description: "Offers support to residents and their families, maintains connections with the community and schools, and initiates special activities."
    },
    {
      icon: "🎨",
      title: "Cultural Activities",
      description: "Animal therapy, gardening, weekly Torah portion study, music classes, exercise, ceramics, jewelry and bead making, guest artist performances, trips, and parties."
    },
    {
      icon: "🌱",
      title: "Special Projects: Growing Community",
      description: "Strengthening connections between residents and staff through meaningful community-building initiatives."
    },
    {
      icon: "🤝",
      title: "Volunteers",
      description: "Schools, pre-military programs, retirees, and neighbors assist with both group and individual activities."
    },
    {
      icon: "🧠",
      title: "Occupational Therapy",
      description: "Includes a Snoezelen room (multi-sensory stimulation) and cognitive groups for enhanced well-being."
    },
    {
      icon: "🎯",
      title: "Employment and Social Activities",
      description: "Handicrafts, music engagement, classes, computer room, music room, cultural performances, and more."
    },
    {
      icon: "🏃",
      title: "Physiotherapy",
      description: "Personalized individual and group therapy in a well-equipped facility and an activity yard."
    },
    {
      icon: "🍽️",
      title: "Five Meals a Day",
      description: "Supervised by a dietitian and under rabbinical supervision for optimal nutrition and kosher compliance."
    },
    {
      icon: "📺",
      title: "Cable TV Connection",
      description: "Option to install cable television in residents' rooms for entertainment and connection."
    },
    {
      icon: "🛡️",
      title: "Cleaning and Security Services",
      description: "Comprehensive cleaning and 24/7 security services to ensure a safe and comfortable environment."
    },
    {
      icon: "👕",
      title: "Laundry Services",
      description: "Professional laundry services to maintain residents' clothing and linens with care."
    },
    {
      icon: "💅",
      title: "Hair Salon and Pedicure",
      description: "On-site beauty services including hair styling and pedicure treatments for resident comfort."
    },
    {
      icon: "🕍",
      title: "Synagogue",
      description: "On-site synagogue facilities for prayer services and religious observance."
    },
    {
      icon: "💊",
      title: "Pharmacy",
      description: "Convenient on-site pharmacy services for medication management and prescription needs."
    }
  ];

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentService((prev) => (prev + 1) % services.length);
      }, 7000);

      return () => clearInterval(interval);
    }
  }, [isPaused, services.length]);

  const handleDotClick = (index) => {
    setCurrentService(index);
  };

  return (
    <div 
      className="services-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="service-display">
        <div className="service-icon">
          {services[currentService].icon}
        </div>
        <div className="service-content">
          <h3>{services[currentService].title}</h3>
          <p>{services[currentService].description}</p>
        </div>
      </div>
      
      <div className="carousel-indicators">
        {services.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentService ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
            aria-label={`View service ${index + 1}`}
          />
        ))}
      </div>
      
      <div className="service-counter">
        {currentService + 1} of {services.length}
      </div>
    </div>
  );
};

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
          <a href="#" className="logo">Neveh Horim</a>
          <ul className="nav-links">
            <li><a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>Contact</a></li>
            <li><a href="#services" onClick={(e) => handleSmoothScroll(e, '#services')}>Services</a></li>
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

      {/* Services Section */}
      <section className="services" id="services">
        <div className="container">
          <div className="section-header fade-in">
            <h2>Our Services</h2>
            <p>Comprehensive care and support services designed to enhance quality of life</p>
          </div>
          <div className="services-widget fade-in">
            <ServicesCarousel />
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
            <div className="map-container">
              <iframe
                src="https://maps.google.com/maps?q=Ma'ale Ze'ev Street 3, Jerusalem, Israel&output=embed"
                width="100%"
                height="550"
                style={{ border: 0, borderRadius: '0.75rem' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Neveh Horim Location"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="about">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')}>About Us</a>
            <a href="#services" onClick={(e) => handleSmoothScroll(e, '#services')}>Services</a>
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