import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuthRoutes } from "./controllers/authController";
import { setupMembersRoutes } from "./controllers/membersController";
import { setupProductsRoutes } from "./controllers/productsController";
import { setupDispensaryRoutes } from "./controllers/dispensaryController";
import { setupAccessRoutes } from "./controllers/accessController";
import { setupAccountingRoutes } from "./controllers/accountingController";
import session from "express-session";
import passport from "passport";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session management
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "asos-club-secret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Register all routes
  setupAuthRoutes(app, storage);
  setupMembersRoutes(app, storage);
  setupProductsRoutes(app, storage);
  setupDispensaryRoutes(app, storage);
  setupAccessRoutes(app, storage);
  setupAccountingRoutes(app, storage);

  // For health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
