// React and routing
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";

// Third-party libraries
import { useTranslation } from "react-i18next";
import { Timestamp } from "firebase/firestore";

// Icons
import {
  Eye,
  Star,
  Plus,
  Menu,
  Edit,
  List,
  Phone,
  Clock,
  Users,
  Award,
  EyeOff,
  Search,
  Filter,
  Trash2,
  Clock4,
  Users2,
  Upload,
  Loader2,
  Calendar,
  FileText,
  UserCheck,
  LayoutGrid,
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  FileSpreadsheet,
  User as UserIcon,
} from "lucide-react";

// Contexts
import { useLanguage } from "@/contexts/LanguageContext";

// Utilities
import { cn } from "@/lib/utils";
import { validatePhoneNumber, getPhoneNumberError, formatPhoneNumber, validateUsername, validatePassword } from "@/utils/validation";

// Full name validation functions
const validateFullName = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false;
  
  // Allow English letters, Hebrew letters, spaces, hyphens, and apostrophes
  // Hebrew Unicode range: \u0590-\u05FF (includes Hebrew letters)
  // English letters: a-z, A-Z
  const nameRegex = /^[a-zA-Z\u0590-\u05FF\s'-]+$/;
  
  return nameRegex.test(name.trim());
};

const getFullNameError = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'errors.fullNameRequired';
  }
  
  if (name.trim().length < 2) {
    return 'errors.fullNameTooShort';
  }
  
  if (name.trim().length > 50) {
    return 'errors.fullNameTooLong';
  }
  
  if (!validateFullName(name)) {
    return 'errors.fullNameInvalid';
  }
  
  return null;
};

// Username validation function
const getUsernameError = (username: string): string | null => {
  if (!username || username.trim().length === 0) {
    return 'errors.usernameRequired';
  }
  
  if (username.trim().length < 3) {
    return 'errors.usernameTooShort';
  }
  
  if (username.trim().length > 20) {
    return 'errors.usernameTooLong';
  }
  
  if (!validateUsername(username)) {
    return 'errors.usernameInvalid';
  }
  
  return null;
};

// Password validation function
const getPasswordError = (password: string): string | null => {
  if (!password || password.trim().length === 0) {
    return 'errors.passwordRequired';
  }
  
  if (password.length < 8) {
    return 'errors.passwordTooShort';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'errors.passwordNoUppercase';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'errors.passwordNoLowercase';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'errors.passwordNoNumber';
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'errors.passwordNoSpecialChar';
  }
  
  if (!validatePassword(password)) {
    return 'errors.passwordInvalid';
  }
  
  return null;
};

// Password hashing function
const createHash = async (password: string): Promise<string> => {
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
  
  // Fallback SHA-256 implementation
  const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };
  
  return await sha256(password);
};

// Birth date validation function
const validateBirthDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const birthDate = new Date(dateString);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const birthYear = birthDate.getFullYear();
  
  // Check if it's a valid date
  if (isNaN(birthDate.getTime())) return false;
  
  // Check year range (1900 to current year minus 16)
  if (birthYear < 1900 || birthYear > currentYear - 16) return false;
  
  // Check if birth date is not in the future
  if (birthDate > currentDate) return false;
  
  return true;
};

const getBirthDateError = (dateString: string): string | null => {
  if (!dateString || dateString.trim().length === 0) {
    return 'errors.birthDateRequired';
  }
  
  if (!validateBirthDate(dateString)) {
    const birthDate = new Date(dateString);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const birthYear = birthDate.getFullYear();
    
    if (isNaN(birthDate.getTime())) {
      return 'errors.birthDateInvalid';
    }
    
    if (birthYear < 1900) {
      return 'errors.birthDateTooOld';
    }
    
    if (birthYear > currentYear - 16) {
      return 'errors.birthDateTooYoung';
    }
    
    if (birthDate > currentDate) {
      return 'errors.birthDateFuture';
    }
    
    return 'errors.birthDateInvalid';
  }
  
  return null;
};

// UI Components
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

// Custom components
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import DataTableSkeleton from "@/components/skeletons/DataTableSkeleton";

// Custom hooks
import { useAddUser, useDeleteUser, useUsers, useUpdateUser } from "@/hooks/useFirestoreUsers";
import { useVolunteers, useAddVolunteer, useUpdateVolunteer, useDeleteVolunteer, VolunteerUI } from "@/hooks/useFirestoreVolunteers";

// Types and interfaces
import { Volunteer, User as FirestoreUser, MatchingPreference, ReasonForVolunteering } from "@/services/firestore";

// Helper functions to map between English and Hebrew values
const getLanguageMapping = () => {
  const englishLanguages = [
    "Hebrew", "Arabic", "Persian", "Turkish", "Kurdish",
    "English", "French", "German", "Spanish", "Italian",
    "Russian", "Polish", "Ukrainian", "Romanian", "Greek",
    "Chinese", "Japanese", "Korean", "Hindi", "Urdu",
    "Thai", "Vietnamese", "Indonesian", "Malay", "Tagalog",
    "Swahili", "Amharic", "Hausa", "Yoruba", "Zulu",
    "Portuguese", "Dutch", "Swedish", "Norwegian", "Danish",
    "Finnish", "Hungarian", "Czech", "Slovak", "Bulgarian",
    "Croatian", "Serbian", "Slovenian", "Albanian", "Armenian",
    "Georgian", "Azerbaijani", "Kazakh", "Uzbek", "Mongolian"
  ];

  const hebrewLanguages = [
    "עברית", "ערבית", "פרסית", "טורקית", "כורדית",
    "אנגלית", "צרפתית", "גרמנית", "ספרדית", "איטלקית",
    "רוסית", "פולנית", "אוקראינית", "רומנית", "יוונית",
    "סינית", "יפנית", "קוריאנית", "הינדית", "אורדו",
    "תאית", "וייטנאמית", "אינדונזית", "מלאית", "טגלוג",
    "סוואהילי", "אמהרית", "האוסה", "יורובה", "זולו",
    "פורטוגזית", "הולנדית", "שוודית", "נורבגית", "דנית",
    "פינית", "הונגרית", "צ'כית", "סלובקית", "בולגרית",
    "קרואטית", "סרבית", "סלובנית", "אלבנית", "ארמנית",
    "גיאורגית", "אזרבייג'נית", "קזחית", "אוזבקית", "מונגולית"
  ];

  const englishToHebrew = Object.fromEntries(englishLanguages.map((eng, index) => [eng, hebrewLanguages[index]]));
  const hebrewToEnglish = Object.fromEntries(hebrewLanguages.map((heb, index) => [heb, englishLanguages[index]]));

  return { englishToHebrew, hebrewToEnglish };
};

const getSkillMapping = () => {
  const englishSkills = [
    "Reading", "Writing", "Public Speaking", "Teaching", "Tutoring",
    "Mentoring", "Leadership", "Teamwork", "Communication", "Conflict Resolution",
    "First Aid", "CPR", "Event Planning", "Fundraising", "Cooking",
    "Baking", "Gardening", "Art", "Painting", "Drawing", "Crafts",
    "Sewing", "Knitting", "Carpentry", "Woodworking", "Technology",
    "Computer Skills", "Social Media", "Photography", "Videography", "Music",
    "Singing", "Playing Instruments", "Dancing", "Theater", "Sports",
    "Swimming", "Walking", "Hiking", "Cycling", "Yoga",
    "Meditation", "Chess", "Puzzles", "Board Games", "Movies",
    "TV Shows", "Documentaries", "Podcasts", "Radio", "Travel",
    "Languages", "History", "Science", "Pottery", "Jewelry Making", "Calligraphy", "Fishing",
    "Bird Watching", "Astronomy", "Collecting", "Volunteering"
  ];

  const hebrewSkills = [
    "קריאה", "כתיבה", "דיבור בפני קהל", "הוראה", "שיעורים פרטיים",
    "הנחיה", "מנהיגות", "עבודת צוות", "תקשורת", "פתרון קונפליקטים",
    "עזרה ראשונה", "החייאה", "תכנון אירועים", "גיוס כספים", "בישול",
    "אפייה", "גינון", "אמנות", "ציור", "רישום",
    "מלאכות יד", "תפירה", "סריגה", "נגרות", "עבודת עץ",
    "טכנולוגיה", "כישורי מחשב", "מדיה חברתית", "צילום", "וידאו",
    "מוזיקה", "שירה", "נגינה בכלים", "ריקוד", "תיאטרון",
    "ספורט", "שחייה", "הליכה", "טיולים", "רכיבה על אופניים",
    "יוגה", "מדיטציה", "שחמט", "חידות", "משחקי קופסה",
    "סרטים", "תוכניות טלוויזיה", "סרטים תיעודיים", "פודקאסטים", "רדיו",
    "נסיעות", "שפות", "היסטוריה", "מדע", "קדרות", "יצירת תכשיטים", "קליגרפיה",
    "דיג", "צפייה בציפורים", "אסטרונומיה", "איסוף", "התנדבות"
  ];

  const englishToHebrew = Object.fromEntries(englishSkills.map((eng, index) => [eng, hebrewSkills[index]]));
  const hebrewToEnglish = Object.fromEntries(hebrewSkills.map((heb, index) => [heb, englishSkills[index]]));

  return { englishToHebrew, hebrewToEnglish };
};

const getHobbyMapping = () => {
  const englishHobbies = [
    "Reading", "Writing", "Painting", "Drawing", "Photography",
    "Gardening", "Cooking", "Baking", "Knitting", "Sewing",
    "Music", "Singing", "Playing Instruments", "Dancing", "Theater",
    "Sports", "Swimming", "Walking", "Hiking", "Cycling",
    "Yoga", "Meditation", "Chess", "Puzzles", "Board Games",
    "Movies", "TV Shows", "Documentaries", "Podcasts", "Radio",
    "Travel", "Languages", "History", "Science", "Pottery", "Jewelry Making", "Calligraphy",
    "Fishing", "Bird Watching", "Astronomy", "Collecting", "Volunteering"
  ];

  const hebrewHobbies = [
    "קריאה", "כתיבה", "ציור", "רישום", "צילום",
    "גינון", "בישול", "אפייה", "סריגה", "תפירה",
    "מוזיקה", "שירה", "נגינה בכלים", "ריקוד", "תיאטרון",
    "ספורט", "שחייה", "הליכה", "טיולים", "רכיבה על אופניים",
    "יוגה", "מדיטציה", "שחמט", "חידות", "משחקי קופסה",
    "סרטים", "תוכניות טלוויזיה", "סרטים תיעודיים", "פודקאסטים", "רדיו",
    "נסיעות", "שפות", "היסטוריה", "מדע", "קדרות", "יצירת תכשיטים", "קליגרפיה",
    "דיג", "צפייה בציפורים", "אסטרונומיה", "איסוף", "התנדבות"
  ];

  const englishToHebrew = Object.fromEntries(englishHobbies.map((eng, index) => [eng, hebrewHobbies[index]]));
  const hebrewToEnglish = Object.fromEntries(hebrewHobbies.map((heb, index) => [heb, englishHobbies[index]]));

  return { englishToHebrew, hebrewToEnglish };
};

