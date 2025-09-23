import React, { useEffect, useState, useMemo, useRef } from "react";
import { Clock3, MapPin, Trash2, Globe, CalendarDays, CheckCircle2, Hourglass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LoadingScreen from "@/components/volunteer/InnerLS";
import "./styles/Appointments.css";
import { Layout } from '@/components/volunteer/Layout';

// Import proper Firestore hooks and types
import { useCalendarSlots } from "@/hooks/useFirestoreCalendar";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";

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
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentVolunteer, setCurrentVolunteer] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [dataLoaded, setDataLoaded] = useState({
    slots: false,
    volunteers: false
  });
  const [pageReady, setPageReady] = useState(false);
  const langToggleRef = useRef(null);

  // Use proper Firestore hooks
  const { slots, loading: slotsLoading } = useCalendarSlots();
  const { volunteers, loading: volunteersLoading } = useVolunteers();

  // Track data loading states
  useEffect(() => {
    setDataLoaded(prev => ({ ...prev, slots: !slotsLoading }));
  }, [slotsLoading]);

  useEffect(() => {
    setDataLoaded(prev => ({ ...prev, volunteers: !volunteersLoading }));
  }, [volunteersLoading]);

  // Check if all data is loaded
  useEffect(() => {
    const allDataLoaded = dataLoaded.slots && dataLoaded.volunteers;
    if (allDataLoaded) {
      setLoading(false);
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        setPageReady(true);
      }, 100);
    }
  }, [dataLoaded]);

  // Debug: Log when slots change
  useEffect(() => {
    console.log("Slots updated:", slots.map(s => ({ id: s.id, sessionCategory: s.sessionCategory, customLabel: s.customLabel })));
  }, [slots]);

  // Function to show notifications
  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    // Auto hide after 5 seconds
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

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

  // Helper function to determine the best category to display
  const getCategoryDisplay = (slot) => {
    if (slot?.customLabel) return slot.customLabel;
    if (slot?.sessionCategory) {
      return t(`appointments.sessionCategories.${slot.sessionCategory}`) || `${slot.sessionCategory.charAt(0).toUpperCase() + slot.sessionCategory.slice(1)} Session`;
    }
    return slot?.isCustom ? t('appointments.sessionCategories.custom') : t('appointments.sessionCategories.general');
  };

  // Function to get colors for session categories (matching manager calendar)
  const getSessionCategoryColors = (sessionCategory) => {
    switch (sessionCategory) {
      case 'music':
        return {
          bg: '#f3e8ff', // purple-100
          border: '#8b5cf6', // purple-500
          text: '#6b21a8' // purple-800
        };
      case 'gardening':
        return {
          bg: '#dcfce7', // green-100
          border: '#22c55e', // green-500
          text: '#166534' // green-800
        };
      case 'beading':
        return {
          bg: '#fce7f3', // pink-100
          border: '#ec4899', // pink-500
          text: '#be185d' // pink-800
        };
      case 'art':
        return {
          bg: '#fed7aa', // orange-100
          border: '#f97316', // orange-500
          text: '#c2410c' // orange-800
        };
      case 'baking':
        return {
          bg: '#fef3c7', // yellow-100
          border: '#eab308', // yellow-500
          text: '#a16207' // yellow-800
        };
      default:
        return {
          bg: '#f3f4f6', // gray-100
          border: '#6b7280', // gray-500
          text: '#374151' // gray-800
        };
    }
  };

  // Memoized appointments from volunteer's appointmentHistory
  const userAppointments = useMemo(() => {
    if (!currentVolunteer || !slots.length) {
      return [];
    }

    console.log("Current volunteer:", currentVolunteer);
    console.log("Volunteer appointmentHistory:", currentVolunteer.appointmentHistory);
    console.log("Slots:", slots);
    console.log("Slots with sessionCategory:", slots.map(s => ({ id: s.id, sessionCategory: s.sessionCategory, customLabel: s.customLabel })));

    // Get appointments from volunteer's appointmentHistory (confirmed appointments)
    const historyAppointments = (currentVolunteer.appointmentHistory || [])
      .map(appointmentEntry => {
        // Find the corresponding slot for additional details - try multiple lookup methods
        let slot = slots.find(s => s.id === appointmentEntry.appointmentId);
        if (!slot) {
          slot = slots.find(s => s.appointmentId === appointmentEntry.appointmentId);
        }
        if (!slot) {
          slot = slots.find(s => s.id === appointmentEntry.appointmentId);
        }

        console.log(`History appointment ${appointmentEntry.appointmentId}:`, {
          appointmentId: appointmentEntry.appointmentId,
          slotFound: !!slot,
          slotId: slot?.id,
          slotAppointmentId: slot?.appointmentId,
          sessionCategory: slot?.sessionCategory,
          customLabel: slot?.customLabel,
          categoryDisplay: getCategoryDisplay(slot),
          originalStatus: appointmentEntry.status,
          appointmentDate: appointmentEntry.date,
          isPast: new Date(appointmentEntry.date) < new Date()
        });

        // Determine the correct status based on appointment state and date
        const appointmentDate = new Date(appointmentEntry.date);
        const now = new Date();
        const isPast = appointmentDate < now;
        const actualStatus = appointmentEntry.status || "upcoming";
        
        // For history appointments, determine status based on actual state and date
        let displayStatus = actualStatus;
        
        // Handle different status scenarios
        if (isPast) {
          // For past appointments, override certain statuses
          if (actualStatus === "upcoming" || actualStatus === "inProgress") {
            // Past appointments that were upcoming or in progress should be completed
            displayStatus = "completed";
          } else if (actualStatus === "canceled") {
            displayStatus = "canceled";
          }
          // Keep other statuses as they are (completed, etc.)
        } else {
          // For future appointments, keep the actual status
          displayStatus = actualStatus;
        }

        console.log(`Status determination for ${appointmentEntry.appointmentId}:`, {
          originalStatus: actualStatus,
          isPast: isPast,
          finalStatus: displayStatus,
          appointmentDate: appointmentEntry.date
        });

        return {
          id: appointmentEntry.appointmentId,
          appointmentId: appointmentEntry.appointmentId,
          date: formatFirebaseDate(appointmentEntry.date),
          day: getDayFromDate(appointmentEntry.date),
          time: `${appointmentEntry.startTime} - ${appointmentEntry.endTime}`,
          location: getCategoryDisplay(slot),
          sessionType: getCategoryDisplay(slot),
          note: slot?.notes || "",
          category: slot?.isCustom ? "Custom" : "Regular",
          status: displayStatus,
          appointmentStatus: actualStatus,
          attendanceStatus: appointmentEntry.attendanceStatus,
          maxCapacity: slot?.maxCapacity || 1,
          volunteerRequests: slot?.volunteerRequests || [],
          isOpen: slot?.isOpen ?? true,
          residentIds: appointmentEntry.residentIds || [],
          rawData: {
            date: appointmentEntry.date,
            startTime: appointmentEntry.startTime,
            endTime: appointmentEntry.endTime,
            status: actualStatus,
            calendarSlotId: appointmentEntry.appointmentId
          }
        };
      });

    // Get slots with pending volunteer requests (not yet in appointmentHistory)
    const pendingRequestSlots = slots
      .filter(slot => {
        // Check if current volunteer has a request for this slot
        const hasVolunteerRequest = slot.volunteerRequests?.some(vr =>
          vr.volunteerId === currentVolunteer.id
        );

        // Only include if there's no corresponding appointment in history yet
        // Check multiple possible ID matches to prevent duplicates
        const hasAppointmentInHistory = currentVolunteer.appointmentHistory?.some(appointment =>
          appointment.appointmentId === slot.id ||
          appointment.appointmentId === slot.appointmentId ||
          (slot.appointmentId && appointment.appointmentId === slot.appointmentId)
        );

        return hasVolunteerRequest && !hasAppointmentInHistory;
      })
      .map(slot => {
        const volunteerRequest = slot.volunteerRequests?.find(vr =>
          vr.volunteerId === currentVolunteer.id
        );

        console.log(`Pending request slot ${slot.id}:`, {
          slotId: slot.id,
          appointmentId: slot.appointmentId,
          sessionCategory: slot.sessionCategory,
          customLabel: slot.customLabel,
          categoryDisplay: getCategoryDisplay(slot)
        });

        // For pending requests, use the volunteer request status
        const requestStatus = volunteerRequest?.status || "pending";
        
        return {
          id: slot.id, // Use slot ID for pending requests
          appointmentId: slot.appointmentId || slot.id,
          date: formatFirebaseDate(slot.date),
          day: getDayFromDate(slot.date),
          time: `${slot.startTime} - ${slot.endTime}`,
          location: getCategoryDisplay(slot),
          sessionType: getCategoryDisplay(slot),
          note: slot.notes || "",
          category: slot.isCustom ? "Custom" : "Regular",
          status: requestStatus,
          appointmentStatus: "pending",
          attendanceStatus: null,
          maxCapacity: slot.maxCapacity,
          volunteerRequests: slot.volunteerRequests || [],
          isOpen: slot.isOpen,
          residentIds: slot.residentIds || [],
          rawData: {
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: requestStatus,
            calendarSlotId: slot.id
          }
        };
      });

    // Combine both arrays and remove duplicates
    const allAppointments = [...historyAppointments, ...pendingRequestSlots]
      .filter(Boolean); // Remove null entries

    // Remove duplicates based on appointmentId and date/time
    const uniqueAppointments = allAppointments.reduce((acc, current) => {
      const existingIndex = acc.findIndex(appointment => 
        appointment.appointmentId === current.appointmentId &&
        appointment.rawData.date === current.rawData.date &&
        appointment.rawData.startTime === current.rawData.startTime
      );
      
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        console.log(`Duplicate appointment found: ${current.appointmentId} on ${current.rawData.date} at ${current.rawData.startTime}`);
        // If duplicate found, prefer the one from history (more complete data)
        if (currentVolunteer.appointmentHistory?.some(appointment =>
          appointment.appointmentId === current.appointmentId
        )) {
          console.log(`Replacing with history appointment for ${current.appointmentId}`);
          acc[existingIndex] = current;
        }
      }
      
      return acc;
    }, []);

    // Sort by date, then by time
    return uniqueAppointments.sort((a, b) => {
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
  }, [currentVolunteer, slots, t, i18n.language]);


  // Filter appointments by tab
  const tabAppointments = useMemo(() => {
    return userAppointments.filter((a) => {
      const dateObj = new Date(a.rawData.date);
      const now = new Date();

      if (tab === "upcoming") {
        // Only show appointments from appointmentHistory (confirmed appointments)
        // that are not completed and are in the future
        const isFromHistory = currentVolunteer.appointmentHistory?.some(appointment =>
          appointment.appointmentId === a.appointmentId
        );
        // Check for AppointmentStatus values
        const isNotCompleted = a.appointmentStatus !== "completed" && a.appointmentStatus !== "canceled";
        const isFuture = dateObj >= now;
        return isFromHistory && isNotCompleted && isFuture;
      }
      if (tab === "past") {
        // Show completed appointments from appointmentHistory
        const isFromHistory = currentVolunteer.appointmentHistory?.some(appointment =>
          appointment.appointmentId === a.appointmentId
        );
        // Check for AppointmentStatus values
        return isFromHistory && (a.appointmentStatus === "completed" || a.appointmentStatus === "canceled" || dateObj < now);
      }
      if (tab === "pending") {
        // Show appointments where volunteer request status is pending (VolunteerRequestStatus)
        return a.status === "pending";
      }
      return false;
    });
  }, [userAppointments, tab, currentVolunteer]);


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

        // Filter out the volunteer request
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


  return (
    <Layout>
      <div 
        className="profile-page"
        style={{
          opacity: pageReady ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        {/* Notification Toast */}
        {notification.show && (
          <div
            className={`notification-toast ${notification.type}`}
            style={{
              position: 'fixed',
              top: window.innerWidth <= 768 ? '4rem' : '20px',
              right: window.innerWidth <= 768 ? '0.5rem' : '20px',
              left: window.innerWidth <= 768 ? '0.5rem' : 'auto',
              zIndex: 9999,
              padding: window.innerWidth <= 768 ? '0.75rem 1rem' : '1rem 1.5rem',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              backgroundColor: notification.type === 'error' ? '#ef4444' :
                notification.type === 'success' ? '#10b981' : '#3b82f6',
              transform: 'translateX(0)',
              transition: 'all 0.3s ease',
              maxWidth: window.innerWidth <= 768 ? 'none' : '300px',
              width: window.innerWidth <= 768 ? 'auto' : 'auto',
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
              <div className="appointments-list" key={`appointments-${slots.length}-${slots.map(s => s.sessionCategory).join(',')}`}>
                {tabAppointments.length === 0 ? (
                  <div className="note">{t("appointments.noAppointments")}</div>
                ) : (
                  tabAppointments.map((a) => {
                    // Get the slot to determine session category - try multiple lookup methods
                    let slot = slots.find(s => s.id === a.rawData.calendarSlotId);
                    if (!slot) {
                      // Try finding by appointmentId
                      slot = slots.find(s => s.appointmentId === a.appointmentId);
                    }
                    if (!slot) {
                      // Try finding by id directly
                      slot = slots.find(s => s.id === a.appointmentId);
                    }
                    
                    const categoryColors = getSessionCategoryColors(slot?.sessionCategory);
                    
                    console.log(`Appointment ${a.id}:`, {
                      appointmentId: a.appointmentId,
                      calendarSlotId: a.rawData.calendarSlotId,
                      slotFound: !!slot,
                      slotId: slot?.id,
                      slotAppointmentId: slot?.appointmentId,
                      sessionCategory: slot?.sessionCategory,
                      customLabel: slot?.customLabel,
                      colors: categoryColors,
                      allSlotIds: slots.map(s => ({ id: s.id, appointmentId: s.appointmentId }))
                    });
                    
                    return (
                      <div
                        className="appointment-card session"
                        key={`${a.id}-${slot?.sessionCategory || 'default'}-${slot?.customLabel || 'default'}`}
                        onClick={() => setSelected(a)}
                        style={{
                          borderLeftColor: categoryColors.border,
                          backgroundColor: categoryColors.bg
                        }}
                      >
                        <div className="appointment-header">
                          <div className="appointment-date-section">
                            <div className="appointment-date">{formatDate(a.date)}</div>
                            <div className="appointment-day">{t(`appointments.days.${a.day}`)}</div>
                          </div>
                          {a.status === "pending" && (
                            <div className="appointment-actions">
                              <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); handleCancel(a.id); }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="appointment-content">
                          <div className="appointment-time">
                            <Clock3 size={16} />
                            <span>{formatTime(a.time)}</span>
                          </div>
                          <div className="appointment-category">
                            <MapPin size={16} />
                            <span>{a.location}</span>
                          </div>
                          {a.note && (
                            <div className="appointment-note">
                              <span>{a.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
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
                    borderRadius: '1rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    backgroundColor: 'white',
                    padding: '0',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Modal Header */}
                  <div className="modal-header">
                    <h2 className="modal-title">
                      {t("appointments.modal.title")}
                    </h2>
                    <div className="modal-date">
                      {formatDate(selected.date)} ({t(`appointments.days.${selected.day}`)})
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="modal-body">
                    <div className="modal-info-grid">
                      <div className="modal-info-item">
                        <div className="modal-info-label">
                          {t("appointments.modal.time")}:
                        </div>
                        <div className="modal-info-value time-badge">
                          {formatTime(selected.time)}
                        </div>
                      </div>

                      <div className="modal-info-item">
                        <div className="modal-info-label">
                          {t("appointments.modal.category")}:
                        </div>
                        <div className="modal-info-value category-badge">
                          {selected.location}
                        </div>
                      </div>

                      {selected.note && (
                        <div className="modal-info-item full-width">
                          <div className="modal-info-label">
                            {t("appointments.modal.note")}
                          </div>
                          <div className="modal-note">
                            {selected.note}
                          </div>
                        </div>
                      )}

                      {/* Show status if available */}
                      {selected.status && (
                        <div className="modal-info-item full-width">
                          <div className="modal-info-label">
                            {["pending", "approved", "rejected"].includes(selected.status)
                              ? t("appointments.requestStatusLabel")
                              : t("appointments.statusLabel")
                            }
                          </div>
                          <div className={`modal-status-badge status-${selected.status}`}>
                            {t(`appointments.status.${selected.status}`)}
                          </div>
                        </div>
                      )}

                      {/* Show attendance status if available */}
                      {selected.attendanceStatus && (
                        <div className="modal-info-item full-width">
                          <div className="modal-info-label">
                            {t("appointments.attendanceLabel")}
                          </div>
                          <div className={`modal-status-badge attendance-${selected.attendanceStatus}`}>
                            {t(`appointments.attendance.${selected.attendanceStatus}`)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="modal-footer">
                    <button
                      className="modal-close-btn"
                      onClick={() => setSelected(null)}
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
    </Layout>
  );
} 