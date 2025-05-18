// import React, { useState, useEffect } from "react";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// // Sample data for calendar events
// const events = [
//   { 
//     id: 1, 
//     title: "Product Design Course", 
//     day: "Tuesday", 
//     start: "09:30", 
//     end: "12:00", 
//     color: "green",
//     category: "Product Design"
//   },
//   { 
//     id: 2, 
//     title: "Conversational Interview", 
//     day: "Monday", 
//     start: "12:30", 
//     end: "14:00", 
//     color: "purple",
//     category: "User Research"
//   },
//   { 
//     id: 3, 
//     title: "App Design", 
//     day: "Thursday", 
//     start: "13:00", 
//     end: "15:30", 
//     color: "green",
//     category: "Product Design"
//   },
//   { 
//     id: 4, 
//     title: "Usability testing", 
//     day: "Thursday", 
//     start: "09:00", 
//     end: "11:00", 
//     color: "purple",
//     category: "User Research"
//   },
//   { 
//     id: 5, 
//     title: "Frontend developement", 
//     day: "Friday", 
//     start: "10:00", 
//     end: "13:00", 
//     color: "blue",
//     category: "Software Engineering"
//   }
// ];

// // Categories with their colors
// const categories = [
//   { id: 1, name: "Product Design", color: "green", time: "5h00" },
//   { id: 2, name: "Software Engineering", color: "blue", time: "3h00" },
//   { id: 3, name: "User Research", color: "purple", time: "1h00" },
//   { id: 4, name: "Marketing", color: "red", time: "0h00" }
// ];

// // Time slots for the calendar
// const timeSlots = [
//   "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"
// ];

// // Days of the week
// const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
// const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// const monthDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// const CalendarApp = () => {
//   const [currentDate] = useState(new Date(2020, 3, 16)); // April 16, 2020
//   const [selectedWeek] = useState({
//     start: new Date(2020, 3, 13), // April 13, 2020
//     end: new Date(2020, 3, 19), // April 19, 2020
//     weekNumber: 16
//   });
//   const [monthView, setMonthView] = useState(generateMonthDays(2020, 3)); // April 2020
//   const [selectedDate, setSelectedDate] = useState(new Date(2020, 3, 14)); // April 14, 2020 (highlighted)

//   // Generate days for the month view
//   function generateMonthDays(year, month) {
//     const firstDay = new Date(year, month, 1).getDay() || 7; // Get day of week (0 is Sunday, so convert to 7)
//     const daysInMonth = new Date(year, month + 1, 0).getDate();
//     const daysInPrevMonth = new Date(year, month, 0).getDate();
//     const result = [];
    
//     // Previous month days
//     for (let i = firstDay - 1; i > 0; i--) {
//       result.push({
//         day: daysInPrevMonth - i + 1,
//         month: month - 1,
//         year: year,
//         isCurrentMonth: false
//       });
//     }
    
//     // Current month days
//     for (let i = 1; i <= daysInMonth; i++) {
//       result.push({
//         day: i,
//         month: month,
//         year: year,
//         isCurrentMonth: true
//       });
//     }
    
//     // Next month days
//     const remainingDays = 42 - result.length; // 6 rows of 7 days
//     for (let i = 1; i <= remainingDays; i++) {
//       result.push({
//         day: i,
//         month: month + 1,
//         year: year,
//         isCurrentMonth: false
//       });
//     }
    
//     return result;
//   }

//   // Check if date is selected
//   const isDateSelected = (day) => {
//     if (!day.isCurrentMonth) return false;
//     return day.day === selectedDate.getDate() &&
//            day.month === selectedDate.getMonth() &&
//            day.year === selectedDate.getFullYear();
//   };

//   // Get events for a specific day
//   const getEventsForDay = (dayName) => {
//     return events.filter(event => event.day === dayName);
//   };

//   // Calculate event position and height
//   const getEventStyle = (event) => {
//     const startHour = parseInt(event.start.split(':')[0]);
//     const startMinute = parseInt(event.start.split(':')[1]);
//     const endHour = parseInt(event.end.split(':')[0]);
//     const endMinute = parseInt(event.end.split(':')[1]);
    
//     const startPosition = (startHour - 9) * 60 + startMinute;
//     const duration = (endHour - startHour) * 60 + (endMinute - startMinute);
    
//     return {
//       top: `${startPosition}px`,
//       height: `${duration}px`,
//       backgroundColor: getEventColor(event.color, true)
//     };
//   };

