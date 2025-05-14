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
        <div className="not-found-header">
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
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto">
              <Home className="mr-2 h-5 w-5" />
              Return Home
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go Back
          </Button>
        </div>

        {/* Help Text */}
        <p className="not-found-help-text">
          If you believe this is an error, please contact our support team.
        </p>
      </div>
    </div>
  );
};

export default NotFound;