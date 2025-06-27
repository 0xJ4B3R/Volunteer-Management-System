import { useEffect, useState } from "react";
import {
  onSnapshot, QuerySnapshot, setDoc, doc, updateDoc, collection, Timestamp, deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MatchingRule, defaultMatchingRules } from "@/services/firestore";

export interface MatchingRuleUI extends Omit<MatchingRule, 'updatedAt'> {
  updatedAt: string;
}

function ensureMatchingRuleShape(raw: any): MatchingRuleUI {
  return {
    ...raw,
    updatedAt: raw.updatedAt?.toDate ? raw.updatedAt.toDate().toISOString() : (raw.updatedAt || ''),
  };
}

export function useMatchingRules() {
  const [rules, setRules] = useState<MatchingRuleUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const ref = collection(db, "matching_rules");
    const unsubscribe = onSnapshot(
      ref,
      async (snapshot: QuerySnapshot) => {
        if (snapshot.empty) {
          // Populate with defaults
          await Promise.all(
            defaultMatchingRules.map(rule =>
              setDoc(doc(db, "matching_rules", rule.id), rule)
            )
          );
          setRules(defaultMatchingRules.map(ensureMatchingRuleShape));
        } else {
          setRules(snapshot.docs.map(docSnap => ensureMatchingRuleShape({ id: docSnap.id, ...docSnap.data() })));
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { rules, loading, error };
}

export function useAddMatchingRule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addMatchingRule = async (rule: MatchingRule) => {
    setLoading(true);
    setError(null);
    try {
      await setDoc(doc(db, "matching_rules", rule.id), rule);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { addMatchingRule, loading, error };
}

export function useUpdateMatchingRule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateMatchingRule = async (id: string, data: Partial<MatchingRule>) => {
    setLoading(true);
    setError(null);
    try {
      const ruleRef = doc(db, "matching_rules", id);
      await updateDoc(ruleRef, { ...data, updatedAt: Timestamp.now() });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { updateMatchingRule, loading, error };
}

export function useDeleteMatchingRule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteMatchingRule = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const ruleRef = doc(db, "matching_rules", id);
      await deleteDoc(ruleRef);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { deleteMatchingRule, loading, error };
}

export function useResetMatchingRules() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resetMatchingRules = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all(
        defaultMatchingRules.map(rule =>
          setDoc(doc(db, "matching_rules", rule.id), rule)
        )
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { resetMatchingRules, loading, error };
} 