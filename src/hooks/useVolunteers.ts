import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Volunteer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  skills: string[];
  status: "active" | "inactive";
  joinDate: string;
}

export const useVolunteers = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const volunteersRef = collection(db, "volunteers");
        const snapshot = await getDocs(volunteersRef);
        const volunteersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Volunteer[];
        setVolunteers(volunteersData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch volunteers'));
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);

  return { volunteers, loading, error };
}; 