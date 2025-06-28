import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import {
  X,
  Eye,
  Menu,
  Play,
  Plus,
  Clock,
  Users,
  Search,
  Loader2,
  Sliders,
  Settings,
  ChevronUp,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  SlidersVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

// UI Components
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Custom Components & Hooks
import { useLanguage } from "@/contexts/LanguageContext";
import { useResidents } from "@/hooks/useFirestoreResidents";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import MatchingRulesSkeleton from "@/components/skeletons/MatchingRulesSkeleton";
import { useMatchingRules, useAddMatchingRule, useUpdateMatchingRule, useResetMatchingRules, MatchingRuleUI } from "@/hooks/useMatchingRules";

// Utilities & Services
import { matchVolunteersToResidents } from "@/utils/matchingAlgorithm";

// Translation Utilities
const REASON_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "Resident has not specified any required skills.": "Resident has not specified any required skills.",
    "All required resident skills are present in the volunteer's skill set.": "All required resident skills are present in the volunteer's skill set.",
    "Volunteer does not possess any of the resident's required skills.": "Volunteer does not possess any of the resident's required skills.",
    "No hobbies specified for volunteer or resident.": "No hobbies specified for volunteer or resident.",
    "Volunteer and resident share all listed hobbies.": "Volunteer and resident share all listed hobbies.",
    "No shared hobbies between volunteer and resident.": "No shared hobbies between volunteer and resident.",
    "No languages specified for volunteer or resident.": "No languages specified for volunteer or resident.",
    "Volunteer speaks all languages required by the resident.": "Volunteer speaks all languages required by the resident.",
    "Volunteer does not speak any of the resident's required languages.": "Volunteer does not speak any of the resident's required languages.",
    "Resident has not specified any required availability.": "Resident has not specified any required availability.",
    "Volunteer is available for all of the resident's requested time slots.": "Volunteer is available for all of the resident's requested time slots.",
    "Volunteer is not available for any of the resident's requested time slots.": "Volunteer is not available for any of the resident's requested time slots.",
    "Volunteer fulfills every exact time slot required by the resident.": "Volunteer fulfills every exact time slot required by the resident.",
    "Gender information is missing for volunteer or resident.": "Gender information is missing for volunteer or resident.",
    "Birth date is missing for volunteer or resident.": "Birth date is missing for volunteer or resident.",
    "No residents have received any visits yet.": "No residents have received any visits yet."
  },
  he: {
    "Resident has not specified any required skills.": "הדייר לא ציין כישורים נדרשים.",
    "All required resident skills are present in the volunteer's skill set.": "כל הכישורים הנדרשים של הדייר קיימים בסט הכישורים של המתנדב.",
    "Volunteer does not possess any of the resident's required skills.": "המתנדב לא מחזיק באף אחד מהכישורים הנדרשים של הדייר.",
    "No hobbies specified for volunteer or resident.": "לא צוינו תחביבים למתנדב או לדייר.",
    "Volunteer and resident share all listed hobbies.": "המתנדב והדייר חולקים את כל התחביבים המפורטים.",
    "No shared hobbies between volunteer and resident.": "אין תחביבים משותפים בין המתנדב לדייר.",
    "No languages specified for volunteer or resident.": "לא צוינו שפות למתנדב או לדייר.",
    "Volunteer speaks all languages required by the resident.": "המתנדב מדבר את כל השפות הנדרשות על ידי הדייר.",
    "Volunteer does not speak any of the resident's required languages.": "המתנדב לא מדבר אף אחת מהשפות הנדרשות של הדייר.",
    "Resident has not specified any required availability.": "הדייר לא ציין זמינות נדרשת.",
    "Volunteer is available for all of the resident's requested time slots.": "המתנדב זמין לכל חלונות הזמן המבוקשים של הדייר.",
    "Volunteer is not available for any of the resident's requested time slots.": "המתנדב לא זמין לאף אחד מחלונות הזמן המבוקשים של הדייר.",
    "Volunteer fulfills every exact time slot required by the resident.": "המתנדב ממלא כל חלון זמן מדויק נדרש על ידי הדייר.",
    "Gender information is missing for volunteer or resident.": "מידע מגדר חסר למתנדב או לדייר.",
    "Birth date is missing for volunteer or resident.": "תאריך לידה חסר למתנדב או לדייר.",
    "No residents have received any visits yet.": "אין דיירים שקיבלו ביקורים עדיין."
  }
};

const DYNAMIC_TERMS: Record<string, Record<string, string>> = {
  en: {
    "sunday": "Sunday",
    "monday": "Monday",
    "tuesday": "Tuesday",
    "wednesday": "Wednesday",
    "thursday": "Thursday",
    "friday": "Friday",
    "saturday": "Saturday",
    "morning": "Morning",
    "afternoon": "Afternoon",
    "evening": "Evening",
    "night": "Night",
    "male": "Male",
    "female": "Female",
    "other": "Other"
  },
  he: {
    "sunday": "ראשון",
    "monday": "שני",
    "tuesday": "שלישי",
    "wednesday": "רביעי",
    "thursday": "חמישי",
    "friday": "שישי",
    "saturday": "שבת",
    "morning": "בוקר",
    "afternoon": "צהריים",
    "evening": "ערב",
    "night": "לילה",
    "male": "זכר",
    "female": "נקבה",
    "other": "אחר"
  }
};

