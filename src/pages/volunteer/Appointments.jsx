import React, { useEffect, useState, useMemo } from "react";
import { Clock3, MapPin, Search, Trash2, Globe, CalendarDays, CheckCircle2, Hourglass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { doc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LoadingScreen from "@/components/volunteer/InnerLS";
import "./styles/Appointments.css";
import { Layout } from '@/components/volunteer/Layout';

// Import proper Firestore hooks and types
import { useAppointments } from "@/hooks/useFirestoreCalendar";
import { useCalendarSlots } from "@/hooks/useFirestoreCalendar";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import { useAttendanceByAppointment } from "@/hooks/useAttendance";

// Utility: Get default color for sessions
const getSessionColor = () => {
  return "#6b7280";
};

// Utility: Get default border color for sessions
const getSessionBorderColor = () => {
  return "#4b5563";
};

const getSessionTypeClass = () => {
  return "session";
};

// Helper function to convert time to minutes for sorting
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Format Firebase date string to "MONTH DATE" format
const formatFirebaseDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day = date.getDate();
  return `${month} ${day}`;
};

// Get day of week from date string
const getDayFromDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.toLocaleString('en-US', { weekday: 'short' });
  return day.substring(0, 3); // Get first 3 letters (Mon, Tue, etc.)
};

