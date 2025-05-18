import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.vfs;
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Calendar as CalendarIcon,
  Users,
  Clock,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  FileText,
  Trash,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  BarChart3,
  RefreshCw,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  XCircle as XCircleIcon,
  Info as InfoIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  Activity as ActivityIcon,
  UserCheck as UserCheckIcon,
  Heart as HeartIcon,
  Target as TargetIcon,
  Award as AwardIcon
  
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import NotificationsPanel from "@/components/manager/NotificationsPanel";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";
import { S } from "node_modules/framer-motion/dist/types.d-B50aGbjN";
import { Notification } from '../../components/manager/NotificationsPanel';
import {Volunteer} from '../../services/firestore';

const timeStampNow = Timestamp.fromDate(new Date());


// Enums and Types
type ReportType = "attendance" | "volunteer" | "elder" | "appointments";
type ReportStatus = "completed" | "pending" | "failed";

// Date range for filters
interface DateRange {
  from?: string; // ISO or date string
  to?: string;
}

// Filters interface
interface Filters {
  dateRange?: DateRange;                 // Filter by date range
  status?: ("all" | ReportStatus)[];              // Filter by report status
}

// Main Report interface
interface Report {
  id: string;
  type: ReportType;
  filters: Filters;
  data: any;
  generatedBy: string;
  generatedAt: Timestamp;
  description: string | null;
  exported: boolean; //whteher it have been downloaded, printed or not
  status: ReportStatus;
  exportedAt: string;
}

const allreports: Report[] = [];


// Mock data for reports
const mockReports: Report[] = [
  {
    id: "rpt001",
    type: "attendance",
    filters: {
      dateRange: { from: "2025-01-01", to: "2025-01-10" },
      status: ["completed"],
    },
    data: { attendees: 50 },
    generatedBy: "user123",
    generatedAt: timeStampNow,
    description: "Attendance report for January kickoff meeting",
    exported: true,
    status: "completed",
    exportedAt: "2025-01-11T10:00:00Z"
  },
  {
    id: "rpt002",
    type: "volunteer",
    filters: {
      dateRange: { from: "2025-02-01" },
      status: ["pending", "completed"],
    },
    data: { volunteers: 12 },
    generatedBy: "admin456",
    generatedAt: timeStampNow,
    description: "Volunteer participation in cleanup drive",
    exported: false,
    status: "pending",
    exportedAt: ""
  },
  {
    id: "rpt003",
    type: "appointments",
    filters: {
      status: ["failed"],
    },
    data: { failedCount: 5 },
    generatedBy: "supervisor789",
    generatedAt: timeStampNow,
    description: "Failed appointment report",
    exported: false,
    status: "failed",
    exportedAt: ""
  }
];

//push the mock reports to the all reports array
for (const report of mockReports) {
  allreports.push(report);
}

  const mockVolunteers: Volunteer[] = []
// Mock data for notifications
const mockNotifications: Notification[] = [
  {
    id: 1,
    message: "Monthly attendance report generated",
    time: "5 minutes ago",
    type: "success"
  },
  {
    id: 2,
    message: "Quarterly elder report ready",
    time: "10 minutes ago",
    type: "success"
  },
  {
    id: 3,
    message: "Annual appointments report needs review",
    time: "30 minutes ago",
    type: "success"
  }
];

const ManagerReports = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all"
  });
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [reports, setReports] = useState<Report[]>(allreports);
  //const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [reportType, setReportType] = useState("");

