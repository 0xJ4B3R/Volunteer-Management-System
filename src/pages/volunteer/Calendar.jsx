import { Calendar, CalendarDays, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Layout } from '@/components/volunteer/Layout';
import LoadingScreen from "@/components/volunteer/InnerLS";
import "./styles/Calendar.css";

// Import proper Firestore hooks and types
import { useCalendarSlots, useUpdateCalendarSlot } from "@/hooks/useFirestoreCalendar";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import { useResidents } from "@/hooks/useFirestoreResidents";
import { useMatchingRules } from "@/hooks/useMatchingRules";
import { matchVolunteersToResidents } from "@/utils/matchingAlgorithm";
import { Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Utility: Get default color for sessions
const getSessionColor = () => {
  return "bg-[#6b7280] text-white";
};

// Utility: Get default border color for sessions
const getSessionBorderColor = () => {
  return "#4b5563";
};

// Utility: Only allow sign up for today or future events
const isEventAvailable = (eventDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);
  return eventDay >= today;
};

// Updated utility: Convert 24-hour time string to minutes for sorting
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;

  // Handle 24-hour format
  const timeParts = timeStr.split(':');
  if (timeParts.length === 2) {
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    return hours * 60 + minutes;
  }

  // Fallback for single number like "9" or "13"
  const hours = parseInt(timeStr, 10);
  return hours * 60;
};

// Function to sort slots by time
const sortSlotsByTime = (slots) => {
  return [...slots].sort((a, b) => {
    const aMinutes = timeToMinutes(a.startTime);
    const bMinutes = timeToMinutes(b.startTime);
    return aMinutes - bMinutes;
  });
};

// Calculate vertical position based on time
const calculateTimePosition = (timeStr) => {
  const minutes = timeToMinutes(timeStr);
  const startOfDay = 9 * 60; // 9 AM in minutes (540 minutes)
  const pixelsPerHour = 50; // Pixels per hour - adjust this for spacing

  if (minutes < startOfDay) {
    return 0; // Before 9 AM, place at top
  }

  return ((minutes - startOfDay) / 60) * pixelsPerHour;
};

// Position slots by actual time
const positionSlotsByTime = (slotsForDay) => {
  const sortedSlots = sortSlotsByTime(slotsForDay);

  // Group slots that have the exact same start time for stacking
  const timeGroups = {};
  sortedSlots.forEach(slot => {
    const key = slot.startTime;
    if (!timeGroups[key]) timeGroups[key] = [];
    timeGroups[key].push(slot);
  });

  // Create positioned slots with calculated top positions
  const positionedSlots = [];

  Object.entries(timeGroups).forEach(([time, slots]) => {
    const basePosition = calculateTimePosition(time);

    slots.forEach((slot, stackIndex) => {
      positionedSlots.push({
        ...slot,
        topPosition: basePosition,
        stackIndex: stackIndex,
        totalInStack: slots.length
      });
    });
  });

  return positionedSlots;
};

// Utility: Check user approval status for a slot
const getUserApprovalStatus = (slot, currentUser, pendingRequests = new Set(), volunteers = []) => {
  if (!currentUser) return null;

  // Check if we have a local pending request first
  if (pendingRequests.has(slot.id)) {
    return "pending";
  }

  if (!slot.volunteerRequests) return null;

  // Find the volunteer record that corresponds to this user
  const volunteer = volunteers.find(v =>
    v.userId === currentUser.id ||
    v.userId === currentUser.uid ||
    v.id === currentUser.id ||
    v.id === currentUser.uid
  );

  if (!volunteer) return null;

  const userRequest = slot.volunteerRequests.find(vr =>
    vr.volunteerId === volunteer.id
  );

  return userRequest ? userRequest.status : null;
};

