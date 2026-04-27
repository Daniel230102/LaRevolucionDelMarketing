import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Search, Download, Filter, Mail, Phone, ExternalLink, AlertCircle } from 'lucide-react';
import { useCompany } from '../lib/CompanyContext';
import { useTrack } from '../lib/useTrack';
import { ai, MODELS } from '../lib/gemini';
import { Type } from '@google/genai';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Lead } from '../types';
import { cn } from '../lib/utils';

export function LeadsPage() {
  const { selectedCompany } = useCompany();
  const { logAction } = useTrack();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchParams, setSearchParams] = useState({ sector: '', location: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCompany) return;
    setError(null);
    const path = `companies/${selectedCompany.id}/leads`;
    const q = query(collection(db, path), orderBy('capturedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
    }, (err) => {
      console.error("Leads Snapshot Error:", err);
      handleFirestoreError(err, OperationType.LIST, path);
      setError("Error de permisos al cargar leads. Verificando configuración...");
    });

    return () => unsubscribe();
  }, [selectedCompany]);

  const exportToCSV = () => {
    if (leads.length === 0) return;
    
    const headers = ['Nombre', 'Sector', 'Ciudad', 'País', 'Web', 'Email', 'Teléfono', 'Persona de Contacto', 'Cargo', 'Prioridad', 'Capturado En'];
    const rows = leads.map(l => [
      l.name, l.sector, l.city, l.country, l.web, l.email, l.phone, l.contactPerson, l.role, l.priority, l.capturedAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${selectedCompany?.name || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const discoverLeads = async () => {
    if (!selectedCompany || !searchParams.sector) return;
    setIsSearching(true);
    setError(null);
    const path = `companies/${selectedCompany.id}/leads`;
    try {
      const prompt = `Generate a list of 5 REALISTIC (but illustrative for demonstration) potential B2B leads for ${selectedCompany.name} in the ${searchParams.sector} sector at ${searchParams.location || 'Global'}. 
      For each lead return: name (of company), sector, city, country, web, email, phone, contactPerson, role, priority (low/medium/high), source ("Public Search").
      Return as a JSON array of objects.`;

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sector: { type: Type.STRING },
                city: { type: Type.STRING },
                country: { type: Type.STRING },
                web: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                contactPerson: { type: Type.STRING },
                role: { type: Type.STRING },
                priority: { type: Type.STRING },
                source: { type: Type.STRING }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      for (const lead of data) {
        try {
          await addDoc(collection(db, path), {
            ...lead,
            capturedAt: new Date().toISOString()
          });
        } catch (addErr) {
          handleFirestoreError(addErr, OperationType.CREATE, path);
        }
      }
      logAction("Leads Generados", "Leads", `Se han descubierto ${data.length} nuevos leads para ${searchParams.sector}`);
      setSearchParams({ sector: '', location: '' });
    } catch (e) {
      console.error(e);
      setError("Error al generar o guardar leads. Por favor reintenta.");
    } finally {
      setIsSearching(false);
    }
  };

  if (!selectedCompany) return <div className="text-center py-20 text-gray-500">Selecciona una empresa primero.</div>;

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold mb-6">Descubrimiento de Leads</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <input 
            type="text"
            value={searchParams.sector}
            onChange={(e) => setSearchParams({...searchParams, sector: e.target.value})}
            placeholder="Sector (e.g. Restaurantes, Tech, Retail)..."
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <input 
            type="text"
            value={searchParams.location}
            onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
            placeholder="Ubicación (opcional)..."
            className="w-48 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button 
            onClick={discoverLeads}
            disabled={isSearching}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="h-5 w-5" /> {isSearching ? "Buscando..." : "Explorar"}
          </button>
        </div>
      </section>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
           <div className="flex items-center gap-4">
              <h3 className="font-bold">Base de Datos de Leads</h3>
              <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-full">{leads.length} registros</span>
           </div>
           <div className="flex gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><Filter className="h-4 w-4" /></button>
              <button 
                onClick={exportToCSV}
                disabled={leads.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Download className="h-3 w-3" /> Exportar CSV
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Sector / Ubicación</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Prioridad</th>
                <th className="px-6 py-4">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{lead.name}</div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" /> {lead.web}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-gray-600">{lead.sector}</div>
                    <div className="text-[10px] text-gray-400">{lead.city}, {lead.country}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-gray-700">{lead.contactPerson}</div>
                    <div className="text-[10px] text-gray-400">{lead.role}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      lead.priority === 'high' ? "bg-red-100 text-red-600" :
                      lead.priority === 'medium' ? "bg-yellow-100 text-yellow-600" :
                      "bg-green-100 text-green-600"
                    )}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <button className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-600 hover:text-white transition-all"><Mail className="h-3 w-3" /></button>
                       <button className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-600 hover:text-white transition-all"><Phone className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="py-20 text-center text-gray-400 text-sm">No hay leads capturados aún. Intenta realizar una búsqueda.</div>
          )}
        </div>
      </div>
    </div>
  );
}
