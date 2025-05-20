import { Calendar, CalendarDays, Filter, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

const db = getFirestore(app);

const VolunteerCalendar = () => {
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

  // Fetch slots from Firestore
  useEffect(() => {
    setIsLoading(true);
    const fetchSlots = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "calendar_slots"));
        const slots = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log("Fetched slot:", data); // Debug log
          
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
            maxVolunteers: data.maxVolunteers || 1
          };
        });
        console.log("Processed slots:", slots);
        setCalendarSlots(slots);
      } catch (err) {
        console.error("Error fetching slots:", err);
        // Optionally set an error state here
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlots();
  }, []);


  // Check authentication
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (!user.username) {
      navigate("/login");
    } else if (user.role !== "volunteer") {
      navigate("/manager");
    }
  }, [navigate]);

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

  function groupSlotsByTime(slotsForDay) {
    const groups = {};
    slotsForDay.forEach(slot => {
      const key = slot.startTime;
      if (!groups[key]) groups[key] = [];
      groups[key].push(slot);
    });
    return Object.values(groups); // array of arrays
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
                    
                    console.log(`Slots for ${date.toDateString()}:`, slotsForDay);
                    const grouped = groupSlotsByTime(slotsForDay);
                  
                    return (
                      <div key={index} className="week-day-column">
                        {grouped.length === 0 ? (
                          <div className="empty-state" style={{ boxShadow: "none", padding: "1rem" }}>
                            <div className="empty-description">No sessions</div>
                          </div>
                        ) : (
                          grouped.map((slotGroup, groupIdx) => (
                            <div key={groupIdx} className="stacked-slot-group" style={{ position: "relative", height: `${1.8 + 0.5 * (slotGroup.length - 1)}rem` }}>
                              {slotGroup.map((slot, stackIdx) => (
                                <Dialog key={slot.id}>
                                  <DialogTrigger asChild>
                                    <div
                                      className={`time-slot ${getSessionTypeColor(slot.type)}${!slot.available ? " unavailable-slot" : ""}`}
                                      style={{
                                        position: "absolute",
                                        top: `${stackIdx * 8}px`,
                                        left: `${stackIdx * 8}px`,
                                        zIndex: 10 + stackIdx,
                                        width: `calc(100% - ${stackIdx * 8}px)`,
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
                                        disabled={!slot.available || !isEventAvailable(slot.date)}
                                        style={
                                          (!slot.available || !isEventAvailable(slot.date))
                                            ? { background: "#e5e7eb", color: "#9ca3af", width: "100%", padding: "10px", borderRadius: "6px", cursor: "not-allowed" }
                                            : { background: "#416a42", color: "#fff", width: "100%", padding: "10px", borderRadius: "6px", cursor: "pointer" }
                                        }
                                        onClick={() => {
                                          if (slot.available && isEventAvailable(slot.date)) {
                                            alert(`Signed up for ${slot.type} on ${slot.date.toDateString()} at ${slot.startTime}`);
                                          }
                                        }}
                                      >
                                        {(!slot.available || !isEventAvailable(slot.date))
                                          ? "Not Available"
                                          : "Sign Up"}
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
                    const slots = date
                      ? getFilteredSlots().filter(slot => slot.date && slot.date.toDateString() === date.toDateString())
                      : [];
                      
                    return (
                      <div
                        key={idx}
                        className={`month-cell${isToday ? " today" : ""}${date ? "" : " empty"}`}
                      >
                        {date && <div className="month-day-number">{date.getDate()}</div>}
                        {slots.map(slot => (
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
                                                  slot.type === "social" ? "#0d9488" : "#4b5563"
                                }}
                                title={`${slot.type} ${slot.startTime} - ${slot.endTime}`}
                              >
                                <span className="month-slot-type">{slot.type}</span>
                                <span className="month-slot-time">{slot.startTime}</span>
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
                                  disabled={!slot.available || !isEventAvailable(slot.date)}
                                  style={
                                    (!slot.available || !isEventAvailable(slot.date))
                                      ? { background: "#e5e7eb", color: "#9ca3af", width: "100%", padding: "10px", borderRadius: "6px", cursor: "not-allowed" }
                                      : { background: "#416a42", color: "#fff", width: "100%", padding: "10px", borderRadius: "6px", cursor: "pointer" }
                                  }
                                  onClick={() => {
                                    if (slot.available && isEventAvailable(slot.date)) {
                                      alert(`Signed up for ${slot.type} on ${slot.date.toDateString()} at ${slot.startTime}`);
                                    }
                                  }}
                                >
                                  {(!slot.available || !isEventAvailable(slot.date))
                                    ? "Not Available"
                                    : "Sign Up"}
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