const translateDynamicTerms = (text: string, language: string): string => {
  let translatedText = text;
  const terms = DYNAMIC_TERMS[language] || DYNAMIC_TERMS.en;

  // First, handle day-time combinations (e.g., "sunday morning" -> "ראשון-בוקר" or "Sunday-Morning")
  const dayTimePattern = /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s+(morning|afternoon|evening|night)\b/gi;
  translatedText = translatedText.replace(dayTimePattern, (match, day, time) => {
    const translatedDay = terms[day.toLowerCase()];
    const translatedTime = terms[time.toLowerCase()];
    return language === 'he' ? `${translatedDay}-${translatedTime}` : `${translatedDay}-${translatedTime}`;
  });

  // Then handle individual terms
  Object.entries(terms).forEach(([english, translated]) => {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    translatedText = translatedText.replace(regex, translated);
  });

  return translatedText;
};

const translateReason = (reason: string, language: string): string => {
  // If language is English, return the original reason
  if (language === 'en') {
    return reason;
  }

  // Handle dynamic messages with specific patterns for Hebrew
  if (reason.includes("Volunteer skills matched:")) {
    const translated = reason.replace("Volunteer skills matched:", "כישורי מתנדב תואמים:").replace("Required but missing:", "נדרש אך חסר:");
    return translateDynamicTerms(translated, language);
  }
  if (reason.includes("Shared hobbies:")) {
    const translated = reason.replace("Shared hobbies:", "תחביבים משותפים:").replace("Resident's hobbies not shared:", "תחביבי דייר לא משותפים:");
    return translateDynamicTerms(translated, language);
  }
  if (reason.includes("Languages in common:")) {
    const translated = reason.replace("Languages in common:", "שפות משותפות:").replace("Resident's required languages not spoken:", "שפות נדרשות של דייר לא מדוברות:");
    return translateDynamicTerms(translated, language);
  }
  if (reason.includes("Matching time slots:")) {
    const translated = reason.replace("Matching time slots:", "חלונות זמן תואמים:").replace("Unavailable for:", "לא זמין עבור:");
    return translateDynamicTerms(translated, language);
  }
  if (reason.includes("Volunteer does not meet the following required time slots:")) {
    const translated = reason.replace("Volunteer does not meet the following required time slots:", "המתנדב לא עומד בחלונות הזמן הנדרשים הבאים:").replace("(All must be met for a perfect match.)", "(כל אחד חייב להתקיים להתאמה מושלמת.)");
    return translateDynamicTerms(translated, language);
  }
  if (reason.includes("Volunteer and resident have the same gender:")) {
    const translated = reason.replace("Volunteer and resident have the same gender:", "למתנדב ולדייר יש אותו מגדר:");
    return translateDynamicTerms(translated, language);
  }
  if (reason.includes("Volunteer gender:") && reason.includes("Resident gender:")) {
    const translated = reason.replace("Volunteer gender:", "מגדר מתנדב:").replace("Resident gender:", "מגדר דייר:");
    return translateDynamicTerms(translated, language);
  }
  if (reason.includes("Volunteer is") && reason.includes("years old, resident is") && reason.includes("Age difference:")) {
    const translated = reason.replace("Volunteer is", "המתנדב בן").replace("years old, resident is", "שנים, הדייר בן").replace("years old. Age difference:", "שנים. הבדל גיל:").replace("years.", "שנים.");
    return translateDynamicTerms(translated, language);
  }
  if (reason.includes("Resident has received") && reason.includes("visits. The most visited resident has")) {
    const translated = reason.replace("Resident has received", "הדייר קיבל").replace("visits. The most visited resident has", "ביקורים. הדייר המבוקר ביותר קיבל").replace("visits.", "ביקורים.");
    return translateDynamicTerms(translated, language);
  }

  // For static messages, translate and then apply dynamic terms translation
  const translations = REASON_TRANSLATIONS[language];
  if (translations && translations[reason]) {
    return translateDynamicTerms(translations[reason], language);
  }

  // If no translation found, still try to translate dynamic terms in the original
  return translateDynamicTerms(reason, language);
};

// Constants
const LOADER_MIN_DURATION = 500; // ms
const MOBILE_BREAKPOINT = 768;
const INITIAL_NEW_RULE = {
  id: "",
  name: "",
  description: "",
  type: "weight" as "weight" | "toggle" | "option",
  value: 1 as number | boolean | string,
  defaultValue: 1 as number | boolean | string,
  min: 0,
  max: 10,
  step: 1,
  impact: "low" as "high" | "medium" | "low",
  options: undefined as { value: string; label: string }[] | undefined,
};

