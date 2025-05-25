import React, { useEffect, useState } from "react";
import {
  Clock3, MapPin, Search, Filter, Trash2, Globe, CalendarDays, CheckCircle2, Hourglass
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./styles/Appointments.css";

const initialAppointments = [
  {
    id: 1,
    date: "May 27",
    day: "Tue",
    time: "10:00 AM - 11:30 AM",
    location: "Room 102",
    note: "",
    category: "Reading",
    status: "Approved"
  },
  {
    id: 2,
    date: "May 17",
    day: "Sat",
    time: "2:00 PM - 3:30 PM",
    location: "Recreation Area",
    note: "Board games",
    category: "Games",
    status: "Pending"
  },
  {
    id: 3,
    date: "May 10",
    day: "Sat",
    time: "1:00 PM - 2:30 PM",
    location: "Music Room",
    note: "Played piano",
    category: "Music",
    status: "Completed"
  },
  {
    id: 4,
    date: "May 15",
    day: "Sat",
    time: "2:00 PM - 3:30 PM",
    location: "Recreation Area",
    note: "Board games",
    category: "Games",
    status: "Pending"
  }
];

export default function Appointments() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selected, setSelected] = useState(null);
  const [showLangOptions, setShowLangOptions] = useState(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === "he" ? "rtl" : "ltr";
  }, [i18n.language]);

  const now = new Date();

  const tabAppointments = appointments.filter((a) => {
    const dateObj = new Date("2025 " + a.date);
    if (tab === "upcoming") return a.status === "Approved" && dateObj >= now;
    if (tab === "past") return a.status === "Completed" && dateObj < now;
    if (tab === "pending") return a.status === "Pending";
    return false;
  });

  const availableCategories = [...new Set(tabAppointments.map((a) => a.category))];

  const filtered = tabAppointments.filter((a) => {
    const matchSearch =
      a.location.toLowerCase().includes(query.toLowerCase()) ||
      a.note.toLowerCase().includes(query.toLowerCase());
    const matchCategory = filter ? a.category === filter : true;
    return matchSearch && matchCategory;
  });

  const handleCancel = (id) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    if (selected && selected.id === id) setSelected(null);
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
    const [month, day] = dateStr.split(" ");
    return `${t(`appointments.months.${month}`)} ${day}`;
  };

  return (
    <div className="profile-page">
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
                      {t(`appointments.categories.${cat}`) || cat}
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
                  <div className="info"><MapPin size={16} /> {t("appointments.room")}: {a.location}</div>
                  {a.note && <div className="note">{t("appointments.note")}: {a.note}</div>}
                </div>
                <div className="appointment-right">
                  <div className={`tag ${a.category.toLowerCase()}`}>{t(`appointments.categories.${a.category}`) || a.category}</div>
                  {a.status === "Pending" && (
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
            <h2>{t("appointments.modal.title")}</h2>
            <p><strong>{t("appointments.modal.date")}:</strong> {formatDate(selected.date)} ({t(`appointments.days.${selected.day}`)})</p>
            <p><strong>{t("appointments.modal.time")}:</strong> {formatTime(selected.time)}</p>
            <p><strong>{t("appointments.modal.location")}:</strong> {t("appointments.room")}: {selected.location}</p>
            <p><strong>{t("appointments.modal.category")}:</strong> {t(`appointments.categories.${selected.category}`) || selected.category}</p>
            {selected.note && <p><strong>{t("appointments.modal.note")}:</strong> {selected.note}</p>}
            <button className="modal-close" onClick={() => setSelected(null)}>{t("appointments.modal.close")}</button>
          </div>
        </div>
      )}
    </div>
  );
}