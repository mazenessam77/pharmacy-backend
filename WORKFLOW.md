# PharmaLink — System Workflow

> End-to-end workflow covering authentication, order lifecycle, real-time events, and infrastructure.

---

## 1. System Architecture Overview

```mermaid
flowchart TB
    subgraph CLIENT["🌐  Client Layer"]
        direction LR
        WEB["Next.js 14\nWeb App"]
        MOBILE["Mobile Browser\n(Responsive)"]
    end

    subgraph CDN["☁️  AWS EC2 — Production Server"]
        direction TB
        NGINX["Nginx\nReverse Proxy\n+ SSL (Let's Encrypt)"]

        subgraph APP["Docker Compose Stack"]
            direction LR
            FRONT["Frontend\nNext.js :3000"]
            BACK["Backend\nExpress.js :5000"]
        end

        subgraph DATA["Data Layer"]
            MONGO[("MongoDB\n:27017")]
            REDIS[("Redis\nCache + Sessions\n:6379")]
        end

        subgraph REALTIME["Real-time Layer"]
            SOCKET["Socket.io\nWebSocket Server"]
        end
    end

    subgraph EXTERNAL["🔌  External Services"]
        GOOGLE["Google OAuth 2.0"]
        CLOUDFLARE["Cloudflare\nmymedcine.com (proxied)"]
        LETS["Let's Encrypt\nSSL Certificate"]
        GITHUB["GitHub Actions\nCI / CD Pipeline"]
        CLOUDINARY["Cloudinary\nImage Storage"]
    end

    CLIENT -->|"HTTPS :443"| NGINX
    NGINX -->|"/api/*"| BACK
    NGINX -->|"/*"| FRONT
    BACK <-->|"Mongoose ODM"| MONGO
    BACK <-->|"ioredis"| REDIS
    BACK <--> SOCKET
    WEB <-->|"WebSocket"| SOCKET
    BACK -->|"ID Token verify"| GOOGLE
    CLOUDFLARE -->|"DNS + proxy → origin"| NGINX
    LETS -->|"TLS cert"| NGINX
    GITHUB -->|"SSH deploy"| CDN
    BACK -->|"Upload / Fetch"| CLOUDINARY
```

---

## 2. Authentication Flow

```mermaid
flowchart TD
    START([User visits site]) --> CHOICE{New or\nReturning?}

    CHOICE -->|New user| REGISTER
    CHOICE -->|Returning| LOGIN

    subgraph REGISTER["Registration"]
        R1[Select role\nPatient / Pharmacy] --> R2{OAuth or\nEmail?}
        R2 -->|Google OAuth\nPatient only| R3[Google Sign-In popup]
        R2 -->|Email & Password| R4[Fill registration form]
        R3 --> R5[Send ID Token to\nPOST /api/auth/google]
        R4 --> R6[POST /api/auth/register]
        R5 --> VERIFY
        R6 --> VERIFY
    end

    subgraph LOGIN["Login"]
        L1{OAuth or\nEmail?}
        L1 -->|Google| L2[Google Sign-In popup]
        L1 -->|Email| L3[Email + Password form]
        L2 --> L4[POST /api/auth/google]
        L3 --> L5[POST /api/auth/login]
        L4 --> VERIFY
        L5 --> VERIFY
    end

    subgraph VERIFY["Backend Verification"]
        V1[Validate credentials\nor verify Google ID token]
        V1 --> V2{Valid?}
        V2 -->|No| V3[Return 401 error]
        V2 -->|Yes| V4[Issue Access Token\n+ Refresh Token JWT]
    end

    V4 --> STORE[Store tokens in\nlocalStorage]
    STORE --> ROLE{User role?}
    ROLE -->|patient| P[/patient/dashboard]
    ROLE -->|pharmacy| PH[/pharmacy/dashboard]
    ROLE -->|admin| A[/admin/dashboard]

    V3 --> LOGIN
```

---

## 3. Order Lifecycle — Sequence Diagram

