// import React, { useState } from 'react';
// import { Clock, Users, Check, X, AlertCircle, TrendingUp, Award, FileText, CheckCircle2, XCircle, History, CalendarDays, CalendarClock } from 'lucide-react';
// import './styles/Attendance.css';

// const Attendance = () => {
//   const [activeTab, setActiveTab] = useState('today');
//   const [selectedSession, setSelectedSession] = useState(null);

//   // Mock data for stats
//   const stats = {
//     totalHours: 24.5,
//     completedSessions: 12,
//     attendanceRate: 85.7,
//     thisMonthHours: 18.5
//   };

//   // Mock data for today's session
//   const todaySession = {
//     id: 1,
//     time: '2:00 PM - 3:30 PM',
//     residents: ['John D.', 'Sarah M.'],
//     description: 'Reading session with residents focusing on classic literature and poetry.',
//     requirements: ['Bring reading materials', 'Arrive 5 minutes early'],
//     status: 'not_confirmed',
//     coordinator: 'Emily Watson',
//     sessionType: 'Elder Care'
//   };

//   // Mock data for upcoming sessions
//   const upcomingSessions = [
//     {
//       id: 2,
//       date: '2025-05-25',
//       time: '10:00 AM - 12:00 PM',
//       title: 'Community Garden',
//       status: 'confirmed'
//     },
//     {
//       id: 3,
//       date: '2025-05-28',
//       time: '3:00 PM - 5:00 PM',
//       title: 'Youth Mentoring',
//       status: 'not_confirmed'
//     }
//   ];

//   // Mock data for attendance history
//   const attendanceHistory = [
//     {
//       id: 4,
//       date: '2025-05-20',
//       title: 'Food Bank Distribution',
//       time: '9:00 AM - 12:00 PM',
//       status: 'attended',
//       hours: 3,
//       rating: 5
//     },
//     {
//       id: 5,
//       date: '2025-05-15',
//       title: 'Library Reading Program',
//       time: '3:00 PM - 5:00 PM',
//       status: 'attended',
//       hours: 2,
//       rating: 4
//     },
//     {
//       id: 6,
//       date: '2025-05-10',
//       title: 'Beach Cleanup',
//       time: '8:00 AM - 11:00 AM',
//       status: 'missed',
//       hours: 0,
//       reason: 'Sick'
//     }
//   ];

//   const handleConfirm = () => {
//     setSelectedSession({ ...todaySession, status: 'confirmed' });
//     console.log('Confirming attendance');
//   };

//   const handleCancel = () => {
//     setSelectedSession({ ...todaySession, status: 'cancelled' });
//     console.log('Cancelling attendance');
//   };

//   const getStatusClass = (status) => {
//     const statusClasses = {
//       not_confirmed: 'status-not-confirmed',
//       confirmed: 'status-confirmed',
//       cancelled: 'status-cancelled',
//       attended: 'status-attended',
//       missed: 'status-missed'
//     };
//     return statusClasses[status] || '';
//   };

//   const getStatusText = (status) => {
//     const texts = {
//       not_confirmed: 'Not Confirmed',
//       confirmed: 'Confirmed',
//       cancelled: 'Cancelled',
//       attended: 'Attended',
//       missed: 'Missed'
//     };
//     return texts[status] || status;
//   };

//   return (
//     <div className="attendance-container">
//       <div className="attendance-wrapper">
//         {/* Header */}
//         <div className="attendance-header">
//           <h1 className="attendance-title">Attendance</h1>
//           <p className="attendance-subtitle">Manage your session attendance and view history</p>
//         </div>

//         {/* Tab Navigation */}
        
//         <div className="tab-navigation">
//           <button
//             onClick={() => setActiveTab('today')}
//             className={`tab-button ${activeTab === 'today' ? 'active' : 'inactive'}`}
//           >
//             <CalendarDays className="tab-icon" />
//             Today
//           </button>
//           <button
//             onClick={() => setActiveTab('history')}
//             className={`tab-button ${activeTab === 'history' ? 'active' : 'inactive'}`}
//           >
//             <History className="tab-icon" />
//             History
//           </button>
//         </div>

//         {/* Today's Session Tab */}
//         {activeTab === 'today' && (
//           <div className="responsive-content-grid">
//             {/* Main Session Card */}
//             <div className="main-session-area">
//               <div className="session-card">
//                 <div className="session-card-content">
//                   <h2 className="session-card-title">
//                     Confirm Today's Attendance
//                   </h2>
//                   <p className="session-card-description">Please confirm your attendance for today's session.</p>

//                   <div className="session-details">
//                     <div className="detail-row detail-row-responsive">
//                       <div className="detail-content">
//                         <Clock className="detail-icon" />
//                         <div>
//                           <p className="detail-label">Time</p>
//                           <p className="detail-value">{todaySession.time}</p>
//                         </div>
//                       </div>
//                       <div className="detail-section">
//                         <p className="detail-label">Date</p>
//                         <p className="detail-value">Today</p>
//                       </div>
//                     </div>

