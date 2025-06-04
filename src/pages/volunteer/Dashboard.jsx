import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Award, Calendar, CheckCircle2, AlertCircle, ChevronRight, CalendarDays, Users, Activity, FileText, Star, Target, ArrowUpRight, ArrowDownRight, Hand, UserCheck, HeartHandshake, ThumbsUp, ShieldCheck, Globe, Zap, TrendingDown } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from '@/lib/firebase';
import LoadingScreen from "@/components/volunteer/InnerLS";
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
  const [userData, setUserData] = useState({
    name: 'Volunteer',
    totalHours: 0,
    totalSessions: 0,
    previousHours: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

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

  // Shuffle array helper function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch volunteer data
  const fetchVolunteerData = async () => {
    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      
      if (!userId) {
        return;
      }

      // Get volunteer document by userId
      const volunteersRef = collection(db, "volunteers");
      const q = query(volunteersRef, where("userId", "==", userId));
      const volunteerSnapshot = await getDocs(q);
      
      if (!volunteerSnapshot.empty) {
        const volunteerDoc = volunteerSnapshot.docs[0];
        const volunteerData = volunteerDoc.data();
                
        setUserData({
          name: username || volunteerData.fullName || 'Volunteer',
          totalHours: volunteerData.totalHours || 0,
          totalSessions: volunteerData.totalSessions || 0,
          previousHours: volunteerData.previousHours || 0,
          volunteerId: volunteerDoc.id
        });
      }
    } catch (error) {
      console.error("Error fetching volunteer data:", error);
    }
  };

  // Fetch upcoming sessions from calendar_slots - simplified
  const fetchUpcomingSessions = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const calendarSlotsRef = collection(db, "calendar_slots");
      const q = query(calendarSlotsRef);
      
      const snapshot = await getDocs(q);
      const sessions = [];


      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Check status first
        if (data.status === "inProgress") {
          
          // Check if volunteers array exists and current user is approved
          if (data.volunteers && Array.isArray(data.volunteers)) {
            
            const userVolunteer = data.volunteers.find(v => {
              return v.id === userId && v.status === "approved";
            });
            
            if (userVolunteer) {
              
              // Parse date string (format: "2025-6-5")
              let sessionDate;
              if (data.date) {
                try {
                  const [year, month, day] = data.date.split('-');
                  sessionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                } catch (error) {
                  sessionDate = new Date();
                }
              } else {
                sessionDate = new Date();
              }
              
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              sessionDate.setHours(0, 0, 0, 0);
              
              
              // Only show future sessions
              if (sessionDate >= now) {
                const startTime = data.startTime || "Time TBD";
                const endTime = data.endTime || "";
                const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;
                
                const session = {
                  id: doc.id,
                  title: data.customLabel || "Session",
                  date: sessionDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  }),
                  time: timeRange,
                  location: data.location || "Location TBD",
                  fullDate: sessionDate
                };
                
                sessions.push(session);
              }
            }
          }
        } 
      });

      // Sort by date and take first 3
      sessions.sort((a, b) => a.fullDate - b.fullDate);

      setUpcomingSessions(sessions.slice(0, 3));
    } catch (error) {
      console.error("Error fetching upcoming sessions:", error);
    }
  };

  // Fetch recent activity from attendance collection
  const fetchRecentActivity = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const attendanceRef = collection(db, "attendance");
      const q = query(attendanceRef, limit(5));
      
      const snapshot = await getDocs(q);
      const activities = [];

      // Check for level up first
      const currentLevel = getLevel(userData.totalHours);
      const previousLevel = getLevel(userData.previousHours);
      const hasLeveledUp = currentLevel.label !== previousLevel.label;

      if (hasLeveledUp) {
        activities.push({
          id: 'level-up',
          type: 'level-up',
          text: `🎉 Level up! You're now a ${currentLevel.label}!`,
          time: 'Recent',
          icon: Award,
          iconColor: 'dash-icon-gold'
        });
      }

      // Add the latest 5 attendance records
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        const status = data.status || "Unknown";
        const notes = data.notes || "";
        
        // Parse confirmedAt timestamp
        let timeAgo = "Recently";
        if (data.confirmedAt) {
          try {
            const confirmedDate = data.confirmedAt.toDate ? data.confirmedAt.toDate() : new Date(data.confirmedAt);
            const now = new Date();
            const diffTime = Math.abs(now - confirmedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) timeAgo = 'Today';
            else if (diffDays === 1) timeAgo = '1 day ago';
            else if (diffDays < 7) timeAgo = `${diffDays} days ago`;
            else if (diffDays < 14) timeAgo = '1 week ago';
            else timeAgo = `${Math.floor(diffDays / 7)} weeks ago`;
          } catch (error) {
            console.error("Error parsing confirmedAt:", error);
          }
        }

        // Create activity text based on status
        let activityText = "";
        let icon = Activity;
        let iconColor = "dash-icon-blue";

        if (status === "present") {
          activityText = `Marked as present${notes ? ` - ${notes}` : ''}`;
          icon = CheckCircle2;
          iconColor = "dash-icon-green";
        } else if (status === "late") {
          activityText = `Marked as late${notes ? ` - ${notes}` : ''}`;
          icon = Clock;
          iconColor = "dash-icon-amber";
        } else if (status === "absent") {
          activityText = `Marked as absent${notes ? ` - ${notes}` : ''}`;
          icon = AlertCircle;
          iconColor = "dash-icon-red";
        } else {
          activityText = `Attendance: ${status}${notes ? ` - ${notes}` : ''}`;
        }

        activities.push({
          id: doc.id,
          type: status,
          text: activityText,
          time: timeAgo,
          icon: icon,
          iconColor: iconColor
        });
      });

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      
      // Fallback activity data
      setRecentActivity([
        { id: 'fallback-1', type: 'present', text: 'Recent attendance activity', time: '2 days ago', icon: CheckCircle2, iconColor: 'dash-icon-green' }
      ]);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      // Shuffle colors
      const shuffledColors = shuffleArray(colorPresets).slice(0, 3);
      setCardColors(shuffledColors);
      
      // Fetch all data
      await fetchVolunteerData();
      await fetchUpcomingSessions();
      
      setLoading(false);
    };

    initializeData();
  }, []);

  // Fetch recent activity after userData is loaded
  useEffect(() => {
    if (userData.volunteerId || userData.totalHours > 0) {
      fetchRecentActivity();
    }
  }, [userData]);

  // Update progress bars when data changes
  useEffect(() => {
    if (userData.totalHours) {
      const value = Math.min(userData.totalHours, 100);
      setTimeout(() => setHoursProgress((value / 100) * 565.48), 200);
    }
    
    if (userData.totalSessions) {
      const maxSessions = 60;
      const value = Math.min(userData.totalSessions, maxSessions);
      setTimeout(() => setSessionsProgress((value / maxSessions) * 100), 400);
    }
  }, [userData.totalHours, userData.totalSessions]);

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

  const currentLevel = getLevel(userData.totalHours);

    if (loading) {
    return <LoadingScreen />;
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
                <span className="dash-sessions-number">{userData.totalSessions}</span>
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
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
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
                  ))
                ) : (
                  <div className="dash-upcoming-empty">
                    <p>No upcoming sessions</p>
                  </div>
                )}
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