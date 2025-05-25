import { Express, Request, Response } from "express";
import { IStorage } from "../storage";
import { z } from "zod";
import { insertDispenseSchema, insertDispenseItemSchema } from "@shared/schema";

export function setupDispensaryRoutes(app: Express, storage: IStorage) {
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Get recent dispenses
  app.get("/api/dispenses/recent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const dispenses = await storage.getRecentDispenses(limit);
      
      // Expand with member and product details
      const dispensesWithDetails = await Promise.all(dispenses.map(async (dispense) => {
        const member = await storage.getMember(dispense.memberId);
        const items = await storage.getDispenseItems(dispense.id);
        
        // Get product details for each item
        const itemsWithDetails = await Promise.all(items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          const category = product?.categoryId ? await storage.getProductCategory(product.categoryId) : null;
          const subcategory = product?.subcategoryId ? await storage.getProductCategory(product.subcategoryId) : null;
          
          return {
            id: item.id,
            productId: item.productId,
            productName: product ? product.name : "Unknown Product",
            productCategory: category ? category.name : "Unknown Category",
            productSubcategory: subcategory ? subcategory.name : null,
            quantity: item.quantity,
            price: item.price,
          };
        }));
        
        return {
          id: dispense.id,
          date: dispense.date,
          totalPrice: dispense.totalPrice,
          member: member ? {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            memberNumber: member.memberNumber,
            photo: member.photo,
          } : null,
          items: itemsWithDetails,
        };
      }));
      
      res.json(dispensesWithDetails);
    } catch (error) {
      console.error("Error fetching recent dispenses:", error);
      res.status(500).json({ message: "Failed to fetch recent dispenses" });
    }
  });

  // Create a new dispense
  app.post("/api/dispenses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate dispense data
      const { memberId, items, totalPrice } = req.body;
      
      // Check if member exists
      const member = await storage.getMember(memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Check if member is active
      if (!member.active) {
        return res.status(400).json({ message: "Cannot dispense to inactive member" });
      }
      
      // Validate items
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Dispense must include at least one item" });
      }
      
      // Create the dispense record
      const dispense = await storage.createDispense({
        memberId,
        totalPrice,
        date: new Date(),
        notes: "",
      });
      
      // Process each item
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        
        if (!product) {
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }
        
        // Check if there's enough stock
        if (product.stockQuantity < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}g, Requested: ${item.quantity}g` 
          });
        }
        
        // Create dispense item
        await storage.createDispenseItem({
          dispenseId: dispense.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price * item.quantity,
          discountId: null,
          discountAmount: 0,
        });
        
        // Update product stock
        await storage.updateProduct(product.id, {
          stockQuantity: product.stockQuantity - item.quantity,
        });
      }
      
      // Create accounting entry for the dispense
      await storage.createAccountingEntry({
        type: "income",
        amount: totalPrice,
        concept: `Dispensa #${dispense.id}`,
        date: new Date(),
        dispenseId: dispense.id,
        memberId,
        notes: `Dispensa a ${member.firstName} ${member.lastName}`,
      });
      
      res.status(201).json({
        id: dispense.id,
        message: "Dispense created successfully",
      });
    } catch (error) {
      console.error("Error creating dispense:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create dispense" });
    }
  });

  // Get dispense details
  app.get("/api/dispenses/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const dispense = await storage.getDispense(id);
      
      if (!dispense) {
        return res.status(404).json({ message: "Dispense not found" });
      }
      
      const member = await storage.getMember(dispense.memberId);
      const items = await storage.getDispenseItems(dispense.id);
      
      // Get product details for each item
      const itemsWithDetails = await Promise.all(items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        
        return {
          id: item.id,
          productId: item.productId,
          productName: product ? product.name : "Unknown Product",
          quantity: item.quantity,
          price: item.price,
          discountAmount: item.discountAmount,
        };
      }));
      
      const result = {
        id: dispense.id,
        date: dispense.date,
        totalPrice: dispense.totalPrice,
        notes: dispense.notes,
        member: member ? {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          memberNumber: member.memberNumber,
        } : null,
        items: itemsWithDetails,
      };
      
      res.json(result);
    } catch (error) {
      console.error(`Error fetching dispense ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch dispense" });
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Count members
      const members = await storage.getAllMembers();
      const totalMembers = members.length;
      
      // Count active products
      const products = await storage.getAllProducts();
      const activeProducts = products.filter(p => p.visibleInDispensary).length;
      
      // Count today's dispenses
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dispenses = await storage.getRecentDispenses(100); // Get more than enough
      const todaySales = dispenses.filter(d => new Date(d.date) >= today).length;
      
      // Count today's visits (entries)
      const accesses = await storage.getTodayAccessLogs();
      const todayVisits = accesses.filter(a => a.accessType === "entry").length;
      
      res.json({
        totalMembers,
        activeProducts,
        todaySales,
        todayVisits,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });
}
