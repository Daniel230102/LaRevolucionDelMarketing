import { NavLink } from "react-router-dom";
import { 
  BarChart3, 
  Building2, 
  Users, 
  ShoppingBag, 
  Target, 
  PenTool, 
  Calendar, 
  Calculator, 
  ScrollText,
  LogOut,
  ChevronDown
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/AuthContext";
import { useCompany } from "../../lib/CompanyContext";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Panel de Control", icon: BarChart3 },
  { to: "/identidad", label: "Identidad", icon: Building2 },
  { to: "/productos", label: "Productos", icon: ShoppingBag },
  { to: "/competencia", label: "Competencia", icon: Target },
  { to: "/clientes", label: "Clientes / Leads", icon: Users },
  { to: "/marketing", label: "Content Hub", icon: PenTool },
  { to: "/automation", label: "Automatización", icon: Calendar },
  { to: "/roi", label: "Estimación ROI", icon: Calculator },
  { to: "/track", label: "Track Report", icon: ScrollText },
];

export function Sidebar() {
  const { logout } = useAuth();
  const { companies, selectedCompany, setSelectedCompany } = useCompany();
  const [showCompanySelect, setShowCompanySelect] = useState(false);

  return (
    <aside className="w-72 bg-[#151619] flex flex-col h-screen sticky top-0">
      <div className="p-8 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-center mb-8">
          <img 
            src="https://lh3.googleusercontent.com/d/1HG5B_tWxzUy7TAQ4yqZdVy-xfMPvjUdU" 
            alt="Logo" 
            className="w-full h-20 object-contain px-2"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowCompanySelect(!showCompanySelect)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Empresa Activa</span>
              <span className="text-sm font-semibold text-white truncate w-full text-left">
                {selectedCompany?.name || "Global"}
              </span>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", showCompanySelect && "rotate-180")} />
          </button>

          {showCompanySelect && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1D23] border border-white/10 rounded-xl shadow-2xl z-50 py-2 max-h-48 overflow-y-auto">
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCompany(c);
                    setShowCompanySelect(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/5",
                    selectedCompany?.id === c.id ? "text-blue-400 font-bold" : "text-gray-300"
                  )}
                >
                  {c.name}
                </button>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <NavLink 
                to="/identidad" 
                className="block px-4 py-2 text-sm text-blue-500 hover:bg-white/5"
                onClick={() => setShowCompanySelect(false)}
              >
                + Nueva Empresa
              </NavLink>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              isActive 
                ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 mt-auto">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
