import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './styles/Home.css';

const ServicesCarousel = () => {
  const [currentService, setCurrentService] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { t } = useTranslation();

  const services = [
    {
      icon: "🏥",
      title: t('services.items.medical.title'),
      description: t('services.items.medical.desc')
    },
    {
      icon: "👥",
      title: t('services.items.social.title'),
      description: t('services.items.social.desc')
    },
    {
      icon: "🎨",
      title: t('services.items.cultural.title'),
      description: t('services.items.cultural.desc')
    },
    {
      icon: "🌱",
      title: t('services.items.projects.title'),
      description: t('services.items.projects.desc')
    },
    {
      icon: "🤝",
      title: t('services.items.volunteers.title'),
      description: t('services.items.volunteers.desc')
    },
    {
      icon: "🧠",
      title: t('services.items.therapy.title'),
      description: t('services.items.therapy.desc')
    },
    {
      icon: "🎯",
      title: t('services.items.employment.title'),
      description: t('services.items.employment.desc')
    },
    {
      icon: "🏃",
      title: t('services.items.physio.title'),
      description: t('services.items.physio.desc')
    },
    {
      icon: "🍽️",
      title: t('services.items.meals.title'),
      description: t('services.items.meals.desc')
    },
    {
      icon: "📺",
      title: t('services.items.tv.title'),
      description: t('services.items.tv.desc')
    },
    {
      icon: "🛡️",
      title: t('services.items.cleaning.title'),
      description: t('services.items.cleaning.desc')
    },
    {
      icon: "👕",
      title: t('services.items.laundry.title'),
      description: t('services.items.laundry.desc')
    },
    {
      icon: "💅",
      title: t('services.items.beauty.title'),
      description: t('services.items.beauty.desc')
    },
    {
      icon: "🕍",
      title: t('services.items.synagogue.title'),
      description: t('services.items.synagogue.desc')
    },
    {
      icon: "💊",
      title: t('services.items.pharmacy.title'),
      description: t('services.items.pharmacy.desc')
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
        {currentService + 1} {t('services.of')} {services.length}
      </div>
    </div>
  );
};

const Homepage = () => {
  const navigate = useNavigate();
  const observerRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const langToggleRef = useRef(null);

  // Robust language direction management
  const applyLanguageDirection = (lang) => {
    const dir = lang === 'he' ? 'rtl' : 'ltr';

    // 1. Set the dir attribute on html element
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);

    // 2. Remove any stale RTL/LTR classes
    document.body.classList.remove('rtl', 'ltr');
    document.documentElement.classList.remove('rtl', 'ltr');

    // 3. Add the correct direction class
    document.body.classList.add(dir);
    document.documentElement.classList.add(dir);

    // 4. Set CSS direction property explicitly
    document.body.style.direction = dir;
    document.documentElement.style.direction = dir;

    // 5. Remove any conflicting inline styles
    const rootElements = document.querySelectorAll('[style*="direction"]');
    rootElements.forEach(el => {
      if (el !== document.body && el !== document.documentElement && el instanceof HTMLElement) {
        el.style.direction = '';
      }
    });
  };

  useEffect(() => {
    applyLanguageDirection(currentLanguage);
  }, [currentLanguage]);

  // Sync currentLanguage with i18n.language
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      setCurrentLanguage(i18n.language);
    }
  }, [i18n.language, currentLanguage]);

  // Handle click outside language toggle to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langToggleRef.current && !langToggleRef.current.contains(event.target)) {
        setShowLangOptions(false);
      }
    };

    if (showLangOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangOptions]);

  useEffect(() => {
    // Simplified intersection observer
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

    // Observe elements only once
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
      observerRef.current?.observe(el);
    });

    // Simplified header scroll with throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const header = document.querySelector('.header') as HTMLElement;
          if (header) {
            header.style.background = window.scrollY > 100
              ? 'rgba(255, 255, 255, 0.98)'
              : 'rgba(255, 255, 255, 0.95)';
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Smooth scroll function with header offset
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      const header = document.querySelector('.header') as HTMLElement;
      const headerHeight = header ? header.offsetHeight : 100; // Fallback to 100px
      const targetPosition = target.offsetTop - headerHeight + 1; // Extra 20px padding

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
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

  // Removed inline style hover handlers - using CSS instead

  return (
    <div className="homepage">
      {/* Header */}
      <header className="header">
        <nav className="nav">
          <a href="#" className="logo">
            <img src="/logo1.png" alt={t('nav.title')} className="logo-image" />
            <span className="logo-text">{t('nav.title')}</span>
          </a>
          <ul className="nav-links">
            <li><a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>{t('nav.contact')}</a></li>
            <li><a href="#services" onClick={(e) => handleSmoothScroll(e, '#services')}>{t('nav.services')}</a></li>
            <li><a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')}>{t('nav.features')}</a></li>
            <li><a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')}>{t('nav.about')}</a></li>
            <li><button onClick={handleLogin} className="login-btn">{t('nav.login')}</button></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero" id="about">
        <div className="hero-content">
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.description')}</p>
          <div className="cta-buttons">
            <button onClick={handleGetStarted} className="btn btn-primary">
              <span>{t('hero.getStarted')}</span>
              <span>→</span>
            </button>
            <button onClick={(e) => handleSmoothScroll(e, '#contact')} className="btn btn-secondary">
              <span>{t('hero.contactUs')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header fade-in">
            <h2>{t('features.title')}</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card fade-in">
              <div className="feature-icon">
                📅
              </div>
              <h3>{t('features.smartScheduling.title')}</h3>
              <p>{t('features.smartScheduling.desc')}</p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">
                🎯
              </div>
              <h3>{t('features.personalizedMatching.title')}</h3>
              <p>{t('features.personalizedMatching.desc')}</p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">
                📱
              </div>
              <h3>{t('features.mobileFriendly.title')}</h3>
              <p>{t('features.mobileFriendly.desc')}</p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">
                🏆
              </div>
              <h3>{t('features.achievements.title')}</h3>
              <p>{t('features.achievements.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services" id="services">
        <div className="container">
          <div className="section-header fade-in">
            <h2>{t('services.title')}</h2>
            <p>{t('services.subtitle')}</p>
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
            <h2>{t('contact.title')}</h2>
            <p>{t('contact.subtitle')}</p>
          </div>
          <div className="contact-content">
            <div className="contact-info fade-in">
              <div className="contact-item">
                <div className="contact-icon">
                  📍
                </div>
                <div className="contact-details">
                  <h3>{t('contact.location')}</h3>
                  <p>
                    {t('contact.address.line1')}
                    <br/>
                    {t('contact.address.line2')}
                  </p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  📞
                </div>
                <div className="contact-details">
                  <h3>{t('contact.phone')}</h3>
                  <p>02-6403333</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  ✉️
                </div>
                <div className="contact-details">
                  <h3>{t('contact.email')}</h3>
                  <p>mazkirut.nevehhorim@gmail.com</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  🖨️
                </div>
                <div className="contact-details">
                  <h3>{t('contact.fax')}</h3>
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
                allowFullScreen={true}
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
            <a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')}>{t('footer.aboutUs')}</a>
            <a href="#services" onClick={(e) => handleSmoothScroll(e, '#services')}>{t('footer.services')}</a>
            <a href="#privacy">{t('footer.privacy')}</a>
            <a href="#terms">{t('footer.terms')}</a>
            <a href="#support">{t('footer.support')}</a>
            <a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>{t('footer.contact')}</a>
          </div>
          <div className="footer-bottom">
            <p>{t('footer.rights')}</p>
          </div>
        </div>
      </footer>
      {/* Language Toggle */}
      <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`} ref={langToggleRef}>
        <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
          <Globe className="lang-icon" />
        </button>
        {showLangOptions && (
          <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
            <button onClick={async () => {
              localStorage.setItem('language', 'en');
              await i18n.changeLanguage('en');
              setCurrentLanguage('en');
              applyLanguageDirection('en');
              setShowLangOptions(false);
            }}>
              English
            </button>
            <button onClick={async () => {
              localStorage.setItem('language', 'he');
              await i18n.changeLanguage('he');
              setCurrentLanguage('he');
              applyLanguageDirection('he');
              setShowLangOptions(false);
            }}>
              עברית
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
