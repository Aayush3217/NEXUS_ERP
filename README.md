# Mini ERP + CRM Operations Portal

A complete, production-quality Full Stack Developer Case Study project built for a wholesale/distribution company. This portal allows employees—such as Admin, Sales, Warehouse, and Accounts staff—to collaborate on managing customer profiles (CRM), product catalogues, physical inventory stock adjustments, and sales challans (dispatch billing sheets).

---

## 1. Project Overview
Wholesale and distribution companies require inventory coordination across sales teams, warehousing staff, and financial accountants. This system provides a unified monorepo portal where:
* **Sales staff** register customer follow-ups and build delivery invoices (Challans).
* **Warehouse workers** log stock intake/dispatches and oversee stock levels.
* **Accounts users** review invoice registers and financial statuses.
* **Admins** manage catalog products, configure pricing, and assign employee portals access.

---

## 2. Features
* **Role-Aware Dashboard**: Dynamic statistics dashboard loading different summaries and timelines depending on user roles.
* **CRM Customer Timeline**: Interactive customer cards storing address details, type (Retail/Wholesale/Distributor), and status, with a timeline follow-up history log.
* **Catalogue Management**: Product inventory listing with warning thresholds (LOW STOCK, OUT OF STOCK status badges).
* **Double-Entry Stock Movement**: Full audit logging where stock edits create double-entry IN/OUT movement registry files.
* **Atomic Challan Confirmations**: Dispatch invoice confirmations run inside database transaction sessions. Quantity requests exceeding current inventory trigger an immediate transaction rollback, guaranteeing that stock levels never become negative.
* **Snapshot Historigraphy**: Item prices and product names are snapshotted in challan history records at transaction time, preserving historic ledger billing values if catalogue prices are adjusted later.
* **Print-Ready Invoices**: Print styling formats invoices instantly for physical receipt printing (`window.print()`).
* **Interactive Demo Login**: Quick-select buttons fill login credentials instantly for easy screen demonstrations.

---

## 3. Tech Stack

### Frontend
* **Core**: React v18, Vite (Fast build compiler)
* **Styling**: Tailwind CSS v3 (Responsive grids, custom transitions)
* **Routing**: React Router DOM v6 (Route guards, authentication state blocks)
* **Form Handling**: React Hook Form v7 (Asynchronous validations)
* **Validations**: Zod (Custom validation rules)
* **Icons**: Lucide React

### Backend
* **Core**: Node.js, Express.js (REST API server)
* **Language**: TypeScript v5 (Strict mode compiled)
* **Database Access**: Prisma ORM v5
* **Security**: bcrypt (Password hashing), JSON Web Tokens (Session authentication), Helmet (HTTP security headers), CORS (Cross-origin safety)
* **Rate Limiting**: Express Rate Limit (Auth endpoint protection)

### Database
* **Engine**: PostgreSQL v17

---

## 4. Architecture
The system uses a clean monorepo architecture:
```
client/ (React Presentation layer)
   ↓ Axios HTTP Requests
server/src/app.ts (Express Boot)
   ↓ Rate limit / CORS / Helmet
server/src/middleware/auth.ts (JWT & RBAC Middlewares)
   ↓ Express controllers
server/src/controllers/ (Input Zod Schema verification)
   ↓ Delegated calls
server/src/services/ (Transactional business logic)
   ↓ Prisma ORM Client
PostgreSQL Database
```

