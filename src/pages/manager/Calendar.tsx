import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Timestamp } from 'firebase/firestore';
import {
  Grid,
  Plus,
  User,
  Users,
  Clock,
  Target,
  Columns,
  BookText,
  FileText,
  ArrowLeft,
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
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, isToday } from "date-fns";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import { useResidents } from "@/hooks/useFirestoreResidents";
import { useAddAttendance } from "@/hooks/useAttendance";
import { useDeleteAttendance } from "@/hooks/useAttendance";
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
  Attendance,
  CalendarSlot,
  Appointment,
  ExternalGroup,
  ParticipantId,
  VolunteerRequestStatus,
  RecurringPattern,
  RecurrenceFrequency,
  attendanceRef
} from "@/services/firestore";
import { generateRecurringSlots } from "@/utils/recurringSlots";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { addAppointmentToHistory, updateAppointmentStatusInHistory, incrementSessionStats, decrementSessionStats, updateVolunteerAttendanceStats, decrementVolunteerAttendanceStats, removeAppointmentFromHistory, updateAppointmentTimeInHistory, updateAppointmentVolunteerIdsInHistory, updateAppointmentResidentIdsInHistory, incrementHoursOnly, decrementHoursOnly } from '@/services/engagement';
import { AppointmentStatus } from '@/services/firestore';

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

// Add this helper function near the other utility functions
const isSessionEndInPast = (date: string, endTime: string): boolean => {
  const now = toIsraelTime(new Date());
  const sessionDate = toIsraelTime(date);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const sessionEnd = new Date(sessionDate);
  sessionEnd.setHours(endHour, endMinute, 0, 0);
  return sessionEnd < now;
};

// Helper function to check if a session is today
const isSessionToday = (sessionDate: string): boolean => {
  const today = new Date();
  const israelToday = toIsraelTime(today);
  const sessionDateObj = new Date(sessionDate + 'T00:00:00');

  return formatIsraelTime(israelToday, 'yyyy-MM-dd') === formatIsraelTime(sessionDateObj, 'yyyy-MM-dd');
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

  // For past sessions, always return the actual number of participants
  const isPast = isSessionInPast(session.date, session.startTime);
  if (isPast) {
    return session.approvedVolunteers.length;
  }

  // For regular volunteers in future/ongoing sessions, use the length of approvedVolunteers
  return session.approvedVolunteers.length;
};

// Helper function to get the appropriate capacity number for display
const getCapacityDisplay = (session: CalendarSlotUI) => {
  // Check if this is an external group by looking at the first participant's type
  const firstParticipant = session.approvedVolunteers[0];
  if (firstParticipant && firstParticipant.type === 'external_group') {
    // For external groups, use maxCapacity (which is set to numberOfParticipants)
    return session.maxCapacity;
  }

  // For past sessions with participants, return the actual number of participants as the capacity
  // For past sessions with NO participants, return the original maxCapacity (not 0)
  const isPast = isSessionInPast(session.date, session.startTime);
  if (isPast && session.approvedVolunteers.length > 0) {
    return session.approvedVolunteers.length;
  }

  // For future/ongoing sessions or past sessions with no participants, return the max capacity
  return session.maxCapacity || 1;
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
  })) as Attendance[];
};

// Add this near the top of the file with other type definitions
type VolunteerRequestAction =
  | { type: 'approve' }
  | { type: 'reject' };

// Add this near the top of the file with other type definitions
function isApproveAction(action: 'approve' | 'reject'): action is 'approve' {
  return action === 'approve';
}

// Helper to decrement volunteer attendance stat for a given appointment




// Function to find and delete attendance records by volunteer ID and appointment ID
const deleteAttendanceByVolunteerAndAppointment = async (volunteerId: string, appointmentId: string) => {
  try {
    const q = query(
      attendanceRef,
      where('appointmentId', '==', appointmentId),
      where('volunteerId.id', '==', volunteerId)
    );
    const querySnapshot = await getDocs(q);

    // Delete all matching attendance records
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log(`[deleteAttendanceByVolunteerAndAppointment] Deleted ${querySnapshot.docs.length} attendance records for volunteer ${volunteerId} and appointment ${appointmentId}`);
  } catch (error) {
    console.error(`[deleteAttendanceByVolunteerAndAppointment] Error deleting attendance records for volunteer ${volunteerId} and appointment ${appointmentId}:`, error);
  }
};

// Helper function to check if a volunteer has an attendance record for an appointment (only present/late, not absent)
const hasVolunteerAttendanceRecord = async (volunteerId: string, appointmentId: string): Promise<boolean> => {
  try {
    const q = query(
      attendanceRef,
      where('appointmentId', '==', appointmentId),
      where('volunteerId.id', '==', volunteerId),
      where('volunteerId.type', '==', 'volunteer')
    );
    const querySnapshot = await getDocs(q);
    // Only consider present or late status as having an attendance record
    return querySnapshot.docs.some(doc => {
      const data = doc.data();
      return data.status === 'present' || data.status === 'late';
    });
  } catch (error) {
    console.error('Error checking attendance record:', error);
    return false;
  }
};

// Helper function to check if any volunteer has an attendance record for an appointment (only present/late, not absent)
const hasAnyVolunteerAttendanceRecord = async (appointmentId: string): Promise<boolean> => {
  try {
    const q = query(
      attendanceRef,
      where('appointmentId', '==', appointmentId),
      where('volunteerId.type', '==', 'volunteer')
    );
    const querySnapshot = await getDocs(q);
    // Only consider present or late status as having an attendance record
    return querySnapshot.docs.some(doc => {
      const data = doc.data();
      return data.status === 'present' || data.status === 'late';
    });
  } catch (error) {
    console.error('Error checking attendance records:', error);
    return false;
  }
};

// Helper function to get attendance record for a volunteer in an appointment
const getVolunteerAttendanceRecord = async (volunteerId: string, appointmentId: string) => {
  try {
    const q = query(
      attendanceRef,
      where('appointmentId', '==', appointmentId),
      where('volunteerId.id', '==', volunteerId),
      where('volunteerId.type', '==', 'volunteer')
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.docs.length > 0) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting attendance record:', error);
    return null;
  }
};

// Helper function to count volunteers with attendance records for an appointment (only present/late, not absent)
const countVolunteersWithAttendanceRecords = async (appointmentId: string): Promise<number> => {
  try {
    const q = query(
      attendanceRef,
      where('appointmentId', '==', appointmentId),
      where('volunteerId.type', '==', 'volunteer')
    );
    const querySnapshot = await getDocs(q);
    // Only count present or late status as having an attendance record
    return querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.status === 'present' || data.status === 'late';
    }).length;
  } catch (error) {
    console.error('Error counting attendance records:', error);
    return 0;
  }
};