```mermaid
sequenceDiagram
    actor Patient
    actor Pharmacy
    participant API as Backend API
    participant DB as MongoDB
    participant WS as Socket.io
    participant Notif as Notification Service

    Patient->>API: POST /api/orders (medicines, governorate,\ndeliveryType, paymentMethod, location?)
    API->>DB: Validate & create Order (status: pending)
    API->>DB: Find all pharmacies in same governorate
    DB-->>API: List of pharmacies

    loop For every pharmacy in governorate
        API->>WS: emit pharmacy:new-order
        API->>Notif: Push notification → pharmacy user
        WS-->>Pharmacy: Real-time new order alert
    end

    API-->>Patient: 201 Created { order, pharmaciesNotified }

    Note over Pharmacy: Pharmacy reviews order details

    Pharmacy->>API: POST /api/orders/:id/responses\n(availableMeds, price, deliveryFee, estimatedTime)
    API->>DB: Save OrderResponse (status: offered)
    API->>DB: Update Order (status: offered)
    API->>WS: emit order:new-offer → patient room
    API->>Notif: Push notification → patient
    WS-->>Patient: Real-time offer received

    Note over Patient: Patient reviews all pharmacy offers

    Patient->>API: POST /api/orders/:id/confirm/:responseId
    API->>DB: Update Order (status: confirmed, acceptedPharmacy)
    API->>DB: Reject other pharmacy responses
    API->>WS: emit order:confirmed → pharmacy room
    API->>Notif: Push notification → accepted pharmacy
    WS-->>Pharmacy: Order confirmed — start preparing

    Pharmacy->>API: PUT /api/orders/:id/status { status: preparing }
    API->>WS: emit order:status-updated
    WS-->>Patient: Status: Preparing 🔄

    Pharmacy->>API: PUT /api/orders/:id/status { status: out_for_delivery }
    API->>WS: emit order:status-updated
    WS-->>Patient: Status: Out for Delivery 🚚

    Pharmacy->>API: PUT /api/orders/:id/status { status: delivered }
    API->>DB: Set deliveredAt timestamp
    API->>WS: emit order:status-updated
    API->>Notif: Push notification → patient
    WS-->>Patient: Status: Delivered ✅

    Patient->>API: POST /api/orders/:id/review\n(rating, comment)
    API->>DB: Save review, update Pharmacy.rating
```

---

## 4. Order Status State Machine

```mermaid
stateDiagram-v2
    direction LR

    [*] --> pending : Patient submits order

    pending --> offered : Pharmacy submits an offer
    pending --> cancelled : Patient cancels

    offered --> confirmed : Patient confirms offer
    offered --> cancelled : Patient cancels

    confirmed --> preparing : Pharmacy starts preparing
    confirmed --> cancelled : Patient cancels

    preparing --> out_for_delivery : Pharmacy dispatches order
    out_for_delivery --> delivered : Pharmacy marks delivered

    cancelled --> [*]
    delivered --> [*]

    note right of pending
        All pharmacies in
        the governorate are
        notified via Socket.io
    end note

    note right of confirmed
        All other pharmacy
        offers are rejected
    end note
```

---

## 5. Payment Flow

```mermaid
flowchart TD
    START([Patient selects payment method]) --> METHOD{Payment\nMethod}

    METHOD -->|Cash on Delivery| CASH
    METHOD -->|InstaPay| INSTAPAY

    subgraph CASH["💵 Cash Flow"]
        C1[Order created with\npaymentMethod: cash]
        C1 --> C2[Pharmacy prepares & delivers]
        C2 --> C3[Patient pays cash\nto delivery person]
        C3 --> C4[Pharmacy marks order\nas delivered]
    end

    subgraph INSTAPAY["📱 InstaPay Flow"]
        I1[Order created with\npaymentMethod: instapay]
        I1 --> I2[Patient confirms offer]
        I2 --> I3[Pharmacy sends payment\ninstructions via chat]
        I3 --> I4[Patient transfers payment\nvia InstaPay app]
        I4 --> I5[Pharmacy confirms receipt\nand dispatches order]
        I5 --> I6[Pharmacy marks order\nas delivered]
    end

    CASH --> DONE([Order Complete ✅])
    INSTAPAY --> DONE
```

