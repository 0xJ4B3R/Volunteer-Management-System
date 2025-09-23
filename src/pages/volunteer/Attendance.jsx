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
import { useToast } from "@/components/ui/use-toast";
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
  if (!timeStr) return new Date(0); // Return epoch for null/undefined times

  try {
    const [time, period] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    // Handle invalid time format
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn('Invalid time format:', timeStr);
      return new Date(0);
    }

    if (period?.toLowerCase() === 'pm' && hours !== 12) hours += 12;
    if (period?.toLowerCase() === 'am' && hours === 12) hours = 0;

    const today = new Date();
    const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes || 0);

    return timeDate;
  } catch (error) {
    console.warn('Error parsing time string:', timeStr, error);
    return new Date(0);
  }
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

// Helper function to parse time string and combine with date
const parseTimeAndCombineWithDate = (dateStr, timeStr) => {
  try {
    // Parse date string (format: "YYYY-MM-DD")
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    if (!timeStr) return date;

    // Parse time string (could be "2:00 PM", "14:00", etc.)
    let hours = 0;
    let minutes = 0;

    // Handle AM/PM format
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const timePart = timeStr.replace(/\s*(AM|PM)/i, '');
      const [hourStr, minuteStr = '0'] = timePart.split(':');
      hours = parseInt(hourStr);
      minutes = parseInt(minuteStr);

      // Convert to 24-hour format
      if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
        hours += 12;
      } else if (timeStr.toUpperCase().includes('AM') && hours === 12) {
        hours = 0;
      }
    } else {
      // Handle 24-hour format
      const [hourStr, minuteStr = '0'] = timeStr.split(':');
      hours = parseInt(hourStr);
      minutes = parseInt(minuteStr);
    }

    date.setHours(hours, minutes, 0, 0);
    return date;
  } catch (error) {
    return new Date();
  }
};

