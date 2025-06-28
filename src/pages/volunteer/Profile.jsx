import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, CheckCircle2, Lock, Star, BadgeCheck, Plus, X, Eye, EyeOff, Globe, Hand, UserCheck, Hammer, HeartHandshake, ThumbsUp, Award, ShieldCheck, Users, Languages, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import LoadingScreen from "@/components/volunteer/InnerLS";
import { Layout } from '@/components/volunteer/Layout';
import "./styles/Profile.css";

const getLevel = (hours, t) => {
  if (hours >= 0 && hours < 9)
    return { label: t("profile.badges.Beginner"), icon: <Star size={36} /> };
  if (hours >= 10 && hours < 29)
    return { label: t("profile.badges.Helper"), icon: <Hand size={36} /> };
  if (hours >= 30 && hours < 59)
    return { label: t("profile.badges.Contributor"), icon: <UserCheck size={36} /> };
  if (hours >= 60 && hours < 99)
    return { label: t("profile.badges.Supporter"), icon: <HeartHandshake size={36} /> };
  if (hours >= 100 && hours < 149)
    return { label: t("profile.badges.Advocate"), icon: <ThumbsUp size={36} /> };
  if (hours >= 150 && hours < 199)
    return { label: t("profile.badges.Champion"), icon: <ShieldCheck size={36} /> };
  if (hours >= 200 && hours < 420)
    return { label: t("profile.badges.Humanitarian"), icon: <Globe size={36} /> };
  return { label: t("profile.badges.Lord of the deeds"), icon: <Icon />};
};

