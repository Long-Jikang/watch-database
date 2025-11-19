import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Image API - serve watch images from luxury_watches directory
  app.get("/api/images/:filename", (req, res) => {
    const { filename } = req.params;
    const imagePath = path.resolve(process.cwd(), "luxury_watches", filename);
    
    // Check if file exists
    if (fs.existsSync(imagePath)) {
      // Set appropriate content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 
                         ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                         ext === '.gif' ? 'image/gif' : 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.sendFile(imagePath);
    } else {
      // If file doesn't exist, try to find it in subdirectories
      const luxuryWatchesPath = path.resolve(process.cwd(), "luxury_watches");
      const findImageInSubdirs = (dir: string): string | null => {
        try {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
              const found = findImageInSubdirs(fullPath);
              if (found) return found;
            } else if (item.isFile() && item.name === filename) {
              return fullPath;
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${dir}:`, error);
        }
        return null;
      };
      
      const foundPath = findImageInSubdirs(luxuryWatchesPath);
      if (foundPath) {
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 
                           ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                           ext === '.gif' ? 'image/gif' : 'application/octet-stream';
        
        res.setHeader('Content-Type', contentType);
        res.sendFile(foundPath);
      } else {
        // Return 404 if image not found
        res.status(404).json({ error: 'Image not found' });
      }
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
