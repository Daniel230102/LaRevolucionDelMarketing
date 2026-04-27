import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, TrendingUp, DollarSign, Users, Target, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCompany } from '../lib/CompanyContext';
import { useTrack } from '../lib/useTrack';
import { ai, MODELS } from '../lib/gemini';
import { cn } from '../lib/utils';

export function ROIPage() {
  const { selectedCompany } = useCompany();
  const { logAction } = useTrack();
  const [isEstimating, setIsEstimating] = useState(false);
  const [data, setData] = useState({
    investment: 1000,
    tools: 150,
    ads: 500,
    human: 350,
    expectedLeads: 50,
    avgLifetimeValue: 500
  });
  const [prediction, setPrediction] = useState<any>(null);
  const [activeScenario, setActiveScenario] = useState<string>('medium');

  const calculateROI = async () => {
    setIsEstimating(true);
    try {
      const totalCost = data.tools + data.ads + data.human + data.investment;
      
      const prompt = `Calcula y predice el ROI de una campaña de marketing para la empresa ${selectedCompany?.name}.
      Costes Totales (Inversión): $${totalCost}
      Expectativas: ${data.expectedLeads} leads, Valor Medio del Cliente $${data.avgLifetimeValue}.
      
      IMPORTANTE: Devuelve un objeto JSON estructurado con los escenarios: "conservative" (conservador), "medium" (moderado), "optimistic" (optimista).
      Cada escenario debe tener: 
      - returns: (número) Ingresos brutos estimados.
      - roi_percent: (número) Porcentaje de retorno.
      - conversions: (número) Número de ventas estimadas.
      - description: (texto largo en ESPAÑOL) Una explicación detallada de por qué se daría este escenario y qué factores influyen.

      Además, incluye:
      - recommendations: Un array de 3 recomendaciones específicas en ESPAÑOL.
      - confidenceScore: Un número entre 0 y 1.`;

      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);
      setPrediction(result);
      setActiveScenario('medium');
      logAction("ROI Calculado", "Finanzas", `Se generó una predicción de ROI para la campaña actual`, { totalCost });
    } catch (e) {
      console.error(e);
    } finally {
      setIsEstimating(false);
    }
  };

  const scenarioLabels: Record<string, string> = {
    conservative: 'Conservador',
    medium: 'Moderado',
    optimistic: 'Optimista'
  };

  if (!selectedCompany) return <div className="text-center py-20 text-gray-500">Selecciona una empresa primero.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
           <h3 className="font-bold border-b pb-2 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-500" /> Parámetros de Inversión
           </h3>
           <div className="space-y-4">
              {[
                { label: 'Inversión Directa ($)', key: 'investment' },
                { label: 'Coste Herramientas ($)', key: 'tools' },
                { label: 'Gasto en Ads ($)', key: 'ads' },
                { label: 'Tiempo Humano ($)', key: 'human' },
                { label: 'Leads Esperados', key: 'expectedLeads' },
                { label: 'Ticket Medio ($)', key: 'avgLifetimeValue' },
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400">{field.label}</label>
                  <input 
                    type="number"
                    value={(data as any)[field.key]}
                    onChange={(e) => setData({...data, [field.key]: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
                  />
                </div>
              ))}
           </div>
           <button 
             onClick={calculateROI}
             disabled={isEstimating}
             className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
           >
             {isEstimating ? "Calculando..." : "Predecir Resultados con IA"}
           </button>
        </section>
      </div>

      <div className="lg:col-span-8 space-y-8">
        {!prediction ? (
          <div className="bg-gray-50 rounded-2xl h-[500px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8 space-y-4">
             <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <TrendingUp className="h-8 w-8 text-gray-300" />
             </div>
             <div>
                <h4 className="font-bold text-gray-400 text-lg">Predicción Financiera</h4>
                <p className="text-sm text-gray-400 max-w-xs mx-auto">Ingresa los costes e ingresos esperados para generar una simulación multiescenario.</p>
             </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {['conservative', 'medium', 'optimistic'].map(sc => (
                 <button 
                   key={sc} 
                   onClick={() => setActiveScenario(sc)}
                   className={cn(
                    "p-6 rounded-2xl border flex flex-col justify-between h-48 transition-all text-left group",
                    activeScenario === sc 
                      ? "bg-white border-blue-600 shadow-blue-600/10 shadow-xl scale-105 z-10" 
                      : "bg-white border-gray-100 hover:border-blue-200"
                   )}
                 >
                    <div>
                       <span className="text-[10px] uppercase font-bold text-gray-400">{scenarioLabels[sc]}</span>
                       <h4 className={cn("text-2xl font-black", activeScenario === sc ? "text-blue-600" : "text-gray-900")}>
                         ${prediction?.scenarios?.[sc]?.returns ?? 0}
                       </h4>
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-500">ROI%</span>
                          <span className={cn("text-xs font-bold", sc === 'conservative' ? 'text-gray-600' : 'text-green-600')}>
                            {prediction?.scenarios?.[sc]?.roi_percent ?? 0}%
                          </span>
                       </div>
                    </div>
                 </button>
               ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.section 
                key={activeScenario}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-50/50 rounded-2xl p-8 border border-blue-100/50"
              >
                 <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                       <Target className="h-4 w-4" />
                    </div>
                    <div>
                       <h3 className="font-bold text-blue-900">Análisis: Escenario {scenarioLabels[activeScenario]}</h3>
                       <p className="text-xs text-blue-600 font-medium">Conversiones estimadas: {prediction?.scenarios?.[activeScenario]?.conversions}</p>
                    </div>
                 </div>
                 <p className="text-sm text-blue-800/80 leading-relaxed italic">
                    {prediction?.scenarios?.[activeScenario]?.description || "Sin descripción disponible para este escenario."}
                 </p>
              </motion.section>
            </AnimatePresence>

            <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Recomendaciones para maximizar ROI</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black tracking-widest uppercase">
                    <ShieldCheck className="h-3.5 w-3.5" /> Confianza: {Math.round(prediction.confidenceScore * 100)}%
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {prediction.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                       <span className="h-6 w-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm leading-none">{i+1}</span>
                       <p className="text-xs text-gray-600 font-medium leading-relaxed italic">"{rec}"</p>
                    </div>
                  ))}
               </div>
            </section>

            <section className="bg-gray-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-8">
               <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold">Resumen de Predicción</h3>
                  <p className="text-sm text-gray-400">Nuestro modelo analítico estima un escenario medio de retorno neto de <span className="text-blue-400 font-bold">${(prediction?.scenarios?.medium?.returns ?? 0) - (data.tools + data.ads + data.human + data.investment)}</span> tras descontar gastos.</p>
               </div>
               <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700">
                  Descargar Informe <ArrowRight className="h-5 w-5" />
               </button>
            </section>
          </motion.div>
        )}
      </div>
    </div>
  );
}
