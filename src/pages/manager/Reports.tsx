import CircularProgress from '@mui/material/CircularProgress';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, CalendarIcon, DownloadIcon, PrinterIcon, CheckCircleIcon, AlertCircleIcon, Loader2, BarChart3, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getReports, generateReport } from '@/services/reportService';
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { Report, ReportSubject, ReportScope, reportsRef, ReportType } from '@/services/firestore';
import { jsPDF } from 'jspdf';
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { query, getDocs } from "firebase/firestore";
import { volunteersRef, residentsRef, external_groupsRef } from '@/services/firestore';
import { toast } from "@/components/ui/use-toast";
import ReportsSkeleton from "@/components/skeletons/ReportsSkeleton";
import { pdf, Document, Page, Text, View, Font, Image } from '@react-pdf/renderer';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Constants
const MOBILE_BREAKPOINT = 1024;
const LOADING_DURATION = 1000; // ms

// Types
interface NewReportForm {
  subject: ReportSubject;
  scope: ReportScope;
  selectedSubjectId: string;
  startDate: string;
  endDate: string;
  format: string;
  sortBy: string;
  sortOrder: string;
}

interface Participant {
  id: string;
  name: string;
}

// Register Rubik font for react-pdf
Font.register({
  family: 'Rubik',
  src: '/fonts/Rubik-Regular.ttf.ttf',
});

// Utility Functions for PDF Generation
const formatHebrewDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const formatGenerationDate = (date: any): string => {
  if (!date) return '';
  const generationDate = date.toDate ? date.toDate() : new Date(date);
  return formatHebrewDate(generationDate);
};

const formatHours = (hours: number): string => {
  if (hours === null || hours === undefined) return '—';
  const rounded = Math.round(hours * 100) / 100;
  return rounded.toString();
};

const getReportTitle = (subject: string, isIndividual: boolean): string => {
  if (subject === 'volunteer') {
    return isIndividual ? 'דוח פעילות מתנדב' : 'דוח פעילות מתנדבים';
  } else if (subject === 'resident') {
    return isIndividual ? 'דוח פעילות דייר' : 'דוח פעילות דיירים';
  } else if (subject === 'external_group') {
    return isIndividual ? 'דוח פעילות קבוצה חיצונית' : 'דוח פעילות קבוצות חיצוניות';
  }
  return 'דוח פעילות';
};

const getStatusTranslation = (status: string): string => {
  const statusMap: Record<string, string> = {
    canceled: 'בוטל',
    missing: 'חסר',
    present: 'נוכח',
    absent: 'נעדר',
    late: 'איחר',
    active: 'פעיל',
    inactive: 'לא פעיל',
    default: '—',
  };
  return statusMap[status] || statusMap.default;
};

const getLabelTranslations = (): Record<string, string> => ({
  'Contact Person': 'איש קשר',
  'Contact Phone': 'טלפון איש קשר',
  'Purpose Of Visit': 'מטרת הביקור',
  'Number Of Participants': 'מספר משתתפים',
  'Assigned Department': 'מחלקה מוקצית',
  'Activity Content': 'תוכן הפעילות',
  'Phone': 'טלפון',
  'Email': 'אימייל',
  'Address': 'כתובת',
  'Organization': 'ארגון',
  'Group Type': 'סוג קבוצה',
  'Description': 'תיאור',
  'Notes': 'הערות'
});

