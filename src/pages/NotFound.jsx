import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import './styles/NotFound.css';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* 404 Text */}
        <div className="not-found-hero">
          <h1 className="not-found-title">404</h1>
          <div className="search-icon-container">
            <Search className="search-icon" />
          </div>
        </div>

        {/* Message */}
        <div className="not-found-message">
          <h2 className="not-found-subtitle">Page Not Found</h2>
          <p className="not-found-description">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, 
            deleted, or never existed.
          </p>
          <p className="not-found-path">
            Attempted to access: <code className="path-code">{location.pathname}</code>
          </p>
        </div>

        {/* Actions */}
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary btn-wide">
            <Home className="btn-icon" />
            <span>Return Home</span>
          </Link>
          <button 
            className="btn btn-secondary btn-wide"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="btn-icon" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Help Text */}
        <p className="not-found-help-text">
          If you believe this is an error, please contact our support team at{' '}
          <a href="mailto:mazkirut.nevehhorim@gmail.com" className="contact-link">
            mazkirut.nevehhorim@gmail.com
          </a>
        </p>
      </div>

      {/* Footer matching homepage */}
      <footer className="not-found-footer">
        <div className="footer-content">
          <p>&copy; 2025 Neveh Horim. All rights reserved. Making communities stronger, one volunteer at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;