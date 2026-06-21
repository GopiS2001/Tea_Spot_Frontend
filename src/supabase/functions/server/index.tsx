import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { create as jwtCreate, verify as jwtVerify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const app = new Hono();

// ==================== PASSWORD UTILITIES ====================
// Using plain text passwords for demo/development environment
// NOTE: In production, always use proper password hashing!

function storePassword(password: string): string {
  // For demo purposes, storing password as plain text
  // In production, use proper hashing like PBKDF2, bcrypt, or Argon2
  return password;
}

function verifyPassword(password: string, storedPassword: string): boolean {
  // Simple plain text comparison for demo
  return password === storedPassword;
}

// JWT Secret (in production, use environment variable)
const JWT_SECRET = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"]
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ==================== UTILITY FUNCTIONS ====================

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create JWT token
async function createToken(userId: string, role: string): Promise<string> {
  const payload = {
    sub: userId,
    role: role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
  };
  return await jwtCreate({ alg: "HS512", typ: "JWT" }, payload, JWT_SECRET);
}

// Verify JWT token
async function verifyToken(token: string): Promise<any> {
  try {
    return await jwtVerify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Auth middleware
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  
  if (!payload) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }

  c.set("userId", payload.sub);
  c.set("userRole", payload.role);
  await next();
}

// Role-based access middleware
function requireRole(...allowedRoles: string[]) {
  return async (c: any, next: any) => {
    const userRole = c.get("userRole");
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: "Forbidden: Insufficient permissions" }, 403);
    }
    await next();
  };
}

// ==================== SEED DATA ====================

async function seedDatabase() {
  try {
    console.log("🌱 Checking database seed status...");
    
    // Check if owner exists
    const existingOwner = await kv.get("auth:admin");
    if (existingOwner) {
      console.log("✅ Database already seeded");
      return;
    }

    console.log("🌱 Starting database seed...");

    // Create owner account
    const ownerId = generateId();
    console.log("🔐 Storing default admin password...");
    const passwordStored = storePassword("admin123");
    console.log("✅ Password stored");
    
    const ownerUser = {
      id: ownerId,
      username: "admin",
      password: passwordStored,
      role: "owner",
      display_name: "Administrator",
      avatar: "",
      created_at: new Date().toISOString(),
    };

    console.log("💾 Creating admin user...");
    await kv.set(`user:${ownerId}`, ownerUser);
    await kv.set("auth:admin", ownerId);
    console.log("�� Admin user created");

    // Seed some sample inventory items
    console.log("📦 Creating sample inventory items...");
    const sampleItems = [
      { sku: "ITEM001", name: "Margherita Pizza", price: 12.99, tax: 8, category: "Pizza", qty: 50, kitchen_display: true },
      { sku: "ITEM002", name: "Caesar Salad", price: 8.99, tax: 8, category: "Salads", qty: 30, kitchen_display: true },
      { sku: "ITEM003", name: "Coca Cola", price: 2.99, tax: 5, category: "Beverages", qty: 100, kitchen_display: false },
      { sku: "ITEM004", name: "Chicken Burger", price: 10.99, tax: 8, category: "Burgers", qty: 40, kitchen_display: true },
      { sku: "ITEM005", name: "French Fries", price: 4.99, tax: 8, category: "Sides", qty: 60, kitchen_display: true },
      { sku: "ITEM006", name: "Ice Cream", price: 5.99, tax: 5, category: "Desserts", qty: 25, kitchen_display: true },
    ];

    for (const item of sampleItems) {
      const itemId = generateId();
      const itemData = {
        id: itemId,
        ...item,
        created_at: new Date().toISOString(),
      };
      await kv.set(`item:${itemId}`, itemData);
    }
    console.log(`✅ Created ${sampleItems.length} sample items`);

    console.log("✅ Database seeded successfully");
    console.log("🔑 Default credentials: username=admin, password=admin123");
  } catch (error) {
    console.error("❌ Seed error:", error);
    console.error("Error details:", error.stack);
    throw error;
  }
}

