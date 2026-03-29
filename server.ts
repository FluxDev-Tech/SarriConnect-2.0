import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "sari-secret-key-123";

// Database Setup
const db = new Database("sari_store.db");

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    category TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    imageUrl TEXT,
    isDeleted INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    totalPrice REAL NOT NULL,
    receivedAmount REAL DEFAULT 0,
    change REAL DEFAULT 0,
    paymentType TEXT DEFAULT 'cash', -- 'cash' or 'debt'
    isPaid INTEGER DEFAULT 0,
    customerName TEXT, -- for debt tracking
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    saleId INTEGER,
    productId INTEGER,
    quantity INTEGER,
    priceAtSale REAL,
    FOREIGN KEY(saleId) REFERENCES sales(id),
    FOREIGN KEY(productId) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Migration: Add subtotal and discount to sales if they don't exist
try {
  db.prepare("ALTER TABLE sales ADD COLUMN subtotal REAL NOT NULL DEFAULT 0").run();
  db.prepare("ALTER TABLE sales ADD COLUMN discount REAL NOT NULL DEFAULT 0").run();
  console.log("Migration: Added subtotal and discount columns to sales table.");
} catch (e) {
  // Columns probably already exist
}

// Migration: Add receivedAmount and change to sales if they don't exist
try {
  db.prepare("ALTER TABLE sales ADD COLUMN receivedAmount REAL DEFAULT 0").run();
  db.prepare("ALTER TABLE sales ADD COLUMN change REAL DEFAULT 0").run();
  console.log("Migration: Added receivedAmount and change columns to sales table.");
} catch (e) {
  // Columns probably already exist
}

// Migration: Add isPaid to sales if it doesn't exist
try {
  db.prepare("ALTER TABLE sales ADD COLUMN isPaid INTEGER DEFAULT 0").run();
  console.log("Migration: Added isPaid column to sales table.");
} catch (e) {
  // Column probably already exists
}

// Migration: Add isDeleted to products if it doesn't exist
try {
  db.prepare("ALTER TABLE products ADD COLUMN isDeleted INTEGER DEFAULT 0").run();
  console.log("Migration: Added isDeleted column to products table.");
} catch (e) {
  // Column probably already exists
}

// Seed Data
const seedData = () => {
  const settingsCount = (db.prepare("SELECT COUNT(*) as count FROM settings").get() as any).count;
  if (settingsCount === 0) {
    const defaultReceipt = {
      storeName: "SariConnect Store",
      address: "123 Sari-Sari St, Manila",
      phone: "0912-345-6789",
      footer: "Thank you for shopping with us!",
      showLogo: true,
      showDate: true,
      showTime: true,
      logoUrl: "https://picsum.photos/seed/store/200/200"
    };
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("receipt", JSON.stringify(defaultReceipt));
    console.log("Default settings seeded.");
  }
};

seedData();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Auth Middleware
// Removed for simplicity


// --- API Routes ---

// Auth
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  // Simple check for the "original" credentials
  if (email === "admin@store.com" && password === "admin123") {
    const user = { id: 999, name: "Admin User", email: "admin@store.com", role: "admin" };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user });
  }
  
  // For any other login, just succeed for now to be "simple"
  const user = { id: 1, name: "Staff User", email: email, role: "staff" };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user });
});

app.get("/api/auth/profile", (req: any, res) => {
  // Always return admin profile for simplicity
  res.json({ id: 999, name: "Admin User", email: "admin@store.com", role: "admin" });
});

// Products
app.get("/api/products", (req, res) => {
  const products = db.prepare("SELECT * FROM products WHERE isDeleted = 0 ORDER BY createdAt DESC").all();
  res.json(products);
});

