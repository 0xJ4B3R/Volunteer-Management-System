import React, { useState, useEffect } from 'react';
import { Globe, Clock, Users, Check, X, AlertCircle, TrendingUp, Award, FileText, CheckCircle2, XCircle, History, CalendarDays, CalendarClock, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { Layout } from "@/components/volunteer/layout"
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
  const { t, i18n } = useTranslation("attendance");
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Pagination state for history
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [allUserRecords, setAllUserRecords] = useState([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);

  const RECORDS_PER_PAGE = 25;

  // Helper function to translate session types and categories
  const translateSessionType = (sessionType, sessionCategory) => {
    if (!sessionType && !sessionCategory) return t('sessionTypes.session', 'Session');

    // Priority: sessionCategory > customLabel > sessionType
    const typeToTranslate = sessionCategory || sessionType;
    
    if (!typeToTranslate) return t('sessionTypes.session', 'Session');

    // Handle common session type/category variations
    const type = typeToTranslate.toLowerCase().trim();

    // Map variations to standard keys for translation
    const typeMapping = {
      'general session': 'session',
      'volunteer session': 'session',
      'regular session': 'session',
      'default': 'session',
      'art': 'art',
      'baking': 'baking',
      'gardening': 'gardening',
      'music': 'music',
      'beading': 'beading',
    };

    const mappedType = typeMapping[type] || type.replace(/\s+/g, '').replace(/[^a-zA-Z]/g, '');
    return t(`sessionTypes.${mappedType}`, typeToTranslate); // Fallback to original if translation not found
  };

  // Function to show notifications
  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
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

  // Helper function to check if session is within time window
  const isSessionInTimeWindow = (startTime, endTime, windowMinutes = 30) => {
    const now = new Date();
    const sessionStart = parseTimeString(startTime);
    const sessionEnd = parseTimeString(endTime);
    
    if (!sessionStart || !sessionEnd) return false;

    // Calculate time differences in minutes
    const minutesToStart = (sessionStart - now) / (1000 * 60);
    const minutesSinceStart = (now - sessionStart) / (1000 * 60);
    const minutesToEnd = (sessionEnd - now) / (1000 * 60);

    // Show session if:
    // 1. Starts within the next window minutes
    // 2. Started within the last 15 minutes (grace period)
    // 3. Is currently ongoing
    return (minutesToStart <= windowMinutes && minutesToStart >= -15) || 
           (minutesToEnd > 0 && minutesSinceStart >= 0);
  };

  // Updated function to determine attendance status with 15-minute grace period
  const getAttendanceStatus = (startTime, endTime) => {
    const now = new Date();
    const sessionStart = parseTimeString(startTime);
    const sessionEnd = parseTimeString(endTime);

    if (!sessionStart || !sessionEnd) return 'present';

    const gracePeriodEnd = new Date(sessionStart.getTime() + 15 * 60 * 1000);

    if (now > sessionEnd) {
      return 'auto-absent';
    } else if (now > gracePeriodEnd) {
      return 'late';
    } else if (now > sessionStart) {
      return 'grace-period';
    } else {
      return 'present';
    }
  };

  // Updated fetchTodaySessions to include appointmentHistory and fix loading logic
  useEffect(() => {
    const fetchTodaySessions = async () => {
      if (!username || !userId) return;

      try {
        setLoading(true);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        today.setHours(0, 0, 0, 0);

        let allTodaySessions = [];

        // 1. Fetch from calendar_slots
        try {
          const calendarRef = collection(db, 'calendar_slots');
          const calendarSnapshot = await getDocs(calendarRef);

          const calendarTodayData = calendarSnapshot.docs
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
              const isToday = slotDate.getTime() === today.getTime();
              
              // Check if user is approved volunteer
              const userVolunteer = slot.volunteerRequests?.find(request =>
                (request.userId === userId || request.volunteerId === userId) && 
                request.status === 'approved'
              );

              // Check if session is within time window (30 minutes before to session end)
              const inTimeWindow = isSessionInTimeWindow(slot.startTime, slot.endTime, 30);

              return isToday && userVolunteer && inTimeWindow;
            });

          // Format calendar sessions
          const formattedCalendarSessions = calendarTodayData.map(slot => ({
            id: slot.id,
            time: `${slot.startTime} - ${slot.endTime}`,
            residents: slot.residentIds || [],
            description: slot.notes || t('attendance.defaultDescription'),
            status: 'not_confirmed',
            sessionType: slot.customLabel || slot.sessionCategory || slot.type || 'Session',
            sessionCategory: slot.sessionCategory,
            date: slot.date,
            appointmentId: slot.appointmentId || slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            source: 'calendar_slots'
          }));

          allTodaySessions = [...allTodaySessions, ...formattedCalendarSessions];
        } catch (calendarError) {
          console.error('Error fetching calendar slots:', calendarError);
        }

        // 2. Fetch from appointmentHistory
        try {
          const volunteersRef = collection(db, 'volunteers');
          const volunteerQuery = query(volunteersRef, where('userId', '==', userId));
          const volunteerSnapshot = await getDocs(volunteerQuery);

          if (!volunteerSnapshot.empty) {
            const volunteerDoc = volunteerSnapshot.docs[0];
            const appointmentHistory = volunteerDoc.data().appointmentHistory || [];

            const appointmentHistoryData = appointmentHistory.filter(appointment => {
              const isToday = appointment.date === todayStr;
              const isUpcoming = appointment.status === 'upcoming';
              const inTimeWindow = isSessionInTimeWindow(appointment.startTime, appointment.endTime, 30);

              return isToday && isUpcoming && inTimeWindow;
            });

            // Format appointment history sessions
            const formattedAppointmentSessions = appointmentHistoryData.map(appointment => ({
              id: `appointment_${appointment.appointmentId}`,
              time: `${appointment.startTime} - ${appointment.endTime}`,
              residents: appointment.residentIds || [],
              description: appointment.notes || t('attendance.defaultDescription'),
              status: 'not_confirmed',
              sessionType: appointment.sessionType || 'Session',
              sessionCategory: appointment.sessionCategory,
              date: appointment.date,
              appointmentId: appointment.appointmentId,
              startTime: appointment.startTime,
              endTime: appointment.endTime,
              source: 'appointmentHistory'
            }));

            allTodaySessions = [...allTodaySessions, ...formattedAppointmentSessions];
          }
        } catch (appointmentError) {
          console.error('Error fetching appointment history:', appointmentError);
        }

        // 3. Filter out sessions that already have attendance records
        if (allTodaySessions.length > 0) {
          const sessionsWithoutAttendance = await Promise.all(
            allTodaySessions.map(async (session) => {
              const attendanceRef = collection(db, 'attendance');
              const appointmentId = session.appointmentId || session.id;

              try {
                const existingAttendanceQuery = query(
                  attendanceRef,
                  where('appointmentId', '==', appointmentId),
                  where('volunteerId', 'in', [userId, username].filter(Boolean))
                );

                const existingAttendanceSnapshot = await getDocs(existingAttendanceQuery);

                if (!existingAttendanceSnapshot.empty) {
                  return null; // Attendance already recorded
                }
              } catch (attendanceError) {
                console.error('Error checking attendance:', attendanceError);
                // If query fails, include the session to be safe
              }

              return session;
            })
          );

          // Filter out null values and sort by start time
          const availableSessions = sessionsWithoutAttendance
            .filter(session => session !== null)
            .sort((a, b) => {
              const timeA = parseTimeString(a.startTime);
              const timeB = parseTimeString(b.startTime);
              return timeA - timeB;
            });

          setTodaySessions(availableSessions);
        } else {
          setTodaySessions([]);
        }

        setSelectedSessions({});
      } catch (error) {
        console.error('Error fetching today\'s sessions:', error);
        setTodaySessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySessions();
    
    // Refresh every 2 minutes to check for new sessions or time changes
    const interval = setInterval(fetchTodaySessions, 120000);
    return () => clearInterval(interval);
  }, [username, userId, t]);

  // Updated handleConfirm function
  const handleConfirm = async (sessionId) => {
    const session = todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      const [startTime, endTime] = session.time.split(' - ');
      const attendanceStatus = getAttendanceStatus(startTime, endTime);

      if (attendanceStatus === 'auto-absent') {
        showNotification(t('attendance.notifications.sessionEnded'), 'error');
        return;
      }

      let finalStatus;
      let statusMessage;

      switch (attendanceStatus) {
        case 'present':
          finalStatus = 'present';
          statusMessage = t('attendance.notifications.confirmedPresent');
          break;
        case 'grace-period':
          finalStatus = 'present';
          statusMessage = t('attendance.notifications.confirmedGrace');
          break;
        case 'late':
          finalStatus = 'late';
          statusMessage = t('attendance.notifications.confirmedLate');
          break;
        default:
          finalStatus = 'present';
          statusMessage = t('attendance.notifications.confirmed');
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
        showNotification(t('attendance.notifications.alreadyRecorded'), 'warning');
        setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
        return;
      }

      let notes;
      switch (attendanceStatus) {
        case 'present':
          notes = t('attendance.notesDetails.beforeStart');
          break;
        case 'grace-period':
          notes = t('attendance.notesDetails.graceConfirmed');
          break;
        case 'late':
          notes = t('attendance.notesDetails.lateConfirmed');
          break;
        default:
          notes = t('attendance.notesDetails.confirmed');
      }

      // Add attendance record
      await addDoc(collection(db, 'attendance'), {
        appointmentId: session.appointmentId || session.id,
        volunteerId: userId || username,
        confirmedBy: username,
        confirmedAt: Timestamp.now(),
        status: finalStatus,
        notes: notes
      });

      // Update calendar_slots volunteer status to "completed"
      if (session.source === 'calendar_slots') {
        try {
          const calendarRef = collection(db, 'calendar_slots');
          const calendarQuery = query(
            calendarRef, 
            where('appointmentId', '==', session.appointmentId || session.id)
          );
          const calendarSnapshot = await getDocs(calendarQuery);

          if (!calendarSnapshot.empty) {
            const calendarDoc = calendarSnapshot.docs[0];
            const calendarData = calendarDoc.data();
            
            const updatedVolunteerRequests = calendarData.volunteerRequests?.map(request => {
              if (request.userId === userId || request.volunteerId === userId) {
                return {
                  ...request,
                  status: 'completed',
                  completedAt: Timestamp.now()
                };
              }
              return request;
            });

            if (updatedVolunteerRequests) {
              await updateDoc(calendarDoc.ref, {
                volunteerRequests: updatedVolunteerRequests
              });
            }
          }
        } catch (error) {
          console.error('Error updating calendar slot status:', error);
        }
      }

      // Update appointmentHistory status to "completed"
      if (session.source === 'appointmentHistory') {
        try {
          const volunteersRef = collection(db, 'volunteers');
          const volunteerQuery = query(volunteersRef, where('userId', '==', userId));
          const volunteerSnapshot = await getDocs(volunteerQuery);

          if (!volunteerSnapshot.empty) {
            const volunteerDocRef = volunteerSnapshot.docs[0].ref;
            const volunteerData = volunteerSnapshot.docs[0].data();
            
            const updatedAppointmentHistory = volunteerData.appointmentHistory?.map(appointment => {
              if (appointment.appointmentId === (session.appointmentId || session.id)) {
                return {
                  ...appointment,
                  status: 'completed'
                };
              }
              return appointment;
            });

            if (updatedAppointmentHistory) {
              await updateDoc(volunteerDocRef, {
                appointmentHistory: updatedAppointmentHistory
              });
            }
          }
        } catch (error) {
          console.error('Error updating appointment status:', error);
        }
      }

      // Update totalAttendance statistics
      try {
        const volunteersRef = collection(db, 'volunteers');
        const volunteerQuery = query(volunteersRef, where('userId', '==', userId));
        const volunteerSnapshot = await getDocs(volunteerQuery);

        if (!volunteerSnapshot.empty) {
          const volunteerDocRef = volunteerSnapshot.docs[0].ref;
          const volunteerData = volunteerSnapshot.docs[0].data();
          
          const currentAttendance = volunteerData.totalAttendance || {
            present: 0,
            late: 0,
            absent: 0,
            totalSessions: 0,
            totalHours: 0
          };

          const sessionHours = getHoursFromTimeRange(session.startTime, session.endTime);

          const updatedAttendance = {
            ...currentAttendance,
            [finalStatus]: (currentAttendance[finalStatus] || 0) + 1,
            totalSessions: (currentAttendance.totalSessions || 0) + 1,
            totalHours: (currentAttendance.totalHours || 0) + sessionHours
          };

          await updateDoc(volunteerDocRef, {
            totalAttendance: updatedAttendance
          });
        }
      } catch (error) {
        console.error('Error updating attendance statistics:', error);
      }

      showNotification(statusMessage, 'success');
      setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
      await fetchInitialAttendanceHistory();

    } catch (error) {
      console.error('Error confirming attendance:', error);
      showNotification(t('attendance.notifications.confirmError'), 'error');
    }
  };

  // Updated handleCancel function
  const handleCancel = async (sessionId) => {
    const session = todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    try {
      const attendanceRef = collection(db, 'attendance');
      const existingQuery = query(
        attendanceRef,
        where('appointmentId', '==', session.appointmentId || session.id),
        where('volunteerId', '==', userId || username)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        showNotification(t('attendance.notifications.alreadyRecorded'), 'warning');
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
        notes: t('attendance.notes.cancelledByVolunteer')
      });

      // Update calendar_slots volunteer status to "canceled"
      if (session.source === 'calendar_slots') {
        try {
          const calendarRef = collection(db, 'calendar_slots');
          const calendarQuery = query(
            calendarRef, 
            where('appointmentId', '==', session.appointmentId || session.id)
          );
          const calendarSnapshot = await getDocs(calendarQuery);

          if (!calendarSnapshot.empty) {
            const calendarDoc = calendarSnapshot.docs[0];
            const calendarData = calendarDoc.data();
            
            const updatedVolunteerRequests = calendarData.volunteerRequests?.map(request => {
              if (request.userId === userId || request.volunteerId === userId) {
                return {
                  ...request,
                  status: 'canceled',
                  canceledAt: Timestamp.now(),
                  cancelReason: 'Canceled by volunteer'
                };
              }
              return request;
            });

            if (updatedVolunteerRequests) {
              await updateDoc(calendarDoc.ref, {
                volunteerRequests: updatedVolunteerRequests
              });
            }
          }
        } catch (error) {
          console.error('Error updating calendar slot status:', error);
        }
      }

      // Update appointmentHistory status to "completed"
      if (session.source === 'appointmentHistory') {
        try {
          const volunteersRef = collection(db, 'volunteers');
          const volunteerQuery = query(volunteersRef, where('userId', '==', userId));
          const volunteerSnapshot = await getDocs(volunteerQuery);

          if (!volunteerSnapshot.empty) {
            const volunteerDocRef = volunteerSnapshot.docs[0].ref;
            const volunteerData = volunteerSnapshot.docs[0].data();
            
            const updatedAppointmentHistory = volunteerData.appointmentHistory?.map(appointment => {
              if (appointment.appointmentId === (session.appointmentId || session.id)) {
                return {
                  ...appointment,
                  status: 'completed'
                };
              }
              return appointment;
            });

            if (updatedAppointmentHistory) {
              await updateDoc(volunteerDocRef, {
                appointmentHistory: updatedAppointmentHistory
              });
            }
          }
        } catch (error) {
          console.error('Error updating appointment status:', error);
        }
      }

      // Update totalAttendance statistics
      try {
        const volunteersRef = collection(db, 'volunteers');
        const volunteerQuery = query(volunteersRef, where('userId', '==', userId));
        const volunteerSnapshot = await getDocs(volunteerQuery);

        if (!volunteerSnapshot.empty) {
          const volunteerDocRef = volunteerSnapshot.docs[0].ref;
          const volunteerData = volunteerSnapshot.docs[0].data();
          
          const currentAttendance = volunteerData.totalAttendance || {
            present: 0,
            late: 0,
            absent: 0,
            totalSessions: 0,
            totalHours: 0
          };

          const updatedAttendance = {
            ...currentAttendance,
            absent: (currentAttendance.absent || 0) + 1,
            totalSessions: (currentAttendance.totalSessions || 0) + 1
          };

          await updateDoc(volunteerDocRef, {
            totalAttendance: updatedAttendance
          });
        }
      } catch (error) {
        console.error('Error updating attendance statistics:', error);
      }

      showNotification(t('attendance.notifications.markedAbsent'), 'info');
      setTodaySessions(prev => prev.filter(s => s.id !== sessionId));
      await fetchInitialAttendanceHistory();

    } catch (error) {
      console.error('Error cancelling attendance:', error);
      showNotification(t('attendance.notifications.cancelError'), 'error');
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
            const attendanceRef = collection(db, 'attendance');
            const existingQuery = query(
              attendanceRef,
              where('appointmentId', '==', session.appointmentId || session.id),
              where('volunteerId', '==', userId || username)
            );
            const existingSnapshot = await getDocs(existingQuery);

            if (existingSnapshot.empty) {
              await addDoc(collection(db, 'attendance'), {
                appointmentId: session.appointmentId || session.id,
                volunteerId: userId || username,
                confirmedBy: username,
                confirmedAt: Timestamp.now(),
                status: 'absent',
                notes: t('attendance.notes.autoAbsent')
              });
              
              setTodaySessions(prev => prev.filter(s => s.id !== session.id));
              await fetchInitialAttendanceHistory();
            }
          } catch (error) {
            console.error('Error creating automatic absent record:', error);
          }
        }
      }
    };

    const interval = setInterval(checkAndCreateAbsentRecords, 60000);
    checkAndCreateAbsentRecords();

    return () => clearInterval(interval);
  }, [todaySessions, username, userId, t]);

  // Fetch initial attendance history
  const fetchInitialAttendanceHistory = async () => {
    if (!userId && !username) return;

    try {
      const attendanceRef = collection(db, 'attendance');
      const snapshot = await getDocs(attendanceRef);
      
      let userRecords = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(record => {
          return record.volunteerId === userId ||
            record.volunteerId === username ||
            record.confirmedBy === username;
        });

      userRecords.sort((a, b) => {
        const dateA = a.confirmedAt?.toDate ? a.confirmedAt.toDate() : new Date(a.confirmedAt || 0);
        const dateB = b.confirmedAt?.toDate ? b.confirmedAt.toDate() : new Date(b.confirmedAt || 0);
        return dateB - dateA;
      });

      setAllUserRecords(userRecords);
      setTotalHistoryCount(userRecords.length);

      const initialRecords = userRecords.slice(0, RECORDS_PER_PAGE);
      setHasMoreHistory(userRecords.length > RECORDS_PER_PAGE);
      setHistoryPage(0);

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

  // Helper function to enrich history data with appointment details
  const enrichHistoryData = async (records) => {
    try {
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

        let recordDate;
        if (record.confirmedAt?.toDate) {
          recordDate = record.confirmedAt.toDate();
        } else if (record.confirmedAt) {
          recordDate = new Date(record.confirmedAt);
        } else {
          recordDate = new Date();
        }

        const sessionType = appointmentData?.customLabel ||
          appointmentData?.sessionCategory ||
          appointmentData?.sessionType ||
          appointmentData?.type ||
          appointmentData?.notes ||
          'Session';

        const sessionCategory = appointmentData?.sessionCategory;

        return {
          id: record.id,
          date: recordDate.toISOString().split('T')[0],
          title: translateSessionType(sessionType, sessionCategory),
          time: appointmentData ?
            `${appointmentData.startTime} - ${appointmentData.endTime}` :
            t('attendance.timeNotAvailable'),
          status: record.status || 'present',
          hours: getHoursFromTimeRange(appointmentData?.startTime, appointmentData?.endTime),
          notes: record.notes || t('attendance.notesDetails.confirmed'),
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
          message: t('attendance.timeStatus.sessionEnded'),
          type: 'error',
          canConfirm: false
        };
      case 'late':
        return {
          message: t('attendance.timeStatus.graceExpired'),
          type: 'error',
          canConfirm: true
        };
      case 'grace-period':
        const remainingMinutes = Math.ceil((gracePeriodEnd - now) / (60 * 1000));
        return {
          message: t('attendance.timeStatus.graceActive', { minutes: remainingMinutes }),
          type: 'warning',
          canConfirm: true,
          remainingTime: remainingMinutes
        };
      default:
        const minutesUntilStart = Math.ceil((sessionStart - now) / (60 * 1000));
        return {
          message: t('attendance.timeStatus.sessionStarts', { minutes: minutesUntilStart }),
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
      const interval = setInterval(updateCountdown, 30000);

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
    <Layout>
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
                              {t('attendance.sessionNumber', { number: index + 1 })}: {translateSessionType(session.sessionType, session.sessionCategory)}
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
                                <p className="detail-value">{t('attendance.today')}</p>
                              </div>
                            </div>

                            <div className="detail-row">
                              <Users className="detail-icon" />
                              <div className="detail-content">
                                <p className="detail-label">{t('attendance.sessionType')}</p>
                                <p className="detail-value">{translateSessionType(session.sessionType, session.sessionCategory)}</p>
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
                              <span>{t('attendance.loading')}</span>
                            </>
                          ) : (
                            <>
                              <span>{t('attendance.loadMore')}</span>
                              <ChevronRight className="load-more-icon" />
                            </>
                          )}
                        </button>
                        <p className="load-more-info">
                          {t('attendance.showingRecords', { showing: attendanceHistory.length, total: totalHistoryCount })}
                        </p>
                      </div>
                    )}

                    {!hasMoreHistory && attendanceHistory.length >= RECORDS_PER_PAGE && (
                      <div className="load-more">
                        <p className="all-loaded-text">
                          ✅ {t('attendance.allLoaded', { count: attendanceHistory.length })}
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
    </Layout>
  );
};

export default Attendance;