const resetForm = () => {
  setDescription("");
  setStartDate("");
  setEndDate("");
  setReportType("");
};
  // Filter reports based on active tab and search query
  const filteredReports = reports.filter(report => {
    // Filter reports by tab (report type tab)
    if (activeTab !== "all" && report.type !== activeTab) {
      return false;
    }
    
    // Filter by search query (search reports field)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const generatedTitle = report.type + "Report";
      return (
        generatedTitle.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (filters.status !== "all" && report.status !== filters.status) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateRange !== "all") {
      const reportDate = report.generatedAt.toDate();
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
  });

  const handleGenerateReport = () => {
  setIsLoading(true);

  setTimeout(() => {
    const newReport: Report = {
      id: "report " + (reports.length + 1).toString(),
      description: description,
      type: reportType as ReportType,
      status: "completed",
      generatedAt: timeStampNow,
      filters: {
        dateRange: {
          from: startDate || undefined,
          to: endDate || new Date().toISOString().split("T")[0],
        },
      },
      data: {},
      generatedBy: "user123",
      exported: false,
      exportedAt: "",
    };

    setReports([...reports, newReport]);
    resetForm();
    setIsLoading(false);
    setIsGenerateDialogOpen(false);

    handleShowReport(newReport);

  }, 1000);
};

const handleShowReport = (newReport: Report) => {
  // PDFMake content definition
  const from = newReport.filters.dateRange?.from || "Any Time";
  const to = newReport.filters.dateRange?.to;
    const baseContent = [
  { text: capitalizeFirstLetter(reportType) + " Report", style: "header" },
  { text: `Description: ${newReport.description}` },
  { text: `Generated By: ${newReport.generatedBy}` },
  { text: `Generated At: ${newReport.generatedAt.toDate().toLocaleString()}` },
  {
    text: `Date Range: ${
      newReport.filters.dateRange
        ? `From ${from} To ${to}`
        : "None"
    }`,
  },
];

let typeSpecificContent: any[] = [];

switch (newReport.type) {
  case "attendance":
    typeSpecificContent = [
      { text: `Attendees: ${newReport.data.attendees?.length || 0}` },
    ];
    break;

  case "volunteer":
    typeSpecificContent = [
      { text: `Volunteers: ${newReport.data.volunteers?.length || 0}` },
    ];
    break;

  case "elder":
    typeSpecificContent = [
      { text: `Elders Counted: ${newReport.data.elders?.length || 0}` },
    ];
    break;

  case "appointments":
    typeSpecificContent = [
      { text: `Appointments: ${newReport.data.appointments?.length || 0}` },
    ];
    break;

  default:
    typeSpecificContent = [{ text: "No specific data available for this report type." }];
}

const docDefinition = {
  content: [...baseContent, ...typeSpecificContent],
  styles: {
    header: {
      fontSize: 18,
      bold: true,
      marginBottom: 10,
    },
  },
};

pdfMake.createPdf(docDefinition).open();
}

  const handlePrintReport = (report: Report) => {
    setIsLoading(true);
    const report_title = report.type + "Report";
    // Simulate printing
    setTimeout(() => {
      setIsLoading(false);
      setNotifications([
        {
          id: Date.now(),
          message: `${report_title} sent to printer`,
          time: "Just now",
          type: "success"
        },
        ...notifications
      ]);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

/*const handleGenerateReport = () => {
  setIsLoading(true);

  const newReport: Report = {
    id: crypto.randomUUID(),
    type: reportType,
    filters: {
      title,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    },
    data: {}, // placeholder for future data
    generatedBy: "CurrentUser", // replace with actual user info
    generatedAt: new Date().toISOString(),
    description: description || null,
    exported: false,
    status: "pending",
    exportedAt: ""
  };

  setReports((prev) => [...prev, newReport]);
  console.log("New report created:", newReport);

  setIsGenerateDialogOpen(false);
  setIsLoading(false);

  // Optional: reset fields
  setTitle("");
  setDescription("");
  setStartDate("");
  setEndDate("");
};*/


function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "pending":
        return <AlertCircleIcon className="h-4 w-4 text-amber-500" />;
      case "failed":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <InfoIcon className="h-4 w-4 text-slate-500" />;
    }
  };

  const getTrendIndicator = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUpIcon className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">+{value}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDownIcon className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{value}%</span>
        </div>
      );
    } else {
      return <span className="text-sm text-slate-500">0%</span>;
    }
  };

  const getTypeIconWithBg = (type: string) => {
    switch (type) {
      case "attendance":
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
        );
      case "volunteer":
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-green-600" />
          </div>
        );
      case "elder":
        return (
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <HeartIcon className="h-5 w-5 text-purple-600" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-slate-600" />
          </div>
        );
    }
  };
  const showDateRange = reportType === "attendance" || reportType === "appointments";
  const typeIsSelected = reportType === "attendance" || reportType === "volunteer" || reportType === "elder" || reportType === "appointments";

  const getReportSummaryStats = () => {
    const totalReports = reports.length;
    const completedReports = reports.filter(r => r.status === "completed").length;
    const pendingReports = reports.filter(r => r.status === "pending").length;
    const failedReports = reports.filter(r => r.status === "failed").length;
    
    const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
    
    return {
      total: totalReports,
      completed: completedReports,
      pending: pendingReports,
      failed: failedReports,
      completionRate
    };
  };

  const stats = getReportSummaryStats();

  const renderChart = (type: string, data: any) => {
    switch (type) {
      case "attendance":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Volunteer Hours Distribution</h4>
              <div className="h-48 flex items-end justify-between gap-2">
                {data.topVolunteers.map((volunteer: any, index: number) => (
                  <div key={volunteer.name} className="flex flex-col items-center">
                    <div 
                      className="w-12 bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                      style={{ 
                        height: `${(volunteer.hours / Math.max(...data.topVolunteers.map((v: any) => v.hours))) * 100}%`,
                        minHeight: '20px'
                      }}
                    ></div>
                    <span className="text-xs mt-2 text-slate-600 truncate max-w-[60px]">{volunteer.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Attendance Rate</h4>
              <div className="flex items-center justify-center h-48">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeDasharray={`${data.attendanceRate}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">{data.attendanceRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "volunteer":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Session Completion</h4>
              <div className="flex items-center justify-center h-48">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${data.completionRate}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">{data.completionRate}%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-green-50 rounded-md p-2">
                  <div className="text-lg font-bold text-green-600">{data.completedSessions}</div>
                  <div className="text-xs text-slate-600">Completed</div>
                </div>
                <div className="bg-amber-50 rounded-md p-2">
                  <div className="text-lg font-bold text-amber-600">{data.cancelledSessions}</div>
                  <div className="text-xs text-slate-600">Cancelled</div>
                </div>
                <div className="bg-slate-50 rounded-md p-2">
                  <div className="text-lg font-bold text-slate-600">{data.totalSessions}</div>
                  <div className="text-xs text-slate-600">Total</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Session Types</h4>
              <div className="h-48 flex items-end justify-between gap-2">
                {data.sessionTypes.map((type: any, index: number) => (
                  <div key={type.name} className="flex flex-col items-center">
                    <div 
                      className="w-12 bg-green-500 rounded-t-md transition-all hover:bg-green-600"
                      style={{ 
                        height: `${(type.count / Math.max(...data.sessionTypes.map((t: any) => t.count))) * 100}%`,
                        minHeight: '20px'
                      }}
                    ></div>
                    <span className="text-xs mt-2 text-slate-600 truncate max-w-[60px]">{type.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "elder":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Elder Satisfaction</h4>
              <div className="flex items-center justify-center h-48">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                      strokeDasharray={`${data.satisfactionRate}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">{data.satisfactionRate}%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                <div className="bg-purple-50 rounded-md p-2">
                  <div className="text-lg font-bold text-purple-600">{data.activeElders}</div>
                  <div className="text-xs text-slate-600">Active Elders</div>
                </div>
                <div className="bg-slate-50 rounded-md p-2">
                  <div className="text-lg font-bold text-slate-600">{data.totalElders}</div>
                  <div className="text-xs text-slate-600">Total Elders</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Popular Activities</h4>
              <div className="space-y-3">
                {data.topActivities.map((activity: any, index: number) => (
                  <div key={activity.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{activity.name}</span>
                      <span className="text-sm font-medium">{activity.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full" 
                        style={{ width: `${(activity.count / Math.max(...data.topActivities.map((a: any) => a.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "engagement":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Engagement Score</h4>
              <div className="flex items-center justify-center h-48">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeDasharray={`${(data.engagementScore / 10) * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">{data.engagementScore}/10</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                <div className="bg-amber-50 rounded-md p-2">
                  <div className="text-lg font-bold text-amber-600">{data.totalInteractions}</div>
                  <div className="text-xs text-slate-600">Total Interactions</div>
                </div>
                <div className="bg-slate-50 rounded-md p-2">
                  <div className="text-lg font-bold text-slate-600">{data.averageDuration}</div>
                  <div className="text-xs text-slate-600">Avg. Duration (min)</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Feedback Categories</h4>
              <div className="space-y-3">
                {data.feedbackSummary.map((feedback: any, index: number) => (
                  <div key={feedback.category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{feedback.category}</span>
                      <span className="text-sm font-medium">{feedback.score}/10</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${(feedback.score / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "performance":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Performance Metrics</h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Overall Performance</span>
                    <span className="text-sm font-medium">{data.overallPerformance}/10</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${(data.overallPerformance / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Efficiency Score</span>
                    <span className="text-sm font-medium">{data.efficiencyScore}/10</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${(data.efficiencyScore / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Quality Score</span>
                    <span className="text-sm font-medium">{data.qualityScore}/10</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${(data.qualityScore / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-medium text-slate-900 mb-3">Performance Trends</h4>
              <div className="h-48 flex items-end justify-between gap-2">
                {data.performanceTrends.map((trend: any, index: number) => (
                  <div key={trend.metric} className="flex flex-col items-center">
                    <div 
                      className={`w-12 rounded-t-md transition-all ${trend.change >= 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                      style={{ 
                        height: `${Math.abs(trend.change) * 2}%`,
                        minHeight: '20px'
                      }}
                    ></div>
                    <span className="text-xs mt-2 text-slate-600 truncate max-w-[60px]">{trend.metric}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {data.improvementAreas.map((area: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span className="text-slate-600">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (!user.id || user.role !== "manager") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block">Volunteer Management System</h1>
            </div>
          </div>
          
          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input 
                placeholder="Search reports..." 
                className="pl-9 bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            <Button 
              variant="ghost" 
              size="icon"
              className="hidden sm:flex"
              onClick={() => setIsGenerateDialogOpen(true)}
            >
              <FileText className="h-5 w-5" />
            </Button>
            
            {/* Notifications */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              
              {/* Notifications Panel */}
              <NotificationsPanel 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
                notifications={notifications} 
              />
            </div>
            
            {/* User Avatar */}
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">M</span>
            </div>
          </div>
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
          {/* Mobile Search */}
          {isMobile && (
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input 
                  placeholder="Search reports..." 
                  className="pl-9 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-slate-600 mt-1">Generate and analyze reports for your organization.</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={stats.completionRate} className="h-1" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircleIcon className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircleIcon className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Navigation */}
          <Tabs 
            defaultValue="all" 
            className="space-y-4"
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-white border border-slate-200 p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                All Reports
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Attendance
              </TabsTrigger>
              <TabsTrigger value="volunteer" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Volunteer
              </TabsTrigger>
              <TabsTrigger value="elder" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Elder
              </TabsTrigger>
              <TabsTrigger value="appointments" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Appointments
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsGenerateDialogOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>

            {/* Report List */}
            <div className="grid gap-4">
              {filteredReports.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No reports found</h3>
                  <p className="text-slate-500 mb-4">
                    {searchQuery 
                      ? "No reports match your search criteria. Try adjusting your filters." 
                      : "No reports available for this category. Generate a new report to get started."}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsGenerateDialogOpen(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <Card
                    key={report.id}
                    className="bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {getTypeIconWithBg(report.type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">{capitalizeFirstLetter(report.type) + " Report"}</h3>
                              <Badge variant="outline" className={getStatusColor(report.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(report.status)}
                                  <span className="capitalize">{report.status}</span>
                                </span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {report.generatedAt.toDate().toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {report.description !== "" && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{report.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/*<TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownloadReport(report)}
                                  disabled={isLoading}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download Report</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>*/}
                          
                          {/*<TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePrintReport(report)}
                                  disabled={isLoading}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Print Report</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>*/}
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    handleShowReport(report);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setReports((prevReports) =>
            prevReports.filter((r) => r.id !== report.id)
          );
        }}
      >
        <Trash className="h-4 w-4 text-red-500" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Remove Report</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

                          {/*<TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                                >
                                  {expandedReport === report.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{expandedReport === report.id ? "Collapse" : "Expand"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>*/}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedReport === report.id && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {report.type === "attendance" && (
                              <>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-slate-900">Volunteer Statistics</h4>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Total Volunteers</span>
                                      <span className="font-medium">{report.data.totalVolunteers}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Active Volunteers</span>
                                      <span className="font-medium">{report.data.activeVolunteers}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Total Hours</span>
                                      <span className="font-medium">{report.data.totalHours}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Average Hours per Volunteer</span>
                                      <span className="font-medium">{report.data.averageHoursPerVolunteer}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-slate-900">Top Volunteers</h4>
                                  <div className="space-y-1">
                                    {report.data.topVolunteers.map((volunteer: any) => (
                                      <div key={volunteer.name} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">{volunteer.name}</span>
                                        <div className="flex items-center">
                                          <span className="text-slate-900 font-medium mr-2">{volunteer.hours} hours</span>
                                          <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-blue-500 rounded-full" 
                                              style={{ width: `${(volunteer.hours / report.data.totalHours) * 100}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                            {report.type === "volunteer" && (
                              <>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-slate-900">Volunteer Activity</h4>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Total Sessions</span>
                                      <span className="font-medium">{report.data.totalSessions}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Completed Sessions</span>
                                      <span className="font-medium">{report.data.completedSessions}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Cancelled Sessions</span>
                                      <span className="font-medium">{report.data.cancelledSessions}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Completion Rate</span>
                                      <div className="flex items-center">
                                        <span className="font-medium mr-2">{report.data.completionRate}%</span>
                                        <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-green-500 rounded-full" 
                                            style={{ width: `${report.data.completionRate}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-slate-900">Session Types</h4>
                                  <div className="space-y-1">
                                    {report.data.sessionTypes.map((type: any) => (
                                      <div key={type.name} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">{type.name}</span>
                                        <div className="flex items-center">
                                          <span className="text-slate-900 font-medium mr-2">{type.count}</span>
                                          <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-green-500 rounded-full" 
                                              style={{ width: `${(type.count / report.data.totalSessions) * 100}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                            {report.type === "elder" && (
                              <>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-slate-900">Elder Engagement</h4>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Total Elders</span>
                                      <span className="font-medium">{report.data.totalElders}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Active Elders</span>
                                      <span className="font-medium">{report.data.activeElders}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Average Sessions per Elder</span>
                                      <span className="font-medium">{report.data.averageSessionsPerElder}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Satisfaction Rate</span>
                                      <div className="flex items-center">
                                        <span className="font-medium mr-2">{report.data.satisfactionRate}%</span>
                                        <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-purple-500 rounded-full" 
                                            style={{ width: `${report.data.satisfactionRate}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-slate-900">Top Activities</h4>
                                  <div className="space-y-1">
                                    {report.data.topActivities.map((activity: any) => (
                                      <div key={activity.name} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">{activity.name}</span>
                                        <div className="flex items-center">
                                          <span className="text-slate-900 font-medium mr-2">{activity.count}</span>
                                          <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-purple-500 rounded-full" 
                                              style={{ width: `${(activity.count / report.data.totalSessions) * 100}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {report.type === "appointments" && (
                              <>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-slate-900">Performance Metrics</h4>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Overall Performance</span>
                                      <div className="flex items-center">
                                        <span className="font-medium mr-2">{report.data.overallPerformance}/10</span>
                                        <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-red-500 rounded-full" 
                                            style={{ width: `${(report.data.overallPerformance / 10) * 100}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Efficiency Score</span>
                                      <div className="flex items-center">
                                        <span className="font-medium mr-2">{report.data.efficiencyScore}/10</span>
                                        <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-red-500 rounded-full" 
                                            style={{ width: `${(report.data.efficiencyScore / 10) * 100}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Quality Score</span>
                                      <div className="flex items-center">
                                        <span className="font-medium mr-2">{report.data.qualityScore}/10</span>
                                        <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-red-500 rounded-full" 
                                            style={{ width: `${(report.data.qualityScore / 10) * 100}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">Improvement Areas</span>
                                      <span className="text-slate-900 font-medium">{report.data.improvementAreas.join(", ")}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-slate-900">Performance Trends</h4>
                                  <div className="space-y-1">
                                    {report.data.performanceTrends.map((trend: any) => (
                                      <div key={trend.metric} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">{trend.metric}</span>
                                        <div className="flex items-center">
                                          <span className={`font-medium mr-2 ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {trend.change >= 0 ? '+' : ''}{trend.change}%
                                          </span>
                                          {trend.change >= 0 ? (
                                            <ArrowUpRightIcon className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <ArrowDownRightIcon className="h-4 w-4 text-red-600" />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Add the charts here */}
                          {renderChart(report.type, report.data)}
                          
                          {/* Add a summary section */}
                          <div className="bg-slate-50 rounded-lg p-4 mt-4">
                            <h4 className="font-medium text-slate-900 mb-2">Summary</h4>
                            <p className="text-slate-600 text-sm">
                              {report.type === "attendance" && 
                                `This attendance report shows ${report.data.totalVolunteers} volunteers with ${report.data.totalHours} total hours logged. ` +
                                `${report.data.activeVolunteers} volunteers are currently active, with an average of ${report.data.averageHoursPerVolunteer} hours per volunteer.`}
                              {report.type === "volunteer" && 
                                `This volunteer report shows ${report.data.totalSessions} total sessions, with ${report.data.completedSessions} completed and ${report.data.cancelledSessions} cancelled. ` +
                                `The completion rate is ${report.data.completionRate}%.`}
                              {report.type === "elder" && 
                                `This elder report shows ${report.data.totalElders} total elders, with ${report.data.activeElders} currently active. ` +
                                `The average sessions per elder is ${report.data.averageSessionsPerElder}, with a satisfaction rate of ${report.data.satisfactionRate}%.`}
                              {report.type === "appointments" && 
                                `This performance report shows an overall performance score of ${report.data.overallPerformance}/10, with efficiency at ${report.data.efficiencyScore}/10 and quality at ${report.data.qualityScore}/10. ` +
                                `Key areas for improvement include: ${report.data.improvementAreas.join(", ")}.`}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </Tabs>
        </main>
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Generate New Report</DialogTitle>
      <DialogDescription>
        Select the type of report and configure its parameters.
      </DialogDescription>
    </DialogHeader>

    <div className="grid gap-4 py-4">
      {/*<div className="space-y-2">
        <Label htmlFor="report-title">Title</Label>
        <Input
          id="report-title"
          placeholder="Enter report title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>*/}

      <div className="space-y-2">
        <Label htmlFor="report-description">Description</Label>
        <Input
          id="report-description"
          placeholder="Enter report description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="report-type">
          Type <span className="text-red-500">*</span>
        </Label>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger>
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="attendance">attendance</SelectItem>
            <SelectItem value="volunteer">volunteer</SelectItem>
            <SelectItem value="elder">elder</SelectItem>
            <SelectItem value="appointments">appointments</SelectItem>
          </SelectContent>
        </Select>
      </div>
            {showDateRange && (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date">From</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="end-date">To</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
        Cancel
      </Button>
      <Button
  onClick={handleGenerateReport}
  disabled={isLoading || !typeIsSelected}
>
  {isLoading ? "Generating..." : "Generate Report"}
</Button>

    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* View Report Dialog */}
      {/*<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedReport?.type + " Report"}</DialogTitle>
            <DialogDescription>
              Generated on {selectedReport?.generatedAt.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">Report Details</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-600">Type: <span className="capitalize">{selectedReport.type}</span></p>
                    <p className="text-slate-600">Status: <span className="capitalize">{selectedReport.status}</span></p>
                    <p className="text-slate-600">Date: {formatTimestamp(selectedReport.generatedAt)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900">Actions</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(selectedReport)}
                      disabled={isLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintReport(selectedReport)}
                      disabled={isLoading}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Report Data</h4>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <pre className="text-sm text-slate-600 overflow-auto">
                    {JSON.stringify(selectedReport.data, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="space-y-4 mt-4">
                <h4 className="font-medium text-slate-900">Visual Summary</h4>
                {renderChart(selectedReport.type, selectedReport.data)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>*/}
    </div>
  );
};

export default ManagerReports; 