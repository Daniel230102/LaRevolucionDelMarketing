import { motion } from 'motion/react';
import { useCompany } from '../lib/CompanyContext';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { selectedCompany } = useCompany();

  if (!selectedCompany) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Building2 className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold">Bienvenido a MarketMind</h2>
        <p className="text-gray-500 text-center max-w-md">
          Para comenzar, identifica tu primera empresa o selecciona una del menú lateral.
        </p>
        <Link to="/identity" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700">
          <Plus className="h-5 w-5" /> Registrar Empresa
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Leads Totales" value="128" icon={Users} color="blue" trend="+12% este mes" />
        <StatCard label="Competidores" value="8" icon={Target} color="purple" trend="2 nuevos" />
        <StatCard label="Campañas Activas" value="4" icon={TrendingUp} color="green" trend="Estable" />
        <StatCard label="Salud de Marca" value="92%" icon={Activity} color="orange" trend="Excelente" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Actividad Reciente (Track Report)</h3>
              <button className="text-sm text-blue-600 font-medium">Ver todo</button>
            </div>
            <div className="space-y-4">
              <ActivityItem 
                title="Nueva Identidad Registrada" 
                time="Hace 2 horas" 
                desc={`Se ha completado el análisis de ${selectedCompany.name}`}
                icon={Building2}
              />
              <ActivityItem 
                title="Lead Calificado" 
                time="Hace 4 horas" 
                desc="TechSolutions SA ha sido marcado como Alta Prioridad"
                icon={Users}
              />
              <ActivityItem 
                title="Automatización Ejecutada" 
                time="Ayer" 
                desc="Publicación programada para LinkedIn completada"
                icon={TrendingUp}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-[#1A1D23] rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-blue-400">
                <AlertCircle className="h-5 w-5" /> IA Suggestion
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed italic">
                "Hemos detectado un aumento del 15% en la actividad de tu competidor principal en LinkedIn. Sugerimos generar una campaña de contraste enfocada en tus Ventajas Competitivas."
              </p>
              <button className="mt-4 text-sm font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200">
                Ver Análisis
              </button>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-4">Métricas de ROI Estimado</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-gray-500">CPA (Coste por Adquisición)</span>
                <span className="text-lg font-bold text-gray-900">$12.40</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm text-gray-500">ROI (Retorno de Inversión)</span>
                <span className="text-lg font-bold text-green-600">3.4x</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[64%]" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className={cn("p-3 rounded-xl", colors[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-400" />
      </div>
      <div>
        <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
        {trend}
      </p>
    </div>
  );
}

function ActivityItem({ title, time, desc, icon: Icon }: any) {
  return (
    <div className="flex gap-4 items-start p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="mt-1 h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
          <span className="text-[10px] text-gray-400 uppercase font-bold">{time}</span>
        </div>
        <p className="text-xs text-gray-500 leading-normal">{desc}</p>
      </div>
    </div>
  );
}

// Fixed import for Building2
import { cn } from '../lib/utils';
import { Building2, Clock } from 'lucide-react';