Details can be found in [docs/ARCHITECTURE.md](file:///e:/FundsRoom/docs/ARCHITECTURE.md) and [docs/API.md](file:///e:/FundsRoom/docs/API.md).

---

## 5. Folder Structure
```
mini-erp-crm/
│
├── client/                      # React SPA Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components (UI.jsx, ConfirmDialog, etc.)
│   │   ├── layouts/             # Page layouts (DashboardLayout, AuthLayout)
│   │   ├── pages/               # Dashboard, Customers, Products, Inventory, Challans, Users
│   │   ├── services/            # Axios API instances (api.js)
│   │   ├── store/               # React Context stores (authContext, toastContext)
│   │   ├── App.jsx              # Routing configurations
│   │   └── main.jsx             # DOM mounting entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Express REST API Backend
│   ├── src/
│   │   ├── config/              # Database connection instantiations (prisma.ts)
│   │   ├── controllers/         # HTTP request wrappers and error routing
│   │   ├── middleware/          # JWT, RBAC guards, global error handlers
│   │   ├── routes/              # Express API routers
│   │   ├── services/            # Transactional database query executions
│   │   ├── types/               # Type declarations (index.ts)
│   │   ├── validators/          # Input schema validations (Zod schemas)
│   │   ├── tests/               # Vitest integration test suites
│   │   ├── app.ts               # App setups
│   │   └── server.ts            # Http launch bindings
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma data models definitions
│   │   └── seed.ts              # Mock seed script
│   ├── package.json
│   └── tsconfig.json
│
├── postman/                     # API testing collection exports
│   └── mini-erp-crm.postman_collection.json
│
├── docs/                        # Specifications documentation
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── README.md
├── .gitignore
└── package.json                 # Monorepo workspaces coordinator
```

---

## 6. Database Schema
Models defined in PostgreSQL:
* **User**: UUID primary key, name, email (unique), passwordHash, role enum, isActive flag.
* **Customer**: UUID primary key, name, businessName, mobile, email, gstNumber, type enum, status enum, followUpDate, notes.
* **CustomerFollowUp**: UUID primary key, customerId reference, notes, followUpDate, createdBy reference.
* **Product**: UUID primary key, productName, sku (unique), category, unitPrice, currentStock, minimumStock, warehouseLocation.
* **StockMovement**: UUID primary key, productId reference, quantity, type enum (IN/OUT), reason, createdBy reference.
* **SalesChallan**: UUID primary key, challanNumber (unique), customerId reference, totalQuantity, status enum (DRAFT/CONFIRMED/CANCELLED), createdBy reference.
* **SalesChallanItem**: UUID primary key, challanId reference, productId reference, snapshots (productNameSnapshot, skuSnapshot, unitPriceSnapshot), quantity, totalPrice.

---

## 7. Authentication
Stateless session tokens are generated via JWT and verify on secure routes. If the client makes an unauthorized request or if the token has expired, Axios interceptors clear local storage and redirect the user back to the login screen.

---

## 8. Role Permissions Matrix

| Operations Module | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|---|---|---|---|
| **Users Administration** | Full Access | No Access | No Access | No Access |
| **Products Catalogue** | Full Access | View Only | View Only | View Only |
| **CRM Customer Module** | Full Access | Manage & Followup | No Access | View Only |
| **Inventory stock IN/OUT** | Full Access | View Only | Full Access | View Only |
| **Sales Challans** | Full Access | Manage & Confirm | View Only | View Only |
| **Dashboard Revenue** | Full Access | No Access | No Access | Full Access |

---

## 9. Test Credentials
The database seeds with the following credentials. You can use the quick buttons on the login screen to autofill them.

* **Admin User**:
  * Email: `admin@example.com`
  * Password: `Admin@123`
* **Sales User**:
  * Email: `sales@example.com`
  * Password: `Sales@123`
* **Warehouse User**:
  * Email: `warehouse@example.com`
  * Password: `Warehouse@123`
* **Accounts User**:
  * Email: `accounts@example.com`
  * Password: `Accounts@123`

---

## 10. Environment Variables

### Server (`server/.env`)
```env
PORT=8080
DATABASE_URL=postgresql://postgres:Aayush%404217@localhost:5432/mini_erp_crm
JWT_SECRET=super_secret_jwt_key_should_be_long_and_secure_key_12345
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:8080
```

---

## 11. Local Setup Instructions

### Prerequisites
* **Node.js**: v24 or higher
* **PostgreSQL**: v17 or higher (running on local port 5432)

### Steps

1. **Clone project and navigate to workspace**:
   ```bash
   cd e:\FundsRoom
   ```
2. **Install all workspaces dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
   * Create `server/.env` based on `server/.env.example`
   * Create `client/.env` based on `client/.env.example`
4. **Deploy database migrations**:
   ```bash
   npm run db:migrate
   ```
5. **Seed the database**:
   ```bash
   npm run db:seed
   ```
6. **Run integration test suite**:
   ```bash
   npm run test
   ```
7. **Start both server & client development environments concurrently**:
   ```bash
   npm run dev
   ```

The application will run:
* React Client: `http://localhost:5173`
* Express API Server: `http://localhost:8080`

---

## 12. Deployment Instructions

### Database (Neon PostgreSQL)
1. Sign up on [Neon.tech](https://neon.tech) and create a PostgreSQL database instance.
2. Copy the connection string. Make sure to URL-encode special characters in the password.

### Backend (Render)
1. Sign up on [Render.com](https://render.com).
2. Create a new **Web Service** pointing to your GitHub repository.
3. Configure the build parameters:
   * Root Directory: `server`
   * Build Command: `npm install && npm run build`
   * Start Command: `npm run start`
4. In environment settings, configure the server environment variables (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PORT=8080`, `CLIENT_URL=https://<your-vercel-domain>.vercel.app`).

### Frontend (Vercel)
1. Sign up on [Vercel.com](https://vercel.com).
2. Create a new project pointing to your GitHub repository.
3. In configure parameters:
   * Root Directory: `client`
   * Build Command: `npm run build`
   * Output Directory: `dist`
4. Set the Environment Variables:
   * `VITE_API_URL`: Points to your Render backend API URL (e.g. `https://mini-erp-backend.onrender.com`).

---

## 13. Business Logic Assumptions
1. **Challan States**: A challan starts in `DRAFT`.
   * Transitioning `DRAFT` to `CONFIRMED` verifies inventory, locks tables, and deducts stock.
   * Transitioning `DRAFT` to `CANCELLED` is allowed.
   * Transitioning `CONFIRMED` to `CANCELLED` is strictly blocked in the API to prevent automatic stock restorations without inventory audits.
2. **Double Entry movements**: Stock changes must always create an auditing `StockMovement` row tracking who, when, why, and how much stock was updated.
3. **Indian Enterprise Pricing**: All pricing is calculated in Indian Rupees (₹ - INR) and displays formatted with proper commas and decimal points.

---

## 14. Screenshots Section Placeholder
*(Visual design previews will render here in deployment records)*

---

## 15. Known Limitations & Future Improvements
1. **Invoice PDF Exports**: The project supports direct browser invoice printing. In the future, a backend PDF generator (e.g. using `pdfkit` or `puppeteer`) could be integrated to generate download links directly.
2. **Product Image Upload**: Can integrate AWS S3 client libraries to allow uploading product photography.
3. **Advanced Filters**: Calendar date range selection can be implemented to query historical stock movements and order statistics.
