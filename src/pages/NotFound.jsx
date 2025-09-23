import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Globe } from "lucide-react";
import './styles/NotFound.css';

const NotFound = () => {
  const { t, i18n } = useTranslation('not-found');
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const langToggleRef = useRef(null);
  const location = useLocation();

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
      if (el !== document.body && el !== document.documentElement) {
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
    console.error(
      `404 Error: User attempted to access non-existent route: ${location.pathname}`
    );
  }, [location.pathname]);

  return (
    <div
      className="not-found-container"
      dir={i18n.language === "he" ? "rtl" : "ltr"}
    >
      <div className="not-found-content">
        {/* 404 Text */}
        <div className="not-found-hero">
          <h1 className="not-found-title">{t("notFound.statusCode", "404")}</h1>
          <div className="search-icon-container">
            <Search className="search-icon" />
          </div>
        </div>

        {/* Message */}
        <div className="not-found-message">
          <h2 className="not-found-subtitle">{t("notFound.subtitle")}</h2>
          <p className="not-found-description">
            {t("notFound.description")}
          </p>
          <p className="not-found-path">
            {t("notFound.attemptedAccess")} <code className="path-code">{location.pathname}</code>
          </p>
        </div>

        {/* Actions */}
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary btn-wide">
            <Home className="btn-icon" />
            <span>{t("notFound.returnHome")}</span>
          </Link>
          <button
            className="btn btn-secondary btn-wide"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="btn-icon" />
            <span>{t("notFound.goBack")}</span>
          </button>
        </div>

        {/* Help Text */}
        <p className="not-found-help-text">
          {t("notFound.helpText")} <a href="mailto:mazkirut.nevehhorim@gmail.com" className="contact-link">
            {t("notFound.contactEmail")}
          </a>
        </p>
      </div>

      {/* Footer matching homepage */}
      <footer className="not-found-footer">
        <div className="footer-content">
          <p>&copy; 2025 Neveh Horim. {t("notFound.footer")}</p>
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

export default NotFound; 