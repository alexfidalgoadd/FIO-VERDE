import { Express, Request, Response } from "express";
import { IStorage } from "../storage";
import { z } from "zod";
import { insertMemberSchema } from "@shared/schema";

export function setupMembersRoutes(app: Express, storage: IStorage) {
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Get all members
  app.get("/api/members", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      let members;
      if (query && query.length > 2) {
        members = await storage.searchMembers(query);
      } else {
        members = await storage.getAllMembers();
      }
      
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Get active members
  app.get("/api/members/active", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const members = await storage.getActiveMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching active members:", error);
      res.status(500).json({ message: "Failed to fetch active members" });
    }
  });

  // Search members
  app.get("/api/members/search", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 3) {
        return res.status(400).json({ message: "Search query must be at least 3 characters" });
      }
      
      const members = await storage.searchMembers(query);
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ message: "Failed to search members" });
    }
  });

  // Get member by RFID
  app.get("/api/members/rfid", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const rfidNumber = req.query.rfid as string;
      
      if (!rfidNumber) {
        return res.status(400).json({ message: "RFID number is required" });
      }
      
      const member = await storage.getMemberByRFID(rfidNumber);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Get member type info
      const memberType = member.memberTypeId 
        ? await storage.getMemberType(member.memberTypeId)
        : null;
      
      res.json({
        ...member,
        memberTypeName: memberType?.name || "Sin tipo",
      });
    } catch (error) {
      console.error("Error fetching member by RFID:", error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  // Get recent members
  app.get("/api/members/recent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const members = await storage.getRecentMembers(limit);
      res.json(members);
    } catch (error) {
      console.error("Error fetching recent members:", error);
      res.status(500).json({ message: "Failed to fetch recent members" });
    }
  });

  // Get member's dispense limits
  app.get("/api/members/dispense-limits", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.query.memberId as string);
      
      if (!memberId) {
        return res.status(400).json({ message: "Member ID is required" });
      }
      
      const member = await storage.getMember(memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Get member type info for limits
      const memberType = member.memberTypeId 
        ? await storage.getMemberType(member.memberTypeId)
        : null;
      
      // Calculate current usage (simplified for demo)
      // In a real app, you would calculate based on actual dispensations
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get all dispensations for this member
      const allDispenses = await storage.getMemberDispenses(memberId);
      
      // Calculate daily usage
      const todayDispenses = allDispenses.filter(d => new Date(d.date) >= startOfDay);
      let dailyUsage = 0;
      
      for (const dispense of todayDispenses) {
        const items = await storage.getDispenseItems(dispense.id);
        dailyUsage += items.reduce((sum, item) => sum + item.quantity, 0);
      }
      
      // Calculate monthly usage
      const monthDispenses = allDispenses.filter(d => new Date(d.date) >= startOfMonth);
      let monthlyUsage = 0;
      
      for (const dispense of monthDispenses) {
        const items = await storage.getDispenseItems(dispense.id);
        monthlyUsage += items.reduce((sum, item) => sum + item.quantity, 0);
      }
      
      res.json({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        memberNumber: member.memberNumber,
        dispenseLimitDaily: memberType?.dispenseLimitDaily,
        dispenseLimitMonthly: memberType?.dispenseLimitMonthly,
        currentDailyUsage: dailyUsage,
        currentMonthlyUsage: monthlyUsage,
      });
    } catch (error) {
      console.error("Error fetching member dispense limits:", error);
      res.status(500).json({ message: "Failed to fetch dispense limits" });
    }
  });

  // Get specific member
  app.get("/api/members/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Get member type info
      const memberType = member.memberTypeId 
        ? await storage.getMemberType(member.memberTypeId)
        : null;
      
      // Get sponsor info if present
      const sponsor = member.sponsorId 
        ? await storage.getMember(member.sponsorId)
        : null;
      
      const result = {
        ...member,
        memberType: memberType ? {
          id: memberType.id,
          name: memberType.name,
          monthlyFee: memberType.monthlyFee,
        } : null,
        sponsor: sponsor ? {
          id: sponsor.id,
          memberNumber: sponsor.memberNumber,
          firstName: sponsor.firstName,
          lastName: sponsor.lastName,
        } : null,
      };
      
      res.json(result);
    } catch (error) {
      console.error(`Error fetching member ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  // Get member dispenses
  app.get("/api/members/:id/dispenses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const dispenses = await storage.getMemberDispenses(id);
      
      // Expand dispense items
      const result = [];
      
      for (const dispense of dispenses) {
        const items = await storage.getDispenseItems(dispense.id);
        
        // Get product names
        const itemsWithDetails = [];
        for (const item of items) {
          const product = await storage.getProduct(item.productId);
          itemsWithDetails.push({
            id: item.id,
            productId: item.productId,
            productName: product ? product.name : "Unknown Product",
            quantity: item.quantity,
            price: item.price,
          });
        }
        
        result.push({
          id: dispense.id,
          date: dispense.date,
          totalPrice: dispense.totalPrice,
          items: itemsWithDetails,
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error(`Error fetching member dispenses ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch member dispenses" });
    }
  });

  // Get member access logs
  app.get("/api/members/:id/accesses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const accesses = await storage.getMemberAccessLogs(id);
      res.json(accesses);
    } catch (error) {
      console.error(`Error fetching member accesses ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch member accesses" });
    }
  });

  // Create new member
  app.post("/api/members", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertMemberSchema.parse(req.body);
      
      // Generate member number (in a real app, use a more robust method)
      const allMembers = await storage.getAllMembers();
      const memberNumber = `S-${String(allMembers.length + 1).padStart(4, '0')}`;
      
      const newMember = await storage.createMember({
        ...validatedData,
        memberNumber,
      });
      
      res.status(201).json(newMember);
    } catch (error) {
      console.error("Error creating member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  // Update member
  app.patch("/api/members/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Only validate provided fields
      const updateSchema = insertMemberSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedMember = await storage.updateMember(id, validatedData);
      res.json(updatedMember);
    } catch (error) {
      console.error(`Error updating member ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  // Delete member
  app.delete("/api/members/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const deleted = await storage.deleteMember(id);
      
      if (deleted) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete member" });
      }
    } catch (error) {
      console.error(`Error deleting member ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Get member types
  app.get("/api/member-types", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberTypes = await storage.getAllMemberTypes();
      res.json(memberTypes);
    } catch (error) {
      console.error("Error fetching member types:", error);
      res.status(500).json({ message: "Failed to fetch member types" });
    }
  });

  // Create member type
  app.post("/api/member-types", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const newMemberType = await storage.createMemberType(req.body);
      res.status(201).json(newMemberType);
    } catch (error) {
      console.error("Error creating member type:", error);
      res.status(500).json({ message: "Failed to create member type" });
    }
  });

  // Update member type
  app.patch("/api/member-types/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const memberType = await storage.getMemberType(id);
      
      if (!memberType) {
        return res.status(404).json({ message: "Member type not found" });
      }
      
      const updatedMemberType = await storage.updateMemberType(id, req.body);
      res.json(updatedMemberType);
    } catch (error) {
      console.error(`Error updating member type ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update member type" });
    }
  });

  // Delete member type
  app.delete("/api/member-types/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const memberType = await storage.getMemberType(id);
      
      if (!memberType) {
        return res.status(404).json({ message: "Member type not found" });
      }
      
      const deleted = await storage.deleteMemberType(id);
      
      if (deleted) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete member type" });
      }
    } catch (error) {
      console.error(`Error deleting member type ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete member type" });
    }
  });
}
