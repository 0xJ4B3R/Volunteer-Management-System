import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Plus,
  Bell,
  Menu,
  LogOut,
  UserPlus,
  Mail,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  BarChart3,
  Download,
  Star,
  Award,
  CalendarDays,
  Clock4,
  UserCheck,
  Users2,
  FileSpreadsheet,
  ArrowUpDown,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Pencil,
  Crown,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import NotificationsPanel from "@/components/manager/NotificationsPanel";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  message: string;
  time: string;
  type?: "success" | "warning" | "info" | "default";
  link?: string;
}

// Add new interfaces
interface VolunteerMetrics {
  totalVolunteers: number;
  activeVolunteers: number;
  newVolunteers: number;
  totalHours: number;
  averageHours: number;
  completionRate: number;
  topVolunteers: Array<{
    id: number;
    name: string;
    hours: number;
    sessions: number;
    rating: number;
  }>;
}

interface VolunteerAchievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  date: string;
}

// Mock data for volunteers
const mockVolunteers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    status: "active",
    joinDate: "2023-01-15",
    totalHours: 120,
    completedSessions: 45,
    totalSessions: 50,
    skills: ["Reading", "Music", "Companionship"],
    availability: ["Monday Morning", "Wednesday Afternoon", "Friday Evening"],
    profilePicture: "https://randomuser.me/api/portraits/men/1.jpg"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "(555) 234-5678",
    status: "active",
    joinDate: "2023-02-20",
    totalHours: 85,
    completedSessions: 32,
    totalSessions: 40,
    skills: ["Games", "Companionship"],
    availability: ["Tuesday Morning", "Thursday Afternoon", "Saturday Morning"],
    profilePicture: "https://randomuser.me/api/portraits/women/2.jpg"
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phone: "(555) 345-6789",
    status: "inactive",
    joinDate: "2023-03-10",
    totalHours: 45,
    completedSessions: 18,
    totalSessions: 25,
    skills: ["Reading", "Music"],
    availability: ["Monday Evening", "Wednesday Morning"],
    profilePicture: "https://randomuser.me/api/portraits/men/3.jpg"
  },
  {
    id: 4,
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    phone: "(555) 456-7890",
    status: "active",
    joinDate: "2023-04-05",
    totalHours: 65,
    completedSessions: 25,
    totalSessions: 30,
    skills: ["Companionship", "Games"],
    availability: ["Tuesday Evening", "Thursday Morning", "Sunday Afternoon"],
    profilePicture: "https://randomuser.me/api/portraits/women/4.jpg"
  },
  {
    id: 5,
    name: "Tom Harris",
    email: "tom.harris@example.com",
    phone: "(555) 567-8901",
    status: "pending",
    joinDate: "2023-05-12",
    totalHours: 0,
    completedSessions: 0,
    totalSessions: 0,
    skills: ["Music", "Games"],
    availability: ["Friday Morning", "Saturday Evening"],
    profilePicture: "https://randomuser.me/api/portraits/men/5.jpg"
  },
  {
    id: 6,
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    phone: "(555) 678-9012",
    status: "active",
    joinDate: "2023-01-25",
    totalHours: 95,
    completedSessions: 38,
    totalSessions: 45,
    skills: ["Reading", "Companionship"],
    availability: ["Monday Afternoon", "Wednesday Evening", "Saturday Morning"],
    profilePicture: "https://randomuser.me/api/portraits/women/6.jpg"
  }
];

// Mock data for notifications
const mockNotifications: Notification[] = [
  {
    id: 1,
    message: "New volunteer application received",
    time: "5 minutes ago",
    type: "info"
  },
  {
    id: 2,
    message: "John Doe completed 100 hours",
    time: "10 minutes ago",
    type: "success"
  },
  {
    id: 3,
    message: "Mike Johnson has been inactive for 30 days",
    time: "30 minutes ago",
    type: "warning"
  }
];

