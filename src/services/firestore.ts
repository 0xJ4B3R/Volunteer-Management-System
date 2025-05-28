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

export interface AvailableSlots {
  [dayOfWeek: string]: string[]; // e.g., { "monday": ["morning", "afternoon"] }
}

export interface VolunteerAppointmentEntry {
  appointmentId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm or ISO string
  endTime: string;   // HH:mm or ISO string
  residentIds: string[];
  status?: AppointmentStatus;
  attendanceStatus?: AttendanceStatus;
}

export interface VolunteerAttendanceStats {
  present: number;
  absent: number;
  late: number;
}

export interface Volunteer {
  id: string;
  userId: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'male' | 'female';
  phoneNumber: string;
  skills?: string[];
  hobbies?: string[];
  languages: string[];
  groupAffiliation?: string | null;
  matchingPreference?: MatchingPreference;
  reasonForVolunteering?: ReasonForVolunteering;
  availability?: AvailableSlots;
  appointmentHistory?: VolunteerAppointmentEntry[];
  totalAttendance?: VolunteerAttendanceStats;
  totalSessions?: number;
  totalHours?: number
  isActive: boolean;
  createdAt: Timestamp;
  notes?: string | null;
}

// RESIDENTS
export interface ResidentAppointmentEntry {
  appointmentId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm or ISO string
  endTime: string;   // HH:mm or ISO string
  volunteerIds: ParticipantId[];
  status?: AppointmentStatus;
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
  needs?: string[];
  hobbies?: string[];
  languages: string[];
  cooperationLevel: number;
  availability: AvailableSlots;
  appointmentHistory?: ResidentAppointmentEntry[];
  totalSessions?: number;
  totalHours?: number;
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

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringPattern {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];  // 0-6 for weekly recurrence
  endDate?: string;  // Optional end date
  parentSlotId?: string;  // Reference to the original slot if this is a generated instance
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
  appointmentId?: string | null;
  volunteerRequests: VolunteerRequest[];
  approvedVolunteers: ParticipantId[]; // Updated to use ParticipantId
  status: SlotStatus;
  isOpen: boolean;
  createdAt: Timestamp;
  notes?: string | null;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
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
  name: string;
  description: string;
  type: "weight" | "toggle" | "option";
  value: number | boolean | string;
  defaultValue?: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string; label: string }[];
  impact: "high" | "medium" | "low";
  updatedAt: Timestamp;
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

export const defaultMatchingRules: MatchingRule[] = [
  {
    id: "skills-match",
    name: "Skills Match",
    description: "Importance of matching volunteer skills with resident needs.",
    type: "weight",
    value: 3,
    defaultValue: 3,
    min: 0,
    max: 10,
    step: 1,
    impact: "low",
    updatedAt: Timestamp.now(),
  },
  {
    id: "hobbies-match",
    name: "Hobbies Match",
    description: "Importance of matching hobbies/interests.",
    type: "weight",
    value: 3,
    defaultValue: 3,
    min: 0,
    max: 10,
    step: 1,
    impact: "low",
    updatedAt: Timestamp.now(),
  },
  {
    id: "language-match",
    name: "Language Match",
    description: "Importance of matching languages spoken by volunteer and resident.",
    type: "weight",
    value: 7,
    defaultValue: 7,
    min: 0,
    max: 10,
    step: 1,
    impact: "high",
    updatedAt: Timestamp.now(),
  },
  {
    id: "matching-preference",
    name: "Matching Preference",
    description: "Importance of matching volunteer and resident matching preferences (e.g., one-on-one, group activity, no preference).",
    type: "option",
    value: "noPreference",
    defaultValue: "noPreference",
    options: [
      { value: "oneOnOne", label: "One-on-One" },
      { value: "groupActivity", label: "Group Activity" },
      { value: "noPreference", label: "No Preference" }
    ],
    impact: "medium",
    updatedAt: Timestamp.now(),
  },
  {
    id: "availability-match",
    name: "Availability Match",
    description: "Importance of matching volunteer and resident availability.",
    type: "weight",
    value: 7,
    defaultValue: 7,
    min: 0,
    max: 10,
    step: 1,
    impact: "high",
    updatedAt: Timestamp.now(),
  },
  {
    id: "require-exact-availability",
    name: "Require Exact Availability",
    description: "Require exact time match for volunteer availability.",
    type: "toggle",
    value: true,
    defaultValue: true,
    impact: "high",
    updatedAt: Timestamp.now(),
  },
  {
    id: "gender-match",
    name: "Gender Match",
    description: "Should gender be considered in matching?",
    type: "toggle",
    value: false,
    defaultValue: false,
    impact: "low",
    updatedAt: Timestamp.now(),
  },
  {
    id: "age-proximity",
    name: "Age Proximity",
    description: "Importance of age similarity between volunteer and resident.",
    type: "weight",
    value: 0,
    defaultValue: 0,
    min: 0,
    max: 10,
    step: 1,
    impact: "low",
    updatedAt: Timestamp.now(),
  },
  {
    id: "prioritize-least-visits",
    name: "Prioritize Least Visits",
    description: "Give higher priority to residents who have had the fewest visits recently.",
    type: "weight",
    value: 5,
    defaultValue: 5,
    min: 0,
    max: 10,
    step: 1,
    impact: "medium",
    updatedAt: Timestamp.now(),
  }
]; 