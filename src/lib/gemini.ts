import { GoogleGenAI } from "@google/genai";

// Support both standard AI Studio key, Vercel-style VITE_ prefixed key, and the user's custom key
const apiKey = 
  (import.meta as any).env?.VITE_GEMINI_API_KEY || 
  (import.meta as any).env?.VITE_MARKETING_API_KEY || 
  (import.meta as any).env?.VITE_Marketing_API_KEY || 
  process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY not found in environment variables. AI features may not work.");
}

export const ai = new GoogleGenAI({ 
  apiKey: apiKey || "" 
});

export const MODELS = {
  flash: "gemini-3-flash-preview",
  pro: "gemini-3.1-pro-preview",
  image: "gemini-2.5-flash-image",
};
