import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Users,
  Clock2,
  XCircle,
  Calendar,
  Download,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  CalendarRange,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { deleteDoc, doc, updateDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { useVolunteers } from "@/hooks/useFirestoreVolunteers";
import { useCalendarSlots } from "@/hooks/useFirestoreCalendar";
import { useExternalGroups } from "@/hooks/useFirestoreCalendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateAppointment } from "@/hooks/useFirestoreCalendar";
import { AttendanceStatus, ParticipantId } from "@/services/firestore";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { he } from "date-fns/locale";
import { useAppointments, AppointmentUI } from "@/hooks/useFirestoreCalendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAttendanceByAppointment, useAddAttendance, useUpdateAttendance } from "@/hooks/useAttendance";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import { addAppointmentToHistory, updateAppointmentStatusInHistory, incrementSessionStats, decrementSessionStats, updateVolunteerAttendanceStats, removeAppointmentFromHistory } from '@/services/engagement';
import { AppointmentStatus } from '@/services/firestore';
import { AppointmentSkeleton } from "@/components/skeletons/AppointmentSkeleton";
import i18n from '@/i18n';

const ManagerAppointments = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['manager-appointments', 'common']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMinLoading, setIsMinLoading] = useState(true); // Renamed to avoid conflict

  // Get real data from hooks
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { slots, loading: slotsLoading } = useCalendarSlots();
  const { externalGroups, loading: groupsLoading } = useExternalGroups();
  const { updateAppointment, loading: isUpdating } = useUpdateAppointment();
  const { volunteers } = useVolunteers();

  // Filter state
  const [activeTab, setActiveTab] = useState("upcoming");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Modal state
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentUI | null>(null);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);

  // Get attendance data for selected appointment
  const { attendance: appointmentAttendance, loading: attendanceLoading } = useAttendanceByAppointment(selectedAppointment?.id || '');
  const { addAttendance, loading: isAddingAttendance } = useAddAttendance();
  const { updateAttendance, loading: isUpdatingAttendance } = useUpdateAttendance();

  const datePickerRef = useRef<HTMLButtonElement>(null);

  // Add state for tracking attendance changes
  const [pendingAttendanceChanges, setPendingAttendanceChanges] = useState<{
    [key: string]: {
      status: AttendanceStatus;
      notes?: string | null;
      volunteerId: ParticipantId;
    };
  }>({});

  // Add loading state for save button
  const [isSaving, setIsSaving] = useState(false);

  // Add loading state for details save button
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Add state for tracking details changes
  const [pendingDetailsChanges, setPendingDetailsChanges] = useState<{
    status?: AppointmentStatus;
    notes?: string;
  }>({});

  // Add new state for the main dialog tab
  const [detailsTab, setDetailsTab] = useState('details');

  // Add state for updating statuses
  const [isUpdatingStatuses, setIsUpdatingStatuses] = useState(false);
  const lastStatusCheckRef = useRef<number>(0);
  const STATUS_CHECK_INTERVAL = 60000; // Check every minute

  // Add back the delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Handle messages from dashboard
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "OPEN_MARK_ATTENDANCE_DIALOG") {
        const appointmentId = event.data.appointmentId;
        const appointment = appointments.find(a => a.id === appointmentId);
        if (appointment) {
          setSelectedAppointment(appointment);
          setIsAttendanceDialogOpen(true);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [appointments]);

  // Get status badge color
  const getStatusBadgeColor = (status: AppointmentStatus) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500 text-white hover:bg-blue-600 transition-colors";
      case "inProgress":
        return "bg-amber-500 text-white hover:bg-amber-600 transition-colors";
      case "completed":
        return "bg-emerald-500 text-white hover:bg-emerald-600 transition-colors";
      case "canceled":
        return "bg-red-500 text-white hover:bg-red-600 transition-colors";
      default:
        return "bg-slate-500 text-white hover:bg-slate-600 transition-colors";
    }
  };

  // Format status for display
  const formatStatus = (status: AppointmentStatus) => {
    switch (status) {
      case "upcoming":
        return t('appointment.status.upcoming');
      case "inProgress":
        return t('appointment.status.inProgress');
      case "completed":
        return t('appointment.status.completed');
      case "canceled":
        return t('appointment.status.canceled');
      default:
        return status;
    }
  };

  // Handle date range selection
  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    if (range?.from) {
      // If only one date is selected, use it for both from and to
      const newRange = {
        from: range.from,
        to: range.to || range.from
      };
      setDateRange(newRange);
      setActiveTab("specific");
    } else {
      setDateRange({ from: undefined, to: undefined });
      setActiveTab("all");
    }
  };

  // Add useMemo for filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(appointment => {
        const slot = slots.find(s => s.id === appointment.calendarSlotId);
        if (!slot) return false;

        const appointmentDate = new Date(slot.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const matchesDateRange = dateRange?.from && dateRange?.to ?
          isWithinInterval(appointmentDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          }) :
          true;

        let matchesTab = true;
        if (activeTab === "today") {
          matchesTab = appointmentDate.toDateString() === today.toDateString();
        } else if (activeTab === "past") {
          // Show if completed and slot end time is before now
          if (appointment.status === "completed" && slot) {
            const slotEnd = new Date(slot.date);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            slotEnd.setHours(endHour, endMinute, 0, 0);
            matchesTab = slotEnd < new Date();
          } else {
            matchesTab = false;
          }
        } else if (activeTab === "upcoming") {
          matchesTab = appointmentDate > today &&
            appointment.status === "upcoming";
        } else if (activeTab === "canceled") {
          matchesTab = appointment.status === "canceled";
        } else if (activeTab === "specific") {
          matchesTab = dateRange?.from && dateRange?.to ?
            isWithinInterval(appointmentDate, {
              start: startOfDay(dateRange.from),
              end: endOfDay(dateRange.to)
            }) : false;
        }
        // "all" tab shows everything by default (matchesTab remains true)

        return matchesTab && matchesDateRange;
      })
      .sort((a, b) => {
        const slotA = slots.find(s => s.id === a.calendarSlotId);
        const slotB = slots.find(s => s.id === b.calendarSlotId);

        if (!slotA || !slotB) return 0;

        const dateA = new Date(slotA.date);
        const dateB = new Date(slotB.date);

        // First sort by date
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }

        // If same date, sort by start time
        const [startHourA, startMinuteA] = slotA.startTime.split(':').map(Number);
        const [startHourB, startMinuteB] = slotB.startTime.split(':').map(Number);

        const timeA = startHourA * 60 + startMinuteA;
        const timeB = startHourB * 60 + startMinuteB;

        return timeA - timeB;
      });
  }, [appointments, slots, activeTab, dateRange]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "specific") {
      const today = new Date();
      setDateRange({
        from: today,
        to: today
      });
    } else {
      setDateRange({
        from: undefined,
        to: undefined
      });
    }
  };

  // Add function to check if status change is valid
  const isValidStatusChange = (appointment: AppointmentUI, newStatus: AppointmentStatus) => {
    const slot = slots.find(s => s.id === appointment.calendarSlotId);
    if (!slot) return false;

    const now = new Date();
    const appointmentDate = new Date(slot.date);
    const isToday = appointmentDate.toDateString() === now.toDateString();

    // Convert times to minutes for comparison
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    // Canceled status can be set at any time
    if (newStatus === 'canceled') return true;

    // For non-canceled statuses, check time constraints
    if (isToday) {
      if (currentTime < startTimeInMinutes) {
        // Before start time, only allow 'upcoming'
        return newStatus === 'upcoming';
      } else if (currentTime >= endTimeInMinutes) {
        // After end time, only allow 'completed'
        return newStatus === 'completed';
      } else {
        // During appointment time, only allow 'inProgress'
        return newStatus === 'inProgress';
      }
    } else if (appointmentDate > now) {
      // Future date, only allow 'upcoming'
      return newStatus === 'upcoming';
    } else {
      // Past date, only allow 'completed'
      return newStatus === 'completed';
    }
  };

  // Handle status change
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus, notes?: string) => {
    setIsSavingDetails(true);
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) throw new Error('Appointment not found');
      const slot = slots.find(s => s.id === appointment.calendarSlotId);
      if (!slot) throw new Error('Slot not found');
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

      // If status is being set to canceled, update both appointment and calendar slot
      if (newStatus === 'canceled') {
        // Get all attendance records for this appointment
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('appointmentId', '==', appointmentId)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());

        // Handle stats and attendance for all appointment statuses
        for (const v of appointment.volunteerIds) {
          if (v.type === 'volunteer') {
            // Check if volunteer was marked as present/late
            const volunteerAttendance = attendanceRecords.find(record =>
              record.volunteerId.id === v.id &&
              (record.status === 'present' || record.status === 'late')
            );

            // Only decrement session stats if volunteer was present/late
            if (volunteerAttendance) {
              await decrementSessionStats(v.id, duration, 'volunteer');
            }

            // Always decrement totalAttendance stats for the volunteer's attendance status
            const volunteerAttendanceRecord = attendanceRecords.find(record =>
              record.volunteerId.id === v.id
            );
            if (volunteerAttendanceRecord?.status) {
              const ref = doc(db, 'volunteers', v.id);
              const snap = await getDoc(ref);
              if (snap.exists()) {
                const prevAttendance = snap.data().totalAttendance || { present: 0, absent: 0, late: 0 };
                if (prevAttendance[volunteerAttendanceRecord.status] !== undefined) {
                  await updateDoc(ref, {
                    totalAttendance: {
                      ...prevAttendance,
                      [volunteerAttendanceRecord.status]: Math.max(0, prevAttendance[volunteerAttendanceRecord.status] - 1)
                    }
                  });
                }
              }
            }
          }
        }

        // Only decrement resident stats if any volunteer was present/late
        const hasAnyPresentVolunteer = appointment.volunteerIds.some(v =>
          v.type === 'volunteer' &&
          attendanceRecords.some(record =>
            record.volunteerId.id === v.id &&
            (record.status === 'present' || record.status === 'late')
          )
        );
        if (hasAnyPresentVolunteer) {
          for (const rId of appointment.residentIds) {
            await decrementSessionStats(rId, duration, 'resident');
          }
        }

        // Delete all attendance records for this appointment, regardless of status
        await Promise.all(attendanceSnapshot.docs.map(docSnap => deleteDoc(doc(db, 'attendance', docSnap.id))));

        // Update both appointment and calendar slot in parallel
        await Promise.all([
          updateAppointment(appointmentId, {
            status: newStatus,
            notes: notes,
            updatedAt: Timestamp.fromDate(new Date())
          }),
          updateDoc(doc(db, 'calendar_slots', appointment.calendarSlotId), {
            status: 'canceled',
            isOpen: false,
            updatedAt: Timestamp.fromDate(new Date())
          })
        ]);

        // Engagement tracking: Update appointmentHistory for all participants
        for (const v of appointment.volunteerIds) {
          if (v.type === 'volunteer') {
            await updateAppointmentStatusInHistory(v.id, appointment.id, newStatus, 'volunteer');
          }
        }
        for (const rId of appointment.residentIds) {
          await updateAppointmentStatusInHistory(rId, appointment.id, newStatus, 'resident');
        }

        // Update slot status according to mapping
        const slotRef = doc(db, 'calendar_slots', appointment.calendarSlotId);
        await updateDoc(slotRef, { status: 'canceled' });

        // Reject all volunteer requests for this slot
        const slotSnap = await getDoc(slotRef);
        if (slotSnap.exists()) {
          const slotData = slotSnap.data();
          const updatedVolunteerRequests = (slotData.volunteerRequests || []).map(vr =>
            vr.status === 'pending' ? { ...vr, status: 'rejected', rejectedReason: 'Appointment canceled', rejectedAt: new Date().toISOString() } : vr
          );
          await updateDoc(slotRef, { volunteerRequests: updatedVolunteerRequests });
        }
      } else {
        // For non-canceled statuses, only update the appointment
        await updateAppointment(appointmentId, {
          status: newStatus,
          notes: notes,
          updatedAt: Timestamp.fromDate(new Date())
        });
        // Engagement tracking: If status is changed from canceled to completed, re-increment stats and recreate attendance
        if (appointment.status === 'canceled' && newStatus === 'completed') {
          // For volunteers and external groups
          for (const v of appointment.volunteerIds) {
            if (v.type === 'volunteer') {
              await incrementSessionStats(v.id, duration, 'volunteer');
              await updateVolunteerAttendanceStats(v.id, 'present');
              // Recreate attendance record
              await addAttendance({
                appointmentId: appointment.id,
                volunteerId: {
                  id: v.id,
                  type: 'volunteer'
                },
                status: 'present',
                notes: 'Automatically marked as present for past session',
                confirmedBy: 'manager'
              });
            }
            if (v.type === 'external_group') {
              // Recreate attendance record for external group
              await addAttendance({
                appointmentId: appointment.id,
                volunteerId: {
                  id: v.id,
                  type: 'external_group'
                },
                status: 'present',
                notes: 'Automatically marked as present for past session (external group)',
                confirmedBy: 'manager'
              });
            }
          }
          // For residents
          for (const rId of appointment.residentIds) {
            await incrementSessionStats(rId, duration, 'resident');
          }
        }
        // Engagement tracking: Update appointmentHistory for all participants
        for (const v of appointment.volunteerIds) {
          if (v.type === 'volunteer') {
            await updateAppointmentStatusInHistory(v.id, appointment.id, newStatus, 'volunteer');
          }
        }
        for (const rId of appointment.residentIds) {
          await updateAppointmentStatusInHistory(rId, appointment.id, newStatus, 'resident');
        }
        // Update slot status according to mapping
        const slotRef = doc(db, 'calendar_slots', appointment.calendarSlotId);
        let slotStatus: 'open' | 'full' | 'canceled';
        if (newStatus === 'completed') {
          slotStatus = 'full';
        } else if (newStatus === 'inProgress' || newStatus === 'upcoming') {
          slotStatus = 'open';
        } else {
          slotStatus = 'open';
        }
        await updateDoc(slotRef, { status: slotStatus });
      }

      // Only update local state after successful database update
      const updatedAppointment = {
        ...selectedAppointment!,
        status: newStatus,
        notes: notes,
        updatedAt: new Date().toISOString()
      };
      setSelectedAppointment(updatedAppointment);

      toast({
        title: t('messages.appointmentUpdated'),
        description: t('messages.appointmentUpdatedDescription')
      });

      // Close details dialog after saving
      setIsDetailsDialogOpen(false);
      setSelectedAppointment(null); // Clear selected appointment
      setPendingDetailsChanges({}); // Clear pending changes

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: t('messages.error'),
        description: t('messages.errorDescription'),
        variant: "destructive"
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Handle details change
  const handleDetailsChange = (field: 'status' | 'notes', value: string) => {
    if (field === 'status' && selectedAppointment) {
      // Validate status change
      if (!isValidStatusChange(selectedAppointment, value as AppointmentStatus)) {
        toast({
          title: t('messages.invalidStatusChange'),
          description: t('messages.invalidStatusChangeDescription'),
          variant: "destructive"
        });
        return;
      }

      // If status is being set to canceled, update both appointment and calendar slot
      if (value === 'canceled') {
        const slot = slots.find(s => s.id === selectedAppointment.calendarSlotId);
        if (slot) {
          updateDoc(doc(db, 'calendar_slots', slot.id), {
            status: 'canceled',
            isOpen: false,
            updatedAt: Timestamp.fromDate(new Date())
          });
        }
      }
    }

    setPendingDetailsChanges(prev => ({
      ...prev,
      [field]: value === '' ? null : value
    }));
  };

  // Handle export
  const handleExport = (format: 'pdf' | 'csv') => {
    // In a real application, this would call a backend API to generate the file
    toast({
      title: t('messages.exportSuccess'),
      description: t('messages.exportSuccessDescription', { format: format.toUpperCase() }),
      duration: 3000
    });
  };

  // Handle attendance status change
  const handleAttendanceChange = (volunteerId: ParticipantId, status: AttendanceStatus | null, notes?: string) => {
    setPendingAttendanceChanges(prev => ({
      ...prev,
      [volunteerId.id]: {
        status,
        notes: notes === '' ? null : notes,
        volunteerId
      }
    }));
  };

  // Add this function after the handleAttendanceChange function
  const hasAttendanceChanges = useCallback(() => {
    if (Object.keys(pendingAttendanceChanges).length === 0) return false;

    return Object.entries(pendingAttendanceChanges).some(([volunteerId, changes]) => {
      const existingAttendance = appointmentAttendance.find(a => a.volunteerId.id === volunteerId);

      // If there's no existing attendance and we're trying to set a status, that's a change
      if (!existingAttendance && changes.status !== null) return true;

      // If there is existing attendance, compare the changes
      if (existingAttendance) {
        // If status is different
        if (changes.status !== existingAttendance.status) return true;

        // If notes are different
        if (changes.notes !== existingAttendance.notes) return true;
      }

      return false;
    });
  }, [pendingAttendanceChanges, appointmentAttendance]);

  // Handle save attendance changes
  const handleSaveAttendance = async () => {
    if (!selectedAppointment) return;

    setIsSaving(true);
    try {
      const slot = slots.find(s => s.id === selectedAppointment.calendarSlotId);
      if (!slot) throw new Error('Slot not found');
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

      const updates = Object.entries(pendingAttendanceChanges).map(async ([volunteerId, changes]) => {
        const existingAttendance = appointmentAttendance.find(a => a.volunteerId.id === volunteerId);

        if (existingAttendance) {
          if (changes.status === null) {
            // If status is null, delete the attendance record
            // If the appointment is upcoming/inProgress/completed and the previous status was present/late, decrement stats
            if ((selectedAppointment.status === 'upcoming' || selectedAppointment.status === 'inProgress' || selectedAppointment.status === 'completed') &&
              (existingAttendance.status === 'present' || existingAttendance.status === 'late')) {
              if (changes.volunteerId.type === 'volunteer') {
                await decrementSessionStats(changes.volunteerId.id, duration, 'volunteer');
              }
              // Only decrement resident stats if this was the last present/late participant (volunteer or external group)
              // Check what the state will be AFTER all pending changes are applied
              const otherPresentParticipants = selectedAppointment.volunteerIds.filter(v => {
                if (v.id === volunteerId) return false; // Skip current volunteer

                // Check if this volunteer has pending changes
                const pendingChange = pendingAttendanceChanges[v.id];
                if (pendingChange) {
                  return pendingChange.status === 'present' || pendingChange.status === 'late';
                }

                // If no pending changes, check current attendance
                return appointmentAttendance.some(a =>
                  a.volunteerId.id === v.id &&
                  (a.status === 'present' || a.status === 'late')
                );
              });
              if (otherPresentParticipants.length === 0) {
                for (const rId of selectedAppointment.residentIds) {
                  await decrementSessionStats(rId, duration, 'resident');
                }
              }
            }
            // Decrement totalAttendance stats when deleting attendance record
            if (changes.volunteerId.type === 'volunteer') {
              const ref = doc(db, 'volunteers', changes.volunteerId.id);
              const snap = await getDoc(ref);
              if (snap.exists()) {
                const prevAttendance = snap.data().totalAttendance || { present: 0, absent: 0, late: 0 };
                if (existingAttendance.status && prevAttendance[existingAttendance.status] !== undefined) {
                  await updateDoc(ref, {
                    totalAttendance: {
                      ...prevAttendance,
                      [existingAttendance.status]: Math.max(0, prevAttendance[existingAttendance.status] - 1)
                    }
                  });
                }
              }
            }
            return deleteDoc(doc(db, 'attendance', existingAttendance.id));
          } else {
            // Update existing attendance record
            const prevStatus = existingAttendance.status;
            const updatePromise = updateAttendance(existingAttendance.id, {
              status: changes.status,
              notes: changes.notes || null,
              volunteerId: changes.volunteerId,
              confirmedBy: 'manager'
            });

            // Handle stats updates for upcoming/inProgress/completed appointments
            if (selectedAppointment.status === 'upcoming' || selectedAppointment.status === 'inProgress' || selectedAppointment.status === 'completed') {
              if (changes.volunteerId.type === 'volunteer') {
                // If changing from null/absent to present/late, increment stats
                if ((prevStatus === null || prevStatus === 'absent') &&
                  (changes.status === 'present' || changes.status === 'late')) {
                  await incrementSessionStats(changes.volunteerId.id, duration, 'volunteer');
                  // Only increment resident stats if this is the first present/late participant
                  const otherPresentParticipants = selectedAppointment.volunteerIds.filter(v => {
                    if (v.id === volunteerId) return false; // Skip current volunteer

                    // Check if this volunteer has pending changes
                    const pendingChange = pendingAttendanceChanges[v.id];
                    if (pendingChange) {
                      return pendingChange.status === 'present' || pendingChange.status === 'late';
                    }

                    // If no pending changes, check current attendance
                    return appointmentAttendance.some(a =>
                      a.volunteerId.id === v.id &&
                      (a.status === 'present' || a.status === 'late')
                    );
                  });
                  if (otherPresentParticipants.length === 0) {
                    for (const rId of selectedAppointment.residentIds) {
                      await incrementSessionStats(rId, duration, 'resident');
                    }
                  }
                }
                // If changing from present/late to absent, decrement stats
                else if ((prevStatus === 'present' || prevStatus === 'late') &&
                  changes.status === 'absent') {
                  await decrementSessionStats(changes.volunteerId.id, duration, 'volunteer');
                  // Only decrement resident stats if this was the last present/late participant
                  const otherPresentParticipants = selectedAppointment.volunteerIds.filter(v => {
                    if (v.id === volunteerId) return false; // Skip current volunteer

                    // Check if this volunteer has pending changes
                    const pendingChange = pendingAttendanceChanges[v.id];
                    if (pendingChange) {
                      return pendingChange.status === 'present' || pendingChange.status === 'late';
                    }

                    // If no pending changes, check current attendance
                    return appointmentAttendance.some(a =>
                      a.volunteerId.id === v.id &&
                      (a.status === 'present' || a.status === 'late')
                    );
                  });
                  if (otherPresentParticipants.length === 0) {
                    for (const rId of selectedAppointment.residentIds) {
                      await decrementSessionStats(rId, duration, 'resident');
                    }
                  }
                }
              } else if (changes.volunteerId.type === 'external_group') {
                // Handle external group attendance changes
                // If changing from null/absent to present/late, increment resident stats
                if ((prevStatus === null || prevStatus === 'absent') &&
                  (changes.status === 'present' || changes.status === 'late')) {
                  // Only increment resident stats if this is the first present/late participant
                  const otherPresentParticipants = selectedAppointment.volunteerIds.filter(v => {
                    if (v.id === volunteerId) return false; // Skip current volunteer

                    // Check if this volunteer has pending changes
                    const pendingChange = pendingAttendanceChanges[v.id];
                    if (pendingChange) {
                      return pendingChange.status === 'present' || pendingChange.status === 'late';
                    }

                    // If no pending changes, check current attendance
                    return appointmentAttendance.some(a =>
                      a.volunteerId.id === v.id &&
                      (a.status === 'present' || a.status === 'late')
                    );
                  });
                  if (otherPresentParticipants.length === 0) {
                    for (const rId of selectedAppointment.residentIds) {
                      await incrementSessionStats(rId, duration, 'resident');
                    }
                  }
                }
                // If changing from present/late to absent, decrement resident stats
                else if ((prevStatus === 'present' || prevStatus === 'late') &&
                  changes.status === 'absent') {
                  // Only decrement resident stats if this was the last present/late participant
                  const otherPresentParticipants = selectedAppointment.volunteerIds.filter(v => {
                    if (v.id === volunteerId) return false; // Skip current volunteer

                    // Check if this volunteer has pending changes
                    const pendingChange = pendingAttendanceChanges[v.id];
                    if (pendingChange) {
                      return pendingChange.status === 'present' || pendingChange.status === 'late';
                    }

                    // If no pending changes, check current attendance
                    return appointmentAttendance.some(a =>
                      a.volunteerId.id === v.id &&
                      (a.status === 'present' || a.status === 'late')
                    );
                  });
                  if (otherPresentParticipants.length === 0) {
                    for (const rId of selectedAppointment.residentIds) {
                      await decrementSessionStats(rId, duration, 'resident');
                    }
                  }
                }
              }
            }

            // Update totalAttendance stats only for volunteers
            if (changes.volunteerId.type === 'volunteer') {
              if (prevStatus !== changes.status) {
                // Decrement old status, increment new status
                await updateVolunteerAttendanceStats(changes.volunteerId.id, changes.status, prevStatus);
              } else {
                // Only increment if status didn't change
                await updateVolunteerAttendanceStats(changes.volunteerId.id, changes.status);
              }
            }
            return updatePromise;
          }
        } else if (changes.status !== null) {
          // Create new attendance record only if status is not null
          const addPromise = addAttendance({
            appointmentId: selectedAppointment.id,
            volunteerId: changes.volunteerId,
            status: changes.status,
            notes: changes.notes || null,
            confirmedBy: 'manager'
          });

          // For upcoming/inProgress/completed appointments, increment stats when marking present/late
          if ((selectedAppointment.status === 'upcoming' || selectedAppointment.status === 'inProgress' || selectedAppointment.status === 'completed') &&
            (changes.status === 'present' || changes.status === 'late')) {
            if (changes.volunteerId.type === 'volunteer') {
              await incrementSessionStats(changes.volunteerId.id, duration, 'volunteer');
              // Only increment resident stats if this is the first present/late participant
              const otherPresentParticipants = selectedAppointment.volunteerIds.filter(v => {
                if (v.id === volunteerId) return false; // Skip current volunteer

                // Check if this volunteer has pending changes
                const pendingChange = pendingAttendanceChanges[v.id];
                if (pendingChange) {
                  return pendingChange.status === 'present' || pendingChange.status === 'late';
                }

                // If no pending changes, check current attendance
                return appointmentAttendance.some(a =>
                  a.volunteerId.id === v.id &&
                  (a.status === 'present' || a.status === 'late')
                );
              });
              if (otherPresentParticipants.length === 0) {
                for (const rId of selectedAppointment.residentIds) {
                  await incrementSessionStats(rId, duration, 'resident');
                }
              }
            } else if (changes.volunteerId.type === 'external_group') {
              // For external groups, only increment resident stats if this is the first present/late participant
              const otherPresentParticipants = selectedAppointment.volunteerIds.filter(v => {
                if (v.id === volunteerId) return false; // Skip current volunteer

                // Check if this volunteer has pending changes
                const pendingChange = pendingAttendanceChanges[v.id];
                if (pendingChange) {
                  return pendingChange.status === 'present' || pendingChange.status === 'late';
                }

                // If no pending changes, check current attendance
                return appointmentAttendance.some(a =>
                  a.volunteerId.id === v.id &&
                  (a.status === 'present' || a.status === 'late')
                );
              });
              if (otherPresentParticipants.length === 0) {
                for (const rId of selectedAppointment.residentIds) {
                  await incrementSessionStats(rId, duration, 'resident');
                }
              }
            }
          }

          // Update totalAttendance stats only for volunteers
          if (changes.volunteerId.type === 'volunteer') {
            await updateVolunteerAttendanceStats(changes.volunteerId.id, changes.status);
          }
          return addPromise;
        }
      });

      // Wait for all updates to complete
      await Promise.all(updates);

      // Batch processing logic removed to prevent double decrement
      // Individual processing above already handles resident stats correctly

      // Clear pending changes
      setPendingAttendanceChanges({});

      toast({
        title: t('messages.attendanceSaved'),
        description: t('messages.attendanceSavedDescription')
      });

      // Close the dialog
      setIsAttendanceDialogOpen(false);
    } catch (error) {
      console.error('Attendance update error:', error);
      toast({
        title: t('messages.error'),
        description: t('messages.attendanceError'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset pending changes when dialog closes
  useEffect(() => {
    if (!isAttendanceDialogOpen) {
      setPendingAttendanceChanges({});
    }
  }, [isAttendanceDialogOpen]);

  // Get attendance status badge
  const getAttendanceStatusBadge = (volunteerId: string, status: AttendanceStatus | undefined) => {
    // Check for pending changes first
    const pendingStatus = pendingAttendanceChanges[volunteerId]?.status;
    const displayStatus = pendingStatus !== undefined ? pendingStatus : status;

    if (displayStatus === null) {
      return <Badge variant="outline" className="bg-slate-100">Not Marked</Badge>;
    }

    switch (displayStatus) {
      case 'present':
        return <Badge className="bg-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" />Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Absent</Badge>;
      case 'late':
        return <Badge className="bg-amber-500"><Clock2 className="h-3 w-3 mr-1" />Late</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100">Not Marked</Badge>;
    }
  };

  // Helper to check if appointment is for an external group
  const isExternalGroup = selectedAppointment?.volunteerIds.some(v => v.type === 'external_group');
  // Get external group details if present
  const externalGroupDetails = isExternalGroup
    ? externalGroups.find(g => g.id === selectedAppointment.volunteerIds.find(v => v.type === 'external_group')?.id)
    : null;

  // Function to check and update appointment statuses
  const checkAndUpdateAppointmentStatuses = useCallback(async () => {
    if (!appointments.length || !slots.length) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes for easier comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Only run if enough time has passed since last check
    if (now.getTime() - lastStatusCheckRef.current < STATUS_CHECK_INTERVAL) {
      return;
    }

    setIsUpdatingStatuses(true);
    lastStatusCheckRef.current = now.getTime();

    try {
      const updates = appointments
        .filter(appointment => {
          const slot = slots.find(s => s.id === appointment.calendarSlotId);
          if (!slot) return false;

          const appointmentDate = new Date(slot.date);
          const isToday = appointmentDate.toDateString() === today.toDateString();
          const isPast = appointmentDate < today;

          // Convert slot times to minutes for comparison
          const [startHour, startMinute] = slot.startTime.split(':').map(Number);
          const [endHour, endMinute] = slot.endTime.split(':').map(Number);
          const startTimeInMinutes = startHour * 60 + startMinute;
          const endTimeInMinutes = endHour * 60 + endMinute;

          // For past appointments, they should be marked as completed
          if (isPast && appointment.status !== 'completed' && appointment.status !== 'canceled') {
            return true;
          }

          // For today's appointments, check time-based status
          if (isToday) {
            if (appointment.status === 'upcoming' && currentTime >= startTimeInMinutes) {
              return true; // Needs update to 'inProgress'
            }
            if (appointment.status === 'inProgress' && currentTime >= endTimeInMinutes) {
              return true; // Needs update to 'completed'
            }
            if ((appointment.status === 'inProgress' || appointment.status === 'completed') &&
              currentTime < startTimeInMinutes) {
              return true; // Needs update to 'upcoming'
            }
          }

          return false;
        })
        .map(async appointment => {
          const slot = slots.find(s => s.id === appointment.calendarSlotId);
          if (!slot) return;

          const appointmentDate = new Date(slot.date);
          const isToday = appointmentDate.toDateString() === today.toDateString();
          const isPast = appointmentDate < today;

          const [startHour, startMinute] = slot.startTime.split(':').map(Number);
          const [endHour, endMinute] = slot.endTime.split(':').map(Number);
          const startTimeInMinutes = startHour * 60 + startMinute;
          const endTimeInMinutes = endHour * 60 + endMinute;
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const duration = (endHour + endMinute / 60) - (startHour + startMinute / 60);

          let newStatus: AppointmentStatus;
          if (isPast) {
            newStatus = 'completed';
          } else if (currentTime >= endTimeInMinutes) {
            newStatus = 'completed';
          } else if (currentTime >= startTimeInMinutes) {
            newStatus = 'inProgress';
          } else {
            newStatus = 'upcoming';
          }

          // Only update if status is different
          if (newStatus !== appointment.status) {
            await updateAppointment(appointment.id, {
              status: newStatus,
              updatedAt: Timestamp.fromDate(now)
            });

            // Update calendar slot status based on appointment status
            const slotRef = doc(db, 'calendar_slots', appointment.calendarSlotId);
            let slotStatus: 'open' | 'full' | 'canceled';
            let isOpen: boolean;

            if (newStatus === 'completed') {
              slotStatus = 'full';
              isOpen = false;
            } else if (newStatus === 'inProgress') {
              slotStatus = 'full';
              isOpen = false;
            } else if (newStatus === 'upcoming') {
              slotStatus = 'open';
              isOpen = true;
            } else {
              slotStatus = 'open';
              isOpen = true;
            }

            await updateDoc(slotRef, {
              status: slotStatus,
              isOpen: isOpen,
              updatedAt: Timestamp.fromDate(now)
            });

            // Engagement tracking: update appointmentHistory for all participants
            for (const v of appointment.volunteerIds) {
              if (v.type === 'volunteer') {
                await updateAppointmentStatusInHistory(v.id, appointment.id, newStatus, 'volunteer');
              }
            }
            for (const rId of appointment.residentIds) {
              await updateAppointmentStatusInHistory(rId, appointment.id, newStatus, 'resident');
            }

            // Removed automatic attendance creation and stats updates when status changes to completed
          }
        });

      // Wait for all updates to complete
      await Promise.all(updates.filter(Boolean));
    } catch (error) {
      console.error('Error updating appointment statuses:', error);
    } finally {
      setIsUpdatingStatuses(false);
    }
  }, [appointments, slots, updateAppointment]);

  // Run status check when appointments or slots are loaded
  useEffect(() => {
    if (!appointmentsLoading && !slotsLoading) {
      checkAndUpdateAppointmentStatuses();
    }
  }, [appointmentsLoading, slotsLoading, checkAndUpdateAppointmentStatuses]);

  // Set up interval for periodic checks
  useEffect(() => {
    const interval = setInterval(checkAndUpdateAppointmentStatuses, STATUS_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkAndUpdateAppointmentStatuses]);

  // Utility for visually hidden class
  const srOnly = "sr-only";

  // Defensive date formatting helper
  function safeFormat(date: Date | string | undefined, fmt: string) {
    if (!date) return "Unknown Date";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Unknown Date";
    try {
      let result = format(d, fmt, { locale: i18n.language === 'he' ? he : undefined });

      // Remove "יום" prefix from Hebrew dates
      if (i18n.language === 'he' && result.startsWith('יום ')) {
        result = result.substring(4); // Remove "יום " prefix
      }

      return result;
    } catch {
      return "Unknown Date";
    }
  }

  // Update the isLoading variable to be a const
  const isLoading = appointmentsLoading || slotsLoading || groupsLoading || isUpdating || attendanceLoading || isAddingAttendance || isUpdatingAttendance || isMinLoading;

  // Add back the handleDeleteAppointment function
  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      // Find the appointment to get its calendarSlotId
      const appointment = appointments.find(a => a.id === appointmentId);
      // Find the external group associated with this appointment
      const externalGroup = externalGroups.find(g => g.appointmentId === appointmentId);

      // If there's an external group, delete it first
      if (externalGroup) {
        await deleteDoc(doc(db, 'external_groups', externalGroup.id));
      }

      // Delete the associated calendar slot if it exists
      if (appointment && appointment.calendarSlotId) {
        await deleteDoc(doc(db, 'calendar_slots', appointment.calendarSlotId));
      }

      // Then delete the appointment
      await deleteDoc(doc(db, 'appointments', appointmentId));

      // Remove from appointmentHistory if canceled
      if (appointment && appointment.status === 'canceled') {
        for (const v of appointment.volunteerIds) {
          if (v.type === 'volunteer') {
            await removeAppointmentFromHistory(v.id, appointment.id, 'volunteer');
          }
        }
        for (const rId of appointment.residentIds) {
          await removeAppointmentFromHistory(rId, appointment.id, 'resident');
        }
      }

      toast({
        title: t('messages.appointmentDeleted'),
        description: t('messages.appointmentDeletedDescription')
      });

      // Deselect appointment and close dialogs
      setSelectedAppointment(null);
      setIsDetailsDialogOpen(false);
      setIsDeleteDialogOpen(false);

      // Navigate back to the appointments page
      navigate('/manager/appointments');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: t('messages.error'),
        description: t('messages.deleteError'),
        variant: "destructive"
      });
    }
  };

  // Helper to decrement volunteer attendance stat for a given appointment
  const decrementVolunteerAttendanceStat = async (volunteerId: string, appointmentId: string) => {
    // Get attendance record for this volunteer and appointment
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('appointmentId', '==', appointmentId),
      where('volunteerId.id', '==', volunteerId)
    );
    const snapshot = await getDocs(attendanceQuery);
    if (snapshot.empty) return; // No attendance record

    const attendance = snapshot.docs[0].data();
    const status = attendance.status; // "present" | "absent" | "late"

    // Get volunteer doc
    const volunteerRef = doc(db, 'volunteers', volunteerId);
    const volunteerSnap = await getDoc(volunteerRef);
    if (!volunteerSnap.exists()) return;

    const prevAttendance = volunteerSnap.data().totalAttendance || { present: 0, absent: 0, late: 0 };
    if (status && prevAttendance[status] !== undefined) {
      await updateDoc(volunteerRef, {
        totalAttendance: {
          ...prevAttendance,
          [status]: Math.max(0, prevAttendance[status] - 1)
        }
      });
    }
  };

  // Add useEffect for minimum loading duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinLoading(false);
    }, 1000); // Minimum 1 second loading time

    return () => clearTimeout(timer);
  }, []);

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
              <MoreVertical className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Clock className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block whitespace-nowrap">{t('page.title')}</h1>
            </div>
          </div>

          {/* Center section - Empty for balance */}
          <div className="flex-1"></div>

          {/* Right section - Empty for balance */}
          <div className="w-[200px]"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ManagerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
          onLogout={() => {
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
            navigate("/login");
          }}
        />

        {/* Appointments Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                {/* Left section - Filters */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-[680px]">
                    <TabsList className="grid w-full grid-cols-6 bg-slate-100 p-1" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
                      <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">{t('filters.all')}</TabsTrigger>
                      <TabsTrigger value="today" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">{t('filters.today')}</TabsTrigger>
                      <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">{t('filters.upcoming')}</TabsTrigger>
                      <TabsTrigger value="past" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">{t('filters.past')}</TabsTrigger>
                      <TabsTrigger value="canceled" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">{t('filters.canceled')}</TabsTrigger>
                      <TabsTrigger value="specific" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">{t('filters.specificDate')}</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[240px] justify-start text-left font-normal bg-white hover:bg-slate-50 border-slate-300",
                            !dateRange.from && !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarRange className="mr-2 h-4 w-4 text-primary" />
                          {dateRange.from && dateRange.to ? (
                            dateRange.from.toDateString() === dateRange.to.toDateString() ? (
                              format(dateRange.from, "PPP", { locale: i18n.language === 'he' ? he : undefined })
                            ) : (
                              `${format(dateRange.from, "LLL dd, y", { locale: i18n.language === 'he' ? he : undefined })} - ${format(dateRange.to, "LLL dd, y", { locale: i18n.language === 'he' ? he : undefined })}`
                            )
                          ) : (
                            t('filters.pickDateRange')
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="range"
                          selected={dateRange}
                          onSelect={handleDateRangeSelect}
                          initialFocus
                          modifiers={{ today: () => false }}
                          modifiersStyles={{ today: { fontWeight: 'normal' } }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center gap-3">
                  {(dateRange.from || dateRange.to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined });
                        setActiveTab("all");
                      }}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      {t('filters.clearRange')}
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-slate-300">
                        <Download className="h-4 w-4 text-primary" />
                        {t('actions.export')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        {t('actions.exportPdf')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('csv')}>
                        {t('actions.exportCsv')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
              {isLoading ? (
                <AppointmentSkeleton />
              ) : filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-8 text-center">
                  <div className="text-slate-500 mb-4">{t('appointment.noAppointments')}</div>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/manager/calendar")}
                    className="bg-white hover:bg-slate-50 border-slate-300"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    {t('appointment.goToCalendar')}
                  </Button>
                </div>
              ) : (
                filteredAppointments.map(appointment => {
                  const slot = slots.find(s => s.id === appointment.calendarSlotId);
                  const externalGroup = externalGroups.find(g => g.appointmentId === appointment.id);

                  return (
                    <div
                      key={appointment.id}
                      className={cn(
                        "p-6 cursor-pointer transition-all duration-300 relative bg-white rounded-xl shadow-sm border border-slate-300",
                        "hover:shadow-md hover:border-primary/20 group"
                      )}
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsDetailsDialogOpen(true);
                      }}
                    >
                      {/* Flowing Status Bar */}
                      <div
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-2 rounded-l-xl shadow-sm",
                          appointment.status === "upcoming" && "bg-blue-500",
                          appointment.status === "inProgress" && "bg-amber-500",
                          appointment.status === "completed" && "bg-emerald-500",
                          appointment.status === "canceled" && "bg-red-500"
                        )}
                        style={{
                          borderTopLeftRadius: '0.75rem',
                          borderBottomLeftRadius: '0.75rem',
                        }}
                      />

                      <div className="flex justify-between items-center">
                        {/* Left side - Main content */}
                        <div className="space-y-3">
                          {/* Date and Status */}
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-slate-900 text-lg group-hover:text-primary transition-colors duration-300">
                              {slot ? safeFormat(slot.date, 'EEEE, MMMM d, yyyy') : 'Unknown Date'}
                            </div>
                            <Badge className={cn(
                              "capitalize px-3 py-1 text-sm",
                              getStatusBadgeColor(appointment.status)
                            )}>
                              {formatStatus(appointment.status)}
                            </Badge>
                          </div>

                          {/* Metadata */}
                          <div className="text-sm text-slate-500 flex items-center gap-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-primary" />
                              {slot ? `${slot.startTime} - ${slot.endTime}` : 'Unknown Time'}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-primary" />
                              {appointment.volunteerIds.length} {appointment.volunteerIds.length === 1 ? t('appointment.metadata.volunteers') : t('appointment.metadata.volunteersPlural')}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-primary" />
                              {t('appointment.metadata.created')} {safeFormat(appointment.createdAt, 'MMM d, yyyy')}
                            </div>
                            {externalGroup && (
                              <Badge variant="outline" className="bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100 hover:border-blue-600 transition-colors">
                                {t('appointment.metadata.externalGroup')}: {externalGroup.groupName}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(appointment);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <Calendar className="h-4 w-4 text-blue-600" />
                            {t('actions.viewDetails')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(appointment);
                              setIsAttendanceDialogOpen(true);
                            }}
                            disabled={appointment.status !== 'completed'}
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            {t('actions.trackAttendance')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={(open) => {
        setIsDetailsDialogOpen(open);
        if (!open) {
          // Reset all pending changes when dialog closes
          setPendingDetailsChanges({});
          setDetailsTab('details');
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
            <DialogTitle className="text-slate-900">{t('details.title')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('details.description')}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="overflow-y-auto flex-1 px-2 pr-3 pt-4 pb-4">
              <div className="space-y-6">
                {/* Session Details Card (restyled, with mini-cards) */}
                <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900">{t('details.sessionDetails')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-start">
                    {/* Date & Time mini-card */}
                    <div className="bg-white p-2.5 border border-slate-300 shadow-sm rounded-lg md:col-span-4">
                      <div className="flex items-center mb-1">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-slate-500">{t('details.dateTime')}</span>
                      </div>
                      <div className="text-sm text-slate-900 font-medium">
                        {safeFormat(slots.find(s => s.id === selectedAppointment.calendarSlotId)?.date, 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="text-sm text-slate-600">
                        {slots.find(s => s.id === selectedAppointment.calendarSlotId)?.startTime} - {slots.find(s => s.id === selectedAppointment.calendarSlotId)?.endTime}
                      </div>
                    </div>
                    {/* Participants mini-card */}
                    <div className="bg-white p-2.5 border border-slate-300 shadow-sm rounded-lg md:col-span-3">
                      <div className="flex items-center mb-1">
                        <Users className="h-4 w-4 mr-1.5 rtl:ml-1.5 rtl:mr-0 text-indigo-600" />
                        <span className="text-sm font-medium text-slate-500">{t('details.participants')}</span>
                      </div>
                      <div className="text-sm text-slate-900 font-medium">
                        {selectedAppointment.volunteerIds.length} {selectedAppointment.volunteerIds.length === 1 ? t('appointment.metadata.volunteers') : t('appointment.metadata.volunteersPlural')}
                      </div>
                      <div className="text-sm text-slate-600">
                        {selectedAppointment.residentIds.length} {selectedAppointment.residentIds.length === 1 ? t('appointment.metadata.residents') : t('appointment.metadata.residentsPlural')}
                      </div>
                    </div>
                    {/* Current Status select, full width */}
                    <div className="space-y-2 md:col-span-7">
                      <Label className="text-sm font-medium text-slate-700">{t('details.currentStatus')}</Label>
                      <Select
                        value={pendingDetailsChanges.status || selectedAppointment.status}
                        onValueChange={(value: AppointmentStatus) => handleDetailsChange('status', value)}
                      >
                        <SelectTrigger className="bg-white focus:ring-0 focus:ring-offset-0 border border-slate-300" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="upcoming"
                            disabled={!isValidStatusChange(selectedAppointment, 'upcoming')}
                          >
                            {t('appointment.status.upcoming')}
                          </SelectItem>
                          <SelectItem
                            value="inProgress"
                            disabled={!isValidStatusChange(selectedAppointment, 'inProgress')}
                          >
                            {t('appointment.status.inProgress')}
                          </SelectItem>
                          <SelectItem
                            value="completed"
                            disabled={!isValidStatusChange(selectedAppointment, 'completed')}
                          >
                            {t('appointment.status.completed')}
                          </SelectItem>
                          <SelectItem
                            value="canceled"
                            disabled={!isValidStatusChange(selectedAppointment, 'canceled')}
                          >
                            {t('appointment.status.canceled')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* External Group Details Card (restyled) */}
                {isExternalGroup && externalGroupDetails && (
                  <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-slate-900">{t('externalGroup.title')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-300 shadow-sm">
                        <Label className="text-sm font-medium text-slate-700">{t('externalGroup.groupName')}</Label>
                        <div className="text-sm text-slate-900 font-medium">{externalGroupDetails.groupName}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-300 shadow-sm">
                        <Label className="text-sm font-medium text-slate-700">{t('externalGroup.contactPerson')}</Label>
                        <div className="text-sm text-slate-900 font-medium">{externalGroupDetails.contactPerson}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-300 shadow-sm">
                        <Label className="text-sm font-medium text-slate-700">{t('externalGroup.contactPhone')}</Label>
                        <div className="text-sm text-slate-900 font-medium">{externalGroupDetails.contactPhoneNumber}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-300 shadow-sm">
                        <Label className="text-sm font-medium text-slate-700">{t('externalGroup.purposeOfVisit')}</Label>
                        <div className="text-sm text-slate-900 font-medium">{externalGroupDetails.purposeOfVisit}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-300 shadow-sm">
                        <Label className="text-sm font-medium text-slate-700">{t('externalGroup.participants')}</Label>
                        <div className="text-sm text-slate-900 font-medium">{externalGroupDetails.numberOfParticipants}</div>
                      </div>
                      {externalGroupDetails.assignedDepartment && (
                        <div className="bg-white rounded-lg p-2.5 border border-slate-300 shadow-sm">
                          <Label className="text-sm font-medium text-slate-700">{t('externalGroup.department')}</Label>
                          <div className="text-sm text-slate-900 font-medium">{externalGroupDetails.assignedDepartment}</div>
                        </div>
                      )}
                      {externalGroupDetails.activityContent && (
                        <div className="bg-white rounded-lg p-2.5 border border-slate-300 shadow-sm lg:col-span-3 md:col-span-2">
                          <Label className="text-sm font-medium text-slate-700">{t('externalGroup.activity')}</Label>
                          <div className="text-sm text-slate-900 font-medium">{externalGroupDetails.activityContent}</div>
                        </div>
                      )}
                      {externalGroupDetails.notes && (
                        <div className="bg-white rounded-lg p-2.5 border border-slate-300 shadow-sm lg:col-span-3 md:col-span-2">
                          <Label className="text-sm font-medium text-slate-700">{t('externalGroup.notes')}</Label>
                          <div className="text-sm text-slate-900 font-medium">{externalGroupDetails.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes Card (restyled) */}
                <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900">{t('details.notes')}</h3>
                  </div>
                  <div className="relative">
                    <textarea
                      className="w-full min-h-[100px] p-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:ring-offset-0"
                      placeholder={t('details.notesPlaceholder')}
                      value={pendingDetailsChanges.notes !== undefined ? pendingDetailsChanges.notes || '' : (selectedAppointment.notes || '')}
                      onChange={(e) => handleDetailsChange('notes', e.target.value)}
                    />
                  </div>
                </div>

                {/* Timeline Card */}
                <div className="space-y-4 bg-white rounded-lg p-6 border border-slate-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900">{t('details.timeline')}</h3>
                  </div>
                  <div className="text-sm text-slate-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>{t('details.createdOn')}{safeFormat(selectedAppointment.createdAt, 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>{t('details.lastUpdated')}{safeFormat(selectedAppointment.updatedAt, 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                </div>

                {/* Delete Button - Only show for canceled appointments */}
                {selectedAppointment.status === 'canceled' && !pendingDetailsChanges.status && (
                  <div className="pt-4 border-t border-slate-300">
                    <Button
                      variant="destructive"
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-300"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      {t('actions.deleteAppointment')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
            <Button
              onClick={async () => {
                if (!selectedAppointment) return;
                setIsSavingDetails(true);
                try {
                  if (Object.keys(pendingDetailsChanges).length > 0) {
                    const newStatus = pendingDetailsChanges.status || selectedAppointment.status;
                    const newNotes = pendingDetailsChanges.notes !== undefined ? pendingDetailsChanges.notes || '' : selectedAppointment.notes;
                    // Use the robust status change handler
                    await handleStatusChange(selectedAppointment.id, newStatus, newNotes);
                  }
                  // Reset all pending changes
                  setPendingDetailsChanges({});
                } catch (error) {
                  toast({
                    title: t('messages.error'),
                    description: t('messages.saveError'),
                    variant: "destructive"
                  });
                } finally {
                  setIsSavingDetails(false);
                }
              }}
              disabled={isSavingDetails || Object.keys(pendingDetailsChanges).length === 0}
              className="w-[200px] transition-all duration-200 mx-auto"
            >
              {isSavingDetails ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                  {t('actions.saving')}
                </>
              ) : (
                t('actions.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Tracking Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={(open) => {
        setIsAttendanceDialogOpen(open);
        if (!open) {
          // Reset pending changes when dialog closes
          setPendingAttendanceChanges({});
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[83vh] flex flex-col" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b border-slate-300 pb-3" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
            <DialogTitle className="text-slate-900">{t('attendance.title')}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('attendance.description')}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="flex-1 overflow-y-auto">
              {attendanceLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-4 border-primary border-t-transparent inline-block" />
                    <p className="text-sm text-slate-500">{t('attendance.loading')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 px-4 pr-5 pt-4 pb-4">
                  {/* Attendance Summary Row */}
                  {selectedAppointment.volunteerIds.length > 0 && (
                    <div className="flex items-center justify-between mb-2 pb-4 border-b border-slate-300">
                      <span className="text-sm text-slate-600 font-medium">{t('attendance.participantsCount', { count: selectedAppointment.volunteerIds.length })}</span>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse ml-4 rtl:ml-0 rtl:mr-4">
                        <Badge variant="outline" className="bg-emerald-50 border-emerald-400 text-emerald-700 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />{Object.values(pendingAttendanceChanges).filter(a => a.status === 'present').length + appointmentAttendance.filter(a => !pendingAttendanceChanges[a.volunteerId.id] && a.status === 'present').length} {t('attendance.present')}</Badge>
                        <Badge variant="outline" className="bg-amber-50 border-amber-500 text-amber-700 flex items-center"><Clock2 className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />{Object.values(pendingAttendanceChanges).filter(a => a.status === 'late').length + appointmentAttendance.filter(a => !pendingAttendanceChanges[a.volunteerId.id] && a.status === 'late').length} {t('attendance.late')}</Badge>
                        <Badge variant="outline" className="bg-red-50 border-red-400 text-red-700 flex items-center"><XCircle className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />{Object.values(pendingAttendanceChanges).filter(a => a.status === 'absent').length + appointmentAttendance.filter(a => !pendingAttendanceChanges[a.volunteerId.id] && a.status === 'absent').length} {t('attendance.absent')}</Badge>
                      </div>
                    </div>
                  )}

                  {/* Attendance List */}
                  <div className="space-y-4">
                    {selectedAppointment.volunteerIds.map((volunteerId, index) => {
                      const attendance = appointmentAttendance.find(a => a.volunteerId.id === volunteerId.id);
                      const isExternalGroup = volunteerId.type === 'external_group';
                      const group = isExternalGroup ? externalGroups.find(g => g.id === volunteerId.id) : null;
                      const volunteer = !isExternalGroup ? volunteers.find(v => v.id === volunteerId.id) : null;
                      const status = pendingAttendanceChanges[volunteerId.id]?.status !== undefined
                        ? pendingAttendanceChanges[volunteerId.id]?.status
                        : attendance?.status;
                      return (
                        <div
                          key={volunteerId.id}
                          className={cn(
                            "flex flex-col p-4 rounded-xl shadow-sm border border-slate-300 bg-white",
                            index !== selectedAppointment.volunteerIds.length - 1 && "mb-4"
                          )}
                        >
                          <div className="flex items-center">
                            {/* Left: Avatar/Icon */}
                            <div className="flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0">
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center",
                                isExternalGroup ? "bg-blue-100" : "bg-green-100"
                              )}>
                                <Users className={cn(
                                  "h-5 w-5",
                                  isExternalGroup ? "text-blue-700" : "text-green-700"
                                )} />
                              </div>
                            </div>
                            {/* Center: Name/Type */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="font-medium text-slate-900 truncate">
                                {isExternalGroup ? group?.groupName : volunteer?.fullName || volunteerId.id}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {isExternalGroup ? t('attendance.externalGroup') : t('attendance.volunteer')}
                              </div>
                            </div>
                            {/* Right: Status Buttons */}
                            <div className="flex items-center space-x-2 rtl:space-x-reverse ml-4 rtl:ml-0 rtl:mr-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 px-3 rounded-full border-2",
                                  status === 'present'
                                    ? "bg-emerald-100 border-emerald-400 text-emerald-700 hover:bg-emerald-200 hover:border-emerald-500"
                                    : "bg-white border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200"
                                )}
                                onClick={() => handleAttendanceChange(
                                  volunteerId,
                                  status === 'present' ? null : 'present',
                                  pendingAttendanceChanges[volunteerId.id]?.notes || attendance?.notes
                                )}
                                disabled={isAddingAttendance || isUpdatingAttendance}
                              >
                                <CheckCircle2 className="h-4 w-4" />{t('attendance.present')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 px-3 rounded-full border-2",
                                  status === 'late'
                                    ? "bg-amber-100 border-amber-400 text-amber-700 hover:bg-amber-200 hover:border-amber-500"
                                    : "bg-white border-slate-300 text-slate-700 hover:bg-amber-50 hover:border-amber-200"
                                )}
                                onClick={() => handleAttendanceChange(
                                  volunteerId,
                                  status === 'late' ? null : 'late',
                                  pendingAttendanceChanges[volunteerId.id]?.notes || attendance?.notes
                                )}
                                disabled={isAddingAttendance || isUpdatingAttendance}
                              >
                                <Clock2 className="h-4 w-4" />{t('attendance.late')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-8 px-3 rounded-full border-2",
                                  status === 'absent'
                                    ? "bg-red-100 border-red-400 text-red-700 hover:bg-red-200 hover:border-red-500"
                                    : "bg-white border-slate-300 text-slate-700 hover:bg-red-50 hover:border-red-200"
                                )}
                                onClick={() => handleAttendanceChange(
                                  volunteerId,
                                  status === 'absent' ? null : 'absent',
                                  pendingAttendanceChanges[volunteerId.id]?.notes || attendance?.notes
                                )}
                                disabled={isAddingAttendance || isUpdatingAttendance}
                              >
                                <XCircle className="h-4 w-4" />{t('attendance.absent')}
                              </Button>
                            </div>
                          </div>
                          {/* Notes textarea on separate line */}
                          <div className="mt-3">
                            <textarea
                              className="w-full min-h-[60px] p-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-slate-300"
                              placeholder={t('attendance.notesPlaceholder')}
                              value={pendingAttendanceChanges[volunteerId.id]?.notes !== undefined ? pendingAttendanceChanges[volunteerId.id]?.notes || '' : (attendance?.notes || '')}
                              onChange={(e) => handleAttendanceChange(volunteerId, status, e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-slate-300 pt-5 flex justify-center items-center">
            <Button
              onClick={handleSaveAttendance}
              disabled={!hasAttendanceChanges() || isAddingAttendance || isUpdatingAttendance || isSaving || attendanceLoading}
              className="w-[200px] transition-all duration-200 mx-auto"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                  {t('attendance.saving')}
                </>
              ) : (
                t('attendance.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
          <DialogHeader dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
            <DialogTitle>{t('delete.title')}</DialogTitle>
            <DialogDescription>{t('delete.description')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 px-2">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <span className="text-red-600 font-semibold text-base mb-2">
                {t('delete.confirmMessage')}
              </span>
              <span className="text-slate-600 text-sm">
                {isExternalGroup ? t('delete.warningMessageWithGroup') : t('delete.warningMessage')}
              </span>
            </div>
          </div>
          <DialogFooter>
            <div className="w-full flex justify-center">
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!selectedAppointment) return;
                  setIsDeleting(true);
                  await handleDeleteAppointment(selectedAppointment.id);
                  setIsDeleting(false);
                }}
                disabled={isDeleting}
                className="w-[200px] transition-all duration-200 mx-auto"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                    {t('actions.deleting')}
                  </>
                ) : (
                  t('actions.deleteAppointment')
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerAppointments; 