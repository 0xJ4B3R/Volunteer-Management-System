import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="text-center space-y-8 max-w-2xl">
        {/* 404 Text */}
        <div className="relative">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-16 w-16 text-primary/40" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">Page Not Found</h2>
          <p className="text-lg text-slate-600">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, 
            deleted, or never existed.
          </p>
          <p className="text-sm text-slate-500">
            Attempted to access: <code className="bg-slate-100 px-2 py-1 rounded">{location.pathname}</code>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
        <p className="text-sm text-slate-500">
          If you believe this is an error, please contact our support team.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
