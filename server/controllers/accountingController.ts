import { Express, Request, Response } from "express";
import { IStorage } from "../storage";
import { z } from "zod";
import { insertAccountingSchema } from "@shared/schema";

export function setupAccountingRoutes(app: Express, storage: IStorage) {
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Get all accounting entries with optional date range
  app.get("/api/accounting", isAuthenticated, async (req: Request, res: Response) => {
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const entries = await storage.getAccountingEntries(startDate, endDate);
      
      // Expand with member details if applicable
      const entriesWithDetails = await Promise.all(entries.map(async (entry) => {
        let memberName = null;
        
        if (entry.memberId) {
          const member = await storage.getMember(entry.memberId);
          if (member) {
            memberName = `${member.firstName} ${member.lastName}`;
          }
        }
        
        return {
          ...entry,
          memberName,
        };
      }));
      
      res.json(entriesWithDetails);
    } catch (error) {
      console.error("Error fetching accounting entries:", error);
      res.status(500).json({ message: "Failed to fetch accounting entries" });
    }
  });

  // Get accounting entries for a specific member
  app.get("/api/accounting/member/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.id);
      
      // Check if member exists
      const member = await storage.getMember(memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const entries = await storage.getMemberAccountingEntries(memberId);
      
      res.json(entries);
    } catch (error) {
      console.error(`Error fetching accounting entries for member ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch accounting entries" });
    }
  });

  // Get specific accounting entry
  app.get("/api/accounting/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getAccountingEntry(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Accounting entry not found" });
      }
      
      // Expand with member details if applicable
      let memberName = null;
      
      if (entry.memberId) {
        const member = await storage.getMember(entry.memberId);
        if (member) {
          memberName = `${member.firstName} ${member.lastName}`;
        }
      }
      
      const result = {
        ...entry,
        memberName,
      };
      
      res.json(result);
    } catch (error) {
      console.error(`Error fetching accounting entry ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch accounting entry" });
    }
  });

  // Create a new accounting entry
  app.post("/api/accounting", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertAccountingSchema.parse(req.body);
      
      // If member ID is provided, check if member exists
      if (validatedData.memberId) {
        const member = await storage.getMember(validatedData.memberId);
        
        if (!member) {
          return res.status(404).json({ message: "Member not found" });
        }
      }
      
      // Create accounting entry
      const entry = await storage.createAccountingEntry(validatedData);
      
      res.status(201).json({
        id: entry.id,
        message: "Accounting entry created successfully",
      });
    } catch (error) {
      console.error("Error creating accounting entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create accounting entry" });
    }
  });

  // Get monthly summary (income/expense totals by month)
  app.get("/api/accounting/summary/monthly", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get all accounting entries
      const entries = await storage.getAccountingEntries();
      
      // Group by month and type
      const summary: Record<string, { income: number; expense: number }> = {};
      
      for (const entry of entries) {
        const date = new Date(entry.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!summary[monthKey]) {
          summary[monthKey] = { income: 0, expense: 0 };
        }
        
        if (entry.type === 'income') {
          summary[monthKey].income += entry.amount;
        } else if (entry.type === 'expense') {
          summary[monthKey].expense += entry.amount;
        }
      }
      
      // Convert to array and sort by date
      const result = Object.entries(summary).map(([month, data]) => ({
        month,
        ...data,
        balance: data.income - data.expense,
      })).sort((a, b) => a.month.localeCompare(b.month));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching accounting summary:", error);
      res.status(500).json({ message: "Failed to fetch accounting summary" });
    }
  });
}