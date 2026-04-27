import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setSelectedCompany(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'companies'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(docs);
      setLoading(false);
    }, (error) => {
      console.error("Company fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle auto-selection of last used or first company
  useEffect(() => {
    if (!selectedCompany && companies.length > 0) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany]);

  return (
    <CompanyContext.Provider value={{ companies, selectedCompany, setSelectedCompany, loading }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within CompanyProvider');
  return context;
}
