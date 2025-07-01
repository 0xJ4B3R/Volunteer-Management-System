import { useEffect, useState } from "react";
import { Clock3, MapPin, Search, Trash2, Globe, CalendarDays, CheckCircle2, Hourglass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, doc, updateDoc, arrayRemove, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LoadingScreen from "@/components/volunteer/InnerLS";
import { Layout } from "@/components/volunteer/layout"
import "./styles/Appointments.css";

// Utility functions for session type colors
const getSessionTypeColor = (type) => {
  switch ((type || '').toLowerCase()) {
    case "art": return "bg-[#3b82f6] text-white";
    case "baking": return "bg-[#ec4899] text-white";
    case "music": return "bg-[#f59e0b] text-white";
    case "gardening": return "bg-[#6366f1] text-white";
    case "beading": return "bg-[#14b8a6] text-white";
    case "session": return "bg-[#6b7280] text-white";
    default: return "bg-[#6b7280] text-white";
  }
};

const getSessionTypeBorderColor = (type) => {
  switch ((type || '').toLowerCase()) {
    case "art": return "#2563eb";
    case "baking": return "#db2777";
    case "music": return "#d97706";
    case "gardening": return "#4f46e5";
    case "beading": return "#0d9488";
    case "session": return "#4b5563";
    default: return "#4b5563";
  }
};

const getSessionTypeClass = (type) => {
  return (type || '').toLowerCase().replace(/\s+/g, '');
};

export default function Appointments() {
  const { t, i18n } = useTranslation("appointments");
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Helper function to translate session types
  const translateSessionType = (sessionType) => {
    if (!sessionType) return t('sessionTypes.session', 'Session');

    // Handle common session type variations
    const type = sessionType.toLowerCase().trim();

    // Map variations to standard keys
    const typeMapping = {
      'general session': 'session',
      'volunteer session': 'session',
      'regular session': 'session',
      'default': 'session',
      'gardening': 'gardening',
      'arts and crafts': 'artsAndCrafts',
      'arts & crafts': 'artsAndCrafts',
      'music': 'music',
      'reading': 'reading',
      'games': 'games',
      'cooking': 'cooking',
      'exercise': 'exercise',
      'outdoor activities': 'outdoorActivities',
      'social hour': 'socialHour',
      'bingo': 'bingo',
      'crafts': 'crafts',
      'storytelling': 'storytelling',
      'meditation': 'meditation',
      'walking': 'walking',
      'puzzles': 'puzzles',
      'movie night': 'movieNight',
      'book club': 'bookClub',
      'painting': 'painting',
      'dancing': 'dancing',
      'art': 'art',
      'baking': 'baking',
      'beading': 'beading'
    };

    const mappedType = typeMapping[type] || type.replace(/\s+/g, '').replace(/[^a-zA-Z]/g, ''); // Clean up for translation key
    return t(`sessionTypes.${mappedType}`, sessionType); // Fallback to original if translation not found
  };

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

  // Get the username and volunteerId from localStorage
  useEffect(() => {
    // Try multiple storage locations and user object structures
    let storedUsername = localStorage.getItem('username');
    let storedUserId = localStorage.getItem('userId');
    let storedVolunteerId = localStorage.getItem('volunteerId');
    
    // If not found in localStorage, try sessionStorage
    if (!storedUsername) {
      storedUsername = sessionStorage.getItem('username');
    }
    
    if (!storedUserId) {
      storedUserId = sessionStorage.getItem('userId');
    }
    
    if (!storedVolunteerId) {
      storedVolunteerId = sessionStorage.getItem('volunteerId');
    }
    
    // Try to get from user object in localStorage/sessionStorage
    if (!storedUsername || !storedVolunteerId) {
      try {
        const userStr = localStorage.getItem('user') || sessionStorage.getUser('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          storedUsername = storedUsername || user.username || user.email || user.name;
          storedUserId = storedUserId || user.id || user.uid || user.userId;
          storedVolunteerId = storedVolunteerId || user.volunteerId;
        }
      } catch (error) {
        // Error parsing user object
      }
    }
    
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch appointments from Firebase calendar_slots collection
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userId) {
        return;
      }

      try {
        setLoading(true);
        
        // Get all calendar slots
        const calendarRef = collection(db, "calendar_slots");
        const snapshot = await getDocs(calendarRef);

        let appointmentsData = [];

        // Go through all calendar slots and find ones where this user has volunteer requests
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const volunteerRequests = data.volunteerRequests || [];
          
          // Find if this user has a volunteer request in this slot
          const userRequest = volunteerRequests.find(req => req.userId === userId);
          
          if (userRequest) {
            // Create appointment object from calendar slot data
            const appointment = {
              id: doc.id,
              appointmentId: doc.id,
              date: formatFirebaseDate(data.date?.toDate ? data.date.toDate() : data.date),
              day: getDayFromDate(data.date?.toDate ? data.date.toDate() : data.date),
              time: `${data.startTime || "N/A"} - ${data.endTime || "N/A"}`,
              location: translateSessionType(data.sessionCategory || data.customLabel || "Session"),
              sessionType: data.sessionCategory || data.customLabel || "Session",
              note: data.notes || "",
              category: data.isCustom ? "Custom" : "Regular",
              status: userRequest.status, // Use the status from volunteer request
              maxCapacity: data.maxCapacity || 1,
              volunteers: data.volunteers || [],
              volunteerRequests: volunteerRequests,
              isOpen: data.isOpen,
              residentIds: data.residentIds || [],
              rawData: {
                ...data,
                date: data.date?.toDate ? data.date.toDate() : data.date,
                userRequestStatus: userRequest.status
              }
            };
            
            appointmentsData.push(appointment);
          }
        });

        // Sort by date (newest first) and limit to latest 30
        appointmentsData = appointmentsData
          .sort((a, b) => new Date(b.rawData.date) - new Date(a.rawData.date))
          .slice(0, 30);

        setAppointments(appointmentsData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userId]);

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
    if (tab === "upcoming") {
      return a.status === "approved"; // Show approved status appointments as upcoming
    }
    if (tab === "past") {
      return a.status === "completed" || a.status === "rejected"; // Show completed or rejected appointments in past
    }
    if (tab === "pending") {
      return a.status === "pending"; // Show pending status appointments
    }
    return false;
  });

  const filtered = tabAppointments
    .filter((a) => {
      const matchSearch =
        (a.location?.toLowerCase().includes(query.toLowerCase()) || false) ||
        (a.note?.toLowerCase().includes(query.toLowerCase()) || false);
      return matchSearch;
    })
    .sort((a, b) => {
      if (tab === "past") {
        return new Date(b.rawData.date) - new Date(a.rawData.date); // Latest to oldest
      }
      return new Date(a.rawData.date) - new Date(b.rawData.date); // Soonest to latest for other tabs
    });

  const handleCancel = async (id) => {
    try {
      // Find the appointment to get the volunteer request data
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) return;

      // Find the user's volunteer request to remove
      const userRequest = appointment.volunteerRequests.find(req => req.userId === userId);

      if (userRequest) {
        // Update Firestore: Remove the user's volunteer request from the calendar slot
        const slotRef = doc(db, "calendar_slots", id);
        await updateDoc(slotRef, {
          volunteerRequests: arrayRemove(userRequest)
        });

        // Update local state
        setAppointments(prev => prev.filter(a => a.id !== id));

        if (selected && selected.id === id) setSelected(null);

        // Show success notification
        showNotification("Appointment canceled successfully!", "success");
      } else {
        showNotification("Appointment not found or unable to cancel.", "error");
      }
    } catch (error) {
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
      <div className={`tag ${getSessionTypeClass(appointment.sessionType)} ${getStatusClass(status)}`}>
        {translateSessionType(appointment.sessionType)}
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
                        {translateSessionType(selected.sessionType)}
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
                        <div
                          style={{
                            marginTop: "1rem",
                            padding: "0.75rem",
                            borderRadius: "0.5rem",
                            backgroundColor:
                              selected.status === "approved" ? "#d1fae5" :
                                selected.status === "pending" ? "#fef3c7" :
                                  selected.status === "completed" ? "#e0e7ff" :
                                    selected.status === "rejected" ? "#fee2e2" : "#f3f4f6",
                            border: `1px solid ${selected.status === "approved" ? "#10b981" :
                              selected.status === "pending" ? "#f59e0b" :
                                selected.status === "completed" ? "#6366f1" :
                                  selected.status === "rejected" ? "#ef4444" : "#d1d5db"
                              }`
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{
                              fontWeight: 500,
                              color:
                                selected.status === "approved" ? "#065f46" :
                                  selected.status === "pending" ? "#92400e" :
                                    selected.status === "completed" ? "#3730a3" :
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