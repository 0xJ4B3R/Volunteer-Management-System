import { collection, query, where, getDocs, Timestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Report,
  ReportType,
  ReportSubject,
  ReportScope,
  AppointmentEntry,
  SubjectReport,
  Appointment,
  CalendarSlot,
  Volunteer,
  Resident,
  getVolunteerRef,
  getResidentRef,
  VolunteerAppointmentEntry,
  ResidentAppointmentEntry,
  Attendance,
  attendanceRef
} from './firestore';

// Types
interface AppointmentReport {
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  status: 'present' | 'late' | 'absent' | 'canceled' | 'missing';
}

// Helper function to generate a unique ID
const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Helper function to calculate hours between two times
const calculateHours = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  return (endTotalMinutes - startTotalMinutes) / 60;
};

// Helper function to get actual attendance status from attendance collection
const getAttendanceStatus = async (appointmentId: string, participantId: string, participantType: 'volunteer' | 'external_group'): Promise<'present' | 'late' | 'absent' | 'canceled' | 'missing'> => {
  try {
    const attendanceQuery = query(
      attendanceRef,
      where('appointmentId', '==', appointmentId),
      where('volunteerId.id', '==', participantId),
      where('volunteerId.type', '==', participantType)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    if (attendanceSnapshot.empty) {
      return 'missing'; // Mark as missing if no attendance record exists for completed appointments
    }
    
    const attendanceRecord = attendanceSnapshot.docs[0].data() as Attendance;
    return attendanceRecord.status;
  } catch (error) {
    console.error('Error fetching attendance status:', error);
    return 'missing'; // Default to missing on error
  }
};

// Helper function to check if any volunteer was present for an appointment (for resident attendance)
const hasAnyVolunteerPresent = async (appointmentId: string): Promise<boolean> => {
  try {
    const attendanceQuery = query(
      attendanceRef,
      where('appointmentId', '==', appointmentId),
      where('volunteerId.type', 'in', ['volunteer', 'external_group'])
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    // Check if any attendance record has 'present' or 'late' status
    const hasPresent = attendanceSnapshot.docs.some(doc => {
      const attendanceRecord = doc.data() as Attendance;
      return attendanceRecord.status === 'present' || attendanceRecord.status === 'late';
    });
    
    return hasPresent;
  } catch (error) {
    console.error('Error checking volunteer attendance:', error);
    return false; // Default to false on error
  }
};

// Helper function to fetch appointments for a subject
const fetchAppointmentsForSubject = async (
  subjectId: string,
  subjectType: ReportSubject,
  startDate: string,
  endDate: string
): Promise<AppointmentEntry[]> => {
  const startTimestamp = Timestamp.fromDate(new Date(startDate));
  const endTimestamp = Timestamp.fromDate(new Date(endDate));

  let appointmentHistory: (VolunteerAppointmentEntry | ResidentAppointmentEntry)[] = [];

  if (subjectType === 'volunteer') {
    const volunteerDoc = await getDoc(getVolunteerRef(subjectId));
    if (volunteerDoc.exists()) {
      const volunteer = volunteerDoc.data() as Volunteer;
      appointmentHistory = volunteer.appointmentHistory || [];
    }
  } else if (subjectType === 'resident') {
    const residentDoc = await getDoc(getResidentRef(subjectId));
    if (residentDoc.exists()) {
      const resident = residentDoc.data() as Resident;
      appointmentHistory = resident.appointmentHistory || [];
    }
  } else if (subjectType === 'external_group') {
    // For external groups, we need to query the appointments collection
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('volunteerIds', 'array-contains', { id: subjectId, type: 'external_group' })
      // Remove status filter to include all appointments (upcoming, canceled, completed, inProgress)
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments: AppointmentEntry[] = [];

    // Process each appointment
    for (const docSnapshot of appointmentsSnapshot.docs) {
      const appointment = docSnapshot.data() as Appointment;
      const appointmentId = docSnapshot.id; // Get the document ID as the appointment ID

      // Get the calendar slot for this appointment
      const slotDoc = await getDoc(doc(db, 'calendar_slots', appointment.calendarSlotId));
      if (slotDoc.exists()) {
        const slot = slotDoc.data() as CalendarSlot;
        const appointmentDate = new Date(slot.date);

        // Check if the appointment is within the date range and exclude upcoming appointments
        if (appointmentDate >= new Date(startDate) && appointmentDate <= new Date(endDate)) {
          // Exclude upcoming appointments entirely from reports
          if (appointment.status === 'upcoming') {
            continue; // Skip this appointment
          }
          
          // Check appointment status first
          let attendanceStatus: 'present' | 'late' | 'absent' | 'canceled' | 'missing' = 'canceled';
          
          if (appointment.status === 'canceled') {
            // For canceled appointments, show "canceled"
            attendanceStatus = 'canceled';
          } else if (appointment.status === 'completed' || appointment.status === 'inProgress') {
            // Only check attendance for completed or in-progress appointments
            attendanceStatus = await getAttendanceStatus(appointmentId, subjectId, 'external_group');
          }
          
          appointments.push({
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            hours: calculateHours(slot.startTime, slot.endTime),
            status: attendanceStatus
          });
        }
      }
    }

    return appointments;
  }

  // Filter appointments by date range and exclude upcoming appointments
  const filteredAppointments = appointmentHistory.filter(entry => {
    const entryDate = new Date(entry.date);
    const appointmentStatus = (entry as any).status;
    
    // Exclude upcoming appointments entirely from reports
    if (appointmentStatus === 'upcoming') {
      return false;
    }
    
    return entryDate >= startTimestamp.toDate() && entryDate <= endTimestamp.toDate();
  });

  // Process appointments and get actual attendance status
  const appointments: AppointmentEntry[] = [];
  for (const entry of filteredAppointments) {
    // Calculate hours
    const start = new Date(`${entry.date}T${entry.startTime}`);
    const end = new Date(`${entry.date}T${entry.endTime}`);
    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Check appointment status first - if upcoming or canceled, don't check attendance
    const appointmentStatus = (entry as any).status || (entry as any).appointmentStatus || 'unknown'; // Get appointment status from entry
    let status: 'present' | 'late' | 'absent' | 'canceled' | 'missing' = 'canceled';
    
    if (appointmentStatus === 'canceled') {
      // For canceled appointments, skip them entirely for residents
      if (subjectType === 'resident') {
        continue;
      }
      // For other types, show "canceled" status and set hours to 0
      status = 'canceled';
      hours = 0;
    } else if (appointmentStatus === 'completed') {
      // Only check attendance for completed appointments
      if (subjectType === 'volunteer') {
        // For volunteers, get actual attendance status from attendance collection
        status = await getAttendanceStatus(entry.appointmentId, subjectId, 'volunteer');
        // Set hours to 0 for missing appointments
        if (status === 'missing') {
          hours = 0;
        }
      } else if (subjectType === 'resident') {
        // For residents, they're considered present only if any volunteer was present or late for that appointment
        const anyVolunteerPresent = await hasAnyVolunteerPresent(entry.appointmentId);
        // Only include the appointment if a volunteer was present
        if (!anyVolunteerPresent) {
          continue; // Skip this appointment if no volunteer was present
        }
        // For residents, mark as present since a volunteer was present
        status = 'present';
      }
    } else {
      // For any other status (like 'inProgress' or others), skip the appointment for residents
      if (subjectType === 'resident') {
        continue;
      }
      // For other types, you might want to handle them, but for now, we can default to canceled or skip
      status = 'canceled'; // Or simply `continue;`
      hours = 0;
    }

    appointments.push({
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      hours,
      status
    });
  }

  return appointments;
};

// Helper function to calculate subject summary
const calculateSubjectSummary = (appointments: AppointmentEntry[], subjectType: ReportSubject) => {
  // Filter out missing and canceled appointments for summary calculations
  const validAppointments = appointments.filter(apt => apt.status !== 'missing' && apt.status !== 'canceled');
  
  const summary = {
    totalAppointments: validAppointments.length,
    totalHours: validAppointments.reduce((sum, apt) => sum + apt.hours, 0)
  };

  // Only include attendance metrics for non-resident reports
  if (subjectType !== 'resident') {
    return {
      ...summary,
      present: appointments.filter(apt => apt.status === 'present').length,
      late: appointments.filter(apt => apt.status === 'late').length,
      absent: appointments.filter(apt => apt.status === 'absent').length,
      missing: appointments.filter(apt => apt.status === 'missing').length
      // Note: appointments with "canceled" status are not counted in attendance statistics
    };
  }

  return summary;
};

// Main report generation function
export const generateReport = async (
  type: ReportType,
  startDate: string,
  endDate: string,
  userId: string,
  subjectId?: string
): Promise<Report> => {
  // Get the subject type and scope from the report type
  const lastUnderscoreIndex = type.lastIndexOf('_');
  const subject = type.substring(0, lastUnderscoreIndex) as ReportSubject;
  const scope = type.substring(lastUnderscoreIndex + 1) as ReportScope;

  // Fetch subjects based on type
  let subjectsQuery;
  try {
    switch (subject) {
      case 'volunteer':
        subjectsQuery = query(collection(db, 'volunteers'));
        break;
      case 'resident':
        subjectsQuery = query(collection(db, 'residents'));
        break;
      case 'external_group':
        subjectsQuery = query(collection(db, 'external_groups'));
        break;
      default:
        throw new Error(`Invalid subject type: ${subject}`);
    }

    // For individual reports, filter for the specific subject
    if (scope === 'individual' && subjectId) {
      subjectsQuery = query(subjectsQuery, where('__name__', '==', subjectId));
    }

    const subjectsSnapshot = await getDocs(subjectsQuery);

    const subjects: SubjectReport[] = [];

    // Process each subject
    for (const docSnapshot of subjectsSnapshot.docs) {
      const subjectData = docSnapshot.data() as {
        fullName?: string;
        groupName?: string;
        contactPerson?: string;
        contactPhoneNumber?: string;
        purposeOfVisit?: string;
        numberOfParticipants?: number;
        assignedDepartment?: string;
        activityContent?: string;
      };

      const appointments = await fetchAppointmentsForSubject(
        docSnapshot.id,
        subject,
        startDate,
        endDate
      );

      // Only include subjects that have appointments
      if (appointments.length > 0) {
        const subjectReport = {
          name: subject === 'external_group'
            ? `${subjectData.groupName || 'Unknown Group'}\n-----------------------\nContact Person: ${subjectData.contactPerson || 'N/A'}\nContact Phone: ${subjectData.contactPhoneNumber || 'N/A'}\nPurpose Of Visit: ${subjectData.purposeOfVisit || 'N/A'}\nNumber Of Participants: ${subjectData.numberOfParticipants || 0}\nAssigned Department: ${subjectData.assignedDepartment || 'N/A'}\nActivity Content: ${subjectData.activityContent || 'N/A'}`
            : subjectData.fullName || 'Unknown',
          summary: calculateSubjectSummary(appointments, subject),
          appointments
        };
        subjects.push(subjectReport);
      }
    }

    // Calculate unique sessions (appointments that occurred at the same date/time are the same session)
    const uniqueSessions = new Set<string>();
    subjects.forEach(subject => {
      subject.appointments.forEach(appointment => {
        // Only count sessions that are not missing or canceled
        if (appointment.status !== 'missing' && appointment.status !== 'canceled') {
          const sessionKey = `${appointment.date}_${appointment.startTime}_${appointment.endTime}`;
          uniqueSessions.add(sessionKey);
        }
      });
    });
    
    // Calculate total appointments excluding missing and canceled
    const totalAppointments = subjects.reduce((sum, sub) => {
      const validAppointments = sub.appointments.filter(apt => apt.status !== 'missing' && apt.status !== 'canceled');
      return sum + validAppointments.length;
    }, 0);


    // Create report object
    const report: Report = {
      id: generateId(),
      type,
      filters: {
        startDate,
        endDate,
        subjectId: scope === 'individual' ? subjectId : null
      },
      data: {
        summary: {
          totalSubjects: subjects.length,
          totalSessions: uniqueSessions.size, // Use unique sessions count instead of total appointments
          totalAppointments: totalAppointments,
          totalHours: subjects.reduce((sum, sub) => sum + (sub.summary?.totalHours || 0), 0),
          ...(subject !== 'resident' && {
            present: subjects.reduce((sum, sub) => sum + (sub.summary?.present || 0), 0),
            late: subjects.reduce((sum, sub) => sum + (sub.summary?.late || 0), 0),
            absent: subjects.reduce((sum, sub) => sum + (sub.summary?.absent || 0), 0),
            missing: subjects.reduce((sum, sub) => sum + (sub.summary?.missing || 0), 0)
          })
        },
        subjects
      },
      generatedBy: userId,
      generatedAt: Timestamp.now(),
      description: '', // This will be set by the caller
      exported: false
    };

    // Save report to Firestore
    const reportRef = doc(collection(db, 'reports'), report.id);
    await setDoc(reportRef, report);

    return report;
  } catch (error) {
    console.error('Error in generateReport:', error);
    throw error;
  }
};

// Function to get all reports
export const getReports = async (): Promise<Report[]> => {
  const reportsQuery = query(collection(db, 'reports'));
  const snapshot = await getDocs(reportsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
};

// Function to get a report by ID
export const getReportById = async (id: string): Promise<Report | null> => {
  const reportDoc = await getDoc(doc(db, 'reports', id));
  if (!reportDoc.exists()) {
    return null;
  }
  return { id: reportDoc.id, ...reportDoc.data() } as Report;
}; 