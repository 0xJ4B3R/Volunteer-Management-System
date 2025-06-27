import { useEffect, useState } from 'react';
import { onSnapshot, QuerySnapshot, Timestamp, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { volunteersRef, Volunteer, AvailableSlots, VolunteerAppointmentEntry, VolunteerAttendanceStats, MatchingPreference, ReasonForVolunteering } from '@/services/firestore';

/**
 * UI-friendly Volunteer type (timestamps as ISO strings)
 */
export interface VolunteerUI {
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
  availability?: AvailableSlots; // Use the type from firestore.ts
  appointmentHistory?: VolunteerAppointmentEntry[]; // Use the type from firestore.ts
  totalAttendance?: VolunteerAttendanceStats; // Use the type from firestore.ts
  totalSessions?: number; // Use the type from firestore.ts
  totalHours?: number; // Use the type from firestore.ts
  isActive: boolean;
  createdAt: string; // Converted to string for UI
  notes?: string | null;
}

/**
 * Convert Firestore Volunteer to UI-friendly VolunteerUI
 */
export function ensureVolunteerShape(raw: any): VolunteerUI {
  return {
    ...raw,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate().toISOString() : (raw.createdAt || new Date().toISOString()),
    birthDate: raw.birthDate || '', // Assuming birthDate is also stored as Timestamp or needs default
    fullName: raw.fullName || '',
    gender: raw.gender || 'male', // Assuming a default gender
    phoneNumber: raw.phoneNumber || '',
    languages: raw.languages || [],
    isActive: raw.isActive === undefined ? true : raw.isActive, // Default to true if undefined
    userId: raw.userId || '',

    // Handle optional fields from firestore.ts, ensuring they match types or are null/undefined
    skills: raw.skills || [],
    hobbies: raw.hobbies || [],
    groupAffiliation: raw.groupAffiliation === undefined ? null : raw.groupAffiliation,
    matchingPreference: raw.matchingPreference === undefined ? null : raw.matchingPreference,
    reasonForVolunteering: raw.reasonForVolunteering === undefined ? null : raw.reasonForVolunteering,
    availability: raw.availability || {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    }, // Default to empty availability object
    appointmentHistory: raw.appointmentHistory || [],
    totalAttendance: raw.totalAttendance || { present: 0, absent: 0, late: 0 }, // Default stats
    totalSessions: raw.totalSessions || 0,
    totalHours: raw.totalHours || 0,
    notes: raw.notes === undefined ? null : raw.notes,
    id: raw.id || '', // Ensure id is always present
  };
}

/**
 * Return type for real-time volunteer hooks
 */
export interface UseVolunteersResult {
  volunteers: VolunteerUI[];
  loading: boolean;
  error: Error | null;
}

/**
 * Return type for CRUD volunteer hooks
 */
export interface UseVolunteerMutationResult {
  loading: boolean;
  error: Error | null;
}

/**
 * Real-time hook for all volunteers (live updates from Firestore)
 */
export function useVolunteers(): UseVolunteersResult {
  const [volunteers, setVolunteers] = useState<VolunteerUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      volunteersRef,
      (snapshot: QuerySnapshot) => {
        const data: VolunteerUI[] = snapshot.docs.map(doc =>
          ensureVolunteerShape({ id: doc.id, ...doc.data() })
        );
        console.log('Loaded volunteers:', data);
        setVolunteers(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { volunteers, loading, error };
}

/**
 * Add a new volunteer
 */
export function useAddVolunteer(): UseVolunteerMutationResult & { addVolunteer: (volunteer: Omit<Volunteer, 'id'>) => Promise<void> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addVolunteer = async (volunteer: Omit<Volunteer, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      await addDoc(volunteersRef, volunteer);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { addVolunteer, loading, error };
}

/**
 * Update a volunteer by ID
 */
export function useUpdateVolunteer(): UseVolunteerMutationResult & { updateVolunteer: (id: string, data: Partial<Volunteer>) => Promise<void> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateVolunteer = async (id: string, data: Partial<Volunteer>) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(volunteersRef, id);
      await updateDoc(ref, data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { updateVolunteer, loading, error };
}

/**
 * Delete a volunteer by ID
 */
export function useDeleteVolunteer(): UseVolunteerMutationResult & { deleteVolunteer: (id: string) => Promise<void> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteVolunteer = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(volunteersRef, id);
      await deleteDoc(ref);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { deleteVolunteer, loading, error };
} 