//   // Get color for event
//   const getEventColor = (color, isBackground = false) => {
//     const colors = {
//       green: isBackground ? "rgba(76, 175, 80, 0.1)" : "#4CAF50",
//       blue: isBackground ? "rgba(33, 150, 243, 0.1)" : "#2196F3",
//       purple: isBackground ? "rgba(156, 39, 176, 0.1)" : "#9C27B0",
//       red: isBackground ? "rgba(244, 67, 54, 0.1)" : "#F44336"
//     };
//     return colors[color] || colors.blue;
//   };

//   // Get text color for event category
//   const getCategoryTextColor = (color) => {
//     const colors = {
//       green: "text-green-600",
//       blue: "text-blue-600",
//       purple: "text-purple-600",
//       red: "text-red-600"
//     };
//     return colors[color] || "text-blue-600";
//   };

//   // Get category icon color
//   const getCategoryIconColor = (color) => {
//     const colors = {
//       green: "bg-green-500",
//       blue: "bg-blue-500",
//       purple: "bg-purple-500",
//       red: "bg-red-500"
//     };
//     return colors[color] || "bg-blue-500";
//   };

//   // Week dates for the header
//   const getWeekDates = () => {
//     const dates = [];
//     for (let i = 0; i < 7; i++) {
//       const date = new Date(selectedWeek.start);
//       date.setDate(date.getDate() + i);
//       dates.push(date.getDate());
//     }
//     return dates;
//   };

//   const weekDates = getWeekDates();

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <div className="max-w-6xl mx-auto px-4">
//         {/* Header */}
//         <header className="py-4 flex items-center justify-between">
//           <div className="flex items-center space-x-6">
//             {/* Logo/Plan */}
//             <div className="flex items-center space-x-2">
//               <div className="bg-indigo-500 text-white rounded-lg p-2">
//                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
//                   <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
//                 </svg>
//               </div>
//               <span className="font-semibold text-gray-700">Plan</span>
//             </div>

//             {/* Calendar */}
//             <div className="flex items-center space-x-2 text-indigo-500">
//               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
//                 <line x1="16" y1="2" x2="16" y2="6"></line>
//                 <line x1="8" y1="2" x2="8" y2="6"></line>
//                 <line x1="3" y1="10" x2="21" y2="10"></line>
//               </svg>
//               <span className="font-medium">Calendar</span>
//             </div>
//           </div>

//           {/* User Avatar */}
//           <div className="flex items-center">
//             <div className="w-10 h-10 rounded-full overflow-hidden">
//               <img src="/api/placeholder/40/40" alt="User avatar" className="w-full h-full object-cover" />
//             </div>
//           </div>
//         </header>

//         <div className="flex mt-6 space-x-6">
//           {/* Left Sidebar - Mini Calendar & Categories */}
//           <div className="w-64 flex-shrink-0">
//             {/* Mini Calendar */}
//             <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="font-semibold text-gray-700">April 2020</h3>
//                 <div className="flex space-x-2">
//                   <button className="text-green-500 hover:text-green-600">
//                     <ChevronLeft size={18} />
//                   </button>
//                   <button className="text-green-500 hover:text-green-600">
//                     <ChevronRight size={18} />
//                   </button>
//                 </div>
//               </div>
              
//               {/* Mini Calendar Grid */}
//               <div className="grid grid-cols-7 gap-1 text-center text-sm">
//                 {/* Day headers */}
//                 {monthDays.map((day, index) => (
//                   <div key={`day-header-${index}`} className="text-gray-400 font-medium mb-1">
//                     {day.charAt(0)}
//                   </div>
//                 ))}
                