// Helper function to check if current time is within valid logging window
const isWithinSessionWindow = (sessionStartTime, sessionEndTime) => {
  const now = new Date();
  const startTime = parseTimeAndCombineWithDate(now.toISOString().split('T')[0], sessionStartTime);
  const endTime = parseTimeAndCombineWithDate(now.toISOString().split('T')[0], sessionEndTime);
  
  // Can log: 1 hour before start up to session end time
  const oneHourBeforeStart = new Date(startTime.getTime() - 60 * 60 * 1000);
  
  return now >= oneHourBeforeStart && now <= endTime;
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

// Helper function to determine attendance status based on timing (for logging)
const getAttendanceLoggingStatus = (sessionStartTime, sessionEndTime) => {
  const now = new Date();
  const startTime = parseTimeAndCombineWithDate(now.toISOString().split('T')[0], sessionStartTime);
  const endTime = parseTimeAndCombineWithDate(now.toISOString().split('T')[0], sessionEndTime);
  
  // Calculate total session duration
  const sessionDuration = endTime.getTime() - startTime.getTime();
  const twentyFivePercentOfSession = sessionDuration * 0.25;
  const twentyFivePercentAfterStart = new Date(startTime.getTime() + twentyFivePercentOfSession);
  
  // If more than 25% of session time has passed after start, mark as late
  if (now > twentyFivePercentAfterStart) {
    return 'late';
  }
  
  return 'present';
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


const usePastSessions = (username, userId) => {
  const [pastSessions, setPastSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volunteer, setVolunteer] = useState(null);

  useEffect(() => {
    const fetchPastSessions = async () => {
      if (!username || !userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get volunteer data
        const volunteersRef = collection(db, "volunteers");
        const volunteerSnapshot = await getDocs(volunteersRef);
        const volunteer = volunteerSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .find(v => v.userId === userId);

        if (!volunteer || !volunteer.appointmentHistory) {
          setPastSessions([]);
          setLoading(false);
          return;
        }

        setVolunteer(volunteer);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter past sessions from appointmentHistory
        const pastSessionsData = volunteer.appointmentHistory
          .filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            appointmentDate.setHours(0, 0, 0, 0);
            return appointmentDate < today;
          })
          .map(appointment => {
            // Parse date and time
            const appointmentDate = new Date(appointment.date);
            const startTime = appointment.startTime || 'TBD';
            const endTime = appointment.endTime || "";
            const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;

            // Format display date
            const displayDate = appointmentDate.toLocaleDateString('he-IL', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });

            return {
              id: appointment.appointmentId,
              time: timeRange,
              date: displayDate,
              residents: appointment.residentIds || [],
              status: 'completed', // Past sessions are always completed
              sessionType: 'General Session',
              sessionCategory: 'general',
              isCustom: false,
              customLabel: null,
              appointmentId: appointment.appointmentId,
              startTime: appointment.startTime,
              endTime: appointment.endTime
            };
          });

        // Sort by date (most recent first)
        pastSessionsData.sort((a, b) => {
          const dateA = new Date(a.appointmentId.split('_')[0]); // Extract date from appointmentId
          const dateB = new Date(b.appointmentId.split('_')[0]);
          return dateB - dateA;
        });

        setPastSessions(pastSessionsData);
      } catch (error) {
        console.error('Error fetching past sessions:', error);
        setPastSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPastSessions();
  }, [username, userId]);

  return {
    pastSessions,
    setPastSessions,
    loading,
    volunteer
  };
};

const useTodaySessions = (username, userId) => {
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volunteer, setVolunteer] = useState(null);

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
          setVolunteer(null);
          return;
        }

        console.log('Found volunteer for attendance:', {
          volunteerId: volunteer.id,
          userId: volunteer.userId,
          fullName: volunteer.fullName,
          appointmentHistoryCount: volunteer.appointmentHistory?.length || 0
        });

        // Store the volunteer object for later use
        setVolunteer(volunteer);

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

        // Build sessions for all today's appointments
        const sessionsWithAttendance = await Promise.all(
          todayAppointments.map(async (appointment) => {
            // Get calendar slot data for this appointment
            const calendarSlot = calendarData[appointment.appointmentId];

            // Determine session type
            let sessionType = 'General Session';
            
            if (calendarSlot) {
              if (calendarSlot.isCustom && calendarSlot.customLabel) {
                sessionType = calendarSlot.customLabel;
              } else if (calendarSlot.sessionCategory) {
                sessionType = calendarSlot.sessionCategory;
              }
            }

            // Check if attendance already exists
            let attendanceRecord = null;
            let sessionStatus = 'not_confirmed';
            
            try {
              const existingAttendanceQuery = query(
                attendanceRef,
                where('appointmentId', '==', appointment.appointmentId),
                where('volunteerId.id', '==', volunteer.id)
              );

              const existingAttendanceSnapshot = await getDocs(existingAttendanceQuery);

              if (!existingAttendanceSnapshot.empty) {
                attendanceRecord = existingAttendanceSnapshot.docs[0].data();
                // Determine status based on attendance record
                if (attendanceRecord.status === 'present' || attendanceRecord.status === 'late') {
                  sessionStatus = 'confirmed';
                } else if (attendanceRecord.status === 'absent') {
                  sessionStatus = 'cancelled';
                }
              }
            } catch (attendanceError) {
              // Fallback check - use volunteer.id instead of userId
              const allAttendanceSnapshot = await getDocs(attendanceRef);
              const existingRecord = allAttendanceSnapshot.docs.find(doc => {
                const data = doc.data();
                return (data.appointmentId === appointment.appointmentId) &&
                  (data.volunteerId?.id === volunteer.id || data.volunteerId === volunteer.id);
              });

              if (existingRecord) {
                attendanceRecord = existingRecord.data();
                if (attendanceRecord.status === 'present' || attendanceRecord.status === 'late') {
                  sessionStatus = 'confirmed';
                } else if (attendanceRecord.status === 'absent') {
                  sessionStatus = 'cancelled';
                }
              }
            }

            return {
              id: appointment.appointmentId,
              time: `${appointment.startTime} - ${appointment.endTime}`,
              residents: appointment.residentIds || calendarSlot?.residentIds || [],
              status: sessionStatus,
              sessionType: sessionType,
              sessionCategory: calendarSlot?.sessionCategory || 'general',
              isCustom: calendarSlot?.isCustom || false,
              customLabel: calendarSlot?.customLabel,
              appointmentId: appointment.appointmentId,
              startTime: appointment.startTime,
              endTime: appointment.endTime,
              attendanceRecord: attendanceRecord
            };
          })
        );

        const availableSessions = sessionsWithAttendance.filter(session => session !== null);

        // Sort by start time
        availableSessions.sort((a, b) => {
          const timeA = parseTimeString(a.startTime);
          const timeB = parseTimeString(b.startTime);
          
          console.log('Sorting sessions:', {
            sessionA: { startTime: a.startTime, parsed: timeA },
            sessionB: { startTime: b.startTime, parsed: timeB },
            comparison: timeA - timeB
          });
          
          return timeA - timeB;
        });

        setTodaySessions(availableSessions);
      } catch (error) {
        console.error('Error fetching today\'s sessions:', error);
        setTodaySessions([]);
        setVolunteer(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySessions();
  }, [username, userId]);

  return { todaySessions, setTodaySessions, loading, volunteer };
};

