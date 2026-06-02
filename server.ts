import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API to list video frames
  app.get("/api/frames", (req, res) => {
    const videoDir = path.join(process.cwd(), "public", "video");
    
    if (!fs.existsSync(videoDir)) {
      return res.json({ frames: [] });
    }

    try {
      const files = fs.readdirSync(videoDir)
        .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        .map(file => `/video/${file}`);
      
      res.json({ frames: files });
    } catch (error) {
      console.error("Error reading video directory:", error);
      res.status(500).json({ error: "Failed to list frames" });
    }
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
