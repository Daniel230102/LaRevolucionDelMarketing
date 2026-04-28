import { GoogleGenAI } from "@google/genai";

// Support both standard AI Studio key and Vercel-style VITE_ prefixed keys
// Note: In Vite, import.meta.env is statically replaced during build.
// We use a safe check for process to avoid crashes in some environments.
const getApiKey = () => {
  try {
    return (
      import.meta.env.VITE_Marketing_API_KEY || 
      import.meta.env.VITE_GEMINI_API_KEY || 
      import.meta.env.VITE_MARKETING_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : null)
    );
  } catch (e) {
    return null;
  }
};

const apiKey = getApiKey();

if (!apiKey) {
  console.warn("GEMINI_API_KEY (o VITE_Marketing_API_KEY) no encontrada. La IA NO funcionará. Verifica las variables de entorno en Vercel o AI Studio.");
} else {
  console.log("Configuración de IA detectada.");
}

export const ai = new GoogleGenAI({ 
  apiKey: apiKey || "" 
});

export const MODELS = {
  flash: "gemini-flash-latest",
  pro: "gemini-3.1-pro-preview",
};
