import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  doublePrecision, 
  json, 
  date, 
  varchar, 
  uniqueIndex 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  permissions: json("permissions").$type<string[]>().default(['view:own']),
});

// User accounts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  active: boolean("active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Member types (Honorific, Therapeutic, Medical, etc.)
export const memberTypes = pgTable("member_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  dispenseLimitDaily: doublePrecision("dispense_limit_daily"),
  dispenseLimitMonthly: doublePrecision("dispense_limit_monthly"),
  monthlyFee: doublePrecision("monthly_fee").default(0),
  description: text("description"),
});

// Club members
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  memberNumber: text("member_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  dni: text("dni").notNull(),
  birthDate: date("birth_date"),
  photo: text("photo"),
  sponsorId: integer("sponsor_id").references(() => members.id),
  joinDate: date("join_date").defaultNow(),
  lastFeeDate: date("last_fee_date"),
  nextFeeDate: date("next_fee_date"),
  email: text("email"),
  instagram: text("instagram"),
  telegram: text("telegram"),
  customSocial1: text("custom_social_1"),
  customSocial2: text("custom_social_2"),
  communicationPrefs: json("communication_prefs").$type<string[]>(),
  gdprConsent: timestamp("gdpr_consent"),
  gdprConsentMethod: text("gdpr_consent_method"),
  memberTypeId: integer("member_type_id").references(() => memberTypes.id),
  rfidNumber: text("rfid_number").unique(),
  userId: integer("user_id").references(() => users.id),
  active: boolean("active").default(true),
  notes: text("notes"),
});

// Product categories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id").references(() => productCategories.id),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => productCategories.id),
  subcategoryId: integer("subcategory_id").references(() => productCategories.id),
  stockQuantity: doublePrecision("stock_quantity").default(0),
  price: doublePrecision("price").notNull(),
  image: text("image"),
  entryDate: date("entry_date").defaultNow(),
  thcPercentage: doublePrecision("thc_percentage"),
  strainType: text("strain_type"), // Indica/Sativa/Hybrid
  terpenes: text("terpenes"),
  genetics: text("genetics"),
  visibleInDispensary: boolean("visible_in_dispensary").default(true),
  brand: text("brand"),
  notes: text("notes"),
  minStockAlert: doublePrecision("min_stock_alert"),
  batchNumber: text("batch_number"),
});

// Discounts
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  percentage: doublePrecision("percentage"),
  memberTypeId: integer("member_type_id").references(() => memberTypes.id),
  productId: integer("product_id").references(() => products.id),
  categoryId: integer("category_id").references(() => productCategories.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  active: boolean("active").default(true),
});

// Dispenses (product sales)
export const dispenses = pgTable("dispenses", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  date: timestamp("date").defaultNow(),
  totalPrice: doublePrecision("total_price").notNull(),
  notes: text("notes"),
});

// Dispense items
export const dispenseItems = pgTable("dispense_items", {
  id: serial("id").primaryKey(),
  dispenseId: integer("dispense_id").references(() => dispenses.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: doublePrecision("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  discountId: integer("discount_id").references(() => discounts.id),
  discountAmount: doublePrecision("discount_amount").default(0),
});

// Member access logs
export const memberAccesses = pgTable("member_accesses", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  accessType: text("access_type").notNull(), // "entry" or "exit"
  date: timestamp("date").defaultNow(),
  verificationMethod: text("verification_method").default("manual"), // "rfid", "number", "manual", etc.
  notes: text("notes"),
  rfidNumber: text("rfid_number"),
});

// Accounting
export const accounting = pgTable("accounting", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow(),
  type: text("type").notNull(), // "income" or "expense"
  amount: doublePrecision("amount").notNull(),
  concept: text("concept").notNull(),
  dispenseId: integer("dispense_id").references(() => dispenses.id),
  memberId: integer("member_id").references(() => members.id),
  notes: text("notes"),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, lastLogin: true, createdAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertMemberTypeSchema = createInsertSchema(memberTypes).omit({ id: true });
export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export const insertProductCategorySchema = createInsertSchema(productCategories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertDiscountSchema = createInsertSchema(discounts).omit({ id: true });
export const insertDispenseSchema = createInsertSchema(dispenses).omit({ id: true });
export const insertDispenseItemSchema = createInsertSchema(dispenseItems).omit({ id: true });
export const insertMemberAccessSchema = createInsertSchema(memberAccesses).omit({ id: true });
export const insertAccountingSchema = createInsertSchema(accounting).omit({ id: true });

// Authentication schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types for database operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertMemberType = z.infer<typeof insertMemberTypeSchema>;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertDiscount = z.infer<typeof insertDiscountSchema>;
export type InsertDispense = z.infer<typeof insertDispenseSchema>;
export type InsertDispenseItem = z.infer<typeof insertDispenseItemSchema>;
export type InsertMemberAccess = z.infer<typeof insertMemberAccessSchema>;
export type InsertAccounting = z.infer<typeof insertAccountingSchema>;

// Types for selected entities
export type User = typeof users.$inferSelect;
export type RoleType = typeof roles.$inferSelect;
export type MemberTypeObject = typeof memberTypes.$inferSelect;
export type Member = typeof members.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Discount = typeof discounts.$inferSelect;
export type Dispense = typeof dispenses.$inferSelect;
export type DispenseItem = typeof dispenseItems.$inferSelect;
export type MemberAccess = typeof memberAccesses.$inferSelect;
export type AccountingEntry = typeof accounting.$inferSelect;

// Login type
export type Login = z.infer<typeof loginSchema>;

// Enums for client-side use
export enum Role {
  ADMIN = 'admin',
  WORKER = 'worker',
  MEMBER = 'member'
}

export enum MemberType {
  REGULAR = 'regular',
  HONORIFIC = 'honorific',
  THERAPEUTIC = 'therapeutic',
  MEDICAL = 'medical'
}
