# Mini ERP + CRM REST API Documentation

This document describes all API endpoints exposed by the backend server. 

## Base URL
* Local Development: `http://localhost:8080`
* Production: `https://<your-backend-render-url>.onrender.com`

## Global Response Format

### Success (HTTP 200/201)
```json
{
  "success": true,
  "data": ... // Payload object or array
}
```

### Error (HTTP 400/401/403/404/409/500)
```json
{
  "success": false,
  "message": "Error description message",
  "errors": [ ... ] // Optional detailed Zod validation arrays
}
```

---

## 1. Authentication

### Log In
* **Method**: `POST`
* **URL**: `/api/auth/login`
* **Auth Required**: No (Public)
* **Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "name": "Aayush Pal (Admin)",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```
* **Errors**: 
  * `401 Unauthorized`: Invalid email or password, or account deactivated.
  * `400 Bad Request`: Input validation failed.

### Active Session Verification
* **Method**: `GET`
* **URL**: `/api/auth/me`
* **Auth Required**: Yes (Bearer Token)
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "name": "Aayush Pal (Admin)",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

---

## 2. Customer CRM Module

### Query Customers
* **Method**: `GET`
* **URL**: `/api/customers`
* **Auth Required**: Yes (Bearer Token)
* **Permitted Roles**: `ADMIN`, `SALES`, `ACCOUNTS`
* **Query Parameters**:
  * `page` (default 1)
  * `limit` (default 10)
  * `search` (Search name, business, mobile, email)
  * `status` (`LEAD`, `ACTIVE`, `INACTIVE`)
  * `customerType` (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`)
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2
  }
}
```

### Create Customer
* **Method**: `POST`
* **URL**: `/api/customers`
* **Auth Required**: Yes (Bearer Token)
* **Permitted Roles**: `ADMIN`, `SALES`
* **Request Body**:
```json
{
  "customerName": "Amit Gupta",
  "businessName": "Gupta Enterprises",
  "mobile": "9988776655",
  "email": "gupta.ent@gmail.com",
  "gstNumber": "27AAPCS1034E1Z3",
  "customerType": "WHOLESALE",
  "address": "Crawford Market, Mumbai, Maharashtra 400001",
  "status": "ACTIVE"
}
```
* **Success Response (210 Created)**

### Get Customer Detail
* **Method**: `GET`
* **URL**: `/api/customers/:id`
* **Auth Required**: Yes
* **Permitted Roles**: `ADMIN`, `SALES`, `ACCOUNTS`
* **Success Response (200 OK)**: Returns profile details alongside history of CRM timeline follow-up nodes.

### Add Follow-Up Note
* **Method**: `POST`
* **URL**: `/api/customers/:id/follow-ups`
* **Auth Required**: Yes
* **Permitted Roles**: `ADMIN`, `SALES`
* **Request Body**:
```json
{
  "note": "Called to check requirements. Scheduled delivery catalog email.",
  "followUpDate": "2026-08-12T11:00:00.000Z"
}
```

---

## 3. Product Module

### List Products
* **Method**: `GET`
* **URL**: `/api/products`
* **Auth / Roles**: Yes / ALL Roles
* **Query Parameters**:
  * `page`, `limit`, `search`, `category`
  * `lowStock` (`true` to show items where stock is below minimum threshold)

### Create Product
* **Method**: `POST`
* **URL**: `/api/products`
* **Auth / Roles**: Yes / `ADMIN` only
* **Request Body**:
```json
{
  "productName": "Brass Ball Valve 1 inch",
  "sku": "PLUM-VAL-002",
  "category": "Plumbing",
  "unitPrice": 320.00,
  "currentStock": 80,
  "minimumStock": 15,
  "warehouseLocation": "Aisle C-Shelf 2"
}
```

---

## 4. Inventory Module

### Log Stock Adjustment
* **Method**: `POST`
* **URL**: `/api/inventory/movements`
* **Auth / Roles**: Yes / `ADMIN` or `WAREHOUSE` only
* **Request Body**:
```json
{
  "productId": "7ca64e7a-cc2e-436f-8a03-7f28329623ea",
  "quantity": 25,
  "movementType": "IN", // "IN" or "OUT"
  "reason": "Restocked due to vendor purchase delivery order #93"
}
```
* **Errors**: `400 Bad Request` if "OUT" request quantity exceeds current inventory stock levels.

---

## 5. Sales Challans

### Create Draft Challan
* **Method**: `POST`
* **URL**: `/api/challans`
* **Auth / Roles**: Yes / `ADMIN` or `SALES` only
* **Request Body**:
```json
{
  "customerId": "8ba64e7b-cc2e-436f-8a03-7f28329623eb",
  "items": [
    { "productId": "7ca64e7a-cc2e-436f-8a03-7f28329623ea", "quantity": 10 },
    { "productId": "5ea54d2a-dd1e-221f-7a02-5e28329623ab", "quantity": 5 }
  ]
}
```
* **Success Response (201 Created)**: Saves order in `DRAFT` status. *Physical stock is NOT reduced.*

### Confirm Challan (Deduct Stock)
* **Method**: `POST`
* **URL**: `/api/challans/:id/confirm`
* **Auth / Roles**: Yes / `ADMIN` or `SALES` only
* **Success Response (200 OK)**: Marks status as `CONFIRMED`, decreases product stock, and logs audit movements.
* **Errors**: `400 Bad Request` if *any* single item requested exceeds available inventory. The transaction rolls back completely.

### Cancel Draft Challan
* **Method**: `POST`
* **URL**: `/api/challans/:id/cancel`
* **Auth / Roles**: Yes / `ADMIN` or `SALES` only
* **Success Response (200 OK)**: Transitions draft to `CANCELLED` status. (Blocked if challan is already confirmed).

---

## 6. Portal Administration (Admin Only)

* `GET /api/users`: List users directory.
* `POST /api/users`: Create user account.
* `PUT /api/users/:id`: Edit user details / roles / password.
* `DELETE /api/users/:id`: Delete user account login.
