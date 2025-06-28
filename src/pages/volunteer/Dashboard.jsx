import React, { useState, useEffect, useRef } from 'react';
import { Clock, TrendingUp, Award, Calendar, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, CalendarDays, Users, Activity, FileText, Star, Target, ArrowUpRight, ArrowDownRight, Hand, UserCheck, HeartHandshake, ThumbsUp, ShieldCheck, Globe, Zap, TrendingDown } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/volunteer/Layout';
import LoadingScreen from "@/components/volunteer/InnerLS";
import './styles/Dashboard.css';

const Icon = ({ size = 38 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 840 535"
    fill="currentColor"
    preserveAspectRatio="xMidYMid meet"
  >
    <g transform="translate(0,535) scale(0.1,-0.1)">
      <path d="M4289 4920 c-9 -5 -21 -22 -27 -37 -10 -24 -42 -196 -42 -221 0 -5
      -9 -19 -20 -32 -18 -21 -40 -79 -40 -107 0 -6 -5 -13 -10 -15 -13 -4 -39 -74
      -40 -105 0 -13 -9 -32 -19 -42 -13 -13 -22 -41 -27 -81 -4 -33 -12 -64 -19
      -68 -28 -16 -45 -72 -45 -145 0 -49 -6 -85 -17 -107 -9 -19 -18 -55 -21 -82
      -3 -28 -9 -48 -17 -48 -17 0 -35 -68 -35 -133 0 -53 -2 -57 -31 -73 l-31 -16
      4 -84 c1 -46 0 -84 -4 -84 -3 0 -14 -23 -23 -50 -15 -47 -15 -93 1 -151 3 -10
      -3 -18 -15 -22 -24 -6 -34 -64 -23 -134 8 -49 7 -54 -15 -68 -22 -15 -23 -21
      -17 -63 4 -26 13 -64 20 -86 17 -47 18 -43 -6 -49 -17 -4 -20 -13 -20 -54 0
      -26 9 -68 20 -92 14 -30 17 -47 10 -56 -6 -8 -5 -29 4 -63 12 -48 12 -52 -4
      -52 -10 0 -23 13 -29 29 -18 41 -76 95 -96 87 -12 -4 -20 3 -30 27 -7 17 -30
      -54 -50 -80 -30 -39 -42 -48 -63 -45 -21 -2 -33 5 -56 35 -27 36 -76 70 -94
      65 -5 -2 -33 23 -63 54 -42 44 -63 58 -94 64 -26 4 -55 20 -83 46 -56 52 -83
      63 -111 48 -19 -10 -27 -7 -58 21 -38 33 -90 59 -119 59 -9 0 -32 13 -50 30
      -19 16 -53 35 -76 41 -24 7 -54 24 -68 37 -45 44 -95 72 -136 75 -21 2 -63 16
      -92 31 -30 15 -59 25 -65 23 -7 -3 -25 6 -42 18 -30 22 -95 48 -111 44 -5 -1
      -27 6 -48 15 -22 10 -50 16 -62 13 -13 -2 -47 4 -76 14 -71 25 -102 24 -134
      -4 -41 -36 -28 -83 37 -140 37 -33 50 -50 45 -63 -4 -14 17 -43 79 -108 47
      -49 85 -93 85 -98 0 -19 42 -69 88 -103 25 -20 70 -62 100 -95 51 -57 53 -62
      43 -90 -10 -30 -9 -32 52 -75 34 -24 88 -69 119 -100 31 -30 64 -55 73 -55 11
      0 14 -6 9 -24 -4 -19 3 -30 37 -60 24 -20 67 -48 96 -63 48 -23 53 -29 53 -58
      0 -33 20 -49 88 -70 18 -5 22 -14 22 -45 0 -35 3 -39 43 -58 23 -11 59 -24 80
      -30 20 -6 51 -22 69 -37 17 -14 44 -29 60 -32 18 -4 33 -15 38 -29 14 -35 51
      -51 183 -79 18 -3 27 -12 27 -25 0 -18 -8 -19 -167 -17 -93 0 -206 1 -253 0
      -47 -1 -168 -1 -270 -1 -136 -1 -207 -5 -267 -18 -46 -9 -83 -20 -83 -24 0 -4
      -27 -10 -61 -13 -88 -8 -133 -58 -109 -121 12 -32 33 -43 121 -61 40 -9 76
      -19 79 -23 11 -15 62 -32 98 -32 43 0 127 -21 162 -40 14 -8 52 -22 85 -31
      116 -34 165 -53 165 -64 1 -26 22 -36 101 -45 46 -6 111 -15 144 -21 124 -21
      145 -22 191 -4 32 12 48 14 58 6 8 -7 31 -8 71 -1 76 12 83 1 33 -53 -21 -23
      -57 -62 -79 -87 -22 -25 -62 -68 -89 -97 -27 -29 -52 -62 -55 -74 -4 -11 -18
      -37 -31 -56 -13 -20 -24 -48 -24 -62 0 -14 -9 -39 -21 -56 -37 -55 -69 -124
      -69 -150 0 -34 45 -75 82 -75 21 0 44 14 82 50 29 28 59 50 66 50 7 0 33 11
      59 24 25 14 66 34 91 45 25 12 60 31 77 44 73 50 103 65 122 60 13 -3 31 7 59
      36 22 23 45 41 52 41 7 0 34 19 60 42 26 24 59 51 74 61 15 10 38 36 52 58 13
      22 29 37 34 34 5 -3 16 7 24 22 14 27 15 23 16 -67 1 -186 28 -502 50 -578 39
      -139 93 -220 164 -247 92 -35 189 29 188 126 -1 30 -8 49 -31 74 -47 54 -119
      211 -131 285 -6 36 -12 164 -15 285 -5 202 -4 216 9 176 8 -24 30 -60 50 -80
      107 -111 198 -191 218 -191 7 0 32 -18 53 -41 26 -26 46 -38 58 -35 16 4 83
      -31 154 -81 17 -13 34 -23 38 -23 4 0 39 -16 76 -35 38 -19 74 -35 81 -35 6 0
      35 -22 64 -50 63 -59 99 -66 141 -24 35 35 27 84 -26 169 -23 35 -41 74 -41
      85 0 34 -80 169 -116 196 -19 15 -34 32 -34 40 0 7 -20 30 -45 51 -25 20 -45
      42 -45 47 0 6 -17 27 -37 48 -47 48 -37 60 41 46 44 -8 60 -7 66 1 5 9 20 8
      58 -4 32 -11 66 -15 89 -11 21 3 65 10 98 15 33 6 96 15 140 21 99 13 105 15
      105 38 0 18 28 30 165 71 33 9 71 23 85 31 37 20 120 40 167 40 43 0 93 17 93
      31 0 4 26 13 58 19 31 6 68 13 80 16 34 7 72 49 72 78 0 14 -13 40 -28 57 -23
      26 -38 32 -83 37 -30 2 -59 9 -66 14 -32 25 -276 48 -448 42 -66 -3 -136 -5
      -155 -5 -422 4 -440 5 -440 17 0 18 13 24 86 40 73 15 124 46 124 75 0 13 7
      19 24 19 12 0 38 11 57 25 40 29 52 35 139 67 65 24 65 24 68 65 3 36 7 42 30
      48 15 3 42 14 58 24 26 16 30 24 27 48 -4 27 -1 32 49 56 74 36 138 93 138
      122 0 15 7 26 20 30 10 3 37 26 59 51 22 25 66 62 98 83 77 50 86 62 73 96 -9
      25 -6 32 47 89 31 33 68 68 83 77 31 19 100 98 100 114 0 6 38 51 84 101 65
      68 84 94 80 110 -4 16 5 29 40 55 71 54 87 111 40 148 -32 25 -71 27 -122 5
      -20 -8 -60 -17 -88 -19 -28 -1 -62 -9 -75 -16 -13 -7 -36 -13 -51 -14 -15 -2
      -49 -15 -75 -31 -26 -16 -54 -27 -61 -26 -7 2 -34 -9 -60 -24 -26 -14 -67 -28
      -90 -30 -53 -5 -73 -15 -126 -64 -23 -21 -56 -41 -74 -45 -18 -4 -52 -21 -76
      -39 -23 -18 -59 -36 -79 -40 -20 -4 -59 -25 -86 -46 -45 -36 -53 -39 -75 -29
      -28 13 -49 3 -114 -55 -21 -19 -54 -36 -76 -40 -30 -6 -52 -21 -94 -64 -30
      -31 -59 -56 -64 -54 -18 5 -77 -39 -97 -72 -16 -26 -26 -32 -45 -29 -28 6 -73
      -38 -108 -104 -13 -25 -30 -43 -40 -43 -24 0 -73 -45 -88 -80 -7 -16 -24 -36
      -38 -43 -36 -17 -59 -52 -87 -132 -13 -38 -30 -71 -37 -74 -7 -2 -21 -13 -31
      -25 -14 -18 -14 -13 4 27 11 26 19 56 17 65 -2 10 13 49 31 86 28 54 33 71 24
      85 -9 14 -5 31 18 78 39 81 53 154 33 169 -12 10 -12 17 6 55 11 24 20 62 20
      84 0 22 11 72 25 110 13 39 25 78 25 87 0 9 -16 26 -35 38 -34 21 -36 24 -30
      65 6 37 4 44 -19 62 -26 21 -26 21 -10 64 21 62 24 187 3 202 -13 10 -15 37
      -13 167 1 85 3 160 4 165 6 27 -2 46 -23 54 -23 9 -24 16 -30 126 -4 64 -4
      129 -1 144 9 41 -14 141 -32 141 -15 0 -19 39 -15 151 2 38 -2 76 -9 89 -6 12
      -13 63 -15 113 -6 152 -45 237 -109 237 -17 0 -38 -5 -47 -10z" />
    </g>
  </svg>
);


const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation('dashboard');
  const [animateHours, setAnimateHours] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoursProgress, setHoursProgress] = useState(0);
  const [cardColors, setCardColors] = useState([]);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [dataLoaded, setDataLoaded] = useState({
    volunteerData: false,
    upcomingSessions: false,
    recentActivity: false
  });
  const [userData, setUserData] = useState({
    name: 'Volunteer',
    totalHours: 0,
    totalSessions: 0,
    previousHours: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const langToggleRef = useRef(null);

  // Preset color combinations for cards - Elder-friendly with warm, soft tones and high contrast
  const colorPresets = [
    { primary: '#2563eb', secondary: '#1e40af', bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }, // Soft blue
    { primary: '#7c3aed', secondary: '#6d28d9', bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' }, // Gentle purple
    { primary: '#059669', secondary: '#047857', bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }, // Calm green
    { primary: '#b45309', secondary: '#92400e', bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }, // Warm amber
    { primary: '#be123c', secondary: '#9f1239', bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' }, // Soft rose
    { primary: '#0891b2', secondary: '#0e7490', bg: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)' }, // Gentle cyan
    { primary: '#65a30d', secondary: '#4d7c0f', bg: 'linear-gradient(135deg, #ecfccb 0%, #d9f99d 100%)' }, // Natural lime
    { primary: '#c2410c', secondary: '#9a3412', bg: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)' }  // Warm orange
  ];

  const getLevel = (hours) => {
    if (hours >= 0 && hours < 10)
      return { label: t("dashboard.levels.Beginner"), icon: <Star size={50} />, nextLevel: t("dashboard.levels.Helper"), hoursToNext: 10 - hours };
    if (hours >= 10 && hours < 30)
      return { label: t("dashboard.levels.Helper"), icon: <Hand size={50} />, nextLevel: t("dashboard.levels.Contributor"), hoursToNext: 30 - hours };
    if (hours >= 30 && hours < 60)
      return { label: t("dashboard.levels.Contributor"), icon: <UserCheck size={50} />, nextLevel: t("dashboard.levels.Supporter"), hoursToNext: 60 - hours };
    if (hours >= 60 && hours < 100)
      return { label: t("dashboard.levels.Supporter"), icon: <HeartHandshake size={50} />, nextLevel: t("dashboard.levels.Advocate"), hoursToNext: 100 - hours };
    if (hours >= 100 && hours < 150)
      return { label: t("dashboard.levels.Advocate"), icon: <ThumbsUp size={50} />, nextLevel: t("dashboard.levels.Champion"), hoursToNext: 150 - hours };
    if (hours >= 150 && hours < 200)
      return { label: t("dashboard.levels.Champion"), icon: <ShieldCheck size={50} />, nextLevel: t("dashboard.levels.Humanitarian"), hoursToNext: 200 - hours };
    if (hours >= 200 && hours < 420)
      return { label: t("dashboard.levels.Humanitarian"), icon: <Globe size={50} />, nextLevel: null, hoursToNext: 0 };
    return { label: t("dashboard.levels.Lord of the deeds"), icon: <Icon size={50} />, nextLevel: null, hoursToNext: 0 };
  };

  const getLevelStartHours = (levelLabel) => {
    const levelLabelKey = Object.keys(t("dashboard.levels")).find(key => t(`dashboard.levels.${key}`) === levelLabel);
    switch (levelLabelKey) {
      case 'Beginner': return 0;
      case 'Helper': return 10;
      case 'Contributor': return 30;
      case 'Supporter': return 60;
      case 'Advocate': return 100;
      case 'Champion': return 150;
      case 'Humanitarian': return 200;
      case 'Lord of the deeds': return 420;
      default: return 0;
    }
  };

  const getLevelEndHours = (levelLabel) => {
    const levelLabelKey = Object.keys(t("dashboard.levels")).find(key => t(`dashboard.levels.${key}`) === levelLabel);
    switch (levelLabelKey) {
      case 'Beginner': return 10;
      case 'Helper': return 30;
      case 'Contributor': return 60;
      case 'Supporter': return 100;
      case 'Advocate': return 150;
      case 'Champion': return 200;
      case 'Humanitarian': return 420;
      case 'Lord of the deeds': return 420;
      default: return 10;
    }
  };

  // Fixed elder-friendly colors (no shuffling)
  const getFixedColors = () => {
    return [
      colorPresets[0], // Soft blue for Total Hours
      colorPresets[2], // Calm green for Sessions Completed  
      colorPresets[3]  // Warm amber for Current Level
    ];
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

  // Fetch volunteer data
  const fetchVolunteerData = async () => {
    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');

      if (!userId) {
        setDataLoaded(prev => ({ ...prev, volunteerData: true }));
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
          name: volunteerData.fullName || username || t('dashboard.defaultName'),
          totalHours: volunteerData.totalHours || 0,
          totalSessions: volunteerData.totalSessions || 0,
          previousHours: volunteerData.previousHours || 0,
          volunteerId: volunteerDoc.id
        });
      }
      setDataLoaded(prev => ({ ...prev, volunteerData: true }));
    } catch (error) {
      console.error("Error fetching volunteer data:", error);
      setDataLoaded(prev => ({ ...prev, volunteerData: true }));
    }
  };

  // Fetch upcoming sessions from calendar_slots with proper time validation
  const fetchUpcomingSessions = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setDataLoaded(prev => ({ ...prev, upcomingSessions: true }));
        return;
      }

      // Fetch volunteer data to get appointmentHistory
      const volunteersRef = collection(db, "volunteers");
      const volunteerSnapshot = await getDocs(volunteersRef);

      const volunteer = volunteerSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find(v => v.userId === userId);

      if (!volunteer || !volunteer.appointmentHistory) {
        setUpcomingSessions([]);
        setDataLoaded(prev => ({ ...prev, upcomingSessions: true }));
        return;
      }

      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter upcoming sessions from appointmentHistory
      const upcomingSessionsData = volunteer.appointmentHistory
        .filter(appointment => {
          // Only include future appointments that are not completed/cancelled
          const appointmentDate = new Date(appointment.date);
          appointmentDate.setHours(0, 0, 0, 0);

          const isUpcoming = appointmentDate >= today &&
            appointment.status !== 'completed' &&
            appointment.status !== 'canceled';

          return isUpcoming;
        })
        .map(appointment => {
          // Parse date and time
          const appointmentDate = new Date(appointment.date);
          const startTime = appointment.startTime || t('dashboard.session.timeTBD');
          const endTime = appointment.endTime || "";
          const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;

          // Format display date
          const displayDate = appointmentDate.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          });

          // Create full datetime for sorting
          let fullDateTime;
          if (appointment.date && appointment.startTime) {
            fullDateTime = parseTimeAndCombineWithDate(appointment.date, appointment.startTime);
          } else {
            fullDateTime = appointmentDate;
          }

          return {
            id: appointment.appointmentId,
            title: t('dashboard.session.defaultTitle'), // Default title
            date: displayDate,
            time: timeRange,
            location: t('dashboard.session.defaultLocation'), // Default location
            fullDateTime: fullDateTime,
            appointmentId: appointment.appointmentId
          };
        });

      // Sort by date/time (ascending - earliest first) and take first 3
      upcomingSessionsData.sort((a, b) => {
        // Ensure we're comparing valid dates
        if (!a.fullDateTime || !b.fullDateTime) {
          return 0;
        }
        return a.fullDateTime.getTime() - b.fullDateTime.getTime();
      });
      const finalSessions = upcomingSessionsData.slice(0, 3);

      // Enrich with calendar slot data if available
      const calendarSlotsRef = collection(db, "calendar_slots");
      const calendarSnapshot = await getDocs(calendarSlotsRef);
      const calendarData = {};

      calendarSnapshot.docs.forEach(doc => {
        const data = doc.data();
        calendarData[doc.id] = data;
      });

      // Enrich sessions with calendar data
      const enrichedSessions = finalSessions.map(session => {
        const calendarSlot = calendarData[session.appointmentId];
        if (calendarSlot) {
          return {
            ...session,
            title: calendarSlot.customLabel || t('dashboard.session.defaultTitle'),
            location: calendarSlot.location || t('dashboard.session.defaultLocation')
          };
        }
        return session;
      });

      setUpcomingSessions(enrichedSessions);
      setDataLoaded(prev => ({ ...prev, upcomingSessions: true }));
    } catch (error) {
      console.error("Error fetching upcoming sessions:", error);
      setDataLoaded(prev => ({ ...prev, upcomingSessions: true }));
    }
  };

  // Fetch recent activity from attendance collection
  const fetchRecentActivity = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setDataLoaded(prev => ({ ...prev, recentActivity: true }));
        return;
      }

      const attendanceRef = collection(db, "attendance");
      const q = query(attendanceRef, limit(10)); // Increased limit to get more data for sorting

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
          icon: Award,
          iconColor: 'dash-icon-gold',
          confirmedAt: new Date(), // Use current date for level up
          displayDate: new Date().toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          displayTime: new Date().toLocaleTimeString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        });
      }

      // Add the latest attendance records
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const status = data.status || t('dashboard.activity.unknownStatus');
        const notes = data.notes || "";
        let sessionDate = null;
        let sessionStartTime = null;
        let displayDate = "";
        let displayTime = "";

        // Get session time from appointment data (simplified - no resident names for now)
        if (data.appointmentId) {
          try {
            const appointmentRef = doc(db, "appointments", data.appointmentId);
            const appointmentSnap = await getDoc(appointmentRef);
            if (appointmentSnap.exists()) {
              const appointmentData = appointmentSnap.data();

              // Get session time from calendar slot
              if (appointmentData.calendarSlotId) {
                const slotRef = doc(db, "calendar_slots", appointmentData.calendarSlotId);
                const slotSnap = await getDoc(slotRef);
                if (slotSnap.exists()) {
                  const slotData = slotSnap.data();
                  sessionDate = slotData.date;
                  sessionStartTime = slotData.startTime;
                  // Format date and time
                  if (sessionDate && sessionStartTime) {
                    const sessionDateObj = parseTimeAndCombineWithDate(sessionDate, sessionStartTime);
                    displayDate = sessionDateObj.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                    displayTime = sessionDateObj.toLocaleTimeString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                  }
                }
              }
            }
          } catch (error) {
            // Silently handle error
          }
        }
        // Fallback to confirmedAt if session time not found
        if (!displayDate || !displayTime) {
          let confirmedDate = new Date();
          if (data.confirmedAt) {
            try {
              if (data.confirmedAt.toDate) {
                confirmedDate = data.confirmedAt.toDate();
              } else if (data.confirmedAt.seconds) {
                confirmedDate = new Date(data.confirmedAt.seconds * 1000 + data.confirmedAt.nanoseconds / 1000000);
              } else {
                confirmedDate = new Date(data.confirmedAt);
              }
              displayDate = confirmedDate.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              displayTime = confirmedDate.toLocaleTimeString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
            } catch (error) {
              // Silently handle error
            }
          }
        }

        // Create activity text based on status
        let activityText = "";
        let icon = Activity;
        let iconColor = "dash-icon-blue";

        if (status === "present") {
          activityText = t('dashboard.activity.present', { notes: notes ? `. ${notes}` : '' });
          icon = CheckCircle2;
          iconColor = "dash-icon-green";
        } else if (status === "late") {
          activityText = t('dashboard.activity.late', { notes: notes ? `. ${notes}` : '' });
          icon = Clock;
          iconColor = "dash-icon-amber";
        } else if (status === "absent") {
          activityText = t('dashboard.activity.absent', { notes: notes ? `. ${notes}` : '' });
          icon = AlertCircle;
          iconColor = "dash-icon-red";
        } else {
          activityText = t('dashboard.activity.generic', { status, notes: notes ? `. ${notes}` : '' });
        }

        activities.push({
          id: docSnap.id,
          type: status,
          text: activityText,
          displayDate: displayDate,
          displayTime: displayTime,
          icon: icon,
          iconColor: iconColor,
          residentNames: [] // Empty for now - can be loaded later if needed
        });
      }

      // Sort activities by date/time (descending - most recent first)
      activities.sort((a, b) => {
        try {
          // Try to parse the combined date and time
          const aDate = new Date(a.displayDate + ' ' + a.displayTime);
          const bDate = new Date(b.displayDate + ' ' + b.displayTime);

          // Check if dates are valid
          if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) {
            // Fallback: if date parsing fails, put level-up activities first
            if (a.type === 'level-up') return -1;
            if (b.type === 'level-up') return 1;
            return 0;
          }

          // Sort in descending order (most recent first)
          return bDate.getTime() - aDate.getTime();
        } catch (error) {
          // Fallback: put level-up activities first
          if (a.type === 'level-up') return -1;
          if (b.type === 'level-up') return 1;
          return 0;
        }
      });

      // Take only the first 5 for display
      setRecentActivity(activities.slice(0, 5));
      setDataLoaded(prev => ({ ...prev, recentActivity: true }));
    } catch (error) {
      console.error("Error fetching recent activity:", error);

      // Fallback activity data
      setRecentActivity([
        {
          id: 'fallback-1',
          type: 'present',
          text: t('dashboard.activity.present', { notes: '' }),
          displayDate: new Date().toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          displayTime: new Date().toLocaleTimeString(i18n.language === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          icon: CheckCircle2,
          iconColor: 'dash-icon-green',
          residentNames: []
        }
      ]);
      setDataLoaded(prev => ({ ...prev, recentActivity: true }));
    }
  };

  useEffect(() => {
    document.documentElement.dir = currentLanguage === "he" ? "rtl" : "ltr";
  }, [currentLanguage]);

  // Sync currentLanguage with i18n.language
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      setCurrentLanguage(i18n.language);
    }
  }, [i18n.language, currentLanguage]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);

      // Set fixed elder-friendly colors
      const fixedColors = getFixedColors();
      setCardColors(fixedColors);

      // Fetch all data
      await fetchVolunteerData();
      await fetchUpcomingSessions();
    };

    initializeData();
  }, []);

  // Check if all data is loaded
  useEffect(() => {
    if (dataLoaded.volunteerData && dataLoaded.upcomingSessions) {
      setLoading(false);
    }
  }, [dataLoaded]);

  // Fetch recent activity after userData is loaded
  useEffect(() => {
    if (userData.volunteerId || userData.totalHours > 0) {
      fetchRecentActivity();
    }
  }, [userData, currentLanguage]);

  // Re-fetch upcoming sessions when language changes
  useEffect(() => {
    if (dataLoaded.upcomingSessions) {
      fetchUpcomingSessions();
    }
  }, [currentLanguage]);

  // Update progress bars when data changes
  useEffect(() => {
    if (userData.totalHours) {
      const maxHours = 200;
      const value = Math.min(userData.totalHours, maxHours);
      const progressRatio = value / maxHours;
      const offset = 565.48 - (progressRatio * 565.48);

      setTimeout(() => {
        setHoursProgress(offset);
        setAnimateHours(true);
      }, 200);
    }
  }, [userData.totalHours]);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => {
      clearInterval(timeInterval);
    };
  }, []);

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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 18) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  const currentLevel = getLevel(userData.totalHours);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <div className="dash-dashboard-container">
        <div className="dash-dashboard-wrapper">
          <div className="dash-dashboard-header">
            <p className="dash-dashboard-greeting">
              {getGreeting()}, {userData.name}! 👋
            </p>
          </div>

          <div className="dash-new-layout-grid">
            {/* Left Column */}
            <div className="dash-left-column">
              {/* Check In Button */}
              <a href="/volunteer/attendance" className="dash-checkin-button">
                <div className="dash-checkin-content">
                  <div className="dash-checkin-icon-wrapper">
                    <CheckCircle2 className="dash-checkin-icon" />
                  </div>
                  <div className="dash-checkin-text">
                    <span className="dash-checkin-title">{t('dashboard.checkIn.title')}</span>
                    <span className="dash-checkin-subtitle">{t('dashboard.checkIn.subtitle')}</span>
                  </div>
                  {i18n.language === 'he'
                    ? <ChevronLeft className="dash-checkin-arrow" />
                    : <ChevronRight className="dash-checkin-arrow" />
                  }
                </div>
              </a>

              {/* Upcoming Sessions */}
              <div className="dash-upcoming-card">
                <div className="dash-upcoming-header">
                  <h2 className="dash-upcoming-title" style={{ marginBottom: 0 }}>{t('dashboard.upcoming.title')}</h2>
                  <a href="/volunteer/appointments" className="dash-view-all-link">
                    {t('dashboard.upcoming.viewAll')}&nbsp;
                    {i18n.language === 'he'
                      ? <ChevronLeft style={{ width: '1rem', height: '1rem', display: 'inline' }} />
                      : <ChevronRight style={{ width: '1rem', height: '1rem', display: 'inline' }} />
                    }
                  </a>
                </div>
                <div className="dash-upcoming-list">
                  {!dataLoaded.upcomingSessions ? (
                    <div className="dash-upcoming-item">
                      <div className="dash-upcoming-item-header">
                        <div className="dash-upcoming-item-content">
                          <div
                            className="dash-upcoming-detail"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              padding: '1.5rem'
                            }}
                          >
                            <div className="loading-spinner" style={{
                              width: '2rem',
                              height: '2rem',
                              border: '2px solid transparent',
                              borderTop: '2px solid #6b7280',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
                              <span style={{
                                fontWeight: '700',
                                color: '#1f2937',
                                fontSize: '1.125rem',
                                lineHeight: '1.3'
                              }}>
                                {t('dashboard.upcoming.loading')}
                              </span>
                              <span style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                lineHeight: '1.4'
                              }}>
                                {t('dashboard.upcoming.loadingSubtitle')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session) => (
                      <div key={session.id} className="dash-upcoming-item">
                        <div className="dash-upcoming-item-header">
                          <h3 className="dash-upcoming-item-title" style={{ fontSize: '1.1rem' }}>{session.title}</h3>
                          <span style={{ fontSize: '1rem' }} className="dash-upcoming-item-date">{session.date}</span>
                        </div>
                        <div className="dash-upcoming-item-details">
                          <div className="dash-upcoming-detail">
                            <Clock className="dash-upcoming-detail-icon" />
                            <span style={{ fontSize: '1rem' }}>{session.time}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dash-upcoming-item">
                      <div className="dash-upcoming-item-header">
                        <div className="dash-upcoming-item-content">
                          <div
                            className="dash-upcoming-detail"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              padding: '1.5rem'
                            }}
                          >
                            <Calendar
                              style={{
                                color: '#6b7280',
                                width: '2rem',
                                height: '2rem'
                              }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
                              <span style={{
                                fontWeight: '700',
                                color: '#1f2937',
                                fontSize: '1.125rem',
                                lineHeight: '1.3'
                              }}>
                                {t('dashboard.upcoming.none')}
                              </span>
                              <span style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                lineHeight: '1.4'
                              }}>
                                {t('dashboard.upcoming.noSessionsMessage')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="dash-activity-card">
                <div className="dash-activity-header">
                  <h2 className="dash-activity-title" style={{ marginBottom: 0 }}>{t('dashboard.activity.title')}</h2>
                </div>
                <ul className="dash-activity-list">
                  {!dataLoaded.recentActivity ? (
                    <li className="dash-activity-item" style={{ borderBottom: 'none', marginBottom: 0, padding: 0 }}>
                      <div className="dash-activity-content">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1.5rem'
                          }}
                        >
                          <div className="loading-spinner" style={{
                            width: '2rem',
                            height: '2rem',
                            border: '2px solid transparent',
                            borderTop: '2px solid #6b7280',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
                            <span style={{
                              fontWeight: '700',
                              color: '#1f2937',
                              fontSize: '1.125rem',
                              lineHeight: '1.3'
                            }}>
                              {t('dashboard.activity.loading')}
                            </span>
                            <span style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              lineHeight: '1.4'
                            }}>
                              {t('dashboard.activity.loadingSubtitle')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((activity) => {
                      const IconComponent = activity.icon;
                      const { type, notes = '' } = activity;

                      // figure out which text key + params to use
                      const text = (() => {
                        switch (type) {
                          case 'level-up':
                            return t('dashboard.levelUp', { level: getLevel(userData.totalHours).label });
                          case 'present':
                            return t('dashboard.activity.present', { notes: notes ? `. ${notes}` : '' });
                          case 'late':
                            return t('dashboard.activity.late', { notes: notes ? `. ${notes}` : '' });
                          case 'absent':
                            return t('dashboard.activity.absent', { notes: notes ? `. ${notes}` : '' });
                          default:
                            return t('dashboard.activity.generic', { status: type, notes: notes ? `. ${notes}` : '' });
                        }
                      })();

                      return (
                        <li key={activity.id} className="dash-activity-item">
                          <div className="dash-activity-content">
                            <div className={`dash-activity-icon-wrapper ${activity.iconColor}`}>
                              <IconComponent className="dash-activity-icon" />
                            </div>
                            <div
                              className="dash-activity-details"
                              style={i18n.language === 'he' ? { paddingRight: '1rem' } : { paddingLeft: '1rem' }}
                            >
                              <p className="dash-activity-text" style={{ fontSize: '1.07rem', fontWeight: 600 }}>
                                {text}
                              </p>
                              <div className="dash-activity-datetime" style={{ fontSize: '1.07rem' }}>
                                <span className="dash-activity-date" style={{ fontSize: '1rem' }}>{activity.displayDate}</span>
                                <span className="dash-activity-time" style={{ fontSize: '0.9rem' }}>{activity.displayTime}</span>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="dash-activity-item" style={{ borderBottom: 'none', marginBottom: 0, padding: 0 }}>
                      <div className="dash-activity-content">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            background: 'linear-gradient(135deg, rgba(79, 120, 80, 0.08) 0%, rgba(79, 120, 80, 0.12) 100%)',
                            border: '2px solid rgba(79, 120, 80, 0.15)',
                            boxShadow: '0 2px 8px rgba(79, 120, 80, 0.1)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: '3rem',
                              height: '3rem',
                              borderRadius: '0.75rem',
                              background: 'linear-gradient(135deg, #4f7850, #416a42)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(79, 120, 80, 0.3)'
                            }}
                          >
                            <Activity
                              style={{
                                color: 'white',
                                width: '1.5rem',
                                height: '1.5rem',
                                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
                            <span style={{
                              fontWeight: '700',
                              color: '#1f2937',
                              fontSize: '1.125rem',
                              lineHeight: '1.3'
                            }}>
                              {t('dashboard.activity.noActivity')}
                            </span>
                            <span style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              lineHeight: '1.4'
                            }}>
                              {t('dashboard.activity.noActivityMessage')}
                            </span>
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              top: '-1px',
                              right: '-1px',
                              width: '2rem',
                              height: '2rem',
                              background: 'linear-gradient(135deg, rgba(79, 120, 80, 0.1), rgba(79, 120, 80, 0.05))',
                              borderRadius: '0 1rem 0 1rem',
                              borderLeft: '2px solid rgba(79, 120, 80, 0.2)',
                              borderBottom: '2px solid rgba(79, 120, 80, 0.2)'
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Right Column */}
            <div className="dash-right-column">
              {/* Total Hours */}
              <div
                className="dash-stat-widget dash-hours-widget"
                style={{
                  background: cardColors[0]?.bg,
                  borderRadius: '1.5rem',
                  padding: '2rem',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background decoration */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />

                <div className="dash-widget-header" style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="dash-widget-label" style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '0.5rem',
                    margin: 0
                  }}>{t('dashboard.stats.totalHours')}</p>
                  <div
                    className="dash-widget-icon-wrapper"
                    style={{
                      background: `linear-gradient(135deg, ${cardColors[0]?.primary}, ${cardColors[0]?.secondary})`,
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '1rem',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                      margin: 0
                    }}
                  >
                    <Clock className="dash-widget-icon" style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                </div>

                <div className="dash-hours-simple-display" style={{ position: 'relative', zIndex: 1, marginTop: '1.5rem' }}>
                  <div className="dash-hours-main">
                    <span className="dash-hours-number-simple" style={{
                      fontSize: '3.5rem',
                      fontWeight: '900',
                      color: '#000000',
                      lineHeight: '1',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>{userData.totalHours}</span>
                    <span className="dash-hours-unit" style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#64748b'
                    }}>{t('dashboard.stats.hoursLabel')}</span>
                  </div>
                </div>

                {/* Sessions Section */}
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '2rem',
                  borderTop: '2px solid rgba(0, 0, 0, 0.08)',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div className="dash-widget-header" style={{ marginBottom: '1.5rem' }}>
                    <p className="dash-widget-label" style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#1e293b',
                      margin: 0
                    }}>{t('dashboard.stats.sessionsCompleted')}</p>
                  </div>
                  <div className="dash-hours-simple-display" style={{ margin: '0' }}>
                    <div className="dash-hours-main">
                      <span className="dash-hours-number-simple" style={{
                        fontSize: '3.5rem',
                        fontWeight: '900',
                        color: '#000000',
                        lineHeight: '1',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>{userData.totalSessions}</span>
                      <span className="dash-hours-unit" style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#64748b'
                      }}>
                        {userData.totalSessions === 1 ? t('dashboard.stats.sessionLabelSingular') : t('dashboard.stats.sessionsLabel')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Level */}
              <div
                className="dash-stat-widget dash-level-widget"
                style={{
                  background: cardColors[2]?.bg,
                  borderRadius: '1.5rem',
                  padding: '2rem',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background decoration */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />

                <div className="dash-widget-header" style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="dash-widget-label" style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '0.5rem',
                    margin: 0
                  }}>{t('dashboard.stats.level')}</p>
                  <div
                    className="dash-widget-icon-wrapper"
                    style={{
                      background: `linear-gradient(135deg, ${cardColors[2]?.primary}, ${cardColors[2]?.secondary})`,
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '1rem',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                      margin: 0
                    }}
                  >
                    <Award className="dash-widget-icon" style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>
                </div>

                <div className="dash-level-simple-display" style={{ position: 'relative', zIndex: 1, marginTop: '1.5rem', textAlign: 'center' }}>
                  <div className="dash-level-main">
                    <div
                      className="dash-level-icon"
                      style={{
                        background: `linear-gradient(135deg, ${cardColors[2]?.primary}20, ${cardColors[2]?.secondary}20)`,
                        borderColor: cardColors[2]?.primary,
                        color: cardColors[2]?.primary,
                        width: '6rem',
                        height: '6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: '2px solid',
                        margin: '0 auto 1.5rem auto'
                      }}
                    >
                      <div style={{ fontSize: '3.5rem' }}>
                        {currentLevel.icon}
                      </div>
                    </div>
                    <span className="dash-level-name" style={{
                      fontSize: '1.8rem',
                      fontWeight: '700',
                      color: '#000000',
                      lineHeight: '1',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      display: 'block'
                    }}>
                      {currentLevel.label}
                    </span>
                  </div>
                  {currentLevel.nextLevel && (
                    <div className="dash-level-progress-simple" style={{ marginTop: '1.5rem' }}>
                      <div className="dash-level-progress-track" style={{
                        height: '12px',
                        background: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div
                          className="dash-level-progress-fill"
                          style={{
                            width: `${Math.min(((userData.totalHours - getLevelStartHours(currentLevel.label)) / (getLevelEndHours(currentLevel.label) - getLevelStartHours(currentLevel.label))) * 100, 100)}%`,
                            background: `linear-gradient(90deg, ${cardColors[2]?.primary}, ${cardColors[2]?.secondary})`,
                            height: '100%',
                            borderRadius: '6px',
                            transition: 'width 0.8s ease-out',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                          }}
                        ></div>
                      </div>
                      <span className="dash-level-progress-text" style={{
                        fontSize: '1rem',
                        color: '#475569',
                        fontWeight: '600',
                        textAlign: 'center',
                        marginTop: '1rem',
                        lineHeight: '1.4',
                        display: 'block'
                      }}>
                        {t('dashboard.hoursToMilestone', { count: currentLevel.hoursToNext, level: currentLevel.nextLevel })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
              document.documentElement.dir = 'ltr';
              setShowLangOptions(false);
              // Force re-render by updating data
              setDataLoaded(prev => ({ ...prev, recentActivity: false, upcomingSessions: false }));
              if (userData.volunteerId || userData.totalHours > 0) {
                fetchRecentActivity();
              }
              fetchUpcomingSessions();
            }}>
              {t('dashboard.languages.english')}
            </button>
            <button onClick={async () => {
              localStorage.setItem('language', 'he');
              await i18n.changeLanguage('he');
              setCurrentLanguage('he');
              document.documentElement.dir = 'rtl';
              setShowLangOptions(false);
              // Force re-render by updating data
              setDataLoaded(prev => ({ ...prev, recentActivity: false, upcomingSessions: false }));
              if (userData.volunteerId || userData.totalHours > 0) {
                fetchRecentActivity();
              }
              fetchUpcomingSessions();
            }}>
              {t('dashboard.languages.hebrew')}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard; 