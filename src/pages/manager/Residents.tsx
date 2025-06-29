import { useState, useEffect } from "react";
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
  UserCog,
  FileText,
  Settings,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Users2,
  UserCheck,
  CalendarDays,
  CheckCircle2,
  Award,
  Star,
  Crown,
  LayoutGrid,
  List,
  FileSpreadsheet,
  ArrowUpDown,
  Edit,
  Pencil,
  Trash2,
  Phone,
  Calendar,
  MapPin,
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
  type: "success" | "warning" | "info" | "default";
  link?: string;
}

interface Resident {
  id: number;
  name: string;
  age: number;
  gender: string;
  address: string;
  contactNumber: string;
  emergencyContact: string;
  joinDate: string;
  status: "active" | "inactive" | "pending";
}

interface ResidentMetrics {
  totalResidents: number;
  activeResidents: number;
  newResidents: number;
  totalVisits: number;
  averageVisits: number;
  coverageRate: number;
}

// Mock data for residents
const mockResidents: Resident[] = [
  {
    id: 1,
    name: "John Smith",
    age: 75,
    gender: "Male",
    address: "123 Main St, City",
    contactNumber: "(555) 123-4567",
    emergencyContact: "(555) 987-6543",
    joinDate: "2024-02-15",
    status: "active"
  },
  {
    id: 2,
    name: "Mary Johnson",
    age: 82,
    gender: "Female",
    address: "456 Oak Ave, Town",
    contactNumber: "(555) 234-5678",
    emergencyContact: "(555) 876-5432",
    joinDate: "2024-02-10",
    status: "active"
  },
  {
    id: 3,
    name: "Robert Brown",
    age: 78,
    gender: "Male",
    address: "789 Pine Rd, Village",
    contactNumber: "(555) 345-6789",
    emergencyContact: "(555) 765-4321",
    joinDate: "2024-01-20",
    status: "inactive"
  },
  {
    id: 4,
    name: "Sarah Williams",
    age: 85,
    gender: "Female",
    address: "321 Elm St, Suburb",
    contactNumber: "(555) 456-7890",
    emergencyContact: "(555) 654-3210",
    joinDate: "2024-02-18",
    status: "active"
  },
  {
    id: 5,
    name: "James Wilson",
    age: 80,
    gender: "Male",
    address: "654 Maple Dr, County",
    contactNumber: "(555) 567-8901",
    emergencyContact: "(555) 543-2109",
    joinDate: "2024-02-05",
    status: "active"
  },
  {
    id: 6,
    name: "Patricia Davis",
    age: 79,
    gender: "Female",
    address: "987 Cedar Ln, District",
    contactNumber: "(555) 678-9012",
    emergencyContact: "(555) 432-1098",
    joinDate: "2024-01-15",
    status: "inactive"
  },
  {
    id: 7,
    name: "Michael Taylor",
    age: 83,
    gender: "Male",
    address: "147 Birch Ave, Township",
    contactNumber: "(555) 789-0123",
    emergencyContact: "(555) 321-0987",
    joinDate: "2024-02-20",
    status: "active"
  },
  {
    id: 8,
    name: "Jennifer Anderson",
    age: 76,
    gender: "Female",
    address: "258 Spruce St, Borough",
    contactNumber: "(555) 890-1234",
    emergencyContact: "(555) 210-9876",
    joinDate: "2024-02-12",
    status: "active"
  },
  {
    id: 9,
    name: "David Martinez",
    age: 81,
    gender: "Male",
    address: "369 Willow Rd, Parish",
    contactNumber: "(555) 901-2345",
    emergencyContact: "(555) 109-8765",
    joinDate: "2024-01-25",
    status: "inactive"
  },
  {
    id: 10,
    name: "Elizabeth Thompson",
    age: 84,
    gender: "Female",
    address: "741 Aspen Ct, Precinct",
    contactNumber: "(555) 012-3456",
    emergencyContact: "(555) 098-7654",
    joinDate: "2024-02-22",
    status: "active"
  }
];

