import { Calendar, CalendarDays, Filter, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import "./styles/Calendar.css";
import app from "@/lib/firebase";

// Utility: Get color for session type (more colorful palette)
const getSessionTypeColor = (type) => {
  switch ((type || '').toLowerCase()) {
    case "reading":
      return "bg-[#3b82f6] text-white"; // Blue
    case "games":
      return "bg-[#ec4899] text-white"; // Pink
    case "music":
      return "bg-[#f59e0b] text-white"; // Amber
    case "art":
      return "bg-[#10b981] text-white"; // Emerald
    case "crafts":
      return "bg-[#8b5cf6] text-white"; // Violet
    case "exercise":
      return "bg-[#ef4444] text-white"; // Red
    case "therapy":
      return "bg-[#6366f1] text-white"; // Indigo
    case "social":
      return "bg-[#14b8a6] text-white"; // Teal
    default:
      return "bg-[#6b7280] text-white"; // Gray
  }
};

// Utility: Only allow sign up for today or future events
const isEventAvailable = (eventDate) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const eventDay = new Date(eventDate);
  eventDay.setHours(0,0,0,0);
  return eventDay >= today;
};

// Utility: Convert time string to minutes for sorting
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  // Handle various time formats
  let hours = 0;
  let minutes = 0;
  
  // Handle formats like "9:00 AM", "9:00", "9AM", "9:00am"
  timeStr = timeStr.toLowerCase().trim();
  
  // Extract AM/PM
  let isPM = timeStr.includes('pm');
  timeStr = timeStr.replace(/[ap]m/g, '').trim();
  
  // Parse hours and minutes
  if (timeStr.includes(':')) {
    [hours, minutes] = timeStr.split(':').map(part => parseInt(part, 10));
  } else {
    hours = parseInt(timeStr, 10);
    minutes = 0;
  }
  
  // Adjust for PM
  if (isPM && hours < 12) {
    hours += 12;
  }
  
  // Adjust for 12 AM
  if (!isPM && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
};

// Function to sort slots by time
const sortSlotsByTime = (slots) => {
  // Sort slots by start time
  return [...slots].sort((a, b) => {
    const aMinutes = timeToMinutes(a.startTime);
    const bMinutes = timeToMinutes(b.startTime);
    return aMinutes - bMinutes;
  });
};

const db = getFirestore(app);

