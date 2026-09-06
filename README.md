# StockEase

StockEase is a stock/inventory management and billing (POS) application built
for small shop owners. It is a college/viva project focused on one core idea:
**billing is directly connected to inventory** — when a bill is completed,
the stock quantity in MongoDB is actually reduced, not just changed on screen.

---

## 1. What StockEase Does

- Shop owners register and log in with their own account.
- Each shop's products, bills, and stock history are private to that account.
- Products are managed in an **Inventory** page (add / edit / delete / search).
- Bills are created in a **Billing (POS)** page: add products to a cart,
  apply a discount, choose a payment method, and complete the bill.
- Completing a bill **reduces real stock in MongoDB** and writes an entry to
  **Stock History** for every unit sold.
- A **Dashboard** and **Reports** page show live numbers computed from
  MongoDB (never hard-coded).
- Inventory, Sales, and Stock History can be exported to **Excel (.xlsx)**
  using ExcelJS, generated locally from the current MongoDB data.
- Invoices can be printed using the browser's own print dialog (no PDF API).

## 2. Features

- Authentication: Register, Login, Logout (JWT + bcrypt password hashing)
- Per-user data isolation (User A can never see User B's data)
- Inventory: add / edit / delete / search products, automatic status
  (Available / Low Stock / Out of Stock) based on stock vs. minimum stock
- Billing / POS: cart, quantity controls, discount, payment method
  (Cash / UPI / Card — stored only, no real payment gateway), backend-verified
  stock and pricing
- Stock History: every stock change (sale, manual adjustment, product
  creation/deletion) is logged with previous stock, new stock, and a reference
- Sales: list of bills with a printable invoice view
- Reports: today's / weekly / monthly sales, best-selling products, a simple
  7-day sales bar chart (all computed from local MongoDB data)
- Excel export for Inventory, Sales, and Stock History
- Dashboard with live counts and recent activity
- Responsive dark UI that works on desktop, tablet, and mobile

## 3. Technology Used

| Layer          | Technology                                   |
|----------------|-----------------------------------------------|
| Frontend       | React (Vite), React Router, Axios             |
| Backend        | Node.js, Express.js                           |
| Database       | MongoDB (local), Mongoose                     |
| Authentication | bcryptjs (password hashing), JWT (sessions)   |
| Excel export   | ExcelJS                                       |

No external APIs, no API keys, and no paid services are used anywhere.
The only external dependency is MongoDB running on your own computer.

> **Note on bcrypt vs bcryptjs:** the project uses `bcryptjs` instead of the
> native `bcrypt` package. They provide the same `hash()` / `compare()` API,
> but `bcryptjs` is pure JavaScript, so it never needs a native compiler
> (node-gyp, Visual Studio Build Tools, etc.) to install — which makes it far
> more reliable on a typical student laptop, especially on Windows.

## 4. Project Structure

```
stockease/
│
├── package.json          <- run everything from here
│
├── client/                (React frontend - Vite)
│   ├── package.json
│   └── src/
│       ├── api/axios.js          <- shared Axios instance + JWT header
│       ├── context/AuthContext.jsx
│       ├── components/           <- Sidebar, AppLayout, Modal, etc.
│       ├── pages/                <- Login, Dashboard, Inventory, Billing, ...
│       ├── App.jsx                <- route definitions
│       ├── main.jsx
│       └── styles.css
│
└── server/                (Express backend)
    ├── package.json
    ├── server.js               <- app entry point
    ├── .env.example
    ├── config/db.js            <- MongoDB connection
    ├── middleware/auth.js      <- JWT verification
    ├── models/                 <- User, Product, Bill, StockHistory
    └── routes/                 <- auth, products, billing, sales,
                                    stockHistory, dashboard, reports,
                                    settings, export
```

The project uses **npm workspaces**, so the root `package.json` lists
`client` and `server` as workspaces. That is what lets a single
`npm install` at the root install dependencies for both folders.

## 5. Prerequisites

- **Node.js** (v18 or newer recommended) — https://nodejs.org
- **MongoDB Community Server**, running locally — https://www.mongodb.com/try/download/community

### Installing / running MongoDB locally

1. Download and install MongoDB Community Server for your OS.
2. Make sure the MongoDB service is running:
   - **Windows**: MongoDB is usually installed as a Windows Service and
     starts automatically. You can check in `services.msc` under
     "MongoDB Server".
   - **macOS (Homebrew)**:
     ```
     brew tap mongodb/brew
     brew install mongodb-community
     brew services start mongodb-community
     ```
   - **Linux**:
     ```
     sudo systemctl start mongod
     sudo systemctl enable mongod
     ```
3. By default MongoDB listens on `mongodb://127.0.0.1:27017`, which is
   exactly what this project's `.env` expects. StockEase will automatically
   create a database called `stockease` the first time it connects.
4. You do **not** need MongoDB Atlas, Compass, or any cloud account — a
   plain local `mongod` is enough. (You can still install MongoDB Compass
   if you'd like a GUI to browse the `stockease` database, but it's optional.)

## 6. Setup

From the **root** `stockease/` folder:

```bash
npm install
```

This installs dependencies for the root, `client/`, and `server/` in one go
(thanks to npm workspaces).

Next, create your backend environment file:

```bash
cd server
cp .env.example .env
cd ..
```

On Windows (Command Prompt), use `copy` instead of `cp`:
```
cd server
copy .env.example .env
cd ..
```

Open `server/.env` and adjust values if needed (the defaults work for a
standard local MongoDB install):

```
MONGO_URI=mongodb://127.0.0.1:27017/stockease
JWT_SECRET=stockease-development-secret
PORT=5000
```

`server/.env` is already listed in `.gitignore` and must never be committed.

## 7. Running the Project

Make sure MongoDB is running locally, then from the **root** folder run:

```bash
npm run dev
```

This uses `concurrently` to start both:
- the Express backend on **http://localhost:5000**
- the React (Vite) frontend on **http://localhost:5173**

Open **http://localhost:5173** in your browser. The Vite dev server proxies
all `/api/...` requests to the backend, so the frontend just talks to
`/api/...` without needing to know the backend's port.

To stop, press `Ctrl + C` in the terminal.

### Running frontend/backend separately (optional)

```bash
npm run server   # only the Express API on port 5000
npm run client   # only the React app on port 5173
```

### Production build (optional)

```bash
npm run build
```

Builds an optimized static frontend into `client/dist/`. For this college
project, `npm run dev` is normally all you need.

## 8. How the Billing + Inventory System Works (for your viva)

This is the core logic of the whole project, in `server/routes/billing.js`:

1. The **frontend** (Billing page) only sends `productId` and `quantity` for
   each cart item — never a price or a total. Prices can't be trusted from
   the browser, so the backend never uses them.
2. The **backend**, for every item in the cart:
   - Looks up the *real* product in MongoDB using `Product.findOne({ _id, user })`,
     which also guarantees the product actually belongs to the logged-in user.
   - Checks that `product.stock >= quantity`. If not, it responds with
     `"Insufficient stock for '<name>'. Only <n> units available."` and the
     whole bill is rejected — nothing is saved and no stock is changed.
3. Only once **every** item in the cart has passed this check does the
   backend actually update stock: for each item it does
   `product.stock -= quantity` and saves the product.
4. The backend computes `subtotal`, applies the `discount`, and computes the
   final `total` itself (again, never trusting numbers from the frontend).
5. A `Bill` document is created in MongoDB with a generated bill number
   (e.g. `INV-0001`), a snapshot of each item's name/price/quantity, the
   totals, and the payment method.
6. A `StockHistory` document is created for every item sold, storing
   `type: "SALE"`, the quantity removed, the previous stock, the new stock,
   and the bill number as a `reference` — this is what powers the Stock
   History page.

Because steps 2–6 all happen on the server against the live MongoDB data,
a user cannot oversell stock, fake a price, or see another user's products —
even if they tried to tamper with requests from the browser's dev tools.

> **Note on MongoDB transactions:** true multi-document transactions require
> MongoDB to run as a replica set, which a default local `mongod` does not.
> To keep local setup simple for this project, the billing route instead
> validates and loads *every* product first and only starts changing stock
> once the entire cart is confirmed valid — this still guarantees a bill is
> never created when stock is insufficient.

## 9. Demo Flow (useful for your viva walkthrough)

1. Register a new account (name, email, password, shop name).
2. Go to **Inventory** → Add a product, e.g. `Maggi`, price `14`, stock `50`,
   minimum stock `10`.
3. Go to **Billing** → click `Maggi` three times (or use the + button) to add
   quantity 3 → choose a payment method → **Complete Bill**.
4. You'll be taken to the printable invoice. Go back to **Inventory** and
   confirm `Maggi` now shows stock `47`.
5. Open **Stock History** and see a `SALE` entry: quantity `-3`, previous
   stock `50`, new stock `47`, reference = the bill number.
6. Open **Sales** to see the bill listed, and **Dashboard** / **Reports** to
   see the numbers update.
7. Try billing more units than are in stock to see the
   "Insufficient stock" message and confirm no bill is created.
8. Use the **Export Excel** buttons on Inventory / Sales / Stock History to
   download `.xlsx` files generated from the current MongoDB data.

## 10. Troubleshooting

- **"MongoDB connection error"** on server start → MongoDB isn't running.
  Start `mongod` (or the MongoDB service) and try again.
- **Port already in use** → another process is using 5000 or 5173. Stop it,
  or change `PORT` in `server/.env` (and update the proxy target in
  `client/vite.config.js` if you change the backend port).
- **Login/Register fails silently** → open the browser console / terminal
  running the server for the actual error message from the API.
