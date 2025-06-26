import { useEffect, useState } from 'react';
import { onSnapshot, QuerySnapshot, addDoc, DocumentReference, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { usersRef, User } from '@/services/firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * Return type for real-time user hook
 */
export interface UseUsersResult {
  users: User[];
  loading: boolean;
  error: Error | null;
}

/**
 * Return type for CRUD user hooks
 */
export interface UseUserMutationResult {
  loading: boolean;
  error: Error | null;
}

/**
 * Real-time hook for all users (live updates from Firestore)
 */
export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot: QuerySnapshot) => {
        const data: User[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as User // Cast data to User type
        }));
        console.log('Loaded users:', data);
        setUsers(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading users:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { users, loading, error };
}

/**
 * Add a new user
 */
export function useAddUser(): UseUserMutationResult & { addUser: (user: Omit<User, 'id'>) => Promise<DocumentReference<User>> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addUser = async (user: Omit<User, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      // In a real application, you would hash the password before storing
      // For now, we'll store it as is or generate a placeholder if not provided
      const userToAdd = {
        ...user,
        // Ensure required fields have default values or are handled
        username: user.username || '', // Assuming username is required
        passwordHash: user.passwordHash || 'placeholder-hash', // Use a placeholder or generate one
        fullName: user.fullName || '',
        role: user.role || 'volunteer', // Default to volunteer role
        isActive: user.isActive === undefined ? true : user.isActive,
        createdAt: user.createdAt || Timestamp.now(),
      } as Omit<User, 'id'>; // Explicitly cast to Omit<User, 'id'>
      const docRef = await addDoc(usersRef, userToAdd);
      return docRef as DocumentReference<User>; // Cast the return type to DocumentReference<User>
    } catch (err) {
      setError(err as Error);
      throw err; // Re-throw the error to be caught by the caller
    } finally {
      setLoading(false);
    }
  };

  return { addUser, loading, error };
}

/**
 * Update a user by ID
 */
export function useUpdateUser(): UseUserMutationResult & { updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => Promise<void> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateUser = async (id: string, updates: Partial<Omit<User, 'id'>>) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(usersRef, id);
      await updateDoc(ref, updates);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateUser, loading, error };
}

/**
 * Delete a user by ID
 */
export function useDeleteUser(): UseUserMutationResult & { deleteUser: (id: string) => Promise<void> } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteUser = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const ref = doc(usersRef, id);
      await deleteDoc(ref);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { deleteUser, loading, error };
} 