---

## 6. Real-time Socket.io Event Map

```mermaid
flowchart LR
    subgraph SERVER["Socket.io Server"]
        S1[["pharmacy:new-order"]]
        S2[["order:new-offer"]]
        S3[["order:confirmed"]]
        S4[["order:status-updated"]]
        S5[["order:cancelled"]]
    end

    subgraph ROOMS["Socket Rooms"]
        R1["pharmacy:{id}"]
        R2["order:{id}"]
    end

    subgraph TRIGGERS["Triggered by"]
        T1[Patient creates order]
        T2[Pharmacy submits offer]
        T3[Patient confirms offer]
        T4[Pharmacy updates status]
        T5[Patient cancels order]
    end

    T1 -->|emits to all\ngovernorate pharmacies| S1
    T2 -->|emits to| S2
    T3 -->|emits to| S3
    T4 -->|emits to| S4
    T5 -->|emits to| S5

    S1 --> R1
    S2 --> R2
    S3 --> R2
    S4 --> R2
    S5 --> R2
```

---

## 7. CI/CD Pipeline

```mermaid
flowchart TD
    PUSH[git push → main branch] --> PARALLEL

    subgraph PARALLEL["GitHub Actions — Parallel Jobs"]
        direction LR
        J1["🔒 Security Audit\nnpm audit\nTrivy scan"]
        J2["🔷 TypeScript\nFrontend tsc\nBackend tsc"]
        J3["🧪 Tests\nJest + MongoDB\nin Docker"]
        J4["🐳 Docker Build\nBuild images\nTrivy image scan"]
    end

    PARALLEL -->|All pass| DEPLOY

    subgraph DEPLOY["Deploy to EC2 via SSH"]
        D1[Pull latest code] --> D2[Build Docker images\non server]
        D2 --> D3{SSL cert\nexists?}
        D3 -->|No — first deploy| D4[Stop nginx\nRun certbot --standalone\nfor mymedcine.com]
        D3 -->|Yes| D5[Attempt cert renewal]
        D4 --> D6
        D5 --> D6
        D6[docker compose up -d\nbackend + frontend] --> D7[docker compose up -d nginx\nStart or reload nginx]
        D7 --> D8[docker system prune\nClean old images]
    end

    DEPLOY --> HEALTH

    subgraph HEALTH["Health Check"]
        H1[Wait 10s for nginx] --> H2{GET /api/health\nHTTP 200?}
        H2 -->|Yes ✅| SUCCESS[Deploy complete\n🟢 Site live]
        H2 -->|No — retry\nevery 15s up to 12x| H2
        H2 -->|Failed after\n12 attempts ❌| FAIL[Notify failure\nPrint docker logs]
    end
```

---

## 8. User Roles & Permissions

```mermaid
flowchart TD
    subgraph ROLES["User Roles"]
        PATIENT["👤 Patient"]
        PHARMACY["🏪 Pharmacy"]
        ADMIN["🛡️ Admin"]
    end

    subgraph PATIENT_ACTIONS["Patient Can"]
        PA1[Create medicine orders]
        PA2[Upload prescriptions]
        PA3[View & compare pharmacy offers]
        PA4[Confirm / cancel orders]
        PA5[Track order status in real-time]
        PA6[Chat with pharmacy]
        PA7[Leave reviews]
        PA8[Reorder previous orders]
    end

    subgraph PHARMACY_ACTIONS["Pharmacy Can"]
        PH1[View orders in their governorate]
        PH2[Submit price offers]
        PH3[Manage inventory]
        PH4[Update order status]
        PH5[Chat with patients]
        PH6[Manage working hours & profile]
    end

    subgraph ADMIN_ACTIONS["Admin Can"]
        A1[Verify / reject pharmacies]
        A2[Ban / unban users]
        A3[View platform statistics]
        A4[Manage all orders & users]
    end

    PATIENT --> PATIENT_ACTIONS
    PHARMACY --> PHARMACY_ACTIONS
    ADMIN --> ADMIN_ACTIONS
```
