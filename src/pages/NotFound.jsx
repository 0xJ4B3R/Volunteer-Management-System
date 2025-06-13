import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Globe } from "lucide-react";
import './styles/NotFound.css';

const NotFound = () => {
  const { t, i18n } = useTranslation();
  const [showLangOptions, setShowLangOptions] = useState(false);
  const location = useLocation();

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
      <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`}>
        <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
          <Globe size={35} />
        </button>
        {showLangOptions && (
          <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
            <button onClick={() => { i18n.changeLanguage('en'); setShowLangOptions(false); }}>
              English
            </button>
            <button onClick={() => { i18n.changeLanguage('he'); setShowLangOptions(false); }}>
              עברית
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