//                     <div className="detail-row">
//                       <Users className="detail-icon" />
//                       <div className="detail-content">
//                         <p className="detail-label">Residents</p>
//                         <p className="detail-value">{todaySession.residents.join(', ')}</p>
//                       </div>
//                     </div>

//                     <div className="detail-divider"></div>

//                     <div className="detail-row">
//                       <FileText className="detail-icon" />
//                       <div className="detail-content">
//                         <p className="detail-label" style={{ marginBottom: '0.5rem' }}>Description</p>
//                         <p className="detail-value">{todaySession.description}</p>
//                       </div>
//                     </div>

//                     <div className="detail-row">
//                       <AlertCircle className="detail-icon" />
//                       <div className="detail-content">
//                         <p className="detail-label" style={{ marginBottom: '0.5rem' }}>Requirements</p>
//                         <ul className="requirements-list">
//                           {todaySession.requirements.map((req, index) => (
//                             <li key={index} className="requirement-item">
//                               <span className="requirement-bullet" />
//                               {req}
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="status-section">
//                     <div className="status-row">
//                       <span className="status-label">Status:</span>
//                       <span className={`status-badge ${getStatusClass(selectedSession?.status || todaySession.status)}`}>
//                         {getStatusText(selectedSession?.status || todaySession.status)}
//                       </span>
//                     </div>

//                     {(!selectedSession || selectedSession.status === 'not_confirmed') && (
//                       <>
//                         <div className="alert-box alert-warning">
//                           <AlertCircle className="alert-icon" />
//                           <div className="alert-content">
//                             <p className="alert-title">Please confirm your attendance</p>
//                             <p className="alert-message">Your attendance needs to be confirmed for today's session.</p>
//                           </div>
//                         </div>

//                         <div className="action-buttons">
//                           <button
//                             onClick={handleCancel}
//                             className="btn btn-cancel"
//                           >
//                             <X className="btn-icon" />
//                             <span className="btn-text">Unable to Attend</span>
//                           </button>
//                           <button
//                             onClick={handleConfirm}
//                             className="btn btn-confirm"
//                           >
//                             <Check className="btn-icon" />
//                             <span className="btn-text">Confirm Attendance</span>
//                           </button>
//                         </div>
//                       </>
//                     )}

//                     {selectedSession?.status === 'confirmed' && (
//                       <div className="status-message status-success">
//                         <div className="status-message-header">
//                           <CheckCircle2 className="status-message-icon" />
//                           <p className="status-message-title">Attendance Confirmed!</p>
//                         </div>
//                         <p className="status-message-text">You're all set for today's session.</p>
//                       </div>
//                     )}

//                     {selectedSession?.status === 'cancelled' && (
//                       <div className="status-message status-error">
//                         <div className="status-message-header">
//                           <XCircle className="status-message-icon" />
//                           <p className="status-message-title">Attendance Cancelled</p>
//                         </div>
//                         <p className="status-message-text">You won't be attending today's session.</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* History Tab */}
//         {activeTab === 'history' && (
//           <div>
//             {/* Monthly Summary */}
//             <div className="monthly-summary">
//               <h3 className="monthly-summary-title">This Month's Summary</h3>
//               <div className="monthly-stats">
//                 <div>
//                   <p className="monthly-stat-label">Sessions</p>
//                   <p className="monthly-stat-value">8</p>
//                 </div>
//                 <div>
//                   <p className="monthly-stat-label">Hours</p>
//                   <p className="monthly-stat-value">{stats.thisMonthHours}</p>
//                 </div>
//                 <div>
//                   <p className="monthly-stat-label">Achievement</p>
//                   <div className="achievement-badge">
//                     <Award className="achievement-icon" />
//                     <span className="achievement-text">Gold</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* History List */}
//             <div className="history-list">
//               {attendanceHistory.map((session) => (
//                 <div key={session.id} className="history-item">
//                   <div>
//                     <div className="history-item-header">
//                       <h3 className="history-item-title">{session.title}</h3>
//                       <span className={`status-badge ${getStatusClass(session.status)}`}>
//                         {getStatusText(session.status)}
//                       </span>
//                     </div>
                    
//                     <div className="history-item-details">
//                       <div className="history-detail">
//                         <CalendarDays className="history-detail-icon" />
//                         <span>{new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
//                       </div>
//                       <div className="history-detail">
//                         <Clock className="history-detail-icon" />
//                         <span>{session.time}</span>
//                       </div>
//                     </div>