const useAttendanceHistory = (username, userId) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [allUserRecords, setAllUserRecords] = useState([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const [volunteer, setVolunteer] = useState(null);

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

        console.log('Enriching attendance record:', {
          recordId: record.id,
          appointmentId: record.appointmentId,
          status: record.status,
          appointmentData: appointmentData ? {
            startTime: appointmentData.startTime,
            endTime: appointmentData.endTime,
            customLabel: appointmentData.customLabel
          } : null
        });

        let recordDate;
        if (record.confirmedAt) {
          recordDate = record.confirmedAt.toDate();
        } else if (record.date) {
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

        // Determine session type and title
        let sessionType = 'General Session';
        let title = 'Volunteer Session';
        
        if (appointmentData) {
          if (appointmentData.isCustom && appointmentData.customLabel) {
            sessionType = appointmentData.customLabel;
            title = appointmentData.customLabel;
          } else if (appointmentData.sessionCategory) {
            sessionType = appointmentData.sessionCategory;
            // Use the session category as the title for translation
            title = appointmentData.sessionCategory;
          }
        }

        // Determine the correct status for history display
        let historyStatus = 'completed';
        if (record.status === 'present') {
          historyStatus = 'completed';
        } else if (record.status === 'absent') {
          historyStatus = 'missed';
        } else {
          // Skip records with other statuses - they shouldn't be in history
          return null;
        }

        return {
          id: record.id,
          date: recordDate.toISOString().split('T')[0],
          title: title,
          time: appointmentData ?
            `${appointmentData.startTime} - ${appointmentData.endTime}` :
            record.time || 'Time not available',
          status: historyStatus,
          hours: hours,
          notes: record.notes || '',
          appointmentId: record.appointmentId,
          sessionType: sessionType,
          sessionCategory: appointmentData?.sessionCategory || 'general',
          isCustom: appointmentData?.isCustom || false,
          customLabel: appointmentData?.customLabel,
          source: 'attendance'
        };
      });

      // Filter out null values (records with invalid statuses)
      return enrichedHistory.filter(record => record !== null);
    } catch (error) {
      console.error('Error enriching history data:', error);
      return records;
    }
  };

  const fetchInitialAttendanceHistory = async () => {
    if (!userId && !username) return;

    try {
      // Get volunteer info first
      const volunteerSnapshot = await getDocs(volunteersRef);
      const volunteer = volunteerSnapshot.docs
        .map(doc => docToObject(doc))
        .find(v => v.userId === userId || v.userId === username);

      if (!volunteer) {
        setVolunteer(null);
        return;
      }

      setVolunteer(volunteer);

      console.log('Found volunteer for history:', {
        volunteerId: volunteer.id,
        userId: volunteer.userId,
        fullName: volunteer.fullName
      });

      // Fetch actual attendance records from the attendance collection
      const attendanceQuery = query(
        attendanceRef,
        where('volunteerId.id', '==', volunteer.id)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceRecords = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'attendance'
      }));

      console.log('Found attendance records:', attendanceRecords.length, attendanceRecords);

      // Filter to only include completed or missed sessions
      const validAttendanceRecords = attendanceRecords.filter(record => 
        record.status === 'present' || record.status === 'absent'
      );

      console.log('Valid attendance records:', validAttendanceRecords.length, validAttendanceRecords);

      // Sort records by date (most recent first)
      validAttendanceRecords.sort((a, b) => {
        const dateA = a.confirmedAt?.toDate() || new Date(a.date || 0);
        const dateB = b.confirmedAt?.toDate() || new Date(b.date || 0);
        return dateB - dateA;
      });

      setAllUserRecords(validAttendanceRecords);
      setTotalHistoryCount(validAttendanceRecords.length);

      const initialRecords = validAttendanceRecords.slice(0, RECORDS_PER_PAGE);
      setHasMoreHistory(validAttendanceRecords.length > RECORDS_PER_PAGE);
      setHistoryPage(0);

      const enrichedHistory = await enrichHistoryData(initialRecords);
      setAttendanceHistory(enrichedHistory);

    } catch (error) {
      console.error('Error fetching attendance history:', error);
      setVolunteer(null);
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
    refreshHistory: fetchInitialAttendanceHistory,
    volunteer
  };
};

