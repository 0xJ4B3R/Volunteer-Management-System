import { Calendar, CalendarDays, Filter, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { Layout } from "@/components/volunteer/layout"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { matchVolunteersToResidents } from "@/utils/matchingAlgorithm";
import { useMatchingRules } from "@/hooks/useMatchingRules";
import LoadingScreen from "@/components/volunteer/InnerLS";
import "./styles/Calendar.css";
import app from "@/lib/firebase";

// Utility: Get color for session type
const getSessionTypeColor = (type) => {
  switch ((type || '').toLowerCase()) {
    case "art": return "bg-[#3b82f6] text-white";
    case "baking": return "bg-[#ec4899] text-white";
    case "music": return "bg-[#f59e0b] text-white";
    case "reading": return "bg-[#10b981] text-white";
    case "crafts": return "bg-[#8b5cf6] text-white";
    case "exercise": return "bg-[#ef4444] text-white";
    case "gardening": return "bg-[#6366f1] text-white";
    case "beading": return "bg-[#14b8a6] text-white";
    case "session": return "bg-[#6b7280] text-white";
    default: return "bg-[#6b7280] text-white";
  }
};

// Utility: Get border color for session type
const getSessionTypeBorderColor = (type) => {
  switch ((type || '').toLowerCase()) {
    case "art": return "#2563eb";
    case "baking": return "#db2777";
    case "music": return "#d97706";
    case "reading": return "#059669";
    case "crafts": return "#7c3aed";
    case "exercise": return "#dc2626";
    case "gardening": return "#4f46e5";
    case "beading": return "#0d9488";
    case "session": return "#4b5563";
    default: return "#4b5563";
  }
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

// Function to group slots by time and create stacked groups
const groupSlotsByTime = (slotsForDay) => {
  const sortedSlots = sortSlotsByTime(slotsForDay);
  const groups = {};

  sortedSlots.forEach(slot => {
    const key = slot.startTime;
    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
  });

  return Object.entries(groups)
    .sort(([timeA], [timeB]) => {
      const aMinutes = timeToMinutes(timeA);
      const bMinutes = timeToMinutes(timeB);
      return aMinutes - bMinutes;
    })
    .map(([_, slots]) => slots);
};

// Utility: Check user approval status for a slot
const getUserApprovalStatus = (slot, currentUser) => {
  if (!currentUser) {
    return null;
  }
  
  if (!slot?.volunteerRequests || !Array.isArray(slot.volunteerRequests)) {
    return null;
  }

  // Get all possible user identifiers for userId field
  const userIds = [
    currentUser.uid,
    currentUser.id, 
    currentUser.username,
    currentUser.email
  ].filter(Boolean); // Remove any null/undefined values

  const userRequest = slot.volunteerRequests.find(req => {
    // Check against the userId field instead of volunteerId
    const match = userIds.includes(req.userId);
    return match;
  });

  return userRequest ? userRequest.status : null;
};

const db = getFirestore(app);

const VolunteerCalendar = () => {
  const navigate = useNavigate();

  const { t, i18n } = useTranslation("calendar");
  const [showLangOptions, setShowLangOptions] = useState(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  // Helper function to translate session types
  const translateSessionType = (sessionType) => {
    const type = (sessionType || '').toLowerCase();
    return t(`sessionTypes.${type}`, sessionType); // Fallback to original if translation not found
  };

  // Current date state for navigation
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [calendarSlots, setCalendarSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("week");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState("all");
  const [signupLoading, setSignupLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Temporary function to fix existing volunteer requests with proper volunteerId
  const fixExistingVolunteerRequests = async () => {
    if (!currentUser) return;
    
    try {
      // First, try to find the actual volunteer document
      let actualVolunteerId = "default-volunteer-id";
      try {
        const volunteersSnapshot = await getDocs(collection(db, "volunteers"));
        const volunteerDoc = volunteersSnapshot.docs.find(doc => {
          const data = doc.data();
          return data.username === currentUser.username || 
                 data.email === currentUser.email ||
                 doc.id === currentUser.id ||
                 doc.id === currentUser.uid;
        });

        if (volunteerDoc) {
          actualVolunteerId = volunteerDoc.id;
        }
      } catch (error) {
        // Could not fetch volunteers collection
      }

      const querySnapshot = await getDocs(collection(db, "calendar_slots"));
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const volunteerRequests = data.volunteerRequests || [];
        
        // Find requests that need to be fixed
        let hasUpdates = false;
        const updatedRequests = volunteerRequests.map(req => {
          // If this request has the wrong volunteerId or is missing userId
          if ((req.volunteerId === currentUser.id || req.volunteerId === 'yv5CABJ36fmsF2bBbtic') && 
              (!req.userId || req.userId !== currentUser.id)) {
            hasUpdates = true;
            return {
              ...req,
              volunteerId: actualVolunteerId, // Set to actual volunteer document ID
              userId: currentUser.id || currentUser.uid || currentUser.username // Set userId for badge matching
            };
          }
          return req;
        });
        
        if (hasUpdates) {
          // Update the document
          await updateDoc(doc(db, "calendar_slots", docSnapshot.id), {
            volunteerRequests: updatedRequests
          });
        }
      }
    } catch (error) {
      // Error fixing volunteer requests
    }
  };

  // Run the fix when component mounts (only once)
  useEffect(() => {
    if (currentUser) {
      fixExistingVolunteerRequests();
    }
  }, [currentUser]);

  const { rules, loading: loadingRules } = useMatchingRules();

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
      // Auth check error
    }
  }, [navigate]);

  // Function to calculate match score and find best resident match with real data
  const calculateMatchDetails = async (currentUser, slot) => {
    if (!currentUser || !rules.length || loadingRules) {
      return {
        matchScore: 50, // Default score instead of null
        assignedResidentId: slot.assignedResidentId || "default-resident-id",
        actualVolunteerId: "default-volunteer-id", // Default volunteer ID
        currentUserId: currentUser?.id || currentUser?.uid || currentUser?.username
      };
    }

    try {
      // Try to fetch the actual volunteer document from the volunteers collection
      let actualVolunteerId = "default-volunteer-id"; // Default fallback
      let volunteerData = currentUser;

      try {
        const volunteersSnapshot = await getDocs(collection(db, "volunteers"));
        const volunteerDoc = volunteersSnapshot.docs.find(doc => {
          const data = doc.data();
          // Match by username, email, or any identifier that links to this user
          return data.username === currentUser.username || 
                 data.email === currentUser.email ||
                 doc.id === currentUser.id ||
                 doc.id === currentUser.uid;
        });

        if (volunteerDoc) {
          actualVolunteerId = volunteerDoc.id; // Use the actual document ID from volunteers collection
          volunteerData = { ...volunteerDoc.data(), id: volunteerDoc.id };
        }
      } catch (error) {
        // Could not fetch volunteer from collection, using default ID
      }

      // Convert volunteer data to the format expected by matching algorithm
      const volunteer = {
        id: actualVolunteerId,
        fullName: volunteerData.fullName || volunteerData.username || "Unknown Volunteer",
        createdAt: volunteerData.createdAt || Timestamp.now(),
        skills: volunteerData.skills || [],
        hobbies: volunteerData.hobbies || [],
        languages: volunteerData.languages || [],
        availability: volunteerData.availability || [],
        gender: volunteerData.gender || null,
        birthDate: volunteerData.birthDate || null,
      };

      // Get residents from Firestore to find the best match
      let residents = [];
      let targetResidentId = slot.assignedResidentId;

      try {
        const residentsSnapshot = await getDocs(collection(db, "residents"));
        residents = residentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt || Timestamp.now()
        }));
      } catch (error) {
        // Error fetching residents
      }

      // If slot has a specific assigned resident, use that
      if (targetResidentId && residents.length > 0) {
        const targetResident = residents.find(r => r.id === targetResidentId);
        if (targetResident) {
          const convertedRules = rules.map(rule => ({ 
            ...rule, 
            updatedAt: Timestamp.fromDate(new Date(rule.updatedAt)) 
          }));

          const matchResults = matchVolunteersToResidents([volunteer], [targetResident], convertedRules);
          
          if (matchResults.length > 0) {
            return {
              matchScore: Math.round(matchResults[0].score),
              assignedResidentId: targetResidentId,
              actualVolunteerId: actualVolunteerId, // Actual volunteer document ID
              currentUserId: currentUser.id || currentUser.uid || currentUser.username // Current user session ID
            };
          }
        }
      }

      // If no specific resident assigned, find the best match from all residents
      if (residents.length > 0) {
        const convertedRules = rules.map(rule => ({ 
          ...rule, 
          updatedAt: Timestamp.fromDate(new Date(rule.updatedAt)) 
        }));

        const matchResults = matchVolunteersToResidents([volunteer], residents, convertedRules);
        
        if (matchResults.length > 0) {
          // Find the best match (highest score)
          const bestMatch = matchResults.reduce((best, current) => 
            current.score > best.score ? current : best
          );

          return {
            matchScore: Math.round(bestMatch.score),
            assignedResidentId: bestMatch.residentId,
            actualVolunteerId: actualVolunteerId, // Actual volunteer document ID
            currentUserId: currentUser.id || currentUser.uid || currentUser.username // Current user session ID
          };
        }
      }

      // Fallback with default values but ensure they're not null
      const fallbackResidentId = slot.assignedResidentId || 
                                 (residents.length > 0 ? residents[0].id : "default-resident-id");
      
      return {
        matchScore: 75, // Default reasonable score
        assignedResidentId: fallbackResidentId,
        actualVolunteerId: actualVolunteerId, // Will be actual volunteer doc ID or default
        currentUserId: currentUser.id || currentUser.uid || currentUser.username // Current user session ID
      };

    } catch (error) {
      return {
        matchScore: 60, // Default score on error
        assignedResidentId: slot.assignedResidentId || "default-resident-id",
        actualVolunteerId: "default-volunteer-id",
        currentUserId: currentUser.id || currentUser.uid || currentUser.username
      };
    }
  };

  // Fetch slots from Firestore
  useEffect(() => {
    setIsLoading(true);

    const fetchSlots = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "calendar_slots"));

        const slots = querySnapshot.docs.map(doc => {
          const data = doc.data();

          let dateObj = null;
          if (data.date) {
            if (data.date.toDate) {
              dateObj = data.date.toDate();
            } else {
              dateObj = new Date(data.date);
            }
          }

          // Set default type to "Session" if no sessionCategory or type is provided
          const sessionType = data.sessionCategory || data.type || "Session";
          
          // Always set isOpen to true
          const isOpen = true;

          return {
            id: doc.id,
            appointmentId: data.appointmentId || null,
            customLabel: data.sessionCategory || 'Session',
            type: sessionType,
            isCustom: data.isCustom || false,
            startTime: data.startTime || '9:00 AM',
            endTime: data.endTime || '10:00 AM',
            available: isOpen,
            isOpen: isOpen,
            status: data.status || "open",
            date: dateObj,
            volunteers: data.volunteers || [],
            volunteerRequests: data.volunteerRequests || [],
            maxVolunteers: data.maxCapacity || 1,
            assignedResidentId: data.assignedResidentId || null
          };
        });

        setCalendarSlots(slots);
      } catch (err) {
        // Error fetching slots
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, []);

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

    if (!isEventAvailable(slot.date)) {
      return;
    }

    // Check if user is already approved or rejected
    const userStatus = getUserApprovalStatus(slot, currentUser);
    if (userStatus === "approved") {
      return;
    }
    if (userStatus === "rejected") {
      return;
    }

    setSignupLoading(true);

    try {
      const slotRef = doc(db, "calendar_slots", slot.id);
      const slotDoc = await getDoc(slotRef);

      if (!slotDoc.exists()) {
        throw new Error("Session not found");
      }

      const slotData = slotDoc.data();
      const volunteerRequests = slotData.volunteerRequests || [];

      // Get all possible user identifiers for checking duplicates
      const userIds = [
        currentUser.uid,
        currentUser.id, 
        currentUser.username,
        currentUser.email
      ].filter(Boolean);

      // Check if user already has a request (check by userId)
      if (volunteerRequests && volunteerRequests.some(req => userIds.includes(req.userId))) {
        setSignupLoading(false);
        return;
      }

      // Count approved requests instead of volunteers
      const approvedVolunteersCount = volunteerRequests.filter(req => req.status === "approved").length;

      if (approvedVolunteersCount >= (slotData.maxVolunteers || 1)) {
        setSignupLoading(false);
        return;
      }

      // Calculate match details using the matching algorithm with real data
      const { matchScore, assignedResidentId, actualVolunteerId, currentUserId } = await calculateMatchDetails(currentUser, slot);

      // Create new volunteer request object with all required fields including match data
      const newVolunteerRequest = {
        status: "pending",
        volunteerId: actualVolunteerId, // The actual volunteer document ID from volunteers collection
        userId: currentUserId, // Current user's session ID for badge matching
        requestedAt: Timestamp.now(),
        approvedAt: null,
        assignedBy: 'ai',
        assignedResidentId: assignedResidentId,
        matchScore: matchScore,
        rejectedAt: null,
        rejectedReason: null
      };

      // Add to volunteerRequests array
      await updateDoc(slotRef, {
        volunteerRequests: arrayUnion(newVolunteerRequest)
      });

      // Refresh calendar data
      const querySnapshot = await getDocs(collection(db, "calendar_slots"));
      const updatedSlots = querySnapshot.docs.map(doc => {
        const data = doc.data();

        let dateObj = null;
        if (data.date) {
          if (data.date.toDate) {
            dateObj = data.date.toDate();
          } else {
            dateObj = new Date(data.date);
          }
        }

        const sessionType = data.sessionCategory || data.type || "Session";

        // Always set isOpen to true
        const isOpen = true;

        return {
          id: doc.id,
          appointmentId: data.appointmentId || null,
          customLabel: data.sessionCategory || 'Session',
          type: sessionType,
          isCustom: data.isCustom || false,
          startTime: data.startTime || '9:00 AM',
          endTime: data.endTime || '10:00 AM',
          available: isOpen,
          isOpen: isOpen,
          status: data.status || "open",
          date: dateObj,
          volunteers: data.volunteers || [],
          volunteerRequests: data.volunteerRequests || [],
          maxVolunteers: data.maxVolunteers || 1,
          assignedResidentId: data.assignedResidentId || null
        };
      });

      setCalendarSlots(updatedSlots);

    } catch (error) {
      // Error signing up for session
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
    let filtered = calendarSlots.filter(slot => slot.date instanceof Date && !isNaN(slot.date));

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
      filtered = filtered.filter(slot =>
        slot.date.getFullYear() === year &&
        slot.date.getMonth() === month
      );
    }

    // Check the isOpen property correctly
    if (showOnlyAvailable) {
      // Since isOpen is always true now, this filter won't have any effect
      // but keeping it for potential future use
      filtered = filtered.filter(slot => slot.isOpen === true);
    }

    // Handle session type filtering including default "Session" type
    if (selectedSessionType !== "all") {
      filtered = filtered.filter(slot => {
        const slotType = slot.customLabel || slot.type || "Session";
        return slotType.toLowerCase() === selectedSessionType.toLowerCase();
      });
    }

    return filtered;
  };

  // Get unique session types for filter
  const getSessionTypes = () => {
    const types = new Set();
    calendarSlots.forEach(slot => {
      const sessionType = slot.customLabel || slot.type || "Session";
      types.add(sessionType);
    });
    return Array.from(types).filter(Boolean).sort();
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

  if (isLoading) {
    return <LoadingScreen />;
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="filter-button">
                      <Filter className="h-4 w-4 mr-1" />
                      {t("Filter")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <div className="filter-dropdown-content">
                      <Select
                        value={selectedSessionType}
                        onValueChange={setSelectedSessionType}
                      >
                        <SelectTrigger
                          className={`session-type-select flex items-center justify-between ${i18n.language === "he" ? "flex-row-reverse text-right" : "flex-row text-left"
                            }`}
                          dir="auto"
                        >
                          <SelectValue placeholder={t("Select session type")} />
                        </SelectTrigger>
                        <SelectContent dir={i18n.language === "he" ? "rtl" : "ltr"}>
                          <SelectItem value="all">{t("All Session Types")}</SelectItem>
                          {getSessionTypes().map((type) => (
                            <SelectItem key={type} value={type.toLowerCase()}>
                              {translateSessionType(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                        return slot.date && slot.date.toDateString() === date.toDateString();
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
                              const userApprovalStatus = getUserApprovalStatus(slot, currentUser);
                              const borderColor = getSessionTypeBorderColor(slot.type);

                              return (
                                <Dialog key={slot.id}>
                                  <DialogTrigger asChild>
                                    <div
                                      className={`time-slot ${getSessionTypeColor(slot.type)}`}
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
                                      {(() => {
                                        if (userApprovalStatus === "approved") {
                                          return (
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
                                          );
                                        }
                                        if (userApprovalStatus === "pending") {
                                          return (
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
                                          );
                                        }
                                        if (userApprovalStatus === "rejected") {
                                          return (
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
                                          );
                                        }
                                        return null;
                                      })()}

                                      <div className="time-slot-header">
                                        <span className="start-time">{slot.startTime}</span>
                                        <span className="session-type-badge">{translateSessionType(slot.type)}</span>
                                      </div>
                                      <div className="time-range">
                                        {slot.startTime} - {slot.endTime}
                                      </div>
                                      <div className="volunteers-count">
                                        <Users className="h-3 w-3" />
                                        <span>
                                          {(slot.volunteerRequests?.filter(req => req.status === "approved").length || 0)}/{slot.maxVolunteers || 1}
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
                                        {t("Sign Up for:")} <span className="capitalize">{translateSessionType(slot.type)}</span>
                                      </DialogTitle>
                                      <div className="flex items-center text-gray-500 text-sm mb-4">
                                        <span className="mr-2 font-medium">{t("Date:")}</span>
                                        <span>
                                          {slot.date.toLocaleDateString(i18n.language, {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                          })}
                                        </span>
                                      </div>
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
                                              {t(
                                                userApprovalStatus === "approved"
                                                  ? "SessionStatus.approvedStatus"
                                                  : userApprovalStatus === "rejected"
                                                    ? "SessionStatus.rejectedStatus"
                                                    : "SessionStatus.pendingApproval"
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        disabled={
                                          !isEventAvailable(slot.date) ||
                                          signupLoading ||
                                          userApprovalStatus === "approved" ||
                                          userApprovalStatus === "pending" ||
                                          userApprovalStatus === "rejected"
                                        }
                                        style={
                                          (!isEventAvailable(slot.date) || signupLoading || userApprovalStatus)
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
                                                : (!isEventAvailable(slot.date))
                                                  ? t("Not Available")
                                                  : (() => {
                                                      const userIds = [currentUser?.uid, currentUser?.id, currentUser?.username, currentUser?.email].filter(Boolean);
                                                      return slot.volunteerRequests?.some(req => userIds.includes(req.userId)) ? t("Request Pending") : t("Request to Join");
                                                    })()}
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
                        ? getFilteredSlots().filter(slot => slot.date && slot.date.toDateString() === date.toDateString())
                        : [];

                      const slots = sortSlotsByTime(slotsUnsorted);
                      const grouped = groupSlotsByTime(slots);

                      return (
                        <div
                          key={idx}
                          className={`month-cell${isToday ? " today" : ""}${date ? "" : " empty"}`}
                        >
                          {date && <div className="month-day-number">{date.getDate()}</div>}
                          {slots.map((slot, slotIdx) => {
                            const userApprovalStatus = getUserApprovalStatus(slot, currentUser);
                            const borderColor = getSessionTypeBorderColor(slot.type);

                            return (
                              <Dialog key={slot.id}>
                                <DialogTrigger asChild>
                                  <div
                                    className={`month-slot ${getSessionTypeColor(slot.type)}`}
                                    style={{
                                      borderLeft: "4px solid",
                                      borderLeftColor: borderColor,
                                      order: slotIdx,
                                      position: "relative"
                                    }}
                                    title={`${translateSessionType(slot.type)} ${slot.startTime} - ${slot.endTime}`}
                                  >
                                    <span className="month-slot-type">{translateSessionType(slot.type)}</span>
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

                                    {/* Small indicator dot if you've requested this slot but no status yet */}
                                    {!userApprovalStatus && (() => {
                                      const userIds = [currentUser?.uid, currentUser?.id, currentUser?.username, currentUser?.email].filter(Boolean);
                                      return slot.volunteerRequests?.some(req => userIds.includes(req.userId));
                                    })() && (
                                      <span style={{
                                        display: "inline-block",
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: "#2563eb",
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
                                      {t("Sign Up for:")} <span className="capitalize">{translateSessionType(slot.type)}</span>
                                    </DialogTitle>
                                    <div className="flex items-center text-gray-500 text-sm mb-4">
                                      <span className="mr-2 font-medium">{t("Date:")}</span>
                                      <span>
                                        {slot.date.toLocaleDateString(i18n.language, {
                                          weekday: "short",
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric"
                                        })}
                                      </span>
                                    </div>
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
                                            {t("SessionStatus.label")}{" "}
                                            {userApprovalStatus === "approved"
                                              ? t("SessionStatus.approved")
                                              : userApprovalStatus === "rejected"
                                                ? t("SessionStatus.rejected")
                                                : t("SessionStatus.pendingApproval")}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      disabled={
                                        !isEventAvailable(slot.date) ||
                                        signupLoading ||
                                        userApprovalStatus === "approved" ||
                                        userApprovalStatus === "pending" ||
                                        userApprovalStatus === "rejected"
                                      }
                                      style={
                                        (!isEventAvailable(slot.date) || signupLoading || userApprovalStatus)
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
                                              : (!isEventAvailable(slot.date))
                                                ? t("Not Available")
                                                : (() => {
                                                    const userIds = [currentUser?.uid, currentUser?.id, currentUser?.username, currentUser?.email].filter(Boolean);
                                                    return slot.volunteerRequests?.some(req => userIds.includes(req.userId)) ? t("Request Pending") : t("Request to Join");
                                                  })()}
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
        <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`}>
          <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
            <Globe size={35} />
          </button>
          {showLangOptions && (
            <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
              <button onClick={() => { i18n.changeLanguage('en'); setShowLangOptions(false); }}>
                English
              </button>
              <button onClick={() => { i18n.changeLanguage('he'); setShowLangOptions(false); }}>
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