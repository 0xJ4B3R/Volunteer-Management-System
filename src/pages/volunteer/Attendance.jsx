import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Globe, Clock, Users, Check, X, AlertCircle, TrendingUp, Award, 
  FileText, CheckCircle2, XCircle, History, CalendarDays, 
  CalendarClock, ChevronRight 
} from 'lucide-react';
import { 
  collection, getDocs, query, where, orderBy, limit, doc, 
  updateDoc, addDoc, Timestamp 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/volunteer/Layout';
import LoadingScreen from '@/components/volunteer/InnerLS';
import './styles/Attendance.css';

// Import proper Firestore collection references
import { 
  calendar_slotsRef, 
  attendanceRef, 
  volunteersRef,
  docToObject
} from '@/services/firestore';

// Constants
  const RECORDS_PER_PAGE = 5;

// Helper Functions
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

const getHoursFromTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) {
    console.log('Missing time data:', { startTime, endTime });
    return 0;
  }
  
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    
    // Handle different time formats
    let time = timeStr.trim();
    let period = '';
    
    // Check if it has AM/PM
    if (time.includes('AM') || time.includes('PM')) {
      const parts = time.split(' ');
      time = parts[0];
      period = parts[1];
    }
    
    // Parse hours and minutes
    const [hours, minutes] = time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      console.log('Invalid time format:', timeStr);
      return 0;
    }
    
    let totalHours = hours;
    
    // Handle AM/PM conversion
    if (period) {
      if (period.toLowerCase() === 'pm' && hours !== 12) {
        totalHours = hours + 12;
      } else if (period.toLowerCase() === 'am' && hours === 12) {
        totalHours = 0;
      }
    }
    
    return totalHours + (minutes || 0) / 60;
  };

  try {
    console.log('Calculating hours for:', { startTime, endTime });
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const hours = Math.max(0, end - start);
    console.log('Calculated hours:', hours);
    return hours;
  } catch (error) {
    console.error('Error parsing time range:', error, { startTime, endTime });
    return 0;
  }
};

  const getAttendanceStatus = (startTime, endTime) => {
    const now = new Date();
    const sessionStart = parseTimeString(startTime);
    const sessionEnd = parseTimeString(endTime);
    
  if (!sessionStart || !sessionEnd) return 'present';
    
    if (now > sessionEnd) {
    return 'ended';
    } else if (now > sessionStart) {
    return 'in-progress';
    } else {
    return 'upcoming';
  }
};

// Custom Hooks
const useAuth = () => {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      if (!user.username) {
        navigate("/login");
      } else if (user.role !== "volunteer") {
        navigate("/manager");
      } else {
        setUsername(user.username);
        setUserId(user.id || user.uid);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/login");
    }
  }, [navigate]);

  return { username, userId };
};

const useNotifications = () => {
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

  return { notification, showNotification };
};

