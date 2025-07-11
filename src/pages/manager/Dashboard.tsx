// React and Router
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Internationalization
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

// Icons
import {
  Menu,
  Users,
  Clock,
  Heart,
  UserPlus,
  FileText,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Custom Components
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";

// Utilities and Helpers
import { cn } from "@/lib/utils";

// Hooks
import { useAttendance } from "@/hooks/useAttendance";
import { useResidents } from "@/hooks/useFirestoreResidents";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import { useAppointments } from "@/hooks/useFirestoreCalendar";
import { useCalendarSlots } from "@/hooks/useFirestoreCalendar";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('manager-dashboard');
  const { isRTL, language } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isLoading, setIsLoading] = useState(true);

  // Real data hooks
  const { volunteers, loading: volunteersLoading } = useVolunteers();
  const { residents, loading: residentsLoading } = useResidents();
  const { slots, loading: calendarLoading } = useCalendarSlots();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { attendance, loading: attendanceLoading } = useAttendance();

  // Compute dashboard stats
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  const todaySessions = slots.filter(slot => slot.date === todayStr);
  const unconfirmedSessions = todaySessions.filter(slot => slot.status !== "full").length;
  const volunteersScheduled = todaySessions.reduce((acc, slot) => acc + (slot.approvedVolunteers?.length || 0), 0);
  const pendingVolunteers = todaySessions.reduce((acc, slot) => acc + (slot.volunteerRequests?.filter(vr => vr.status === "pending").length || 0), 0);

  // Get appointments for this month's sessions
  const thisMonthAppointments = appointments.filter(appointment => {
    const slot = slots.find(s => s.id === appointment.calendarSlotId);
    if (!slot) return false;
    const slotDate = new Date(slot.date);
    return slotDate.getMonth() === today.getMonth() && slotDate.getFullYear() === today.getFullYear();
  });

  // Calculate total hours per volunteer (not per session)
  const volunteerHoursMap = new Map<string, number>();

  thisMonthAppointments.forEach(appointment => {
    const slot = slots.find(s => s.id === appointment.calendarSlotId);
    if (!slot) return;

    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

    // Add hours for each volunteer in this session
    const slotVolunteers = appointment.volunteerIds.filter(v => v.type === 'volunteer');
    slotVolunteers.forEach(volunteer => {
      const currentHours = volunteerHoursMap.get(volunteer.id) || 0;
      volunteerHoursMap.set(volunteer.id, currentHours + duration);
    });
  });

  // Calculate average
  const totalHours = Array.from(volunteerHoursMap.values()).reduce((sum, hours) => sum + hours, 0);
  const volunteerCount = volunteerHoursMap.size;
  const averageHoursPerVolunteerThisMonth = volunteerCount > 0
    ? (totalHours / volunteerCount).toFixed(1)
    : '0';

  // Remove .0 if it's a whole number
  const displayAverage = averageHoursPerVolunteerThisMonth.endsWith('.0')
    ? averageHoursPerVolunteerThisMonth.slice(0, -2)
    : averageHoursPerVolunteerThisMonth;

  // Note: This calculation is based on real session and appointment data.
  // To make it even more accurate, we could:
  // 1. Check actual attendance records to only count volunteers who showed up
  // 2. Filter for completed vs. canceled appointments
  // 3. Exclude external groups from volunteer counts

  // Get today's appointments and their attendance
  const todayAppointments = appointments.filter(appointment => {
    const slot = slots.find(s => s.id === appointment.calendarSlotId);
    return slot && slot.date === todayStr;
  });

  // Get volunteers checked in today
  const volunteersCheckedInToday = todayAppointments.reduce((acc, appointment) => {
    const slot = slots.find(s => s.id === appointment.calendarSlotId);
    if (!slot) return acc;

    // Get attendance records for this appointment
    const appointmentAttendance = attendance.filter(a => a.appointmentId === appointment.id);

    // Find volunteers who have attendance marked as present AND confirmed by themselves
    const checkedInVolunteers = appointment.volunteerIds
      .filter(v => v.type === 'volunteer')
      .filter(v => {
        const hasPresentAttendance = appointmentAttendance.some(a =>
          a.volunteerId.id === v.id &&
          a.volunteerId.type === 'volunteer' &&
          a.status === 'present' &&
          a.confirmedBy === 'volunteer'
        );
        return hasPresentAttendance;
      })
      .map(v => {
        // Find the attendance record to get the confirmation time
        const attendanceRecord = appointmentAttendance.find(a =>
          a.volunteerId.id === v.id &&
          a.volunteerId.type === 'volunteer' &&
          a.status === 'present' &&
          a.confirmedBy === 'volunteer'
        );

        return {
          id: v.id,
          name: volunteers.find(vol => vol.id === v.id)?.fullName || 'Unknown',
          appointmentId: appointment.id,
          slotTime: `${slot.startTime} - ${slot.endTime}`,
          slotDate: slot.date,
          confirmedAt: attendanceRecord?.confirmedAt || null
        };
      });

    return [...acc, ...checkedInVolunteers];
  }, [] as Array<{ id: string, name: string, appointmentId: string, slotTime: string, slotDate: string, confirmedAt: string | null }>);

  // Get volunteers with missing attendance from ALL completed appointments
  const completedAppointments = appointments.filter(appointment => {
    const slot = slots.find(s => s.id === appointment.calendarSlotId);
    return slot && appointment.status === 'completed';
  });

  // Get all volunteers with missing attendance - check for volunteers who have NO attendance records
  const volunteersWithMissingAttendance = completedAppointments.reduce((acc, appointment) => {
    const slot = slots.find(s => s.id === appointment.calendarSlotId);
    if (!slot) return acc;

    // Get all volunteers in this appointment
    const appointmentVolunteers = appointment.volunteerIds.filter(v => v.type === 'volunteer');

    // Get attendance records for this appointment
    const appointmentAttendance = attendance.filter(a => a.appointmentId === appointment.id);

    // Find volunteers who have NO attendance records at all
    const volunteersWithoutAttendance = appointmentVolunteers
      .filter(volunteerId => {
        // Check if this volunteer has an attendance record for this appointment
        const hasAttendance = appointmentAttendance.some(a =>
          a.volunteerId.id === volunteerId.id && a.volunteerId.type === 'volunteer'
        );
        return !hasAttendance;
      })
      .map(v => ({
        id: v.id,
        name: volunteers.find(vol => vol.id === v.id)?.fullName || 'Unknown',
        appointmentId: appointment.id,
        slotTime: `${slot.startTime} - ${slot.endTime}`,
        slotDate: slot.date
      }));

    return [...acc, ...volunteersWithoutAttendance];
  }, [] as Array<{ id: string, name: string, appointmentId: string, slotTime: string, slotDate: string }>);

  // Check if all data is loaded and processed
  const isDataFullyLoaded = !volunteersLoading && !appointmentsLoading && !calendarLoading && !attendanceLoading;

  // Get TODO items
  const todoItems = [
    // Volunteers with missing languages
    ...volunteers
      .filter(v => !v.languages || v.languages.length === 0)
      .map(v => ({
        type: 'missing_languages' as const,
        title: `${v.fullName} - ${t('performanceAlerts.missingLanguages')}`,
        description: t('performanceAlerts.missingLanguagesDescription'),
        priority: 'high' as const,
        volunteerId: v.id
      })),
    // Volunteers with missing availability
    ...volunteers
      .filter(v => !v.availability || Object.values(v.availability).every(slots => slots.length === 0))
      .map(v => ({
        type: 'missing_availability' as const,
        title: `${v.fullName} - ${t('performanceAlerts.missingAvailability')}`,
        description: t('performanceAlerts.missingAvailabilityDescription'),
        priority: 'high' as const,
        volunteerId: v.id
      })),
    // Residents with missing languages
    ...residents
      .filter(r => !r.languages || r.languages.length === 0)
      .map(r => ({
        type: 'missing_languages' as const,
        title: `${r.fullName} - ${t('performanceAlerts.missingLanguagesResident')}`,
        description: t('performanceAlerts.missingLanguagesResidentDescription'),
        priority: 'high' as const,
        residentId: r.id
      })),
    // Residents with missing availability
    ...residents
      .filter(r => !r.availability || Object.values(r.availability).every(slots => slots.length === 0))
      .map(r => ({
        type: 'missing_availability' as const,
        title: `${r.fullName} - ${t('performanceAlerts.missingAvailabilityResident')}`,
        description: t('performanceAlerts.missingAvailabilityResidentDescription'),
        priority: 'high' as const,
        residentId: r.id
      })),
    // Volunteers who haven't had a session for at least a month (using appointmentHistory)
    ...volunteers
      .filter(v => {
        if (!v.appointmentHistory || v.appointmentHistory.length === 0) return true; // Never had a session
        // Only consider completed sessions
        const completedSessions = v.appointmentHistory.filter(session => session.status === 'completed');
        if (completedSessions.length === 0) return true; // No completed sessions
        const lastSession = completedSessions[completedSessions.length - 1];
        const lastSessionDate = new Date(lastSession.date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return lastSessionDate < oneMonthAgo;
      })
      .map(v => ({
        type: 'inactive_volunteer' as const,
        title: `${v.fullName} - ${t('performanceAlerts.inactiveVolunteer')}`,
        description: (() => {
          if (!v.appointmentHistory || v.appointmentHistory.length === 0) return t('performanceAlerts.noSessionsRecorded');
          const completedSessions = v.appointmentHistory.filter(session => session.status === 'completed');
          if (completedSessions.length === 0) return t('performanceAlerts.noCompletedSessions');
          const lastSession = completedSessions[completedSessions.length - 1];
          const daysSince = Math.floor((new Date().getTime() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24));
          return `${t('performanceAlerts.noCompletedSessionsFor')} ${daysSince} ${t('performanceAlerts.days')}`;
        })(),
        priority: 'medium' as const,
        volunteerId: v.id
      })),
    // Residents who haven't had a session for at least a month (using appointmentHistory)
    ...residents
      .filter(r => {
        if (!r.appointmentHistory || r.appointmentHistory.length === 0) return true; // Never had a session
        // Only consider completed sessions
        const completedSessions = r.appointmentHistory.filter(session => session.status === 'completed');
        if (completedSessions.length === 0) return true; // No completed sessions
        const lastSession = completedSessions[completedSessions.length - 1];
        const lastSessionDate = new Date(lastSession.date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return lastSessionDate < oneMonthAgo;
      })
      .map(r => ({
        type: 'inactive_resident' as const,
        title: `${r.fullName} - ${t('performanceAlerts.inactiveResident')}`,
        description: (() => {
          if (!r.appointmentHistory || r.appointmentHistory.length === 0) return t('performanceAlerts.noSessionsRecorded');
          const completedSessions = r.appointmentHistory.filter(session => session.status === 'completed');
          if (completedSessions.length === 0) return t('performanceAlerts.noCompletedSessions');
          const lastSession = completedSessions[completedSessions.length - 1];
          const daysSince = Math.floor((new Date().getTime() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24));
          return `${t('performanceAlerts.noCompletedSessionsFor')} ${daysSince} ${t('performanceAlerts.days')}`;
        })(),
        priority: 'medium' as const,
        residentId: r.id
      })),
    // Sessions with low volunteer count (less than 50% capacity)
    ...slots
      .filter(slot => {
        const slotDate = new Date(slot.date);
        const now = new Date();

        // Include future sessions and today's sessions that haven't started yet
        const isFutureOrTodayNotStarted = (() => {
          if (slotDate > now) return true; // Future dates
          if (slotDate.toDateString() === now.toDateString()) {
            // Today's session - check if it hasn't started yet
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const sessionStartTime = new Date(slotDate);
            sessionStartTime.setHours(startHour, startMinute, 0, 0);
            return now < sessionStartTime;
          }
          return false; // Past sessions
        })();

        return isFutureOrTodayNotStarted &&
          slot.approvedVolunteers.length < (slot.maxCapacity * 0.5) &&
          slot.status !== 'canceled';
      })
      .map(slot => ({
        type: 'low_capacity_session' as const,
        title: `${t('performanceAlerts.lowCapacitySession')} - ${new Date(slot.date).toLocaleDateString()}`,
        description: `${slot.approvedVolunteers.length}/${slot.maxCapacity} ${t('todaySessions.volunteers')} (${Math.round((slot.approvedVolunteers.length / slot.maxCapacity) * 100)}% ${t('performanceAlerts.capacity')})`,
        priority: 'medium' as const,
        sessionId: slot.id
      })),
    // Capacity planning
    {
      type: 'capacity_planning' as const,
      title: t('performanceAlerts.capacityPlanning'),
      description: (() => {
        const fullSessionsCount = todaySessions.filter(s => s.status === 'full').length;
        return t('performanceAlerts.capacityPlanningDescription', { count: fullSessionsCount });
      })(),
      priority: 'medium' as const
    },
    // Engagement opportunities
    {
      type: 'engagement_opportunity' as const,
      title: t('performanceAlerts.lowEngagementVolunteers'),
      description: (() => {
        const lowEngagementCount = volunteers.filter(v => (v.totalSessions || 0) < 3).length;
        return t('performanceAlerts.lowEngagementDescription', { count: lowEngagementCount });
      })(),
      priority: 'medium' as const
    },
    // New volunteers onboarding
    {
      type: 'onboarding' as const,
      title: t('performanceAlerts.newVolunteerOnboarding'),
      description: (() => {
        const newVolunteersCount = volunteers.filter(v => {
          const created = new Date(v.createdAt);
          return (new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24) <= 7;
        }).length;
        return t('performanceAlerts.newVolunteerOnboardingDescription', { count: newVolunteersCount });
      })(),
      priority: 'medium' as const
    },
    // Matching optimization
    {
      type: 'matching_optimization' as const,
      title: t('performanceAlerts.reviewMatchingRules'),
      description: t('performanceAlerts.reviewMatchingRulesDescription'),
      priority: 'low' as const
    }
  ];

  const dashboardData = {
    todayStats: {
      totalSessions: todaySessions.length,
      volunteersScheduled,
      unconfirmedSessions,
      sessions: todaySessions,
    },
    volunteerStats: {
      totalVolunteers: volunteers.length,
      activeVolunteers: volunteers.filter(v => v.isActive).length,
      newVolunteers: volunteers.filter(v => {
        const created = new Date(v.createdAt);
        return (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) <= 30;
      }).length,
      volunteerEngagement: Math.round(
        (volunteers.filter(v => (v.totalSessions || 0) > 0).length / (volunteers.length || 1)) * 100
      ),
    },
    residentStats: {
      totalResidents: residents.length,
      activeResidents: residents.filter(r => r.isActive).length,
      newResidents: residents.filter(r => {
        const created = new Date(r.createdAt);
        return (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) <= 30;
      }).length,
      residentCoverage: Math.round(
        (residents.filter(r => (r.totalSessions || 0) > 0).length / (residents.length || 1)) * 100
      ),
    },
    quickStats: {
      upcomingSessions: slots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate > today &&
          slotDate.getMonth() === today.getMonth() &&
          slotDate.getFullYear() === today.getFullYear();
      }).length,
      pendingRequests: slots.reduce((acc, slot) =>
        acc + (slot.volunteerRequests?.filter(vr => vr.status === "pending").length || 0), 0
      ),
      totalVolunteers: volunteers.length,
      totalResidents: residents.length,
      sessionsThisMonth: slots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate.getMonth() === today.getMonth() && slotDate.getFullYear() === today.getFullYear();
      }).length,
      totalHoursThisMonth: slots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate.getMonth() === today.getMonth() && slotDate.getFullYear() === today.getFullYear();
      }).reduce((acc, slot) => {
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);
        return acc + duration;
      }, 0),
    },
    performanceMetrics: {
      engagementScore: Math.round(
        (volunteers.filter(v => (v.totalSessions || 0) > 0).length / (volunteers.length || 1)) * 10
      ),
      satisfactionRate: 90, // Placeholder, needs real calculation
      efficiencyScore: 8, // Placeholder, needs real calculation
      trends: {
        engagement: { value: 0, direction: "up" },
        satisfaction: { value: 0, direction: "up" },
        efficiency: { value: 0, direction: "up" },
      },
    },
  };

  // Add useEffect for minimum loading duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Minimum 1 second loading time

    return () => clearTimeout(timer);
  }, []);

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
    localStorage.clear();
    sessionStorage.clear();
    // Note: Redux logout should also be dispatched here for consistency
    toast({
      title: t('statusMessages.loggedOut'),
      description: t('statusMessages.loggedOutDescription'),
    });
    navigate("/login");
  };

  const handleAddVolunteer = () => {
    navigate("/manager/volunteers");
    setTimeout(() => {
      window.postMessage({ type: "OPEN_CREATE_VOLUNTEER_DIALOG" }, window.location.origin);
    }, 100);
  };

  const handleAddResident = () => {
    navigate("/manager/residents");
    setTimeout(() => {
      window.postMessage({ type: "OPEN_CREATE_RESIDENT_DIALOG" }, window.location.origin);
    }, 100);
  };

  const handleAddSession = () => {
    navigate("/manager/calendar");
    setTimeout(() => {
      window.postMessage({ type: "OPEN_CREATE_SESSION_DIALOG" }, window.location.origin);
    }, 100);
  };

  const handleGenerateReport = () => {
    navigate("/manager/reports");
    setTimeout(() => {
      window.postMessage({ type: "OPEN_GENERATE_REPORT_DIALOG" }, window.location.origin);
    }, 100);
  };

  const handleViewVolunteer = (volunteerId: string) => {
    navigate("/manager/volunteers");
    setTimeout(() => {
      window.postMessage({ type: "OPEN_EDIT_VOLUNTEER_DIALOG", volunteerId }, window.location.origin);
    }, 100);
  };

  const handleViewResident = (residentId: string) => {
    navigate("/manager/residents");
    setTimeout(() => {
      window.postMessage({ type: "OPEN_EDIT_RESIDENT_DIALOG", residentId }, window.location.origin);
    }, 100);
  };

  const handleViewSession = (sessionId: string) => {
    navigate("/manager/calendar");
    setTimeout(() => {
      // Find the session data and send it to open the edit dialog
      const session = slots.find(s => s.id === sessionId);
      if (session) {
        window.postMessage({
          type: "OPEN_EDIT_SESSION_DIALOG",
          sessionId: sessionId,
          session: session
        }, window.location.origin);
      }
    }, 100);
  };

  const handleMarkAttendance = (appointmentId: string) => {
    navigate("/manager/appointments");
    setTimeout(() => {
      window.postMessage({
        type: "OPEN_MARK_ATTENDANCE_DIALOG",
        appointmentId: appointmentId
      }, window.location.origin);
    }, 100);
  };

  // Helper function to get the correct volunteer count (copied from Calendar.tsx)
  const getVolunteerCount = (session: any) => {
    if (!session.approvedVolunteers || session.approvedVolunteers.length === 0) return 0;
    const firstParticipant = session.approvedVolunteers[0];
    if (firstParticipant && firstParticipant.type === 'external_group') {
      return session.maxCapacity;
    }

    return session.approvedVolunteers.length;
  };

  // Helper function to get the appropriate capacity number for display
  const getCapacityDisplay = (session: any) => {
    if (!session.approvedVolunteers || session.approvedVolunteers.length === 0) {
      return session.maxCapacity;
    }
    const firstParticipant = session.approvedVolunteers[0];
    if (firstParticipant && firstParticipant.type === 'external_group') {
      return session.maxCapacity;
    }

    // Check if session has passed (for today's sessions, check both date and time)
    const sessionDate = new Date(session.date);
    const today = new Date();
    const isToday = sessionDate.toDateString() === today.toDateString();

    if (isToday) {
      // For today's sessions, check if the start time has passed
      const [startHour, startMinute] = session.startTime.split(':').map(Number);
      const sessionStartTime = new Date(sessionDate);
      sessionStartTime.setHours(startHour, startMinute, 0, 0);

      const hasStarted = today >= sessionStartTime;
      if (hasStarted) {
        // Session has started/passed, show actual count as capacity (x/x format)
        return session.approvedVolunteers.length;
      } else {
        // Session hasn't started yet, show max capacity
        return session.maxCapacity;
      }
    } else {
      // For non-today sessions, use the original logic
      const isPast = sessionDate < today;
      if (isPast) {
        return session.approvedVolunteers.length;
      }
      return session.maxCapacity;
    }
  };

  // Helper function to get appropriate icon for TODO item type
  const getTodoIcon = (type: string) => {
    switch (type) {
      case 'missing_languages':
      case 'missing_availability':
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
      case 'inactive_volunteer':
      case 'inactive_resident':
        return <Clock className="h-6 w-6 text-blue-600" />;
      case 'low_capacity_session':
        return <Users className="h-6 w-6 text-purple-600" />;
      case 'engagement_opportunity':
        return <TrendingDown className="h-6 w-6 text-red-600" />;
      case 'matching_optimization':
        return <Target className="h-6 w-6 text-indigo-600" />;
      case 'capacity_planning':
        return <LayoutDashboard className="h-6 w-6 text-sky-600" />;
      case 'onboarding':
        return <UserPlus className="h-6 w-6 text-emerald-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-slate-600" />;
    }
  };

  // Get future sessions with pending volunteer requests (from now on)
  const now = new Date();
  const sessionsWithPendingRequests = slots.filter(slot => {
    const slotDate = new Date(slot.date);

    // Check if session is in the future or today but hasn't started yet
    const isFutureOrTodayNotStarted = (() => {
      if (slotDate > now) return true; // Future dates
      if (slotDate.toDateString() === now.toDateString()) {
        // Today's session - check if it hasn't started yet
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const sessionStartTime = new Date(slotDate);
        sessionStartTime.setHours(startHour, startMinute, 0, 0);
        return now < sessionStartTime;
      }
      return false; // Past sessions
    })();

    return isFutureOrTodayNotStarted &&
      slot.volunteerRequests && 
      slot.volunteerRequests.some(vr => vr.status === "pending");
  });

  // Calculate total pending requests from future sessions
  const totalPendingRequestsAllSessions = sessionsWithPendingRequests.reduce((acc, slot) =>
    acc + (slot.volunteerRequests?.filter(vr => vr.status === "pending").length || 0), 0
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Header - Always visible */}
      <header className="bg-white border-b border-slate-300 shadow-sm z-10 h-[69px]">
        <div className="px-6 h-full flex items-center justify-between">
          {/* Left section - Logo and menu */}
          <div className="flex items-center space-x-4 w-[200px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className={cn("flex items-center space-x-3", isRTL && "space-x-reverse")}>
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block whitespace-nowrap">{t('systemTitle')}</h1>
            </div>
          </div>
          {/* Center section - Empty for balance */}
          <div className="flex-1"></div>
          {/* Right section - Empty for balance */}
          <div className="w-[200px]"></div>
        </div>
      </header>

      {(!isDataFullyLoaded || isLoading) ? (
        <DashboardSkeleton />
      ) : (
        <>
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
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 transition-all duration-300">
              {/* No extra margin between header and content */}

              {/* Quick Actions Card - full width, first */}
              <div className="mb-8">
                <Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95 hover:shadow-lg transition-shadow duration-200 w-full">
                  <CardHeader className="pb-2 border-b border-slate-300">
                    <div>
                      <CardTitle className="text-lg font-semibold">{t('quickActions.title')}</CardTitle>
                      <CardDescription className="mt-1">{t('quickActions.description')}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2 rounded-lg border-blue-500 bg-blue-100 hover:bg-blue-200 hover:border-blue-600 transition-colors"
                        onClick={handleAddVolunteer}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('quickActions.addVolunteer')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2 rounded-lg border-pink-500 bg-pink-100 hover:bg-pink-200 hover:border-pink-600 transition-colors"
                        onClick={handleAddResident}
                      >
                        <Heart className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('quickActions.addResident')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2 rounded-lg border-green-500 bg-green-100 hover:bg-green-200 hover:border-green-600 transition-colors"
                        onClick={handleAddSession}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('quickActions.createSession')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2 rounded-lg border-purple-500 bg-purple-100 hover:bg-purple-200 hover:border-purple-600 transition-colors"
                        onClick={handleGenerateReport}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('quickActions.generateReport')}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Pending Sessions and Today's Sessions */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Today's Sessions */}
                  <Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-2 border-b border-slate-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">{t('todaySessions.title')}</CardTitle>
                          <CardDescription className="mt-1">{t('todaySessions.description')}</CardDescription>
                        </div>
                        {dashboardData?.todayStats.sessions.length > 0 && (
                          <Badge variant="secondary" className="h-7 px-3 mr-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-500 hover:border-blue-600 transition-colors font-medium text-sm shadow-sm">
                            {t('todaySessions.sessions', { count: dashboardData?.todayStats.sessions.length })}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-4">
                      <div className={cn("space-y-4 max-h-[184px] overflow-y-auto", isRTL ? "pl-2" : "pr-2")}>
                        {dashboardData?.todayStats.sessions.length > 0 ? (
                          dashboardData?.todayStats.sessions
                            .filter(session => {
                              const today = new Date();
                              const sessionDate = new Date(session.date);
                              return today.toDateString() === sessionDate.toDateString();
                            })
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((session) => (
                              <div
                                key={session.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors mb-2 ${session.status === "full"
                                  ? "bg-amber-100 border-amber-600 hover:bg-amber-200 hover:border-amber-700"
                                  : session.status === "canceled"
                                    ? "bg-red-50 border-red-500 hover:bg-red-100 hover:border-red-600"
                                    : session.status === "open"
                                      ? "bg-blue-50 border-blue-500 hover:bg-blue-100 hover:border-blue-600"
                                      : "bg-white border-gray-300 hover:bg-gray-100"
                                  }`}
                                onClick={() => handleViewSession(session.id)}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex flex-col justify-center">
                                    <div className="font-medium">
                                      {session.startTime} - {session.endTime}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">
                                      {t('todaySessions.volunteersCount', {
                                        current: getVolunteerCount(session),
                                        capacity: getCapacityDisplay(session)
                                      })}
                                    </div>
                                  </div>

                                </div>
                                {session.notes && (
                                  <div className="text-sm text-slate-600 mt-2">
                                    {session.notes}
                                  </div>
                                )}
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">{t('todaySessions.noSessionsToday')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pending Volunteers */}
                  <Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-2 border-b border-slate-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">{t('pendingVolunteers.title')}</CardTitle>
                          <CardDescription className="mt-1">{t('pendingVolunteers.description')}</CardDescription>
                        </div>
                        {isDataFullyLoaded && totalPendingRequestsAllSessions > 0 && (
                          <Badge variant="secondary" className="h-7 px-3 mr-2 bg-amber-100 text-amber-700 border-amber-600 hover:border-amber-700 hover:bg-amber-200 transition-colors font-medium text-sm shadow-sm">
                            {t('pendingVolunteers.pending' + (totalPendingRequestsAllSessions == 1 ? '' : '_plural'), { count: totalPendingRequestsAllSessions })}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-4">
                      <div className={cn("space-y-4 max-h-[184px] overflow-y-auto", isRTL ? "pl-2" : "pr-2")}>
                        {sessionsWithPendingRequests.length > 0 ? (
                          sessionsWithPendingRequests
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((session) => (
                              <div
                                key={session.id}
                                className="p-4 border rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors border-blue-500 hover:border-blue-600 mb-2"
                                onClick={() => {
                                  navigate("/manager/calendar");
                                  setTimeout(() => {
                                    window.postMessage({
                                      type: "OPEN_PENDING_REQUESTS_DIALOG",
                                      sessionId: session.id
                                    }, window.location.origin);
                                  }, 100);
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex flex-col justify-center">
                                    <div className="font-medium">
                                      {new Date(session.date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">
                                      {session.startTime} - {session.endTime} • {t('pendingVolunteers.volunteersCount', {
                                        current: getVolunteerCount(session),
                                        capacity: getCapacityDisplay(session)
                                      })}
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-amber-300 border-amber-600 text-amber-800 hover:bg-amber-400/75 hover:border-amber-700 hover:text-amber-800"
                                    >
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      {t('pendingVolunteers.pending', { count: session.volunteerRequests.filter(v => v.status === "pending").length })}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">{t('pendingVolunteers.noPendingVolunteers')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Quick Stats and Actions */}
                <div className="space-y-8">
                  <Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-2 border-b border-slate-300">
                      <div>
                        <CardTitle className="text-lg font-semibold">{t('quickStats.title')}</CardTitle>
                        <CardDescription className="mt-1">{t('quickStats.description')}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-4">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500 pb-1">{t('quickStats.totalVolunteers')}</p>
                            <h3 className="text-2xl font-bold">{dashboardData?.quickStats.totalVolunteers}</h3>
                          </div>
                          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center border border-slate-400">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500 pb-1">{t('quickStats.totalResidents')}</p>
                            <h3 className="text-2xl font-bold">{dashboardData?.quickStats.totalResidents}</h3>
                          </div>
                          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center border border-green-400">
                            <Heart className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500 pb-1">{t('quickStats.totalSessionsThisMonth')}</p>
                            <h3 className="text-2xl font-bold">{dashboardData?.quickStats.sessionsThisMonth}</h3>
                          </div>
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center border border-blue-400">
                            <LayoutDashboard className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500 pb-1">{t('quickStats.upcomingSessionsThisMonth')}</p>
                            <h3 className="text-2xl font-bold">{dashboardData?.quickStats.upcomingSessions}</h3>
                          </div>
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center border border-blue-400">
                            <CalendarDays className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500 pb-1">{t('quickStats.totalHoursThisMonth')}</p>
                            <h3 className="text-2xl font-bold">{Math.round(dashboardData?.quickStats.totalHoursThisMonth || 0)}</h3>
                          </div>
                          <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center border border-purple-400">
                            <Clock className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500 pb-1">{t('quickStats.avgHoursPerVolunteerThisMonth')}</p>
                            <h3 className="text-2xl font-bold">{displayAverage}</h3>
                          </div>
                          <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center  border border-indigo-400">
                            <TrendingUp className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* New Widgets Section - Two columns layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Left Column - Two rectangular widgets stacked */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Volunteers Checked In Today */}
                  <Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-2 border-b border-slate-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">{t('checkedInToday.title')}</CardTitle>
                          <CardDescription className="mt-1">{t('checkedInToday.description')}</CardDescription>
                        </div>
                        {isDataFullyLoaded && volunteersCheckedInToday.length > 0 && (
                          <Badge variant="secondary" className="h-7 px-3 mr-2 bg-emerald-50 text-emerald-700 border-emerald-500 hover:border-emerald-600 hover:bg-emerald-100 transition-colors font-medium text-sm shadow-sm">
                            {t('checkedInToday.checkedIn' + (volunteersCheckedInToday.length == 1 ? '' : '_plural'), { count: volunteersCheckedInToday.length })}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-4">
                      <div className={cn("space-y-4 max-h-[184px] overflow-y-auto", isRTL ? "pl-2" : "pr-2")}>
                        {volunteersCheckedInToday.length > 0 ? (
                          volunteersCheckedInToday
                            .sort((a, b) => new Date(a.slotDate + ' ' + a.slotTime.split(' - ')[0]).getTime() - new Date(b.slotDate + ' ' + b.slotTime.split(' - ')[0]).getTime())
                            .map((volunteer) => (
                              <div
                                key={`checked-in-${volunteer.id}-${volunteer.appointmentId}`}
                                className="p-4 border rounded-lg bg-emerald-50 hover:bg-emerald-100 border-emerald-500 hover:border-emerald-600 cursor-pointer transition-colors mb-2 flex justify-between items-center"
                                onClick={() => handleViewVolunteer(volunteer.id)}
                              >
                                <div>
                                  <div className="font-medium text-black">{volunteer.name}</div>
                                  <div className="text-sm text-slate-500 mt-1">
                                    {volunteer.slotTime}
                                    {volunteer.confirmedAt && (
                                      <span className="text-slate-500"> • {t('checkedInToday.checkedInAt')} {new Date(volunteer.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="h-9 w-9 bg-emerald-400 rounded-full flex items-center justify-center shadow ring-2 ring-emerald-100">
                                  <CheckCircle className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-6">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">{t('checkedInToday.allAttendanceConfirmed')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Volunteers with Missing Attendance */}
                  <Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-2 border-b border-slate-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">{t('missingAttendance.title')}</CardTitle>
                          <CardDescription className="mt-1">{t('missingAttendance.description')}</CardDescription>
                        </div>
                        {isDataFullyLoaded && volunteersWithMissingAttendance.length > 0 && (
                          <Badge variant="secondary" className="h-7 px-3 mr-2 bg-red-50 text-red-700 border-red-500 hover:border-red-600 hover:bg-red-100 transition-colors font-medium text-sm shadow-sm">
                            {t('missingAttendance.missing' + (volunteersWithMissingAttendance.length == 1 ? '' : '_plural'), { count: volunteersWithMissingAttendance.length })}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-4">
                      <div className={cn("space-y-4 max-h-[184px] overflow-y-auto", isRTL ? "pl-2" : "pr-2")}>
                        {volunteersWithMissingAttendance.length > 0 ? (
                          volunteersWithMissingAttendance
                            .sort((a, b) => new Date(a.slotDate + ' ' + a.slotTime.split(' - ')[0]).getTime() - new Date(b.slotDate + ' ' + b.slotTime.split(' - ')[0]).getTime())
                            .map((volunteer) => (
                              <div
                                key={`missing-attendance-${volunteer.id}-${volunteer.appointmentId}`}
                                className="p-4 border rounded-lg bg-red-50 hover:bg-red-100 border-red-500 hover:border-red-600 cursor-pointer transition-colors mb-2 flex justify-between items-center"
                                onClick={() => handleMarkAttendance(volunteer.appointmentId)}
                              >
                                <div>
                                  <div className="font-medium text-black">{volunteer.name}</div>
                                  <div className="text-sm text-slate-500 mt-1">{new Date(volunteer.slotDate).toLocaleDateString()} • {volunteer.slotTime}</div>
                                </div>
                                <div className="h-9 w-9 bg-red-400 rounded-full flex items-center justify-center shadow ring-2 ring-red-100">
                                  <XCircle className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-6">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">{t('missingAttendance.allAttendanceMarked')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Vertical TODO List Widget */}
                <div className="lg:col-span-1">
                  <Card className="shadow-md rounded-2xl border border-slate-300 bg-white/95 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-2 border-b border-slate-300">
                      <div>
                        <CardTitle className="text-lg font-semibold">{t('performanceAlerts.title')}</CardTitle>
                        <CardDescription className="mt-1">{t('performanceAlerts.description')}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-4">
                      <div className={cn("space-y-4 max-h-[448px] overflow-y-auto", isRTL ? "pl-2" : "pr-2")}>
                        {todoItems.length > 0 ? (
                          todoItems.map((item, index) => (
                            <div
                              key={index}
                              className={`p-3 border rounded-lg transition-colors cursor-pointer ${item.type === 'missing_languages' || item.type === 'missing_availability'
                                ? 'border-red-500 bg-red-50 hover:bg-red-100 hover:border-red-600'
                                : 'border-slate-400 bg-slate-50 hover:bg-slate-100 hover:border-slate-500'
                                }`}
                              onClick={() => {
                                if (item.type === 'missing_languages' || item.type === 'missing_availability') {
                                  if ('volunteerId' in item && item.volunteerId) {
                                    handleViewVolunteer(item.volunteerId);
                                  } else if ('residentId' in item && item.residentId) {
                                    handleViewResident(item.residentId);
                                  }
                                } else if (item.type === 'inactive_volunteer') {
                                  handleViewVolunteer(item.volunteerId!);
                                } else if (item.type === 'inactive_resident') {
                                  handleViewResident(item.residentId!);
                                } else if (item.type === 'low_capacity_session') {
                                  handleViewSession(item.sessionId!);
                                } else if (item.type === 'matching_optimization') {
                                  navigate("/manager/matching-rules");
                                } else if (item.type === 'onboarding') {
                                  navigate("/manager/volunteers");
                                } else if (item.type === 'capacity_planning') {
                                  navigate("/manager/calendar");
                                } else if (item.type === 'engagement_opportunity') {
                                  navigate("/manager/volunteers");
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className={cn("flex items-center flex-1", isRTL ? "space-x-reverse space-x-4" : "space-x-4")}>
                                  <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-sm bg-slate-50 border border-slate-400 flex-shrink-0 text-center leading-none">
                                    <div className="flex items-center justify-center w-full h-full">
                                      {getTodoIcon(item.type)}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-slate-800">{item.title}</p>
                                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">{t('performanceAlerts.allTasksCompleted')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </main>
          </div>
        </>
      )}
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