import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  Bell,
  Calendar,
  UserPlus,
  FileText,
  Menu,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Activity,
  Heart,
  Target,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import NotificationsPanel from "@/components/manager/NotificationsPanel";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";

// Types
interface Notification {
  id: number;
  message: string;
  time: string;
  type: "success" | "warning" | "info";
  link?: string;
}

interface Session {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  volunteers: { id: number; name: string; email: string; }[];
  pendingVolunteers: { id: number; name: string; email: string; }[];
  status: string;
  isRecurring: boolean;
  maxVolunteers: number;
}

interface DashboardStats {
  todayStats: {
    totalSessions: number;
    volunteersScheduled: number;
    unconfirmedSessions: number;
    sessions: Session[];
  };
  volunteerStats: {
    totalVolunteers: number;
    activeVolunteers: number;
    newVolunteers: number;
    volunteerEngagement: number;
  };
  residentStats: {
    totalResidents: number;
    activeResidents: number;
    newResidents: number;
    residentCoverage: number;
  };
  quickStats: {
    upcomingSessions: number;
    pendingRequests: number;
    recentActivity: number;
    totalVolunteers: number;
    totalResidents: number;
    sessionsThisMonth: number;
  };
  performanceMetrics: {
    engagementScore: number;
    satisfactionRate: number;
    efficiencyScore: number;
    trends: {
      engagement: { value: number; direction: "up" | "down" };
      satisfaction: { value: number; direction: "up" | "down" };
      efficiency: { value: number; direction: "up" | "down" };
    };
  };
}

