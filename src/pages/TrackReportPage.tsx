import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ScrollText, Filter, Calendar, Activity, Database, Download, Clock } from 'lucide-react';
import { useCompany } from '../lib/CompanyContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { TrackReport } from '../types';
import { cn } from '../lib/utils';

export function TrackReportPage() {
  const { selectedCompany } = useCompany();
  const [reports, setReports] = useState<TrackReport[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!selectedCompany) return;
    const q = query(collection(db, 'companies', selectedCompany.id, 'reports'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TrackReport)));
    });
  }, [selectedCompany]);

  const filtered = filter === 'All' ? reports : reports.filter(r => r.category === filter);

  if (!selectedCompany) return <div className="text-center py-20 text-gray-500">Selecciona una empresa primero.</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex gap-4 items-center">
              <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                 <ScrollText className="h-6 w-6" />
              </div>
              <div>
                 <h2 className="text-xl font-bold">Track Report & Trazabilidad</h2>
                 <p className="text-sm text-gray-400">Historial de decisiones, auditoría y métricas evolutivas.</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="flex bg-gray-50 border rounded-xl p-1">
                 {['All', 'Identidad', 'Producto', 'Competencia', 'Leads', 'Marketing', 'Finanzas'].map(f => (
                   <button 
                     key={f}
                     onClick={() => setFilter(f)}
                     className={cn(
                       "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                       filter === f ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                     )}
                   >
                     {f === 'All' ? 'TODOS' : f}
                   </button>
                 ))}
              </div>
              <button className="p-2 border rounded-xl hover:bg-gray-50 transition-all">
                <Download className="h-4 w-4 text-gray-500" />
              </button>
           </div>
        </div>

        <div className="p-8 space-y-6">
           {filtered.map((report, i) => (
             <motion.div 
               key={report.id}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.05 }}
               className="relative pl-10 before:absolute before:left-[19px] before:top-0 before:bottom-0 before:w-px before:bg-gray-100 last:before:hidden"
             >
                <div className={cn(
                  "absolute left-0 top-1.5 h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm z-10",
                  report.category === 'Identidad' ? "text-purple-600" :
                  report.category === 'Marketing' ? "text-pink-600" :
                  report.category === 'Leads' ? "text-blue-600" :
                  "text-gray-600"
                )}>
                   <Activity className="h-4 w-4" />
                </div>
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-r pr-3">{report.category}</span>
                         <h4 className="font-bold text-gray-900">{report.action}</h4>
                      </div>
                      <p className="text-sm text-gray-500">{report.details}</p>
                   </div>
                   <div className="text-right min-w-[200px]">
                      <div className="flex items-center justify-end gap-2 text-xs font-bold text-gray-400 mb-1">
                        <Calendar className="h-3.5 w-3.5" /> {new Date(report.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center justify-end gap-2">
                        <Clock className="h-3 w-3" /> {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                </div>
             </motion.div>
           ))}

           {filtered.length === 0 && (
             <div className="py-20 text-center space-y-4">
                <Database className="h-12 w-12 text-gray-200 mx-auto" />
                <p className="text-sm text-gray-400">No hay registros que coincidan con el filtro.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
