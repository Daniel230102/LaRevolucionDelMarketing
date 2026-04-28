import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Search, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { useCompany } from '../lib/CompanyContext';
import { useTrack } from '../lib/useTrack';
import { ai, MODELS } from '../lib/gemini';
import { Type } from '@google/genai';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore';
import { Competitor } from '../types';

export function CompetitorsPage() {
  const { selectedCompany } = useCompany();
  const { logAction } = useTrack();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [queryName, setQueryName] = useState('');

  useEffect(() => {
    if (!selectedCompany) return;
    const path = `companies/${selectedCompany.id}/competitors`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCompetitors(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Competitor)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [selectedCompany]);

  const searchCompetitors = async () => {
    if (!selectedCompany || !queryName) return;
    setIsSearching(true);
    const path = `companies/${selectedCompany.id}/competitors`;
    try {
      const prompt = `Busca y analiza competidores clave para ${selectedCompany.name} (Sector: ${selectedCompany.sector}) en el contexto de "${queryName}". 
      Proporciona detalles para UN competidor principal en español: name, web, valueProposition, strengths, weaknesses, differentiation. 
      Devuelve como JSON.`;

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              web: { type: Type.STRING },
              valueProposition: { type: Type.STRING },
              strengths: { type: Type.STRING },
              weaknesses: { type: Type.STRING },
              differentiation: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      await addDoc(collection(db, path), data);
      logAction("Competidor Identificado", "Competencia", `Se ha analizado al competidor ${data.name}`);
      setQueryName('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    } finally {
      setIsSearching(false);
    }
  };

  if (!selectedCompany) return <div className="text-center py-20 text-gray-500">Selecciona una empresa primero en el menú lateral.</div>;

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold mb-6">Benchmarking & Competencia</h2>
        <div className="flex gap-3">
          <input 
            type="text"
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            placeholder="Introduce sector o competidor específico..."
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button 
            onClick={searchCompetitors}
            disabled={isSearching}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="h-5 w-5" /> {isSearching ? "Analizando..." : "Descubrir"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {competitors.map(c => (
          <motion.div 
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 space-y-4">
                <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-bold border border-purple-100">
                  <Target />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{c.name}</h3>
                  <p className="text-sm text-blue-600">{c.web}</p>
                </div>
                <p className="text-sm text-gray-500 italic leading-relaxed">
                  "{c.valueProposition}"
                </p>
              </div>

              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <h4 className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" /> Fortalezas
                  </h4>
                  <p className="text-xs text-green-800/80 leading-relaxed">{c.strengths}</p>
                </div>
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                  <h4 className="text-xs font-bold text-red-700 uppercase mb-2 flex items-center gap-2">
                    <TrendingDown className="h-3 w-3" /> Debilidades
                  </h4>
                  <p className="text-xs text-red-800/80 leading-relaxed">{c.weaknesses}</p>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 col-span-2">
                  <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-2">
                    <Info className="h-3 w-3" /> Oportunidad de Diferenciación
                  </h4>
                  <p className="text-xs text-blue-800/80 leading-relaxed font-bold">{c.differentiation}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