//                 {/* Calendar days */}
//                 {monthView.map((day, index) => (
//                   <div 
//                     key={`day-${index}`} 
//                     className={`rounded-full w-6 h-6 flex items-center justify-center text-sm mx-auto
//                       ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
//                       ${isDateSelected(day) ? 'bg-indigo-500 text-white' : ''}
//                     `}
//                   >
//                     {day.day}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Categories */}
//             <div className="bg-white rounded-lg shadow-sm p-4">
//               <h3 className="font-semibold text-gray-700 mb-4">Categories</h3>
//               <div className="space-y-3">
//                 {categories.map((category) => (
//                   <div key={category.id} className="flex items-center justify-between">
//                     <div className="flex items-center">
//                       <div className={`w-4 h-4 rounded ${getCategoryIconColor(category.color)}`}></div>
//                       <span className={`ml-2 text-sm ${getCategoryTextColor(category.color)}`}>{category.name}</span>
//                     </div>
//                     <span className="text-xs text-gray-400">{category.time}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Main Calendar */}
//           <div className="flex-1">
//             {/* Week Navigation */}
//             <div className="flex justify-between items-center mb-4">
//               <div className="flex items-center space-x-2">
//                 <button className="bg-white rounded-full p-1 shadow-sm">
//                   <ChevronLeft size={18} />
//                 </button>
//                 <button className="bg-white rounded-full p-1 shadow-sm">
//                   <ChevronRight size={18} />
//                 </button>
//                 <h2 className="text-xl font-medium text-gray-800 ml-2">April 13 - 19, 2020</h2>
//               </div>
//               <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
//                 Week 16
//               </div>
//             </div>

//             {/* Calendar Grid */}
//             <div className="bg-white rounded-lg shadow-sm overflow-hidden">
//               {/* Header with days */}
//               <div className="grid grid-cols-7 border-b">
//                 {days.map((day, index) => (
//                   <div key={`day-header-${index}`} className="p-2 text-center border-r last:border-r-0">
//                     <div className="text-sm text-indigo-500 font-medium">{day}</div>
//                     <div className={`text-2xl font-medium ${index === 1 ? 'text-indigo-500' : 'text-gray-600'}`}>
//                       {weekDates[index]}
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Time grid */}
//               <div className="relative" style={{ height: "600px" }}>
//                 {/* Time indicators */}
//                 {timeSlots.map((time, index) => (
//                   <div 
//                     key={`time-${index}`} 
//                     className="absolute w-full border-t text-xs text-gray-400"
//                     style={{ top: `${index * 60}px` }}
//                   >
//                     <span className="ml-2">{time}</span>
//                   </div>
//                 ))}

