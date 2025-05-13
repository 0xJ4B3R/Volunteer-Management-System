import React, { useState } from "react";
import { Clock, Calendar, MapPin, ChevronLeft, ChevronRight, Plus, MoreHorizontal, User } from "lucide-react";
import "./styles/Calendar.css";

// Updated sessions with more detailed time information
const sessions = [
  { id: 1, day: "Monday", startTime: "08:00", endTime: "09:30", title: "Food Packing", location: "Community Center", people: ["avatar1.jpg", "avatar2.jpg"] },
  { id: 2, day: "Monday", startTime: "09:00", endTime: "10:30", title: "Donation Sorting", location: "Warehouse", people: ["avatar3.jpg", "avatar4.jpg", "avatar5.jpg"] },
  { id: 3, day: "Tuesday", startTime: "12:00", endTime: "14:00", title: "Library Duty", location: "Public Library", people: ["avatar2.jpg"] },
  { id: 4, day: "Friday", startTime: "16:00", endTime: "18:00", title: "Event Setup", location: "Town Hall", people: ["avatar1.jpg", "avatar5.jpg"] },
  { id: 5, day: "Friday", startTime: "18:00", endTime: "20:00", title: "Clean Up", location: "Town Hall", people: ["avatar3.jpg", "avatar4.jpg"] },
  { id: 6, day: "Wednesday", startTime: "10:00", endTime: "11:30", title: "Senior Support", location: "Senior Center", people: ["avatar1.jpg", "avatar2.jpg", "avatar3.jpg"] },
  { id: 7, day: "Thursday", startTime: "14:00", endTime: "16:00", title: "Food Bank", location: "Food Bank", people: ["avatar4.jpg", "avatar5.jpg"] },
  { id: 8, day: "Saturday", startTime: "09:00", endTime: "11:00", title: "Park Cleanup", location: "City Park", people: ["avatar1.jpg", "avatar3.jpg", "avatar5.jpg"] },
];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hours = Array.from({ length: 10 }, (_, i) => i + 9); //time slots from 9am to 6pm

// Color palette for event cards
const colorClasses = [
  { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" },
  { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
];

const VolunteerCalendar = () => {
  const [selectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState("week");
  
  // Format date for display
  const formattedMonth = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentDay = selectedDate.getDate();
  
  // Calculate position and height for event based on start and end times
  const calculateEventPosition = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startOffset = (startHour - 9) * 60 + startMinute;
    const duration = (endHour - startHour) * 60 + (endMinute - startMinute);
    
    return {
      top: `${startOffset}px`,
      height: `${duration}px`,
    };
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const closeEventDetails = () => {
    setSelectedEvent(null);
  };

  // Generate day numbers for the header
  const dayNumbers = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(selectedDate);
    date.setDate(currentDay - selectedDate.getDay() + i);
    dayNumbers.push(date.getDate());
  }

  // Get a color class for an event based on its ID
  const getColorForEvent = (id) => {
    return colorClasses[id % colorClasses.length];
  };

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <h1 className="month-title">{formattedMonth}</h1>
        <div className="header-controls">
          <div className="navigation-controls">
          </div>
        </div>
      </div>

      {/* Day header */}
      <div className="day-header">
        <div className="time-column-spacer"></div>
        <div className="days-grid">
          {days.map((day, index) => (
            <div key={day} className="day-label">
              <div className="day-name">{day}</div>
              <div className={`day-number ${index === 1 ? "current-day" : ""}`}>
                {dayNumbers[index]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {/* Time indicators */}
        <div className="time-column">
          {hours.map(hour => (
            <div key={hour} className="time-slot">
              <span className="time-label">{hour % 12 || 12} {hour < 12 ? 'am' : 'pm'}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar content */}
        <div className="days-container">
          {/* Horizontal time grid lines */}
          <div className="grid-lines">
            {hours.map((_, index) => (
              <div key={index} className="grid-line"></div>
            ))}
          </div>
          
          {/* Day columns */}
          {days.map((day, dayIndex) => (
            <div key={day} className={`day-column ${dayIndex < 6 ? 'with-border' : ''}`}>
              {/* Available time slot indicators */}
              {dayIndex === 2 && (
                <div className="available-slot">
                  <button className="add-button">
                    <Plus size={20} />
                  </button>
                </div>
              )}
              
              {/* Event cards */}
              {sessions
                .filter(session => session.day === day)
                .map(session => {
                  const position = calculateEventPosition(session.startTime, session.endTime);
                  const colorClass = getColorForEvent(session.id);
                  
                  return (
                    <div
                      key={session.id}
                      className={`event-card ${colorClass.bg} ${colorClass.text} ${colorClass.border}`}
                      style={position}
                      onClick={() => handleEventClick(session)}
                    >
                      <div className="event-title">{session.title}</div>
                      <div className="event-time">{session.startTime} - {session.endTime}</div>
                      {session.people?.length > 0 && (
                        <div className="event-attendees">
                          {session.people.slice(0, 3).map((person, i) => (
                            <div key={i} className="attendee-avatar">
                              <User size={12} className="avatar-icon" />
                            </div>
                          ))}
                          {session.people.length > 3 && (
                            <div className="attendee-count">
                              +{session.people.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Event details popup */}
      {selectedEvent && (
        <div 
          className="modal-overlay"
          onClick={closeEventDetails}
        >
          <div 
            className="event-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">
              {selectedEvent.title}
            </h3>
            
            <div className="modal-content">
              <div className="detail-item">
                <Calendar size={16} className="detail-icon" />
                <span className="detail-text">{selectedEvent.day}, {selectedEvent.startTime} - {selectedEvent.endTime}</span>
              </div>
              
              <div className="detail-item">
                <MapPin size={16} className="detail-icon" />
                <span className="detail-text">{selectedEvent.location}</span>
              </div>
              
              <div className="detail-item">
                <User size={16} className="detail-icon" />
                <span className="detail-text">{selectedEvent.people.length} volunteers</span>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="signup-button"
                onClick={() => {
                  alert(`Requested: ${selectedEvent.title}`);
                  closeEventDetails();
                }}
              >
                Sign Up
              </button>
              <button
                className="close-button"
                onClick={closeEventDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerCalendar;