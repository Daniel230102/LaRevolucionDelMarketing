import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Example Scraper API (Structured extraction placeholder)
  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    
    // In a real app, you'd use puppeteer or a service like Firecrawl
    // For this context, we will return a 'ready to analyze' status
    // The frontend will actually pick up the URL and use Gemini with Search Grounding
    res.json({
      success: true,
      message: "Target URL analysis context prepared",
      url
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