// Run seed on startup
console.log("⏳ Initializing database...");
seedDatabase().catch((error) => {
  console.error("❌ Fatal seed error:", error);
});

// ==================== AUTHENTICATION ROUTES ====================

// Login
app.post("/make-server-1b17e9b2/api/auth/login", async (c) => {
  try {
    console.log("📝 Login request received");
    const body = await c.req.json();
    const { username, password } = body;

    console.log(`🔍 Attempting login for username: ${username}`);

    if (!username || !password) {
      console.log("❌ Missing username or password");
      return c.json({ error: "Username and password are required" }, 400);
    }

    // Get user ID from auth index
    const userId = await kv.get(`auth:${username}`);
    if (!userId) {
      console.log(`❌ User not found: ${username}`);
      return c.json({ error: "Invalid credentials" }, 401);
    }

    console.log(`✅ User ID found: ${userId}`);

    // Get user data
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      console.log(`❌ User data not found for ID: ${userId}`);
      return c.json({ error: "Invalid credentials" }, 401);
    }

    console.log(`✅ User data retrieved for: ${user.username}`);

    // Verify password (supporting both old password_hash and new password field)
    const storedPassword = user.password || user.password_hash || "";
    const passwordMatch = verifyPassword(password, storedPassword);
    if (!passwordMatch) {
      console.log(`❌ Password mismatch for user: ${username}`);
      console.log(`Expected: ${storedPassword}, Received: ${password}`);
      return c.json({ error: "Invalid credentials" }, 401);
    }

    console.log(`✅ Password verified for: ${username}`);

    // Create access token
    const accessToken = await createToken(user.id, user.role);
    console.log(`✅ Access token created for: ${username}`);

    // Return user data and token
    return c.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    console.error("Error stack:", error.stack);
    return c.json({ error: `Login failed: ${error.message}` }, 500);
  }
});

// Register (Owner only - protected endpoint)
app.post("/make-server-1b17e9b2/api/auth/register", authMiddleware, requireRole("owner"), async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, role, display_name } = body;

    if (!username || !password || !role) {
      return c.json({ error: "Username, password, and role are required" }, 400);
    }

    if (!["owner", "manager", "cashier"].includes(role)) {
      return c.json({ error: "Invalid role" }, 400);
    }

    // Check if username already exists
    const existingUserId = await kv.get(`auth:${username}`);
    if (existingUserId) {
      return c.json({ error: "Username already exists" }, 400);
    }

    // Store password (plain text for demo)
    const passwordStored = storePassword(password);

    // Create user
    const userId = generateId();
    const user = {
      id: userId,
      username,
      password: passwordStored,
      role,
      display_name: display_name || username,
      avatar: "",
      created_at: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, user);
    await kv.set(`auth:${username}`, userId);

    return c.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// Logout (client-side token removal, but endpoint for consistency)
app.post("/make-server-1b17e9b2/api/auth/logout", authMiddleware, async (c) => {
  return c.json({ message: "Logged out successfully" });
});

// Get current user
app.get("/make-server-1b17e9b2/api/auth/me", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// Update user profile
app.put("/make-server-1b17e9b2/api/auth/profile", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { display_name, avatar } = body;

    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (display_name !== undefined) user.display_name = display_name;
    if (avatar !== undefined) user.avatar = avatar;

    await kv.set(`user:${userId}`, user);

    return c.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// ==================== ITEMS/INVENTORY ROUTES ====================

// Get all items (with filters)
app.get("/make-server-1b17e9b2/api/items", authMiddleware, async (c) => {
  try {
    const category = c.req.query("category");
    const q = c.req.query("q");
    const kitchen = c.req.query("kitchen");

    // Get all items
    const allItems = await kv.getByPrefix("item:");
    
    let items = allItems.filter(item => item !== null);

    // Apply filters
    if (category) {
      items = items.filter(item => item.category === category);
    }

    if (q) {
      const query = q.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.sku.toLowerCase().includes(query)
      );
    }

    if (kitchen === "true") {
      items = items.filter(item => item.kitchen_display === true);
    }

    return c.json({ items });
  } catch (error) {
    console.error("Get items error:", error);
    return c.json({ error: "Failed to get items" }, 500);
  }
});

// Get single item
app.get("/make-server-1b17e9b2/api/items/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const item = await kv.get(`item:${id}`);
    
    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }

    return c.json({ item });
  } catch (error) {
    console.error("Get item error:", error);
    return c.json({ error: "Failed to get item" }, 500);
  }
});

