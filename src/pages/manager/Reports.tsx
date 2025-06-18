import CircularProgress from '@mui/material/CircularProgress';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.vfs;
import { db, auth, storage } from "@/lib/firebase";
import {
    getDocs,
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
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
import {
    Volunteer, Resident, Attendance,
    Appointment, Report, ParticipantId, CalendarSlot,User
} from '../../services/firestore';
import { useAddAppointment } from '@/hooks/useFirestoreCalendar';

const timeStampNow = Timestamp.fromDate(new Date());

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
        message: "Quarterly resident report ready",
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

function stripTime(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const ManagerReports = () => {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [reportIsDownloading, setReportIsDownloading] = useState(false);
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
    const [reports, setReports] = useState<Report[]>([]); // Changed: Initialized with empty array
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [residents, setResidents] = useState<Resident[]>([]);
    const [calendarSlots, setCalendarslots] = useState<CalendarSlot[]>([]);
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

    const reportsCollectionRef = collection(db, "reports");
    
    const getReports = async () => {
    setIsLoading(true);
    try {
        const data = await getDocs(reportsCollectionRef);
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        })) as Report[];

        // ✅ Sort by Timestamp.seconds (newest to oldest)
        const sortedData = filteredData.sort((a, b) => {
            const aTime = a.generatedAt?.seconds || 0;
            const bTime = b.generatedAt?.seconds || 0;
            return bTime - aTime; // Descending: newest first
        });

        setReports(sortedData);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    getReports();
}, []);

const volunteersCollectionRef = collection(db, "volunteers");
    
    const getVolunteers = async () => {
    setIsLoading(true);
    try {
        const data = await getDocs(volunteersCollectionRef);
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        })) as Volunteer[];

        setVolunteers(filteredData);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    getVolunteers();
}, []);


const residentsCollectionRef = collection(db, "residents");
    
    const getResidents = async () => {
    setIsLoading(true);
    try {
        const data = await getDocs(residentsCollectionRef);
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        })) as Resident[];

        setResidents(filteredData);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    getResidents();
}, []);

const appointmentsCollectionRef = collection(db, "appointments");
    
    const getAppointments = async () => {
    setIsLoading(true);
    try {
        const data = await getDocs(appointmentsCollectionRef);
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        })) as Appointment[];

        setAppointments(filteredData);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    getAppointments();
}, []);

const attendanceCollectionRef = collection(db, "attendance");
    
    const getAttendance = async () => {
    setIsLoading(true);
    try {
        const data = await getDocs(attendanceCollectionRef);
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        })) as Attendance[];

        setAttendance(filteredData);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    getAttendance();
}, []);

const calendarslotCollectionRef = collection(db, "calendar_slots");
    
    const getCalendarSlots = async () => {
    setIsLoading(true);
    try {
        const data = await getDocs(calendarslotCollectionRef);
        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        })) as CalendarSlot[];

        setCalendarslots(filteredData);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    getCalendarSlots();
}, []);

