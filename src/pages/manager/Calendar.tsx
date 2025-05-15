import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Timestamp } from 'firebase/firestore';
import {
  Grid,
  Plus,
  User,
  Users,
  Clock,
  Columns,
  Download,
  AlertCircle,
  ChevronLeft,
  ListOrdered,
  ChevronRight,
  MoreVertical,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, isToday, isPast } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import { useResidents } from "@/hooks/useFirestoreResidents";
import {
  useCalendarSlots,
  useAddCalendarSlot,
  useUpdateCalendarSlot,
  useDeleteCalendarSlot,
  useAppointments,
  useAddAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useExternalGroups,
  useAddExternalGroup,
  useUpdateExternalGroup,
  useDeleteExternalGroup,
  CalendarSlotUI,
} from "@/hooks/useFirestoreCalendar";
import {
  CalendarSlot,
  Appointment,
  ExternalGroup,
  ParticipantId
} from "@/services/firestore";
import { useAttendanceByAppointment, useAddAttendance, useUpdateAttendance } from "@/hooks/useAttendance";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";

type CalendarView = "month" | "week" | "day";

// Timezone constants
const TIMEZONE = 'Asia/Jerusalem';

// Utility functions for Israel time handling
const toIsraelTime = (date: Date | string): Date => {
  if (typeof date === 'string') {
    // If it's just a date string (YYYY-MM-DD), append time
    if (date.length === 10) {
      date = `${date}T00:00:00`;
    }
    return toZonedTime(new Date(date), TIMEZONE);
  }
  return toZonedTime(date, TIMEZONE);
};

const formatIsraelTime = (date: Date | string, formatStr: string = 'yyyy-MM-dd'): string => {
  if (typeof date === 'string') {
    return formatInTimeZone(new Date(date), TIMEZONE, formatStr);
  }
  return formatInTimeZone(date, TIMEZONE, formatStr);
};

const isSlotInPast = (slot: CalendarSlotUI): boolean => {
  const now = toIsraelTime(new Date());
  const slotDate = toIsraelTime(slot.date);

  // Compare dates in Israel timezone
  const today = toIsraelTime(now);
  today.setHours(0, 0, 0, 0);
  slotDate.setHours(0, 0, 0, 0);

  return slotDate < today;
};

// Helper to determine session timing
const getSessionTiming = (date: string, startTime: string, endTime: string) => {
  const now = toIsraelTime(new Date());
  const sessionDate = toIsraelTime(date);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const sessionStart = new Date(sessionDate);
  sessionStart.setHours(startHour, startMinute, 0, 0);
  const sessionEnd = new Date(sessionDate);
  sessionEnd.setHours(endHour, endMinute, 0, 0);

  if (sessionEnd < now) return "past";
  if (sessionStart <= now && sessionEnd > now) return "ongoing";
  return "future";
};

// Add this helper function near the other utility functions
const isSessionInPast = (date: string, startTime: string): boolean => {
  const now = toIsraelTime(new Date());
  const sessionDate = toIsraelTime(date);
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const sessionStart = new Date(sessionDate);
  sessionStart.setHours(startHour, startMinute, 0, 0);
  return sessionStart < now;
};

// Helper function to get the correct max capacity for display
const getDisplayMaxCapacity = (session: CalendarSlotUI) => {
  // If session is in the past and not an external group, show number of approved volunteers
  if (isSlotInPast(session) && !(session.approvedVolunteers[0]?.type === 'external_group')) {
    return session.approvedVolunteers.length;
  }
  return session.maxCapacity;
};

// Helper function to get the correct count
const getVolunteerCount = (session: CalendarSlotUI) => {
  if (session.approvedVolunteers.length === 0) return 0;

  // Check if this is an external group by looking at the first participant's type
  const firstParticipant = session.approvedVolunteers[0];
  if (firstParticipant && firstParticipant.type === 'external_group') {
    // For external groups, use maxCapacity (which is set to numberOfParticipants)
    return session.maxCapacity;
  }
  // For regular volunteers, use the length of approvedVolunteers
  return session.approvedVolunteers.length;
};