const VolunteerCalendar = () => {
  const navigate = useNavigate();

  const { t, i18n } = useTranslation('calendar');
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const langToggleRef = useRef(null);

  // Robust language direction management
  const applyLanguageDirection = (lang) => {
    const dir = lang === 'he' ? 'rtl' : 'ltr';

    // 1. Set the dir attribute on html element
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);

    // 2. Remove any stale RTL/LTR classes
    document.body.classList.remove('rtl', 'ltr');
    document.documentElement.classList.remove('rtl', 'ltr');

    // 3. Add the correct direction class
    document.body.classList.add(dir);
    document.documentElement.classList.add(dir);

    // 4. Set CSS direction property explicitly
    document.body.style.direction = dir;
    document.documentElement.style.direction = dir;

    // 5. Remove any conflicting inline styles
    const rootElements = document.querySelectorAll('[style*="direction"]');
    rootElements.forEach(el => {
      if (el !== document.body && el !== document.documentElement) {
        el.style.direction = '';
      }
    });
  };

  useEffect(() => {
    applyLanguageDirection(currentLanguage);
  }, [currentLanguage]);

  // Sync currentLanguage with i18n.language
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      setCurrentLanguage(i18n.language);
    }
  }, [i18n.language, currentLanguage]);

  // Handle click outside language toggle to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langToggleRef.current && !langToggleRef.current.contains(event.target)) {
        setShowLangOptions(false);
      }
    };

    if (showLangOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangOptions]);

  // Current date state for navigation
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Use proper Firestore hooks
  const { slots: calendarSlots, loading: isLoading, error } = useCalendarSlots();
  const { updateCalendarSlot } = useUpdateCalendarSlot();
  const { volunteers } = useVolunteers();
  const { residents } = useResidents();
  const { rules: matchingRules } = useMatchingRules();

  const [viewMode, setViewMode] = useState("week");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(new Set()); // Track locally submitted requests

  // Check authentication
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      if (!user.username) {
        navigate("/login");
      } else if (user.role !== "volunteer") {
        navigate("/manager");
      } else {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  }, [navigate]);

  // Clean up pending requests when real-time data updates
  useEffect(() => {
    if (calendarSlots.length > 0 && currentUser && volunteers.length > 0) {
      const updatedPendingRequests = new Set();

      // Find the volunteer record that corresponds to this user
      const volunteer = volunteers.find(v =>
        v.userId === currentUser.id ||
        v.userId === currentUser.uid ||
        v.id === currentUser.id ||
        v.id === currentUser.uid
      );

      if (volunteer) {
        pendingRequests.forEach(slotId => {
          const slot = calendarSlots.find(s => s.id === slotId);
          if (slot) {
            const hasRealRequest = slot.volunteerRequests?.some(vr =>
              vr.volunteerId === volunteer.id
            );

            // Keep in pending if no real request found yet
            if (!hasRealRequest) {
              updatedPendingRequests.add(slotId);
            }
          }
        });

        if (updatedPendingRequests.size !== pendingRequests.size) {
          setPendingRequests(updatedPendingRequests);
        }
      }
    }
  }, [calendarSlots, currentUser, pendingRequests, volunteers]);

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
  };

  // Function to handle user signup for a session
  const handleSignUp = async (slot) => {
    if (!currentUser || !currentUser.username) {
      navigate("/");
      return;
    }

    if (!slot.isOpen || !isEventAvailable(new Date(slot.date))) {
      console.warn("Cannot sign up: slot is not open or not available");
      return;
    }

    // Check if user is already signed up
    const userStatus = getUserApprovalStatus(slot, currentUser, pendingRequests, volunteers);
    if (userStatus) {
      console.warn("User already has a request with status:", userStatus);
      return; // User already has a request
    }

    setSignupLoading(true);

    try {
      console.log("Attempting to sign up user:", currentUser.username, "for slot:", slot.id);
      console.log("Current user object:", currentUser);
      console.log("User ID fields - id:", currentUser.id, "uid:", currentUser.uid, "username:", currentUser.username);

      // Find the volunteer record that corresponds to this user
      const volunteer = volunteers.find(v =>
        v.userId === currentUser.id ||
        v.userId === currentUser.uid ||
        v.id === currentUser.id ||
        v.id === currentUser.uid
      );

      if (!volunteer) {
        console.error("Could not find volunteer record for user:", currentUser);
        throw new Error("Volunteer record not found. Please contact support.");
      }

      console.log("Found volunteer record:", volunteer);

      // Check if slot has no residents assigned and run matching algorithm
      let matchScore = null;
      let assignedResidentId = null;

      if (slot.residentIds && slot.residentIds.length === 0 && residents.length > 0 && matchingRules.length > 0) {
        console.log("No residents assigned to slot, running matching algorithm...");

        // Convert UI types to backend types for matching algorithm (following MatchingRules.tsx pattern)
        const convertedVolunteer = { ...volunteer, createdAt: Timestamp.fromDate(new Date(volunteer.createdAt)) };
        const convertedResidents = residents.map(r => ({ ...r, createdAt: Timestamp.fromDate(new Date(r.createdAt)) }));
        const convertedRules = matchingRules.map(rule => ({ ...rule, updatedAt: Timestamp.fromDate(new Date(rule.updatedAt)) }));

        // Run matching algorithm one volunteer against each resident (matching MatchingRules.tsx pattern)
        const matchResults = convertedResidents.map(resident => {
          const matchResult = matchVolunteersToResidents([convertedVolunteer], [resident], convertedRules)[0];
          return {
            volunteerId: convertedVolunteer.id,
            volunteerName: convertedVolunteer.fullName,
            residentId: resident.id,
            residentName: resident.fullName,
            score: matchResult?.score ?? 0,
            factors: matchResult?.factors ?? [],
          };
        });

        if (matchResults.length > 0) {
          // Find the best match by sorting scores in descending order
          const bestMatch = matchResults.sort((a, b) => b.score - a.score)[0];

          if (bestMatch) {
            matchScore = bestMatch.score;
            assignedResidentId = bestMatch.residentId;
            console.log("Best resident match found:", {
              residentId: assignedResidentId,
              residentName: bestMatch.residentName,
              score: matchScore
            });
          }
        }
      }

      // Use direct Firebase update with arrayUnion (matching TestVolunteerRequests pattern)
      const slotRef = doc(db, "calendar_slots", slot.id);

      await updateDoc(slotRef, {
        volunteerRequests: arrayUnion({
          volunteerId: volunteer.id,
          status: "pending",
          requestedAt: Timestamp.now(),
          approvedAt: null,
          rejectedAt: null,
          rejectedReason: null,
          matchScore: matchScore,
          assignedResidentId: assignedResidentId,
          assignedBy: "ai"
        })
      });

      // Add to local pending requests for immediate UI feedback
      setPendingRequests(prev => new Set([...prev, slot.id]));

      console.log("Successfully submitted request for session");
      // Note: Success feedback will be visible when the component re-renders with updated data

    } catch (error) {
      console.error("Error signing up for session:", error);
      alert(t("Failed to submit request") + ": " + error.message);
    } finally {
      setSignupLoading(false);
    }
  };

  // Get displayed dates for week view
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Get displayed dates for month
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getMonthGrid = (date) => {
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), d));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  // Filter slots based on selected date and showOnlyAvailable setting
  const getFilteredSlots = () => {
    let filtered = calendarSlots.filter(slot => {
      // Convert date string to Date object for comparison
      const slotDate = new Date(slot.date);
      return !isNaN(slotDate.getTime());
    });

    if (viewMode === "week") {
      const weekDates = getWeekDates();
      const startDate = weekDates[0];
      const endDate = weekDates[6];
      filtered = filtered.filter(slot => {
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate >= startDate && slotDate <= endDate;
      });
    }
    else if (viewMode === "month") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      filtered = filtered.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate.getFullYear() === year && slotDate.getMonth() === month;
      });
    }

    // Check the isOpen property correctly
    if (showOnlyAvailable) {
      filtered = filtered.filter(slot => slot.isOpen === true);
    }

    return filtered;
  };

  // Format date for display
  const formatDateDisplay = () => {
    const getShortDate = (date) => {
      const day = date.getDate();
      const month = t(`months_short.${date.getMonth()}`);
      return `${day} ${month}`;
    };

    if (viewMode === "week") {
      const weekDates = getWeekDates();
      return `${getShortDate(weekDates[0])} - ${getShortDate(weekDates[6])}`;
    } else {
      const month = t(`months.${currentDate.getMonth()}`);
      const year = currentDate.getFullYear();
      return `${month} ${year}`;
    }
  };

  // Render session slot with improved stacking
  const renderSessionSlot = (slot, stackIdx = 0, totalInStack = 1) => {
    const borderColor = getSessionBorderColor();
    const hasUserRequest = slot.volunteerRequests?.some(vr =>
      vr.volunteerId === currentUser?.uid ||
      vr.volunteerId === currentUser?.id ||
      vr.volunteerId === currentUser?.username
    );
    const hasPendingRequests = slot.volunteerRequests?.some(vr => vr.status === "pending");
    const userApprovalStatus = getUserApprovalStatus(slot, currentUser, pendingRequests, volunteers);

    return (
      <Dialog key={slot.id}>
        <DialogTrigger asChild>
          <div
            className={`time-slot ${getSessionColor()}${!slot.isOpen ? " unavailable-slot" : ""}`}
            style={{
              position: stackIdx > 0 ? "absolute" : "relative",
              top: stackIdx > 0 ? `${stackIdx * 12}px` : "0",
              left: stackIdx > 0 ? `${stackIdx * 12}px` : "0",
              zIndex: 10 + stackIdx,
              width: stackIdx > 0 ? `calc(100% - ${stackIdx * 12}px)` : "100%",
              boxShadow: stackIdx === totalInStack - 1 ? "0 4px 12px rgba(60,60,60,0.15)" : "0 2px 6px rgba(60,60,60,0.08)",
              borderLeft: "4px solid",
              borderLeftColor: borderColor,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              if (stackIdx < totalInStack - 1) {
                e.target.style.transform = "scale(1.02)";
                e.target.style.boxShadow = "0 6px 20px rgba(60,60,60,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (stackIdx < totalInStack - 1) {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = stackIdx === totalInStack - 1 ? "0 4px 12px rgba(60,60,60,0.15)" : "0 2px 6px rgba(60,60,60,0.08)";
              }
            }}
          >
            {/* Show approval status badges */}
            {userApprovalStatus === "approved" && (
              <div className="approved-badge" style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                backgroundColor: "#10b981",
                color: "white",
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "12px",
                fontWeight: "bold",
                zIndex: 20
              }}>
                {t("SessionStatus.approved")}
              </div>
            )}

            {userApprovalStatus === "pending" && (
              <div className="pending-badge" style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                backgroundColor: "#f59e0b",
                color: "white",
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "12px",
                fontWeight: "bold",
                zIndex: 20
              }}>
                {t("SessionStatus.pending")}
              </div>
            )}

            {userApprovalStatus === "rejected" && (
              <div className="rejected-badge" style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                backgroundColor: "#ef4444",
                color: "white",
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "12px",
                fontWeight: "bold",
                zIndex: 20
              }}>
                {t("SessionStatus.rejected")}
              </div>
            )}

            <div className="time-slot-header">
              <span className="start-time">{slot.startTime}</span>
            </div>
            <div className="time-range">
              {slot.startTime} - {slot.endTime}
            </div>
            <div className="volunteers-count">
              <Users className="h-3 w-3" />
              <span>
                {slot.approvedVolunteers?.length || 0}/{slot.maxCapacity || 1}
              </span>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-md rounded-xl shadow-xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold mb-4">
              {t("Sign Up for Session")}
            </DialogTitle>
            <DialogDescription className="flex items-center text-gray-500 text-sm mb-4">
              <span className="mr-2 font-medium">{t("Date:")}</span>
              <span>{new Date(slot.date).toDateString()}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">{t("Time:")}</span>
              <span className="bg-gray-100 rounded px-2 py-0.5 text-gray-800 text-sm">
                {slot.startTime} - {slot.endTime}
              </span>
            </div>

            {/* Show current status if user has signed up */}
            {userApprovalStatus && (
              <div className="mt-4 p-3 rounded-lg" style={{
                backgroundColor: userApprovalStatus === "approved" ? "#d1fae5" : userApprovalStatus === "rejected" ? "#fee2e2" : "#fef3c7",
                border: `1px solid ${userApprovalStatus === "approved" ? "#10b981" : userApprovalStatus === "rejected" ? "#ef4444" : "#f59e0b"}`
              }}>
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{
                    color: userApprovalStatus === "approved" ? "#065f46" : userApprovalStatus === "rejected" ? "#991b1b" : "#92400e"
                  }}>
                    {t("SessionStatus.label")}: {
                      userApprovalStatus === "approved"
                        ? t("SessionStatus.approved") + " ✅"
                        : userApprovalStatus === "rejected"
                          ? t("SessionStatus.rejected") + " ❌"
                          : t("SessionStatus.pendingApproval") + " ⏳"
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={
                !slot.isOpen ||
                !isEventAvailable(new Date(slot.date)) ||
                signupLoading ||
                userApprovalStatus
              }
              style={
                (!slot.isOpen || !isEventAvailable(new Date(slot.date)) || signupLoading || userApprovalStatus)
                  ? { background: "#e5e7eb", color: "#9ca3af", width: "100%", padding: "10px", borderRadius: "6px", cursor: "not-allowed" }
                  : { background: "#416a42", color: "#fff", width: "100%", padding: "10px", borderRadius: "6px", cursor: "pointer" }
              }
              onClick={() => handleSignUp(slot)}
            >
              {signupLoading
                ? t("Submitting Request...")
                : userApprovalStatus === "approved"
                  ? t("Already Approved")
                  : userApprovalStatus === "rejected"
                    ? t("Request Rejected")
                    : userApprovalStatus === "pending"
                      ? t("Request Pending")
                      : (!slot.isOpen || !isEventAvailable(new Date(slot.date)))
                        ? t("Not Available")
                        : t("Request to Join")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    console.error("Calendar error:", error);
  }

  return (
    <Layout>
      <div className="volunteer-calendar-container">
        <div className="main-content-container">
          <main className="calendar-main-content">
            {/* Calendar Header */}
            <div className="calendar-header">
              <div className="calendar-navigation">
                <div className="flex items-center gap-4" dir={i18n.language === "he" ? "rtl" : "ltr"}>
                  {/* Previous button - always on the left */}
                  <button
                    onClick={navigatePrevious}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={t(viewMode === "week" ? "Previous Week" : "Previous Month")}
                  >
                    {/* Flip icon based on language */}
                    {i18n.language === "he" ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      <ChevronLeft className="h-5 w-5" />
                    )}
                  </button>

                  {/* Date display */}
                  <div className="current-date-display">
                    {formatDateDisplay()}
                  </div>

                  {/* Next button - always on the right */}
                  <button
                    onClick={navigateNext}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={t(viewMode === "week" ? "Next Week" : "Next Month")}
                  >
                    {/* Flip icon based on language */}
                    {i18n.language === "he" ? (
                      <ChevronLeft className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>

                  {/* Today button */}
                  <button
                    onClick={goToToday}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    {t("Today")}
                  </button>
                </div>
              </div>
              <div className="calendar-controls">
                <div className="view-mode-tabs">
                  <button
                    className={`tab-trigger flex items-center ${i18n.language === "he" ? "flex-row-reverse" : "flex-row"
                      } gap-1 ${viewMode === "week" ? "active" : ""}`}
                    onClick={() => setViewMode("week")}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>{t("Week")}</span>
                  </button>
                  <button
                    className={`tab-trigger flex items-center ${i18n.language === "he" ? "flex-row-reverse" : "flex-row"
                      } gap-1 ${viewMode === "month" ? "active" : ""}`}
                    onClick={() => setViewMode("month")}
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span>{t("Month")}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Calendar Content */}
            <div className="calendar-content-container">
              {viewMode === "week" && (
                <div>
                  {/* Week Header */}
                  <div className="week-header">
                    {getWeekDates().map((date, index) => (
                      <div
                        key={index}
                        className={cn(
                          "week-day-header",
                          date.toDateString() === new Date().toDateString() ? "current-day" : ""
                        )}
                      >
                        <div className="weekday-name">
                          {t(`days.${date.getDay()}`)}
                        </div>
                        <div className={cn(
                          "day-number",
                          date.toDateString() === new Date().toDateString() ? "current-day-number" : ""
                        )}>
                          {date.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Week Content */}
                  <div className="week-grid">
                    {getWeekDates().map((date, index) => {
                      const slotsForDay = getFilteredSlots().filter(slot => {
                        const slotDate = new Date(slot.date);
                        return slotDate.toDateString() === date.toDateString();
                      });

                      if (slotsForDay.length === 0) {
                        return (
                          <div key={index} className="week-day-column">
                            <div className="empty-state" style={{ boxShadow: "none", padding: "1rem" }}>
                              <div className="empty-description">{t("No sessions")}</div>
                            </div>
                          </div>
                        );
                      }

                      const positionedSlots = positionSlotsByTime(slotsForDay);

                      return (
                        <div key={index} className="week-day-column">
                          <div className="day-time-container" style={{ position: "relative", minHeight: "600px" }}>
                            {positionedSlots.map((slot) => {
                              const userApprovalStatus = getUserApprovalStatus(slot, currentUser, pendingRequests, volunteers);
                              const borderColor = getSessionBorderColor();

                              return (
                                <Dialog key={slot.id}>
                                  <DialogTrigger asChild>
                                    <div
                                      className={`time-slot ${getSessionColor()}${!slot.isOpen ? " unavailable-slot" : ""}`}
                                      style={{
                                        position: "absolute",
                                        top: `${slot.topPosition + (slot.stackIndex * 12)}px`,
                                        left: `${slot.stackIndex * 8}px`,
                                        zIndex: 10 + slot.stackIndex,
                                        width: `calc(100% - ${slot.stackIndex * 8}px)`,
                                        boxShadow: slot.stackIndex === slot.totalInStack - 1 ? "0 4px 12px rgba(60,60,60,0.08)" : "0 2px 6px rgba(60,60,60,0.04)",
                                        borderLeft: "4px solid",
                                        borderLeftColor: borderColor,
                                        marginBottom: "20px",
                                        minHeight: "70px"
                                      }}
                                    >
                                      {/* Show approval status badges */}
                                      {userApprovalStatus === "approved" && (
                                        <div className="approved-badge" style={{
                                          position: "absolute",
                                          top: "4px",
                                          right: "4px",
                                          backgroundColor: "#10b981",
                                          color: "white",
                                          fontSize: "10px",
                                          padding: "2px 6px",
                                          borderRadius: "12px",
                                          fontWeight: "bold",
                                          zIndex: 20
                                        }}>
                                          {t("SessionStatus.approved")}
                                        </div>
                                      )}

                                      {userApprovalStatus === "pending" && (
                                        <div className="pending-badge" style={{
                                          position: "absolute",
                                          top: "4px",
                                          right: "4px",
                                          backgroundColor: "#f59e0b",
                                          color: "white",
                                          fontSize: "10px",
                                          padding: "2px 6px",
                                          borderRadius: "12px",
                                          fontWeight: "bold",
                                          zIndex: 20
                                        }}>
                                          {t("SessionStatus.pending")}
                                        </div>
                                      )}

                                      {userApprovalStatus === "rejected" && (
                                        <div className="rejected-badge" style={{
                                          position: "absolute",
                                          top: "4px",
                                          right: "4px",
                                          backgroundColor: "#ef4444",
                                          color: "white",
                                          fontSize: "10px",
                                          padding: "2px 6px",
                                          borderRadius: "12px",
                                          fontWeight: "bold",
                                          zIndex: 20
                                        }}>
                                          {t("SessionStatus.rejected")}
                                        </div>
                                      )}

                                      <div className="time-slot-header">
                                        <span className="start-time">{slot.startTime}</span>
                                      </div>
                                      <div className="time-range">
                                        {slot.startTime} - {slot.endTime}
                                      </div>
                                      <div className="volunteers-count">
                                        <Users className="h-3 w-3" />
                                        <span>
                                          {slot.approvedVolunteers?.length || 0}/{slot.maxCapacity || 1}
                                        </span>
                                      </div>
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md rounded-xl shadow-xl bg-white p-6">
                                    <DialogHeader>
                                      <DialogTitle
                                        className="text-lg font-bold mb-4"
                                        dir="auto"
                                        style={{ textAlign: i18n.language === "he" ? "right" : "left" }}
                                      >
                                        {t("Sign Up for Session")}
                                      </DialogTitle>
                                      <DialogDescription className="flex items-center text-gray-500 text-sm mb-4">
                                        <span className="mr-2 font-medium">{t("Date:")}</span>
                                        <span>
                                          {new Date(slot.date).toLocaleDateString(i18n.language, {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                          })}
                                        </span>
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="mb-6">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700">{t("Time:")}</span>
                                        <span className="bg-gray-100 rounded px-2 py-0.5 text-gray-800 text-sm">
                                          {slot.startTime} - {slot.endTime}
                                        </span>
                                      </div>

                                      {/* Show current status if user has signed up */}
                                      {userApprovalStatus && (
                                        <div className="mt-4 p-3 rounded-lg" style={{
                                          backgroundColor: userApprovalStatus === "approved" ? "#d1fae5" : userApprovalStatus === "rejected" ? "#fee2e2" : "#fef3c7",
                                          border: `1px solid ${userApprovalStatus === "approved" ? "#10b981" : userApprovalStatus === "rejected" ? "#ef4444" : "#f59e0b"}`
                                        }}>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium" style={{
                                              color: userApprovalStatus === "approved" ? "#065f46" : userApprovalStatus === "rejected" ? "#991b1b" : "#92400e"
                                            }}>
                                              {t("SessionStatus.label")}: {
                                                userApprovalStatus === "approved"
                                                  ? t("SessionStatus.approved") + " ✅"
                                                  : userApprovalStatus === "rejected"
                                                    ? t("SessionStatus.rejected") + " ❌"
                                                    : t("SessionStatus.pendingApproval") + " ⏳"
                                              }
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        disabled={
                                          !slot.isOpen ||
                                          !isEventAvailable(new Date(slot.date)) ||
                                          signupLoading ||
                                          userApprovalStatus
                                        }
                                        style={
                                          (!slot.isOpen || !isEventAvailable(new Date(slot.date)) || signupLoading || userApprovalStatus)
                                            ? { background: "#e5e7eb", color: "#9ca3af", width: "100%", padding: "10px", borderRadius: "6px", cursor: "not-allowed" }
                                            : { background: "#416a42", color: "#fff", width: "100%", padding: "10px", borderRadius: "6px", cursor: "pointer" }
                                        }
                                        onClick={() => handleSignUp(slot)}
                                      >
                                        {signupLoading
                                          ? t("Submitting Request...")
                                          : userApprovalStatus === "approved"
                                            ? t("Already Approved")
                                            : userApprovalStatus === "rejected"
                                              ? t("Request Rejected")
                                              : userApprovalStatus === "pending"
                                                ? t("Request Pending")
                                                : (!slot.isOpen || !isEventAvailable(new Date(slot.date)))
                                                  ? t("Not Available")
                                                  : t("Request to Join")}
                                      </button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === "month" && (
                <div className="month-view">
                  <div className="month-header">
                    <span className="month-title">
                      {t(`months.${currentDate.getMonth()}`)} {currentDate.getFullYear()}
                    </span>
                  </div>
                  <div className="month-grid">
                    {/* Weekday headers */}
                    {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((key) => (
                      <div key={key} className="month-weekday">
                        {t(`daysShort.${key}`)}
                      </div>
                    ))}
                    {/* Days */}
                    {getMonthGrid(currentDate).map((date, idx) => {
                      const isToday = date && date.toDateString() === new Date().toDateString();
                      const slotsUnsorted = date
                        ? getFilteredSlots().filter(slot => {
                          const slotDate = new Date(slot.date);
                          return slotDate.toDateString() === date.toDateString();
                        })
                        : [];

                      const slots = sortSlotsByTime(slotsUnsorted);

                      return (
                        <div
                          key={idx}
                          className={`month-cell${isToday ? " today" : ""}${date ? "" : " empty"}`}
                        >
                          {date && <div className="month-day-number">{date.getDate()}</div>}
                          {slots.map((slot, slotIdx) => {
                            const userApprovalStatus = getUserApprovalStatus(slot, currentUser, pendingRequests, volunteers);
                            const borderColor = getSessionBorderColor();

                            return (
                              <Dialog key={slot.id}>
                                <DialogTrigger asChild>
                                  <div
                                    className={`month-slot ${getSessionColor()}${!slot.isOpen ? " unavailable" : ""}`}
                                    style={{
                                      borderLeft: "4px solid",
                                      borderLeftColor: borderColor,
                                      order: slotIdx,
                                      position: "relative"
                                    }}
                                    title={`Session ${slot.startTime} - ${slot.endTime}`}
                                  >
                                    <span className="month-slot-type">Session</span>
                                    <span className="month-slot-time">{slot.startTime}</span>

                                    {/* Show approval status indicator */}
                                    {userApprovalStatus === "approved" && (
                                      <span style={{
                                        display: "inline-block",
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        backgroundColor: "#10b981",
                                        marginLeft: "4px"
                                      }}></span>
                                    )}

                                    {userApprovalStatus === "pending" && (
                                      <span style={{
                                        display: "inline-block",
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        backgroundColor: "#f59e0b",
                                        marginLeft: "4px"
                                      }}></span>
                                    )}

                                    {userApprovalStatus === "rejected" && (
                                      <span style={{
                                        display: "inline-block",
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        backgroundColor: "#ef4444",
                                        marginLeft: "4px"
                                      }}></span>
                                    )}
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-md rounded-xl shadow-xl bg-white p-6">
                                  <DialogHeader>
                                    <DialogTitle
                                      className="text-lg font-bold mb-2"
                                      dir="auto"
                                      style={{ textAlign: i18n.language === "he" ? "right" : "left" }}
                                    >
                                      {t("Sign Up for Session")}
                                    </DialogTitle>
                                    <DialogDescription className="flex items-center text-gray-500 text-sm mb-4">
                                      <span className="mr-2 font-medium">{t("Date:")}</span>
                                      <span>
                                        {new Date(slot.date).toLocaleDateString(i18n.language, {
                                          weekday: "short",
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric"
                                        })}
                                      </span>
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-700">{t("Time:")}</span>
                                      <span className="bg-gray-100 rounded px-2 py-0.5 text-gray-800 text-sm">
                                        {slot.startTime} - {slot.endTime}
                                      </span>
                                    </div>

                                    {/* Show current status if user has signed up */}
                                    {userApprovalStatus && (
                                      <div
                                        className="mt-4 p-3 rounded-lg"
                                        style={{
                                          backgroundColor:
                                            userApprovalStatus === "approved"
                                              ? "#d1fae5"
                                              : userApprovalStatus === "rejected"
                                                ? "#fee2e2"
                                                : "#fef3c7",
                                          border: `1px solid ${userApprovalStatus === "approved"
                                            ? "#10b981"
                                            : userApprovalStatus === "rejected"
                                              ? "#ef4444"
                                              : "#f59e0b"
                                            }`
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span
                                            className="font-medium"
                                            style={{
                                              color:
                                                userApprovalStatus === "approved"
                                                  ? "#065f46"
                                                  : userApprovalStatus === "rejected"
                                                    ? "#991b1b"
                                                    : "#92400e"
                                            }}
                                          >
                                            {t("SessionStatus.label")}: {
                                              userApprovalStatus === "approved"
                                                ? t("SessionStatus.approved") + " ✅"
                                                : userApprovalStatus === "rejected"
                                                  ? t("SessionStatus.rejected") + " ❌"
                                                  : t("SessionStatus.pendingApproval") + " ⏳"
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      disabled={
                                        !slot.isOpen ||
                                        !isEventAvailable(new Date(slot.date)) ||
                                        signupLoading ||
                                        userApprovalStatus
                                      }
                                      style={
                                        (!slot.isOpen || !isEventAvailable(new Date(slot.date)) || signupLoading || userApprovalStatus)
                                          ? { background: "#e5e7eb", color: "#9ca3af", width: "100%", padding: "10px", borderRadius: "6px", cursor: "not-allowed" }
                                          : { background: "#416a42", color: "#fff", width: "100%", padding: "10px", borderRadius: "6px", cursor: "pointer" }
                                      }
                                      onClick={() => handleSignUp(slot)}
                                    >
                                      {signupLoading
                                        ? t("Submitting Request...")
                                        : userApprovalStatus === "approved"
                                          ? t("Already Approved")
                                          : userApprovalStatus === "rejected"
                                            ? t("Request Rejected")
                                            : userApprovalStatus === "pending"
                                              ? t("Request Pending")
                                              : (!slot.isOpen || !isEventAvailable(new Date(slot.date)))
                                                ? t("Not Available")
                                                : t("Request to Join")}
                                    </button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
        <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`} ref={langToggleRef}>
          <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
            <Globe className="lang-icon" />
          </button>
          {showLangOptions && (
            <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
              <button onClick={async () => {
                localStorage.setItem('language', 'en');
                await i18n.changeLanguage('en');
                setCurrentLanguage('en');
                applyLanguageDirection('en');
                setShowLangOptions(false);
              }}>
                English
              </button>
              <button onClick={async () => {
                localStorage.setItem('language', 'he');
                await i18n.changeLanguage('he');
                setCurrentLanguage('he');
                applyLanguageDirection('he');
                setShowLangOptions(false);
              }}>
                עברית
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VolunteerCalendar; 