// Components

const LanguageToggle = ({ i18n, showLangOptions, setShowLangOptions, langToggleRef, setCurrentLanguage, applyLanguageDirection }) => {
  return (
    <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`} ref={langToggleRef}>
      <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
        <Globe className="lang-icon" />
      </button>
      {showLangOptions && (
        <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
          <button onClick={async () => {
            localStorage.setItem('language', 'en');
            await i18n.changeLanguage('en');
            setCurrentLanguage('en');
            applyLanguageDirection('en');
            setShowLangOptions(false);
          }}>
            English
          </button>
          <button onClick={async () => {
            localStorage.setItem('language', 'he');
            await i18n.changeLanguage('he');
            setCurrentLanguage('he');
            applyLanguageDirection('he');
            setShowLangOptions(false);
          }}>
            עברית
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to get translated session type
const getSessionTypeDisplay = (session, t) => {
  if (session.isCustom && session.customLabel) {
    return session.customLabel;
  }
  if (session.sessionCategory) {
    return t(`attendance.sessionCategories.${session.sessionCategory}`) || 
           `${session.sessionCategory.charAt(0).toUpperCase() + session.sessionCategory.slice(1)} Session`;
  }
  return t('attendance.sessionCategories.general') || 'General Session';
};

const SessionCard = ({ session, index, onConfirm, onCancel, t, loadingState }) => {
  const attendanceStatus = getAttendanceStatus(session.startTime, session.endTime);
  const canLogSession = isWithinSessionWindow(session.startTime, session.endTime);

  const getSessionTimeStatus = () => {
    const now = new Date();
    const sessionStart = parseTimeString(session.startTime);

    // Check if session has ended
    if (attendanceStatus === 'ended') {
      return {
        message: t('attendance.timeStatus.sessionEnded'),
        type: 'error',
        canConfirm: false
      };
    }

    // Check if within valid logging window
    if (!canLogSession) {
      const oneHourBeforeStart = new Date(sessionStart.getTime() - 60 * 60 * 1000);
      if (now < oneHourBeforeStart) {
        const minutesUntilWindow = Math.ceil((oneHourBeforeStart - now) / (60 * 1000));
        let timeMessage;
        if (minutesUntilWindow >= 60) {
          const hours = (minutesUntilWindow / 60).toFixed(1);
          timeMessage = `Session starts in ${hours} hour${hours !== '1.0' ? 's' : ''}`;
        } else {
          timeMessage = `Session starts in ${minutesUntilWindow} minute${minutesUntilWindow !== 1 ? 's' : ''}`;
        }
        return {
          message: timeMessage,
          type: 'info',
          canConfirm: false
        };
      } else {
        return {
          message: t('attendance.timeStatus.sessionEnded'),
          type: 'error',
          canConfirm: false
        };
      }
    }

    // Within valid window
    if (attendanceStatus === 'in-progress') {
      return {
        message: t('attendance.timeStatus.sessionInProgress'),
        type: 'info',
        canConfirm: true
      };
    } else if (attendanceStatus === 'upcoming') {
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
    }

    return {
      message: t('attendance.timeStatus.unknownStatus'),
      type: 'info',
      canConfirm: true
    };
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
          <span className="session-card-time">{session.time}</span>
        </div>

        <div className="detail-divider"></div>

        <div className="session-type">
          <span className="session-type-label">{t('attendance.sessionType')}:</span>
          <span className="session-type-value">{getSessionTypeDisplay(session, t)}</span>
        </div>

         {session.status === 'confirmed' ? (
           <div className="status-message status-success">
             <div className="status-message-header">
               <CheckCircle2 className="status-message-icon" />
               <p className="status-message-title">{t('attendance.attendanceConfirmed')}</p>
             </div>
             <p className="status-message-text">{t('attendance.youAttended')}</p>
           </div>
         ) : session.status === 'cancelled' ? (
           <div className="status-message status-warning">
             <div className="status-message-header">
               <XCircle className="status-message-icon" />
               <p className="status-message-title">{t('attendance.attendanceCancelled')}</p>
             </div>
             <p className="status-message-text">{t('attendance.youCancelled')}</p>
           </div>
         ) : !canConfirm ? (
           <div className="status-message status-error">
             <div className="status-message-header">
               <XCircle className="status-message-icon" />
               <p className="status-message-title">{t('attendance.sessionEnded')}</p>
             </div>
             <p className="status-message-text">{t('attendance.cannotConfirm')}</p>
           </div>
         ) : (
           <>
             <div className="status-message status-info">
               <div className="status-message-header">
                 <AlertCircle className="status-message-icon" />
                 <p className="status-message-title">{t('attendance.confirmTitle')}</p>
               </div>
               <p className="status-message-text">{t('attendance.confirmMessage')}</p>
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
  );
};

const PastSessionCard = ({ session, index, t }) => {
  const getSessionTypeDisplay = (session, t) => {
    if (session.isCustom && session.customLabel) {
      return session.customLabel;
    }
    return t(`attendance.sessionCategories.${session.sessionCategory || 'general'}`);
  };

  return (
    <div className="session-card">
      <div className="session-card-content">
        <div className="session-card-header">
          <h3 className="session-card-title">{t('attendance.session')} {index + 1}</h3>
          <div className="session-time-date">
            <span className="session-card-time">{session.time}</span>
            <span className="session-card-date">{session.date}</span>
          </div>
        </div>
        
        <div className="session-type">
          <span className="session-type-label">{t('attendance.sessionType')}:</span>
          <span className="session-type-value">{getSessionTypeDisplay(session, t)}</span>
        </div>

        {/* Status message for completed sessions */}
        <div className="status-message status-success">
          <div className="status-message-header">
            <CheckCircle2 className="status-message-icon" />
            <p className="status-message-title">{t('attendance.sessionCompleted')}</p>
          </div>
          <p className="status-message-text">{t('attendance.sessionCompletedDesc')}</p>
        </div>
      </div>
    </div>
  );
};

const HistoryItem = ({ session, t, i18n }) => {
  const getSessionTypeDisplay = (session, t) => {
    if (session.isCustom && session.customLabel) {
      return session.customLabel;
    }
    if (session.sessionCategory) {
      return t(`attendance.sessionCategories.${session.sessionCategory}`) || 
             `${session.sessionCategory.charAt(0).toUpperCase() + session.sessionCategory.slice(1)} Session`;
    }
    return t('attendance.sessionCategories.general') || 'General Session';
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
          <h3 className="history-item-title">
            {session.isCustom && session.customLabel 
              ? session.customLabel 
              : t('attendance.sessionCategories.' + (session.sessionCategory || 'general')) || session.title
            }
          </h3>
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
                  : t('attendance.hoursCompleted', { hours: session.hours.toFixed(2).replace(/\.?0+$/, '') })
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
  const [activeTab, setActiveTab] = useState('today');
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [loadingStates, setLoadingStates] = useState({});
  const langToggleRef = useRef(null);

  // Custom hooks
  const { username, userId } = useAuth();
  const { toast } = useToast();
  const { todaySessions, setTodaySessions, loading, volunteer: todayVolunteer } = useTodaySessions(username, userId);
  const { pastSessions, loading: pastLoading } = usePastSessions(username, userId);
  const {
    attendanceHistory,
    historyLoading,
    hasMoreHistory,
    totalHistoryCount,
    loadMoreHistory,
    refreshHistory,
    volunteer: historyVolunteer
  } = useAttendanceHistory(username, userId);

  // Use the volunteer from today's sessions as the primary volunteer object
  const volunteer = todayVolunteer || historyVolunteer;

  // Robust language direction management
  const applyLanguageDirection = (lang) => {
    const dir = lang === 'he' ? 'rtl' : 'ltr';

    // 1. Set the dir attribute on html element
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);

    // 2. Remove any stale RTL/LTR classes
    document.body.classList.remove('rtl', 'ltr');
    document.documentElement.classList.remove('rtl', 'ltr');

    // 3. Add the correct direction class
    document.body.classList.add(dir);
    document.documentElement.classList.add(dir);

    // 4. Set CSS direction property explicitly
    document.body.style.direction = dir;
    document.documentElement.style.direction = dir;

    // 5. Remove any conflicting inline styles
    const rootElements = document.querySelectorAll('[style*="direction"]');
    rootElements.forEach(el => {
      if (el !== document.body && el !== document.documentElement) {
        el.style.direction = '';
      }
    });
  };

  useEffect(() => {
    applyLanguageDirection(currentLanguage);
  }, [currentLanguage]);

  // Sync currentLanguage with i18n.language
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      setCurrentLanguage(i18n.language);
    }
  }, [i18n.language, currentLanguage]);

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

    // Check if volunteer object is available
    if (!volunteer) {
      toast({ 
  title: t('attendance.notifications.volunteerInfoNotAvailable'), 
  variant: "destructive" 
});
      return;
    }

    console.log('Confirming attendance with volunteer ID:', volunteer.id, 'for session:', sessionId);

    // Set loading state for this session
    setLoadingStates(prev => ({ ...prev, [sessionId]: 'confirming' }));

    try {
      const [startTime, endTime] = session.time.split(' - ');
      const canLogSession = isWithinSessionWindow(startTime, endTime);

      if (!canLogSession) {
        toast({ 
  title: t('attendance.notifications.sessionAlreadyEnded'), 
  variant: "destructive" 
});
        return;
      }

      // Check for existing attendance record
      const existingQuery = query(
        attendanceRef,
        where('appointmentId', '==', session.appointmentId || session.id),
        where('volunteerId.id', '==', volunteer.id)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        toast({ 
  title: t('attendance.notifications.attendanceAlreadyRecorded'), 
  variant: "default" 
});
        setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
        return;
      }

      // Determine attendance status based on timing
      const attendanceStatus = getAttendanceLoggingStatus(startTime, endTime);
      
      // Create attendance record with appropriate status
      const attendanceData = {
        appointmentId: session.appointmentId || session.id,
        volunteerId: { id: volunteer.id, type: 'volunteer' },
        status: attendanceStatus,
        confirmedBy: 'volunteer',
        confirmedAt: Timestamp.now(),
        notes: `Session logged by volunteer at ${new Date().toLocaleTimeString()}`
      };

      console.log('Creating attendance record:', attendanceData);
      await addDoc(attendanceRef, attendanceData);

      // Show appropriate notification based on status
      const notificationTitle = attendanceStatus === 'late' 
        ? t('attendance.notifications.attendanceConfirmedLate')
        : t('attendance.notifications.attendanceConfirmed');
        
      toast({ 
        title: notificationTitle, 
        variant: "default" 
      });
      setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
      await refreshHistory();

    } catch (error) {
      console.error('Error confirming attendance:', error);
      toast({ 
  title: t('attendance.notifications.errorConfirmingAttendance'), 
  variant: "destructive" 
});
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleCancel = async (sessionId) => {
    const session = todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    // Check if volunteer object is available
    if (!volunteer) {
      toast({ 
  title: t('attendance.notifications.volunteerInfoNotAvailable'), 
  variant: "destructive" 
});
      return;
    }

    console.log('Cancelling attendance with volunteer ID:', volunteer.id, 'for session:', sessionId);

    // Set loading state for this session
    setLoadingStates(prev => ({ ...prev, [sessionId]: 'cancelling' }));

    try {
      const [startTime, endTime] = session.time.split(' - ');
      const canLogSession = isWithinSessionWindow(startTime, endTime);

      if (!canLogSession) {
        toast({ 
  title: t('attendance.notifications.sessionAlreadyEnded'), 
  variant: "destructive" 
});
        return;
      }

      // Check for existing attendance record
      const existingQuery = query(
        attendanceRef,
        where('appointmentId', '==', session.appointmentId || session.id),
        where('volunteerId.id', '==', volunteer.id)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        toast({ 
  title: t('attendance.notifications.attendanceAlreadyRecorded'), 
  variant: "default" 
});
        setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
        return;
      }

      // Create attendance record with absent status
      const attendanceData = {
        appointmentId: session.appointmentId || session.id,
        volunteerId: { id: volunteer.id, type: 'volunteer' },
        status: 'absent',
        confirmedBy: 'volunteer',
        confirmedAt: Timestamp.now(),
        notes: `Session cancelled by volunteer at ${new Date().toLocaleTimeString()}`
      };

      console.log('Creating attendance record:', attendanceData);
      await addDoc(attendanceRef, attendanceData);

      toast({ 
  title: t('attendance.notifications.markedAsUnableToAttend'), 
  variant: "default" 
});
      setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
      await refreshHistory();

    } catch (error) {
      console.error('Error cancelling attendance:', error);
      toast({ 
  title: t('attendance.notifications.errorCancellingAttendance'), 
  variant: "destructive" 
});
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

        <div className="attendance-wrapper">
          {/* Header */}
          <div className="profile-header">
            <h1 className="profile-title">{t('attendance.title')}</h1>
            <p className="profile-subtitle">{t('attendance.subtitle')}</p>
          </div>

          {/* Tab Navigation */}
          <div className="profile-tabs">
            <div className="tabs">
              {["today", "history"].map((key) => (
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
          {activeTab === 'today' && (
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
                      <div className="status-message status-info">
                        <div className="status-message-header">
                          <AlertCircle className="status-message-icon" />
                          <p className="status-message-title">{t('attendance.noSessionsTitle')}</p>
                        </div>
                        <p className="status-message-text">{t('attendance.noSessionsMessage')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="responsive-content-grid">
              <div className="main-session-area">
                {pastSessions.length > 0 ? (
                  <div className="sessions-container">
                    <h2 className="sessions-title">
                      {t('attendance.pastSessions')} ({pastSessions.length})
                    </h2>
                    {pastSessions.map((session, index) => (
                      <PastSessionCard
                        key={session.id}
                        session={session}
                        index={index}
                        t={t}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="session-card">
                    <div className="session-card-content">
                      <h2 className="session-card-title">{t('attendance.noPastSessions')}</h2>
                      <p className="session-card-description">{t('attendance.noPastSessionsDesc')}</p>
                      <div className="status-message status-info">
                        <div className="status-message-header">
                          <AlertCircle className="status-message-icon" />
                          <p className="status-message-title">{t('attendance.noPastSessionsTitle')}</p>
                        </div>
                        <p className="status-message-text">{t('attendance.noPastSessionsMessage')}</p>
                      </div>
                    </div>
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
        setCurrentLanguage={setCurrentLanguage}
        applyLanguageDirection={applyLanguageDirection}
      />
    </Layout>
  );
};

export default Attendance; 