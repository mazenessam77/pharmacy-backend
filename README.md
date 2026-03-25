# PharmaLink — Medicine Request Platform

> Connect patients with nearby pharmacies across Egypt. Request medicines, receive competing offers, and get them delivered — all in real time.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Developer Machine                             │
│                    git push → GitHub (main)                          │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   GitHub Actions       │
                    │   ┌─────────────────┐  │
                    │   │  CI Pipeline    │  │
                    │   │  type-check     │  │
                    │   │  jest tests     │  │
                    │   │  npm audit      │  │
                    │   │  docker build   │  │
                    │   │  trivy scan     │  │
                    │   └────────┬────────┘  │
                    │            │ pass       │
                    │   ┌────────▼────────┐  │
                    │   │  CD Pipeline    │  │
                    │   │  SSH → EC2      │  │
                    │   └────────┬────────┘  │
                    └────────────┼───────────┘
                                 │ SSH
                    ┌────────────▼───────────────────────────────────┐
                    │           AWS EC2 (Ubuntu)                      │
                    │                                                  │
                    │  ┌───────────────────────────────────────────┐  │
                    │  │             Docker Compose                 │  │
                    │  │                                            │  │
                    │  │  ┌──────────┐     ┌──────────────────┐   │  │
                    │  │  │  nginx   │────▶│  Next.js :3000   │   │  │
                    │  │  │  :80     │     │  (App Router)    │   │  │
                    │  │  │          │     └──────────────────┘   │  │
                    │  │  │          │     ┌──────────────────┐   │  │
                    │  │  │          │────▶│  Express :5000   │   │  │
                    │  │  └──────────┘     │  REST + Socket.io│   │  │
                    │  │                   └────────┬─────────┘   │  │
                    │  │                            │              │  │
                    │  │            ┌───────────────┤              │  │
                    │  │            ▼               ▼              │  │
                    │  │  ┌──────────────┐  ┌──────────────┐     │  │
                    │  │  │  MongoDB     │  │  Redis       │     │  │
                    │  │  │  :27017      │  │  :6379       │     │  │
                    │  │  └──────────────┘  └──────────────┘     │  │
                    │  └───────────────────────────────────────────┘  │
                    │         │ Elastic IP (static)                    │
                    └─────────┼──────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
   ┌─────────────────────┐        ┌───────────────────────┐
   │   Cloudinary CDN    │        │  Firebase Cloud        │
   │  prescription image │        │  Messaging (FCM)       │
   │  uploads & storage  │        │  push notifications    │
   └─────────────────────┘        └───────────────────────┘
```

---

## AWS Infrastructure

| Resource | Type | Purpose |
|---|---|---|
| **EC2** | `t3.medium` | Hosts entire stack via Docker Compose |
| **EBS Volume** | 30 GB `gp3` | Persistent storage for host |
| **Elastic IP** | Static | Fixed IP for DNS / HTTPS |
| **Security Groups** | — | Port 22 (SSH), 80 (HTTP), 443 (HTTPS) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, Socket.io-client, Plus Jakarta Sans |
| **Backend** | Node.js, Express, TypeScript, Socket.io, Zod validation, Winston logging |
| **Database** | MongoDB (Mongoose), Redis |
| **Auth** | JWT access + refresh tokens, bcrypt |
| **File Storage** | Cloudinary (prescription images), Multer (local processing) |
| **Notifications** | Firebase Cloud Messaging (FCM) |
| **Infrastructure** | AWS EC2, Docker Compose, nginx (reverse proxy + DNS resolver) |
| **CI/CD** | GitHub Actions — reusable CI called by CD |

---

## Features

### Patient Portal
- Register / login with JWT authentication
- Submit medicine requests by name with optional prescription photo
- Select governorate (covers all of Egypt)
- Upload prescription image → stored in Cloudinary
- Receive competing offers from multiple pharmacies
- Accept the best offer — order transitions to confirmed
- Track order status live via Socket.io
- Modern glassmorphism dashboard with mesh gradient hero, medicine avatars, floating action button

### Pharmacy Panel
- Register with license number and governorate
- See incoming patient orders filtered to their area
- Submit price offers with delivery time estimate
- Manage medicine inventory
- Update order through the delivery workflow
- Online / offline availability toggle

### Admin Panel
- View all users, orders, and pharmacies
- Delete any account, order, or pharmacy (with cascade cleanup)
- Full system oversight

---

## Order Lifecycle

```
pending ──▶ offered ──▶ confirmed ──▶ preparing ──▶ out_for_delivery ──▶ delivered
                                                                    │
                                                                    ▼
                                                                cancelled
```

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register patient or pharmacy |
| POST | `/api/auth/login` | — | Login, receive JWT pair |
| POST | `/api/auth/refresh` | — | Refresh access token |
| GET | `/api/orders` | Patient / Pharmacy | Patient: own orders; Pharmacy: incoming |
| POST | `/api/orders` | Patient | Create medicine request |
| GET | `/api/orders/:id` | Auth | Order detail + all offers |
| PUT | `/api/orders/:id/status` | Auth | Update order status |
| POST | `/api/order-responses` | Pharmacy | Submit price offer |
| PUT | `/api/order-responses/:id/accept` | Patient | Accept a pharmacy offer |
| POST | `/api/prescriptions` | Patient | Upload prescription image |
| GET | `/api/medicines` | — | Search medicine catalog |
| GET/POST | `/api/inventory` | Pharmacy | Manage pharmacy inventory |
| GET | `/api/messages/:orderId` | Auth | Chat history for an order |
| DELETE | `/api/admin/users/:id` | Admin | Delete user + their data |
| DELETE | `/api/admin/orders/:id` | Admin | Delete order |
| DELETE | `/api/admin/pharmacies/:id` | Admin | Delete pharmacy |
| GET | `/api/health` | — | Health probe (used by CD) |

Swagger docs available at `/api-docs` in development.

---

## Real-time Events (Socket.io)

| Event | Direction | Trigger |
|---|---|---|
| `new_order` | Server → Pharmacies | Patient creates an order |
| `new_offer` | Server → Patient | Pharmacy submits an offer |
| `order_accepted` | Server → Pharmacy | Patient accepts their offer |
| `status_update` | Server → Patient | Order status changes |
| `new_message` | Bidirectional | Chat message in order room |
| `pharmacy_online` | Server → All | Pharmacy toggles availability |

---

## CI/CD Pipeline

```
Push to main
     │
     ▼
CI (ci.yml) ─────────────────────────────────────────
  ├─ backend-check   tsc --noEmit (Express/TypeScript)
  ├─ frontend-check  tsc --noEmit (Next.js)
  ├─ test            Jest integration tests
  ├─ security        npm audit --audit-level high
  └─ docker-build    docker build + trivy image scan
     │
     │  all jobs pass
     ▼
CD (cd.yml) ─────────────────────────────────────────
  calls CI as reusable workflow, then:
  SSH into EC2:
    git fetch origin main
    git reset --hard origin/main
    docker compose -f docker-compose.prod.yml up -d --build
    poll GET /health until healthy (up to 120 s)
    nginx -s reload
```

---

## Key Bugs Fixed

| Problem | Root Cause | Fix |
|---|---|---|
| 502 Bad Gateway after every deploy | nginx `upstream{}` cached container IPs at reload time | Switched to `set $backend; proxy_pass $backend` with Docker DNS resolver `127.0.0.11` |
| Sign-in CORS rejected in production | `FRONTEND_URL` defaulted to `localhost:3000` | Set `FRONTEND_URL: https://<EC2-IP>` in `docker-compose.prod.yml` |
| `EACCES: permission denied, mkdir 'logs'` | Winston `mkdirSync('logs')` at startup; `appuser` has no write access in `/app` | Pre-create `/app/logs` and `/app/uploads` with chown in `Dockerfile.prod` |
| Prescription upload always 400 | Frontend sent field name `prescription`; multer expected `image` | Changed to `formData.append('image', file)` |
| Order creation 400 | Zod schema still had old `location:{lat,lng}` shape | Updated to `governorate: z.string().min(2)` |
| CD and standalone CI cancelled each other | Both used `concurrency: ci-${{ github.ref }}` | Changed to `${{ github.workflow }}-${{ github.ref }}` |
| CD parse error at 0 seconds | `secrets` context not allowed in `environment.url` | Removed the `url:` field |
| `npm ci` failing in CI | npm 11 lockfile not compatible with CI's npm 10 | Changed all CI steps to `npm install` |
| `git pull` blocked on EC2 | Server had uncommitted local changes | Replaced with `git fetch origin main && git reset --hard origin/main` |
| Backend never healthy → nginx reload failed | nginx tried to reload before Express finished starting | Added polling loop on `/health` up to 120 s before reload |

---

## Local Development

```bash
# 1. Clone and configure
cp .env.example .env          # fill in the variables below

# 2. Backend only
npm install
npm run dev                    # ts-node-dev on :5000

# 3. Frontend only
cd frontend && npm install
npm run dev                    # Next.js on :3000

# 4. Full stack via Docker
docker compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:5001/api
# Swagger:  http://localhost:5001/api-docs
```

### Required Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/pharmalink
JWT_SECRET=<random-32-char-string>
JWT_REFRESH_SECRET=<random-32-char-string>
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FIREBASE_PROJECT_ID=
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

---

## Project Structure

```
pharmacy-backend/
├── src/                        Backend (Node.js / TypeScript)
│   ├── controllers/            Request handlers
│   ├── models/                 Mongoose schemas
│   ├── routes/                 Express routers
│   ├── socket/                 Socket.io event handlers
│   ├── services/               Business logic (upload, OCR, notifications, geo)
│   ├── middleware/             Auth, validate, multer, rate-limiter
│   ├── validations/            Zod schemas
│   ├── utils/                  JWT helpers, AppError, Winston logger
│   └── seed/                   DB seed scripts
├── frontend/                   Frontend (Next.js 14 / TypeScript)
│   └── src/
│       ├── app/
│       │   ├── (auth)/         Login / register pages
│       │   ├── patient/        Patient dashboard, orders, profile
│       │   ├── pharmacy/       Pharmacy panel
│       │   └── admin/          Admin panel
│       ├── components/         Navbar, Sidebar, Badge, Skeleton, Button…
│       ├── store/              Zustand stores (auth, orders, pharmacy)
│       ├── lib/                Axios services + helper functions
│       └── types/              Shared TypeScript types
├── nginx/
│   └── nginx.conf              Reverse proxy with Docker DNS resolver
├── docker-compose.yml          Development stack
├── docker-compose.prod.yml     Production stack
├── Dockerfile.prod             Multi-stage production image
├── .github/workflows/
│   ├── ci.yml                  Reusable CI pipeline
│   └── cd.yml                  CD pipeline (SSH deploy to EC2)
└── diagrams.html               Interactive architecture diagrams
```
