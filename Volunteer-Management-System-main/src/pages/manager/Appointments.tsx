import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Search,
  MoreVertical,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ManagerSidebar from "@/components/manager/ManagerSidebar";

interface Appointment {
  id: string;
  calendarSlotId: string;
  residentIds: string[];
  volunteerIds: string[];
  status: "upcoming" | "inProgress" | "completed" | "canceled";
  updatedAt: string;
  createdAt: string;
  notes: string | null;
}

interface CalendarSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  period: "morning" | "afternoon" | "evening" | null;
  isCustom: boolean;
  customLabel: string | null;
  residentIds: string[];
  maxCapacity: number;
  volunteerRequests: any[];
  approvedVolunteers: string[];
  status: "open" | "full" | "canceled";
  appointmentId: string | null;
  isOpen: boolean;
  createdAt: string;
  notes: string | null;
}

interface ExternalGroup {
  id: string;
  appointmentId: string;
  groupName: string;
  contactPerson: string;
  contactPhoneNumber: string;
  purposeOfVisit: string;
  numberOfParticipants: number;
  assignedDepartment?: string;
  activityContent?: string;
  notes?: string | null;
  createdAt: string;
}

const ManagerAppointments = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // State for appointments and related data
  const [appointments, setAppointments] = useState<{ [key: string]: Appointment }>({});
  const [slots, setSlots] = useState<{ [key: string]: CalendarSlot }>({});
  const [externalGroups, setExternalGroups] = useState<{ [key: string]: ExternalGroup }>({});

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(1)),
    end: new Date(new Date().setMonth(new Date().getMonth() + 1, 0))
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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

  // Get status badge color
  const getStatusBadgeColor = (status: Appointment["status"]) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500";
      case "inProgress":
        return "bg-amber-500";
      case "completed":
        return "bg-emerald-500";
      case "canceled":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  // Filter appointments based on current filters
  const filteredAppointments = Object.values(appointments).filter(appointment => {
    const slot = slots[appointment.calendarSlotId];
    if (!slot) return false;

    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    const matchesSearch = searchQuery === "" || 
      slot.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slot.startTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slot.endTime.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Handle status change
  const handleStatusChange = (appointmentId: string, newStatus: Appointment["status"]) => {
    setAppointments(prev => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        status: newStatus,
        updatedAt: new Date().toISOString()
      }
    }));

    toast({
      title: "Status Updated",
      description: `Appointment status changed to ${newStatus}.`
    });
  };

  // Handle export
  const handleExport = (format: 'pdf' | 'csv') => {
    // In a real application, this would call a backend API to generate the file
    toast({
      title: "Appointments Exported",
      description: `Appointments exported as ${format.toUpperCase()}`,
      duration: 3000
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10 h-[69px]">
        <div className="px-6 h-full flex items-center justify-between">
          {/* Left section - Logo and menu */}
          <div className="flex items-center space-x-4 w-[200px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block">Appointments & Attendance</h1>
            </div>
          </div>

          {/* Center section - Empty for now */}
          <div className="flex-1"></div>

          {/* Right section - Empty for now */}
          <div className="w-[200px]"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ManagerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
          onLogout={() => {
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
            navigate("/login");
          }}
        />

        {/* Appointments Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left section - Filters */}
                <div className="flex items-center gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Appointments</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="inProgress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search appointments..."
                      className="pl-8 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('csv')}>
                        Export as CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="divide-y">
                {filteredAppointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-slate-500 mb-4">No appointments found</div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/manager/calendar")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Go to Calendar
                    </Button>
                  </div>
                ) : (
                  filteredAppointments.map(appointment => {
                    const slot = slots[appointment.calendarSlotId];
                    const externalGroup = externalGroups[appointment.calendarSlotId];
                    
                    return (
                      <div
                        key={appointment.id}
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {slot ? format(new Date(slot.date), 'EEEE, MMMM d, yyyy') : 'Unknown Date'}
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                              {slot ? `${slot.startTime} - ${slot.endTime}` : 'Unknown Time'}
                            </div>
                          </div>
                          <Badge className={getStatusBadgeColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>

                        <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {appointment.volunteerIds.length} volunteer{appointment.volunteerIds.length !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Created {format(new Date(appointment.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>

                        {externalGroup && (
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                              External Group: {externalGroup.groupName}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View and manage appointment details.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="font-medium mb-2">Session Details</div>
                <div className="text-sm text-slate-600 space-y-1">
                  <div>Date: {format(new Date(slots[selectedAppointment.calendarSlotId]?.date || ''), 'MMMM d, yyyy')}</div>
                  <div>Time: {slots[selectedAppointment.calendarSlotId]?.startTime} - {slots[selectedAppointment.calendarSlotId]?.endTime}</div>
                  <div>Status: {selectedAppointment.status}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Status</Label>
                <Select
                  value={selectedAppointment.status}
                  onValueChange={(value: Appointment["status"]) => handleStatusChange(selectedAppointment.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="inProgress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Volunteers</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedAppointment.volunteerIds.map(volunteerId => (
                    <Badge key={volunteerId} variant="outline" className="bg-slate-100">
                      {volunteerId}
                    </Badge>
                  ))}
                </div>
              </div>

              {externalGroups[selectedAppointment.calendarSlotId] && (
                <div className="space-y-2">
                  <Label>External Group</Label>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-sm text-slate-600 space-y-1">
                      <div>Group Name: {externalGroups[selectedAppointment.calendarSlotId].groupName}</div>
                      <div>Contact: {externalGroups[selectedAppointment.calendarSlotId].contactPerson}</div>
                      <div>Purpose: {externalGroups[selectedAppointment.calendarSlotId].purposeOfVisit}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Timeline</Label>
                <div className="text-sm text-slate-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Created on {format(new Date(selectedAppointment.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>Last updated on {format(new Date(selectedAppointment.updatedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <div className="text-sm text-slate-600">
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerAppointments; 