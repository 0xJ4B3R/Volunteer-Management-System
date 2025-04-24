import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  FileDown,
  Grid, 
  Columns,
  ListOrdered,
  AlertCircle, 
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, addDays, startOfWeek, endOfWeek, startOfDay, endOfDay, isToday, isPast, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Session {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  volunteers: Volunteer[];
  pendingVolunteers: Volunteer[];
  status: "open" | "full" | "cancelled";
  notes: string;
  maxVolunteers: number;
  isRecurring?: boolean;
  recurrence?: {
    frequency: "weekly" | "biweekly" | "monthly";
    endDate: string | null;
  };
}

interface Volunteer {
  id: number;
  name: string;
  email: string;
  skills?: string[];
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

const isSessionInPast = (session: Session): boolean => {
  const now = toIsraelTime(new Date());
  const sessionDate = toIsraelTime(session.date);
  
  // Compare dates in Israel timezone
  const today = toIsraelTime(now);
  today.setHours(0, 0, 0, 0);
  sessionDate.setHours(0, 0, 0, 0);
  
  return sessionDate < today;
};

const ManagerCalendar = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Calendar state
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return toIsraelTime(now);
  });
  const [sessions, setSessions] = useState<Session[]>([]);

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
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [newSession, setNewSession] = useState<Partial<Session>>({
    id: Date.now(),
    date: formatIsraelTime(new Date(), 'yyyy-MM-dd'),
    startTime: "09:00",
    endTime: "11:00",
    volunteers: [],
    pendingVolunteers: [],
    status: "open",
    notes: "",
    maxVolunteers: 5,
    isRecurring: false
  });

  // Add new state for day sessions dialog
  const [isDaySessionsDialogOpen, setIsDaySessionsDialogOpen] = useState(false);
  const [selectedDaySessions, setSelectedDaySessions] = useState<Session[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);

  // Add state for pending requests
  const [pendingRequests, setPendingRequests] = useState<Session[]>([]);
  const [isPendingViewActive, setIsPendingViewActive] = useState(false);

  // Add state to track which volunteer action is in progress
  const [pendingVolunteerAction, setPendingVolunteerAction] = useState<{[key:string]: boolean}>({});

  // Add this state near the other state declarations
  const [fadingVolunteers, setFadingVolunteers] = useState<{[key: string]: boolean}>({});

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
    const sessionsWithPending = sessions.filter(session => {
      const sessionDate = toIsraelTime(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      const today = toIsraelTime(new Date());
      today.setHours(0, 0, 0, 0);
      return session.pendingVolunteers.length > 0 && sessionDate >= today;
    });
    
    setPendingRequests(sessionsWithPending);
    
    // Close the dialog if there are no pending requests
    if (sessionsWithPending.length === 0 && isPendingRequestsDialogOpen) {
      setIsPendingRequestsDialogOpen(false);
    }
  }, [sessions, isPendingRequestsDialogOpen]);

  // Apply filters to sessions
  const filteredSessions = sessions.filter(session => {
    const sessionDate = toIsraelTime(session.date);
    const inDateRange = sessionDate >= dateRange.start && sessionDate <= dateRange.end;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "open" && session.status === "open") ||
      (statusFilter === "full" && session.status === "full") ||
      (statusFilter === "cancelled" && session.status === "cancelled") ||
      (statusFilter === "pending" && session.pendingVolunteers.length > 0);

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
    
    if (!newSession.date || !newSession.startTime || !newSession.endTime || !newSession.maxVolunteers) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (newSession.startTime >= newSession.endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return;
    }

    // Create session with Israel time
    const createdSession: Session = {
      id: Date.now(),
      date: formatIsraelTime(toIsraelTime(newSession.date)),
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      volunteers: [],
      pendingVolunteers: [],
      status: "open",
      notes: newSession.notes || "",
      maxVolunteers: newSession.maxVolunteers,
      isRecurring: newSession.isRecurring || false,
      recurrence: newSession.isRecurring ? {
        frequency: newSession.recurrence?.frequency || "weekly",
        endDate: newSession.recurrence?.endDate ? formatIsraelTime(toIsraelTime(newSession.recurrence.endDate)) : null
      } : undefined
    };

    if (newSession.isRecurring && newSession.recurrence?.endDate) {
      const newSessions: Session[] = [];
      const startDate = toIsraelTime(newSession.date);
      const endDate = toIsraelTime(newSession.recurrence.endDate);
      const interval = newSession.recurrence.frequency === "weekly" ? 7 : 14;

      let currentDate = new Date(startDate);
      let sessionCount = 0;
      while (currentDate <= endDate) {
        newSessions.push({
          ...createdSession,
          id: Date.now() + sessionCount,
          date: formatIsraelTime(currentDate)
        });
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + interval);
        sessionCount++;
      }

      setSessions(prev => [...prev, ...newSessions]);
    } else {
      setSessions(prev => [...prev, createdSession]);
    }

      setIsCreateDialogOpen(false);
    setNewSession({
        id: Date.now(),
      date: formatIsraelTime(new Date(), 'yyyy-MM-dd'),
      startTime: "09:00",
      endTime: "11:00",
        volunteers: [],
      pendingVolunteers: [],
      status: "open",
      notes: "",
      maxVolunteers: 5,
      isRecurring: false
    });

    toast({
      title: "Session created",
      description: "New session has been added to the calendar."
    });
  };

  // Handle delete session
  const handleDeleteSession = () => {
    if (!selectedSession) return;

    // Check if there are approved volunteers
    if (selectedSession.volunteers.length > 0) {
      toast({
        title: "Cannot delete session",
        description: "This session has approved volunteers and cannot be deleted.",
        variant: "destructive"
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    setSessions(sessions.filter(session => session.id !== selectedSession.id));
    setIsDeleteDialogOpen(false);
    setSelectedSession(null);

    toast({
      title: "Session deleted",
      description: "The session has been removed from the calendar."
    });
  };

  // Handle edit session
  const handleEditSession = () => {
    if (!selectedSession) return;

    // Validate time range
    if (selectedSession.startTime >= selectedSession.endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return;
    }

    // Update session with Israel time
    const updatedSession = {
      ...selectedSession,
      date: formatIsraelTime(toIsraelTime(selectedSession.date))
    };

    setSessions(sessions.map(session =>
      session.id === selectedSession.id ? updatedSession : session
    ));

    setIsEditDialogOpen(false);
    setSelectedSession(null);

    toast({
      title: "Session updated",
      description: "The session has been updated successfully."
    });
  };

  // Handle volunteer request actions
  const handleVolunteerRequest = (
    sessionId: number, 
    volunteerId: number, 
    action: 'approve' | 'reject'
  ) => {
    // Prevent multiple clicks
    const actionKey = `${sessionId}-${volunteerId}`;
    if (pendingVolunteerAction[actionKey]) return;
    
    // Check if the session is in the past
    const session = sessions.find(s => s.id === sessionId);
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
      setSessions(prev => prev.map(session => {
        if (session.id !== sessionId) return session;
        
        const pendingVolunteer = session.pendingVolunteers.find(v => v.id === volunteerId);
        if (!pendingVolunteer) return session;
        
        if (action === 'approve') {
          return {
            ...session,
            volunteers: [...session.volunteers, pendingVolunteer],
            pendingVolunteers: session.pendingVolunteers.filter(v => v.id !== volunteerId),
            status: session.volunteers.length + 1 >= session.maxVolunteers ? 'full' : 'open'
          };
        } else {
          return {
            ...session,
            pendingVolunteers: session.pendingVolunteers.filter(v => v.id !== volunteerId)
          };
        }
      }));

      // Update selected session if it's the one being modified
      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => {
          if (!prev) return null;
          const updatedSession = { ...prev };
          if (action === 'approve') {
            const volunteer = updatedSession.pendingVolunteers.find(v => v.id === volunteerId);
            if (volunteer) {
              updatedSession.volunteers = [...updatedSession.volunteers, volunteer];
              updatedSession.pendingVolunteers = updatedSession.pendingVolunteers.filter(v => v.id !== volunteerId);
              updatedSession.status = updatedSession.volunteers.length >= updatedSession.maxVolunteers ? 'full' : 'open';
            }
          } else {
            updatedSession.pendingVolunteers = updatedSession.pendingVolunteers.filter(v => v.id !== volunteerId);
          }
          return updatedSession;
        });
      }

      // Update pending requests view if active
      if (isPendingViewActive) {
        setPendingRequests(prev => 
          prev.filter(session => 
            session.id !== sessionId || 
            session.pendingVolunteers.some(v => v.id !== volunteerId)
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
    }, 300); // Match this with the CSS transition duration
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
                <div className="p-8 text-center text-slate-500">
                  No pending volunteer requests at this time.
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
                        setSelectedSession(session);
                        setIsPendingRequestsDialogOpen(true);
                      }}
                    >
                      <div className="flex justify-between">
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
                              <span>{session.volunteers.length}/{session.maxVolunteers} volunteers</span>
          </div>
            </div>
          </div>
          
            <Button 
                          variant="outline"
                          size="sm"
                          className="h-8 bg-orange-50 border-orange-200 text-orange-700 self-start"
                        >
                          Review Requests
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
      <Tabs value={calendarView} className="w-full">
        <TabsContent value="month" className="mt-0">
          {/* Month View */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center font-medium text-slate-600 py-2 text-base">
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
                    <div key={`empty-${i}`} className="h-24 bg-slate-50/50 rounded-lg" />
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
                        isCurrentDate ? "bg-slate-200/50 border-slate-200" : "border-slate-200 hover:bg-slate-50",
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
                          "w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200",
                          formatIsraelTime(date, 'yyyy-MM-dd') === formatIsraelTime(selectedDate, 'yyyy-MM-dd') 
                            ? "bg-primary/50 text-white"
                            : "hover:bg-slate-100"
                        )}>
                          <span className={cn(
                            "text-base font-medium transition-colors duration-200",
                            formatIsraelTime(date, 'yyyy-MM-dd') === formatIsraelTime(selectedDate, 'yyyy-MM-dd')
                              ? "text-white"
                              : "text-slate-900"
                          )}>
                            {i}
                    </span>
                  </div>
                        {sessionsForDay.length > 0 && (
                          <Badge variant="outline" className="text-xs font-normal px-1.5 py-0.5">
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
                                session.status === "full" ? "border-orange-200 bg-orange-50" :
                                session.status === "cancelled" ? "border-red-200 bg-red-50" :
                                "border-slate-200 bg-slate-50"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {session.startTime}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{session.volunteers.length}/{session.maxVolunteers}</span>
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
                                      "p-2 rounded-md text-sm cursor-pointer hover:bg-slate-100 transition-colors border",
                                      session.status === "full" ? "border-orange-200 bg-orange-50" :
                                      session.status === "cancelled" ? "border-red-200 bg-red-50" :
                                      "border-slate-200 bg-slate-50"
                                    )}
                                    onClick={() => {
                                      setSelectedSession(session);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">
                                        {session.startTime} - {session.endTime}
                                      </span>
                                    {session.pendingVolunteers.length > 0 && !isSessionInPast(session) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-1 text-amber-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSession(session);
                                          setIsPendingRequestsDialogOpen(true);
                                        }}
                                      >
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        {session.pendingVolunteers.length}
                                      </Button>
                                    )}
                                    </div>
                                    <div className="flex items-center text-slate-600">
                                      <Users className="h-4 w-4 mr-1" />
                                      <span>{session.volunteers.length}/{session.maxVolunteers} filled</span>
                                      </div>
                                    {session.isRecurring && (
                                      <Badge variant="outline" className="mt-2 bg-blue-50 border-blue-200">
                                        Recurring
                                      </Badge>
                                    )}
                                      </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-2 p-1 max-w-xs">
                                    <div className="font-medium">{format(new Date(session.date), 'MMMM d, yyyy')}</div>
                                    <div>{session.startTime} - {session.endTime}</div>
                                    <div className="text-sm text-slate-600">
                                      {session.volunteers.length}/{session.maxVolunteers} volunteers
                                      </div>
                                    {session.volunteers.length > 0 && (
                                      <div className="text-sm">
                                        <div className="font-medium mb-1">Volunteers:</div>
                                        <ul className="list-disc pl-4">
                                          {session.volunteers.map(volunteer => (
                                            <li key={volunteer.id}>{volunteer.name}</li>
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
                              "p-4 hover:bg-slate-50 cursor-pointer transition-colors text-center",
                              isPast(new Date(`${session.date}T${session.endTime}`)) ? "opacity-70" : ""
                            )}
                            onClick={() => {
                              setSelectedSession(session);
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
                                    <span>{session.volunteers.length}/{session.maxVolunteers} volunteers</span>
                            </div>
                            
                                  {session.isRecurring && (
                                    <Badge variant="outline" className="bg-blue-50 border-blue-200">
                                      Recurring
                                    </Badge>
                                  )}

                                  <Badge
                                    className={
                                      session.status === "full" ? "bg-orange-500" :
                                      session.status === "cancelled" ? "bg-red-500" :
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

                              {session.volunteers.length > 0 && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-medium mb-1">Volunteers:</h5>
                                  <div className="flex flex-wrap justify-center gap-1">
                                    {session.volunteers.map(volunteer => (
                                      <Badge key={volunteer.id} variant="outline" className="bg-slate-100">
                                        {volunteer.name}
                                      </Badge>
                                    ))}
                                  </div>
                              </div>
                            )}
                          </div>
                          
                            {session.pendingVolunteers.length > 0 && !isSessionInPast(session) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                                className="h-8 bg-amber-50 border-amber-200 text-amber-700 mt-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSession(session);
                                  setIsPendingRequestsDialogOpen(true);
                                }}
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {session.pendingVolunteers.length} pending
                            </Button>
                            )}
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
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="px-6 py-4 flex justify-between items-center">
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
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="pending">Has Requests</SelectItem>
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
                          : "bg-orange-500 hover:bg-orange-500/90 text-white hover:text-white border-orange-500"
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
                        <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-white text-orange-700">
                          {pendingRequests.length}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Schedule a new volunteer session. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={newSession.date}
                  onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxVolunteers">Max Volunteers</Label>
                <Input 
                  id="maxVolunteers"
                  type="number"
                  min="1"
                  value={newSession.maxVolunteers}
                  onChange={(e) => setNewSession(prev => ({ ...prev, maxVolunteers: parseInt(e.target.value) }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input 
                  id="endTime"
                  type="time"
                  value={newSession.endTime}
                  onChange={(e) => setNewSession(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newSession.notes}
                onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional information about the session..."
              />
                  </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={newSession.isRecurring}
                  onCheckedChange={(checked) => setNewSession(prev => ({ ...prev, isRecurring: checked }))}
                />
                <Label htmlFor="recurring">Make this a recurring session</Label>
              </div>

              {newSession.isRecurring && (
                <div className="space-y-4 pl-4 border-l-2 border-slate-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select
                        value={newSession.recurrence?.frequency}
                        onValueChange={(value: "weekly" | "biweekly" | "monthly") => setNewSession(prev => ({
                          ...prev,
                          recurrence: { ...prev.recurrence, frequency: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
            </div>
            
            <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newSession.recurrence?.endDate || ""}
                        onChange={(e) => setNewSession(prev => ({
                          ...prev,
                          recurrence: { ...prev.recurrence, endDate: e.target.value }
                        }))}
              />
            </div>
                  </div>
                </div>
              )}
          </div>
          
          <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
              <Button type="submit">Create Session</Button>
          </DialogFooter>
          </form>
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
          
          {selectedSession && (
            <form onSubmit={e => { e.preventDefault(); handleEditSession(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input 
                    id="edit-date" 
                    type="date" 
                    value={selectedSession.date}
                    onChange={(e) => setSelectedSession({ ...selectedSession, date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-maxVolunteers">Max Volunteers</Label>
                  <Input 
                    id="edit-maxVolunteers"
                    type="number"
                    min="1"
                    value={selectedSession.maxVolunteers}
                    onChange={(e) => setSelectedSession({ ...selectedSession, maxVolunteers: parseInt(e.target.value) })}
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
                    value={selectedSession.startTime}
                    onChange={(e) => setSelectedSession({ ...selectedSession, startTime: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input 
                    id="edit-endTime"
                    type="time"
                    value={selectedSession.endTime}
                    onChange={(e) => setSelectedSession({ ...selectedSession, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedSession.status}
                  onValueChange={(value: "open" | "full" | "cancelled") => setSelectedSession({ ...selectedSession, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={selectedSession.notes}
                  onChange={(e) => setSelectedSession({ ...selectedSession, notes: e.target.value })}
                  placeholder="Add any additional information about the session..."
                />
                    </div>

              {selectedSession.volunteers.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Volunteers</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedSession.volunteers.map(volunteer => (
                      <Badge key={volunteer.id} variant="outline" className="bg-slate-100">
                        {volunteer.name}
                      </Badge>
                  ))}
                </div>
              </div>
              )}
              
              {selectedSession.pendingVolunteers.length > 0 && !isSessionInPast(selectedSession) && (
              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Pending Requests</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setIsPendingRequestsDialogOpen(true);
                      }}
                    >
                      Review Requests
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedSession.pendingVolunteers.map(volunteer => (
                      <Badge key={volunteer.id} variant="outline" className="bg-amber-50 border-amber-200">
                        {volunteer.name}
                      </Badge>
                    ))}
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
          
          {selectedSession && (
            <>
              {selectedSession.volunteers.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Cannot Delete Session</span>
                    </div>
                    <p className="text-sm">
                      This session has {selectedSession.volunteers.length} approved volunteer{selectedSession.volunteers.length !== 1 ? 's' : ''}.
                      You must remove all volunteers before deleting the session.
                    </p>
                </div>
                
                  <div className="space-y-2">
                    <Label>Current Volunteers</Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedSession.volunteers.map(volunteer => (
                        <Badge key={volunteer.id} variant="outline" className="bg-slate-100">
                          {volunteer.name}
                  </Badge>
                      ))}
                  </div>
                </div>
              </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="font-medium mb-2">Session Details</div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div>Date: {format(new Date(selectedSession.date), 'MMMM d, yyyy')}</div>
                      <div>Time: {selectedSession.startTime} - {selectedSession.endTime}</div>
                      <div>Status: {selectedSession.status}</div>
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
          </>
        )}
        </DialogContent>
      </Dialog>

      {/* Pending Requests Dialog */}
      <Dialog 
        open={isPendingRequestsDialogOpen && selectedSession?.pendingVolunteers.length > 0 && !isSessionInPast(selectedSession)} 
        onOpenChange={setIsPendingRequestsDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pending Volunteer Requests</DialogTitle>
            <DialogDescription>
              Review and manage volunteer requests for this session.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && !isSessionInPast(selectedSession) && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="font-medium mb-2">Session Details</div>
                <div className="text-sm text-slate-600 space-y-1">
                  <div>Date: {format(new Date(selectedSession.date), 'MMMM d, yyyy')}</div>
                  <div>Time: {selectedSession.startTime} - {selectedSession.endTime}</div>
                  <div>Current Volunteers: {selectedSession.volunteers.length}/{selectedSession.maxVolunteers}</div>
                  </div>
                </div>
              
              <div className="space-y-4">
                {selectedSession.pendingVolunteers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(volunteer => (
                    <div 
                      key={volunteer.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{volunteer.name}</div>
                        <div className="text-sm text-slate-500">{volunteer.email}</div>
              </div>

                      <div className="flex gap-2">
                        {pendingVolunteerAction[`${selectedSession.id}-${volunteer.id}`] ? (
                          <div className="flex items-center justify-center w-20">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
                        ) : (
                          <>
            <Button 
              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleVolunteerRequest(selectedSession.id, volunteer.id, 'reject')}
            >
                              Reject
            </Button>
            <Button 
                              variant="outline"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleVolunteerRequest(selectedSession.id, volunteer.id, 'approve')}
                            >
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
          
          <DialogFooter>
                <Button variant="outline" onClick={() => setIsPendingRequestsDialogOpen(false)}>
                  Close
            </Button>
          </DialogFooter>
            </div>
          )}
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
              variant="outline" 
                  onClick={() => {
                    setIsDaySessionsDialogOpen(false);
                    setNewSession({
                      ...newSession,
                      date: selectedDayDate ? format(selectedDayDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
                    });
                    setIsCreateDialogOpen(true);
                  }}
                >
                  Create Session
            </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDaySessions
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(session => (
                    <div
                      key={session.id}
                      className={`p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors
                        ${selectedSession?.id === session.id ? "focus-visible:ring-2 ring-primary rounded-md focus:outline-none transition" : ""}
                      `}
                      onClick={() => {
                        setSelectedSession(session);
                        setIsDaySessionsDialogOpen(false);
                        setIsEditDialogOpen(true);
                      }}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          setSelectedSession(session);
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
                            {session.volunteers.length}/{session.maxVolunteers} volunteers
            </div>
            </div>
                        <Badge
                          className={
                            session.status === "full" ? "bg-orange-500" :
                            session.status === "cancelled" ? "bg-red-500" :
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

                      {session.pendingVolunteers.length > 0 && !isSessionInPast(session) && (
                        <div className="flex flex-col gap-2 mt-3">
            <Button 
                            variant="outline"
                            size="sm"
                            className="bg-amber-50 border-amber-200 text-amber-700"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedSession(session);
                              setIsDaySessionsDialogOpen(false);
                              setIsPendingRequestsDialogOpen(true);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {session.pendingVolunteers.length} pending request{session.pendingVolunteers.length !== 1 ? 's' : ''}
            </Button>
                          {/* Quick approve/reject for first pending volunteer */}
                          <div className="flex gap-2">
                            {session.pendingVolunteers.slice(0, 1).map(volunteer => (
                              <div key={volunteer.id} className="flex items-center gap-1">
                                <span className="text-xs">{volunteer.name}</span>
                                {pendingVolunteerAction[`${session.id}-${volunteer.id}`] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-emerald-600 hover:bg-emerald-50"
                                      title="Approve"
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleVolunteerRequest(session.id, volunteer.id, 'approve');
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-600 hover:bg-red-50"
                                      title="Reject"
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleVolunteerRequest(session.id, volunteer.id, 'reject');
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
          </div>
                            ))}
                            {session.pendingVolunteers.length > 1 && (
                              <span className="text-xs text-slate-400">+{session.pendingVolunteers.length - 1} more</span>
                            )}
                          </div>
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
                variant="outline"
                className="mx-auto"
                onClick={() => {
                  setIsDaySessionsDialogOpen(false);
                  setNewSession({
                    ...newSession,
                    date: selectedDayDate ? format(selectedDayDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
                  });
                  setIsCreateDialogOpen(true);
                }}
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
