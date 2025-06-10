import React, { useEffect, useState } from "react";
import { Clock3, MapPin, Search, Trash2, Globe, CalendarDays, CheckCircle2, Hourglass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, doc, updateDoc, arrayRemove, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LoadingScreen from "@/components/volunteer/InnerLS";
import "./styles/Appointments.css";

// Utility functions for session type colors
const getSessionTypeColor = (type) => {
  switch ((type || '').toLowerCase()) {
    case "reading": return "#3b82f6";
    case "games": return "#ec4899";
    case "music": return "#f59e0b";
    case "art": return "#10b981";
    case "crafts": return "#8b5cf6";
    case "exercise": return "#ef4444";
    case "therapy": return "#6366f1";
    case "social": return "#14b8a6";
    case "session": return "#6b7280";
    default: return "#6b7280";
  }
};

const getSessionTypeBorderColor = (type) => {
  switch ((type || '').toLowerCase()) {
    case "reading": return "#2563eb";
    case "games": return "#db2777";
    case "music": return "#d97706";
    case "art": return "#059669";
    case "crafts": return "#7c3aed";
    case "exercise": return "#dc2626";
    case "therapy": return "#4f46e5";
    case "social": return "#0d9488";
    case "session": return "#4b5563";
    default: return "#4b5563";
  }
};

const getSessionTypeClass = (type) => {
  return (type || '').toLowerCase().replace(/\s+/g, '');
};

export default function Appointments() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [userId, setUserId] = useState(""); 
  const [username, setUsername] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

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

  // Get the username from localStorage
  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    // Also get userId if available
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Function to check if appointment date has passed and update status
  const updatePastAppointments = async (appointmentsData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const updatePromises = [];
    const updatedAppointments = [...appointmentsData];
    
    for (let i = 0; i < appointmentsData.length; i++) {
      const appointment = appointmentsData[i];
      const appointmentDate = new Date(appointment.rawData.date);
      const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
      
      // Check if appointment date has passed and status is not already "completed"
      if (appointmentDay < today && appointment.rawData.status !== "completed") {        
        // Update in Firebase
        const appointmentRef = doc(db, "calendar_slots", appointment.id);
        const updatePromise = updateDoc(appointmentRef, {
          status: "completed"
        }).then(() => {
          // Update local state
          updatedAppointments[i] = {
            ...appointment,
            rawData: {
              ...appointment.rawData,
              status: "completed"
            }
          };
        }).catch((error) => {
          console.error(`Error updating appointment ${appointment.id}:`, error);
        });
        
        updatePromises.push(updatePromise);
      }
    }
    
    // Wait for all updates to complete
    if (updatePromises.length > 0) {
      try {
        await Promise.all(updatePromises);
        return updatedAppointments;
      } catch (error) {
        console.error("Error updating some appointments:", error);
        return updatedAppointments;
      }
    }
    
    return appointmentsData;
  };

  // Fetch appointments from Firebase
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!username) return; // Don't fetch if username isn't available
      
      try {
        setLoading(true);
        const calendarRef = collection(db, "calendar_slots");
        const snapshot = await getDocs(calendarRef);
        
        const appointmentsData = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Check if current user is a volunteer for this slot by username
          const userVolunteer = data.volunteers?.find(v => v.username === username);
          
          // Get session type from customLabel, fallback to "Session"
          const sessionType = data.customLabel || "Session";
          
          // Format the appointment data
          return {
            id: doc.id,
            appointmentId: data.appointmentId,
            date: formatFirebaseDate(data.date),
            day: getDayFromDate(data.date),
            time: `${data.startTime} - ${data.endTime}`,
            location: sessionType,
            sessionType: sessionType, // Keep separate for color logic
            note: data.notes || "",
            category: data.isCustom ? "Custom" : "Regular",
            status: userVolunteer ? userVolunteer.status : (data.isOpen ? "Open" : "Closed"),
            maxCapacity: data.maxCapacity,
            volunteers: data.volunteers || [],
            volunteerRequests: data.volunteerRequests || [],
            isOpen: data.isOpen,
            residentIds: data.residentIds || [],
            rawData: data // Keep the raw data for reference
          };
        });
        
        // Update past appointments automatically
        const updatedAppointments = await updatePastAppointments(appointmentsData);
        
        setAppointments(updatedAppointments);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [username]); // Depend on username instead of userId

  // Periodic check for past appointments (every 5 minutes)
  useEffect(() => {
    if (appointments.length === 0) return;
    
    const intervalId = setInterval(async () => {
      const updatedAppointments = await updatePastAppointments(appointments);
      if (updatedAppointments !== appointments) {
        setAppointments(updatedAppointments);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [appointments]);

  // Format Firebase date string to "MONTH DATE for example May 27" format
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

  const now = new Date();

  const tabAppointments = appointments.filter((a) => {
    const dateObj = new Date(a.rawData.date);
    
    if (tab === "upcoming") {
      // Show appointment where user is approved, but ONLY if the appointment is NOT completed
      const isUserApproved = a.volunteers?.some(v => 
        v.username === username && v.status === "approved"
      );
      // Make sure it's not a completed appointment
      return (isUserApproved || a.rawData.status === "upcoming") && a.rawData.status !== "completed";
    }
    if (tab === "past") {
      // Show any appointment with status "completed" regardless of date
      return a.rawData.status === "completed";
    }
    if (tab === "pending") {
      // Show appointments where this user's status is "pending"
      return a.volunteers?.some(v => 
        v.username === username && v.status === "pending"
      );
    }
    return false;
  });

  const filtered = tabAppointments.filter((a) => {
    const matchSearch =
      (a.location?.toLowerCase().includes(query.toLowerCase()) || false) ||
      (a.note?.toLowerCase().includes(query.toLowerCase()) || false);
    return matchSearch;
  });

  const handleCancel = async (id) => {
    try {
      // Find the appointment to get volunteer data
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) return;
      
      // Update Firestore: Remove the current user from volunteers array
      const appointmentRef = doc(db, "calendar_slots", id);
      
      // Find the volunteer entry to remove by username
      const volunteerToRemove = appointment.volunteers.find(v => v.username === username);
      
      if (volunteerToRemove) {
        // Create update object to remove from both arrays
        const updateData = {
          volunteers: arrayRemove(volunteerToRemove)
        };
        
        // Also remove from volunteerRequests if the user ID exists there
        // Check different possible ID formats that might be stored in volunteerRequests
        const possibleIds = [
          userId,
          volunteerToRemove.id,
          username,
          volunteerToRemove.username
        ].filter(Boolean); // Remove any null/undefined values
        
        // Find which ID format is actually in the volunteerRequests array
        const userIdInRequests = possibleIds.find(id => 
          appointment.volunteerRequests?.includes(id)
        );
        
        if (userIdInRequests) {
          updateData.volunteerRequests = arrayRemove(userIdInRequests);
        }
        
        // Perform the update
        await updateDoc(appointmentRef, updateData);
        
        // Update local state
        setAppointments(prev => prev.map(a => {
          if (a.id === id) {
            return {
              ...a,
              volunteers: a.volunteers.filter(v => v.username !== username),
              volunteerRequests: a.volunteerRequests.filter(reqId => reqId !== userIdInRequests),
              status: "Open" // Reset status for this user's view
            };
          }
          return a;
        }));
      }
      
      if (selected && selected.id === id) setSelected(null);
      
      // Show success notification
      showNotification("Appointment canceled successfully!", "success");
    } catch (error) {
      console.error("Error canceling appointment:", error);
      showNotification("Error canceling appointment. Please try again.", "error");
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
    const userVolunteer = appointment.volunteers?.find(v => v.username === username);
    const status = userVolunteer?.status || appointment.status;
    
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
      <div className={`tag ${getSessionTypeClass(appointment.sessionType)} ${getStatusClass(status)}`}>
        {appointment.sessionType}
      </div>
    );
  };

  return (
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
                <button onClick={() => { i18n.changeLanguage('en'); setShowLangOptions(false); }}>English</button>
                <button onClick={() => { i18n.changeLanguage('he'); setShowLangOptions(false); }}>עברית</button>
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
                    className={`appointment-card ${getSessionTypeClass(a.sessionType)}`} 
                    key={a.id} 
                    onClick={() => setSelected(a)}
                    style={{
                      borderLeftColor: getSessionTypeBorderColor(a.sessionType)
                    }}
                  >
                    <div className="appointment-left">
                      <div className="appointment-date">{formatDate(a.date)}</div>
                      <div className="appointment-day">{t(`appointments.days.${a.day}`)}</div>
                    </div>
                    <div className="appointment-middle">
                      <div className="info"><Clock3 size={16} /> {formatTime(a.time)}</div>
                      <div className="info"><MapPin size={16} /> {t("Category")}: {a.location}</div>
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
                  maxWidth: '28rem', // max-w-md equivalent
                  width: '100%',
                  borderRadius: '0.75rem', // rounded-xl
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // shadow-xl
                  backgroundColor: 'white',
                  padding: '1.5rem', // p-6
                  position: 'relative'
                }}
              >
                {/* Modal Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 
                    style={{
                      fontSize: '1.125rem', // text-lg
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
                        backgroundColor: getSessionTypeColor(selected.sessionType),
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
                      color: '#6b7280', // text-gray-500
                      fontSize: '0.875rem', // text-sm
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
                      <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 
                        selected.status === 'approved' ? '#d1fae5' : 
                        selected.status === 'pending' ? '#fef3c7' : 
                        selected.status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                        border: `1px solid ${
                          selected.status === 'approved' ? '#10b981' : 
                          selected.status === 'pending' ? '#f59e0b' : 
                          selected.status === 'rejected' ? '#ef4444' : '#d1d5db'
                        }`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            fontWeight: '500', 
                            color: selected.status === 'approved' ? '#065f46' : 
                                   selected.status === 'pending' ? '#92400e' : 
                                   selected.status === 'rejected' ? '#991b1b' : '#374151'
                          }}>
                            Status: {selected.status === 'approved' ? 'Approved ✅' : 
                                     selected.status === 'pending' ? 'Pending ⏳' : 
                                     selected.status === 'rejected' ? 'Rejected ❌' : selected.status}
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
  );
}