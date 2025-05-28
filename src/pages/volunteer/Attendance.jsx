// import React, { useState } from 'react';
// import { Clock, Users, Check, X, AlertCircle, TrendingUp, Award, FileText, CheckCircle2, XCircle, History, CalendarDays, CalendarClock } from 'lucide-react';
// import './styles/Attendance.css';

// const Attendance = () => {
//   const [activeTab, setActiveTab] = useState('Today');

//   // Function to get the appropriate tab icon
//   const getTabIcon = (key) => {
//     switch (key) {
//       case 'Today':
//         return <CalendarDays size={18} />;
//       case 'History':
//         return <History size={18} />;
//       default:
//         return null;
//     }
//   };
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
//         <div className="profile-tabs">
//           <div className="tabs">
//             {["Today", "History"].map((key) => (
//               <button 
//                 key={key} 
//                 className={`tab-item ${activeTab === key ? "active" : ""}`} 
//                 onClick={() => setActiveTab(key)}
//               >
//                 {getTabIcon(key)} {key}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Today's Session Tab */}
//         {activeTab === 'Today' && (
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
//         {activeTab === 'History' && (
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
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Attendance;

import React, { useState, useEffect } from 'react';
import { Clock, Users, Check, X, AlertCircle, TrendingUp, Award, FileText, CheckCircle2, XCircle, History, CalendarDays, CalendarClock } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingScreen from '@/components/volunteer/InnerLS';
import './styles/Attendance.css';

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('Today');
  const [selectedSession, setSelectedSession] = useState(null);
  const [todaySession, setTodaySession] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');

  // Get username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('userId');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch today's session
  useEffect(() => {
    const fetchTodaySession = async () => {
      if (!username) return;

      try {
        setLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const calendarRef = collection(db, 'calendar_slots');
        const snapshot = await getDocs(calendarRef);
        
        const todayData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(slot => {
            // Check if date matches today
            let slotDate;
            if (slot.date && slot.date.toDate) {
              slotDate = slot.date.toDate();
            } else if (slot.date) {
              slotDate = new Date(slot.date);
            } else {
              return false;
            }
            
            slotDate.setHours(0, 0, 0, 0);
            
            // Check all conditions
            const isToday = slotDate.getTime() === today.getTime();
            const isInProgress = slot.status === 'inProgress';
            const userVolunteer = slot.volunteers?.find(v => 
              v.username === username && v.status === 'approved'
            );
            
            return isToday && isInProgress && userVolunteer;
          });

        if (todayData.length > 0) {
          const session = todayData[0];
          setTodaySession({
            id: session.id,
            time: `${session.startTime} - ${session.endTime}`,
            residents: session.residentIds || [],
            description: session.notes || 'Volunteer session with residents',
            status: 'not_confirmed',
            sessionType: session.isCustom ? 'Custom Session' : (session.customLabel || 'General Session'),
            date: session.date,
            appointmentId: session.appointmentId
          });
        } else {
          setTodaySession(null);
        }
      } catch (error) {
        console.error('Error fetching today\'s session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySession();
  }, [username]);

  // Fetch attendance history
  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      if (!userId && !username) return;

      try {
        const attendanceRef = collection(db, 'attendance');
        
        // Query by volunteerId (userId) or username if available
        let attendanceQuery;
        if (userId) {
          attendanceQuery = query(
            attendanceRef,
            where('volunteerId', '==', userId),
            orderBy('confirmedAt', 'desc'),
            limit(5)
          );
        } else {
          // If no userId, get all and filter by username later
          attendanceQuery = query(
            attendanceRef,
            orderBy('confirmedAt', 'desc'),
            limit(20) // Get more to filter by username
          );
        }

        const snapshot = await getDocs(attendanceQuery);
        let historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // If we don't have userId, filter by username after fetching
        if (!userId) {
          historyData = historyData.filter(record => 
            record.confirmedBy === username
          ).slice(0, 5);
        }

        // Get appointment details for each attendance record
        const calendarRef = collection(db, 'calendar_slots');
        const calendarSnapshot = await getDocs(calendarRef);
        const calendarData = {};
        
        calendarSnapshot.docs.forEach(doc => {
          const data = doc.data();
          calendarData[data.appointmentId || doc.id] = {
            ...data,
            id: doc.id
          };
        });

        const enrichedHistory = historyData.map(record => {
          const appointmentData = calendarData[record.appointmentId];
          
          return {
            id: record.id,
            date: record.confirmedAt?.toDate ? record.confirmedAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            title: appointmentData?.customLabel || appointmentData?.sessionType || 'Volunteer Session',
            time: appointmentData ? `${appointmentData.startTime} - ${appointmentData.endTime}` : 'Time not available',
            status: record.status || 'present',
            hours: getHoursFromTimeRange(appointmentData?.startTime, appointmentData?.endTime),
            notes: record.notes || '',
            appointmentId: record.appointmentId
          };
        });

        setAttendanceHistory(enrichedHistory);
      } catch (error) {
        console.error('Error fetching attendance history:', error);
      }
    };

    fetchAttendanceHistory();
  }, [userId, username]);

  // Helper function to calculate hours from time range
  const getHoursFromTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period?.toLowerCase() === 'pm' && hours !== 12) hours += 12;
      if (period?.toLowerCase() === 'am' && hours === 12) hours = 0;
      
      return hours + (minutes || 0) / 60;
    };

    try {
      const start = parseTime(startTime);
      const end = parseTime(endTime);
      return Math.max(0, end - start);
    } catch (error) {
      console.error('Error parsing time range:', error);
      return 0;
    }
  };

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

  // Helper function to parse time string and get current time status
  const parseTimeString = (timeStr) => {
    if (!timeStr) return null;
    
    const [time, period] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period?.toLowerCase() === 'pm' && hours !== 12) hours += 12;
    if (period?.toLowerCase() === 'am' && hours === 12) hours = 0;
    
    const today = new Date();
    const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes || 0);
    
    return timeDate;
  };

  // Function to determine attendance status based on current time
  const getAttendanceStatus = (startTime, endTime) => {
    const now = new Date();
    const sessionStart = parseTimeString(startTime);
    const sessionEnd = parseTimeString(endTime);
    
    if (!sessionStart || !sessionEnd) return 'present'; // Default if time parsing fails
    
    if (now > sessionEnd) {
      return 'auto-absent'; // Session has ended
    } else if (now > sessionStart) {
      return 'late'; // Session has started but not ended
    } else {
      return 'present'; // Before session start time
    }
  };

  // Function to automatically create absent records for ended sessions
  useEffect(() => {
    const checkAndCreateAbsentRecords = async () => {
      if (!username || !todaySession) return;

      const attendanceStatus = getAttendanceStatus(todaySession.time.split(' - ')[0], todaySession.time.split(' - ')[1]);
      
      if (attendanceStatus === 'auto-absent' && !selectedSession) {
        try {
          // Check if attendance record already exists
          const attendanceRef = collection(db, 'attendance');
          const existingQuery = query(
            attendanceRef,
            where('appointmentId', '==', todaySession.appointmentId || todaySession.id),
            where('volunteerId', '==', userId || username)
          );
          const existingSnapshot = await getDocs(existingQuery);
          
          if (existingSnapshot.empty) {
            // Create absent record automatically
            await addDoc(collection(db, 'attendance'), {
              appointmentId: todaySession.appointmentId || todaySession.id,
              volunteerId: userId || username,
              confirmedBy: username,
              confirmedAt: Timestamp.now(),
              status: 'absent',
              notes: 'Automatically marked absent - session ended without confirmation'
            });
            
            setSelectedSession({ ...todaySession, status: 'auto-absent' });
            console.log('Automatically marked as absent - session ended');
          }
        } catch (error) {
          console.error('Error creating automatic absent record:', error);
        }
      }
    };

    // Check every minute for auto-absent logic
    const interval = setInterval(checkAndCreateAbsentRecords, 60000);
    
    // Check immediately
    checkAndCreateAbsentRecords();
    
    return () => clearInterval(interval);
  }, [todaySession, username, userId, selectedSession]);

  const handleConfirm = async () => {
    if (!todaySession) return;

    try {
      const [startTime, endTime] = todaySession.time.split(' - ');
      const attendanceStatus = getAttendanceStatus(startTime, endTime);
      
      // Don't allow confirmation if session has ended
      if (attendanceStatus === 'auto-absent') {
        alert('Cannot confirm attendance - the session has already ended.');
        return;
      }

      // Determine final status
      const finalStatus = attendanceStatus === 'late' ? 'late' : 'present';
      
      // Check if attendance record already exists
      const attendanceRef = collection(db, 'attendance');
      const existingQuery = query(
        attendanceRef,
        where('appointmentId', '==', todaySession.appointmentId || todaySession.id),
        where('volunteerId', '==', userId || username)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        alert('Attendance already recorded for this session.');
        return;
      }

      // Create attendance record
      await addDoc(collection(db, 'attendance'), {
        appointmentId: todaySession.appointmentId || todaySession.id,
        volunteerId: userId || username,
        confirmedBy: username,
        confirmedAt: Timestamp.now(),
        status: finalStatus,
        notes: finalStatus === 'late' ? 'Confirmed after session start time' : 'Confirmed on time'
      });
      
      setSelectedSession({ 
        ...todaySession, 
        status: 'confirmed',
        attendanceStatus: finalStatus
      });
      
      const statusMessage = finalStatus === 'late' 
        ? 'Attendance confirmed as LATE (session has already started)'
        : 'Attendance confirmed as PRESENT';
        
      alert(statusMessage);
      console.log('Attendance confirmed with status:', finalStatus);
      
    } catch (error) {
      console.error('Error confirming attendance:', error);
      alert('Error confirming attendance. Please try again.');
    }
  };

  const handleCancel = async () => {
    if (!todaySession) return;

    try {
      // Check if attendance record already exists
      const attendanceRef = collection(db, 'attendance');
      const existingQuery = query(
        attendanceRef,
        where('appointmentId', '==', todaySession.appointmentId || todaySession.id),
        where('volunteerId', '==', userId || username)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        alert('Attendance already recorded for this session.');
        return;
      }

      // Create absent attendance record
      await addDoc(collection(db, 'attendance'), {
        appointmentId: todaySession.appointmentId || todaySession.id,
        volunteerId: userId || username,
        confirmedBy: username,
        confirmedAt: Timestamp.now(),
        status: 'absent',
        notes: 'Cancelled by volunteer'
      });
      
      setSelectedSession({ ...todaySession, status: 'cancelled' });
      console.log('Attendance cancelled - marked as absent');
      
    } catch (error) {
      console.error('Error cancelling attendance:', error);
      alert('Error cancelling attendance. Please try again.');
    }
  };

  // Function to get session time status for display
  const getSessionTimeStatus = () => {
    if (!todaySession) return null;
    
    const [startTime, endTime] = todaySession.time.split(' - ');
    const status = getAttendanceStatus(startTime, endTime);
    
    switch (status) {
      case 'auto-absent':
        return {
          message: 'Session has ended - automatically marked as absent',
          type: 'error',
          canConfirm: false
        };
      case 'late':
        return {
          message: 'Session has started - confirming now will mark you as LATE',
          type: 'warning',
          canConfirm: true
        };
      default:
        return {
          message: 'Session has not started yet - you can confirm on time',
          type: 'info',
          canConfirm: true
        };
    }
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      not_confirmed: 'status-not-confirmed',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled',
      'auto-absent': 'status-missed',
      present: 'status-attended',
      absent: 'status-missed',
      late: 'status-late'
    };
    return statusClasses[status] || '';
  };

  const getStatusText = (status) => {
    const texts = {
      not_confirmed: 'Not Confirmed',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      'auto-absent': 'Auto Absent',
      present: 'Present',
      absent: 'Absent',
      late: 'Late'
    };
    return texts[status] || status;
  };

  // Calculate stats from history
  const stats = {
    totalHours: attendanceHistory.reduce((sum, session) => 
      sum + (session.status === 'present' || session.status === 'late' ? session.hours : 0), 0
    ),
    completedSessions: attendanceHistory.filter(session => 
      session.status === 'present' || session.status === 'late'
    ).length,
    attendanceRate: attendanceHistory.length > 0 
      ? ((attendanceHistory.filter(session => session.status === 'present' || session.status === 'late').length / attendanceHistory.length) * 100).toFixed(1)
      : 0,
    thisMonthHours: attendanceHistory
      .filter(session => {
        const sessionDate = new Date(session.date);
        const now = new Date();
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear() &&
               (session.status === 'present' || session.status === 'late');
      })
      .reduce((sum, session) => sum + session.hours, 0)
  };

  if (loading) {
    return <LoadingScreen />;
  }

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
            {["Today", "History"].map((key) => (
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
              {todaySession ? (
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
                          <p className="detail-label">Session Type</p>
                          <p className="detail-value">{todaySession.sessionType}</p>
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
                    </div>

                    <div className="status-section">
                      <div className="status-row">
                        <span className="status-label">Status:</span>
                        <span className={`status-badge ${getStatusClass(selectedSession?.status || todaySession.status)}`}>
                          {getStatusText(selectedSession?.status || todaySession.status)}
                        </span>
                      </div>

                      {/* Show time-based status information */}
                      {(() => {
                        const timeStatus = getSessionTimeStatus();
                        if (timeStatus && !selectedSession) {
                          return (
                            <div className={`alert-box alert-${timeStatus.type}`}>
                              <AlertCircle className="alert-icon" />
                              <div className="alert-content">
                                <p className="alert-title">Session Timing</p>
                                <p className="alert-message">{timeStatus.message}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {(!selectedSession || selectedSession.status === 'not_confirmed') && (() => {
                        const timeStatus = getSessionTimeStatus();
                        const canConfirm = timeStatus?.canConfirm !== false;
                        
                        if (!canConfirm) {
                          return (
                            <div className="status-message status-error">
                              <div className="status-message-header">
                                <XCircle className="status-message-icon" />
                                <p className="status-message-title">Session Ended</p>
                              </div>
                              <p className="status-message-text">
                                The session has ended and you have been automatically marked as absent.
                              </p>
                            </div>
                          );
                        }

                        return (
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
                                <span className="btn-text">
                                  {timeStatus?.type === 'warning' ? 'Confirm (Late)' : 'Confirm Attendance'}
                                </span>
                              </button>
                            </div>
                          </>
                        );
                      })()}

                      {selectedSession?.status === 'confirmed' && (
                        <div className="status-message status-success">
                          <div className="status-message-header">
                            <CheckCircle2 className="status-message-icon" />
                            <p className="status-message-title">
                              {selectedSession.attendanceStatus === 'late' 
                                ? 'Attendance Confirmed (Late)!' 
                                : 'Attendance Confirmed!'}
                            </p>
                          </div>
                          <p className="status-message-text">
                            {selectedSession.attendanceStatus === 'late'
                              ? 'You have been marked as late for this session.'
                              : 'You\'re all set for today\'s session.'}
                          </p>
                        </div>
                      )}

                      {(selectedSession?.status === 'cancelled' || selectedSession?.status === 'auto-absent') && (
                        <div className="status-message status-error">
                          <div className="status-message-header">
                            <XCircle className="status-message-icon" />
                            <p className="status-message-title">
                              {selectedSession?.status === 'auto-absent' 
                                ? 'Automatically Marked Absent' 
                                : 'Attendance Cancelled'}
                            </p>
                          </div>
                          <p className="status-message-text">
                            {selectedSession?.status === 'auto-absent'
                              ? 'The session ended without confirmation - marked as absent.'
                              : 'You won\'t be attending today\'s session.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="session-card">
                  <div className="session-card-content">
                    <h2 className="session-card-title">No Session Today</h2>
                    <p className="session-card-description">
                      You don't have any approved sessions scheduled for today.
                    </p>
                    <div className="alert-box alert-info">
                      <AlertCircle className="alert-icon" />
                      <div className="alert-content">
                        <p className="alert-title">No sessions found</p>
                        <p className="alert-message">
                          Check the calendar to see your upcoming sessions or contact your coordinator.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  <p className="monthly-stat-value">{stats.completedSessions}</p>
                </div>
                <div>
                  <p className="monthly-stat-label">Hours</p>
                  <p className="monthly-stat-value">{stats.thisMonthHours.toFixed(1)}</p>
                </div>
                <div>
                  <p className="monthly-stat-label">Attendance Rate</p>
                  <p className="monthly-stat-value">{stats.attendanceRate}%</p>
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="history-list">
              {attendanceHistory.length > 0 ? (
                attendanceHistory.map((session) => (
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
                          <span>{new Date(session.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                        <div className="history-detail">
                          <Clock className="history-detail-icon" />
                          <span>{session.time}</span>
                        </div>
                      </div>

                      {(session.status === 'present' || session.status === 'late') && (
                        <div className="history-metrics">
                          <div className="metric-item">
                            <TrendingUp className="metric-icon" />
                            <span className="metric-text">{session.hours.toFixed(1)} hours completed</span>
                          </div>
                        </div>
                      )}

                      {session.notes && (
                        <p className="reason-text">
                          <span className="reason-label">Notes:</span> {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="history-item">
                  <p>No attendance history found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;