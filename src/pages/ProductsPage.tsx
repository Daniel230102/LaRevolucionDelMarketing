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
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    benefits: '',
    targetAudience: '',
    price: 0,
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
        benefits: newProduct.benefits.split(',').map(b => b.trim()),
        companyId: selectedCompany.id,
      });
      logAction("Producto Creado", "Producto", `Nuevo producto: ${newProduct.name}`);
      setIsAdding(false);
      setNewProduct({ name: '', description: '', category: '', benefits: '', targetAudience: '', price: 0, competitiveAdvantages: '', maturity: 'Idea' });
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
      const prompt = `Analyze this product for ${selectedCompany?.name}: 
      Name: ${product.name}
      Description: ${product.description}
      Target: ${product.targetAudience}
      Provide 3 clear improvement suggestions to make it more sellable. Focus on value proposition and messaging.`;

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: prompt
      });
      
      // We could save this back to the doc, but for now we'll just log and maybe alert
      logAction("AI Suggestions", "Producto", `Sugerencias generadas para ${product.name}`);
      alert(response.text);
    } catch (e) { console.error(e); }
    finally { setIsGenerating(false); }
  };

  if (!selectedCompany) return <div className="text-center py-20 text-gray-500">Selecciona una empresa primero.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Catálogo de Productos</h2>
          <p className="text-gray-500 text-sm">Gestiona y optimiza los servicios de {selectedCompany.name}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700"
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
                  <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {p.maturity}
                  </span>
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
                  <Sparkles className="h-3.5 w-3.5" /> IA Optimizer
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
            <div className="grid grid-cols-2 gap-4">
               {['name', 'category', 'targetAudience', 'maturity'].map((field) => (
                 <div key={field} className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{field}</label>
                   <input 
                      type="text"
                      value={(newProduct as any)[field]}
                      onChange={(e) => setNewProduct({...newProduct, [field]: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border rounded-lg"
                   />
                 </div>
               ))}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</label>
              <textarea 
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border rounded-lg h-24"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setIsAdding(false)} 
                className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500"
              >
                Cancelar
              </button>
              <button 
                onClick={saveProduct}
                className="px-8 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white"
              >
                Guardar Producto
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
