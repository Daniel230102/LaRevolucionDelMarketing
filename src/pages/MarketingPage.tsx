import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PenTool, Sparkles, Send, Calendar, Check, Layers, Image as ImageIcon, MessageSquare, Twitter, Instagram, Linkedin, Facebook, Copy, RefreshCw, X } from 'lucide-react';
import { useCompany } from '../lib/CompanyContext';
import { useAuth } from '../lib/AuthContext';
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
  const { user } = useAuth();
  const { logAction } = useTrack();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedType, setSelectedType] = useState(contentTypes[0]);
  const [selectedChannel, setSelectedChannel] = useState(channels[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>(selectedCompany?.logoUrl || '');
  const [campaignImageUrl, setCampaignImageUrl] = useState<string>('');
  const [scheduledDateStr, setScheduledDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduledTimeStr, setScheduledTimeStr] = useState<string>("10:00");
  const [isScheduling, setIsScheduling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');

  useEffect(() => {
    if (selectedCompany?.logoUrl) {
      setLogoUrl(selectedCompany.logoUrl);
    }
  }, [selectedCompany]);

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
    setCampaignImageUrl(''); // Clear previous image when generating new content
    setGeneratedImageUrl(''); // Clear generate modal image

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
      [Aquí el cuerpo del mensaje o contenido principal. Sé creativo con el uso de emojis y espaciado.]

      ## 💡 Consejos Estratégicos
      [Recomendaciones breves de por qué este contenido funcionará: tono, audiencia, etc.]

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
    setIsScheduling(true);
    const path = `companies/${selectedCompany.id}/automations`;

    try {
      const [year, month, day] = scheduledDateStr.split('-').map(Number);
      const [hours, minutes] = scheduledTimeStr.split(':').map(Number);
      const scheduledDate = new Date(year, month - 1, day, hours, minutes);

      await addDoc(collection(db, path), {
        ownerId: user.uid,
        channel: selectedChannel,
        contentType: selectedType,
        content: result,
        status: 'pending',
        scheduledAt: scheduledDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logoUrl: logoUrl,
        campaignImageUrl: campaignImageUrl,
        adaptation: "original",
        hashtags: []
      });
      logAction("Tarea Programada", "Automatización", `Se programó un post para ${selectedChannel}`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) { 
      handleFirestoreError(e, OperationType.CREATE, path);
    } finally {
      setIsScheduling(false);
    }
  };

  const generateImage = async () => {
    if (!selectedCompany && !result) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl(''); // Real reset to force loading state
    
    try {
      const product = products.find(p => p.id === selectedProduct);
      const baseContext = result ? result.slice(0, 800) : `Empresa: ${selectedCompany?.name} (${selectedCompany?.sector})`;
      
      const promptRequest = `Actúa como un Director Creativo de una Agencia Global. Tu tarea es diseñar un PROMPT en INGLÉS para un generador de imágenes de ultra-alta calidad (Flux.1).

      MARCA: ${selectedCompany?.name}
      SECTOR: ${selectedCompany?.sector}
      PRODUCTO: ${product ? product.name : 'Identidad Brand'}
      OBJETIVO: ${selectedType}
      CANAL: ${selectedChannel}
      
      CONTENIDO DE REFERENCIA: "${baseContext}"

      INSTRUCCIONES PARA EL PROMPT:
      1. Elige un ESTILO VISUAL que encaje perfectamente con "${selectedType}" y el sector ${selectedCompany?.sector}.
         - Si es "Newsletter": Estilo editorial, limpio, cabecera profesional.
         - Si es "Post Redes Sociales": Estilo 'lifestyle', dinámico, composición para Instagram/LinkedIn.
         - Si es "Eslóganes" o "Campaña Ads": Visual publicitario de alto impacto con un punto focal claro.
         - Otros: Estética premium de stock o arte conceptual moderno.
      
      2. TEXTO EN LA IMAGEN (CRÍTICO): 
         - Extrae una frase MUY CORTA (3-5 palabras máx) de los eslóganes o el contenido generado.
         - Indica al generador que escriba EXACTAMENTE este texto: "${selectedCompany?.name.toUpperCase()}" o la frase corta.
         - Usa palabras clave como: "typography", "legible text", "graphic design", "centered text".
         - Asegúrate de que el deletreo sea PERFECTO.

      3. CALIDAD: 8k, cinematic lighting, shot on 35mm lens, sharp focus, vibrant yet professional colors. Flux model style.
      
      Idea del Usuario Adicional: "${imagePrompt || 'Representación visual impactante del valor de la marca'}"

      DEVUELVE ÚNICAMENTE EL PROMPT TÉCNICO EN INGLÉS COMPLETO.`;

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: [{ role: 'user', parts: [{ text: promptRequest }] }]
      });

      let finalPrompt = response.text.trim();
      
      // Clean up common AI prefixes if Gemini adds them
      finalPrompt = finalPrompt.replace(/^(Prompt:|Visual Prompt:|Image Prompt:)/i, '').trim();
      
      // Force unique seed and clear URL to bypass any cache/stuck state
      const timestamp = Date.now();
      const randomPart = Math.floor(Math.random() * 100000);
      const seed = `${timestamp}${randomPart}`;
      
      const encodedPrompt = encodeURIComponent(finalPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux&enhance=true`;
      
      // Pre-load the image to ensure it works before showing it
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        setGeneratedImageUrl(imageUrl);
        setIsGeneratingImage(false);
        logAction("Imagen Generada", "Marketing", `Se generó imagen para ${selectedType}`);
      };
      img.onerror = () => {
        // Fallback or retry if pollination service fails
        setGeneratedImageUrl(imageUrl);
        setIsGeneratingImage(false);
      };

    } catch (e) {
      console.error(e);
      alert("Hubo un problema comunicando con el motor de diseño. Reintenta en unos segundos.");
      setIsGeneratingImage(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    alert("Contenido copiado al portapapeles");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Slightly larger limit
        alert("El logotipo es demasiado grande. Por favor usa una imagen menor a 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.onerror = () => {
        alert("Error al cargar la imagen. Inténtalo de nuevo.");
      };
      reader.readAsDataURL(file);
    }
  };

  if (!selectedCompany) return <div className="text-center py-20 text-gray-500">Selecciona una empresa primero.</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Optimization Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión Activa</h1>
            <p className="text-sm text-gray-500">Crea, optimiza y programa tus campañas inteligentes.</p>
          </div>
        </div>

        <motion.section 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden"
        >
          <Sparkles className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10 rotate-12" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-yellow-300" />
              </div>
              <div className="max-w-2xl">
                <h4 className="font-bold text-lg italic mb-1">Optimización AI Inteligente en Tiempo Real</h4>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Para el sector <strong>{selectedCompany?.sector}</strong> en <strong>{selectedChannel.toUpperCase()}</strong>, 
                  {selectedChannel === 'linkedin' && ' el uso de visuales corporativos de alta gama y tono ejecutivo aumenta el impacto en un '}
                  {selectedChannel === 'instagram' && ' una estética visual vibrante con iluminación dinámica aumenta el engagement en un '}
                  {selectedChannel === 'twitter' && ' mensajes directos acompañados de visuales conceptuales mejoran la tasa de click en un '}
                  {selectedChannel === 'facebook' && ' el contenido que fomenta la conversación con imágenes realistas aumenta el alcance en un '}
                  <strong>
                    {selectedChannel === 'linkedin' ? '52%' : 
                     selectedChannel === 'instagram' ? '64%' : 
                     selectedChannel === 'twitter' ? '38%' : '45%'}
                  </strong>.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-bold border-b pb-2 flex items-center gap-2">
               <PenTool className="h-4 w-4 text-blue-500" /> Configuración de Contenido
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

          <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-gray-400">Logotipo Empresa</label>
              <label className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-sm">
                 Subir Local
                 <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="URL del logotipo..."
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {logoUrl && (
                <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={generateContent}
            disabled={isGenerating}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5 text-yellow-400" /> {isGenerating ? "Generando..." : "Redactar con IA"}
          </button>
        </section>

        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
           <h3 className="font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
              <ImageIcon className="h-4 w-4 text-blue-500" /> Motor Visual AI
           </h3>
           <p className="text-[11px] text-gray-500 leading-relaxed">
             Personaliza el visual de tu campaña. Flux generará una imagen única con tipografía perfecta para <strong>{selectedChannel}</strong>.
           </p>
           <button 
             onClick={() => setIsImageModalOpen(true)}
             className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 rounded-lg text-[10px] font-bold hover:bg-gray-100 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
           >
             <ImageIcon className="h-3.5 w-3.5" /> Generar Creatividad
           </button>
        </section>

        {/* AI Image Modal */}
        {isImageModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 italic">Diseño Inteligente AI</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Generación de Creatividades</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsImageModalOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 italic relative">
                       <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 fill-yellow-400" />
                       <p className="text-xs text-blue-800 leading-relaxed">
                         "Utilizaremos el contexto de tu campaña actual para generar una imagen única optimizada para {selectedChannel}."
                       </p>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-gray-400">¿Qué quieres ver en la imagen?</label>
                       <textarea 
                         className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                         placeholder="Ej: Una oficina moderna, personas felices usando un ordenador, un amanecer tecnológico... (Opcional, la IA usará tu contenido por defecto)"
                         value={imagePrompt}
                         onChange={(e) => setImagePrompt(e.target.value)}
                       />
                    </div>

                    <button 
                      onClick={generateImage}
                      disabled={isGeneratingImage}
                      className="w-full bg-blue-600 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                    >
                      {isGeneratingImage ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isGeneratingImage ? "Generando Arte..." : "Generar Imagen Ahora"}
                    </button>
                  </div>

                  <div className="bg-gray-100 rounded-3xl overflow-hidden aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 relative group">
                    {generatedImageUrl ? (
                      <>
                        <img 
                          src={generatedImageUrl} 
                          key={generatedImageUrl}
                          alt="AI Generated" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 gap-3">
                           <button 
                             onClick={() => {
                               setCampaignImageUrl(generatedImageUrl);
                               setIsImageModalOpen(false);
                             }}
                             className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-xl"
                           >
                             Aceptar y usar esta imagen
                           </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-3">
                         <div className="h-12 w-12 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-sm">
                            <ImageIcon className="h-6 w-6 text-gray-300" />
                         </div>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">La creatividad aparecerá aquí</p>
                      </div>
                    )}
                    {isGeneratingImage && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center gap-4">
                         <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                         <p className="text-xs font-bold text-gray-900 border-b-2 border-blue-600 pb-1">Mezclando píxeles mágicos...</p>
                         <p className="text-[10px] text-gray-500 italic leading-relaxed">Esto suele tardar unos 10-15 segundos según la complejidad</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <section className={cn(
          "bg-white rounded-2xl min-h-[400px] border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center text-center",
          (result || campaignImageUrl) && "items-start text-left justify-start"
        )}>
          {!result && !campaignImageUrl && !isGenerating && (
            <div className="max-w-xs space-y-4">
               <div className="mx-auto h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                  <PenTool className="h-8 w-8 text-gray-300" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-400">Vista Previa de Campaña</h4>
                  <p className="text-xs text-gray-400">Genera contenido o configura una imagen para visualizar tu propuesta aquí.</p>
               </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center gap-4 py-20 w-full">
               <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
               <p className="text-sm font-bold text-blue-600 italic">Escribiendo tu próxima campaña ganadora...</p>
            </div>
          )}

          {(result || campaignImageUrl) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              <div className="flex justify-between items-center bg-gray-900 p-4 rounded-2xl border border-gray-800 text-white shadow-lg">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                       {logoUrl ? (
                         <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-1" referrerPolicy="no-referrer" />
                       ) : (
                         <Send className="h-4 w-4 text-blue-400" />
                       )}
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hub de Marketing</p>
                       <h4 className="text-sm font-bold">{selectedType} · {selectedChannel}</h4>
                    </div>
                 </div>
                 <div className="flex gap-2 items-center">
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
                      <input 
                        type="date"
                        value={scheduledDateStr}
                        onChange={(e) => setScheduledDateStr(e.target.value)}
                        className="bg-transparent text-white text-[10px] outline-none px-2 py-1 cursor-pointer"
                      />
                      <input 
                        type="time"
                        value={scheduledTimeStr}
                        onChange={(e) => setScheduledTimeStr(e.target.value)}
                        className="bg-transparent text-white text-[10px] outline-none px-2 py-1 border-l border-white/10 cursor-pointer"
                      />
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </button>
                    <button 
                      onClick={scheduleContent} 
                      disabled={isScheduling || showSuccess}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg",
                        showSuccess ? "bg-green-500 text-white" : "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20"
                      )}
                    >
                      {isScheduling ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : showSuccess ? <Check className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                      {isScheduling ? "Programando..." : showSuccess ? "¡Programado!" : "Programar"}
                    </button>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3 space-y-6">
                  {/* Web/Social app Header style */}
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                         {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" /> : <div className="font-bold text-blue-600">{selectedCompany.name.charAt(0)}</div>}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{selectedCompany.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{selectedChannel} Campaign</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6 flex-1">
                    {/* Visual Content (The Image) */}
                    {campaignImageUrl && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-gray-50 relative group mb-6"
                      >
                         <img 
                           key={campaignImageUrl}
                           src={campaignImageUrl} 
                           alt="Campaign Visual" 
                           className="w-full aspect-square object-cover"
                         />
                         <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-white font-bold uppercase">Visual de Campaña Generado</p>
                         </div>
                         <button 
                           onClick={() => setCampaignImageUrl('')}
                           className="absolute top-4 right-4 h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                         >
                           <X className="h-4 w-4" />
                         </button>
                      </motion.div>
                    )}

                    <div className="prose prose-blue max-w-none text-gray-700 relative z-10 markdown-content">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  </div>
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
    </div>
  );
}