// Utility Functions
const formatScore = (num: number): string => {
  return Number(num).toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const getScoreBadgeColor = (score: number): string => {
  if (score < 60) return 'bg-red-500';
  if (score < 80) return 'bg-amber-400 text-black';
  return 'bg-green-500';
};

const getScoreBadge = (score: number): JSX.Element => {
  const color = getScoreBadgeColor(score);
  return (
    <span className={`inline-block px-2 py-1 rounded text-white font-semibold text-center text-sm ${color}`}>
      {score}
    </span>
  );
};

// Types and Interfaces
interface TestMatchResult {
  volunteerId: string;
  volunteerName: string;
  residentId: string;
  residentName: string;
  score: number;
  factors: {
    name: string;
    score: number;
    weight: number;
    reason?: string;
  }[];
}

interface TestRulesTableDialogContentProps {
  volunteers: any[];
  residents: any[];
  rules: any[];
  loadingVolunteers: boolean;
  loadingResidents: boolean;
  loadingRules: boolean;
  language: string;
}

function TestRulesTableDialogContent({ volunteers, residents, rules, loadingVolunteers, loadingResidents, loadingRules, language }: TestRulesTableDialogContentProps) {
  const { t } = useTranslation('matching-rules');
  const { isRTL } = useLanguage();
  const [results, setResults] = useState([]);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [initialLoading, setInitialLoading] = useState(true);

  // Minimum loader duration (500ms)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (loadingVolunteers || loadingResidents || loadingRules) {
      setInitialLoading(true);
      return;
    }
    if (!volunteers.length || !residents.length || !rules.length) {
      setResults([]);
      setInitialLoading(false);
      return;
    }
    const start = Date.now();
    // Convert UI types to backend types
    const convertedVolunteers = volunteers.map(v => ({ ...v, createdAt: Timestamp.fromDate(new Date(v.createdAt)) }));
    const convertedResidents = residents.map(r => ({ ...r, createdAt: Timestamp.fromDate(new Date(r.createdAt)) }));
    const convertedRules = rules.map(rule => ({ ...rule, updatedAt: Timestamp.fromDate(new Date(rule.updatedAt)) }));
    // Run the matching algorithm
    const matchResults = matchVolunteersToResidents(convertedVolunteers, convertedResidents, convertedRules);
    setResults(matchResults.map(result => ({
      volunteerId: result.volunteerId,
      volunteerName: convertedVolunteers.find(v => v.id === result.volunteerId)?.fullName || result.volunteerId,
      residentId: result.residentId,
      residentName: convertedResidents.find(r => r.id === result.residentId)?.fullName || result.residentId,
      score: result.score,
      factors: result.factors,
    })));
    // Ensure loader shows for at least 500ms
    const elapsed = Date.now() - start;
    timer = setTimeout(() => {
      setInitialLoading(false);
    }, Math.max(0, LOADER_MIN_DURATION - elapsed));
    return () => { if (timer) clearTimeout(timer); };
  }, [volunteers, residents, rules, loadingVolunteers, loadingResidents, loadingRules]);

  // Sorting logic
  const sortedResults = [...results].sort((a, b) =>
    sortOrder === 'asc' ? a.score - b.score : b.score - a.score
  );

  // Expand/collapse logic
  const toggleRow = (idx: number) => setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));

  if (initialLoading) {
    return (
      <div className="mt-8 mb-8 p-8 flex flex-col items-center justify-center min-h-[120px]">
        <Loader2 className="h-8 w-8 animate-spin mb-2 text-black" />
        <span className="text-black font-medium">{t('testDialog.loading')}</span>
      </div>
    );
  }

  if (!results.length) {
    return <div className="p-4 text-red-500">{t('testDialog.noData')}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">{t('testDialog.resultsTitle')}</h3>
      <div className="max-h-96 overflow-auto border border-slate-300 rounded-md">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-20">
            <tr className="border-b border-slate-300">
              <th className="border-r border-slate-300 px-4 py-2 text-center bg-gray-50">{t('testDialog.volunteer')}</th>
              <th className="border-r border-slate-300 px-4 py-2 text-center bg-gray-50">{t('testDialog.resident')}</th>
              <th
                className={`border-r px-4 py-2 text-center cursor-pointer select-none hover:bg-blue-100 transition bg-gray-50 ${isRTL ? 'border-l' : ''} border-slate-300`}
                onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
              >
                {t('testDialog.score')}
                <span className="mr-1 align-middle">{sortOrder === 'asc' ? '▲' : '▼'}</span>
              </th>
              <th className="px-4 py-2 text-center bg-gray-50">{t('testDialog.details')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, idx) => (
              <React.Fragment key={idx}>
                <tr className={`bg-white hover:bg-blue-50 transition ${idx !== sortedResults.length - 1 ? 'border-b border-slate-300' : ''}`}>
                  <td className="border-r border-slate-300 px-4 py-2 text-center align-middle">{result.volunteerName}</td>
                  <td className="border-r border-slate-300 px-4 py-2 text-center align-middle">{result.residentName}</td>
                  <td className={`border-r px-4 py-2 font-bold text-center align-middle ${isRTL ? 'border-l' : ''} border-slate-300`}>{getScoreBadge(result.score)}</td>
                  <td className="px-4 py-2 text-center align-middle">
                    <button
                      className="text-blue-600 underline text-sm focus:outline-none"
                      onClick={() => toggleRow(idx)}
                    >
                      {expandedRows[idx] ? t('testDialog.hideFactors') : t('testDialog.showFactors')}
                    </button>
                  </td>
                </tr>
                {expandedRows[idx] && (
                  <tr className={`bg-white ${idx !== sortedResults.length - 1 ? 'border-b border-slate-300' : ''}`}>
                    <td colSpan={4} className="px-4 py-2">
                      <div className="relative max-w-3xl mx-auto my-4">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/80 to-white/90 z-0" style={{ filter: 'blur(2px)' }} />
                        <div className="relative z-10 bg-white border-2 border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center transition-transform duration-200 scale-100 animate-fade-in">
                          <div className="flex items-center mb-2 text-gray-700 font-semibold text-sm border-b border-slate-300 pb-1 w-full">
                            <div className="w-1/5 text-center px-2 min-w-[80px] truncate">{t('testDialog.factor')}</div>
                            <div className="w-1/5 text-center px-2 min-w-[60px] truncate">{t('testDialog.score')}</div>
                            <div className="w-1/5 text-center px-2 min-w-[60px] truncate">{t('testDialog.weight')}</div>
                            <div className="w-2/5 text-center px-2 min-w-[120px] truncate">{t('testDialog.reason')}</div>
                          </div>
                          {result.factors
                            .slice()
                            .sort((a, b) => b.weight - a.weight || b.score - a.score)
                            .map((f, i) => (
                              <div key={i} className="flex items-center py-2 border-b last:border-b-0 border-slate-300 w-full justify-center">
                                <div className="w-1/5 font-medium text-gray-900 text-center">
                                  {t(`testDialog.factorNames.${f.name}` as any, { defaultValue: f.name })}
                                </div>
                                <div className="w-1/5 text-center">
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${f.score >= 80 ? 'bg-green-100 text-green-800' : f.score >= 60 ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-800'}`}>{formatScore(f.score)}</span>
                                </div>
                                <div className="w-1/5 text-center">
                                  <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">{f.weight}</span>
                                </div>
                                <div className="w-2/5 text-center text-xs text-gray-700">
                                  {translateReason(f.reason || '', language)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ManagerMatchingRules = () => {
  const { t } = useTranslation('matching-rules');
  const { isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = window.innerWidth < 768;
  const { rules, loading } = useMatchingRules();
  const { addMatchingRule, loading: adding } = useAddMatchingRule();
  const { updateMatchingRule } = useUpdateMatchingRule();
  const { resetMatchingRules } = useResetMatchingRules();
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"volunteer" | "resident">("volunteer");
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestMatchResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [showAllRules, setShowAllRules] = useState(false);
  const [newRule, setNewRule] = useState<typeof INITIAL_NEW_RULE>(INITIAL_NEW_RULE);
  const [addingMode, setAddingMode] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const { volunteers, loading: loadingVolunteers } = useVolunteers();
  const { residents, loading: loadingResidents } = useResidents();
  // Expanded rows for preview dialog
  const [expandedRowsPreview, setExpandedRowsPreview] = useState<Record<number, boolean>>({});
  // Sort order for preview dialog
  const [sortOrderPreview, setSortOrderPreview] = useState<'asc' | 'desc'>('desc');
  // Loading state for preview dialog
  const [previewLoading, setPreviewLoading] = useState(false);

  // Reset preview dialog state when closed
  useEffect(() => {
    if (!previewDialogOpen) {
      setSelectedVolunteer(null);
      setSelectedResident(null);
      setShowPreview(false);
      setTestResults([]);
      setExpandedRowsPreview({});
      setPreviewLoading(false);
    }
  }, [previewDialogOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check authentication
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (!user.id || user.role !== "manager") {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const handleValueChange = (rule: MatchingRuleUI, value: any) => {
    if (value === rule.value) {
      // If the new value matches the original, remove it from editedValues
      setEditedValues(prev => {
        const newValues = { ...prev };
        delete newValues[rule.id];
        return newValues;
      });
      setHasChanges(Object.keys(editedValues).length > 1); // Check if there are any other changes
    } else {
      // If the value is different, update editedValues
      setEditedValues(prev => ({ ...prev, [rule.id]: value }));
      setHasChanges(true);
    }
  };

  const handleSaveChanges = async () => {
    setSavingChanges(true);
    const updatePromises = Object.entries(editedValues).map(([id, value]) =>
      updateMatchingRule(id, { value })
    );
    try {
      await Promise.all(updatePromises);
      toast({ title: t('toasts.saveSuccess') });
      setEditedValues({});
      setHasChanges(false);
    } catch {
      toast({ title: t('toasts.saveError'), variant: "destructive" });
    }
    setSavingChanges(false);
  };

  const handleResetToDefaults = async () => {
    setIsResetLoading(true);
    try {
      await resetMatchingRules();
      toast({ title: t('toasts.resetSuccess') });
      setIsResetDialogOpen(false);
      setEditedValues({});
      setHasChanges(false);
    } catch (error) {
      toast({
        title: t('toasts.resetError'),
        description: "Failed to reset matching rules",
        variant: "destructive"
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  // Preview logic: run matching for selected volunteer or resident
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let isActive = true;
    const start = Date.now();

    const finish = (results: any[], show: boolean) => {
      const elapsed = Date.now() - start;
      const delay = Math.max(0, LOADER_MIN_DURATION - elapsed);
      timer = setTimeout(() => {
        if (!isActive) return;
        setTestResults(results);
        setShowPreview(show);
        setPreviewLoading(false);
      }, delay);
    };

    if (!previewDialogOpen) {
      finish([], false);
      return () => { isActive = false; if (timer) clearTimeout(timer); };
    }
    // Only show loader if a selection is made
    const shouldLoad = (previewMode === "volunteer" && selectedVolunteer) || (previewMode === "resident" && selectedResident);
    if (shouldLoad) {
      setPreviewLoading(true);
    } else {
      setPreviewLoading(false);
    }
    if (previewMode === "volunteer" && selectedVolunteer) {
      const volunteer = volunteers.find(v => v.id === selectedVolunteer);
      if (!volunteer || !residents.length || !rules.length) {
        finish([], false);
        return () => { isActive = false; if (timer) clearTimeout(timer); };
      }
      const convertedVolunteer = { ...volunteer, createdAt: Timestamp.fromDate(new Date(volunteer.createdAt)) };
      const convertedResidents = residents.map(r => ({ ...r, createdAt: Timestamp.fromDate(new Date(r.createdAt)) }));
      const convertedRules = rules.map(rule => ({ ...rule, updatedAt: Timestamp.fromDate(new Date(rule.updatedAt)) }));
      const results = convertedResidents.map(resident => {
        const matchResult = matchVolunteersToResidents([convertedVolunteer], [resident], convertedRules)[0];
        return {
          volunteerId: convertedVolunteer.id,
          volunteerName: convertedVolunteer.fullName,
          residentId: resident.id,
          residentName: resident.fullName,
          score: matchResult?.score ?? 0,
          factors: matchResult?.factors ?? [],
        };
      });
      finish(results, true);
    } else if (previewMode === "resident" && selectedResident) {
      const resident = residents.find(r => r.id === selectedResident);
      if (!resident || !volunteers.length || !rules.length) {
        finish([], false);
        return () => { isActive = false; if (timer) clearTimeout(timer); };
      }
      const convertedResident = { ...resident, createdAt: Timestamp.fromDate(new Date(resident.createdAt)) };
      const convertedVolunteers = volunteers.map(v => ({ ...v, createdAt: Timestamp.fromDate(new Date(v.createdAt)) }));
      const convertedRules = rules.map(rule => ({ ...rule, updatedAt: Timestamp.fromDate(new Date(rule.updatedAt)) }));
      const results = convertedVolunteers.map(volunteer => {
        const matchResult = matchVolunteersToResidents([volunteer], [convertedResident], convertedRules)[0];
        return {
          volunteerId: volunteer.id,
          volunteerName: volunteer.fullName,
          residentId: convertedResident.id,
          residentName: convertedResident.fullName,
          score: matchResult?.score ?? 0,
          factors: matchResult?.factors ?? [],
        };
      });
      finish(results, true);
    } else {
      finish([], false);
    }
    return () => { isActive = false; if (timer) clearTimeout(timer); };
  }, [previewMode, selectedVolunteer, selectedResident, previewDialogOpen, volunteers, residents, rules]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate("/login");
  };

  // Get important rules (high impact or key settings)
  const importantRules = rules.filter(rule =>
    rule.impact === "high" ||
    rule.id === "availability-match" ||
    rule.id === "language-match"
  );

  // Get remaining rules
  const remainingRules = rules.filter(rule =>
    !importantRules.some(importantRule => importantRule.id === rule.id)
  );

  const handleAddRule = () => {
    if (!newRule.id || !newRule.name) {
      toast({ title: t('toasts.idNameRequired'), variant: "destructive" });
      return;
    }
    addMatchingRule({ ...newRule, updatedAt: Timestamp.fromDate(new Date()) })
      .then(() => {
        toast({ title: t('toasts.addSuccess'), description: newRule.name });
        setNewRule(INITIAL_NEW_RULE);
        setAddingMode(false);
      })
      .catch(() => toast({ title: t('toasts.addError'), variant: "destructive" }));
  };

  const ruleTypeInput = (rule: MatchingRuleUI, onChange: (value: any) => void) => {
    if (rule.type === "toggle") {
      return (
        <div className="flex items-center h-8">
          <Select value={String(rule.value)} onValueChange={(value) => onChange(value === 'true')}>
            <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={t('previewDialog.selectValue')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{t('addRule.enabled')}</SelectItem>
              <SelectItem value="false">{t('addRule.disabled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }
    if (rule.type === "weight" && typeof rule.value === "number") {
      return (
        <div className={`flex items-center gap-8 w-full h-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {isRTL && <span className="w-8 text-right">{rule.value}</span>}
          <Slider
            value={[rule.value]}
            min={rule.min ?? 0}
            max={rule.max ?? 10}
            step={rule.step ?? 1}
            onValueChange={([v]) => onChange(v)}
            className="w-full flex-1"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          {!isRTL && <span className="w-8 text-right">{rule.value}</span>}
        </div>
      );
    }
    if (rule.type === "option" && rule.options) {
      return (
        <div className="flex items-center h-8">
          <Select value={String(rule.value)} onValueChange={onChange}>
            <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={t('previewDialog.selectValue')} />
            </SelectTrigger>
            <SelectContent>
              {rule.options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    return <span>-</span>;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
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
            <div className={cn(
              "flex items-center space-x-3",
              isRTL && "space-x-reverse"
            )}>
              <SlidersVertical className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block whitespace-nowrap">{t('pageTitle')}</h1>
            </div>
          </div>
          {/* Center section - Empty for balance */}
          <div className="flex-1"></div>
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
          {loading ? (
            <MatchingRulesSkeleton />
          ) : (
            <>
              {/* Introduction Card */}
              <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-slate-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-6 w-6 mr-2 text-blue-600" />
                    {t('header.title')}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {t('header.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start p-3 bg-white rounded-md shadow-sm border border-slate-300">
                      <div className="bg-blue-100 border border-blue-300 p-2 rounded-full mr-3">
                        <Sliders className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t('categories.skills.title')}</h3>
                        <p className="text-sm text-gray-500">{t('categories.skills.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start p-3 bg-white rounded-md shadow-sm border border-slate-300">
                      <div className="bg-blue-100 border border-blue-300 p-2 rounded-full mr-3">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t('categories.availability.title')}</h3>
                        <p className="text-sm text-gray-500">{t('categories.availability.description')}</p>
                      </div>
                    </div>
                    <div className="flex items-start p-3 bg-white rounded-md shadow-sm border border-slate-300">
                      <div className="bg-blue-100 border border-blue-300 p-2 rounded-full mr-3">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t('categories.priority.title')}</h3>
                        <p className="text-sm text-gray-500">{t('categories.priority.description')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Search and Actions */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-300">
                <div className="flex-1"></div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setTestDialogOpen(true)}
                    className="flex items-center border border-slate-300"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {t('actions.test')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewDialogOpen(true)}
                    className="flex items-center border border-slate-300"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('actions.preview')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsResetDialogOpen(true)}
                    className="flex items-center border border-slate-300"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    {t('actions.reset')}
                  </Button>
                  {hasChanges && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditedValues({});
                        setHasChanges(false);
                      }}
                      className="flex items-center border border-slate-300"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('actions.dismiss')}
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || savingChanges}
                    className="flex items-center bg-blue-600 hover:bg-blue-700"
                  >
                    {savingChanges ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin text-black" />
                        {t('actions.saving')}
                      </>
                    ) : (
                      t('actions.save')
                    )}
                  </Button>
                </div>
              </div>

              {/* Important Rules Section */}
              <div className="mb-8">
                <div className="flex items-center gap-x-2 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{t('rules.essentialTitle')}</h2>
                  <Badge variant="outline" className="border px-2 py-1 text-s transition-colors bg-blue-100 border-blue-500 text-blue-800 hover:bg-blue-200 hover:border-blue-600 align-middle relative top-[2px]">
                    {t('rules.ruleCount', { count: importantRules.length })}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {importantRules.map((rule) => (
                    <div key={rule.id} className="relative p-6 rounded-lg shadow-sm border border-slate-300 hover:shadow-md transition-shadow duration-200 bg-white flex flex-col h-full">
                      <div className="flex-grow mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{t(`ruleNames.${rule.id}`, rule.name)}</h3>
                        <p className="text-sm text-gray-600 mt-1">{t(`ruleDescriptions.${rule.id}`, rule.description)}</p>
                      </div>
                      <div className="mb-4">
                        {/* Rule Input */}
                        <div className="py-3">
                          {ruleTypeInput(
                            { ...rule, value: editedValues[rule.id] !== undefined ? editedValues[rule.id] : rule.value },
                            value => handleValueChange(rule, value)
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 border-t border-slate-200 pt-4 min-h-[3rem]">
                        <span>{t('rules.lastUpdated', { date: new Date().toLocaleDateString() })}</span>
                        {editedValues[rule.id] !== undefined && editedValues[rule.id] !== rule.value && (
                          <span className="px-2 py-1 rounded text-sm border bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200">{t('rules.modified')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Rules Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <h2 className="text-xl font-semibold text-gray-900">{t('rules.advancedTitle')}</h2>
                    <Badge variant="outline" className="ml-2 border px-2 py-1 text-s transition-colors bg-blue-100 border-blue-500 text-blue-800 hover:bg-blue-200 hover:border-blue-600 align-middle relative top-[2px]">
                      {t('rules.ruleCount', { count: remainingRules.length })}
                    </Badge>
                  </div>
                  {showAllRules && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center border border-slate-300"
                      onClick={() => setShowAllRules(false)}
                    >
                      <ChevronUp className="h-4 w-4 mr-1" />
                      {t('rules.showLess')}
                    </Button>
                  )}
                </div>

                {showAllRules && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingRules.map((rule) => (
                      <div key={rule.id} className="relative p-6 rounded-lg shadow-sm border border-slate-300 hover:shadow-md transition-shadow duration-200 bg-white flex flex-col h-full">
                        <div className="flex-grow mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{t(`ruleNames.${rule.id}`, rule.name)}</h3>
                          <p className="text-sm text-gray-600 mt-1">{t(`ruleDescriptions.${rule.id}`, rule.description)}</p>
                        </div>
                        <div className="mb-4">
                          {/* Rule Input */}
                          <div className="py-3">
                            {ruleTypeInput(
                              { ...rule, value: editedValues[rule.id] !== undefined ? editedValues[rule.id] : rule.value },
                              value => handleValueChange(rule, value)
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500 border-t border-slate-200 pt-4 min-h-[3rem]">
                          <span>{t('rules.lastUpdated', { date: new Date().toLocaleDateString() })}</span>
                          {editedValues[rule.id] !== undefined && editedValues[rule.id] !== rule.value && (
                            <span className="px-2 py-1 rounded text-sm border bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200">{t('rules.modified')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showAllRules && remainingRules.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-slate-300">
                    <div className="flex flex-col items-center">
                      <Settings className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{t('rules.advancedConfig.title')}</h3>
                      <p className="text-gray-500 mb-4 max-w-md">
                        {t('rules.advancedConfig.description')}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowAllRules(true)}
                        className="flex items-center border border-slate-300"
                      >
                        <ChevronDown className="h-4 w-4 mr-1" />
                        {t('rules.showAdvanced')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* No Results */}
              {rules.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('rules.noRules')}</h3>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Sidebar - Only visible on mobile when toggled */}
      {isSidebarOpen && isMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <ManagerSidebar
              isOpen={true}
              onClose={() => setIsSidebarOpen(false)}
              onLogout={handleLogout}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-4xl" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle className="flex items-center">
              <Play className="h-5 w-5 mr-3 text-blue-600" />
              {t('testDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('testDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <TestRulesTableDialogContent
            volunteers={volunteers}
            residents={residents}
            rules={rules}
            loadingVolunteers={loadingVolunteers}
            loadingResidents={loadingResidents}
            loadingRules={loading}
            language={language}
          />
          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center" />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-3 text-blue-600" />
              {t('previewDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('previewDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block font-medium">{t('previewDialog.mode')}</Label>
                <Select
                  value={previewMode}
                  onValueChange={(value: "volunteer" | "resident") => setPreviewMode(value)}
                >
                  <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={t('previewDialog.selectMode')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volunteer">{t('previewDialog.byVolunteer')}</SelectItem>
                    <SelectItem value="resident">{t('previewDialog.byResident')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block font-medium">
                  {previewMode === "volunteer" ? t('previewDialog.selectVolunteer') : t('previewDialog.selectResident')}
                </Label>
                <Select
                  value={previewMode === "volunteer" ? selectedVolunteer : selectedResident}
                  onValueChange={(value) =>
                    previewMode === "volunteer"
                      ? setSelectedVolunteer(value)
                      : setSelectedResident(value)
                  }
                >
                  <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={t('previewDialog.selectPlaceholder', { previewMode })} />
                  </SelectTrigger>
                  <SelectContent>
                    {previewMode === "volunteer"
                      ? volunteers.map((volunteer) => (
                        <SelectItem key={volunteer.id} value={volunteer.id}>
                          {volunteer.fullName}
                        </SelectItem>
                      ))
                      : residents.map((resident) => (
                        <SelectItem key={resident.id} value={resident.id}>
                          {resident.fullName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {previewLoading ? (
              <div className="mt-8 mb-8 p-8 flex flex-col items-center justify-center min-h-[120px]">
                <Loader2 className="h-8 w-8 animate-spin mb-2 text-black" />
                <span className="text-black font-medium">{t('previewDialog.loading')}</span>
              </div>
            ) :
              (!showPreview || testResults.length === 0) && (
                <div className="mt-8 mb-8 p-8 bg-slate-50 border border-slate-300 rounded-lg text-center text-slate-500 text-base min-h-[120px] flex items-center justify-center">
                  {previewMode === 'volunteer'
                    ? t('previewDialog.promptVolunteer')
                    : t('previewDialog.promptResident')}
                </div>
              )}
          </div>
          {showPreview && !previewLoading && (
            <div className="space-y-4">
              <h3 className="font-medium">{t('previewDialog.resultsTitle')}</h3>
              <div className="max-h-96 overflow-auto border border-slate-300 rounded-md">
                <table className="min-w-full border-collapse">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-gray-50">
                      <th className="border-b border-r border-slate-300 px-4 py-2 text-center">{previewMode === "volunteer" ? t('testDialog.resident') : t('testDialog.volunteer')}</th>
                      <th
                        className={`border-b border-r px-4 py-2 text-center cursor-pointer select-none hover:bg-blue-100 transition ${isRTL ? 'border-l' : ''} border-slate-300`}
                        onClick={() => setSortOrderPreview(order => order === 'asc' ? 'desc' : 'asc')}
                      >
                        {t('testDialog.score')}
                        <span className="mr-1 align-middle">{sortOrderPreview === 'asc' ? '▲' : '▼'}</span>
                      </th>
                      <th className="border-b border-slate-300 px-4 py-2 text-center">{t('testDialog.details')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...testResults].sort((a, b) =>
                      sortOrderPreview === 'asc' ? a.score - b.score : b.score - a.score
                    ).map((result, idx, sortedResults) => (
                      <React.Fragment key={idx}>
                        <tr className={`bg-white hover:bg-blue-50 transition ${idx !== sortedResults.length - 1 ? 'border-b border-slate-300' : ''}`}>
                          <td className="border-r border-slate-300 px-4 py-2 text-center align-middle">{previewMode === "volunteer" ? result.residentName : result.volunteerName}</td>
                          <td className={`border-r px-4 py-2 font-bold text-center align-middle ${isRTL ? 'border-l' : ''} border-slate-300`}>
                            <span className={`inline-block px-2 py-1 rounded text-white font-semibold text-center text-sm ${result.score < 60 ? 'bg-red-500' : result.score < 80 ? 'bg-amber-400 text-black' : 'bg-green-500'}`}>{result.score}</span>
                          </td>
                          <td className="px-4 py-2 text-center align-middle">
                            <button
                              className="text-blue-600 underline text-sm focus:outline-none"
                              onClick={() => setExpandedRowsPreview(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            >
                              {expandedRowsPreview[idx] ? t('testDialog.hideFactors') : t('testDialog.showFactors')}
                            </button>
                          </td>
                        </tr>
                        {expandedRowsPreview[idx] && (
                          <tr className={`bg-white ${idx !== sortedResults.length - 1 ? 'border-b border-slate-300' : ''}`}>
                            <td colSpan={3} className="px-4 py-2">
                              <div className="relative max-w-3xl mx-auto my-4">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/80 to-white/90 z-0" style={{ filter: 'blur(2px)' }} />
                                <div className="relative z-10 bg-white border-2 border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center transition-transform duration-200 scale-100 animate-fade-in">
                                  <div className="flex items-center mb-2 text-gray-700 font-semibold text-sm border-b border-slate-300 pb-1 w-full">
                                    <div className="w-1/5 text-center px-2 min-w-[80px] truncate">{t('testDialog.factor')}</div>
                                    <div className="w-1/5 text-center px-2 min-w-[60px] truncate">{t('testDialog.score')}</div>
                                    <div className="w-1/5 text-center px-2 min-w-[60px] truncate">{t('testDialog.weight')}</div>
                                    <div className="w-2/5 text-center px-2 min-w-[120px] truncate">{t('testDialog.reason')}</div>
                                  </div>
                                  {result.factors
                                    .slice()
                                    .sort((a, b) => b.weight - a.weight || b.score - a.score)
                                    .map((f, i) => (
                                      <div key={i} className="flex items-center py-2 border-b last:border-b-0 border-slate-300 w-full justify-center">
                                        <div className="w-1/5 font-medium text-gray-900 text-center">
                                          {t(`testDialog.factorNames.${f.name}` as any, { defaultValue: f.name })}
                                        </div>
                                        <div className="w-1/5 text-center">
                                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${f.score >= 80 ? 'bg-green-100 text-green-800' : f.score >= 60 ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-800'}`}>{Number(f.score).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="w-1/5 text-center">
                                          <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">{f.weight}</span>
                                        </div>
                                        <div className="w-2/5 text-center text-xs text-gray-700">
                                          {translateReason(f.reason || '', language)}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center" />
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogTitle>{t('resetDialog.title')}</DialogTitle>
            <DialogDescription>{t('resetDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-2">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
              <span className="text-red-600 font-semibold text-base mb-2">
                {t('resetDialog.confirmTitle')}
              </span>
              <span className="text-slate-600 text-sm">
                {t('resetDialog.confirmMessage')}
              </span>
            </div>
          </div>
          <DialogFooter>
            <div className="w-full flex justify-center">
              <Button
                variant="destructive"
                onClick={handleResetToDefaults}
                disabled={isResetLoading}
                className="w-[200px] transition-all duration-200 mx-auto"
              >
                {isResetLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    {t('resetDialog.resettingButton')}
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    {t('resetDialog.resetButton')}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rule Dialog */}
      {addingMode && (
        <Card className="mb-6 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t('addRule.title')}</CardTitle>
            <CardDescription>{t('addRule.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder={t('addRule.id')} value={newRule.id} onChange={e => setNewRule(r => ({ ...r, id: e.target.value }))} />
            <Input placeholder={t('addRule.name')} value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} />
            <Input placeholder={t('addRule.ruleDescription')} value={newRule.description} onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))} />
            <Select value={newRule.type} onValueChange={type => setNewRule(r => ({ ...r, type: type as any }))}>
              <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                <SelectValue placeholder={t('addRule.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">{t('addRule.types.weight')}</SelectItem>
                <SelectItem value="toggle">{t('addRule.types.toggle')}</SelectItem>
                <SelectItem value="option">{t('addRule.types.option')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newRule.impact} onValueChange={impact => setNewRule(r => ({ ...r, impact: impact as any }))}>
              <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir={isRTL ? 'rtl' : 'ltr'}>
                <SelectValue placeholder={t('addRule.impact')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">{t('addRule.impacts.high')}</SelectItem>
                <SelectItem value="medium">{t('addRule.impacts.medium')}</SelectItem>
                <SelectItem value="low">{t('addRule.impacts.low')}</SelectItem>
              </SelectContent>
            </Select>
            {/* Value input depends on type */}
            {newRule.type === "toggle" ? (
              <Switch checked={!!newRule.value} onCheckedChange={v => setNewRule(r => ({ ...r, value: v as boolean, defaultValue: v as boolean }))} />
            ) : newRule.type === "weight" ? (
              <div className={`flex items-center gap-4 w-full h-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {isRTL && <span className="w-8 text-right">{newRule.value}</span>}
                <Slider
                  value={[Number(newRule.value)]}
                  min={newRule.min ?? 0}
                  max={newRule.max ?? 10}
                  step={newRule.step ?? 1}
                  onValueChange={([v]) => setNewRule(r => ({ ...r, value: v as number, defaultValue: v as number }))}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                {!isRTL && <span className="w-8 text-right">{newRule.value}</span>}
              </div>
            ) : newRule.type === "option" ? (
              <Input placeholder="Option value" value={String(newRule.value)} onChange={e => setNewRule(r => ({ ...r, value: e.target.value, defaultValue: e.target.value }))} />
            ) : null}
          </CardContent>
          <CardFooter className="flex gap-2 justify-end">
            <Button onClick={handleAddRule} disabled={adding}>
              {adding ? <Loader2 className="h-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('addRule.addButton')}
            </Button>
            <Button variant="outline" onClick={() => setAddingMode(false)} className="ml-2">{t('addRule.cancelButton')}</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ManagerMatchingRules; 