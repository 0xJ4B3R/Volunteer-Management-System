import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Users,
  Clock2,
  XCircle,
  Calendar,
  Download,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import { useCalendarSlots } from "@/hooks/useFirestoreCalendar";
import { useExternalGroups } from "@/hooks/useFirestoreCalendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateAppointment } from "@/hooks/useFirestoreCalendar";
import { AttendanceStatus, ParticipantId } from "@/services/firestore";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { useAppointments, AppointmentUI } from "@/hooks/useFirestoreCalendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAttendanceByAppointment, useAddAttendance, useUpdateAttendance } from "@/hooks/useAttendance";
import ManagerSidebar from "@/components/manager/ManagerSidebar";

type AppointmentStatus = "upcoming" | "inProgress" | "completed" | "canceled";

const ManagerAppointments = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Get real data from hooks
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { slots, loading: slotsLoading } = useCalendarSlots();
  const { externalGroups, loading: groupsLoading } = useExternalGroups();
  const { updateAppointment, loading: isUpdating } = useUpdateAppointment();
  const { volunteers } = useVolunteers();

  // Filter state
  const [activeTab, setActiveTab] = useState("upcoming");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Modal state
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentUI | null>(null);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);

  // Get attendance data for selected appointment
  const { attendance: appointmentAttendance, loading: attendanceLoading } = useAttendanceByAppointment(selectedAppointment?.id || '');
  const { addAttendance, loading: isAddingAttendance } = useAddAttendance();
  const { updateAttendance, loading: isUpdatingAttendance } = useUpdateAttendance();

  const datePickerRef = useRef<HTMLButtonElement>(null);

  // Add state for tracking attendance changes
  const [pendingAttendanceChanges, setPendingAttendanceChanges] = useState<{
    [key: string]: {
      status: AttendanceStatus;
      notes?: string | null;
      volunteerId: ParticipantId;
    };
  }>({});

  // Add loading state for save button
  const [isSaving, setIsSaving] = useState(false);

  // Add loading state for details save button
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Add state for tracking details changes
  const [pendingDetailsChanges, setPendingDetailsChanges] = useState<{
    status?: AppointmentStatus;
    notes?: string;
  }>({});

  // Add new state for the main dialog tab
  const [detailsTab, setDetailsTab] = useState('details');

  // Add state for updating statuses
  const [isUpdatingStatuses, setIsUpdatingStatuses] = useState(false);
  const lastStatusCheckRef = useRef<number>(0);
  const STATUS_CHECK_INTERVAL = 60000; // Check every minute

  // Add back the delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  // Get status badge color
  const getStatusBadgeColor = (status: AppointmentStatus) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500 text-white hover:bg-blue-600 transition-colors";
      case "inProgress":
        return "bg-amber-500 text-white hover:bg-amber-600 transition-colors";
      case "completed":
        return "bg-emerald-500 text-white hover:bg-emerald-600 transition-colors";
      case "canceled":
        return "bg-red-500 text-white hover:bg-red-600 transition-colors";
      default:
        return "bg-slate-500 text-white hover:bg-slate-600 transition-colors";
    }
  };

  // Format status for display
  const formatStatus = (status: AppointmentStatus) => {
    switch (status) {
      case "upcoming":
        return "Upcoming";
      case "inProgress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "canceled":
        return "Canceled";
      default:
        return status;
    }
  };

  // Handle date range selection
  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    if (range?.from) {
      // If only one date is selected, use it for both from and to
      const newRange = {
        from: range.from,
        to: range.to || range.from
      };
      setDateRange(newRange);
      setActiveTab("specific");
    } else {
      setDateRange({ from: undefined, to: undefined });
      setActiveTab("all");
    }
  };

  // Add useMemo for filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const slot = slots.find(s => s.id === appointment.calendarSlotId);
      if (!slot) return false;

      const appointmentDate = new Date(slot.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const matchesDateRange = dateRange?.from && dateRange?.to ?
        isWithinInterval(appointmentDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to)
        }) :
        true;

      let matchesTab = true;
      if (activeTab === "today") {
        matchesTab = appointmentDate.toDateString() === today.toDateString();
      } else if (activeTab === "past") {
        // Show if completed and slot end time is before now
        if (appointment.status === "completed" && slot) {
          const slotEnd = new Date(slot.date);
          const [endHour, endMinute] = slot.endTime.split(':').map(Number);
          slotEnd.setHours(endHour, endMinute, 0, 0);
          matchesTab = slotEnd < new Date();
        } else {
          matchesTab = false;
        }
      } else if (activeTab === "upcoming") {
        matchesTab = appointmentDate > today &&
          appointment.status === "upcoming";
      } else if (activeTab === "canceled") {
        matchesTab = appointment.status === "canceled";
      } else if (activeTab === "specific") {
        matchesTab = dateRange?.from && dateRange?.to ?
          isWithinInterval(appointmentDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          }) : false;
      }
      // "all" tab shows everything by default (matchesTab remains true)

      return matchesTab && matchesDateRange;
    });
  }, [appointments, slots, activeTab, dateRange]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "specific") {
      const today = new Date();
      setDateRange({
        from: today,
        to: today
      });
    } else {
      setDateRange({
        from: undefined,
        to: undefined
      });
    }
  };

  // Add function to check if status change is valid
  const isValidStatusChange = (appointment: AppointmentUI, newStatus: AppointmentStatus) => {
    const slot = slots.find(s => s.id === appointment.calendarSlotId);
    if (!slot) return false;

    const now = new Date();
    const appointmentDate = new Date(slot.date);
    const isToday = appointmentDate.toDateString() === now.toDateString();

    // Convert times to minutes for comparison
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    // Canceled status can be set at any time
    if (newStatus === 'canceled') return true;

    // For non-canceled statuses, check time constraints
    if (isToday) {
      if (currentTime < startTimeInMinutes) {
        // Before start time, only allow 'upcoming'
        return newStatus === 'upcoming';
      } else if (currentTime >= endTimeInMinutes) {
        // After end time, only allow 'completed'
        return newStatus === 'completed';
      } else {
        // During appointment time, only allow 'inProgress'
        return newStatus === 'inProgress';
      }
    } else if (appointmentDate > now) {
      // Future date, only allow 'upcoming'
      return newStatus === 'upcoming';
    } else {
      // Past date, only allow 'completed'
      return newStatus === 'completed';
    }
  };

  // Handle status change
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus, notes?: string) => {
    setIsSavingDetails(true);
    try {
      // If status is being set to canceled, update both appointment and calendar slot
      if (newStatus === 'canceled') {
        const appointment = appointments.find(a => a.id === appointmentId);
        if (!appointment) throw new Error('Appointment not found');

        // Update both appointment and calendar slot in parallel
        await Promise.all([
          // Update appointment
          updateAppointment(appointmentId, {
            status: newStatus,
            notes: notes,
            updatedAt: Timestamp.fromDate(new Date())
          }),
          // Update calendar slot
          updateDoc(doc(db, 'calendar_slots', appointment.calendarSlotId), {
            status: 'canceled',
            isOpen: false,
            updatedAt: Timestamp.fromDate(new Date())
          })
        ]);
      } else {
        // For non-canceled statuses, only update the appointment
        await updateAppointment(appointmentId, {
          status: newStatus,
          notes: notes,
          updatedAt: Timestamp.fromDate(new Date())
        });
      }

      // Only update local state after successful database update
      const updatedAppointment = {
        ...selectedAppointment!,
        status: newStatus,
        notes: notes,
        updatedAt: new Date().toISOString()
      };
      setSelectedAppointment(updatedAppointment);

      // Clear pending changes after successful save
      setPendingDetailsChanges({});

      toast({
        title: "Status Updated",
        description: `Appointment status changed to ${formatStatus(newStatus)}.`
      });

      // Close the dialog after successful save
      setIsDetailsDialogOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive"
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Handle details change
  const handleDetailsChange = (field: 'status' | 'notes', value: string) => {
    if (field === 'status' && selectedAppointment) {
      // Validate status change
      if (!isValidStatusChange(selectedAppointment, value as AppointmentStatus)) {
        toast({
          title: "Invalid Status Change",
          description: "This status change is not allowed based on the appointment's time.",
          variant: "destructive"
        });
        return;
      }

      // If status is being set to canceled, update both appointment and calendar slot
      if (value === 'canceled') {
        const slot = slots.find(s => s.id === selectedAppointment.calendarSlotId);
        if (slot) {
          updateDoc(doc(db, 'calendar_slots', slot.id), {
            status: 'canceled',
            isOpen: false,
            updatedAt: Timestamp.fromDate(new Date())
          });
        }
      }
    }

    setPendingDetailsChanges(prev => ({
      ...prev,
      [field]: value === '' ? null : value
    }));
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

  // Handle attendance status change
  const handleAttendanceChange = (volunteerId: ParticipantId, status: AttendanceStatus | null, notes?: string) => {
    setPendingAttendanceChanges(prev => ({
      ...prev,
      [volunteerId.id]: {
        status,
        notes: notes === '' ? null : notes,
        volunteerId
      }
    }));
  };

  // Handle save attendance changes
  const handleSaveAttendance = async () => {
    if (!selectedAppointment) return;

    setIsSaving(true);
    try {
      const updates = Object.entries(pendingAttendanceChanges).map(async ([volunteerId, changes]) => {
        const existingAttendance = appointmentAttendance.find(a => a.volunteerId.id === volunteerId);

        if (existingAttendance) {
          if (changes.status === null) {
            // If status is null, delete the attendance record
            return deleteDoc(doc(db, 'attendance', existingAttendance.id));
          } else {
            // Update existing attendance record
            return updateAttendance(existingAttendance.id, {
              status: changes.status,
              notes: changes.notes || null,
              volunteerId: changes.volunteerId,
              confirmedBy: 'manager'
            });
          }
        } else if (changes.status !== null) {
          // Create new attendance record only if status is not null
          return addAttendance({
            appointmentId: selectedAppointment.id,
            volunteerId: changes.volunteerId,
            status: changes.status,
            notes: changes.notes || null,
            confirmedBy: 'manager'
          });
        }
      });

      // Wait for all updates to complete
      await Promise.all(updates);

      // Clear pending changes
      setPendingAttendanceChanges({});

      toast({
        title: "Attendance Saved",
        description: "All attendance records have been updated successfully."
      });

      // Close the dialog
      setIsAttendanceDialogOpen(false);
    } catch (error) {
      console.error('Attendance update error:', error);
      toast({
        title: "Error",
        description: "Failed to save attendance records. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset pending changes when dialog closes
  useEffect(() => {
    if (!isAttendanceDialogOpen) {
      setPendingAttendanceChanges({});
    }
  }, [isAttendanceDialogOpen]);

  // Get attendance status badge
  const getAttendanceStatusBadge = (volunteerId: string, status: AttendanceStatus | undefined) => {
    // Check for pending changes first
    const pendingStatus = pendingAttendanceChanges[volunteerId]?.status;
    const displayStatus = pendingStatus !== undefined ? pendingStatus : status;

    if (displayStatus === null) {
      return <Badge variant="outline" className="bg-slate-100">Not Marked</Badge>;
    }

    switch (displayStatus) {
      case 'present':
        return <Badge className="bg-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" />Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
      case 'late':
        return <Badge className="bg-amber-500"><Clock2 className="h-3 w-3 mr-1" />Late</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100">Not Marked</Badge>;
    }
  };

  // Helper to check if appointment is for an external group
  const isExternalGroup = selectedAppointment?.volunteerIds.some(v => v.type === 'external_group');
  // Get external group details if present
  const externalGroupDetails = isExternalGroup
    ? externalGroups.find(g => g.id === selectedAppointment.volunteerIds.find(v => v.type === 'external_group')?.id)
    : null;

  // Function to check and update appointment statuses
  const checkAndUpdateAppointmentStatuses = useCallback(async () => {
    if (!appointments.length || !slots.length) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes for easier comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Only run if enough time has passed since last check
    if (now.getTime() - lastStatusCheckRef.current < STATUS_CHECK_INTERVAL) {
      return;
    }

    setIsUpdatingStatuses(true);
    lastStatusCheckRef.current = now.getTime();

    try {
      const updates = appointments
        .filter(appointment => {
          const slot = slots.find(s => s.id === appointment.calendarSlotId);
          if (!slot) return false;

          const appointmentDate = new Date(slot.date);
          const isToday = appointmentDate.toDateString() === today.toDateString();

          if (!isToday) return false;

          // Convert slot times to minutes for comparison
          const [startHour, startMinute] = slot.startTime.split(':').map(Number);
          const [endHour, endMinute] = slot.endTime.split(':').map(Number);
          const startTimeInMinutes = startHour * 60 + startMinute;
          const endTimeInMinutes = endHour * 60 + endMinute;

          // Check if status needs updating
          if (appointment.status === 'upcoming' && currentTime >= startTimeInMinutes) {
            return true; // Needs update to 'inProgress'
          }
          if (appointment.status === 'inProgress' && currentTime >= endTimeInMinutes) {
            return true; // Needs update to 'completed'
          }
          if ((appointment.status === 'inProgress' || appointment.status === 'completed') &&
            currentTime < startTimeInMinutes) {
            return true; // Needs update to 'upcoming'
          }

          return false;
        })
        .map(async appointment => {
          const slot = slots.find(s => s.id === appointment.calendarSlotId);
          if (!slot) return;

          const [startHour, startMinute] = slot.startTime.split(':').map(Number);
          const [endHour, endMinute] = slot.endTime.split(':').map(Number);
          const startTimeInMinutes = startHour * 60 + startMinute;
          const endTimeInMinutes = endHour * 60 + endMinute;
          const currentTime = now.getHours() * 60 + now.getMinutes();

          let newStatus: AppointmentStatus;
          if (currentTime >= endTimeInMinutes) {
            newStatus = 'completed';
          } else if (currentTime >= startTimeInMinutes) {
            newStatus = 'inProgress';
          } else {
            newStatus = 'upcoming';
          }

          // Only update if status is different
          if (newStatus !== appointment.status) {
            return updateAppointment(appointment.id, {
              status: newStatus,
              updatedAt: Timestamp.fromDate(now)
            });
          }
        });

      // Wait for all updates to complete
      await Promise.all(updates.filter(Boolean));
    } catch (error) {
      console.error('Error updating appointment statuses:', error);
    } finally {
      setIsUpdatingStatuses(false);
    }
  }, [appointments, slots, updateAppointment]);

  // Run status check when appointments or slots are loaded
  useEffect(() => {
    if (!appointmentsLoading && !slotsLoading) {
      checkAndUpdateAppointmentStatuses();
    }
  }, [appointmentsLoading, slotsLoading, checkAndUpdateAppointmentStatuses]);

  // Set up interval for periodic checks
  useEffect(() => {
    const interval = setInterval(checkAndUpdateAppointmentStatuses, STATUS_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkAndUpdateAppointmentStatuses]);

  // Utility for visually hidden class
  const srOnly = "sr-only";

  // Defensive date formatting helper
  function safeFormat(date: Date | string | undefined, fmt: string) {
    if (!date) return "Unknown Date";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Unknown Date";
    try {
      return format(d, fmt);
    } catch {
      return "Unknown Date";
    }
  }

  // Update the isLoading variable to be a const
  const isLoading = appointmentsLoading || slotsLoading || groupsLoading || isUpdating || attendanceLoading || isAddingAttendance || isUpdatingAttendance;

  // Add back the handleDeleteAppointment function
  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      // Find the appointment to get its calendarSlotId
      const appointment = appointments.find(a => a.id === appointmentId);
      // Find the external group associated with this appointment
      const externalGroup = externalGroups.find(g => g.appointmentId === appointmentId);

      // If there's an external group, delete it first
      if (externalGroup) {
        await deleteDoc(doc(db, 'external_groups', externalGroup.id));
      }

      // Delete the associated calendar slot if it exists
      if (appointment && appointment.calendarSlotId) {
        await deleteDoc(doc(db, 'calendar_slots', appointment.calendarSlotId));
      }

      // Then delete the appointment
      await deleteDoc(doc(db, 'appointments', appointmentId));

      toast({
        title: "Appointment Deleted",
        description: "The appointment and all associated records have been deleted successfully."
      });

      // Deselect appointment and close dialogs
      setSelectedAppointment(null);
      setIsDetailsDialogOpen(false);
      setIsDeleteDialogOpen(false);

      // Navigate back to the appointments page
      navigate('/manager/appointments');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10 h-[69px]">
        <div className="px-6 h-full flex items-center justify-between">
          {/* Left section - Logo and menu */}
          <div className="flex items-center space-x-4 w-[280px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h1 className="font-bold text-xl hidden sm:block whitespace-nowrap">Appointments & Attendance</h1>
            </div>
          </div>

          {/* Center section - Empty */}
          <div className="flex-1"></div>

          {/* Right section - Empty for balance */}
          <div className="w-[280px]"></div>
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                {/* Left section - Filters */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-[680px]">
                    <TabsList className="grid w-full grid-cols-6 bg-slate-100 p-1">
                      <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">All</TabsTrigger>
                      <TabsTrigger value="today" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Today</TabsTrigger>
                      <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Upcoming</TabsTrigger>
                      <TabsTrigger value="past" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Past</TabsTrigger>
                      <TabsTrigger value="canceled" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Canceled</TabsTrigger>
                      <TabsTrigger value="specific" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Specific Date</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[240px] justify-start text-left font-normal bg-white hover:bg-slate-50",
                            !dateRange.from && !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarRange className="mr-2 h-4 w-4 text-primary" />
                          {dateRange.from && dateRange.to ? (
                            dateRange.from.toDateString() === dateRange.to.toDateString() ? (
                              format(dateRange.from, "PPP")
                            ) : (
                              `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                            )
                          ) : (
                            "Pick a date range"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="range"
                          selected={dateRange}
                          onSelect={handleDateRangeSelect}
                          initialFocus
                          modifiers={{ today: () => false }}
                          modifiersStyles={{ today: { fontWeight: 'normal' } }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center gap-3">
                  {(dateRange.from || dateRange.to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined });
                        setActiveTab("all");
                      }}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      Clear Range
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50">
                        <Download className="h-4 w-4 mr-2 text-primary" />
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-300">
              <div className="divide-y divide-slate-200">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="text-slate-500">Loading appointments...</div>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-slate-500 mb-4">No appointments found</div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/manager/calendar")}
                      className="bg-white hover:bg-slate-50"
                    >
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      Go to Calendar
                    </Button>
                  </div>
                ) : (
                  filteredAppointments.map(appointment => {
                    const slot = slots.find(s => s.id === appointment.calendarSlotId);
                    const externalGroup = externalGroups.find(g => g.appointmentId === appointment.id);

                    return (
                      <div
                        key={appointment.id}
                        className={cn(
                          "p-6 hover:bg-slate-50 cursor-pointer transition-colors relative",
                          "hover:bg-slate-50/50",
                          // Only right border radii for card
                          filteredAppointments[0].id === appointment.id && "rounded-tr-xl rounded-t-xl",
                          filteredAppointments[filteredAppointments.length - 1].id === appointment.id && "rounded-br-xl rounded-b-xl"
                        )}
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        {/* Flowing Status Bar */}
                        <div
                          className={cn(
                            "absolute left-0 top-0 bottom-0 w-2 rounded-l-xl shadow-sm",
                            appointment.status === "upcoming" && "bg-blue-500",
                            appointment.status === "inProgress" && "bg-amber-500",
                            appointment.status === "completed" && "bg-emerald-500",
                            appointment.status === "canceled" && "bg-red-500"
                          )}
                          style={{
                            borderTopLeftRadius: '0.75rem',
                            borderBottomLeftRadius: '0.75rem',
                          }}
                        />

                        <div className="flex justify-between items-center">
                          {/* Left side - Main content */}
                          <div className="space-y-3">
                            {/* Date and Status */}
                            <div className="flex items-center gap-3">
                              <div className="font-medium text-slate-900 text-lg">
                                {slot ? safeFormat(slot.date, 'EEEE, MMMM d, yyyy') : 'Unknown Date'}
                              </div>
                              <Badge className={cn(
                                "capitalize px-3 py-1 text-sm",
                                getStatusBadgeColor(appointment.status)
                              )}>
                                {formatStatus(appointment.status)}
                              </Badge>
                            </div>

                            {/* Metadata */}
                            <div className="text-sm text-slate-500 flex items-center gap-4">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1.5 text-primary" />
                                {slot ? `${slot.startTime} - ${slot.endTime}` : 'Unknown Time'}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1.5 text-primary" />
                                {appointment.volunteerIds.length} volunteer{appointment.volunteerIds.length !== 1 ? 's' : ''}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1.5 text-primary" />
                                Created {safeFormat(appointment.createdAt, 'MMM d, yyyy')}
                              </div>
                            </div>

                            {/* External Group Badge */}
                            {externalGroup && (
                              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors px-3 py-1">
                                External Group: {externalGroup.groupName}
                              </Badge>
                            )}
                          </div>

                          {/* Right side - Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-4 bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(appointment);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-4 bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(appointment);
                                setIsAttendanceDialogOpen(true);
                              }}
                              disabled={appointment.status === 'canceled'}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                              Track Attendance
                            </Button>
                          </div>
                        </div>
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
      <Dialog open={isDetailsDialogOpen} onOpenChange={(open) => {
        setIsDetailsDialogOpen(open);
        if (!open) {
          // Reset all pending changes when dialog closes
          setPendingDetailsChanges({});
          setDetailsTab('details');
        }
      }}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-slate-900">Appointment Details</DialogTitle>
            <DialogDescription className="text-slate-500">
              View and manage appointment details.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 pr-5 pt-4 pb-4">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-indigo-50 via-purple-100/70 to-pink-50 rounded-xl border border-indigo-100 shadow-sm">
                    <div className="p-4 border-b-2 border-indigo-200/70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center ring-4 ring-white shadow-sm">
                            <Calendar className="h-5 w-5 text-pink-900" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-lg">Session Details</div>
                          </div>
                        </div>
                        <Badge className={cn(
                          "px-2.5 py-1 text-sm font-medium whitespace-nowrap",
                          getStatusBadgeColor(selectedAppointment.status)
                        )}>
                          {formatStatus(selectedAppointment.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <Calendar className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="text-sm font-medium text-slate-500">Date & Time</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-slate-900 font-medium">
                              {safeFormat(slots.find(s => s.id === selectedAppointment.calendarSlotId)?.date, 'EEEE, MMMM d, yyyy')}
                            </div>
                            <div className="text-sm text-slate-600">
                              {slots.find(s => s.id === selectedAppointment.calendarSlotId)?.startTime} - {slots.find(s => s.id === selectedAppointment.calendarSlotId)?.endTime}
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Users className="h-3 w-3 text-indigo-600" />
                            </div>
                            <div className="text-sm font-medium text-slate-500">Participants</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-slate-900 font-medium">
                              {selectedAppointment.volunteerIds.length} Volunteer{selectedAppointment.volunteerIds.length !== 1 ? 's' : ''}
                            </div>
                            <div className="text-sm text-slate-600">
                              {selectedAppointment.residentIds.length} Resident{selectedAppointment.residentIds.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                        <Label className="text-slate-900">Current Status</Label>
                        <Select
                          value={pendingDetailsChanges.status || selectedAppointment.status}
                          onValueChange={(value: AppointmentStatus) => handleDetailsChange('status', value)}
                        >
                          <SelectTrigger className="bg-white focus:ring-0 focus:ring-offset-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="upcoming"
                              disabled={!isValidStatusChange(selectedAppointment, 'upcoming')}
                            >
                              Upcoming
                            </SelectItem>
                            <SelectItem
                              value="inProgress"
                              disabled={!isValidStatusChange(selectedAppointment, 'inProgress')}
                            >
                              In Progress
                            </SelectItem>
                            <SelectItem
                              value="completed"
                              disabled={!isValidStatusChange(selectedAppointment, 'completed')}
                            >
                              Completed
                            </SelectItem>
                            <SelectItem
                              value="canceled"
                              disabled={!isValidStatusChange(selectedAppointment, 'canceled')}
                            >
                              Canceled
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* External Group Details Card */}
                  {isExternalGroup && externalGroupDetails && (
                    <div className="bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-50 rounded-xl border border-blue-100 shadow-sm">
                      <div className="flex items-center gap-3 p-4 border-b-2 border-blue-200">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                          <Users className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <div className="font-semibold text-black text-lg">{externalGroupDetails.groupName}</div>
                          <div className="text-sm text-black mt-1">{externalGroupDetails.numberOfParticipants} participant{externalGroupDetails.numberOfParticipants !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                          <div className="text-xs text-slate-500 font-medium mb-1">Contact Person</div>
                          <div className="text-slate-900 text-sm font-medium">{externalGroupDetails.contactPerson}</div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                          <div className="text-xs text-slate-500 font-medium mb-1">Contact Phone</div>
                          <div className="text-slate-900 text-sm font-medium">{externalGroupDetails.contactPhoneNumber}</div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                          <div className="text-xs text-slate-500 font-medium mb-1">Purpose of Visit</div>
                          <div className="text-slate-900 text-sm font-medium">{externalGroupDetails.purposeOfVisit}</div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                          <div className="text-xs text-slate-500 font-medium mb-1">Participants</div>
                          <div className="text-slate-900 text-sm font-medium">{externalGroupDetails.numberOfParticipants}</div>
                        </div>
                        {externalGroupDetails.assignedDepartment && (
                          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                            <div className="text-xs text-slate-500 font-medium mb-1">Department</div>
                            <div className="text-slate-900 text-sm font-medium">{externalGroupDetails.assignedDepartment}</div>
                          </div>
                        )}
                        {externalGroupDetails.activityContent && (
                          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                            <div className="text-xs text-slate-500 font-medium mb-1">Activity</div>
                            <div className="text-slate-900 text-sm font-medium">{externalGroupDetails.activityContent}</div>
                          </div>
                        )}
                        {externalGroupDetails.notes && (
                          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3 sm:col-span-2">
                            <div className="text-xs text-slate-500 font-medium mb-1">Notes</div>
                            <div className="text-slate-900 text-sm font-medium">{externalGroupDetails.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-slate-900">Timeline</Label>
                    <div className="text-sm text-slate-600 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span>Created on {safeFormat(selectedAppointment.createdAt, 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>Last updated on {safeFormat(selectedAppointment.updatedAt, 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-900">Notes</Label>
                    <div className="relative">
                      <textarea
                        className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:ring-offset-0"
                        placeholder="Add notes about this appointment..."
                        value={pendingDetailsChanges.notes !== undefined ? pendingDetailsChanges.notes || '' : (selectedAppointment.notes || '')}
                        onChange={(e) => handleDetailsChange('notes', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Delete Button - Only show for canceled appointments */}
                  {selectedAppointment.status === 'canceled' && !pendingDetailsChanges.status && (
                    <div className="pt-4 border-t border-slate-200">
                      <Button
                        variant="destructive"
                        className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        Delete Appointment
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-200 pt-5 flex justify-center items-center">
            <Button
              onClick={async () => {
                if (!selectedAppointment) return;
                setIsSavingDetails(true);
                try {
                  // Handle status and notes changes
                  if (Object.keys(pendingDetailsChanges).length > 0) {
                    // If status is being set to canceled, delete all attendance records for this appointment
                    const newStatus = pendingDetailsChanges.status || selectedAppointment.status;
                    if (newStatus === 'canceled') {
                      const attendanceToDelete = appointmentAttendance;
                      await Promise.all(attendanceToDelete.map(a => deleteDoc(doc(db, 'attendance', a.id))));
                    }
                    await updateAppointment(selectedAppointment.id, {
                      status: pendingDetailsChanges.status || selectedAppointment.status,
                      notes: pendingDetailsChanges.notes !== undefined ? pendingDetailsChanges.notes || '' : selectedAppointment.notes,
                      updatedAt: Timestamp.fromDate(new Date())
                    });
                  }

                  // Update local state
                  setSelectedAppointment({
                    ...selectedAppointment,
                    status: pendingDetailsChanges.status || selectedAppointment.status,
                    notes: pendingDetailsChanges.notes !== undefined ? pendingDetailsChanges.notes || '' : selectedAppointment.notes,
                    updatedAt: new Date().toISOString()
                  });

                  // Reset all pending changes
                  setPendingDetailsChanges({});

                  toast({
                    title: "Changes Saved",
                    description: "All changes have been saved successfully."
                  });

                  setIsDetailsDialogOpen(false);
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to save changes. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsSavingDetails(false);
                }
              }}
              disabled={isSavingDetails || Object.keys(pendingDetailsChanges).length === 0}
              className="w-[200px] transition-all duration-200 mx-auto"
            >
              {isSavingDetails ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Tracking Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={(open) => {
        setIsAttendanceDialogOpen(open);
        if (!open) {
          // Reset pending changes when dialog closes
          setPendingAttendanceChanges({});
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-slate-900">Track Attendance</DialogTitle>
            <DialogDescription className="text-slate-500">
              Mark attendance for participants in this appointment.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="flex-1 overflow-y-auto">
              {attendanceLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-slate-500">Loading attendance data...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 px-4 pr-5 pt-4 pb-4">
                  {/* Attendance Summary Row */}
                  {selectedAppointment.volunteerIds.length > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600 font-medium">Participants ({selectedAppointment.volunteerIds.length})</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" />{Object.values(pendingAttendanceChanges).filter(a => a.status === 'present').length + appointmentAttendance.filter(a => !pendingAttendanceChanges[a.volunteerId.id] && a.status === 'present').length} Present</Badge>
                        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 flex items-center"><Clock2 className="h-3 w-3 mr-1" />{Object.values(pendingAttendanceChanges).filter(a => a.status === 'late').length + appointmentAttendance.filter(a => !pendingAttendanceChanges[a.volunteerId.id] && a.status === 'late').length} Late</Badge>
                        <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700 flex items-center"><XCircle className="h-3 w-3 mr-1" />{Object.values(pendingAttendanceChanges).filter(a => a.status === 'absent').length + appointmentAttendance.filter(a => !pendingAttendanceChanges[a.volunteerId.id] && a.status === 'absent').length} Absent</Badge>
                      </div>
                    </div>
                  )}

                  {/* Attendance List */}
                  <div className="space-y-4">
                    {selectedAppointment.volunteerIds.map(volunteerId => {
                      const attendance = appointmentAttendance.find(a => a.volunteerId.id === volunteerId.id);
                      const isExternalGroup = volunteerId.type === 'external_group';
                      const group = isExternalGroup ? externalGroups.find(g => g.id === volunteerId.id) : null;
                      const volunteer = !isExternalGroup ? volunteers.find(v => v.id === volunteerId.id) : null;
                      const status = pendingAttendanceChanges[volunteerId.id]?.status !== undefined
                        ? pendingAttendanceChanges[volunteerId.id]?.status
                        : attendance?.status;
                      // Card border color based on status
                      let borderColor = 'border-slate-200';
                      let bgColor = 'bg-white';
                      if (status === 'present') { borderColor = 'border-emerald-300'; bgColor = 'bg-emerald-50'; }
                      else if (status === 'late') { borderColor = 'border-amber-300'; bgColor = 'bg-amber-50'; }
                      else if (status === 'absent') { borderColor = 'border-red-300'; bgColor = 'bg-red-50'; }

                      return (
                        <div
                          key={volunteerId.id}
                          className={cn(
                            "flex flex-col p-4 rounded-xl shadow-sm border transition-colors",
                            borderColor,
                            bgColor
                          )}
                        >
                          <div className="flex items-center">
                            {/* Left: Avatar/Icon */}
                            <div className="flex items-center justify-center mr-4">
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center",
                                isExternalGroup ? "bg-blue-100" : "bg-green-100"
                              )}>
                                <Users className={cn(
                                  "h-5 w-5",
                                  isExternalGroup ? "text-blue-700" : "text-green-700"
                                )} />
                              </div>
                            </div>
                            {/* Center: Name/Type */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="font-medium text-slate-900 truncate">
                                {isExternalGroup ? group?.groupName : volunteer?.fullName || volunteerId.id}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {isExternalGroup ? 'External Group' : 'Volunteer'}
                              </div>
                            </div>
                            {/* Right: Status Buttons */}
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 px-3 rounded-full border-2",
                                  status === 'present'
                                    ? "bg-emerald-100 border-emerald-400 text-emerald-700 hover:bg-emerald-200 hover:border-emerald-500"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                                )}
                                onClick={() => handleAttendanceChange(
                                  volunteerId,
                                  status === 'present' ? null : 'present',
                                  pendingAttendanceChanges[volunteerId.id]?.notes || attendance?.notes
                                )}
                                disabled={isAddingAttendance || isUpdatingAttendance}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />Present
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 px-3 rounded-full border-2",
                                  status === 'late'
                                    ? "bg-amber-100 border-amber-400 text-amber-700 hover:bg-amber-200 hover:border-amber-500"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200"
                                )}
                                onClick={() => handleAttendanceChange(
                                  volunteerId,
                                  status === 'late' ? null : 'late',
                                  pendingAttendanceChanges[volunteerId.id]?.notes || attendance?.notes
                                )}
                                disabled={isAddingAttendance || isUpdatingAttendance}
                              >
                                <Clock2 className="h-4 w-4 mr-1" />Late
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 px-3 rounded-full border-2",
                                  status === 'absent'
                                    ? "bg-red-100 border-red-400 text-red-700 hover:bg-red-200 hover:border-red-500"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-200"
                                )}
                                onClick={() => handleAttendanceChange(
                                  volunteerId,
                                  status === 'absent' ? null : 'absent',
                                  pendingAttendanceChanges[volunteerId.id]?.notes || attendance?.notes
                                )}
                                disabled={isAddingAttendance || isUpdatingAttendance}
                              >
                                <XCircle className="h-4 w-4 mr-1" />Absent
                              </Button>
                            </div>
                          </div>
                          {/* Notes textarea on separate line */}
                          <div className="mt-3">
                            <textarea
                              className="w-full min-h-[60px] p-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:ring-offset-0"
                              placeholder="Add notes about attendance..."
                              value={pendingAttendanceChanges[volunteerId.id]?.notes !== undefined ? pendingAttendanceChanges[volunteerId.id]?.notes || '' : (attendance?.notes || '')}
                              onChange={(e) => handleAttendanceChange(volunteerId, status || 'present', e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-slate-200 pt-5 flex justify-center items-center">
            <Button
              onClick={handleSaveAttendance}
              disabled={Object.keys(pendingAttendanceChanges).length === 0 || isAddingAttendance || isUpdatingAttendance || isSaving || attendanceLoading}
              className="w-[200px] transition-all duration-200 mx-auto"
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Canceled Appointment</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-2">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <span className="text-red-600 font-semibold text-base mb-2">
                Are you sure you want to continue?
              </span>
              <span className="text-slate-600 text-sm">
                This will permanently remove the appointment record along with its associated calendar slot{isExternalGroup && ' and external group record'}.
              </span>
            </div>
          </div>
          <DialogFooter>
            <div className="w-full flex justify-center">
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!selectedAppointment) return;
                  setIsDeleting(true);
                  await handleDeleteAppointment(selectedAppointment.id);
                  setIsDeleting(false);
                }}
                disabled={isDeleting}
                className="w-[200px] transition-all duration-200 mx-auto"
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerAppointments; 