const fetchDashboardData = async (): Promise<DashboardStats> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    todayStats: {
      totalSessions: 5,
      volunteersScheduled: 12,
      unconfirmedSessions: 2,
      sessions: [
        {
          id: 1,
          date: "2025-04-19",
          startTime: "09:00",
          endTime: "10:00",
          volunteers: [
            { id: 1, name: "John Doe", email: "john@example.com" }
          ],
          pendingVolunteers: [
            { id: 2, name: "Jane Smith", email: "jane@example.com" }
          ],
          status: "confirmed",
          isRecurring: true,
          maxVolunteers: 3
        },
        {
          id: 2,
          date: "2025-04-19",
          startTime: "09:00",
          endTime: "10:00",
          volunteers: [
            { id: 1, name: "John Doe", email: "john@example.com" }
          ],
          pendingVolunteers: [
            { id: 2, name: "Jane Smith", email: "jane@example.com" }
          ],
          status: "confirmed",
          isRecurring: true,
          maxVolunteers: 4
        },
        {
          id: 3,
          date: "2025-04-19",
          startTime: "09:00",
          endTime: "10:00",
          volunteers: [
            { id: 1, name: "John Doe", email: "john@example.com" }
          ],
          pendingVolunteers: [
            { id: 2, name: "Jane Smith", email: "jane@example.com" }
          ],
          status: "confirmed",
          isRecurring: true,
          maxVolunteers: 3
        },
        {
          id: 4,
          date: "2025-04-19",
          startTime: "09:00",
          endTime: "10:00",
          volunteers: [
            { id: 1, name: "John Doe", email: "john@example.com" }
          ],
          pendingVolunteers: [
            { id: 2, name: "Jane Smith", email: "jane@example.com" }
          ],
          status: "confirmed",
          isRecurring: true,
          maxVolunteers: 3
        }
      ]
    },
    volunteerStats: {
      totalVolunteers: 50,
      activeVolunteers: 45,
      newVolunteers: 5,
      volunteerEngagement: 90
    },
    residentStats: {
      totalResidents: 100,
      activeResidents: 95,
      newResidents: 5,
      residentCoverage: 95
    },
    quickStats: {
      upcomingSessions: 10,
      pendingRequests: 3,
      recentActivity: 15,
      totalVolunteers: 50,
      totalResidents: 100,
      sessionsThisMonth: 45
    },
    performanceMetrics: {
      engagementScore: 85,
      satisfactionRate: 92,
      efficiencyScore: 88,
      trends: {
        engagement: { value: 5, direction: "up" },
        satisfaction: { value: 2, direction: "up" },
        efficiency: { value: 3, direction: "up" }
      }
    }
  };
};

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  // Check authentication
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

    if (!user.username) {
      navigate("/login");
    } else if (user.role !== "manager") {
      navigate("/volunteer");
    }
  }, [navigate]);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
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

  const handleAddVolunteer = () => {
    navigate("/manager/volunteers/new");
  };

  const handleAddResident = () => {
    navigate("/manager/residents/new");
  };

  const handleAddSession = () => {
    navigate("/manager/calendar/new");
  };

  const handleGenerateReport = () => {
    navigate("/manager/reports/new");
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-600 mb-4">There was a problem loading the dashboard data.</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10 h-[69px]">
        <div className="px-6 py-3 flex justify-between items-center">
          {/* Left section - Logo and menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block">Volunteer Management System</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative h-10 w-10"
              >
                <Bell className="h-6 w-6" />
                {dashboardData?.todayStats.sessions.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </Button>

              {/* Notifications Panel */}
              <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={dashboardData?.todayStats.sessions.map(session => ({
                  id: session.id,
                  message: `Session at ${session.startTime} - ${session.endTime}`,
                  time: `${session.date} ${session.startTime} - ${session.endTime}`,
                  type: "info"
                })) || []}
              />
            </div>

            {/* User Avatar */}
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-base font-medium text-primary">M</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <ManagerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
            <p className="text-slate-600 mt-1">Monitor and manage your community activities.</p>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Engagement Score</p>
                    <h3 className="text-2xl font-bold">{dashboardData?.performanceMetrics.engagementScore}/10</h3>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${dashboardData?.performanceMetrics.engagementScore * 10}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Satisfaction Rate</p>
                    <h3 className="text-2xl font-bold">{dashboardData?.performanceMetrics.satisfactionRate}%</h3>
                  </div>
                  <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${dashboardData?.performanceMetrics.satisfactionRate}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Efficiency Score</p>
                    <h3 className="text-2xl font-bold">{dashboardData?.performanceMetrics.efficiencyScore}/10</h3>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${dashboardData?.performanceMetrics.efficiencyScore * 10}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Overall Performance</p>
                    <h3 className="text-2xl font-bold">
                      {Math.round((dashboardData?.performanceMetrics.engagementScore +
                        dashboardData?.performanceMetrics.efficiencyScore) / 2 * 10)}%
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${Math.round((dashboardData?.performanceMetrics.engagementScore +
                          dashboardData?.performanceMetrics.efficiencyScore) / 2 * 10)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Pending Sessions and Today's Sessions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pending Volunteers */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pending Volunteers</CardTitle>
                      <CardDescription className="mt-1">Volunteers awaiting approval</CardDescription>
                    </div>
                    {dashboardData?.todayStats.sessions.some(s => s.pendingVolunteers.length > 0) && (
                      <Badge variant="secondary" className="h-6 mr-2">
                        {dashboardData?.todayStats.sessions.reduce((acc, session) => acc + session.pendingVolunteers.length, 0)} pending
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[184px] overflow-y-auto pr-2">
                    {dashboardData?.todayStats.sessions
                      .filter(session => session.pendingVolunteers.length > 0)
                      .map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 bg-amber-50/50 rounded-lg border border-amber-200/50 hover:bg-amber-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                              <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-amber-900">
                                {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </h4>
                              <p className="text-sm text-amber-700">
                                {session.startTime} - {session.endTime} • {session.pendingVolunteers.length} {session.pendingVolunteers.length === 1 ? 'volunteer' : 'volunteers'} requested
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800"
                          >
                            Review
                          </Button>
                        </div>
                      ))}
                    {(!dashboardData?.todayStats.sessions.some(s => s.pendingVolunteers.length > 0)) && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No pending volunteers to review</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Sessions */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Today's Sessions</CardTitle>
                      <CardDescription className="mt-1">Overview of today's volunteer sessions</CardDescription>
                    </div>
                    {dashboardData?.todayStats.sessions.length > 0 && (
                      <Badge variant="secondary" className="h-6 mr-2">
                        {dashboardData?.todayStats.sessions.length} sessions
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[184px] overflow-y-auto pr-2">
                    {dashboardData?.todayStats.sessions
                      .filter(session => {
                        const today = new Date();
                        const sessionDate = new Date(session.date);
                        return today.toDateString() === sessionDate.toDateString();
                      })
                      .map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <CalendarDays className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {session.startTime} - {session.endTime}
                              </h4>
                              <p className="text-sm text-slate-500">
                                {session.volunteers.length}/{session.maxVolunteers} {session.volunteers.length === 1 ? 'volunteer' : 'volunteers'} scheduled
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={session.status === "full" ? "default" : "secondary"}>
                              {session.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Stats and Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <div>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription className="mt-1">Common management tasks</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleAddVolunteer}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Volunteer
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleAddResident}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Add Resident
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleAddSession}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Create Session
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGenerateReport}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div>
                    <CardTitle>Quick Stats</CardTitle>
                    <CardDescription className="mt-1">Key community metrics</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Total Volunteers</p>
                        <h3 className="text-2xl font-bold">{dashboardData?.quickStats.totalVolunteers}</h3>
                      </div>
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Total Residents</p>
                        <h3 className="text-2xl font-bold">{dashboardData?.quickStats.totalResidents}</h3>
                      </div>
                      <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                        <Heart className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Sessions This Month</p>
                        <h3 className="text-2xl font-bold">{dashboardData?.quickStats.sessionsThisMonth}</h3>
                      </div>
                      <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default ManagerDashboard; 