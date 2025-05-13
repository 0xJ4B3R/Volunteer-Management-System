import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Plus,
  Clock,
  Users,
  Columns,
  FileDown,
  AlertCircle,
  ChevronLeft,
  ListOrdered,
  ChevronRight,
  MoreVertical,
  AlertTriangle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { format, addDays, startOfWeek, endOfWeek, startOfDay, endOfDay, isToday, isPast } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import { useResidents } from "@/hooks/useFirestoreResidents";

interface Volunteer {
  id: string;
  userId: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  gender: "male" | "female";
  phoneNumber: string;
  languages: string[];
  skills?: string[];
  hobbies?: string[];
  groupAffiliation?: string | null;
  reasonForVolunteering?: "scholarship" | "communityService" | "personalInterest" | "other" | null;
  matchingPreference?: "oneOnOne" | "groupActivity" | "noPreference" | null;
  isActive: boolean;
  createdAt: string; // ISO timestamp
  notes?: string | null;
}

interface VolunteerRequest {
  volunteerId: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string; // ISO timestamp
  approvedAt?: string; // ISO timestamp
  rejectedAt?: string; // ISO timestamp
  rejectedReason?: string | null;
  matchScore?: number;
  assignedBy: "ai" | "manager";
}

interface CalendarSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  period: "morning" | "afternoon" | "evening" | null;
  isCustom: boolean;
  customLabel: string | null;
  residentIds: string[];
  maxCapacity: number;
  volunteerRequests: VolunteerRequest[];
  approvedVolunteers: string[]; // Track approved volunteers separately
  status: "open" | "full" | "canceled";
  appointmentId: string | null;
  isOpen: boolean;
  createdAt: string; // ISO timestamp
  notes: string | null;
}

interface Appointment {
  id: string;
  calendarSlotId: string;
  residentIds: string[];
  volunteerIds: string[];
  status: "upcoming" | "inProgress" | "completed" | "canceled";
  updatedAt: string; // ISO timestamp
  createdAt: string; // ISO timestamp
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
  createdAt: string; // ISO timestamp
  notes?: string | null;
}

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

const isSlotInPast = (slot: CalendarSlot): boolean => {
  const now = toIsraelTime(new Date());
  const slotDate = toIsraelTime(slot.date);

  // Compare dates in Israel timezone
  const today = toIsraelTime(now);
  today.setHours(0, 0, 0, 0);
  slotDate.setHours(0, 0, 0, 0);

  return slotDate < today;
};

// Mock data
const mockVolunteers: Volunteer[] = [
  {
    id: "vol_001",
    userId: "user_001",
    fullName: "Sarah Cohen",
    birthDate: "1995-05-15",
    gender: "female",
    phoneNumber: "+972501234567",
    languages: ["Hebrew", "English", "Russian"],
    skills: ["First Aid", "Music"],
    hobbies: ["Reading", "Hiking"],
    groupAffiliation: null,
    reasonForVolunteering: "communityService",
    matchingPreference: "oneOnOne",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    notes: "Very reliable and punctual"
  },
  {
    id: "vol_002",
    userId: "user_002",
    fullName: "David Levi",
    birthDate: "1990-08-20",
    gender: "male",
    phoneNumber: "+972502345678",
    languages: ["Hebrew", "English", "Arabic"],
    skills: ["Cooking", "Art"],
    hobbies: ["Photography", "Chess"],
    groupAffiliation: null,
    reasonForVolunteering: "personalInterest",
    matchingPreference: "groupActivity",
    isActive: true,
    createdAt: "2024-01-15T00:00:00Z",
    notes: "Great with elderly residents"
  }
];

const mockCalendarSlots: CalendarSlot[] = [
  {
    id: "slot_001",
    date: "2025-05-09",
    startTime: "09:00",
    endTime: "12:00",
    period: "morning",
    isCustom: false,
    customLabel: null,
    residentIds: ["resident_001"],
    maxCapacity: 2,
    volunteerRequests: [
      {
        volunteerId: "vol_001",
        status: "pending",
        requestedAt: "2025-05-01T10:00:00Z",
        matchScore: 0.85,
        assignedBy: "ai"
      },
      {
        volunteerId: "vol_002",
        status: "pending",
        requestedAt: "2025-05-01T14:00:00Z",
        matchScore: 0.75,
        assignedBy: "ai"
      }
    ],
    approvedVolunteers: [],
    status: "open",
    appointmentId: "app_001",
    isOpen: true,
    notes: "Resident prefers Hebrew speakers",
    createdAt: "2025-04-30T09:00:00Z"
  }
];