//                 {/* Grid columns */}
//                 <div className="grid grid-cols-7 h-full">
//                   {fullDays.map((day, dayIndex) => (
//                     <div 
//                       key={`day-column-${dayIndex}`} 
//                       className="relative border-r last:border-r-0 h-full"
//                     >
//                       {/* Events */}
//                       {getEventsForDay(day).map((event) => (
//                         <div
//                           key={event.id}
//                           className="absolute left-0 right-0 mx-1 rounded overflow-hidden shadow-sm"
//                           style={{
//                             ...getEventStyle(event),
//                             borderLeft: `3px solid ${getEventColor(event.color)}`
//                           }}
//                         >
//                           <div className="p-2 h-full text-sm">
//                             <h4 className="font-medium" style={{ color: getEventColor(event.color) }}>
//                               {event.title}
//                             </h4>
//                             {event.start && event.end && (
//                               <div className="text-xs mt-1 text-gray-500">
//                                 {event.start} - {event.end}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CalendarApp;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Menu,
  RefreshCw,
  Search,
  User,
  X,
  Info,
  Plus,
  Heart,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  Grid,
  List,
  ChevronDown,
  Check,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import NotificationsPanel from "@/components/common/NotificationsPanel";
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for calendar slots
const calendarSlots = [
  {
    id: 1,
    date: new Date(2025, 3, 10),
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    type: "Reading",
    available: true,
    volunteers: ["JD", "AS"],
    maxVolunteers: 5
  },
  {
    id: 2,
    date: new Date(2025, 3, 10),
    startTime: "2:00 PM",
    endTime: "3:30 PM",
    type: "Games",
    available: true,
    volunteers: ["BT"],
    maxVolunteers: 4
  },
  {
    id: 3,
    date: new Date(2025, 3, 11),
    startTime: "1:00 PM",
    endTime: "2:30 PM",
    type: "Music",
    available: true,
    volunteers: ["CL", "RJ", "MG"],
    maxVolunteers: 3
  },
  {
    id: 4,
    date: new Date(2025, 3, 12),
    startTime: "11:00 AM",
    endTime: "12:30 PM",
    type: "Reading",
    available: true,
    volunteers: [],
    maxVolunteers: 4
  },
  {
    id: 5,
    date: new Date(2025, 3, 13),
    startTime: "3:00 PM",
    endTime: "4:30 PM",
    type: "Games",
    available: false,
    volunteers: ["JD", "AS", "BT", "CL"],
    maxVolunteers: 4
  },
  {
    id: 6,
    date: new Date(2025, 3, 13),
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 10));
  const [viewMode, setViewMode] = useState("week");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState("all");

  // Example notification data
  const notifications = [
    { id: 1, message: "New calendar slot available", time: "5 minutes ago" },
    { id: 2, message: "Your session request was approved", time: "1 hour ago" },
    { id: 3, message: "Schedule change for tomorrow", time: "Today, 9:15 AM" }
  ];

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  const refreshCalendar = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Calendar refreshed",
        description: "Calendar data has been updated.",
      });
    }, 1000);
  };

  const handleBookSession = () => {
    if (!selectedSlot) return;
    toast({
      title: "Session requested",
      description: `You have requested a session on ${selectedSlot.date.toLocaleDateString()} at ${selectedSlot.startTime}.`,
    });
    setSelectedSlot(null);
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

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          
          <h1 className="text-xl font-semibold">Volunteer Calendar</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/volunteer/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/volunteer/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        

        {/* Calendar Content */}
        <main className="flex-1 overflow-auto p-4">
          {/* Calendar Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === "week") {
                    newDate.setDate(currentDate.getDate() - 7);
                  } else if (viewMode === "month") {
                    newDate.setMonth(currentDate.getMonth() - 1);
                  }
                  setCurrentDate(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="mx-4 text-lg font-medium">
                {formatDateDisplay()}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === "week") {
                    newDate.setDate(currentDate.getDate() + 7);
                  } else if (viewMode === "month") {
                    newDate.setMonth(currentDate.getMonth() + 1);
                  }
                  setCurrentDate(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={refreshCalendar}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", { "animate-spin": isLoading })} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Tabs
                value={viewMode}
                onValueChange={setViewMode}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="week" className="text-xs">
                    <Calendar className="h-4 w-4 mr-1" />
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-xs">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-xs">
                    <List className="h-4 w-4 mr-1" />
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
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
                      <SelectTrigger className="w-full">
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
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {viewMode === "week" && (
              <div>
                {/* Week Header */}
                <div className="grid grid-cols-7 border-b border-slate-200">
                  {getWeekDates().map((date, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "p-2 text-center border-r border-slate-200 last:border-r-0",
                        date.toDateString() === new Date().toDateString() ? "bg-blue-50" : ""
                      )}
                    >
                      <div className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center mx-auto mt-1",
                        date.toDateString() === new Date().toDateString() ? "bg-blue-500 text-white" : ""
                      )}>
                        {date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Week Content */}
                <div className="grid grid-cols-7 min-h-[600px]">
                  {getWeekDates().map((date, index) => (
                    <div 
                      key={index} 
                      className="border-r border-slate-200 last:border-r-0 p-2"
                    >
                      {getFilteredSlots()
                        .filter(slot => slot.date.toDateString() === date.toDateString())
                        .map(slot => (
                          <Dialog key={slot.id}>
                            <DialogTrigger asChild>
                              <div
                                className={cn(
                                  "p-2 rounded mb-2 cursor-pointer hover:opacity-80 transition-opacity",
                                  getSessionTypeColor(slot.type),
                                  !slot.available || slot.volunteers.length >= slot.maxVolunteers ? "opacity-50" : "opacity-100"
                                )}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-sm">{slot.startTime}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {slot.type}
                                  </Badge>
                                </div>
                                <div className="text-xs mt-1">
                                  {slot.startTime} - {slot.endTime}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {slot.volunteers.length}/{slot.maxVolunteers}
                                  </span>
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Session Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="flex items-center justify-between">
                                  <Badge className={getSessionTypeColor(slot.type)}>
                                    {slot.type}
                                  </Badge>
                                  <Badge 
                                    variant={slot.available && slot.volunteers.length < slot.maxVolunteers ? "outline" : "secondary"}
                                  >
                                    {slot.available && slot.volunteers.length < slot.maxVolunteers ? "Available" : "Unavailable"}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs text-slate-500">Date</Label>
                                    <div className="font-medium flex items-center mt-1">
                                      <Calendar className="h-4 w-4 mr-2" />
                                      {slot.date.toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-slate-500">Time</Label>
                                    <div className="font-medium flex items-center mt-1">
                                      <Clock className="h-4 w-4 mr-2" />
                                      {slot.startTime} - {slot.endTime}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-500">Volunteers</Label>
                                  <div className="font-medium flex items-center mt-1">
                                    <Users className="h-4 w-4 mr-2" />
                                    {slot.volunteers.length > 0 
                                      ? slot.volunteers.join(", ")
                                      : "No volunteers yet"}
                                    <span className="text-sm text-slate-500 ml-1">
                                      ({slot.volunteers.length}/{slot.maxVolunteers})
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-500">Additional Notes</Label>
                                  <p className="text-sm mt-1">
                                    This is a {slot.type.toLowerCase()} session that needs volunteer support.
                                    Please arrive 15 minutes before the session starts.
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedSlot(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleBookSession}
                                  disabled={!slot.available || slot.volunteers.length >= slot.maxVolunteers}
                                >
                                  <Heart className="h-4 w-4 mr-2" />
                                  Volunteer for this Session
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === "month" && (
              <div className="grid grid-cols-7 min-h-[600px]">
                {/* Month view implementation */}
                <div className="col-span-7 p-4 text-center border-b border-slate-200">
                  <p className="text-slate-500">Month view implementation</p>
                </div>
              </div>
            )}

            {viewMode === "list" && (
              <div className="p-4">
                {getFilteredSlots().length > 0 ? (
                  <div className="space-y-2">
                    {getFilteredSlots().map(slot => (
                      <Card key={slot.id} className="overflow-hidden">
                        <div className={cn(
                          "h-1 w-full",
                          getSessionTypeColor(slot.type)
                        )} />
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base flex items-center">
                              <span className="font-medium">{slot.date.toLocaleDateString()}</span>
                              <span className="mx-2 text-slate-300">•</span>
                              <span>{slot.startTime} - {slot.endTime}</span>
                            </CardTitle>
                            <Badge className={getSessionTypeColor(slot.type)}>
                              {slot.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1 text-slate-500" />
                                <span className="text-sm">
                                  {slot.volunteers.length}/{slot.maxVolunteers} volunteers
                                </span>
                              </div>
                              <div className="flex items-center">
                                {slot.available && slot.volunteers.length < slot.maxVolunteers ? (
                                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 mr-1 text-orange-500" />
                                )}
                                <span className="text-sm">
                                  {slot.available && slot.volunteers.length < slot.maxVolunteers ? "Available" : "Unavailable"}
                                </span>
                              </div>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Session Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="flex items-center justify-between">
                                    <Badge className={getSessionTypeColor(slot.type)}>
                                      {slot.type}
                                    </Badge>
                                    <Badge 
                                      variant={slot.available && slot.volunteers.length < slot.maxVolunteers ? "outline" : "secondary"}
                                    >
                                      {slot.available && slot.volunteers.length < slot.maxVolunteers ? "Available" : "Unavailable"}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-xs text-slate-500">Date</Label>
                                      <div className="font-medium flex items-center mt-1">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {slot.date.toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-slate-500">Time</Label>
                                      <div className="font-medium flex items-center mt-1">
                                        <Clock className="h-4 w-4 mr-2" />
                                        {slot.startTime} - {slot.endTime}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-slate-500">Volunteers</Label>
                                    <div className="font-medium flex items-center mt-1">
                                      <Users className="h-4 w-4 mr-2" />
                                      {slot.volunteers.length > 0 
                                        ? slot.volunteers.join(", ")
                                        : "No volunteers yet"}
                                      <span className="text-sm text-slate-500 ml-1">
                                        ({slot.volunteers.length}/{slot.maxVolunteers})
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-slate-500">Additional Notes</Label>
                                    <p className="text-sm mt-1">
                                      This is a {slot.type.toLowerCase()} session that needs volunteer support.
                                      Please arrive 15 minutes before the session starts.
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedSlot(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleBookSession}
                                    disabled={!slot.available || slot.volunteers.length >= slot.maxVolunteers}
                                  >
                                    <Heart className="h-4 w-4 mr-2" />
                                    Volunteer for this Session
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                      <Calendar className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No sessions found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      There are no sessions matching your current filter criteria. Try changing your filters or check back later.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Notifications Panel */}
        {notificationsOpen && (
          <div className="fixed inset-0 bg-black/20 z-30 lg:relative lg:inset-auto lg:bg-transparent">
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Notifications</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                                              <div
                        key={notification.id}
                        className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-100 rounded-full p-1">
                            <Info className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                      <Bell className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="font-medium mb-2">No notifications</h3>
                    <p className="text-slate-500 text-sm">
                      You're all caught up! You have no new notifications.
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-slate-200 mt-4">
                <Button variant="outline" className="w-full">
                  Mark all as read
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerCalendar;