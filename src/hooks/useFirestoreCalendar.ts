import { useEffect, useState } from 'react';
import { onSnapshot, QuerySnapshot, Timestamp, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
  calendar_slotsRef, CalendarSlot, VolunteerRequest,
  appointmentsRef, Appointment,
  external_groupsRef, ExternalGroup,
  ParticipantId,
  RecurringPattern
} from '@/services/firestore';

/**
 * UI-friendly types (all Timestamps as ISO strings, all optionals present)
 */
export interface CalendarSlotUI extends Omit<CalendarSlot, 'createdAt' | 'volunteerRequests' | 'approvedVolunteers' | 'recurringPattern'> {
  createdAt: string;
  volunteerRequests: VolunteerRequestUI[];
  approvedVolunteers: ParticipantId[];
  recurringPattern?: RecurringPattern;
}
export interface VolunteerRequestUI extends Omit<VolunteerRequest, 'requestedAt' | 'approvedAt' | 'rejectedAt'> {
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  matchScore: number | null;
  assignedResidentId: string | null;
}
export interface AppointmentUI extends Omit<Appointment, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}
export interface ExternalGroupUI extends Omit<ExternalGroup, 'createdAt'> {
  createdAt: string;
}

/** Timestamp conversion helper */
function convertTimestamp(ts: any): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (ts.toDate) return ts.toDate().toISOString();
  return '';
}

/** Entity conversion helpers */
function ensureVolunteerRequestUI(vr: any): VolunteerRequestUI {
  return {
    volunteerId: vr.volunteerId || '',
    status: vr.status || 'pending',
    requestedAt: convertTimestamp(vr.requestedAt),
    approvedAt: vr.approvedAt ? convertTimestamp(vr.approvedAt) : null,
    rejectedAt: vr.rejectedAt ? convertTimestamp(vr.rejectedAt) : null,
    rejectedReason: vr.rejectedReason ?? null,
    matchScore: vr.matchScore ?? null,
    assignedResidentId: vr.assignedResidentId ?? null,
    assignedBy: vr.assignedBy || 'manager'
  };
}
function ensureSlotShape(raw: any): CalendarSlotUI {
  const volunteerRequests: VolunteerRequestUI[] = (raw.volunteerRequests || []).map(ensureVolunteerRequestUI);
  return {
    id: raw.id,
    date: raw.date || '',
    startTime: raw.startTime || '',
    endTime: raw.endTime || '',
    period: raw.period ?? null,
    isCustom: !!raw.isCustom,
    customLabel: raw.customLabel ?? null,
    sessionCategory: raw.sessionCategory ?? null,
    residentIds: raw.residentIds || [],
    maxCapacity: raw.maxCapacity ?? 1,
    volunteerRequests,
    status: raw.status || 'open',
    appointmentId: raw.appointmentId ?? null,
    isOpen: typeof raw.isOpen === 'boolean' ? raw.isOpen : true,
    notes: raw.notes ?? null,
    createdAt: convertTimestamp(raw.createdAt),
    approvedVolunteers: raw.approvedVolunteers || [],
    isRecurring: !!raw.isRecurring,
    recurringPattern: raw.recurringPattern ?? undefined
  };
}
function ensureAppointmentUI(raw: any): AppointmentUI {
  return {
    ...raw,
    createdAt: convertTimestamp(raw.createdAt),
    updatedAt: convertTimestamp(raw.updatedAt),
  };
}
function ensureExternalGroupUI(raw: any): ExternalGroupUI {
  return {
    ...raw,
    createdAt: convertTimestamp(raw.createdAt),
  };
}

/**
 * Convert Firestore data to UI format
 */
function toUIFormat(data: CalendarSlot & { id: string }): CalendarSlotUI {
  return {
    ...data,
    createdAt: data.createdAt.toDate().toISOString(),
    volunteerRequests: data.volunteerRequests.map(v => ({
      ...v,
      requestedAt: v.requestedAt.toDate().toISOString(),
      approvedAt: v.approvedAt?.toDate().toISOString() || null,
      rejectedAt: v.rejectedAt?.toDate().toISOString() || null,
      rejectedReason: v.rejectedReason || null,
      matchScore: v.matchScore || null,
      assignedResidentId: v.assignedResidentId || null,
      assignedBy: v.assignedBy || 'manager'
    })),
    ...(data.recurringPattern ? { recurringPattern: data.recurringPattern } : {})
  };
}

/**
 * Convert UI data to Firestore format
 */
