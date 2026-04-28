import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { LogIn, ArrowRight, BarChart3, Building2, Target, Zap, X, Shield, FileText, LifeBuoy, TrendingUp, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function LoginForm() {
  const { signIn, error } = useAuth();
  const [activeModal, setActiveModal] = useState<"privacy" | "terms" | "support" | null>(null);

  const logoUrl = "https://lh3.googleusercontent.com/d/1HG5B_tWxzUy7TAQ4yqZdVy-xfMPvjUdU";

  const modalContent = {
    privacy: {
      title: "Política de Privacidad",
      icon: <Shield className="h-6 w-6 text-blue-500" />,
      content: "Tu privacidad es nuestra prioridad. En MarketMind SaaS, recolectamos únicamente la información necesaria para el funcionamiento de la plataforma a través de Google OAuth. Esto incluye tu nombre y correo electrónico para identificarte como usuario. No compartimos tus datos con terceros ni los utilizamos para fines publicitarios sin tu consentimiento explícito. Todos los datos de tus empresas están encriptados y protegidos siguiendo los estándares de la industria."
    },
    terms: {
      title: "Términos de Servicio",
      icon: <FileText className="h-6 w-6 text-purple-500" />,
      content: "Al utilizar MarketMind SaaS, aceptas nuestros términos de servicio. Esta plataforma está diseñada para la gestión empresarial y análisis de marketing. El usuario es responsable de la veracidad de los datos introducidos y del uso ético de la información de competencia obtenida. Nos reservamos el derecho de suspender cuentas que infrinjan las políticas de uso o realicen actividades que comprometan la integridad de la plataforma o de otros usuarios."
    },
    support: {
      title: "Centro de Soporte",
      icon: <LifeBuoy className="h-6 w-6 text-emerald-500" />,
      content: "¿Necesitas ayuda? Nuestro equipo de soporte está disponible para asistirte. Puedes contactarnos a través de soporte@marketmind.ai para cualquier consulta técnica o administrativa. También ofrecemos sesiones de consultoría personalizadas para ayudarte a configurar tus empresas y estrategias de automatización de manera óptima."
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white selection:bg-blue-500/30">
      {/* Top Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0F1115]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-end px-6">
          <button
            onClick={signIn}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-gray-100 hover:scale-105 active:scale-95"
          >
            Entrar con Google
          </button>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-12 pb-10 text-center lg:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl"
          >
            <div className="mb-6 flex justify-center">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-48 w-auto object-contain drop-shadow-2xl" 
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
              Domina tu mercado con <span className="text-blue-500">inteligencia</span> real.
            </h1>
            <p className="mx-auto mb-4 max-w-2xl text-lg text-gray-400 sm:text-xl">
              La plataforma definitiva para gestionar múltiples empresas, analizar la competencia y automatizar tu crecimiento desde un único lugar.
            </p>
          </motion.div>

          {/* Abstract Background Decoration */}
          <div className="absolute top-0 -z-10 h-full w-full opacity-20 blur-[100px]">
            <div className="absolute top-1/2 left-1/4 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-600" />
            <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-indigo-600" />
          </div>
        </section>

        {/* Features Sections */}
        <section className="mx-auto max-w-7xl px-6 py-12 space-y-32">
          {/* Feature 1: Multi-company */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid gap-12 lg:grid-cols-2 lg:items-center"
          >
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">Gestión Multi-Empresa Sin Esfuerzo</h2>
              <p className="text-lg text-gray-400">
                Cambia entre tus diferentes entidades de negocio al instante. Nuestra arquitectura te permite mantener datos aislados pero con una visión global consolidada.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2 italic">✓ Paneles individuales por compañía</li>
                <li className="flex items-center gap-2 italic">✓ Reportes centralizados de rendimiento</li>
                <li className="flex items-center gap-2 italic">✓ Configuración personalizada por marca</li>
              </ul>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur group-hover:opacity-30 transition"></div>
              <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#1A1D23]">
                <img 
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop" 
                  alt="Multi-company Analysis"
                  className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D23] via-transparent to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Competitors */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid gap-12 lg:grid-cols-2 lg:items-center"
          >
            <div className="order-2 lg:order-1 relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-20 blur group-hover:opacity-30 transition"></div>
              <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#1A1D23]">
                <img 
                  src="https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=800&auto=format&fit=crop" 
                  alt="Competitor Strategy"
                  className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D23] via-transparent to-transparent" />
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">Vigila a tu Competencia</h2>
              <p className="text-lg text-gray-400">
                No te quedes atrás. Analiza lo que hacen tus competidores, descubre sus debilidades y aprovecha las oportunidades antes que nadie.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2 italic">✓ Seguimiento de precios y stock</li>
                <li className="flex items-center gap-2 italic">✓ Análisis de posicionamiento SEO</li>
                <li className="flex items-center gap-2 italic">✓ Alertas de cambios en el mercado</li>
              </ul>
            </div>
          </motion.div>

          {/* Feature 3: ROI & Analytics */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid gap-12 lg:grid-cols-2 lg:items-center"
          >
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">Maximiza tu Retorno (ROI)</h2>
              <p className="text-lg text-gray-400">
                Visualiza con claridad dónde estás ganando dinero. Nuestro motor de analítica cruza tus gastos con resultados reales para optimizar cada céntimo.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2 italic">✓ Atribución de ventas inteligente</li>
                <li className="flex items-center gap-2 italic">✓ Gráficos de tendencias en tiempo real</li>
                <li className="flex items-center gap-2 italic">✓ Exportación de informes para inversores</li>
              </ul>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 opacity-20 blur group-hover:opacity-30 transition"></div>
              <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#1A1D23]">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop" 
                  alt="ROI Data Science"
                  className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D23] via-transparent to-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Feature 4: Lead Management */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid gap-12 lg:grid-cols-2 lg:items-center"
          >
             <div className="order-2 lg:order-1 relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-600 opacity-20 blur group-hover:opacity-30 transition"></div>
              <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#1A1D23]">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop" 
                  alt="Team Collaboration Leads"
                  className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D23] via-transparent to-transparent" />
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">Gestión de Leads Cualificados</h2>
              <p className="text-lg text-gray-400">
                No pierdas ni una sola oportunidad. Centralizamos todos tus prospectos y les asignamos un nivel de prioridad basado en su intención de compra.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2 italic">✓ Captura desde múltiples canales</li>
                <li className="flex items-center gap-2 italic">✓ Scoring de leads automático</li>
                <li className="flex items-center gap-2 italic">✓ Historial completo de interacción</li>
              </ul>
            </div>
          </motion.div>

          {/* Feature 5: Automation */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-12 lg:grid-cols-2 lg:items-center"
          >
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Zap className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold sm:text-4xl">Automatización de Marketing</h2>
              <p className="text-lg text-gray-400">
                Libera tiempo valioso. Deja que nuestras herramientas inteligentes gestionen tus campañas, correos y reportes automáticamente.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2 italic">✓ Flujos de trabajo personalizados</li>
                <li className="flex items-center gap-2 italic">✓ Integración con redes sociales</li>
                <li className="flex items-center gap-2 italic">✓ Notificaciones predictivas de IA</li>
              </ul>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-20 blur group-hover:opacity-30 transition"></div>
              <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#1A1D23]">
                <img 
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop" 
                  alt="High Tech Automation"
                  className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D23] via-transparent to-transparent" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-4xl px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-blue-600/10 border border-blue-500/20 p-12 lg:p-20 shadow-[0_0_50px_rgba(37,99,235,0.1)]"
          >
            <h2 className="mb-6 text-4xl font-extrabold sm:text-5xl">¿Listo para escalar al siguiente nivel?</h2>
            <p className="mb-10 text-xl text-gray-400">
              Únete a las empresas que ya están transformando sus datos en decisiones inteligentes. No requiere tarjeta de crédito.
            </p>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={signIn}
                className="group flex items-center gap-3 rounded-2xl bg-white px-10 py-5 text-xl font-bold text-black transition-all hover:bg-gray-100 hover:scale-105 active:scale-95"
              >
                Prueba nuestra app
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </button>
              {error && <p className="mt-4 text-red-400">{error}</p>}
              <p className="text-sm text-gray-500">Inicio de sesión rápido con Google</p>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">© 2026 Todos los derechos reservados.</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <button onClick={() => setActiveModal("privacy")} className="hover:text-white transition cursor-pointer">Privacidad</button>
            <button onClick={() => setActiveModal("terms")} className="hover:text-white transition cursor-pointer">Términos</button>
            <button onClick={() => setActiveModal("support")} className="hover:text-white transition cursor-pointer">Soporte</button>
          </div>
        </div>
      </footer>

      {/* Modal System */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl bg-[#1A1D23] border border-white/10 p-8 shadow-2xl"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 mb-6">
                {modalContent[activeModal].icon}
                <h3 className="text-2xl font-bold">{modalContent[activeModal].title}</h3>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed">
                  {modalContent[activeModal].content}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="mt-8 w-full rounded-xl bg-white/5 py-3 font-semibold text-white hover:bg-white/10 transition"
              >
                Cerrar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

