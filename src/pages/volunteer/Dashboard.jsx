import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { Clock, CalendarClock, CheckCircle, Calendar, MapPin, UserCircle, Globe } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, setDoc, doc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import './styles/Dashboard.css';

function VolunteerDashboard() {
  const [volunteerData, setVolunteerData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLangOptions, setShowLangOptions] = useState(false);

  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const userObject = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const userId = userObject?.uid || userObject?.id;
  const username = userObject?.username;

  useEffect(() => {
    const fetchVolunteerData = async () => {
      try {
        let volunteerSnap = null;
        if (userId) {
          const q = query(collection(db, 'volunteers'), where('userId', '==', userId));
          const snap = await getDocs(q);
          if (!snap.empty) volunteerSnap = snap.docs[0];
        }
        if (!volunteerSnap && username) {
          const q2 = query(collection(db, 'volunteers'), where('username', '==', username));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) volunteerSnap = snap2.docs[0];
        }
        if (!volunteerSnap && userId) {
          const newVolunteer = {
            userId,
            username: username || `user_${userId.slice(0, 6)}`,
            fullName: userObject?.displayName || t('volunteer'),
            avatar: null,
            birthDate: null,
            skills: [],
            totalHoursVolunteered: 0,
            createdAt: new Date().toISOString(),
            appointmentsAttended: 0
          };
          await setDoc(doc(db, 'volunteers', userId), newVolunteer);
          setVolunteerData({ ...newVolunteer, id: userId });
        } else if (volunteerSnap) {
          setVolunteerData({ ...volunteerSnap.data(), id: volunteerSnap.id });
        } else {
          setError(t('error_loading_profile'));
        }
      } catch (err) {
        setError(`${t('error_loading_profile')} ${err.message}`);
      }
      setLoading(false);
    };

    fetchVolunteerData();
  }, [userId, username, userObject, t]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!volunteerData?.id) return;
      try {
        const q = query(
          collection(db, 'appointments'),
          where('volunteerIds', 'array-contains', volunteerData.id),
          orderBy('date', 'asc'),
          limit(5)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(data);
      } catch (err) {}
    };
    fetchAppointments();
  }, [volunteerData]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language === 'he' ? 'he-IL' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    let hours, minutes;
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      hours = date.getHours();
      minutes = date.getMinutes();
    } else {
      [hours, minutes] = timeString.split(':').map(Number);
    }
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${period}`;
  };

  const stats = volunteerData ? [
    {
      label: t('hours_volunteered'),
      value: volunteerData.totalHoursVolunteered || 0,
      icon: Clock,
      color: "bg-blue-50",
      border: "border-blue-200"
    },
    {
      label: t('upcoming_appointments'),
      value: appointments.length || 0,
      icon: CalendarClock,
      color: "bg-green-50",
      border: "border-green-200"
    },
    {
      label: t('appointments_attended'),
      value: volunteerData.appointmentsAttended || 0,
      icon: CheckCircle,
      color: "bg-purple-50",
      border: "border-purple-200"
    }
  ] : [];

  if (loading) {
    return <div className="dashboard-loading">{t('loading')}</div>;
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>{t('error')}</h2>
        <p>{error}</p>
        <div className="text-sm mt-4 p-4 bg-gray-100 rounded">
          <p><strong>{t('troubleshooting')}:</strong></p>
          <ul className="list-disc pl-5 mt-2">
            <li>{t('check_rules')}</li>
            <li>{t('check_login')}</li>
            <li>{t('check_collection')}</li>
          </ul>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="dashboard-retry-button mt-4"
        >
          {t('try_again')}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="language-toggle">
        <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
          <Globe size={35} />
        </button>
        {showLangOptions && (
          <div className="lang-options">
            <button onClick={() => { i18n.changeLanguage('en'); setShowLangOptions(false); }}>
              {t('english')}
            </button>
            <button onClick={() => { i18n.changeLanguage('he'); setShowLangOptions(false); }}>
              {t('hebrew')}
            </button>
          </div>
        )}
      </div>

      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-welcome-text">
            {t('welcome')}, {volunteerData?.fullName || t('volunteer')}!
          </h1>
          <p className="dashboard-thankyou-text">{t('thank_you')}</p>
        </div>
        {volunteerData?.avatar && (
          <img
            src={volunteerData.avatar}
            alt="Volunteer"
            className="dashboard-avatar"
          />
        )}
      </div>

      <div className="dashboard-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`dashboard-stat-card ${stat.color} ${stat.border} flex items-center gap-4 p-4 rounded-lg shadow-sm`}
            >
              {Icon && <Icon className="w-6 h-6 text-gray-600" />}
              <div>
                <div className="dashboard-stat-label font-medium">{stat.label}</div>
                <div className="dashboard-stat-value text-xl font-bold">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-appointments">
        <div className="appointments-header">
          <h2 className="appointments-title">{t('upcoming_appointments')}</h2>
          {appointments.length > 0 && (
            <button className="view-all-button">
              {t('view_all')}
            </button>
          )}
        </div>

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="no-appointments-text">{t('no_appointments')}</p>
            <Link to="./calendar">
              <button className="browse-calendar-button">
                {t('browse_calendar')}
              </button>
            </Link>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-date-container">
                  <div className="appointment-date">
                    {formatDate(appointment.date)}
                  </div>
                  <div className="appointment-time">
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </div>
                </div>
                <div className="appointment-details">
                  <h3 className="appointment-title">{appointment.title || t('volunteer_session')}</h3>
                  {appointment.location && (
                    <div className="appointment-location">
                      <MapPin className="w-4 h-4" />
                      <span>{appointment.location}</span>
                    </div>
                  )}
                  {appointment.supervisor && (
                    <div className="appointment-supervisor">
                      <UserCircle className="w-4 h-4" />
                      <span>{t('supervisor')}: {appointment.supervisor}</span>
                    </div>
                  )}
                </div>
                <div className="appointment-actions">
                  <button className="appointment-details-button">
                    {t('details')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {volunteerData?.skills && volunteerData.skills.length > 0 && (
        <div className="dashboard-skills">
          <h3 className="skills-heading">{t('my_skills')}</h3>
          <ul className="skills-list">
            {volunteerData.skills.map((skill, index) => (
              <li key={index} className="skill-item">
                {t(`skills.${skill}`, skill)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VolunteerDashboard;