export function toFirestoreFormat(data: Partial<CalendarSlotUI>): Partial<CalendarSlot> {
  const { createdAt, volunteerRequests, recurringPattern, ...rest } = data;
  const result: Partial<CalendarSlot> = { ...rest };

  // Convert createdAt if present
  if (createdAt) {
    result.createdAt = Timestamp.fromDate(new Date(createdAt));
  }

  // Convert volunteerRequests if present
  if (volunteerRequests) {
    result.volunteerRequests = volunteerRequests.map(v => {
      const { requestedAt, approvedAt, rejectedAt, ...restV } = v;
      return {
        ...restV,
        requestedAt: Timestamp.fromDate(new Date(requestedAt)),
        approvedAt: approvedAt ? Timestamp.fromDate(new Date(approvedAt)) : null,
        rejectedAt: rejectedAt ? Timestamp.fromDate(new Date(rejectedAt)) : null
      } as VolunteerRequest;
    });
  }

  // Add recurringPattern if present
  if (recurringPattern) {
    result.recurringPattern = recurringPattern;
  }

  return result;
}

/**
 * Real-time hook for all calendar slots (live updates from Firestore)
 */
export interface UseCalendarSlotsResult {
  slots: CalendarSlotUI[];
  loading: boolean;
  error: Error | null;
}
export function useCalendarSlots(): UseCalendarSlotsResult {
  const [slots, setSlots] = useState<CalendarSlotUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      calendar_slotsRef,
      (snapshot: QuerySnapshot) => {
        const data: CalendarSlotUI[] = snapshot.docs.map(doc => {
          return ensureSlotShape({ id: doc.id, ...doc.data() });
        });
        setSlots(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);
  return { slots, loading, error };
}

/**
 * Real-time hook for all appointments (live updates from Firestore)
 */
export function useAppointments() {
  const [appointments, setAppointments] = useState<AppointmentUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(appointmentsRef, (snapshot: QuerySnapshot) => {
      setAppointments(snapshot.docs.map(doc => ensureAppointmentUI({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, err => { setError(err); setLoading(false); });
    return () => unsubscribe();
  }, []);
  return { appointments, loading, error };
}

/**
 * Real-time hook for all external groups (live updates from Firestore)
 */
export function useExternalGroups() {
  const [externalGroups, setExternalGroups] = useState<ExternalGroupUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(external_groupsRef, (snapshot: QuerySnapshot) => {
      setExternalGroups(snapshot.docs.map(doc => ensureExternalGroupUI({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, err => { setError(err); setLoading(false); });
    return () => unsubscribe();
  }, []);
  return { externalGroups, loading, error };
}

/**
 * Add a new calendar slot
 */
export function useAddCalendarSlot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const addCalendarSlot = async (slot: Omit<CalendarSlot, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(calendar_slotsRef, slot);
      return docRef.id;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  return { addCalendarSlot, loading, error };
}

/**
 * Update a calendar slot by ID
 */
export function useUpdateCalendarSlot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const updateCalendarSlot = async (id: string, data: Partial<CalendarSlotUI>) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(calendar_slotsRef, id);
      const firestoreData = toFirestoreFormat(data);
      await updateDoc(ref, firestoreData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  return { updateCalendarSlot, loading, error };
}

/**
 * Delete a calendar slot by ID
 */
export function useDeleteCalendarSlot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const deleteCalendarSlot = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(calendar_slotsRef, id);
      await deleteDoc(ref);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  return { deleteCalendarSlot, loading, error };
}

/**
 * Add a new appointment
 */
export function useAddAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(appointmentsRef, appointment);
      return docRef.id;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  return { addAppointment, loading, error };
}

/**
 * Update an appointment by ID
 */
export function useUpdateAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(appointmentsRef, id);
      await updateDoc(ref, data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  return { updateAppointment, loading, error };
}

/**
 * Delete an appointment by ID
 */
export function useDeleteAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const deleteAppointment = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(appointmentsRef, id);
      await deleteDoc(ref);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  return { deleteAppointment, loading, error };
}

/**
 * Add a new external group
 */
export function useAddExternalGroup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const addExternalGroup = async (group: Omit<ExternalGroup, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(external_groupsRef, group);
      return docRef.id;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  return { addExternalGroup, loading, error };
}

/**
 * Update an external group by ID
 */
export function useUpdateExternalGroup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const updateExternalGroup = async (id: string, data: Partial<ExternalGroup>) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(external_groupsRef, id);
      await updateDoc(ref, data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  return { updateExternalGroup, loading, error };
}

/**
 * Delete an external group by ID
 */
export function useDeleteExternalGroup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const deleteExternalGroup = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(external_groupsRef, id);
      await deleteDoc(ref);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  return { deleteExternalGroup, loading, error };
} 