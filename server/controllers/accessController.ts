import { Express, Request, Response } from "express";
import { IStorage } from "../storage";
import { z } from "zod";
import { insertMemberAccessSchema } from "@shared/schema";

export function setupAccessRoutes(app: Express, storage: IStorage) {
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Get recent access logs
  app.get("/api/access/recent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const accessLogs = await storage.getRecentAccessLogs(limit);
      
      // Expand with member details
      const logsWithDetails = await Promise.all(accessLogs.map(async (log) => {
        const member = await storage.getMember(log.memberId);
        
        return {
          id: log.id,
          date: log.date,
          accessType: log.accessType,
          memberId: log.memberId,
          memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
          memberNumber: member?.memberNumber || "N/A",
          rfidNumber: member?.rfidNumber || null,
          verificationMethod: log.verificationMethod,
        };
      }));
      
      res.json(logsWithDetails);
    } catch (error) {
      console.error("Error fetching recent access logs:", error);
      res.status(500).json({ message: "Failed to fetch access logs" });
    }
  });

  // Get today's access logs
  app.get("/api/access/today", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const accessLogs = await storage.getTodayAccessLogs();
      
      // Expand with member details
      const logsWithDetails = await Promise.all(accessLogs.map(async (log) => {
        const member = await storage.getMember(log.memberId);
        
        return {
          id: log.id,
          date: log.date,
          accessType: log.accessType,
          memberId: log.memberId,
          memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
          memberNumber: member?.memberNumber || "N/A",
          rfidNumber: member?.rfidNumber || null,
          verificationMethod: log.verificationMethod,
        };
      }));
      
      res.json(logsWithDetails);
    } catch (error) {
      console.error("Error fetching today's access logs:", error);
      res.status(500).json({ message: "Failed to fetch access logs" });
    }
  });

  // Check access by RFID
  app.post("/api/access/check-rfid", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { rfidNumber } = req.body;
      
      if (!rfidNumber) {
        return res.status(400).json({ message: "RFID number is required" });
      }
      
      const member = await storage.getMemberByRFID(rfidNumber);
      
      if (!member) {
        return res.status(404).json({ 
          message: "Member not found",
          access: false 
        });
      }
      
      if (!member.active) {
        return res.status(403).json({ 
          message: "Member is inactive",
          access: false,
          member: {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            memberNumber: member.memberNumber,
            photo: member.photo,
            active: member.active,
          }
        });
      }
      
      // Create access log
      await storage.createMemberAccess({
        memberId: member.id,
        date: new Date(),
        accessType: "entry", // or "exit" depending on your system
        verificationMethod: "rfid",
        notes: "",
      });
      
      return res.json({
        message: "Access granted",
        access: true,
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          memberNumber: member.memberNumber,
          photo: member.photo,
          active: member.active,
        }
      });
    } catch (error) {
      console.error("Error checking RFID access:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to check access" });
    }
  });

  // Check access by member number
  app.post("/api/access/check-number", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { memberNumber } = req.body;
      
      if (!memberNumber) {
        return res.status(400).json({ message: "Member number is required" });
      }
      
      const member = await storage.getMemberByNumber(memberNumber);
      
      if (!member) {
        return res.status(404).json({ 
          message: "Member not found",
          access: false 
        });
      }
      
      if (!member.active) {
        return res.status(403).json({ 
          message: "Member is inactive",
          access: false,
          member: {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            memberNumber: member.memberNumber,
            photo: member.photo,
            active: member.active,
          }
        });
      }
      
      // Create access log
      await storage.createMemberAccess({
        memberId: member.id,
        date: new Date(),
        accessType: "entry", // or "exit" depending on your system
        verificationMethod: "number",
        notes: "",
      });
      
      return res.json({
        message: "Access granted",
        access: true,
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          memberNumber: member.memberNumber,
          photo: member.photo,
          active: member.active,
        }
      });
    } catch (error) {
      console.error("Error checking member number access:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to check access" });
    }
  });

  // Record member exit
  app.post("/api/access/exit/:memberId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.memberId);
      
      // Check if member exists
      const member = await storage.getMember(memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Create access log for exit
      await storage.createMemberAccess({
        memberId,
        date: new Date(),
        accessType: "exit",
        verificationMethod: "manual", // Or other method as appropriate
        notes: req.body.notes || "",
      });
      
      return res.json({
        message: "Exit recorded successfully",
      });
    } catch (error) {
      console.error("Error recording member exit:", error);
      res.status(500).json({ message: "Failed to record exit" });
    }
  });
}