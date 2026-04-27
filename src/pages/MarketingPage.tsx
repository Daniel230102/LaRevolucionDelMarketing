import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PenTool, Sparkles, Send, Calendar, Check, Layers, Image as ImageIcon, MessageSquare, Twitter, Instagram, Linkedin, Facebook, Copy } from 'lucide-react';
import { useCompany } from '../lib/CompanyContext';
import { useTrack } from '../lib/useTrack';
import { ai, MODELS } from '../lib/gemini';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Product } from '../types';
import ReactMarkdown from 'react-markdown';

const contentTypes = ["Lluvia de ideas", "Eslóganes", "Newsletter", "Post Redes Sociales", "Campaña Ads", "Calendario", "Email Marketing"];
const channels = [
  { id: 'instagram', icon: Instagram, label: 'Instagram' },
  { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
  { id: 'twitter', icon: Twitter, label: 'X' },
  { id: 'facebook', icon: Facebook, label: 'Facebook' },
  { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' },
  { id: 'email', icon: Send, label: 'Email' },
];

export function MarketingPage() {
  const { selectedCompany } = useCompany();
  const { logAction } = useTrack();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedType, setSelectedType] = useState(contentTypes[0]);
  const [selectedChannel, setSelectedChannel] = useState(channels[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    if (!selectedCompany) return;
    const path = `companies/${selectedCompany.id}/products`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [selectedCompany]);

  const generateContent = async () => {
    if (!selectedCompany) return;
    setIsGenerating(true);
    setResult('');

    try {
      const product = products.find(p => p.id === selectedProduct);
      const prompt = `Eres un experto Senior en Marketing Digital y Copywriting para el mercado de España. 
      Genera: ${selectedType} para el canal ${selectedChannel}.

      EMPRESA: ${selectedCompany.name}
      SECTOR: ${selectedCompany.sector}
      CONOCIMIENTO ADICIONAL: ${selectedCompany.description || 'N/A'}
      
      PRODUCTO/CONTEXTO ESPECÍFICO: ${product ? `${product.name} - ${product.description}. Beneficios: ${product.benefits.join(', ')}` : 'Marca general'}

      REQUISITOS CRÍTICOS:
      1. Escribe TODO el contenido única y exclusivamente en ESPAÑOL DE ESPAÑA (trato de 'tú' o 'vosotros' según el canal, natural y moderno).
      2. No uses términos en inglés si hay una alternativa natural en español.
      3. Estilo: Persuasivo, moderno, profesional pero cercano.
      
      ESTRUCTURA DEL RESULTADO (Usa Markdown):
      ## 📝 Propuesta de Contenido
      [Aquí el cuerpo del mensaje o contenido principal]

      ## 💡 Consejos Estratégicos
      [Recomendaciones breves de por qué este contenido funcionará]

      ## 🏷️ Hashtags sugeridos
      [Si aplica]

      ## ⏰ Horario óptimo (España)
      [Recomendación de hora para publicar]`;

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: prompt
      });

      setResult(response.text);
      logAction("Contenido Generado", "Marketing", `Se generó ${selectedType} para ${selectedChannel}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const scheduleContent = async () => {
    if (!selectedCompany || !result) return;
    const path = `companies/${selectedCompany.id}/automations`;
    try {
      await addDoc(collection(db, path), {
        channel: selectedChannel,
        contentType: selectedType,
        content: result,
        status: 'pending',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        createdAt: new Date().toISOString()
      });
      logAction("Tarea Programada", "Automatización", `Se programó un post para ${selectedChannel}`);
      alert("Contenido programado para mañana");
    } catch (e) { 
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    alert("Contenido copiado al portapapeles");
  };

  if (!selectedCompany) return <div className="text-center py-20 text-gray-500">Selecciona una empresa primero.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
      <div className="lg:col-span-1 space-y-6">
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold border-b pb-2 flex items-center gap-2">
             <Layers className="h-4 w-4 text-blue-500" /> Selectores de Campaña
          </h3>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-400">¿Qué quieres generar?</label>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    selectedType === type ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-400">Canal / Red Social</label>
            <div className="grid grid-cols-3 gap-2 text-center">
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    selectedChannel === ch.id ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                  )}
                >
                  <ch.icon className="h-5 w-5" />
                  <span className="text-[10px] font-bold">{ch.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-400">Vincular a Producto</label>
            <select 
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Marca General</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={generateContent}
            disabled={isGenerating}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5 text-yellow-400" /> {isGenerating ? "Generando..." : "Mágia con IA"}
          </button>
        </section>

        <section className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg space-y-4">
           <h3 className="font-bold flex items-center gap-2 italic">
              <ImageIcon className="h-5 w-5" /> Auto-Image
           </h3>
           <p className="text-xs text-blue-100 leading-relaxed">
             Estamos preparados para generar creatividades visuales adaptadas a cada canal usando modelos generativos avanzados.
           </p>
           <button className="w-full bg-white/10 border border-white/20 py-2 rounded-lg text-xs font-bold hover:bg-white/20 transition-all">
             Configurar Imagen AI
           </button>
        </section>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <section className={cn(
          "bg-white rounded-2xl min-h-[400px] border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center text-center",
          result && "items-start text-left justify-start"
        )}>
          {!result && !isGenerating && (
            <div className="max-w-xs space-y-4">
               <div className="mx-auto h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                  <PenTool className="h-8 w-8 text-gray-300" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-400">Content Preview</h4>
                  <p className="text-xs text-gray-400">Selecciona un canal y tipo de contenido para ver la propuesta de la IA aquí.</p>
               </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center gap-4 py-20">
               <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
               <p className="text-sm font-bold text-blue-600 italic">Escribiendo tu próxima campaña ganadora...</p>
            </div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              <div className="flex justify-between items-center bg-gray-900 p-4 rounded-2xl border border-gray-800 text-white shadow-lg">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                       <Send className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Content Hub</p>
                       <h4 className="text-sm font-bold">{selectedType} · {selectedChannel}</h4>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </button>
                    <button 
                      onClick={scheduleContent} 
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all border border-blue-400/30"
                    >
                      <Calendar className="h-3.5 w-3.5" /> Programar
                    </button>
                 </div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <PenTool className="h-24 w-24 -rotate-12" />
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 relative z-10 markdown-content">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                <Sparkles className="h-3 w-3" /> Contenido generado por IA optimizado para el mercado español.
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