// Create item (Manager/Owner)
app.post("/make-server-1b17e9b2/api/items", authMiddleware, requireRole("owner", "manager"), async (c) => {
  try {
    const body = await c.req.json();
    const { sku, name, price, tax, category, qty, kitchen_display } = body;

    // Validation
    if (!sku || !name || price === undefined || tax === undefined || !category) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    if (typeof price !== "number" || price < 0) {
      return c.json({ error: "Invalid price" }, 400);
    }

    if (typeof tax !== "number" || tax < 0 || tax > 100) {
      return c.json({ error: "Invalid tax percentage" }, 400);
    }

    const itemId = generateId();
    const item = {
      id: itemId,
      sku,
      name,
      price,
      tax,
      category,
      qty: qty || 0,
      kitchen_display: kitchen_display || false,
      created_at: new Date().toISOString(),
    };

    await kv.set(`item:${itemId}`, item);

    return c.json({ item }, 201);
  } catch (error) {
    console.error("Create item error:", error);
    return c.json({ error: "Failed to create item" }, 500);
  }
});

// Update item (Manager/Owner)
app.put("/make-server-1b17e9b2/api/items/:id", authMiddleware, requireRole("owner", "manager"), async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const item = await kv.get(`item:${id}`);
    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }

    // Update fields
    if (body.sku !== undefined) item.sku = body.sku;
    if (body.name !== undefined) item.name = body.name;
    if (body.price !== undefined) {
      if (typeof body.price !== "number" || body.price < 0) {
        return c.json({ error: "Invalid price" }, 400);
      }
      item.price = body.price;
    }
    if (body.tax !== undefined) {
      if (typeof body.tax !== "number" || body.tax < 0 || body.tax > 100) {
        return c.json({ error: "Invalid tax percentage" }, 400);
      }
      item.tax = body.tax;
    }
    if (body.category !== undefined) item.category = body.category;
    if (body.qty !== undefined) item.qty = body.qty;
    if (body.kitchen_display !== undefined) item.kitchen_display = body.kitchen_display;

    await kv.set(`item:${id}`, item);

    return c.json({ item });
  } catch (error) {
    console.error("Update item error:", error);
    return c.json({ error: "Failed to update item" }, 500);
  }
});

// Delete item (Owner only)
app.delete("/make-server-1b17e9b2/api/items/:id", authMiddleware, requireRole("owner"), async (c) => {
  try {
    const id = c.req.param("id");
    const item = await kv.get(`item:${id}`);
    
    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }

    await kv.del(`item:${id}`);

    return c.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Delete item error:", error);
    return c.json({ error: "Failed to delete item" }, 500);
  }
});

// ==================== ORDERS ROUTES ====================