// Array manipulation helper functions
const isValueInArray = (value: string, array: string[], isRTL: boolean) => {
  if (!array || array.length === 0) return false;

  // Direct match
  if (array.includes(value)) return true;

  // If RTL (Hebrew), check if the English equivalent is in the array
  if (isRTL) {
    const { hebrewToEnglish } = getLanguageMapping();
    const englishValue = hebrewToEnglish[value];
    if (englishValue && array.includes(englishValue)) return true;

    const { hebrewToEnglish: skillMapping } = getSkillMapping();
    const englishSkillValue = skillMapping[value];
    if (englishSkillValue && array.includes(englishSkillValue)) return true;

    const { hebrewToEnglish: hobbyMapping } = getHobbyMapping();
    const englishHobbyValue = hobbyMapping[value];
    if (englishHobbyValue && array.includes(englishHobbyValue)) return true;
  }

  return false;
};

const addValueToArray = (value: string, array: string[], isRTL: boolean) => {
  if (isRTL) {
    // If RTL, convert Hebrew value to English for storage
    const { hebrewToEnglish } = getLanguageMapping();
    const englishValue = hebrewToEnglish[value];
    if (englishValue && !array.includes(englishValue)) {
      return [...array, englishValue];
    }

    const { hebrewToEnglish: skillMapping } = getSkillMapping();
    const englishSkillValue = skillMapping[value];
    if (englishSkillValue && !array.includes(englishSkillValue)) {
      return [...array, englishSkillValue];
    }

    const { hebrewToEnglish: hobbyMapping } = getHobbyMapping();
    const englishHobbyValue = hobbyMapping[value];
    if (englishHobbyValue && !array.includes(englishHobbyValue)) {
      return [...array, englishHobbyValue];
    }
  }

  // If LTR or no mapping found, add the value as is
  if (!array.includes(value)) {
    return [...array, value];
  }

  return array;
};

const removeValueFromArray = (value: string, array: string[], isRTL: boolean) => {
  if (!array || array.length === 0) return array;

  // Direct removal
  if (array.includes(value)) {
    return array.filter(item => item !== value);
  }

  // If RTL, try to remove the English equivalent
  if (isRTL) {
    const { hebrewToEnglish } = getLanguageMapping();
    const englishValue = hebrewToEnglish[value];
    if (englishValue && array.includes(englishValue)) {
      return array.filter(item => item !== englishValue);
    }

    const { hebrewToEnglish: skillMapping } = getSkillMapping();
    const englishSkillValue = skillMapping[value];
    if (englishSkillValue && array.includes(englishSkillValue)) {
      return array.filter(item => item !== englishSkillValue);
    }

    const { hebrewToEnglish: hobbyMapping } = getHobbyMapping();
    const englishHobbyValue = hobbyMapping[value];
    if (englishHobbyValue && array.includes(englishHobbyValue)) {
      return array.filter(item => item !== englishHobbyValue);
    }
  }

  return array.filter(item => item !== value);
};

// Translation helper functions
const translateArray = (
  array: string[],
  isRTL: boolean,
  direction: 'export' | 'import' = 'export'
) => {
  if (!isRTL || !array || array.length === 0) return array;

  if (direction === 'export') {
    // English to Hebrew
    const { englishToHebrew } = getLanguageMapping();
    const { englishToHebrew: skillMapping } = getSkillMapping();
    const { englishToHebrew: hobbyMapping } = getHobbyMapping();

    return array.map(item =>
      englishToHebrew[item] ||
      skillMapping[item] ||
      hobbyMapping[item] ||
      item
    );
  } else {
    // Hebrew to English
    const { hebrewToEnglish } = getLanguageMapping();
    const { hebrewToEnglish: skillMapping } = getSkillMapping();
    const { hebrewToEnglish: hobbyMapping } = getHobbyMapping();

    return array.map(item =>
      hebrewToEnglish[item] ||
      skillMapping[item] ||
      hobbyMapping[item] ||
      item
    );
  }
};

const translateGender = (gender: string, isRTL: boolean, direction: 'export' | 'import' = 'export') => {
  if (!isRTL) return gender; // Return as is for English

  if (direction === 'export') {
    // English to Hebrew (for export)
    const genderMapping = {
      'male': 'זכר',
      'female': 'נקבה'
    };
    return genderMapping[gender as keyof typeof genderMapping] || gender;
  } else {
    // Hebrew to English (for import)
    const genderMapping = {
      'זכר': 'male',
      'נקבה': 'female'
    };
    return genderMapping[gender as keyof typeof genderMapping] || gender;
  }
};

const translateStatus = (status: string, isRTL: boolean) => {
  if (!isRTL) return status;

  const statusMapping = {
    'פעיל': 'active',
    'לא פעיל': 'inactive'
  };

  return statusMapping[status as keyof typeof statusMapping] || status;
};

const translateMatchingPreference = (
  value: string,
  isRTL: boolean,
  direction: 'export' | 'import' = 'export'
) => {
  if (!isRTL) return value;

  if (direction === 'export') {
    // English to Hebrew
    const mapping: Record<string, string> = {
      'oneOnOne': 'אחד על אחד',
      'groupActivity': 'פעילות קבוצתית',
      'noPreference': 'אין העדפה',
    };
    return mapping[value] || value;
  } else {
    // Hebrew to English
    const mapping: Record<string, string> = {
      'אחד על אחד': 'oneOnOne',
      'פעילות קבוצתית': 'groupActivity',
      'אין העדפה': 'noPreference',
    };
    return mapping[value] || value;
  }
};

const translateReason = (
  value: string,
  isRTL: boolean,
  direction: 'export' | 'import' = 'export'
) => {
  if (!isRTL) return value;

  if (direction === 'export') {
    // English to Hebrew
    const mapping: Record<string, string> = {
      'scholarship': 'מלגה',
      'communityService': 'שירות קהילתי',
      'personalInterest': 'עניין אישי',
      'other': 'אחר',
    };
    return mapping[value] || value;
  } else {
    // Hebrew to English
    const mapping: Record<string, string> = {
      'מלגה': 'scholarship',
      'שירות קהילתי': 'communityService',
      'עניין אישי': 'personalInterest',
      'אחר': 'other',
    };
    return mapping[value] || value;
  }
};

