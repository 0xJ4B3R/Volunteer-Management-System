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
  ArrowDownRight
} from 'lucide-react';
import './styles/Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoursProgress, setHoursProgress] = useState(0);

  // Mock user data
  const userData = {
    name: 'John',
    totalHours: 156.5,
    hoursChange: 12.5,
    attendanceRate: 92.3,
    attendanceChange: 2.1,
    sessionsCompleted: 48,
    sessionsChange: 3,
    currentStreak: 12,
    streakChange: 2,
    volunteerStatus: 'active', // active, inactive, pending
    nextSession: '2025-05-24',
    lastSession: '2025-05-22',
    memberSince: '2024-01-15',
    currentRank: 'Gold Volunteer',
    pointsToNextRank: 150
  };

  // Initialize and update progress for hours circle
  useEffect(() => {
    if (userData.totalHours) {
      const value = Math.min(userData.totalHours, 100);
      setTimeout(() => setHoursProgress((value / 100) * 565.48), 200);
    }
  }, [userData.totalHours]);

  // Mock recent activity
  const recentActivity = [
    {
      id: 1,
      type: 'attendance',
      text: 'Attended Food Bank Distribution',
      time: '2 hours ago',
      icon: CheckCircle2,
      iconColor: 'icon-green'
    },
    {
      id: 2,
      type: 'signup',
      text: 'Signed up for Community Garden',
      time: '1 day ago',
      icon: Calendar,
      iconColor: 'icon-blue'
    },
    {
      id: 3,
      type: 'achievement',
      text: 'Earned "Dedicated Helper" badge',
      time: '3 days ago',
      icon: Award,
      iconColor: 'icon-amber'
    },
    {
      id: 4,
      type: 'cancel',
      text: 'Cancelled Beach Cleanup session',
      time: '5 days ago',
      icon: AlertCircle,
      iconColor: 'icon-red'
    },
    {
      id: 5,
      type: 'rating',
      text: 'Received 5-star rating from coordinator',
      time: '1 week ago',
      icon: Star,
      iconColor: 'icon-amber'
    }
  ];

  // Mock upcoming sessions
  const upcomingSessions = [
    {
      id: 1,
      title: 'Senior Care Visit',
      date: 'Tomorrow',
      time: '2:00 PM - 4:00 PM',
      location: 'Sunset Home'
    },
    {
      id: 2,
      title: 'Library Reading Program',
      date: 'May 26',
      time: '10:00 AM - 12:00 PM',
      location: 'City Library'
    },
    {
      id: 3,
      title: 'Park Cleanup',
      date: 'May 28',
      time: '8:00 AM - 11:00 AM',
      location: 'Central Park'
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    
    // Update time every minute
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
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: 'badge-active', text: 'Active' },
      inactive: { class: 'badge-inactive', text: 'Inactive' },
      pending: { class: 'badge-pending', text: 'Pending' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-wrapper">
          <div className="dashboard-header">
            <div className="loading-skeleton" style={{ width: '200px', height: '2rem' }}></div>
            <div className="loading-skeleton" style={{ width: '300px' }}></div>
          </div>
          <div className="stats-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-card">
                <div className="loading-skeleton" style={{ height: '3rem' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-top">
            <h1 className="dashboard-title">Dashboard</h1>
            <span className="dashboard-date">{formatDate(currentTime)}</span>
          </div>
          <p className="dashboard-greeting">{getGreeting()}, {userData.name}! 👋</p>
        </div>

        {/* New Stats Grid - Horizontal row of vertical widgets */}
        <div className="stats-row">
          {/* Hours Progress Widget */}
          <div className="stat-widget hours-widget">
            <div className="widget-header">
              <p className="widget-label">Total Hours</p>
              <div className="widget-icon-wrapper">
                <Clock className="widget-icon" />
              </div>
            </div>
            {/* Hours Progress Container */}
            <div className="hours-progress-container">
              <svg className="circle-progress" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <circle className="circle-bg" cx="100" cy="100" r="90" strokeWidth="12" />
                <circle className="circle-value" cx="100" cy="100" r="90" strokeWidth="12"
                  strokeDasharray="565.48" strokeDashoffset={565.48 - hoursProgress} />
              </svg>
              <div className="hours-display">
                <span className="hours-number">{userData.totalHours}</span>
                <span className="hours-label">Hours</span>
              </div>
            </div>
            <div className="stat-change stat-change-positive">
              <div className="change-pill">
                <ArrowUpRight className="stat-change-icon" />
                <span>+{userData.hoursChange} this month</span>
              </div>
            </div>
          </div>

          {/* Attendance Rate Widget */}
          <div className="stat-widget">
            <div className="widget-header">
              <p className="widget-label">Attendance Rate</p>
              <div className="widget-icon-wrapper icon-green">
                <TrendingUp className="widget-icon" />
              </div>
            </div>
            <div className="widget-content">
              <p className="widget-value">{userData.attendanceRate}%</p>
              <div className="widget-pill">+{userData.attendanceChange}%</div>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${userData.attendanceRate}%` }}
              ></div>
            </div>
          </div>

          {/* Sessions Completed Widget */}
          <div className="stat-widget">
            <div className="widget-header">
              <p className="widget-label">Sessions Completed</p>
              <div className="widget-icon-wrapper icon-purple">
                <CheckCircle2 className="widget-icon" />
              </div>
            </div>
            <div className="widget-content">
              <p className="widget-value">{userData.sessionsCompleted}</p>
              <div className="widget-pill">+{userData.sessionsChange}</div>
            </div>
            <p className="widget-description">Total volunteer sessions</p>
          </div>

          {/* Current Achievement Widget */}
          <div className="stat-widget">
            <div className="widget-header">
              <p className="widget-label">Current Achievement</p>
              <div className="widget-icon-wrapper icon-amber">
                <Award className="widget-icon" />
              </div>
            </div>
            <div className="widget-content">
              <p className="widget-value">{userData.currentRank}</p>
              <span className={`status-badge ${getStatusBadge(userData.volunteerStatus).class}`}>
                <span className="status-badge-dot"></span>
                {getStatusBadge(userData.volunteerStatus).text}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="main-content-grid">
          {/* Recent Activity */}
          <div className="activity-card">
            <div className="activity-header">
              <h2 className="activity-title">Recent Activity</h2>
            </div>
            <ul className="activity-list">
              {recentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <li key={activity.id} className="activity-item">
                    <div className="activity-content">
                      <div className={`activity-icon-wrapper ${activity.iconColor}`}>
                        <IconComponent className="activity-icon" />
                      </div>
                      <div className="activity-details">
                        <p className="activity-text">{activity.text}</p>
                        <p className="activity-time">{activity.time}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sidebar */}
          <div>
            {/* Upcoming Sessions */}
            <div className="upcoming-card">
              <div className="upcoming-header">
                <h2 className="upcoming-title">Upcoming Sessions</h2>
                <a href="/appointments" className="view-all-link">
                  View all <ChevronRight style={{ width: '1rem', height: '1rem', display: 'inline' }} />
                </a>
              </div>
              <div className="upcoming-list">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="upcoming-item">
                    <div className="upcoming-item-header">
                      <h3 className="upcoming-item-title">{session.title}</h3>
                      <span className="upcoming-item-date">{session.date}</span>
                    </div>
                    <div className="upcoming-item-details">
                      <div className="upcoming-detail">
                        <Clock className="upcoming-detail-icon" />
                        <span>{session.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-card" style={{ marginTop: '1.5rem' }}>
              <h2 className="quick-actions-title">Quick Actions</h2>
              <div className="quick-actions-grid">
                <a href="/calendar" className="quick-action-btn">
                  <Calendar className="quick-action-icon" />
                  <span className="quick-action-label">Sign Up</span>
                </a>
                <a href="/attendance" className="quick-action-btn">
                  <CheckCircle2 className="quick-action-icon" />
                  <span className="quick-action-label">Check In</span>
                </a>
                <a href="/appointments" className="quick-action-btn">
                  <CalendarDays className="quick-action-icon" />
                  <span className="quick-action-label">My Sessions</span>
                </a>
                <a href="/profile" className="quick-action-btn">
                  <FileText className="quick-action-icon" />
                  <span className="quick-action-label">Reports</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;