import { useEffect, useState } from "react";
import { User, Phone, CheckCircle2, Lock, Star, BadgeCheck, Plus, X, Eye, EyeOff, Globe, Hand, UserCheck, Hammer, HeartHandshake, ThumbsUp, Award, ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import LoadingScreen from "@/components/volunteer/InnerLS";
import "./styles/Profile.css";

const getLevel = (hours, t) => {
  if (hours >= 0 && hours <= 9)
    return { label: t("Beginner"), icon: <Star size={36} /> };
  if (hours >= 10 && hours <= 29)
    return { label: t("Helper"), icon: <Hand size={36} /> };
  if (hours >= 30 && hours <= 59)
    return { label: t("Contributor"), icon: <UserCheck size={36} /> };
  if (hours >= 60 && hours <= 99)
    return { label: t("Supporter"), icon: <HeartHandshake size={36} /> };
  if (hours >= 100 && hours <= 149)
    return { label: t("Advocate"), icon: <ThumbsUp size={36} /> };
  if (hours >= 150 && hours <= 199)
    return { label: t("Champion"), icon: <ShieldCheck size={36} /> };
  if (hours >= 200 && hours <= 420)
    return { label: t("Humanitarian"), icon: <Globe size={36} /> };
  return { label: t("Lord of the deeds"), icon: <MarijuanaIcon />};
};

const MarijuanaIcon = ({ size = 36 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M12 2C12 2 9.5 7 12 13C14.5 7 12 2 12 2ZM12 13C7.5 11 2 13 2 13C6 15 10 15 12 17C14 15 18 15 22 13C22 13 16.5 11 12 13ZM12 13C10 17 8 22 8 22H16C16 22 14 17 12 13Z" />
  </svg>
);

// Calculate total hours and sessions from appointmentsHistory
const calculateStatsFromHistory = (appointmentsHistory) => {
  if (!appointmentsHistory || !Array.isArray(appointmentsHistory)) {
    return { totalHours: 0, totalSessions: 0, unsavedAppointments: [] };
  }

  let totalHours = 0;
  let totalSessions = 0;
  let unsavedAppointments = [];

  appointmentsHistory.forEach((appointment, index) => {
    // Skip if already saved (already counted in database totals)
    if (appointment.saved === true) {
      return;
    }
    
    // Track unsaved appointments for later update
    unsavedAppointments.push(index);
    
    // Only count attended appointments
    if (appointment.attendanceStatus === 'attended') {
      totalSessions++;
      
      // Calculate hours for this appointment
      if (appointment.startTime && appointment.endTime) {
        try {
          // Parse times - handling both "9:00" and "09:00" formats
          const parseTime = (timeStr) => {
            const parts = timeStr.split(':');
            return {
              hours: parseInt(parts[0], 10),
              minutes: parseInt(parts[1] || '0', 10)
            };
          };
          
          const start = parseTime(appointment.startTime);
          const end = parseTime(appointment.endTime);
          
          // Convert to minutes for easier calculation
          const startMinutes = start.hours * 60 + start.minutes;
          const endMinutes = end.hours * 60 + end.minutes;
          
          // Calculate duration in hours
          const durationMinutes = endMinutes - startMinutes;
          const durationHours = durationMinutes / 60;
          
          // Add to total hours if duration is positive
          if (durationHours > 0) {
            totalHours += durationHours;
          }
        } catch (error) {
          // Silently continue
        }
      }
    }
  });

  // Round total hours to nearest integer since database expects int
  const result = { 
    totalHours: Math.round(totalHours), // Round to nearest whole number
    totalSessions,
    unsavedAppointments // Array of indices that need to be marked as saved
  };
  
  return result;
};

// Update volunteer stats in database
const updateVolunteerStats = async (volunteerId, stats, appointmentsHistory) => {
  try {
    const volunteerRef = doc(db, "volunteers", volunteerId);
    
    // Get current totals to add to them
    const volunteerDoc = await getDoc(volunteerRef);
    const currentData = volunteerDoc.data();
    const currentTotalHours = currentData.totalHours || 0;
    const currentTotalSessions = currentData.totalSessions || 0;
    
    // Calculate new totals
    const newTotalHours = currentTotalHours + stats.totalHours;
    const newTotalSessions = currentTotalSessions + stats.totalSessions;
    
    // Mark unsaved appointments as saved
    const updatedAppointments = [...appointmentsHistory];
    stats.unsavedAppointments.forEach(index => {
      updatedAppointments[index] = {
        ...updatedAppointments[index],
        saved: true
      };
    });
    
    const updateData = {
      totalHours: parseInt(newTotalHours, 10), // Ensure it's an integer
      totalSessions: parseInt(newTotalSessions, 10), // Ensure it's an integer
      appointmentsHistory: updatedAppointments,
      lastCalculated: new Date()
    };
    
    await updateDoc(volunteerRef, updateData);
    
    // Return the new totals
    return {
      totalHours: newTotalHours,
      totalSessions: newTotalSessions
    };
  } catch (error) {
    throw error;
  }
};

function Profile() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [skills, setSkills] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLangOptions, setShowLangOptions] = useState(false);
  
  // Firebase data state
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [volunteerId, setVolunteerId] = useState(null);
  const [userDocId, setUserDocId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const checkCurrentUser = () => {
      const user = auth.currentUser;
      if (user) {
        setCurrentUser(user);
        setLoading(false);
      }
    };

    checkCurrentUser();

    const timeoutId = setTimeout(() => {
      checkCurrentUser();
    }, 1000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Fetch data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let userId = null;
        
        // Method 1: Try localStorage keys
        const localStorageKeys = ['userId', 'user_id', 'uid', 'currentUserId', 'authUserId'];
        for (const key of localStorageKeys) {
          const storedId = localStorage.getItem(key);
          if (storedId) {
            userId = storedId;
            break;
          }
        }

        // Method 2: Try Firebase auth
        if (!userId && auth.currentUser) {
          userId = auth.currentUser.uid;
        }

        if (!userId) {
          setLoading(false);
          return;
        }

        // Get volunteer document by userId
        const volunteersRef = collection(db, "volunteers");
        const q = query(volunteersRef, where("userId", "==", userId));
        const volunteerSnapshot = await getDocs(q);
        
        if (volunteerSnapshot.empty) {
          setLoading(false);
          return;
        }

        const volunteerDoc = volunteerSnapshot.docs[0];
        const volunteerData = volunteerDoc.data();
        
        // Check for both old and new field names
        const appointmentsData = volunteerData.appointmentsHistory || volunteerData.appointmentHistory;

        // Store the volunteer document ID for updates
        setVolunteerId(volunteerDoc.id);

        // Calculate stats from appointmentsHistory (only unsaved appointments)
        const appointmentsHistory = volunteerData.appointmentsHistory || [];
        const calculatedStats = calculateStatsFromHistory(appointmentsHistory);

        // Check if we need to update the database (if there are unsaved appointments)
        const needsUpdate = calculatedStats.unsavedAppointments.length > 0;

        let finalTotalHours = volunteerData.totalHours || 0;
        let finalTotalSessions = volunteerData.totalSessions || 0;

        if (needsUpdate) {
          const updatedTotals = await updateVolunteerStats(volunteerDoc.id, calculatedStats, appointmentsHistory);
          finalTotalHours = updatedTotals.totalHours;
          finalTotalSessions = updatedTotals.totalSessions;
        }

        // Get user document for username
        const userRef = doc(db, "users", volunteerData.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        // Store user document ID and email for password operations
        setUserDocId(volunteerData.userId);
        setUserEmail(userData.email);

        // Try to get username from localStorage first, then from Firestore
        let username = localStorage.getItem('username') || localStorage.getItem('user_username');
        
        if (!username) {
          username = userData.username || "@unknown";
        }

        // Combine data with final stats
        const profileData = {
          fullName: volunteerData.fullName || "",
          username: username,
          phone: volunteerData.phoneNumber || "",
          joinDate: volunteerData.createdAt?.toDate() || new Date(),
          totalHours: finalTotalHours,
          completedSessions: finalTotalSessions,
          skills: volunteerData.skills || ["Reading", "Music", "Companionship"],
          appointmentsHistory: appointmentsHistory
        };

        setUserProfile(profileData);
        setSkills(profileData.skills);
        
      } catch (error) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Removed recalculateStats function

  useEffect(() => {
    if (userProfile?.totalHours) {
      const value = Math.min(userProfile.totalHours, 100);
      setTimeout(() => setProgress((value / 100) * 565.48), 200);
    }
  }, [userProfile]);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const addSkill = async () => {
    const newSkill = prompt(t("profile.prompt.newSkill"));
    if (newSkill && !skills.includes(newSkill)) {
      const updatedSkills = [...skills, newSkill];
      
      setSkills(updatedSkills);
      
      try {
        if (volunteerId) {
          const volunteerRef = doc(db, "volunteers", volunteerId);
          await updateDoc(volunteerRef, {
            skills: updatedSkills
          });
          
          toast({ 
            title: t("profile.toast.addedTitle"), 
            description: t("profile.toast.addedDesc", { skill: newSkill }) 
          });
        }
      } catch (error) {
        setSkills(skills);
        toast({ 
          title: "Error", 
          description: "Failed to add skill. Please try again.", 
          variant: "destructive" 
        });
      }
    }
  };

  const removeSkill = async (skill) => {
    const updatedSkills = skills.filter(s => s !== skill);
    
    setSkills(updatedSkills);
    
    try {
      if (volunteerId) {
        const volunteerRef = doc(db, "volunteers", volunteerId);
        await updateDoc(volunteerRef, {
          skills: updatedSkills
        });
        
        toast({ 
          title: t("profile.toast.removedTitle"), 
          description: t("profile.toast.removedDesc", { skill }) 
        });
      }
    } catch (error) {
      setSkills(skills);
      toast({ 
        title: "Error", 
        description: "Failed to remove skill. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handlePasswordChange = async () => {
    setPasswordChangeStatus(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeStatus({ type: "error", message: "Please fill in all password fields" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeStatus({ type: "error", message: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeStatus({ type: "error", message: "New password must be at least 6 characters long" });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordChangeStatus({ type: "error", message: "New password must be different from current password" });
      return;
    }

    try {
      setPasswordChangeStatus({ type: "loading", message: "Changing password..." });
      
      if (!userDocId) {
        setPasswordChangeStatus({ type: "error", message: "User data not found" });
        return;
      }

      const userRef = doc(db, "users", userDocId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        setPasswordChangeStatus({ type: "error", message: "User document not found" });
        return;
      }

      const userData = userSnap.data();
      const storedPasswordHash = userData.passwordHash;

      if (!storedPasswordHash) {
        setPasswordChangeStatus({ type: "error", message: "No password set for this user" });
        return;
      }

      const isPlainTextPassword = storedPasswordHash.length < 20;
      const encoder = new TextEncoder();
      let passwordMatches = false;
      
      if (isPlainTextPassword) {
        passwordMatches = currentPassword === storedPasswordHash;
      } else {
        const currentPasswordData = encoder.encode(currentPassword);
        const currentHashBuffer = await crypto.subtle.digest('SHA-256', currentPasswordData);
        const currentHashArray = Array.from(new Uint8Array(currentHashBuffer));
        const currentPasswordHash = currentHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        passwordMatches = currentPasswordHash === storedPasswordHash;
      }

      if (!passwordMatches) {
        setPasswordChangeStatus({ type: "error", message: "Current password is incorrect" });
        return;
      }

      const newPasswordData = encoder.encode(newPassword);
      const newHashBuffer = await crypto.subtle.digest('SHA-256', newPasswordData);
      const newHashArray = Array.from(new Uint8Array(newHashBuffer));
      const newPasswordHash = newHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      await updateDoc(userRef, {
        passwordHash: newPasswordHash,
        lastPasswordChange: new Date()
      });

      setPasswordChangeStatus({ type: "success", message: "Password changed successfully!" });
      
      setTimeout(() => {
        setCurrentPassword(""); 
        setNewPassword(""); 
        setConfirmPassword("");
        setPasswordChangeStatus(null);
      }, 3000);
      
    } catch (error) {
      setPasswordChangeStatus({ type: "error", message: "Failed to change password. Please try again." });
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f2f4f6', minHeight: '100vh' }}>
        <LoadingScreen />
      </div>
    );
  }

  if (!userProfile && !loading) {
    return (
      <div style={{ backgroundColor: '#f2f4f6', minHeight: '100vh' }}>
        <LoadingScreen />
      </div>
    );
  }

  const formattedDate = userProfile.joinDate.toLocaleDateString(
    i18n.language === "he" ? "he" : "en",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const level = getLevel(userProfile.totalHours, t);

  return (
    <div className="profile-page" dir={i18n.language === "he" ? "rtl" : "ltr"}>
      {/* Language toggle */}
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

      {/* Header */}
      <div className="profile-header">
        <h1 className="profile-title">{t("profile.title")}</h1>
        <p className="profile-subtitle">{t("profile.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <div className={`tabs ${i18n.language === "he" ? "tabs-rtl" : ""}`}>
          {i18n.language === "he" ? (
            <>
              <button className={`tab-item ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
                <Lock size={20} /> {t("profile.tabs.security")}
              </button>
              <button className={`tab-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                <User size={20} /> {t("profile.tabs.info")}
              </button>
            </>
          ) : (
            <>
              <button className={`tab-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                <User size={20} /> {t("profile.tabs.info")}
              </button>
              <button className={`tab-item ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
                <Lock size={20} /> {t("profile.tabs.security")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="profile-content">
        {activeTab === "profile" && (
          <div className="profile-overview">
            <div className="profile-header-content">
              {/* Avatar & name */}
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  <User size={64} />
                </div>
                <div className="profile-name-details">
                  <h3 className="profile-name">{userProfile.fullName}</h3>
                  <p className="profile-joined">{t("profile.memberSince")}: {formattedDate}</p>
                </div>
              </div>

              {/* Hours circle */}
              <div className="profile-hours">
                <div className="hours-progress-container">
                  <svg className="circle-progress" viewBox="0 0 200 200">
                    <circle className="circle-bg" cx="100" cy="100" r="90" strokeWidth="10" />
                    <circle className="circle-value" cx="100" cy="100" r="90" strokeWidth="10"
                      strokeDasharray="565.48" strokeDashoffset={565.48 - progress} />
                  </svg>
                  <div className="hours-display">
                    <span className="hours-number">{userProfile.totalHours}</span>
                    <span className="hours-label">{t("profile.totalHours")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="profile-stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><User size={36} /></div>
                <p className="stat-label">{t("profile.username")}</p>
                <p className="stat-value"><span dir="ltr">{userProfile.username}</span></p>
              </div>
              <div className="stat-card">
                <div className="stat-icon badge-icon-container">{level.icon}</div>
                <p className="stat-label">{t("profile.status")}</p>
                <p className="stat-value">{level.label}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><Phone size={36} /></div>
                <p className="stat-label">{t("profile.phone")}</p>
                <p className="stat-value"><span dir="ltr">{userProfile.phone}</span></p>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><CheckCircle2 size={36} /></div>
                <p className="stat-label">{t("profile.completedSessions")}</p>
                <p className="stat-value">{userProfile.completedSessions}</p>
              </div>
            </div>

            {/* Skills section */}
            <div className="skills-section">
              <h4 className="section-title">{t("profile.skills")}</h4>
              <div className="skills-list">
                {skills.map((skill, i) => (
                  <span className="skill-badge" key={i}>
                    {skill}
                    <X size={14} className="remove-skill" onClick={() => removeSkill(skill)} />
                  </span>
                ))}
                <button className="add-skill-btn" onClick={addSkill}>
                  <Plus size={14} /> {t("profile.addSkill")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security tab */}
        {activeTab === "security" && (
          <div className="security-section">
            <div className="profile-overview">
              <h4 className="section-title">{t("profile.changePassword")}</h4>
              <div className="password-form">
                {[
                  { label: t("profile.currentPassword"), value: currentPassword, set: setCurrentPassword, toggle: showCurrent, setToggle: setShowCurrent },
                  { label: t("profile.newPassword"), value: newPassword, set: setNewPassword, toggle: showNew, setToggle: setShowNew },
                  { label: t("profile.confirmPassword"), value: confirmPassword, set: setConfirmPassword, toggle: showConfirm, setToggle: setShowConfirm }
                ].map((field, i) => (
                  <div className="form-group" key={i}>
                    <label className="form-label">{field.label}</label>
                    <div className="password-input-container">
                      <input
                        className="password-input"
                        type={field.toggle ? "text" : "password"}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                      />
                      <button
                        type="button"
                        className="toggle-visibility"
                        onClick={() => field.setToggle(!field.toggle)}
                      >
                        {field.toggle ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
                <button className="submit-button" onClick={handlePasswordChange}>
                  {t("profile.confirmChange")}
                </button>
                
                {/* Status message area */}
                {passwordChangeStatus && (
                  <div className={`password-status ${passwordChangeStatus.type}`}>
                    {passwordChangeStatus.type === "loading" && (
                      <div className="loading-spinner">⏳</div>
                    )}
                    {passwordChangeStatus.type === "success" && (
                      <div className="success-icon">✅</div>
                    )}
                    {passwordChangeStatus.type === "error" && (
                      <div className="error-icon">❌</div>
                    )}
                    <span className="status-message">{passwordChangeStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;