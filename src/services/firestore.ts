import {
  doc,
  Timestamp,
  collection,
  CollectionReference,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// USERS
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: 'manager' | 'volunteer';
  isActive: boolean;
  createdAt: Timestamp;
}

// VOLUNTEERS
export type MatchingPreference = 'oneOnOne' | 'groupActivity' | 'noPreference' | null;
export type ReasonForVolunteering = 'scholarship' | 'communityService' | 'personalInterest' | 'other' | null;

export interface Volunteer {
  id: string;
  userId: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'male' | 'female';
  phoneNumber: string;
  languages: string[];
  skills?: string[];
  hobbies?: string[];
  groupAffiliation?: string | null;
  matchingPreference?: MatchingPreference;
  reasonForVolunteering?: ReasonForVolunteering;
  isActive: boolean;
  createdAt: Timestamp;
  notes?: string | null;
}

// RESIDENTS
export interface MatchedHistoryEntry {
  volunteerId: string;
  appointmentId: string;
  date: string; // YYYY-MM-DD
  feedback?: string;
}
export interface AvailableSlots {
  [dayOfWeek: string]: string[]; // e.g., { "monday": ["morning", "afternoon"] }
}
export interface Resident {
  id: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'male' | 'female';
  dateOfAliyah?: string | null;
  countryOfAliyah?: string | null;
  phoneNumber?: string | null;
  education?: string | null;
  hobbies?: string[];
  languages: string[];
  cooperationLevel: number;
  matchedHistory?: MatchedHistoryEntry[];
  availableSlots: AvailableSlots;
  isActive: boolean;
  createdAt: Timestamp;
  notes?: string | null;
}

// CALENDAR SLOTS
export type SlotPeriod = 'morning' | 'afternoon' | 'evening' | null;
export type SlotStatus = 'open' | 'full' | 'canceled';
export type VolunteerRequestStatus = 'pending' | 'approved' | 'rejected';
export type VolunteerRequestAssignedBy = 'ai' | 'manager';

// New type for participant IDs
export interface ParticipantId {
  id: string;
  type: 'volunteer' | 'external_group';
}

export interface VolunteerRequest {
  volunteerId: string;
  status: VolunteerRequestStatus;
  requestedAt: Timestamp;
  approvedAt?: Timestamp | null;
  rejectedAt?: Timestamp | null;
  rejectedReason?: string | null;
  matchScore?: number | null;
  assignedBy: VolunteerRequestAssignedBy;
}

export interface CalendarSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  period?: SlotPeriod;
  isCustom: boolean;
  customLabel?: string | null;
  residentIds: string[];
  maxCapacity: number;
  volunteerRequests: VolunteerRequest[];
  approvedVolunteers: ParticipantId[]; // Updated to use ParticipantId
  status: SlotStatus;
  appointmentId?: string | null;
  isOpen: boolean;
  notes?: string | null;
  createdAt: Timestamp;
}

// APPOINTMENTS
export type AppointmentStatus = 'upcoming' | 'inProgress' | 'completed' | 'canceled';
export interface Appointment {
  id: string;
  calendarSlotId: string;
  residentIds: string[];
  volunteerIds: ParticipantId[]; // Updated to use ParticipantId
  status: AppointmentStatus;
  updatedAt: Timestamp;
  createdAt: Timestamp;
  notes?: string | null;
}

// ATTENDANCE
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type AttendanceConfirmedBy = 'volunteer' | 'manager';
export interface Attendance {
  id: string;
  appointmentId: string;
  volunteerId: ParticipantId;
  status: AttendanceStatus;
  confirmedBy: AttendanceConfirmedBy;
  confirmedAt: Timestamp;
  notes?: string | null;
}

// MATCHING RULES
export interface MatchingRule {
  id: string;
  languageWeight: number;
  skillWeight?: number;
  hobbyWeight?: number;
  preferenceWeight?: number;
  cooperationWeight?: number;
  recentActivityWeight?: number;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

// REPORTS
export type ReportType = 'attendance' | 'appointments' | 'volunteerHours' | 'custom';
export interface Report {
  id: string;
  type: ReportType;
  filters?: object;
  data: object[];
  generatedBy: string;
  generatedAt: Timestamp;
  description?: string | null;
  exported: boolean;
  exportedAt?: Timestamp | null;
}

// EXTERNAL GROUPS
export interface ExternalGroup {
  id: string;
  appointmentId: string;
  groupName: string;
  contactPerson: string;
  contactPhoneNumber: string;
  purposeOfVisit: string;
  numberOfParticipants: number;
  assignedDepartment?: string;
  activityContent?: string;
  createdAt: Timestamp;
  notes?: string | null;
}

// Collection references (snake_case)
export const usersRef = collection(db, 'users') as CollectionReference<User>;
export const volunteersRef = collection(db, 'volunteers') as CollectionReference<Volunteer>;
export const residentsRef = collection(db, 'residents') as CollectionReference<Resident>;
export const calendar_slotsRef = collection(db, 'calendar_slots') as CollectionReference<CalendarSlot>;
export const appointmentsRef = collection(db, 'appointments') as CollectionReference<Appointment>;
export const attendanceRef = collection(db, 'attendance') as CollectionReference<Attendance>;
export const matching_rulesRef = collection(db, 'matching_rules') as CollectionReference<MatchingRule>;
export const reportsRef = collection(db, 'reports') as CollectionReference<Report>;
export const external_groupsRef = collection(db, 'external_groups') as CollectionReference<ExternalGroup>;

// Helper functions to get document references
export const getUserRef = (id: string) => doc(usersRef, id);
export const getVolunteerRef = (id: string) => doc(volunteersRef, id);
export const getResidentRef = (id: string) => doc(residentsRef, id);
export const getCalendarSlotRef = (id: string) => doc(calendar_slotsRef, id);
export const getAppointmentRef = (id: string) => doc(appointmentsRef, id);
export const getAttendanceRef = (id: string) => doc(attendanceRef, id);
export const getMatchingRuleRef = (id: string) => doc(matching_rulesRef, id);
export const getReportRef = (id: string) => doc(reportsRef, id);
export const getExternalGroupRef = (id: string) => doc(external_groupsRef, id);

// Helper function to convert Firestore document to typed object
export const docToObject = <T>(doc: QueryDocumentSnapshot): T => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  } as T;
}; 