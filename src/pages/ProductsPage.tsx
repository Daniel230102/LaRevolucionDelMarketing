import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Plus, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useCompany } from '../lib/CompanyContext';
import { useTrack } from '../lib/useTrack';
import { ai, MODELS } from '../lib/gemini';
import { Type } from '@google/genai';
import { Product } from '../types';

export function ProductsPage() {
  const { selectedCompany } = useCompany();
  const { logAction } = useTrack();
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    benefits: '',
    targetAudience: '',
    price: 0,
    cost: 0,
    competitiveAdvantages: '',
    maturity: 'Idea'
  });

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

  const saveProduct = async () => {
    if (!selectedCompany) return;
    const path = `companies/${selectedCompany.id}/products`;
    try {
      await addDoc(collection(db, path), {
        ...newProduct,
        price: Number(newProduct.price),
        cost: Number(newProduct.cost),
        benefits: newProduct.benefits.split(',').map(b => b.trim()).filter(b => b !== ''),
        companyId: selectedCompany.id,
      });
      logAction("Producto Creado", "Producto", `Nuevo producto: ${newProduct.name}`);
      setIsAdding(false);
      setNewProduct({ name: '', description: '', category: '', benefits: '', targetAudience: '', price: 0, cost: 0, competitiveAdvantages: '', maturity: 'Idea' });
    } catch (e) { 
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!selectedCompany) return;
    const path = `companies/${selectedCompany.id}/products/${productId}`;
    try {
      await deleteDoc(doc(db, 'companies', selectedCompany.id, 'products', productId));
      logAction("Producto Eliminado", "Producto", `ID: ${productId}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const getAISuggestions = async (product: Product) => {
    setIsGenerating(true);
    try {
      const margin = product.price - product.cost;
      const marginPercent = ((margin / product.price) * 100).toFixed(1);

      const prompt = `Analiza este producto para ${selectedCompany?.name}: 
      Nombre: ${product.name}
      Descripción: ${product.description}
      Público Objetivo: ${product.targetAudience}
      Precio de Venta: ${product.price}€
      Coste de Producción/Servicio: ${product.cost}€
      Margen Actual: ${margin}€ (${marginPercent}%)

      REQUERIMIENTOS:
      1. Evalúa si el precio es adecuado según el coste y la escalabilidad.
      2. Si el margen es bajo, sugiere un nuevo precio óptimo.
      3. Proporciona 3 sugerencias estratégicas para aumentar beneficios (reducir costes, premiumización, etc.).
      4. El tono debe ser profesional y directo en español de España.
      
      Formato: Devuelve una respuesta estructurada con títulos claros.`;

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: prompt
      });
      
      logAction("Sugerencias IA", "Producto", `Sugerencias generadas para ${product.name}`);
      setAiResult(response.text);
    } catch (e) { console.error(e); }
    finally { setIsGenerating(false); }
  };

  if (!selectedCompany) return <div className="text-center py-20 text-gray-500">Selecciona una empresa primero en el menú lateral.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Catálogo de Productos y Servicios</h2>
          <p className="text-gray-500 text-sm">Gestiona y optimiza la oferta comercial de {selectedCompany.name}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" /> Añadir Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {products.map(p => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 font-bold text-gray-400">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {p.maturity}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-gray-900">{p.price}€</span>
                      <span className="text-[10px] text-gray-400">Coste: {p.cost || 0}€</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{p.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{p.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.benefits?.slice(0, 3).map((b, i) => (
                    <span key={i} className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t">
                <button 
                  onClick={() => getAISuggestions(p)}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-gray-900 text-white py-2 rounded-lg hover:bg-black transition-all disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Optimizador IA
                </button>
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl space-y-6"
          >
            <h3 className="text-2xl font-bold">Nuevo Producto o Servicio</h3>
            <div className="grid grid-cols-2 gap-4 text-left">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Producto</label>
                 <input 
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="e.g. Consultoría SEO"
                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</label>
                 <input 
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    placeholder="e.g. Servicios Digitales"
                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Público Objetivo</label>
                 <input 
                    type="text"
                    value={newProduct.targetAudience}
                    onChange={(e) => setNewProduct({...newProduct, targetAudience: e.target.value})}
                    placeholder="e.g. PYMES del sector retail"
                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Precio de Venta (€)</label>
                 <input 
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Coste del Producto (€)</label>
                 <input 
                    type="number"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({...newProduct, cost: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado de Madurez</label>
                 <select 
                    value={newProduct.maturity}
                    onChange={(e) => setNewProduct({...newProduct, maturity: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                 >
                   <option value="Idea">Idea / Concepto</option>
                   <option value="MVP">MVP (Producto Mínimo Viable)</option>
                   <option value="Lanzado">Lanzado al Mercado</option>
                   <option value="Escalando">En Escalado</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Beneficios (separados por coma)</label>
                 <input 
                    type="text"
                    value={newProduct.benefits}
                    onChange={(e) => setNewProduct({...newProduct, benefits: e.target.value})}
                    placeholder="e.g. Rápido, Económico, Escalable"
                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                 />
               </div>
            </div>
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción del Producto</label>
              <textarea 
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Explica qué hace el producto y qué problema resuelve..."
                className="w-full px-4 py-2 bg-gray-50 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setIsAdding(false)} 
                className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={saveProduct}
                className="px-8 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                Guardar Producto
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {aiResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">Optimización IA</h3>
              </div>
              <button 
                onClick={() => setAiResult(null)}
                className="text-gray-400 hover:text-black transition-colors"
                aria-label="Cerrar"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto text-left flex-1">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-normal space-y-4">
                {aiResult}
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end">
              <button 
                onClick={() => setAiResult(null)}
                className="bg-gray-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-black transition-all"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