const addReport = async () => {
    try {
        const now = new Date();
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;
        const userString = localStorage.getItem("user") || sessionStorage.getItem("user");
        const userName = userString?JSON.parse(userString)["username"]:"system";

        const newReport: Report = {
            id: "", // will be set after addDoc
            type: reportType,
            filters: {
                dateRange: {
                    from: from,
                    to: to,
                },
            },
            data: [{ description: description || "No description provided" }],
            generatedBy: userName,
            generatedAt: Timestamp.fromDate(now),
            description: description || null,
            exported: false,
            exportedAt: null,
            status: "completed",
        };

        const docRef = await addDoc(reportsCollectionRef, newReport);
        handleReportActions(newReport,"view");
        console.log("New report added with ID:", docRef.id);

        await updateDoc(docRef, { id: docRef.id });
        getReports(); // Refresh list
    } catch (err) {
        console.error("Error in addReport:", err);
    }
};
    
    const deleteReport = async (id: string) => { // Added type for id
        const reportDoc = doc(db, "reports", id);
        await deleteDoc(reportDoc);
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
            if (!report.description) {
                return generatedTitle.toLowerCase().includes(query);
            }
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
            addReport();
            setIsGenerateDialogOpen(false);
            setIsLoading(false);
            resetForm();
        }, 1000);
    };

    const handleReportActions = (newReport: Report, action: "view" | "download") => {
        // PDFMake content definition
        const from = newReport.filters["dateRange"]?.from || "Any Time";
        const to = newReport.filters["dateRange"]?.to || "Any Time";
        const baseContent = [
            { text: capitalizeFirstLetter(newReport.type) + " Report", style: "header", alignment: "center" },
            { text: `Description: ${newReport.description}` },
            { text: `Generated By: ${newReport.generatedBy}` },
            { text: `Generated At: ${newReport.generatedAt.toDate().toLocaleString()}` },
            {
                text: `Date Range: ${
                    newReport.filters["dateRange"]
                        ? `From ${from} To ${to}`
                        : "None"
                    }`,
            },
        ];

        let typeSpecificContent: any[] = [];

        // Helper to parse date or return undefined
        const parseDate = (d?: string) => d ? new Date(d) : null;

        const fromDate = parseDate(newReport.filters["dateRange"]?.from);
        const toDate = parseDate(newReport.filters["dateRange"]?.to) || new Date(); // default to today if no 'to'

        switch (newReport.type) { 
          case "attendance":
    // Filter attendances by confirmedAt date range
    const filteredAttendances = (attendance || []).filter(a => {
        const confDate = stripTime(a.confirmedAt.toDate());
        const fromDateOnly = fromDate ? stripTime(fromDate) : null;
        const toDateOnly = toDate ? stripTime(toDate) : null;
        return (!fromDateOnly || confDate >= fromDateOnly) && (!toDateOnly || confDate <= toDateOnly);
    });

    typeSpecificContent = [
        { text: `Attendees Counted: ${filteredAttendances.length}` },
        ...filteredAttendances.flatMap((a, i) => {
            // a.volunteerId is ParticipantId { id, type }
            const volunteer = (a.volunteerId.type === 'volunteer')
                ? volunteers.find(v => v.id === a.volunteerId.id)
                : null;

            // Find appointment by appointmentId
            const appointment = appointments.find(appt => appt.id === a.appointmentId);

            // Find calendar slot by appointment.calendarSlotId
            const calendarSlot = appointment
                ? calendarSlots.find(slot => slot.id === appointment.calendarSlotId)
                : null;

            // Resident names from appointment.residentIds
            const residentNames = appointment?.residentIds
                .map(resId => residents.find(r => r.id === resId)?.fullName || 'Unknown Resident')
                .join(", ") || 'No residents';

            // Format appointment time from calendar slot
            const appointmentTime = calendarSlot
                ? `${calendarSlot.date} ${calendarSlot.startTime} - ${calendarSlot.endTime}`
                : 'No appointment time';

            return [
                {
                    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1 }],
                    margin: [0, 10, 0, 10]
                },
                {
                    stack: [
                        { text: `Attendance #${i + 1}`, style: 'subheader', margin: [0, 5, 0, 5] },
                        {
                            text: `
Volunteer Name: ${volunteer?.fullName || 'Unknown Volunteer'}
Resident Name(s): ${residentNames}
Appointment Time: ${appointmentTime}
Volunteer Type: ${a.volunteerId.type}
Status: ${a.status}
Confirmed By: ${a.confirmedBy}
Confirmed At: ${a.confirmedAt.toDate().toLocaleString()}
Notes: ${a.notes || "None"}`
                        }
                    ],
                    margin: [0, 0, 0, 15]
                },
                {
                    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1 }],
                    margin: [0, 10, 0, 10]
                }
            ];
        })
    ];
    break;



            case "volunteer":
                // unchanged
                
                typeSpecificContent = [
                    { text: `Volunteers Counted: ${volunteers?.length || 0}` },
                    ...(volunteers || []).flatMap((v, i) => [
                        {
                            
                            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1 }],
                            margin: [0, 10, 0, 10]
                        },
                        {
                            stack: [
                                { text: `Volunteer #${i + 1}`, style: 'subheader', margin: [0, 5, 0, 5] },
                                {
                                    text: `
                                        UserId: ${v.userId}
                                        Name: ${v.fullName}
                                        Birth date: ${v.birthDate}
                                        gender: ${v.gender}
                                        Phone Number: ${v.phoneNumber}
                                        Languages: ${v.languages.join(", ")}
                                        Skills: ${v.skills.join(", ")}
                                        Hobbies: ${v.hobbies.join(", ")}
                                        Group Affiliation: ${v.groupAffiliation || "None"}
                                        Matching Preference: ${v.matchingPreference}
                                        Reason for Volunteering: ${v.reasonForVolunteering}
                                        Availability: 
                                        ${Object.entries(v.availability || {})
                                        .map(([day, times]) => `--${day}: ${times.join(", ")}`)
                                        .join("\n")}
                                        Volunteer Total Attendance:
                                        --Present: ${v.totalAttendance?.present || 0}
                                        --Absent: ${v.totalAttendance?.absent || 0}
                                        --Late: ${v.totalAttendance?.late || 0}
                                        Total Sessions: ${v.totalSessions || 0}
                                        Total Hours: ${v.totalHours || 0}    
                                        Active Volunteer: ${v.isActive}
                                        Created At: ${v.createdAt.toDate().toLocaleString()}
                                        Notes: ${v.notes || "None"}`
                                },
                                ...(v.appointmentHistory?.length ? [
                                    {
                                        text: 'Appointments History:',
                                        style: 'tableHeader',
                                        margin: [0, 10, 0, 5]
                                    },
                                    {
                                        table: {
                                            widths: ['*', '*', '*', '*', '*', '*', '*'],
                                            body: [
                                                [
                                'ID',
                                'Date',
                                'Start Time',
                                'End Time',
                                'Resident IDs',
                                'Status',
                                'Attendance'
                            ],
                            ...v.appointmentHistory.map(a => [
                                a.appointmentId,
                                a.date,
                                a.startTime,
                                a.endTime,
                                a.residentIds.join(", "),
                                a.status || 'N/A',
                                a.attendanceStatus || 'N/A'
                            ])
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    fontSize: 9
                }
            ]
            : []
        )
    ],
    margin: [0, 0, 0, 15]
},
                        {
                            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1 }],
                            margin: [0, 10, 0, 10]
                        }
                    ])
                ];
                break;

            case "resident":
                // unchanged
                typeSpecificContent = [
                    { text: `Residents Counted: ${residents?.length || 0}`, margin: [0, 0, 0, 10] },
                    ...(residents || []).flatMap((r, i) => {
                        const matchedHistoryTable = r.appointmentHistory?.length
                            ? {
                                style: 'tableExample',
                                table: {
                                    headerRows: 1,
                                    widths: ['*', '*', '*', '*'],
                                    body: [
                                        ['Appointment ID', 'Date', 'Start Time', 'End Time', 'Volunteer IDs', 'Status'],
                                        ...r.appointmentHistory.map(entry => [
                                            entry.appointmentId,
                                            entry.date,
                                            entry.startTime,
                                            entry.endTime,
                                            entry.volunteerIds,
                                            entry.status
                                        ])
                                    ]
                                },
                                layout: 'lightHorizontalLines',
                                margin: [0, 10, 0, 10]
                            }
                            : { text: 'Matched History: None' };

                        return [
                          {
                            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1 }],
                            margin: [0, 10, 0, 10]
                          },
                          {
                            stack: [
                              { text: `Resident #${i + 1}`, style: 'subheader', margin: [0, 5, 0, 5], alignment: 'left' },
                              {
                                text: `
                                    Name: ${r.fullName}
                                    Birth Date: ${r.birthDate}
                                    Gender: ${r.gender}
                                    Date of Aliyah: ${r.dateOfAliyah || "None"}
                                    Country of Aliyah: ${r.countryOfAliyah || "None"}
                                    Phone Number: ${r.phoneNumber || "None"}
                                    Education: ${r.education || "None"}
                                    Needs: ${r.needs?.join(", ") || "None"}
                                    Hobbies: ${r.hobbies?.join(", ") || "None"}
                                    Languages: ${r.languages.join(", ")}
                                    Cooperation Level: ${r.cooperationLevel}
                                    Availability: 
                                    ${Object.entries(r.availability || {})
                                    .map(([day, times]) => `--${day}: ${times.join(", ")}`)
                                    .join("\n")}
                                    Active Resident: ${r.isActive}
                                    Total Sessions: ${r.totalSessions || 0}
                                    Total Hours: ${r.totalHours || 0}
                                    Notes: ${r.notes || "None"}
                                    Created At: ${r.createdAt.toDate().toLocaleString()}
                                    ${r.appointmentHistory?.length ? "\nAppointment History:" : ""}`,
                                alignment: 'left'
                              },
                              { ...matchedHistoryTable, alignment: 'left' }
                            ],
                            margin: [0, 0, 0, 15]
                          },
                          {
                            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1 }],
                            margin: [0, 10, 0, 10]
                          }
                        ];
                    })
                ];
                break;

            case "appointments":
                // Filter appointments by updatedAt date range
                const filteredAppointments = (appointments || []).filter(a => {
                    const updated = stripTime(a.updatedAt.toDate());
                    const fromDateOnly = fromDate ? stripTime(fromDate) : null;
                    const toDateOnly = toDate ? stripTime(toDate) : null;
                    return (!fromDateOnly || updated >= fromDateOnly) && (!toDateOnly || updated <= toDateOnly);
                });

                typeSpecificContent = [
                    { text: `Appointments Counted: ${filteredAppointments.length}`, margin: [0, 0, 0, 10] },
                    ...filteredAppointments.flatMap((a, index) => [
                        {
                            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1 }],
                            margin: [0, 10, 0, 10]
                        },
                        {
                            stack: [
                                { text: `Appointment #${index + 1}`, style: 'subheader', margin: [0, 5, 0, 5] },
                                {
                                    text: `
                                        Resident IDs: ${a.residentIds.join(", ")}
                                        Volunteer IDs: ${a.volunteerIds.map(v => v.id).join(", ")}
                                        Status: ${a.status}
                                        Updated At: ${a.updatedAt.toDate().toLocaleString()}
                                        Created At: ${a.createdAt.toDate().toLocaleString()}
                                        Notes: ${a.notes || "None"}`
                                }
                            ],
                            margin: [0, 0, 0, 15]
                        },
                        {
                            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1 }],
                            margin: [0, 10, 0, 10]
                        }
                    ])
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
        if (action === "view") {
            pdfMake.createPdf(docDefinition).open();
            setIsViewDialogOpen(false);
        }
        else if (action === "download") {
            const fileName = `${capitalizeFirstLetter(newReport.type)}-report.pdf`;
            pdfMake.createPdf(docDefinition).download(fileName);
            setReportIsDownloading(false);
        }
    }

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
            case "resident":
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
    const typeIsSelected = reportType === "attendance" || reportType === "volunteer" || reportType === "resident" || reportType === "appointments";

    const getReportSummaryStats = () => {
        const totalReports = reports.length;
        const completedReports = reports.filter(r => r.status === "completed").length;
        const pendingReports = reports.filter(r => r.status === "pending").length;
        const failedReports = reports.filter(r => r.status === "failed").length;

        //const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

        return {
            total: totalReports,
            completed: completedReports,
            pending: pendingReports,
            failed: failedReports,
            //completionRate
        };
    };

    const stats = getReportSummaryStats();

    const handleLogout = () => {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        navigate("/login");
    };

    const getStoredUser = (): User | null => {
    const userString = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
        return userString ? JSON.parse(userString) : null;
    } catch {
        return null;
    }
};

    useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "manager") {
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
            <div>
                {isLoading ? (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <CircularProgress />
                    </div>
                ) : (
                    <>

                    </>
                )}
            </div>
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
                            <TabsTrigger value="resident" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                                Resident
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
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setIsViewDialogOpen(true);
                                                                        handleReportActions(report, "view");
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
                                                                        setReportIsDownloading(true);
                                                                        handleReportActions(report, "download");
                                                                    }}
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Download</p>
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
                                                                        deleteReport(report.id);
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
                                                </div>
                                            </div>
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
                                    <SelectItem value="resident">resident</SelectItem>
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
        </div>
    );
};

export default ManagerReports;