// Add mock data for metrics
const mockMetrics: ResidentMetrics = {
  totalResidents: 45,
  activeResidents: 32,
  newResidents: 5,
  totalVisits: 1250,
  averageVisits: 28,
  coverageRate: 92
};

const ManagerResidents = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [newResident, setNewResident] = useState<Partial<Resident>>({
    name: "",
    age: 0,
    gender: "",
    address: "",
    contactNumber: "",
    emergencyContact: "",
    status: "pending"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [residents, setResidents] = useState(mockResidents);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [metrics, setMetrics] = useState<ResidentMetrics>(mockMetrics);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortField, setSortField] = useState<"name" | "age" | "gender" | "joinDate">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedResidents, setSelectedResidents] = useState<number[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [ageRange, setAgeRange] = useState<[number | null, number | null]>([null, null]);
  const [joinDateRange, setJoinDateRange] = useState<[string, string]>(["", ""]);

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

  // Filter residents based on search query and filters
  const filteredResidents = residents.filter(resident => {
    const matchesSearch =
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.contactNumber.includes(searchQuery);

    const matchesStatus = filterStatus === "all" || resident.status === filterStatus;
    const matchesTab = activeTab === "all" || resident.status === activeTab;

    // New filter conditions
    const matchesAge =
      (ageRange[0] === null || resident.age >= ageRange[0]) &&
      (ageRange[1] === null || resident.age <= ageRange[1]);

    const matchesJoinDate =
      (!joinDateRange[0] || new Date(resident.joinDate) >= new Date(joinDateRange[0])) &&
      (!joinDateRange[1] || new Date(resident.joinDate) <= new Date(joinDateRange[1]));

    return matchesSearch && matchesStatus && matchesTab && matchesAge && matchesJoinDate;
  });

  // Handle create new resident
  const handleCreateResident = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newId = Math.max(...residents.map(r => r.id)) + 1;
      const createdResident: Resident = {
        ...newResident as Resident,
        id: newId,
        joinDate: new Date().toISOString().split('T')[0]
      };
      setResidents([...residents, createdResident]);
      setIsCreateDialogOpen(false);
      setNewResident({
        name: "",
        age: 0,
        gender: "",
        address: "",
        contactNumber: "",
        emergencyContact: "",
        status: "pending"
      });
      setIsLoading(false);
      setNotifications([
        {
          id: Date.now(),
          message: "New resident added successfully",
          time: "Just now",
          type: "success"
        },
        ...notifications
      ]);
    }, 1000);
  };

  // Handle edit resident
  const handleEditResident = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResidents(residents.map(resident =>
        resident.id === selectedResident?.id ? { ...selectedResident } : resident
      ));
      setIsEditDialogOpen(false);
      setSelectedResident(null);
      setIsLoading(false);
      setNotifications([
        {
          id: Date.now(),
          message: "Resident information updated successfully",
          time: "Just now",
          type: "success"
        },
        ...notifications
      ]);
    }, 1000);
  };

  // Handle delete resident
  const handleDeleteResident = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (selectedResidents.length > 0) {
        // Handle bulk delete
        setResidents(prevResidents =>
          prevResidents.filter(resident => !selectedResidents.includes(resident.id))
        );
        setSelectedResidents([]);
      } else {
        // Handle single delete
        setResidents(residents.filter(r => r.id !== selectedResident?.id));
      }
      setIsDeleteDialogOpen(false);
      setSelectedResident(null);
      setIsLoading(false);
      setNotifications([
        {
          id: Date.now(),
          message: selectedResidents.length > 0
            ? `${selectedResidents.length} resident${selectedResidents.length > 1 ? 's' : ''} removed successfully`
            : "Resident removed successfully",
          time: "Just now",
          type: "success"
        },
        ...notifications
      ]);

      // Navigate to the last valid page if current page becomes empty
      const remainingResidents = residents.filter(r =>
        selectedResidents.length > 0
          ? !selectedResidents.includes(r.id)
          : r.id !== selectedResident?.id
      );
      const newTotalPages = Math.ceil(remainingResidents.length / itemsPerPage);
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages > 0 ? newTotalPages : 1);
      }
    }, 1000);
  };

  // Handle refresh residents list
  const handleRefreshResidents = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResidents(mockResidents);
      setIsLoading(false);
    }, 1000);
  };

  // Handle bulk actions
  const handleBulkAction = (action: "activate" | "deactivate" | "delete") => {
    // Only perform actions on selected residents that are currently visible
    const visibleSelectedResidents = selectedResidents.filter(id =>
      filteredResidents.some(resident => resident.id === id)
    );

    if (visibleSelectedResidents.length === 0) {
      alert("Please select at least one resident to perform this action.");
      return;
    }

    if (action === "delete") {
      // For delete action, show the delete dialog
      setSelectedResident(filteredResidents.find(r => r.id === visibleSelectedResidents[0]));
      setIsDeleteDialogOpen(true);
      return;
    }

    // For other actions, proceed with the confirmation
    const confirmMessage = {
      activate: "Are you sure you want to activate the selected residents?",
      deactivate: "Are you sure you want to deactivate the selected residents?",
    }[action];

    if (window.confirm(confirmMessage)) {
      // Update the residents based on the action
      setResidents(prevResidents =>
        prevResidents.map(resident => {
          if (visibleSelectedResidents.includes(resident.id)) {
            switch (action) {
              case "activate":
                return { ...resident, status: "active" };
              case "deactivate":
                return { ...resident, status: "inactive" };
              default:
                return resident;
            }
          }
          return resident;
        })
      );

      // Clear selection after action
      setSelectedResidents([]);
    }
  };

  // Handle export
  const handleExport = () => {
    // Only export selected residents that are currently visible
    const visibleSelectedResidents = selectedResidents.filter(id =>
      filteredResidents.some(resident => resident.id === id)
    );

    if (visibleSelectedResidents.length === 0) {
      alert("Please select at least one resident to perform this action.");
      return;
    }

    // Get the selected residents' data
    const selectedResidentsData = residents.filter(resident =>
      visibleSelectedResidents.includes(resident.id)
    );

    // Convert to CSV format
    const headers = ["Name", "Age", "Gender", "Status", "Address", "Contact", "Emergency Contact", "Join Date"];
    const csvContent = [
      headers.join(","),
      ...selectedResidentsData.map(resident => [
        `"${resident.name}"`,
        resident.age,
        `"${resident.gender}"`,
        `"${resident.status}"`,
        `"${resident.address}"`,
        `"${resident.contactNumber}"`,
        `"${resident.emergencyContact}"`,
        `"${resident.joinDate}"`
      ].join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `residents_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update the filtered residents to include sorting
  const sortedAndFilteredResidents = [...filteredResidents].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "name":
        return direction * a.name.localeCompare(b.name);
      case "age":
        return direction * (a.age - b.age);
      case "gender":
        return direction * a.gender.localeCompare(b.gender);
      case "joinDate":
        return direction * (new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime());
      default:
        return 0;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedAndFilteredResidents.length / itemsPerPage);
  const paginatedResidents = sortedAndFilteredResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sorting
  const handleSort = (field: "name" | "age" | "gender" | "joinDate") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setSelectedResidents([]); // Clear selection when sorting
  };

  // Handle resident selection
  const handleSelectResident = (id: number) => {
    setSelectedResidents(prev => {
      if (prev.includes(id)) {
        return prev.filter(residentId => residentId !== id);
      } else {
        return [...prev, id];
      }
    });
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
                placeholder="Search residents..."
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
                  placeholder="Search residents..."
                  className="pl-9 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Resident Management</h1>
            <p className="text-slate-600 mt-1">Manage and monitor your resident community.</p>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Residents</p>
                  <h3 className="text-2xl font-bold">{metrics.totalResidents}</h3>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">+{metrics.newResidents} new this month</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Residents</p>
                  <h3 className="text-2xl font-bold">{metrics.activeResidents}</h3>
                </div>
                <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-slate-500">
                  {Math.round((metrics.activeResidents / metrics.totalResidents) * 100)}% active rate
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Visits</p>
                  <h3 className="text-2xl font-bold">{metrics.totalVisits}</h3>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-slate-500">
                  {metrics.averageVisits} visits per resident
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Coverage Rate</p>
                  <h3 className="text-2xl font-bold">{metrics.coverageRate}%</h3>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-slate-500">Volunteer coverage rate</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left Section - Filters */}
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                <Select value={filterStatus} onValueChange={(value) => {
                  setFilterStatus(value);
                  setSelectedResidents([]);
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
                    onClick={() => setIsMoreFiltersOpen(true)}
                >
                    <Filter className="h-4 w-4 mr-1" />
                    More Filters
                </Button>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-2 min-w-0 h-9">
                  {/* Normal Actions */}
                  <div className={`flex items-center gap-2 ${selectedResidents.length > 0 ? 'hidden' : 'flex'}`}>
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
                  Add Resident
                </Button>
                  </div>

                  {/* Bulk Actions */}
                  <div className={`flex items-center gap-2 ${selectedResidents.length > 0 ? 'flex' : 'hidden'}`}>
                    <span className="text-sm text-slate-600 whitespace-nowrap">
                      {selectedResidents.filter(id =>
                        filteredResidents.some(resident => resident.id === id)
                      ).length} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedResidents([])}
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
                      disabled={selectedResidents.length === 0}
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

          {/* Residents List */}
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
                            checked={paginatedResidents.length > 0 && paginatedResidents.every(resident => selectedResidents.includes(resident.id))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Add only the current page's residents to the selection
                                const newSelectedResidents = new Set(selectedResidents);
                                paginatedResidents.forEach(resident => {
                                  newSelectedResidents.add(resident.id);
                                });
                                setSelectedResidents([...newSelectedResidents]);
                              } else {
                                // Remove only the current page's residents from the selection
                                const currentPageIds = new Set(paginatedResidents.map(r => r.id));
                                setSelectedResidents(selectedResidents.filter(id => !currentPageIds.has(id)));
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
                        <th className="text-center py-2 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center justify-center w-full"
                            onClick={() => handleSort("gender")}
                          >
                            Gender
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          </Button>
                        </th>
                        <th className="text-center py-2 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center justify-center w-full"
                            onClick={() => handleSort("age")}
                          >
                            Age
                            <ArrowUpDown className="h-4 w-4 ml-1" />
                          </Button>
                        </th>
                        <th className="text-center py-2 px-4">Address</th>
                        <th className="text-center py-2 px-4">Contact</th>
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
                      {paginatedResidents.map((resident, index) => (
                        <tr
                    key={resident.id}
                          className={cn(
                            "border-b hover:bg-slate-50",
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          )}
                        >
                          <td className="text-center py-2 px-4">
                            <Checkbox
                              checked={selectedResidents.includes(resident.id)}
                              onCheckedChange={() => handleSelectResident(resident.id)}
                            />
                          </td>
                          <td className="text-center py-2 px-4">
                            <span>{resident.name}</span>
                          </td>
                          <td className="text-center py-2 px-4">{resident.gender}</td>
                          <td className="text-center py-2 px-4">{resident.age}</td>
                          <td className="text-center py-2 px-4">
                            <div className="flex items-center justify-center">
                              <MapPin className="h-4 w-4 mr-1 text-slate-500" />
                              <span className="truncate max-w-[200px]">{resident.address}</span>
                            </div>
                          </td>
                          <td className="text-center py-2 px-4">
                            <div className="flex flex-col items-center">
                              <span className="text-sm">{resident.contactNumber}</span>
                              <span className="text-sm text-slate-500">{resident.emergencyContact}</span>
                            </div>
                          </td>
                          <td className="text-center py-2 px-4">
                            <div className="flex items-center justify-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  resident.status === "active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                  resident.status === "inactive" && "bg-rose-50 text-rose-700 border-rose-200",
                                  resident.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200"
                                )}
                              >
                            {resident.status}
                          </Badge>
                        </div>
                          </td>
                          <td className="text-center py-2 px-4">
                            <div className="flex items-center justify-center">
                              <Calendar className="h-4 w-4 mr-1 text-slate-500" />
                              <span>{new Date(resident.joinDate).toLocaleDateString('en-GB')}</span>
                          </div>
                          </td>
                          <td className="text-center py-2 px-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedResident(resident);
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
                  {paginatedResidents.map((resident) => (
                    <div
                      key={resident.id}
                      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden group cursor-pointer"
                      onClick={() => handleSelectResident(resident.id)}
                    >
                      {/* Profile Header */}
                      <div className="relative p-4 border-b border-slate-100">
                        <div className="absolute top-4 right-4 z-10">
                          <Checkbox
                            checked={selectedResidents.includes(resident.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedResidents([...selectedResidents, resident.id]);
                              } else {
                                setSelectedResidents(selectedResidents.filter(id => id !== resident.id));
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
                          {resident.name}
                        </h3>
                            <p className="text-sm text-slate-500 truncate">{resident.contactNumber}</p>
                            <div className="mt-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  resident.status === "active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                  resident.status === "inactive" && "bg-rose-50 text-rose-700 border-rose-200",
                                  resident.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200"
                                )}
                              >
                                {resident.status}
                                </Badge>
                            </div>
                          </div>
                            </div>
                          </div>

                      {/* Content */}
                      <div className="p-4 space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-slate-600">
                            <Phone className="h-4 w-4 mr-2 text-primary" />
                            <span className="truncate">{resident.emergencyContact}</span>
                            </div>
                          <div className="flex items-center text-sm text-slate-600">
                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                            <span>{new Date(resident.joinDate).toLocaleDateString('en-GB')}</span>
                          </div>
                            </div>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-slate-600">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <span className="truncate">{resident.address}</span>
                          </div>
                      </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <Button
                            variant="ghost"
                          size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                            setSelectedResident(resident);
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
                            setSelectedResident(resident);
                              setSelectedResidents([]);
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

            {/* Pagination Controls */}
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
                    setSelectedResidents([]);
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

      {/* Create Resident Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Resident</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new resident.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={newResident.name}
                  onChange={(e) => setNewResident({...newResident, name: e.target.value})}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  placeholder="Enter age"
                  value={newResident.age}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      setNewResident({...newResident, age: value});
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={newResident.gender}
                  onValueChange={(value) => setNewResident({...newResident, gender: value})}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newResident.status}
                  onValueChange={(value: "active" | "inactive" | "pending") =>
                    setNewResident({...newResident, status: value})
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={newResident.address}
                onChange={(e) => setNewResident({...newResident, address: e.target.value})}
                className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  placeholder="Enter contact number"
                  value={newResident.contactNumber}
                  onChange={(e) => setNewResident({...newResident, contactNumber: e.target.value})}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  placeholder="Enter emergency contact"
                  value={newResident.emergencyContact}
                  onChange={(e) => setNewResident({...newResident, emergencyContact: e.target.value})}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateResident}
              disabled={isLoading || !newResident.name || !newResident.age || !newResident.gender || !newResident.address}
              className="relative"
            >
              {isLoading ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  <span className="opacity-0">Add Resident</span>
                </>
              ) : (
                "Add Resident"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resident Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Resident</DialogTitle>
            <DialogDescription>
              Update the resident's information.
            </DialogDescription>
          </DialogHeader>

          {selectedResident && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter full name"
                    value={selectedResident.name}
                    onChange={(e) => setSelectedResident({...selectedResident, name: e.target.value})}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-age">Age</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    placeholder="Enter age"
                    value={selectedResident.age}
                    onChange={(e) => setSelectedResident({...selectedResident, age: parseInt(e.target.value)})}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Select
                    value={selectedResident.gender}
                    onValueChange={(value) => setSelectedResident({...selectedResident, gender: value})}
                  >
                    <SelectTrigger id="edit-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedResident.status}
                    onValueChange={(value: "active" | "inactive" | "pending") =>
                      setSelectedResident({...selectedResident, status: value})
                    }
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  placeholder="Enter address"
                  value={selectedResident.address}
                  onChange={(e) => setSelectedResident({...selectedResident, address: e.target.value})}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contactNumber">Contact Number</Label>
                  <Input
                    id="edit-contactNumber"
                    placeholder="Enter contact number"
                    value={selectedResident.contactNumber}
                    onChange={(e) => setSelectedResident({...selectedResident, contactNumber: e.target.value})}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-emergencyContact">Emergency Contact</Label>
                  <Input
                    id="edit-emergencyContact"
                    placeholder="Enter emergency contact"
                    value={selectedResident.emergencyContact}
                    onChange={(e) => setSelectedResident({...selectedResident, emergencyContact: e.target.value})}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditResident}
              disabled={isLoading || !selectedResident?.name || !selectedResident?.age || !selectedResident?.gender || !selectedResident?.address}
              className="relative"
            >
              {isLoading ? (
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Resident Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete {selectedResidents.length > 0 ? 'Selected Residents' : 'Resident'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedResidents.length > 0 ? 'the selected residents' : 'this resident'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedResidents.length > 0 ? (
            <div className="py-4">
              <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                <div className="text-sm text-slate-600">
                  You are about to delete {selectedResidents.length} resident{selectedResidents.length > 1 ? 's' : ''}.
                  </div>
                <div className="mt-2 text-sm">
                  <div className="flex items-center mb-2">
                    <Users2 className="h-4 w-4 mr-2 text-slate-400" />
                    <span className="font-medium">Selected Residents:</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    {residents
                      .filter(resident => selectedResidents.includes(resident.id))
                      .map(resident => (
                        <div key={resident.id} className="flex items-center">
                          <span>{resident.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : selectedResident && (
            <div className="py-4">
              <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                <div className="mb-2">
                  <h3 className="font-medium">{selectedResident.name}</h3>
                  <div className="text-sm text-slate-500">{selectedResident.contactNumber}</div>
                </div>

                <div className="mt-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    Joined: {new Date(selectedResident.joinDate).toLocaleDateString('en-GB')}
                  </div>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                    Address: {selectedResident.address}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteResident}
              disabled={isLoading}
              className="relative"
            >
              {isLoading ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  <span className="opacity-0">Delete {selectedResidents.length > 0 ? 'Selected' : 'Resident'}</span>
                </>
              ) : (
                `Delete ${selectedResidents.length > 0 ? 'Selected' : 'Resident'}`
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
              Apply additional filters to refine your resident list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Age Range Filter */}
            <div className="space-y-2">
              <Label>Age Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={ageRange[0] === null ? "" : ageRange[0]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAgeRange([value === "" ? null : Number(value), ageRange[1]]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Min"
                />
                <span>to</span>
                <Input
                  type="number"
                  min="0"
                  value={ageRange[1] === null ? "" : ageRange[1]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAgeRange([ageRange[0], value === "" ? null : Number(value)]);
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
                setAgeRange([null, null]);
                setJoinDateRange(["", ""]);
              }}
              disabled={filterStatus === "all" &&
                ageRange[0] === null &&
                ageRange[1] === null &&
                joinDateRange[0] === "" &&
                joinDateRange[1] === ""}
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

export default ManagerResidents;
