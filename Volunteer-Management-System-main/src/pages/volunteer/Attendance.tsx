import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  Check,
  Clock,
  Menu,
  ShieldAlert,
  ThumbsUp,
  X,
  Search,
  UserCircle,
  MapPin,
  Users,
  AlertCircle,
  Info,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  Users as UsersIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  ChevronRight as ChevronRightIcon,
  RefreshCw as RefreshCwIcon,
  CheckCircle2 as CheckCircle2Icon,
  AlertTriangle as AlertTriangleIcon,
  Plus as PlusIcon,
  BarChart3,
  Filter,
  SlidersHorizontal,
  Download,
  Heart,
  Star,
  Award,
  CalendarDays,
  Clock3,
  CheckSquare,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import VolunteerSidebar from "@/components/volunteer/Sidebar";
import NotificationsPanel from "@/components/common/NotificationsPanel";
import { cn } from "@/lib/utils";

// Mock today's session data
const todaySession = {
  id: 1,
  date: new Date(),
  startTime: "2:00 PM",
  endTime: "3:30 PM",
  type: "Reading",
  status: "Not Confirmed",
  location: "Sunny Pines Home, Room 102",
  residents: ["John D.", "Sarah M."],
  note: "",
  description: "Reading session with residents focusing on classic literature and poetry.",
  requirements: ["Bring reading materials", "Arrive 5 minutes early"],
  lastUpdated: "2 hours ago"
};

// Mock attendance history
const attendanceHistory = [
  {
    id: 1,
    date: new Date(Date.now() - 86400000), // Yesterday
    type: "Reading",
    status: "Attended",
    location: "Sunny Pines Home, Room 102",
    residents: ["John D.", "Sarah M."],
    hours: 1.5
  },
  {
    id: 2,
    date: new Date(Date.now() - 172800000), // 2 days ago
    type: "Music",
    status: "Attended",
    location: "Sunny Pines Home, Room 103",
    residents: ["Mary P.", "Robert K."],
    hours: 2
  },
  {
    id: 3,
    date: new Date(Date.now() - 259200000), // 3 days ago
    type: "Companionship",
    status: "Cancelled",
    location: "Sunny Pines Home, Room 101",
    residents: ["Alice B."],
    hours: 0
  },
  {
    id: 4,
    date: new Date(Date.now() - 345600000), // 4 days ago
    type: "Reading",
    status: "Attended",
    location: "Sunny Pines Home, Room 102",
    residents: ["John D."],
    hours: 1.5
  },
  {
    id: 5,
    date: new Date(Date.now() - 432000000), // 5 days ago
    type: "Games",
    status: "Attended",
    location: "Sunny Pines Home, Recreation Area",
    residents: ["Sarah M.", "Robert K."],
    hours: 2
  }
];

// Mock attendance statistics
const attendanceStats = {
  totalHours: 24.5,
  completedSessions: 12,
  cancelledSessions: 2,
  attendanceRate: 85.7,
  monthlyHours: 18.5,
  weeklyHours: 5.5
};

