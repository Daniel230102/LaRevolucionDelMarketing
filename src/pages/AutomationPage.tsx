import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Layers, Clock, CheckCircle2, AlertCircle, RefreshCw, Send, Trash2 } from 'lucide-react';
import { useCompany } from '../lib/CompanyContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { AutomationTask } from '../types';
import { cn } from '../lib/utils';

export function AutomationPage() {
  const { selectedCompany } = useCompany();
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  useEffect(() => {
    if (!selectedCompany) return;
    const q = query(collection(db, 'companies', selectedCompany.id, 'automations'), orderBy('scheduledAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AutomationTask)));
    });
  }, [selectedCompany]);

  const queue = tasks.filter(t => t.status === 'pending');
  const history = tasks.filter(t => t.status !== 'pending');

  if (!selectedCompany) return <div className="text-center py-20 text-gray-500">Selecciona una empresa primero.</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h2 className="text-xl font-bold">Automatización de Canales</h2>
              <p className="text-sm text-gray-500">Cola de publicación y eventos programados.</p>
           </div>
           <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('queue')}
                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", activeTab === 'queue' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}
              >
                Cola ({queue.length})
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", activeTab === 'history' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}
              >
                Historial ({history.length})
              </button>
           </div>
        </div>

        <div className="space-y-4">
           {(activeTab === 'queue' ? queue : history).map(task => (
             <motion.div 
               key={task.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="group flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all bg-gray-50/30"
             >
                <div className="flex items-center gap-4 min-w-[240px]">
                   <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm">
                      <Send className="h-5 w-5" />
                   </div>
                   <div>
                      <h4 className="font-bold text-gray-900 capitalize">{task.channel}</h4>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{task.contentType}</p>
                   </div>
                </div>

                <div className="flex-1">
                   <p className="text-xs text-gray-500 line-clamp-1 border-l-2 border-gray-200 pl-4">{task.content}</p>
                </div>

                <div className="flex items-center gap-6 min-w-[200px] justify-between">
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Programado</span>
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                         <Clock className="h-3 w-3 text-blue-500" /> {new Date(task.scheduledAt).toLocaleDateString()} • {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                   <div className="flex items-center gap-3">
                      {task.status === 'pending' ? (
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 animate-pulse"><RefreshCw className="h-4 w-4" /></div>
                      ) : (
                        <div className="p-2 rounded-lg bg-green-50 text-green-600"><CheckCircle2 className="h-4 w-4" /></div>
                      )}
                      <button 
                        onClick={() => deleteDoc(doc(db, 'companies', selectedCompany.id, 'automations', task.id))}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                   </div>
                </div>
             </motion.div>
           ))}

           {(activeTab === 'queue' ? queue : history).length === 0 && (
             <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                   <Layers className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-400">No hay tareas de automatización pendientes.</p>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <section className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl">
            <h4 className="font-bold mb-4 flex items-center gap-2">
               <AlertCircle className="h-5 w-5 text-yellow-400" /> Health Check
            </h4>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs mb-1">
                     <span className="text-gray-400">Frecuencia de Posteo</span>
                     <span className="text-blue-400 font-bold">Óptima</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[85%]" />
                  </div>
               </div>
               <p className="text-[10px] text-gray-400 italic">
                 "Tu calendario editorial está equilibrado. Sugerimos añadir un post interactivo el próximo Jueves para maximizar el engagement."
               </p>
            </div>
         </section>
         <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm md:col-span-2">
            <h4 className="font-bold mb-4">Recomendaciones de Horarios</h4>
            <div className="flex gap-4">
               {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(d => (
                 <div key={d} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex-1 bg-gray-50 rounded-lg flex flex-col items-center justify-end p-2 gap-1 min-h-[100px]">
                       <div className={cn("w-full rounded-t-sm", d === 'JUE' || d === 'MAR' ? "bg-blue-600 h-[80%]" : "bg-blue-200 h-[40%]")} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{d}</span>
                 </div>
               ))}
            </div>
         </section>
      </div>
    </div>
  );
}
