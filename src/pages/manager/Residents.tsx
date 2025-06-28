import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Plus,
  Menu,
  List,
  Edit,
  User,
  Clock,
  Phone,
  Search,
  Filter,
  Users2,
  Trash2,
  FileText,
  UserPlus,
  Calendar,
  UserCheck,
  LayoutGrid,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  X as XIcon,
  Upload,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Resident } from "@/services/firestore";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useResidents, useAddResident, useUpdateResident, useDeleteResident, ResidentUI } from "@/hooks/useFirestoreResidents";
import DataTableSkeleton from "@/components/skeletons/DataTableSkeleton";
import { validatePhoneNumber, getPhoneNumberError, formatPhoneNumber } from "@/utils/validation";

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

const getHobbyMapping = () => {
  const englishHobbies = [
    "Reading", "Writing", "Painting", "Drawing", "Photography",
    "Gardening", "Cooking", "Baking", "Knitting", "Sewing",
    "Music", "Singing", "Playing Instruments", "Dancing", "Theater",
    "Sports", "Swimming", "Walking", "Hiking", "Cycling",
    "Yoga", "Meditation", "Chess", "Puzzles", "Board Games",
    "Movies", "TV Shows", "Documentaries", "Podcasts", "Radio",
    "Travel", "Languages", "History", "Science", "Technology",
    "Crafts", "Woodworking", "Pottery", "Jewelry Making", "Calligraphy",
    "Fishing", "Bird Watching", "Astronomy", "Collecting", "Volunteering"
  ];

  const hebrewHobbies = [
    "קריאה", "כתיבה", "ציור", "רישום", "צילום",
    "גינון", "בישול", "אפייה", "סריגה", "תפירה",
    "מוזיקה", "שירה", "נגינה בכלים", "ריקוד", "תיאטרון",
    "ספורט", "שחייה", "הליכה", "טיולים", "רכיבה על אופניים",
    "יוגה", "מדיטציה", "שחמט", "חידות", "משחקי קופסה",
    "סרטים", "תוכניות טלוויזיה", "סרטים תיעודיים", "פודקאסטים", "רדיו",
    "נסיעות", "שפות", "היסטוריה", "מדע", "טכנולוגיה",
    "מלאכות יד", "עבודת עץ", "קדרות", "יצירת תכשיטים", "קליגרפיה",
    "דיג", "צפייה בציפורים", "אסטרונומיה", "איסוף", "התנדבות"
  ];

  const englishToHebrew = Object.fromEntries(englishHobbies.map((eng, index) => [eng, hebrewHobbies[index]]));
  const hebrewToEnglish = Object.fromEntries(hebrewHobbies.map((heb, index) => [heb, englishHobbies[index]]));

  return { englishToHebrew, hebrewToEnglish };
};

const getNeedMapping = () => {
  const englishNeeds = [
    "Companionship", "Medical Assistance", "Transportation", "Learning Hebrew", "Physical Exercise",
    "Arts & Crafts", "Technology Help", "Shopping", "Meal Preparation", "Housekeeping",
    "Reading Assistance", "Games & Recreation", "Religious Support", "Emotional Support", "Pet Care",
    "Gardening Help", "Mobility Assistance", "Financial Guidance", "Legal Guidance", "Other"
  ];

  const hebrewNeeds = [
    "חברותא", "עזרה רפואית", "תחבורה", "לימוד עברית", "פעילות גופנית",
    "אמנות ומלאכות יד", "עזרה בטכנולוגיה", "קניות", "הכנת ארוחות", "עבודות בית",
    "עזרה בקריאה", "משחקים ובילוי", "תמיכה דתית", "תמיכה רגשית", "טיפול בחיות מחמד",
    "עזרה בגינון", "עזרה בניידות", "הכוונה פיננסית", "הכוונה משפטית", "אחר"
  ];

  const englishToHebrew = Object.fromEntries(englishNeeds.map((eng, index) => [eng, hebrewNeeds[index]]));
  const hebrewToEnglish = Object.fromEntries(hebrewNeeds.map((heb, index) => [heb, englishNeeds[index]]));

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

    const { hebrewToEnglish: hobbyMapping } = getHobbyMapping();
    const englishHobbyValue = hobbyMapping[value];
    if (englishHobbyValue && array.includes(englishHobbyValue)) return true;

    const { hebrewToEnglish: needMapping } = getNeedMapping();
    const englishNeedValue = needMapping[value];
    if (englishNeedValue && array.includes(englishNeedValue)) return true;
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

    const { hebrewToEnglish: hobbyMapping } = getHobbyMapping();
    const englishHobbyValue = hobbyMapping[value];
    if (englishHobbyValue && !array.includes(englishHobbyValue)) {
      return [...array, englishHobbyValue];
    }

    const { hebrewToEnglish: needMapping } = getNeedMapping();
    const englishNeedValue = needMapping[value];
    if (englishNeedValue && !array.includes(englishNeedValue)) {
      return [...array, englishNeedValue];
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

    const { hebrewToEnglish: hobbyMapping } = getHobbyMapping();
    const englishHobbyValue = hobbyMapping[value];
    if (englishHobbyValue && array.includes(englishHobbyValue)) {
      return array.filter(item => item !== englishHobbyValue);
    }

    const { hebrewToEnglish: needMapping } = getNeedMapping();
    const englishNeedValue = needMapping[value];
    if (englishNeedValue && array.includes(englishNeedValue)) {
      return array.filter(item => item !== englishNeedValue);
    }
  }

  return array.filter(item => item !== value);
};

// Translation helper functions
const translateArrayForExport = (array: string[], isRTL: boolean) => {
  if (!isRTL || !array || array.length === 0) return array;

  const { englishToHebrew } = getLanguageMapping();
  const { englishToHebrew: hobbyMapping } = getHobbyMapping();
  const { englishToHebrew: needMapping } = getNeedMapping();

  return array.map(item => {
    // Try language mapping first
    if (englishToHebrew[item]) return englishToHebrew[item];
    // Try hobby mapping
    if (hobbyMapping[item]) return hobbyMapping[item];
    // Try need mapping
    if (needMapping[item]) return needMapping[item];
    // Return original if no mapping found
    return item;
  });
};

const translateArrayForImport = (array: string[], isRTL: boolean) => {
  if (!isRTL || !array || array.length === 0) return array;

  const { hebrewToEnglish } = getLanguageMapping();
  const { hebrewToEnglish: hobbyMapping } = getHobbyMapping();
  const { hebrewToEnglish: needMapping } = getNeedMapping();

  return array.map(item => {
    // Try language mapping first
    if (hebrewToEnglish[item]) return hebrewToEnglish[item];
    // Try hobby mapping
    if (hobbyMapping[item]) return hobbyMapping[item];
    // Try need mapping
    if (needMapping[item]) return needMapping[item];
    // Return original if no mapping found
    return item;
  });
};

const translateGender = (gender: string, isRTL: boolean) => {
  if (!isRTL) return gender; // Return as is for English

  const genderMapping = {
    'male': 'זכר',
    'female': 'נקבה'
  };

  return genderMapping[gender as keyof typeof genderMapping] || gender;
};

const translateGenderForImport = (gender: string, isRTL: boolean) => {
  if (!isRTL) return gender;

  const genderMapping = {
    'זכר': 'male',
    'נקבה': 'female'
  };

  return genderMapping[gender as keyof typeof genderMapping] || gender;
};

const translateStatusForImport = (status: string, isRTL: boolean) => {
  if (!isRTL) return status;

  const statusMapping = {
    'פעיל': 'active',
    'לא פעיל': 'inactive'
  };

  return statusMapping[status as keyof typeof statusMapping] || status;
};

