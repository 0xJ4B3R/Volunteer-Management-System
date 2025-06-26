import { useState, useEffect } from 'react';
import { onSnapshot, QuerySnapshot, Timestamp, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { attendanceRef, Attendance, AttendanceStatus, AttendanceConfirmedBy } from '@/services/firestore';

/**
 * UI-friendly types (all Timestamps as ISO strings)
 */
export interface AttendanceUI extends Omit<Attendance, 'confirmedAt'> {
  confirmedAt: string;
}

/**
 * Convert Firestore data to UI format
 */
function toUIFormat(data: Attendance): AttendanceUI {
  return {
    ...data,
    confirmedAt: data.confirmedAt.toDate().toISOString(),
  };
}

/**
 * Convert UI data to Firestore format
 */
function toFirestoreFormat(data: Partial<AttendanceUI>): Partial<Attendance> {
  const { confirmedAt, ...rest } = data;
  const result: Partial<Attendance> = { ...rest };

  if (confirmedAt) {
    result.confirmedAt = Timestamp.fromDate(new Date(confirmedAt));
  }

  return result;
}

/**
 * Real-time hook for all attendance records (live updates from Firestore)
 */
export function useAttendance() {
  const [attendance, setAttendance] = useState<AttendanceUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      attendanceRef,
      (snapshot: QuerySnapshot) => {
        const data: AttendanceUI[] = snapshot.docs.map(doc => {
          const attendanceData = doc.data() as Attendance;
          return toUIFormat({ ...attendanceData, id: doc.id });
        });
        setAttendance(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { attendance, loading, error };
}

/**
 * Hook for querying attendance records by appointment ID
 */
export function useAttendanceByAppointment(appointmentId: string) {
  const [attendance, setAttendance] = useState<AttendanceUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!appointmentId) {
      setAttendance([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(attendanceRef, where('appointmentId', '==', appointmentId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const data: AttendanceUI[] = snapshot.docs.map(doc => {
          const attendanceData = doc.data() as Attendance;
          return toUIFormat({ ...attendanceData, id: doc.id });
        });
        setAttendance(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [appointmentId]);

  return { attendance, loading, error };
}

/**
 * Hook for querying attendance records by volunteer ID
 */
export function useAttendanceByVolunteer(volunteerId: string) {
  const [attendance, setAttendance] = useState<AttendanceUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!volunteerId) {
      setAttendance([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(attendanceRef, where('volunteerId', '==', volunteerId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const data: AttendanceUI[] = snapshot.docs.map(doc => {
          const attendanceData = doc.data() as Attendance;
          return toUIFormat({ ...attendanceData, id: doc.id });
        });
        setAttendance(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [volunteerId]);

  return { attendance, loading, error };
}

/**
 * Add a new attendance record
 */
export function useAddAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addAttendance = async (data: Omit<Attendance, 'id' | 'confirmedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const attendanceData: Omit<Attendance, 'id'> = {
        ...data,
        confirmedAt: Timestamp.now(),
      };
      const docRef = await addDoc(attendanceRef, attendanceData);
      return docRef.id;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { addAttendance, loading, error };
}

/**
 * Update an attendance record
 */
export function useUpdateAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateAttendance = async (id: string, data: Partial<AttendanceUI>) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(attendanceRef, id);
      const firestoreData = toFirestoreFormat(data);
      await updateDoc(ref, firestoreData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { updateAttendance, loading, error };
}

/**
 * Delete an attendance record
 */
export function useDeleteAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteAttendance = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(attendanceRef, id);
      await deleteDoc(ref);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { deleteAttendance, loading, error };
} 