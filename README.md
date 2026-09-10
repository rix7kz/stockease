# StockEase

**Inventory Management Web Application with Integrated Billing and Automated Stock Tracking**

A full-stack MERN (MongoDB, Express, React, Node) application built for small retail shop owners. Manage products, sell to customers through a point-of-sale screen, and watch inventory update automatically in the database with every sale — no external APIs, no API keys, everything runs on your own machine.

---

## 1. Project Overview

StockEase lets a shop owner:

- Register and log in securely (JWT + bcrypt)
- Add, edit, delete, and search products
- Sell products through a Billing/POS screen
- Automatically deduct sold quantities from inventory in MongoDB
- View a complete stock movement history (purchases, sales, returns, adjustments)
- View sales history and print invoices
- See a live dashboard (products, low stock, today's sales)
- View sales reports and charts
- Export Inventory, Sales, and Stock History to real `.xlsx` files

The centerpiece feature is **Billing → Inventory integration**: completing a bill in the POS screen reduces the matching product's stock in MongoDB in the same request — it's not just a frontend illusion.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Excel export | ExcelJS |

No TypeScript. No external/paid APIs. No API keys required anywhere.

---

## 3. Architecture

```
React (Vite dev server, port 5173)
        │  axios calls to /api/*  (proxied to backend in dev)
        ▼
Express.js REST API (port 5000)
        │  Mongoose
        ▼
MongoDB (local, mongodb://127.0.0.1:27017/stockease)
```

---

## 4. Folder Structure

```
stockease/
├── package.json          ← root scripts (npm run dev)
├── README.md
├── .gitignore
│
├── client/                React + Vite frontend
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── styles.css
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── Navbar.jsx
│       │   ├── StatCard.jsx
│       │   ├── ProductModal.jsx
│       │   ├── BillInvoice.jsx
│       │   ├── Toast.jsx
│       │   └── ProtectedRoute.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           ├── Inventory.jsx
│           ├── Billing.jsx
│           ├── Sales.jsx
│           ├── StockHistory.jsx
│           ├── Reports.jsx
│           └── Settings.jsx
│
└── server/                 Express backend
    ├── package.json
    ├── server.js
    ├── .env.example
    ├── config/db.js
    ├── models/
    │   ├── User.js
    │   ├── Product.js
    │   ├── Bill.js
    │   └── StockMovement.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── productRoutes.js
    │   ├── billRoutes.js
    │   ├── stockRoutes.js
    │   ├── reportRoutes.js
    │   ├── exportRoutes.js
    │   └── settingsRoutes.js
    ├── middleware/authMiddleware.js
    └── utils/
        ├── seedAdmin.js
        └── generateBillNumber.js
```

---

## 5. MongoDB Installation

You need a local MongoDB server running on the default port `27017`.

- **Windows / macOS**: Install "MongoDB Community Server" from the official MongoDB site, then start the `mongod` service (the installer usually sets this up as a background service automatically).
- **macOS (Homebrew)**: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- **Linux**: Install `mongodb-org` via your distro's package manager and run `sudo systemctl start mongod`.

Verify it's running:

```bash
mongosh
```

If that connects without an error, MongoDB is ready. StockEase will create its own `stockease` database automatically the first time it connects — you don't need to create it manually.

---

## 6. Environment Setup

Copy the example environment file:

```bash
cd server
cp .env.example .env
```

`server/.env` should contain:

```
MONGO_URI=mongodb://127.0.0.1:27017/stockease
JWT_SECRET=stockease-development-secret
PORT=5000
```

Change `JWT_SECRET` to any random string you like — it's just used to sign login tokens.

---

## 7. Installation

From the **project root**:

```bash
cd stockease
npm install
```

This installs the root's `concurrently` dependency and (via the `postinstall` script) automatically installs both `server/` and `client/` dependencies too. If you'd rather do it manually:

```bash
npm install --prefix server
npm install --prefix client
```

---

## 8. Running the Project

From the project root:

```bash
npm run dev
```

This starts **both** the backend (port 5000) and the frontend (port 5173) together, using `concurrently`.

Individual scripts, if you ever need them:

```bash
npm run server   # backend only
npm run client   # frontend only
```

Once running, open:

```
http://localhost:5173
```

The Vite dev server proxies any request to `/api/...` straight to the Express backend on port 5000, so the frontend never needs to know the backend's URL directly.

---

## 9. Demo Login Credentials

StockEase automatically creates a demo admin account the very first time the backend connects to MongoDB — you never need to register manually to try the app.

```
Email:    admin@stockease.com
Password: admin@123
```

On the Login page, click **"Use Demo Account"** to auto-fill these credentials, then click **Login**.

The account is created only once (checked against MongoDB on every startup), the password is bcrypt-hashed before it's stored, and the plain-text password is never written to the database.

---

## 10. API Endpoints

**Auth**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

**Products**
```
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

**Bills**
```
GET    /api/bills
POST   /api/bills
GET    /api/bills/:id
```

**Stock**
```
GET    /api/stock
```

**Reports**
```
GET    /api/reports/dashboard
GET    /api/reports
```

**Exports**
```
GET    /api/export/inventory
GET    /api/export/sales
GET    /api/export/stock
```

**Settings**
```
GET    /api/settings
PUT    /api/settings
```

All routes except `register` and `login` require a `Authorization: Bearer <token>` header — the frontend's axios instance (`client/src/api.js`) attaches this automatically once you're logged in.

---

## 11. Database Models (summary)

- **User** — name, email, password (hashed), shopName, role, isDemo
- **Product** — userId, name, category, price, purchasePrice, stock, minimumStock, barcode (status is computed, not stored)
- **Bill** — userId, billNumber, customerName, items[], subtotal, discount, total, paymentMethod
- **StockMovement** — userId, productId, productName, type (PURCHASE/SALE/RETURN/ADJUSTMENT), quantity, previousStock, newStock, reference

Every Product, Bill, and StockMovement document carries a `userId`, and every backend route filters by `req.userId` (taken from the verified JWT, never from the request body) — this is what keeps each shop owner's data completely isolated from every other owner's.

---

## 12. Billing → Inventory Workflow

This is the core feature. When a bill is submitted from the POS screen:

1. The backend authenticates the request via JWT.
2. For each cart item, it loads the **actual** product from MongoDB by `productId` **and** the logged-in user's `userId` (so you can never bill someone else's product).
3. It checks the requested quantity against the real stock in the database — if any item doesn't have enough stock, the **entire bill is rejected** with a clear "Insufficient stock" message, and nothing is written to the database.
4. Price and totals are computed entirely from the database record — the frontend's displayed price is never trusted.
5. A unique, human-readable bill number is generated (e.g. `ST-2026-000001`).
6. The bill is saved, each product's `stock` field is decremented, and a `StockMovement` document (`type: "SALE"`) is created for each item, linking back to the bill number.
7. The completed bill (with server-computed totals) is returned and shown as a printable invoice.

Where the MongoDB deployment supports it (e.g. a replica set), this entire sequence runs inside a single MongoDB transaction so it can never partially apply. A local standalone `mongod` doesn't support transactions, so the app transparently falls back to the same sequential logic — the validation and business rules are identical either way.

---

## 13. Stock Deduction & History

Every change to a product's stock is recorded as a `StockMovement`:

| Type | When it's created |
|---|---|
| `PURCHASE` | A new product is added with initial stock > 0 |
| `SALE` | A bill is completed |
| `ADJUSTMENT` | Stock is changed manually while editing a product |
| `RETURN` | Reserved for future use (e.g. a returns feature) |

The Stock History page reads directly from these records, so it's always an accurate audit trail of every unit that has ever entered or left inventory.

---

## 14. Excel Export

The **Reports** page has three export buttons, each hitting a backend route that builds a real `.xlsx` workbook with ExcelJS from live MongoDB data and streams it back as a file download:

- Export Inventory → `stockease-inventory.xlsx`
- Export Sales → `stockease-sales.xlsx`
- Export Stock History → `stockease-stock-history.xlsx`

---

## 15. How to Demonstrate the Project to Faculty

1. Run `npm run dev` from the project root and open `http://localhost:5173`.
2. On the Login page, click **Use Demo Account**, then **Login**.
3. On the **Dashboard**, point out the live stats (all zero on a fresh database).
4. Go to **Inventory → Add Product**: create "Maggi", price ₹14, stock 50, minimum stock 10. Show it appears with an **AVAILABLE** badge.
5. Go to **Billing**: search "Maggi", click it 3 times (or use the quantity control) to add 3 units to the cart, then **Complete Bill**. Show the printable invoice.
6. Go back to **Inventory**: Maggi's stock is now **47** — pulled fresh from MongoDB, not just updated on screen.
7. Open **Stock History**: show the `SALE` row — quantity `-3`, previous stock `50`, new stock `47`, referencing the bill number.
8. Open **Sales**: show the completed bill, and click **View / Print** to show the invoice again.
9. Open **Reports**: show the sales chart and best-sellers table update to reflect the new sale.
10. Click **Export Inventory** (or **Export Sales**): open the downloaded `.xlsx` file and show Maggi's stock reads 47 there too — proving MongoDB is the single source of truth throughout the whole flow.

---

## 16. Security Notes

- Passwords are hashed with bcrypt (10 salt rounds); plain-text passwords are never stored.
- JWT tokens (7-day expiry) authenticate every private request.
- Every product/bill/stock query is scoped to `req.userId`, taken from the verified token — never from anything the frontend sends.
- Backend re-validates price, stock, and ownership on every bill — the frontend's numbers are never trusted.
- Negative stock is impossible: any bill that would take a product below zero is rejected outright, and nothing is written to the database.
- The demo account's credentials are intentionally public for classroom/portfolio demonstration — don't reuse this pattern for an app that will hold real customer data.