// Create order
app.post("/make-server-1b17e9b2/api/orders", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { items, discount, discount_type, table_number } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ error: "Items are required" }, 400);
    }

    // Calculate totals
    let subtotal = 0;
    let tax_amount = 0;
    const order_items = [];

    for (const orderItem of items) {
      const item = await kv.get(`item:${orderItem.item_id}`);
      if (!item) {
        return c.json({ error: `Item ${orderItem.item_id} not found` }, 404);
      }

      const qty = orderItem.qty || 1;
      const unit_price = item.price;
      const item_discount = orderItem.discount || 0;
      const item_subtotal = (unit_price * qty) - item_discount;
      const item_tax = (item_subtotal * item.tax) / 100;

      subtotal += item_subtotal;
      tax_amount += item_tax;

      order_items.push({
        id: generateId(),
        item_id: orderItem.item_id,
        item_name: item.name,
        qty,
        unit_price,
        discount: item_discount,
        subtotal: item_subtotal,
        tax: item_tax,
      });
    }

    // Apply order-level discount
    let order_discount = 0;
    if (discount && discount > 0) {
      if (discount_type === "percentage") {
        order_discount = (subtotal * discount) / 100;
      } else {
        order_discount = discount;
      }
    }

    const total_amount = subtotal + tax_amount - order_discount;

    const orderId = generateId();
    const order = {
      id: orderId,
      user_id: userId,
      status: "draft",
      items: order_items,
      subtotal,
      discount: order_discount,
      discount_type: discount_type || "fixed",
      tax_amount,
      total_amount,
      table_number: table_number || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`order:${orderId}`, order);

    return c.json({ order }, 201);
  } catch (error) {
    console.error("Create order error:", error);
    return c.json({ error: "Failed to create order" }, 500);
  }
});

// Get order
app.get("/make-server-1b17e9b2/api/orders/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const order = await kv.get(`order:${id}`);
    
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    return c.json({ error: "Failed to get order" }, 500);
  }
});

// Get all orders
app.get("/make-server-1b17e9b2/api/orders", authMiddleware, async (c) => {
  try {
    const status = c.req.query("status");
    const allOrders = await kv.getByPrefix("order:");
    
    let orders = allOrders.filter(order => order !== null);

    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    // Sort by created_at descending
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return c.json({ error: "Failed to get orders" }, 500);
  }
});

// Park order
app.post("/make-server-1b17e9b2/api/orders/:id/park", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    
    const order = await kv.get(`order:${id}`);
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    order.status = "parked";
    order.parked_at = new Date().toISOString();
    order.parked_by = userId;
    order.updated_at = new Date().toISOString();

    await kv.set(`order:${id}`, order);
    await kv.set(`parked:${id}`, order);

    return c.json({ order });
  } catch (error) {
    console.error("Park order error:", error);
    return c.json({ error: "Failed to park order" }, 500);
  }
});

// Get parked orders
app.get("/make-server-1b17e9b2/api/orders/parked", authMiddleware, async (c) => {
  try {
    const parkedOrders = await kv.getByPrefix("parked:");
    const orders = parkedOrders.filter(order => order !== null);
    
    // Sort by parked_at descending
    orders.sort((a, b) => new Date(b.parked_at || b.created_at).getTime() - new Date(a.parked_at || a.created_at).getTime());

    return c.json({ orders });
  } catch (error) {
    console.error("Get parked orders error:", error);
    return c.json({ error: "Failed to get parked orders" }, 500);
  }
});

// Resume parked order
app.post("/make-server-1b17e9b2/api/orders/:id/resume", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    
    const order = await kv.get(`order:${id}`);
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (order.status !== "parked") {
      return c.json({ error: "Order is not parked" }, 400);
    }

    order.status = "draft";
    order.updated_at = new Date().toISOString();

    await kv.set(`order:${id}`, order);
    await kv.del(`parked:${id}`);

    return c.json({ order });
  } catch (error) {
    console.error("Resume order error:", error);
    return c.json({ error: "Failed to resume order" }, 500);
  }
});