// Hebrew PDF Document for react-pdf
const HebrewReportPDF = ({ report }: { report: Report }) => {
  const { type, filters, data, generatedAt, description } = report;
  const lastUnderscoreIndex = type.lastIndexOf('_');
  const subject = type.substring(0, lastUnderscoreIndex);
  const scope = type.substring(lastUnderscoreIndex + 1);
  const isIndividual = scope === 'individual';

  // Title and date range
  const title = getReportTitle(subject, isIndividual);
  const startDate = formatHebrewDate(filters?.startDate);
  const endDate = formatHebrewDate(filters?.endDate);
  const dateRange = `${startDate} - ${endDate}`;

  // Data
  const summary = data?.summary || {};
  const subjects = data?.subjects || [];

  // Labels and configurations
  const summaryLabels: Record<string, string> = {
    totalSubjects: 'מספר משתתפים',
    totalSessions: 'מספר מפגשים',
    totalHours: 'שעות פעילות',
    present: 'נוכח',
    absent: 'נעדר',
    late: 'איחר',
    missing: 'חסר',
  };

  const participantLabels: Record<string, string> = {
    totalAppointments: 'מספר מפגשים',
    totalHours: 'שעות פעילות',
    present: 'נוכח',
    absent: 'נעדר',
    late: 'איחר',
    missing: 'חסר',
  };

  const appointmentCols = subject === 'resident'
    ? [
      { key: 'date', label: 'תאריך' },
      { key: 'startTime', label: 'התחלה' },
      { key: 'endTime', label: 'סיום' },
      { key: 'hours', label: 'שעות' },
    ]
    : [
      { key: 'date', label: 'תאריך' },
      { key: 'startTime', label: 'התחלה' },
      { key: 'endTime', label: 'סיום' },
      { key: 'hours', label: 'שעות' },
      { key: 'status', label: 'סטטוס' },
    ];

  // Helper functions
  const getVisibleSummaryKeys = (summaryData: any, isResident = false): string[] => {
    return Object.keys(summaryLabels).filter(key => {
      if (summaryData[key] === undefined) return false;
      if (isResident && ['present', 'absent', 'late', 'missing'].includes(key)) return false;
      if (key === 'missing' && summaryData[key] === 0) return false;
      return true;
    });
  };

  const getVisibleParticipantKeys = (participantData: any, isResident = false): string[] => {
    if (!participantData || !participantData.summary) return [];
    return Object.keys(participantLabels).filter(key => {
      if (isResident && ['present', 'absent', 'late', 'missing'].includes(key)) return false;
      if (key === 'missing' && participantData?.summary?.[key] === 0) return false;
      return participantData.summary[key] !== undefined;
    });
  };

  const getParticipantSummaryValue = (participant: any, key: string): string => {
    if (!participant || !participant.summary) return '—';
    const value = participant.summary[key];
    if (value === undefined || value === null) return '—';
    return String(value);
  };

  const getSummaryValue = (summary: any, key: string): string => {
    if (!summary) return '—';
    const value = summary[key];
    if (value === undefined || value === null) return '—';
    return String(value);
  };

  const getAppointmentValue = (appointment: any, key: string): string => {
    if (!appointment) return '—';
    if (key === 'status') return getStatusTranslation(appointment.status);
    if (key === 'hours') return formatHours(appointment.hours);
    const value = appointment[key];
    if (value === undefined || value === null) return '—';
    return String(value);
  };

  return (
    <Document>
      {/* First page with title and summary */}
      <Page size="A4" style={{ fontFamily: 'Rubik', backgroundColor: '#fff', direction: 'rtl' }} wrap>
        {/* Fixed header that appears on all pages */}
        <View fixed style={{
          position: 'absolute',
          top: 20,
          left: 30,
          right: 30,
          textAlign: 'center',
          fontSize: 10,
          color: '#6b7280',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: 8,
          direction: 'rtl',
          backgroundColor: '#fff',
          minHeight: 30
        }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Image src="/logo.png" style={{ width: 100, height: 100 }} />
            {/* Title and date range stacked vertically */}
            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ fontSize: 28, marginTop: 5, marginBottom: 10, textAlign: 'center', color: '#1f2937', fontWeight: 'bold', direction: 'rtl' }}>
                <Text style={{ textAlign: 'center' }}>{title}</Text>
              </View>
              {/* Date range in header */}
              <Text style={{ fontSize: 14, textAlign: 'center', color: '#374151', direction: 'rtl' }}>
                {`טווח תאריכים: ${dateRange}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Fixed footer that appears on all pages */}
        <View fixed style={{
          position: 'absolute',
          bottom: 20,
          left: 30,
          right: 30,
          textAlign: 'center',
          fontSize: 10,
          color: '#6b7280',
          borderTop: '1px solid #e5e7eb',
          paddingTop: 8,
          direction: 'rtl',
          backgroundColor: '#fff',
          minHeight: 30
        }}>
          <Text render={({ pageNumber, totalPages }) => `נוצר ב-${formatGenerationDate(generatedAt)} | עמוד ${pageNumber} מתוך ${totalPages} | כל הזכויות שמורות`} />
        </View>

        {/* Main content container with adequate padding to avoid header and footer */}
        <View style={{
          padding: 30,
          paddingTop: 150,
          paddingBottom: 120,
          flexDirection: 'column',
          minHeight: '100%'
        }}>
          {/* Show participant data on first page if there's only one participant (individual report or group report with single participant) */}
          {subjects.length === 1 && (
            <View style={{ margin: 10, padding: 15, border: '1px solid #e5e7eb', borderRadius: 8, direction: 'rtl' }}>
              {/* Participant name */}
              <Text style={{ fontSize: 18, marginBottom: 8, color: '#374151', fontWeight: 'bold', textAlign: 'center', direction: 'rtl' }}>
                {subject === 'external_group' && subjects[0].name ? subjects[0].name.split('\n')[0] : subjects[0].name || '—'}
              </Text>

              {/* External Group Details */}
              {subject === 'external_group' && subjects[0].name && subjects[0].name.includes('\n') && (
                <View style={{ marginTop: 8, marginBottom: 8, direction: 'rtl' }}>
                  <View style={{ backgroundColor: '#f8f9fa', padding: 15, borderRadius: 6, border: '1px solid #e9ecef', direction: 'rtl' }}>
                    {(() => {
                      const details = subjects[0].name.split('\n').slice(1).filter(d => d.includes(': '));
                      return details.map((detail, detailIdx) => {
                        const [label, value] = detail.split(': ').map(s => s.trim());

                        // Translate common labels to Hebrew
                        const labelTranslations = getLabelTranslations();

                        const translatedLabel = labelTranslations[label] || label;
                        const isLastItem = detailIdx === details.length - 1;

                        return (
                          <View key={detailIdx} style={{ flexDirection: 'row-reverse', marginBottom: isLastItem ? 2 : 8, direction: 'rtl', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#495057', textAlign: 'center', direction: 'rtl', marginRight: 8 }}>
                              {translatedLabel}:{' '}
                            </Text>
                            <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center', direction: 'rtl' }}>
                              {value}
                            </Text>
                          </View>
                        );
                      });
                    })()}
                  </View>
                </View>
              )}

              {/* Participant summary table */}
              <View style={{ marginTop: 8, marginBottom: 8, direction: 'rtl' }}>
                <View style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #d1d5db', backgroundColor: '#f3f4f6', direction: 'rtl' }}>
                  {getVisibleParticipantKeys(subjects[0], subject === 'resident').map(key => (
                    <View key={key} style={{ width: `${100 / getVisibleParticipantKeys(subjects[0], subject === 'resident').length}%`, padding: 6, direction: 'rtl' }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#374151', direction: 'rtl' }}>{participantLabels[key]}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #e5e7eb', direction: 'rtl' }}>
                  {getVisibleParticipantKeys(subjects[0], subject === 'resident').map(key => (
                    <View key={key} style={{ width: `${100 / getVisibleParticipantKeys(subjects[0], subject === 'resident').length}%`, padding: 6, direction: 'rtl' }}>
                      <Text style={{ fontSize: 11, textAlign: 'center', color: '#4b5563', direction: 'rtl' }}>{getParticipantSummaryValue(subjects[0], key)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Appointments table */}
              {Array.isArray(subjects[0].appointments) && subjects[0].appointments.length > 0 && (
                <View style={{ marginTop: 12, direction: 'rtl' }}>
                  <Text style={{ fontSize: 15, marginBottom: 6, color: '#374151', fontWeight: 'bold', textAlign: 'center', direction: 'rtl' }}>מפגשים</Text>
                  <View style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #d1d5db', backgroundColor: '#f3f4f6', direction: 'rtl' }}>
                    {appointmentCols.map(col => (
                      <View key={col.key} style={{ width: `${100 / appointmentCols.length}%`, padding: 6, direction: 'rtl' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#374151', direction: 'rtl' }}>{col.label}</Text>
                      </View>
                    ))}
                  </View>
                  {subjects[0].appointments
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((apt, aptIdx) => (
                      <View key={aptIdx} style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #e5e7eb', direction: 'rtl' }}>
                        {appointmentCols.map(col => (
                          <View key={col.key} style={{ width: `${100 / appointmentCols.length}%`, padding: 6, direction: 'rtl' }}>
                            <Text style={{ fontSize: 11, textAlign: 'center', color: col.key === 'status' && (apt.status === 'canceled' || apt.status === 'missing') ? '#ef4444' : '#4b5563', direction: 'rtl' }}>
                              {getAppointmentValue(apt, col.key)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                </View>
              )}
            </View>
          )}

          {/* Group summary (only if more than one participant) */}
          {subjects.length > 1 && (
            <View style={{ margin: 10, padding: 15, border: '1px solid #e5e7eb', borderRadius: 8, direction: 'rtl' }}>
              <Text style={{ fontSize: 18, marginBottom: 12, color: '#374151', fontWeight: 'bold', textAlign: 'center', direction: 'rtl' }}>סיכום כולל</Text>
              <View style={{ marginTop: 8, direction: 'rtl' }}>
                {/* Summary table header */}
                <View style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #d1d5db', backgroundColor: '#f3f4f6', direction: 'rtl' }}>
                  {getVisibleSummaryKeys(summary, subject === 'resident').map(key => (
                    <View key={key} style={{ width: `${100 / getVisibleSummaryKeys(summary, subject === 'resident').length}%`, padding: 6, direction: 'rtl' }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#374151', direction: 'rtl' }}>{summaryLabels[key]}</Text>
                    </View>
                  ))}
                </View>
                {/* Summary table data row */}
                <View style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #e5e7eb', direction: 'rtl' }}>
                  {getVisibleSummaryKeys(summary, subject === 'resident').map(key => (
                    <View key={key} style={{ width: `${100 / getVisibleSummaryKeys(summary, subject === 'resident').length}%`, padding: 6, direction: 'rtl' }}>
                      <Text style={{ fontSize: 11, textAlign: 'center', color: '#4b5563', direction: 'rtl' }}>{getSummaryValue(summary, key)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </Page>

      {/* Separate page for each participant (only for group reports with multiple participants) */}
      {subjects.length > 1 && subjects.map((participant, idx) => (
        <Page key={idx} size="A4" style={{ fontFamily: 'Rubik', backgroundColor: '#fff', direction: 'rtl' }} wrap>
          {/* Fixed footer that appears on all pages */}
          <View fixed style={{
            position: 'absolute',
            bottom: 20,
            left: 30,
            right: 30,
            textAlign: 'center',
            fontSize: 10,
            color: '#6b7280',
            borderTop: '1px solid #e5e7eb',
            paddingTop: 8,
            direction: 'rtl',
            backgroundColor: '#fff',
            minHeight: 30
          }}>
            <Text render={({ pageNumber, totalPages }) => `נוצר ב-${formatGenerationDate(generatedAt)} | עמוד ${pageNumber} מתוך ${totalPages} | כל הזכויות שמורות`} />
          </View>

          {/* Main content container with adequate padding to avoid footer */}
          <View style={{
            padding: 30,
            paddingBottom: 120,
            flexDirection: 'column',
            minHeight: '100%'
          }}>
            {/* Participant content with border */}
            <View style={{
              margin: 10,
              padding: 15,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              direction: 'rtl'
            }}>
              {/* Participant name */}
              <Text style={{ fontSize: 18, marginBottom: 8, color: '#374151', fontWeight: 'bold', textAlign: 'center', direction: 'rtl' }}>
                {subject === 'external_group' && participant.name ? participant.name.split('\n')[0] : participant.name || '—'}
              </Text>

              {/* External Group Details */}
              {subject === 'external_group' && participant.name && participant.name.includes('\n') && (
                <View style={{ marginTop: 8, marginBottom: 8, direction: 'rtl' }}>
                  <View style={{ backgroundColor: '#f8f9fa', padding: 15, borderRadius: 6, border: '1px solid #e9ecef', direction: 'rtl' }}>
                    {(() => {
                      const details = participant.name.split('\n').slice(1);
                      return details.map((detail, detailIdx) => {
                        const [label, value] = detail.split(': ').map(s => s.trim());

                        // Translate common labels to Hebrew
                        const labelTranslations = getLabelTranslations();

                        const translatedLabel = labelTranslations[label] || label;
                        const isLastItem = detailIdx === details.length - 1;

                        return (
                          <View key={detailIdx} style={{ flexDirection: 'row-reverse', marginBottom: isLastItem ? 2 : 10, direction: 'rtl', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#495057', textAlign: 'center', direction: 'rtl', marginRight: 8 }}>
                              {translatedLabel}:{' '}
                            </Text>
                            <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center', direction: 'rtl' }}>
                              {value}
                            </Text>
                          </View>
                        );
                      });
                    })()}
                  </View>
                </View>
              )}

              {/* Participant summary table */}
              <View style={{ marginTop: 8, marginBottom: 8, direction: 'rtl' }}>
                <View style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #d1d5db', backgroundColor: '#f3f4f6', direction: 'rtl' }}>
                  {getVisibleParticipantKeys(participant, subject === 'resident').map(key => (
                    <View key={key} style={{ width: `${100 / getVisibleParticipantKeys(participant, subject === 'resident').length}%`, padding: 6, direction: 'rtl' }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#374151', direction: 'rtl' }}>{participantLabels[key]}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #e5e7eb', direction: 'rtl' }}>
                  {getVisibleParticipantKeys(participant, subject === 'resident').map(key => (
                    <View key={key} style={{ width: `${100 / getVisibleParticipantKeys(participant, subject === 'resident').length}%`, padding: 6, direction: 'rtl' }}>
                      <Text style={{ fontSize: 11, textAlign: 'center', color: '#4b5563', direction: 'rtl' }}>{getParticipantSummaryValue(participant, key)}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Appointments table */}
              {Array.isArray(participant.appointments) && participant.appointments.length > 0 && (
                <View style={{ marginTop: 12, direction: 'rtl' }}>
                  <Text style={{ fontSize: 15, marginBottom: 6, color: '#374151', fontWeight: 'bold', textAlign: 'center', direction: 'rtl' }}>מפגשים</Text>
                  <View style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #d1d5db', backgroundColor: '#f3f4f6', direction: 'rtl' }}>
                    {appointmentCols.map(col => (
                      <View key={col.key} style={{ width: `${100 / appointmentCols.length}%`, padding: 6, direction: 'rtl' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#374151', direction: 'rtl' }}>{col.label}</Text>
                      </View>
                    ))}
                  </View>
                  {participant.appointments
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((apt, aptIdx) => (
                      <View key={aptIdx} style={{ flexDirection: 'row-reverse', borderBottom: '1px solid #e5e7eb', direction: 'rtl' }}>
                        {appointmentCols.map(col => (
                          <View key={col.key} style={{ width: `${100 / appointmentCols.length}%`, padding: 6, direction: 'rtl' }}>
                            <Text style={{ fontSize: 11, textAlign: 'center', color: col.key === 'status' && (apt.status === 'canceled' || apt.status === 'missing') ? '#ef4444' : '#4b5563', direction: 'rtl' }}>
                              {getAppointmentValue(apt, col.key)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                </View>
              )}
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

function stripTime(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const ManagerReports = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['reports', 'common']);
  const { language, isRTL, dir } = useLanguage();

  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);

  // Dialog states
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form states
  const [newReport, setNewReport] = useState<NewReportForm>({
    subject: "volunteer",
    scope: "all",
    selectedSubjectId: "",
    startDate: "",
    endDate: "",
    format: "pdf",
    sortBy: "date",
    sortOrder: "asc"
  });
  const [generating, setGenerating] = useState(false);
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all"
  });

  // Utility Functions
  const formatDate = (date: Date): string => {
    if (isRTL) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return isRTL ? `${year}/${month}/${day}` : `${day}/${month}/${year}`;
  };

  const formatDateForFilename = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return isRTL ? `${year}-${month}-${day}` : `${day}-${month}-${year}`;
  };

  const getReportTypeName = (subject: string, scope: string): string => {
    if (subject === 'volunteer') {
      if (isRTL && scope === 'individual') {
        return 'דוח פעילות מתנדב';
      } else if (isRTL) {
        return 'דוח פעילות מתנדבים';
      } else {
        return 'Volunteer Report';
      }
    } else if (subject === 'resident') {
      if (isRTL && scope === 'individual') {
        return 'דוח פעילות דייר';
      } else if (isRTL) {
        return 'דוח פעילות דיירים';
      } else {
        return 'Resident Report';
      }
    } else if (subject === 'external_group') {
      if (isRTL && scope === 'individual') {
        return 'דוח פעילות קבוצה חיצונית';
      } else if (isRTL) {
        return 'דוח פעילות קבוצות חיצוניות';
      } else {
        return 'External Group Report';
      }
    }
    return '';
  };

  const generateTranslatedReportDescription = (report: Report): string => {
    const lastUnderscoreIndex = report.type.lastIndexOf('_');
    const subject = report.type.substring(0, lastUnderscoreIndex);
    const scope = report.type.substring(lastUnderscoreIndex + 1);

    const reportTypeName = getReportTypeName(subject, scope);
    const startDate = formatDateForDisplay(report.filters.startDate);
    const endDate = formatDateForDisplay(report.filters.endDate);

    return isRTL
      ? `${reportTypeName} (${startDate} עד ${endDate})`
      : `${reportTypeName} (${startDate} to ${endDate})`;
  };

  const resetNewReportForm = () => {
    setNewReport({
      subject: "volunteer",
      scope: "all",
      selectedSubjectId: "",
      startDate: "",
      endDate: "",
      format: "pdf",
      sortBy: "date",
      sortOrder: "asc"
    });
  };

  // Event Handlers
  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { startDate, endDate } = newReport;

      if (!startDate || !endDate) {
        throw new Error(isRTL ? 'אנא בחר תאריכי התחלה וסיום' : 'Please select both start and end dates');
      }

      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      if (!user?.id) {
        throw new Error(isRTL ? 'משתמש לא מאומת' : 'User not authenticated');
      }

      // Check if there are any external groups when generating a group external group report
      if (newReport.subject === 'external_group' && newReport.scope === 'all') {
        const externalGroupsSnapshot = await getDocs(external_groupsRef);
        if (externalGroupsSnapshot.empty) {
          setGenerating(false);
          toast({
            title: isRTL ? "לא נמצאו קבוצות חיצוניות" : "No External Groups Found",
            description: isRTL
              ? "אין קבוצות חיצוניות זמינות ליצירת דוח כל הקבוצות."
              : "There are no external groups available to generate an all groups report.",
            variant: "destructive"
          });
          return;
        }
      }

      const reportType = `${newReport.subject}_${newReport.scope}` as ReportType;
      const report = await generateReport(
        reportType,
        startDate,
        endDate,
        user.id,
        newReport.scope === 'individual' ? newReport.selectedSubjectId : undefined
      );

      if (!report.data.subjects || report.data.subjects.length === 0) {
        setGenerating(false);
        toast({
          title: isRTL ? "לא נמצאו נתונים" : "No Data Found",
          description: isRTL
            ? "לא נמצאו נתונים עבור הקריטריונים שנבחרו. נסה טווח תאריכים או משתתף אחר."
            : "No data found for the selected criteria. Please try a different date range or participant.",
          variant: "destructive"
        });
        return;
      }

      report.description = generateTranslatedReportDescription(report);
      setReports([report, ...reports]);
      setIsGenerateDialogOpen(false);
      setGenerating(false);
      resetNewReportForm();

      toast({
        title: t('common:status.success'),
        description: isRTL
          ? `${report.description} נוצר בהצלחה`
          : `${report.description} generated successfully`,
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      setGenerating(false);
      toast({
        title: t('common:status.error'),
        description: isRTL
          ? `שגיאה ביצירת הדוח: ${error.message}`
          : `Error generating report: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const generateReportPDF = (report: Report) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const footerHeight = 15;
    const maxContentY = pageHeight - footerHeight;
    let y = margin;
    const lineHeight = 7;
    const sectionSpacing = 8;
    const tableWidth = pageWidth - (2 * margin);
    const col1 = margin;
    const col2 = margin + (tableWidth * 0.6);
    let currentPageNumber = 1;

    // Helper function to center text
    const centerText = (text: string, x: number, y: number, width: number) => {
      const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
      const centerX = x + (width - textWidth) / 2;
      pdf.text(text, centerX, y);
    };

    // Helper function to check if we need a new page
    const needsNewPage = (requiredSpace: number = 20) => {
      return y + requiredSpace > maxContentY;
    };

    // Add page number and generation date to footer
    const addFooter = (pageNum: number) => {
      const footerY = pageHeight - 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${formatDate(report.generatedAt.toDate())}`, margin, footerY);
      pdf.text(`Page ${pageNum}`, pageWidth - margin - 20, footerY);
    };

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    const lastUnderscoreIndex = report.type.lastIndexOf('_');
    const subject = report.type.substring(0, lastUnderscoreIndex);
    let formattedSubject = subject
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (subject === 'external_group') {
      formattedSubject = 'External Group';
    }
    let titleText = `${formattedSubject} Activity Report`;
    const titleWidth = pdf.getStringUnitWidth(titleText) * 20 / pdf.internal.scaleFactor;
    const titleX = (pageWidth - titleWidth) / 2;
    pdf.text(titleText, titleX, y);
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(0.5);
    pdf.line(titleX - 5, y + 2, titleX + titleWidth + 5, y + 2);
    y += lineHeight + 3;

    // Date Range
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    const dateRangeText = `Date Range: ${report.filters.startDate} to ${report.filters.endDate}`;
    const dateRangeWidth = pdf.getStringUnitWidth(dateRangeText) * 12 / pdf.internal.scaleFactor;
    const dateRangeX = (pageWidth - dateRangeWidth) / 2;
    pdf.text(dateRangeText, dateRangeX, y);
    y += sectionSpacing;
    addFooter(1);

    // Summary section (only for group reports)
    if (report.data.subjects.length > 1) {
      if (needsNewPage(50)) {
        pdf.addPage();
        currentPageNumber++;
        y = margin;
        addFooter(currentPageNumber);
      }

      y += 5;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y, tableWidth, 12, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, y, tableWidth, 12);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      const summaryText = 'Overall Summary';
      const summaryWidth = pdf.getStringUnitWidth(summaryText) * 14 / pdf.internal.scaleFactor;
      const summaryX = (pageWidth - summaryWidth) / 2;
      pdf.text(summaryText, summaryX, y + 8);
      y += 22;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      centerText('Metric', col1, y, tableWidth * 0.6);
      centerText('Value', col2, y, tableWidth * 0.4);
      y += 4;
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      const metricOrder = [
        'totalSubjects',
        'totalHours',
        'totalSessions',
        ...(report.type.split('_')[0] !== 'resident' ? ['present', 'absent', 'late', 'missing'] : [])
      ];
      metricOrder.forEach(key => {
        if (key in report.data.summary && !(key === 'missing' && report.data.summary[key] === 0)) {
          let formattedLabel = key
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          if (key === 'totalSubjects') {
            const subjectType = report.type.split('_')[0];
            formattedLabel = `Total ${subjectType === 'volunteer' ? 'Volunteers' :
              subjectType === 'resident' ? 'Residents' :
                'External Groups'}`;
          } else if (key === 'totalSessions') {
            formattedLabel = 'Total Sessions';
          }
          centerText(formattedLabel, col1, y, tableWidth * 0.6);
          const value = key === 'totalSessions' && !report.data.summary[key]
            ? report.data.summary.totalAppointments
            : report.data.summary[key];
          centerText(String(value), col2, y, tableWidth * 0.4);
          y += lineHeight;
        }
      });
      y += sectionSpacing - 5;
    }

    // Participants Section
    report.data.subjects.forEach((participant, idx) => {
      if (needsNewPage(70)) {
        pdf.addPage();
        currentPageNumber++;
        y = margin;
        addFooter(currentPageNumber);
      }
      y += 5;
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      const participantType = subject
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const groupName = participant.name.split('\n')[0];
      const reportForText = `${participantType}: ${groupName}`;
      const reportForWidth = pdf.getStringUnitWidth(reportForText) * 16 / pdf.internal.scaleFactor;
      const reportForX = (pageWidth - reportForWidth) / 2;
      pdf.setTextColor(60, 60, 60);
      pdf.text(reportForText, reportForX, y);
      y += 4;
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      // External group details
      if (subject === 'external_group') {
        const details = participant.name.split('\n').slice(1);
        const validDetails = details.filter(detail =>
          detail !== '-----------------------' &&
          detail.split(': ').length === 2
        );
        const boxHeight = (validDetails.length * 12) + 5;

        if (needsNewPage(boxHeight + 15)) {
          pdf.addPage();
          currentPageNumber++;
          y = margin;
          addFooter(currentPageNumber);
        }

        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, y, pageWidth - (2 * margin), boxHeight, 'F');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(80, 80, 80);
        let detailIndex = 0;
        details.forEach((detail) => {
          if (detail !== '-----------------------') {
            const [label, value] = detail.split(': ').map(s => s.trim());
            if (label && value) {
              const yPos = y + 10 + (detailIndex * 12);
              pdf.setFont('helvetica', 'bold');
              pdf.text(`${label}:`, margin + 5, yPos);
              pdf.setFont('helvetica', 'normal');
              pdf.text(value, margin + 80, yPos);
              detailIndex++;
            }
          }
        });
        y += boxHeight + 12;
      }

      // Summary section
      if (needsNewPage(40)) {
        pdf.addPage();
        currentPageNumber++;
        y = margin;
        addFooter(currentPageNumber);
      }

      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y, tableWidth, 12, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      const summaryText = 'Summary';
      const summaryWidth = pdf.getStringUnitWidth(summaryText) * 14 / pdf.internal.scaleFactor;
      const summaryX = (pageWidth - summaryWidth) / 2;
      pdf.text(summaryText, summaryX, y + 8);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, y, tableWidth, 12);
      y += 22;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      centerText('Metric', col1, y, tableWidth * 0.6);
      centerText('Value', col2, y, tableWidth * 0.4);
      y += 4;
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      const participantMetricOrder = [
        'totalHours',
        'totalAppointments',
        ...(report.type.split('_')[0] !== 'resident' ? ['present', 'absent', 'late', 'missing'] : [])
      ];
      participantMetricOrder.forEach(key => {
        if (key in participant.summary && !(key === 'missing' && participant.summary[key] === 0)) {
          let formattedLabel = key
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          centerText(formattedLabel, col1, y, tableWidth * 0.6);
          centerText(String(participant.summary[key]), col2, y, tableWidth * 0.4);
          y += lineHeight;
        }
      });
      y += sectionSpacing - 5;

      // Appointments section
      if (needsNewPage(50)) {
        pdf.addPage();
        currentPageNumber++;
        y = margin;
        addFooter(currentPageNumber);
      }

      y += 3;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y, tableWidth, 12, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, y, tableWidth, 12);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      const appointmentsText = 'Appointments';
      const appointmentsWidth = pdf.getStringUnitWidth(appointmentsText) * 14 / pdf.internal.scaleFactor;
      const appointmentsX = (pageWidth - appointmentsWidth) / 2;
      pdf.text(appointmentsText, appointmentsX, y + 8);
      y += 22;
      const aptTableWidth = tableWidth;
      const isResidentReport = report.type.split('_')[0] === 'resident';
      const aptCols = isResidentReport ? [
        margin,
        margin + (aptTableWidth * 0.25),
        margin + (aptTableWidth * 0.5),
        margin + (aptTableWidth * 0.75)
      ] : [
        margin,
        margin + (aptTableWidth * 0.25),
        margin + (aptTableWidth * 0.45),
        margin + (aptTableWidth * 0.65),
        margin + (aptTableWidth * 0.85)
      ];
      const aptColWidths = isResidentReport ? [
        aptTableWidth * 0.25,
        aptTableWidth * 0.25,
        aptTableWidth * 0.25,
        aptTableWidth * 0.25
      ] : [
        aptTableWidth * 0.25,
        aptTableWidth * 0.20,
        aptTableWidth * 0.20,
        aptTableWidth * 0.20,
        aptTableWidth * 0.15
      ];
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      centerText('Date', aptCols[0], y, aptColWidths[0]);
      centerText('Start', aptCols[1], y, aptColWidths[1]);
      centerText('End', aptCols[2], y, aptColWidths[2]);
      centerText('Hours', aptCols[3], y, aptColWidths[3]);
      if (!isResidentReport) {
        centerText('Status', aptCols[4], y, aptColWidths[4]);
      }
      y += 4;
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      participant.appointments
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(apt => {
          if (needsNewPage(20)) {
            pdf.addPage();
            currentPageNumber++;
            y = margin;
            addFooter(currentPageNumber);
          }
          pdf.setTextColor(0, 0, 0);
          centerText(String(apt.date), aptCols[0], y, aptColWidths[0]);
          centerText(String(apt.startTime), aptCols[1], y, aptColWidths[1]);
          centerText(String(apt.endTime), aptCols[2], y, aptColWidths[2]);
          centerText(String(apt.hours), aptCols[3], y, aptColWidths[3]);
          if (!isResidentReport) {
            const statusDisplay = apt.status === 'canceled' ? 'Canceled' :
              apt.status === 'missing' ? 'Missing' :
                apt.status.charAt(0).toUpperCase() + apt.status.slice(1).toLowerCase();

            if (apt.status === 'canceled' || apt.status === 'missing') {
              pdf.setTextColor(220, 53, 69);
            } else {
              pdf.setTextColor(0, 0, 0);
            }

            centerText(statusDisplay, aptCols[4], y, aptColWidths[4]);
            pdf.setTextColor(0, 0, 0);
          }
          y += lineHeight;
        });
      y += sectionSpacing;
    });

    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      const footerY = pdf.internal.pageSize.getHeight() - 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${formatDate(report.generatedAt.toDate())}`, margin, footerY);
      pdf.text(`Page ${i}`, pageWidth - margin - 20, footerY);
    }
    return pdf;
  };

  const handleDownloadReport = async (report: Report) => {
    setIsLoading(true);
    try {
      // Update report in Firestore
      const reportRef = doc(reportsRef, report.id);
      const reportDoc = await getDoc(reportRef);
      if (!reportDoc.exists()) {
        await setDoc(reportRef, { ...report, exported: true });
      } else {
        await updateDoc(reportRef, { exported: true });
      }
      setReports(reports.map(r =>
        r.id === report.id ? { ...r, exported: true } : r
      ));

      // Generate translated filename
      const lastUnderscoreIndex = report.type.lastIndexOf('_');
      const subject = report.type.substring(0, lastUnderscoreIndex);
      const scope = report.type.substring(lastUnderscoreIndex + 1);

      let reportTypeName = '';
      if (subject === 'volunteer') {
        reportTypeName = isRTL ? 'דוח מתנדבים' : 'Volunteer Report';
      } else if (subject === 'resident') {
        reportTypeName = isRTL ? 'דוח דיירים' : 'Resident Report';
      } else if (subject === 'external_group') {
        reportTypeName = isRTL ? 'דוח קבוצות חיצוניות' : 'External Group Report';
      }

      const scopeName = scope === 'individual'
        ? (isRTL ? 'אינדיבידואלי' : 'Individual')
        : (isRTL ? 'כללי' : 'All');

      const dateRange = `${formatDateForFilename(new Date(report.filters.startDate))}_${formatDateForFilename(new Date(report.filters.endDate))}`;
      const filename = `${reportTypeName}_${scopeName}_${dateRange}`;

      if (isRTL) {
        // Use react-pdf for Hebrew
        const blob = await pdf(<HebrewReportPDF report={report} />).toBlob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
        setIsLoading(false);
        toast({
          title: t('common:status.success'),
          description: `${report.description} הורד בהצלחה`,
        });
        return;
      }
      // English: use jsPDF
      const pdfDoc = generateReportPDF(report);
      pdfDoc.save(`${filename}.pdf`);
      setIsLoading(false);
      toast({
        title: t('common:status.success'),
        description: `${report.description} downloaded successfully`,
      });
    } catch (error: any) {
      console.error('Error downloading report:', error);
      setIsLoading(false);
      toast({
        title: t('common:status.error'),
        description: isRTL
          ? `שגיאה בהורדת הדוח: ${error.message}`
          : `Error downloading report: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handlePrintReport = async (report: Report) => {
    setIsLoading(true);
    try {
      // Update report in Firestore
      const reportRef = doc(reportsRef, report.id);
      await updateDoc(reportRef, { exported: true });
      setReports(reports.map(r =>
        r.id === report.id ? { ...r, exported: true } : r
      ));

      if (isRTL) {
        try {
          // Use react-pdf for Hebrew
          const blob = await pdf(<HebrewReportPDF report={report} />).toBlob();
          const url = window.URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            newWindow.onload = () => {
              newWindow.print();
            };
          }
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
          setIsLoading(false);
          toast({
            title: t('common:status.success'),
            description: `${report.description} נשלח להדפסה`,
          });
          return;
        } catch (pdfError) {
          console.error('Error with react-pdf, falling back to download:', pdfError);
          // Fallback: download the PDF instead of printing
          const blob = await pdf(<HebrewReportPDF report={report} />).toBlob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${report.description}.pdf`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
          setIsLoading(false);
          toast({
            title: isRTL ? "הורדת PDF" : "PDF Downloaded",
            description: isRTL
              ? `הדוח הורד בהצלחה. אנא הדפיסו אותו מהקובץ שהורד.`
              : `Report downloaded successfully. Please print it from the downloaded file.`,
          });
          return;
        }
      }

      // English: use jsPDF
      const pdfDoc = generateReportPDF(report);
      pdfDoc.autoPrint();
      pdfDoc.output('dataurlnewwindow');
      setIsLoading(false);
      toast({
        title: t('common:status.success'),
        description: isRTL
          ? `${report.description} נשלח למדפסת`
          : `${report.description} sent to printer`,
      });
    } catch (error: any) {
      console.error('Error printing report:', error);
      setIsLoading(false);
      toast({
        title: t('common:status.error'),
        description: isRTL
          ? `שגיאה בהדפסת הדוח: ${error.message}`
          : `Error printing report: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (exported: boolean) => {
    return exported
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-amber-100 text-amber-700 border-amber-200";
  };

  const getStatusIcon = (exported: boolean) => {
    return exported
      ? <CheckCircleIcon className="h-4 w-4 text-green-500" />
      : <FileText className="h-4 w-4 text-blue-500" />;
  };

  const getTypeIconWithBg = (type: ReportType) => {
    const [subject] = type.split('_');
    const iconColor = {
      volunteer: 'text-blue-600',
      resident: 'text-green-600',
      external_group: 'text-purple-600'
    }[subject] || 'text-slate-600';

    return (
      <div className={`h-10 w-10 rounded-full bg-slate-100 border border-slate-400 flex items-center justify-center ${iconColor}`}>
        <FileText className="h-5 w-5" />
      </div>
    );
  };

  const getReportSummaryStats = () => {
    const totalReports = reports.length;
    const exportedReports = reports.filter(r => r.exported).length;
    const pendingReports = reports.filter(r => !r.exported).length;

    const completionRate = totalReports > 0 ? Math.round((exportedReports / totalReports) * 100) : 0;

    return {
      total: totalReports,
      exported: exportedReports,
      pending: pendingReports,
      completionRate
    };
  };

  const stats = getReportSummaryStats();

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  // Computed Values
  const filteredReports = reports.filter(report => {
    // Filter by tab
    if (activeTab !== "all") {
      const lastUnderscoreIndex = report.type.lastIndexOf('_');
      const subject = report.type.substring(0, lastUnderscoreIndex);
      if (subject !== activeTab) {
        return false;
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = report.description.toLowerCase().includes(query);
      const matchesType = report.type.toLowerCase().includes(query);
      const matchesParticipantNames = report.data?.subjects?.some(subject => {
        if (!subject.name) return false;
        const nameLines = subject.name.split('\n');
        const mainName = nameLines[0] || '';
        const details = nameLines.slice(1).join(' ');
        return mainName.toLowerCase().includes(query) || details.toLowerCase().includes(query);
      }) || false;
      return matchesDescription || matchesType || matchesParticipantNames;
    }

    // Filter by status
    if (filters.status !== "all" && report.exported !== (filters.status === "exported")) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const reportDate = new Date(report.generatedAt.toDate());
      const today = new Date();
      let startDate = new Date();

      switch (filters.dateRange) {
        case "last-7-days":
          startDate.setDate(today.getDate() - 7);
          break;
        case "last-30-days":
          startDate.setDate(today.getDate() - 30);
          break;
        case "last-90-days":
          startDate.setDate(today.getDate() - 90);
          break;
      }

      if (reportDate < startDate) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    return b.generatedAt.toDate().getTime() - a.generatedAt.toDate().getTime();
  });

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_DURATION);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      setIsDataLoading(true);
      try {
        const loadedReports = await getReports();
        const translatedReports = loadedReports.map(report => {
          report.description = generateTranslatedReportDescription(report);
          return report;
        });
        setReports(translatedReports);
      } catch (error) {
        console.error('Error loading reports:', error);
        toast({
          title: t('common:status.error'),
          description: t('messages.errorLoading'),
          variant: "destructive"
        });
      } finally {
        setIsDataLoading(false);
      }
    };

    loadReports();
  }, [isRTL]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (!user.id || user.role !== "manager") {
      navigate("/login");
    }
}, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= MOBILE_BREAKPOINT);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "OPEN_GENERATE_REPORT_DIALOG") {
        setIsGenerateDialogOpen(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (newReport.scope === 'individual') {
        setLoadingParticipants(true);
        let participantsQuery;
        switch (newReport.subject) {
          case 'volunteer':
            participantsQuery = query(volunteersRef);
            break;
          case 'resident':
            participantsQuery = query(residentsRef);
            break;
          case 'external_group':
            participantsQuery = query(external_groupsRef);
            break;
        }

        if (participantsQuery) {
          const snapshot = await getDocs(participantsQuery);
          const participants = snapshot.docs.map(doc => ({
            id: doc.id,
            name: newReport.subject === 'external_group'
              ? (doc.data() as any).groupName
              : (doc.data() as any).fullName
          }));
          setAvailableParticipants(participants);
        }
        setLoadingParticipants(false);
      } else {
        setAvailableParticipants([]);
        setLoadingParticipants(false);
      }
    };

    fetchParticipants();
  }, [newReport.subject, newReport.scope]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen" dir={dir}>
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
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block whitespace-nowrap">
                {t('title')}
              </h1>
            </div>
          </div>
          {/* Center section - Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className={cn(
                "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500",
                isRTL ? "right-3" : "left-3"
              )} />
              <Input
                placeholder={t('search.placeholder')}
                className={cn(
                  "bg-slate-50 border-slate-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                  isRTL ? "pr-9 text-right" : "pl-9"
                )}
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
          {(isLoading || isDataLoading) ? (
            <ReportsSkeleton />
          ) : (
            <>
              {/* Mobile Search */}
              {isMobile && (
                <div className="mb-6 space-y-4">
                  <div className="relative">
                    <Search className={cn(
                      "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500",
                      isRTL ? "right-3" : "left-3"
                    )} />
                    <Input
                      placeholder={t('search.placeholder')}
                      className={cn(
                        "bg-white",
                        isRTL ? "pr-9 text-right" : "pl-9"
                      )}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div className={cn(isRTL && "text-right")}>
                      <p className="text-sm text-slate-500">{t('stats.totalReports')}</p>
                      <h3 className="text-2xl font-bold">{stats.total}</h3>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-full border border-slate-400 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div className={cn(isRTL && "text-right")}>
                      <p className="text-sm text-slate-500">{t('stats.readyToExport')}</p>
                      <h3 className="text-2xl font-bold text-blue-600">{stats.pending}</h3>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-300 hover:border-primary/30 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div className={cn(isRTL && "text-right")}>
                      <p className="text-sm text-slate-500">{t('stats.exported')}</p>
                      <h3 className="text-2xl font-bold text-green-600">{stats.exported}</h3>
                    </div>
                    <div className="h-12 w-12 bg-green-50 rounded-full border border-green-300 flex items-center justify-center">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-4 mb-6">
                <Tabs
                  defaultValue="all"
                  onValueChange={setActiveTab}
                >
                  <TabsList className={cn(
                    "bg-slate-100 p-2 space-x-2",
                    isRTL && "space-x-reverse flex-row-reverse"
                  )}>
                    <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6">
                      {t('tabs.allReports')}
                    </TabsTrigger>
                    <TabsTrigger value="volunteer" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6">
                      {t('tabs.volunteerReports')}
                    </TabsTrigger>
                    <TabsTrigger value="resident" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6">
                      {t('tabs.residentReports')}
                    </TabsTrigger>
                    <TabsTrigger value="external_group" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-6">
                      {t('tabs.externalGroupReports')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left Section - Filters */}
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                      dir={dir}
                    >
                      <SelectTrigger className={cn(
                        "w-[140px] h-9 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0",
                        isRTL && "text-right"
                      )}>
                        <SelectValue placeholder={t('filters.status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('filters.allStatus')}</SelectItem>
                        <SelectItem value="exported">{t('filters.exported')}</SelectItem>
                        <SelectItem value="pending">{t('filters.readyToExport')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                      dir={dir}
                    >
                      <SelectTrigger className={cn(
                        "w-[180px] h-9 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0",
                        isRTL && "text-right"
                      )}>
                        <SelectValue placeholder={t('filters.dateRange')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('filters.allTime')}</SelectItem>
                        <SelectItem value="last-7-days">{t('filters.last7Days')}</SelectItem>
                        <SelectItem value="last-30-days">{t('filters.last30Days')}</SelectItem>
                        <SelectItem value="last-90-days">{t('filters.last90Days')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center gap-3 min-w-0 h-9">
                    {filteredReports.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsGenerateDialogOpen(true)}
                        className={cn(
                          "h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-1",
                          isRTL && "space-x-reverse"
                        )}
                      >
                        <FileText className="h-4 w-4" />
                        <span>{t('actions.generateReport')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Report List */}
              <div className="space-y-4">
                {filteredReports.length === 0 ? (
                  <div className={cn(
                    "bg-white rounded-lg shadow-sm border border-slate-300 p-8",
                    isRTL ? "text-center" : "text-center"
                  )}>
                    <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className={cn(
                      "text-lg font-medium text-slate-900 mb-1",
                      isRTL && "text-center"
                    )}>{t('empty.title')}</h3>
                    <p className={cn(
                      "text-slate-500 mb-4",
                      isRTL && "text-center"
                    )}>
                      {searchQuery
                        ? t('empty.description')
                        : t('empty.noReportsDescription')}
                    </p>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setIsGenerateDialogOpen(true)}
                        className={cn(
                          "h-9 border-slate-300 hover:bg-slate-50 flex items-center space-x-1",
                          isRTL && "space-x-reverse"
                        )}
                      >
                        <FileText className="h-4 w-4" />
                        <span>{t('actions.generateReport')}</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white rounded-lg shadow-sm border border-slate-300 hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden group cursor-pointer"
                      onClick={() => {
                        setSelectedReport(report);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getTypeIconWithBg(report.type)}
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors duration-300">{report.description}</h3>
                                <Badge variant="outline" className={cn(
                                  "text-sm",
                                  report.exported && "bg-emerald-50 border-emerald-500 text-green-700 hover:bg-green-100 hover:border-emerald-600 hover:text-green-700",
                                  !report.exported && "bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100 hover:border-blue-600 hover:text-blue-700"
                                )}>
                                  <span className={cn(
                                    "flex items-center space-x-1",
                                    isRTL && "space-x-reverse"
                                  )}>
                                    {getStatusIcon(report.exported)}
                                    <span className="capitalize">
                                      {report.exported ? t('status.exported') : t('status.readyToExport')}
                                    </span>
                                  </span>
                                </Badge>
                                {/* Individual participant name badge */}
                                {report.type.endsWith('_individual') && report.data?.subjects?.[0]?.name && (
                                  <Badge variant="outline" className="text-sm bg-purple-50 border-purple-500 text-purple-700 hover:bg-purple-100 hover:border-purple-600 hover:text-purple-700">
                                    <span className="truncate max-w-[120px]">
                                      {report.data.subjects[0].name.split('\n')[0]}
                                    </span>
                                  </Badge>
                                )}
                              </div>
                              <p className={cn(
                                "text-sm text-slate-500 mt-1",
                                isRTL && "text-right"
                              )}>
                                {t('viewDialog.generatedOn', {
                                  date: formatDate(report.generatedAt.toDate())
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2 p-2">
                            <Button
                              variant="outline"
                              size="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadReport(report);
                              }}
                              className="h-10 w-10 p-0 hover:bg-slate-100 border border-slate-300"
                            >
                              <DownloadIcon className="h-5 w-5 text-slate-500" />
                            </Button>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintReport(report);
                              }}
                              className="h-10 w-10 p-0 hover:bg-slate-100 border border-slate-300"
                            >
                              <PrinterIcon className="h-5 w-5 text-slate-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={(open) => {
        setIsGenerateDialogOpen(open);
        if (!open) {
          setNewReport({
            subject: "volunteer",
            scope: "all",
            selectedSubjectId: "",
            startDate: "",
            endDate: "",
            format: "pdf",
            sortBy: "date",
            sortOrder: "asc"
          });
          setGenerating(false);
        }
      }}>
        <DialogContent className={cn(
          "sm:max-w-[500px] max-h-[80vh] flex flex-col",
          isRTL && "[&>button]:left-4 [&>button]:right-auto"
        )} dir={dir}>
          <DialogHeader className={cn(
            "border-b border-slate-300 pb-3",
            isRTL && "text-right"
          )}>
            <DialogTitle className={cn(
              "text-slate-900",
              isRTL && "text-right"
            )}>{t('generateDialog.title')}</DialogTitle>
            <DialogDescription className={cn(
              "text-slate-500",
              isRTL && "text-right"
            )}>
              {t('generateDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
            {/* Participant Selection */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className={cn(
                "flex items-center space-x-2",
                isRTL && "space-x-reverse"
              )}>
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('generateDialog.participantSelection')}</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={cn(isRTL && "text-right")}>{t('generateDialog.participantType')}</Label>
                  <Select
                    value={newReport.subject}
                    onValueChange={(value) => {
                      setNewReport({
                        ...newReport,
                        subject: value as ReportSubject,
                        selectedSubjectId: "" // Reset selected participant when type changes
                      });
                    }}
                    dir={dir}
                  >
                    <SelectTrigger className={cn(
                      "w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                      isRTL && "text-right"
                    )}>
                      <SelectValue placeholder={t('generateDialog.selectParticipantType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volunteer">{t('generateDialog.participants.volunteer')}</SelectItem>
                      <SelectItem value="resident">{t('generateDialog.participants.resident')}</SelectItem>
                      <SelectItem value="external_group">{t('generateDialog.participants.externalGroup')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={cn(isRTL && "text-right")}>{t('generateDialog.reportScope')}</Label>
                  <Select
                    value={newReport.scope}
                    onValueChange={(value) => {
                      setNewReport({
                        ...newReport,
                        scope: value as ReportScope,
                        selectedSubjectId: "" // Reset selected participant when scope changes
                      });
                    }}
                    dir={dir}
                  >
                    <SelectTrigger className={cn(
                      "w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                      isRTL && "text-right"
                    )}>
                      <SelectValue placeholder={t('generateDialog.selectScope')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('generateDialog.scope.all')}</SelectItem>
                      <SelectItem value="individual">{t('generateDialog.scope.individual')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newReport.scope === 'individual' && (
                  <div className="space-y-2">
                    {loadingParticipants ? (
                      <p className={cn(
                        "text-sm text-slate-500",
                        isRTL && "text-right"
                      )}>{t('actions.loading')}</p>
                    ) : availableParticipants.length > 0 ? (
                      <>
                        <Label className={cn(isRTL && "text-right")}>
                          {t('generateDialog.selectParticipant', {
                            type: newReport.subject === 'external_group'
                              ? t('generateDialog.participants.externalGroup')
                              : newReport.subject === 'volunteer'
                                ? t('generateDialog.participants.volunteer')
                                : t('generateDialog.participants.resident')
                          })}
                        </Label>
                        <Select
                          value={newReport.selectedSubjectId}
                          onValueChange={(value) => setNewReport({ ...newReport, selectedSubjectId: value })}
                          dir={dir}
                        >
                          <SelectTrigger className={cn(
                            "w-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                            isRTL && "text-right"
                          )}>
                            <SelectValue placeholder={t('generateDialog.selectParticipant', {
                              type: newReport.subject === 'external_group'
                                ? t('generateDialog.participants.externalGroup')
                                : newReport.subject === 'volunteer'
                                  ? t('generateDialog.participants.volunteer')
                                  : t('generateDialog.participants.resident')
                            })} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableParticipants.map((participant) => (
                              <SelectItem key={participant.id} value={participant.id}>
                                {participant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <p className={cn(
                        "text-sm text-red-500",
                        isRTL && "text-right"
                      )}>
                        {t('generateDialog.noParticipantsAvailable', {
                          type: newReport.subject === 'external_group'
                            ? t('generateDialog.participants.externalGroup').toLowerCase()
                            : newReport.subject === 'volunteer'
                              ? t('generateDialog.participants.volunteer').toLowerCase()
                              : t('generateDialog.participants.resident').toLowerCase()
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Time Range Section */}
            <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
              <div className={cn(
                "flex items-center space-x-2",
                isRTL && "space-x-reverse"
              )}>
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-900">{t('generateDialog.timeRange')}</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn(isRTL && "text-right")}>{t('generateDialog.startDate')}</Label>
                    <Input
                      type="date"
                      value={newReport.startDate}
                      onChange={(e) => setNewReport({ ...newReport, startDate: e.target.value })}
                      className={cn(
                        "w-full border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(isRTL && "text-right")}>{t('generateDialog.endDate')}</Label>
                    <Input
                      type="date"
                      value={newReport.endDate}
                      onChange={(e) => setNewReport({ ...newReport, endDate: e.target.value })}
                      className={cn(
                        "w-full border-slate-300 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-300 pt-5">
            <div className="flex justify-center w-full">
              <Button
                onClick={handleGenerateReport}
                disabled={
                  !newReport.subject ||
                  !newReport.scope ||
                  !newReport.startDate ||
                  !newReport.endDate ||
                  (newReport.scope === 'individual' && !newReport.selectedSubjectId)
                }
                className={cn(
                  "w-[200px] transition-all duration-200 flex items-center space-x-1",
                  isRTL && "space-x-reverse"
                )}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('actions.generating')}</span>
                  </>
                ) : (
                  <span>{t('generateDialog.generateButton')}</span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className={cn(
          "sm:max-w-[700px] max-h-[80vh] overflow-y-auto",
          isRTL && "[&>button]:left-4 [&>button]:right-auto"
        )} dir={dir}>
          <DialogHeader className={cn(
            "border-b border-slate-300 pb-3",
            isRTL && "text-right"
          )}>
            <DialogTitle className={cn(isRTL && "text-right")}>{selectedReport?.description}</DialogTitle>
            <DialogDescription className={cn(isRTL && "text-right")}>
              {selectedReport && t('viewDialog.generatedOn', {
                date: formatDate(selectedReport.generatedAt.toDate())
              })}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 pt-4 pb-4">
              <div className="space-y-4">
                <h4 className={cn(
                  "font-medium text-slate-900",
                  isRTL && "text-right"
                )}>{t('viewDialog.reportData')}</h4>
                <div className="bg-slate-50 p-2 rounded-lg overflow-auto max-h-[250px] max-w-full">
                  <pre className="text-sm text-slate-600 whitespace-pre-wrap break-words max-w-full overflow-x-auto" style={{ direction: 'ltr', textAlign: 'left' }}>
                    {JSON.stringify(selectedReport.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-slate-300 pt-3">
            <div className="w-full h-2"></div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerReports;