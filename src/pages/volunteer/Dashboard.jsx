import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Award, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  CalendarDays,
  Users,
  Activity,
  FileText,
  Star,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Hand,
  UserCheck,
  HeartHandshake,
  ThumbsUp,
  ShieldCheck,
  Globe,
  Zap,
  TrendingDown
} from 'lucide-react';
import './styles/Dashboard.css';

// Custom Marijuana Icon component
const MarijuanaIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c-.5 0-1 .2-1.4.6L8.8 4.4c-.8.8-2 .8-2.8 0L4.2 2.6C3.8 2.2 3.3 2 2.8 2s-1 .2-1.4.6c-.8.8-.8 2 0 2.8L3.2 7.2c.8.8.8 2 0 2.8L1.4 11.8c-.8.8-.8 2 0 2.8.4.4.9.6 1.4.6s1-.2 1.4-.6L5.8 12.8c.8-.8 2-.8 2.8 0L10.4 14.6c.4.4.9.6 1.4.6s1-.2 1.4-.6L15 12.8c.8-.8 2-.8 2.8 0l1.8 1.8c.4.4.9.6 1.4.6s1-.2 1.4-.6c.8-.8.8-2 0-2.8L20.6 10c-.8-.8-.8-2 0-2.8l1.8-1.8c.8-.8.8-2 0-2.8C22 2.2 21.5 2 21 2s-1 .2-1.4.6L17.8 4.4c-.8.8-2 .8-2.8 0L13.2 2.6C12.8 2.2 12.3 2 12 2z"/>
  </svg>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoursProgress, setHoursProgress] = useState(0);
  const [sessionsProgress, setSessionsProgress] = useState(0);
  const [cardColors, setCardColors] = useState([]);

  const userData = {
    name: 'John',
    totalHours: 420,
    hoursChange: 12.5,
    attendanceRate: 92.3,
    attendanceChange: 2.1,
    sessionsCompleted: 48,
    sessionsChange: 3,
    currentStreak: 12,
    streakChange: 2,
    volunteerStatus: 'active',
    nextSession: '2025-05-24',
    lastSession: '2025-05-22',
    memberSince: '2024-01-15',
    currentRank: 'Gold Volunteer',
    pointsToNextRank: 150,
    previousHours: 59 // Previous hours to check for level advancement
  };

  // Preset color combinations for cards
  const colorPresets = [
    { primary: '#3b82f6', secondary: '#1d4ed8', bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' },
    { primary: '#8b5cf6', secondary: '#7c3aed', bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' },
    { primary: '#10b981', secondary: '#059669', bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' },
    { primary: '#f59e0b', secondary: '#d97706', bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' },
    { primary: '#ef4444', secondary: '#dc2626', bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' },
    { primary: '#06b6d4', secondary: '#0891b2', bg: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)' },
    { primary: '#84cc16', secondary: '#65a30d', bg: 'linear-gradient(135deg, #ecfccb 0%, #d9f99d 100%)' },
    { primary: '#f97316', secondary: '#ea580c', bg: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)' }
  ];

  const getLevel = (hours) => {
    if (hours >= 0 && hours < 10)
      return { label: "Beginner", icon: <Star size={36} />, nextLevel: "Helper", hoursToNext: 10 - hours };
    if (hours >= 10 && hours < 30)
      return { label: "Helper", icon: <Hand size={36} />, nextLevel: "Contributor", hoursToNext: 30 - hours };
    if (hours >= 30 && hours < 60)
      return { label: "Contributor", icon: <UserCheck size={36} />, nextLevel: "Supporter", hoursToNext: 60 - hours };
    if (hours >= 60 && hours < 100)
      return { label: "Supporter", icon: <HeartHandshake size={36} />, nextLevel: "Advocate", hoursToNext: 100 - hours };
    if (hours >= 100 && hours < 150)
      return { label: "Advocate", icon: <ThumbsUp size={36} />, nextLevel: "Champion", hoursToNext: 150 - hours };
    if (hours >= 150 && hours < 200)
      return { label: "Champion", icon: <ShieldCheck size={36} />, nextLevel: "Humanitarian", hoursToNext: 200 - hours };
    if (hours >= 200 && hours < 420)
      return { label: "Humanitarian", icon: <Globe size={36} />, nextLevel: "Lord of the deeds", hoursToNext: 420 - hours };
    return { label: "Lord of the deeds", icon: <MarijuanaIcon />, nextLevel: null, hoursToNext: 0 };
  };

  const currentLevel = getLevel(userData.totalHours);
  const previousLevel = getLevel(userData.previousHours);

  // Check if user reached a new level
  const hasLeveledUp = currentLevel.label !== previousLevel.label;

  // Shuffle array helper function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    // Shuffle colors on component mount
    const shuffledColors = shuffleArray(colorPresets).slice(0, 3);
    setCardColors(shuffledColors);

    if (userData.totalHours) {
      const value = Math.min(userData.totalHours, 100);
      setTimeout(() => setHoursProgress((value / 100) * 565.48), 200);
    }
    
    if (userData.sessionsCompleted) {
      const maxSessions = 60; // Assuming 60 is the max for visual purposes
      const value = Math.min(userData.sessionsCompleted, maxSessions);
      setTimeout(() => setSessionsProgress((value / maxSessions) * 100), 400);
    }
  }, [userData.totalHours, userData.sessionsCompleted]);

  const baseRecentActivity = [
    { id: 2, type: 'signup', text: 'Signed up for Community Garden', time: '1 day ago', icon: Calendar, iconColor: 'dash-icon-blue' },
    { id: 3, type: 'achievement', text: 'Earned "Dedicated Helper" badge', time: '3 days ago', icon: Award, iconColor: 'dash-icon-amber' },
    { id: 4, type: 'cancel', text: 'Cancelled Beach Cleanup session', time: '5 days ago', icon: AlertCircle, iconColor: 'dash-icon-red' },
    { id: 5, type: 'rating', text: 'Received 5-star rating from coordinator', time: '1 week ago', icon: Star, iconColor: 'dash-icon-amber' },
    { id: 6, type: 'attendance', text: 'Completed Park Maintenance', time: '2 weeks ago', icon: CheckCircle2, iconColor: 'dash-icon-green' }
  ];

  // Create recent activity with level up notification if applicable
  const recentActivity = hasLeveledUp 
    ? [
        { id: 1, type: 'level-up', text: `Level up! You're now a ${currentLevel.label}`, time: '2 hours ago', icon: Award, iconColor: 'dash-icon-gold' },
        { id: 7, type: 'attendance', text: 'Attended Food Bank Distribution', time: '2 hours ago', icon: CheckCircle2, iconColor: 'dash-icon-green' },
        ...baseRecentActivity.slice(0, 3)
      ]
    : [
        { id: 7, type: 'attendance', text: 'Attended Food Bank Distribution', time: '2 hours ago', icon: CheckCircle2, iconColor: 'dash-icon-green' },
        ...baseRecentActivity.slice(0, 4)
      ];

  const upcomingSessions = [
    { id: 1, title: 'Senior Care Visit', date: 'Tomorrow', time: '2:00 PM - 4:00 PM', location: 'Sunset Home' },
    { id: 2, title: 'Library Reading Program', date: 'May 26', time: '10:00 AM - 12:00 PM', location: 'City Library' },
    { id: 3, title: 'Park Cleanup', date: 'May 28', time: '8:00 AM - 11:00 AM', location: 'Central Park' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: 'dash-badge-active', text: 'Active' },
      inactive: { class: 'dash-badge-inactive', text: 'Inactive' },
      pending: { class: 'dash-badge-pending', text: 'Pending' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="dash-dashboard-container">
        <div className="dash-dashboard-wrapper">
          <div className="dash-dashboard-header">
            <div className="dash-loading-skeleton" style={{ width: '200px', height: '2rem' }}></div>
            <div className="dash-loading-skeleton" style={{ width: '300px' }}></div>
          </div>
          <div className="dash-stats-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="dash-stat-card">
                <div className="dash-loading-skeleton" style={{ height: '3rem' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-dashboard-container">
      <div className="dash-dashboard-wrapper">
        <div className="dash-dashboard-header">
          <div className="dash-dashboard-header-top">
            <h1 className="dash-dashboard-title">Dashboard</h1>
          </div>
          <p className="dash-dashboard-greeting">{getGreeting()}, {userData.name}! 👋</p>
        </div>

        <div className="dash-stats-row">
          <div 
            className="dash-stat-widget dash-hours-widget" 
            style={{ background: cardColors[0]?.bg }}
          >
            <div className="dash-widget-header">
              <p className="dash-widget-label">Total Hours</p>
              <div 
                className="dash-widget-icon-wrapper"
                style={{ 
                  background: `linear-gradient(135deg, ${cardColors[0]?.primary}, ${cardColors[0]?.secondary})` 
                }}
              >
                <Clock className="dash-widget-icon" />
              </div>
            </div>
            <div className="dash-hours-progress-container dash-hours-progress-large">
              <svg className="dash-circle-progress dash-circle-progress-large" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={cardColors[0]?.primary || '#3b82f6'} />
                    <stop offset="100%" stopColor={cardColors[0]?.secondary || '#8b5cf6'} />
                  </linearGradient>
                </defs>
                <circle className="dash-circle-bg" cx="100" cy="100" r="90" strokeWidth="12" />
                <circle className="dash-circle-value" cx="100" cy="100" r="90" strokeWidth="12"
                  strokeDasharray="565.48" strokeDashoffset={565.48 - hoursProgress} />
              </svg>
              <div className="dash-hours-display">
                <span className="dash-hours-number dash-hours-number-large">{userData.totalHours}</span>
                <span className="dash-hours-label">Hours</span>
              </div>
            </div>
          </div>

          <div 
            className="dash-stat-widget dash-sessions-widget"
            style={{ background: cardColors[1]?.bg }}
          >
            <div className="dash-widget-header">
              <p className="dash-widget-label">Sessions Completed</p>
              <div 
                className="dash-widget-icon-wrapper dash-icon-purple"
                style={{ 
                  background: `linear-gradient(135deg, ${cardColors[1]?.primary}, ${cardColors[1]?.secondary})` 
                }}
              >
                <CheckCircle2 className="dash-widget-icon" />
              </div>
            </div>
            <div className="dash-sessions-content">
              <div className="dash-sessions-display">
                <span className="dash-sessions-number">{userData.sessionsCompleted}</span>
              </div>
              <div className="dash-sessions-progress">
                <div className="dash-sessions-progress-bar">
                  <div 
                    className="dash-sessions-progress-fill"
                    style={{ 
                      width: `${sessionsProgress}%`,
                      background: `linear-gradient(90deg, ${cardColors[1]?.primary}, ${cardColors[1]?.secondary})`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div 
            className="dash-stat-widget dash-level-widget"
            style={{ background: cardColors[2]?.bg }}
          >
            <div className="dash-widget-header">
              <p className="dash-widget-label">Current Level</p>
              <div 
                className="dash-widget-icon-wrapper dash-icon-amber"
                style={{ 
                  background: `linear-gradient(135deg, ${cardColors[2]?.primary}, ${cardColors[2]?.secondary})` 
                }}
              >
                <Award className="dash-widget-icon" />
              </div>
            </div>
            <div className="dash-level-content">
              <div className="dash-level-badge">
                <div 
                  className="dash-level-icon"
                  style={{ 
                    background: `linear-gradient(135deg, ${cardColors[2]?.bg})`,
                    borderColor: cardColors[2]?.primary,
                    color: cardColors[2]?.primary
                  }}
                >
                  {currentLevel.icon}
                </div>
                <span className="dash-level-name">{currentLevel.label}</span>
                {currentLevel.nextLevel && (
                  <div className="dash-next-level-mini">
                    <span className="dash-next-level-mini-text">
                      Next: {currentLevel.nextLevel}
                    </span>
                    <span className="dash-next-level-mini-hours">
                      {currentLevel.hoursToNext} hours to go
                    </span>
                    <div className="dash-next-level-mini-progress">
                      <div className="dash-next-level-mini-progress-bar">
                        <div 
                          className="dash-next-level-mini-progress-fill"
                          style={{ 
                            width: `${Math.min(((userData.totalHours % 100) / (currentLevel.hoursToNext + (userData.totalHours % 100))) * 100, 100)}%`,
                            background: cardColors[2]?.primary
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dash-main-content-grid">
          <div className="dash-activity-card">
            <div className="dash-activity-header">
              <h2 className="dash-activity-title">Recent Activity</h2>
            </div>
            <ul className="dash-activity-list">
              {recentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <li key={activity.id} className="dash-activity-item">
                    <div className="dash-activity-content">
                      <div className={`dash-activity-icon-wrapper ${activity.iconColor}`}>
                        <IconComponent className="dash-activity-icon" />
                      </div>
                      <div className="dash-activity-details">
                        <p className="dash-activity-text">{activity.text}</p>
                        <p className="dash-activity-time">{activity.time}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <div className="dash-upcoming-card">
              <div className="dash-upcoming-header">
                <h2 className="dash-upcoming-title">Upcoming Sessions</h2>
                <a href="/volunteer/appointments" className="dash-view-all-link">
                  View all <ChevronRight style={{ width: '1rem', height: '1rem', display: 'inline' }} />
                </a>
              </div>
              <div className="dash-upcoming-list">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="dash-upcoming-item">
                    <div className="dash-upcoming-item-header">
                      <h3 className="dash-upcoming-item-title">{session.title}</h3>
                      <span className="dash-upcoming-item-date">{session.date}</span>
                    </div>
                    <div className="dash-upcoming-item-details">
                      <div className="dash-upcoming-detail">
                        <Clock className="dash-upcoming-detail-icon" />
                        <span>{session.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Check-in Button */}
            <div className="dash-checkin-card">
              <a href="/volunteer/attendance" className="dash-checkin-button">
                <div className="dash-checkin-content">
                  <div className="dash-checkin-icon-wrapper">
                    <CheckCircle2 className="dash-checkin-icon" />
                  </div>
                  <div className="dash-checkin-text">
                    <span className="dash-checkin-title">Check In</span>
                    <span className="dash-checkin-subtitle">Mark your attendance</span>
                  </div>
                  <ChevronRight className="dash-checkin-arrow" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;