const useTodaySessions = (username, userId) => {
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaySessions = async () => {
      if (!username || !userId) return;

      try {
        setLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get volunteer's appointmentHistory
        const volunteerSnapshot = await getDocs(volunteersRef);
        const volunteer = volunteerSnapshot.docs
          .map(doc => docToObject(doc))
          .find(v => v.userId === userId || v.userId === username);

        if (!volunteer || !volunteer.appointmentHistory) {
          setTodaySessions([]);
          return;
        }

        // Filter today's sessions from appointmentHistory
        const todayAppointments = volunteer.appointmentHistory.filter(appointment => {
          const appointmentDate = new Date(appointment.date);
          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate.getTime() === today.getTime();
        });

        if (todayAppointments.length === 0) {
          setTodaySessions([]);
          return;
        }

        // Get calendar slot data for enrichment
        const calendarSnapshot = await getDocs(calendar_slotsRef);
        const calendarData = {};
        calendarSnapshot.docs.forEach(doc => {
          const data = docToObject(doc);
          calendarData[data.appointmentId || doc.id] = data;
        });

        // Check attendance records and build sessions
          const sessionsWithAttendance = await Promise.all(
          todayAppointments.map(async (appointment) => {
              try {
              // Check if attendance already exists
                const existingAttendanceQuery = query(
                  attendanceRef,
                where('appointmentId', '==', appointment.appointmentId),
                where('volunteerId.id', '==', userId)
                );
                
                const existingAttendanceSnapshot = await getDocs(existingAttendanceQuery);
                
                if (!existingAttendanceSnapshot.empty) {
                return null; // Skip if attendance already exists
                }
              } catch (attendanceError) {
              // Fallback check
              const allAttendanceSnapshot = await getDocs(attendanceRef);
                const existingRecord = allAttendanceSnapshot.docs.find(doc => {
                  const data = doc.data();
                return (data.appointmentId === appointment.appointmentId) &&
                       (data.volunteerId?.id === userId || data.volunteerId === userId);
                });
                
                if (existingRecord) {
                  return null;
                }
              }
              
            // Get calendar slot data for this appointment
            const calendarSlot = calendarData[appointment.appointmentId];
            
              return {
              id: appointment.appointmentId,
              time: `${appointment.startTime} - ${appointment.endTime}`,
              residents: appointment.residentIds || calendarSlot?.residentIds || [],
              description: calendarSlot?.notes || 'Volunteer session with residents',
                status: 'not_confirmed',
              sessionType: calendarSlot?.isCustom ? calendarSlot.customLabel : 'General Session',
              date: appointment.date,
              appointmentId: appointment.appointmentId,
              startTime: appointment.startTime,
              endTime: appointment.endTime
              };
            })
          );

          const availableSessions = sessionsWithAttendance.filter(session => session !== null);
          
        // Sort by start time
          availableSessions.sort((a, b) => {
            const timeA = parseTimeString(a.startTime);
            const timeB = parseTimeString(b.startTime);
            return timeA - timeB;
          });

          setTodaySessions(availableSessions);
      } catch (error) {
        console.error('Error fetching today\'s sessions:', error);
        setTodaySessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySessions();
  }, [username, userId]);

  return { todaySessions, setTodaySessions, loading };
};