const ManagerResidents = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['residents', 'common']);
  const { isRTL } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<ResidentUI | null>(null);
  const [newResident, setNewResident] = useState<Omit<Resident, 'id'>>({
    fullName: "",
    birthDate: "",
    gender: "male",
    dateOfAliyah: null,
    countryOfAliyah: null,
    phoneNumber: null,
    education: null,
    needs: [],
    hobbies: [],
    languages: [],
    cooperationLevel: 1,
    availability: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    appointmentHistory: [],
    totalSessions: 0,
    totalHours: 0,
    isActive: true,
    createdAt: Timestamp.now(),
    notes: null
  });
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);
  const [residentsToDelete, setResidentsToDelete] = useState<ResidentUI[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [ageRange, setAgeRange] = useState<[number | null, number | null]>([null, null]);
  const [joinDateRange, setJoinDateRange] = useState<[string, string]>(["", ""]);
  const [hoursRange, setHoursRange] = useState<[number | null, number | null]>([null, null]);
  const [sessionsRange, setSessionsRange] = useState<[number | null, number | null]>([null, null]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortToggle, setSortToggle] = useState(false);
  const [sortState, setSortState] = useState<{
    field: "fullName" | "age" | "createdAt" | "totalHours" | "totalSessions";
    direction: "asc" | "desc";
  }>({
    field: "fullName",
    direction: "desc"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInstant, setIsCreatingInstant] = useState(false);
  const [isEditingInstant, setIsEditingInstant] = useState(false);
  const [isDeletingInstant, setIsDeletingInstant] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingLocal, setIsDeletingLocal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone number validation states
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [editPhoneNumberError, setEditPhoneNumberError] = useState<string | null>(null);

  // Firestore hooks
  const { residents, loading: residentsLoading, error: residentsError } = useResidents();
  const { addResident, loading: addingResident, error: addError } = useAddResident();
  const { updateResident, loading: updatingResident, error: updateError } = useUpdateResident();
  const { deleteResident, loading: deletingResident, error: deleteError } = useDeleteResident();

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
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  // Handle create new resident
  const handleCreateResident = async () => {
    try {
      if (!newResident.fullName || !newResident.birthDate) {
        alert(t('residents:errors.fillRequiredFields'));
        return;
      }

      // Validate phone number if provided
      if (newResident.phoneNumber && !validatePhoneNumber(newResident.phoneNumber)) {
        const error = getPhoneNumberError(newResident.phoneNumber);
        setPhoneNumberError(error);
        alert(error || t('residents:errors.invalidPhoneNumber'));
        return;
      }

      await addResident(newResident);
      setIsCreateDialogOpen(false);
      setNewResident({
        fullName: "",
        birthDate: "",
        gender: "male",
        dateOfAliyah: null,
        countryOfAliyah: null,
        phoneNumber: null,
        education: null,
        needs: [],
        hobbies: [],
        languages: [],
        cooperationLevel: 1,
        availability: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        },
        appointmentHistory: [],
        totalSessions: 0,
        totalHours: 0,
        isActive: true,
        createdAt: Timestamp.now(),
        notes: null
      });
    } catch (error) {
      console.error("Error creating resident:", error);
      alert(t('residents:errors.createResidentError'));
    }
  };

  // Handle edit resident
  const handleEditResident = async () => {
    if (!selectedResident) return;

    try {
      if (!selectedResident.fullName || !selectedResident.birthDate) {
        alert(t('residents:errors.fillRequiredFields'));
        return;
      }

      // Validate phone number if provided
      if (selectedResident.phoneNumber && !validatePhoneNumber(selectedResident.phoneNumber)) {
        const error = getPhoneNumberError(selectedResident.phoneNumber);
        setEditPhoneNumberError(error);
        alert(error || t('residents:errors.invalidPhoneNumber'));
        return;
      }

      const { id, createdAt, ...updateData } = selectedResident;
      await updateResident(id, updateData);

      setIsEditDialogOpen(false);
      setSelectedResident(null);
    } catch (error) {
      console.error("Error updating resident:", error);
      alert(t('residents:errors.updateResidentError'));
    }
  };

  // Handle delete resident
  const handleDeleteResident = async () => {
    setIsDeletingLocal(true);

    try {
      if (selectedResidents.length > 0) {
        // Handle bulk delete
        for (const id of selectedResidents) {
          const resident = residents.find(r => r.id === id);
          if (resident) {
            if ((resident.totalSessions || 0) === 0 && (resident.totalHours || 0) === 0) {
              await deleteResident(id);
            } else {
              alert(t('residents:errors.cannotDeleteWithSessions'));
            }
          }
        }
        // Clear all states after operations complete
        setSelectedResidents([]);
        setResidentsToDelete([]);
        setIsDeleteDialogOpen(false);
      } else if (selectedResident) {
        // Handle single delete
        if ((selectedResident.totalSessions || 0) === 0 && (selectedResident.totalHours || 0) === 0) {
          await deleteResident(selectedResident.id);
          // Clear all states after operation completes
          setSelectedResident(null);
          setResidentsToDelete([]);
          setIsDeleteDialogOpen(false);
        } else {
          alert(t('residents:errors.cannotDeleteWithSessions'));
          setIsDeletingLocal(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error deleting resident:", error);
    } finally {
      setIsDeletingLocal(false);
    }
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
      if (isEdit && selectedResident) {
        setSelectedResident({ ...selectedResident, phoneNumber: formatted });
      } else {
        setNewResident({ ...newResident, phoneNumber: formatted });
      }
    }
  };

  // Filter residents based on search query and filters
  const filteredResidents = residents.filter(resident => {
    const matchesSearch =
      resident.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.gender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      translateGender(resident.gender, isRTL).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resident.phoneNumber && resident.phoneNumber.includes(searchQuery));

    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? resident.isActive : !resident.isActive);

    // Age filter
    const age = calculateAge(resident.birthDate);
    const matchesAge = (!ageRange[0] || age >= ageRange[0]) && (!ageRange[1] || age <= ageRange[1]);

    // Hours filter
    const matchesHours = (!hoursRange[0] || resident.totalHours >= hoursRange[0]) &&
      (!hoursRange[1] || resident.totalHours <= hoursRange[1]);

    // Sessions filter
    const matchesSessions = (!sessionsRange[0] || resident.totalSessions >= sessionsRange[0]) &&
      (!sessionsRange[1] || resident.totalSessions <= sessionsRange[1]);

    // Join date filter
    const joinDate = new Date(resident.createdAt);
    const matchesJoinDate = (!joinDateRange[0] || joinDate >= new Date(joinDateRange[0])) &&
      (!joinDateRange[1] || joinDate <= new Date(joinDateRange[1]));

    return matchesSearch && matchesStatus && matchesAge && matchesHours && matchesSessions && matchesJoinDate;
  });

  // Update the sortedAndFilteredResidents useMemo
  const sortedAndFilteredResidents = useMemo(() => {
    return [...filteredResidents].sort((a, b) => {
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
        return -1 * direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      if (sortState.field === "age") {
        return direction * (calculateAge(a.birthDate) - calculateAge(b.birthDate));
      }

      return 0;
    });
  }, [filteredResidents, sortState, calculateAge]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedAndFilteredResidents.length / itemsPerPage);
  const paginatedResidents = sortedAndFilteredResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sorting
  const handleSort = (field: "fullName" | "age" | "createdAt" | "totalHours" | "totalSessions") => {
    setSortToggle(prev => !prev); // flip the toggle
    setSortState(prev => ({
      field,
      direction: !sortToggle ? "asc" : "desc"
    }));
    setSelectedResidents([]); // Clear selection when sorting
  };

  // Handle resident selection
  const handleSelectResident = (id: string) => {
    setSelectedResidents(prev => {
      if (prev.includes(id)) {
        return prev.filter(residentId => residentId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle bulk actions
  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    // Only perform actions on selected residents that are currently visible
    const visibleSelectedResidents = selectedResidents.filter(id =>
      filteredResidents.some(resident => resident.id === id)
    );

    if (visibleSelectedResidents.length === 0) {
      alert(t('residents:errors.bulkActionError'));
      return;
    }

    if (action === "delete") {
      // For delete action, show the delete dialog
      const residentsBeingDeleted = residents.filter(r => visibleSelectedResidents.includes(r.id));
      setResidentsToDelete(residentsBeingDeleted);
      setSelectedResident(residents.find(r => r.id === visibleSelectedResidents[0]));
      setIsDeleteDialogOpen(true);
      return;
    }

    // For other actions, proceed with the confirmation
    const confirmMessage = {
      activate: "Are you sure you want to activate the selected residents?",
      deactivate: "Are you sure you want to deactivate the selected residents?",
    }[action];

    if (window.confirm(confirmMessage)) {
      // Update each selected resident's status
      await Promise.all(visibleSelectedResidents.map(id =>
        updateResident(id, { isActive: action === "activate" })
      ));
      // Clear selection after action
      setSelectedResidents([]);
    }
  };

  // --- HEADER ORDER FOR IMPORT/EXPORT ---
  const getImportExportHeaders = () => [
    isRTL ? "שם מלא" : "Full Name",
    isRTL ? "מספר טלפון" : "Phone Number",
    isRTL ? "מגדר" : "Gender",
    isRTL ? "גיל" : "Age",
    isRTL ? "תאריך לידה" : "Birth Date",
    isRTL ? "תאריך עלייה" : "Date of Aliyah",
    isRTL ? "מדינת עלייה" : "Country of Aliyah",
    isRTL ? "תאריך הצטרפות" : "Join Date",
    isRTL ? "סטטוס" : "Status",
    isRTL ? "סה\"כ שעות" : "Total Hours",
    isRTL ? "סה\"כ מפגשים" : "Total Sessions",
    isRTL ? "השכלה" : "Education",
    isRTL ? "צרכים" : "Needs",
    isRTL ? "תחביבים" : "Hobbies",
    isRTL ? "שפות" : "Languages",
    isRTL ? "רמת שיתוף פעולה" : "Cooperation Level",
    isRTL ? "הערות" : "Notes"
  ];

  // --- HEADER ORDER FOR IMPORT ONLY ---
  const getImportHeaders = () => [
    isRTL ? "שם מלא" : "Full Name",
    isRTL ? "מספר טלפון" : "Phone Number",
    isRTL ? "מגדר" : "Gender",
    isRTL ? "תאריך לידה" : "Birth Date",
    isRTL ? "תאריך עלייה" : "Date of Aliyah",
    isRTL ? "מדינת עלייה" : "Country of Aliyah",
    isRTL ? "סטטוס" : "Status",
    isRTL ? "השכלה" : "Education",
    isRTL ? "צרכים" : "Needs",
    isRTL ? "תחביבים" : "Hobbies",
    isRTL ? "שפות" : "Languages",
    isRTL ? "רמת שיתוף פעולה" : "Cooperation Level",
    isRTL ? "הערות" : "Notes"
  ];

  const handleExport = () => {
    // Only export selected residents that are currently visible
    const visibleSelectedResidents = selectedResidents.filter(id =>
      filteredResidents.some(resident => resident.id === id)
    );

    if (visibleSelectedResidents.length === 0) {
      alert(t('residents:errors.exportError'));
      return;
    }

    // Get the selected residents' data
    const selectedResidentsData = residents.filter(resident =>
      visibleSelectedResidents.includes(resident.id)
    );

    // Convert to CSV format with proper headers and data in current language
    const csvContent = [
      getImportExportHeaders().join(","),
      ...selectedResidentsData.map(resident => [
        `"${resident.fullName.replace(/"/g, '""')}"`,
        `"${(resident.phoneNumber || '').replace(/"/g, '""')}"`,
        `"${translateGender(resident.gender, isRTL)}"`,
        `"${calculateAge(resident.birthDate)}"`,
        `"${resident.birthDate}"`,
        `"${resident.dateOfAliyah || ''}"`,
        `"${resident.countryOfAliyah || ''}"`,
        `"${new Date(resident.createdAt).toLocaleDateString('en-GB')}"`,
        `"${resident.isActive ? t('residents:filters.active') : t('residents:filters.inactive')}"`,
        `"${formatNumber(resident.totalHours || 0)}"`,
        `"${resident.totalSessions || 0}"`,
        `"${(resident.education || '').replace(/"/g, '""')}"`,
        `"${translateArrayForExport(resident.needs || [], isRTL).join("; ").replace(/"/g, '""')}"`,
        `"${translateArrayForExport(resident.hobbies || [], isRTL).join("; ").replace(/"/g, '""')}"`,
        `"${translateArrayForExport(resident.languages || [], isRTL).join("; ").replace(/"/g, '""')}"`,
        `"${resident.cooperationLevel || 1}"`,
        `"${(resident.notes || '').replace(/"/g, '""')}"`
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
    link.setAttribute("download", `residents_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clear selection after export
    setSelectedResidents([]);
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
            alert('CSV header order does not match the required import format. Please use the sample file as a template.');
            setIsImporting(false);
            return;
          }

          // Skip header row and process each resident
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < getImportHeaders().length) continue; // Skip invalid rows

            // Validate required fields
            if (!row[0] || !row[3]) { // Full Name, Birth Date
              console.warn(`Skipping row ${i + 1}: Missing required fields (name or birth date)`);
              continue;
            }

            const residentData: Omit<Resident, 'id'> = {
              fullName: row[0],
              phoneNumber: row[1] || null,
              gender: translateGenderForImport(row[2]?.toLowerCase(), isRTL) === 'female' ? 'female' : 'male',
              birthDate: row[3],
              dateOfAliyah: row[4] || null,
              countryOfAliyah: row[5] || null,
              isActive: translateStatusForImport(row[6]?.toLowerCase(), isRTL) === 'active',
              education: row[7] || null,
              needs: translateArrayForImport(row[8]?.split(';').map(n => n.trim()) || [], isRTL),
              hobbies: translateArrayForImport(row[9]?.split(';').map(h => h.trim()) || [], isRTL),
              languages: translateArrayForImport(row[10]?.split(';').map(l => l.trim()) || [], isRTL),
              cooperationLevel: parseInt(row[11]) || 1,
              notes: row[12] || null,
              createdAt: Timestamp.now(),
              totalHours: 0,
              totalSessions: 0,
              appointmentHistory: [],
              availability: {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
              },
              // countryOfAliyah and dateOfAliyah already set above
            };

            await addResident(residentData);
          }
          setIsImportDialogOpen(false);
          setSelectedFile(null);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error('Error processing file:', error);
          alert('Error processing file. Please check the format and try again.');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      console.error('Error importing residents:', error);
      alert('Error importing residents. Please check the file format and try again.');
      setIsImporting(false);
    }
  };

  const handleDownloadSample = () => {
    // Create sample CSV content for import in current language
    const sampleData = [
      isRTL ? "אלכס כהן" : "Alex Cohen",
      "0501234567",
      isRTL ? "זכר" : "male",
      "1950-01-01",
      "2010-05-15",
      isRTL ? "ארצות הברית" : "USA",
      isRTL ? "פעיל" : "active",
      isRTL ? "תיכון" : "High School",
      isRTL ? "עזרה רפואית; לימוד עברית" : "Medical Assistance; Learning Hebrew",
      isRTL ? "קריאה; מוזיקה" : "Reading; Music",
      isRTL ? "אנגלית; עברית" : "English; Hebrew",
      "3",
      isRTL ? "מעדיף ביקורים בבוקר" : "Prefers morning visits"
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
    link.setAttribute("download", "resident_import_sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      if (event.data?.type === "OPEN_CREATE_RESIDENT_DIALOG") {
        setIsCreateDialogOpen(true);
      }
      if (event.data?.type === "OPEN_EDIT_RESIDENT_DIALOG") {
        const residentId = event.data.residentId;
        const resident = residents.find(r => r.id === residentId);
        if (resident) {
          setSelectedResident(resident);
          setIsEditDialogOpen(true);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [residents]);

  // Helper function to format numbers
  const formatNumber = (num: number) => {
    if (Number.isInteger(num)) return num.toString();
    return num.toFixed(2).replace(/\.?0+$/, '');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Show error state */}
      {residentsError && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg shadow-lg">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-slate-600">Error loading residents: {residentsError.message}</p>
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
              <UserPlus className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block whitespace-nowrap">{t('residents:pageTitle')}</h1>
            </div>
          </div>
          {/* Center section - Search Bar */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="search-residents"
                name="search-residents"
                placeholder={t('residents:searchPlaceholder')}
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
          {(residentsLoading || isLoading) ? (
            <DataTableSkeleton title="Residents" />
          ) : (
            <>
              {/* Mobile Search */}
              {isMobile && (
                <div className="mb-6 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="mobile-search-residents"
                      name="mobile-search-residents"
                      placeholder={t('residents:searchPlaceholder')}
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
                      <p className="text-sm text-slate-500">{t('residents:metrics.totalResidents')}</p>
                      <h3 className="text-2xl font-bold">{residents.length}</h3>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-full border border-slate-400 flex items-center justify-center">
                      <Users2 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{t('residents:metrics.activeResidents')}</p>
                      <h3 className="text-2xl font-bold">{residents.filter(r => r.isActive).length}</h3>
                    </div>
                    <div className="h-12 w-12 bg-green-50 rounded-full border border-green-300 flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{t('residents:metrics.totalHours')}</p>
                      <h3 className="text-2xl font-bold">{formatNumber(residents.reduce((sum, r) => sum + (r.totalHours || 0), 0))}</h3>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{t('residents:metrics.totalSessions')}</p>
                      <h3 className="text-2xl font-bold">{residents.reduce((sum, r) => sum + (r.totalSessions || 0), 0)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              {residents.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm mb-6 border border-slate-300">
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Left Section - Filters */}
                      <div className="flex flex-wrap items-center gap-3 min-w-0">
                        <Select value={filterStatus} onValueChange={(value) => {
                          setFilterStatus(value);
                          setSelectedResidents([]);
                        }}>
                          <SelectTrigger className="w-[140px] h-9 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('residents:filters.allStatus')}</SelectItem>
                            <SelectItem value="active">{t('residents:filters.active')}</SelectItem>
                            <SelectItem value="inactive">{t('residents:filters.inactive')}</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          className={cn("h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-2", isRTL && "space-x-reverse")}
                          onClick={() => setIsMoreFiltersOpen(true)}
                        >
                          <Filter className="h-4 w-4" />
                          {t('residents:moreFilters')}
                        </Button>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex items-center gap-3 min-w-0 h-9">
                        {/* Normal Actions */}
                        <div className={`flex items-center gap-3 ${selectedResidents.length > 0 ? 'hidden' : 'flex'}`}>
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
                            {viewMode === "list" ? t('residents:gridView') : t('residents:listView')}
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
                            {t('residents:import')}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsCreateDialogOpen(true)}
                            className={cn("h-9 bg-primary hover:bg-primary/90 flex items-center space-x-2", isRTL && "space-x-reverse")}
                          >
                            <Plus className="h-4 w-4" />
                            {t('residents:addResident')}
                          </Button>
                        </div>

                        {/* Bulk Actions */}
                        <div className={`flex items-center gap-3 ${selectedResidents.length > 0 ? 'flex' : 'hidden'}`}>
                          <span className="text-sm text-slate-600 whitespace-nowrap">
                            {selectedResidents.length} {t('residents:selected')}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedResidents([])}
                            className="h-9 border-slate-300 hover:bg-slate-50"
                          >
                            {t('residents:deselectAll')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction("activate")}
                            className="h-9 border-slate-300 hover:bg-slate-50"
                          >
                            {t('residents:activate')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction("deactivate")}
                            className="h-9 border-slate-300 hover:bg-slate-50"
                          >
                            {t('residents:deactivate')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkAction("delete")}
                            className="h-9 bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-600"
                          >
                            {t('residents:delete')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport()}
                            disabled={selectedResidents.length === 0}
                            className={cn("h-9 border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", isRTL && "space-x-reverse")}
                            title={selectedResidents.length === 0 ? "Select residents to export" : "Export selected residents"}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            {t('residents:export')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Residents List or Empty State */}
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300">
                {residents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Users2 className="h-12 w-12 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 mb-2">{t('residents:noResidentsYet')}</h2>
                    <p className="text-slate-500 mb-4">{t('residents:noResidentsDescription')}</p>
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => setIsCreateDialogOpen(true)}
                      className={cn("bg-primary hover:bg-primary/90 flex items-center space-x-2", isRTL && "space-x-reverse")}
                    >
                      <Plus className="h-5 w-5" /> {t('residents:addResident')}
                    </Button>
                  </div>
                ) : (
                  <>
                    {viewMode === "list" ? (
                      <div className="space-y-4">
                        {/* List View */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-white z-10">
                              <tr className="border-b">
                                <th className="text-center py-2 px-4">
                                  <Checkbox
                                    checked={paginatedResidents.length > 0 && paginatedResidents.every(resident => selectedResidents.includes(resident.id))}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        // Add only the current page's residents to the selection
                                        const newSelectedResidents = new Set(selectedResidents);
                                        paginatedResidents.forEach(resident => {
                                          newSelectedResidents.add(resident.id);
                                        });
                                        setSelectedResidents([...newSelectedResidents]);
                                      } else {
                                        // Remove only the current page's residents from the selection
                                        const currentPageIds = new Set(paginatedResidents.map(r => r.id));
                                        setSelectedResidents(selectedResidents.filter(id => !currentPageIds.has(id)));
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
                                    {t('residents:table.name')}
                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                  </Button>
                                </th>
                                <th className="text-center py-2 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center justify-center w-full"
                                  >
                                    {t('residents:table.gender')}
                                  </Button>
                                </th>
                                <th className="text-center py-2 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center justify-center w-full"
                                    onClick={() => handleSort("age")}
                                  >
                                    {t('residents:table.age')}
                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                  </Button>
                                </th>
                                <th className="text-center py-2 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center justify-center w-full"
                                  >
                                    {t('residents:table.phone')}
                                  </Button>
                                </th>
                                <th className="text-center py-2 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center justify-center w-full"
                                    onClick={() => handleSort("totalHours")}
                                  >
                                    {t('residents:table.totalHours')}
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
                                    {t('residents:table.sessions')}
                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                  </Button>
                                </th>
                                <th className="text-center py-2 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center justify-center w-full"
                                  >
                                    {t('residents:table.status')}
                                  </Button>
                                </th>
                                <th className="text-center py-2 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center justify-center w-full"
                                    onClick={() => handleSort("createdAt")}
                                  >
                                    {t('residents:table.joinDate')}
                                    <ArrowUpDown className="h-4 w-4 ml-1" />
                                  </Button>
                                </th>
                                <th className="text-center py-2 px-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center justify-center w-full"
                                  >
                                    {t('residents:table.actions')}
                                  </Button>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="relative">
                              {paginatedResidents.map((resident, index) => (
                                <tr
                                  key={resident.id}
                                  className={cn(
                                    "border-b hover:bg-slate-50",
                                    "bg-white"
                                  )}
                                >
                                  <td className="text-center py-2 px-4">
                                    <Checkbox
                                      checked={selectedResidents.includes(resident.id)}
                                      onCheckedChange={() => handleSelectResident(resident.id)}
                                    />
                                  </td>
                                  <td className="text-center py-2 px-4">{resident.fullName}</td>
                                  <td className="text-center py-2 px-4">{translateGender(resident.gender, isRTL)}</td>
                                  <td className="text-center py-2 px-4">{calculateAge(resident.birthDate)}</td>
                                  <td className="text-center py-2 px-4">
                                    {resident.phoneNumber ? (
                                      resident.phoneNumber
                                    ) : (
                                      <div className={cn("flex items-center justify-center text-slate-500 space-x-1", isRTL && "space-x-reverse")}>
                                        {isRTL ? (
                                          <>
                                            <XIcon className="h-3 w-3" />
                                            <Phone className="h-4 w-4" />
                                          </>
                                        ) : (
                                          <>
                                            <Phone className="h-4 w-4" />
                                            <XIcon className="h-3 w-3" />
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="text-center py-2 px-4">{formatNumber(resident.totalHours || 0)}</td>
                                  <td className="text-center py-2 px-4">{resident.totalSessions || 0}</td>
                                  <td className="text-center py-2 px-4">
                                    <div className="flex items-center justify-center">
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-xs",
                                          resident.isActive && "bg-emerald-50 border-emerald-500 text-green-700 hover:bg-green-100 hover:border-emerald-600 hover:text-green-700",
                                          !resident.isActive && "bg-rose-50 border-rose-500 text-rose-600 hover:bg-red-100 hover:border-rose-600 hover:text-rose-600"
                                        )}
                                      >
                                        {resident.isActive ? t('residents:filters.active') : t('residents:filters.inactive')}
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="text-center py-2 px-4">
                                    <div className={cn("flex items-center justify-center space-x-2", isRTL && "space-x-reverse")}>
                                      <Calendar className="h-4 w-4 text-slate-500" />
                                      <span>{new Date(resident.createdAt).toLocaleDateString('en-GB')}</span>
                                    </div>
                                  </td>
                                  <td className="text-center py-2 px-4">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedResident(resident);
                                        setIsEditDialogOpen(true);
                                      }}
                                      className="text-primary hover:text-primary/90 hover:bg-primary/5"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                          {paginatedResidents.map((resident) => (
                            <div
                              key={resident.id}
                              className="bg-white rounded-lg border border-slate-300 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col"
                              onClick={() => handleSelectResident(resident.id)}
                            >
                              {/* Profile Header */}
                              <div className="relative p-4">
                                <div className={cn("absolute top-[25px] z-10", isRTL ? "left-4" : "right-4")}>
                                  <Checkbox
                                    checked={selectedResidents.includes(resident.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedResidents([...selectedResidents, resident.id]);
                                      } else {
                                        setSelectedResidents(selectedResidents.filter(id => id !== resident.id));
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="border-black data-[state=checked]:bg-primary data-[state=checked]:border-primary bg-white/90 backdrop-blur-sm"
                                  />
                                </div>
                                <div className={cn("flex items-center space-x-4 min-w-0", isRTL && "space-x-reverse")}>
                                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-primary/10 flex items-center justify-center">
                                    <User className="h-8 w-8 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors duration-300 truncate max-w-[calc(100%-2rem)]">
                                      {resident.fullName}
                                    </h3>
                                    <div className="mt-1">
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-xs",
                                          resident.isActive && "bg-emerald-50 border-emerald-500 text-green-700 hover:bg-green-100 hover:border-emerald-600 hover:text-green-700",
                                          !resident.isActive && "bg-rose-50 border-rose-500 text-rose-600 hover:bg-red-100 hover:border-rose-600 hover:text-rose-600"
                                        )}
                                      >
                                        {resident.isActive ? t('residents:filters.active') : t('residents:filters.inactive')}
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
                                      <span>{new Date(resident.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className={cn("flex items-center text-sm text-slate-600 space-x-2", isRTL && "space-x-reverse")}>
                                      {resident.phoneNumber ? (
                                        <span className="truncate">{resident.phoneNumber}</span>
                                      ) : (
                                        <div className={cn("flex items-center justify-center text-slate-500 space-x-1", isRTL && "space-x-reverse")}>
                                          {isRTL ? (
                                            <>
                                              <XIcon className="h-3 w-3 mt-1" />
                                              <Phone className="h-4 w-4 mt-1" />
                                            </>
                                          ) : (
                                            <>
                                              <Phone className="h-4 w-4 mt-1" />
                                              <XIcon className="h-3 w-3 mt-1" />
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-1 flex flex-col items-center">
                                    <div className={cn("flex items-center text-sm text-slate-600 space-x-2", isRTL && "space-x-reverse")}>
                                      <Clock className="h-4 w-4 text-primary" />
                                      <span>{formatNumber(resident.totalHours || 0)} {t('residents:hours').toLowerCase()}</span>
                                    </div>
                                    <div className={cn("flex items-center text-sm text-slate-600 space-x-2", isRTL && "space-x-reverse")}>
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                      <span>{resident.totalSessions || 0} {t('residents:table.sessions').toLowerCase()}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className={cn("flex items-center justify-between pt-4 border-t border-slate-300 w-full max-w-xs space-x-2", isRTL && "space-x-reverse")}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedResident(resident);
                                      setIsEditDialogOpen(true);
                                    }}
                                    className="bg-gray-100 border border-gray-400/75 hover:bg-gray-200 hover:border-gray-400 flex items-center space-x-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    {t('common:actions.edit')}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedResident(resident);
                                      setSelectedResidents([]);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-600 flex items-center space-x-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    {t('residents:delete')}
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
                        <span className="text-sm text-slate-600">{t('residents:itemsPerPage')}</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            const newItemsPerPage = Number(value);
                            setItemsPerPage(newItemsPerPage);
                            setCurrentPage(1);
                            // Clear selections when changing page size
                            setSelectedResidents([]);
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
                          {t('residents:previous')}
                        </Button>
                        <span className="text-sm text-slate-600">
                          {t('residents:page')} {totalPages === 0 ? 0 : currentPage} {t('residents:of')} {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages || totalPages === 0}
                        >
                          {t('residents:next')}
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

      {/* Create Resident Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          setIsCreatingInstant(false);
          if (open) {
            setNewResident({
              fullName: "",
              birthDate: "",
              gender: "male",
              dateOfAliyah: null,
              countryOfAliyah: null,
              phoneNumber: null,
              education: null,
              needs: [],
              hobbies: [],
              languages: [],
              cooperationLevel: 1,
              availability: {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
              },
              appointmentHistory: [],
              totalSessions: 0,
              totalHours: 0,
              isActive: true,
              createdAt: Timestamp.now(),
              notes: null
            });
            setPhoneNumberError(null);
          } else {
            setNewResident({
              fullName: "",
              birthDate: "",
              gender: "male",
              dateOfAliyah: null,
              countryOfAliyah: null,
              phoneNumber: null,
              education: null,
              needs: [],
              hobbies: [],
              languages: [],
              cooperationLevel: 1,
              availability: {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
              },
              appointmentHistory: [],
              totalSessions: 0,
              totalHours: 0,
              isActive: true,
              createdAt: Timestamp.now(),
              notes: null
            });
            setPhoneNumberError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle className="text-slate-900">{t('residents:dialogs.addNewResident')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('residents:dialogs.addNewResidentDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
            {/* Basic Information */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('residents:forms.basicInformation')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">{t('residents:forms.fullNameRequired')}</Label>
                  <Input
                    id="fullName"
                    placeholder={t('residents:forms.enterFullName')}
                    value={newResident.fullName}
                    onChange={(e) => setNewResident({ ...newResident, fullName: e.target.value })}
                    className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700">{t('residents:forms.phoneNumber')}</Label>
                  <Input
                    id="phoneNumber"
                    placeholder={t('residents:forms.enterPhoneNumber')}
                    value={newResident.phoneNumber || ""}
                    onChange={(e) => {
                      setNewResident({ ...newResident, phoneNumber: e.target.value });
                      handlePhoneNumberChange(e.target.value, false);
                    }}
                    onBlur={(e) => handlePhoneNumberBlur(e.target.value, false)}
                    className={cn(
                      "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                      phoneNumberError ? "border-red-500 focus:border-red-500" : ""
                    )}
                  />
                  {phoneNumberError && <p className="text-sm text-red-600 mt-1">{t(phoneNumberError, { ns: 'residents' })}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-medium text-slate-700">{t('residents:forms.birthDateRequired')}</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newResident.birthDate}
                    onChange={(e) => setNewResident({ ...newResident, birthDate: e.target.value })}
                    className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-slate-700">{t('residents:forms.genderRequired')}</Label>
                  <Select
                    value={newResident.gender}
                    onValueChange={(value: 'male' | 'female') => setNewResident({ ...newResident, gender: value })}
                  >
                    <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t('residents:forms.selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('residents:forms.male')}</SelectItem>
                      <SelectItem value="female">{t('residents:forms.female')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('residents:forms.additionalInformation')}</h3>
              </div>
              {/* Grid for simple fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dateOfAliyah" className="text-sm font-medium text-slate-700">{t('residents:forms.dateOfAliyah')}</Label>
                  <Input
                    id="dateOfAliyah"
                    type="date"
                    value={newResident.dateOfAliyah || ""}
                    onChange={(e) => setNewResident({ ...newResident, dateOfAliyah: e.target.value })}
                    className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryOfAliyah" className="text-sm font-medium text-slate-700">{t('residents:forms.countryOfAliyah')}</Label>
                  <Input
                    id="countryOfAliyah"
                    placeholder={t('residents:forms.enterCountry')}
                    value={newResident.countryOfAliyah || ""}
                    onChange={(e) => setNewResident({ ...newResident, countryOfAliyah: e.target.value })}
                    className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education" className="text-sm font-medium text-slate-700">{t('residents:forms.education')}</Label>
                  <Input
                    id="education"
                    placeholder={t('residents:forms.enterEducation')}
                    value={newResident.education || ""}
                    onChange={(e) => setNewResident({ ...newResident, education: e.target.value })}
                    className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-slate-700">{t('residents:forms.status')}</Label>
                  <Select
                    value={newResident.isActive ? "active" : "inactive"}
                    onValueChange={(value) => setNewResident({ ...newResident, isActive: value === "active" })}
                  >
                    <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t('residents:forms.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('residents:filters.active')}</SelectItem>
                      <SelectItem value="inactive">{t('residents:filters.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Cooperation Level - span both columns */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cooperationLevel" className="text-sm font-medium text-slate-700">{t('residents:forms.cooperationLevel')}</Label>
                  <Input
                    id="cooperationLevel"
                    type="number"
                    min="1"
                    max="3"
                    value={newResident.cooperationLevel}
                    onChange={(e) => setNewResident({
                      ...newResident,
                      cooperationLevel: Math.min(3, Math.max(1, parseInt(e.target.value) || 1))
                    })}
                    className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              {/* Languages - full width */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="languages" className="text-sm font-medium text-slate-700">{t('residents:forms.languages')}</Label>
                <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                  <div className="h-full overflow-y-auto bg-slate-50">
                    <div className="divide-y divide-slate-200">
                      {(t('residents:languages', { returnObjects: true }) as string[]).map((language, index) => (
                        <div key={index} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                          <Checkbox
                            id={`language-${index}`}
                            checked={isValueInArray(language, newResident.languages, isRTL)}
                            onCheckedChange={(checked) => {
                              const newLanguages = checked
                                ? addValueToArray(language, newResident.languages, isRTL)
                                : removeValueFromArray(language, newResident.languages, isRTL);
                              setNewResident({
                                ...newResident,
                                languages: newLanguages
                              });
                            }}
                          />
                          <Label
                            htmlFor={`language-${index}`}
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
              {/* Hobbies - full width */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="hobbies" className="text-sm font-medium text-slate-700">{t('residents:forms.hobbies')}</Label>
                <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                  <div className="h-full overflow-y-auto bg-slate-50">
                    <div className="divide-y divide-slate-200">
                      {(t('residents:hobbies', { returnObjects: true }) as string[]).map((hobby, index) => (
                        <div key={index} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                          <Checkbox
                            id={`hobby-${index}`}
                            checked={isValueInArray(hobby, newResident.hobbies || [], isRTL)}
                            onCheckedChange={(checked) => {
                              const currentHobbies = newResident.hobbies || [];
                              const newHobbies = checked
                                ? addValueToArray(hobby, currentHobbies, isRTL)
                                : removeValueFromArray(hobby, currentHobbies, isRTL);
                              setNewResident({
                                ...newResident,
                                hobbies: newHobbies
                              });
                            }}
                          />
                          <Label
                            htmlFor={`hobby-${index}`}
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
              {/* Needs - full width */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="needs" className="text-sm font-medium text-slate-700">{t('residents:forms.needs')}</Label>
                <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                  <div className="h-full overflow-y-auto bg-slate-50">
                    <div className="divide-y divide-slate-200">
                      {(t('residents:needs', { returnObjects: true }) as string[]).map((need, index) => (
                        <div key={index} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                          <Checkbox
                            id={`need-${index}`}
                            checked={isValueInArray(need, newResident.needs || [], isRTL)}
                            onCheckedChange={(checked) => {
                              const currentNeeds = newResident.needs || [];
                              const newNeeds = checked
                                ? addValueToArray(need, currentNeeds, isRTL)
                                : removeValueFromArray(need, currentNeeds, isRTL);
                              setNewResident({
                                ...newResident,
                                needs: newNeeds
                              });
                            }}
                          />
                          <Label
                            htmlFor={`need-${index}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {need}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Slots */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('residents:forms.availability')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(newResident.availability ?? { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }).map(([day, slots]) => (
                  <div key={day} className="overflow-hidden rounded-lg border border-slate-300">
                    <div className="bg-slate-50">
                      <div className="divide-y divide-slate-200">
                        <div className="bg-white p-2">
                          <Label className="text-sm font-medium text-slate-700 capitalize">{t(`residents:availability.${day}`)}</Label>
                        </div>
                        {["morning", "afternoon", "evening"].map((timeSlot) => (
                          <div key={timeSlot} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <Checkbox
                              id={`${day}-${timeSlot}`}
                              checked={slots.includes(timeSlot)}
                              onCheckedChange={(checked) => {
                                const currentSlots = slots || [];
                                const newSlots = checked
                                  ? [...currentSlots, timeSlot]
                                  : currentSlots.filter(slot => slot !== timeSlot);
                                setNewResident({
                                  ...newResident,
                                  availability: {
                                    ...defaultAvailability,
                                    ...(newResident.availability || {}),
                                    [day]: newSlots
                                  }
                                });
                              }}
                            />
                            <Label
                              htmlFor={`${day}-${timeSlot}`}
                              className="text-sm font-normal capitalize cursor-pointer flex-1"
                            >
                              {t(`residents:availability.${timeSlot}`)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('residents:forms.notes')}</h3>
              </div>
              <Textarea
                id="edit-notes"
                placeholder={t('residents:forms.notesPlaceholder')}
                value={newResident.notes || ""}
                onChange={(e) => setNewResident({ ...newResident, notes: e.target.value })}
                className="min-h-[100px] bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
            <div className="flex justify-center w-full">
              <Button
                onClick={async () => {
                  if (!newResident.fullName || !newResident.birthDate || !newResident.gender || isCreatingInstant || addingResident) return;
                  setIsCreatingInstant(true);
                  await handleCreateResident();
                  setIsCreatingInstant(false);
                }}
                disabled={!newResident.fullName || !newResident.birthDate || !newResident.gender || isCreatingInstant || addingResident}
                className="w-[200px] transition-all duration-200 mx-auto bg-primary hover:bg-primary/90 relative"
              >
                {isCreatingInstant || addingResident ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="opacity-0">{t('residents:addResident')}</span>
                  </>
                ) : (
                  t('residents:addResident')
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resident Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle className="text-slate-900">{t('residents:dialogs.editResident')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('residents:dialogs.editResidentDescription')}
            </DialogDescription>
          </DialogHeader>

          {selectedResident && (
            <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
              {/* Basic Information */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('residents:forms.basicInformation')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName" className="text-sm font-medium text-slate-700">{t('residents:forms.fullNameRequired')}</Label>
                    <Input
                      id="edit-fullName"
                      placeholder={t('residents:forms.enterFullName')}
                      value={selectedResident.fullName}
                      onChange={(e) => setSelectedResident({ ...selectedResident, fullName: e.target.value })}
                      className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phoneNumber" className="text-sm font-medium text-slate-700">{t('residents:forms.phoneNumber')}</Label>
                    <Input
                      id="edit-phoneNumber"
                      placeholder={t('residents:forms.enterPhoneNumber')}
                      value={selectedResident.phoneNumber || ""}
                      onChange={(e) => {
                        setSelectedResident({ ...selectedResident, phoneNumber: e.target.value });
                        handlePhoneNumberChange(e.target.value, true);
                      }}
                      onBlur={(e) => handlePhoneNumberBlur(e.target.value, true)}
                      className={cn(
                        "h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        editPhoneNumberError ? "border-red-500 focus:border-red-500" : ""
                      )}
                    />
                    {editPhoneNumberError && <p className="text-sm text-red-600 mt-1">{t(editPhoneNumberError, { ns: 'residents' })}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-birthDate" className="text-sm font-medium text-slate-700">{t('residents:forms.birthDateRequired')}</Label>
                    <Input
                      id="edit-birthDate"
                      type="date"
                      value={selectedResident.birthDate}
                      onChange={(e) => setSelectedResident({ ...selectedResident, birthDate: e.target.value })}
                      className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-gender" className="text-sm font-medium text-slate-700">{t('residents:forms.genderRequired')}</Label>
                    <Select
                      value={selectedResident.gender}
                      onValueChange={(value: 'male' | 'female') => setSelectedResident({ ...selectedResident, gender: value })}
                    >
                      <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                        <SelectValue placeholder={t('residents:forms.selectGender')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('residents:forms.male')}</SelectItem>
                        <SelectItem value="female">{t('residents:forms.female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('residents:forms.additionalInformation')}</h3>
                </div>
                {/* Grid for simple fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-dateOfAliyah" className="text-sm font-medium text-slate-700">{t('residents:forms.dateOfAliyah')}</Label>
                    <Input
                      id="edit-dateOfAliyah"
                      type="date"
                      value={selectedResident.dateOfAliyah || ""}
                      onChange={(e) => setSelectedResident({ ...selectedResident, dateOfAliyah: e.target.value })}
                      className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-countryOfAliyah" className="text-sm font-medium text-slate-700">{t('residents:forms.countryOfAliyah')}</Label>
                    <Input
                      id="edit-countryOfAliyah"
                      placeholder={t('residents:forms.enterCountry')}
                      value={selectedResident.countryOfAliyah || ""}
                      onChange={(e) => setSelectedResident({ ...selectedResident, countryOfAliyah: e.target.value })}
                      className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-education" className="text-sm font-medium text-slate-700">{t('residents:forms.education')}</Label>
                    <Input
                      id="edit-education"
                      placeholder={t('residents:forms.enterEducation')}
                      value={selectedResident.education || ""}
                      onChange={(e) => setSelectedResident({ ...selectedResident, education: e.target.value })}
                      className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-sm font-medium text-slate-700">{t('residents:forms.status')}</Label>
                    <Select
                      value={selectedResident.isActive ? "active" : "inactive"}
                      onValueChange={(value) => setSelectedResident({ ...selectedResident, isActive: value === "active" })}
                    >
                      <SelectTrigger className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                        <SelectValue placeholder={t('residents:forms.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('residents:filters.active')}</SelectItem>
                        <SelectItem value="inactive">{t('residents:filters.inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Cooperation Level - span both columns */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-cooperationLevel" className="text-sm font-medium text-slate-700">{t('residents:forms.cooperationLevel')}</Label>
                    <Input
                      id="edit-cooperationLevel"
                      type="number"
                      min="1"
                      max="3"
                      value={selectedResident.cooperationLevel}
                      onChange={(e) => setSelectedResident({
                        ...selectedResident,
                        cooperationLevel: Math.min(3, Math.max(1, parseInt(e.target.value) || 1))
                      })}
                      className="h-10 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
                {/* Languages - full width */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-languages" className="text-sm font-medium text-slate-700">{t('residents:forms.languages')}</Label>
                  <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                    <div className="h-full overflow-y-auto bg-slate-50">
                      <div className="divide-y divide-slate-200">
                        {(t('residents:languages', { returnObjects: true }) as string[]).map((language, index) => (
                          <div key={index} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <Checkbox
                              id={`edit-language-${index}`}
                              checked={isValueInArray(language, selectedResident.languages || [], isRTL)}
                              onCheckedChange={(checked) => {
                                const newLanguages = checked
                                  ? addValueToArray(language, selectedResident.languages || [], isRTL)
                                  : removeValueFromArray(language, selectedResident.languages || [], isRTL);
                                setSelectedResident({
                                  ...selectedResident,
                                  languages: newLanguages
                                });
                              }}
                            />
                            <Label
                              htmlFor={`edit-language-${index}`}
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
                {/* Hobbies - full width */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-hobbies" className="text-sm font-medium text-slate-700">{t('residents:forms.hobbies')}</Label>
                  <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                    <div className="h-full overflow-y-auto bg-slate-50">
                      <div className="divide-y divide-slate-200">
                        {(t('residents:hobbies', { returnObjects: true }) as string[]).map((hobby, index) => (
                          <div key={index} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <Checkbox
                              id={`edit-hobby-${index}`}
                              checked={isValueInArray(hobby, selectedResident.hobbies || [], isRTL)}
                              onCheckedChange={(checked) => {
                                const currentHobbies = selectedResident.hobbies || [];
                                const newHobbies = checked
                                  ? addValueToArray(hobby, currentHobbies, isRTL)
                                  : removeValueFromArray(hobby, currentHobbies, isRTL);
                                setSelectedResident({
                                  ...selectedResident,
                                  hobbies: newHobbies
                                });
                              }}
                            />
                            <Label
                              htmlFor={`edit-hobby-${index}`}
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
                {/* Needs - full width */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-needs" className="text-sm font-medium text-slate-700">{t('residents:forms.needs')}</Label>
                  <div className="h-[148px] overflow-hidden rounded-lg border border-slate-300">
                    <div className="h-full overflow-y-auto bg-slate-50">
                      <div className="divide-y divide-slate-200">
                        {(t('residents:needs', { returnObjects: true }) as string[]).map((need, index) => (
                          <div key={index} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <Checkbox
                              id={`edit-need-${index}`}
                              checked={isValueInArray(need, selectedResident.needs || [], isRTL)}
                              onCheckedChange={(checked) => {
                                const currentNeeds = selectedResident.needs || [];
                                const newNeeds = checked
                                  ? addValueToArray(need, currentNeeds, isRTL)
                                  : removeValueFromArray(need, currentNeeds, isRTL);
                                setSelectedResident({
                                  ...selectedResident,
                                  needs: newNeeds
                                });
                              }}
                            />
                            <Label
                              htmlFor={`edit-need-${index}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {need}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Slots */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('residents:forms.availability')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                    const slots = selectedResident.availability?.[day as keyof typeof selectedResident.availability] || [];
                    return (
                      <div key={day} className="overflow-hidden rounded-lg border border-slate-300">
                        <div className="bg-slate-50">
                          <div className="divide-y divide-slate-200">
                            <div className="bg-white p-2">
                              <Label className="text-sm font-medium text-slate-700 capitalize">{t(`residents:availability.${day}`)}</Label>
                            </div>
                            {["morning", "afternoon", "evening"].map((timeSlot) => (
                              <div key={timeSlot} className={cn("flex items-center bg-white p-2", isRTL ? "space-x-reverse space-x-3" : "space-x-3")}>
                                <Checkbox
                                  id={`edit-${day}-${timeSlot}`}
                                  checked={slots.includes(timeSlot)}
                                  onCheckedChange={(checked) => {
                                    const currentSlots = slots || [];
                                    const newSlots = checked
                                      ? [...currentSlots, timeSlot]
                                      : currentSlots.filter(slot => slot !== timeSlot);
                                    setSelectedResident({
                                      ...selectedResident,
                                      availability: {
                                        ...defaultAvailability,
                                        ...(selectedResident.availability || {}),
                                        [day]: newSlots
                                      }
                                    });
                                  }}
                                />
                                <Label
                                  htmlFor={`edit-${day}-${timeSlot}`}
                                  className="text-sm font-normal capitalize cursor-pointer flex-1"
                                >
                                  {t(`residents:availability.${timeSlot}`)}
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

              {/* Notes */}
              <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900">{t('residents:forms.notes')}</h3>
                </div>
                <Textarea
                  id="edit-notes"
                  placeholder={t('residents:forms.notesPlaceholder')}
                  value={selectedResident.notes || ""}
                  onChange={(e) => setSelectedResident({ ...selectedResident, notes: e.target.value })}
                  className="min-h-[100px] bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
            <div className="flex justify-center w-full">
              <Button
                onClick={async () => {
                  if (!selectedResident?.fullName || !selectedResident?.birthDate || !selectedResident?.gender || isEditingInstant || updatingResident) return;
                  setIsEditingInstant(true);
                  await handleEditResident();
                  setIsEditingInstant(false);
                }}
                disabled={!selectedResident?.fullName || !selectedResident?.birthDate || !selectedResident?.gender || isEditingInstant || updatingResident}
                className="w-[200px] transition-all duration-200 mx-auto bg-primary hover:bg-primary/90 relative"
              >
                {isEditingInstant || updatingResident ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="opacity-0">{t('common:actions.save')}</span>
                  </>
                ) : (
                  t('common:actions.save')
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Resident Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!isDeletingLocal) {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setResidentsToDelete([]);
          }
        }
      }}>
        <DialogContent className="sm:max-w-[400px]" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle>{selectedResidents.length > 0 ? t('dialogs.deleteSelectedResidents') : t('dialogs.deleteResident')}</DialogTitle>
            <DialogDescription>
              {selectedResidents.length > 0 ? t('dialogs.deleteSelectedResidentsDescription') : t('dialogs.deleteResidentDescription')}
            </DialogDescription>
          </DialogHeader>

          {selectedResidents.length > 0 ? (
            <div className="py-4">
              <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                <div className="text-sm text-slate-600">
                  {t('dialogs.aboutToDelete')} {residentsToDelete.length} {residentsToDelete.length > 1 ? t('dialogs.residents') : t('dialogs.resident')}.
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex items-center mb-2">
                    <span className="font-medium">{t('dialogs.selectedResidents')}</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    {residentsToDelete.map(resident => (
                      <div key={resident.id} className="flex items-center">
                        <span>{resident.fullName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : selectedResident && (
            <div className="py-4">
              <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                <div className="mb-2">
                  <h3 className="font-medium">{selectedResident.fullName}</h3>
                </div>

                <div className="mt-2 text-sm">
                  <div className="flex items-center">
                    {t('dialogs.joined')} {new Date(selectedResident.createdAt).toLocaleDateString('en-GB')}
                  </div>
                  <div className="flex items-center mt-1">
                    {t('dialogs.totalHours')} {formatNumber(selectedResident?.totalHours || 0)}
                  </div>
                  <div className="flex items-center mt-1">
                    {t('dialogs.totalSessions')} {selectedResident?.totalSessions || 0}
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
                  await handleDeleteResident();
                }}
                disabled={isDeletingLocal}
                className="w-[200px] transition-all duration-200 mx-auto relative"
              >
                {isDeletingLocal ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="opacity-0">{selectedResidents.length > 0 ? t('actions.deleteSelected') : t('actions.deleteResident')}</span>
                  </>
                ) : (
                  selectedResidents.length > 0 ? t('actions.deleteSelected') : t('actions.deleteResident')
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
            <DialogTitle className="text-slate-900">{t('residents:filters.moreFiltersTitle')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('residents:filters.moreFiltersDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 overflow-y-auto flex-1">
            {/* Age Range Filter */}
            <div className="space-y-2">
              <Label>{t('residents:filters.ageRange')}</Label>
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
                  placeholder={t('residents:filters.min')}
                />
                <span className="text-slate-500">{t('residents:filters.to')}</span>
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
                  placeholder={t('residents:filters.max')}
                />
              </div>
            </div>

            {/* Total Hours Range Filter */}
            <div className="space-y-2">
              <Label>{t('residents:filters.totalHoursRange')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="hours-min"
                  name="hours-min"
                  type="number"
                  min="0"
                  value={hoursRange[0] === null ? "" : hoursRange[0]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setHoursRange([value === "" ? null : Number(value), hoursRange[1]]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={t('residents:filters.min')}
                />
                <span className="text-slate-500">{t('residents:filters.to')}</span>
                <Input
                  id="hours-max"
                  name="hours-max"
                  type="number"
                  min="0"
                  value={hoursRange[1] === null ? "" : hoursRange[1]}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setHoursRange([hoursRange[0], value === "" ? null : Number(value)]);
                  }}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={t('residents:filters.max')}
                />
              </div>
            </div>

            {/* Total Sessions Range Filter */}
            <div className="space-y-2">
              <Label>{t('residents:filters.totalSessionsRange')}</Label>
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
                  placeholder={t('residents:filters.min')}
                />
                <span className="text-slate-500">{t('residents:filters.to')}</span>
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
                  placeholder={t('residents:filters.max')}
                />
              </div>
            </div>

            {/* Join Date Range Filter */}
            <div className="space-y-2">
              <Label>{t('residents:filters.joinDateRange')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="join-date-start"
                  name="join-date-start"
                  type="date"
                  value={joinDateRange[0]}
                  onChange={(e) => setJoinDateRange([e.target.value, joinDateRange[1]])}
                  className="h-9 bg-white border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span className="text-slate-500">{t('residents:filters.to')}</span>
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
                {t('residents:filters.resetFilters')}
              </Button>
              <Button
                onClick={() => setIsMoreFiltersOpen(false)}
                className="h-9 bg-primary hover:bg-primary/90 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                {t('residents:filters.applyFilters')}
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
            <DialogTitle className="text-slate-900">{t('residents:importDialog.title')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('residents:importDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
            {/* File Upload Section */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('residents:importDialog.uploadSection.title')}</h3>
              </div>
              <p className="text-sm text-slate-500 -mt-1">
                {t('residents:importDialog.uploadSection.description')}
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="file-upload" className="text-sm font-medium text-slate-700">{t('residents:importDialog.uploadSection.selectFile')}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn("h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-2", isRTL && "space-x-reverse")}
                  >
                    <Upload className="h-4 w-4" />
                    {t('residents:importDialog.uploadSection.chooseFile')}
                  </Button>
                </div>
                {selectedFile && (
                  <div className="text-sm text-slate-600">
                    {t('residents:importDialog.uploadSection.selectedFile')} {selectedFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Sample File Section */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('residents:importDialog.sampleSection.title')}</h3>
              </div>
              <p className="text-sm text-slate-500 -mt-1">
                {t('residents:importDialog.sampleSection.description')}
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">{t('residents:importDialog.sampleSection.downloadTemplate')}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSample}
                    className={cn("h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-2", isRTL && "space-x-reverse")}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {t('residents:importDialog.sampleSection.downloadSample')}
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
                    {t('residents:importDialog.importing')}
                  </>
                ) : (
                  t('residents:importDialog.import')
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerResidents; 