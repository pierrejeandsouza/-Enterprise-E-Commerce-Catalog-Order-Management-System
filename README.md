# P01 — Enterprise E-Commerce Catalog & Order Management System

CIA-3 project — Advanced JavaScript Backend Frameworks (Node.js & Express.js), 5th Semester, Christ University.

## Project Title & Team Details

| Name | Roll Number | Department | Section |
|---|---|---|---|
| _TODO_ | _TODO_ | _TODO_ | _TODO_ |
| _TODO_ | _TODO_ | _TODO_ | _TODO_ |
| _TODO_ | _TODO_ | _TODO_ | _TODO_ |

## Problem Statement

A multi-vendor retail company needs a backend platform to manage its product catalog, customer orders, payment status, and delivery workflow. The system supports browsing and searching products, placing and tracking orders, and gives the store's operations team (Sellers and Admins) a way to manage stock and fulfilment — all through secure, role-based REST APIs backed by MongoDB.

## Tech Stack

- **Runtime/Framework:** Node.js + Express.js 5
- **Database:** MongoDB with Mongoose ODM
- **Auth:** Self-built JWT issuance/verification + bcrypt password hashing (no social login)
- **Validation:** Joi (request body/query validation middleware)
- **Error handling:** centralized Express error-handling middleware, consistent JSON error shape
- **API testing/docs:** Postman collection (`postman/P01-Ecommerce.postman_collection.json`)
- **Frontend:** vanilla HTML/CSS/JS + Bootstrap 5, served as static files from `public/` by Express itself (`app.use(express.static('public'))` in `server.js`) — talks to the API purely over `fetch()`, no build step

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and fill in real values:
   ```bash
   cp .env.example .env
   ```
   - `MONGO_URI` — your local MongoDB (`mongodb://127.0.0.1:27017/p01_ecommerce`) or an Atlas connection string.
   - `JWT_SECRET` — any long random string (never commit the real value).
3. Start MongoDB locally, or point `MONGO_URI` at Atlas.
4. Run the server:
   ```bash
   npm run dev     # nodemon, auto-restart
   # or
   npm start       # plain node
   ```
5. The API is served at `http://localhost:5000/api` (`GET /api/health` is a plain health check). Open `http://localhost:5000/` in a browser for the demo frontend — register/login, browse the catalog, add to cart, checkout, and (for seller/admin accounts) manage products, orders, categories and coupons.
6. Import `postman/P01-Ecommerce.postman_collection.json` into Postman for endpoint-level testing. Run **Auth → Register** first (it auto-saves the JWT into the collection's `token` variable for the rest of the requests).

## List of Implemented Modules

| # | Module | Status |
|---|---|---|
| 1 | User Registration & Authentication (JWT + bcrypt) | Implemented |
| 2 | Role-Based Access Control | Implemented |
| 3 | Product Catalog Management | Implemented |
| 4 | Category & Sub-Category Management | Implemented |
| 5 | Product Search & Filtering | Implemented |
| 6 | Shopping Cart Management | Implemented |
| 7 | Order Placement & Checkout | Implemented |
| 8 | Order Status Workflow | Implemented |
| 9 | Inventory & Stock Management | Implemented |
| 10 | Discount & Coupon Engine | Implemented |
| 11 | Payment Status Tracking (mock gateway) | Implemented |
| 12 | Reviews & Ratings | Implemented |
| 13 | Seller Dashboard APIs | Implemented — **spec inferred**, see note below |
| 14 | Admin Reporting & Analytics | Implemented — **spec inferred**, see note below |

> **Known limitation:** the source project brief's exact requirements text for Modules 13 and 14 was not available when this codebase was built (the reference document's page describing them was missing from what the team had captured). Endpoints for both were implemented based on the module titles, the Seller/Admin role responsibilities stated elsewhere in the brief, and the one sample endpoint the brief did show (`GET /api/admin/reports/sales`). If the official spec differs, these two controllers (`controllers/sellerDashboardController.js`, `controllers/adminReportController.js`) are the only files that should need revisiting.

## API Endpoint Reference

