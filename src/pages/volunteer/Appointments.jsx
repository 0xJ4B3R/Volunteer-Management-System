import React, { useEffect, useState } from "react";
import { Clock3, MapPin, Search, Filter, Trash2, Globe, CalendarDays, CheckCircle2, Hourglass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, doc, updateDoc, arrayRemove, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LoadingScreen from "@/components/volunteer/InnerLS";
import "./styles/Appointments.css";

export default function Appointments() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [userId, setUserId] = useState(""); 
  const [username, setUsername] = useState("");

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
          
          // Format the appointment data
          return {
            id: doc.id,
            appointmentId: data.appointmentId,
            date: formatFirebaseDate(data.date),
            day: getDayFromDate(data.date),
            time: `${data.startTime} - ${data.endTime}`,
            location: data.customLabel || "Session", // Default to "Session" if customLabel is null
            note: data.notes || "",
            category: data.isCustom ? "Custom" : "Regular",
            status: userVolunteer ? userVolunteer.status : (data.isOpen ? "Open" : "Closed"),
            maxCapacity: data.maxCapacity,
            volunteers: data.volunteers || [],
            isOpen: data.isOpen,
            residentIds: data.residentIds || [],
            rawData: data // Keep the raw data for reference
          };
        });
        
        setAppointments(appointmentsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [username]); // Depend on username instead of userId

  // Helper function to format Firebase date string to "May 27" format
  const formatFirebaseDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Helper function to get day of week from date string
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

  // Get unique categories for filtering
  const availableCategories = [...new Set(tabAppointments.map((a) => a.location))];

  const filtered = tabAppointments.filter((a) => {
    const matchSearch =
      (a.location?.toLowerCase().includes(query.toLowerCase()) || false) ||
      (a.note?.toLowerCase().includes(query.toLowerCase()) || false);
    const matchCategory = filter ? a.location === filter : true;
    return matchSearch && matchCategory;
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
        await updateDoc(appointmentRef, {
          volunteers: arrayRemove(volunteerToRemove)
        });
        
        // Update local state
        setAppointments(prev => prev.map(a => {
          if (a.id === id) {
            return {
              ...a,
              volunteers: a.volunteers.filter(v => v.username !== username),
              status: "Open" // Reset status for this user's view
            };
          }
          return a;
        }));
      }
      
      if (selected && selected.id === id) setSelected(null);
    } catch (error) {
      console.error("Error canceling appointment:", error);
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
    <div className="profile-page">
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
              {availableCategories.length > 0 && (
                <div className="filter-group">
                  <button className="filter-button" onClick={() => setShowFilter(!showFilter)}>
                    <Filter size={16} /> {t("appointments.filter")}
                  </button>
                  {showFilter && (
                    <div className="filter-options">
                      {availableCategories.map((cat) => (
                        <button key={cat} className={`filter-option ${filter === cat ? "selected" : ""}`} onClick={() => setFilter((prev) => (prev === cat ? "" : cat))}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="appointments-list">
              {filtered.length === 0 ? (
                <div className="note">{t("appointments.noAppointments")}</div>
              ) : (
                filtered.map((a) => (
                  <div className="appointment-card" key={a.id} onClick={() => setSelected(a)}>
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
            <div className="modal" onClick={() => setSelected(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h1>{t("appointments.modal.title")}</h1>
                <p><strong>{t("appointments.modal.date")}:</strong> {formatDate(selected.date)} ({t(`appointments.days.${selected.day}`)})</p>
                <p><strong>{t("appointments.modal.time")}:</strong> {formatTime(selected.time)}</p>
                <p><strong>{t("appointments.modal.category")}:</strong> {selected.location}</p>
                {selected.note && <p><strong>{t("appointments.modal.note")}:</strong> {selected.note}</p>}
                <button className="modal-close" onClick={() => setSelected(null)}>
                  {t("appointments.modal.close")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}