const ManagerCalendar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('manager-calendar');
  const { isRTL, dir } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
  const { deleteAttendance, loading: isDeletingAttendance } = useDeleteAttendance();

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
    maxCapacity: 1,
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

  // Add state for rejection reason dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingRejectAction, setPendingRejectAction] = useState<{ sessionId: string; volunteerId: string } | null>(null);

  // Add recurring session state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
    endDate: undefined
  });

  // Add state for recurring deletion confirmation dialog
  const [isDeleteRecurringDialogOpen, setIsDeleteRecurringDialogOpen] = useState(false);

  // Add state to track if there are future recurring sessions
  const [hasFutureRecurringSessions, setHasFutureRecurringSessions] = useState(false);

  // Add navigation loading state to prevent flash during day navigation
  // Removed day view caching states for better performance



  // Check for future recurring sessions when selectedSlot changes
  useEffect(() => {
    const checkFutureRecurringSessions = async () => {
      if (selectedSlot?.isRecurring && selectedSlot?.recurringPattern?.parentSlotId) {
        try {
          const parentSlotId = selectedSlot.recurringPattern.parentSlotId;
          const selectedSlotDate = new Date(selectedSlot.date);

          const recurringSessionsQuery = query(
            collection(db, 'calendar_slots'),
            where('recurringPattern.parentSlotId', '==', parentSlotId)
          );
          const recurringSessionsSnapshot = await getDocs(recurringSessionsQuery);

          const futureSessions = recurringSessionsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() as CalendarSlot }))
            .filter(session => {
              const sessionDate = new Date(session.date);
              return sessionDate > selectedSlotDate;
            });

          setHasFutureRecurringSessions(futureSessions.length > 0);
        } catch (error) {
          console.error('Error checking future recurring sessions:', error);
          setHasFutureRecurringSessions(false);
        }
      } else {
        setHasFutureRecurringSessions(false);
      }
    };

    checkFutureRecurringSessions();
  }, [selectedSlot, slots]); // Add 'slots' as a dependency to re-check when calendar data changes

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

  // Removed heavy day view caching useEffect for better performance

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
      const monthKey = formatIsraelTime(selectedDate, 'MMMM').toLowerCase();
      const year = formatIsraelTime(selectedDate, 'yyyy');
      return `${t(`calendar.months.${monthKey}`)} ${year}`;
    } else if (calendarView === "week") {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        const monthKey = formatIsraelTime(weekStart, 'MMM').toLowerCase();
        const startDay = formatIsraelTime(weekStart, 'd');
        const endDay = formatIsraelTime(weekEnd, 'd');
        const year = formatIsraelTime(weekEnd, 'yyyy');
        return `${t(`calendar.monthsShort.${monthKey}`)} ${startDay} - ${endDay}, ${year}`;
      } else {
        const startMonthKey = formatIsraelTime(weekStart, 'MMM').toLowerCase();
        const endMonthKey = formatIsraelTime(weekEnd, 'MMM').toLowerCase();
        const startDay = formatIsraelTime(weekStart, 'd');
        const endDay = formatIsraelTime(weekEnd, 'd');
        const year = formatIsraelTime(weekEnd, 'yyyy');
        return `${t(`calendar.monthsShort.${startMonthKey}`)} ${startDay} - ${t(`calendar.monthsShort.${endMonthKey}`)} ${endDay}, ${year}`;
      }
    } else {
      const dayKey = formatIsraelTime(selectedDate, 'EEEE').toLowerCase();
      const monthKey = formatIsraelTime(selectedDate, 'MMMM').toLowerCase();
      const day = formatIsraelTime(selectedDate, 'd');
      const year = formatIsraelTime(selectedDate, 'yyyy');
      return `${t(`calendar.weekDays.${dayKey}`)}, ${t(`calendar.months.${monthKey}`)} ${day}, ${year}`;
    }
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date) => {
    const dateStr = formatIsraelTime(toIsraelTime(date));
    return filteredSessions
      .filter(session => session.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };



  // Handle create session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSession(true);

    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast({
        title: t('messages.missingInformation'),
        description: t('messages.missingInformationDescription'),
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
        title: t('messages.missingVolunteer'),
        description: t('messages.missingVolunteerDescription'),
        variant: "destructive"
      });
      setIsCreatingSession(false);
      return;
    }

    if (isPastSession && !newSlot.externalGroup && (newSlot.residentIds || []).length === 0) {
      toast({
        title: t('messages.missingResident'),
        description: t('messages.missingResidentDescription'),
        variant: "destructive"
      });
      setIsCreatingSession(false);
      return;
    }

    if (!newSlot.externalGroup && !newSlot.maxCapacity) {
      toast({
        title: t('messages.missingMaxCapacity'),
        description: t('messages.missingMaxCapacityDescription'),
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
          title: t('messages.missingExternalGroupInfo'),
          description: t('messages.missingExternalGroupInfoDescription'),
          variant: "destructive"
        });
        setIsCreatingSession(false);
        return;
      }
    }

    if (newSlot.startTime >= newSlot.endTime) {
      toast({
        title: t('messages.invalidTimeRange'),
        description: t('messages.invalidTimeRangeDescription'),
        variant: "destructive"
      });
      setIsCreatingSession(false);
      return;
    }

    // In handleCreateSession, add validation for custom session time
    if (newSlot.isCustom) {
      if (!newSlot.startTime || !newSlot.endTime) {
        toast({
          title: t('messages.missingTime'),
          description: t('messages.missingTimeDescription'),
          variant: "destructive"
        });
        setIsCreatingSession(false);
        return;
      }
      if (newSlot.startTime >= newSlot.endTime) {
        toast({
          title: t('messages.invalidCustomTimeRange'),
          description: t('messages.invalidCustomTimeRangeDescription'),
          variant: "destructive"
        });
        setIsCreatingSession(false);
        return;
      }
    }

    // Only check volunteer count for future/ongoing sessions
    if (!isPastSession && !newSlot.externalGroup && selectedVolunteers.length > (newSlot.maxCapacity || 0)) {
      toast({
        title: t('messages.tooManyVolunteers'),
        description: t('messages.tooManyVolunteersDescription'),
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
          throw new Error(t('messages.externalGroupError'));
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
        status: isPastSession ? "full" : (isOngoingSession ? "full" : (newSlot.externalGroup ? "full" : (selectedVolunteers.length >= (newSlot.maxCapacity || 0) ? "full" : "open"))),
        appointmentId: null,
        isOpen: (isPastSession || isOngoingSession)
          ? false
          : (newSlot.externalGroup ? false : (selectedVolunteers.length >= (newSlot.maxCapacity || 0) ? false : true)),
        notes: newSlot.notes || "",
        createdAt: Timestamp.fromDate(new Date()),
        isRecurring: isRecurring,
        recurringPattern: isRecurring ? recurringPattern : undefined
      };

      // For past sessions, set maxCapacity to the number of assigned volunteers
      if (isPastSession && !newSlot.externalGroup) {
        createdSlot.maxCapacity = selectedVolunteers.length;
      }

      console.log("Attempting to add calendar slot with data:", createdSlot);

      // Create a clean data object with only necessary fields for Firestore
      const slotDataForFirestore: Omit<CalendarSlot, 'id'> = {
        date: createdSlot.date,
        startTime: createdSlot.startTime,
        endTime: createdSlot.endTime,
        period: createdSlot.period,
        isCustom: createdSlot.isCustom,
        customLabel: createdSlot.customLabel,
        residentIds: createdSlot.residentIds,
        maxCapacity: createdSlot.maxCapacity,
        volunteerRequests: createdSlot.volunteerRequests,
        approvedVolunteers: createdSlot.approvedVolunteers,
        status: createdSlot.status,
        appointmentId: createdSlot.appointmentId,
        isOpen: createdSlot.isOpen,
        notes: createdSlot.notes,
        createdAt: createdSlot.createdAt,
        isRecurring: createdSlot.isRecurring,
        // Only include recurringPattern if it exists and is relevant
        ...(createdSlot.isRecurring && createdSlot.recurringPattern ? { recurringPattern: createdSlot.recurringPattern } : {})
      };

      const newSlotId = await addCalendarSlot(slotDataForFirestore);
      if (!newSlotId) {
        throw new Error(t('messages.calendarSlotError'));
      }

      // Create appointment if there are pre-approved volunteers or external group for the initial slot
      let initialAppointmentId: string | null = null;
      if (selectedVolunteers.length > 0 || groupId) {
        const initialAppointment: Omit<Appointment, 'id'> = {
          calendarSlotId: newSlotId,
          residentIds: createdSlot.residentIds,
          volunteerIds: groupId ?
            [{ id: groupId, type: 'external_group' }] :
            selectedVolunteers.map(id => ({ id, type: 'volunteer' })),
          status: isPastSession ? "completed" : (isOngoingSession ? "inProgress" : "upcoming"),
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          notes: createdSlot.notes
        };
        initialAppointmentId = await addAppointment(initialAppointment);

        // If this is an external group, update the group with the appointmentId
        if (groupId && initialAppointmentId) {
          await updateExternalGroup(groupId, { appointmentId: initialAppointmentId });
        }

        // Engagement tracking: Add to history for each participant
        if (initialAppointmentId) {
          // Link the slot to the appointment
          await updateCalendarSlot(newSlotId, {
            appointmentId: initialAppointmentId
          });
          // For volunteers
          for (const volunteerId of selectedVolunteers) {
            const entry = {
              appointmentId: initialAppointmentId,
              date: createdSlot.date,
              startTime: createdSlot.startTime,
              endTime: createdSlot.endTime,
              residentIds: createdSlot.residentIds,
              status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
            };
            await addAppointmentToHistory(volunteerId, entry, 'volunteer');
          }
          // For residents
          for (const residentId of createdSlot.residentIds) {
            const entry: import('@/services/firestore').ResidentAppointmentEntry = {
              appointmentId: initialAppointmentId,
              date: createdSlot.date,
              startTime: createdSlot.startTime,
              endTime: createdSlot.endTime,
              volunteerIds: groupId
                ? [{ id: groupId, type: 'external_group' }]
                : selectedVolunteers.map(id => ({ id, type: 'volunteer' })),
              status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
            };
            await addAppointmentToHistory(residentId, entry, 'resident');
          }
          // Engagement stats for past sessions
          if (isPastSession) {
            const [startHour, startMinute] = createdSlot.startTime.split(':').map(Number);
            const [endHour, endMinute] = createdSlot.endTime.split(':').map(Number);
            const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);
            // For volunteers
            for (const volunteerId of selectedVolunteers) {
              await incrementSessionStats(volunteerId, duration, 'volunteer');
              await updateVolunteerAttendanceStats(volunteerId, 'present');
              // Also create attendance document for single past sessions
              if (initialAppointmentId) {
                await addAttendance({
                  appointmentId: initialAppointmentId,
                  volunteerId: {
                    id: volunteerId,
                    type: 'volunteer'
                  },
                  status: 'present',
                  notes: 'Automatically marked as present for past session',
                  confirmedBy: 'manager'
                });
              }
            }
            // For external group, create attendance record
            if (groupId && initialAppointmentId) {
              await addAttendance({
                appointmentId: initialAppointmentId,
                volunteerId: {
                  id: groupId,
                  type: 'external_group'
                },
                status: 'present',
                notes: 'Automatically marked as present for past session (external group)',
                confirmedBy: 'manager'
              });
            }
            // For residents
            for (const residentId of createdSlot.residentIds) {
              await incrementSessionStats(residentId, duration, 'resident');
            }
          }
        }
      }

      // If this is a recurring session, update the parent slot with its own ID as parentSlotId
      if (isRecurring && recurringPattern) {
        await updateCalendarSlot(newSlotId, {
          recurringPattern: {
            ...recurringPattern,
            parentSlotId: newSlotId
          }
        });

        // Generate and create all recurring instances and their appointments
        const recurringSlots = generateRecurringSlots(createdSlot, recurringPattern, newSlotId);
        for (const slot of recurringSlots) {
          // For recurring instances, don't copy appointmentId from baseSlot
          const slotWithoutAppointmentId: Omit<CalendarSlot, 'id'> = {
            ...slot,
            appointmentId: null // Ensure appointmentId is null for recurring instances initially
          };

          const recurringSlotId = await addCalendarSlot(slotWithoutAppointmentId);

          // Create appointment for recurring slot if it has volunteers
          if (selectedVolunteers.length > 0) {
            const recurringAppointment: Omit<Appointment, 'id'> = {
              calendarSlotId: recurringSlotId,
              residentIds: slot.residentIds,
              volunteerIds: selectedVolunteers.map(id => ({ id, type: 'volunteer' })),
              status: isPastSession ? "completed" : (isOngoingSession ? "inProgress" : "upcoming"),
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
              notes: slot.notes
            };
            const recurringAppointmentId = await addAppointment(recurringAppointment);

            // Update the recurring slot with the appointment ID
            if (recurringAppointmentId) {
              await updateCalendarSlot(recurringSlotId, {
                appointmentId: recurringAppointmentId
              });

              // Engagement tracking: Add to history for each participant
              // For volunteers
              for (const volunteerId of selectedVolunteers) {
                const entry = {
                  appointmentId: recurringAppointmentId,
                  date: slot.date,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  residentIds: slot.residentIds,
                  status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
                };
                await addAppointmentToHistory(volunteerId, entry, 'volunteer');
              }
              // For residents
              for (const residentId of slot.residentIds) {
                const entry = {
                  appointmentId: recurringAppointmentId,
                  date: slot.date,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  volunteerIds: selectedVolunteers.map(id => ({ id, type: 'volunteer' as const })),
                  status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
                };
                await addAppointmentToHistory(residentId, entry, 'resident');
              }

              // For past recurring sessions, automatically create attendance records marked as "Present"
              const isRecurringSlotPast = isSessionInPast(slot.date, slot.startTime);
              if (isRecurringSlotPast && recurringAppointmentId) {
                const volunteerIds = selectedVolunteers.map(id => ({ id, type: 'volunteer' as "volunteer" }));

                // Create attendance records for each volunteer for this recurring appointment
                for (const volunteerId of volunteerIds) {
                  await addAttendance({
                    appointmentId: recurringAppointmentId,
                    volunteerId: {
                      id: volunteerId.id,
                      type: volunteerId.type
                    },
                    status: 'present',
                    notes: 'Automatically marked as present for past recurring session',
                    confirmedBy: 'manager'
                  });
                }
              }
            }
          }
        }
      }

      // Reset form state
      setNewSlot({
        date: formatIsraelTime(addDays(new Date(), 1), 'yyyy-MM-dd'),
        startTime: "09:00",
        endTime: "12:00",
        period: "morning",
        isCustom: false,
        customLabel: null,
        residentIds: [],
        maxCapacity: 1,
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
      // Reset recurring session state
      setIsRecurring(false);
      setRecurringPattern({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [],
        endDate: undefined
      });
      setIsCreateDialogOpen(false);
      toast({
        title: t('messages.sessionCreated'),
        description: t('messages.sessionCreatedDescription'),
        variant: "default"
      });
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: t('messages.error'),
        description: t('messages.createError'),
        variant: "destructive"
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Handle edit session
  const handleEditSession = async () => {
    setIsSavingEdit(true);
    if (!selectedSlot) {
      setIsSavingEdit(false);
      return;
    }

    // Validate time range
    if (selectedSlot.startTime >= selectedSlot.endTime) {
      toast({
        title: t('messages.invalidTimeRange'),
        description: t('messages.invalidTimeRangeDescription'),
        variant: "destructive"
      });
      setIsSavingEdit(false);
      return;
    }

    try {
      // Calculate new status and isOpen based on volunteer count and maxCapacity
      let newStatus = selectedSlot.status;
      let newIsOpen = true;

      // Check if this is a past session
      const sessionTiming = getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime);
      const isPastSession = sessionTiming === 'past';

      // Check if this is an external group session
      const isExternalGroup = selectedSlot.approvedVolunteers.some(v => v.type === 'external_group');

      // Only skip auto-calculation if status is manually set to 'canceled'
      // Allow recalculation for 'full' status when volunteers are removed (but not for past sessions)
      if (selectedSlot.status !== 'canceled') {
        if (isPastSession) {
          // Past sessions should always remain 'full' regardless of volunteer changes
          newStatus = 'full';
          newIsOpen = false;
        } else if (isExternalGroup) {
          // External group sessions are always full
          newStatus = 'full';
          newIsOpen = false;
        } else {
          // For regular upcoming sessions, check volunteer count against max capacity
          const volunteerCount = selectedSlot.approvedVolunteers.filter(v => v.type === 'volunteer').length;
          if (volunteerCount >= (selectedSlot.maxCapacity || 0)) {
            newStatus = 'full';
            newIsOpen = false;
          } else {
            newStatus = 'open';
            newIsOpen = true;
          }
        }
      } else {
        // If status is manually set to 'canceled', keep it closed
        newIsOpen = false;
      }

      // Build updated slot with all editable fields
      const updatedSlot: Partial<CalendarSlotUI> = {
        date: formatIsraelTime(toIsraelTime(selectedSlot.date)),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: newStatus,
        isOpen: newIsOpen,
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

      // Check if time has changed and update appointment history if needed
      const appointment = appointments.find(a => a.calendarSlotId === selectedSlot.id);
      if (appointment) {
        // Get the original slot data to compare time changes
        const originalSlot = slots.find(s => s.id === selectedSlot.id);
        if (originalSlot && (originalSlot.startTime !== selectedSlot.startTime || originalSlot.endTime !== selectedSlot.endTime)) {
          // Time has changed, update appointment history for all participants
          for (const v of selectedSlot.approvedVolunteers) {
            if (v.type === 'volunteer') {
              await updateAppointmentTimeInHistory(v.id, appointment.id, selectedSlot.startTime, selectedSlot.endTime, 'volunteer');
            }
          }
          for (const rId of selectedSlot.residentIds) {
            await updateAppointmentTimeInHistory(rId, appointment.id, selectedSlot.startTime, selectedSlot.endTime, 'resident');
          }

          // For past sessions, update session stats to reflect the new duration
          const sessionTiming = getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime);
          const isPastSession = sessionTiming === 'past';

          if (isPastSession) {
            // Calculate old duration
            const [oldStartHour, oldStartMinute] = originalSlot.startTime.split(':').map(Number);
            const [oldEndHour, oldEndMinute] = originalSlot.endTime.split(':').map(Number);
            const oldDuration = (oldEndHour + oldEndMinute / 60) - (oldStartHour + oldStartMinute / 60);

            // Calculate new duration
            const [newStartHour, newStartMinute] = selectedSlot.startTime.split(':').map(Number);
            const [newEndHour, newEndMinute] = selectedSlot.endTime.split(':').map(Number);
            const newDuration = (newEndHour + newEndMinute / 60) - (newStartHour + newStartMinute / 60);

            // Update stats for all current participants if duration changed
            if (oldDuration !== newDuration) {
              const durationDifference = newDuration - oldDuration;

              // Update volunteer stats (hours only, not sessions)
              for (const v of selectedSlot.approvedVolunteers) {
                if (v.type === 'volunteer') {
                  if (durationDifference > 0) {
                    // Session got longer - increment the difference
                    await incrementHoursOnly(v.id, durationDifference, 'volunteer');
                  } else {
                    // Session got shorter - decrement the difference
                    await decrementHoursOnly(v.id, Math.abs(durationDifference), 'volunteer');
                  }
                }
              }

              // Update resident stats (hours only, not sessions)
              for (const rId of selectedSlot.residentIds) {
                if (durationDifference > 0) {
                  // Session got longer - increment the difference
                  await incrementHoursOnly(rId, durationDifference, 'resident');
                } else {
                  // Session got shorter - decrement the difference
                  await decrementHoursOnly(rId, Math.abs(durationDifference), 'resident');
                }
              }
            }
          }
        }
      }

      // Update appointment (volunteers/residents)
      const hasParticipants = selectedSlot.approvedVolunteers.length > 0;

      if (appointment) {
        if (hasParticipants) {
          // If status is being set to canceled, update both appointment and calendar slot, and delete attendance records
          if (selectedSlot.status === 'canceled') {
            // Reject all volunteer requests for this slot
            const updatedVolunteerRequests = selectedSlot.volunteerRequests.map(vr =>
              vr.status === 'pending' ? { ...vr, status: 'rejected', rejectedReason: 'Appointment canceled', rejectedAt: new Date().toISOString() } : vr
            );
            await updateDoc(doc(db, 'calendar_slots', selectedSlot.id), {
              volunteerRequests: updatedVolunteerRequests
            });

            // Get all attendance records for this appointment
            const attendanceRecords = await getAttendanceByAppointment(appointment.id);

            // Check if this is a past session
            const sessionTiming = getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime);
            const isPastSession = sessionTiming === 'past';

            if (isPastSession) {
              // For past sessions, check attendance records before decrementing stats
              const [startHour, startMinute] = selectedSlot.startTime.split(':').map(Number);
              const [endHour, endMinute] = selectedSlot.endTime.split(':').map(Number);
              const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

              // For each volunteer: check if they have an attendance record, if yes, decrement their stats
              for (const v of selectedSlot.approvedVolunteers) {
                if (v.type === 'volunteer') {
                  const attendanceRecord = await getVolunteerAttendanceRecord(v.id, appointment.id);
                  if (attendanceRecord) {
                    // For all statuses, decrement the attendance status
                    await decrementVolunteerAttendanceStats(v.id, attendanceRecord.status);

                    // Only decrement totalSessions and totalHours for present/late, NOT for absent
                    if (attendanceRecord.status === 'present' || attendanceRecord.status === 'late') {
                      await decrementSessionStats(v.id, duration, 'volunteer');
                    }
                  }
                }
              }

              // For residents: check if at least one volunteer has an attendance record, if yes, decrement all residents' stats
              const hasAnyAttendance = await hasAnyVolunteerAttendanceRecord(appointment.id);
              if (hasAnyAttendance) {
                for (const rId of selectedSlot.residentIds) {
                  await decrementSessionStats(rId, duration, 'resident');
                }
              }
            } else {
              // For future sessions, use the original logic
              if (appointment.status === 'completed') {
                const [startHour, startMinute] = selectedSlot.startTime.split(':').map(Number);
                const [endHour, endMinute] = selectedSlot.endTime.split(':').map(Number);
                const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

                // Decrement engagement stats for volunteers and residents BEFORE deleting attendance records
                for (const v of selectedSlot.approvedVolunteers) {
                  if (v.type === 'volunteer') {
                    const attendanceRecord = await getVolunteerAttendanceRecord(v.id, appointment.id);
                    if (attendanceRecord) {
                      // For all statuses, decrement the attendance status
                      await decrementVolunteerAttendanceStats(v.id, attendanceRecord.status);

                      // Only decrement totalSessions and totalHours for present/late, NOT for absent
                      if (attendanceRecord.status === 'present' || attendanceRecord.status === 'late') {
                        await decrementSessionStats(v.id, duration, 'volunteer');
                      }
                    }
                  }
                }
                for (const rId of selectedSlot.residentIds) {
                  await decrementSessionStats(rId, duration, 'resident');
                }
              }
            }

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

            // Engagement tracking: Always update appointmentHistory status to 'canceled' when session is canceled
            for (const v of selectedSlot.approvedVolunteers) {
              if (v.type === 'volunteer') {
                await updateAppointmentStatusInHistory(v.id, appointment.id, 'canceled', 'volunteer');
              }
            }
            for (const rId of selectedSlot.residentIds) {
              await updateAppointmentStatusInHistory(rId, appointment.id, 'canceled', 'resident');
            }

          } else { // For non-canceled statuses, just update the appointment normally
            await updateAppointment(appointment.id, {
              volunteerIds: selectedSlot.approvedVolunteers,
              residentIds: selectedSlot.residentIds,
              updatedAt: Timestamp.fromDate(new Date()),
              notes: selectedSlot.notes || null
            });
            // Engagement tracking: Update appointmentHistory status for all participants
            // Use the appointment's status, not the slot's status
            const updatedAppointmentStatus = (await getDocs(query(collection(db, 'appointments'), where('calendarSlotId', '==', selectedSlot.id)))).docs[0]?.data()?.status || selectedSlot.status;

            // Find volunteers who were removed from the appointment
            const originalVolunteerIds = appointment.volunteerIds
              .filter(v => v.type === 'volunteer')
              .map(v => v.id);
            const currentVolunteerIds = selectedSlot.approvedVolunteers
              .filter(v => v.type === 'volunteer')
              .map(v => v.id);

            const removedVolunteerIds = originalVolunteerIds.filter(id =>
              !currentVolunteerIds.includes(id)
            );

            // For past sessions, handle volunteer removal logic
            const sessionTiming = getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime);
            const isPastSession = sessionTiming === 'past';

            let shouldDecrementResidents = false;
            let sessionDuration = 0;

            if (isPastSession) {
              // Calculate session duration once
              const [startHour, startMinute] = selectedSlot.startTime.split(":").map(Number);
              const [endHour, endMinute] = selectedSlot.endTime.split(":").map(Number);
              sessionDuration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

              // Check which volunteers being removed have attendance records
              const removedVolunteersWithAttendance = [];
              for (const volunteerId of removedVolunteerIds) {
                const hasAttendance = await hasVolunteerAttendanceRecord(volunteerId, appointment.id);
                if (hasAttendance) {
                  removedVolunteersWithAttendance.push(volunteerId);
                }
              }

              // Check if after removing these volunteers, there will be no volunteers left with attendance
              if (removedVolunteersWithAttendance.length > 0) {
                const currentVolunteerCount = await countVolunteersWithAttendanceRecords(appointment.id);
                shouldDecrementResidents = currentVolunteerCount === removedVolunteersWithAttendance.length;
              }
            }

            // Remove removed volunteers from appointmentHistory
            for (const volunteerId of removedVolunteerIds) {
              await removeAppointmentFromHistory(volunteerId, appointment.id, 'volunteer');

              if (isPastSession) {
                // Get attendance record to know the status before removing
                const attendanceRecord = await getVolunteerAttendanceRecord(volunteerId, appointment.id);
                if (attendanceRecord) {
                  // For all statuses, decrement the attendance status
                  await decrementVolunteerAttendanceStats(volunteerId, attendanceRecord.status);

                  // Only decrement totalSessions and totalHours for present/late, NOT for absent
                  if (attendanceRecord.status === 'present' || attendanceRecord.status === 'late') {
                    await decrementSessionStats(volunteerId, sessionDuration, 'volunteer');
                  }

                  // Remove attendance record
                  await deleteAttendanceByVolunteerAndAppointment(volunteerId, appointment.id);
                }
              }
            }

            // If this was the last set of volunteers with attendance, decrement all residents' stats
            if (isPastSession && shouldDecrementResidents) {
              for (const rId of selectedSlot.residentIds) {
                await decrementSessionStats(rId, sessionDuration, 'resident');
              }
            }

            // Add new volunteers to appointmentHistory
            const newVolunteerIds = currentVolunteerIds.filter(id =>
              !originalVolunteerIds.includes(id)
            );

            for (const volunteerId of newVolunteerIds) {
              const sessionTiming = getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime);
              const isPastSession = sessionTiming === 'past';
              const isOngoingSession = sessionTiming === 'ongoing';

              const entry = {
                appointmentId: appointment.id,
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                residentIds: selectedSlot.residentIds,
                status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
              };
              await addAppointmentToHistory(volunteerId, entry, 'volunteer');

              // For past sessions, check if there are existing volunteers with attendance records
              if (isPastSession) {
                // Check if there were any previous volunteers with attendance records
                const hadPreviousVolunteersWithAttendance = await hasAnyVolunteerAttendanceRecord(appointment.id);

                // Calculate session duration in hours
                const [startHour, startMinute] = selectedSlot.startTime.split(":").map(Number);
                const [endHour, endMinute] = selectedSlot.endTime.split(":").map(Number);
                const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

                // Increment session stats for the new volunteer
                await incrementSessionStats(volunteerId, duration, 'volunteer');

                // Update attendance stats
                await updateVolunteerAttendanceStats(volunteerId, 'present');

                // Create attendance record
                await addAttendance({
                  appointmentId: appointment.id,
                  volunteerId: {
                    id: volunteerId,
                    type: 'volunteer'
                  },
                  status: 'present',
                  notes: 'Automatically marked as present for past session',
                  confirmedBy: 'manager'
                });

                // If there were no previous volunteers with attendance, increment stats for all residents
                if (!hadPreviousVolunteersWithAttendance) {
                  for (const rId of selectedSlot.residentIds) {
                    await incrementSessionStats(rId, duration, 'resident');
                  }
                }
              }
            }

            // Find residents who were removed from the appointment
            const originalResidentIds = appointment.residentIds;
            const currentResidentIds = selectedSlot.residentIds;

            const removedResidentIds = originalResidentIds.filter(id =>
              !currentResidentIds.includes(id)
            );

            // Remove removed residents from appointmentHistory
            for (const residentId of removedResidentIds) {
              await removeAppointmentFromHistory(residentId, appointment.id, 'resident');

              // For past sessions, check if any volunteer has attendance record before decrementing
              const sessionTiming = getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime);
              const isPastSession = sessionTiming === 'past';

              if (isPastSession) {
                // Check if at least one volunteer has an attendance record for this appointment
                const hasAnyAttendance = await hasAnyVolunteerAttendanceRecord(appointment.id);
                if (hasAnyAttendance) {
                  // Calculate session duration in hours
                  const [startHour, startMinute] = selectedSlot.startTime.split(":").map(Number);
                  const [endHour, endMinute] = selectedSlot.endTime.split(":").map(Number);
                  const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

                  // Decrement session stats
                  await decrementSessionStats(residentId, duration, 'resident');
                }
              }
            }

            // Add new residents to appointmentHistory
            const newResidentIds = currentResidentIds.filter(id =>
              !originalResidentIds.includes(id)
            );

            for (const residentId of newResidentIds) {
              const sessionTiming = getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime);
              const isPastSession = sessionTiming === 'past';
              const isOngoingSession = sessionTiming === 'ongoing';

              const entry = {
                appointmentId: appointment.id,
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                volunteerIds: selectedSlot.approvedVolunteers,
                status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
              };
              await addAppointmentToHistory(residentId, entry, 'resident');

              // For past sessions, check if any volunteer has attendance record before incrementing
              if (isPastSession) {
                // Check if at least one volunteer has an attendance record for this appointment
                const hasAnyAttendance = await hasAnyVolunteerAttendanceRecord(appointment.id);
                if (hasAnyAttendance) {
                  // Calculate session duration in hours
                  const [startHour, startMinute] = selectedSlot.startTime.split(":").map(Number);
                  const [endHour, endMinute] = selectedSlot.endTime.split(":").map(Number);
                  const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

                  // Increment session stats
                  await incrementSessionStats(residentId, duration, 'resident');
                }
              }
            }

            // Update appointmentHistory status for current participants
            for (const v of selectedSlot.approvedVolunteers) {
              if (v.type === 'volunteer') {
                await updateAppointmentStatusInHistory(v.id, appointment.id, updatedAppointmentStatus, 'volunteer');
              }
            }
            for (const rId of selectedSlot.residentIds) {
              await updateAppointmentStatusInHistory(rId, appointment.id, updatedAppointmentStatus, 'resident');
            }
            // If status changed to 'completed', update stats
            if ((selectedSlot.status as AppointmentStatus) === 'completed') {
              // Calculate session duration in hours
              const [startHour, startMinute] = selectedSlot.startTime.split(":").map(Number);
              const [endHour, endMinute] = selectedSlot.endTime.split(":").map(Number);
              const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);
              // For volunteers
              for (const v of selectedSlot.approvedVolunteers) {
                if (v.type === 'volunteer') {
                  await incrementSessionStats(v.id, duration, 'volunteer');
                  // Optionally, update attendance stats if attendance info is available
                  // await updateVolunteerAttendanceStats(v.id, 'present');
                }
              }
              // For residents
              for (const rId of selectedSlot.residentIds) {
                await incrementSessionStats(rId, duration, 'resident');
              }
            }

            // Update residents' appointmentHistory with new volunteerIds
            for (const rId of selectedSlot.residentIds) {
              await updateAppointmentVolunteerIdsInHistory(rId, appointment.id, selectedSlot.approvedVolunteers);
            }

            // Update volunteers' appointmentHistory with new residentIds
            for (const v of selectedSlot.approvedVolunteers) {
              if (v.type === 'volunteer') {
                await updateAppointmentResidentIdsInHistory(v.id, appointment.id, selectedSlot.residentIds);
              }
            }
          }
        } else {
          // No more participants, delete appointment
          // Remove all participants from appointmentHistory before deleting the appointment
          for (const v of appointment.volunteerIds) {
            if (v.type === 'volunteer') {
              await removeAppointmentFromHistory(v.id, appointment.id, 'volunteer');
            }
          }
          for (const rId of appointment.residentIds) {
            await removeAppointmentFromHistory(rId, appointment.id, 'resident');
          }

          await deleteAppointment(appointment.id);
          await updateCalendarSlot(selectedSlot.id, { appointmentId: null });
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
        const newAppointmentId = await addAppointment(newAppointment);
        if (newAppointmentId) {
          await updateCalendarSlot(selectedSlot.id, { appointmentId: newAppointmentId });

          // Engagement tracking: Add to history for each participant when creating new appointment
          const sessionTiming = getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime);
          const isPastSession = sessionTiming === 'past';
          const isOngoingSession = sessionTiming === 'ongoing';

          // For volunteers
          for (const v of selectedSlot.approvedVolunteers) {
            if (v.type === 'volunteer') {
              const entry = {
                appointmentId: newAppointmentId,
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                residentIds: selectedSlot.residentIds,
                status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
              };
              await addAppointmentToHistory(v.id, entry, 'volunteer');

              // For past sessions, automatically create attendance records and increment stats for volunteers
              if (isPastSession) {
                // Calculate session duration in hours
                const [startHour, startMinute] = selectedSlot.startTime.split(":").map(Number);
                const [endHour, endMinute] = selectedSlot.endTime.split(":").map(Number);
                const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

                // Increment session stats
                await incrementSessionStats(v.id, duration, 'volunteer');

                // Update attendance stats
                await updateVolunteerAttendanceStats(v.id, 'present');

                // Create attendance record
                await addAttendance({
                  appointmentId: newAppointmentId,
                  volunteerId: {
                    id: v.id,
                    type: 'volunteer'
                  },
                  status: 'present',
                  notes: 'Automatically marked as present for past session',
                  confirmedBy: 'manager'
                });
              }
            }
          }
          // For residents
          for (const rId of selectedSlot.residentIds) {
            const entry = {
              appointmentId: newAppointmentId,
              date: selectedSlot.date,
              startTime: selectedSlot.startTime,
              endTime: selectedSlot.endTime,
              volunteerIds: selectedSlot.approvedVolunteers,
              status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
            };
            await addAppointmentToHistory(rId, entry, 'resident');

            // For past sessions, increment stats since we're creating volunteers with attendance
            if (isPastSession) {
              // Calculate session duration in hours
              const [startHour, startMinute] = selectedSlot.startTime.split(":").map(Number);
              const [endHour, endMinute] = selectedSlot.endTime.split(":").map(Number);
              const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

              // Increment session stats
              await incrementSessionStats(rId, duration, 'resident');
            }
          }

          // Update residents' appointmentHistory with new volunteerIds
          for (const rId of selectedSlot.residentIds) {
            await updateAppointmentVolunteerIdsInHistory(rId, newAppointmentId, selectedSlot.approvedVolunteers);
          }

          // Update volunteers' appointmentHistory with new residentIds
          for (const v of selectedSlot.approvedVolunteers) {
            if (v.type === 'volunteer') {
              await updateAppointmentResidentIdsInHistory(v.id, newAppointmentId, selectedSlot.residentIds);
            }
          }
        }
      }

      toast({
        title: t('messages.sessionUpdated'),
        description: t('messages.sessionUpdatedDescription')
      });

      // Close dialog and reset state
      setIsEditDialogOpen(false);
      setSelectedSlot(null);
      setPendingChanges({});

      // After updating slot and appointment, if slot status is changed from 'canceled' to 'full' or 'open', update appointment status based on time
      if (
        selectedSlot.status !== 'canceled' &&
        appointment &&
        appointment.status === 'canceled'
      ) {
        // Calculate session timing
        const now = new Date();
        const sessionDate = new Date(selectedSlot.date);
        const [startHour, startMinute] = selectedSlot.startTime.split(':').map(Number);
        const [endHour, endMinute] = selectedSlot.endTime.split(':').map(Number);

        const sessionStart = new Date(sessionDate);
        sessionStart.setHours(startHour, startMinute, 0, 0);
        const sessionEnd = new Date(sessionDate);
        sessionEnd.setHours(endHour, endMinute, 0, 0);

        let newAppointmentStatus: AppointmentStatus = 'upcoming';
        if (now < sessionStart) {
          newAppointmentStatus = 'upcoming';
        } else if (now >= sessionStart && now < sessionEnd) {
          newAppointmentStatus = 'inProgress';
        } else if (now >= sessionEnd) {
          newAppointmentStatus = 'completed';
        }

        await updateAppointment(appointment.id, {
          status: newAppointmentStatus,
          updatedAt: Timestamp.fromDate(new Date())
        });

        // Special handling for past sessions: if changing from 'canceled' to 'full', add back stats and create attendance records
        const isPastSession = isSessionEndInPast(selectedSlot.date, selectedSlot.endTime);
        if (isPastSession && newAppointmentStatus === 'completed') {
          const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

          // Add back session stats for all volunteers and residents
          for (const v of selectedSlot.approvedVolunteers) {
            if (v.type === 'volunteer') {
              await incrementSessionStats(v.id, duration, 'volunteer');
              await updateVolunteerAttendanceStats(v.id, 'present');
              // Create attendance record for this volunteer
              await addAttendance({
                appointmentId: appointment.id,
                volunteerId: {
                  id: v.id,
                  type: 'volunteer'
                },
                status: 'present',
                notes: 'Automatically marked as present for past session',
                confirmedBy: 'manager'
              });
            }
            if (v.type === 'external_group') {
              // Create attendance record for external group
              await addAttendance({
                appointmentId: appointment.id,
                volunteerId: {
                  id: v.id,
                  type: 'external_group'
                },
                status: 'present',
                notes: 'Automatically marked as present for past session (external group, restored from canceled)',
                confirmedBy: 'manager'
              });
            }
          }
          // For residents
          for (const rId of selectedSlot.residentIds) {
            await incrementSessionStats(rId, duration, 'resident');
          }
        } else if (newAppointmentStatus === 'completed') {
          // For non-past sessions that are now completed, use the existing logic
          const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);
          // For volunteers
          for (const v of selectedSlot.approvedVolunteers) {
            if (v.type === 'volunteer') {
              await incrementSessionStats(v.id, duration, 'volunteer');
              await updateVolunteerAttendanceStats(v.id, 'present');
              // Recreate attendance record
              await addAttendance({
                appointmentId: appointment.id,
                volunteerId: {
                  id: v.id,
                  type: 'volunteer'
                },
                status: 'present',
                notes: 'Automatically marked as present for past session',
                confirmedBy: 'manager'
              });
            }
            if (v.type === 'external_group') {
              // Recreate attendance record for external group
              await addAttendance({
                appointmentId: appointment.id,
                volunteerId: {
                  id: v.id,
                  type: 'external_group'
                },
                status: 'present',
                notes: 'Automatically marked as present for past session (external group)',
                confirmedBy: 'manager'
              });
            }
          }
          // For residents
          for (const rId of selectedSlot.residentIds) {
            await incrementSessionStats(rId, duration, 'resident');
          }
        }

        // Update appointmentHistory for all participants using the new status
        for (const v of selectedSlot.approvedVolunteers) {
          if (v.type === 'volunteer') {
            await updateAppointmentStatusInHistory(v.id, appointment.id, newAppointmentStatus, 'volunteer');
          }
        }
        for (const rId of selectedSlot.residentIds) {
          await updateAppointmentStatusInHistory(rId, appointment.id, newAppointmentStatus, 'resident');
        }

        // Show specific toast for past session restoration
        if (isPastSession && newAppointmentStatus === 'completed') {
          toast({
            title: t('messages.pastSessionRestored'),
            description: t('messages.pastSessionRestoredDescription')
          });
        }
      }

      // Find the external group for this slot
      const externalAppointment = appointments.find(a => a.calendarSlotId === selectedSlot.id);
      const externalGroupObj = externalAppointment && externalGroups.find(g => g.appointmentId === externalAppointment.id);
      if (externalGroupObj && editExternalGroup) {
        // Only update if something changed
        const changed = Object.keys(editExternalGroup).some(key => editExternalGroup[key] !== externalGroupObj[key]);
        if (changed) {
          await updateExternalGroup(externalGroupObj.id, editExternalGroup);
        }
      }

      // Show success toast
      toast({
        title: t('messages.sessionUpdated'),
        description: t('messages.sessionUpdatedDescription')
      });

      setIsSavingEdit(false);
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: t('messages.error'),
        description: t('messages.updateError'),
        variant: "destructive"
      });
      setIsSavingEdit(false);
    }
  };

  // Add this before the return statement
  const handleRejectConfirm = async () => {
    if (!pendingRejectAction) return;

    const { sessionId, volunteerId } = pendingRejectAction;
    const actionKey = `${sessionId}-${volunteerId}`;

    setPendingVolunteerAction(prev => ({ ...prev, [actionKey]: true }));
    setFadingVolunteers(prev => ({ ...prev, [actionKey]: true }));

    try {
      const session = slots.find(s => s.id === sessionId);
      if (!session) return;

      const updatedVolunteerRequests = session.volunteerRequests.map(v =>
        v.volunteerId === volunteerId && v.status === 'pending'
          ? {
            ...v,
            status: 'rejected' as VolunteerRequestStatus,
            rejectedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
            rejectedReason: rejectReason
          }
          : v
      );

      // Update the slot
      const updateData: Partial<CalendarSlotUI> = {
        volunteerRequests: updatedVolunteerRequests
      };
      await updateCalendarSlot(sessionId, updateData);

      // Update selected session if it's the one being modified
      if (selectedSlot?.id === sessionId) {
        setSelectedSlot(prev => {
          if (!prev) return null;
          return {
            ...prev,
            volunteerRequests: updatedVolunteerRequests
          };
        });
      }

      // Update pending requests view if active
      if (isPendingViewActive) {
        setPendingRequests(prev =>
          prev.filter(session =>
            session.id !== sessionId ||
            session.volunteerRequests.some(v => v.status === 'pending')
          )
        );
      }

      toast({
        title: t('messages.volunteerRequestRejected'),
        description: t('messages.volunteerRequestRejectedDescription')
      });
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.errorProcessingRequest'),
        variant: "destructive"
      });
    } finally {
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
      setIsRejectDialogOpen(false);
      setRejectReason("");
      setPendingRejectAction(null);
    }
  };

  // Handle volunteer request actions
  const handleVolunteerRequest = async (
    sessionId: string,
    volunteerId: string,
    action: 'approve' | 'reject'
  ) => {
    // If rejecting, open the dialog first
    if (!isApproveAction(action)) {
      setPendingRejectAction({ sessionId, volunteerId });
      setIsRejectDialogOpen(true);
      return;
    }

    // Handle approve action
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
          title: t('messages.cannotProcessRequest'),
          description: t('messages.cannotProcessPastSessions'),
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

      // Update the status of the volunteer request instead of removing it
      const updatedVolunteerRequests = session.volunteerRequests.map(v =>
        v.volunteerId === volunteerId
          ? {
            ...v,
            status: isApproveAction(action) ? 'approved' as VolunteerRequestStatus : 'rejected' as VolunteerRequestStatus,
            approvedAt: isApproveAction(action) ? Timestamp.fromDate(new Date()).toDate().toISOString() : v.approvedAt,
            rejectedAt: !isApproveAction(action) ? Timestamp.fromDate(new Date()).toDate().toISOString() : v.rejectedAt,
            rejectedReason: !isApproveAction(action) ? 'Rejected by manager' : v.rejectedReason,
            assignedResidentId: v.assignedResidentId
          }
          : v
      );
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
          const newAppointmentId = await addAppointment(newAppointment);
          if (newAppointmentId) {
            await updateCalendarSlot(sessionId, { appointmentId: newAppointmentId });

            // Engagement tracking: Add to history for the approved volunteer
            const sessionTiming = getSessionTiming(session.date, session.startTime, session.endTime);
            const isPastSession = sessionTiming === 'past';
            const isOngoingSession = sessionTiming === 'ongoing';

            const entry = {
              appointmentId: newAppointmentId,
              date: session.date,
              startTime: session.startTime,
              endTime: session.endTime,
              residentIds: session.residentIds,
              status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
            };
            await addAppointmentToHistory(volunteerId, entry, 'volunteer');

            // Also add to history for residents
            for (const rId of session.residentIds) {
              const residentEntry = {
                appointmentId: newAppointmentId,
                date: session.date,
                startTime: session.startTime,
                endTime: session.endTime,
                volunteerIds: [newParticipant],
                status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
              };
              await addAppointmentToHistory(rId, residentEntry, 'resident');
            }

            // Update residents' appointmentHistory with new volunteerIds
            for (const rId of session.residentIds) {
              await updateAppointmentVolunteerIdsInHistory(rId, newAppointmentId, updatedApprovedVolunteers);
            }

            // Update volunteers' appointmentHistory with new residentIds
            for (const v of updatedApprovedVolunteers) {
              if (v.type === 'volunteer') {
                await updateAppointmentResidentIdsInHistory(v.id, newAppointmentId, session.residentIds);
              }
            }
          }
        } else {
          // Update existing appointment
          await updateAppointment(appointment.id, {
            volunteerIds: updatedApprovedVolunteers,
            updatedAt: Timestamp.fromDate(new Date())
          });

          // Add the newly approved volunteer to their appointmentHistory
          const sessionTiming = getSessionTiming(session.date, session.startTime, session.endTime);
          const isPastSession = sessionTiming === 'past';
          const isOngoingSession = sessionTiming === 'ongoing';

          const entry = {
            appointmentId: appointment.id,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            residentIds: session.residentIds,
            status: (isPastSession ? 'completed' : (isOngoingSession ? 'inProgress' : 'upcoming')) as AppointmentStatus,
          };
          await addAppointmentToHistory(volunteerId, entry, 'volunteer');

          // Update volunteers' appointmentHistory with new residentIds
          for (const v of updatedApprovedVolunteers) {
            if (v.type === 'volunteer') {
              await updateAppointmentResidentIdsInHistory(v.id, appointment.id, session.residentIds);
            }
          }

          // Update residents' appointmentHistory with new volunteerIds
          for (const rId of session.residentIds) {
            await updateAppointmentVolunteerIdsInHistory(rId, appointment.id, updatedApprovedVolunteers);
          }
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
        status: updatedStatus,
        isOpen: updatedStatus !== 'full' && updatedStatus !== 'canceled'
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
            status: updatedStatus,
            isOpen: updatedStatus !== 'full' && updatedStatus !== 'canceled'
          };
        });
      }

      // Update pending requests view if active
      if (isPendingViewActive) {
        setPendingRequests(prev =>
          prev.filter(session =>
            session.id !== sessionId ||
            session.volunteerRequests.some(v => v.status === 'pending')
          )
        );
      }

      toast({
        title: action === 'approve' ? t('messages.volunteerApproved') : t('messages.volunteerRejected'),
        description: action === 'approve'
          ? t('messages.volunteerApprovedDesc')
          : t('messages.volunteerRejectedDesc')
      });
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.errorProcessingRequest'),
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
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-100 p-3 text-center">
              <h3 className="text-lg font-medium">
                {t('pendingRequests.title')}
              </h3>
              <p className="text-sm text-slate-600">
                {t('pendingRequests.description' + (pendingRequests.length === 1 ? '' : '_plural'), { count: pendingRequests.length })}
              </p>
            </div>
            <div className="divide-y divide-slate-300 border-t border-slate-300">
              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-slate-500 mb-4"><span dir={dir}>{t('pendingRequests.noRequests')}</span></div>
                  <Button
                    variant="outline"
                    onClick={() => setIsPendingViewActive(false)}
                  >
                    {t('navigation.backToCalendar')}
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
                      className="p-4 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSlot(session);
                        setIsPendingRequestsDialogOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-medium">
                            {t(`calendar.weekDays.${format(new Date(session.date), 'EEEE').toLowerCase()}`)}, {t(`calendar.months.${format(new Date(session.date), 'MMMM').toLowerCase()}`)} {format(new Date(session.date), 'd')}, {format(new Date(session.date), 'yyyy')}
                          </h4>
                          <div className={cn("mt-1 flex", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <div className="flex items-center text-slate-600">
                              <Clock className={cn("h-4 w-4 mr-2")} />
                              <span>{session.startTime} - {session.endTime}</span>
                            </div>
                            <div className="flex items-center text-slate-600">
                              <Users className={cn("h-4 w-4 mr-2")} />
                              <span>{t('calendar.filled', { current: getVolunteerCount(session), capacity: getCapacityDisplay(session) })}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-amber-300 border-amber-600 text-amber-800 hover:bg-amber-400/75 hover:border-amber-700 hover:text-amber-800"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedSlot(session);
                            setIsPendingRequestsDialogOpen(true);
                          }}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {t('pendingRequests.pendingCount' + (session.volunteerRequests.filter(v => v.status === "pending").length === 1 ? '' : '_plural'), { count: session.volunteerRequests.filter(v => v.status === "pending").length })}
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
                {[t('calendar.weekDays.sun'), t('calendar.weekDays.mon'), t('calendar.weekDays.tue'), t('calendar.weekDays.wed'), t('calendar.weekDays.thu'), t('calendar.weekDays.fri'), t('calendar.weekDays.sat')].map(day => (
                  <div key={day} className="text-center font-semibold text-slate-600 py-2 text-sm">
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
                            <Badge variant="outline" className="hover:bg-blue-100 hover:border-blue-500 hover:text-blue-800 text-xs font-normal px-1.5 py-0.5 bg-blue-50 border-blue-400 text-blue-800" dir={dir}>
                              {t('calendar.sessionCount', { count: sessionsForDay.length })}
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
                                    ? "bg-amber-100 border-amber-500 hover:bg-amber-200 hover:border-amber-600"
                                    : session.status === "canceled"
                                      ? "bg-red-100 border-red-500 hover:bg-red-200 hover:border-red-600"
                                      : session.status === "open"
                                        ? "bg-blue-100 border-blue-500 hover:bg-blue-200 hover:border-blue-600"
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
                                    <span>{getVolunteerCount(session)}/{getCapacityDisplay(session)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {sessionsForDay.length > 3 && (
                            <div className="text-xs text-center mt-1 text-slate-500">
                              +{sessionsForDay.length - 3} {t('badges.more')}
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
                            "text-center p-2 rounded-t-lg font-medium",
                            isCurrentDate ? "bg-primary text-white border border-black" : "bg-slate-100 text-slate-700 border border-slate-300 border-b-slate-300"
                          )}
                        >
                          <div>{t(`calendar.weekDays.${format(date, 'EEE').toLowerCase()}`)}</div>
                          <div className={isCurrentDate ? "text-white" : "text-slate-900"}>
                            {format(date, 'd')}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex-1 border border-slate-300 border-t-0 rounded-b-lg p-3 space-y-2 overflow-y-auto min-h-[392px]",
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
                                    ? "bg-amber-100 border-amber-500 hover:bg-amber-200 hover:border-amber-600"
                                    : session.status === "canceled"
                                      ? "bg-red-100 border-red-500 hover:bg-red-200 hover:border-red-600"
                                      : session.status === "open"
                                        ? "bg-blue-100 border-blue-500 hover:bg-blue-200 hover:border-blue-600"
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
                                    <span>{getVolunteerCount(session)}/{getCapacityDisplay(session)}</span>
                                  </div>
                                  {session.isCustom && (
                                    <Badge variant="outline" className="bg-gray-100 border-gray-500 hover:bg-gray-200 hover:border-gray-600 my-[3px]">
                                      {t('badges.custom')}
                                    </Badge>
                                  )}
                                  {session.volunteerRequests.some(v => v.status === "pending") && !isSlotInPast(session) && (
                                    <Badge
                                      variant="outline"
                                      className="h-6 px-2 mt-1 bg-amber-300 border-amber-600 text-amber-800 hover:bg-amber-400/75 hover:border-amber-700 hover:text-amber-800"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setSelectedSlot(session);
                                        setIsPendingRequestsDialogOpen(true);
                                      }}
                                      dir={dir}
                                    >
                                      <AlertCircle className={cn("h-3 w-3 inline", isRTL ? "ml-1" : "mr-1")} />
                                      {t('badges.pendingRequest', { count: session.volunteerRequests.filter(v => v.status === "pending").length })}
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
                    {t(`calendar.weekDays.${formatIsraelTime(selectedDate, 'EEEE').toLowerCase()}`)}, {t(`calendar.months.${formatIsraelTime(selectedDate, 'MMMM').toLowerCase()}`)} {formatIsraelTime(selectedDate, 'd')}, {formatIsraelTime(selectedDate, 'yyyy')}
                  </h3>
                </div>

                <div className="divide-y divide-slate-300">
                  {(() => {
                    const dateStr = formatIsraelTime(selectedDate, 'yyyy-MM-dd');
                    const sessionsForDay = filteredSessions.filter(s => s.date === dateStr);

                    return sessionsForDay.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        <span dir={dir}>{t('calendar.noSessions')}</span>
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
                                      <span>{getVolunteerCount(session)}/{getCapacityDisplay(session)}</span>
                                    </div>

                                    {session.isCustom && (
                                      <Badge variant="outline" className="bg-gray-100 border-gray-500 hover:bg-gray-200 hover:border-gray-600">
                                        {t('badges.custom')}
                                      </Badge>
                                    )}

                                    <Badge
                                      className={cn(
                                        "border px-2 py-1 text-s transition-colors",
                                        session.status === "full"
                                          ? "bg-amber-100 border-amber-600 text-amber-800 hover:bg-amber-200 hover:border-amber-700 hover:text-amber-800"
                                          : session.status === "canceled"
                                            ? "bg-red-100 border-red-400 text-red-800 hover:bg-red-200 hover:border-red-500 hover:text-red-800"
                                            : "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200 hover:border-blue-500 hover:text-blue-800"
                                      )}
                                    >
                                      {t(`session.status.${session.status}`)}
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
                                    className="bg-amber-300 border-amber-600 text-amber-800 hover:bg-amber-400/75 hover:border-amber-700 hover:text-amber-800"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setSelectedSlot(session);
                                      setIsDaySessionsDialogOpen(false);
                                      setIsPendingRequestsDialogOpen(true);
                                    }}
                                    dir={dir}
                                  >
                                    <AlertCircle className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} />
                                    {t('pendingRequests.pendingCount' + (session.volunteerRequests.filter(v => v.status === "pending").length === 1 ? '' : '_plural'), { count: session.volunteerRequests.filter(v => v.status === "pending").length })}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </>
                    );
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
        title: t('messages.error'),
        description: error?.message || t('messages.errorDescription'),
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

      // Check if this is a past session (end time has passed)
      const isPastSession = isSessionEndInPast(selectedSlot.date, selectedSlot.endTime);

      // If it's a past session, only handle attendance records cleanup
      // Stats should have already been decremented when the session was canceled
      if (isPastSession && appointment) {
        // Get attendance records for this appointment
        const attendanceRecords = await getAttendanceByAppointment(appointment.id);

        // Remove attendance records (stats were already decremented during cancellation)
        for (const attendanceRecord of attendanceRecords) {
          if (attendanceRecord.volunteerId.type === 'volunteer') {
            // Delete the attendance record only - stats already handled during cancellation
            await deleteAttendance(attendanceRecord.id);
          }
        }
      }

      // Delete in parallel: external group first (if exists), then appointment, then calendar slot
      await Promise.all([
        // Delete external group if exists
        externalGroup ? deleteDoc(doc(db, 'external_groups', externalGroup.id)) : Promise.resolve(),
        // Delete appointment if exists
        appointment ? deleteAppointment(appointment.id) : Promise.resolve(),
        // Delete calendar slot
        deleteDoc(doc(db, 'calendar_slots', selectedSlot.id))
      ]);

      // Remove from appointmentHistory if canceled
      if (appointment && appointment.status === 'canceled') {
        for (const v of appointment.volunteerIds) {
          if (v.type === 'volunteer') {
            await removeAppointmentFromHistory(v.id, appointment.id, 'volunteer');
          }
        }
        for (const rId of appointment.residentIds) {
          await removeAppointmentFromHistory(rId, appointment.id, 'resident');
        }
      }

      toast({
        title: t('messages.sessionDeleted'),
        description: t('messages.sessionDeletedDescription')
      });

      // Close dialogs and reset state
      setIsDeleteDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: t('messages.error'),
        description: t('messages.deleteError'),
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Update the recurring pattern handlers
  const handleFrequencyChange = (value: string) => {
    setRecurringPattern(prev => ({
      ...prev,
      frequency: value as RecurrenceFrequency
    }));
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecurringPattern(prev => ({
      ...prev,
      interval: parseInt(e.target.value) || 1
    }));
  };

  const handleDayToggle = (index: number) => {
    setRecurringPattern(prev => {
      const days = prev.daysOfWeek || [];
      return {
        ...prev,
        daysOfWeek: days.includes(index)
          ? days.filter(d => d !== index)
          : [...days, index]
      };
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecurringPattern(prev => ({
      ...prev,
      endDate: e.target.value || undefined
    }));
  };

  // Add this function to handle deleting all recurring sessions
  const handleDeleteRecurringSessions = async () => {
    if (!selectedSlot || !selectedSlot.recurringPattern?.parentSlotId) return;
    // Open the confirmation dialog instead of deleting directly
    setIsDeleteRecurringDialogOpen(true);
  };

  // Add this function to confirm and execute the deletion of future recurring sessions
  const confirmDeleteRecurringSessions = async () => {
    if (!selectedSlot || !selectedSlot.recurringPattern?.parentSlotId) return;
    setIsDeleting(true); // Reuse the existing isDeleting state

    try {
      const parentSlotId = selectedSlot.recurringPattern.parentSlotId;
      const selectedSlotDate = new Date(selectedSlot.date);

      // Find all recurring sessions associated with the parent slot
      const recurringSessionsQuery = query(
        collection(db, 'calendar_slots'),
        where('recurringPattern.parentSlotId', '==', parentSlotId)
      );
      const recurringSessionsSnapshot = await getDocs(recurringSessionsQuery);

      const futureRecurringSessions = recurringSessionsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as CalendarSlot }))
        .filter(session => {
          const sessionDate = new Date(session.date);
          // Compare dates to find sessions strictly after the selected one
          return sessionDate > selectedSlotDate;
        });

      const sessionIdsToDelete = futureRecurringSessions.map(session => session.id);
      const appointmentIdsToDelete: string[] = [];
      const attendanceIdsToDelete: string[] = [];

      // Find associated appointments and attendance records
      if (sessionIdsToDelete.length > 0) {
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('calendarSlotId', 'in', sessionIdsToDelete)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);

        appointmentsSnapshot.docs.forEach(doc => {
          const appointment = { id: doc.id, ...doc.data() as Appointment };
          appointmentIdsToDelete.push(appointment.id);
        });

        // Remove from appointmentHistory for all volunteers and residents
        for (const doc of appointmentsSnapshot.docs) {
          const appointment = { id: doc.id, ...doc.data() as Appointment };
          // For volunteers
          for (const v of appointment.volunteerIds) {
            if (v.type === 'volunteer') {
              await removeAppointmentFromHistory(v.id, appointment.id, 'volunteer');
            }
          }
          // For residents
          for (const rId of appointment.residentIds) {
            await removeAppointmentFromHistory(rId, appointment.id, 'resident');
          }
        }

        if (appointmentIdsToDelete.length > 0) {
          const attendanceQuery = query(
            collection(db, 'attendance'),
            where('appointmentId', 'in', appointmentIdsToDelete)
          );
          const attendanceSnapshot = await getDocs(attendanceQuery);
          attendanceSnapshot.docs.forEach(doc => attendanceIdsToDelete.push(doc.id));
        }
      }

      // Delete all documents in parallel
      await Promise.all([
        ...sessionIdsToDelete.map(id => deleteDoc(doc(db, 'calendar_slots', id))),
        ...appointmentIdsToDelete.map(id => deleteDoc(doc(db, 'appointments', id))),
        ...attendanceIdsToDelete.map(id => deleteDoc(doc(db, 'attendance', id)))
      ]);

      toast({
        title: t('messages.recurringSessionsDeleted'),
        description: t('messages.recurringSessionsDeletedDescription')
      });

      // Close dialogs and reset state
      setIsDeleteRecurringDialogOpen(false); // Close the recurring delete dialog
      setIsEditDialogOpen(false); // Close the edit dialog
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error deleting recurring sessions:', error);
      toast({
        title: t('messages.error'),
        description: t('messages.deleteRecurringError'),
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Add state for editing external group details
  const [editExternalGroup, setEditExternalGroup] = useState(null);

  // 2. When Edit dialog opens and external group is present, initialize editExternalGroup
  useEffect(() => {
    if (isEditDialogOpen && selectedSlot && selectedSlot.approvedVolunteers.some(v => v.type === 'external_group')) {
      const appointment = appointments.find(a => a.calendarSlotId === selectedSlot.id);
      const externalGroup = appointment && externalGroups.find(g => g.appointmentId === appointment.id);
      if (externalGroup) {
        setEditExternalGroup({ ...externalGroup });
      } else {
        setEditExternalGroup(null);
      }
    } else if (!isEditDialogOpen) {
      setEditExternalGroup(null);
    }
  }, [isEditDialogOpen, selectedSlot, appointments, externalGroups]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "OPEN_CREATE_SESSION_DIALOG") {
        setIsCreateDialogOpen(true);
      }
      if (event.data?.type === "OPEN_EDIT_SESSION_DIALOG") {
        const sessionId = event.data.sessionId;
        const session = slots.find(s => s.id === sessionId);
        if (session) {
          setSelectedSlot(session);
          setIsEditDialogOpen(true);
        }
      }
      if (event.data?.type === "OPEN_PENDING_REQUESTS_DIALOG") {
        const sessionId = event.data.sessionId;
        const session = slots.find(s => s.id === sessionId);
        if (session && session.volunteerRequests.some(v => v.status === "pending")) {
          setSelectedSlot(session);
          setIsPendingRequestsDialogOpen(true);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [slots]);

  // Add this state near the other state declarations
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Handle messages from dashboard
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "OPEN_EDIT_SESSION_DIALOG") {
        const sessionId = event.data.sessionId;
        const session = slots.find(s => s.id === sessionId);
        if (session) {
          setSelectedSlot(session);
          setIsEditDialogOpen(true);
        }
      }
      if (event.data?.type === "OPEN_PENDING_REQUESTS_DIALOG") {
        const sessionId = event.data.sessionId;
        const session = slots.find(s => s.id === sessionId);
        if (session && session.volunteerRequests.some(v => v.status === "pending")) {
          setSelectedSlot(session);
          setIsPendingRequestsDialogOpen(true);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [slots]);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-300 shadow-sm z-10 h-[69px]">
        <div className="px-6 h-full flex items-center justify-between" dir={dir}>
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
            <div className={cn("flex items-center space-x-3", isRTL && "space-x-reverse")}>
              <CalendarIcon className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block whitespace-nowrap">{t('page.title')}</h1>
            </div>
          </div>

          {/* Center section - Date selector with conditional width */}
          {!isPendingViewActive && (
            <div className={cn(
              "flex items-center justify-center",
              calendarView === "day" ? "flex-1" : "w-[450px]"
            )}>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={isRTL ? goToNext : goToPrevious}
                  className="hover:bg-slate-100 w-8 h-8 border-slate-300"
                >
                  {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>

                <h2 className={cn(
                  "text-xl font-semibold text-slate-900 text-center px-4",
                  calendarView === "month" && "min-w-[200px]",
                  calendarView === "week" && "min-w-[240px]",
                  calendarView === "day" && "min-w-[320px]"
                )}>
                  {getViewTitle()}
                </h2>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={isRTL ? goToPrevious : goToNext}
                  className="hover:bg-slate-100 w-8 h-8 border-slate-300"
                >
                  {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(new Date());
                  }}
                  className={cn(
                    "hover:bg-slate-100 border-slate-300",
                    isRTL ? "mr-4" : "ml-4"
                  )}
                >
                  {t('navigation.today')}
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
                      dir={dir}
                    >
                      <TabsList className="grid w-[400px] grid-cols-3 bg-slate-100 p-1">
                        <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-1" dir={dir}>
                          <Grid className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} />
                          <span className="hidden sm:inline">{t('views.month')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-1" dir={dir}>
                          <Columns className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} />
                          <span className="hidden sm:inline">{t('views.week')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="day" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-1" dir={dir}>
                          <ListOrdered className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} />
                          <span className="hidden sm:inline">{t('views.day')}</span>
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
                        <SelectTrigger className="w-[140px] h-9 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0" dir={dir}>
                          <SelectValue placeholder={t('filters.statusFilter')} />
                        </SelectTrigger>
                        <SelectContent dir={dir}>
                          <SelectItem value="all">{t('filters.allSessions')}</SelectItem>
                          <SelectItem value="open">{t('filters.open')}</SelectItem>
                          <SelectItem value="full">{t('filters.full')}</SelectItem>
                          <SelectItem value="canceled">{t('filters.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* New Session Button */}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Plus className={cn("h-4 w-4")} />
                        {t('actions.newSession')}
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
                          ? "hover:bg-slate-100 border-slate-300"
                          : "bg-amber-500 border-amber-500 hover:bg-amber-500/90 text-white hover:text-white"
                      )}
                      onClick={() => {
                        setIsPendingViewActive(!isPendingViewActive);
                        if (!isPendingViewActive) {
                          setCalendarView("month"); // Reset to month view
                        }
                      }}
                    >
                      {isPendingViewActive ? (
                        <ArrowLeft className={cn(
                          "h-6 w-6",
                          "text-black"
                        )} />
                      ) : (
                        <BookText className={cn(
                          "h-6 w-6",
                          "text-white"
                        )} />
                      )}
                      {isPendingViewActive ? t('navigation.backToCalendar') : t('actions.pending')}
                      {!isPendingViewActive && (
                        <Badge className={cn("h-5 w-5 rounded-full p-0 flex items-center justify-center bg-white text-amber-600 hover:bg-white")}>
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
            maxCapacity: 1,
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
          // Reset recurring session state when closing
          setIsRecurring(false);
          setRecurringPattern({
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: [],
            endDate: undefined
          });
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col" dir={dir}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={dir}>
            <DialogTitle className="text-slate-900">{t('dialogs.createSession.title')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('dialogs.createSession.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
            <form onSubmit={handleCreateSession} className="space-y-6">
              {/* Session Details Card (restyled) */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('forms.sessionDetails.title')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={cn(
                    "space-y-2",
                    getSessionTiming(newSlot.date || '', newSlot.startTime || '', newSlot.endTime || '') === 'past' ? "md:col-span-2" : ""
                  )}>
                    <Label htmlFor="date" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.date')} *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSlot.date}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                      required
                      className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  {/* Max Capacity field - only show for non-past sessions */}
                  {getSessionTiming(newSlot.date || '', newSlot.startTime || '', newSlot.endTime || '') !== 'past' && (
                    <div className="space-y-2">
                      <Label htmlFor="maxCapacity" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.maxCapacity')} *</Label>
                      <Input
                        id="maxCapacity"
                        type="number"
                        min="1"
                        value={newSlot.maxCapacity}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                        required
                        disabled={!!newSlot.externalGroup}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.startTime')} *</Label>
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
                      className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.endTime')} *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewSlot(prev => ({ ...prev, endTime: value }));
                        if (newSlot.startTime && newSlot.startTime >= value) {
                          setTimeError(t('messages.invalidTimeRangeDescription'));
                        } else {
                          setTimeError("");
                        }
                      }}
                      required
                      disabled={!newSlot.isCustom && newSlot.period !== null}
                      className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  {/* Period always spans both columns, but only show if not custom */}
                  {!newSlot.isCustom && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="period" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.period')}</Label>
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
                        dir={dir}
                      >
                        <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={dir}>
                          <SelectValue placeholder={t('forms.sessionDetails.period')} />
                        </SelectTrigger>
                        <SelectContent dir={dir}>
                          <SelectItem value="morning">{t('forms.sessionDetails.periods.morning')} (9:00 - 12:00)</SelectItem>
                          <SelectItem value="afternoon">{t('forms.sessionDetails.periods.afternoon')} (13:00 - 16:00)</SelectItem>
                          <SelectItem value="evening">{t('forms.sessionDetails.periods.evening')} (16:00 - 18:00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {newSlot.isCustom && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="customLabel" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.customLabel')}</Label>
                      <Input
                        id="customLabel"
                        value={newSlot.customLabel || ""}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, customLabel: e.target.value }))}
                        placeholder={t('forms.sessionDetails.customSessionPlaceholder')}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  )}
                </div>
                {timeError && (
                  <div className="text-sm text-red-500 mt-1">{timeError}</div>
                )}
              </div>

              {/* Session Type Card (restyled) */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('forms.sessionType.title')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="isCustom" className="text-base font-medium">{t('forms.sessionDetails.isCustom')}</Label>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">{t('forms.sessionDetails.customSessionDescription')}</p>
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
                  </div>
                  {!newSlot.externalGroup && !isSessionInPast(newSlot.date, newSlot.startTime) && (
                    <>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="recurring" className="text-base font-medium">{t('forms.recurring.title')}</Label>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">{t('forms.recurring.description')}</p>
                          <Switch
                            id="recurring"
                            checked={isRecurring}
                            onCheckedChange={(checked) => {
                              setIsRecurring(checked as boolean);
                              if (checked) {
                                // Set default end date to one month from start date
                                const defaultEndDate = new Date(newSlot.date);
                                defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
                                setRecurringPattern(prev => ({
                                  ...prev,
                                  endDate: formatIsraelTime(defaultEndDate)
                                }));
                              }
                            }}
                          />
                        </div>
                      </div>
                      {isRecurring && (
                        <div className={cn("space-y-4 md:col-span-2 md:px-6 md:border-blue-200", isRTL ? "md:border-r-2" : "md:border-l-2")}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="frequency">{t('forms.recurring.frequency')}</Label>
                              <Select
                                value={recurringPattern.frequency}
                                onValueChange={handleFrequencyChange}
                              >
                                <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                                  <SelectValue placeholder={t('forms.recurring.frequency')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">{t('forms.recurring.frequencies.daily')}</SelectItem>
                                  <SelectItem value="weekly">{t('forms.recurring.frequencies.weekly')}</SelectItem>
                                  <SelectItem value="monthly">{t('forms.recurring.frequencies.monthly')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="interval">{t('forms.recurring.interval')}</Label>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  id="interval"
                                  min={1}
                                  value={recurringPattern.interval}
                                  onChange={handleIntervalChange}
                                  className="w-20 h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                                <span className="text-sm text-slate-500">
                                  {recurringPattern.frequency === 'daily' ? t('forms.recurring.units.days') :
                                    recurringPattern.frequency === 'weekly' ? t('forms.recurring.units.weeks') : t('forms.recurring.units.months')}
                                </span>
                              </div>
                            </div>
                          </div>
                          {recurringPattern.frequency === 'weekly' && (
                            <div className="space-y-2">
                              <Label>{t('forms.recurring.daysOfWeek')}</Label>
                              <div className="flex gap-0.5 justify-between">
                                {[t('calendar.weekDays.sun'), t('calendar.weekDays.mon'), t('calendar.weekDays.tue'), t('calendar.weekDays.wed'), t('calendar.weekDays.thu'), t('calendar.weekDays.fri'), t('calendar.weekDays.sat')].map((day, index) => (
                                  <Button
                                    key={day}
                                    variant={recurringPattern.daysOfWeek?.includes(index) ? "default" : "outline"}
                                    type="button"
                                    className="min-w-[52px] px-2 py-0.5 text-base font-normal h-9"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDayToggle(index);
                                    }}
                                  >
                                    {day}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="endDate">{t('forms.recurring.endDate')}</Label>
                            <Input
                              type="date"
                              id="endDate"
                              value={recurringPattern.endDate || ''}
                              onChange={(e) => {
                                const selectedDate = e.target.value;
                                const startDate = new Date(newSlot.date);
                                const endDate = new Date(selectedDate);
                                const maxDate = new Date(startDate);
                                maxDate.setMonth(maxDate.getMonth() + 3);
                                if (endDate > maxDate) {
                                  setRecurringPattern(prev => ({
                                    ...prev,
                                    endDate: formatIsraelTime(maxDate)
                                  }));
                                } else {
                                  setRecurringPattern(prev => ({
                                    ...prev,
                                    endDate: selectedDate
                                  }));
                                }
                              }}
                              min={newSlot.date}
                              max={(() => {
                                const maxDate = new Date(newSlot.date);
                                maxDate.setMonth(maxDate.getMonth() + 3);
                                return formatIsraelTime(maxDate);
                              })()}
                              required
                              className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <p className="text-sm text-slate-500">{t('forms.recurring.endDateDescription')}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {!isRecurring && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="isExternalGroup" className="text-base font-medium">{t('forms.externalGroup.title')}</Label>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">{t('forms.externalGroup.description')}</p>
                        <Switch
                          id="isExternalGroup"
                          checked={!!newSlot.externalGroup}
                          onCheckedChange={(checked) => {
                            setNewSlot(prev => ({
                              ...prev,
                              externalGroup: checked ? {
                                groupName: '',
                                contactPerson: '',
                                contactPhoneNumber: '',
                                purposeOfVisit: '',
                                numberOfParticipants: 1,
                                notes: '',
                                assignedDepartment: '',
                                activityContent: ''
                              } : undefined
                            }));
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* External Group Details Card */}
              {newSlot.externalGroup && (
                <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900">{t('forms.externalGroup.title')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="groupName" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.groupName')} *</Label>
                      <Input
                        id="groupName"
                        value={newSlot.externalGroup.groupName}
                        onChange={e => setNewSlot(prev => ({ ...prev, externalGroup: { ...prev.externalGroup, groupName: e.target.value } }))}
                        placeholder={t('forms.externalGroup.groupNamePlaceholder')}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.contactPerson')} *</Label>
                      <Input
                        id="contactPerson"
                        value={newSlot.externalGroup.contactPerson}
                        onChange={e => setNewSlot(prev => ({ ...prev, externalGroup: { ...prev.externalGroup, contactPerson: e.target.value } }))}
                        placeholder={t('forms.externalGroup.contactPersonPlaceholder')}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhoneNumber" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.contactPhone')} *</Label>
                      <Input
                        id="contactPhoneNumber"
                        value={newSlot.externalGroup.contactPhoneNumber}
                        onChange={e => setNewSlot(prev => ({ ...prev, externalGroup: { ...prev.externalGroup, contactPhoneNumber: e.target.value } }))}
                        placeholder={t('forms.externalGroup.contactPhonePlaceholder')}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purposeOfVisit" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.purposeOfVisit')} *</Label>
                      <Input
                        id="purposeOfVisit"
                        value={newSlot.externalGroup.purposeOfVisit}
                        onChange={e => setNewSlot(prev => ({ ...prev, externalGroup: { ...prev.externalGroup, purposeOfVisit: e.target.value } }))}
                        placeholder={t('forms.externalGroup.purposeOfVisitPlaceholder')}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numberOfParticipants" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.numberOfParticipants')} *</Label>
                      <Input
                        id="numberOfParticipants"
                        type="number"
                        min={1}
                        value={newSlot.externalGroup.numberOfParticipants}
                        onChange={e => setNewSlot(prev => ({ ...prev, externalGroup: { ...prev.externalGroup, numberOfParticipants: parseInt(e.target.value) || 1 } }))}
                        placeholder={t('forms.externalGroup.numberOfParticipants')}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignedDepartment" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.department')}</Label>
                      <Input
                        id="assignedDepartment"
                        value={newSlot.externalGroup.assignedDepartment || ''}
                        onChange={e => setNewSlot(prev => ({ ...prev, externalGroup: { ...prev.externalGroup, assignedDepartment: e.target.value } }))}
                        placeholder={t('forms.externalGroup.departmentPlaceholder')}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="activityContent" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.activity')}</Label>
                      <Input
                        id="activityContent"
                        value={newSlot.externalGroup.activityContent || ''}
                        onChange={e => setNewSlot(prev => ({ ...prev, externalGroup: { ...prev.externalGroup, activityContent: e.target.value } }))}
                        placeholder={t('forms.externalGroup.activityPlaceholder')}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    {/* External Group Notes */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="externalGroupNotes" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.notes')}</Label>
                      <Textarea
                        id="externalGroupNotes"
                        value={newSlot.externalGroup.notes || ''}
                        onChange={e => setNewSlot(prev => ({ ...prev, externalGroup: { ...prev.externalGroup, notes: e.target.value } }))}
                        placeholder={t('forms.externalGroup.notesPlaceholder')}
                        className="min-h-[80px] bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        dir={dir}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Assign Residents for External Group */}
              {newSlot.externalGroup && (
                <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm mt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900">{t('forms.residents.title')}</h3>
                  </div>
                  <Input
                    placeholder={t('forms.residents.searchPlaceholder')}
                    className="bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0 mb-4"
                    value={residentSearch}
                    onChange={(e) => setResidentSearch(e.target.value)}
                    dir={dir}
                  />
                  <Tabs value={residentTab} onValueChange={setResidentTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                      <TabsTrigger
                        value="current"
                        className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                        disabled={newSlot.residentIds.length === 0}
                      >
                        {t('forms.residents.current')} ({newSlot.residentIds.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="available"
                        className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                        disabled={residents.filter(r => !newSlot.residentIds.includes(r.id)).length === 0}
                      >
                        {t('forms.residents.available')} ({residents.filter(r => !newSlot.residentIds.includes(r.id)).length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="current" className="mt-4">
                      <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
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
                                  "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                )}
                                dir={dir}
                              >
                                <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                  className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                >
                                  {t('buttons.remove')}
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    </TabsContent>
                    <TabsContent value="available" className="mt-4">
                      <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
                        {residents
                          .filter(r => !newSlot.residentIds.includes(r.id))
                          .filter(resident =>
                            resident.fullName.toLowerCase().includes(residentSearch.toLowerCase())
                          )
                          .map(resident => (
                            <div
                              key={resident.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                              )}
                              dir={dir}
                            >
                              <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                              >
                                {t('buttons.add')}
                              </Button>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Participants Tabs Card */}
              {!newSlot.externalGroup && (
                <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900">{t('forms.participants.title')}</h3>
                  </div>
                  <Tabs defaultValue="residents" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-200/85">
                      <TabsTrigger value="volunteers">{t('forms.volunteers.title')}</TabsTrigger>
                      <TabsTrigger value="residents">{t('forms.residents.title')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="volunteers" className="space-y-4">
                      <Input
                        placeholder={t('forms.volunteers.searchPlaceholder')}
                        className="bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                        value={volunteerSearch}
                        onChange={(e) => setVolunteerSearch(e.target.value)}
                        dir={dir}
                      />
                      <Tabs value={volunteerTab} onValueChange={setVolunteerTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                          <TabsTrigger
                            value="current"
                            className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                            disabled={selectedVolunteers.length === 0}
                          >
                            {t('forms.volunteers.current')} ({selectedVolunteers.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="available"
                            className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                            disabled={volunteers.filter(v => !selectedVolunteers.includes(v.id)).length === 0}
                          >
                            {t('forms.volunteers.available')} ({volunteers.filter(v => !selectedVolunteers.includes(v.id)).length})
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="current" className="mt-4">
                          <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
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
                                      "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                    )}
                                    dir={dir}
                                  >
                                    <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                      className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                    >
                                      {t('buttons.remove')}
                                    </Button>
                                  </div>
                                );
                              })}
                          </div>
                        </TabsContent>
                        <TabsContent value="available" className="mt-4">
                          <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
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
                                      "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                    )}
                                    dir={dir}
                                  >
                                    <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                              className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                              disabled={isAtCapacity}
                                            >
                                              {t('buttons.add')}
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
                        placeholder={t('forms.residents.searchPlaceholder')}
                        className="bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                        value={residentSearch}
                        onChange={(e) => setResidentSearch(e.target.value)}
                        dir={dir}
                      />
                      <Tabs value={residentTab} onValueChange={setResidentTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                          <TabsTrigger
                            value="current"
                            className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                            disabled={newSlot.residentIds.length === 0}
                          >
                            {t('forms.residents.current')} ({newSlot.residentIds.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="available"
                            className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                            disabled={residents.filter(r => !newSlot.residentIds.includes(r.id)).length === 0}
                          >
                            {t('forms.residents.available')} ({residents.filter(r => !newSlot.residentIds.includes(r.id)).length})
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="current" className="mt-4">
                          <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
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
                                      "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                    )}
                                    dir={dir}
                                  >
                                    <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                      className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                    >
                                      {t('buttons.remove')}
                                    </Button>
                                  </div>
                                );
                              })}
                          </div>
                        </TabsContent>
                        <TabsContent value="available" className="mt-4">
                          <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
                            {residents
                              .filter(r => !newSlot.residentIds.includes(r.id))
                              .filter(resident =>
                                resident.fullName.toLowerCase().includes(residentSearch.toLowerCase())
                              )
                              .map(resident => (
                                <div
                                  key={resident.id}
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                  )}
                                  dir={dir}
                                >
                                  <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                    className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                  >
                                    {t('buttons.add')}
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Notes Card - styled as in Volunteers */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('forms.notes.title')}</h3>
                </div>
                <Textarea
                  id="notes"
                  value={newSlot.notes}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('forms.notes.placeholder')}
                  className="min-h-[100px] bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  dir={dir}
                />
              </div>
            </form>
          </div>

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
            <Button
              onClick={handleCreateSession}
              disabled={isCreatingSession}
              className="w-[200px] transition-all duration-200 mx-auto"
            >
              {isCreatingSession ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                  {t('createSession.creating')}
                </>
              ) : (
                t('createSession.create')
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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col" dir={dir}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={dir}>
            <DialogTitle className="text-slate-900">{t('dialogs.editSession.title')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('dialogs.editSession.description')}
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
              <form onSubmit={e => { e.preventDefault(); handleEditSession(); }} className="space-y-6">
                {/* Session Details Card (restyled) */}
                <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900">{t('forms.sessionDetails.title')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={cn(
                      "space-y-2",
                      getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime) === 'past' ? "md:col-span-2" : ""
                    )}>
                      <Label htmlFor="edit-date" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.date')} *</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={selectedSlot.date}
                        onChange={(e) => setSelectedSlot({ ...selectedSlot, date: e.target.value })}
                        required
                        disabled
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    {/* Max Capacity field - only show for non-past sessions */}
                    {getSessionTiming(selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime) !== 'past' && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-maxCapacity" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.maxCapacity')} *</Label>
                        <Input
                          id="edit-maxCapacity"
                          type="number"
                          min="1"
                          value={selectedSlot.maxCapacity}
                          onChange={(e) => setSelectedSlot({ ...selectedSlot, maxCapacity: parseInt(e.target.value) })}
                          required
                          disabled={selectedSlot.approvedVolunteers.some(v => v.type === 'external_group')}
                          className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="edit-startTime" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.startTime')} *</Label>
                      <Input
                        id="edit-startTime"
                        type="time"
                        value={selectedSlot.startTime}
                        onChange={(e) => setSelectedSlot({ ...selectedSlot, startTime: e.target.value })}
                        required
                        disabled={!selectedSlot.isCustom && selectedSlot.period !== null}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-endTime" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.endTime')} *</Label>
                      <Input
                        id="edit-endTime"
                        type="time"
                        value={selectedSlot.endTime}
                        onChange={(e) => setSelectedSlot({ ...selectedSlot, endTime: e.target.value })}
                        required
                        disabled={!selectedSlot.isCustom && selectedSlot.period !== null}
                        className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    {/* Period always spans both columns, but only show if not custom */}
                    {!selectedSlot.isCustom && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-period" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.period')}</Label>
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
                          disabled={selectedSlot.status === 'canceled'}
                        >
                          <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={dir}>
                            <SelectValue placeholder={t('forms.sessionDetails.period')} />
                          </SelectTrigger>
                          <SelectContent dir={dir}>
                            <SelectItem value="morning">{t('forms.sessionDetails.periods.morning')} (9:00 - 12:00)</SelectItem>
                            <SelectItem value="afternoon">{t('forms.sessionDetails.periods.afternoon')} (13:00 - 16:00)</SelectItem>
                            <SelectItem value="evening">{t('forms.sessionDetails.periods.evening')} (16:00 - 18:00)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedSlot.isCustom && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-customLabel" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.customLabel')}</Label>
                        <Input
                          id="edit-customLabel"
                          value={selectedSlot.customLabel || ""}
                          onChange={(e) => setSelectedSlot({ ...selectedSlot, customLabel: e.target.value })}
                          placeholder={t('forms.sessionDetails.customSessionPlaceholder')}
                          className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-status" className="text-sm font-medium text-slate-700">{t('forms.sessionDetails.status')}</Label>
                    <Select
                      value={selectedSlot.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={dir}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir={dir}>
                        <SelectItem
                          value="open"
                          disabled={isSlotInPast(selectedSlot) || selectedSlot.approvedVolunteers.some(v => v.type === 'external_group') || selectedSlot.approvedVolunteers.length >= selectedSlot.maxCapacity}
                        >
                          {t('session.status.open')}
                        </SelectItem>
                        <SelectItem value="full">{t('session.status.full')}</SelectItem>
                        <SelectItem value="canceled">{t('session.status.canceled')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Session Type Card (restyled) - Hidden for canceled sessions or if session is today */}
                {selectedSlot.status !== 'canceled' && !isSessionToday(selectedSlot.date) && (
                  <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-slate-900">{t('forms.sessionType.title')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-isCustom" className="text-base font-medium">{t('forms.sessionDetails.isCustom')}</Label>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">{t('forms.sessionDetails.customSessionDescription')}</p>
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
                  </div>
                )}

                {/* External Group Details Card (edit mode) */}
                {selectedSlot.approvedVolunteers.some(v => v.type === 'external_group') && editExternalGroup && (
                  <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-slate-900">{t('forms.externalGroup.title')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="edit-groupName" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.groupName')} *</Label>
                        <Input
                          id="edit-groupName"
                          value={editExternalGroup.groupName || ''}
                          onChange={e => setEditExternalGroup(prev => ({ ...prev, groupName: e.target.value }))}
                          className="h-10 bg-white border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-contactPerson" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.contactPerson')} *</Label>
                        <Input
                          id="edit-contactPerson"
                          value={editExternalGroup.contactPerson || ''}
                          onChange={e => setEditExternalGroup(prev => ({ ...prev, contactPerson: e.target.value }))}
                          className="h-10 bg-white border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-contactPhoneNumber" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.contactPhone')} *</Label>
                        <Input
                          id="edit-contactPhoneNumber"
                          value={editExternalGroup.contactPhoneNumber || ''}
                          onChange={e => setEditExternalGroup(prev => ({ ...prev, contactPhoneNumber: e.target.value }))}
                          className="h-10 bg-white border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-purposeOfVisit" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.purposeOfVisit')} *</Label>
                        <Input
                          id="edit-purposeOfVisit"
                          value={editExternalGroup.purposeOfVisit || ''}
                          onChange={e => setEditExternalGroup(prev => ({ ...prev, purposeOfVisit: e.target.value }))}
                          className="h-10 bg-white border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-numberOfParticipants" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.numberOfParticipants')} *</Label>
                        <Input
                          id="edit-numberOfParticipants"
                          type="number"
                          value={editExternalGroup.numberOfParticipants || 1}
                          onChange={e => setEditExternalGroup(prev => ({ ...prev, numberOfParticipants: parseInt(e.target.value) || 1 }))}
                          className="h-10 bg-white border-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-assignedDepartment" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.department')}</Label>
                        <Input
                          id="edit-assignedDepartment"
                          value={editExternalGroup.assignedDepartment || ''}
                          onChange={e => setEditExternalGroup(prev => ({ ...prev, assignedDepartment: e.target.value }))}
                          className="h-10 bg-white border-slate-300"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-activityContent" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.activity')}</Label>
                        <Input
                          id="edit-activityContent"
                          value={editExternalGroup.activityContent || ''}
                          onChange={e => setEditExternalGroup(prev => ({ ...prev, activityContent: e.target.value }))}
                          className="h-10 bg-white border-slate-300"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-externalGroupNotes" className="text-sm font-medium text-slate-700">{t('forms.externalGroup.notes')}</Label>
                        <Textarea
                          id="edit-externalGroupNotes"
                          value={editExternalGroup.notes || ''}
                          onChange={e => setEditExternalGroup(prev => ({ ...prev, notes: e.target.value }))}
                          className="min-h-[80px] bg-white border-slate-300"
                          dir={dir}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Participants Card (restyled) */}
                {selectedSlot.approvedVolunteers.some(v => v.type === 'external_group') ? (
                  <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm mt-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-slate-900">{t('forms.residents.title')}</h3>
                    </div>
                    <Input
                      placeholder={t('forms.residents.searchPlaceholder')}
                      className="bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0 mb-4"
                      value={editResidentSearch}
                      onChange={(e) => setEditResidentSearch(e.target.value)}
                      dir={dir}
                    />
                    <Tabs value={editResidentTab} onValueChange={setEditResidentTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                        <TabsTrigger
                          value="current"
                          className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                          disabled={selectedSlot.residentIds.length === 0}
                        >
                          {t('forms.residents.current')} ({selectedSlot.residentIds.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="available"
                          className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                          disabled={residents.filter(r => !selectedSlot.residentIds.includes(r.id)).length === 0}
                        >
                          {t('forms.residents.available')} ({residents.filter(r => !selectedSlot.residentIds.includes(r.id)).length})
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="current" className="mt-4">
                        <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
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
                                    "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                  )}
                                  dir={dir}
                                >
                                  <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                    className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                  >
                                    {t('buttons.remove')}
                                  </Button>
                                </div>
                              );
                            })}
                        </div>
                      </TabsContent>
                      <TabsContent value="available" className="mt-4">
                        <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
                          {residents
                            .filter(r => !selectedSlot.residentIds.includes(r.id))
                            .filter(resident =>
                              resident.fullName.toLowerCase().includes(editResidentSearch.toLowerCase())
                            )
                            .map(resident => (
                              <div
                                key={resident.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                )}
                                dir={dir}
                              >
                                <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                        .filter(r => r.fullName.toLowerCase().includes(residentSearch.toLowerCase()));
                                      if (filtered.length === 0) setResidentTab('current');
                                      return updated;
                                    });
                                  }}
                                  className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                >
                                  {t('buttons.add')}
                                </Button>
                              </div>
                            ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : selectedSlot.status !== 'canceled' ? (
                  <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-slate-900">{t('forms.participants.title')}</h3>
                    </div>
                    <Tabs defaultValue="residents" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-200/85">
                        <TabsTrigger value="volunteers">{t('forms.volunteers.title')}</TabsTrigger>
                        <TabsTrigger value="residents">{t('forms.residents.title')}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="volunteers" className="space-y-4">
                        <Input
                          placeholder={t('forms.volunteers.searchPlaceholder')}
                          className="bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                          value={editVolunteerSearch}
                          onChange={(e) => setEditVolunteerSearch(e.target.value)}
                          dir={dir}
                        />
                        <Tabs value={editVolunteerTab} onValueChange={setEditVolunteerTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                            <TabsTrigger
                              value="current"
                              className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                              disabled={selectedSlot.approvedVolunteers.length === 0}
                            >
                              {t('forms.volunteers.current')} ({selectedSlot.approvedVolunteers.length})
                            </TabsTrigger>
                            <TabsTrigger
                              value="available"
                              className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                              disabled={volunteers.filter(v => !selectedSlot.approvedVolunteers.some(av => av.id === v.id)).length === 0}
                            >
                              {t('forms.volunteers.available')} ({volunteers.filter(v => !selectedSlot.approvedVolunteers.some(av => av.id === v.id)).length})
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="current" className="mt-4">
                            <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
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
                                        "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                      )}
                                      dir={dir}
                                    >
                                      <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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

                                          // Only update local state - database operations happen on save
                                          setSelectedSlot(prev => ({
                                            ...prev,
                                            approvedVolunteers: prev.approvedVolunteers.filter(av => av.id !== v.id)
                                          }));
                                        }}
                                        className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                        disabled={isSessionInPast(selectedSlot.date, selectedSlot.startTime) && selectedSlot.approvedVolunteers.filter(av => av.type === 'volunteer').length === 1}
                                      >
                                        {t('buttons.remove')}
                                      </Button>
                                    </div>
                                  );
                                })}
                            </div>
                          </TabsContent>
                          <TabsContent value="available" className="mt-4">
                            <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
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
                                        "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                      )}
                                      dir={dir}
                                    >
                                      <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                        className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                        disabled={isAtCapacity}
                                      >
                                        {t('buttons.add')}
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
                          placeholder={t('forms.residents.searchPlaceholder')}
                          className="bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 !ring-0 !ring-offset-0"
                          value={editResidentSearch}
                          onChange={(e) => setEditResidentSearch(e.target.value)}
                          dir={dir}
                        />
                        <Tabs value={editResidentTab} onValueChange={setEditResidentTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 bg-slate-200/85">
                            <TabsTrigger
                              value="current"
                              className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                              disabled={selectedSlot.residentIds.length === 0}
                            >
                              {t('forms.residents.current')} ({selectedSlot.residentIds.length})
                            </TabsTrigger>
                            <TabsTrigger
                              value="available"
                              className="data-[state=active]:bg-white data-[state=active]:text-primary text-slate-700"
                              disabled={residents.filter(r => !selectedSlot.residentIds.includes(r.id)).length === 0}
                            >
                              {t('forms.residents.available')} ({residents.filter(r => !selectedSlot.residentIds.includes(r.id)).length})
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="current" className="mt-4">
                            <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
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
                                        "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                      )}
                                      dir={dir}
                                    >
                                      <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                            setEditResidentTab('available'); // TODOjr
                                          }

                                          // Then update the resident IDs
                                          setSelectedSlot(prev => ({
                                            ...prev,
                                            residentIds: prev.residentIds.filter(rid => rid !== id)
                                          }));
                                        }}
                                        className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                      >
                                        {t('buttons.remove')}
                                      </Button>
                                    </div>
                                  );
                                })}
                            </div>
                          </TabsContent>
                          <TabsContent value="available" className="mt-4">
                            <div className="space-y-2 max-h-[207px] overflow-y-auto pr-2">
                              {residents
                                .filter(r => !selectedSlot.residentIds.includes(r.id))
                                .filter(resident =>
                                  resident.fullName.toLowerCase().includes(editResidentSearch.toLowerCase())
                                )
                                .map(resident => (
                                  <div
                                    key={resident.id}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white"
                                    )}
                                    dir={dir}
                                  >
                                    <div className={cn("flex items-center min-w-0 gap-2", isRTL && "space-x-reverse")}>
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
                                      className={cn("flex-shrink-0 bg-white hover:bg-slate-50 border-slate-300", isRTL ? "mr-2" : "ml-2")}
                                    >
                                      {t('buttons.add')}
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : null}

                {/* Notes Card (restyled) */}
                <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900">{t('forms.notes.title')}</h3>
                  </div>
                  <Textarea
                    id="edit-notes"
                    value={selectedSlot.notes}
                    onChange={(e) => setSelectedSlot({ ...selectedSlot, notes: e.target.value })}
                    placeholder={t('forms.notes.placeholder')}
                    className="min-h-[100px] bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    dir={dir}
                  />
                </div>

                {/* Delete Actions Container */}
                {(selectedSlot?.status === 'canceled' && !pendingChanges.status) || (selectedSlot?.isRecurring && selectedSlot?.recurringPattern?.parentSlotId && hasFutureRecurringSessions) ? (
                  <div className="pt-6 border-t border-slate-300"> {/* Parent container with single border/padding */}
                    {selectedSlot.status === 'canceled' && !pendingChanges.status && (
                      <div className=""> {/* Regular delete button container (no top padding/border) */}
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-600"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          {t('deleteSession.delete')}
                        </Button>
                      </div>
                    )}

                    {/* Add button for deleting all recurring sessions */}
                    {selectedSlot?.isRecurring && selectedSlot?.recurringPattern?.parentSlotId && hasFutureRecurringSessions && (
                      <div className={cn(
                        selectedSlot.status === 'canceled' && !pendingChanges.status ? "mt-4" : ""
                      )}> {/* Add top margin if regular delete is visible */}
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-600"
                          onClick={handleDeleteRecurringSessions}
                        >
                          {t('deleteRecurringSessions.deleteAll')}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null} {/* Close Delete Actions Container conditionally */}

              </form>
            </div>
          )}

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
            <Button
              onClick={handleEditSession}
              disabled={isSavingEdit}
              className="w-[200px] transition-all duration-200 mx-auto"
            >
              {isSavingEdit ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                  {t('editSession.saving')}
                </>
              ) : (
                t('editSession.saveChanges')
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
        <DialogContent className="sm:max-w-[500px] max-h-[82vh] flex flex-col" dir={dir}>
          <DialogHeader className="border-b border-slate-300 pb-3">
            <DialogTitle dir={dir}>{t('pendingRequests.title')}</DialogTitle>
            <DialogDescription dir={dir}>
              {t('dialogs.pendingRequests.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 px-4 pr-5 pt-4 pb-4">
            {selectedSlot && !isSlotInPast(selectedSlot) && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-300">
                  <div className="font-medium mb-2">{t('sessionDetails.title')}</div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>{t('sessionDetails.date', { date: `${t(`calendar.weekDays.${formatIsraelTime(selectedSlot.date, 'EEEE').toLowerCase()}`)}, ${t(`calendar.months.${formatIsraelTime(selectedSlot.date, 'MMMM').toLowerCase()}`)} ${formatIsraelTime(selectedSlot.date, 'd')}, ${formatIsraelTime(selectedSlot.date, 'yyyy')}` })}</div>
                    <div>{t('sessionDetails.time', { start: selectedSlot.startTime, end: selectedSlot.endTime })}</div>
                    <div>{t('sessionDetails.volunteers', { current: getVolunteerCount(selectedSlot), capacity: selectedSlot.maxCapacity })}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedSlot.volunteerRequests
                    .filter(volunteerRequest => volunteerRequest.status === "pending")
                    .sort((a, b) => a.volunteerId.localeCompare(b.volunteerId))
                    .map(volunteerRequest => {
                      // Get volunteer info from the volunteer list using the ID from the request
                      const volunteerInfo = volunteers.find(v => v.id === volunteerRequest.volunteerId);
                      // Use match score directly from the volunteer request
                      const matchScore = volunteerRequest.matchScore;

                      return (
                        <div
                          key={volunteerRequest.volunteerId}
                          className="p-4 flex items-start gap-4 rounded-lg border border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 mb-2">{volunteerInfo?.fullName || volunteerRequest.volunteerId}</div>

                            <div className="space-y-2.5">
                              {/* Assigned Resident */}
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-500 min-w-0">{t('pendingRequests.assignedResident')}</span>
                                <div className="flex flex-wrap gap-1 min-w-0">
                                  {volunteerRequest.assignedResidentId ? (
                                    (() => {
                                      const resident = residents.find(r => r.id === volunteerRequest.assignedResidentId);
                                      return (
                                        <Badge
                                          key={volunteerRequest.assignedResidentId}
                                          variant="outline"
                                          className="text-xs bg-blue-50 border border-blue-500 hover:bg-blue-100 hover:border-blue-600 text-blue-700 px-2 py-0.5"
                                        >
                                          {resident?.fullName || volunteerRequest.assignedResidentId}
                                        </Badge>
                                      );
                                    })()
                                  ) : (
                                    <Badge variant="outline" className="text-xs bg-blue-50 border border-blue-500 hover:bg-blue-100 hover:border-blue-600 text-blue-700 px-2 py-0.5">
                                      {t('pendingRequests.noneAssigned')}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Match Score */}
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-500">{t('pendingRequests.matchScore')}</span>
                                {matchScore !== null && matchScore !== undefined ? (
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={cn(
                                        "text-sm px-2 py-0.5 font-medium",
                                        matchScore >= 80
                                          ? "bg-emerald-100 border-emerald-400 text-emerald-700 hover:bg-emerald-200 hover:border-emerald-500"
                                          : matchScore >= 60
                                            ? "bg-amber-100 border-amber-500 text-amber-700 hover:bg-amber-200 hover:border-amber-600"
                                            : "bg-red-100 border-red-400 text-red-700 hover:bg-red-200 hover:border-red-500"
                                      )}
                                      variant="outline"
                                    >
                                      {matchScore}%
                                    </Badge>
                                    <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all duration-300",
                                          matchScore >= 80
                                            ? "bg-emerald-500"
                                            : matchScore >= 60
                                              ? "bg-amber-500"
                                              : "bg-red-500"
                                        )}
                                        style={{ width: `${Math.min(matchScore, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-slate-100 border-slate-500 text-slate-600 hover:bg-slate-200 hover:border-slate-600 px-2 py-0.5">
                                    {t('pendingRequests.notCalculated')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2.5 flex-shrink-0 pt-1">
                            {pendingVolunteerAction[`${selectedSlot.id}-${volunteerRequest.volunteerId}`] ? (
                              <div className="flex items-center justify-center w-24 h-10">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary inline-block"></div>
                              </div>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-emerald-200/80 border-green-500 text-green-700 hover:bg-emerald-300/75 hover:border-emerald-600 hover:text-green-700 h-10 px-4 text-sm font-medium"
                                  onClick={() => handleVolunteerRequest(selectedSlot.id, volunteerRequest.volunteerId, 'approve')}
                                >
                                  {t('pendingRequests.approve')}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-200/80 border-red-500 text-red-700 hover:bg-red-300/75 hover:border-red-600 hover:text-red-700 h-10 px-4 text-sm font-medium"
                                  onClick={() => handleVolunteerRequest(selectedSlot.id, volunteerRequest.volunteerId, 'reject')}
                                >
                                  {t('pendingRequests.reject')}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Sessions Dialog */}
      <Dialog open={isDaySessionsDialogOpen} onOpenChange={setIsDaySessionsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col" dir={dir}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={dir}>
            <DialogTitle dir={dir}>
              {t('daySessions.title', {
                date: selectedDayDate && `${t(`calendar.weekDays.${formatIsraelTime(selectedDayDate, 'EEEE').toLowerCase()}`)}, ${t(`calendar.months.${formatIsraelTime(selectedDayDate, 'MMMM').toLowerCase()}`)} ${formatIsraelTime(selectedDayDate, 'd')}, ${formatIsraelTime(selectedDayDate, 'yyyy')}`
              })}
            </DialogTitle>
            <DialogDescription>
              {t('daySessions.description', { count: selectedDaySessions.length })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 px-4 pr-5 pt-4 pb-4">
            {selectedDaySessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-500 mb-4"><span dir={dir}>{t('daySessions.noSessions')}</span></div>
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
                  {t('daySessions.createNew')}
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
                        "border-slate-300",
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
                            {t('calendar.filled', { current: getVolunteerCount(session), capacity: getCapacityDisplay(session) })}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge
                            className={cn(
                              "border px-2 py-1 text-s transition-colors",
                              session.status === "full"
                                ? "bg-amber-100 border-amber-600 text-amber-800 hover:bg-amber-200 hover:border-amber-700 hover:text-amber-800"
                                : session.status === "canceled"
                                  ? "bg-red-100 border-red-400 text-red-800 hover:bg-red-200 hover:border-red-500 hover:text-red-800"
                                  : "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200 hover:border-blue-500 hover:text-blue-800"
                            )}
                          >
                            {t(`session.status.${session.status}`)}
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
                            className="bg-amber-300 border-amber-600 text-amber-800 hover:bg-amber-400/75 hover:border-amber-700 hover:text-amber-800"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedSlot(session);
                              setIsDaySessionsDialogOpen(false);
                              setIsPendingRequestsDialogOpen(true);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {t('pendingRequests.pendingCount' + (session.volunteerRequests.filter(v => v.status === "pending").length === 1 ? '' : '_plural'), { count: session.volunteerRequests.filter(v => v.status === "pending").length })}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-300 pt-4 flex justify-center items-center">
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
                {t('daySessions.createAnother')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" dir={dir}>
          <DialogHeader dir={dir}>
            <DialogTitle>{t('deleteSession.title')}</DialogTitle>
            <DialogDescription>{t('deleteSession.description')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-2">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <span className="text-red-600 font-semibold text-base mb-2">
                {t('deleteSession.confirm')}
              </span>
              <span className="text-slate-600 text-sm">
                {t('deleteSession.warning', { type: selectedSlot?.approvedVolunteers.some(v => v.type === 'external_group') ? t('deleteSession.externalGroup') : t('deleteSession.session') })}
              </span>
            </div>
          </div>
          <DialogFooter>
            <div className="w-full flex justify-center">
              <Button
                variant="destructive"
                onClick={handleDeleteSession}
                disabled={isDeleting}
                className="min-w-[200px] transition-all duration-200 mx-auto"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 inline-block" />
                    {t('deleteSession.deleting')}
                  </>
                ) : (
                  t('deleteSession.delete')
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Delete Confirmation Dialog */}
      <Dialog open={isDeleteRecurringDialogOpen} onOpenChange={setIsDeleteRecurringDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" dir={dir}>
          <DialogHeader dir={dir}>
            <DialogTitle>{t('deleteRecurringSessions.title')}</DialogTitle>
            <DialogDescription>{t('deleteRecurringSessions.description')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-2">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <span className="text-red-600 font-semibold text-base mb-2">
                {t('deleteRecurringSessions.confirm')}
              </span>
              <span className="text-slate-600 text-sm">
                {t('deleteRecurringSessions.warning')}
              </span>
            </div>
          </div>
          <DialogFooter>
            <div className="w-full flex justify-center">
              <Button
                variant="destructive"
                onClick={confirmDeleteRecurringSessions}
                disabled={isDeleting}
                className="min-w-[200px] transition-all duration-200 mx-auto"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 inline-block" />
                    {t('deleteRecurringSessions.deleting')}
                  </>
                ) : (
                  t('deleteRecurringSessions.deleteAll')
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reject Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" dir={dir}>
          <DialogHeader>
            <DialogTitle dir={dir}>{t('rejectReason.title')}</DialogTitle>
            <DialogDescription dir={dir}>
              {t('rejectReason.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={t('rejectReason.placeholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[80px]"
              dir={dir}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || pendingVolunteerAction[`${pendingRejectAction?.sessionId}-${pendingRejectAction?.volunteerId}`]}
              className="w-full"
            >
              {pendingRejectAction && pendingVolunteerAction[`${pendingRejectAction.sessionId}-${pendingRejectAction.volunteerId}`] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 inline-block" />
                  {t('rejectReason.rejecting')}
                </>
              ) : (
                t('rejectReason.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerCalendar; 