const useAttendanceHistory = (username, userId) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [allUserRecords, setAllUserRecords] = useState([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);

  const enrichHistoryData = async (records) => {
    try {
      const calendarSnapshot = await getDocs(calendar_slotsRef);
      const calendarData = {};
      
      calendarSnapshot.docs.forEach(doc => {
        const data = docToObject(doc);
        const appointmentId = data.appointmentId || doc.id;
        calendarData[appointmentId] = {
          ...data,
          id: doc.id
        };
      });

      const enrichedHistory = records.map(record => {
        const appointmentData = calendarData[record.appointmentId];
        
        console.log('Enriching appointmentHistory record:', {
          recordId: record.id,
          appointmentId: record.appointmentId,
          appointmentData: appointmentData ? {
            startTime: appointmentData.startTime,
            endTime: appointmentData.endTime,
            customLabel: appointmentData.customLabel
          } : null,
          recordData: {
            startTime: record.startTime,
            endTime: record.endTime,
            time: record.time
          }
        });
        
        let recordDate;
        if (record.date) {
          recordDate = new Date(record.date);
        } else {
          recordDate = new Date();
        }
        
        // Calculate hours - try multiple sources
        let hours = 0;
        if (appointmentData?.startTime && appointmentData?.endTime) {
          hours = getHoursFromTimeRange(appointmentData.startTime, appointmentData.endTime);
          console.log('Hours from appointmentData:', hours);
        } else if (record.startTime && record.endTime) {
          hours = getHoursFromTimeRange(record.startTime, record.endTime);
          console.log('Hours from record data:', hours);
        } else if (record.time) {
          // Try to parse from time string like "9:00 AM - 11:00 AM"
          const timeParts = record.time.split(' - ');
          if (timeParts.length === 2) {
            hours = getHoursFromTimeRange(timeParts[0], timeParts[1]);
            console.log('Hours from time string:', hours);
          }
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
                record.time || 'Time not available',
          status: record.status || 'completed',
          hours: hours,
          notes: record.notes || '',
          appointmentId: record.appointmentId,
          source: 'appointmentHistory'
        };
      });
      
      return enrichedHistory;
    } catch (error) {
      console.error('Error enriching history data:', error);
      return records;
    }
  };

  const fetchInitialAttendanceHistory = async () => {
    if (!userId && !username) return;

    try {
      // ONLY fetch from volunteer's appointmentHistory
      const volunteerSnapshot = await getDocs(volunteersRef);
      let appointmentHistoryRecords = [];
      
      const volunteer = volunteerSnapshot.docs
        .map(doc => docToObject(doc))
        .find(v => v.userId === userId || v.userId === username);
      
      if (volunteer && volunteer.appointmentHistory) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        console.log('Fetching history from volunteer appointmentHistory:', {
          volunteerId: volunteer.id,
          appointmentHistoryCount: volunteer.appointmentHistory.length,
          appointmentHistory: volunteer.appointmentHistory
        });
        
        appointmentHistoryRecords = volunteer.appointmentHistory
          .filter(appointment => {
            // Filter out upcoming sessions - only include past/completed sessions
            const appointmentDate = new Date(appointment.date);
            appointmentDate.setHours(0, 0, 0, 0);
            return appointmentDate < today || appointment.status === 'completed';
          })
          .map(appointment => ({
            id: `appointment-${appointment.appointmentId}`,
            appointmentId: appointment.appointmentId,
            date: appointment.date,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            time: `${appointment.startTime} - ${appointment.endTime}`,
            status: appointment.status || 'completed',
            notes: '',
            source: 'appointmentHistory',
            sortDate: new Date(appointment.date)
          }));
      }

      // Sort records by date (most recent first)
      appointmentHistoryRecords.sort((a, b) => {
        return b.sortDate - a.sortDate;
      });

      setAllUserRecords(appointmentHistoryRecords);
      setTotalHistoryCount(appointmentHistoryRecords.length);
      
      const initialRecords = appointmentHistoryRecords.slice(0, RECORDS_PER_PAGE);
      setHasMoreHistory(appointmentHistoryRecords.length > RECORDS_PER_PAGE);
      setHistoryPage(0);
      
      const enrichedHistory = await enrichHistoryData(initialRecords);
      setAttendanceHistory(enrichedHistory);
      
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const loadMoreHistory = async () => {
    if (historyLoading || !hasMoreHistory) return;

    setHistoryLoading(true);
    
    try {
      const nextPage = historyPage + 1;
      const startIndex = nextPage * RECORDS_PER_PAGE;
      const endIndex = startIndex + RECORDS_PER_PAGE;
      
      const nextPageRecords = allUserRecords.slice(startIndex, endIndex);
      
      if (nextPageRecords.length > 0) {
        const enrichedNewRecords = await enrichHistoryData(nextPageRecords);
        
        setAttendanceHistory(prev => [...prev, ...enrichedNewRecords]);
        setHistoryPage(nextPage);
        
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

  useEffect(() => {
    if (userId || username) {
      fetchInitialAttendanceHistory();
    }
  }, [userId, username]);

        return {
    attendanceHistory,
    historyLoading,
    hasMoreHistory,
    totalHistoryCount,
    loadMoreHistory,
    refreshHistory: fetchInitialAttendanceHistory
  };
};

// Components
const NotificationToast = ({ notification, onClose }) => {
  if (!notification.show) return null;
    
    return (
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
          onClick={onClose}
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
  );
};

const LanguageToggle = ({ i18n, showLangOptions, setShowLangOptions, langToggleRef }) => {
  return (
    <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`} ref={langToggleRef}>
          <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
        <Globe className="lang-icon" />
          </button>
          {showLangOptions && (
            <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
                              <button onClick={() => { 
                  localStorage.setItem('language', 'en');
                  i18n.changeLanguage('en').then(() => {
                    document.documentElement.dir = 'ltr';
                  });
                  setShowLangOptions(false); 
          }}>
            English
          </button>
                <button onClick={() => { 
                  localStorage.setItem('language', 'he');
                  i18n.changeLanguage('he').then(() => {
                    document.documentElement.dir = 'rtl';
                  });
                  setShowLangOptions(false); 
          }}>
            עברית
          </button>
            </div>
          )}
        </div>
  );
};

const SessionCard = ({ session, index, onConfirm, onCancel, t, loadingState }) => {
  const attendanceStatus = getAttendanceStatus(session.startTime, session.endTime);
  
  const getSessionTimeStatus = () => {
    const now = new Date();
    const sessionStart = parseTimeString(session.startTime);
    
    switch (attendanceStatus) {
      case 'ended':
        return {
          message: 'Session has ended',
          type: 'error',
          canConfirm: false
        };
      case 'in-progress':
        return {
          message: 'Session is currently in progress',
          type: 'info',
          canConfirm: true
        };
      case 'upcoming':
        const minutesUntilStart = Math.ceil((sessionStart - now) / (60 * 1000));
        let timeMessage;
        if (minutesUntilStart >= 60) {
          const hours = (minutesUntilStart / 60).toFixed(1);
          timeMessage = `Session starts in ${hours} hour${hours !== '1.0' ? 's' : ''}`;
        } else {
          timeMessage = `Session starts in ${minutesUntilStart} minute${minutesUntilStart !== 1 ? 's' : ''}`;
        }
        return {
          message: timeMessage,
          type: 'info',
          canConfirm: true
        };
      default:
        return {
          message: 'Unknown status',
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
      ended: 'status-ended',
      'in-progress': 'status-in-progress',
      upcoming: 'status-upcoming',
      present: 'status-attended',
      absent: 'status-missed',
      late: 'status-late'
    };
    return statusClasses[status] || '';
  };

  const getStatusText = (status) => {
    return t(`attendance.statuses.${status}`) || status;
  };

  const timeStatus = getSessionTimeStatus();
  const canConfirm = timeStatus?.canConfirm !== false;

  return (
    <div className="session-card">
                        <div className="session-card-content">
                          <div className="session-card-header">
                            <h3 className="session-card-title">
            {t('attendance.sessionNumber', { number: index + 1 })}
                            </h3>
                            <span className="session-time-badge">{session.time}</span>
                          </div>

        <div className="detail-divider"></div>

                          <div className="session-details">
                          </div>

                          <div className="status-section">
                            <div className="status-row">
                              <span className="status-label">{t('attendance.status')}:</span>
            <span className={`status-badge ${getStatusClass(session.status)}`}>
              {getStatusText(session.status)}
                              </span>
                            </div>

          {timeStatus && (
                                  <div className={`alert-box alert-${timeStatus.type}`}>
                                    <AlertCircle className="alert-icon" />
                                    <div className="alert-content">
                                      <p className="alert-title">{t('attendance.sessionTiming')}</p>
                                      <p className="alert-message">{timeStatus.message}</p> 
                                    </div>
                                  </div>
          )}

          {!canConfirm ? (
                                  <div className="status-message status-error">
                                    <div className="status-message-header">
                                      <XCircle className="status-message-icon" />
                                      <p className="status-message-title">{t('attendance.sessionEnded')}</p>
                                    </div>
              <p className="status-message-text">{t('attendance.cannotConfirm')}</p>
                                  </div>
          ) : (
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
                                      onClick={() => onCancel(session.id)}
                                      className="btn btn-cancel"
                                      disabled={loadingState}
                                    >
                                      {loadingState === 'cancelling' ? (
                                        <>
                                          <div className="loading-spinner"></div>
                                          <span className="btn-text">{t('attendance.cancelling')}</span>
                                        </>
                                      ) : (
                                        <>
                                      <X className="btn-icon" />
                                      <span className="btn-text">{t('attendance.unableToAttend')}</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => onConfirm(session.id)}
                                      className="btn btn-confirm"
                                      disabled={loadingState}
                                    >
                                      {loadingState === 'confirming' ? (
                                        <>
                                          <div className="loading-spinner"></div>
                                          <span className="btn-text">{t('attendance.confirming')}</span>
                                        </>
                                      ) : (
                                        <>
                                      <Check className="btn-icon" />
                                          <span className="btn-text">{t('attendance.confirm')}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </>
          )}
        </div>
      </div>
    </div>
  );
};

const HistoryItem = ({ session, t, i18n }) => {
  const getStatusClass = (status) => {
    const statusClasses = {
      not_confirmed: 'status-not-confirmed',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled',
      ended: 'status-ended',
      'in-progress': 'status-in-progress',
      upcoming: 'status-upcoming',
      present: 'status-attended',
      absent: 'status-missed',
      completed: 'status-completed',
      approved: 'status-approved',
      pending: 'status-pending',
      rejected: 'status-rejected'
    };
    return statusClasses[status] || '';
  };

  const getStatusText = (status) => {
    return t(`attendance.statuses.${status}`) || status;
  };

  return (
    <div className="history-item">
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

        {(session.status === 'present' || session.status === 'completed') && (
          <div className="history-metrics">
            <div className="metric-item">
              <TrendingUp className="metric-icon" />
              <span className="metric-text">
                {session.hours < 1 
                  ? t('attendance.minutesCompleted', { minutes: Math.round(session.hours * 60) })
                  : t('attendance.hoursCompleted', { hours: session.hours.toFixed(1) })
                }
              </span>
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
  );
};

// Main Component
const Attendance = () => {
  const { t, i18n } = useTranslation('attendance');
  const [activeTab, setActiveTab] = useState('Today');
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const langToggleRef = useRef(null);

  // Custom hooks
  const { username, userId } = useAuth();
  const { notification, showNotification } = useNotifications();
  const { todaySessions, setTodaySessions, loading } = useTodaySessions(username, userId);
  const { 
    attendanceHistory, 
    historyLoading, 
    hasMoreHistory, 
    totalHistoryCount, 
    loadMoreHistory, 
    refreshHistory 
  } = useAttendanceHistory(username, userId);

  // Set RTL/LTR based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === "he" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Handle click outside language toggle to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langToggleRef.current && !langToggleRef.current.contains(event.target)) {
        setShowLangOptions(false);
      }
    };

    if (showLangOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangOptions]);

  // Attendance handlers
  const handleConfirm = async (sessionId) => {
    const session = todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    // Set loading state for this session
    setLoadingStates(prev => ({ ...prev, [sessionId]: 'confirming' }));

    try {
      const [startTime, endTime] = session.time.split(' - ');
      const attendanceStatus = getAttendanceStatus(startTime, endTime);
      
      if (attendanceStatus === 'ended') {
        showNotification('Cannot confirm attendance - the session has already ended.', 'error');
        return;
      }

      // Check for existing attendance record
      const existingQuery = query(
        attendanceRef,
        where('appointmentId', '==', session.appointmentId || session.id),
        where('volunteerId.id', '==', userId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        showNotification('Attendance already recorded for this session.', 'warning');
        setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
        return;
      }

      // Create attendance record with present status
      const attendanceData = {
        appointmentId: session.appointmentId || session.id,
        volunteerId: { id: userId, type: 'volunteer' },
        status: 'present',
        confirmedBy: 'volunteer',
        confirmedAt: Timestamp.now(),
        notes: 'Attendance confirmed by volunteer'
      };

      console.log('Creating attendance record:', attendanceData);
      await addDoc(attendanceRef, attendanceData);
      
      showNotification('Attendance confirmed successfully!', 'success');      
      setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
      await refreshHistory();
      
    } catch (error) {
      console.error('Error confirming attendance:', error);
      showNotification('Error confirming attendance. Please try again.', 'error');
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleCancel = async (sessionId) => {
    const session = todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    // Set loading state for this session
    setLoadingStates(prev => ({ ...prev, [sessionId]: 'cancelling' }));

    try {
      // Check for existing attendance record
      const existingQuery = query(
        attendanceRef,
        where('appointmentId', '==', session.appointmentId || session.id),
        where('volunteerId.id', '==', userId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        showNotification('Attendance already recorded for this session.', 'warning');
        setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
        return;
      }

      // Create attendance record with absent status
      const attendanceData = {
        appointmentId: session.appointmentId || session.id,
        volunteerId: { id: userId, type: 'volunteer' },
        status: 'absent',
        confirmedBy: 'volunteer',
        confirmedAt: Timestamp.now(),
        notes: 'Unable to attend - cancelled by volunteer'
      };

      console.log('Creating attendance record:', attendanceData);
      await addDoc(attendanceRef, attendanceData);
      
      showNotification('Marked as unable to attend.', 'info');  
      setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
      await refreshHistory();
      
    } catch (error) {
      console.error('Error cancelling attendance:', error);
      showNotification('Error cancelling attendance. Please try again.', 'error');
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  // Calculate stats
  const stats = useMemo(() => ({
    totalHours: attendanceHistory.reduce((sum, session) => 
      sum + ((session.status === 'present' || session.status === 'completed') ? session.hours : 0), 0
    ),
    completedSessions: attendanceHistory.filter(session => 
      session.status === 'present' || session.status === 'completed'
    ).length,
    attendanceRate: attendanceHistory.length > 0 
      ? ((attendanceHistory.filter(session => session.status === 'present' || session.status === 'completed').length / attendanceHistory.length) * 100).toFixed(1)
      : 0,
    thisMonthHours: attendanceHistory
      .filter(session => {
        const sessionDate = new Date(session.date);
        const now = new Date();
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear() &&
               (session.status === 'present' || session.status === 'completed');
      })
      .reduce((sum, session) => sum + session.hours, 0)
  }), [attendanceHistory]);

  // Tab icon helper
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <div className="attendance-container" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <NotificationToast 
          notification={notification} 
          onClose={() => showNotification("", "")} 
        />

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
                      <SessionCard
                        key={session.id}
                        session={session}
                        index={index}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                        t={t}
                        loadingState={loadingStates[session.id]}
                      />
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
                      <HistoryItem
                        key={session.id}
                        session={session}
                        t={t}
                        i18n={i18n}
                      />
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
                              <span>{t('attendance.loading')}</span>
                            </>
                          ) : (
                            <>
                              <span>{t('attendance.loadMoreHistory')}</span>
                              <ChevronRight className="load-more-icon" />
                            </>
                          )}
                        </button>
                        <p className="load-more-info">
                          {t('attendance.showingRecords', { count: attendanceHistory.length, total: totalHistoryCount })}
                        </p>
                      </div>
                    )}
                    
                    {!hasMoreHistory && attendanceHistory.length >= RECORDS_PER_PAGE && (
                      <div className="load-more">
                        <p className="all-loaded-text">
                          ✅ {t('attendance.allHistoryLoaded', { count: attendanceHistory.length })}
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
      <LanguageToggle 
        i18n={i18n}
        showLangOptions={showLangOptions}
        setShowLangOptions={setShowLangOptions}
        langToggleRef={langToggleRef}
      />
    </Layout>
  );
};

export default Attendance;