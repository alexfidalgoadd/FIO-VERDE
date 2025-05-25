import { Express, Request, Response } from "express";
import { IStorage } from "../storage";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { loginSchema } from "@shared/schema";
import { z } from "zod";

export function setupAuthRoutes(app: Express, storage: IStorage) {
  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find user by username
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Usuario no encontrado" });
        }
        
        // Simple password check (in a real app, use bcrypt)
        if (user.password !== password) {
          return done(null, false, { message: "Contraseña incorrecta" });
        }
        
        // Update last login time
        await storage.updateUser(user.id, { 
          lastLogin: new Date() 
        });
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user to the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error("Usuario no encontrado"), null);
      }
      
      // Get role information
      if (user.roleId) {
        const role = await storage.getRole(user.roleId);
        if (role) {
          (user as any).role = role;
        }
      }
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Login route
  app.post("/api/auth/login", (req, res, next) => {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Error de autenticación" });
        }
        
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: err.message });
          }
          
          // Don't send password to client
          const { password, ...userWithoutPassword } = user;
          
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Datos de inicio de sesión inválidos",
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get current user
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send password to client
    const { password, ...userWithoutPassword } = req.user as any;
    
    res.json(userWithoutPassword);
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      
      res.status(200).json({ message: "Sesión cerrada correctamente" });
    });
  });
}