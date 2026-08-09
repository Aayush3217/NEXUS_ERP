# System Architecture Documentation

This document explains the software architecture, database transaction design, and role privileges structure implemented in the Mini ERP + CRM Portal.

## Data Flow Diagram

The application is structured as a monolithic monorepo with clear separation between the presentation tier (client) and the database access/business rules tier (server).

```mermaid
graph TD
    subgraph Client [React SPA Frontend]
        UI[Tailwind UI Views] --> Hooks[React Hook Form / Zod Client Validation]
        Hooks --> ClientAPI[Axios API Client / interceptors]
    end

    subgraph Server [Express + Node.js Backend]
        ClientAPI -- HTTPS REST Request --> AppInit[Express App app.ts]
        AppInit --> AuthMiddleware[JWT Auth & RBAC Security Middleware]
        AuthMiddleware --> Routes[Express Routers]
        Routes --> Controllers[Controllers Layer]
        Controllers --> Services[Services Layer - Business Logic]
        Services -- Transactions / Queries --> Prisma[Prisma ORM Client]
    end

    subgraph Database [PostgreSQL Engine]
        Prisma -- SQL Client Connection --> DB[(PostgreSQL Database)]
    end
```

---

## 1. Authentication & Security Flow

Platform security relies on JSON Web Token (JWT) stateless tokens passed via request HTTP headers.

```mermaid
sequenceDiagram
    actor User as Portal Employee
    participant Client as React Client
    participant Server as Express Server
    participant DB as PostgreSQL

    User->>Client: Inputs Email & Password
    Client->>Server: POST /api/auth/login
    Server->>DB: Fetch user by email
    DB-->>Server: User record (with passwordHash)
    Server->>Server: bcrypt.compare(password, passwordHash)
    
    alt Credentials Valid
        Server->>Server: Sign JWT token (Expiry 24h, contains: id, email, name, role)
        Server-->>Client: Returns HTTP 200 { success: true, token, user }
        Client->>Client: Save token and user details to localStorage
        Client->>Client: Redirect to /dashboard
    else Credentials Invalid
        Server-->>Client: Returns HTTP 401 { success: false, message: 'Invalid...' }
        Client->>User: Display inline error banner
    end
```

1. **Persistent Session**: When the browser loads, a `useEffect` hook in `AuthContext` checks if a token exists in `localStorage`. If yes, it calls `GET /api/auth/me`. The server decodes the token, checks if the user is still active in the database, and returns updated user details.
2. **Access Security**: Secure endpoints are guarded by two Express middlewares:
   - `authenticate`: Extracts token from `Authorization: Bearer <token>` header, decodes via `jwt.verify`, and attaches `req.user` context.
   - `authorize(...roles)`: Verifies if `req.user.role` matches one of the roles allowed for that endpoint. Otherwise, it immediately returns `HTTP 403 Forbidden` without hitting database layers.

---

## 2. Challan Confirmation: Atomic Inventory Transactions

Confirming a challan is the most critical operation in the platform. Stock deduction is designed to be **atomic** (all-or-nothing) and resistant to race conditions.

```mermaid
sequenceDiagram
    participant Client as React Client
    participant Server as Challan Service
    participant DB as PostgreSQL Transaction

    Client->>Server: POST /api/challans/:id/confirm
    Server->>DB: Start $transaction
    Server->>DB: Fetch Challan details & lock rows (FOR UPDATE)
    Server->>DB: Fetch Product stocks & lock rows
    
    alt Stock Sufficient for ALL Items
        loop For Each Challan Item
            Server->>DB: Update product stock: currentStock = currentStock - quantity
            Server->>DB: Insert OUT StockMovement audit record
        end
        Server->>DB: Update SalesChallan status = CONFIRMED
        Server->>DB: Commit Transaction
        DB-->>Server: Success response
        Server-->>Client: HTTP 200 { success: true, challan }
    else Stock Insufficient for ANY Item
        Server->>DB: Rollback Transaction (all changes discarded)
        DB-->>Server: Rollback complete
        Server-->>Client: HTTP 400 { success: false, message: 'Insufficient stock...' }
    end
```

### Key Safety Implementations
* **Atomicity (`$transaction`)**: Implemented using Prisma's transactional engine. If updating product A succeeds but product B has insufficient stock, the transaction is rejected, and product A's stock is rolled back to its original state.
* **Race-Condition Prevention (`FOR UPDATE`)**: The transaction uses raw locks (`SELECT ... FOR UPDATE`) during product fetching. This locks the database row for the product being modified, preventing other concurrent orders from reading stale stock values before the current transaction writes updates.
* **Snapshot Preservation**: Products prices, names, and SKUs are captured as snapshots inside `SalesChallanItem` when the draft is built. If a product's price or description is changed in the catalogue later, the historical challan item snapshot details remain unaltered.
