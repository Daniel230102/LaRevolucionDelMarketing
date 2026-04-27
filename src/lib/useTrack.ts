import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useCompany } from "./CompanyContext";
import { useAuth } from "./AuthContext";

export function useTrack() {
  const { selectedCompany } = useCompany();
  const { user } = useAuth();

  const logAction = async (action: string, category: string, details: string, metrics: Record<string, any> = {}) => {
    if (!selectedCompany) return;

    try {
      await addDoc(collection(db, 'companies', selectedCompany.id, 'reports'), {
        action,
        category,
        details,
        metrics,
        timestamp: new Date().toISOString(),
        userId: user?.uid
      });
    } catch (e) {
      console.error("Failed to log activity", e);
    }
  };

  return { logAction };
}
