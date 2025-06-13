import React, { useState, useEffect } from 'react';
import { Globe, Clock, Users, Check, X, AlertCircle, TrendingUp, Award, FileText, CheckCircle2, XCircle, History, CalendarDays, CalendarClock, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import LoadingScreen from '@/components/volunteer/InnerLS';
import './styles/Attendance.css';

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('Today');
  const [selectedSessions, setSelectedSessions] = useState({});
  const [todaySessions, setTodaySessions] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const { t, i18n } = useTranslation();
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Pagination state for history
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [allUserRecords, setAllUserRecords] = useState([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);

  const RECORDS_PER_PAGE = 5;

  // Function to show notifications
  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    // Auto hide after 5 seconds
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

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

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

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

  // Updated function to determine attendance status with 15-minute grace period
  const getAttendanceStatus = (startTime, endTime) => {
    const now = new Date();
    const sessionStart = parseTimeString(startTime);
    const sessionEnd = parseTimeString(endTime);
    
    if (!sessionStart || !sessionEnd) return 'present'; // Default if time parsing fails
    
    // Create grace period: 15 minutes after session start
    const gracePeriodEnd = new Date(sessionStart.getTime() + 15 * 60 * 1000); // 15 minutes in milliseconds
    
    if (now > sessionEnd) {
      return 'auto-absent'; // Session has ended
    } else if (now > gracePeriodEnd) {
      return 'late'; // Grace period has ended, now considered late
    } else if (now > sessionStart) {
      return 'grace-period'; // Within 15-minute grace period
    } else {
      return 'present'; // Before session start time
    }
  };

  // Updated fetchTodaySessions to handle multiple sessions
  useEffect(() => {
    const fetchTodaySessions = async () => {
      if (!username) return;

      try {
        setLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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
          // Check attendance for each session
          const sessionsWithAttendance = await Promise.all(
            todayData.map(async (session) => {
              const attendanceRef = collection(db, 'attendance');
              
              try {
                // Check if attendance record already exists for this session
                const existingAttendanceQuery = query(
                  attendanceRef,
                  where('appointmentId', '==', session.appointmentId || session.id),
                  where('volunteerId', 'in', [userId, username].filter(Boolean))
                );
                
                const existingAttendanceSnapshot = await getDocs(existingAttendanceQuery);
                
                if (!existingAttendanceSnapshot.empty) {
                  // Attendance already recorded - don't include this session
                  return null;
                }
              } catch (attendanceError) {
                // If query fails, try manual filtering
                const allAttendanceSnapshot = await getDocs(collection(db, 'attendance'));
                const existingRecord = allAttendanceSnapshot.docs.find(doc => {
                  const data = doc.data();
                  return (data.appointmentId === (session.appointmentId || session.id)) &&
                         (data.volunteerId === userId || data.volunteerId === username);
                });
                
                if (existingRecord) {
                  return null;
                }
              }
              
              // Return session data if no attendance record exists
              return {
                id: session.id,
                time: `${session.startTime} - ${session.endTime}`,
                residents: session.residentIds || [],
                description: session.notes || 'Volunteer session with residents',
                status: 'not_confirmed',
                sessionType: session.isCustom ? session.customLabel : ('General Session'),
                date: session.date,
                appointmentId: session.appointmentId || session.id,
                startTime: session.startTime,
                endTime: session.endTime
              };
            })
          );

          // Filter out null values (sessions with existing attendance)
          const availableSessions = sessionsWithAttendance.filter(session => session !== null);
          
          // Sort sessions by start time
          availableSessions.sort((a, b) => {
            const timeA = parseTimeString(a.startTime);
            const timeB = parseTimeString(b.startTime);
            return timeA - timeB;
          });

          setTodaySessions(availableSessions);
          setSelectedSessions({}); // Reset selected sessions state
        } else {
          setTodaySessions([]);
          setSelectedSessions({});
        }
      } catch (error) {
        console.error('Error fetching today\'s sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySessions();
  }, [username, userId]);

  // Updated handleConfirm function with grace period logic
  const handleConfirm = async (sessionId) => {
    const session = todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      const [startTime, endTime] = session.time.split(' - ');
      const attendanceStatus = getAttendanceStatus(startTime, endTime);
      
      // Don't allow confirmation if session has ended
      if (attendanceStatus === 'auto-absent') {
        showNotification('Cannot confirm attendance - the session has already ended.', 'error');
        return;
      }

      // Determine final status based on attendance status
      let finalStatus;
      let statusMessage;
      
      switch (attendanceStatus) {
        case 'present':
          finalStatus = 'present';
          statusMessage = 'Attendance confirmed as PRESENT';
          break;
        case 'grace-period':
          finalStatus = 'present';
          statusMessage = 'Attendance confirmed as PRESENT (within grace period)';
          break;
        case 'late':
          finalStatus = 'late';
          statusMessage = 'Attendance confirmed as LATE (grace period expired)';
          break;
        default:
          finalStatus = 'present';
          statusMessage = 'Attendance confirmed';
      }
      
      // Check if attendance record already exists
      const attendanceRef = collection(db, 'attendance');
      const existingQuery = query(
        attendanceRef,
        where('appointmentId', '==', session.appointmentId || session.id),
        where('volunteerId', '==', userId || username)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        showNotification('Attendance already recorded for this session.', 'warning');
        setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
        return;
      }

      // Create attendance record with appropriate notes
      let notes;
      switch (attendanceStatus) {
        case 'present':
          notes = 'Confirmed before session start time';
          break;
        case 'grace-period':
          notes = 'Confirmed within 15-minute grace period';
          break;
        case 'late':
          notes = 'Confirmed after grace period expired';
          break;
        default:
          notes = 'Attendance confirmed';
      }

      await addDoc(collection(db, 'attendance'), {
        appointmentId: session.appointmentId || session.id,
        volunteerId: userId || username,
        confirmedBy: username,
        confirmedAt: Timestamp.now(),
        status: finalStatus,
        notes: notes
      });
      
      showNotification(statusMessage, 'success');      
      // Remove this session from today's sessions after confirmation
      setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
      
      // Refresh history to show the new attendance record
      await fetchInitialAttendanceHistory();
      
    } catch (error) {
      console.error('Error confirming attendance:', error);
      showNotification('Error confirming attendance. Please try again.', 'error');
    }
  };

  // Updated handleCancel to work with specific session
  const handleCancel = async (sessionId) => {
    const session = todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      // Check if attendance record already exists
      const attendanceRef = collection(db, 'attendance');
      const existingQuery = query(
        attendanceRef,
        where('appointmentId', '==', session.appointmentId || session.id),
        where('volunteerId', '==', userId || username)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        showNotification('Attendance already recorded for this session.', 'warning');
        // Remove this session from today's sessions
        setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
        return;
      }

      // Create absent attendance record
      await addDoc(collection(db, 'attendance'), {
        appointmentId: session.appointmentId || session.id,
        volunteerId: userId || username,
        confirmedBy: username,
        confirmedAt: Timestamp.now(),
        status: 'absent',
        notes: 'Cancelled by volunteer'
      });    
      
      showNotification('Marked as unable to attend.', 'info');  
      // Remove this session from today's sessions after cancellation
      setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
      
      // Refresh history to show the new attendance record
      await fetchInitialAttendanceHistory();
      
    } catch (error) {
      console.error('Error cancelling attendance:', error);
      showNotification('Error cancelling attendance. Please try again.', 'error');
    }
  };

  // Auto-absent logic with grace period consideration
  useEffect(() => {
    const checkAndCreateAbsentRecords = async () => {
      if (!username || todaySessions.length === 0) return;

      for (const session of todaySessions) {
        const attendanceStatus = getAttendanceStatus(session.startTime, session.endTime);
        
        if (attendanceStatus === 'auto-absent') {
          try {
            // Check if attendance record already exists
            const attendanceRef = collection(db, 'attendance');
            const existingQuery = query(
              attendanceRef,
              where('appointmentId', '==', session.appointmentId || session.id),
              where('volunteerId', '==', userId || username)
            );
            const existingSnapshot = await getDocs(existingQuery);
            
            if (existingSnapshot.empty) {
              // Create absent record automatically
              await addDoc(collection(db, 'attendance'), {
                appointmentId: session.appointmentId || session.id,
                volunteerId: userId || username,
                confirmedBy: username,
                confirmedAt: Timestamp.now(),
                status: 'absent',
                notes: 'Automatically marked absent - session ended without confirmation'
              });              
              // Remove this session from today's sessions
              setTodaySessions(prev => prev.filter(s => s.id !== session.id));
              
              // Refresh history to show the new attendance record
              await fetchInitialAttendanceHistory();
            }
          } catch (error) {
            console.error('Error creating automatic absent record:', error);
          }
        }
      }
    };

    // Check every minute for auto-absent logic
    const interval = setInterval(checkAndCreateAbsentRecords, 60000);
    
    // Check immediately
    checkAndCreateAbsentRecords();
    
    return () => clearInterval(interval);
  }, [todaySessions, username, userId]);

  // Fetch initial attendance history (first 5 records)
  const fetchInitialAttendanceHistory = async () => {
    if (!userId && !username) return;

    try {
      const attendanceRef = collection(db, 'attendance');
      
      // Get all attendance records and filter manually (no index required)
      const snapshot = await getDocs(attendanceRef);
      // Filter records for this user
      let userRecords = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(record => {
          return record.volunteerId === userId || 
                 record.volunteerId === username ||
                 record.confirmedBy === username;
        });        
      
      // Sort by confirmedAt date (most recent first)
      userRecords.sort((a, b) => {
        const dateA = a.confirmedAt?.toDate ? a.confirmedAt.toDate() : new Date(a.confirmedAt || 0);
        const dateB = b.confirmedAt?.toDate ? b.confirmedAt.toDate() : new Date(b.confirmedAt || 0);
        return dateB - dateA;
      });

      // Store all records for pagination
      setAllUserRecords(userRecords);
      setTotalHistoryCount(userRecords.length);
      
      // Set initial page data
      const initialRecords = userRecords.slice(0, RECORDS_PER_PAGE);
      setHasMoreHistory(userRecords.length > RECORDS_PER_PAGE);
      setHistoryPage(0);
      
      // Get appointment details and enrich the data
      const enrichedHistory = await enrichHistoryData(initialRecords);
      setAttendanceHistory(enrichedHistory);
      
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  // Load more history records
  const loadMoreHistory = async () => {
    if (historyLoading || !hasMoreHistory) return;

    setHistoryLoading(true);
    
    try {
      const nextPage = historyPage + 1;
      const startIndex = nextPage * RECORDS_PER_PAGE;
      const endIndex = startIndex + RECORDS_PER_PAGE;
      
      const nextPageRecords = allUserRecords.slice(startIndex, endIndex);
      
      if (nextPageRecords.length > 0) {
        // Enrich the new records
        const enrichedNewRecords = await enrichHistoryData(nextPageRecords);
        
        // Append to existing history
        setAttendanceHistory(prev => [...prev, ...enrichedNewRecords]);
        setHistoryPage(nextPage);
        
        // Check if there are more records
        setHasMoreHistory(endIndex < allUserRecords.length);
      } else {
        setHasMoreHistory(false);
      }
      
    } catch (error) {
      console.error('Error loading more history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Helper function to enrich history data with appointment details
  const enrichHistoryData = async (records) => {
    try {
      // Get appointment details for each attendance record
      const calendarRef = collection(db, 'calendar_slots');
      const calendarSnapshot = await getDocs(calendarRef);
      const calendarData = {};
      
      calendarSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const appointmentId = data.appointmentId || doc.id;
        calendarData[appointmentId] = {
          ...data,
          id: doc.id
        };
      });

      const enrichedHistory = records.map(record => {
        const appointmentData = calendarData[record.appointmentId];
        
        // Handle date conversion safely
        let recordDate;
        if (record.confirmedAt?.toDate) {
          recordDate = record.confirmedAt.toDate();
        } else if (record.confirmedAt) {
          recordDate = new Date(record.confirmedAt);
        } else {
          recordDate = new Date();
        }
        
        return {
          id: record.id,
          date: recordDate.toISOString().split('T')[0],
          title: appointmentData?.customLabel || 
                 appointmentData?.sessionType || 
                 appointmentData?.notes || 
                 'Volunteer Session',
          time: appointmentData ? 
                `${appointmentData.startTime} - ${appointmentData.endTime}` : 
                'Time not available',
          status: record.status || 'present',
          hours: getHoursFromTimeRange(appointmentData?.startTime, appointmentData?.endTime),
          notes: record.notes || '',
          appointmentId: record.appointmentId
        };
      });
      
      return enrichedHistory;
    } catch (error) {
      console.error('Error enriching history data:', error);
      return records;
    }
  };

  // Fetch attendance history on component mount
  useEffect(() => {
    if (userId || username) {
      fetchInitialAttendanceHistory();
    }
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

  // Updated getSessionTimeStatus function with grace period logic
  const getSessionTimeStatus = (session) => {
    if (!session) return null;
    
    const [startTime, endTime] = session.time.split(' - ');
    const status = getAttendanceStatus(startTime, endTime);
    const now = new Date();
    const sessionStart = parseTimeString(startTime);
    const gracePeriodEnd = new Date(sessionStart.getTime() + 15 * 60 * 1000);
    
    switch (status) {
      case 'auto-absent':
        return {
          message: 'Session has ended - automatically marked as absent',
          type: 'error',
          canConfirm: false
        };
      case 'late':
        return {
          message: 'Grace period expired - confirming now will mark you as LATE',
          type: 'error',
          canConfirm: true
        };
      case 'grace-period':
        const remainingMinutes = Math.ceil((gracePeriodEnd - now) / (60 * 1000));
        return {
          message: `Session started - you have ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} left to confirm on time`,
          type: 'warning',
          canConfirm: true,
          remainingTime: remainingMinutes
        };
      default:
        const minutesUntilStart = Math.ceil((sessionStart - now) / (60 * 1000));
        return {
          message: `Session starts in ${minutesUntilStart} minute${minutesUntilStart !== 1 ? 's' : ''}`,
          type: 'info',
          canConfirm: true
        };
    }
  };

  // Updated status class function to handle grace period
  const getStatusClass = (status) => {
    const statusClasses = {
      not_confirmed: 'status-not-confirmed',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled',
      'auto-absent': 'status-missed',
      'grace-period': 'status-grace-period',
      present: 'status-attended',
      absent: 'status-missed',
      late: 'status-late'
    };
    return statusClasses[status] || '';
  };

  // Updated status text function to handle grace period
  const getStatusText = (status) => {
    return t(`attendance.statuses.${status}`) || status;
  };

  // Real-time countdown component for grace period
  const GracePeriodCountdown = ({ session }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    
    useEffect(() => {
      const updateCountdown = () => {
        const now = new Date();
        const sessionStart = parseTimeString(session.startTime);
        const gracePeriodEnd = new Date(sessionStart.getTime() + 15 * 60 * 1000);
        const attendanceStatus = getAttendanceStatus(session.startTime, session.endTime);
        
        if (attendanceStatus === 'grace-period') {
          const remaining = Math.ceil((gracePeriodEnd - now) / (60 * 1000));
          setTimeLeft(remaining > 0 ? remaining : 0);
        } else {
          setTimeLeft(null);
        }
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    }, [session]);
    
    if (timeLeft === null) return null;
    
    return (
      <div className="grace-period-countdown">
        <div className="countdown-container">
          <div className="countdown-circle">
            <span className="countdown-time">{timeLeft}</span>
          </div>
          <p className="countdown-text">
            {timeLeft === 1 
              ? t('attendance.minuteLeft') 
              : t('attendance.minutesLeft', { count: timeLeft })}
          </p>
        </div>
      </div>
    );
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
    <div className="attendance-container" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
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
                           notification.type === 'success' ? '#10b981' : 
                           notification.type === 'warning' ? '#f59e0b' : '#3b82f6',
            transform: 'translateX(0)',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {notification.type === 'error' && <span>❌</span>}
            {notification.type === 'success' && <span>✅</span>}
            {notification.type === 'warning' && <span>⚠️</span>}
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
      <div className="attendance-wrapper">
        {/* Header */}
        <div className="attendance-header">
          <h1 className="attendance-title">{t('attendance.title')}</h1>
          <p className="attendance-subtitle">{t('attendance.subtitle')}</p>
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
                {getTabIcon(key)} {t(`attendance.tabs.${key.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Today's Session Tab */}
        {activeTab === 'Today' && (
          <div className="responsive-content-grid">
            <div className="main-session-area">
              {todaySessions.length > 0 ? (
                <div className="sessions-container">
                  <h2 className="sessions-title">
                    {t('attendance.todaysSessions')} ({todaySessions.length})
                  </h2>
                  {todaySessions.map((session, index) => (
                    <div key={session.id} className="session-card">
                      <div className="session-card-content">
                        <div className="session-card-header">
                          <h3 className="session-card-title">
                            Session {index + 1}: {session.sessionType}
                          </h3>
                          <span className="session-time-badge">{session.time}</span>
                        </div>
                        <p className="session-card-description">{t('attendance.pleaseConfirm')}</p>

                        {/* Progress Bar */}
                        <div className="session-progress-bar">
                          <div className={`session-progress-fill ${getAttendanceStatus(session.startTime, session.endTime)}`}></div>
                        </div>

                        <div className="session-details">
                          <div className="detail-row detail-row-responsive">
                            <div className="detail-content">
                              <Clock className="detail-icon" />
                              <div>
                                <p className="detail-label">{t('attendance.time')}</p>
                                <p className="detail-value">{session.time}</p>
                              </div>
                            </div>
                            <div className="detail-section">
                              <p className="detail-label">{t('attendance.date')}</p>
                              <p className="detail-value">Today</p>
                            </div>
                          </div>

                          <div className="detail-row">
                            <Users className="detail-icon" />
                            <div className="detail-content">
                              <p className="detail-label">{t('attendance.sessionType')}</p>
                              <p className="detail-value">{session.sessionType}</p>
                            </div>
                          </div>

                          <div className="detail-divider"></div>

                          <div className="detail-row">
                            <FileText className="detail-icon" />
                            <div className="detail-content">
                              <p className="detail-label" style={{ marginBottom: '0.5rem' }}>{t('attendance.description')}</p>
                              <p className="detail-value">{session.description}</p>
                            </div>
                          </div>
                        </div>

                        <div className="status-section">
                          <div className="status-row">
                            <span className="status-label">{t('attendance.status')}:</span>
                            <span className={`status-badge ${getStatusClass(selectedSessions[session.id]?.status || session.status)}`}>
                              {getStatusText(selectedSessions[session.id]?.status || session.status)}
                            </span>
                          </div>

                          {/* Time Status Indicator */}
                          {(() => {
                            const attendanceStatus = getAttendanceStatus(session.startTime, session.endTime);
                            return (
                              <div className={`time-status-indicator ${attendanceStatus}`}>
                                {attendanceStatus === 'present' && `✅ ${t('attendance.onTime')}`}
                                {attendanceStatus === 'grace-period' && `⏰ ${t('attendance.graceActive')}`}
                                {attendanceStatus === 'late' && `⚠️ ${t('attendance.late')}`}
                                {attendanceStatus === 'auto-absent' && `❌ ${t('attendance.ended')}`}
                              </div>
                            );
                          })()}

                          {/* Grace Period Countdown */}
                          {getAttendanceStatus(session.startTime, session.endTime) === 'grace-period' && (
                            <GracePeriodCountdown session={session} />
                          )}

                          {/* Show time-based status information */}
                          {(() => {
                            const timeStatus = getSessionTimeStatus(session);
                            if (timeStatus && !selectedSessions[session.id]) {
                              return (
                                <div className={`alert-box alert-${timeStatus.type}`}>
                                  <AlertCircle className="alert-icon" />
                                  <div className="alert-content">
                                    <p className="alert-title">{t('attendance.sessionTiming')}</p>
                                    <p className="alert-message">{timeStatus.message}</p> 
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {(!selectedSessions[session.id] || selectedSessions[session.id].status === 'not_confirmed') && (() => {
                            const timeStatus = getSessionTimeStatus(session);
                            const attendanceStatus = getAttendanceStatus(session.startTime, session.endTime);
                            const canConfirm = timeStatus?.canConfirm !== false;
                            
                            if (!canConfirm) {
                              return (
                                <div className="status-message status-error">
                                  <div className="status-message-header">
                                    <XCircle className="status-message-icon" />
                                    <p className="status-message-title">{t('attendance.sessionEnded')}</p>
                                  </div>
                                  <p className="status-message-text">{t('attendance.autoMarkedAbsent')}</p>
                                </div>
                              );
                            }

                            return (
                              <>
                                <div className="alert-box alert-warning">
                                  <AlertCircle className="alert-icon" />
                                  <div className="alert-content">
                                    <p className="alert-title">{t('attendance.confirmTitle')}</p>
                                    <p className="alert-message">{t('attendance.confirmMessage')}</p>
                                  </div>
                                </div>

                                <div className="action-buttons">
                                  <button
                                    onClick={() => handleCancel(session.id)}
                                    className="btn btn-cancel"
                                  >
                                    <X className="btn-icon" />
                                    <span className="btn-text">{t('attendance.unableToAttend')}</span>
                                  </button>
                                  <button
                                    onClick={() => handleConfirm(session.id)}
                                    className={`btn btn-confirm ${attendanceStatus === 'grace-period' ? 'grace-period' : ''} ${attendanceStatus === 'late' ? 'late' : ''}`}
                                  >
                                    <Check className="btn-icon" />
                                    <span className="btn-text">
                                      {attendanceStatus === 'late' 
                                        ? t('attendance.confirmLate') 
                                        : attendanceStatus === 'grace-period' 
                                          ? t('attendance.confirmGrace') 
                                          : t('attendance.confirm')}
                                    </span>
                                  </button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="session-card">
                  <div className="session-card-content">
                    <h2 className="session-card-title">{t('attendance.noSessions')}</h2>
                    <p className="session-card-description">{t('attendance.noSessionsDesc')}</p>
                    <div className="alert-box alert-info">
                      <AlertCircle className="alert-icon" />
                      <div className="alert-content">
                        <p className="alert-title">{t('attendance.noSessionsTitle')}</p>
                        <p className="alert-message">{t('attendance.noSessionsMessage')}</p>
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
              <h3 className="monthly-summary-title">{t('attendance.thisMonth')}</h3>
              <div className="monthly-stats" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' }}>
                <div>
                  <p className="monthly-stat-label">{t('attendance.sessions')}</p>
                  <p className="monthly-stat-value">{stats.completedSessions}</p>
                </div>
                <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
                  <p className="monthly-stat-label">{t('attendance.hours')}</p>
                  <p className="monthly-stat-value">{stats.thisMonthHours.toFixed(1)}</p>
                </div>
                <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
                  <p className="monthly-stat-label">{t('attendance.attendanceRate')}</p>
                  <p className="monthly-stat-value">{stats.attendanceRate}%</p>
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="history-list">
              {attendanceHistory.length > 0 ? (
                <>
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
                            <span>{new Date(session.date).toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
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
                              <span className="metric-text">{t('attendance.hoursCompleted', { hours: session.hours.toFixed(1) })}</span>
                            </div>
                          </div>
                        )}

                        {session.notes && (
                          <p className="reason-text">
                            <span className="reason-label">{t('attendance.notes')}: </span>
                            {session.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Load More Button */}
                  {hasMoreHistory && (
                    <div className="load-more">
                      <button 
                        className={`load-more-btn ${historyLoading ? 'loading' : ''}`}
                        onClick={loadMoreHistory}
                        disabled={historyLoading}
                      >
                        {historyLoading ? (
                          <>
                            <div className="loading-spinner"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <span>Load More History</span>
                            <ChevronRight className="load-more-icon" />
                          </>
                        )}
                      </button>
                      <p className="load-more-info">
                        Showing {attendanceHistory.length} of {totalHistoryCount} records
                      </p>
                    </div>
                  )}
                  
                  {!hasMoreHistory && attendanceHistory.length >= RECORDS_PER_PAGE && (
                    <div className="load-more">
                      <p className="all-loaded-text">
                        ✅ All history loaded ({attendanceHistory.length} records)
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="history-item">
                  <p>{t('attendance.noHistory')}</p>
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