const VolunteerCalendar = () => {
  console.log("Component rendering...");
  const navigate = useNavigate();

  // Always show current week
  const [currentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [calendarSlots, setCalendarSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("week");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [signupLoading, setSignupLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication
  useEffect(() => {
    console.log("Auth check running...");
    try {
      const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      if (!user.username) {
        console.log("No user found, redirecting to login");
        navigate("/login");
      } else if (user.role !== "volunteer") {
        console.log("User is not a volunteer, redirecting to manager");
        navigate("/manager");
      } else {
        console.log("User authenticated:", user.username);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  }, [navigate]);

  // Fetch slots from Firestore
  useEffect(() => {
    console.log("Fetching slots...");
    setIsLoading(true);
    
    const fetchSlots = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "calendar_slots"));
        console.log("Got querySnapshot, docs count:", querySnapshot.docs.length);
        
        const slots = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log("Processing slot:", doc.id);
          
          // Ensure date is a Date object
          let dateObj = null;
          if (data.date) {
            if (data.date.toDate) {
              dateObj = data.date.toDate();
            } else {
              dateObj = new Date(data.date);
            }
          }
          
          return {
            id: doc.id,
            appointmentId: data.appointmentId || null,
            customLabel: data.customLabel || '',
            type: data.customLabel || "session", // Use customLabel as type
            isCustom: data.isCustom || false,
            startTime: data.startTime || '9:00 AM',
            endTime: data.endTime || '10:00 AM',
            available: data.isOpen || false,
            isOpen: data.isOpen || false,
            date: dateObj,
            volunteers: data.volunteers || [],
            volunteerRequests: data.volunteerRequests || [],
            maxVolunteers: data.maxCapacity || 1
          };
        });
        
        console.log("Processed slots:", slots.length);
        setCalendarSlots(slots);
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSlots();
  }, []);

  // Function to handle user signup for a session
  const handleSignUp = async (slot) => {
    console.log("Sign up clicked for slot:", slot.id);
    
    if (!currentUser || !currentUser.username) {
      alert("Please log in to sign up for sessions");
      navigate("/login");
      return;
    }

    if (!slot.available || !isEventAvailable(slot.date)) {
      alert("This slot is not available for signup");
      return;
    }

    setSignupLoading(true);

    try {
      // Reference to the slot document
      const slotRef = doc(db, "calendar_slots", slot.id);
      
      // Get current slot data to check if user is already signed up
      const slotDoc = await getDoc(slotRef);
      if (!slotDoc.exists()) {
        throw new Error("Session not found");
      }
      
      const slotData = slotDoc.data();
      const volunteers = slotData.volunteers || [];
      const volunteerRequests = slotData.volunteerRequests || [];
      
      // Check if user is already signed up or has a pending request
      if (volunteers.some(v => v.id === currentUser.uid || v.username === currentUser.username)) {
        alert("You are already signed up for this session");
        setSignupLoading(false);
        return;
      }
      
      if (volunteerRequests && volunteerRequests.includes(currentUser.uid)) {
        alert("You already have a pending request for this session");
        setSignupLoading(false);
        return;
      }
      
      // Get approved volunteers count (exclude pending ones)
      const approvedVolunteersCount = volunteers.filter(v => v.status !== "pending").length;
      
      // Check if slot is at capacity (only count approved volunteers)
      if (approvedVolunteersCount >= (slotData.maxVolunteers || 1)) {
        alert("This session is already at maximum capacity");
        setSignupLoading(false);
        return;
      }
      
      // Add user to volunteerRequests array (using their UID/document ID)
      await updateDoc(slotRef, {
        volunteerRequests: arrayUnion(currentUser.uid || currentUser.id || currentUser.username)
      });
      
      // Also add to regular volunteers array with more info for display purposes
      await updateDoc(slotRef, {
        volunteers: arrayUnion({
          id: currentUser.uid || currentUser.id || "",
          username: currentUser.username,
          status: "pending", // Add a status field to track approval state
          signupTime: Timestamp.now()
        })
      });
      
      // Only close the slot if the approved volunteers count + this new volunteer equals/exceeds max capacity
      // Since this is a pending volunteer, don't close the slot yet
      // The slot will only be closed when an admin approves enough volunteers to reach maximum capacity
      
      // Refresh the calendar data
      const querySnapshot = await getDocs(collection(db, "calendar_slots"));
      const updatedSlots = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure date is a Date object
        let dateObj = null;
        if (data.date) {
          if (data.date.toDate) {
            dateObj = data.date.toDate();
          } else {
            dateObj = new Date(data.date);
          }
        }
        
        return {
          id: doc.id,
          appointmentId: data.appointmentId || null,
          customLabel: data.customLabel || '',
          type: data.customLabel || "session",
          isCustom: data.isCustom || false,
          startTime: data.startTime || '9:00 AM',
          endTime: data.endTime || '10:00 AM',
          available: data.isOpen || false,
          isOpen: data.isOpen || false,
          date: dateObj,
          volunteers: data.volunteers || [],
          volunteerRequests: data.volunteerRequests || [],
          maxVolunteers: data.maxVolunteers || 1
        };
      });
      
      setCalendarSlots(updatedSlots);
      
      // Success notification
      alert(`Your request to join ${slot.type} session on ${slot.date.toDateString()} at ${slot.startTime} has been submitted. Waiting for approval.`);
      
    } catch (error) {
      console.error("Error signing up for session:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert(`Error signing up: ${error.message}`);
    } finally {
      setSignupLoading(false);
    }
  };

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setViewMode("week");
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // First make sure we only work with slots that have valid dates
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
    
    if (showOnlyAvailable) {
      filtered = filtered.filter(slot => slot.isOpen);
    }
    
    if (selectedSessionType !== "all") {
      filtered = filtered.filter(slot =>
        (slot.customLabel || "").toLowerCase() === selectedSessionType.toLowerCase()
      );
    }
    
    return filtered;
  };

  // Get unique session types for filter
  const getSessionTypes = () => {
    const types = new Set();
    calendarSlots.forEach(slot => {
      if (slot.customLabel) {
        types.add(slot.customLabel);
      }
    });
    return Array.from(types).filter(Boolean);
  };

  // Format date for display
  const formatDateDisplay = () => {
    if (viewMode === "week") {
      const weekDates = getWeekDates();
      return `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Updated groupSlotsByTime function to sort by time
  function groupSlotsByTime(slotsForDay) {
    // Sort slots by time first
    const sortedSlots = sortSlotsByTime(slotsForDay);
    
    // Group by time while maintaining order
    const groups = {};
    sortedSlots.forEach(slot => {
      const key = slot.startTime;
      if (!groups[key]) groups[key] = [];
      groups[key].push(slot);
    });
    
    // Return an array of arrays, preserving the time-sorted order
    return Object.entries(groups)
      .sort(([timeA], [timeB]) => {
        const aMinutes = timeToMinutes(timeA);
        const bMinutes = timeToMinutes(timeB);
        return aMinutes - bMinutes;
      })
      .map(([_, slots]) => slots);
  }

  console.log("Rendering calendar with", calendarSlots.length, "slots");

  if (isLoading) {
    return <div className="loading-indicator">Loading calendar data...</div>;
  }

  return (
    <div className="volunteer-calendar-container">
      <div className="main-content-container">
        <main className="calendar-main-content">
          {/* Calendar Header */}
          <div className="calendar-header">
            <div className="calendar-navigation">
              <div className="current-date-display">
                {formatDateDisplay()}
              </div>
            </div>
            <div className="calendar-controls">
              <div className="view-mode-tabs">
                <button
                  className={`tab-trigger${viewMode === "week" ? " active" : ""}`}
                  onClick={() => setViewMode("week")}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Week
                </button>
                <button
                  className={`tab-trigger${viewMode === "month" ? " active" : ""}`}
                  onClick={() => setViewMode("month")}
                >
                  <CalendarDays className="h-4 w-4 mr-1" />
                  Month
                </button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="filter-button">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="filter-dropdown-content">
                    <div className="filter-option">
                      <Switch
                        id="available-only"
                        checked={showOnlyAvailable}
                        onCheckedChange={setShowOnlyAvailable}
                      />
                      <Label htmlFor="available-only">Available slots only</Label>
                    </div>
                    <Select
                      value={selectedSessionType}
                      onValueChange={setSelectedSessionType}
                    >
                      <SelectTrigger className="session-type-select">
                        <SelectValue placeholder="Select session type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Session Types</SelectItem>
                        {getSessionTypes().map((type) => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
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
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
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
                    // Filter slots for current day and group them by time
                    const slotsForDay = getFilteredSlots().filter(slot => {
                      return slot.date && slot.date.toDateString() === date.toDateString();
                    });
                    
                    console.log(`Slots for ${date.toDateString()}:`, slotsForDay.length);
                    const grouped = groupSlotsByTime(slotsForDay);
                  
                    return (
                      <div key={index} className="week-day-column">
                        {grouped.length === 0 ? (
                          <div className="empty-state" style={{ boxShadow: "none", padding: "1rem" }}>
                            <div className="empty-description">No sessions</div>
                          </div>
                        ) : (
                          grouped.map((slotGroup, groupIdx) => (
                            <div key={groupIdx} className="stacked-slot-group" 
                                 style={{ 
                                   position: "relative", 
                                   minHeight: `${Math.max(3.5, 2 + 0.8 * (slotGroup.length - 1))}rem`,
                                   marginBottom: "1rem"
                                 }}>
                              {slotGroup.map((slot, stackIdx) => (
                                <Dialog key={slot.id}>
                                  <DialogTrigger asChild>
                                    <div
                                      className={`time-slot ${getSessionTypeColor(slot.type)}${!slot.available ? " unavailable-slot" : ""}`}
                                      style={{
                                        position: "absolute",
                                        top: `${stackIdx * 10}px`, // Increased offset for better stacking
                                        left: `${stackIdx * 10}px`,
                                        zIndex: 10 + stackIdx,
                                        width: `calc(100% - ${stackIdx * 10}px)`,
                                        boxShadow: stackIdx === slotGroup.length - 1 ? "0 4px 12px rgba(60,60,60,0.08)" : "0 2px 6px rgba(60,60,60,0.04)",
                                        borderLeft: "4px solid",
                                        borderLeftColor: slot.type === "reading" ? "#2563eb" : 
                                                        slot.type === "games" ? "#db2777" : 
                                                        slot.type === "music" ? "#d97706" : 
                                                        slot.type === "art" ? "#059669" :
                                                        slot.type === "crafts" ? "#7c3aed" :
                                                        slot.type === "exercise" ? "#dc2626" :
                                                        slot.type === "therapy" ? "#4f46e5" :
                                                        slot.type === "social" ? "#0d9488" : "#4b5563"
                                      }}
                                    >
                                      {/* Add status indicator for slots you've requested */}
                                      {slot.volunteerRequests?.includes(currentUser?.uid || currentUser?.id || currentUser?.username) && (
                                        <div className="my-request-badge">My Request</div>
                                      )}
                                      
                                      {/* Or show pending badge if it has any pending requests */}
                                      {!slot.volunteerRequests?.includes(currentUser?.uid || currentUser?.id || currentUser?.username) && 
                                       slot.volunteers?.some(v => v.status === "pending") && (
                                        <div className="pending-badge">Pending</div>
                                      )}
                                      
                                      <div className="time-slot-header">
                                        <span className="start-time">{slot.startTime}</span>
                                        <span className="session-type-badge">{slot.type}</span>
                                      </div>
                                      <div className="time-range">
                                        {slot.startTime} - {slot.endTime}
                                      </div>
                                      <div className="volunteers-count">
                                        <Users className="h-3 w-3" />
                                        <span>
                                          {(slot.volunteers?.length || 0)}/{slot.maxVolunteers || 1}
                                        </span>
                                      </div>
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md rounded-xl shadow-xl bg-white p-6">
                                    <DialogHeader>
                                      <DialogTitle className="text-lg font-bold mb-4">
                                        Sign Up for <span className="capitalize">{slot.type}</span> Session
                                      </DialogTitle>
                                      <div className="flex items-center text-gray-500 text-sm mb-4">
                                        <span className="mr-2 font-medium">Date:</span>
                                        <span>{slot.date.toDateString()}</span>
                                      </div>
                                    </DialogHeader>
                                    <div className="mb-6">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700">Time:</span>
                                        <span className="bg-gray-100 rounded px-2 py-0.5 text-gray-800 text-sm">
                                          {slot.startTime} - {slot.endTime}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        disabled={!slot.available || !isEventAvailable(slot.date) || signupLoading}
                                        style={
                                          (!slot.available || !isEventAvailable(slot.date) || signupLoading)
                                            ? { background: "#e5e7eb", color: "#9ca3af", width: "100%", padding: "10px", borderRadius: "6px", cursor: "not-allowed" }
                                            : { background: "#416a42", color: "#fff", width: "100%", padding: "10px", borderRadius: "6px", cursor: "pointer" }
                                        }
                                        onClick={() => handleSignUp(slot)}
                                      >
                                        {signupLoading 
                                          ? "Submitting Request..."
                                          : (!slot.available || !isEventAvailable(slot.date))
                                            ? "Not Available"
                                            : slot.volunteerRequests?.includes(currentUser?.uid || currentUser?.id || currentUser?.username)
                                              ? "Request Pending"
                                              : "Request to Join"}
                                      </button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ))}
                            </div>
                          ))
                        )}
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
                    {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="month-grid">
                  {/* Weekday headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="month-weekday">{day}</div>
                  ))}
                  {/* Days */}
                  {getMonthGrid(currentDate).map((date, idx) => {
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    const slotsUnsorted = date
                      ? getFilteredSlots().filter(slot => slot.date && slot.date.toDateString() === date.toDateString())
                      : [];
                      
                    // Sort the slots by time
                    const slots = sortSlotsByTime(slotsUnsorted);
                      
                    return (
                      <div
                        key={idx}
                        className={`month-cell${isToday ? " today" : ""}${date ? "" : " empty"}`}
                      >
                        {date && <div className="month-day-number">{date.getDate()}</div>}
                        {slots.map((slot, slotIdx) => (
                          <Dialog key={slot.id}>
                            <DialogTrigger asChild>
                              <div
                                className={`month-slot ${getSessionTypeColor(slot.type)}${!slot.available ? " unavailable" : ""}`}
                                style={{
                                  borderLeft: "4px solid",
                                  borderLeftColor: slot.type === "reading" ? "#2563eb" : 
                                                  slot.type === "games" ? "#db2777" : 
                                                  slot.type === "music" ? "#d97706" : 
                                                  slot.type === "art" ? "#059669" :
                                                  slot.type === "crafts" ? "#7c3aed" :
                                                  slot.type === "exercise" ? "#dc2626" :
                                                  slot.type === "therapy" ? "#4f46e5" :
                                                  slot.type === "social" ? "#0d9488" : "#4b5563",
                                  // Order slots by time using their index in the sorted array
                                  order: slotIdx
                                }}
                                title={`${slot.type} ${slot.startTime} - ${slot.endTime}`}
                              >
                                <span className="month-slot-type">{slot.type}</span>
                                <span className="month-slot-time">{slot.startTime}</span>
                                
                                {/* Small indicator dot if you've requested this slot */}
                                {slot.volunteerRequests?.includes(currentUser?.uid || currentUser?.id || currentUser?.username) && (
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
                                <DialogTitle className="text-lg font-bold mb-2">
                                  Sign Up for <span className="capitalize">{slot.type}</span> Session
                                </DialogTitle>
                                <div className="flex items-center text-gray-500 text-sm mb-4">
                                  <span className="mr-2 font-medium">Date:</span>
                                  <span>{slot.date.toDateString()}</span>
                                </div>
                              </DialogHeader>                                                    
                              <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700">Time:</span>
                                  <span className="bg-gray-100 rounded px-2 py-0.5 text-gray-800 text-sm">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  disabled={!slot.available || !isEventAvailable(slot.date) || signupLoading}
                                  style={
                                    (!slot.available || !isEventAvailable(slot.date) || signupLoading)
                                      ? { background: "#e5e7eb", color: "#9ca3af", width: "100%", padding: "10px", borderRadius: "6px", cursor: "not-allowed" }
                                      : { background: "#416a42", color: "#fff", width: "100%", padding: "10px", borderRadius: "6px", cursor: "pointer" }
                                  }
                                  onClick={() => handleSignUp(slot)}
                                >
                                  {signupLoading 
                                    ? "Submitting Request..."
                                    : (!slot.available || !isEventAvailable(slot.date))
                                      ? "Not Available"
                                      : slot.volunteerRequests?.includes(currentUser?.uid || currentUser?.id || currentUser?.username)
                                        ? "Request Pending"
                                        : "Request to Join"}
                                </button>                         
                              </div>
                            </DialogContent>
                          </Dialog>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VolunteerCalendar;