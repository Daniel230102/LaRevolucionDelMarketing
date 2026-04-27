import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("AuthProvider: Initializing Auth Listener");
    return onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed: ", user ? `User logged in: ${user.email}` : "No user session");
      if (user) {
        try {
          const userDoc = doc(db, 'users', user.uid);
          const snapshot = await getDoc(userDoc);
          if (!snapshot.exists()) {
            console.log("AuthProvider: Creating new user profile in Firestore");
            await setDoc(userDoc, {
              email: user.email,
              managedCompanies: [],
              createdAt: new Date().toISOString()
            });
          }
        } catch (e: any) {
          console.error("AuthProvider: Error syncing user profile with Firestore", e);
          if (e.code === 'permission-denied') {
            // Log with more detail if possible
          }
        }
      }
      setUser(user);
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    setError(null);
    console.log("AuthProvider: Starting Sign In with Popup");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      console.log("AuthProvider: Sign In Success", result.user.email);
    } catch (err: any) {
      console.error("AuthProvider: Sign In Error Details:", err);
      let message = "Error al iniciar sesión.";
      
      if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        message = `Dominio no autorizado. Debes añadir "${domain}" en la consola de Firebase > Authentication > Settings > Authorized Domains.`;
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = "La ventana se cerró antes de completar el proceso. Inténtalo de nuevo.";
      } else if (err.code === 'auth/operation-not-allowed') {
        message = "El proveedor de Google no está habilitado en tu consola de Firebase.";
      } else if (err.code === 'auth/popup-blocked') {
        message = "El navegador bloqueó la ventana emergente. Por favor, permite popups para este sitio.";
      } else {
        message = `Error (${err.code}): ${err.message}`;
      }
      setError(message);
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