export default function Appointments() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('appointments');
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentVolunteer, setCurrentVolunteer] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Use proper Firestore hooks
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { slots, loading: slotsLoading } = useCalendarSlots();
  const { volunteers, loading: volunteersLoading } = useVolunteers();

  // Function to show notifications
  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    // Auto hide after 5 seconds
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Set RTL/LTR based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === "he" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Check authentication and get current user
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
      navigate("/login");
    }
  }, [navigate]);

  // Find current volunteer record when user and volunteers data is available
  useEffect(() => {
    if (currentUser && volunteers.length > 0) {
      const volunteer = volunteers.find(v => 
        v.userId === currentUser.id || 
        v.userId === currentUser.uid ||
        v.fullName === currentUser.username // Fallback if linked by name
      );
      setCurrentVolunteer(volunteer);
      
      if (!volunteer) {
        console.warn("Could not find volunteer record for user:", currentUser);
      }
    }
  }, [currentUser, volunteers]);

  // Memoized appointments filtering for current volunteer
  const userAppointments = useMemo(() => {
    if (!currentVolunteer || !slots.length) {
      return [];
    }

    console.log("Current volunteer:", currentVolunteer);
    console.log("Appointments:", appointments);
    console.log("Slots:", slots);

    // Get appointments where volunteer is assigned
    const assignedAppointments = appointments
      .filter(appointment => {
        // Check if current volunteer is assigned to this appointment
        const isVolunteerAssigned = appointment.volunteerIds.some(vol => 
          vol.id === currentVolunteer.id && vol.type === 'volunteer'
        );
        return isVolunteerAssigned;
      })
      .map(appointment => {
        const slot = slots.find(s => s.id === appointment.calendarSlotId);
        if (!slot) return null;

        const volunteerRequest = slot.volunteerRequests?.find(vr => 
          vr.volunteerId === currentVolunteer.id
        );

        return {
          id: appointment.id,
          appointmentId: appointment.id,
          date: formatFirebaseDate(slot.date),
          day: getDayFromDate(slot.date),
          time: `${slot.startTime} - ${slot.endTime}`,
          location: slot.customLabel || "Session",
          sessionType: slot.customLabel || "Session",
          note: appointment.notes || slot.notes || "",
          category: slot.isCustom ? "Custom" : "Regular",
          status: volunteerRequest?.status || appointment.status,
          appointmentStatus: appointment.status,
          maxCapacity: slot.maxCapacity,
          volunteerRequests: slot.volunteerRequests || [],
          isOpen: slot.isOpen,
          residentIds: appointment.residentIds || [],
          rawData: {
            ...appointment,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: appointment.status,
            calendarSlotId: appointment.calendarSlotId
          }
        };
      })
      .filter(Boolean);

    // Get slots with pending volunteer requests (not yet appointments)
    const pendingRequestSlots = slots
      .filter(slot => {
        // Check if current volunteer has a request for this slot
        const hasVolunteerRequest = slot.volunteerRequests?.some(vr => 
          vr.volunteerId === currentVolunteer.id
        );
        
        // Only include if there's no corresponding appointment yet
        const hasAppointment = appointments.some(appointment => 
          appointment.calendarSlotId === slot.id &&
          appointment.volunteerIds.some(vol => 
            vol.id === currentVolunteer.id && vol.type === 'volunteer'
          )
        );
        
        return hasVolunteerRequest && !hasAppointment;
      })
      .map(slot => {
        const volunteerRequest = slot.volunteerRequests?.find(vr => 
          vr.volunteerId === currentVolunteer.id
        );

        return {
          id: slot.id, // Use slot ID for pending requests
          appointmentId: slot.appointmentId || slot.id,
          date: formatFirebaseDate(slot.date),
          day: getDayFromDate(slot.date),
          time: `${slot.startTime} - ${slot.endTime}`,
          location: slot.customLabel || "Session",
          sessionType: slot.customLabel || "Session",
          note: slot.notes || "",
          category: slot.isCustom ? "Custom" : "Regular",
          status: volunteerRequest?.status || "pending",
          appointmentStatus: "pending",
          maxCapacity: slot.maxCapacity,
          volunteerRequests: slot.volunteerRequests || [],
          isOpen: slot.isOpen,
          residentIds: slot.residentIds || [],
          rawData: {
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: "pending",
            calendarSlotId: slot.id
          }
        };
      });

    // Combine both arrays and sort
    return [...assignedAppointments, ...pendingRequestSlots]
      .filter(Boolean) // Remove null entries
      .sort((a, b) => {
        // Sort by date, then by time
        const dateA = new Date(a.rawData.date);
        const dateB = new Date(b.rawData.date);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        // If same date, sort by start time
        const timeA = timeToMinutes(a.rawData.startTime);
        const timeB = timeToMinutes(b.rawData.startTime);
        return timeA - timeB;
      });
  }, [currentVolunteer, appointments, slots]);

  // Loading state
  const loading = appointmentsLoading || slotsLoading || volunteersLoading;

  // Filter appointments by tab
  const tabAppointments = useMemo(() => {
    return userAppointments.filter((a) => {
      const dateObj = new Date(a.rawData.date);
      const now = new Date();
      
      if (tab === "upcoming") {
        // Show appointments that are approved and not completed, or upcoming status
        const isApproved = a.status === "approved";
        const isNotCompleted = a.appointmentStatus !== "completed";
        const isFuture = dateObj >= now || a.appointmentStatus === "upcoming";
        return isApproved && isNotCompleted && isFuture;
      }
      if (tab === "past") {
        // Show completed appointments or past dates where user was approved
        return a.appointmentStatus === "completed" || 
               (a.status === "approved" && dateObj < now);
      }
      if (tab === "pending") {
        // Show appointments where volunteer status is pending
        return a.status === "pending";
      }
      return false;
    });
  }, [userAppointments, tab]);

  // Filter by search query
  const filtered = useMemo(() => {
    return tabAppointments.filter((a) => {
      const matchSearch =
        (a.location?.toLowerCase().includes(query.toLowerCase()) || false) ||
        (a.note?.toLowerCase().includes(query.toLowerCase()) || false);
      return matchSearch;
    });
  }, [tabAppointments, query]);

  const handleCancel = async (appointmentId) => {
    console.log("=== CANCEL DEBUG ===");
    console.log("appointmentId:", appointmentId);
    console.log("currentVolunteer:", currentVolunteer);
    
    if (!currentVolunteer) {
      showNotification("Volunteer data not available", "error");
      return;
    }

    try {
      // Find the appointment to get slot data
      const appointment = userAppointments.find(a => a.id === appointmentId);
      console.log("Found appointment:", appointment);
      
      if (!appointment) {
        showNotification("Appointment not found", "error");
        return;
      }

      // Find the corresponding slot
      const slot = slots.find(s => 
        s.id === appointment.rawData.calendarSlotId || 
        s.appointmentId === appointmentId ||
        s.id === appointmentId // For pending requests, the slot ID is used as appointment ID
      );
      console.log("Found slot:", slot);
      
      if (!slot) {
        showNotification("Slot not found", "error");
        return;
      }

      // Remove the volunteer request from the slot
      const slotRef = doc(db, "calendar_slots", slot.id);
      
      // Find the volunteer request to remove
      console.log("Looking for volunteer request with volunteerId:", currentVolunteer.id);
      console.log("Slot volunteerRequests:", slot.volunteerRequests);
      
      const volunteerRequestToRemove = slot.volunteerRequests?.find(vr => 
        vr.volunteerId === currentVolunteer.id
      );
      
      console.log("volunteerRequestToRemove:", volunteerRequestToRemove);
      
      if (volunteerRequestToRemove) {
        console.log("Attempting to remove request from slot:", slot.id);
        
        // Instead of arrayRemove, filter out the volunteer request
        const updatedVolunteerRequests = slot.volunteerRequests.filter(vr => 
          vr.volunteerId !== currentVolunteer.id
        );
        
        console.log("Original requests:", slot.volunteerRequests.length);
        console.log("Updated requests:", updatedVolunteerRequests.length);
        
        await updateDoc(slotRef, {
          volunteerRequests: updatedVolunteerRequests
        });
        
        showNotification("Request canceled successfully!", "success");
      } else {
        showNotification("No pending request found to cancel", "error");
      }
      
      if (selected && selected.id === appointmentId) setSelected(null);
      
    } catch (error) {
      console.error("Error canceling appointment:", error);
      showNotification("Error canceling request. Please try again.", "error");
    }
  };

  const getTabIcon = (key) => {
    switch (key) {
      case "upcoming": return <CalendarDays size={18} />;
      case "past": return <CheckCircle2 size={18} />;
      case "pending": return <Hourglass size={18} />;
      default: return null;
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    let result = time;
    if (i18n.language === "he") {
      result = result
        .replaceAll("AM", t("appointments.time.AM"))
        .replaceAll("PM", t("appointments.time.PM"))
        .replaceAll("A.M.", t("appointments.time.AM"))
        .replaceAll("P.M.", t("appointments.time.PM"));
    }
    return result;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [month, day] = dateStr.split(" ");
    return `${t(`appointments.months.${month}`)} ${day}`;
  };

  // Get status tag with appropriate styling
  const getStatusTag = (appointment) => {
    const status = appointment.status;
    
    const getStatusClass = (status) => {
      switch (status) {
        case "approved": return "status-approved";
        case "pending": return "status-pending";
        case "rejected": return "status-rejected";
        case "completed": return "status-completed";
        default: return "status-default";
      }
    };
    
    return (
      <div className={`tag ${getSessionTypeClass()} ${getStatusClass(status)}`}>
        {appointment.sessionType}
      </div>
    );
  };

  return (
    <Layout>
      <div className="profile-page">
        {/* Notification Toast */}
        {notification.show && (
          <div 
            className={`notification-toast ${notification.type}`}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 9999,
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              backgroundColor: notification.type === 'error' ? '#ef4444' : 
                             notification.type === 'success' ? '#10b981' : '#3b82f6',
              transform: 'translateX(0)',
              transition: 'all 0.3s ease',
              maxWidth: '300px',
              wordWrap: 'break-word'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {notification.type === 'error' && <span>❌</span>}
              {notification.type === 'success' && <span>✅</span>}
              {notification.type === 'info' && <span>ℹ️</span>}
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification({ show: false, message: "", type: "" })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {loading ? (
          <LoadingScreen />
        ) : (
          <>
            <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`}>
              <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
                <Globe size={35} />
              </button>
              {showLangOptions && (
                <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
                  <button onClick={() => { 
                    localStorage.setItem('language', 'en');
                    i18n.changeLanguage('en').then(() => {
                      document.documentElement.dir = 'ltr';
                    });
                    setShowLangOptions(false); 
                  }}>English</button>
                  <button onClick={() => { 
                    localStorage.setItem('language', 'he');
                    i18n.changeLanguage('he').then(() => {
                      document.documentElement.dir = 'rtl';
                    });
                    setShowLangOptions(false); 
                  }}>עברית</button>
                </div>
              )}
            </div>
            
            <div className="profile-header">
              <h1 className="profile-title">{t("appointments.title")}</h1>
              <p className="profile-subtitle">{t("appointments.subtitle")}</p>
            </div>
            
            <div className={`profile-tabs ${i18n.language === "he" ? "rtl-tabs" : ""}`}>
              <div className="tabs">
                {["past", "upcoming", "pending"].map((key) => (
                  <button key={key} className={`tab-item ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
                    {getTabIcon(key)} {t(`appointments.tabs.${key}`)}
                  </button>
                ))}
              </div>
            </div>
              
            <div className="profile-overview">
              <div className="controls-row">
                <div className="search-bar">
                  <Search size={18} />
                  <input placeholder={t("appointments.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>
              
              <div className="appointments-list">
                {filtered.length === 0 ? (
                  <div className="note">{t("appointments.noAppointments")}</div>
                ) : (
                  filtered.map((a) => (
                    <div 
                      className={`appointment-card ${getSessionTypeClass()}`} 
                      key={a.id} 
                      onClick={() => setSelected(a)}
                      style={{
                        borderLeftColor: getSessionBorderColor()
                      }}
                    >
                      <div className="appointment-left">
                        <div className="appointment-date">{formatDate(a.date)}</div>
                        <div className="appointment-day">{t(`appointments.days.${a.day}`)}</div>
                      </div>
                      <div className="appointment-middle">
                        <div className="info"><Clock3 size={16} /> {formatTime(a.time)}</div>
                        <div className="info"><MapPin size={16} /> {t("appointments.modal.category")}: {a.location}</div>
                        {a.note && <div className="note">{t("appointments.note")}: {a.note}</div>}
                      </div>
                      <div className="appointment-right">
                        {getStatusTag(a)}
                        {a.status === "pending" && (
                          <div className="actions">
                            <button className="btn danger" onClick={(e) => { e.stopPropagation(); handleCancel(a.id); }}>
                              <Trash2 size={14} /> {t("appointments.actions.cancel")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
              
            {selected && (
              <div 
                className="modal-overlay" 
                onClick={() => setSelected(null)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '1rem'
                }}
              >
                <div 
                  className="modal-content appointments-modal" 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: '28rem',
                    width: '100%',
                    borderRadius: '0.75rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    position: 'relative'
                  }}
                >
                  {/* Modal Header */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h2 
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        textAlign: i18n.language === 'he' ? 'right' : 'left',
                        direction: 'auto'
                      }}
                    >
                      {t("appointments.modal.title")}
                    </h2>
                    
                    {/* Session Type Badge */}
                    <div style={{ marginBottom: '1rem' }}>
                      <span 
                        style={{
                          backgroundColor: getSessionColor(),
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          display: 'inline-block'
                        }}
                      >
                        {selected.sessionType}
                      </span>
                    </div>
                      
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        marginBottom: '1rem'
                      }}
                    >
                      <span style={{ marginRight: '0.5rem', fontWeight: '500' }}>
                        {t("appointments.modal.date")}:
                      </span>
                      <span>
                        {formatDate(selected.date)} ({t(`appointments.days.${selected.day}`)})
                      </span>
                    </div>
                  </div>
                    
                  {/* Modal Body */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '500', color: '#374151' }}>
                          {t("appointments.modal.time")}:
                        </span>
                        <span 
                          style={{
                            backgroundColor: '#f3f4f6',
                            borderRadius: '0.25rem',
                            padding: '0.125rem 0.5rem',
                            color: '#1f2937',
                            fontSize: '0.875rem'
                          }}
                        >
                          {formatTime(selected.time)}
                        </span>
                      </div>
                        
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '500', color: '#374151' }}>
                          {t("appointments.modal.category")}:
                        </span>
                        <span style={{ color: '#6b7280' }}>{selected.location}</span>
                      </div>
                        
                      {selected.note && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontWeight: '500', color: '#374151' }}>
                            {t("appointments.modal.note")}:
                          </span>
                          <span 
                            style={{
                              color: '#6b7280',
                              fontStyle: 'italic',
                              padding: '0.5rem',
                              backgroundColor: '#f9fafb',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem'
                            }}
                          >
                            {selected.note}
                          </span>
                        </div>
                      )}

                      {/* Show status if available */}
                      {selected.status && (
                        <div
                          style={{
                            marginTop: "1rem",
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            backgroundColor:
                              selected.status === "approved" ? "#d1fae5" :
                              selected.status === "pending"  ? "#fef3c7" :
                              selected.status === "rejected" ? "#fee2e2" : "#f3f4f6",
                            border: `1px solid ${
                              selected.status === "approved" ? "#10b981" :
                              selected.status === "pending"  ? "#f59e0b" :
                              selected.status === "rejected" ? "#ef4444" : "#d1d5db"
                            }`
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{
                              fontWeight: 500,
                              color:
                                selected.status === "approved" ? "#065f46" :
                                selected.status === "pending"  ? "#92400e" :
                                selected.status === "rejected" ? "#991b1b" : "#374151"
                            }}>
                              {t("appointments.statusLabel")} {t(`appointments.status.${selected.status}`)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                    
                  {/* Modal Footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setSelected(null)}
                      style={{
                        backgroundColor: '#416a42',
                        color: 'white',
                        width: '100%',
                        padding: '0.625rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.875rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#5c885d'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#416a42'}
                    >
                      {t("appointments.modal.close")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}