//                     {session.status === 'attended' && (
//                       <div className="history-metrics">
//                         <div className="metric-item">
//                           <TrendingUp className="metric-icon" />
//                           <span className="metric-text">{session.hours} hours completed</span>
//                         </div>
//                         {session.rating && (
//                           <div className="rating-stars">
//                             {[...Array(5)].map((_, i) => (
//                               <span key={i} className={`star ${i < session.rating ? 'star-filled' : 'star-empty'}`}>★</span>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     )}

//                     {session.status === 'missed' && session.reason && (
//                       <p className="reason-text">
//                         <span className="reason-label">Reason:</span> {session.reason}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Load More */}
//             <div className="load-more">
//               <button className="load-more-btn">
//                 Load More History
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Attendance;

import React, { useState } from 'react';
import { Clock, Users, Check, X, AlertCircle, TrendingUp, Award, FileText, CheckCircle2, XCircle, History, CalendarDays, CalendarClock } from 'lucide-react';
import './styles/Attendance.css';

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('Today');

  // Function to get the appropriate tab icon
  const getTabIcon = (key) => {
    switch (key) {
      case 'Today':
        return <CalendarDays size={18} />;
      case 'History':
        return <History size={18} />;
      default:
        return null;
    }
  };
  const [selectedSession, setSelectedSession] = useState(null);

  // Mock data for stats
  const stats = {
    totalHours: 24.5,
    completedSessions: 12,
    attendanceRate: 85.7,
    thisMonthHours: 18.5
  };

  // Mock data for today's session
  const todaySession = {
    id: 1,
    time: '2:00 PM - 3:30 PM',
    residents: ['John D.', 'Sarah M.'],
    description: 'Reading session with residents focusing on classic literature and poetry.',
    requirements: ['Bring reading materials', 'Arrive 5 minutes early'],
    status: 'not_confirmed',
    coordinator: 'Emily Watson',
    sessionType: 'Elder Care'
  };

  // Mock data for upcoming sessions
  const upcomingSessions = [
    {
      id: 2,
      date: '2025-05-25',
      time: '10:00 AM - 12:00 PM',
      title: 'Community Garden',
      status: 'confirmed'
    },
    {
      id: 3,
      date: '2025-05-28',
      time: '3:00 PM - 5:00 PM',
      title: 'Youth Mentoring',
      status: 'not_confirmed'
    }
  ];

  // Mock data for attendance history
  const attendanceHistory = [
    {
      id: 4,
      date: '2025-05-20',
      title: 'Food Bank Distribution',
      time: '9:00 AM - 12:00 PM',
      status: 'attended',
      hours: 3,
      rating: 5
    },
    {
      id: 5,
      date: '2025-05-15',
      title: 'Library Reading Program',
      time: '3:00 PM - 5:00 PM',
      status: 'attended',
      hours: 2,
      rating: 4
    },
    {
      id: 6,
      date: '2025-05-10',
      title: 'Beach Cleanup',
      time: '8:00 AM - 11:00 AM',
      status: 'missed',
      hours: 0,
      reason: 'Sick'
    }
  ];

  const handleConfirm = () => {
    setSelectedSession({ ...todaySession, status: 'confirmed' });
    console.log('Confirming attendance');
  };

  const handleCancel = () => {
    setSelectedSession({ ...todaySession, status: 'cancelled' });
    console.log('Cancelling attendance');
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      not_confirmed: 'status-not-confirmed',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled',
      attended: 'status-attended',
      missed: 'status-missed'
    };
    return statusClasses[status] || '';
  };

  const getStatusText = (status) => {
    const texts = {
      not_confirmed: 'Not Confirmed',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      attended: 'Attended',
      missed: 'Missed'
    };
    return texts[status] || status;
  };

  return (
    <div className="attendance-container">
      <div className="attendance-wrapper">
        {/* Header */}
        <div className="attendance-header">
          <h1 className="attendance-title">Attendance</h1>
          <p className="attendance-subtitle">Manage your session attendance and view history</p>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <div className="tabs">
            {["History", "Today"].map((key) => (
              <button 
                key={key} 
                className={`tab-item ${activeTab === key ? "active" : ""}`} 
                onClick={() => setActiveTab(key)}
              >
                {getTabIcon(key)} {key}
              </button>
            ))}
          </div>
        </div>

        {/* Today's Session Tab */}
        {activeTab === 'Today' && (
          <div className="responsive-content-grid">
            {/* Main Session Card */}
            <div className="main-session-area">
              <div className="session-card">
                <div className="session-card-content">
                  <h2 className="session-card-title">
                    Confirm Today's Attendance
                  </h2>
                  <p className="session-card-description">Please confirm your attendance for today's session.</p>

                  <div className="session-details">
                    <div className="detail-row detail-row-responsive">
                      <div className="detail-content">
                        <Clock className="detail-icon" />
                        <div>
                          <p className="detail-label">Time</p>
                          <p className="detail-value">{todaySession.time}</p>
                        </div>
                      </div>
                      <div className="detail-section">
                        <p className="detail-label">Date</p>
                        <p className="detail-value">Today</p>
                      </div>
                    </div>

                    <div className="detail-row">
                      <Users className="detail-icon" />
                      <div className="detail-content">
                        <p className="detail-label">Residents</p>
                        <p className="detail-value">{todaySession.residents.join(', ')}</p>
                      </div>
                    </div>

                    <div className="detail-divider"></div>

                    <div className="detail-row">
                      <FileText className="detail-icon" />
                      <div className="detail-content">
                        <p className="detail-label" style={{ marginBottom: '0.5rem' }}>Description</p>
                        <p className="detail-value">{todaySession.description}</p>
                      </div>
                    </div>

                    <div className="detail-row">
                      <AlertCircle className="detail-icon" />
                      <div className="detail-content">
                        <p className="detail-label" style={{ marginBottom: '0.5rem' }}>Requirements</p>
                        <ul className="requirements-list">
                          {todaySession.requirements.map((req, index) => (
                            <li key={index} className="requirement-item">
                              <span className="requirement-bullet" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="status-section">
                    <div className="status-row">
                      <span className="status-label">Status:</span>
                      <span className={`status-badge ${getStatusClass(selectedSession?.status || todaySession.status)}`}>
                        {getStatusText(selectedSession?.status || todaySession.status)}
                      </span>
                    </div>

                    {(!selectedSession || selectedSession.status === 'not_confirmed') && (
                      <>
                        <div className="alert-box alert-warning">
                          <AlertCircle className="alert-icon" />
                          <div className="alert-content">
                            <p className="alert-title">Please confirm your attendance</p>
                            <p className="alert-message">Your attendance needs to be confirmed for today's session.</p>
                          </div>
                        </div>

                        <div className="action-buttons">
                          <button
                            onClick={handleCancel}
                            className="btn btn-cancel"
                          >
                            <X className="btn-icon" />
                            <span className="btn-text">Unable to Attend</span>
                          </button>
                          <button
                            onClick={handleConfirm}
                            className="btn btn-confirm"
                          >
                            <Check className="btn-icon" />
                            <span className="btn-text">Confirm Attendance</span>
                          </button>
                        </div>
                      </>
                    )}

                    {selectedSession?.status === 'confirmed' && (
                      <div className="status-message status-success">
                        <div className="status-message-header">
                          <CheckCircle2 className="status-message-icon" />
                          <p className="status-message-title">Attendance Confirmed!</p>
                        </div>
                        <p className="status-message-text">You're all set for today's session.</p>
                      </div>
                    )}

                    {selectedSession?.status === 'cancelled' && (
                      <div className="status-message status-error">
                        <div className="status-message-header">
                          <XCircle className="status-message-icon" />
                          <p className="status-message-title">Attendance Cancelled</p>
                        </div>
                        <p className="status-message-text">You won't be attending today's session.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'History' && (
          <div>
            {/* Monthly Summary */}
            <div className="monthly-summary">
              <h3 className="monthly-summary-title">This Month's Summary</h3>
              <div className="monthly-stats">
                <div>
                  <p className="monthly-stat-label">Sessions</p>
                  <p className="monthly-stat-value">8</p>
                </div>
                <div>
                  <p className="monthly-stat-label">Hours</p>
                  <p className="monthly-stat-value">{stats.thisMonthHours}</p>
                </div>
                <div>
                  <p className="monthly-stat-label">Achievement</p>
                  <div className="achievement-badge">
                    <Award className="achievement-icon" />
                    <span className="achievement-text">Gold</span>
                  </div>
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="history-list">
              {attendanceHistory.map((session) => (
                <div key={session.id} className="history-item">
                  <div>
                    <div className="history-item-header">
                      <h3 className="history-item-title">{session.title}</h3>
                      <span className={`status-badge ${getStatusClass(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                    
                    <div className="history-item-details">
                      <div className="history-detail">
                        <CalendarDays className="history-detail-icon" />
                        <span>{new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="history-detail">
                        <Clock className="history-detail-icon" />
                        <span>{session.time}</span>
                      </div>
                    </div>

                    {session.status === 'attended' && (
                      <div className="history-metrics">
                        <div className="metric-item">
                          <TrendingUp className="metric-icon" />
                          <span className="metric-text">{session.hours} hours completed</span>
                        </div>
                        {session.rating && (
                          <div className="rating-stars">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`star ${i < session.rating ? 'star-filled' : 'star-empty'}`}>★</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {session.status === 'missed' && session.reason && (
                      <p className="reason-text">
                        <span className="reason-label">Reason:</span> {session.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="load-more">
              <button className="load-more-btn">
                Load More History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;