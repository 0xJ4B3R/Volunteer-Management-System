// import React, { useState } from "react";
// import { Clock, Calendar, MapPin, ChevronLeft, ChevronRight, Plus, MoreHorizontal, User } from "lucide-react";
// import "./styles/Calendar.css";

// // Updated sessions with more detailed time information
// const sessions = [
//   { id: 1, day: "Monday", startTime: "09:00", endTime: "12:00", title: "Food Packing", location: "Community Center", people: ["avatar1.jpg", "avatar2.jpg"] },
//   { id: 2, day: "Monday", startTime: "09:00", endTime: "12:00", title: "Donation Sorting", location: "Warehouse", people: ["avatar3.jpg", "avatar4.jpg", "avatar5.jpg"] },
//   { id: 3, day: "Tuesday", startTime: "13:00", endTime: "16:00", title: "Library Duty", location: "Public Library", people: ["avatar2.jpg"] },
//   { id: 4, day: "Friday", startTime: "16:00", endTime: "18:00", title: "Event Setup", location: "Town Hall", people: ["avatar1.jpg", "avatar5.jpg"] },
//   { id: 5, day: "Friday", startTime: "16:00", endTime: "18:00", title: "Clean Up", location: "Town Hall", people: ["avatar3.jpg", "avatar4.jpg"] },
//   { id: 6, day: "Wednesday", startTime: "13:00", endTime: "16:00", title: "Senior Support", location: "Senior Center", people: ["avatar1.jpg", "avatar2.jpg", "avatar3.jpg"] },
//   { id: 7, day: "Thursday", startTime: "13:00", endTime: "16:00", title: "Food Bank", location: "Food Bank", people: ["avatar4.jpg", "avatar5.jpg"] },
//   { id: 8, day: "Saturday", startTime: "09:00", endTime: "12:00", title: "Park Cleanup", location: "City Park", people: ["avatar1.jpg", "avatar3.jpg", "avatar5.jpg"] },
// ];

// const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// const hours = Array.from({ length: 10 }, (_, i) => i + 9); //time slots from 9am to 6pm

// // Color palette for event cards
// const colorClasses = [
//   { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
//   { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
//   { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" },
//   { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
//   { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
// ];

// const VolunteerCalendar = () => {
//   const [selectedDate] = useState(new Date());
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [view, setView] = useState("week");
  
//   // Format date for display
//   const formattedMonth = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
//   const currentDay = selectedDate.getDate();
  
//   // Calculate position and height for event based on start and end times
//   const calculateEventPosition = (startTime, endTime) => {
//     const [startHour, startMinute] = startTime.split(':').map(Number);
//     const [endHour, endMinute] = endTime.split(':').map(Number);
    
//     const startOffset = (startHour - 9) * 60 + startMinute;
//     const duration = (endHour - startHour) * 60 + (endMinute - startMinute);
    
//     return {
//       top: `${startOffset}px`,
//       height: `${duration}px`,
//     };
//   };

//   const handleEventClick = (event) => {
//     setSelectedEvent(event);
//   };

//   const closeEventDetails = () => {
//     setSelectedEvent(null);
//   };

//   // Generate day numbers for the header
//   const dayNumbers = [];
//   for (let i = 0; i < 7; i++) {
//     const date = new Date(selectedDate);
//     date.setDate(currentDay - selectedDate.getDay() + i);
//     dayNumbers.push(date.getDate());
//   }

//   // Get a color class for an event based on its ID
//   const getColorForEvent = (id) => {
//     return colorClasses[id % colorClasses.length];
//   };

//   return (
//     <div className="calendar-container">
//       {/* Header */}
//       <div className="calendar-header">
//         <h1 className="month-title">{formattedMonth}</h1>
//         <div className="header-controls">
//           <div className="navigation-controls">
//           </div>
//         </div>
//       </div>