const Icon = ({ size = 50 }) => (
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

function Profile() {
  const { t, i18n } = useTranslation('profile');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [animateHours, setAnimateHours] = useState(false);
  const langToggleRef = useRef(null);
  
  // Professional input states
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [showLanguageInput, setShowLanguageInput] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newLanguageInput, setNewLanguageInput] = useState("");
  
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

  useEffect(() => {
    if (activeTab === "profile") {
      if (userProfile?.totalHours != null) {
        setShouldAnimate(false);
      
        const capped = Math.min(userProfile.totalHours, 200);
        const finalOffset = 565.48 - (capped / 200) * 565.48;
        const circleEl = document.querySelector('.profile-hours .circle-value');
        if (circleEl) {
          circleEl.style.setProperty('--final-offset', finalOffset);
        }
        
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      }
    }
  }, [activeTab]); 

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
        
        // Store the volunteer document ID for updates
        setVolunteerId(volunteerDoc.id);

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

        // Get the direct fields without any calculations
        const profileData = {
          fullName: volunteerData.fullName || "",
          username: username,
          phone: volunteerData.phoneNumber || "",
          joinDate: volunteerData.createdAt?.toDate() || new Date(),
          totalHours: volunteerData.totalHours || 0,
          completedSessions: volunteerData.totalSessions || 0,
          skills: volunteerData.skills || ["Reading", "Music", "Companionship"],
          languages: volunteerData.languages || ["English", "Hebrew"]
        };

        setUserProfile(profileData);
        setSkills(profileData.skills);
        setLanguages(profileData.languages);
        
      } catch (error) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userProfile?.totalHours != null) {
      // cap at 200, compute raw dash offset:
      const capped = Math.min(userProfile.totalHours, 200);
      const finalOffset = 565.48 - (capped / 200) * 565.48;
      
      // set the CSS var on the container or directly inline
      const circleEl = document.querySelector('.profile-hours .circle-value');
      if (circleEl) {
        circleEl.style.setProperty('--final-offset', finalOffset);
      }
    
      // trigger the actual class toggle _after_ mount so keyframes run
      setTimeout(() => setShouldAnimate(true), 50);
    }
  }, [userProfile]);

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

  // Professional skill adding function
  const handleAddSkill = async () => {
    const trimmedSkill = newSkillInput.trim();
    
    if (!trimmedSkill) {
      toast({ 
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.emptySkill"), 
        variant: "destructive" 
      });
      return;
    }

    if (skills.length >= 5) {
      toast({ 
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.maxSkills"), 
        variant: "destructive" 
      });
      return;
    }

    if (skills.includes(trimmedSkill)) {
      toast({ 
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.duplicateSkill"), 
        variant: "destructive" 
      });
      return;
    }
    
    const updatedSkills = [...skills, trimmedSkill];
    setSkills(updatedSkills);
    setNewSkillInput("");
    setShowSkillInput(false);
    
    try {
      if (volunteerId) {
        const volunteerRef = doc(db, "volunteers", volunteerId);
        await updateDoc(volunteerRef, {
          skills: updatedSkills
        });
        
        toast({ 
          title: t("profile.toast.addedTitle"), 
          description: t("profile.toast.addedDesc", { skill: trimmedSkill }) 
        });
      }
    } catch (error) {
      setSkills(skills);
      toast({ 
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.addSkillError"), 
        variant: "destructive" 
      });
    }
  };

  // Professional language adding function
  const handleAddLanguage = async () => {
    const trimmedLanguage = newLanguageInput.trim();
    
    if (!trimmedLanguage) {
      toast({ 
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.emptyLanguage"), 
        variant: "destructive" 
      });
      return;
    }

    if (languages.length >= 5) {
      toast({ 
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.maxLanguages"), 
        variant: "destructive" 
      });
      return;
    }

    if (languages.includes(trimmedLanguage)) {
      toast({ 
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.duplicateLanguage"), 
        variant: "destructive" 
      });
      return;
    }
    
    const updatedLanguages = [...languages, trimmedLanguage];
    setLanguages(updatedLanguages);
    setNewLanguageInput("");
    setShowLanguageInput(false);
    
    try {
      if (volunteerId) {
        const volunteerRef = doc(db, "volunteers", volunteerId);
        await updateDoc(volunteerRef, {
          languages: updatedLanguages
        });
        
        toast({ 
          title: t("profile.toast.addedTitle"), 
          description: t("profile.toast.languageAdded", { language: trimmedLanguage }) 
        });
      }
    } catch (error) {
      setLanguages(languages);
      toast({ 
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.addLanguageError"), 
        variant: "destructive" 
      });
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
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.removeSkillError"), 
        variant: "destructive" 
      });
    }
  };

  const removeLanguage = async (language) => {
    const updatedLanguages = languages.filter(l => l !== language);
    
    setLanguages(updatedLanguages);
    
    try {
      if (volunteerId) {
        const volunteerRef = doc(db, "volunteers", volunteerId);
        await updateDoc(volunteerRef, {
          languages: updatedLanguages
        });
        
        toast({ 
          title: t("profile.toast.removedTitle"), 
          description: t("profile.toast.languageRemoved", { language }) 
        });
      }
    } catch (error) {
      setLanguages(languages);
      toast({ 
        title: t("profile.toast.errorTitle"), 
        description: t("profile.toast.removeLanguageError"), 
        variant: "destructive" 
      });
    }
  };

  // JavaScript SHA-256 implementation for Samsung browser compatibility
  const sha256 = async (message) => {
    // Pure JavaScript SHA-256 implementation
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }

    function sha256Hash(message) {
      const msgBuffer = new TextEncoder().encode(message);
      
      // Pre-processing: adding a single 1 bit
      const msgLength = msgBuffer.length;
      const bitLength = msgLength * 8;
      
      // Create a new array with padding
      const paddedLength = Math.ceil((bitLength + 65) / 512) * 512;
      const paddedArray = new Uint8Array(paddedLength / 8);
      paddedArray.set(msgBuffer);
      paddedArray[msgLength] = 0x80;
      
      // Append original length as 64-bit big-endian
      const view = new DataView(paddedArray.buffer);
      view.setUint32(paddedArray.length - 4, bitLength, false);
      
      // SHA-256 constants
      const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
      ];
      
      // Initial hash values
      let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
      let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
      
      // Process message in 512-bit chunks
      for (let chunk = 0; chunk < paddedArray.length; chunk += 64) {
        const w = new Array(64);
        
        // Copy chunk into first 16 words
        for (let i = 0; i < 16; i++) {
          w[i] = view.getUint32(chunk + i * 4, false);
        }
        
        // Extend the first 16 words into the remaining 48 words
        for (let i = 16; i < 64; i++) {
          const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
          const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
          w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        
        // Initialize working variables
        let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
        
        // Compression function main loop
        for (let i = 0; i < 64; i++) {
          const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
          const ch = (e & f) ^ (~e & g);
          const temp1 = (h + S1 + ch + k[i] + w[i]) >>> 0;
          const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
          const maj = (a & b) ^ (a & c) ^ (b & c);
          const temp2 = (S0 + maj) >>> 0;
          
          h = g; g = f; f = e; e = (d + temp1) >>> 0;
          d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
        }
        
        // Add this chunk's hash to result
        h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
      }
      
      // Produce the final hash value as a 256-bit number (hex string)
      return [h0, h1, h2, h3, h4, h5, h6, h7]
        .map(h => h.toString(16).padStart(8, '0'))
        .join('');
    }
    
    return sha256Hash(message);
  };

  // Universal hash function that works on all devices
  const createHash = async (password) => {
    // First try crypto.subtle (works on desktop)
    try {
      if (crypto && crypto.subtle && crypto.subtle.digest) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
    } catch (error) {
      // Fall through to JavaScript implementation
    }
    
    // Fallback to JavaScript SHA-256 (works on Samsung browser)
    const hash = await sha256(password);
    return hash;
  };

  const handlePasswordChange = async () => {
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

      // Check if stored password is plain text
      const isPlainTextPassword = storedPasswordHash.length < 30;
      let passwordMatches = false;
      
      if (isPlainTextPassword) {
        passwordMatches = currentPassword === storedPasswordHash;
      } else {
        try {
          const currentPasswordHash = await createHash(currentPassword);
          passwordMatches = currentPasswordHash === storedPasswordHash;
        } catch (hashError) {
          setPasswordChangeStatus({ 
            type: "error", 
            message: `Unable to verify password: ${hashError.message}` 
          });
          return;
        }
      }

      if (!passwordMatches) {
        setPasswordChangeStatus({ type: "error", message: "Current password is incorrect" });
        return;
      }

      let newPasswordHash;
      try {
        newPasswordHash = await createHash(newPassword);
      } catch (hashError) {
        setPasswordChangeStatus({ type: "error", message: "Cannot create secure password on this device" });
        return;
      }

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
      let errorMessage = "Failed to change password. Please try again.";
      
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please log in again.";
      } else if (error.code === 'network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      }
      
      setPasswordChangeStatus({ type: "error", message: errorMessage });
    }
  };

  // Cancel input functions
  const cancelSkillInput = () => {
    setNewSkillInput("");
    setShowSkillInput(false);
  };

  const cancelLanguageInput = () => {
    setNewLanguageInput("");
    setShowLanguageInput(false);
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
    <Layout>
      <div className="profile-page" dir={i18n.language === "he" ? "rtl" : "ltr"}>
        {/* Language toggle */}
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
                      {/* 1) Light-gray "track" ring underneath */}
                      <circle
                        className="circle-bg"
                        cx="100"
                        cy="100"
                        r="90"
                        strokeWidth="10"
                        fill="none"
                      />
                    
                      {/* 2) Animated green ring on top */}
                      <circle
                        className={`circle-value${shouldAnimate ? " animate" : ""}`}
                        cx="100"
                        cy="100"
                        r="90"
                        strokeWidth="10"
                        strokeDasharray="565.48"
                        fill="none"
                        /* stroke is now controlled via CSS */
                      />
                    </svg>
                    <div className="hours-display">
                      <span className="hours-number">{userProfile.totalHours}</span>
                      <span className="hours-label">{t("profile.Hours")}</span>
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
                <h4 className="section-title">{t("profile.skills")} ({skills.length}/5)</h4>
                <div className="skills-list">
                  {skills.map((skill, i) => (
                    <span className="skill-badge" key={i}>
                      {skill}
                      <X size={14} className="remove-skill" onClick={() => removeSkill(skill)} />
                    </span>
                  ))}
                  
                  {/* Professional Skill Input */}
                  {showSkillInput ? (
                    <div className="professional-input-container">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        placeholder={t("profile.enterSkill")}
                        className="professional-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        autoFocus
                      />
                      <div className="input-actions">
                        <button className="confirm-btn" onClick={handleAddSkill}>
                          <Check size={14} />
                        </button>
                        <button className="cancel-btn" onClick={cancelSkillInput}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    skills.length < 5 && (
                      <button className="add-skill-btn" onClick={() => setShowSkillInput(true)}>
                        <Plus size={14} /> {t("profile.addSkill")}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Languages section */}
              <div className="skills-section">
                <h4 className="section-title">{t("profile.languages")} ({languages.length}/5)</h4>
                <div className="skills-list">
                  {languages.map((language, i) => (
                    <span className="language-badge" key={i}>
                      <Languages size={14} />
                      {language}
                      <X size={14} className="remove-skill" onClick={() => removeLanguage(language)} />
                    </span>
                  ))}
                  
                  {/* Professional Language Input */}
                  {showLanguageInput ? (
                    <div className="professional-input-container">
                      <input
                        type="text"
                        value={newLanguageInput}
                        onChange={(e) => setNewLanguageInput(e.target.value)}
                        placeholder={t("profile.enterLanguage")}
                        className="professional-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                        autoFocus
                      />
                      <div className="input-actions">
                        <button className="confirm-btn" onClick={handleAddLanguage}>
                          <Check size={14} />
                        </button>
                        <button className="cancel-btn" onClick={cancelLanguageInput}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    languages.length < 5 && (
                      <button className="add-language-btn" onClick={() => setShowLanguageInput(true)}>
                        <Plus size={14} /> {t("profile.addLanguage")}
                      </button>
                    )
                  )}
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
    </Layout>
  );
}

export default Profile;