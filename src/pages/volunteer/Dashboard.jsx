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

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-info">
                <p className="stat-label">Total Hours</p>
                <p className="stat-value">{userData.totalHours}</p>
                <div className="stat-change stat-change-positive">
                  <ArrowUpRight className="stat-change-icon" />
                  <span>+{userData.hoursChange} this month</span>
                </div>
              </div>
              <div className="stat-icon-wrapper icon-blue">
                <Clock className="stat-icon" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-info">
                <p className="stat-label">Attendance Rate</p>
                <p className="stat-value">{userData.attendanceRate}%</p>
                <div className="stat-change stat-change-positive">
                  <ArrowUpRight className="stat-change-icon" />
                  <span>+{userData.attendanceChange}%</span>
                </div>
              </div>
              <div className="stat-icon-wrapper icon-green">
                <TrendingUp className="stat-icon" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-info">
                <p className="stat-label">Sessions Completed</p>
                <p className="stat-value">{userData.sessionsCompleted}</p>
                <div className="stat-change stat-change-positive">
                  <ArrowUpRight className="stat-change-icon" />
                  <span>+{userData.sessionsChange} this month</span>
                </div>
              </div>
              <div className="stat-icon-wrapper icon-purple">
                <CheckCircle2 className="stat-icon" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-info">
                <p className="stat-label">Current Streak</p>
                <p className="stat-value">{userData.currentStreak} days</p>
                <div className="stat-change stat-change-positive">
                  <ArrowUpRight className="stat-change-icon" />
                  <span>+{userData.streakChange} days</span>
                </div>
              </div>
              <div className="stat-icon-wrapper icon-amber">
                <Award className="stat-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Volunteer Status */}
        <div className="volunteer-status-card">
          <div className="status-header">
            <h2 className="status-title">Volunteer Status</h2>
            <span className={`status-badge ${getStatusBadge(userData.volunteerStatus).class}`}>
              <span className="status-badge-dot"></span>
              {getStatusBadge(userData.volunteerStatus).text}
            </span>
          </div>
          <div className="status-details">
            <div className="status-detail-item">
              <p className="status-detail-label">Next Session</p>
              <p className="status-detail-value">
                {new Date(userData.nextSession).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="status-detail-item">
              <p className="status-detail-label">Last Session</p>
              <p className="status-detail-value">
                {new Date(userData.lastSession).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="status-detail-item">
              <p className="status-detail-label">Member Since</p>
              <p className="status-detail-value">
                {new Date(userData.memberSince).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <div className="status-detail-item">
              <p className="status-detail-label">Current Rank</p>
              <p className="status-detail-value">{userData.currentRank}</p>
            </div>
          </div>
        </div>

        {/* Achievement Card */}
        <div className="achievement-card">
          <div className="achievement-content">
            <div className="achievement-icon-wrapper">
              <Award className="achievement-icon" />
            </div>
            <div className="achievement-text">
              <p className="achievement-label">Current Achievement Level</p>
              <p className="achievement-title">{userData.currentRank}</p>
              <p className="achievement-progress">
                {userData.pointsToNextRank} points to Platinum Volunteer
              </p>
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