//       {/* Day header */}
//       <div className="day-header">
//         <div className="time-column-spacer"></div>
//         <div className="days-grid">
//           {days.map((day, index) => (
//             <div key={day} className="day-label">
//               <div className="day-name">{day}</div>
//               <div className={`day-number ${index === 1 ? "current-day" : ""}`}>
//                 {dayNumbers[index]}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Calendar grid */}
//       <div className="calendar-grid">
//         {/* Time indicators */}
//         <div className="time-column">
//           {hours.map(hour => (
//             <div key={hour} className="time-slot">
//               <span className="time-label">{hour % 12 || 12} {hour < 12 ? 'am' : 'pm'}</span>
//             </div>
//           ))}
//         </div>
        
//         {/* Calendar content */}
//         <div className="days-container">
//           {/* Horizontal time grid lines */}
//           <div className="grid-lines">
//             {hours.map((_, index) => (
//               <div key={index} className="grid-line"></div>
//             ))}
//           </div>
          
//           {/* Day columns */}
//           {days.map((day, dayIndex) => (
//             <div key={day} className={`day-column ${dayIndex < 6 ? 'with-border' : ''}`}>
//               {/* Available time slot indicators */}
//               {dayIndex === 2 && (
//                 <div className="available-slot">
//                   <button className="add-button">
//                     <Plus size={20} />
//                   </button>
//                 </div>
//               )}
              
//               {/* Event cards */}
//               {sessions
//                 .filter(session => session.day === day)
//                 .map(session => {
//                   const position = calculateEventPosition(session.startTime, session.endTime);
//                   const colorClass = getColorForEvent(session.id);
                  
//                   return (
//                     <div
//                       key={session.id}
//                       className={`event-card ${colorClass.bg} ${colorClass.text} ${colorClass.border}`}
//                       style={position}
//                       onClick={() => handleEventClick(session)}
//                     >
//                       <div className="event-title">{session.title}</div>
//                       <div className="event-time">{session.startTime} - {session.endTime}</div>
//                       {session.people?.length > 0 && (
//                         <div className="event-attendees">
//                           {session.people.slice(0, 3).map((person, i) => (
//                             <div key={i} className="attendee-avatar">
//                               <User size={12} className="avatar-icon" />
//                             </div>
//                           ))}
//                           {session.people.length > 3 && (
//                             <div className="attendee-count">
//                               +{session.people.length - 3}
//                             </div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Event details popup */}
//       {selectedEvent && (
//         <div 
//           className="modal-overlay"
//           onClick={closeEventDetails}
//         >
//           <div 
//             className="event-details-modal"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <h3 className="modal-title">
//               {selectedEvent.title}
//             </h3>
            
//             <div className="modal-content">
//               <div className="detail-item">
//                 <Calendar size={16} className="detail-icon" />
//                 <span className="detail-text">{selectedEvent.day}, {selectedEvent.startTime} - {selectedEvent.endTime}</span>
//               </div>
              
//               <div className="detail-item">
//                 <MapPin size={16} className="detail-icon" />
//                 <span className="detail-text">{selectedEvent.location}</span>
//               </div>
              
//               <div className="detail-item">
//                 <User size={16} className="detail-icon" />
//                 <span className="detail-text">{selectedEvent.people.length} volunteers</span>
//               </div>
//             </div>
            
//             <div className="modal-actions">
//               <button
//                 className="signup-button"
//                 onClick={() => {
//                   alert(`Requested: ${selectedEvent.title}`);
//                   closeEventDetails();
//                 }}
//               >
//                 Sign Up
//               </button>
//               <button
//                 className="close-button"
//                 onClick={closeEventDetails}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default VolunteerCalendar;

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Sample data for calendar events
const events = [
  { 
    id: 1, 
    title: "Product Design Course", 
    day: "Tuesday", 
    start: "09:30", 
    end: "12:00", 
    color: "green",
    category: "Product Design"
  },
  { 
    id: 2, 
    title: "Conversational Interview", 
    day: "Monday", 
    start: "12:30", 
    end: "14:00", 
    color: "purple",
    category: "User Research"
  },
  { 
    id: 3, 
    title: "App Design", 
    day: "Thursday", 
    start: "13:00", 
    end: "15:30", 
    color: "green",
    category: "Product Design"
  },
  { 
    id: 4, 
    title: "Usability testing", 
    day: "Thursday", 
    start: "09:00", 
    end: "11:00", 
    color: "purple",
    category: "User Research"
  },
  { 
    id: 5, 
    title: "Frontend developement", 
    day: "Friday", 
    start: "10:00", 
    end: "13:00", 
    color: "blue",
    category: "Software Engineering"
  }
];

