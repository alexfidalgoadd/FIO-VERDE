import { 
  type User, 
  type InsertUser, 
  type Member, 
  type InsertMember,
  type MemberType, 
  type InsertMemberType,
  type ProductCategory, 
  type InsertProductCategory,
  type Product, 
  type InsertProduct,
  type Discount, 
  type InsertDiscount,
  type Dispense, 
  type InsertDispense,
  type DispenseItem, 
  type InsertDispenseItem,
  type MemberAccess, 
  type InsertMemberAccess,
  type AccountingEntry, 
  type InsertAccounting,
  type Role,
  type InsertRole,
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, update: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Role management
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  
  // Member types
  getMemberType(id: number): Promise<MemberType | undefined>;
  getAllMemberTypes(): Promise<MemberType[]>;
  createMemberType(memberType: InsertMemberType): Promise<MemberType>;
  updateMemberType(id: number, update: Partial<MemberType>): Promise<MemberType | undefined>;
  deleteMemberType(id: number): Promise<boolean>;
  
  // Members
  getMember(id: number): Promise<Member | undefined>;
  getMemberByNumber(memberNumber: string): Promise<Member | undefined>;
  getMemberByRFID(rfidNumber: string): Promise<Member | undefined>;
  getAllMembers(): Promise<Member[]>;
  getActiveMembers(): Promise<Member[]>;
  getRecentMembers(limit: number): Promise<Member[]>;
  searchMembers(query: string): Promise<Member[]>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, update: Partial<Member>): Promise<Member | undefined>;
  deleteMember(id: number): Promise<boolean>;
  
  // Product categories
  getProductCategory(id: number): Promise<ProductCategory | undefined>;
  getAllProductCategories(): Promise<ProductCategory[]>;
  getSubcategories(parentId: number): Promise<ProductCategory[]>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, update: Partial<ProductCategory>): Promise<ProductCategory | undefined>;
  deleteProductCategory(id: number): Promise<boolean>;
  
  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getVisibleProducts(): Promise<Product[]>;
  getFeaturedProducts(limit: number): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, update: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Discounts
  getDiscount(id: number): Promise<Discount | undefined>;
  getActiveDiscounts(): Promise<Discount[]>;
  createDiscount(discount: InsertDiscount): Promise<Discount>;
  updateDiscount(id: number, update: Partial<Discount>): Promise<Discount | undefined>;
  deleteDiscount(id: number): Promise<boolean>;
  
  // Dispenses
  getDispense(id: number): Promise<Dispense | undefined>;
  getMemberDispenses(memberId: number): Promise<Dispense[]>;
  getRecentDispenses(limit: number): Promise<Dispense[]>;
  createDispense(dispense: InsertDispense): Promise<Dispense>;
  
  // Dispense items
  getDispenseItems(dispenseId: number): Promise<DispenseItem[]>;
  createDispenseItem(item: InsertDispenseItem): Promise<DispenseItem>;
  
  // Member access logs
  getMemberAccess(id: number): Promise<MemberAccess | undefined>;
  getMemberAccessLogs(memberId: number): Promise<MemberAccess[]>;
  getTodayAccessLogs(): Promise<MemberAccess[]>;
  getRecentAccessLogs(limit: number): Promise<MemberAccess[]>;
  createMemberAccess(access: InsertMemberAccess): Promise<MemberAccess>;
  
  // Accounting
  getAccountingEntry(id: number): Promise<AccountingEntry | undefined>;
  getAccountingEntries(startDate?: Date, endDate?: Date): Promise<AccountingEntry[]>;
  getMemberAccountingEntries(memberId: number): Promise<AccountingEntry[]>;
  createAccountingEntry(entry: InsertAccounting): Promise<AccountingEntry>;
  
  // Club settings
  getClubSettings(): Promise<any>;
  updateClubSettings(settings: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private roles: Map<number, Role>;
  private memberTypes: Map<number, MemberType>;
  private members: Map<number, Member>;
  private productCategories: Map<number, ProductCategory>;
  private products: Map<number, Product>;
  private discounts: Map<number, Discount>;
  private dispenses: Map<number, Dispense>;
  private dispenseItems: Map<number, DispenseItem>;
  private memberAccesses: Map<number, MemberAccess>;
  private accounting: Map<number, AccountingEntry>;
  private clubSettings: any;
  
  private userIdCounter: number = 1;
  private roleIdCounter: number = 1;
  private memberTypeIdCounter: number = 1;
  private memberIdCounter: number = 1;
  private productCategoryIdCounter: number = 1;
  private productIdCounter: number = 1;
  private discountIdCounter: number = 1;
  private dispenseIdCounter: number = 1;
  private dispenseItemIdCounter: number = 1;
  private memberAccessIdCounter: number = 1;
  private accountingIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.roles = new Map();
    this.memberTypes = new Map();
    this.members = new Map();
    this.productCategories = new Map();
    this.products = new Map();
    this.discounts = new Map();
    this.dispenses = new Map();
    this.dispenseItems = new Map();
    this.memberAccesses = new Map();
    this.accounting = new Map();
    this.clubSettings = { 
      clubName: "ASOS Club", 
      memberPrefix: "ASOS-", 
      address: "Calle Principal 123" 
    };
    
    // Initialize with default data
    this.initializeData().catch(err => {
      console.error("Error initializing data:", err);
    });
  }

  private async initializeData() {
    // Create default roles
    const adminRole = await this.createRole({
      name: "admin",
      permissions: ["*"],
    });
    
    const dispensatorRole = await this.createRole({
      name: "dispensator",
      permissions: ["view:dispensary", "create:dispense", "view:members", "view:products"],
    });
    
    const memberRole = await this.createRole({
      name: "member",
      permissions: ["view:own"],
    });
    
    // Create admin user - Si no existe ya
    const existingAdmin = await this.getUserByUsername("admin");
    if (!existingAdmin) {
      await this.createUser({
        username: "admin",
        password: "admin123", // In a real app, you would hash this
        email: "admin@asosclub.com",
        name: "Administrador",
        roleId: adminRole.id,
        active: true,
      });
      
      // También creamos un usuario trabajador para pruebas
      await this.createUser({
        username: "trabajador",
        password: "123456", 
        email: "trabajador@asosclub.com",
        name: "Trabajador",
        roleId: dispensatorRole.id,
        active: true,
      });
      
      console.log("Usuarios creados - Usuario: admin, Contraseña: admin123");
      console.log("Usuarios creados - Usuario: trabajador, Contraseña: 123456");
    }
    
    // Create a default member type
    const regularType = this.createMemberType({
      name: "Regular",
      dispenseLimitDaily: 10,
      dispenseLimitMonthly: 100,
      monthlyFee: 30,
      description: "Socio regular del club",
    });
    
    const medicalType = this.createMemberType({
      name: "Terapéutico",
      dispenseLimitDaily: 15,
      dispenseLimitMonthly: 150,
      monthlyFee: 20,
      description: "Socio con necesidades terapéuticas",
    });
    
    // Create product categories
    const weedCategory = this.createProductCategory({
      name: "Weed",
      parentId: null,
    });
    
    const extractsCategory = this.createProductCategory({
      name: "Extracciones",
      parentId: null,
    });
    
    const ediblesCategory = this.createProductCategory({
      name: "Comestibles",
      parentId: null,
    });
    
    const vapersCategory = this.createProductCategory({
      name: "Vapers",
      parentId: null,
    });
    
    // Create subcategories
    this.createProductCategory({
      name: "Indica",
      parentId: weedCategory.id,
    });
    
    this.createProductCategory({
      name: "Sativa",
      parentId: weedCategory.id,
    });
    
    this.createProductCategory({
      name: "Híbrida",
      parentId: weedCategory.id,
    });
    
    this.createProductCategory({
      name: "Static",
      parentId: extractsCategory.id,
    });
    
    this.createProductCategory({
      name: "Shatter",
      parentId: extractsCategory.id,
    });
    
    // Default club settings
    this.clubSettings = {
      clubName: "ASOS Club",
      address: "Calle Principal 123",
      email: "info@asosclub.com",
      phone: "+34 600 123 456",
      maxCapacity: 50,
      logo: "",
      description: "Club social cannábico responsable",
    };
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, lastLogin: null, createdAt: new Date(), active: true };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...update };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Role management
  async getRole(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    return Array.from(this.roles.values()).find(
      (role) => role.name.toLowerCase() === name.toLowerCase()
    );
  }

  async getAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = this.roleIdCounter++;
    const role: Role = { ...insertRole, id };
    this.roles.set(id, role);
    return role;
  }

  // Member types
  async getMemberType(id: number): Promise<MemberType | undefined> {
    return this.memberTypes.get(id);
  }

  async getAllMemberTypes(): Promise<MemberType[]> {
    return Array.from(this.memberTypes.values());
  }

  async createMemberType(insertMemberType: InsertMemberType): Promise<MemberType> {
    const id = this.memberTypeIdCounter++;
    const memberType: MemberType = { ...insertMemberType, id };
    this.memberTypes.set(id, memberType);
    return memberType;
  }

  async updateMemberType(id: number, update: Partial<MemberType>): Promise<MemberType | undefined> {
    const memberType = this.memberTypes.get(id);
    if (!memberType) return undefined;
    
    const updatedMemberType = { ...memberType, ...update };
    this.memberTypes.set(id, updatedMemberType);
    return updatedMemberType;
  }

  async deleteMemberType(id: number): Promise<boolean> {
    return this.memberTypes.delete(id);
  }

  // Members
  async getMember(id: number): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async getMemberByNumber(memberNumber: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(
      (member) => member.memberNumber === memberNumber
    );
  }

  async getMemberByRFID(rfidNumber: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(
      (member) => member.rfidNumber === rfidNumber
    );
  }

  async getAllMembers(): Promise<Member[]> {
    return Array.from(this.members.values());
  }

  async getActiveMembers(): Promise<Member[]> {
    return Array.from(this.members.values()).filter(member => member.active);
  }

  async getRecentMembers(limit: number): Promise<Member[]> {
    return Array.from(this.members.values())
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
      .slice(0, limit);
  }

  async searchMembers(query: string): Promise<Member[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.members.values()).filter(member => 
      member.firstName.toLowerCase().includes(lowercaseQuery) ||
      member.lastName.toLowerCase().includes(lowercaseQuery) ||
      member.memberNumber.toLowerCase().includes(lowercaseQuery) ||
      (member.dni && member.dni.toLowerCase().includes(lowercaseQuery)) ||
      (member.email && member.email.toLowerCase().includes(lowercaseQuery))
    );
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = this.memberIdCounter++;
    
    // Generar número de socio con formato prefijo-número (ej: ASOS-00001)
    let memberNumber = insertMember.memberNumber;
    if (!memberNumber) {
      const prefix = this.clubSettings?.memberPrefix || "ASOS-";
      const paddedNumber = id.toString().padStart(5, '0');
      memberNumber = `${prefix}${paddedNumber}`;
    }
    
    const member: Member = { 
      ...insertMember, 
      id,
      memberNumber,
      joinDate: insertMember.joinDate || new Date(),
      active: true,
    };
    this.members.set(id, member);
    return member;
  }

  async updateMember(id: number, update: Partial<Member>): Promise<Member | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...update };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async deleteMember(id: number): Promise<boolean> {
    return this.members.delete(id);
  }

  // Product categories
  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    return this.productCategories.get(id);
  }

  async getAllProductCategories(): Promise<ProductCategory[]> {
    return Array.from(this.productCategories.values());
  }

  async getSubcategories(parentId: number): Promise<ProductCategory[]> {
    return Array.from(this.productCategories.values())
      .filter(category => category.parentId === parentId);
  }

  async createProductCategory(insertCategory: InsertProductCategory): Promise<ProductCategory> {
    const id = this.productCategoryIdCounter++;
    const category: ProductCategory = { ...insertCategory, id };
    this.productCategories.set(id, category);
    return category;
  }

  async updateProductCategory(id: number, update: Partial<ProductCategory>): Promise<ProductCategory | undefined> {
    const category = this.productCategories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...update };
    this.productCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteProductCategory(id: number): Promise<boolean> {
    return this.productCategories.delete(id);
  }

  // Products
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.categoryId === categoryId || product.subcategoryId === categoryId);
  }

  async getVisibleProducts(): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.visibleInDispensary);
  }

  async getFeaturedProducts(limit: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.visibleInDispensary)
      .slice(0, limit);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(product => 
      product.name.toLowerCase().includes(lowercaseQuery) || 
      (product.brand && product.brand.toLowerCase().includes(lowercaseQuery))
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { 
      ...insertProduct, 
      id,
      entryDate: insertProduct.entryDate || new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, update: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...update };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Discounts
  async getDiscount(id: number): Promise<Discount | undefined> {
    return this.discounts.get(id);
  }

  async getActiveDiscounts(): Promise<Discount[]> {
    const now = new Date();
    return Array.from(this.discounts.values())
      .filter(discount => 
        discount.active && 
        (!discount.startDate || new Date(discount.startDate) <= now) &&
        (!discount.endDate || new Date(discount.endDate) >= now)
      );
  }

  async createDiscount(insertDiscount: InsertDiscount): Promise<Discount> {
    const id = this.discountIdCounter++;
    const discount: Discount = { ...insertDiscount, id };
    this.discounts.set(id, discount);
    return discount;
  }

  async updateDiscount(id: number, update: Partial<Discount>): Promise<Discount | undefined> {
    const discount = this.discounts.get(id);
    if (!discount) return undefined;
    
    const updatedDiscount = { ...discount, ...update };
    this.discounts.set(id, updatedDiscount);
    return updatedDiscount;
  }

  async deleteDiscount(id: number): Promise<boolean> {
    return this.discounts.delete(id);
  }

  // Dispenses
  async getDispense(id: number): Promise<Dispense | undefined> {
    return this.dispenses.get(id);
  }

  async getMemberDispenses(memberId: number): Promise<Dispense[]> {
    return Array.from(this.dispenses.values())
      .filter(dispense => dispense.memberId === memberId);
  }

  async getRecentDispenses(limit: number): Promise<Dispense[]> {
    return Array.from(this.dispenses.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createDispense(insertDispense: InsertDispense): Promise<Dispense> {
    const id = this.dispenseIdCounter++;
    const dispense: Dispense = { 
      ...insertDispense, 
      id,
      date: insertDispense.date || new Date(),
    };
    this.dispenses.set(id, dispense);
    return dispense;
  }

  // Dispense items
  async getDispenseItems(dispenseId: number): Promise<DispenseItem[]> {
    return Array.from(this.dispenseItems.values())
      .filter(item => item.dispenseId === dispenseId);
  }

  async createDispenseItem(insertItem: InsertDispenseItem): Promise<DispenseItem> {
    const id = this.dispenseItemIdCounter++;
    const item: DispenseItem = { ...insertItem, id };
    this.dispenseItems.set(id, item);
    return item;
  }

  // Member access logs
  async getMemberAccess(id: number): Promise<MemberAccess | undefined> {
    return this.memberAccesses.get(id);
  }

  async getMemberAccessLogs(memberId: number): Promise<MemberAccess[]> {
    return Array.from(this.memberAccesses.values())
      .filter(access => access.memberId === memberId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getTodayAccessLogs(): Promise<MemberAccess[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.memberAccesses.values())
      .filter(access => new Date(access.timestamp) >= today)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getRecentAccessLogs(limit: number): Promise<MemberAccess[]> {
    return Array.from(this.memberAccesses.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createMemberAccess(insertAccess: InsertMemberAccess): Promise<MemberAccess> {
    const id = this.memberAccessIdCounter++;
    const access: MemberAccess = { 
      ...insertAccess, 
      id,
      timestamp: insertAccess.timestamp || new Date(),
    };
    this.memberAccesses.set(id, access);
    return access;
  }

  // Accounting
  async getAccountingEntry(id: number): Promise<AccountingEntry | undefined> {
    return this.accounting.get(id);
  }

  async getAccountingEntries(startDate?: Date, endDate?: Date): Promise<AccountingEntry[]> {
    let entries = Array.from(this.accounting.values());
    
    if (startDate) {
      entries = entries.filter(entry => new Date(entry.date) >= startDate);
    }
    
    if (endDate) {
      entries = entries.filter(entry => new Date(entry.date) <= endDate);
    }
    
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getMemberAccountingEntries(memberId: number): Promise<AccountingEntry[]> {
    return Array.from(this.accounting.values())
      .filter(entry => entry.memberId === memberId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createAccountingEntry(insertEntry: InsertAccounting): Promise<AccountingEntry> {
    const id = this.accountingIdCounter++;
    const entry: AccountingEntry = { 
      ...insertEntry, 
      id,
      date: insertEntry.date || new Date(),
    };
    this.accounting.set(id, entry);
    return entry;
  }

  // Club settings
  async getClubSettings(): Promise<any> {
    return this.clubSettings;
  }

  async updateClubSettings(settings: any): Promise<any> {
    this.clubSettings = { ...this.clubSettings, ...settings };
    return this.clubSettings;
  }
}

export const storage = new MemStorage();