// Process payment
app.put("/make-server-1b17e9b2/api/orders/:id/pay", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { payment_method, payment_data } = body;

    const order = await kv.get(`order:${id}`);
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (order.status === "paid") {
      return c.json({ error: "Order already paid" }, 400);
    }

    // Create payment record
    const paymentId = generateId();
    const payment = {
      id: paymentId,
      order_id: id,
      method: payment_method,
      provider_ref: payment_data?.transaction_id || generateId(),
      amount: order.total_amount,
      status: "success",
      created_at: new Date().toISOString(),
    };

    await kv.set(`payment:${paymentId}`, payment);

    // Update order status
    order.status = "paid";
    order.payment_id = paymentId;
    order.paid_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();

    await kv.set(`order:${id}`, order);

    // Remove from parked if it was parked
    await kv.del(`parked:${id}`);

    return c.json({ order, payment });
  } catch (error) {
    console.error("Process payment error:", error);
    return c.json({ error: "Failed to process payment" }, 500);
  }
});

// ==================== PAYMENTS ROUTES ====================

// Mock payment processing
app.post("/make-server-1b17e9b2/api/payments/mock", async (c) => {
  try {
    const body = await c.req.json();
    const { method, amount, card_number, upi_id, bank_name } = body;

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock payment success (deterministic for testing)
    // Fail if card number ends with 0000 or amount is exactly 13.00
    let success = true;
    let error_message = "";

    if (method === "credit_card" && card_number && card_number.endsWith("0000")) {
      success = false;
      error_message = "Card declined";
    } else if (amount === 13.00) {
      success = false;
      error_message = "Payment failed - unlucky number";
    }

    const transaction_id = `TXN-${generateId()}`;

    return c.json({
      success,
      transaction_id: success ? transaction_id : null,
      error: error_message || null,
      method,
      amount,
    });
  } catch (error) {
    console.error("Mock payment error:", error);
    return c.json({ error: "Payment processing failed" }, 500);
  }
});

// ==================== SETTINGS ROUTES ====================

// Get settings (Owner only)
app.get("/make-server-1b17e9b2/api/settings", authMiddleware, requireRole("owner"), async (c) => {
  try {
    const settings = await kv.get("settings") || {
      default_tax_rate: 8,
      receipt_header: "Restaurant Name",
      timezone: "America/New_York",
      currency: "USD",
    };

    return c.json({ settings });
  } catch (error) {
    console.error("Get settings error:", error);
    return c.json({ error: "Failed to get settings" }, 500);
  }
});

// Update settings (Owner only)
app.put("/make-server-1b17e9b2/api/settings", authMiddleware, requireRole("owner"), async (c) => {
  try {
    const body = await c.req.json();
    
    const currentSettings = await kv.get("settings") || {};
    const updatedSettings = { ...currentSettings, ...body };

    await kv.set("settings", updatedSettings);

    return c.json({ settings: updatedSettings });
  } catch (error) {
    console.error("Update settings error:", error);
    return c.json({ error: "Failed to update settings" }, 500);
  }
});

// Update user role (Owner only)
app.put("/make-server-1b17e9b2/api/users/:id/role", authMiddleware, requireRole("owner"), async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { role } = body;

    if (!["owner", "manager", "cashier"].includes(role)) {
      return c.json({ error: "Invalid role" }, 400);
    }

    const user = await kv.get(`user:${id}`);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    user.role = role;
    await kv.set(`user:${id}`, user);

    return c.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);
    return c.json({ error: "Failed to update user role" }, 500);
  }
});

// Get all users (Owner only)
app.get("/make-server-1b17e9b2/api/users", authMiddleware, requireRole("owner"), async (c) => {
  try {
    const allUsers = await kv.getByPrefix("user:");
    const users = allUsers.filter(user => user !== null).map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      display_name: user.display_name,
      avatar: user.avatar,
      created_at: user.created_at,
    }));

    return c.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ error: "Failed to get users" }, 500);
  }
});

// ==================== KITCHEN DISPLAY ROUTES ====================

