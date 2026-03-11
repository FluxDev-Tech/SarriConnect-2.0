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
    paymentType TEXT DEFAULT 'cash', -- 'cash' or 'debt'
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

// Migration: Add isDeleted to products if it doesn't exist
try {
  db.prepare("ALTER TABLE products ADD COLUMN isDeleted INTEGER DEFAULT 0").run();
  console.log("Migration: Added isDeleted column to products table.");
} catch (e) {
  // Column probably already exists
}

// Seed Data
const seedData = async () => {
  const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
  if (userCount === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      "Admin User",
      "admin@store.com",
      hashedPassword,
      "admin"
    );
    console.log("Default admin user created: admin@store.com / admin123");
  }

  const productCount = (db.prepare("SELECT COUNT(*) as count FROM products").get() as any).count;
  if (productCount === 0) {
    const products = [
      ["Coke 1.5L", "4800016603014", "Beverages", 65, 24],
      ["Lucky Me Pancit Canton", "4800016101015", "Instant Noodles", 15, 50],
      ["Great Taste White", "4800016202012", "Coffee", 10, 100],
      ["Safeguard White 130g", "4800016303019", "Personal Care", 45, 12],
      ["SkyFlakes 10s", "4800016404016", "Snacks", 55, 20]
    ];
    const stmt = db.prepare("INSERT INTO products (name, barcode, category, price, stock) VALUES (?, ?, ?, ?, ?)");
    for (const p of products) {
      stmt.run(...p);
    }
    console.log("Sample products seeded.");
  }

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
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      return res.status(403).json({ message: "Forbidden", error: err.message });
    }
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Auth
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    const info = stmt.run(name, email, hashedPassword, role || 'staff');
    res.status(201).json({ id: info.lastInsertRowid, name, email, role });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get("/api/auth/profile", authenticateToken, (req: any, res) => {
  const user: any = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

// Products
app.get("/api/products", authenticateToken, (req, res) => {
  const products = db.prepare("SELECT * FROM products WHERE isDeleted = 0 ORDER BY createdAt DESC").all();
  res.json(products);
});

app.post("/api/products", authenticateToken, (req, res) => {
  const { name, barcode, category, price, stock, imageUrl } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO products (name, barcode, category, price, stock, imageUrl) VALUES (?, ?, ?, ?, ?, ?)");
    const info = stmt.run(name, barcode, category, price, stock, imageUrl);
    res.status(201).json({ id: info.lastInsertRowid, ...req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/products/:id", authenticateToken, (req, res) => {
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

app.delete("/api/products/:id", authenticateToken, (req, res) => {
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
app.post("/api/sales", authenticateToken, (req, res) => {
  const { items, totalPrice, subtotal, discount, paymentType, customerName } = req.body; // items: [{ id, quantity, price }]
  
  const transaction = db.transaction(() => {
    const saleStmt = db.prepare("INSERT INTO sales (totalPrice, subtotal, discount, paymentType, customerName) VALUES (?, ?, ?, ?, ?)");
    const saleInfo = saleStmt.run(totalPrice, subtotal || totalPrice, discount || 0, paymentType || 'cash', customerName || null);
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

app.get("/api/sales", authenticateToken, (req, res) => {
  const sales = db.prepare(`
    SELECT s.*, GROUP_CONCAT(p.name || ' (x' || si.quantity || ')') as items
    FROM sales s
    JOIN sale_items si ON s.id = si.saleId
    JOIN products p ON si.productId = p.id
    GROUP BY s.id
    ORDER BY s.createdAt DESC
  `).all();
  res.json(sales);
});

app.put("/api/sales/:id/pay", authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE sales SET paymentType = 'cash' WHERE id = ?").run(id);
    res.json({ message: "Debt marked as paid" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/sales/stats", authenticateToken, (req, res) => {
  const totalRevenue = db.prepare("SELECT SUM(totalPrice) as total FROM sales").get() as any;
  const cashRevenue = db.prepare("SELECT SUM(totalPrice) as total FROM sales WHERE paymentType = 'cash'").get() as any;
  const debtRevenue = db.prepare("SELECT SUM(totalPrice) as total FROM sales WHERE paymentType = 'debt'").get() as any;
  const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
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

  res.json({
    totalRevenue: totalRevenue.total || 0,
    cashRevenue: cashRevenue.total || 0,
    debtRevenue: debtRevenue.total || 0,
    totalProducts: totalProducts.count || 0,
    totalSalesCount: totalSalesCount.count || 0,
    dailySales,
    topProducts
  });
});

// Settings
app.get("/api/settings/:key", authenticateToken, (req, res) => {
  const { key } = req.params;
  const setting: any = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  if (!setting) return res.status(404).json({ message: "Setting not found" });
  res.json(JSON.parse(setting.value));
});

app.post("/api/settings/:key", authenticateToken, (req, res) => {
  const { key } = req.params;
  const value = JSON.stringify(req.body);
  try {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    res.json({ message: "Setting updated", value: req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
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