const VolunteerAttendance = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [unableDialogOpen, setUnableDialogOpen] = useState(false);
  const [unableReason, setUnableReason] = useState("");
  const [sessionStatus, setSessionStatus] = useState(todaySession.status);
  const [showReminder, setShowReminder] = useState(true);
  const [activeTab, setActiveTab] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);

  // Example notification data
  const notifications = [
    { id: 1, message: "Today's session reminder", time: "5 minutes ago" },
    { id: 2, message: "Profile update reminder", time: "1 hour ago" },
    { id: 3, message: "New message from manager", time: "Today, 9:15 AM" }
  ];

  // Check authentication
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

    if (!user.username) {
      navigate("/login");
    } else if (user.role !== "volunteer") {
      navigate("/manager");
    }
  }, [navigate]);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
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

  const confirmAttendance = () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
    setSessionStatus("Confirmed");
    setShowReminder(false);
      setIsLoading(false);

    toast({
      title: "Attendance confirmed",
      description: "Your attendance has been successfully confirmed.",
    });
    }, 1000);
  };

  const submitUnableToAttend = () => {
    if (!unableReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for being unable to attend.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
    setSessionStatus("Unable to Attend");
    setShowReminder(false);
      setIsLoading(false);

    toast({
      title: "Unable to attend",
      description: "Your notification has been sent to the manager.",
      variant: "destructive"
    });

    setUnableDialogOpen(false);
    }, 1000);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "attended":
        return "bg-green-100 text-green-800";
      case "not confirmed":
        return "bg-yellow-100 text-yellow-800";
      case "unable to attend":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get session type badge color
  const getSessionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "reading":
        return "bg-blue-100 text-blue-800";
      case "music":
        return "bg-purple-100 text-purple-800";
      case "companionship":
        return "bg-pink-100 text-pink-800";
      case "games":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get session type icon
  const getSessionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "reading":
        return <Heart className="h-4 w-4" />;
      case "music":
        return <Star className="h-4 w-4" />;
      case "companionship":
        return <Users className="h-4 w-4" />;
      case "games":
        return <Award className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  // Check if it's still today
  const isToday = () => {
    const today = new Date();
    const sessionDate = todaySession.date;

    return (
      today.getDate() === sessionDate.getDate() &&
      today.getMonth() === sessionDate.getMonth() &&
      today.getFullYear() === sessionDate.getFullYear()
    );
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    } else if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Get session card based on status
  const getSessionCard = () => {
    if (!isToday()) {
      return (
        <Card className="max-w-md mx-auto shadow-md">
          <CardHeader className="text-center">
            <CardTitle>No Sessions Today</CardTitle>
            <CardDescription>You don't have any sessions scheduled for today.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-slate-100 rounded-full">
                <CalendarIcon className="h-10 w-10 text-slate-600" />
              </div>
            </div>
            <p className="text-muted-foreground mb-4">Check your calendar for upcoming sessions.</p>
            <Button
              variant="outline"
              onClick={() => navigate('/volunteer/calendar')}
              className="w-full"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Check Calendar
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (sessionStatus === "Confirmed") {
      return (
        <Card className="max-w-md mx-auto shadow-md">
          <CardHeader className="text-center">
            <CardTitle>Today's Attendance Confirmed</CardTitle>
            <CardDescription>Your attendance has been recorded for today's session.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <p className="text-lg font-semibold mb-1">Thank you for confirming!</p>
            <p className="text-muted-foreground mb-4">
              You're all set for today's session.
            </p>
            <SessionDetails />
          </CardContent>
        </Card>
      );
    }

    if (sessionStatus === "Unable to Attend") {
      return (
        <Card className="max-w-md mx-auto shadow-md">
          <CardHeader className="text-center">
            <CardTitle>Absence Recorded</CardTitle>
            <CardDescription>We've noted you won't attend today's session.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <p className="text-lg font-semibold mb-1">We understand you can't make it</p>
            <p className="text-muted-foreground mb-4">
              The manager has been notified. Thank you for letting us know.
            </p>
            <SessionDetails />
          </CardContent>
        </Card>
      );
    }

    // Default card for "Not Confirmed" status
    return (
      <Card className="max-w-md mx-auto shadow-md">
        <CardHeader className="text-center">
          <CardTitle>Confirm Today's Attendance</CardTitle>
          <CardDescription>Please confirm your attendance for today's session.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionDetails />

          <div className="my-4 border-t border-b py-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Status:</p>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(sessionStatus)}`}>
                {sessionStatus}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-md mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Please confirm your attendance</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Your attendance needs to be confirmed for today's session.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-center">
          <Button
            variant="outline"
            onClick={() => setUnableDialogOpen(true)}
            className="flex-1"
          >
            <X className="mr-1 h-4 w-4" />
            Unable to Attend
          </Button>
          <Button
            onClick={confirmAttendance}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
            <Check className="mr-1 h-4 w-4" />
            Confirm Attendance
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Session details component
  const SessionDetails = () => (
    <div className="space-y-3">
      <div className="flex justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <ClockIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Time</p>
            <p className="font-medium">{todaySession.startTime} - {todaySession.endTime}</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">{formatDate(todaySession.date)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
          <MapPinIcon className="h-5 w-5 text-primary" />
        </div>
      <div>
          <p className="text-sm text-muted-foreground">Location</p>
          <p className="font-medium">{todaySession.location}</p>
        </div>
      </div>

      <div className="flex items-center">
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
          <UsersIcon className="h-5 w-5 text-primary" />
        </div>
      <div>
          <p className="text-sm text-muted-foreground">Residents</p>
        <div className="flex flex-wrap gap-1 mt-1">
            {todaySession.residents.map((resident, index) => (
              <Badge key={index} variant="outline">{resident}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
          <InfoIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="text-sm mt-1">{todaySession.description}</p>
        </div>
      </div>

      {todaySession.requirements && todaySession.requirements.length > 0 && (
        <div className="flex items-start">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-1">
            <AlertCircleIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Requirements</p>
            <ul className="list-disc pl-5 text-sm mt-1">
              {todaySession.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  // Attendance history item component
  const AttendanceHistoryItem = ({ session }: { session: typeof attendanceHistory[0] }) => (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2">{session.type}</Badge>
              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
            </div>
            <h3 className="font-medium mt-2">{formatDate(session.date)}</h3>
            <p className="text-sm text-muted-foreground mt-1">{session.location}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{session.hours} hours</p>
            <p className="text-xs text-muted-foreground mt-1">Last updated: {session.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {session.residents.map((resident, index) => (
            <Badge key={index} variant="secondary">{resident}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Filter and sort attendance history
  const getFilteredHistory = () => {
    let filtered = [...attendanceHistory];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(session =>
        session.type.toLowerCase() === filterType.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.type.toLowerCase().includes(query) ||
        session.location.toLowerCase().includes(query) ||
        session.residents.some(resident => resident.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case "date-desc":
        filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
        break;
      case "date-asc":
        filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
        break;
      case "hours-desc":
        filtered.sort((a, b) => b.hours - a.hours);
        break;
      case "hours-asc":
        filtered.sort((a, b) => a.hours - b.hours);
        break;
      case "type":
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }

    return filtered;
  };

  // Get unique session types for filter
  const getSessionTypes = () => {
    const types = new Set<string>();
    attendanceHistory.forEach(session => types.add(session.type));
    return Array.from(types);
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
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <h1 className="font-bold text-xl hidden sm:block">Attendance</h1>
            </div>
        </div>

        <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                className="pl-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
          className="flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300"
        >
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Attendance</h2>
                  <p className="text-slate-600 mt-1">Manage your session attendance and view history</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/volunteer/calendar')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    View Calendar
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Hours</p>
                        <p className="text-2xl font-bold mt-1">{attendanceStats.totalHours}</p>
                      </div>
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Completed Sessions</p>
                        <p className="text-2xl font-bold mt-1">{attendanceStats.completedSessions}</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Attendance Rate</p>
                        <p className="text-2xl font-bold mt-1">{attendanceStats.attendanceRate}%</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">This Month</p>
                        <p className="text-2xl font-bold mt-1">{attendanceStats.monthlyHours} hrs</p>
                      </div>
                      <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <CalendarDays className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="today" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start mb-6">
                  <TabsTrigger value="today" className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>

                {/* Today Tab */}
                <TabsContent value="today" className="space-y-6">
                  {getSessionCard()}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle>Attendance History</CardTitle>
                          <CardDescription>
                            View your past session attendance records
                          </CardDescription>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                          >
                            {showFilters ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Hide Filters
                              </>
                            ) : (
                              <>
                                <Filter className="h-4 w-4 mr-1" />
                                Show Filters
                              </>
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <SlidersHorizontal className="h-4 w-4 mr-1" />
                                Sort
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSortBy("date-desc")}>
                                Date (Newest)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortBy("date-asc")}>
                                Date (Oldest)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortBy("hours-desc")}>
                                Hours (High to Low)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortBy("hours-asc")}>
                                Hours (Low to High)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSortBy("type")}>
                                Session Type
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>

                      {/* Filters */}
                      {showFilters && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-md">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="filter-type">Session Type</Label>
                              <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger id="filter-type">
                                  <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Types</SelectItem>
                                  {getSessionTypes().map(type => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="search">Search</Label>
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="search"
                                  placeholder="Search sessions..."
                                  className="pl-8"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {getFilteredHistory().length > 0 ? (
                        <div>
                          {getFilteredHistory().map((session) => (
                            <AttendanceHistoryItem key={session.id} session={session} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="flex justify-center mb-4">
                            <div className="p-4 bg-slate-100 rounded-full">
                              <Clock className="h-10 w-10 text-slate-600" />
                            </div>
                          </div>
                          <h3 className="text-lg font-medium mb-2">No attendance history</h3>
                          <p className="text-muted-foreground mb-4">
                            {searchQuery || filterType !== "all"
                              ? "No results match your filters. Try adjusting your search criteria."
                              : "You don't have any attendance records yet."}
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchQuery("");
                              setFilterType("all");
                            }}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Clear Filters
              </Button>
            </div>
          )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
          </div>

          {/* Unable to Attend Dialog */}
          <Dialog open={unableDialogOpen} onOpenChange={setUnableDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unable to Attend</DialogTitle>
                <DialogDescription>
              Please provide a reason for being unable to attend today's session.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
            <Label htmlFor="reason">Reason</Label>
                <Textarea
              id="reason"
              placeholder="Enter your reason here..."
              className="mt-2"
                  value={unableReason}
                  onChange={(e) => setUnableReason(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUnableDialogOpen(false)}>
                  Cancel
                </Button>
            <Button
              variant="destructive"
              onClick={submitUnableToAttend}
              disabled={isLoading || !unableReason.trim()}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    </div>
  );
};

export default VolunteerAttendance;