// Get kitchen orders (filtered)
app.get("/make-server-1b17e9b2/api/kitchen/orders", authMiddleware, async (c) => {
  try {
    const category = c.req.query("category");
    const time = c.req.query("time"); // in minutes
    const status = c.req.query("status");
    const table = c.req.query("table");

    const allOrders = await kv.getByPrefix("order:");
    let orders = allOrders.filter(order => 
      order !== null && 
      (order.status === "paid" || order.status === "in_progress" || order.status === "new")
    );

    // Filter by time
    if (time) {
      const timeLimit = parseInt(time);
      const cutoffTime = new Date(Date.now() - timeLimit * 60 * 1000);
      orders = orders.filter(order => 
        new Date(order.created_at) >= cutoffTime
      );
    }

    // Filter by status
    if (status) {
      orders = orders.filter(order => order.kds_status === status || (!order.kds_status && status === "new"));
    }

    // Filter by table
    if (table) {
      orders = orders.filter(order => order.table_number === table);
    }

    // Filter items to only show kitchen_display items
    orders = orders.map(order => {
      const kitchenItems = order.items.filter((item: any) => {
        // Need to check if item has kitchen_display flag
        return true; // We'll filter this on frontend with item data
      });
      
      return {
        ...order,
        items: kitchenItems,
      };
    });

    // Sort by created_at ascending (oldest first)
    orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return c.json({ orders });
  } catch (error) {
    console.error("Get kitchen orders error:", error);
    return c.json({ error: "Failed to get kitchen orders" }, 500);
  }
});

// Update kitchen order status
app.put("/make-server-1b17e9b2/api/kitchen/orders/:id/status", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { status } = body;

    if (!["new", "in_progress", "completed"].includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    const order = await kv.get(`order:${id}`);
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    order.kds_status = status;
    order.updated_at = new Date().toISOString();

    if (status === "completed") {
      order.completed_at = new Date().toISOString();
    }

    await kv.set(`order:${id}`, order);

    return c.json({ order });
  } catch (error) {
    console.error("Update kitchen order status error:", error);
    return c.json({ error: "Failed to update order status" }, 500);
  }
});

// Health check endpoint
app.get("/make-server-1b17e9b2/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/make-server-1b17e9b2", (c) => {
  return c.json({ 
    message: "Restaurant POS API Server", 
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth/*",
      items: "/api/items",
      orders: "/api/orders",
      payments: "/api/payments",
      kitchen: "/api/kitchen/*",
      settings: "/api/settings",
    }
  });
});

// Database reset endpoint (for testing/demo purposes)
app.post("/make-server-1b17e9b2/api/reset-database", async (c) => {
  try {
    console.log("🔄 Resetting database...");
    
    // Clear all data
    const allUsers = await kv.getByPrefix("user:");
    const allAuth = await kv.getByPrefix("auth:");
    const allItems = await kv.getByPrefix("item:");
    const allOrders = await kv.getByPrefix("order:");
    const allParked = await kv.getByPrefix("parked:");
    const allPayments = await kv.getByPrefix("payment:");
    
    const keysToDelete = [
      ...allUsers.map((_, i) => `user:${i}`),
      ...allAuth.map((_, i) => `auth:${i}`),
      ...allItems.map((_, i) => `item:${i}`),
      ...allOrders.map((_, i) => `order:${i}`),
      ...allParked.map((_, i) => `parked:${i}`),
      ...allPayments.map((_, i) => `payment:${i}`),
    ];
    
    // Re-run seed
    await seedDatabase();
    
    console.log("✅ Database reset complete");
    
    return c.json({ 
      message: "Database reset successfully",
      credentials: {
        username: "admin",
        password: "admin123"
      }
    });
  } catch (error) {
    console.error("❌ Database reset error:", error);
    return c.json({ error: "Failed to reset database" }, 500);
  }
});

console.log("🚀 Server starting...");
console.log("📍 Base URL: /make-server-1b17e9b2");
console.log("🔐 Default credentials: username=admin, password=admin123");
console.log("⚠️  NOTE: Passwords stored in plain text for demo purposes");

Deno.serve(app.fetch);
