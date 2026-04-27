import { useAuth } from "../../lib/AuthContext";
import { LogIn } from "lucide-react";
import { motion } from "motion/react";

export function LoginForm() {
  const { signIn, error } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F1115] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-[#1A1D23] p-10 shadow-2xl border border-white/5 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-blue-500/20 shadow-lg">
          <LogIn className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">MarketMind SaaS</h2>
          <p className="mt-2 text-sm text-gray-400">
            Plataforma de marketing inteligente multi-empresa
          </p>
        </div>
        <button
          onClick={signIn}
          className="group relative flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-100 active:scale-95"
        >
          Entrar con Google
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}
        <p className="text-xs text-gray-500">
          Al iniciar sesión, aceptas nuestra política de privacidad y términos de servicio.
        </p>
      </motion.div>
    </div>
  );
}
