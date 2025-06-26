import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Award, Calendar, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, CalendarDays, Users, Activity, FileText, Star, Target, ArrowUpRight, ArrowDownRight, Hand, UserCheck, HeartHandshake, ThumbsUp, ShieldCheck, Globe, Zap, TrendingDown } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/firebase';
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
  const { t, i18n } = useTranslation();
  const [animateHours, setAnimateHours] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoursProgress, setHoursProgress] = useState(0);
  const [cardColors, setCardColors] = useState([]);
  const [showLangOptions, setShowLangOptions] = useState(false);
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
      return { label: t("dashboard.levels.Beginner"), icon: <Star size={38} />, nextLevel: t("dashboard.levels.Helper"), hoursToNext: 10 - hours };
    if (hours >= 10 && hours < 30)
      return { label: t("dashboard.levels.Helper"), icon: <Hand size={38} />, nextLevel: t("dashboard.levels.Contributor"), hoursToNext: 30 - hours };
    if (hours >= 30 && hours < 60)
      return { label: t("dashboard.levels.Contributor"), icon: <UserCheck size={38} />, nextLevel: t("dashboard.levels.Supporter"), hoursToNext: 60 - hours };
    if (hours >= 60 && hours < 100)
      return { label: t("dashboard.levels.Supporter"), icon: <HeartHandshake size={36} />, nextLevel: t("dashboard.levels.Advocate"), hoursToNext: 100 - hours };
    if (hours >= 100 && hours < 150)
      return { label: t("dashboard.levels.Advocate"), icon: <ThumbsUp size={38} />, nextLevel: t("dashboard.levels.Champion"), hoursToNext: 150 - hours };
    if (hours >= 150 && hours < 200)
      return { label: t("dashboard.levels.Champion"), icon: <ShieldCheck size={38} />, nextLevel: t("dashboard.levels.Humanitarian"), hoursToNext: 200 - hours };
    if (hours >= 200 && hours < 420)
      return { label: t("dashboard.levels.Humanitarian"), icon: <Globe size={38} />, nextLevel: null, hoursToNext: 0 };
    return { label: t("dashboard.levels.Lord of the deeds"), icon: <Icon />, nextLevel: null, hoursToNext: 0 };
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
      console.error("Error parsing date/time:", error);
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

  // Fetch upcoming sessions from calendar_slots with proper time validation
  const fetchUpcomingSessions = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const calendarSlotsRef = collection(db, "calendar_slots");
      const q = query(calendarSlotsRef);
      
      const snapshot = await getDocs(q);
      const sessions = [];
      const now = new Date();

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
              
              // Parse end time to determine if session has actually ended
              const endTime = data.endTime;
              let sessionEndDateTime;
              
              if (data.date && endTime) {
                sessionEndDateTime = parseTimeAndCombineWithDate(data.date, endTime);
              } else {
                // If no end time, use start time + 2 hours as fallback
                const startTime = data.startTime;
                if (data.date && startTime) {
                  sessionEndDateTime = parseTimeAndCombineWithDate(data.date, startTime);
                  sessionEndDateTime.setHours(sessionEndDateTime.getHours() + 2); // Add 2 hours
                } else {
                  // Fallback to just date
                  try {
                    const [year, month, day] = data.date.split('-');
                    sessionEndDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    sessionEndDateTime.setHours(23, 59, 59, 999); // End of day
                  } catch (error) {
                    sessionEndDateTime = new Date();
                  }
                }
              }
              
              // Only show sessions that haven't ended yet
              if (sessionEndDateTime > now) {
                const startTime = data.startTime || "Time TBD";
                const endTimeStr = data.endTime || "";
                const timeRange = endTimeStr ? `${startTime} - ${endTimeStr}` : startTime;
                
                // Format display date
                let displayDate;
                try {
                  const [year, month, day] = data.date.split('-');
                  const sessionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  displayDate = sessionDate.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                } catch (error) {
                  displayDate = "Date TBD";
                }
                
                const session = {
                  id: doc.id,
                  title: data.customLabel || "Session",
                  date: displayDate,
                  time: timeRange,
                  location: data.location || "Location TBD",
                  fullDateTime: sessionEndDateTime
                };
                
                sessions.push(session);
              }
            }
          }
        } 
      });

      // Sort by end date/time and take first 3
      sessions.sort((a, b) => a.fullDateTime - b.fullDateTime);

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
          icon: Award,
          iconColor: 'dash-icon-gold'
        });
      }

      // Add the latest 5 attendance records
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        const status = data.status || "Unknown";
        const notes = data.notes || "";
        
        let timeAgo = "Recently";
        if (data.confirmedAt) {
          try {
            // Handle Firestore Timestamp object
            let confirmedDate;
            if (data.confirmedAt.toDate) {
              confirmedDate = data.confirmedAt.toDate();
            } else if (data.confirmedAt.seconds) {
              // Convert Firestore timestamp (seconds + nanoseconds) to Date
              confirmedDate = new Date(data.confirmedAt.seconds * 1000 + data.confirmedAt.nanoseconds / 1000000);
            } else {
              confirmedDate = new Date(data.confirmedAt);
            }
            
            const now = new Date();
            const diffTime = Math.abs(now - confirmedDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            
            if (diffDays === 0) {
              if (diffHours === 0) {
                if (diffMinutes === 0) timeAgo = 'Just now';
                else if (diffMinutes === 1) timeAgo = '1 minute ago';
                else timeAgo = `${diffMinutes} minutes ago`;
              } else if (diffHours === 1) timeAgo = '1 hour ago';
              else timeAgo = `${diffHours} hours ago`;
            }
            else if (diffDays === 1) timeAgo = '1 day ago';
            else if (diffDays < 7) timeAgo = `${diffDays} days ago`;
            else if (diffDays < 14) timeAgo = '1 week ago';
            else timeAgo = `${Math.floor(diffDays / 7)} weeks ago`;
            
            console.log("Calculated time ago:", timeAgo, "for date:", confirmedDate);
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
          iconColor: iconColor,
          confirmedAt: data.confirmedAt
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
    document.documentElement.dir = i18n.language === "he" ? "rtl" : "ltr";
  }, [i18n.language]);

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
    const timer = setTimeout(() => setLoading(false), 1000);
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    if (userData.volunteerId || userData.totalHours > 0) {
      fetchRecentActivity();
    }
  }, [i18n.language]);

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
    <div className="dash-dashboard-container">
      <div className="dash-dashboard-wrapper">
        <div className="dash-dashboard-header">
          <div className="dash-dashboard-header-top">
            <h1 className="dash-dashboard-title">{t('dashboard.title')}</h1>
          </div>
          <p className="dash-dashboard-greeting">
            {getGreeting()}, {userData.name}! 👋
          </p>
        </div>

        <div className="dash-new-layout-grid">
          {/* Left Column */}
          <div className="dash-left-column">
            {/* Check In Card */}
            <div className="dash-checkin-card">
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
            </div>

            {/* Upcoming Sessions */}
            <div className="dash-upcoming-card">
              <div className="dash-upcoming-header">
                <h2 className="dash-upcoming-title">{t('dashboard.upcoming.title')}</h2>
                <a href="/volunteer/appointments" className="dash-view-all-link">
                  {t('dashboard.upcoming.viewAll')}&nbsp;
                  {i18n.language === 'he'
                    ? <ChevronLeft style={{ width: '1rem', height: '1rem', display: 'inline' }} />
                    : <ChevronRight style={{ width: '1rem', height: '1rem', display: 'inline' }} />
                  }
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
                    <p>{t('dashboard.upcoming.none')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dash-activity-card">
              <div className="dash-activity-header">
                <h2 className="dash-activity-title">{t('dashboard.activity.title')}</h2>
              </div>
              <ul className="dash-activity-list">

                {recentActivity.map((activity) => {
                  const IconComponent = activity.icon;
                  const { type, notes = '' } = activity;
                  
                  // Calculate count based on actual time difference
                  const calculateCount = () => {
                    if (!activity.confirmedAt) return 0;
                    
                    try {
                      let confirmedDate;
                      if (activity.confirmedAt.toDate) {
                        confirmedDate = activity.confirmedAt.toDate();
                      } else if (activity.confirmedAt.seconds) {
                        confirmedDate = new Date(activity.confirmedAt.seconds * 1000 + activity.confirmedAt.nanoseconds / 1000000);
                      } else {
                        confirmedDate = new Date(activity.confirmedAt);
                      }
                      
                      const now = new Date();
                      const diffTime = Math.abs(now - confirmedDate);
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      
                      return diffDays;
                    } catch (error) {
                      console.error("Error calculating days:", error);
                      return 0;
                    }
                  };
                
                  const count = calculateCount();
                
                  // figure out which text key + params to use
                  const text = (() => {
                    switch (type) {
                      case 'level-up':
                        return t('dashboard.levelUp', { level: getLevel(userData.totalHours).label });
                      case 'present':
                        return t('dashboard.activity.present', { notes });
                      case 'late':
                        return t('dashboard.activity.late', { notes });
                      case 'absent':
                        return t('dashboard.activity.absent', { notes });
                      default:
                        return t('dashboard.activity.generic', { status: type, notes });
                    }
                  })();
                
                  const time = (() => {
                    if (type === 'level-up') {
                      return t('dashboard.time.recent');
                    }
                    if (count === 0) {
                      return t('dashboard.time.today');
                    }
                    if (count === 1) {
                      return t('dashboard.time.yesterday');
                    }
                    return t('dashboard.time.daysAgo', { count });
                  })();
                
                  return (
                    <li key={activity.id} className="dash-activity-item">
                      <div className="dash-activity-content">
                        <div className={`dash-activity-icon-wrapper ${activity.iconColor}`}>
                          <IconComponent className="dash-activity-icon" />
                        </div>
                        <div className="dash-activity-details">
                          <p className="dash-activity-text">{text}</p>
                          <p className="dash-activity-time">{time}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right Column */}
          <div className="dash-right-column">
            {/* Total Hours */}
            <div 
              className="dash-stat-widget dash-hours-widget" 
              style={{ background: cardColors[0]?.bg }}
            >
              <div className="dash-widget-header">
                <p className="dash-widget-label">{t('dashboard.stats.totalHours')}</p>
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
                  <circle
                    className={`dash-circle-value ${animateHours ? 'animate' : ''}`}
                    cx="100"
                    cy="100"
                    r="90"
                    strokeWidth="12"
                    strokeDasharray="565.48"
                    strokeDashoffset={hoursProgress}
                    style={{ '--final-offset': hoursProgress }}
                  />
                </svg>
                <div className="dash-hours-display">
                  <span className="dash-hours-number dash-hours-number-large">{userData.totalHours}</span>
                  <span className="dash-hours-label">{t('dashboard.stats.hoursLabel')}</span>
                </div>
              </div>
            </div>

            {/* Sessions Completed */}
            <div 
              className="dash-stat-widget dash-sessions-widget"
              style={{ background: cardColors[1]?.bg }}
            >
              <div className="dash-widget-header">
                <p className="dash-widget-label">{t('dashboard.stats.sessionsCompleted')}</p>
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
              </div>
            </div>

            {/* Current Level */}
            <div 
              className="dash-stat-widget dash-level-widget"
              style={{ background: cardColors[2]?.bg }}
            >
              <div className="dash-widget-header">
                <p className="dash-widget-label">{t('dashboard.stats.level')}</p>
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
              <div className={`dash-level-badge ${!currentLevel.nextLevel ? 'dash-level-badge--centered' : ''}`}>
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
                          {t('dashboard.nextLevel', { level: currentLevel.nextLevel })}
                      </span>
                      <span className="dash-next-level-mini-hours">
                        {t('dashboard.hoursToGo', { count: currentLevel.hoursToNext })}
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
        </div>
      </div>
      <div className={`language-toggle ${i18n.language === 'he' ? 'left' : 'right'}`}>
        <button className="lang-button" onClick={() => setShowLangOptions(!showLangOptions)}>
          <Globe size={35} />
        </button>
        {showLangOptions && (
          <div className={`lang-options ${i18n.language === 'he' ? 'rtl-popup' : 'ltr-popup'}`}>
            <button onClick={() => { i18n.changeLanguage('en'); setShowLangOptions(false); }}>
              English
            </button>
            <button onClick={() => { i18n.changeLanguage('he'); setShowLangOptions(false); }}>
              עברית
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;