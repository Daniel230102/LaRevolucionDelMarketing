import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Link as LinkIcon, MapPin, Globe, Mail, Phone, Info, ShieldCheck } from 'lucide-react';
import { ai, MODELS } from '../lib/gemini';
import { Type } from '@google/genai';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { useTrack } from '../lib/useTrack';
import { cn } from '../lib/utils';

export function IdentityPage() {
  const { user } = useAuth();
  const { logAction } = useTrack();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyzeCompany = async () => {
    if (!query) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const prompt = `Identify and analyze the company owner/identity from this input: "${query}". 
      Return a structured JSON with: name, brand, web, sector, country, location, socials (object), email, phone, shortDescription, confidence (0-1). 
      If data is missing, infer logically and set lower confidence.`;

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              brand: { type: Type.STRING },
              domain: { type: Type.STRING },
              sector: { type: Type.STRING },
              country: { type: Type.STRING },
              location: { type: Type.STRING },
              socials: { 
                type: Type.OBJECT,
                properties: {
                  linkedin: { type: Type.STRING },
                  instagram: { type: Type.STRING },
                  twitter: { type: Type.STRING }
                }
              },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              description: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            },
            required: ["name"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setResult(data);
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveCompany = async () => {
    if (!result || !user) return;
    try {
      const docRef = await addDoc(collection(db, 'companies'), {
        ...result,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
      });
      logAction("Empresa Registrada", "Identidad", `Se ha registrado la empresa ${result.name}`, { confidence: result.confidence });
      navigate('/');
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-4xl space-y-8"
    >
      <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold mb-2">Identificar Empresa / Propietario</h2>
        <p className="text-gray-500 text-sm mb-6">Ingresa una URL, nombre de empresa o dominio para realizar un análisis de identidad mediante IA.</p>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. apple.com, Nike, o razón social..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button 
            onClick={analyzeCompany}
            disabled={isAnalyzing}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? "Analizando..." : "Identificar"}
          </button>
        </div>
      </section>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm col-span-2 flex items-start justify-between">
            <div className="flex gap-6 items-center">
              <div className="h-20 w-20 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <Building2 className="h-10 w-10 text-gray-300" />
              </div>
              <div>
                <h3 className="text-3xl font-bold tracking-tight">{result.name}</h3>
                <p className="text-blue-600 font-medium">{result.brand || "Marca por definir"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    result.confidence > 0.8 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Confianza: {(result.confidence * 100).toFixed(0)}%
                  </div>
                  <span className="text-xs text-gray-400">{result.sector} • {result.country}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={saveCompany}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-black transition-all"
            >
              Confirmar y Registrar
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h4 className="flex items-center gap-2 font-bold border-b pb-2">
              <Info className="h-4 w-4 text-blue-500" /> Detalle de Negocio
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Globe className="h-4 w-4" /> Web</span>
                <span className="font-medium">{result.domain || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><MapPin className="h-4 w-4" /> Ubicación</span>
                <span className="font-medium">{result.location || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Mail className="h-4 w-4" /> Email</span>
                <span className="font-medium">{result.email || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Phone className="h-4 w-4" /> Teléfono</span>
                <span className="font-medium">{result.phone || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h4 className="flex items-center gap-2 font-bold border-b pb-2">
              <Building2 className="h-4 w-4 text-blue-500" /> Bio Corporativa
            </h4>
            <p className="text-sm text-gray-600 italic leading-relaxed">
              "{result.description || "No se pudo extraer una descripción detallada."}"
            </p>
            <div className="pt-4 flex gap-4">
               {result.socials?.linkedin && <LinkIcon className="h-5 w-5 text-gray-400" />}
               {result.socials?.instagram && <LinkIcon className="h-5 w-5 text-gray-400" />}
               {result.socials?.twitter && <LinkIcon className="h-5 w-5 text-gray-400" />}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