// Add this function before the ManagerCalendar component
const getAttendanceByAppointment = async (appointmentId: string) => {
  const attendanceQuery = query(
    collection(db, 'attendance'),
    where('appointmentId', '==', appointmentId)
  );
  const snapshot = await getDocs(attendanceQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

const ManagerCalendar = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const headerRef = useRef<HTMLDivElement>(null);

  // Add timeError state for inline time validation
  const [timeError, setTimeError] = useState("");

  // Calendar state with Firestore hooks
  const { slots, loading: slotsLoading, error: slotsError } = useCalendarSlots();
  const { appointments, loading: appointmentsLoading, error: appointmentsError } = useAppointments();
  const { externalGroups, loading: externalGroupsLoading, error: externalGroupsError } = useExternalGroups();

  // CRUD operation hooks
  const { addCalendarSlot, loading: addLoading, error: addError } = useAddCalendarSlot();
  const { updateCalendarSlot, loading: updateLoading, error: updateError } = useUpdateCalendarSlot();
  const { deleteCalendarSlot, loading: deleteLoading, error: deleteError } = useDeleteCalendarSlot();
  const { addAppointment, loading: addAppointmentLoading, error: addAppointmentError } = useAddAppointment();
  const { updateAppointment, loading: updateAppointmentLoading, error: updateAppointmentError } = useUpdateAppointment();
  const { deleteAppointment, loading: deleteAppointmentLoading, error: deleteAppointmentError } = useDeleteAppointment();
  const { addExternalGroup, loading: addExternalGroupLoading, error: addExternalGroupError } = useAddExternalGroup();
  const { updateExternalGroup, loading: updateExternalGroupLoading, error: updateExternalGroupError } = useUpdateExternalGroup();
  const { deleteExternalGroup, loading: deleteExternalGroupLoading, error: deleteExternalGroupError } = useDeleteExternalGroup();

  // Add attendance hooks
  const { addAttendance, loading: isAddingAttendance } = useAddAttendance();

  // Calendar view state
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return toIsraelTime(now);
  });

  // Filter state
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const now = toIsraelTime(new Date());
    const start = new Date(now);
    start.setDate(1);
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1, 0);
    return {
      start: toIsraelTime(start),
      end: toIsraelTime(end)
    };
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);

  // Modal state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPendingRequestsDialogOpen, setIsPendingRequestsDialogOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlotUI | null>(null);
  const [newSlot, setNewSlot] = useState<Partial<CalendarSlot> & { externalGroup?: Partial<ExternalGroup> }>({
    date: formatIsraelTime(addDays(new Date(), 1), 'yyyy-MM-dd'),
    startTime: "09:00",
    endTime: "12:00",
    period: "morning",
    isCustom: false,
    customLabel: null,
    residentIds: [],
    maxCapacity: 3,
    volunteerRequests: [],
    status: "open",
    isOpen: true,
    notes: "",
    createdAt: Timestamp.fromDate(new Date()),
    externalGroup: undefined
  });

  // Add new state for day sessions dialog
  const [isDaySessionsDialogOpen, setIsDaySessionsDialogOpen] = useState(false);
  const [selectedDaySessions, setSelectedDaySessions] = useState<CalendarSlotUI[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);

  // Add state for pending requests
  const [pendingRequests, setPendingRequests] = useState<CalendarSlotUI[]>([]);
  const [isPendingViewActive, setIsPendingViewActive] = useState(false);

  // Add state to track which volunteer action is in progress
  const [pendingVolunteerAction, setPendingVolunteerAction] = useState<{ [key: string]: boolean }>({});

  // Add this state near the other state declarations
  const [fadingVolunteers, setFadingVolunteers] = useState<{ [key: string]: boolean }>({});

  // Add new state for volunteers
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);

  // Add Firestore hooks
  const { volunteers, loading: volunteersLoading } = useVolunteers();
  const { residents, loading: residentsLoading } = useResidents();

  // Add state for volunteer search and pending changes in create session dialog
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [pendingVolunteerChanges, setPendingVolunteerChanges] = useState<{
    added: string[];
    removed: string[];
  }>({
    added: [],
    removed: []
  });

  // Add state for resident search in create session dialog
  const [residentSearch, setResidentSearch] = useState("");

  // Add state for volunteer and resident tab view
  const [volunteerTab, setVolunteerTab] = useState('available');
  const [residentTab, setResidentTab] = useState('available');

  // Add state for volunteer and resident search/tabs in Edit dialog
  const [editVolunteerSearch, setEditVolunteerSearch] = useState("");
  const [editResidentSearch, setEditResidentSearch] = useState("");
  const [editVolunteerTab, setEditVolunteerTab] = useState("current");
  const [editResidentTab, setEditResidentTab] = useState("current");

  // Add pendingChanges state
  const [pendingChanges, setPendingChanges] = useState<{
    status?: "open" | "full" | "canceled";
    notes?: string;
  }>({});

  // Log header height when view changes
  useEffect(() => {
    if (headerRef.current) {
      console.log(`Header height on ${isPendingViewActive ? 'Pending' : calendarView} view:`, headerRef.current.offsetHeight, 'px');
    }
  }, [calendarView, isPendingViewActive]);

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

  // Update date range when calendar view or selected date changes
  useEffect(() => {
    setDateRange(getVisibleDateRange());
  }, [calendarView, selectedDate]);

  // Update useEffect to filter pending requests when view changes
  useEffect(() => {
    // Filter sessions that have pending volunteers and are not in the past
    const sessionsWithPending = slots.filter(session => {
      const sessionDate = toIsraelTime(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      const today = toIsraelTime(new Date());
      today.setHours(0, 0, 0, 0);
      return session.volunteerRequests.some(request => request.status === "pending") && sessionDate >= today;
    });

    setPendingRequests(sessionsWithPending);

    // Close the dialog if there are no pending requests
    if (sessionsWithPending.length === 0) {
      setIsPendingRequestsDialogOpen(false);
      // If we're in pending view and there are no more pending requests, go back to calendar
      if (isPendingViewActive) {
        setIsPendingViewActive(false);
      }
    }
  }, [slots, isPendingRequestsDialogOpen, isPendingViewActive]);

  // Apply filters to sessions
  const filteredSessions = slots.filter(slot => {
    const slotDate = toIsraelTime(slot.date);
    const inDateRange = slotDate >= dateRange.start && slotDate <= dateRange.end;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "open" && slot.status === "open") ||
      (statusFilter === "full" && slot.status === "full") ||
      (statusFilter === "canceled" && slot.status === "canceled");

    return inDateRange && matchesStatus;
  });

  // Get visible date range based on current view
  const getVisibleDateRange = () => {
    if (calendarView === "month") {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        start: toIsraelTime(start),
        end: toIsraelTime(end)
      };
    } else if (calendarView === "week") {
      const weekStart = startOfWeek(selectedDate);
      return {
        start: toIsraelTime(weekStart),
        end: toIsraelTime(endOfWeek(selectedDate))
      };
    } else {
      return {
        start: toIsraelTime(startOfDay(selectedDate)),
        end: toIsraelTime(endOfDay(selectedDate))
      };
    }
  };

  // Jump to previous/next period based on current view
  const goToPrevious = () => {
    if (calendarView === "month") {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setSelectedDate(toIsraelTime(newDate));
    } else if (calendarView === "week") {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 7);
      setSelectedDate(toIsraelTime(newDate));
    } else {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 1);
      setSelectedDate(toIsraelTime(newDate));
    }
  };

  const goToNext = () => {
    if (calendarView === "month") {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setSelectedDate(toIsraelTime(newDate));
    } else if (calendarView === "week") {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 7);
      setSelectedDate(toIsraelTime(newDate));
    } else {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      setSelectedDate(toIsraelTime(newDate));
    }
  };

  // Get formatted title for current view
  const getViewTitle = () => {
    if (calendarView === "month") {
      return formatIsraelTime(selectedDate, 'MMMM yyyy');
    } else if (calendarView === "week") {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${formatIsraelTime(weekStart, 'MMM d')} - ${formatIsraelTime(weekEnd, 'd, yyyy')}`;
      } else {
        return `${formatIsraelTime(weekStart, 'MMM d')} - ${formatIsraelTime(weekEnd, 'MMM d, yyyy')}`;
      }
    } else {
      return formatIsraelTime(selectedDate, 'EEEE, MMMM d, yyyy');
    }
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date) => {
    const dateStr = formatIsraelTime(toIsraelTime(date));
    return filteredSessions
      .filter(session => session.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Export calendar
  const handleExport = (format: 'pdf' | 'ics') => {
    // In a real application, this would call a backend API to generate the file
    toast({
      title: "Calendar Exported",
      description: `Calendar exported as ${format.toUpperCase()}`,
      duration: 3000
    });
  };

  // Handle create session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSession(true);

    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      setIsCreatingSession(false);
      return;
    }

    if (newSlot.residentIds.length === 0) {
      toast({
        title: "Missing residents",
        description: "Please select at least one resident for the session.",
        variant: "destructive"
      });
      setIsCreatingSession(false);
      return;
    }

    // Check if the session is in the past, ongoing, or future
    const sessionTiming = getSessionTiming(newSlot.date, newSlot.startTime, newSlot.endTime);
    const isPastSession = sessionTiming === 'past';
    const isOngoingSession = sessionTiming === 'ongoing';

    if (isPastSession && !newSlot.externalGroup && selectedVolunteers.length === 0) {
      toast({
        title: "Missing volunteer",
        description: "Past sessions must have at least one assigned volunteer.",
        variant: "destructive"
      });
      setIsCreatingSession(false);
      return;
    }

    if (!newSlot.externalGroup && !newSlot.maxCapacity) {
      toast({
        title: "Missing information",
        description: "Please fill in max capacity for regular sessions.",
        variant: "destructive"
      });
      setIsCreatingSession(false);
      return;
    }

    if (newSlot.externalGroup) {
      if (!newSlot.externalGroup.groupName ||
        !newSlot.externalGroup.contactPerson ||
        !newSlot.externalGroup.contactPhoneNumber ||
        !newSlot.externalGroup.purposeOfVisit ||
        !newSlot.externalGroup.numberOfParticipants) {
        toast({
          title: "Missing external group information",
          description: "Please fill in all required fields for the external group.",
          variant: "destructive"
        });
        setIsCreatingSession(false);
        return;
      }
    }

    if (newSlot.startTime >= newSlot.endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      setIsCreatingSession(false);
      return;
    }

    // In handleCreateSession, add validation for custom session time
    if (newSlot.isCustom) {
      if (!newSlot.startTime || !newSlot.endTime) {
        toast({
          title: "Missing time",
          description: "Please provide both start and end time for the custom session.",
          variant: "destructive"
        });
        setIsCreatingSession(false);
        return;
      }
      if (newSlot.startTime >= newSlot.endTime) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time for custom sessions.",
          variant: "destructive"
        });
        setIsCreatingSession(false);
        return;
      }
    }

    // Only check volunteer count for future/ongoing sessions
    if (!isPastSession && !newSlot.externalGroup && selectedVolunteers.length > (newSlot.maxCapacity || 0)) {
      toast({
        title: "Too many volunteers",
        description: `You cannot assign more volunteers than the max capacity. Remove some volunteers or increase the capacity.`,
        variant: "destructive"
      });
      setIsCreatingSession(false);
      return;
    }

    try {
      // Create external group first if it's an external group session
      let groupId: string | null = null;
      if (newSlot.externalGroup) {
        const externalGroup: Omit<ExternalGroup, 'id'> = {
          appointmentId: null, // Will be updated after appointment creation
          groupName: newSlot.externalGroup.groupName,
          contactPerson: newSlot.externalGroup.contactPerson,
          contactPhoneNumber: newSlot.externalGroup.contactPhoneNumber,
          purposeOfVisit: newSlot.externalGroup.purposeOfVisit,
          numberOfParticipants: newSlot.externalGroup.numberOfParticipants,
          assignedDepartment: newSlot.externalGroup.assignedDepartment || null,
          activityContent: newSlot.externalGroup.activityContent || null,
          notes: newSlot.notes || null,
          createdAt: Timestamp.fromDate(new Date())
        };
        groupId = await addExternalGroup(externalGroup);
        if (!groupId) {
          throw new Error("Failed to create external group");
        }
      }

      // Create session with Israel time
      const createdSlot: Omit<CalendarSlot, 'id'> = {
        date: formatIsraelTime(toIsraelTime(newSlot.date)),
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        period: newSlot.isCustom ? null : (newSlot.period || "morning"),
        isCustom: newSlot.isCustom || false,
        customLabel: newSlot.customLabel || null,
        residentIds: newSlot.residentIds || [],
        maxCapacity: (isPastSession || isOngoingSession)
          ? (newSlot.externalGroup ? newSlot.externalGroup.numberOfParticipants : selectedVolunteers.length)
          : (newSlot.externalGroup ? newSlot.externalGroup.numberOfParticipants : newSlot.maxCapacity),
        volunteerRequests: [],
        approvedVolunteers: newSlot.externalGroup && groupId ?
          [{ id: groupId, type: 'external_group' }] :
          selectedVolunteers.map(id => ({ id, type: 'volunteer' })),
        // SlotStatus only allows 'open', 'full', 'canceled'. Use 'full' for ongoing sessions.
        status: isPastSession ? "full" : (isOngoingSession ? "full" : (newSlot.externalGroup ? "full" : (selectedVolunteers.length >= (newSlot.maxCapacity || 0) ? "full" : "open"))),
        appointmentId: null,
        isOpen: (isPastSession || isOngoingSession)
          ? false
          : (newSlot.externalGroup ? false : (selectedVolunteers.length >= (newSlot.maxCapacity || 0) ? false : true)),
        notes: newSlot.notes || "",
        createdAt: Timestamp.fromDate(new Date())
      };

      // For past sessions, set maxCapacity to the number of assigned volunteers
      if (isPastSession && !newSlot.externalGroup) {
        createdSlot.maxCapacity = selectedVolunteers.length;
      }

      const newSlotId = await addCalendarSlot(createdSlot);
      if (!newSlotId) {
        throw new Error("Failed to create calendar slot");
      }

      // Create appointment if there are pre-approved volunteers or external group
      let appointmentId: string | null = null;
      if (selectedVolunteers.length > 0 || groupId) {
        const newAppointment: Omit<Appointment, 'id'> = {
          calendarSlotId: newSlotId,
          residentIds: createdSlot.residentIds,
          volunteerIds: groupId ?
            [{ id: groupId, type: 'external_group' }] :
            selectedVolunteers.map(id => ({ id, type: 'volunteer' })),
          status: isPastSession ? "completed" : (isOngoingSession ? "inProgress" : "upcoming"), // Set status as completed for past sessions, inProgress for ongoing
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          notes: createdSlot.notes
        };
        appointmentId = await addAppointment(newAppointment);

        // Update the calendar slot with the appointment ID
        if (appointmentId) {
          await updateCalendarSlot(newSlotId, {
            appointmentId: appointmentId
          });

          // Update external group with appointment ID if it exists
          if (groupId) {
            await updateExternalGroup(groupId, {
              appointmentId: appointmentId
            });
          }

          // For past sessions, automatically create attendance records marked as "Present"
          if (isPastSession && appointmentId) {
            const volunteerIds = groupId ?
              [{ id: groupId, type: 'external_group' }] :
              selectedVolunteers.map(id => ({ id, type: 'volunteer' }));

            // Create attendance records for each volunteer
            for (const volunteerId of volunteerIds) {
              await addAttendance({
                appointmentId: appointmentId,
                volunteerId: {
                  id: volunteerId.id,
                  type: volunteerId.type as "external_group" | "volunteer"
                },
                status: 'present',
                notes: 'Automatically marked as present for past session',
                confirmedBy: 'manager'
              });
            }
          }
        }
      }

      setIsCreateDialogOpen(false);
      setNewSlot({
        date: formatIsraelTime(addDays(new Date(), 1), 'yyyy-MM-dd'),
        startTime: "09:00",
        endTime: "12:00",
        period: "morning",
        isCustom: false,
        customLabel: null,
        residentIds: [],
        maxCapacity: 3,
        volunteerRequests: [],
        status: "open",
        isOpen: true,
        notes: "",
        createdAt: Timestamp.fromDate(new Date()),
        externalGroup: undefined
      });
      setSelectedVolunteers([]); // Reset selected volunteers

      toast({
        title: "Session created",
        description: isPastSession ?
          "Past session has been added and marked as completed with attendance records." :
          "New session has been added to the calendar."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Handle edit session
  const handleEditSession = async () => {
    if (!selectedSlot) return;

    // Validate time range
    if (selectedSlot.startTime >= selectedSlot.endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Build updated slot with all editable fields
      const updatedSlot: Partial<CalendarSlotUI> = {
        date: formatIsraelTime(toIsraelTime(selectedSlot.date)),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: selectedSlot.status,
        notes: selectedSlot.notes,
        maxCapacity: selectedSlot.maxCapacity,
        period: selectedSlot.period,
        isCustom: selectedSlot.isCustom,
        customLabel: selectedSlot.customLabel,
        approvedVolunteers: selectedSlot.approvedVolunteers,
        residentIds: selectedSlot.residentIds,
      };

      // Update calendar slot
      await updateCalendarSlot(selectedSlot.id, updatedSlot);

      // Update appointment (volunteers/residents)
      const appointment = appointments.find(a => a.calendarSlotId === selectedSlot.id);
      const hasParticipants = selectedSlot.approvedVolunteers.length > 0;

      if (appointment) {
        if (hasParticipants) {
          // If status is being set to canceled, update both appointment and calendar slot, and delete attendance records
          if (selectedSlot.status === 'canceled') {
            // Get all attendance records for this appointment
            const attendanceRecords = await getAttendanceByAppointment(appointment.id);

            // Delete all attendance records and update appointment/calendar slot in parallel
            await Promise.all([
              // Delete all attendance records
              ...attendanceRecords.map(record => deleteDoc(doc(db, 'attendance', record.id))),
              // Update appointment
              updateAppointment(appointment.id, {
                volunteerIds: selectedSlot.approvedVolunteers,
                residentIds: selectedSlot.residentIds,
                status: 'canceled',
                updatedAt: Timestamp.fromDate(new Date()),
                notes: selectedSlot.notes || null
              }),
              // Update calendar slot status to canceled
              updateDoc(doc(db, 'calendar_slots', selectedSlot.id), {
                status: 'canceled',
                isOpen: false,
                updatedAt: Timestamp.fromDate(new Date())
              })
            ]);
          } else {
            // For non-canceled statuses, just update the appointment normally
            await updateAppointment(appointment.id, {
              volunteerIds: selectedSlot.approvedVolunteers,
              residentIds: selectedSlot.residentIds,
              updatedAt: Timestamp.fromDate(new Date()),
              notes: selectedSlot.notes || null
            });
          }
        } else {
          // No more participants, delete appointment
          await deleteAppointment(appointment.id);
        }
      } else if (hasParticipants) {
        // No appointment exists, but there are participants: create one
        const newAppointment: Omit<Appointment, 'id'> = {
          calendarSlotId: selectedSlot.id,
          residentIds: selectedSlot.residentIds,
          volunteerIds: selectedSlot.approvedVolunteers,
          status: selectedSlot.status === 'canceled' ? 'canceled' : 'upcoming',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          notes: selectedSlot.notes || null
        };
        await addAppointment(newAppointment);
      }

      toast({
        title: "Session Updated",
        description: "Session details have been updated successfully."
      });

      // Close dialog and reset state
      setIsEditDialogOpen(false);
      setSelectedSlot(null);
      setPendingChanges({});
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle volunteer request actions
  const handleVolunteerRequest = async (
    sessionId: string,
    volunteerId: string,
    action: 'approve' | 'reject'
  ) => {
    // Prevent multiple clicks
    const actionKey = `${sessionId}-${volunteerId}`;
    if (pendingVolunteerAction[actionKey]) return;

    // Check if the session is in the past
    const session = slots.find(s => s.id === sessionId);
    if (session) {
      const sessionDate = toIsraelTime(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      const today = toIsraelTime(new Date());
      today.setHours(0, 0, 0, 0);

      if (sessionDate < today) {
        toast({
          title: "Cannot process request",
          description: "Cannot process requests for past sessions.",
          variant: "destructive"
        });
        return;
      }
    }

    setPendingVolunteerAction(prev => ({ ...prev, [actionKey]: true }));
    setFadingVolunteers(prev => ({ ...prev, [actionKey]: true }));

    try {
      const session = slots.find(s => s.id === sessionId);
      if (!session) return;

      const updatedVolunteerRequests = session.volunteerRequests.filter(v => v.volunteerId !== volunteerId);
      let updatedApprovedVolunteers = [...session.approvedVolunteers];
      let updatedStatus = session.status;

      if (action === 'approve') {
        const newParticipant: ParticipantId = { id: volunteerId, type: 'volunteer' };
        updatedApprovedVolunteers = [...updatedApprovedVolunteers, newParticipant];
        // Update status based on approved volunteers count
        if (updatedApprovedVolunteers.length >= session.maxCapacity) {
          updatedStatus = "full";
        } else {
          updatedStatus = "open";
        }

        // Create or update appointment
        const appointment = appointments.find(a => a.calendarSlotId === sessionId);
        if (!appointment) {
          // Create new appointment
          const newAppointment: Omit<Appointment, 'id'> = {
            calendarSlotId: sessionId,
            residentIds: session.residentIds,
            volunteerIds: [newParticipant],
            status: "upcoming",
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
            notes: session.notes || null
          };
          await addAppointment(newAppointment);
        } else {
          // Update existing appointment
          await updateAppointment(appointment.id, {
            volunteerIds: updatedApprovedVolunteers,
            updatedAt: Timestamp.fromDate(new Date())
          });
        }
      } else if (action === 'reject') {
        // Remove volunteer from approved list if they were approved
        updatedApprovedVolunteers = updatedApprovedVolunteers.filter(p => p.id !== volunteerId);

        // Update appointment if it exists
        const appointment = appointments.find(a => a.calendarSlotId === sessionId);
        if (appointment) {
          if (updatedApprovedVolunteers.length === 0) {
            // Delete appointment if no volunteers left
            await deleteAppointment(appointment.id);
          } else {
            // Update appointment with remaining volunteers
            await updateAppointment(appointment.id, {
              volunteerIds: updatedApprovedVolunteers,
              updatedAt: Timestamp.fromDate(new Date())
            });
          }
        }
      }

      // Update the slot
      const updateData: Partial<CalendarSlotUI> = {
        volunteerRequests: updatedVolunteerRequests,
        approvedVolunteers: updatedApprovedVolunteers,
        status: updatedStatus
      };
      await updateCalendarSlot(sessionId, updateData);

      // Update selected session if it's the one being modified
      if (selectedSlot?.id === sessionId) {
        setSelectedSlot(prev => {
          if (!prev) return null;
          return {
            ...prev,
            volunteerRequests: updatedVolunteerRequests,
            approvedVolunteers: updatedApprovedVolunteers,
            status: updatedStatus
          };
        });
      }

      // Update pending requests view if active
      if (isPendingViewActive) {
        setPendingRequests(prev =>
          prev.filter(session =>
            session.id !== sessionId ||
            session.volunteerRequests.some(v => v.volunteerId !== volunteerId)
          )
        );
      }

      toast({
        title: action === 'approve' ? "Volunteer approved" : "Volunteer rejected",
        description: action === 'approve'
          ? "The volunteer has been added to the session."
          : "The volunteer request has been rejected."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process volunteer request. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Remove the action lock and fading state
      setPendingVolunteerAction(prev => {
        const copy = { ...prev };
        delete copy[actionKey];
        return copy;
      });
      setFadingVolunteers(prev => {
        const copy = { ...prev };
        delete copy[actionKey];
        return copy;
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  const renderCalendarContent = (): JSX.Element => {
    if (isPendingViewActive) {
      return (
        <div className="p-6">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-slate-100 p-3 text-center">
              <h3 className="text-lg font-medium">
                Pending Volunteer Requests
              </h3>
              <p className="text-sm text-slate-600">
                {pendingRequests.length} session{pendingRequests.length !== 1 ? 's' : ''} with pending requests
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-slate-500 mb-4">No pending volunteer requests at this time.</div>
                  <Button
                    variant="outline"
                    onClick={() => setIsPendingViewActive(false)}
                  >
                    Back to Calendar
                  </Button>
                </div>
              ) : (
                pendingRequests
                  .sort((a, b) => {
                    const dateCompare = toIsraelTime(a.date).getTime() - toIsraelTime(b.date).getTime();
                    if (dateCompare !== 0) return dateCompare;
                    return a.startTime.localeCompare(b.startTime);
                  })
                  .map(session => (
                    <div
                      key={session.id}
                      className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSlot(session);
                        setIsPendingRequestsDialogOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-medium">
                            {format(new Date(session.date), 'EEEE, MMMM d, yyyy')}
                          </h4>
                          <div className="mt-1 flex space-x-3">
                            <div className="flex items-center text-slate-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{session.startTime} - {session.endTime}</span>
                            </div>
                            <div className="flex items-center text-slate-600">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{getDisplayMaxCapacity(session)}/{session.maxCapacity} filled</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-800"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedSlot(session);
                            setIsPendingRequestsDialogOpen(true);
                          }}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {session.volunteerRequests.filter(v => v.status === "pending").length} pending request{session.volunteerRequests.filter(v => v.status === "pending").length !== 1 ? 's' : ''}
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Tabs value={calendarView} className="w-full">
          <TabsContent value="month" className="mt-0">
            {/* Month View */}
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center font-medium text-slate-600 py-2 text-sm">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const dateRange = getVisibleDateRange();
                  const year = dateRange.start.getFullYear();
                  const month = dateRange.start.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const firstDayOfMonth = new Date(year, month, 1).getDay();

                  const days = [];

                  // Add empty cells for days before the first day of the month
                  for (let i = 0; i < firstDayOfMonth; i++) {
                    days.push(
                      <div key={`empty-${i}`} className="h-32 p-2 border rounded-lg border-slate-200 bg-slate-100/80" />
                    );
                  }

                  // Add days of the month
                  for (let i = 1; i <= daysInMonth; i++) {
                    const date = new Date(year, month, i);
                    const dateStr = formatIsraelTime(date);
                    const sessionsForDay = filteredSessions.filter(s => s.date === dateStr);
                    const isCurrentDate = isToday(date);
                    const isSelectedDate = formatIsraelTime(date, 'yyyy-MM-dd') === formatIsraelTime(selectedDate, 'yyyy-MM-dd');

                    days.push(
                      <div
                        key={dateStr}
                        className={cn(
                          "h-32 p-2 border rounded-lg transition-colors overflow-hidden cursor-pointer group",
                          "border-slate-300 bg-white text-slate-900",
                          "hover:bg-blue-50 hover:border-blue-200"
                        )}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedDayDate(date);
                          setSelectedDaySessions(sessionsForDay);
                          setIsDaySessionsDialogOpen(true);
                        }}
                      >
                        <div className={cn(
                          "text-lg font-semibold mb-2 flex justify-between items-center transition-colors duration-200",
                          isCurrentDate ? "text-white" : isSelectedDate ? "text-primary" : "text-slate-900"
                        )}>
                          <div className={cn(
                            "w-7 h-7 flex items-center justify-center rounded border transition-all duration-200",
                            isSelectedDate ? "bg-blue-50 border-blue-500 text-blue-900 font-semibold" :
                              "bg-white border-slate-300 text-gray-900 hover:bg-blue-100"
                          )}>
                            <span>{i}</span>
                          </div>
                          {sessionsForDay.length > 0 && (
                            <Badge variant="outline" className="hover:bg-blue-100 hover:border-blue-300 text-xs font-normal px-1.5 py-0.5 bg-blue-50 border-blue-200 text-blue-700">
                              {sessionsForDay.length} session{sessionsForDay.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-2.5rem)] pr-1">
                          {sessionsForDay
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .slice(0, 3)
                            .map(session => (
                              <div
                                key={session.id}
                                className={cn(
                                  "p-1.5 rounded-md text-xs border text-gray-900 transition-colors",
                                  session.status === "full"
                                    ? "bg-amber-100 border-amber-400 hover:bg-amber-200"
                                    : session.status === "canceled"
                                      ? "bg-red-100 border-red-400 hover:bg-red-200"
                                      : session.status === "open"
                                        ? "bg-blue-100 border-blue-400 hover:bg-blue-200"
                                        : "bg-white border-gray-300 hover:bg-gray-100"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSlot(session);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {session.startTime}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{getVolunteerCount(session)}/{session.maxCapacity}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {sessionsForDay.length > 3 && (
                            <div className="text-xs text-center mt-1 text-slate-500">
                              +{sessionsForDay.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return days;
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="week" className="mt-0">
            {/* Week View */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const weekStart = startOfWeek(selectedDate);
                  const days = [];

                  for (let i = 0; i < 7; i++) {
                    const date = addDays(weekStart, i);
                    const dateStr = formatIsraelTime(date);
                    const sessionsForDay = filteredSessions.filter(s => s.date === dateStr);
                    const isCurrentDate = isToday(date);

                    days.push(
                      <div key={dateStr} className="flex flex-col h-full">
                        <div
                          className={cn(
                            "text-center p-2 rounded-t-lg font-medium border border-slate-300 border-b-slate-300",
                            isCurrentDate ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
                          )}
                        >
                          <div>{format(date, 'EEE')}</div>
                          <div className={isCurrentDate ? "text-white" : "text-slate-900"}>
                            {format(date, 'd')}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex-1 border border-slate-300 border-t-0 rounded-b-lg p-2 space-y-2 overflow-y-auto min-h-[392px]",
                          )}
                        >
                          {sessionsForDay
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map(session => (
                              <div
                                key={session.id}
                                className={cn(
                                  "p-2 rounded-md text-sm cursor-pointer transition-colors border text-gray-900",
                                  session.status === "full"
                                    ? "bg-amber-100 border-amber-400 hover:bg-amber-200"
                                    : session.status === "canceled"
                                      ? "bg-red-100 border-red-400 hover:bg-red-200"
                                      : session.status === "open"
                                        ? "bg-blue-100 border-blue-400 hover:bg-blue-200"
                                        : "bg-white border-gray-300 hover:bg-gray-100"
                                )}
                                onClick={() => {
                                  setSelectedSlot(session);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <div className="flex flex-col items-center text-center">
                                  <div className="font-medium mb-1">
                                    {session.startTime} - {session.endTime}
                                  </div>
                                  <div className="flex items-center justify-center text-slate-600 mb-1">
                                    <Users className="h-4 w-4 mr-1" />
                                    <span>{getVolunteerCount(session)}/{session.maxCapacity}</span>
                                  </div>
                                  {session.isCustom && (
                                    <Badge variant="outline" className="bg-blue-50 border-blue-200">
                                      Custom
                                    </Badge>
                                  )}
                                  {session.volunteerRequests.some(v => v.status === "pending") && !isSlotInPast(session) && (
                                    <Badge
                                      variant="outline"
                                      className="h-6 px-2 text-amber-600 bg-amber-50 border-amber-200 mt-1"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setSelectedSlot(session);
                                        setIsPendingRequestsDialogOpen(true);
                                      }}
                                    >
                                      <AlertCircle className="h-3 w-3 mr-1 inline" />
                                      {session.volunteerRequests.filter(v => v.status === "pending").length}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  }

                  return days;
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="day" className="mt-0">
            {/* Day View */}
            <div className="p-6">
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 p-3 text-center border-b border-slate-300">
                  <h3 className="text-lg font-medium">
                    {formatIsraelTime(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                </div>

                <div className="divide-y divide-slate-300">
                  {(() => {
                    const dateStr = formatIsraelTime(selectedDate, 'yyyy-MM-dd');
                    const sessionsForDay = filteredSessions.filter(s => s.date === dateStr);

                    const content: JSX.Element = sessionsForDay.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        No sessions scheduled for this day.
                      </div>
                    ) : (
                      <>
                        {sessionsForDay
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(session => (
                            <div
                              key={session.id}
                              className={cn(
                                "p-4 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors text-center",
                              )}
                              onClick={() => {
                                setSelectedSlot(session);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <div className="flex flex-col items-center space-y-2">
                                <div>
                                  <h4 className="text-lg font-medium">
                                    {session.startTime} - {session.endTime}
                                  </h4>

                                  <div className="mt-1 flex justify-center space-x-3">
                                    <div className="flex items-center text-slate-600">
                                      <Users className="h-4 w-4 mr-1" />
                                      <span>{getVolunteerCount(session)}/{session.maxCapacity}</span>
                                    </div>

                                    {session.isCustom && (
                                      <Badge variant="outline" className="bg-blue-50 border-blue-200">
                                        Custom
                                      </Badge>
                                    )}

                                    <Badge
                                      className={cn(
                                        "border px-2 py-1 text-s transition-colors",
                                        session.status === "full"
                                          ? "bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200"
                                          : session.status === "canceled"
                                            ? "bg-red-100 border-red-400 text-red-800 hover:bg-red-200"
                                            : "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200"
                                      )}
                                    >
                                      {session.status}
                                    </Badge>
                                  </div>
                                </div>

                                {session.notes && (
                                  <p className="text-sm text-slate-600 mt-2 max-w-md text-center">{session.notes}</p>
                                )}

                                {session.volunteerRequests.some(v => v.status === "pending") && !isSlotInPast(session) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-800"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setSelectedSlot(session);
                                      setIsDaySessionsDialogOpen(false);
                                      setIsPendingRequestsDialogOpen(true);
                                    }}
                                  >
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {session.volunteerRequests.filter(v => v.status === "pending").length} pending request{session.volunteerRequests.filter(v => v.status === "pending").length !== 1 ? 's' : ''}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </>
                    );

                    return content;
                  })()}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Show error toasts if any Firestore operations fail
  useEffect(() => {
    const errors = [
      slotsError,
      appointmentsError,
      externalGroupsError,
      addError,
      updateError,
      deleteError,
      addAppointmentError,
      updateAppointmentError,
      deleteAppointmentError,
      addExternalGroupError,
      updateExternalGroupError,
      deleteExternalGroupError
    ].filter(Boolean);

    errors.forEach(error => {
      toast({
        title: "Error",
        description: error?.message || "An error occurred",
        variant: "destructive"
      });
    });
  }, [
    slotsError,
    appointmentsError,
    externalGroupsError,
    addError,
    updateError,
    deleteError,
    addAppointmentError,
    updateAppointmentError,
    deleteAppointmentError,
    addExternalGroupError,
    updateExternalGroupError,
    deleteExternalGroupError
  ]);

  // Add this useEffect after the state declarations
  useEffect(() => {
    if (isEditDialogOpen && selectedSlot) {
      // Volunteers tab switching
      const availableVolunteers = volunteers.filter(v => !selectedSlot.approvedVolunteers.some(av => av.id === v.id));
      const currentVolunteers = selectedSlot.approvedVolunteers.filter(av => volunteers.some(v => v.id === av.id));
      if (editVolunteerTab === 'current' && currentVolunteers.length === 0) {
        setEditVolunteerTab('available');
      } else if (editVolunteerTab === 'available' && availableVolunteers.length === 0) {
        setEditVolunteerTab('current');
      }
      // Residents tab switching
      const availableResidents = residents.filter(r => !selectedSlot.residentIds.includes(r.id));
      const currentResidents = selectedSlot.residentIds.filter(id => residents.some(r => r.id === id));
      if (editResidentTab === 'current' && currentResidents.length === 0) {
        setEditResidentTab('available');
      } else if (editResidentTab === 'available' && availableResidents.length === 0) {
        setEditResidentTab('current');
      }
    }
  }, [isEditDialogOpen, selectedSlot, residents, volunteers, editVolunteerTab, editResidentTab]);

  // Place this after all useState declarations, before the return statement
  useEffect(() => {
    // Volunteers tab switching for Create dialog
    const availableVolunteers = volunteers.filter(v => !selectedVolunteers.includes(v.id));
    const currentVolunteers = selectedVolunteers.filter(id => volunteers.some(v => v.id === id));
    if (
      volunteerTab === 'current' &&
      currentVolunteers.length === 0 &&
      availableVolunteers.length > 0
    ) {
      setVolunteerTab('available');
    } else if (
      volunteerTab === 'available' &&
      availableVolunteers.length === 0 &&
      currentVolunteers.length > 0
    ) {
      setVolunteerTab('current');
    }
    // Residents tab switching for Create dialog
    const availableResidents = residents.filter(r => !newSlot.residentIds.includes(r.id));
    const currentResidents = newSlot.residentIds.filter(id => residents.some(r => r.id === id));
    if (
      residentTab === 'current' &&
      currentResidents.length === 0 &&
      availableResidents.length > 0
    ) {
      setResidentTab('available');
    } else if (
      residentTab === 'available' &&
      availableResidents.length === 0 &&
      currentResidents.length > 0
    ) {
      setResidentTab('current');
    }
  }, [volunteers, selectedVolunteers, volunteerTab, residents, newSlot.residentIds, residentTab]);

  // Modify the status change handler
  const handleStatusChange = (value: "open" | "full" | "canceled") => {
    setSelectedSlot(prev => {
      if (!prev) return null;
      return { ...prev, status: value };
    });
    setPendingChanges(prev => ({ ...prev, status: value }));
  };

  const [isDeleting, setIsDeleting] = useState(false);

  // Add delete handler
  const handleDeleteSession = async () => {
    if (!selectedSlot) return;
    setIsDeleting(true);

    try {
      // Find the appointment and external group
      const appointment = appointments.find(a => a.calendarSlotId === selectedSlot.id);
      const externalGroup = externalGroups.find(g => g.appointmentId === appointment?.id);

      // Delete in parallel: external group first (if exists), then appointment, then calendar slot
      await Promise.all([
        // Delete external group if exists
        externalGroup ? deleteDoc(doc(db, 'external_groups', externalGroup.id)) : Promise.resolve(),
        // Delete appointment if exists
        appointment ? deleteAppointment(appointment.id) : Promise.resolve(),
        // Delete calendar slot
        deleteDoc(doc(db, 'calendar_slots', selectedSlot.id))
      ]);

      toast({
        title: "Session Deleted",
        description: "The session and all associated records have been deleted successfully."
      });

      // Close dialogs and reset state
      setIsDeleteDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
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
              <CalendarIcon className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block">Calendar</h1>
            </div>
          </div>

          {/* Center section - Date selector with conditional width */}
          {!isPendingViewActive && (
            <div className={cn(
              "flex items-center justify-center",
              calendarView === "day" ? "flex-1" : "w-[400px]"
            )}>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  className={cn(
                    "hover:bg-slate-100 w-8 h-8",
                    calendarView === "month" ? "mr-1" : "mr-4"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <h2 className={cn(
                  "text-xl font-semibold text-slate-900 text-center",
                  calendarView === "month" && "px-2 min-w-[166px]",
                  calendarView === "week" && "min-w-[190px]",
                  calendarView === "day" && "min-w-[296px]"
                )}>
                  {getViewTitle()}
                </h2>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  className={cn(
                    "hover:bg-slate-100 w-8 h-8",
                    calendarView === "month" ? "ml-1" : "ml-4"
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="hover:bg-slate-100 ml-3"
                >
                  Today
                </Button>
              </div>
            </div>
          )}

          {/* Right section - Empty div for balance */}
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
          onLogout={handleLogout}
        />

        {/* Calendar */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Calendar Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                {/* View Toggle - Left aligned */}
                {!isPendingViewActive && (
                  <div className="flex justify-start">
                    <Tabs
                      value={calendarView}
                      onValueChange={(value) => {
                        setCalendarView(value as CalendarView);
                        setIsPendingViewActive(false);
                      }}
                      className="w-fit"
                    >
                      <TabsList className="grid w-[400px] grid-cols-3 bg-slate-100 p-1">
                        <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-1">
                          <Grid className="h-4 w-4" />
                          <span className="hidden sm:inline">Month</span>
                        </TabsTrigger>
                        <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-1">
                          <Columns className="h-4 w-4" />
                          <span className="hidden sm:inline">Week</span>
                        </TabsTrigger>
                        <TabsTrigger value="day" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-1">
                          <ListOrdered className="h-4 w-4" />
                          <span className="hidden sm:inline">Day</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                )}

                {/* Empty center div for spacing */}
                <div className="flex-1"></div>

                {/* All action buttons - Right aligned */}
                <div className="flex items-center gap-3 justify-end">
                  {!isPendingViewActive && (
                    <>
                      {/* Status Filter */}
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Status filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sessions</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                          <SelectItem value="canceled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Export */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-colors">
                            <Download className="h-4 w-4 mr-2 text-primary" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExport('pdf')}>
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport('ics')}>
                            Export as ICS
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* New Session Button */}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Session
                      </Button>
                    </>
                  )}

                  {/* Pending Button - Only visible when there are pending requests */}
                  {pendingRequests.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "transition-all duration-200 border",
                        isPendingViewActive
                          ? "hover:bg-slate-100"
                          : "bg-amber-500 hover:bg-amber-500/90 text-white hover:text-white border-amber-500"
                      )}
                      onClick={() => {
                        setIsPendingViewActive(!isPendingViewActive);
                        if (!isPendingViewActive) {
                          setCalendarView("month"); // Reset to month view
                        }
                      }}
                    >
                      <AlertCircle className={cn(
                        "h-4 w-4 mr-2",
                        isPendingViewActive ? "text-slate-600" : "text-white"
                      )} />
                      {isPendingViewActive ? "Back to Calendar" : "Pending"}
                      {!isPendingViewActive && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-white text-amber-700">
                          {pendingRequests.reduce((total, session) =>
                            total + session.volunteerRequests.filter(v => v.status === "pending").length, 0
                          )}
                        </Badge>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Calendar Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-300">
              {renderCalendarContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Create Session Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (open) {
          // Set volunteerTab
          const availableVolunteers = volunteers.filter(v => !selectedVolunteers.includes(v.id));
          const currentVolunteers = selectedVolunteers.filter(id => volunteers.some(v => v.id === id));
          if (currentVolunteers.length === 0 && availableVolunteers.length > 0) {
            setVolunteerTab('available');
          } else if (availableVolunteers.length === 0 && currentVolunteers.length > 0) {
            setVolunteerTab('current');
          } else {
            setVolunteerTab('available');
          }
          // Set residentTab
          const availableResidents = residents.filter(r => !newSlot.residentIds.includes(r.id));
          const currentResidents = newSlot.residentIds.filter(id => residents.some(r => r.id === id));
          if (currentResidents.length === 0 && availableResidents.length > 0) {
            setResidentTab('available');
          } else if (availableResidents.length === 0 && currentResidents.length > 0) {
            setResidentTab('current');
          } else {
            setResidentTab('available');
          }
        } else {
          setVolunteerTab('available');
          setResidentTab('available');
          setNewSlot({
            date: formatIsraelTime(addDays(new Date(), 1), 'yyyy-MM-dd'),
            startTime: "09:00",
            endTime: "12:00",
            period: "morning",
            isCustom: false,
            customLabel: null,
            residentIds: [],
            maxCapacity: 3,
            volunteerRequests: [],
            status: "open",
            isOpen: true,
            notes: "",
            createdAt: Timestamp.fromDate(new Date()),
            externalGroup: undefined
          });
          setSelectedVolunteers([]);
          setVolunteerSearch("");
          setResidentSearch("");
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-slate-900">Create New Session</DialogTitle>
            <DialogDescription className="text-slate-500">
              Schedule a new volunteer session. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
            <form onSubmit={handleCreateSession} className="space-y-6">
              {/* Main Info Card */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-100/70 to-pink-50 rounded-xl border border-indigo-100 shadow-sm p-0">
                <div className="flex items-center justify-between p-4 border-b-2 border-indigo-200/70">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center ring-4 ring-white shadow-sm">
                      <CalendarIcon className="h-5 w-5 text-pink-900" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-lg">Session Details</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                      <div className="mb-2 font-medium text-slate-900 text-sm">Date</div>
                      <Input
                        id="date"
                        type="date"
                        value={newSlot.date}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    {!isSessionInPast(newSlot.date || '', newSlot.startTime || '') && (
                      <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                        <div className="mb-2 font-medium text-slate-900 text-sm">Max Capacity</div>
                        <Input
                          id="maxCapacity"
                          type="number"
                          min="1"
                          value={newSlot.maxCapacity}
                          onChange={(e) => setNewSlot(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                          required
                          disabled={!!newSlot.externalGroup}
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                      <div className="mb-2 font-medium text-slate-900 text-sm">Start Time</div>
                      <Input
                        id="startTime"
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewSlot(prev => ({ ...prev, startTime: value }));
                          if (newSlot.endTime && value >= newSlot.endTime) {
                            setTimeError("End time must be after start time.");
                          } else {
                            setTimeError("");
                          }
                        }}
                        required
                        disabled={!newSlot.isCustom && newSlot.period !== null}
                      />
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                      <div className="mb-2 font-medium text-slate-900 text-sm">End Time</div>
                      <Input
                        id="endTime"
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewSlot(prev => ({ ...prev, endTime: value }));
                          if (newSlot.startTime && newSlot.startTime >= value) {
                            setTimeError("End time must be after start time.");
                          } else {
                            setTimeError("");
                          }
                        }}
                        required
                        disabled={!newSlot.isCustom && newSlot.period !== null}
                      />
                    </div>
                  </div>
                  {timeError && (
                    <div className="text-sm text-red-500 mt-1">{timeError}</div>
                  )}
                  {!newSlot.isCustom && (
                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                      <div className="mb-2 font-medium text-slate-900 text-sm">Period</div>
                      <Select
                        value={newSlot.period || ""}
                        onValueChange={(value) => {
                          const period = value as "morning" | "afternoon" | "evening" | null;
                          setNewSlot(prev => ({
                            ...prev,
                            period,
                            startTime: period === "morning" ? "09:00" :
                              period === "afternoon" ? "13:00" :
                                period === "evening" ? "16:00" : "",
                            endTime: period === "morning" ? "12:00" :
                              period === "afternoon" ? "16:00" :
                                period === "evening" ? "18:00" : ""
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (9:00 - 12:00)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (13:00 - 16:00)</SelectItem>
                          <SelectItem value="evening">Evening (16:00 - 18:00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {newSlot.isCustom && (
                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                      <div className="mb-2 font-medium text-slate-900 text-sm">Custom Label</div>
                      <Input
                        id="customLabel"
                        value={newSlot.customLabel || ""}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, customLabel: e.target.value }))}
                        placeholder="Add a label for this custom session"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Session Type Card */}
              <div className="bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-50 rounded-xl border border-blue-100 shadow-sm p-0">
                <div className="flex items-center justify-between p-4 border-b-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                      <Users className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-lg">Session Type</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="isCustom" className="text-base font-medium">Custom Session</Label>
                      <p className="text-sm text-slate-500">Enable to create a session with custom time and label</p>
                    </div>
                    <Switch
                      id="isCustom"
                      checked={newSlot.isCustom}
                      onCheckedChange={(checked) => {
                        setNewSlot(prev => ({
                          ...prev,
                          isCustom: checked,
                          period: checked ? null : "morning",
                          startTime: checked ? "09:00" : "09:00",
                          endTime: checked ? "12:00" : "12:00"
                        }));
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="isExternalGroup" className="text-base font-medium">One Time External Group</Label>
                      <p className="text-sm text-slate-500">Enable for external group visits</p>
                    </div>
                    <Switch
                      id="isExternalGroup"
                      checked={!!newSlot.externalGroup}
                      onCheckedChange={(checked) => {
                        setNewSlot(prev => ({
                          ...prev,
                          externalGroup: checked ? {
                            groupName: "",
                            contactPerson: "",
                            contactPhoneNumber: "",
                            purposeOfVisit: "",
                            numberOfParticipants: 1,
                            createdAt: Timestamp.fromDate(new Date())
                          } : undefined
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* External Group Details Card */}
              {newSlot.externalGroup && (
                <div className="bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-50 rounded-xl border border-blue-100 shadow-sm p-0">
                  <div className="flex items-center gap-3 p-4 border-b-2 border-blue-200">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                      <Users className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-blue-900 text-lg">{newSlot.externalGroup.groupName || 'External Group Details'}</div>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                      <div className="text-xs text-slate-900 font-medium mb-1">Group Name</div>
                      <Input
                        id="groupName"
                        value={newSlot.externalGroup.groupName || ""}
                        onChange={(e) => setNewSlot(prev => ({
                          ...prev,
                          externalGroup: { ...prev.externalGroup!, groupName: e.target.value }
                        }))}
                        placeholder="Enter group name"
                        required
                      />
                    </div>
                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                      <div className="text-xs text-slate-900 font-medium mb-1">Contact Person</div>
                      <Input
                        id="contactPerson"
                        value={newSlot.externalGroup.contactPerson || ""}
                        onChange={(e) => setNewSlot(prev => ({
                          ...prev,
                          externalGroup: { ...prev.externalGroup!, contactPerson: e.target.value }
                        }))}
                        placeholder="Enter contact person name"
                        required
                      />
                    </div>
                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                      <div className="text-xs text-slate-900 font-medium mb-1">Contact Phone</div>
                      <Input
                        id="contactPhoneNumber"
                        value={newSlot.externalGroup.contactPhoneNumber || ""}
                        onChange={(e) => setNewSlot(prev => ({
                          ...prev,
                          externalGroup: { ...prev.externalGroup!, contactPhoneNumber: e.target.value }
                        }))}
                        placeholder="Enter contact phone number"
                        required
                      />
                    </div>
                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                      <div className="text-xs text-slate-900 font-medium mb-1">Purpose of Visit</div>
                      <Input
                        id="purposeOfVisit"
                        value={newSlot.externalGroup.purposeOfVisit || ""}
                        onChange={(e) => setNewSlot(prev => ({
                          ...prev,
                          externalGroup: { ...prev.externalGroup!, purposeOfVisit: e.target.value }
                        }))}
                        placeholder="Enter the purpose of the visit"
                        required
                      />
                    </div>
                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                      <div className="text-xs text-slate-900 font-medium mb-1">Number of Participants</div>
                      <Input
                        id="numberOfParticipants"
                        type="number"
                        min="1"
                        value={newSlot.externalGroup.numberOfParticipants || ""}
                        onChange={(e) => setNewSlot(prev => ({
                          ...prev,
                          externalGroup: { ...prev.externalGroup!, numberOfParticipants: parseInt(e.target.value) }
                        }))}
                        placeholder="Enter number of participants"
                        required
                      />
                    </div>
                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                      <div className="text-xs text-slate-900 font-medium mb-1">Assigned Department</div>
                      <Input
                        id="assignedDepartment"
                        value={newSlot.externalGroup.assignedDepartment || ""}
                        onChange={(e) => setNewSlot(prev => ({
                          ...prev,
                          externalGroup: { ...prev.externalGroup!, assignedDepartment: e.target.value }
                        }))}
                        placeholder="Enter assigned department"
                      />
                    </div>
                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3 sm:col-span-2">
                      <div className="text-xs text-slate-900 font-medium mb-1">Activity Content</div>
                      <Textarea
                        id="activityContent"
                        value={newSlot.externalGroup.activityContent || ""}
                        onChange={(e) => setNewSlot(prev => ({
                          ...prev,
                          externalGroup: { ...prev.externalGroup!, activityContent: e.target.value }
                        }))}
                        placeholder="Describe the planned activities"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Assign Residents for External Group */}
              {newSlot.externalGroup && (
                <div className="bg-gradient-to-br from-indigo-50 via-purple-100/70 to-pink-50 rounded-xl border border-indigo-100 shadow-sm p-0 mt-6">
                  <div className="flex items-center space-x-3 p-4 border-b-2 border-indigo-200/70">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                      <Users className="h-5 w-5 text-indigo-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-indigo-900 text-lg">Assign Residents</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <Input
                      placeholder="Search residents..."
                      className="bg-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0 mb-4"
                      value={residentSearch}
                      onChange={(e) => setResidentSearch(e.target.value)}
                    />
                    <Tabs value={residentTab} onValueChange={setResidentTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                        <TabsTrigger
                          value="current"
                          className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                          disabled={newSlot.residentIds.length === 0}
                        >
                          Current ({newSlot.residentIds.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="available"
                          className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                          disabled={residents.filter(r => !newSlot.residentIds.includes(r.id)).length === 0}
                        >
                          Available ({residents.filter(r => !newSlot.residentIds.includes(r.id)).length})
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="current" className="mt-4">
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                          {newSlot.residentIds
                            .filter(id => residents.some(r => r.id === id))
                            .filter(id => {
                              const resident = residents.find(r => r.id === id);
                              if (!resident) return false;
                              return resident.fullName.toLowerCase().includes(residentSearch.toLowerCase());
                            })
                            .map(id => {
                              const resident = residents.find(r => r.id === id);
                              return (
                                <div
                                  key={id}
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                  )}
                                >
                                  <div className="flex items-center space-x-3 min-w-0">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                      <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-medium text-slate-900 truncate">{resident?.fullName || id}</div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Check if this is the last resident in the current tab
                                      const remainingResidents = newSlot.residentIds.filter(rid => rid !== id);
                                      const availableResidents = residents.filter(r => !remainingResidents.includes(r.id));

                                      // If this is the last resident and there are available residents, switch tabs first
                                      if (remainingResidents.length === 0 && availableResidents.length > 0) {
                                        setResidentTab('available');
                                      }

                                      // Then update the resident IDs
                                      setNewSlot(prev => ({
                                        ...prev,
                                        residentIds: prev.residentIds.filter(rid => rid !== id)
                                      }));
                                    }}
                                    className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              );
                            })}
                        </div>
                      </TabsContent>
                      <TabsContent value="available" className="mt-4">
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                          {residents
                            .filter(r => !newSlot.residentIds.includes(r.id))
                            .filter(resident =>
                              resident.fullName.toLowerCase().includes(residentSearch.toLowerCase())
                            )
                            .map(resident => (
                              <div
                                key={resident.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                )}
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-slate-900 truncate">{resident.fullName}</div>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setNewSlot(prev => {
                                      const updated = { ...prev, residentIds: [...prev.residentIds, resident.id] };
                                      const filtered = residents
                                        .filter(r => !updated.residentIds.includes(r.id))
                                        .filter(r => r.fullName.toLowerCase().includes(residentSearch.toLowerCase()));
                                      if (filtered.length === 0) setResidentTab('current');
                                      return updated;
                                    });
                                  }}
                                  className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                >
                                  Add
                                </Button>
                              </div>
                            ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}

              {/* Participants Tabs Card */}
              {!newSlot.externalGroup && (
                <div className="bg-gradient-to-br from-indigo-50 via-purple-100/70 to-pink-50 rounded-xl border border-indigo-100 shadow-sm p-0">
                  <div className="flex items-center space-x-3 p-4 border-b-2 border-indigo-200/70">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                      <Users className="h-5 w-5 text-indigo-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-black text-lg">Participants</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <Tabs defaultValue="volunteers" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-200/85">
                        <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
                        <TabsTrigger value="residents">Residents</TabsTrigger>
                      </TabsList>
                      <TabsContent value="volunteers" className="space-y-4">
                        <Input
                          placeholder="Search volunteers..."
                          className="bg-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                          value={volunteerSearch}
                          onChange={(e) => setVolunteerSearch(e.target.value)}
                        />
                        <Tabs value={volunteerTab} onValueChange={setVolunteerTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                            <TabsTrigger
                              value="current"
                              className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                              disabled={selectedVolunteers.length === 0}
                            >
                              Current ({selectedVolunteers.length})
                            </TabsTrigger>
                            <TabsTrigger
                              value="available"
                              className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                              disabled={volunteers.filter(v => !selectedVolunteers.includes(v.id)).length === 0}
                            >
                              Available ({volunteers.filter(v => !selectedVolunteers.includes(v.id)).length})
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="current" className="mt-4">
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                              {selectedVolunteers
                                .filter(id => volunteers.some(v => v.id === id))
                                .filter(id => {
                                  const volunteer = volunteers.find(v => v.id === id);
                                  if (!volunteer) return false;
                                  return volunteer.fullName.toLowerCase().includes(volunteerSearch.toLowerCase());
                                })
                                .map(id => {
                                  const volunteer = volunteers.find(v => v.id === id);
                                  return (
                                    <div
                                      key={id}
                                      className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                      )}
                                    >
                                      <div className="flex items-center space-x-3 min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                          <User className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-medium text-slate-900 truncate">{volunteer?.fullName || id}</div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // Check if this is the last volunteer in the current tab
                                          const remainingVolunteers = selectedVolunteers.filter(vid => vid !== id);
                                          const availableVolunteers = volunteers.filter(v => !remainingVolunteers.includes(v.id));

                                          // If this is the last volunteer and there are available volunteers, switch tabs first
                                          if (remainingVolunteers.length === 0 && availableVolunteers.length > 0) {
                                            setVolunteerTab('available');
                                          }

                                          // Then update the selected volunteers
                                          setSelectedVolunteers(prev => prev.filter(vid => vid !== id));
                                        }}
                                        className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  );
                                })}
                            </div>
                          </TabsContent>
                          <TabsContent value="available" className="mt-4">
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                              {volunteers
                                .filter(v => !selectedVolunteers.includes(v.id))
                                .filter(volunteer =>
                                  volunteer.fullName.toLowerCase().includes(volunteerSearch.toLowerCase())
                                )
                                .map(volunteer => {
                                  const isPast = isSessionInPast(newSlot.date || '', newSlot.startTime || '');
                                  const isAtCapacity = !isPast && !newSlot.externalGroup && selectedVolunteers.length >= (newSlot.maxCapacity || 0);
                                  return (
                                    <div
                                      key={volunteer.id}
                                      className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                      )}
                                    >
                                      <div className="flex items-center space-x-3 min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                          <User className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-medium text-slate-900 truncate">{volunteer.fullName}</div>
                                        </div>
                                      </div>
                                      <TooltipProvider>
                                        <Tooltip disableHoverableContent={!isAtCapacity}>
                                          <TooltipTrigger asChild>
                                            <span>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedVolunteers(prev => {
                                                    const updated = [...prev, volunteer.id];
                                                    const filtered = volunteers
                                                      .filter(v => !updated.includes(v.id))
                                                      .filter(v => v.fullName.toLowerCase().includes(volunteerSearch.toLowerCase()));
                                                    if (filtered.length === 0) setVolunteerTab('current');
                                                    return updated;
                                                  });
                                                }}
                                                className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                                disabled={isAtCapacity}
                                              >
                                                Add
                                              </Button>
                                            </span>
                                          </TooltipTrigger>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  );
                                })}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </TabsContent>
                      <TabsContent value="residents" className="space-y-4">
                        <Input
                          placeholder="Search residents..."
                          className="bg-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                          value={residentSearch}
                          onChange={(e) => setResidentSearch(e.target.value)}
                        />
                        <Tabs value={residentTab} onValueChange={setResidentTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                            <TabsTrigger
                              value="current"
                              className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                              disabled={newSlot.residentIds.length === 0}
                            >
                              Current ({newSlot.residentIds.length})
                            </TabsTrigger>
                            <TabsTrigger
                              value="available"
                              className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                              disabled={residents.filter(r => !newSlot.residentIds.includes(r.id)).length === 0}
                            >
                              Available ({residents.filter(r => !newSlot.residentIds.includes(r.id)).length})
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="current" className="mt-4">
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                              {newSlot.residentIds
                                .filter(id => residents.some(r => r.id === id))
                                .filter(id => {
                                  const resident = residents.find(r => r.id === id);
                                  if (!resident) return false;
                                  return resident.fullName.toLowerCase().includes(residentSearch.toLowerCase());
                                })
                                .map(id => {
                                  const resident = residents.find(r => r.id === id);
                                  return (
                                    <div
                                      key={id}
                                      className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                      )}
                                    >
                                      <div className="flex items-center space-x-3 min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                          <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-medium text-slate-900 truncate">{resident?.fullName || id}</div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // Check if this is the last resident in the current tab
                                          const remainingResidents = newSlot.residentIds.filter(rid => rid !== id);
                                          const availableResidents = residents.filter(r => !remainingResidents.includes(r.id));

                                          // If this is the last resident and there are available residents, switch tabs first
                                          if (remainingResidents.length === 0 && availableResidents.length > 0) {
                                            setResidentTab('available');
                                          }

                                          // Then update the resident IDs
                                          setNewSlot(prev => ({
                                            ...prev,
                                            residentIds: prev.residentIds.filter(rid => rid !== id)
                                          }));
                                        }}
                                        className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  );
                                })}
                            </div>
                          </TabsContent>
                          <TabsContent value="available" className="mt-4">
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                              {residents
                                .filter(r => !newSlot.residentIds.includes(r.id))
                                .filter(resident =>
                                  resident.fullName.toLowerCase().includes(residentSearch.toLowerCase())
                                )
                                .map(resident => (
                                  <div
                                    key={resident.id}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                    )}
                                  >
                                    <div className="flex items-center space-x-3 min-w-0">
                                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <User className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-medium text-slate-900 truncate">{resident.fullName}</div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setNewSlot(prev => {
                                          const updated = { ...prev, residentIds: [...prev.residentIds, resident.id] };
                                          const filtered = residents
                                            .filter(r => !updated.residentIds.includes(r.id))
                                            .filter(r => r.fullName.toLowerCase().includes(residentSearch.toLowerCase()));
                                          if (filtered.length === 0) setResidentTab('current');
                                          return updated;
                                        });
                                      }}
                                      className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                    >
                                      Add
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}

              {/* Notes Card - now plain */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-900">Notes</Label>
                <Textarea
                  id="notes"
                  value={newSlot.notes}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional information about the session..."
                />
              </div>
            </form>
          </div>

          <DialogFooter className="border-t border-slate-200 pt-5 flex justify-center items-center">
            <Button
              type="submit"
              onClick={handleCreateSession}
              className="mx-auto"
              disabled={isCreatingSession}
            >
              {isCreatingSession ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                  Creating...
                </>
              ) : (
                'Create Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (open && selectedSlot) {
          // Set editVolunteerTab
          const availableVolunteers = volunteers.filter(v => !selectedSlot.approvedVolunteers.some(av => av.id === v.id));
          const currentVolunteers = selectedSlot.approvedVolunteers.filter(av => volunteers.some(v => v.id === av.id));
          if (editVolunteerTab === 'current' && currentVolunteers.length === 0) {
            setEditVolunteerTab('available');
          } else if (editVolunteerTab === 'available' && availableVolunteers.length === 0) {
            setEditVolunteerTab('current');
          }
          // Set editResidentTab
          const availableResidents = residents.filter(r => !selectedSlot.residentIds.includes(r.id));
          const currentResidents = selectedSlot.residentIds.filter(id => residents.some(r => r.id === id));
          if (editResidentTab === 'current' && currentResidents.length === 0) {
            setEditResidentTab('available');
          } else if (editResidentTab === 'available' && availableResidents.length === 0) {
            setEditResidentTab('current');
          }
        } else {
          setEditVolunteerTab('available');
          setEditResidentTab('available');
          setEditVolunteerSearch("");
          setEditResidentSearch("");
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-slate-900">Edit Session</DialogTitle>
            <DialogDescription className="text-slate-500">
              Update the session details below.
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
              <form onSubmit={e => { e.preventDefault(); handleEditSession(); }} className="space-y-6">
                {/* Main Info Card */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-100/70 to-pink-50 rounded-xl border border-indigo-100 shadow-sm p-0">
                  <div className="flex items-center justify-between p-4 border-b-2 border-indigo-200/70">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center ring-4 ring-white shadow-sm">
                        <CalendarIcon className="h-5 w-5 text-pink-900" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-lg">Session Details</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                        <div className="mb-2 font-medium text-slate-900 text-sm">Date</div>
                        <Input
                          id="edit-date"
                          type="date"
                          value={selectedSlot.date}
                          onChange={(e) => setSelectedSlot({ ...selectedSlot, date: e.target.value })}
                          required
                        />
                      </div>
                      {!isSessionInPast(selectedSlot.date, selectedSlot.startTime) && (
                        <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                          <div className="mb-2 font-medium text-slate-900 text-sm">Max Capacity</div>
                          <Input
                            id="edit-maxCapacity"
                            type="number"
                            min="1"
                            value={selectedSlot.maxCapacity}
                            onChange={(e) => setSelectedSlot({ ...selectedSlot, maxCapacity: parseInt(e.target.value) })}
                            required
                            disabled={selectedSlot.approvedVolunteers.some(v => v.type === 'external_group')}
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                        <div className="mb-2 font-medium text-slate-900 text-sm">Start Time</div>
                        <Input
                          id="edit-startTime"
                          type="time"
                          value={selectedSlot.startTime}
                          onChange={(e) => setSelectedSlot({ ...selectedSlot, startTime: e.target.value })}
                          required
                          disabled={!selectedSlot.isCustom && selectedSlot.period !== null}
                        />
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                        <div className="mb-2 font-medium text-slate-900 text-sm">End Time</div>
                        <Input
                          id="edit-endTime"
                          type="time"
                          value={selectedSlot.endTime}
                          onChange={(e) => setSelectedSlot({ ...selectedSlot, endTime: e.target.value })}
                          required
                          disabled={!selectedSlot.isCustom && selectedSlot.period !== null}
                        />
                      </div>
                    </div>
                    {!selectedSlot.isCustom && (
                      <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                        <div className="mb-2 font-medium text-slate-900 text-sm">Period</div>
                        <Select
                          value={selectedSlot.period || ""}
                          onValueChange={(value) => {
                            const period = value as "morning" | "afternoon" | "evening" | null;
                            setSelectedSlot({
                              ...selectedSlot,
                              period,
                              startTime: period === "morning" ? "09:00" :
                                period === "afternoon" ? "13:00" :
                                  period === "evening" ? "16:00" : "",
                              endTime: period === "morning" ? "12:00" :
                                period === "afternoon" ? "16:00" :
                                  period === "evening" ? "18:00" : ""
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">Morning (9:00 - 12:00)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (13:00 - 16:00)</SelectItem>
                            <SelectItem value="evening">Evening (16:00 - 18:00)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedSlot.isCustom && (
                      <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                        <div className="mb-2 font-medium text-slate-900 text-sm">Custom Label</div>
                        <Input
                          id="edit-customLabel"
                          value={selectedSlot.customLabel || ""}
                          onChange={(e) => setSelectedSlot({ ...selectedSlot, customLabel: e.target.value })}
                          placeholder="Add a label for this custom session"
                        />
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                      <div className="mb-2 font-medium text-slate-900 text-sm">Status</div>
                      <Select
                        value={selectedSlot.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="bg-white focus:ring-0 focus:ring-offset-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="open"
                            disabled={isSlotInPast(selectedSlot) || selectedSlot.approvedVolunteers.some(v => v.type === 'external_group')}
                          >
                            Open
                          </SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Session Type Card */}
                <div className="bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-50 rounded-xl border border-blue-100 shadow-sm p-0">
                  <div className="flex items-center justify-between p-4 border-b-2 border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                        <Users className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-lg">Session Type</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="edit-isCustom" className="text-base font-medium">Custom Session</Label>
                        <p className="text-sm text-slate-500">Enable to create a session with custom time and label</p>
                      </div>
                      <Switch
                        id="edit-isCustom"
                        checked={selectedSlot.isCustom}
                        onCheckedChange={(checked) => {
                          setSelectedSlot({
                            ...selectedSlot,
                            isCustom: checked,
                            period: checked ? null : "morning",
                            startTime: checked ? "09:00" : "09:00",
                            endTime: checked ? "12:00" : "12:00"
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* External Group Details Card */}
                {selectedSlot.approvedVolunteers.some(v => v.type === 'external_group') && (
                  <div className="bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-50 rounded-xl border border-blue-100 shadow-sm p-0">
                    <div className="flex items-center gap-3 p-4 border-b-2 border-blue-200">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                        <Users className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="font-semibold text-blue-900 text-lg">External Group Details</div>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(() => {
                        const externalGroup = externalGroups.find(g => g.id === selectedSlot.approvedVolunteers[0]?.id);
                        if (!externalGroup) return null;
                        return (
                          <>
                            <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                              <div className="text-xs text-slate-900 font-medium mb-1">Group Name</div>
                              <div className="text-sm text-slate-600">{externalGroup.groupName}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                              <div className="text-xs text-slate-900 font-medium mb-1">Contact Person</div>
                              <div className="text-sm text-slate-600">{externalGroup.contactPerson}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                              <div className="text-xs text-slate-900 font-medium mb-1">Contact Phone</div>
                              <div className="text-sm text-slate-600">{externalGroup.contactPhoneNumber}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                              <div className="text-xs text-slate-900 font-medium mb-1">Purpose of Visit</div>
                              <div className="text-sm text-slate-600">{externalGroup.purposeOfVisit}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                              <div className="text-xs text-slate-900 font-medium mb-1">Number of Participants</div>
                              <div className="text-sm text-slate-600">{externalGroup.numberOfParticipants}</div>
                            </div>
                            {externalGroup.assignedDepartment && (
                              <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3">
                                <div className="text-xs text-slate-900 font-medium mb-1">Assigned Department</div>
                                <div className="text-sm text-slate-600">{externalGroup.assignedDepartment}</div>
                              </div>
                            )}
                            {externalGroup.activityContent && (
                              <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-3 sm:col-span-2">
                                <div className="text-xs text-slate-900 font-medium mb-1">Activity Content</div>
                                <div className="text-sm text-slate-600">{externalGroup.activityContent}</div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Participants Card */}
                {selectedSlot.approvedVolunteers.some(v => v.type === 'external_group') ? (
                  <div className="bg-gradient-to-br from-indigo-50 via-purple-100/70 to-pink-50 rounded-xl border border-indigo-100 shadow-sm p-0 mt-6">
                    <div className="flex items-center space-x-3 p-4 border-b-2 border-indigo-200/70">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                        <Users className="h-5 w-5 text-indigo-700" />
                      </div>
                      <div>
                        <div className="font-semibold text-indigo-900 text-lg">Assign Residents</div>
                      </div>
                    </div>
                    <div className="p-4">
                      <Input
                        placeholder="Search residents..."
                        className="bg-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0 mb-4"
                        value={editResidentSearch}
                        onChange={(e) => setEditResidentSearch(e.target.value)}
                      />
                      <Tabs value={editResidentTab} onValueChange={setEditResidentTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                          <TabsTrigger
                            value="current"
                            className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                            disabled={selectedSlot.residentIds.length === 0}
                          >
                            Current ({selectedSlot.residentIds.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="available"
                            className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                            disabled={residents.filter(r => !selectedSlot.residentIds.includes(r.id)).length === 0}
                          >
                            Available ({residents.filter(r => !selectedSlot.residentIds.includes(r.id)).length})
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="current" className="mt-4">
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {selectedSlot.residentIds
                              .filter(id => residents.some(r => r.id === id))
                              .filter(id => {
                                const resident = residents.find(r => r.id === id);
                                if (!resident) return false;
                                return resident.fullName.toLowerCase().includes(editResidentSearch.toLowerCase());
                              })
                              .map(id => {
                                const resident = residents.find(r => r.id === id);
                                return (
                                  <div
                                    key={id}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                    )}
                                  >
                                    <div className="flex items-center space-x-3 min-w-0">
                                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <User className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-medium text-slate-900 truncate">{resident?.fullName || id}</div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Check if this is the last resident in the current tab
                                        const remainingResidents = selectedSlot.residentIds.filter(rid => rid !== id);
                                        setSelectedSlot(prev => {
                                          const updated = { ...prev, residentIds: prev.residentIds.filter(rid => rid !== id) };
                                          // After removal, check if there are any residents left in the current tab
                                          const filtered = updated.residentIds.filter(rid => {
                                            const r = residents.find(res => res.id === rid);
                                            return r && r.fullName.toLowerCase().includes(editResidentSearch.toLowerCase());
                                          });
                                          if (filtered.length === 0) setEditResidentTab('available');
                                          return updated;
                                        });
                                      }}
                                      className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                );
                              })}
                          </div>
                        </TabsContent>
                        <TabsContent value="available" className="mt-4">
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {residents
                              .filter(r => !selectedSlot.residentIds.includes(r.id))
                              .filter(resident =>
                                resident.fullName.toLowerCase().includes(editResidentSearch.toLowerCase())
                              )
                              .map(resident => (
                                <div
                                  key={resident.id}
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                  )}
                                >
                                  <div className="flex items-center space-x-3 min-w-0">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                      <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-medium text-slate-900 truncate">{resident.fullName}</div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSlot(prev => {
                                        const updated = { ...prev, residentIds: [...prev.residentIds, resident.id] };
                                        // After addition, check if there are any available residents left in the available tab
                                        const filtered = residents
                                          .filter(r => !updated.residentIds.includes(r.id))
                                          .filter(r => r.fullName.toLowerCase().includes(editResidentSearch.toLowerCase()));
                                        if (filtered.length === 0) setEditResidentTab('current');
                                        return updated;
                                      });
                                    }}
                                    className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                  >
                                    Add
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-indigo-50 via-purple-100/70 to-pink-50 rounded-xl border border-indigo-100 shadow-sm p-0">
                    <div className="flex items-center space-x-3 p-4 border-b-2 border-indigo-200/70">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                        <Users className="h-5 w-5 text-indigo-700" />
                      </div>
                      <div>
                        <div className="font-semibold text-black text-lg">Participants</div>
                      </div>
                    </div>
                    <div className="p-4">
                      <Tabs defaultValue="volunteers" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-200/85">
                          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
                          <TabsTrigger value="residents">Residents</TabsTrigger>
                        </TabsList>
                        <TabsContent value="volunteers" className="space-y-4">
                          <Input
                            placeholder="Search volunteers..."
                            className="bg-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                            value={editVolunteerSearch}
                            onChange={(e) => setEditVolunteerSearch(e.target.value)}
                          />
                          <Tabs value={editVolunteerTab} onValueChange={setEditVolunteerTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                              <TabsTrigger
                                value="current"
                                className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                                disabled={selectedSlot.approvedVolunteers.length === 0}
                              >
                                Current ({selectedSlot.approvedVolunteers.length})
                              </TabsTrigger>
                              <TabsTrigger
                                value="available"
                                className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                                disabled={volunteers.filter(v => !selectedSlot.approvedVolunteers.some(av => av.id === v.id)).length === 0}
                              >
                                Available ({volunteers.filter(v => !selectedSlot.approvedVolunteers.some(av => av.id === v.id)).length})
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="current" className="mt-4">
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {selectedSlot.approvedVolunteers
                                  .filter(v => volunteers.some(vol => vol.id === v.id))
                                  .filter(v => {
                                    const volunteer = volunteers.find(vol => vol.id === v.id);
                                    if (!volunteer) return false;
                                    return volunteer.fullName.toLowerCase().includes(editVolunteerSearch.toLowerCase());
                                  })
                                  .map(v => {
                                    const volunteer = volunteers.find(vol => vol.id === v.id);
                                    return (
                                      <div
                                        key={v.id}
                                        className={cn(
                                          "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                        )}
                                      >
                                        <div className="flex items-center space-x-3 min-w-0">
                                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <User className="h-4 w-4 text-green-600" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-medium text-slate-900 truncate">{volunteer?.fullName || v.id}</div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            // Check if this is the last volunteer in the current tab
                                            const remainingVolunteers = selectedSlot.approvedVolunteers.filter(av => av.id !== v.id);
                                            const availableVolunteers = volunteers.filter(vol => !selectedSlot.approvedVolunteers.some(av => av.id === vol.id));

                                            // If this is the last volunteer and there are available volunteers, switch tabs first
                                            if (remainingVolunteers.length === 0 && availableVolunteers.length > 0) {
                                              setEditVolunteerTab('available');
                                            }

                                            // Then update the approved volunteers
                                            setSelectedSlot(prev => ({
                                              ...prev,
                                              approvedVolunteers: prev.approvedVolunteers.filter(av => av.id !== v.id)
                                            }));
                                          }}
                                          className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    );
                                  })}
                              </div>
                            </TabsContent>
                            <TabsContent value="available" className="mt-4">
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {volunteers
                                  .filter(v => !selectedSlot.approvedVolunteers.some(av => av.id === v.id))
                                  .filter(volunteer =>
                                    volunteer.fullName.toLowerCase().includes(editVolunteerSearch.toLowerCase())
                                  )
                                  .map(volunteer => {
                                    const isPast = isSessionInPast(selectedSlot.date, selectedSlot.startTime);
                                    const isAtCapacity = !isPast && selectedSlot.approvedVolunteers.filter(v => v.type === 'volunteer').length >= (selectedSlot.maxCapacity || 0);
                                    return (
                                      <div
                                        key={volunteer.id}
                                        className={cn(
                                          "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                        )}
                                      >
                                        <div className="flex items-center space-x-3 min-w-0">
                                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <User className="h-4 w-4 text-green-600" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-medium text-slate-900 truncate">{volunteer.fullName}</div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            // Check if this is the last available volunteer
                                            const remainingAvailableVolunteers = volunteers
                                              .filter(v => !selectedSlot.approvedVolunteers.some(av => av.id === v.id))
                                              .filter(v => v.id !== volunteer.id);

                                            // If this is the last available volunteer, switch tabs first
                                            if (remainingAvailableVolunteers.length === 0) {
                                              setEditVolunteerTab('current');
                                            }

                                            // Then update the approved volunteers
                                            setSelectedSlot(prev => ({
                                              ...prev,
                                              approvedVolunteers: [
                                                ...prev.approvedVolunteers,
                                                { id: volunteer.id, type: 'volunteer' }
                                              ]
                                            }));
                                          }}
                                          className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                          disabled={isAtCapacity}
                                        >
                                          Add
                                        </Button>
                                      </div>
                                    );
                                  })}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </TabsContent>
                        <TabsContent value="residents" className="space-y-4">
                          <Input
                            placeholder="Search residents..."
                            className="bg-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                            value={editResidentSearch}
                            onChange={(e) => setEditResidentSearch(e.target.value)}
                          />
                          <Tabs value={editResidentTab} onValueChange={setEditResidentTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                              <TabsTrigger
                                value="current"
                                className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                                disabled={selectedSlot.residentIds.length === 0}
                              >
                                Current ({selectedSlot.residentIds.length})
                              </TabsTrigger>
                              <TabsTrigger
                                value="available"
                                className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                                disabled={residents.filter(r => !selectedSlot.residentIds.includes(r.id)).length === 0}
                              >
                                Available ({residents.filter(r => !selectedSlot.residentIds.includes(r.id)).length})
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="current" className="mt-4">
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {selectedSlot.residentIds
                                  .filter(id => residents.some(r => r.id === id))
                                  .filter(id => {
                                    const resident = residents.find(r => r.id === id);
                                    if (!resident) return false;
                                    return resident.fullName.toLowerCase().includes(editResidentSearch.toLowerCase());
                                  })
                                  .map(id => {
                                    const resident = residents.find(r => r.id === id);
                                    return (
                                      <div
                                        key={id}
                                        className={cn(
                                          "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                        )}
                                      >
                                        <div className="flex items-center space-x-3 min-w-0">
                                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <User className="h-4 w-4 text-blue-600" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-medium text-slate-900 truncate">{resident?.fullName || id}</div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            // Check if this is the last resident in the current tab
                                            const remainingResidents = selectedSlot.residentIds.filter(rid => rid !== id);
                                            const availableResidents = residents.filter(r => !remainingResidents.includes(r.id));

                                            // If this is the last resident and there are available residents, switch tabs first
                                            if (remainingResidents.length === 0 && availableResidents.length > 0) {
                                              setEditResidentTab('available');
                                            }

                                            // Then update the resident IDs
                                            setSelectedSlot(prev => ({
                                              ...prev,
                                              residentIds: prev.residentIds.filter(rid => rid !== id)
                                            }));
                                          }}
                                          className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    );
                                  })}
                              </div>
                            </TabsContent>
                            <TabsContent value="available" className="mt-4">
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {residents
                                  .filter(r => !selectedSlot.residentIds.includes(r.id))
                                  .filter(resident =>
                                    resident.fullName.toLowerCase().includes(editResidentSearch.toLowerCase())
                                  )
                                  .map(resident => (
                                    <div
                                      key={resident.id}
                                      className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                                      )}
                                    >
                                      <div className="flex items-center space-x-3 min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                          <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-medium text-slate-900 truncate">{resident.fullName}</div>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // Check if this is the last available resident
                                          const remainingAvailableResidents = residents
                                            .filter(r => !selectedSlot.residentIds.includes(r.id))
                                            .filter(r => r.id !== resident.id);

                                          // If this is the last available resident, switch tabs first
                                          if (remainingAvailableResidents.length === 0) {
                                            setEditResidentTab('current');
                                          }

                                          // Then update the resident IDs
                                          setSelectedSlot(prev => ({
                                            ...prev,
                                            residentIds: [...prev.residentIds, resident.id]
                                          }));
                                        }}
                                        className="flex-shrink-0 ml-2 bg-white hover:bg-slate-50"
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                )}

                {/* Notes Card */}
                <div className="space-y-2">
                  <Label htmlFor="edit-notes" className="text-slate-900">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={selectedSlot.notes}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, notes: e.target.value })}
                    placeholder="Add any additional information about the session..."
                  />
                </div>

                {selectedSlot.status === 'canceled' && !pendingChanges.status && (
                  <div className="pt-4 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      Delete Session
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          <DialogFooter className="border-t border-slate-200 pt-5 flex justify-center items-center">
            <Button
              type="submit"
              onClick={handleEditSession}
              className="mx-auto"
              disabled={updateLoading}
            >
              {updateLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Requests Dialog */}
      <Dialog
        open={isPendingRequestsDialogOpen && selectedSlot?.volunteerRequests.some(v => v.status === "pending") && !isSlotInPast(selectedSlot)}
        onOpenChange={setIsPendingRequestsDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle>Pending Volunteer Requests</DialogTitle>
            <DialogDescription>
              Review and manage volunteer requests for this session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 px-4 pr-5 pt-4 pb-4">
            {selectedSlot && !isSlotInPast(selectedSlot) && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="font-medium mb-2">Session Details</div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>Date: {format(new Date(selectedSlot.date), 'MMMM d, yyyy')}</div>
                    <div>Time: {selectedSlot.startTime} - {selectedSlot.endTime}</div>
                    <div>Current Volunteers: {getDisplayMaxCapacity(selectedSlot)}/{selectedSlot.maxCapacity}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedSlot.volunteerRequests
                    .filter(volunteer => volunteer.status === "pending")
                    .sort((a, b) => a.volunteerId.localeCompare(b.volunteerId))
                    .map(volunteer => (
                      <div
                        key={volunteer.volunteerId}
                        className="flex items-center justify-between p-3 border rounded-lg border-slate-200 bg-white hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-medium">{volunteer.volunteerId}</div>
                          <div className="text-sm text-slate-500">{volunteer.volunteerId}</div>
                        </div>

                        <div className="flex gap-2">
                          {pendingVolunteerAction[`${selectedSlot.id}-${volunteer.volunteerId}`] ? (
                            <div className="flex items-center justify-center w-20">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleVolunteerRequest(selectedSlot.id, volunteer.volunteerId, 'reject')}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleVolunteerRequest(selectedSlot.id, volunteer.volunteerId, 'approve')}
                              >
                                Approve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-200 pt-5 flex justify-center items-center">
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Sessions Dialog */}
      <Dialog open={isDaySessionsDialogOpen} onOpenChange={setIsDaySessionsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle>
              Sessions for {selectedDayDate && formatIsraelTime(selectedDayDate, 'MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              {selectedDaySessions.length} session{selectedDaySessions.length !== 1 ? 's' : ''} scheduled
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 px-4 pr-5 pt-4 pb-4">
            {selectedDaySessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-500 mb-4">No sessions scheduled for this day</div>
                <Button
                  variant="default"
                  onClick={() => {
                    setIsDaySessionsDialogOpen(false);
                    setNewSlot({
                      ...newSlot,
                      date: selectedDayDate ? format(selectedDayDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
                    });
                    setIsCreateDialogOpen(true);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Create New Session
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDaySessions
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(session => (
                    <div
                      key={session.id}
                      className={cn(
                        "p-4 border rounded-lg bg-white hover:bg-blue-50 hover:border-blue-200 cursor-pointer",
                        "border-slate-200",
                        selectedSlot?.id === session.id ? "focus-visible:ring-2 ring-primary rounded-md focus:outline-none transition" : ""
                      )}
                      onClick={() => {
                        setSelectedSlot(session);
                        setIsDaySessionsDialogOpen(false);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col justify-center">
                          <div className="font-medium">
                            {session.startTime} - {session.endTime}
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            {getVolunteerCount(session)}/{session.maxCapacity} volunteers
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge
                            className={cn(
                              "border px-2 py-1 text-s transition-colors",
                              session.status === "full"
                                ? "bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200"
                                : session.status === "canceled"
                                  ? "bg-red-100 border-red-400 text-red-800 hover:bg-red-200"
                                  : "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200"
                            )}
                          >
                            {session.status}
                          </Badge>
                        </div>
                      </div>

                      {session.notes && (
                        <div className="text-sm text-slate-600 mt-2">
                          {session.notes}
                        </div>
                      )}

                      {session.volunteerRequests.some(v => v.status === "pending") && !isSlotInPast(session) && (
                        <div className="flex flex-col gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-800"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedSlot(session);
                              setIsDaySessionsDialogOpen(false);
                              setIsPendingRequestsDialogOpen(true);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {session.volunteerRequests.filter(v => v.status === "pending").length} pending request{session.volunteerRequests.filter(v => v.status === "pending").length !== 1 ? 's' : ''}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-200 pt-4 flex justify-center items-center">
            {selectedDaySessions.length > 0 && (
              <Button
                variant="default"
                onClick={() => {
                  setIsDaySessionsDialogOpen(false);
                  setNewSlot({
                    ...newSlot,
                    date: selectedDayDate ? format(selectedDayDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
                  });
                  setIsCreateDialogOpen(true);
                }}
                className="mx-auto bg-primary hover:bg-primary/90"
              >
                Create Another Session
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* More Filters Dialog */}
      <Dialog open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>More Filters</DialogTitle>
            <DialogDescription>
              Apply additional filters to refine your session list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newStartDate = new Date(e.target.value);
                    setDateRange(prev => ({ ...prev, start: newStartDate }));
                  }}
                  className="h-9 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span>to</span>
                <Input
                  type="date"
                  value={dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newEndDate = new Date(e.target.value);
                    setDateRange(prev => ({ ...prev, end: newEndDate }));
                  }}
                  className="h-9 bg-white border-slate-200 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {dateRange.start > dateRange.end && (
                <p className="text-sm text-red-500">Start date cannot be after end date</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                // Reset date range to current month
                setDateRange({
                  start: new Date(new Date().setDate(1)),
                  end: new Date(new Date().setMonth(new Date().getMonth() + 1, 0))
                });
              }}
              disabled={
                dateRange.start.getTime() === new Date(new Date().setDate(1)).getTime() &&
                dateRange.end.getTime() === new Date(new Date().setMonth(new Date().getMonth() + 1, 0)).getTime()
              }
            >
              Reset Filters
            </Button>
            <Button onClick={() => setIsMoreFiltersOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Canceled Session</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-2">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <span className="text-red-600 font-semibold text-base mb-2">
                Are you sure you want to continue?
              </span>
              <span className="text-slate-600 text-sm">
                This will permanently remove the session record along with its associated appointment{selectedSlot?.approvedVolunteers.some(v => v.type === 'external_group') && ' and external group record'}.
              </span>
            </div>
          </div>
          <DialogFooter>
            <div className="w-full flex justify-center">
              <Button
                variant="destructive"
                onClick={handleDeleteSession}
                disabled={isDeleting}
                className="w-[200px] transition-all duration-200 mx-auto"
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  'Delete Session'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerCalendar; 