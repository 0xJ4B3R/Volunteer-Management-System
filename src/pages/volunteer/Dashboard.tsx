import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/hooks";
import {
  Bell,
  Calendar,
  CheckCircle,
  FileText,
  LogOut,
  Menu,
  Settings,
  User,
  X,
  ChevronRight,
  Star,
  BarChart3,
  Users,
  Zap,
  Search,
  Plus,
  Heart,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import VolunteerSidebar from "@/components/volunteer/Sidebar";
import VolunteerWidgets from "@/components/volunteer/Widgets";
import NotificationsPanel from "@/components/common/NotificationsPanel";
import { cn } from "@/lib/utils";

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showWidgets, setShowWidgets] = useState(!isMobile);

  // Example notification data
  const notifications = [
    { id: 1, message: "New AI suggested match available", time: "5 minutes ago" },
    { id: 2, message: "Upcoming appointment tomorrow at 2 PM", time: "1 hour ago" },
    { id: 3, message: "Attendance confirmation needed", time: "Today, 9:15 AM" },
    { id: 4, message: "Profile update reminder", time: "Yesterday" }
  ];

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
    } else if (user.role !== "volunteer") {
      navigate("/manager");
    }
  }, [navigate, isAuthenticated, user]);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setShowWidgets(false);
      } else {
        setShowWidgets(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block">Volunteer Management System</h1>
            </div>
          </div>

          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* Notifications Panel */}
              <NotificationsPanel
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                notifications={notifications}
              />
            </div>

            {/* User Avatar */}
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">V</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <VolunteerSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300"
          )}
        >
          {/* Mobile Search and Widgets Toggle */}
          {isMobile && (
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search..."
                  className="pl-9 bg-white"
                />
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Dashboard</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWidgets(!showWidgets)}
                  className="text-xs"
                >
                  {showWidgets ? "Hide Widgets" : "Show Widgets"}
                </Button>
              </div>
            </div>
          )}

          {/* Welcome Message */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, Volunteer!</h1>
            <p className="text-slate-600 mt-1">Here's what's happening with your volunteer activities today.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Hours This Month</p>
                    <p className="text-2xl font-bold mt-1">24.5</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Upcoming Sessions</p>
                    <p className="text-2xl font-bold mt-1">3</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Residents Matched</p>
                    <p className="text-2xl font-bold mt-1">8</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Performance Score</p>
                    <p className="text-2xl font-bold mt-1">92%</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widgets Section */}
          {showWidgets && <VolunteerWidgets />}

          {/* Welcome Message for Mobile (when widgets are hidden) */}
          {!showWidgets && isMobile && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-2">Welcome, Volunteer!</h2>
              <p className="text-gray-600 mb-4">Thank you for your dedication to our community.</p>
              <Button onClick={() => setShowWidgets(true)}>View Dashboard Widgets</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
