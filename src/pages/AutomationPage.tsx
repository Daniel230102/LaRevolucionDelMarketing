import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Layers, Clock, CheckCircle2, AlertCircle, RefreshCw, Send, Trash2, X, Instagram, Linkedin, Twitter, Facebook, MessageSquare, Copy } from 'lucide-react';
import { useCompany } from '../lib/CompanyContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, collection, query, onSnapshot, deleteDoc } from 'firebase/firestore';
import { AutomationTask } from '../types';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

const channelIcons: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  whatsapp: MessageSquare,
  email: Send,
};

export function AutomationPage() {
  const { selectedCompany } = useCompany();
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [selectedTask, setSelectedTask] = useState<AutomationTask | null>(null);

  const handleMarkAsDone = async (e: React.MouseEvent, task: AutomationTask) => {
    e.stopPropagation();
    if (!selectedCompany) return;
    const taskDocRef = doc(db, 'companies', selectedCompany.id, 'automations', task.id);
    try {
      await updateDoc(taskDocRef, {
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
      setActiveTab('history');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, taskDocRef.path);
    }
  };

  const handleReschedule = async (e: React.MouseEvent, task: AutomationTask) => {
    e.stopPropagation();
    if (!selectedCompany) return;
    
    const currentPath = `companies/${selectedCompany.id}/automations/${task.id}`;
    try {
      const now = new Date();
      const currentScheduled = new Date(task.scheduledAt);
      
      // Suggested peak hours: 10:00, 14:00, 18:00, 21:00
      const peakHours = [10, 14, 18, 21];
      let nextDate = new Date(currentScheduled);
      
      // If we are rescheduling today, try next peak or tomorrow first peak
      let found = false;
      for (const hour of peakHours) {
        if (hour > currentScheduled.getHours() || nextDate.getDate() > now.getDate()) {
          nextDate.setHours(hour, 0, 0, 0);
          if (nextDate.getTime() > currentScheduled.getTime()) {
            found = true;
            break;
          }
        }
      }

      if (!found) {
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(peakHours[0], 0, 0, 0);
      }
      
      await updateDoc(doc(db, currentPath), {
        scheduledAt: nextDate.toISOString(),
        updatedAt: new Date().toISOString()
      });
      alert(`Sugerencia de IA: Reprogramado para el ${nextDate.toLocaleDateString()} a las ${nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Hora de alto impacto)`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, currentPath);
    }
  };

  useEffect(() => {
    if (!selectedCompany) return;
    const path = `companies/${selectedCompany.id}/automations`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AutomationTask));
      setTasks(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [selectedCompany]);

  const queue = tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  
  const history = tasks
    .filter(t => t.status !== 'pending')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Contenido copiado al portapapeles");
  };

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
           {(activeTab === 'queue' ? queue : history).map(task => {
             const Icon = channelIcons[task.channel as keyof typeof channelIcons] || Send;
             return (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTask(task)}
                className="group flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all bg-gray-50/30 cursor-pointer"
              >
                 <div className="flex items-center gap-4 min-w-[240px]">
                    <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                       <Icon className="h-5 w-5" />
                    </div>
                    <div>
                       <h4 className="font-bold text-gray-900 capitalize">{task.channel}</h4>
                       <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{task.contentType}</p>
                    </div>
                 </div>

                 <div className="flex-1">
                    <p className="text-xs text-gray-500 line-clamp-1 border-l-2 border-gray-200 pl-4 group-hover:text-blue-600 transition-colors">{task.content}</p>
                 </div>

                 <div className="flex items-center gap-6 min-w-[200px] justify-between">
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] uppercase font-bold text-gray-400">Publicación Óptima</span>
                       <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-blue-500" /> {new Date(task.scheduledAt).toLocaleDateString()} • {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <div className="flex items-center gap-3">
                       {task.status === 'pending' ? (
                         <>
                           <button 
                             onClick={(e) => handleReschedule(e, task)}
                             title="Sugerir nueva hora"
                             className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shadow-sm border border-blue-100"
                           >
                             <RefreshCw className="h-4 w-4" />
                           </button>
                           <button 
                             onClick={(e) => handleMarkAsDone(e, task)}
                             title="Marcar como realizado"
                             className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-all shadow-sm border border-green-100"
                           >
                             <CheckCircle2 className="h-4 w-4" />
                           </button>
                         </>
                       ) : (
                         <>
                           <div className="p-2.5 rounded-xl bg-green-50 text-green-600 shadow-sm border border-green-100">
                             <CheckCircle2 className="h-4 w-4" />
                           </div>
                           <button 
                             onClick={async (e) => {
                               e.stopPropagation();
                               const confirmed = window.confirm("¿Estás seguro de que quieres eliminar esta automatización permanentemente del historial?");
                               if (confirmed) {
                                 const taskDocRef = doc(db, 'companies', selectedCompany.id, 'automations', task.id);
                                 try {
                                   await deleteDoc(taskDocRef);
                                 } catch (err) {
                                   handleFirestoreError(err, OperationType.DELETE, `companies/${selectedCompany.id}/automations/${task.id}`);
                                 }
                               }
                             }}
                             className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </>
                       )}
                    </div>
                 </div>
              </motion.div>
             );
           })}

           <AnimatePresence>
             {selectedTask && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedTask(null)}
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                  >
                     <div className="flex justify-between items-center bg-gray-900 p-6 text-white">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                              {selectedTask.logoUrl ? (
                                <img src={selectedTask.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-1" referrerPolicy="no-referrer" />
                              ) : (
                                <Send className="h-5 w-5 text-blue-400" />
                              )}
                           </div>
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Detalle de Automatización</p>
                              <h3 className="font-bold">{selectedTask.contentType} · {selectedTask.channel}</h3>
                           </div>
                        </div>
                        <button 
                          onClick={() => setSelectedTask(null)}
                          className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <X className="h-6 w-6" />
                        </button>
                     </div>

                     <div className="p-10 max-h-[70vh] overflow-y-auto">
                        <div className="mb-8 flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                           <div className="flex items-center gap-3">
                              <p className="text-xs font-bold text-blue-600">Estado: <span className="uppercase">{selectedTask.status}</span></p>
                              <p className="text-xs text-blue-400">|</p>
                              <p className="text-xs font-bold text-blue-600">Publicación: {new Date(selectedTask.scheduledAt).toLocaleString()}</p>
                           </div>
                           <button 
                             onClick={() => copyToClipboard(selectedTask.content)}
                             className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all border border-blue-100"
                           >
                             <Copy className="h-4 w-4" /> Copiar Contenido
                           </button>
                        </div>

                        <div className="prose prose-blue max-w-none text-gray-700 markdown-content">
                           <ReactMarkdown>{selectedTask.content}</ReactMarkdown>
                        </div>
                     </div>
                  </motion.div>
               </div>
             )}
           </AnimatePresence>

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
