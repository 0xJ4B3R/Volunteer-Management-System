import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CalendarDays,
  Filter,
  List,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import VolunteerSidebar from "@/components/volunteer/Sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./styles/Calendar.css";

const calendarSlots = [
  {
    id: 1,
    date: new Date(2025, 4, 18), // Sunday, May 18, 2025
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    type: "Reading",
    available: true,
    volunteers: ["JD", "AS"],
    maxVolunteers: 5
  },
  {
    id: 2,
    date: new Date(2025, 4, 20), // Tuesday, May 20, 2025
    startTime: "2:00 PM",
    endTime: "3:30 PM",
    type: "Games",
    available: true,
    volunteers: ["BT"],
    maxVolunteers: 4
  },
  {
    id: 3,
    date: new Date(2025, 4, 22), // Thursday, May 22, 2025
    startTime: "1:00 PM",
    endTime: "2:30 PM",
    type: "Music",
    available: true,
    volunteers: ["CL", "RJ", "MG"],
    maxVolunteers: 3
  },
  {
    id: 4,
    date: new Date(2025, 4, 24), // Saturday, May 24, 2025
    startTime: "13:00 PM",
    endTime: "16:00 PM",
    type: "Reading",
    available: true,
    volunteers: [],
    maxVolunteers: 4
  },
  {
    id: 6,
    date: new Date(2025, 4, 24), // Saturday, May 24, 2025
    startTime: "11:00 AM",
    endTime: "12:30 PM",
    type: "Reading",
    available: true,
    volunteers: [],
    maxVolunteers: 4
  },
  {
    id: 5,
    date: new Date(2025, 4, 19), // Monday, May 19, 2025
    startTime: "3:00 PM",
    endTime: "4:30 PM",
    type: "Games",
    available: false,
    volunteers: ["JD", "AS", "BT", "CL"],
    maxVolunteers: 4
  }
];


// Function to get the color for a session type
const getSessionTypeColor = (type) => {
  switch (type.toLowerCase()) {
    case "reading":
      return "bg-green-100 text-green-800";
    case "games":
      return "bg-blue-100 text-blue-800";
    case "music":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const VolunteerCalendar = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  // Always show current week
  const [currentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [viewMode, setViewMode] = useState("week");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState("all");

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

  // Fill preceding empty days
  for (let i = 0; i < firstDay; i++) days.push(null);

  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(date.getFullYear(), date.getMonth(), d));
  }

  // Fill trailing empty days to complete full weeks (multiples of 7)
  while (days.length % 7 !== 0) days.push(null);
  return days;
};


  // Filter slots based on selected date and showOnlyAvailable setting
  const getFilteredSlots = () => {
    let filtered = [...calendarSlots];
    if (viewMode === "week") {
      const weekDates = getWeekDates();
      const startDate = weekDates[0];
      const endDate = weekDates[6];
      filtered = filtered.filter(slot =>
        slot.date >= startDate &&
        slot.date <= endDate
      );
    } else if (viewMode === "month") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      filtered = filtered.filter(slot =>
        slot.date.getFullYear() === year &&
        slot.date.getMonth() === month
      );
    }
    if (showOnlyAvailable) {
      filtered = filtered.filter(slot =>
        slot.available && slot.volunteers.length < slot.maxVolunteers
      );
    }
    if (selectedSessionType !== "all") {
      filtered = filtered.filter(slot =>
        slot.type.toLowerCase() === selectedSessionType.toLowerCase()
      );
    }
    return filtered;
  };

  // Get unique session types for filter
  const getSessionTypes = () => {
    const types = new Set();
    calendarSlots.forEach(slot => types.add(slot.type));
    return Array.from(types);
  };

  // Format date for display
  const formatDateDisplay = () => {
    if (viewMode === "week") {
      const weekDates = getWeekDates();
      return `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (viewMode === "month") {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return "All Sessions";
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
                <button
                  className={`tab-trigger${viewMode === "list" ? " active" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4 mr-1" />
                  List
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
                    const slotsForDay = getFilteredSlots().filter(
                      slot => slot.date.toDateString() === date.toDateString()
                    );
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
                                <div
                                  key={slot.id}
                                  className={`time-slot ${getSessionTypeColor(slot.type)}${!slot.available ? " unavailable-slot" : ""}`}
                                  style={{
                                    position: "absolute",
                                    top: `${stackIdx * 8}px`,
                                    left: `${stackIdx * 8}px`,
                                    zIndex: 10 + stackIdx,
                                    width: `calc(100% - ${stackIdx * 8}px)`,
                                    boxShadow: stackIdx === slotGroup.length - 1 ? "0 4px 12px rgba(60,60,60,0.08)" : "0 2px 6px rgba(60,60,60,0.04)"
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
                                      {slot.volunteers.length}/{slot.maxVolunteers}
                                    </span>
                                  </div>
                                </div>
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
                      ? getFilteredSlots().filter(slot => slot.date.toDateString() === date.toDateString())
                      : [];
                    return (
                      <div
                        key={idx}
                        className={`month-cell${isToday ? " today" : ""}${date ? "" : " empty"}`}
                      >
                        {date && <div className="month-day-number">{date.getDate()}</div>}
                        {slots.map(slot => (
                          <div
                            key={slot.id}
                            className={`month-slot ${getSessionTypeColor(slot.type)}${!slot.available ? " unavailable" : ""}`}
                            title={`${slot.type} ${slot.startTime} - ${slot.endTime}`}
                          >
                            <span className="month-slot-type">{slot.type}</span>
                            <span className="month-slot-time">{slot.startTime}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {viewMode === "list" && (
              <div className="list-view-content">
                <div className="session-list">
                  {getFilteredSlots().length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-title">No sessions found</div>
                      <div className="empty-state-message">
                        There are currently no sessions scheduled for this view.
                      </div>
                    </div>
                  ) : (
                    getFilteredSlots().map(slot => (
                      <div
                        key={slot.id}
                        className={`session-card ${getSessionTypeColor(slot.type)}${!slot.available ? " unavailable" : ""}`}
                      >
                        <div className="session-card-header">
                          <div className="session-card-title-container">
                            <span className="session-card-title">{slot.type}</span>
                            <span className="session-date">{slot.date.toLocaleDateString()}</span>
                          </div>
                          <div className="session-card-content">
                            <div className="session-meta">
                              <span>{slot.startTime} - {slot.endTime}</span>
                              <span className="separator">|</span>
                              <span className="volunteers-meta">
                                <Users className="h-3 w-3" />
                                {slot.volunteers.length}/{slot.maxVolunteers}
                              </span>
                            </div>
                            <div className="availability-meta">
                              <span className={slot.available ? "available-icon" : "unavailable-icon"}>
                                {slot.available ? "Available" : "Full"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