// Categories with their colors
const categories = [
  { id: 1, name: "Product Design", color: "green", time: "5h00" },
  { id: 2, name: "Software Engineering", color: "blue", time: "3h00" },
  { id: 3, name: "User Research", color: "purple", time: "1h00" },
  { id: 4, name: "Marketing", color: "red", time: "0h00" }
];

// Time slots for the calendar
const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"
];

// Days of the week
const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const monthDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CalendarApp = () => {
  const [currentDate] = useState(new Date(2020, 3, 16)); // April 16, 2020
  const [selectedWeek] = useState({
    start: new Date(2020, 3, 13), // April 13, 2020
    end: new Date(2020, 3, 19), // April 19, 2020
    weekNumber: 16
  });
  const [monthView, setMonthView] = useState(generateMonthDays(2020, 3)); // April 2020
  const [selectedDate, setSelectedDate] = useState(new Date(2020, 3, 14)); // April 14, 2020 (highlighted)

  // Generate days for the month view
  function generateMonthDays(year, month) {
    const firstDay = new Date(year, month, 1).getDay() || 7; // Get day of week (0 is Sunday, so convert to 7)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const result = [];
    
    // Previous month days
    for (let i = firstDay - 1; i > 0; i--) {
      result.push({
        day: daysInPrevMonth - i + 1,
        month: month - 1,
        year: year,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      result.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true
      });
    }
    
    // Next month days
    const remainingDays = 42 - result.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      result.push({
        day: i,
        month: month + 1,
        year: year,
        isCurrentMonth: false
      });
    }
    
    return result;
  }

  // Check if date is selected
  const isDateSelected = (day) => {
    if (!day.isCurrentMonth) return false;
    return day.day === selectedDate.getDate() &&
           day.month === selectedDate.getMonth() &&
           day.year === selectedDate.getFullYear();
  };

  // Get events for a specific day
  const getEventsForDay = (dayName) => {
    return events.filter(event => event.day === dayName);
  };

  // Calculate event position and height
  const getEventStyle = (event) => {
    const startHour = parseInt(event.start.split(':')[0]);
    const startMinute = parseInt(event.start.split(':')[1]);
    const endHour = parseInt(event.end.split(':')[0]);
    const endMinute = parseInt(event.end.split(':')[1]);
    
    const startPosition = (startHour - 9) * 60 + startMinute;
    const duration = (endHour - startHour) * 60 + (endMinute - startMinute);
    
    return {
      top: `${startPosition}px`,
      height: `${duration}px`,
      backgroundColor: getEventColor(event.color, true)
    };
  };

  // Get color for event
  const getEventColor = (color, isBackground = false) => {
    const colors = {
      green: isBackground ? "rgba(76, 175, 80, 0.1)" : "#4CAF50",
      blue: isBackground ? "rgba(33, 150, 243, 0.1)" : "#2196F3",
      purple: isBackground ? "rgba(156, 39, 176, 0.1)" : "#9C27B0",
      red: isBackground ? "rgba(244, 67, 54, 0.1)" : "#F44336"
    };
    return colors[color] || colors.blue;
  };

  // Get text color for event category
  const getCategoryTextColor = (color) => {
    const colors = {
      green: "text-green-600",
      blue: "text-blue-600",
      purple: "text-purple-600",
      red: "text-red-600"
    };
    return colors[color] || "text-blue-600";
  };

  // Get category icon color
  const getCategoryIconColor = (color) => {
    const colors = {
      green: "bg-green-500",
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      red: "bg-red-500"
    };
    return colors[color] || "bg-blue-500";
  };

  // Week dates for the header
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedWeek.start);
      date.setDate(date.getDate() + i);
      dates.push(date.getDate());
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <header className="py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Logo/Plan */}
            <div className="flex items-center space-x-2">
              <div className="bg-indigo-500 text-white rounded-lg p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <span className="font-semibold text-gray-700">Plan</span>
            </div>

            {/* Calendar */}
            <div className="flex items-center space-x-2 text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span className="font-medium">Calendar</span>
            </div>
          </div>

          {/* User Avatar */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src="/api/placeholder/40/40" alt="User avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex mt-6 space-x-6">
          {/* Left Sidebar - Mini Calendar & Categories */}
          <div className="w-64 flex-shrink-0">
            {/* Mini Calendar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">April 2020</h3>
                <div className="flex space-x-2">
                  <button className="text-green-500 hover:text-green-600">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="text-green-500 hover:text-green-600">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              
              {/* Mini Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {/* Day headers */}
                {monthDays.map((day, index) => (
                  <div key={`day-header-${index}`} className="text-gray-400 font-medium mb-1">
                    {day.charAt(0)}
                  </div>
                ))}
                
                {/* Calendar days */}
                {monthView.map((day, index) => (
                  <div 
                    key={`day-${index}`} 
                    className={`rounded-full w-6 h-6 flex items-center justify-center text-sm mx-auto
                      ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                      ${isDateSelected(day) ? 'bg-indigo-500 text-white' : ''}
                    `}
                  >
                    {day.day}
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-700 mb-4">Categories</h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded ${getCategoryIconColor(category.color)}`}></div>
                      <span className={`ml-2 text-sm ${getCategoryTextColor(category.color)}`}>{category.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{category.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Calendar */}
          <div className="flex-1">
            {/* Week Navigation */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <button className="bg-white rounded-full p-1 shadow-sm">
                  <ChevronLeft size={18} />
                </button>
                <button className="bg-white rounded-full p-1 shadow-sm">
                  <ChevronRight size={18} />
                </button>
                <h2 className="text-xl font-medium text-gray-800 ml-2">April 13 - 19, 2020</h2>
              </div>
              <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
                Week 16
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header with days */}
              <div className="grid grid-cols-7 border-b">
                {days.map((day, index) => (
                  <div key={`day-header-${index}`} className="p-2 text-center border-r last:border-r-0">
                    <div className="text-sm text-indigo-500 font-medium">{day}</div>
                    <div className={`text-2xl font-medium ${index === 1 ? 'text-indigo-500' : 'text-gray-600'}`}>
                      {weekDates[index]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="relative" style={{ height: "600px" }}>
                {/* Time indicators */}
                {timeSlots.map((time, index) => (
                  <div 
                    key={`time-${index}`} 
                    className="absolute w-full border-t text-xs text-gray-400"
                    style={{ top: `${index * 60}px` }}
                  >
                    <span className="ml-2">{time}</span>
                  </div>
                ))}

                {/* Grid columns */}
                <div className="grid grid-cols-7 h-full">
                  {fullDays.map((day, dayIndex) => (
                    <div 
                      key={`day-column-${dayIndex}`} 
                      className="relative border-r last:border-r-0 h-full"
                    >
                      {/* Events */}
                      {getEventsForDay(day).map((event) => (
                        <div
                          key={event.id}
                          className="absolute left-0 right-0 mx-1 rounded overflow-hidden shadow-sm"
                          style={{
                            ...getEventStyle(event),
                            borderLeft: `3px solid ${getEventColor(event.color)}`
                          }}
                        >
                          <div className="p-2 h-full text-sm">
                            <h4 className="font-medium" style={{ color: getEventColor(event.color) }}>
                              {event.title}
                            </h4>
                            {event.start && event.end && (
                              <div className="text-xs mt-1 text-gray-500">
                                {event.start} - {event.end}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarApp;