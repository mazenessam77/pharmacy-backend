# Pharmacy Medicine Request Platform — Full Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Backend — API & Server](#5-backend--api--server)
6. [Frontend — Next.js App](#6-frontend--nextjs-app)
7. [Database Models](#7-database-models)
8. [Authentication & Security](#8-authentication--security)
9. [Real-Time (Socket.io)](#9-real-time-socketio)
10. [Docker Setup](#10-docker-setup)
11. [Bugs Fixed During Development](#11-bugs-fixed-during-development)
12. [How to Run](#12-how-to-run)
13. [API Reference](#13-api-reference)
14. [Environment Variables](#14-environment-variables)

---

## 1. Project Overview

A full-stack medicine request platform that connects **patients**, **pharmacies**, and **admins**.

**Core flow:**
1. A patient submits a medicine request (with optional prescription photo).
2. Nearby pharmacies receive the request and can respond with a price offer.
3. The patient reviews offers and accepts one.
4. The pharmacy prepares and delivers the medicines.
5. Both sides can chat in real time through the order.

**Three user roles:**
- **Patient** — submits orders, tracks status, chats with pharmacy, reviews
- **Pharmacy** — receives orders, manages inventory, responds with offers, delivers
- **Admin** — manages all users, pharmacies, medicines, orders platform-wide

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Docker Network                    │
│                  (pharma-network)                   │
│                                                     │
│  ┌──────────────┐        ┌──────────────────────┐  │
│  │  Next.js 14  │◄──────►│  Express + Socket.io │  │
│  │  (frontend)  │  HTTP  │     (backend)        │  │
│  │  port 3000   │  WS    │     port 5001→5000   │  │
│  └──────────────┘        └──────────┬───────────┘  │
│                                     │               │
│                          ┌──────────┼───────────┐   │
│                          │          │           │   │
│                   ┌──────▼──┐  ┌────▼──────┐   │   │
│                   │ MongoDB │  │  Redis    │   │   │
│                   │  7.0    │  │  7-alpine │   │   │
│                   │ :27017  │  │  :6379    │   │   │
│                   └─────────┘  └───────────┘   │   │
└─────────────────────────────────────────────────────┘
```

- **Frontend** talks to the backend over HTTP (REST API) and WebSocket (Socket.io)
- **Backend** connects to MongoDB for persistence and Redis for session/caching
- All 4 services run in the same Docker bridge network

---

## 3. Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + TypeScript | Runtime & type safety |
| Express.js | HTTP framework |
| Socket.io | Real-time WebSocket server |
| MongoDB + Mongoose | Primary database & ODM |
| Redis | Caching / token store |
| JWT (access + refresh) | Authentication |
| bcryptjs | Password hashing |
| Joi + Zod | Input validation |
| Multer + Cloudinary | File/image uploads |
| Tesseract.js | OCR — prescription scanning |
| Nodemailer | Email (password reset) |
| Winston | Logging |
| Helmet | HTTP security headers |
| express-rate-limit | Rate limiting |
| Swagger | API documentation |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14 | React framework (App Router) |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Zustand | Global state management |
| Axios | HTTP client |
| Socket.io-client | Real-time WebSocket client |
| React Hook Form + Zod | Forms & validation |
| Framer Motion | Animations |
| Lucide React | Icons |
| react-hot-toast | Toast notifications |
| date-fns | Date formatting |

---

## 4. Project Structure

```
pharmacy-backend/
├── src/                        # Backend source
│   ├── app.ts                  # Express app setup, middleware, routes
│   ├── server.ts               # HTTP server + Socket.io bootstrap
│   ├── config/
│   │   ├── env.ts              # Env variable validation
│   │   └── swagger.ts          # Swagger/OpenAPI spec
│   ├── controllers/            # Route handler logic
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── order.controller.ts
│   │   ├── orderResponse.controller.ts
│   │   ├── pharmacy.controller.ts
│   │   ├── inventory.controller.ts
│   │   ├── medicine.controller.ts
│   │   ├── prescription.controller.ts
│   │   ├── message.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── review.controller.ts
│   │   └── admin.controller.ts
│   ├── models/                 # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Order.ts
│   │   ├── OrderResponse.ts
│   │   ├── Pharmacy.ts
│   │   ├── Inventory.ts
│   │   ├── Medicine.ts
│   │   ├── Prescription.ts
│   │   ├── Message.ts
│   │   ├── Notification.ts
│   │   └── Review.ts
│   ├── routes/                 # Express routers
│   ├── middleware/
│   │   ├── authenticate.ts     # JWT verification
│   │   ├── authorize.ts        # Role-based access
│   │   ├── rateLimiter.ts      # Rate limiting
│   │   ├── validate.ts         # Request validation
│   │   ├── upload.ts           # Multer config
│   │   └── errorHandler.ts     # Global error handler
│   ├── socket/
│   │   ├── index.ts            # Socket.io server init
│   │   ├── auth.socket.ts      # Socket JWT middleware
│   │   ├── chat.handler.ts     # Chat events
│   │   ├── order.handler.ts    # Order events
│   │   └── pharmacy.handler.ts # Pharmacy events
│   ├── services/
│   │   └── medicine-matcher.service.ts  # OCR prescription matching
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── jwt.ts
│   │   └── logger.ts
│   ├── validations/            # Joi/Zod schemas
│   ├── types/                  # TypeScript interfaces
│   ├── seed/                   # DB seed scripts
│   └── __tests__/              # Jest test suites
│
├── frontend/                   # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # Route group — no URL prefix
│       │   │   ├── login/
│       │   │   ├── register/
│       │   │   └── forgot-password/
│       │   ├── admin/          # /admin/* routes
│       │   │   ├── dashboard/
│       │   │   ├── users/
│       │   │   ├── pharmacies/
│       │   │   ├── medicines/
│       │   │   ├── orders/[id]/
│       │   │   ├── notifications/
│       │   │   └── profile/
│       │   ├── patient/        # /patient/* routes
│       │   │   ├── dashboard/
│       │   │   ├── orders/
│       │   │   ├── orders/new/
│       │   │   ├── orders/[id]/
│       │   │   ├── chat/
│       │   │   ├── chat/[orderId]/
│       │   │   ├── notifications/
│       │   │   └── profile/
│       │   └── pharmacy/       # /pharmacy/* routes
│       │       ├── dashboard/
│       │       ├── orders/[id]/
│       │       ├── inventory/
│       │       ├── chat/[orderId]/
│       │       ├── notifications/
│       │       ├── profile/
│       │       └── settings/
│       ├── components/
│       │   ├── shared/
│       │   │   ├── Navbar.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   ├── ChatWindow.tsx
│       │   │   └── ProtectedRoute.tsx
│       │   ├── layout/
│       │   └── ui/
│       ├── lib/
│       │   ├── api.ts           # Axios instance + interceptors
│       │   ├── socket.ts        # Socket.io client (SSR-safe)
│       │   ├── helpers.ts
│       │   ├── validations.ts
│       │   └── services/        # Per-feature API calls
│       └── store/               # Zustand stores
│           ├── authStore.ts
│           ├── orderStore.ts
│           ├── chatStore.ts
│           └── notificationStore.ts
│
├── mongo/
│   └── init-mongo.js            # MongoDB init script
├── nginx/                       # Nginx config (prod)
├── scripts/                     # Utility scripts
├── Dockerfile                   # Backend dev image
├── Dockerfile.prod              # Backend production image
├── docker-compose.yml           # Development compose
├── docker-compose.prod.yml      # Production compose
├── jest.config.js
├── tsconfig.json
└── package.json
```

---

## 5. Backend — API & Server

### Server Bootstrap (`server.ts`)
- Creates an HTTP server wrapping the Express app
- Attaches Socket.io to the same HTTP server
- Connects to MongoDB and Redis on startup

### Middleware Stack (applied globally)
1. **CORS** — allows requests from `FRONTEND_URL` with credentials
2. **Helmet** — sets secure HTTP headers
3. **Morgan** — HTTP request logging
4. **Cookie Parser** — parses JWT cookies
5. **Rate Limiter** — global request limiting
6. **Error Handler** — catches all unhandled errors and returns JSON

### Rate Limits

| Limiter | Window | Max Requests |
|---|---|---|
| `generalLimiter` | 15 min | 1000 |
| `authLimiter` | 15 min | 100 |
| `uploadLimiter` | 15 min | 30 |

> Originally `generalLimiter` was 100 and `authLimiter` was 20 — both were raised to fix "Too many requests" errors during normal usage.

---

## 6. Frontend — Next.js App

### Routing Strategy
Uses the **Next.js 14 App Router**.

- `(auth)` is a **route group** (parentheses = no URL segment) — pages at `/login`, `/register`, `/forgot-password`
- `admin`, `patient`, `pharmacy` are **real route segments** — pages at `/admin/dashboard`, `/patient/orders`, etc.

> **Important:** Originally all three role folders were created as route groups `(admin)`, `(patient)`, `(pharmacy)`. This caused a Next.js conflict because all three had pages at the same paths (e.g., `/dashboard`). They were renamed to real segments to fix the 500 errors.

### State Management (Zustand stores)
| Store | Manages |
|---|---|
| `authStore` | User session, login, logout, register |
| `orderStore` | Patient orders list and active order |
| `chatStore` | Messages for a given order |
| `notificationStore` | Unread notifications |

### API Client (`lib/api.ts`)
- Axios instance pointed at `NEXT_PUBLIC_API_URL`
- Request interceptor: attaches `Authorization: Bearer <token>` from localStorage
- Response interceptor: on 401, redirects to `/login`

### Socket Client (`lib/socket.ts`)
- Lazy-initialized — only runs in the browser (SSR-safe)
- Connects with JWT token from localStorage
- Auto-reconnects up to 5 times with 2s delay
- `connectSocket()` / `disconnectSocket()` used by auth store on login/logout

### Protected Routes (`ProtectedRoute.tsx`)
- Checks auth state from Zustand store
- Redirects unauthenticated users to `/login`
- Redirects authenticated users to their role dashboard if they land on the wrong role path:
  - `patient` → `/patient/dashboard`
  - `pharmacy` → `/pharmacy/dashboard`
  - `admin` → `/admin/dashboard`

### Pages by Role

**Auth (public)**
| URL | Page |
|---|---|
| `/login` | Login form |
| `/register` | Registration (patient or pharmacy) |
| `/forgot-password` | Request password reset email |

**Patient**
| URL | Page |
|---|---|
| `/patient/dashboard` | Overview + recent orders |
| `/patient/orders` | All orders list |
| `/patient/orders/new` | Create new medicine request |
| `/patient/orders/[id]` | Order detail + pharmacy offers |
| `/patient/chat` | All active chats |
| `/patient/chat/[orderId]` | Chat window for specific order |
| `/patient/notifications` | Notification list |
| `/patient/profile` | Edit profile & location |

**Pharmacy**
| URL | Page |
|---|---|
| `/pharmacy/dashboard` | Stats + active orders |
| `/pharmacy/orders` | Incoming requests |
| `/pharmacy/orders/[id]` | Order detail + respond with offer |
| `/pharmacy/inventory` | Manage stock |
| `/pharmacy/chat` | All active chats |
| `/pharmacy/chat/[orderId]` | Chat window for specific order |
| `/pharmacy/notifications` | Notification list |
| `/pharmacy/profile` | Edit pharmacy profile |
| `/pharmacy/settings` | Pharmacy settings |

**Admin**
| URL | Page |
|---|---|
| `/admin/dashboard` | Platform overview / stats |
| `/admin/users` | Manage all users |
| `/admin/pharmacies` | Manage pharmacies |
| `/admin/medicines` | Manage medicine catalogue |
| `/admin/orders` | All orders |
| `/admin/orders/[id]` | Order detail |
| `/admin/notifications` | Admin notifications |
| `/admin/profile` | Admin profile |

---

## 7. Database Models

### User
```
name, email, password (hashed), phone, role (patient|pharmacy|admin),
avatar, location (GeoJSON Point), address, searchRadius,
fcmToken, isActive, isBanned, googleId,
refreshToken, resetPasswordToken, resetPasswordExpires
```
- `2dsphere` index on `location` for geo queries
- Password hashed with bcrypt before save

### Order
```
patientId → User
medicines: [{ name, quantity, medicineId → Medicine }]
prescriptionId → Prescription
patientLocation (GeoJSON Point)
status: pending | offered | confirmed | preparing | out_for_delivery | delivered | cancelled
deliveryType: delivery | pickup
acceptedPharmacy → Pharmacy
acceptedResponse → OrderResponse
notes, cancelReason, deliveredAt
```
- Indexes on `patientId`, `status`, `patientLocation`

### OrderResponse
```
orderId → Order
pharmacyId → Pharmacy
medicines: [{ name, quantity, price, available }]
totalPrice, estimatedTime, notes
status: pending | accepted | rejected | expired
```

### Pharmacy
```
userId → User
name, description, logo, phone, email
address, location (GeoJSON Point)
operatingHours, isVerified, isActive, rating, reviewCount
```

### Inventory
```
pharmacyId → Pharmacy
medicineId → Medicine
quantity, price, isAvailable, expiryDate
```

### Medicine
```
name, genericName, category, description
manufacturer, form (tablet|capsule|syrup|...), strength
requiresPrescription, imageUrl
```

### Prescription
```
patientId → User
orderId → Order
imageUrl, ocrText, scannedMedicines: [{ name, quantity, confidence }]
status: pending | processed | rejected
```

### Message
```
orderId → Order
senderId → User
content, messageType: text | image | system
isRead
```

### Notification
```
userId → User
title, message
type: order_update | new_response | message | system
referenceId, referenceModel
isRead
```

### Review
```
orderId → Order
patientId → User
pharmacyId → Pharmacy
rating (1–5), comment
```

---

## 8. Authentication & Security

### JWT Strategy
- **Access Token**: short-lived (15 min), sent in `Authorization` header
- **Refresh Token**: long-lived (7 days), stored in DB, used to issue new access tokens
- Tokens generated with separate secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)

### Password Reset Flow
1. Patient requests reset → backend generates a token, hashes it, stores in User
2. Email sent with reset link (via Nodemailer)
3. User submits new password with token → token verified, password updated, token cleared

### Middleware
- `authenticate.ts` — verifies JWT from `Authorization: Bearer` header, attaches `req.user`
- `authorize.ts` — checks `req.user.role` against allowed roles, returns 403 if not permitted
- `validate.ts` — runs Joi/Zod schema validation on request body, returns 400 on failure

### Security Headers (Helmet)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `Content-Security-Policy`

---

## 9. Real-Time (Socket.io)

### Server-side (`src/socket/`)

**Authentication (`auth.socket.ts`)**
- Middleware that verifies JWT token passed in `socket.handshake.auth.token`
- Attaches user to `socket.user`

**Rooms**
- Each user auto-joins `user:<userId>` on connection
- Pharmacy users auto-join `pharmacy:<pharmacyId>` on connection

**Event Handlers**
| Handler | Events |
|---|---|
| `chat.handler.ts` | `send_message`, `message_received`, `messages_read` |
| `order.handler.ts` | `order_updated`, `new_response`, `response_accepted` |
| `pharmacy.handler.ts` | `new_order`, `order_assigned` |

### Client-side (`frontend/src/lib/socket.ts`)
- Dynamically imports `socket.io-client` (prevents SSR crash in Next.js)
- Token read from `localStorage` at connect time
- Auto-reconnects 5 times with 2s delay
- `connectSocket()` called on login, `disconnectSocket()` called on logout

---

## 10. Docker Setup

### Services

| Container | Image | Port |
|---|---|---|
| `pharma-mongodb` | `mongo:7.0` | 27017 |
| `pharma-redis` | `redis:7-alpine` | 6379 |
| `pharma-backend` | Built from `Dockerfile` | 5001→5000 |
| `pharma-frontend` | Built from `frontend/Dockerfile` | 3000→3000 |

### Startup Order
```
mongodb (healthy) ─┐
                   ├──► backend ──► frontend
redis (healthy)  ──┘
```
Backend waits for both MongoDB and Redis healthchecks before starting.

### Volumes
- `mongo-data` — persists MongoDB data across restarts
- `redis-data` — persists Redis AOF data across restarts

### Backend Dockerfile (dev)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npx", "tsx", "watch", "src/server.ts"]
```
Uses `tsx watch` for hot reload in development.

### Networks
All services share a single bridge network `pharma-network` so they can resolve each other by container name (e.g., `mongodb:27017`, `redis:6379`).

---

## 11. Bugs Fixed During Development

### Bug 1 — Next.js Route Group Conflict (500 on all dashboard pages)

**Symptom:** All protected pages (`/dashboard`, `/orders`, `/profile`, etc.) returned HTTP 500. Frontend logs showed:
```
You cannot have two parallel pages that resolve to the same path.
Please check /(admin)/dashboard/page and /(patient)/dashboard/page.
```

**Root cause:** Three role folders were created as Next.js route groups:
- `(admin)/dashboard/page.tsx` → resolves to `/dashboard`
- `(patient)/dashboard/page.tsx` → resolves to `/dashboard` ← conflict!
- `(pharmacy)/dashboard/page.tsx` → resolves to `/dashboard` ← conflict!

Route groups (parentheses syntax) **do not add a URL segment**, so all three were fighting for the same paths.

**Fix:** Renamed the role folders from route groups to real route segments:
```
(admin)   →  admin
(patient) →  patient
(pharmacy) → pharmacy
```
Now pages are at `/admin/dashboard`, `/patient/dashboard`, `/pharmacy/dashboard` — no conflict. Note: `(auth)` was kept as a route group since it has no conflicts (login/register/forgot-password are unique paths).

---

### Bug 2 — "Too Many Requests" on Login (429 error)

**Symptom:** Logging in returned HTTP 429 with message `"Too many authentication attempts, please try again later."` after very few attempts.

**Root cause:** The `authLimiter` was set to `max: 20` per 15 minutes, and the `generalLimiter` was set to `max: 100`. During development, rapid page refreshes and API calls exhausted the quota quickly.

**Fix:** Raised the limits in `src/middleware/rateLimiter.ts`:
```
generalLimiter:  100  →  1000 requests per 15 min
authLimiter:      20  →   100 requests per 15 min
```

---

## 12. How to Run

### Prerequisites
- Docker + Docker Compose installed
- `.env` file in project root (see Environment Variables section)

### Start (development)
```bash
cd pharmacy-backend
docker compose up -d --build
```

### Stop
```bash
docker compose down
```

### Stop and remove all data volumes
```bash
docker compose down -v
```

### View logs
```bash
docker logs pharma-backend -f
docker logs pharma-frontend -f
```

### Access points
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001/api |
| Swagger Docs | http://localhost:5001/api-docs |
| Health Check | http://localhost:5001/health |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

### Seed the database
```bash
docker exec -it pharma-backend npm run seed
```

---

## 13. API Reference

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register patient or pharmacy |
| POST | `/login` | Public | Login, returns access + refresh tokens |
| POST | `/logout` | Auth | Invalidate refresh token |
| POST | `/refresh` | Public | Get new access token using refresh token |
| POST | `/forgot-password` | Public | Send password reset email |
| POST | `/reset-password` | Public | Reset password with token |

### Users — `/api/users`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/profile` | Auth | Get own profile |
| PUT | `/profile` | Auth | Update profile + avatar |
| PUT | `/location` | Auth | Update GPS coordinates |

### Orders — `/api/orders`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Patient | Create medicine request |
| GET | `/` | Auth | List orders (role-filtered) |
| GET | `/:id` | Auth | Get order detail |
| PUT | `/:id/cancel` | Patient | Cancel an order |
| PUT | `/:id/status` | Pharmacy | Update order status |
| POST | `/:id/reorder` | Patient | Clone a past order |

### Order Responses — `/api/orders/:orderId/responses`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Pharmacy | Submit a price offer |
| GET | `/` | Auth | List offers for order |
| PUT | `/:responseId/accept` | Patient | Accept a pharmacy's offer |

### Prescriptions — `/api/prescriptions`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/upload` | Patient | Upload prescription image |
| POST | `/scan` | Patient | OCR scan prescription → extract medicines |
| GET | `/` | Patient | List own prescriptions |

### Medicines — `/api/medicines`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List/search medicines |
| GET | `/autocomplete` | Public | Search suggestions |
| GET | `/:id` | Public | Medicine detail |
| POST | `/` | Admin | Add medicine |
| PUT | `/:id` | Admin | Update medicine |
| DELETE | `/:id` | Admin | Delete medicine |

### Pharmacies — `/api/pharmacies`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List pharmacies |
| GET | `/nearby` | Auth | Nearby pharmacies by GPS |
| GET | `/:id` | Public | Pharmacy detail |
| PUT | `/` | Pharmacy | Update own pharmacy profile |

### Inventory — `/api/inventory`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Pharmacy | List own inventory |
| POST | `/` | Pharmacy | Add item to inventory |
| PUT | `/:id` | Pharmacy | Update inventory item |
| DELETE | `/:id` | Pharmacy | Remove inventory item |
| POST | `/bulk-import` | Pharmacy | Bulk import via CSV |

### Messages — `/api/messages`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | List messages for an order |
| POST | `/` | Auth | Send a message |

### Notifications — `/api/notifications`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | List own notifications |
| PUT | `/:id/read` | Auth | Mark one as read |
| PUT | `/read-all` | Auth | Mark all as read |
| DELETE | `/:id` | Auth | Delete notification |

### Reviews — `/api/reviews`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Patient | Submit review for a pharmacy |
| GET | `/:pharmacyId` | Public | Get reviews for a pharmacy |

### Admin — `/api/admin`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/orders` | Admin | All orders with filters |
| GET | `/orders/:id` | Admin | Order detail |
| GET | `/users` | Admin | All users |
| PUT | `/users/:id/ban` | Admin | Ban/unban user |
| GET | `/pharmacies` | Admin | All pharmacies |
| PUT | `/pharmacies/:id/verify` | Admin | Verify pharmacy |
| POST | `/medicines` | Admin | Add medicine to catalogue |
| PUT | `/medicines/:id` | Admin | Edit medicine |
| DELETE | `/medicines/:id` | Admin | Remove medicine |

---

## 14. Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=your_mongo_password

# Redis
REDIS_PASSWORD=your_redis_password

# JWT
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

The frontend reads:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```
These are already set in `docker-compose.yml`.