// Add mock data for metrics
const mockMetrics: VolunteerMetrics = {
  totalVolunteers: 45,
  activeVolunteers: 32,
  newVolunteers: 5,
  totalHours: 1250,
  averageHours: 28,
  completionRate: 92,
  topVolunteers: [
    { id: 1, name: "John Smith", hours: 45, sessions: 12, rating: 4.8 },
    { id: 2, name: "Mary Johnson", hours: 38, sessions: 10, rating: 4.7 },
    { id: 3, name: "Robert Brown", hours: 32, sessions: 8, rating: 4.6 }
  ]
};

// Add mock data for achievements
const mockAchievements: VolunteerAchievement[] = [
  {
    id: 1,
    title: "100 Hours Milestone",
    description: "Completed 100 hours of volunteer work",
    icon: "🏆",
    date: "2023-06-15"
  },
  {
    id: 2,
    title: "Perfect Attendance",
    description: "No missed sessions in the last 3 months",
    icon: "⭐",
    date: "2023-05-20"
  },
  {
    id: 3,
    title: "Rising Star",
    description: "Most improved volunteer of the month",
    icon: "🌟",
    date: "2023-04-10"
  }
];

const ManagerVolunteers = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSkills, setFilterSkills] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [newVolunteer, setNewVolunteer] = useState({
    name: "",
    email: "",
    phone: "",
    skills: [] as string[],
    availability: [] as string[],
    notes: "",
    totalSessions: 0
  });
  const [volunteers, setVolunteers] = useState(mockVolunteers);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [expandedVolunteer, setExpandedVolunteer] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortField, setSortField] = useState<"name" | "hours" | "sessions" | "joinDate">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedVolunteers, setSelectedVolunteers] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<VolunteerMetrics>(mockMetrics);
  const [achievements, setAchievements] = useState<VolunteerAchievement[]>(mockAchievements);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [hoursRange, setHoursRange] = useState<[number | null, number | null]>([null, null]);
  const [joinDateRange, setJoinDateRange] = useState<[string, string]>(["", ""]);
  const [sessionsRange, setSessionsRange] = useState<[number | null, number | null]>([null, null]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (!user.id || user.role !== "manager") {
      navigate("/login");
    }
  }, [navigate]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  // Filter volunteers based on search query and filters
  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch =
      volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.phone.includes(searchQuery) ||
      volunteer.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === "all" || volunteer.status === filterStatus;

    // New filter conditions
    const matchesHours =
      (hoursRange[0] === null || volunteer.totalHours >= hoursRange[0]) &&
      (hoursRange[1] === null || volunteer.totalHours <= hoursRange[1]);

    const matchesJoinDate =
      (!joinDateRange[0] || new Date(volunteer.joinDate) >= new Date(joinDateRange[0])) &&
      (!joinDateRange[1] || new Date(volunteer.joinDate) <= new Date(joinDateRange[1]));

    const matchesSessions =
      (sessionsRange[0] === null || volunteer.totalSessions >= sessionsRange[0]) &&
      (sessionsRange[1] === null || volunteer.totalSessions <= sessionsRange[1]);

    return matchesSearch && matchesStatus && matchesHours && matchesJoinDate && matchesSessions;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "inactive":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle create new volunteer
  const handleCreateVolunteer = () => {
    setIsCreating(true);

    // Simulate API call with a delay
    setTimeout(() => {
      const newId = Math.max(...volunteers.map(v => v.id)) + 1;
      const createdVolunteer = {
        ...newVolunteer,
        id: newId,
        status: "pending",
        joinDate: new Date().toISOString().split('T')[0],
        totalHours: 0,
        completedSessions: 0,
        profilePicture: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`
      };

      setVolunteers([...volunteers, createdVolunteer]);
      setIsCreateDialogOpen(false);
      setNewVolunteer({
        name: "",
        email: "",
        phone: "",
        skills: [],
        availability: [],
        notes: "",
        totalSessions: 0
      });
      setIsCreating(false);
    }, 1500); // 1.5 second delay to show the loading state
  };

  // Handle edit volunteer
  const handleEditVolunteer = () => {
    setIsEditing(true);
    // Simulate API call
    setTimeout(() => {
      setVolunteers(volunteers.map(v =>
        v.id === selectedVolunteer.id ? { ...selectedVolunteer } : v
      ));
      setIsEditDialogOpen(false);
      setSelectedVolunteer(null);
      setIsEditing(false);
    }, 1000);
  };

  // Handle delete volunteer
  const handleDeleteVolunteer = () => {
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      if (selectedVolunteers.length > 0) {
        // Handle bulk delete
        setVolunteers(prevVolunteers =>
          prevVolunteers.filter(volunteer => !selectedVolunteers.includes(volunteer.id))
        );
        setSelectedVolunteers([]);
      } else {
        // Handle single delete
        setVolunteers(volunteers.filter(v => v.id !== selectedVolunteer?.id));
      }
      setIsDeleteDialogOpen(false);
      setSelectedVolunteer(null);
      setIsDeleting(false);
      setNotifications([
        {
          id: Date.now(),
          message: selectedVolunteers.length > 0
            ? `${selectedVolunteers.length} volunteer${selectedVolunteers.length > 1 ? 's' : ''} removed successfully`
            : "Volunteer removed successfully",
          time: "Just now",
          type: "success"
        },
        ...notifications
      ]);

      // Navigate to the last valid page if current page becomes empty
      const remainingVolunteers = volunteers.filter(v =>
        selectedVolunteers.length > 0
          ? !selectedVolunteers.includes(v.id)
          : v.id !== selectedVolunteer?.id
      );
      const newTotalPages = Math.ceil(remainingVolunteers.length / itemsPerPage);
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages > 0 ? newTotalPages : 1);
      }
    }, 1000);
  };

  // Toggle expanded volunteer
  const toggleExpandedVolunteer = (id: number) => {
    setExpandedVolunteer(expandedVolunteer === id ? null : id);
  };

  // Add new handlers
  const handleSort = (field: "name" | "hours" | "sessions" | "joinDate") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setSelectedVolunteers([]); // Clear selection when sorting
  };

  const handleSelectVolunteer = (id: number) => {
    setSelectedVolunteers(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action: "activate" | "deactivate" | "delete") => {
    // Only perform actions on selected volunteers that are currently visible
    const visibleSelectedVolunteers = selectedVolunteers.filter(id =>
      sortedAndFilteredVolunteers.some(volunteer => volunteer.id === id)
    );

    if (visibleSelectedVolunteers.length === 0) {
      alert("Please select at least one volunteer to perform this action.");
      return;
    }

    if (action === "delete") {
      // For delete action, show the delete dialog
      setSelectedVolunteer(volunteers.find(v => v.id === visibleSelectedVolunteers[0]));
      setIsDeleteDialogOpen(true);
      return;
    }

    // For other actions, proceed with the confirmation
    const confirmMessage = {
      activate: "Are you sure you want to activate the selected volunteers?",
      deactivate: "Are you sure you want to deactivate the selected volunteers?",
    }[action];

    if (window.confirm(confirmMessage)) {
      // Update the volunteers based on the action
      setVolunteers(prevVolunteers =>
        prevVolunteers.map(volunteer => {
          if (visibleSelectedVolunteers.includes(volunteer.id)) {
            switch (action) {
              case "activate":
                return { ...volunteer, status: "active" };
              case "deactivate":
                return { ...volunteer, status: "inactive" };
              default:
                return volunteer;
            }
          }
          return volunteer;
        })
      );

      // Clear selection after action
      setSelectedVolunteers([]);
    }
  };

  const handleExport = () => {
    // Only export selected volunteers that are currently visible
    const visibleSelectedVolunteers = selectedVolunteers.filter(id =>
      sortedAndFilteredVolunteers.some(volunteer => volunteer.id === id)
    );

    if (visibleSelectedVolunteers.length === 0) {
      alert("Please select at least one volunteer to perform this action.");
      return;
    }

    // Get the selected volunteers' data
    const selectedVolunteersData = volunteers.filter(volunteer =>
      visibleSelectedVolunteers.includes(volunteer.id)
    );

    // Convert to CSV format
    const headers = ["Name", "Email", "Phone", "Status", "Total Hours", "Completed Sessions", "Skills", "Availability"];
    const csvContent = [
      headers.join(","),
      ...selectedVolunteersData.map(volunteer => [
        `"${volunteer.name}"`,
        `"${volunteer.email}"`,
        `"${volunteer.phone}"`,
        `"${volunteer.status}"`,
        volunteer.totalHours,
        volunteer.completedSessions,
        `"${volunteer.skills.join(", ")}"`,
        `"${volunteer.availability.join(", ")}"`
      ].join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `volunteers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update the filtered volunteers to include sorting
  const sortedAndFilteredVolunteers = [...filteredVolunteers].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "name":
        return direction * a.name.localeCompare(b.name);
      case "hours":
        return direction * (a.totalHours - b.totalHours);
      case "sessions":
        return direction * (a.totalSessions - b.totalSessions);
      case "joinDate":
        return direction * (new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime());
      default:
        return 0;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedAndFilteredVolunteers.length / itemsPerPage);
  const paginatedVolunteers = sortedAndFilteredVolunteers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleMoreFilters = () => {
    setIsMoreFiltersOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10 h-[69px]">
        <div className="px-4 py-3 flex justify-between items-center">
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
              <Users className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block">Volunteer Management System</h1>
            </div>
          </div>

          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search volunteers..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </Button>

              {/* Notifications Panel */}
              <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
              />
            </div>

            {/* User Avatar */}
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">M</span>
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
          {/* Mobile Search */}
          {isMobile && (
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search volunteers..."
                  className="pl-9 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Volunteer Management</h1>
            <p className="text-slate-600 mt-1">Manage and monitor your volunteer community.</p>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Volunteers</p>
                  <h3 className="text-2xl font-bold">{metrics.totalVolunteers}</h3>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">+{metrics.newVolunteers} new this month</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Volunteers</p>
                  <h3 className="text-2xl font-bold">{metrics.activeVolunteers}</h3>
                </div>
                <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-slate-500">
                  {Math.round((metrics.activeVolunteers / metrics.totalVolunteers) * 100)}% active rate
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Hours</p>
                  <h3 className="text-2xl font-bold">{metrics.totalHours}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Clock4 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-slate-500">
                  {metrics.averageHours} hours per volunteer
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Completion Rate</p>
                  <h3 className="text-2xl font-bold">{metrics.completionRate}%</h3>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-slate-500">Session completion rate</span>
              </div>
            </div>
          </div>

          {/* Top Volunteers */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Top Volunteers
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Star className="h-4 w-4 text-amber-400" />
                <span>Based on total hours and sessions</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.topVolunteers.map((volunteer, index) => (
                <div
                  key={volunteer.id}
                  className="relative p-4 rounded-lg border border-slate-200 hover:border-primary/20 transition-colors duration-200"
                >
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1">
                      <Crown className="h-4 w-4" />
                    </div>
                  )}
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-primary/10 flex items-center justify-center">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">{volunteer.name}</h4>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center text-sm text-slate-600">
                          <Clock4 className="h-4 w-4 mr-2 text-primary" />
                          <span>{volunteer.hours} hours</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <CalendarDays className="h-4 w-4 mr-2 text-emerald-500" />
                          <span>{volunteer.sessions} sessions</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <Star className="h-4 w-4 mr-2 text-amber-400" />
                          <span>{volunteer.rating} rating</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Volunteer Controls */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left Section - Filters */}
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  <Select value={filterStatus} onValueChange={(value) => {
                    setFilterStatus(value);
                    setSelectedVolunteers([]);
                  }}>
                    <SelectTrigger className="w-[140px] h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-200 hover:bg-slate-50"
                    onClick={handleMoreFilters}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    More Filters
                  </Button>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-2 min-w-0 h-9">
                  {/* Normal Actions */}
                  <div className={`flex items-center gap-2 ${selectedVolunteers.length > 0 ? 'hidden' : 'flex'}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                      className="h-9 border-slate-200 hover:bg-slate-50"
                    >
                      {viewMode === "list" ? (
                        <LayoutGrid className="h-4 w-4 mr-1" />
                      ) : (
                        <List className="h-4 w-4 mr-1" />
                      )}
                      {viewMode === "list" ? "Grid View" : "List View"}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="h-9 bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Volunteer
                    </Button>
                  </div>

                  {/* Bulk Actions */}
                  <div className={`flex items-center gap-2 ${selectedVolunteers.length > 0 ? 'flex' : 'hidden'}`}>
                    <span className="text-sm text-slate-600 whitespace-nowrap">
                      {selectedVolunteers.filter(id =>
                        filteredVolunteers.some(volunteer => volunteer.id === id)
                      ).length} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVolunteers([])}
                      className="h-9 border-slate-200 hover:bg-slate-50"
                    >
                      Deselect All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("activate")}
                      className="h-9 border-slate-200 hover:bg-slate-50"
                    >
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("deactivate")}
                      className="h-9 border-slate-200 hover:bg-slate-50"
                    >
                      Deactivate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("delete")}
                      className="h-9 border-slate-200 hover:bg-slate-50 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport()}
                      disabled={selectedVolunteers.length === 0}
                      className="h-9 border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Volunteers List */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            {viewMode === "list" ? (
              <div className="space-y-4">
                {/* List View */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b">
                        <th className="text-center py-2 px-4">
                          <Checkbox
                            checked={paginatedVolunteers.length > 0 && paginatedVolunteers.every(volunteer => selectedVolunteers.includes(volunteer.id))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Add only the current page's volunteers to the selection
                                const newSelectedVolunteers = new Set(selectedVolunteers);
                                paginatedVolunteers.forEach(volunteer => {
                                  newSelectedVolunteers.add(volunteer.id);
                                });
                                setSelectedVolunteers([...newSelectedVolunteers]);
                              } else {
                                // Remove only the current page's volunteers from the selection
                                const currentPageIds = new Set(paginatedVolunteers.map(v => v.id));
                                setSelectedVolunteers(selectedVolunteers.filter(id => !currentPageIds.has(id)));
                              }
                            }}
                          />
                        </th>
                        <th className="text-center py-2 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center justify-center w-full"
                            onClick={() => handleSort("name")}
                          >
                            Name
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          </Button>
                        </th>
                        <th className="text-center py-2 px-4">Email</th>
                        <th className="text-center py-2 px-4">Phone</th>
                        <th className="text-center py-2 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center justify-center w-full"
                            onClick={() => handleSort("hours")}
                          >
                            Hours
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          </Button>
                        </th>
                        <th className="text-center py-2 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center justify-center w-full"
                            onClick={() => handleSort("sessions")}
                          >
                            Sessions
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          </Button>
                        </th>
                        <th className="text-center py-2 px-4">Status</th>
                        <th className="text-center py-2 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center justify-center w-full"
                            onClick={() => handleSort("joinDate")}
                          >
                            Join Date
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          </Button>
                        </th>
                        <th className="text-center py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="relative">
                      {paginatedVolunteers.map((volunteer, index) => (
                        <tr
                          key={volunteer.id}
                          className={cn(
                            "border-b hover:bg-slate-50",
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          )}
                        >
                          <td className="text-center py-2 px-4">
                            <Checkbox
                              checked={selectedVolunteers.includes(volunteer.id)}
                              onCheckedChange={() => handleSelectVolunteer(volunteer.id)}
                            />
                          </td>
                          <td className="text-center py-2 px-4">
                            <span>{volunteer.name}</span>
                          </td>
                          <td className="text-center py-2 px-4">{volunteer.email}</td>
                          <td className="text-center py-2 px-4">{volunteer.phone}</td>
                          <td className="text-center py-2 px-4">{volunteer.totalHours}</td>
                          <td className="text-center py-2 px-4">{volunteer.totalSessions}</td>
                          <td className="text-center py-2 px-4">
                            <div className="flex items-center justify-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  volunteer.status === "active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                  volunteer.status === "inactive" && "bg-rose-50 text-rose-700 border-rose-200",
                                  volunteer.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200"
                                )}
                              >
                                {volunteer.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="text-center py-2 px-4">
                            <div className="flex items-center justify-center">
                              <Calendar className="h-4 w-4 mr-1 text-slate-500" />
                              <span>{new Date(volunteer.joinDate).toLocaleDateString('en-GB')}</span>
                            </div>
                          </td>
                          <td className="text-center py-2 px-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVolunteer(volunteer);
                                setIsEditDialogOpen(true);
                              }}
                              className="text-primary hover:text-primary/90 hover:bg-primary/5"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                  {paginatedVolunteers.map((volunteer) => (
                    <div
                      key={volunteer.id}
                      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden group cursor-pointer"
                      onClick={() => handleSelectVolunteer(volunteer.id)}
                    >
                      {/* Profile Header */}
                      <div className="relative p-4 border-b border-slate-100">
                        <div className="absolute top-4 right-4 z-10">
                          <Checkbox
                            checked={selectedVolunteers.includes(volunteer.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedVolunteers([...selectedVolunteers, volunteer.id]);
                              } else {
                                setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteer.id));
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="border-black data-[state=checked]:bg-primary data-[state=checked]:border-primary bg-white/90 backdrop-blur-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-primary/10 flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors duration-300 truncate max-w-[calc(100%-2rem)]">
                              {volunteer.name}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">{volunteer.email}</p>
                            <div className="mt-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  volunteer.status === "active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                  volunteer.status === "inactive" && "bg-rose-50 text-rose-700 border-rose-200",
                                  volunteer.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200"
                                )}
                              >
                                {volunteer.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-slate-600">
                              <Phone className="h-4 w-4 mr-2 text-primary" />
                              <span className="truncate">{volunteer.phone}</span>
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                              <Calendar className="h-4 w-4 mr-2 text-primary" />
                              <span>{new Date(volunteer.joinDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-slate-600">
                              <Clock className="h-4 w-4 mr-2 text-primary" />
                              <span>{volunteer.totalHours} hours</span>
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                              <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                              <span>{volunteer.totalSessions} sessions</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-slate-500">Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {volunteer.skills.map(skill => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="text-xs bg-slate-50"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVolunteer(volunteer);
                              setIsEditDialogOpen(true);
                            }}
                            className="text-primary hover:text-primary/90 hover:bg-primary/5"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVolunteer(volunteer);
                              setSelectedVolunteers([]);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination Controls - Now visible in both views */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Items per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    const newItemsPerPage = Number(value);
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                    // Clear selections when changing page size
                    setSelectedVolunteers([]);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Volunteer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px] p-0">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-primary">Add New Volunteer</DialogTitle>
              <DialogDescription className="text-slate-600">
                Fill in the details to add a new volunteer to your community.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={newVolunteer.name}
                  onChange={(e) => setNewVolunteer({ ...newVolunteer, name: e.target.value })}
                  className="h-10 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={newVolunteer.email}
                  onChange={(e) => setNewVolunteer({ ...newVolunteer, email: e.target.value })}
                  className="h-10 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={newVolunteer.phone}
                onChange={(e) => setNewVolunteer({ ...newVolunteer, phone: e.target.value })}
                className="h-10 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Skills</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                {["Reading", "Music", "Companionship", "Games"].map(skill => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={`skill-${skill}`}
                      checked={newVolunteer.skills.includes(skill)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewVolunteer({
                            ...newVolunteer,
                            skills: [...newVolunteer.skills, skill]
                          });
                        } else {
                          setNewVolunteer({
                            ...newVolunteer,
                            skills: newVolunteer.skills.filter(s => s !== skill)
                          });
                        }
                      }}
                      className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={`skill-${skill}`} className="text-sm text-slate-700">
                      {skill}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Availability</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border border-slate-200 rounded-lg bg-white shadow-sm max-h-[200px] overflow-y-auto">
                {["Monday Morning", "Monday Afternoon", "Monday Evening",
                  "Tuesday Morning", "Tuesday Afternoon", "Tuesday Evening",
                  "Wednesday Morning", "Wednesday Afternoon", "Wednesday Evening",
                  "Thursday Morning", "Thursday Afternoon", "Thursday Evening",
                  "Friday Morning", "Friday Afternoon", "Friday Evening",
                  "Saturday Morning", "Saturday Afternoon", "Saturday Evening",
                  "Sunday Morning", "Sunday Afternoon", "Sunday Evening"].map(time => (
                    <div key={time} className="flex items-center space-x-2">
                      <Checkbox
                        id={`availability-${time}`}
                        checked={newVolunteer.availability.includes(time)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewVolunteer({
                              ...newVolunteer,
                              availability: [...newVolunteer.availability, time]
                            });
                          } else {
                            setNewVolunteer({
                              ...newVolunteer,
                              availability: newVolunteer.availability.filter(t => t !== time)
                            });
                          }
                        }}
                        className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor={`availability-${time}`} className="text-sm text-slate-700">
                        {time}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-slate-700">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes about the volunteer"
                value={newVolunteer.notes}
                onChange={(e) => setNewVolunteer({ ...newVolunteer, notes: e.target.value })}
                className="min-h-[100px] bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="w-full sm:w-auto border-slate-200 hover:bg-slate-100"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateVolunteer}
                disabled={!newVolunteer.name || !newVolunteer.email || !newVolunteer.phone || isCreating}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 relative"
              >
                {isCreating ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="opacity-0">Add Volunteer</span>
                  </>
                ) : (
                  "Add Volunteer"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Volunteer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px] p-0">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-primary">Edit Volunteer</DialogTitle>
              <DialogDescription className="text-slate-600">
                Update the volunteer's information and preferences.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedVolunteer && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium text-slate-700">Full Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter full name"
                    value={selectedVolunteer.name}
                    onChange={(e) => setSelectedVolunteer({ ...selectedVolunteer, name: e.target.value })}
                    className="h-10 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium text-slate-700">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="Enter email"
                    value={selectedVolunteer.email}
                    onChange={(e) => setSelectedVolunteer({ ...selectedVolunteer, email: e.target.value })}
                    className="h-10 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                <Input
                  id="edit-phone"
                  placeholder="Enter phone number"
                  value={selectedVolunteer.phone}
                  onChange={(e) => setSelectedVolunteer({ ...selectedVolunteer, phone: e.target.value })}
                  className="h-10 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm font-medium text-slate-700">Status</Label>
                <Select
                  value={selectedVolunteer.status}
                  onValueChange={(value) => setSelectedVolunteer({ ...selectedVolunteer, status: value })}
                >
                  <SelectTrigger id="edit-status" className="h-10 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Skills</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                  {["Reading", "Music", "Companionship", "Games"].map(skill => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-skill-${skill}`}
                        checked={selectedVolunteer.skills.includes(skill)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedVolunteer({
                              ...selectedVolunteer,
                              skills: [...selectedVolunteer.skills, skill]
                            });
                          } else {
                            setSelectedVolunteer({
                              ...selectedVolunteer,
                              skills: selectedVolunteer.skills.filter(s => s !== skill)
                            });
                          }
                        }}
                        className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor={`edit-skill-${skill}`} className="text-sm text-slate-700">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Availability</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border border-slate-200 rounded-lg bg-white shadow-sm max-h-[200px] overflow-y-auto">
                  {["Monday Morning", "Monday Afternoon", "Monday Evening",
                    "Tuesday Morning", "Tuesday Afternoon", "Tuesday Evening",
                    "Wednesday Morning", "Wednesday Afternoon", "Wednesday Evening",
                    "Thursday Morning", "Thursday Afternoon", "Thursday Evening",
                    "Friday Morning", "Friday Afternoon", "Friday Evening",
                    "Saturday Morning", "Saturday Afternoon", "Saturday Evening",
                    "Sunday Morning", "Sunday Afternoon", "Sunday Evening"].map(time => (
                      <div key={time} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-availability-${time}`}
                          checked={selectedVolunteer.availability.includes(time)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedVolunteer({
                                ...selectedVolunteer,
                                availability: [...selectedVolunteer.availability, time]
                              });
                            } else {
                              setSelectedVolunteer({
                                ...selectedVolunteer,
                                availability: selectedVolunteer.availability.filter(t => t !== time)
                              });
                            }
                          }}
                          className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={`edit-availability-${time}`} className="text-sm text-slate-700">
                          {time}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes" className="text-sm font-medium text-slate-700">Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Enter any additional notes about the volunteer"
                  value={selectedVolunteer.notes || ""}
                  onChange={(e) => setSelectedVolunteer({ ...selectedVolunteer, notes: e.target.value })}
                  className="min-h-[100px] bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="w-full sm:w-auto border-slate-200 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditVolunteer}
                disabled={!selectedVolunteer?.name || !selectedVolunteer?.email || !selectedVolunteer?.phone || isEditing}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 relative"
              >
                {isEditing ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="opacity-0">Save Changes</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Volunteer Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete {selectedVolunteers.length > 0 ? 'Selected Volunteers' : 'Volunteer'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedVolunteers.length > 0 ? 'the selected volunteers' : 'this volunteer'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedVolunteers.length > 0 ? (
            <div className="py-4">
              <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                <div className="text-sm text-slate-600">
                  You are about to delete {selectedVolunteers.length} volunteer{selectedVolunteers.length > 1 ? 's' : ''}.
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex items-center mb-2">
                    <Users2 className="h-4 w-4 mr-2 text-slate-400" />
                    <span className="font-medium">Selected Volunteers:</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    {volunteers
                      .filter(volunteer => selectedVolunteers.includes(volunteer.id))
                      .map(volunteer => (
                        <div key={volunteer.id} className="flex items-center">
                          <span>{volunteer.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : selectedVolunteer && (
            <div className="py-4">
              <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                <div className="mb-2">
                  <h3 className="font-medium">{selectedVolunteer.name}</h3>
                  <div className="text-sm text-slate-500">{selectedVolunteer.email}</div>
                </div>

                <div className="mt-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    Joined: {selectedVolunteer.joinDate}
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-2 text-slate-400" />
                    Total Hours: {selectedVolunteer.totalHours}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVolunteer}
              disabled={isDeleting}
              className="relative"
            >
              {isDeleting ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  <span className="opacity-0">Delete {selectedVolunteers.length > 0 ? 'Selected' : 'Volunteer'}</span>
                </>
              ) : (
                `Delete ${selectedVolunteers.length > 0 ? 'Selected' : 'Volunteer'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* More Filters Dialog */}
      <Dialog open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>More Filters</DialogTitle>
            <DialogDescription>
              Apply additional filters to refine your volunteer list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Hours Range Filter */}
            <div className="space-y-2">
              <Label>Total Hours Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={hoursRange[0] === null ? "" : hoursRange[0]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setHoursRange([value === "" ? null : Number(value), hoursRange[1]]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Min"
                />
                <span>to</span>
                <Input
                  type="number"
                  min="0"
                  value={hoursRange[1] === null ? "" : hoursRange[1]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setHoursRange([hoursRange[0], value === "" ? null : Number(value)]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Total Sessions Range Filter */}
            <div className="space-y-2">
              <Label>Total Sessions Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={sessionsRange[0] === null ? "" : sessionsRange[0]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setSessionsRange([value === "" ? null : Number(value), sessionsRange[1]]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Min"
                />
                <span>to</span>
                <Input
                  type="number"
                  min="0"
                  value={sessionsRange[1] === null ? "" : sessionsRange[1]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setSessionsRange([sessionsRange[0], value === "" ? null : Number(value)]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Join Date Range Filter */}
            <div className="space-y-2">
              <Label>Join Date Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={joinDateRange[0]}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setJoinDateRange([newStartDate, joinDateRange[1]]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span>to</span>
                <Input
                  type="date"
                  value={joinDateRange[1]}
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    setJoinDateRange([joinDateRange[0], newEndDate]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {joinDateRange[0] && joinDateRange[1] && new Date(joinDateRange[0]) > new Date(joinDateRange[1]) && (
                <p className="text-sm text-red-500">Start date cannot be after end date</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                // Reset all filters
                setHoursRange([null, null]);
                setJoinDateRange(["", ""]);
                setSessionsRange([null, null]);
              }}
              disabled={filterStatus === "all" &&
                hoursRange[0] === null &&
                hoursRange[1] === null &&
                joinDateRange[0] === "" &&
                joinDateRange[1] === "" &&
                sessionsRange[0] === null &&
                sessionsRange[1] === null}
            >
              Reset Filters
            </Button>
            <Button onClick={() => setIsMoreFiltersOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerVolunteers; 