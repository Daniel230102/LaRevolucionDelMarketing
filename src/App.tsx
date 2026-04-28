/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { IdentityPage } from './pages/IdentityPage';
import { ProductsPage } from './pages/ProductsPage';
import { CompetitorsPage } from './pages/CompetitorsPage';
import { LeadsPage } from './pages/LeadsPage';
import { MarketingPage } from './pages/MarketingPage';
import { AutomationPage } from './pages/AutomationPage';
import { ROIPage } from './pages/ROIPage';
import { TrackReportPage } from './pages/TrackReportPage';
import { CompanyProvider, useCompany } from './lib/CompanyContext';
import { AnimatePresence } from 'motion/react';

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const location = useLocation();

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {(() => {
                  const path = location.pathname.endsWith('/') && location.pathname !== '/' 
                    ? location.pathname.slice(0, -1) 
                    : location.pathname;
                  
                  switch(path) {
                    case '/': return 'Panel de Control';
                    case '/identity': return 'Identidad';
                    case '/products': return 'Productos';
                    case '/competitors': return 'Competencia';
                    case '/leads': return 'Clientes / Leads';
                    case '/marketing': return 'Content Hub';
                    case '/automation': return 'Automatización';
                    case '/roi': return 'Estimación ROI';
                    case '/track': return 'Track Report';
                    default: return 'MarketMind';
                  }
                })()}
              </h1>
              <p className="text-sm text-gray-500">
                {selectedCompany ? `Gestión activa: ${selectedCompany.name}` : 'Selecciona una empresa para comenzar'}
              </p>
            </div>
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                  {user.email?.charAt(0).toUpperCase()}
               </div>
            </div>
          </header>
          <AnimatePresence mode="wait">
             {children}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <LoginForm />;
}

export default function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/identity" element={<ProtectedLayout><IdentityPage /></ProtectedLayout>} />
            <Route path="/products" element={<ProtectedLayout><ProductsPage /></ProtectedLayout>} />
            <Route path="/competitors" element={<ProtectedLayout><CompetitorsPage /></ProtectedLayout>} />
            <Route path="/leads" element={<ProtectedLayout><LeadsPage /></ProtectedLayout>} />
            <Route path="/marketing" element={<ProtectedLayout><MarketingPage /></ProtectedLayout>} />
            <Route path="/automation" element={<ProtectedLayout><AutomationPage /></ProtectedLayout>} />
            <Route path="/roi" element={<ProtectedLayout><ROIPage /></ProtectedLayout>} />
            <Route path="/track" element={<ProtectedLayout><TrackReportPage /></ProtectedLayout>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  );
}