const ManagerVolunteers = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('volunteers');
  const { isRTL } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerUI | null>(null);
  const [newVolunteer, setNewVolunteer] = useState<Omit<Volunteer, 'id'>>({
    userId: "", // Will be generated upon user creation
    fullName: "",
    phoneNumber: "",
    gender: "male",
    birthDate: "",
    isActive: true,
    skills: [],
    hobbies: [],
    languages: [],
    groupAffiliation: null,
    matchingPreference: null,
    reasonForVolunteering: null,
    createdAt: Timestamp.now(),
    notes: null
  });
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortState, setSortState] = useState<{
    field: "fullName" | "totalHours" | "totalSessions" | "createdAt" | "age";
    direction: "asc" | "desc";
  }>({
    field: "fullName",
    direction: "desc"
  });

  // Selection and bulk actions
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [volunteersToDelete, setVolunteersToDelete] = useState<VolunteerUI[]>([]);

  // Filters
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [hoursRange, setHoursRange] = useState<[number | null, number | null]>([null, null]);
  const [joinDateRange, setJoinDateRange] = useState<[string, string]>(["", ""]);
  const [sessionsRange, setSessionsRange] = useState<[number | null, number | null]>([null, null]);
  const [ageRange, setAgeRange] = useState<[number | null, number | null]>([null, null]);

  // Pagination
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Loading and async states
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);
  const [sortToggle, setSortToggle] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingLocal, setIsDeletingLocal] = useState(false);

  // File import/export
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Edit dialog
  const [showPassword, setShowPassword] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedPassword, setEditedPassword] = useState("");

  // Phone number validation states
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [editPhoneNumberError, setEditPhoneNumberError] = useState<string | null>(null);

  // Full name validation states
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [editFullNameError, setEditFullNameError] = useState<string | null>(null);

  // Username validation states
  const [editUsernameError, setEditUsernameError] = useState<string | null>(null);

  // Password validation states
  const [editPasswordError, setEditPasswordError] = useState<string | null>(null);

  // Birth date validation states
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [editBirthDateError, setEditBirthDateError] = useState<string | null>(null);

  // Firestore hooks
  const { volunteers, loading: volunteersLoading, error: volunteersError } = useVolunteers();
  const { users, loading: usersLoading } = useUsers();
  const { addUser } = useAddUser();
  const { updateUser } = useUpdateUser();
  const { deleteUser } = useDeleteUser();
  const { addVolunteer, loading: isCreating, error: createError } = useAddVolunteer();
  const { updateVolunteer, loading: isEditing, error: updateError } = useUpdateVolunteer();
  const { deleteVolunteer, loading: isDeleting, error: deleteError } = useDeleteVolunteer();

  // Check if user is authenticated
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (!user.id || user.role !== "manager") {
      navigate("/login");
    }
  }, [navigate]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  // Helper function to calculate age
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Phone number validation handlers
  const handlePhoneNumberChange = (value: string, isEdit: boolean = false) => {
    const error = getPhoneNumberError(value);
    if (isEdit) {
      setEditPhoneNumberError(error);
    } else {
      setPhoneNumberError(error);
    }
  };

  const handlePhoneNumberBlur = (value: string, isEdit: boolean = false) => {
    if (value.trim()) {
      const formatted = formatPhoneNumber(value);
      if (isEdit && selectedVolunteer) {
        setSelectedVolunteer({ ...selectedVolunteer, phoneNumber: formatted });
      } else {
        setNewVolunteer({ ...newVolunteer, phoneNumber: formatted });
      }
    }
  };

  // Full name validation handlers
  const handleFullNameChange = (value: string, isEdit: boolean = false) => {
    const error = getFullNameError(value);
    if (isEdit) {
      setEditFullNameError(error);
    } else {
      setFullNameError(error);
    }
  };

  const handleFullNameBlur = (value: string, isEdit: boolean = false) => {
    if (value.trim()) {
      const trimmedValue = value.trim();
      if (isEdit && selectedVolunteer) {
        setSelectedVolunteer({ ...selectedVolunteer, fullName: trimmedValue });
      } else {
        setNewVolunteer({ ...newVolunteer, fullName: trimmedValue });
      }
    }
  };

  // Username validation handlers
  const handleUsernameChange = (value: string) => {
    const error = getUsernameError(value);
    setEditUsernameError(error);
  };

  const handleUsernameBlur = (value: string) => {
    if (value.trim()) {
      const trimmedValue = value.trim();
      setEditedUsername(trimmedValue);
    }
  };

  // Password validation handlers
  const handlePasswordChange = (value: string) => {
    // Only validate if password is not empty
    if (value.trim()) {
      const error = getPasswordError(value);
      setEditPasswordError(error);
    } else {
      setEditPasswordError(null);
    }
  };

  const handlePasswordBlur = (value: string) => {
    if (value.trim()) {
      const trimmedValue = value.trim();
      setEditedPassword(trimmedValue);
    }
  };

  // Birth date validation handlers
  const handleBirthDateChange = (value: string, isEdit: boolean = false) => {
    const error = getBirthDateError(value);
    if (isEdit) {
      setEditBirthDateError(error);
    } else {
      setBirthDateError(error);
    }
  };

  // Filter volunteers based on search query and filters
  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch =
      volunteer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.gender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.phoneNumber.includes(searchQuery);

    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? volunteer.isActive : !volunteer.isActive);

    // Age filter
    const age = calculateAge(volunteer.birthDate);
    const matchesAge = (!ageRange[0] || age >= ageRange[0]) && (!ageRange[1] || age <= ageRange[1]);

    // Hours filter
    const matchesHours = (!hoursRange[0] || volunteer.totalHours >= hoursRange[0]) &&
      (!hoursRange[1] || volunteer.totalHours <= hoursRange[1]);

    // Sessions filter
    const matchesSessions = (!sessionsRange[0] || volunteer.totalSessions >= sessionsRange[0]) &&
      (!sessionsRange[1] || volunteer.totalSessions <= sessionsRange[1]);

    // Join date filter
    const joinDate = new Date(volunteer.createdAt);
    const matchesJoinDate = (!joinDateRange[0] || joinDate >= new Date(joinDateRange[0])) &&
      (!joinDateRange[1] || joinDate <= new Date(joinDateRange[1]));

    return matchesSearch && matchesStatus && matchesAge && matchesHours && matchesSessions && matchesJoinDate;
  });

  // Sort and filter volunteers
  const sortedAndFilteredVolunteers = useMemo(() => {
    return [...filteredVolunteers].sort((a, b) => {
      const direction = sortState.direction === "asc" ? 1 : -1;

      if (sortState.field === "fullName") {
        return -1 * direction * a.fullName.localeCompare(b.fullName);
      }

      if (sortState.field === "totalHours") {
        const aHours = a.totalHours || 0;
        const bHours = b.totalHours || 0;
        return direction * (aHours - bHours);
      }

      if (sortState.field === "totalSessions") {
        const aSessions = a.totalSessions || 0;
        const bSessions = b.totalSessions || 0;
        return direction * (aSessions - bSessions);
      }

      if (sortState.field === "createdAt") {
        return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      if (sortState.field === "age") {
        return -1 * direction * (calculateAge(a.birthDate) - calculateAge(b.birthDate));
      }

      return 0;
    });
  }, [filteredVolunteers, sortState, calculateAge]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedAndFilteredVolunteers.length / itemsPerPage);
  const paginatedVolunteers = sortedAndFilteredVolunteers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleMoreFilters = () => {
    console.log('handleMoreFilters called');
    setIsMoreFiltersOpen(true);
    console.log('isMoreFiltersOpen set to true');
  };

  // Add this function before handleCreateVolunteer
  const generateVolunteerUsername = async (): Promise<string> => {
    let username: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops

    while (!isUnique && attempts < maxAttempts) {
      // Generate a random 4-digit number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      username = `vol_${randomNum}`;

      // Check if username exists in users array
      const existingUser = users.find(user => user.username === username);
      if (!existingUser) {
        isUnique = true;
        return username;
      }

      attempts++;
    }

    throw new Error("Failed to generate a unique username after multiple attempts");
  };

  // Handle create new volunteer
  const handleCreateVolunteer = async () => {
    try {
      if (!newVolunteer.fullName || !newVolunteer.phoneNumber || !newVolunteer.birthDate) {
        alert(t('errors.fillRequiredFields'));
        return;
      }

      // Validate full name
      if (!validateFullName(newVolunteer.fullName)) {
        const error = getFullNameError(newVolunteer.fullName);
        setFullNameError(error);
        toast({
          title: t('volunteers:errors.invalidFullName'),
          description: error ? t(error, { ns: 'volunteers' }) : t('volunteers:errors.invalidFullNameDescription'),
          variant: "destructive"
        });
        return;
      }

      // Validate birth date
      if (!validateBirthDate(newVolunteer.birthDate)) {
        const error = getBirthDateError(newVolunteer.birthDate);
        setBirthDateError(error);
        toast({
          title: t('volunteers:errors.invalidBirthDate'),
          description: error ? t(error, { ns: 'volunteers' }) : t('volunteers:errors.invalidBirthDateDescription'),
          variant: "destructive"
        });
        return;
      }

      // Validate phone number
      if (!validatePhoneNumber(newVolunteer.phoneNumber)) {
        const error = getPhoneNumberError(newVolunteer.phoneNumber);
        setPhoneNumberError(error);
        toast({
          title: t('volunteers:errors.invalidPhoneNumber'),
          description: error || t('volunteers:errors.invalidPhoneNumberDescription'),
          variant: "destructive"
        });
        return;
      }

      // Generate unique username
      const username = await generateVolunteerUsername();

      // 1. Create the user first
      const newUser: Omit<FirestoreUser, 'id'> = {
        username,
        passwordHash: "Welcome123!", // Default password
        fullName: newVolunteer.fullName,
        role: "volunteer",
        isActive: true,
        createdAt: Timestamp.now()
      };

      const userRef = await addUser(newUser);
      const newUserId = userRef.id;

      if (!newUserId) {
        throw new Error("Failed to create user");
      }

      // 2. Create the new volunteer using the generated user ID
      const volunteerData: Omit<Volunteer, 'id'> = {
        ...newVolunteer,
        userId: newUserId, // Link volunteer to the newly created user
        createdAt: Timestamp.now(), // Ensure createdAt is set
        // Ensure required fields are present for the volunteer interface
        fullName: newVolunteer.fullName || '',
        phoneNumber: newVolunteer.phoneNumber || '',
        birthDate: newVolunteer.birthDate || '',
        gender: newVolunteer.gender || 'male',
        languages: newVolunteer.languages || [],
        isActive: newVolunteer.isActive === undefined ? true : newVolunteer.isActive,
        // Optional fields, ensuring they are correctly typed (null or array defaults)
        skills: newVolunteer.skills || [],
        hobbies: newVolunteer.hobbies || [],
        groupAffiliation: newVolunteer.groupAffiliation === undefined ? null : newVolunteer.groupAffiliation,
        matchingPreference: newVolunteer.matchingPreference === undefined ? null : newVolunteer.matchingPreference,
        reasonForVolunteering: newVolunteer.reasonForVolunteering === undefined ? null : newVolunteer.reasonForVolunteering,
        availability: newVolunteer.availability || { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
        notes: newVolunteer.notes === undefined ? null : newVolunteer.notes,
        // Defaulting these to 0 or empty array as they're managed elsewhere
        appointmentHistory: [],
        totalAttendance: { present: 0, absent: 0, late: 0 },
        totalSessions: 0,
        totalHours: 0,
      };

      await addVolunteer(volunteerData);

      // Reset form and close dialog on success
      setIsCreateDialogOpen(false);
      setNewVolunteer({
        fullName: "",
        phoneNumber: "",
        languages: [],
        skills: [],
        notes: null,
        isActive: true,
        birthDate: "",
        gender: "male",
        userId: "",
        createdAt: Timestamp.now(),
        hobbies: [],
        groupAffiliation: null,
        matchingPreference: null,
        reasonForVolunteering: null,
        availability: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }, // Reset availability
      });
    } catch (error) {
      console.error("Error creating user or volunteer:", error);
      toast({
        title: t('errors.createVolunteerErrorTitle'),
        description: t('errors.createVolunteerErrorDescription'),
        variant: "destructive"
      });
    }
  };

  // Handle edit volunteer
  const handleEditVolunteer = async () => {
    if (!selectedVolunteer) return;
    try {
      // Validate full name
      if (!validateFullName(selectedVolunteer.fullName)) {
        const error = getFullNameError(selectedVolunteer.fullName);
        setEditFullNameError(error);
        toast({
          title: t('volunteers:errors.invalidFullName'),
          description: error ? t(error, { ns: 'volunteers' }) : t('volunteers:errors.invalidFullNameDescription'),
          variant: "destructive"
        });
        return;
      }

      // Validate username
      if (!validateUsername(editedUsername)) {
        const error = getUsernameError(editedUsername);
        setEditUsernameError(error);
        toast({
          title: t('volunteers:errors.invalidUsername'),
          description: error ? t(error, { ns: 'volunteers' }) : t('volunteers:errors.invalidUsernameDescription'),
          variant: "destructive"
        });
        return;
      }

      // Validate password only if a new one is entered
      if (editedPassword.trim() && !validatePassword(editedPassword)) {
        const error = getPasswordError(editedPassword);
        setEditPasswordError(error);
        toast({
          title: t('volunteers:errors.invalidPassword'),
          description: error ? t(error, { ns: 'volunteers' }) : t('volunteers:errors.invalidPasswordDescription'),
          variant: "destructive"
        });
        return;
      }

      // Validate birth date
      if (!validateBirthDate(selectedVolunteer.birthDate)) {
        const error = getBirthDateError(selectedVolunteer.birthDate);
        setEditBirthDateError(error);
        toast({
          title: t('volunteers:errors.invalidBirthDate'),
          description: error ? t(error, { ns: 'volunteers' }) : t('volunteers:errors.invalidBirthDateDescription'),
          variant: "destructive"
        });
        return;
      }

      // Validate phone number
      if (!validatePhoneNumber(selectedVolunteer.phoneNumber)) {
        const error = getPhoneNumberError(selectedVolunteer.phoneNumber);
        setEditPhoneNumberError(error);
        toast({
          title: t('volunteers:errors.invalidPhoneNumber'),
          description: error || t('volunteers:errors.invalidPhoneNumberDescription'),
          variant: "destructive"
        });
        return;
      }

      // Update volunteer data
      const { id, createdAt, ...updateData } = selectedVolunteer;
      await updateVolunteer(id, updateData);

      // Update user data (username and password only if password is provided)
      if (selectedVolunteer.userId) {
        const updateData: any = {
          username: editedUsername
        };
        
        // Only update password if a new one is provided
        if (editedPassword.trim()) {
          // Hash the new password before updating
          const hashedPassword = await createHash(editedPassword);
          updateData.passwordHash = hashedPassword;
        }
        
        await updateUser(selectedVolunteer.userId, updateData);
      }

      setIsEditDialogOpen(false);
      setSelectedVolunteer(null);
    } catch (error) {
      console.error("Error updating volunteer:", error);
    }
  };

  // Handle sorting
  const handleSort = (field: "fullName" | "totalHours" | "totalSessions" | "createdAt" | "age") => {
    setSortToggle(prev => !prev); // flip the toggle
    setSortState(prev => ({
      field,
      direction: !sortToggle ? "asc" : "desc"
    }));
    setSelectedVolunteers([]); // Clear selection when sorting
  };

  // Handle volunteer selection
  const handleSelectVolunteer = (id: string) => {
    setSelectedVolunteers(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    // Only perform actions on selected volunteers that are currently visible
    const visibleSelectedVolunteers = selectedVolunteers.filter(id =>
      filteredVolunteers.some(volunteer => volunteer.id === id)
    );

    if (visibleSelectedVolunteers.length === 0) {
      alert(t('errors.bulkActionError'));
      return;
    }

    if (action === "delete") {
      // For delete action, show the delete dialog
      const volunteersBeingDeleted = volunteers.filter(v => visibleSelectedVolunteers.includes(v.id));
      setVolunteersToDelete(volunteersBeingDeleted);
      setSelectedVolunteer(volunteers.find(v => v.id === visibleSelectedVolunteers[0]));
      setIsDeleteDialogOpen(true);
      return;
    }

    // For other actions, proceed with the confirmation
    const confirmMessage = {
      activate: "Are you sure you want to activate the selected volunteers?",
      deactivate: "Are you sure you want to deactivate the selected volunteers?",
    }[action];

    if (window.confirm(confirmMessage)) {
      // Update each selected volunteer's status
      await Promise.all(visibleSelectedVolunteers.map(id =>
        updateVolunteer(id, { isActive: action === "activate" })
      ));
      // Clear selection after action
      setSelectedVolunteers([]);
    }
  };

  // Update the helper function
  const formatHours = (hours: number) => {
    if (Number.isInteger(hours)) {
      return hours.toString();
    }
    // Convert to one decimal place and remove trailing zeros
    return Number(hours.toFixed(1)).toString();
  };

  // --- HEADER ORDER FOR IMPORT/EXPORT ---
  const getImportExportHeaders = () => [
    isRTL ? "שם מלא" : "Full Name",
    isRTL ? "מספר טלפון" : "Phone Number",
    isRTL ? "מגדר" : "Gender",
    isRTL ? "גיל" : "Age",
    isRTL ? "תאריך לידה" : "Birth Date",
    isRTL ? "תאריך הצטרפות" : "Join Date",
    isRTL ? "סטטוס" : "Status",
    isRTL ? "סה\"כ שעות" : "Total Hours",
    isRTL ? "סה\"כ מפגשים" : "Total Sessions",
    isRTL ? "כישורים" : "Skills",
    isRTL ? "תחביבים" : "Hobbies",
    isRTL ? "שפות" : "Languages",
    isRTL ? "השתייכות קבוצה" : "Group Affiliation",
    isRTL ? "העדפת התאמה" : "Matching Preference",
    isRTL ? "סיבת התנדבות" : "Reason for Volunteering",
    isRTL ? "הערות" : "Notes"
  ];

  // --- HEADER ORDER FOR IMPORT ONLY ---
  const getImportHeaders = () => [
    isRTL ? "שם מלא" : "Full Name",
    isRTL ? "מספר טלפון" : "Phone Number",
    isRTL ? "מגדר" : "Gender",
    isRTL ? "תאריך לידה" : "Birth Date",
    isRTL ? "סטטוס" : "Status",
    isRTL ? "כישורים" : "Skills",
    isRTL ? "תחביבים" : "Hobbies",
    isRTL ? "שפות" : "Languages",
    isRTL ? "השתייכות קבוצה" : "Group Affiliation",
    isRTL ? "העדפת התאמה" : "Matching Preference",
    isRTL ? "סיבת התנדבות" : "Reason for Volunteering",
    isRTL ? "הערות" : "Notes"
  ];

  const handleExport = () => {
    // Only export selected volunteers that are currently visible
    const visibleSelectedVolunteers = selectedVolunteers.filter(id =>
      filteredVolunteers.some(volunteer => volunteer.id === id)
    );

    if (visibleSelectedVolunteers.length === 0) {
      alert(t('errors.exportError'));
      return;
    }

    // Get the selected volunteers' data
    const selectedVolunteersData = volunteers.filter(volunteer =>
      visibleSelectedVolunteers.includes(volunteer.id)
    );

    // Convert to CSV format with proper headers and data in current language
    const csvContent = [
      getImportExportHeaders().join(","),
      ...selectedVolunteersData.map(volunteer => [
        `"${volunteer.fullName.replace(/"/g, '""')}"`,
        `"${volunteer.phoneNumber.replace(/"/g, '""')}"`,
        `"${translateGender(volunteer.gender, isRTL)}"`,
        `"${calculateAge(volunteer.birthDate)}"`,
        `"${volunteer.birthDate}"`,
        `"${new Date(volunteer.createdAt).toLocaleDateString('en-GB')}"`,
        `"${volunteer.isActive ? t('filters.active') : t('filters.inactive')}"`,
        `"${formatHours(volunteer.totalHours || 0)}"`,
        `"${volunteer.totalSessions || 0}"`,
        `"${translateArray(volunteer.skills || [], isRTL).join("; ").replace(/"/g, '""')}"`,
        `"${translateArray(volunteer.hobbies || [], isRTL).join("; ").replace(/"/g, '""')}"`,
        `"${translateArray(volunteer.languages || [], isRTL).join("; ").replace(/"/g, '""')}"`,
        `"${(volunteer.groupAffiliation || "").replace(/"/g, '""')}"`,
        `"${translateMatchingPreference(volunteer.matchingPreference || "", isRTL)}"`,
        `"${translateReason(volunteer.reasonForVolunteering || "", isRTL)}"`,
        `"${(volunteer.notes || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    // Add UTF-8 BOM for proper Hebrew encoding
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Create and trigger download with proper encoding
    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `volunteers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clear selection after export
    setSelectedVolunteers([]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
          const fileHeaders = rows[0];

          // Validate header order for import
          if (fileHeaders.join(',') !== getImportHeaders().join(',')) {
            alert(t('errors.headerOrderError'));
            setIsImporting(false);
            return;
          }

          // Skip header row and process each volunteer
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < getImportHeaders().length) continue; // Skip invalid rows

            // Validate required fields
            if (!row[0] || !row[3]) { // Full Name, Birth Date
              console.warn(`Skipping row ${i + 1}: Missing required fields (name or birth date)`);
              continue;
            }

            // Generate unique username
            const username = await generateVolunteerUsername();

            // Create user account first
            const newUser: Omit<FirestoreUser, 'id'> = {
              username,
              passwordHash: "Welcome123!", // Default password
              fullName: row[0],
              role: "volunteer",
              isActive: translateStatus(row[4], isRTL) === 'active',
              createdAt: Timestamp.now()
            };

            const userRef = await addUser(newUser);
            const newUserId = userRef.id;

            if (!newUserId) {
              throw new Error("Failed to create user");
            }

            // Validate and normalize gender
            const rawGender = row[2]?.toLowerCase() || 'male';
            const translatedGender = translateGender(rawGender, isRTL, 'import');
            const gender: 'male' | 'female' = (translatedGender === 'male' || translatedGender === 'female') ? translatedGender : 'male';

            // Validate and normalize matching preference
            const rawMatchingPreference = row[9]?.toLowerCase();
            const translatedPreference = translateMatchingPreference(rawMatchingPreference, isRTL, 'import');
            const matchingPreference: MatchingPreference =
              (translatedPreference === 'oneOnOne' || translatedPreference === 'groupActivity' || translatedPreference === 'noPreference')
                ? translatedPreference as MatchingPreference : null;

            // Validate and normalize reason for volunteering
            const rawReason = row[10]?.toLowerCase();
            const translatedReason = translateReason(rawReason, isRTL, 'import');
            const reasonForVolunteering: ReasonForVolunteering =
              (translatedReason === 'scholarship' || translatedReason === 'communityService' || translatedReason === 'personalInterest' || translatedReason === 'other')
                ? translatedReason as ReasonForVolunteering : null;

            const volunteerData: Omit<Volunteer, 'id'> = {
              fullName: row[0],
              phoneNumber: row[1],
              gender,
              birthDate: row[3],
              isActive: translateStatus(row[4], isRTL) === 'active',
              totalHours: 0, // Default to 0 for new volunteers
              totalSessions: 0, // Default to 0 for new volunteers
              skills: translateArray(row[5]?.split(';').map(s => s.trim()) || [], isRTL, 'import'),
              hobbies: translateArray(row[6]?.split(';').map(h => h.trim()) || [], isRTL, 'import'),
              languages: translateArray(row[7]?.split(';').map(l => l.trim()) || [], isRTL, 'import'),
              groupAffiliation: row[8] || null,
              matchingPreference,
              reasonForVolunteering,
              notes: row[11] || null,
              createdAt: Timestamp.now(),
              userId: newUserId,
              // Add default values for required fields
              availability: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
              appointmentHistory: [],
              totalAttendance: { present: 0, absent: 0, late: 0 }
            };

            await addVolunteer(volunteerData);
          }
          setIsImportDialogOpen(false);
          setSelectedFile(null);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error('Error processing file:', error);
          alert(t('errors.processingError'));
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      console.error('Error importing volunteers:', error);
      alert(t('errors.importError'));
      setIsImporting(false);
    }
  };

  const handleDownloadSample = () => {
    // Create sample CSV content for import in current language
    const sampleData = [
      isRTL ? "אלכס כהן" : "Alex Cohen",
      "0501234567",
      isRTL ? "זכר" : "male",
      "1990-01-01",
      isRTL ? "פעיל" : "active",
      isRTL ? "הוראה; מנהיגות; תקשורת" : "Teaching; Leadership; Communication",
      isRTL ? "קריאה; טיולים; מוזיקה" : "Reading; Hiking; Music",
      isRTL ? "אנגלית; עברית" : "English; Hebrew",
      isRTL ? "מרכז קהילתי מקומי" : "Local Community Center",
      isRTL ? "אחד על אחד" : "oneOnOne",
      isRTL ? "עניין אישי" : "personalInterest",
      isRTL ? "מורה מנוסה" : "Experienced teacher"
    ];
    const csvContent = [
      getImportHeaders().join(","),
      sampleData.join(",")
    ].join("\n");

    // Add UTF-8 BOM for proper Hebrew encoding
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Create and trigger download with proper encoding
    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "volunteer_import_sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update the table headers
  const tableHeaders = (
    <tr className="border-b">
      <th className="text-center py-2 px-4">
        <Checkbox
          checked={paginatedVolunteers.length > 0 && paginatedVolunteers.every(volunteer => selectedVolunteers.includes(volunteer.id))}
          onCheckedChange={(checked) => {
            if (checked) {
              const newSelectedVolunteers = new Set(selectedVolunteers);
              paginatedVolunteers.forEach(volunteer => {
                newSelectedVolunteers.add(volunteer.id);
              });
              setSelectedVolunteers([...newSelectedVolunteers]);
            } else {
              const currentPageIds = new Set(paginatedVolunteers.map(v => v.id));
              setSelectedVolunteers(selectedVolunteers.filter(id => !currentPageIds.has(id)));
            }
          }}
        />
      </th>
      <th className="text-center py-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-full"
          onClick={() => handleSort("fullName")}
        >
          {t('table.name')}
          <ArrowUpDown className="h-4 w-4 ml-1" />
        </Button>
      </th>
      <th className="text-center py-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-full"
        >
          {t('table.gender')}
        </Button>
      </th>
      <th className="text-center py-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-full"
          onClick={() => handleSort("age")}
        >
          {t('table.age')}
          <ArrowUpDown className="h-4 w-4 ml-1" />
        </Button>
      </th>
      <th className="text-center py-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-full"
        >
          {t('table.phone')}
        </Button>
      </th>
      <th className="text-center py-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-full"
          onClick={() => handleSort("totalHours")}
        >
          {t('table.totalHours')}
          <ArrowUpDown className="h-4 w-4 ml-1" />
        </Button>
      </th>
      <th className="text-center py-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-full"
          onClick={() => handleSort("totalSessions")}
        >
          {t('table.sessions')}
          <ArrowUpDown className="h-4 w-4 ml-1" />
        </Button>
      </th>
      <th className="text-center py-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-full"
        >
          {t('table.status')}
        </Button>
      </th>
      <th className="text-center py-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-full"
          onClick={() => handleSort("createdAt")}
        >
          {t('table.joinDate')}
          <ArrowUpDown className="h-4 w-4 ml-1" />
        </Button>
      </th>
      <th className="text-center py-2 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-full"
        >
          {t('table.actions')}
        </Button>
      </th>
    </tr>
  );

  // Update the table row
  const tableRow = (volunteer: VolunteerUI, index: number) => {
    const age = calculateAge(volunteer.birthDate);
    return (
      <tr
        key={volunteer.id}
        className={cn(
          "border-b hover:bg-slate-50",
          "bg-white"
        )}
      >
        <td className="text-center py-2 px-4">
          <Checkbox
            checked={selectedVolunteers.includes(volunteer.id)}
            onCheckedChange={() => handleSelectVolunteer(volunteer.id)}
          />
        </td>
        <td className="text-center py-2 px-4">
          <span>{volunteer.fullName}</span>
        </td>
        <td className="text-center py-2 px-4">{translateGender(volunteer.gender, isRTL)}</td>
        <td className="text-center py-2 px-4">{age}</td>
        <td className="text-center py-2 px-4">{volunteer.phoneNumber}</td>
        <td className="text-center py-2 px-4">
          {formatHours(volunteer.totalHours || 0)}
        </td>
        <td className="text-center py-2 px-4">{volunteer.totalSessions || 0}</td>
        <td className="text-center py-2 px-4">
          <div className="flex items-center justify-center">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                volunteer.isActive && "bg-emerald-50 border-emerald-500 text-green-700 hover:bg-green-100 hover:border-emerald-600 hover:text-green-700",
                !volunteer.isActive && "bg-rose-50 border-rose-500 text-rose-600 hover:bg-red-100 hover:border-rose-600 hover:text-rose-600"
              )}
            >
              {volunteer.isActive ? t('filters.active') : t('filters.inactive')}
            </Badge>
          </div>
        </td>
        <td className="text-center py-2 px-4">
          <div className="flex items-center justify-center">
            <Calendar className="h-4 w-4 mr-2 text-slate-500" />
            <span>{new Date(volunteer.createdAt).toLocaleDateString('en-GB')}</span>
          </div>
        </td>
        <td className="text-center py-2 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVolunteer(volunteer);
              const user = users.find(u => u.id === volunteer.userId);
              setEditedUsername(user?.username || "");
              setEditedPassword(""); // Don't show the hashed password
              setIsEditDialogOpen(true);
            }}
            className="text-primary hover:text-primary/90 hover:bg-primary/5"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    );
  };

  // Add useEffect for minimum loading duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Minimum 1 second loading time

    return () => clearTimeout(timer);
  }, []);

  const defaultAvailability = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "OPEN_CREATE_VOLUNTEER_DIALOG") {
        setIsCreateDialogOpen(true);
      }
      if (event.data?.type === "OPEN_EDIT_VOLUNTEER_DIALOG") {
        const volunteerId = event.data.volunteerId;
        const volunteer = volunteers.find(v => v.id === volunteerId);
        if (volunteer) {
          setSelectedVolunteer(volunteer);
          const user = users.find(u => u.id === volunteer.userId);
          setEditedUsername(user?.username || "");
          setEditedPassword(""); // Don't show the hashed password
          setIsEditDialogOpen(true);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [volunteers]);

  // Handle delete volunteer
  const handleDeleteVolunteer = async () => {
    setIsDeletingLocal(true);

    try {
      if (selectedVolunteers.length > 0) {
        // Handle bulk delete
        for (const id of selectedVolunteers) {
          const volunteer = volunteers.find(v => v.id === id);
          if (volunteer) {
            if ((volunteer.totalSessions || 0) === 0 && (volunteer.totalHours || 0) === 0) {
              await deleteVolunteer(id);
              if (volunteer.userId) {
                await deleteUser(volunteer.userId);
              }
            } else {
              alert(t('errors.cannotDeleteWithSessions'));
            }
          }
        }
        // Clear all states after operations complete
        setSelectedVolunteers([]);
        setVolunteersToDelete([]);
        setIsDeleteDialogOpen(false);
      } else if (selectedVolunteer) {
        // Handle single delete
        if ((selectedVolunteer.totalSessions || 0) === 0 && (selectedVolunteer.totalHours || 0) === 0) {
          await deleteVolunteer(selectedVolunteer.id);
          if (selectedVolunteer.userId) {
            await deleteUser(selectedVolunteer.userId);
          }
          // Clear all states after operation completes
          setSelectedVolunteer(null);
          setVolunteersToDelete([]);
          setIsDeleteDialogOpen(false);
        } else {
          alert(t('errors.cannotDeleteWithSessions'));
          setIsDeletingLocal(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error deleting volunteer:", error);
    } finally {
      setIsDeletingLocal(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Show error state */}
      {volunteersError && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg shadow-lg">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-slate-600">Error loading volunteers: {volunteersError.message}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-300 shadow-sm z-10 h-[69px]">
        <div className="px-6 h-full flex items-center justify-between">
          {/* Left section - Logo and menu */}
          <div className="flex items-center space-x-4 w-[200px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className={cn("flex items-center space-x-3", isRTL && "space-x-reverse")}>
              <Users className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block whitespace-nowrap">{t('pageTitle')}</h1>
            </div>
          </div>

          {/* Center section - Search Bar */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder={t('searchPlaceholder')}
                className="pl-9 bg-slate-50 border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right section - Empty for balance */}
          <div className="w-[200px]"></div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <ManagerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300">
          {(volunteersLoading || isLoading) ? (
            <DataTableSkeleton title="Volunteers" />
          ) : (
            <>
              {/* Mobile Search */}
              {isMobile && (
                <div className="mb-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      placeholder={t('searchPlaceholder')}
                      className="pl-9 bg-white focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{t('metrics.totalVolunteers')}</p>
                      <h3 className="text-2xl font-bold">{volunteers.length}</h3>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-full border border-slate-400 flex items-center justify-center">
                      <Users2 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{t('metrics.activeVolunteers')}</p>
                      <h3 className="text-2xl font-bold">{volunteers.filter(v => v.isActive).length}</h3>
                    </div>
                    <div className="h-12 w-12 bg-green-50 rounded-full border border-green-300 flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{t('metrics.totalHours')}</p>
                      <h3 className="text-2xl font-bold">{formatHours(volunteers.reduce((total, v) => total + (v.totalHours || 0), 0))}</h3>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center">
                      <Clock4 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{t('metrics.totalSessions')}</p>
                      <h3 className="text-2xl font-bold">{volunteers.reduce((total, v) => total + (v.totalSessions || 0), 0)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Volunteers - Only show when not loading and have enough active volunteers */}
              {!volunteersLoading && !isLoading && volunteers.filter(v => (v.totalHours || 0) > 0 || (v.totalSessions || 0) > 0).length >= 3 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-slate-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <Award className="h-7 w-7 text-amber-500" />
                      {t('topVolunteers.title')}
                    </h3>
                    <div className="flex items-center gap-2 text-md text-slate-500">
                      <Star className="h-4 w-4 text-amber-400" />
                      <span>{t('topVolunteers.description')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {volunteers
                      .map(volunteer => {
                        return { ...volunteer, totalHours: volunteer.totalHours || 0, totalSessions: volunteer.totalSessions || 0 };
                      })
                      .sort((a, b) => {
                        // Sort by total hours first, then by sessions
                        const hoursDiff = (b.totalHours || 0) - (a.totalHours || 0);
                        if (hoursDiff !== 0) return hoursDiff;
                        return (b.totalSessions || 0) - (a.totalSessions || 0);
                      })
                      .slice(0, 3)
                      .map((volunteer) => (
                        <div
                          key={volunteer.id}
                          className="relative bg-white rounded-lg overflow-hidden shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300"
                        >
                          <div className={cn("flex items-start", isRTL ? "space-x-reverse space-x-4" : "space-x-4")}>
                            <div className="relative flex-shrink-0">
                              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-primary/10 flex items-center justify-center">
                                <UserIcon className="h-8 w-8 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 truncate">{volunteer.fullName}</h4>
                              <div className="mt-2 space-y-1.5">
                                <div className={cn("flex items-center text-sm text-slate-600", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
                                  <Clock4 className="h-4 w-4 text-primary flex-shrink-0" />
                                  <span>{formatHours(volunteer.totalHours || 0)} {t('topVolunteers.hours')}</span>
                                </div>
                                <div className={cn("flex items-center text-sm text-slate-600", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
                                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                  <span>{volunteer.totalSessions || 0} {t('topVolunteers.sessions')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Volunteer Controls */}
              {volunteers.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm mb-6 border border-slate-300">
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Left Section - Filters */}
                      <div className="flex flex-wrap items-center gap-3 min-w-0">
                        <Select value={filterStatus} onValueChange={(value) => {
                          setFilterStatus(value);
                          setSelectedVolunteers([]);
                        }}>
                          <SelectTrigger className="w-[140px] h-9 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('filters.allStatus')}</SelectItem>
                            <SelectItem value="active">{t('filters.active')}</SelectItem>
                            <SelectItem value="inactive">{t('filters.inactive')}</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          className={cn("h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-2", isRTL && "space-x-reverse")}
                          onClick={handleMoreFilters}
                        >
                          <Filter className="h-4 w-4" />
                          {t('moreFilters')}
                        </Button>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex items-center gap-3 min-w-0 h-9">
                        {/* Normal Actions */}
                        <div className={`flex items-center gap-3 ${selectedVolunteers.length > 0 ? 'hidden' : 'flex'}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                            className={cn("h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-2", isRTL && "space-x-reverse")}
                          >
                            {viewMode === "list" ? (
                              <LayoutGrid className="h-4 w-4" />
                            ) : (
                              <List className="h-4 w-4" />
                            )}
                            {viewMode === "list" ? t('gridView') : t('listView')}
                          </Button>
                          <input
                            ref={fileInputRef}
                            id="file-upload"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsImportDialogOpen(true)}
                            className={cn("h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-2", isRTL && "space-x-reverse")}
                          >
                            <Upload className="h-4 w-4" />
                            {t('import')}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsCreateDialogOpen(true)}
                            className={cn("h-9 bg-primary hover:bg-primary/90 flex items-center space-x-2", isRTL && "space-x-reverse")}
                          >
                            <Plus className="h-4 w-4" />
                            {t('addVolunteer')}
                          </Button>
                        </div>

                        {/* Bulk Actions */}
                        <div className={`flex items-center gap-3 ${selectedVolunteers.length > 0 ? 'flex' : 'hidden'}`}>
                          <span className="text-sm text-slate-600 whitespace-nowrap">
                            {selectedVolunteers.filter(id =>
                              filteredVolunteers.some(volunteer => volunteer.id === id)
                            ).length} {t('selected')}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVolunteers([])}
                            className="h-9 border-slate-300 hover:bg-slate-50"
                          >
                            {t('deselectAll')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction("activate")}
                            className="h-9 border-slate-300 hover:bg-slate-50"
                          >
                            {t('activate')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction("deactivate")}
                            className="h-9 border-slate-300 hover:bg-slate-50"
                          >
                            {t('deactivate')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction("delete")}
                            className="h-9 bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-600"
                          >
                            {t('delete')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport()}
                            disabled={selectedVolunteers.length === 0}
                            className={cn("h-9 border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", isRTL && "space-x-reverse")}
                            title={selectedVolunteers.length === 0 ? "Select volunteers to export" : "Export selected volunteers"}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            {t('export')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Volunteers List or Empty State */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300">
                {volunteers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Users2 className="h-12 w-12 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 mb-2">{t('noVolunteersYet')}</h2>
                    <p className="text-slate-500 mb-4">{t('noVolunteersDescription')}</p>
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-5 w-5" /> {t('addVolunteer')}
                    </Button>
                  </div>
                ) : (
                  <>{viewMode === "list" ? (
                    <div className="space-y-4">
                      {/* List View */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            {tableHeaders}
                          </thead>
                          <tbody className="relative">
                            {paginatedVolunteers.map((volunteer, index) => tableRow(volunteer, index))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                        {paginatedVolunteers.map((volunteer) => (
                          <div
                            key={volunteer.id}
                            className="bg-white rounded-lg border border-slate-300 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col"
                            onClick={() => handleSelectVolunteer(volunteer.id)}
                          >
                            {/* Profile Header */}
                            <div className="relative p-4">
                              <div className={cn("absolute top-[25px] z-10", isRTL ? "left-4" : "right-4")}>
                                <Checkbox
                                  checked={selectedVolunteers.includes(volunteer.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedVolunteers([...selectedVolunteers, volunteer.id]);
                                    } else {
                                      setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteer.id));
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border-black data-[state=checked]:bg-primary data-[state=checked]:border-primary bg-white/90 backdrop-blur-sm"
                                />
                              </div>
                              <div className={cn("flex items-center space-x-4 min-w-0", isRTL && "space-x-reverse")}>
                                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-primary/10 flex items-center justify-center">
                                  <UserIcon className="h-8 w-8 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors duration-300 truncate max-w-[calc(100%-2rem)]">
                                    {volunteer.fullName}
                                  </h3>
                                  <div className="mt-1">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        volunteer.isActive && "bg-emerald-50 border-emerald-500 text-green-700 hover:bg-green-100 hover:border-emerald-600 hover:text-green-700",
                                        !volunteer.isActive && "bg-rose-50 border-rose-500 text-rose-600 hover:bg-red-100 hover:border-rose-600 hover:text-rose-600"
                                      )}
                                    >
                                      {volunteer.isActive ? t('filters.active') : t('filters.inactive')}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mx-4 border-b border-slate-300" />
                            {/* Content */}
                            <div className="p-4 flex flex-col items-center justify-center gap-4">
                              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                                <div className="space-y-1 flex flex-col items-center">
                                  <div className={cn("flex items-center text-sm text-slate-600 space-x-2", isRTL && "space-x-reverse")}>
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span>{new Date(volunteer.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className={cn("flex items-center text-sm text-slate-600 space-x-2", isRTL && "space-x-reverse")}>
                                    <Phone className="h-4 w-4 text-primary" />
                                    <span className="truncate">{volunteer.phoneNumber}</span>
                                  </div>
                                </div>
                                <div className="space-y-1 flex flex-col items-center">
                                  <div className={cn("flex items-center text-sm text-slate-600 space-x-2", isRTL && "space-x-reverse")}>
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span>{formatHours(volunteer.totalHours || 0)} {t('topVolunteers.hours')}</span>
                                  </div>
                                  <div className={cn("flex items-center text-sm text-slate-600 space-x-2", isRTL && "space-x-reverse")}>
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>{volunteer.totalSessions || 0} {t('topVolunteers.sessions')}</span>
                                  </div>
                                </div>
                              </div>

                              <div className={cn("flex items-center justify-between pt-4 border-t border-slate-300 w-full max-w-xs space-x-2", isRTL && "space-x-reverse")}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVolunteer(volunteer);
                                    const user = users.find(u => u.id === volunteer.userId);
                                    setEditedUsername(user?.username || "");
                                    setEditedPassword(""); // Don't show the hashed password
                                    setIsEditDialogOpen(true);
                                  }}
                                  className="bg-gray-100 border border-gray-400/75 hover:bg-gray-200 hover:border-gray-400 flex items-center space-x-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  {t('actions.edit')}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVolunteer(volunteer);
                                    setSelectedVolunteers([]);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-600 flex items-center space-x-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {t('delete')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    {/* Pagination Controls - Now visible in both views */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">{t('itemsPerPage')}</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            const newItemsPerPage = Number(value);
                            setItemsPerPage(newItemsPerPage);
                            setCurrentPage(1);
                            // Clear selections when changing page size
                            setSelectedVolunteers([]);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[70px] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                            <SelectValue placeholder={itemsPerPage} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || totalPages === 0}
                        >
                          {t('previous')}
                        </Button>
                        <span className="text-sm text-slate-600">
                          {t('page')} {totalPages === 0 ? 0 : currentPage} {t('of')} {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages || totalPages === 0}
                        >
                          {t('next')}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Create Volunteer Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          setIsCreatingInstant(false);
          if (open) {
            setNewVolunteer({
              fullName: "",
              phoneNumber: "",
              languages: [],
              skills: [],
              notes: null,
              isActive: true,
              birthDate: "",
              gender: "male",
              userId: "",
              createdAt: Timestamp.now(),
              hobbies: [],
              groupAffiliation: null,
              matchingPreference: null,
              reasonForVolunteering: null,
              availability: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
            });
            // Clear validation errors
            setFullNameError(null);
            setBirthDateError(null);
            setPhoneNumberError(null);
          } else {
            setNewVolunteer({
              fullName: "",
              phoneNumber: "",
              languages: [],
              skills: [],
              notes: null,
              isActive: true,
              birthDate: "",
              gender: "male",
              userId: "",
              createdAt: Timestamp.now(),
              hobbies: [],
              groupAffiliation: null,
              matchingPreference: null,
              reasonForVolunteering: null,
              availability: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
            });
            // Clear validation errors
            setFullNameError(null);
            setBirthDateError(null);
            setPhoneNumberError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle className="text-slate-900">{t('dialogs.addNewVolunteer')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('dialogs.addNewVolunteerDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
            {/* Basic Information */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('forms.basicInformation')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">{t('forms.fullNameRequired')}</Label>
                  <Input
                    id="fullName"
                    placeholder={t('forms.enterFullName')}
                    value={newVolunteer.fullName}
                    onChange={(e) => {
                      setNewVolunteer({ ...newVolunteer, fullName: e.target.value });
                      handleFullNameChange(e.target.value, false);
                    }}
                    onBlur={(e) => handleFullNameBlur(e.target.value, false)}
                    className={cn(
                      "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                      fullNameError ? "border-red-500 focus:border-red-500" : ""
                    )}
                  />
                  {fullNameError && <p className="text-sm text-red-600 mt-1">{t(fullNameError, { ns: 'volunteers' })}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700">{t('forms.phoneNumberRequired')}</Label>
                  <Input
                    id="phoneNumber"
                    placeholder={t('volunteers:forms.enterPhoneNumber')}
                    value={newVolunteer.phoneNumber}
                    onChange={(e) => {
                      setNewVolunteer({ ...newVolunteer, phoneNumber: e.target.value });
                      handlePhoneNumberChange(e.target.value, false);
                    }}
                    onBlur={(e) => handlePhoneNumberBlur(e.target.value, false)}
                    className={cn(
                      "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                      phoneNumberError ? "border-red-500 focus:border-red-500" : ""
                    )}
                  />
                  {phoneNumberError && <p className="text-sm text-red-600 mt-1">{t(phoneNumberError, { ns: 'volunteers' })}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-medium text-slate-700">{t('forms.birthDateRequired')}</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newVolunteer.birthDate}
                    onChange={(e) => {
                      setNewVolunteer({ ...newVolunteer, birthDate: e.target.value });
                      handleBirthDateChange(e.target.value, false);
                    }}
                    className={cn(
                      "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                      birthDateError ? "border-red-500 focus:border-red-500" : ""
                    )}
                  />
                  {birthDateError && <p className="text-sm text-red-600 mt-1">{t(birthDateError, { ns: 'volunteers' })}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-slate-700">{t('forms.genderRequired')}</Label>
                  <Select
                    value={newVolunteer.gender}
                    onValueChange={(value: 'male' | 'female') => setNewVolunteer({ ...newVolunteer, gender: value })}
                  >
                    <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t('forms.selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('forms.male')}</SelectItem>
                      <SelectItem value="female">{t('forms.female')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Information (Combined from Languages, Skills & Hobbies, and Preferences) */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> {/* Using FileText icon like in Residents.tsx */}
                <h3 className="text-lg font-semibold text-slate-900">{t('forms.additionalInformation')}</h3>
              </div>
              {/* Content combined from Languages, Skills & Hobbies, and Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preferences fields */}
                <div className="space-y-2">
                  <Label htmlFor="matchingPreference" className="text-sm font-medium text-slate-700">{t('forms.matchingPreference')}</Label>
                  <Select
                    value={newVolunteer.matchingPreference || ""}
                    onValueChange={(value: 'oneOnOne' | 'groupActivity' | 'noPreference' | null) =>
                      setNewVolunteer({ ...newVolunteer, matchingPreference: value })}
                  >
                    <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t('forms.selectMatchingPreference')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oneOnOne">{t('preferences.oneOnOne')}</SelectItem>
                      <SelectItem value="groupActivity">{t('preferences.groupActivity')}</SelectItem>
                      <SelectItem value="noPreference">{t('preferences.noPreference')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reasonForVolunteering" className="text-sm font-medium text-slate-700">{t('forms.reasonForVolunteering')}</Label>
                  <Select
                    value={newVolunteer.reasonForVolunteering || ""}
                    onValueChange={(value: 'scholarship' | 'communityService' | 'personalInterest' | 'other' | null) =>
                      setNewVolunteer({ ...newVolunteer, reasonForVolunteering: value })}
                  >
                    <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t('forms.selectReason')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scholarship">{t('preferences.scholarship')}</SelectItem>
                      <SelectItem value="communityService">{t('preferences.communityService')}</SelectItem>
                      <SelectItem value="personalInterest">{t('preferences.personalInterest')}</SelectItem>
                      <SelectItem value="other">{t('preferences.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupAffiliation" className="text-sm font-medium text-slate-700">{t('forms.groupAffiliation')}</Label>
                  <Input
                    id="groupAffiliation"
                    placeholder={t('forms.enterGroupAffiliation')}
                    value={newVolunteer.groupAffiliation || ""}
                    onChange={(e) => setNewVolunteer({ ...newVolunteer, groupAffiliation: e.target.value || null })}
                    className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-slate-700">{t('forms.status')}</Label>
                  <Select
                    value={newVolunteer.isActive ? "active" : "inactive"}
                    onValueChange={(value) => setNewVolunteer({ ...newVolunteer, isActive: value === "active" })}
                  >
                    <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t('forms.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('filters.active')}</SelectItem>
                      <SelectItem value="inactive">{t('filters.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Languages - span both columns */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="languages" className="text-sm font-medium text-slate-700">{t('forms.languages')}</Label>
                  <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                    <div className="h-full overflow-y-auto bg-slate-50">
                      <div className="divide-y divide-slate-200">
                        {(t('languages', { returnObjects: true }) as string[]).map((language) => (
                          <div key={language} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <Checkbox
                              id={`language-${language}`}
                              checked={isValueInArray(language, newVolunteer.languages || [], isRTL)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewVolunteer({
                                    ...newVolunteer,
                                    languages: addValueToArray(language, newVolunteer.languages || [], isRTL)
                                  });
                                } else {
                                  setNewVolunteer({
                                    ...newVolunteer,
                                    languages: removeValueFromArray(language, newVolunteer.languages || [], isRTL)
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor={`language-${language}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {language}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills - span both columns */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="skills" className="text-sm font-medium text-slate-700">{t('forms.skills')}</Label>
                  <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                    <div className="h-full overflow-y-auto bg-slate-50">
                      <div className="divide-y divide-slate-200">
                        {(t('skills', { returnObjects: true }) as string[]).map(skill => (
                          <div key={skill} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <Checkbox
                              id={`skill-${skill}`}
                              checked={isValueInArray(skill, newVolunteer.skills || [], isRTL)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewVolunteer({
                                    ...newVolunteer,
                                    skills: addValueToArray(skill, newVolunteer.skills || [], isRTL)
                                  });
                                } else {
                                  setNewVolunteer({
                                    ...newVolunteer,
                                    skills: removeValueFromArray(skill, newVolunteer.skills || [], isRTL)
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor={`skill-${skill}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {skill}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hobbies - span both columns */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hobbies" className="text-sm font-medium text-slate-700">{t('forms.hobbies')}</Label>
                  <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                    <div className="h-full overflow-y-auto bg-slate-50">
                      <div className="divide-y divide-slate-200">
                        {(t('hobbies', { returnObjects: true }) as string[]).map(hobby => (
                          <div key={hobby} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <Checkbox
                              id={`hobby-${hobby}`}
                              checked={isValueInArray(hobby, newVolunteer.hobbies || [], isRTL)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewVolunteer({
                                    ...newVolunteer,
                                    hobbies: addValueToArray(hobby, newVolunteer.hobbies || [], isRTL)
                                  });
                                } else {
                                  setNewVolunteer({
                                    ...newVolunteer,
                                    hobbies: removeValueFromArray(hobby, newVolunteer.hobbies || [], isRTL)
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor={`hobby-${hobby}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {hobby}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Time Slots */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('forms.availableTimeSlots')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Days of the week mapping for Create Dialog */}
                {Object.entries(newVolunteer.availability ?? { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }).map(([day, slots]) => (
                  <div key={day} className="overflow-hidden rounded-lg border border-slate-300">
                    <div className="bg-slate-50">
                      <div className="divide-y divide-slate-200">
                        <div className="bg-white p-2">
                          <Label className="text-sm font-medium text-slate-700 capitalize">{t(`availability.${day}`)}</Label>
                        </div>
                        {["morning", "afternoon", "evening"].map((timeSlot) => (
                          <div key={timeSlot} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <Checkbox
                              id={`${day}-${timeSlot}`}
                              checked={(slots || []).includes(timeSlot)}
                              onCheckedChange={(checked) => {
                                const currentSlots = slots || [];
                                const newSlots = checked
                                  ? [...currentSlots, timeSlot]
                                  : currentSlots.filter(slot => slot !== timeSlot);
                                setNewVolunteer({
                                  ...newVolunteer,
                                  availability: {
                                    ...defaultAvailability,
                                    ...(newVolunteer.availability || {}),
                                    [day]: newSlots
                                  }
                                });
                              }}
                            />
                            <Label
                              htmlFor={`${day}-${timeSlot}`}
                              className="text-sm font-normal capitalize cursor-pointer flex-1"
                            >
                              {t(`availability.${timeSlot}`)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('forms.notes')}</h3>
              </div>
              <Textarea
                id="notes"
                placeholder={t('forms.notesPlaceholder')}
                value={newVolunteer.notes || ""}
                onChange={(e) => setNewVolunteer({ ...newVolunteer, notes: e.target.value || null })}
                className="min-h-[100px] bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
            <div className="flex justify-center w-full">
              <Button
                onClick={async () => {
                  if (!newVolunteer.fullName || !newVolunteer.phoneNumber || !newVolunteer.birthDate || !!fullNameError || !!birthDateError || !!phoneNumberError || isCreatingInstant || isCreating) return;
                  setIsCreatingInstant(true);
                  await handleCreateVolunteer();
                  setIsCreatingInstant(false);
                }}
                disabled={!newVolunteer.fullName || !newVolunteer.phoneNumber || !newVolunteer.birthDate || !!fullNameError || !!birthDateError || !!phoneNumberError || isCreatingInstant || isCreating}
                className="w-[200px] transition-all duration-200 mx-auto bg-primary hover:bg-primary/90 relative">
                {isCreatingInstant || isCreating ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="opacity-0">{t('actions.addVolunteer')}</span>
                  </>
                ) : (
                  t('actions.addVolunteer'))}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Volunteer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setShowPassword(false);
          // Clear validation errors
          setEditFullNameError(null);
          setEditUsernameError(null);
          setEditPasswordError(null);
          setEditBirthDateError(null);
          setEditPhoneNumberError(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle className="text-slate-900">{t('dialogs.editVolunteer')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('dialogs.editVolunteerDescription')}
            </DialogDescription>
          </DialogHeader>

          {selectedVolunteer && (
            <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
              {/* Basic Information - Edit Dialog */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('forms.basicInformation')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-username" className="text-sm font-medium text-slate-700">{t('forms.username')}</Label>
                    <Input
                      id="edit-username"
                      value={editedUsername}
                      onChange={(e) => {
                        setEditedUsername(e.target.value);
                        handleUsernameChange(e.target.value);
                      }}
                      onBlur={(e) => handleUsernameBlur(e.target.value)}
                      className={cn(
                        "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        isRTL && "text-right",
                        editUsernameError ? "border-red-500 focus:border-red-500" : ""
                      )}
                      dir="ltr"
                    />
                    {editUsernameError && <p className="text-sm text-red-600 mt-1">{t(editUsernameError, { ns: 'volunteers' })}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-password" className="text-sm font-medium text-slate-700">{t('forms.password')}</Label>
                    <div className="relative">
                      <Input
                        id="edit-password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t('forms.enterNewPassword')}
                        value={editedPassword}
                        onChange={(e) => {
                          setEditedPassword(e.target.value);
                          handlePasswordChange(e.target.value);
                        }}
                        onBlur={(e) => handlePasswordBlur(e.target.value)}
                        className={cn(
                          "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                          isRTL ? "pl-10" : "pr-10",
                          editPasswordError ? "border-red-500 focus:border-red-500" : ""
                        )}
                        dir="ltr"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("absolute top-0 h-10 w-10 hover:bg-transparent", isRTL ? "left-0" : "right-0")}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-500" />
                        )}
                      </Button>
                    </div>
                    {editPasswordError && <p className="text-sm text-red-600 mt-1">{t(editPasswordError, { ns: 'volunteers' })}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName" className="text-sm font-medium text-slate-700">{t('forms.fullNameRequired')}</Label>
                    <Input
                      id="edit-fullName"
                      placeholder={t('forms.enterFullName')}
                      value={selectedVolunteer.fullName}
                      onChange={(e) => {
                        setSelectedVolunteer({ ...selectedVolunteer, fullName: e.target.value });
                        handleFullNameChange(e.target.value, true);
                      }}
                      onBlur={(e) => handleFullNameBlur(e.target.value, true)}
                      className={cn(
                        "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        editFullNameError ? "border-red-500 focus:border-red-500" : ""
                      )}
                    />
                    {editFullNameError && <p className="text-sm text-red-600 mt-1">{t(editFullNameError, { ns: 'volunteers' })}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phoneNumber" className="text-sm font-medium text-slate-700">{t('forms.phoneNumberRequired')}</Label>
                    <Input
                      id="edit-phoneNumber"
                      placeholder={t('volunteers:forms.enterPhoneNumber')}
                      value={selectedVolunteer.phoneNumber}
                      onChange={(e) => {
                        setSelectedVolunteer({ ...selectedVolunteer, phoneNumber: e.target.value });
                        handlePhoneNumberChange(e.target.value, true);
                      }}
                      onBlur={(e) => handlePhoneNumberBlur(e.target.value, true)}
                      className={cn(
                        "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        editPhoneNumberError && "border-red-500 focus:border-red-500"
                      )}
                    />
                    {editPhoneNumberError && <p className="text-sm text-red-600 mt-1">{t(editPhoneNumberError, { ns: 'volunteers' })}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-birthDate" className="text-sm font-medium text-slate-700">{t('forms.birthDateRequired')}</Label>
                    <Input
                      id="edit-birthDate"
                      type="date"
                      value={selectedVolunteer.birthDate}
                      onChange={(e) => {
                        setSelectedVolunteer({ ...selectedVolunteer, birthDate: e.target.value });
                        handleBirthDateChange(e.target.value, true);
                      }}
                      className={cn(
                        "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        editBirthDateError ? "border-red-500 focus:border-red-500" : ""
                      )}
                    />
                    {editBirthDateError && <p className="text-sm text-red-600 mt-1">{t(editBirthDateError, { ns: 'volunteers' })}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-gender" className="text-sm font-medium text-slate-700">{t('forms.genderRequired')}</Label>
                    <Select
                      value={selectedVolunteer.gender}
                      onValueChange={(value: 'male' | 'female') => setSelectedVolunteer({ ...selectedVolunteer, gender: value })}>
                      <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                        <SelectValue placeholder={t('forms.selectGender')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('forms.male')}</SelectItem>
                        <SelectItem value="female">{t('forms.female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Additional Information - Edit Dialog */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> {/* Using FileText icon like in Residents.tsx */}
                  <h3 className="text-lg font-semibold text-slate-900">{t('forms.additionalInformation')}</h3>
                </div>
                {/* Content combined from Languages, Skills & Hobbies, and Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Preferences fields */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-matchingPreference" className="text-sm font-medium text-slate-700">{t('forms.matchingPreference')}</Label>
                    <Select
                      value={selectedVolunteer.matchingPreference || ""}
                      onValueChange={(value: 'oneOnOne' | 'groupActivity' | 'noPreference' | null) =>
                        setSelectedVolunteer({ ...selectedVolunteer, matchingPreference: value })}>
                      <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                        <SelectValue placeholder={t('forms.selectMatchingPreference')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oneOnOne">{t('preferences.oneOnOne')}</SelectItem>
                        <SelectItem value="groupActivity">{t('preferences.groupActivity')}</SelectItem>
                        <SelectItem value="noPreference">{t('preferences.noPreference')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-reasonForVolunteering" className="text-sm font-medium text-slate-700">{t('forms.reasonForVolunteering')}</Label>
                    <Select
                      value={selectedVolunteer.reasonForVolunteering || ""}
                      onValueChange={(value: 'scholarship' | 'communityService' | 'personalInterest' | 'other' | null) =>
                        setSelectedVolunteer({ ...selectedVolunteer, reasonForVolunteering: value })}>
                      <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                        <SelectValue placeholder={t('forms.selectReason')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scholarship">{t('preferences.scholarship')}</SelectItem>
                        <SelectItem value="communityService">{t('preferences.communityService')}</SelectItem>
                        <SelectItem value="personalInterest">{t('preferences.personalInterest')}</SelectItem>
                        <SelectItem value="other">{t('preferences.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-groupAffiliation" className="text-sm font-medium text-slate-700">{t('forms.groupAffiliation')}</Label>
                    <Input
                      id="edit-groupAffiliation"
                      placeholder={t('forms.enterGroupAffiliation')}
                      value={selectedVolunteer.groupAffiliation || ""}
                      onChange={(e) => setSelectedVolunteer({ ...selectedVolunteer, groupAffiliation: e.target.value || null })} className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-sm font-medium text-slate-700">{t('forms.status')}</Label>
                    <Select
                      value={selectedVolunteer.isActive ? "active" : "inactive"}
                      onValueChange={(value) => setSelectedVolunteer({ ...selectedVolunteer, isActive: value === "active" })}>
                      <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                        <SelectValue placeholder={t('forms.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('filters.active')}</SelectItem>
                        <SelectItem value="inactive">{t('filters.inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Languages - span both columns */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-languages" className="text-sm font-medium text-slate-700">{t('forms.languages')}</Label>
                    <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                      <div className="h-full overflow-y-auto bg-slate-50">
                        <div className="divide-y divide-slate-200">
                          {(t('languages', { returnObjects: true }) as string[]).map((language) => (
                            <div key={language} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                              <Checkbox
                                id={`edit-language-${language}`}
                                checked={isValueInArray(language, selectedVolunteer.languages || [], isRTL)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedVolunteer({
                                      ...selectedVolunteer,
                                      languages: addValueToArray(language, selectedVolunteer.languages || [], isRTL)
                                    });
                                  } else {
                                    setSelectedVolunteer({
                                      ...selectedVolunteer,
                                      languages: removeValueFromArray(language, selectedVolunteer.languages || [], isRTL)
                                    });
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`edit-language-${language}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {language}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills - span both columns */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-skills" className="text-sm font-medium text-slate-700">{t('forms.skills')}</Label>
                    <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                      <div className="h-full overflow-y-auto bg-slate-50">
                        <div className="divide-y divide-slate-200">
                          {(t('skills', { returnObjects: true }) as string[]).map(skill => (
                            <div key={skill} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                              <Checkbox
                                id={`edit-skill-${skill}`}
                                checked={isValueInArray(skill, selectedVolunteer.skills || [], isRTL)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedVolunteer({
                                      ...selectedVolunteer,
                                      skills: addValueToArray(skill, selectedVolunteer.skills || [], isRTL)
                                    });
                                  } else {
                                    setSelectedVolunteer({
                                      ...selectedVolunteer,
                                      skills: removeValueFromArray(skill, selectedVolunteer.skills || [], isRTL)
                                    });
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`edit-skill-${skill}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {skill}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hobbies - span both columns */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-hobbies" className="text-sm font-medium text-slate-700">{t('forms.hobbies')}</Label>
                    <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                      <div className="h-full overflow-y-auto bg-slate-50">
                        <div className="divide-y divide-slate-200">
                          {(t('hobbies', { returnObjects: true }) as string[]).map(hobby => (
                            <div key={hobby} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                              <Checkbox
                                id={`edit-hobby-${hobby}`}
                                checked={isValueInArray(hobby, selectedVolunteer.hobbies || [], isRTL)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedVolunteer({
                                      ...selectedVolunteer,
                                      hobbies: addValueToArray(hobby, selectedVolunteer.hobbies || [], isRTL)
                                    });
                                  } else {
                                    setSelectedVolunteer({
                                      ...selectedVolunteer,
                                      hobbies: removeValueFromArray(hobby, selectedVolunteer.hobbies || [], isRTL)
                                    });
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`edit-hobby-${hobby}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {hobby}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Time Slots */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('forms.availableTimeSlots')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Days of the week mapping for Edit Dialog */}
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                    const slots = selectedVolunteer.availability?.[day as keyof typeof selectedVolunteer.availability] || [];
                    return (
                      <div key={day} className="overflow-hidden rounded-lg border border-slate-300">
                        <div className="bg-slate-50">
                          <div className="divide-y divide-slate-200">
                            <div className="bg-white p-2">
                              <Label className="text-sm font-medium text-slate-700 capitalize">{t(`availability.${day}`)}</Label>
                            </div>
                            {["morning", "afternoon", "evening"].map((timeSlot) => (
                              <div key={timeSlot} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                                <Checkbox
                                  id={`edit-${day}-${timeSlot}`}
                                  checked={(slots || []).includes(timeSlot)}
                                  onCheckedChange={(checked) => {
                                    const currentSlots = slots || [];
                                    const newSlots = checked
                                      ? [...currentSlots, timeSlot]
                                      : currentSlots.filter(slot => slot !== timeSlot);
                                    setSelectedVolunteer({
                                      ...selectedVolunteer,
                                      availability: {
                                        ...defaultAvailability,
                                        ...(selectedVolunteer.availability || {}),
                                        [day]: newSlots
                                      }
                                    });
                                  }}
                                />
                                <Label
                                  htmlFor={`edit-${day}-${timeSlot}`}
                                  className="text-sm font-normal capitalize cursor-pointer flex-1"
                                >
                                  {t(`availability.${timeSlot}`)}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Notes - Edit Dialog */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('forms.notes')}</h3>
                </div>
                <Textarea
                  id="edit-notes"
                  placeholder={t('forms.notesPlaceholder')}
                  value={selectedVolunteer.notes || ""}
                  onChange={(e) => setSelectedVolunteer({ ...selectedVolunteer, notes: e.target.value || null })} className="min-h-[100px] bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
            <div className="flex justify-center w-full">
              <Button
                onClick={handleEditVolunteer}
                disabled={!selectedVolunteer?.fullName || !selectedVolunteer?.phoneNumber || !selectedVolunteer?.birthDate || !!editFullNameError || !!editUsernameError || !!editPasswordError || !!editBirthDateError || !!editPhoneNumberError || isEditing}
                className="w-[200px] transition-all duration-200 mx-auto bg-primary hover:bg-primary/90 relative">
                {isEditing ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="opacity-0">{t('actions.saveChanges')}</span>
                  </>
                ) : (
                  t('actions.saveChanges'))}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Volunteer Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!isDeletingLocal) {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setVolunteersToDelete([]);
          }
        }
      }}>
        <DialogContent className="sm:max-w-[400px]" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle>{selectedVolunteers.length > 0 ? t('dialogs.deleteSelectedVolunteers') : t('dialogs.deleteVolunteer')}</DialogTitle>
            <DialogDescription>
              {selectedVolunteers.length > 0 ? t('dialogs.deleteSelectedVolunteersDescription') : t('dialogs.deleteVolunteerDescription')}
            </DialogDescription>
          </DialogHeader>

          {selectedVolunteers.length > 0 ? (
            <div className="py-4">
              <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                <div className="text-sm text-slate-600">
                  {t('dialogs.aboutToDelete')} {volunteersToDelete.length} {volunteersToDelete.length > 1 ? t('dialogs.volunteers') : t('dialogs.volunteer')}.
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex items-center mb-2">
                    <span className="font-medium">{t('dialogs.selectedVolunteers')}</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    {volunteersToDelete.map(volunteer => (
                      <div key={volunteer.id} className="flex items-center">
                        <span>{volunteer.fullName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : selectedVolunteer && (
            <div className="py-4">
              <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                <div className="mb-2">
                  <h3 className="font-medium">{selectedVolunteer.fullName}</h3>
                </div>

                <div className="mt-2 text-sm">
                  <div className="flex items-center">
                    {t('dialogs.joined')} {new Date(selectedVolunteer.createdAt).toLocaleDateString('en-GB')}
                  </div>
                  <div className="flex items-center mt-1">
                    {t('dialogs.totalHours')} {formatHours(selectedVolunteer?.totalHours || 0)}
                  </div>
                  <div className="flex items-center mt-1">
                    {t('dialogs.totalSessions')} {selectedVolunteer?.totalSessions || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="w-full flex justify-center">
              <Button
                variant="destructive"
                onClick={async () => {
                  if (isDeletingLocal) return;
                  await handleDeleteVolunteer();
                }}
                disabled={isDeletingLocal}
                className="w-[200px] transition-all duration-200 mx-auto relative"
              >
                {isDeletingLocal ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="opacity-0">{selectedVolunteers.length > 0 ? t('actions.deleteSelected') : t('actions.deleteVolunteer')}</span>
                  </>
                ) : (
                  selectedVolunteers.length > 0 ? t('actions.deleteSelected') : t('actions.deleteVolunteer')
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={isImportDialogOpen}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) {
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle className="text-slate-900">{t('importDialog.title')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('importDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
            {/* File Upload Section */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('importDialog.uploadSection.title')}</h3>
              </div>
              <p className="text-sm text-slate-500 -mt-1">
                {t('importDialog.uploadSection.description')}
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="file-upload" className="text-sm font-medium text-slate-700">{t('importDialog.uploadSection.selectFile')}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn("h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-2", isRTL && "space-x-reverse")}
                  >
                    <Upload className="h-4 w-4" />
                    {t('importDialog.uploadSection.chooseFile')}
                  </Button>
                </div>
                {selectedFile && (
                  <div className="text-sm text-slate-600">
                    {t('importDialog.uploadSection.selectedFile')} {selectedFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Sample File Section */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('importDialog.sampleSection.title')}</h3>
              </div>
              <p className="text-sm text-slate-500 -mt-1">
                {t('importDialog.sampleSection.description')}
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">{t('importDialog.sampleSection.downloadTemplate')}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSample}
                    className={cn("h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-2", isRTL && "space-x-reverse")}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {t('importDialog.sampleSection.downloadSample')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-300 pt-3">
            <div className="w-full flex justify-center">
              <Button
                variant="default"
                onClick={handleImport}
                className="h-9 bg-primary hover:bg-primary/90 min-w-[100px]"
                disabled={!selectedFile || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('importDialog.importing')}
                  </>
                ) : (
                  t('importDialog.import')
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* More Filters Dialog */}
      <Dialog open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle className="text-slate-900">{t('filters.moreFiltersTitle')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('filters.moreFiltersDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 overflow-y-auto flex-1">
            {/* Age Range Filter */}
            <div className="space-y-2">
              <Label>{t('filters.ageRange')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="age-min"
                  name="age-min"
                  type="number"
                  min="0"
                  value={ageRange[0] === null ? "" : ageRange[0]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAgeRange([value === "" ? null : Number(value), ageRange[1]]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={t('filters.min')}
                />
                <span className="text-slate-500">{t('filters.to')}</span>
                <Input
                  id="age-max"
                  name="age-max"
                  type="number"
                  min="0"
                  value={ageRange[1] === null ? "" : ageRange[1]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAgeRange([ageRange[0], value === "" ? null : Number(value)]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={t('filters.max')}
                />
              </div>
            </div>

            {/* Total Hours Range Filter */}
            <div className="space-y-2">
              <Label>{t('filters.totalHoursRange')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="hours-min"
                  name="hours-min"
                  type="number"
                  min="0"
                  value={hoursRange[0] === null ? "" : hoursRange[0]}
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setHoursRange([value === "" ? null : Number(value), hoursRange[1]]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={t('filters.min')}
                />
                <span className="text-slate-500">{t('filters.to')}</span>
                <Input
                  id="hours-max"
                  name="hours-max"
                  type="number"
                  min="0"
                  value={hoursRange[1] === null ? "" : hoursRange[1]}
                  onKeyDown={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setHoursRange([hoursRange[0], value === "" ? null : Number(value)]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={t('filters.max')}
                />
              </div>
            </div>

            {/* Total Sessions Range Filter */}
            <div className="space-y-2">
              <Label>{t('filters.totalSessionsRange')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sessions-min"
                  name="sessions-min"
                  type="number"
                  min="0"
                  value={sessionsRange[0] === null ? "" : sessionsRange[0]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setSessionsRange([value === "" ? null : Number(value), sessionsRange[1]]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={t('filters.min')}
                />
                <span className="text-slate-500">{t('filters.to')}</span>
                <Input
                  id="sessions-max"
                  name="sessions-max"
                  type="number"
                  min="0"
                  value={sessionsRange[1] === null ? "" : sessionsRange[1]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setSessionsRange([sessionsRange[0], value === "" ? null : Number(value)]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={t('filters.max')}
                />
              </div>
            </div>

            {/* Join Date Range Filter */}
            <div className="space-y-2">
              <Label>{t('filters.joinDateRange')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="join-date-start"
                  name="join-date-start"
                  type="date"
                  value={joinDateRange[0]}
                  onChange={(e) => setJoinDateRange([e.target.value, joinDateRange[1]])}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span className="text-slate-500">{t('filters.to')}</span>
                <Input
                  id="join-date-end"
                  name="join-date-end"
                  type="date"
                  value={joinDateRange[1]}
                  onChange={(e) => setJoinDateRange([joinDateRange[0], e.target.value])}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
            <div className="flex justify-center w-full gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setAgeRange([null, null]);
                  setHoursRange([null, null]);
                  setSessionsRange([null, null]);
                  setJoinDateRange(["", ""]);
                }}
                disabled={
                  !ageRange[0] && !ageRange[1] &&
                  !hoursRange[0] && !hoursRange[1] &&
                  !sessionsRange[0] && !sessionsRange[1] &&
                  !joinDateRange[0] && !joinDateRange[1]
                }
                className="h-9 border-slate-300 hover:bg-slate-50 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                {t('filters.resetFilters')}
              </Button>
              <Button
                onClick={() => setIsMoreFiltersOpen(false)}
                className="h-9 bg-primary hover:bg-primary/90 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                {t('filters.applyFilters')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerVolunteers; 