app.post("/api/products", (req, res) => {
  const { name, barcode, category, price, stock, imageUrl } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO products (name, barcode, category, price, stock, imageUrl) VALUES (?, ?, ?, ?, ?, ?)");
    const info = stmt.run(name, barcode, category, price, stock, imageUrl);
    res.status(201).json({ id: info.lastInsertRowid, ...req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/products/:id", (req, res) => {
  const { name, barcode, category, price, stock, imageUrl } = req.body;
  const { id } = req.params;
  try {
    const stmt = db.prepare("UPDATE products SET name = ?, barcode = ?, category = ?, price = ?, stock = ?, imageUrl = ? WHERE id = ?");
    stmt.run(name, barcode, category, price, stock, imageUrl, id);
    res.json({ id, ...req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/products/:id", (req, res) => {
  try {
    // Check if product has sales
    const saleItem = db.prepare("SELECT id FROM sale_items WHERE productId = ? LIMIT 1").get(req.params.id);
    
    if (saleItem) {
      // If it has sales, soft delete it to preserve history
      db.prepare("UPDATE products SET isDeleted = 1 WHERE id = ?").run(req.params.id);
    } else {
      // If no sales, we can safely hard delete
      db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    }
    res.json({ message: "Product deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Sales
app.post("/api/sales", (req, res) => {
  const { items, totalPrice, subtotal, discount, paymentType, customerName, receivedAmount, change } = req.body; // items: [{ id, quantity, price }]
  const isPaid = paymentType === 'cash' ? 1 : 0;
  
  const transaction = db.transaction(() => {
    const saleStmt = db.prepare("INSERT INTO sales (totalPrice, subtotal, discount, paymentType, isPaid, customerName, receivedAmount, change) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const saleInfo = saleStmt.run(totalPrice, subtotal || totalPrice, discount || 0, paymentType || 'cash', isPaid, customerName || null, receivedAmount || 0, change || 0);
    const saleId = saleInfo.lastInsertRowid;

    const itemStmt = db.prepare("INSERT INTO sale_items (saleId, productId, quantity, priceAtSale) VALUES (?, ?, ?, ?)");
    const updateStockStmt = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    for (const item of items) {
      itemStmt.run(saleId, item.id, item.quantity, item.price);
      updateStockStmt.run(item.quantity, item.id);
    }
    return saleId;
  });

  try {
    const saleId = transaction();
    res.status(201).json({ id: saleId, message: "Sale recorded" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/sales/stats", (req, res) => {
  const totalRevenue = db.prepare("SELECT SUM(totalPrice) as total FROM sales").get() as any;
  const cashRevenue = db.prepare("SELECT SUM(totalPrice) as total FROM sales WHERE paymentType = 'cash'").get() as any;
  const debtRevenue = db.prepare("SELECT SUM(totalPrice) as total FROM sales WHERE paymentType = 'debt'").get() as any;
  const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE isDeleted = 0").get() as any;
  const totalSalesCount = db.prepare("SELECT COUNT(*) as count FROM sales").get() as any;
  
  const dailySales = db.prepare(`
    SELECT DATE(createdAt) as date, 
           SUM(CASE WHEN paymentType = 'cash' THEN totalPrice ELSE 0 END) as cash,
           SUM(CASE WHEN paymentType = 'debt' THEN totalPrice ELSE 0 END) as debt
    FROM sales
    WHERE createdAt >= date('now', '-7 days')
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `).all();

  const topProducts = db.prepare(`
    SELECT p.name, SUM(si.quantity) as totalSold
    FROM sale_items si
    JOIN products p ON si.productId = p.id
    GROUP BY p.id
    ORDER BY totalSold DESC
    LIMIT 5
  `).all();

  const totalDebts = db.prepare("SELECT SUM(totalPrice) as total FROM sales WHERE paymentType = 'debt' AND isPaid = 0").get() as any;
  
  res.json({
    totalRevenue: totalRevenue.total || 0,
    cashRevenue: cashRevenue.total || 0,
    debtRevenue: debtRevenue.total || 0,
    totalDebts: totalDebts.total || 0,
    totalProducts: totalProducts.count || 0,
    totalSalesCount: totalSalesCount.count || 0,
    dailySales,
    topProducts
  });
});

app.get("/api/sales", (req, res) => {
  const { type, period } = req.query;
  let query = "SELECT * FROM sales";
  const params: any[] = [];
  const conditions: string[] = [];

  if (type) {
    conditions.push("paymentType = ?");
    params.push(type);
  }

  if (period) {
    if (period === 'today') {
      conditions.push("DATE(createdAt) = DATE('now')");
    } else if (period === 'week') {
      conditions.push("createdAt >= DATE('now', '-7 days')");
    } else if (period === 'month') {
      conditions.push("createdAt >= DATE('now', '-30 days')");
    } else if (period === 'year') {
      conditions.push("createdAt >= DATE('now', '-365 days')");
    }
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY createdAt DESC";

  const sales = db.prepare(query).all(...params) as any[];
  
  const salesWithItems = sales.map(sale => {
    const items = db.prepare(`
      SELECT si.*, p.name
      FROM sale_items si
      JOIN products p ON si.productId = p.id
      WHERE si.saleId = ?
    `).all(sale.id);
    
    return {
      ...sale,
      items: items.map((item: any) => ({
        product: { name: item.name },
        quantity: item.quantity,
        price: item.priceAtSale
      }))
    };
  });
  
  res.json(salesWithItems);
});

app.get("/api/sales/:id", (req, res) => {
  const { id } = req.params;
  const sale: any = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
  if (!sale) return res.status(404).json({ message: "Sale not found" });

  const items = db.prepare(`
    SELECT si.*, p.name
    FROM sale_items si
    JOIN products p ON si.productId = p.id
    WHERE si.saleId = ?
  `).all(id);

  res.json({
    ...sale,
    itemsList: items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.priceAtSale
    }))
  });
});

app.put("/api/sales/:id/pay", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE sales SET isPaid = 1 WHERE id = ?").run(id);
    res.json({ message: "Debt marked as paid" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/sales/:id", (req, res) => {
  const { id } = req.params;
  try {
    const transaction = db.transaction(() => {
      // Get items to restore stock
      const items = db.prepare("SELECT productId, quantity FROM sale_items WHERE saleId = ?").all(id) as any[];
      
      for (const item of items) {
        db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(item.quantity, item.productId);
      }

      // Delete sale items first
      db.prepare("DELETE FROM sale_items WHERE saleId = ?").run(id);
      // Delete the sale
      db.prepare("DELETE FROM sales WHERE id = ?").run(id);
    });
    transaction();
    res.json({ message: "Transaction deleted and stock restored" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/sales", (req, res) => {
  try {
    const transaction = db.transaction(() => {
      // Restore all stock from all sales before deleting
      const items = db.prepare("SELECT productId, quantity FROM sale_items").all() as any[];
      for (const item of items) {
        db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(item.quantity, item.productId);
      }
      
      db.prepare("DELETE FROM sale_items").run();
      db.prepare("DELETE FROM sales").run();
    });
    transaction();
    res.json({ message: "All sales history cleared and stock restored" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Settings
app.get("/api/settings/:key", (req, res) => {
  const { key } = req.params;
  const setting: any = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  if (!setting) return res.status(404).json({ message: "Setting not found" });
  res.json(JSON.parse(setting.value));
});

app.post("/api/settings/:key", (req, res) => {
  const { key } = req.params;
  const value = JSON.stringify(req.body);
  try {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    res.json({ message: "Setting updated", value: req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Reset Application
app.post('/api/reset', (req, res) => {
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM sale_items').run();
      db.prepare('DELETE FROM sales').run();
      db.prepare('DELETE FROM products').run();
      db.prepare('DELETE FROM settings').run();
      
      // Re-insert default settings
      const defaultSettings = {
        storeName: 'SariConnect Pro',
        address: '123 Market St, Manila',
        phone: '0912 345 6789',
        footer: 'Thank you for your purchase!',
        showBarcode: true,
        logoUrl: ''
      };
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('receipt', JSON.stringify(defaultSettings));
    })();
    res.json({ message: 'Application reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
