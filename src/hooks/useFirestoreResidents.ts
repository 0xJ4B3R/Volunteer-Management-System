import { useEffect, useState } from 'react';
import { onSnapshot, QuerySnapshot, Timestamp, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { residentsRef, Resident } from '@/services/firestore';

/**
 * UI-friendly Resident type (timestamps as ISO strings)
 */
export interface ResidentUI extends Omit<Resident, 'createdAt'> {
  createdAt: string;
}

/**
 * Convert Firestore Resident to UI-friendly ResidentUI
 */
export function ensureResidentShape(raw: any): ResidentUI {
  return {
    ...raw,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate().toISOString() : (raw.createdAt || ''),
  };
}

/**
 * Return type for real-time resident hooks
 */
export interface UseResidentsResult {
  residents: ResidentUI[];
  loading: boolean;
  error: Error | null;
}

/**
 * Return type for CRUD resident hooks
 */
export interface UseResidentMutationResult {
  loading: boolean;
  error: Error | null;
}

/**
 * Real-time hook for all residents (live updates from Firestore)
 */
export function useResidents(): UseResidentsResult {
  const [residents, setResidents] = useState<ResidentUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      residentsRef,
      (snapshot: QuerySnapshot) => {
        const data: ResidentUI[] = snapshot.docs.map(doc => 
          ensureResidentShape({ id: doc.id, ...doc.data() })
        );
        setResidents(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { residents, loading, error };
}

/**
 * Add a new resident
 */
export function useAddResident(): UseResidentMutationResult & { addResident: (resident: Omit<Resident, 'id'>) => Promise<void> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addResident = async (resident: Omit<Resident, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      await addDoc(residentsRef, resident);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { addResident, loading, error };
}

/**
 * Update a resident by ID
 */
export function useUpdateResident(): UseResidentMutationResult & { updateResident: (id: string, data: Partial<Resident>) => Promise<void> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateResident = async (id: string, data: Partial<Resident>) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(residentsRef, id);
      await updateDoc(ref, data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { updateResident, loading, error };
}

/**
 * Delete a resident by ID
 */
export function useDeleteResident(): UseResidentMutationResult & { deleteResident: (id: string) => Promise<void> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteResident = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(residentsRef, id);
      await deleteDoc(ref);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { deleteResident, loading, error };
} 