All responses follow:
```json
// success
{ "success": true, "message": "...", "data": { } }
// error (400/401/403/404/409)
{ "success": false, "message": "...", "errorCode": "VALIDATION_ERROR" }
```

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a customer or seller |
| POST | `/api/auth/login` | Public | Authenticate, issue JWT |
| GET | `/api/auth/me` | Any | Get logged-in profile |
| GET | `/api/categories` | Public | List categories |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category (blocked if in use) |
| GET | `/api/products` | Public | List/search/filter products (keyword, category, price range, rating, sort, pagination) |
| GET | `/api/products/:id` | Public | Get product |
| POST | `/api/products` | Seller/Admin | Create product |
| PUT | `/api/products/:id` | Seller (own)/Admin | Update product |
| DELETE | `/api/products/:id` | Seller (own)/Admin | Soft-delete product |
| GET | `/api/cart` | Customer | Get own cart |
| POST | `/api/cart` | Customer | Add item (stock-validated) |
| PUT | `/api/cart/:productId` | Customer | Update item quantity |
| DELETE | `/api/cart/:productId` | Customer | Remove item |
| DELETE | `/api/cart` | Customer | Clear cart |
| POST | `/api/orders` | Customer | Place order from cart (decrements stock, applies coupon) |
| GET | `/api/orders` | Any (role-scoped) | List orders — own (customer), own listings (seller), all (admin) |
| GET | `/api/orders/:id` | Owner/seller-on-order/Admin | Get order |
| PUT | `/api/orders/:id/status` | Seller/Admin | Advance order status (enforces transition graph) |
| POST | `/api/coupons` | Admin | Create coupon |
| GET | `/api/coupons` | Admin | List coupons |
| POST | `/api/coupons/apply` | Any | Validate/apply a coupon to a cart total |
| PUT | `/api/coupons/:id` | Admin | Update coupon |
| GET | `/api/payments/:orderId` | Owner/Admin | Get payment status |
| POST | `/api/payments/:orderId/mock-charge` | Customer | Simulate a successful mock-gateway charge |
| PUT | `/api/payments/:orderId` | Seller/Admin | Manually correct payment status (refunds, failures) |
| POST | `/api/products/:productId/reviews` | Customer | Submit review (delivered orders only) |
| GET | `/api/products/:productId/reviews` | Public | List reviews |
| GET | `/api/inventory/low-stock` | Seller/Admin | Products at/under the low-stock threshold |
| GET | `/api/seller/dashboard/summary` | Seller | Seller's product count, low-stock count, revenue |
| GET | `/api/seller/dashboard/orders-by-status` | Seller | Seller's order lines grouped by status |
| GET | `/api/admin/reports/sales` | Admin | Platform sales summary |
| GET | `/api/admin/reports/users` | Admin | User counts by role, pending seller approvals |
| GET | `/api/admin/reports/top-products` | Admin | Best-selling products by units sold |
| PUT | `/api/admin/sellers/:id/approve` | Admin | Approve a pending seller account |

Full request/response examples for every endpoint are in the Postman collection.

## Database Schema Summary

Collections: `users`, `categories`, `products`, `carts`, `orders`, `coupons`, `reviews`.

**Reference vs. embed decisions:**
- `products.categoryId`, `products.sellerId` — **referenced**. Both point at documents (a category, a user) that are large, shared across many products, and updated independently of any single product.
- `carts.items[]` — **embedded**. Cart line items are always read together with their parent cart and never queried independently.
- `orders.items[]` — **embedded, with a data snapshot** (`name`, `price` captured at order time). This keeps an order's historical total correct even if the underlying product's price changes later, and avoids a `$lookup` on every order read.
- `orders.items[].productId` / `sellerId` — referenced back to `Product`/`User` for traceability (e.g. seller-scoped order queries, "add to cart again").
- `reviews.productId`, `reviews.userId`, `reviews.orderId` — all **referenced**; reviews are large in aggregate, queried independently of any one order, and a product's `ratingAvg`/`ratingCount` are pre-aggregated back onto the `Product` document so listing/sorting products by rating never needs a `$lookup` + aggregate at read time.

**Indexes:**

| Collection | Index | Reason |
|---|---|---|
| users | `{ email: 1 }` unique | Enforces uniqueness, speeds up login lookups |
| products | `{ categoryId: 1 }`, `{ sellerId: 1 }`, text index on `name`+`description` | Fetch-by-relation queries, keyword search |
| categories | `{ parentCategoryId: 1 }` | Fetch-by-relation queries (sub-category lookups) |
| carts | `{ userId: 1 }` unique | One cart per user, fast fetch-by-owner |
| orders | `{ userId: 1 }`, `{ 'items.sellerId': 1 }` | Fetch-by-relation queries for customers and sellers |
| coupons | `{ code: 1 }` unique | Fast, unique lookup by code |
| reviews | `{ productId: 1, userId: 1, orderId: 1 }` unique | One review per product per order per user |

## Known Limitations

- Modules 13 & 14 endpoints are built from an inferred spec — see the note under "List of Implemented Modules" above.
- The included frontend (`public/`) is a functional demo, not a polished design — intentional per the project's scope notes ("visual polish is not evaluated"). It covers every module's happy path but skips things like image uploads (product `images[]` can only be set via the API/Postman today).
- Third-party integrations (payment gateway, SMS/email) are mocked, per the assignment's stated scope.
- Single currency/locale/timezone is assumed throughout, per the assignment's stated scope.

## Project Folder Structure

```
p01-ecommerce/
  config/          -> db.js (MongoDB connection), env.js (env loader)
  models/          -> one Mongoose schema file per collection
  routes/          -> Express route definitions, grouped by resource
  controllers/     -> business logic for each route
  middleware/      -> auth.js (JWT verify + RBAC), validate.js (Joi), errorHandler.js
  utils/           -> apiResponse.js, token.js, pagination.js, AppError.js, coupon.js, validators/
  scripts/         -> boot-check.js (dependency-free scaffold smoke test)
  postman/         -> exported Postman collection
  public/          -> demo frontend (index.html, css/, js/) served as static files
  .env.example     -> sample environment variables (no real secrets)
  server.js        -> app entry point
```