const ManagerCalendar = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const headerRef = useRef<HTMLDivElement>(null);

  // Calendar state
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return toIsraelTime(now);
  });
  const [slots, setSlots] = useState<CalendarSlot[]>(mockCalendarSlots);

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
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [newSlot, setNewSlot] = useState<Partial<CalendarSlot> & { externalGroup?: Partial<ExternalGroup> }>({
    date: formatIsraelTime(new Date(), 'yyyy-MM-dd'),
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
    createdAt: new Date().toISOString(),
    externalGroup: undefined
  });

  // Add new state for day sessions dialog
  const [isDaySessionsDialogOpen, setIsDaySessionsDialogOpen] = useState(false);
  const [selectedDaySessions, setSelectedDaySessions] = useState<CalendarSlot[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);

  // Add state for pending requests
  const [pendingRequests, setPendingRequests] = useState<CalendarSlot[]>([]);
  const [isPendingViewActive, setIsPendingViewActive] = useState(false);

  // Add state to track which volunteer action is in progress
  const [pendingVolunteerAction, setPendingVolunteerAction] = useState<{ [key: string]: boolean }>({});

  // Add this state near the other state declarations
  const [fadingVolunteers, setFadingVolunteers] = useState<{ [key: string]: boolean }>({});

  // Add new state for external groups
  const [externalGroups, setExternalGroups] = useState<{ [key: string]: ExternalGroup }>({});

  // Add state for appointments
  const [appointments, setAppointments] = useState<{ [key: string]: Appointment }>({});

  // Add Firestore hooks
  const { volunteers, loading: volunteersLoading } = useVolunteers();
  const { residents, loading: residentsLoading } = useResidents();

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

  // Add this useEffect near the other useEffect hooks
  useEffect(() => {
    const checkAndUpdatePastSlots = () => {
      const now = toIsraelTime(new Date());
      now.setHours(0, 0, 0, 0);

      setSlots(prevSlots =>
        prevSlots.map(slot => {
          const slotDate = toIsraelTime(slot.date);
          slotDate.setHours(0, 0, 0, 0);

          // If the slot is in the past, not canceled, and not full
          if (slotDate < now && slot.status !== "canceled" && slot.approvedVolunteers.length < slot.maxCapacity) {
            return {
              ...slot,
              status: "canceled"
            };
          }
          return slot;
        })
      );
    };

    // Check immediately and then every hour
    checkAndUpdatePastSlots();
    const interval = setInterval(checkAndUpdatePastSlots, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Apply filters to sessions
  const filteredSessions = slots.filter(slot => {
    const slotDate = toIsraelTime(slot.date);
    const inDateRange = slotDate >= dateRange.start && slotDate <= dateRange.end;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "open" && slot.status === "open" && slot.approvedVolunteers.length < slot.maxCapacity) ||
      (statusFilter === "full" && slot.approvedVolunteers.length >= slot.maxCapacity) ||
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
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!newSlot.externalGroup && !newSlot.maxCapacity) {
      toast({
        title: "Missing information",
        description: "Please fill in max capacity for regular sessions.",
        variant: "destructive"
      });
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
        return;
      }
    }

    if (newSlot.startTime >= newSlot.endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return;
    }

    // Create session with Israel time
    const createdSlot: CalendarSlot = {
      id: Date.now().toString(),
      date: formatIsraelTime(toIsraelTime(newSlot.date)),
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      period: newSlot.period || "morning",
      isCustom: newSlot.isCustom || false,
      customLabel: newSlot.customLabel || null,
      residentIds: newSlot.residentIds || [],
      maxCapacity: newSlot.externalGroup ? newSlot.externalGroup.numberOfParticipants : newSlot.maxCapacity,
      volunteerRequests: [],
      approvedVolunteers: newSlot.externalGroup ? Array(newSlot.externalGroup.numberOfParticipants).fill("external_group") : [],
      status: newSlot.externalGroup ? "full" : "open",
      appointmentId: null,
      isOpen: true,
      notes: newSlot.notes || "",
      createdAt: new Date().toISOString()
    };

    setSlots(prev => [...prev, createdSlot]);

    // Store external group data if present
    if (newSlot.externalGroup) {
      const externalGroup: ExternalGroup = {
        id: createdSlot.id,
        appointmentId: createdSlot.id,
        groupName: newSlot.externalGroup.groupName,
        contactPerson: newSlot.externalGroup.contactPerson,
        contactPhoneNumber: newSlot.externalGroup.contactPhoneNumber,
        purposeOfVisit: newSlot.externalGroup.purposeOfVisit,
        numberOfParticipants: newSlot.externalGroup.numberOfParticipants,
        assignedDepartment: newSlot.externalGroup.assignedDepartment,
        activityContent: newSlot.externalGroup.activityContent,
        notes: newSlot.externalGroup.notes,
        createdAt: new Date().toISOString()
      };
      setExternalGroups(prev => ({
        ...prev,
        [createdSlot.id]: externalGroup
      }));

      // Create appointment for external group
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        calendarSlotId: createdSlot.id,
        residentIds: createdSlot.residentIds,
        volunteerIds: createdSlot.approvedVolunteers,
        status: "upcoming",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: createdSlot.notes
      };
      setAppointments(prev => ({
        ...prev,
        [createdSlot.id]: newAppointment
      }));
    }

      setIsCreateDialogOpen(false);
    setNewSlot({
      date: formatIsraelTime(new Date(), 'yyyy-MM-dd'),
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
      createdAt: new Date().toISOString()
    });

    toast({
      title: "Session created",
      description: "New session has been added to the calendar."
    });
  };

  // Handle delete session
  const handleDeleteSession = () => {
    if (!selectedSlot) return;

    // Check if appointment exists (has approved volunteers or is an external group)
    if (selectedSlot.approvedVolunteers.length > 0 || selectedSlot.approvedVolunteers[0] === "external_group") {
      toast({
        title: "Cannot Delete Session",
        description: "This session has approved volunteers or is an external group. Please change its status to 'canceled' instead.",
        variant: "destructive"
      });
      return;
    }

    // Delete associated appointment if exists
    if (appointments[selectedSlot.id]) {
      setAppointments(prev => {
        const newAppointments = { ...prev };
        delete newAppointments[selectedSlot.id];
        return newAppointments;
      });
    }

    // Delete associated external group if exists
    if (externalGroups[selectedSlot.id]) {
      setExternalGroups(prev => {
        const newExternalGroups = { ...prev };
        delete newExternalGroups[selectedSlot.id];
        return newExternalGroups;
      });
    }

    setSlots(slots.filter(session => session.id !== selectedSlot.id));
    setIsDeleteDialogOpen(false);
    setSelectedSlot(null);

    toast({
      title: "Session deleted",
      description: "The session has been removed from the calendar."
    });
  };

  // Handle edit session
  const handleEditSession = () => {
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

    // Update session with Israel time
    const updatedSlot = {
      ...selectedSlot,
      date: formatIsraelTime(toIsraelTime(selectedSlot.date))
    };

    setSlots(slots.map(session =>
      session.id === selectedSlot.id ? updatedSlot : session
    ));

    // Update appointment status if slot is canceled
    if (selectedSlot.status === "canceled" && appointments[selectedSlot.id]) {
      setAppointments(prev => ({
        ...prev,
        [selectedSlot.id]: {
          ...prev[selectedSlot.id],
          status: "canceled",
          updatedAt: new Date().toISOString()
        }
      }));
    }

    setIsEditDialogOpen(false);
    setSelectedSlot(null);

    toast({
      title: "Session updated",
      description: "The session has been updated successfully."
    });
  };

  // Handle volunteer request actions
  const handleVolunteerRequest = (
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

    // Wait for fade animation before updating state
    setTimeout(() => {
      // Update sessions state
      setSlots(prev => prev.map(session => {
        if (session.id !== sessionId) return session;

        const updatedVolunteerRequests = session.volunteerRequests.filter(v => v.volunteerId !== volunteerId);
        let updatedApprovedVolunteers = [...session.approvedVolunteers];
        let updatedStatus = session.status;

        if (action === 'approve') {
          updatedApprovedVolunteers = [...updatedApprovedVolunteers, volunteerId];
          // Update status based on approved volunteers count
          if (updatedApprovedVolunteers.length >= session.maxCapacity) {
            updatedStatus = "full";
          } else {
            updatedStatus = "open";
          }

          // Create appointment if this is the first approved volunteer
          if (updatedApprovedVolunteers.length === 1) {
            const newAppointment: Appointment = {
              id: Date.now().toString(),
              calendarSlotId: sessionId,
              residentIds: session.residentIds,
              volunteerIds: [volunteerId],
              status: "upcoming",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              notes: session.notes || null
            };
            setAppointments(prev => ({
              ...prev,
              [sessionId]: newAppointment
            }));
          } else if (updatedApprovedVolunteers.length > 1) {
            // Update existing appointment with new volunteer
            setAppointments(prev => ({
              ...prev,
              [sessionId]: {
                ...prev[sessionId],
                volunteerIds: updatedApprovedVolunteers,
                updatedAt: new Date().toISOString()
              }
            }));
          }
        } else if (action === 'reject') {
          // Remove volunteer from approved list if they were approved
          updatedApprovedVolunteers = updatedApprovedVolunteers.filter(id => id !== volunteerId);

          // Update appointment if it exists
          if (appointments[sessionId]) {
            if (updatedApprovedVolunteers.length === 0) {
              // Delete appointment if no volunteers left
              setAppointments(prev => {
                const newAppointments = { ...prev };
                delete newAppointments[sessionId];
                return newAppointments;
              });
        } else {
              // Update appointment with remaining volunteers
              setAppointments(prev => ({
                ...prev,
                [sessionId]: {
                  ...prev[sessionId],
                  volunteerIds: updatedApprovedVolunteers,
                  updatedAt: new Date().toISOString()
                }
              }));
            }
          }
        }

          return {
            ...session,
          volunteerRequests: updatedVolunteerRequests,
          approvedVolunteers: updatedApprovedVolunteers,
          status: updatedStatus
          };
      }));

      // Update selected session if it's the one being modified
      if (selectedSlot?.id === sessionId) {
        setSelectedSlot(prev => {
          if (!prev) return null;
          const updatedVolunteerRequests = prev.volunteerRequests.filter(v => v.volunteerId !== volunteerId);
          let updatedApprovedVolunteers = [...prev.approvedVolunteers];
          let updatedStatus = prev.status;

          if (action === 'approve') {
            updatedApprovedVolunteers = [...updatedApprovedVolunteers, volunteerId];
            if (updatedApprovedVolunteers.length >= prev.maxCapacity) {
              updatedStatus = "full";
          } else {
              updatedStatus = "open";
            }
          } else if (action === 'reject') {
            updatedApprovedVolunteers = updatedApprovedVolunteers.filter(id => id !== volunteerId);
          }

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

      toast({
        title: action === 'approve' ? "Volunteer approved" : "Volunteer rejected",
        description: action === 'approve'
          ? "The volunteer has been added to the session."
          : "The volunteer request has been rejected."
      });
    }, 300);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  // Handle more filters
  const handleMoreFilters = () => {
    setIsMoreFiltersOpen(true);
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

            <div className="divide-y">
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
                              <span>{session.approvedVolunteers.length}/{session.maxCapacity} filled</span>
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
                      <div key={`empty-${i}`} className="h-24 p-2 border rounded-lg border-slate-200 bg-slate-100/80" />
                  );
                }

                // Add days of the month
                for (let i = 1; i <= daysInMonth; i++) {
                  const date = new Date(year, month, i);
                  const dateStr = formatIsraelTime(date);
                  const sessionsForDay = filteredSessions.filter(s => s.date === dateStr);
                  const isCurrentDate = isToday(date);
                  const isPastDate = isPast(date) && !isCurrentDate;

                  days.push(
                    <div
                      key={dateStr}
                      className={cn(
                        "h-24 p-2 border rounded-lg transition-colors overflow-hidden cursor-pointer",
                          isCurrentDate ? "border-slate-300 hover:bg-slate-50/80 ring-1 ring-black" : "border-slate-300 hover:bg-slate-50/80",
                        isPastDate ? "opacity-70" : ""
                      )}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedDayDate(date);
                        setSelectedDaySessions(sessionsForDay);
                        setIsDaySessionsDialogOpen(true);
                      }}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-2 flex justify-between items-center",
                        isCurrentDate ? "text-slate-900" : "text-slate-900"
                      )}>
                        <div className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200",
                          formatIsraelTime(date, 'yyyy-MM-dd') === formatIsraelTime(selectedDate, 'yyyy-MM-dd')
                              ? "bg-slate-200 text-slate-700 shadow-sm shadow-slate-200"
                            : "hover:bg-slate-100"
                        )}>
                          <span className={cn(
                              "text-sm font-medium transition-colors duration-200",
                            formatIsraelTime(date, 'yyyy-MM-dd') === formatIsraelTime(selectedDate, 'yyyy-MM-dd')
                                ? "text-slate-700"
                              : "text-slate-900"
                          )}>
                            {i}
                    </span>
                  </div>
                        {sessionsForDay.length > 0 && (
                            <Badge variant="outline" className="text-xs font-normal px-1.5 py-0.5 bg-slate-50">
                            {sessionsForDay.length} session{sessionsForDay.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                </div>

                      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-2.5rem)]">
                        {sessionsForDay
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .slice(0, 3)
                          .map(session => (
                            <div
                              key={session.id}
                              className={cn(
                                "p-1.5 rounded-md text-xs border",
                                  session.status === "full" ? "border-amber-200 bg-amber-50" :
                                    session.status === "canceled" ? "border-red-200 bg-red-50" :
                                "border-slate-200 bg-slate-50"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {session.startTime}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                    <span>{session.approvedVolunteers.length}/{session.maxCapacity}</span>
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
                  const isPastDate = isPast(date) && !isCurrentDate;

                  days.push(
                    <div key={dateStr} className="flex flex-col h-full">
                      <div
                          className={cn(
                          "text-center p-2 rounded-t-lg font-medium",
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
                          "flex-1 border border-t-0 rounded-b-lg p-2 space-y-2 overflow-y-auto min-h-[500px]",
                          isPastDate ? "opacity-70" : ""
                        )}
                      >
                        {sessionsForDay
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(session => (
                            <TooltipProvider key={session.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                        "p-2 rounded-md text-sm cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors border",
                                        session.status === "full" ? "border-amber-200 bg-amber-50" :
                                          session.status === "canceled" ? "border-red-200 bg-red-50" :
                                      "border-slate-200 bg-slate-50"
                                    )}
                                    onClick={() => {
                                        setSelectedSlot(session);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">
                                        {session.startTime} - {session.endTime}
                                      </span>
                                        {session.volunteerRequests.some(v => v.status === "pending") && !isSlotInPast(session) && (
                                          <Badge
                                            variant="outline"
                                            className="h-6 px-2 text-amber-600 bg-amber-50 border-amber-200"
                                        onClick={(e) => {
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
                                    <div className="flex items-center text-slate-600">
                                      <Users className="h-4 w-4 mr-1" />
                                        <span>{session.approvedVolunteers.length}/{session.maxCapacity} filled</span>
                                      </div>
                                      {session.isCustom && (
                                      <Badge variant="outline" className="mt-2 bg-blue-50 border-blue-200">
                                          Custom
                                      </Badge>
                                    )}
                                      </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-2 p-1 max-w-xs">
                                    <div className="font-medium">{format(new Date(session.date), 'MMMM d, yyyy')}</div>
                                    <div>{session.startTime} - {session.endTime}</div>
                                    <div className="text-sm text-slate-600">
                                        {session.approvedVolunteers.length}/{session.maxCapacity} volunteers
                                      </div>
                                      {session.volunteerRequests.length > 0 && (
                                      <div className="text-sm">
                                        <div className="font-medium mb-1">Volunteers:</div>
                                        <ul className="list-disc pl-4">
                                            {session.volunteerRequests.map(volunteer => (
                                              <li key={volunteer.volunteerId}>{volunteer.volunteerId}</li>
                                          ))}
                                        </ul>
                                    </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-100 p-3 text-center">
                <h3 className="text-lg font-medium">
                  {formatIsraelTime(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                </div>

              <div className="divide-y">
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
                                "p-4 hover:bg-slate-50/80 cursor-pointer transition-colors text-center",
                                isSlotInPast(session) ? "opacity-70" : ""
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
                                      <span>{session.approvedVolunteers.length}/{session.maxCapacity} volunteers</span>
                            </div>

                                    {session.isCustom && (
                                    <Badge variant="outline" className="bg-blue-50 border-blue-200">
                                        Custom
                                    </Badge>
                                  )}

                                  <Badge
                                    className={
                                        session.status === "full" ? "bg-amber-500" :
                                          session.status === "canceled" ? "bg-red-500" :
                                      "bg-emerald-500"
                                    }
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
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                      <TabsList className="grid w-[300px] grid-cols-3">
                        <TabsTrigger value="month" className="flex items-center gap-1">
                          <Grid className="h-4 w-4" />
                          <span className="hidden sm:inline">Month</span>
                        </TabsTrigger>
                        <TabsTrigger value="week" className="flex items-center gap-1">
                          <Columns className="h-4 w-4" />
                          <span className="hidden sm:inline">Week</span>
                        </TabsTrigger>
                        <TabsTrigger value="day" className="flex items-center gap-1">
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
                          <Button variant="outline" size="sm" className="h-9 border-slate-200 hover:bg-slate-50">
                            <FileDown className="h-4 w-4 mr-1" />
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
            <div className="bg-white rounded-xl shadow-sm">
              {renderCalendarContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Create Session Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Schedule a new volunteer session. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 px-4 pr-5 pt-4 pb-4">
          <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                      value={newSlot.date}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

                  {!newSlot.externalGroup && (
              <div className="space-y-2">
                      <Label htmlFor="maxCapacity">Max Capacity</Label>
                <Input
                        id="maxCapacity"
                  type="number"
                  min="1"
                        value={newSlot.maxCapacity}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                  required
                />
              </div>
                  )}
            </div>

                <div className="space-y-4">
                  {!newSlot.isCustom && (
                    <div className="space-y-2">
                      <Label htmlFor="period">Period</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                        disabled={!newSlot.isCustom && newSlot.period !== null}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                        disabled={!newSlot.isCustom && newSlot.period !== null}
                />
              </div>
            </div>

                  {newSlot.isCustom && (
            <div className="space-y-2">
                      <Label htmlFor="customLabel">Custom Label</Label>
                      <Input
                        id="customLabel"
                        value={newSlot.customLabel || ""}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, customLabel: e.target.value }))}
                        placeholder="Add a label for this custom session"
              />
                    </div>
                  )}
                  </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
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
                          period: checked ? null : "morning", // Default to morning when switching to non-custom
                          startTime: checked ? "09:00" : "09:00", // Default to morning time
                          endTime: checked ? "12:00" : "12:00" // Default to morning time
                        }));
                      }}
                    />
                  </div>
              </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
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
                            createdAt: new Date().toISOString()
                          } : undefined
                        }));
                      }}
                    />
                  </div>

                  {newSlot.externalGroup && (
                    <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="groupName">Group Name</Label>
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

            <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person</Label>
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

                      <div className="space-y-2">
                        <Label htmlFor="contactPhoneNumber">Contact Phone Number</Label>
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

                      <div className="space-y-2">
                        <Label htmlFor="purposeOfVisit">Purpose Of Visit</Label>
                        <Textarea
                          id="purposeOfVisit"
                          value={newSlot.externalGroup.purposeOfVisit || ""}
                          onChange={(e) => setNewSlot(prev => ({
                            ...prev,
                            externalGroup: { ...prev.externalGroup!, purposeOfVisit: e.target.value }
                          }))}
                          placeholder="Describe the purpose of the visit"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="numberOfParticipants">Number Of Participants</Label>
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

                      <div className="space-y-2">
                        <Label htmlFor="assignedDepartment">Assigned Department</Label>
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

                      <div className="space-y-2">
                        <Label htmlFor="activityContent">Activity Content</Label>
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
              )}
          </div>

          {/* Add Volunteers Section */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
            <div className="space-y-1">
              <Label className="text-base font-medium">Assign Volunteers</Label>
              <p className="text-sm text-slate-500">Select volunteers to assign to this session</p>
            </div>
            <div className="space-y-2">
              {volunteersLoading ? (
                <div className="text-sm text-slate-500">Loading volunteers...</div>
              ) : volunteers.length === 0 ? (
                <div className="text-sm text-slate-500">No volunteers available</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {newSlot.residentIds
                      .filter(id => volunteers.some(v => v.id === id))
                      .map(volunteerId => {
                        const volunteer = volunteers.find(v => v.id === volunteerId);
                        return (
                          <Badge
                            key={volunteerId}
                            variant="secondary"
                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200"
                          >
                            {volunteer?.fullName}
                            <button
                              onClick={() => {
                                setNewSlot(prev => ({
                                  ...prev,
                                  residentIds: prev.residentIds.filter(id => id !== volunteerId)
                                }));
                              }}
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                  </div>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !newSlot.residentIds.includes(value)) {
                        setNewSlot(prev => ({
                          ...prev,
                          residentIds: [...prev.residentIds, value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select volunteers..." />
                    </SelectTrigger>
                    <SelectContent>
                      {volunteers
                        .filter(volunteer => !newSlot.residentIds.includes(volunteer.id))
                        .map(volunteer => (
                          <SelectItem key={volunteer.id} value={volunteer.id}>
                            {volunteer.fullName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Add Residents Section */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
            <div className="space-y-1">
              <Label className="text-base font-medium">Assign Residents</Label>
              <p className="text-sm text-slate-500">Select residents to assign to this session</p>
            </div>
            <div className="space-y-2">
              {residentsLoading ? (
                <div className="text-sm text-slate-500">Loading residents...</div>
              ) : residents.length === 0 ? (
                <div className="text-sm text-slate-500">No residents available</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {newSlot.residentIds
                      .filter(id => residents.some(r => r.id === id))
                      .map(residentId => {
                        const resident = residents.find(r => r.id === residentId);
                        return (
                          <Badge
                            key={residentId}
                            variant="secondary"
                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200"
                          >
                            {resident?.fullName}
                            <button
                              onClick={() => {
                                setNewSlot(prev => ({
                                  ...prev,
                                  residentIds: prev.residentIds.filter(id => id !== residentId)
                                }));
                              }}
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                  </div>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !newSlot.residentIds.includes(value)) {
                        setNewSlot(prev => ({
                          ...prev,
                          residentIds: [...prev.residentIds, value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select residents..." />
                    </SelectTrigger>
                    <SelectContent>
                      {residents
                        .filter(resident => !newSlot.residentIds.includes(resident.id))
                        .map(resident => (
                          <SelectItem key={resident.id} value={resident.id}>
                            {resident.fullName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newSlot.notes}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional information about the session..."
                  />
                </div>
              </div>
            </form>
          </div>

          <DialogFooter className="border-t border-slate-200 pt-5 flex justify-center items-center">
            <Button type="submit" onClick={handleCreateSession} className="mx-auto">
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update the session details below.
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <form onSubmit={e => { e.preventDefault(); handleEditSession(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={selectedSlot.date}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-maxCapacity">Max Capacity</Label>
                  <Input
                    id="edit-maxCapacity"
                    type="number"
                    min="1"
                    value={selectedSlot.maxCapacity}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, maxCapacity: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={selectedSlot.startTime}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={selectedSlot.endTime}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedSlot.status}
                  onValueChange={(value: "open" | "full" | "canceled") =>
                    setSelectedSlot({ ...selectedSlot, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="canceled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={selectedSlot.notes}
                  onChange={(e) => setSelectedSlot({ ...selectedSlot, notes: e.target.value })}
                  placeholder="Add any additional information about the session..."
                />
                    </div>

                <div className="space-y-2">
                <Label>Current Residents</Label>
                  <div className="flex flex-wrap gap-1">
                  {selectedSlot.residentIds.length > 0 ? (
                    selectedSlot.residentIds.map(residentId => (
                      <Badge key={residentId} variant="outline" className="bg-slate-100">
                        {residentId}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No residents assigned</span>
                  )}
                </div>
              </div>

              {selectedSlot.approvedVolunteers.length > 0 && (
              <div className="space-y-2">
                  <Label>Current Volunteers</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedSlot.approvedVolunteers[0] === "external_group" ? (
                      <Badge variant="outline" className="bg-slate-100">
                        {externalGroups[selectedSlot.id]?.groupName} ({selectedSlot.approvedVolunteers.length} participants)
                      </Badge>
                    ) : (
                      selectedSlot.approvedVolunteers.map(volunteerId => (
                        <Badge key={volunteerId} variant="outline" className="bg-slate-100">
                          {volunteerId}
                        </Badge>
                      ))
                    )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      Delete Session
                    </Button>
                    <div className="flex-1" />
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
                    <Button type="submit">Save Changes</Button>
          </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Session Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && !isSlotInPast(selectedSlot) && (
                <div className="space-y-4">
              {selectedSlot.approvedVolunteers.length > 0 ? (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Cannot Delete Session</span>
                    </div>
                    <p className="text-sm">
                      This session has {selectedSlot.approvedVolunteers.length} approved volunteer{selectedSlot.approvedVolunteers.length !== 1 ? 's' : ''}.
                      You must change its status to "canceled" instead of deleting it.
                    </p>
                </div>

                  <div className="space-y-2">
                    <Label>Current Volunteers</Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedSlot.approvedVolunteers.map(volunteerId => (
                        <Badge key={volunteerId} variant="outline" className="bg-slate-100">
                          {volunteerId}
                  </Badge>
                      ))}
                  </div>
                </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      Change Status to Canceled
                    </Button>
              </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="font-medium mb-2">Session Details</div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div>Date: {format(new Date(selectedSlot.date), 'MMMM d, yyyy')}</div>
                      <div>Time: {selectedSlot.startTime} - {selectedSlot.endTime}</div>
                      <div>Status: {selectedSlot.status}</div>
                    </div>
                </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteSession}
                    >
                      Delete Session
                    </Button>
              </div>
            </div>
          )}
            </div>
        )}
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
                    <div>Current Volunteers: {selectedSlot.approvedVolunteers.length}/{selectedSlot.maxCapacity}</div>
                  </div>
                </div>

              <div className="space-y-4">
                  {selectedSlot.volunteerRequests
                    .filter(volunteer => volunteer.status === "pending")
                    .sort((a, b) => a.volunteerId.localeCompare(b.volunteerId))
                  .map(volunteer => (
                    <div
                        key={volunteer.volunteerId}
                      className="flex items-center justify-between p-3 border rounded-lg"
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
                      className={`p-4 border rounded-lg bg-white hover:bg-slate-50 cursor-pointer min-h-[76px]
                        ${selectedSlot?.id === session.id ? "focus-visible:ring-2 ring-primary rounded-md focus:outline-none transition" : ""}
                      `}
                      onClick={() => {
                        setSelectedSlot(session);
                        setIsDaySessionsDialogOpen(false);
                        setIsEditDialogOpen(true);
                      }}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          setSelectedSlot(session);
                          setIsDaySessionsDialogOpen(false);
                          setIsEditDialogOpen(true);
                        }
                      }}
                      aria-label={`Edit session at ${session.startTime}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {session.startTime} - {session.endTime}
            </div>
                          <div className="text-sm text-slate-500 mt-1">
                            {session.approvedVolunteers.length}/{session.maxCapacity} volunteers
            </div>
            </div>
                        <Badge
                          className={
                            session.status === "full" ? "bg-amber-500" :
                              session.status === "canceled" ? "bg-red-500" :
                            "bg-emerald-500"
                          }
                        >
                          {session.status}
                        </Badge>
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

          <DialogFooter className="border-t border-slate-200 pt-5 flex justify-center items-center">
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
    </div>
  );
};

export default ManagerCalendar;
