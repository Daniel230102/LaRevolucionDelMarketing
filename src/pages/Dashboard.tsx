import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useCompany } from '../lib/CompanyContext';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  ArrowUpRight,
  Plus,
  Building2,
  Clock,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { selectedCompany } = useCompany();
  const [counts, setCounts] = useState({ leads: 0, competitors: 0, products: 0 });
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedCompany) return;

    // Leads count
    const leadsUnsubscribe = onSnapshot(collection(db, 'companies', selectedCompany.id, 'leads'), (s) => {
      setCounts(prev => ({ ...prev, leads: s.size }));
    });

    // Competitors count
    const compUnsubscribe = onSnapshot(collection(db, 'companies', selectedCompany.id, 'competitors'), (s) => {
      setCounts(prev => ({ ...prev, competitors: s.size }));
    });

    // Products count
    const prodUnsubscribe = onSnapshot(collection(db, 'companies', selectedCompany.id, 'products'), (s) => {
      setCounts(prev => ({ ...prev, products: s.size }));
    });

    // Recent Activity
    const q = query(
      collection(db, 'companies', selectedCompany.id, 'reports'), 
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const reportsUnsubscribe = onSnapshot(q, (s) => {
      setReports(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `companies/${selectedCompany.id}/reports`);
    });

    return () => {
      leadsUnsubscribe();
      compUnsubscribe();
      prodUnsubscribe();
      reportsUnsubscribe();
    };
  }, [selectedCompany]);

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
        <Link to="/leads" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <StatCard label="Leads Totales" value={counts.leads.toString()} icon={Users} color="blue" trend={`${selectedCompany.name}`} />
        </Link>
        <Link to="/competitors" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <StatCard label="Competidores" value={counts.competitors.toString()} icon={Target} color="purple" trend="Mercado Objetivo" />
        </Link>
        <Link to="/productos" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <StatCard label="Productos" value={counts.products.toString()} icon={ShoppingBag} color="green" trend="Catálogo Activo" />
        </Link>
        <Link to="/marketing" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <StatCard label="Salud de Marca" value="92%" icon={Activity} color="orange" trend="Excelente" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Actividad Reciente</h3>
              <Link to="/reports" className="text-sm text-blue-600 font-medium hover:underline">Ver todo</Link>
            </div>
            <div className="space-y-4">
              {reports.length > 0 ? reports.map((report) => (
                <ActivityItem 
                  key={report.id}
                  title={report.action} 
                  time={new Date(report.timestamp).toLocaleTimeString()} 
                  desc={report.details}
                  icon={report.category === "Leads" ? Users : report.category === "Competencia" ? Target : report.category === "Producto" ? ShoppingBag : Activity}
                />
              )) : (
                <div className="text-center py-10 text-gray-400 text-sm italic">
                  No hay actividad reciente registrada para esta empresa.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-[#1A1D23] rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-blue-400">
                <AlertCircle className="h-5 w-5" /> Sugerencia IA
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed italic">
                "Hemos detectado que {selectedCompany.name} podría beneficiarse de un análisis de mercado más profundo. ¿Has revisado a tus nuevos competidores?"
              </p>
              <Link to="/competitors" className="inline-block mt-4 text-sm font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200">
                Ver Competencia
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-4">Resumen {selectedCompany.name}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-gray-500">Sector</span>
                <span className="text-sm font-bold text-gray-900">{selectedCompany.sector}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm text-gray-500">Ubicación</span>
                <span className="text-sm font-bold text-gray-900">{selectedCompany.location}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-blue-600 w-[100%]" />
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
      <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 line-clamp-1">
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
