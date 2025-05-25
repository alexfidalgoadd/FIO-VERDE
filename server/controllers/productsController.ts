import { Express, Request, Response } from "express";
import { IStorage } from "../storage";
import { z } from "zod";
import { insertProductSchema, insertProductCategorySchema } from "@shared/schema";

export function setupProductsRoutes(app: Express, storage: IStorage) {
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Get all products
  app.get("/api/products", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get visible products (for dispensary)
  app.get("/api/products/visible", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const products = await storage.getVisibleProducts();
      
      // Expand with category details
      const productsWithDetails = await Promise.all(products.map(async (product) => {
        const category = product.categoryId ? await storage.getProductCategory(product.categoryId) : null;
        const subcategory = product.subcategoryId ? await storage.getProductCategory(product.subcategoryId) : null;
        
        return {
          ...product,
          categoryName: category ? category.name : null,
          subcategoryName: subcategory ? subcategory.name : null,
        };
      }));
      
      res.json(productsWithDetails);
    } catch (error) {
      console.error("Error fetching visible products:", error);
      res.status(500).json({ message: "Failed to fetch visible products" });
    }
  });

  // Get featured products
  app.get("/api/products/featured", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const products = await storage.getFeaturedProducts(limit);
      
      // Expand with category details
      const productsWithDetails = await Promise.all(products.map(async (product) => {
        const category = product.categoryId ? await storage.getProductCategory(product.categoryId) : null;
        
        return {
          ...product,
          categoryName: category ? category.name : null,
        };
      }));
      
      res.json(productsWithDetails);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Search products
  app.get("/api/products/search", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      console.error(`Error searching products with query ${req.query.q}:`, error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Expand with category details
      const category = product.categoryId ? await storage.getProductCategory(product.categoryId) : null;
      const subcategory = product.subcategoryId ? await storage.getProductCategory(product.subcategoryId) : null;
      
      const result = {
        ...product,
        categoryName: category ? category.name : null,
        subcategoryName: subcategory ? subcategory.name : null,
      };
      
      res.json(result);
    } catch (error) {
      console.error(`Error fetching product ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create a new product
  app.post("/api/products", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate product data
      const validatedData = insertProductSchema.parse(req.body);
      
      // Check if category exists if provided
      if (validatedData.categoryId) {
        const category = await storage.getProductCategory(validatedData.categoryId);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
      }
      
      // Check if subcategory exists if provided
      if (validatedData.subcategoryId) {
        const subcategory = await storage.getProductCategory(validatedData.subcategoryId);
        if (!subcategory) {
          return res.status(404).json({ message: "Subcategory not found" });
        }
      }
      
      // Create the product
      const product = await storage.createProduct(validatedData);
      
      res.status(201).json({
        id: product.id,
        message: "Product created successfully",
      });
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product
  app.patch("/api/products/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if product exists
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Validate update data (partial schema)
      const validatedData = req.body;
      
      // Check if category exists if provided
      if (validatedData.categoryId) {
        const category = await storage.getProductCategory(validatedData.categoryId);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
      }
      
      // Check if subcategory exists if provided
      if (validatedData.subcategoryId) {
        const subcategory = await storage.getProductCategory(validatedData.subcategoryId);
        if (!subcategory) {
          return res.status(404).json({ message: "Subcategory not found" });
        }
      }
      
      // Update the product
      const updatedProduct = await storage.updateProduct(id, validatedData);
      
      res.json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error(`Error updating product ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if product exists
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Delete the product
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete product" });
      }
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error(`Error deleting product ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // --- PRODUCT CATEGORIES ---

  // Get all product categories
  app.get("/api/product-categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  // Get subcategories
  app.get("/api/product-categories/:id/subcategories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parentId = parseInt(req.params.id);
      
      // Check if parent category exists
      const parentCategory = await storage.getProductCategory(parentId);
      
      if (!parentCategory) {
        return res.status(404).json({ message: "Parent category not found" });
      }
      
      const subcategories = await storage.getSubcategories(parentId);
      res.json(subcategories);
    } catch (error) {
      console.error(`Error fetching subcategories for category ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  // Get products by category
  app.get("/api/product-categories/:id/products", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      // Check if category exists
      const category = await storage.getProductCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } catch (error) {
      console.error(`Error fetching products for category ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get category by ID
  app.get("/api/product-categories/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getProductCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error(`Error fetching category ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Create a new product category
  app.post("/api/product-categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate category data
      const validatedData = insertProductCategorySchema.parse(req.body);
      
      // Check if parent exists if provided
      if (validatedData.parentId) {
        const parent = await storage.getProductCategory(validatedData.parentId);
        if (!parent) {
          return res.status(404).json({ message: "Parent category not found" });
        }
      }
      
      // Create the category
      const category = await storage.createProductCategory(validatedData);
      
      res.status(201).json({
        id: category.id,
        message: "Category created successfully",
      });
    } catch (error) {
      console.error("Error creating product category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product category" });
    }
  });

  // Update product category
  app.patch("/api/product-categories/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if category exists
      const category = await storage.getProductCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Validate update data (partial schema)
      const validatedData = req.body;
      
      // Check if parent exists if provided
      if (validatedData.parentId) {
        const parent = await storage.getProductCategory(validatedData.parentId);
        if (!parent) {
          return res.status(404).json({ message: "Parent category not found" });
        }
        
        // Prevent circular reference
        if (validatedData.parentId === id) {
          return res.status(400).json({ message: "Category cannot be its own parent" });
        }
      }
      
      // Update the category
      const updatedCategory = await storage.updateProductCategory(id, validatedData);
      
      res.json({
        message: "Category updated successfully",
        category: updatedCategory,
      });
    } catch (error) {
      console.error(`Error updating category ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product category" });
    }
  });

  // Delete product category
  app.delete("/api/product-categories/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if category exists
      const category = await storage.getProductCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if there are subcategories
      const subcategories = await storage.getSubcategories(id);
      
      if (subcategories.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category with subcategories. Delete subcategories first." 
        });
      }
      
      // Check if there are products using this category
      const products = await storage.getProductsByCategory(id);
      
      if (products.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category with associated products. Update or delete products first." 
        });
      }
      
      // Delete the category
      const success = await storage.deleteProductCategory(id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete category" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error(`Error deleting category ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete product category" });
    }
  });
}