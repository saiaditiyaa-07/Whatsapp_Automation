# WA-SaaS: Enterprise WhatsApp Automation Platform

<div align="center">

[![FastAPI](https://img.shields.shields.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.shields.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.shields.shields.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.shields.shields.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.shields.shields.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.shields.shields.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.shields.shields.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

**An enterprise-grade B2B conversational automation and customer engagement platform powered by the official Meta WhatsApp Cloud API.**

[View Architecture](#architecture) • [Setup Guide](#installation) • [API Reference](#api-documentation) • [WhatsApp Setup](#meta-whatsapp-cloud-api-setup)

</div>

---

## Overview

**WA-SaaS** is a production-ready, multi-tenant B2B customer engagement and workflow automation SaaS platform. It enables organizations to scale their support operations, marketing pipelines, and automated customer communications by integrating directly with the official **Meta WhatsApp Cloud API**.

### Target Audience
The platform is designed for customer success teams, marketing automation managers, and software engineers seeking a self-hosted, scalable customer support workspace featuring collaborative shared team inboxes and conditional execution engines.

### Key Capabilities
- **Collaborative Real-time Shared Inbox**: Multi-agent workspace synchronized down to under 50ms using persistent WebSocket connections.
- **Visual Graph Workflow Canvas**: Drag-and-drop React Flow canvas to build sequential messaging pipelines.
- **Dialect-Safe Analytics**: High-performance KPI computations supporting optimized Postgres aggregations and SQLite development fallbacks.
- **Robust Automation Engine**: A strict Abstract Syntax Tree (AST) graph compiler and cyclical path check validator executing node logic sequentially with database-level scheduling delays.

---

## Features

### Authentication & Authorization
- **JWT Session Security**: Secure token claims verification (`HS256` signature hashing) verifying identity on API gateway routers and WebSocket connections.
- **Workspace Multi-Tenant Isolation**: Row-level tenant barrier validations querying workspace membership permissions before serving resources.
- **Granular RBAC Guards**: Enforces strict privilege tiers (`Owner`, `Admin`, `Member`, `Viewer`) blocking write actions for viewer roles.

### Workspace & Integration Management
- **Meta Integration setup**: Dashboard panel to connect Meta App IDs, Phone Number IDs, Verification Tokens, and Permanent Access Tokens.
- **Team Onboarding**: Team invite mechanisms mapping roles dynamically.

### Messaging & Shared Inbox
- **Collaborative Inbox**: Synchronization of conversation lists, read/unread states, assigning agents to threads, and thread archiving.
- **Optimistic UI Updates**: Outbox message replies append instantly as pending and sync when confirmed by Meta API status callbacks.

### Workflow Builder & Automation Engine
- **AST Canvas Validation**: Canvas structures compile into in-memory SQLAlchemy models, validated for cycles using Depth-First Search (DFS) algorithms, checking node constraints, depth limits (max 15 steps), and unreachable islands.
- **Background Scheduler Daemon**: Execution delay actions (`delay`) are logged in the database and polled every 5s by a thread daemon (`WorkflowSchedulerThread`) to resume operations without blocking main HTTP threads.
- **Bot-to-Bot Loop Protection**: Sliding rate-limiter logic restricting executions to a maximum of 5 workflow runs per conversation in 1 minute to prevent recursive loops.

### Real-time Communication
- **Persistent WebSockets**: Custom workspace and chat-level routes pushing live messages, status updates (sent, delivered, read, failed), and automated event metrics.
- **Exponential Reconnection**: Client hooks starting with 1s back-off, doubling up to a maximum of 30s to protect resources.

---

## Screenshots

### Dashboard Workspace Overview
![Dashboard](docs/screenshots/dashboard.png)
*Provides key performance metrics, incoming vs. outgoing stats, average response times, and daily messaging activity.*

### Visual Workflow Builder
![Workflow Builder](docs/screenshots/workflow_builder.png)
*Drag and drop nodes to construct triggers, filters, and actions, and validate graph safety before saving.*

### Collaborative Shared Inbox
![Shared Inbox](docs/screenshots/shared_inbox.png)
*Collaborate in real time to resolve conversations, assign agents to threads, filter by unread status, and archive chats.*

---

## Architecture

The platform follows a decoupled, event-driven architecture designed for high availability and low latency:

```mermaid
graph TD
    UI[Next.js 14 Dashboard Client] -->|REST API Requests| API[FastAPI Gateway :8080]
    UI -->|Bi-directional WebSockets| API
    
    WebhookNode[Express Webhook Service :8000] -->|Upsert Logs| DB[(PostgreSQL Database :5433)]
    API -->|Read / Write State| DB
    
    Meta[Meta Cloud WhatsApp API] -->|Inbound Webhook events| WebhookNode
    Meta -->|Inbound Webhook events| API
    
    API -->|Dispatch Outbox Messages| Meta
    WebhookNode -->|Dispatch Automation Replies| Meta
    
    API -->|Interpret Canvas| Interpreter[AST Workflow Compiler]
    Interpreter -->|Execute Steps| Engine[Automation Engine]
    Engine -->|Poll Delayed Tasks| DB
    
    WebhookNode -->|Rate Limits Cache| Redis[(Redis Server :6379)]
```

### Component Analysis
- **Next.js 14 Client**: Renders UI dashboard views, manages real-time socket connections, and structures React Flow canvases.
- **FastAPI Core Gateway**: Serves as the primary REST entry point, maintains WebSocket connections, validates user sessions, compiles workflow canvases, and handles core execution steps.
- **Express Webhook Service**: Microservice listening to webhook updates. It processes delivery receipts, parses incoming attachment types (text, audio, image, document, location, video, reaction), and writes records.
- **PostgreSQL Database**: Relational datastore holding workspace layouts, member mappings, logs, conversations, and scheduled actions.
- **Redis Cache**: Used by the Express webhooks microservice to rate-limit incoming webhooks by IP address.

---

## Tech Stack

| Tier | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js | `^14.1.0` | React web meta-framework |
| **Frontend** | React | `^18.2.0` | Client rendering engine |
| **Frontend** | React Flow (`@xyflow/react`) | `^12.11.2` | Visual workflow canvas builder |
| **Frontend** | Recharts | `^3.9.2` | SVG analytics charts dashboard visualizer |
| **Frontend** | Tailwind CSS | `^3.4.1` | Utility styling compiler |
| **Frontend** | Lucide React | `^0.344.0` | SVG icons pack |
| **Backend** | FastAPI | `>=0.110.0` | Principal Python gateway framework |
| **Backend** | Uvicorn | `>=0.28.0` | ASGI Python web server |
| **Backend** | Express.js | `^4.19.2` | Node.js webhook handler service |
| **Backend** | Prisma ORM | `^5.10.0` | Type-safe Node DB client |
| **Backend** | SQLAlchemy | `>=2.0.28` | Relational SQL schema mapper |
| **Database** | PostgreSQL | `15` | Multi-tenant database |
| **Database** | SQLite | Fallback | Local development database file fallback |
| **Caching** | Redis | `7` | Webhook rate limiting and caching queue |
| **DevOps** | Docker | Engine | Container virtualization |
| **DevOps** | Docker Compose | v3.8 | Multi-container runner tool |

---

## Folder Structure

```
whatsapp-automation-saas/
├── prisma/
│   └── schema.prisma               # Prisma DB Schema for Express webhook service
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # FastAPI dependencies (Auth, JWT, RBAC guards)
│   │   │   └── endpoints/
│   │   │       ├── analytics.py    # Analytics KPI and stats endpoint router
│   │   │       ├── auth.py         # Login and signup authentication router
│   │   │       ├── webhook.py      # Meta webhooks handler (verification & ingestion)
│   │   │       ├── whatsapp.py     # Integrations manager and conversations history router
│   │   │       └── workflows.py    # Workflow Builder CRUD and execution log viewer
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic core settings configurations
│   │   │   └── security.py         # Hashing & Token generation utilities
│   │   ├── db/
│   │   │   ├── base.py             # SQL Table registries metadata resolver
│   │   │   ├── run_migration.py    # Custom Direct SQL migration runner
│   │   │   └── session.py          # SQLAlchemy Session mapping & engine setup
│   │   ├── models/
│   │   │   ├── user.py             # Identity users tables
│   │   │   ├── whatsapp.py         # Connection logs, message records, and conversation tables
│   │   │   ├── workflow.py         # Canvas nodes, edges, versions, scheduler, and logs tables
│   │   │   └── workspace.py        # Workspace tenant & memberships tables
│   │   ├── services/
│   │   │   ├── analytics.py        # Dialect-safe SQL analytics aggregates
│   │   │   ├── automation.py       # Sequential automation executor & background scheduler
│   │   │   ├── whatsapp.py         # Meta APIs and webhook parsers
│   │   │   └── workflow_interpreter.py # AST Canvas validation rules & interpreter compiler
│   │   ├── tests/
│   │   │   ├── test_analytics.py   # Test suite for analytics calculations
│   │   │   ├── test_automation.py  # Test suite for workflow actions execution
│   │   │   ├── test_webhook.py     # Test suite for webhook ingestion and verification
│   │   │   └── test_workflow_interpreter.py # Test suite for DFS cycle checks and validation
│   │   └── ws/
│   │       ├── broadcaster.py      # WS broadcaster payload marshallers
│   │       ├── manager.py          # Workspace & Chat Connection Manager registry
│   │       └── router.py           # WebSocket API route handlers (/ws/chat, /ws/conversations)
│   ├── src/                        # Node Express Webhook microservice
│   │   ├── index.ts                # Express setup listener
│   │   ├── config/
│   │   │   ├── database.ts         # Prisma Client instance
│   │   │   └── redis.ts            # Redis IORedis connection client setup
│   │   ├── middleware/
│   │   │   ├── rateLimiter.ts      # Redis-backed/in-memory API webhook rate limiter
│   │   │   └── signature.ts        # X-Hub-Signature-256 validator middleware
│   │   ├── routes/
│   │   │   └── webhook.ts          # Webhook Express routing listeners
│   │   └── services/
│   │       ├── ruleEngine.ts       # Simple automated replies and contacts upsert
│   │       └── whatsapp.ts         # Outbound Meta API caller
│   ├── Dockerfile                  # Python backend build
│   └── requirements.txt            # Python backend dependencies
└── dashboard/
    ├── src/
    │   ├── app/
    │   │   ├── globals.css         # Styling themes rules
    │   │   ├── layout.tsx          # Next.js root layout
    │   │   ├── auth/               # Signup/login view templates
    │   │   └── dashboard/
    │   │       └── page.tsx        # Inbox / Analytics / Workflow layout switches page
    │   ├── components/
    │   │   ├── MetricsGrid.tsx     # Analytics metric tiles
    │   │   ├── Sidebar.tsx         # Sidebar panels router
    │   │   ├── analytics/
    │   │   │   └── AnalyticsDashboard.tsx # Interactive charts dashboard view
    │   │   ├── inbox/
    │   │   │   ├── ConversationList.tsx # Chat thread list items UI
    │   │   │   └── MessageComposer.tsx  # Outbox editor panel
    │   │   └── workflow/
    │   │       ├── VisualWorkflowBuilder.tsx # Canvas builder workspace UI
    │   │       └── WorkflowBuilder.tsx       # Text rules configuration panel
    │   └── hooks/
    │       ├── useConversationSocket.ts # WebSocket list subscription client
    │       └── useWebSocketConnection.ts # Base browser WebSocket hook
    └── Dockerfile                  # Next.js production build config
```

---

## Installation

### Prerequisites
Ensure the following tools are installed on your host system:
- **Python** `3.11+`
- **Node.js** `18+`
- **Docker & Compose** (installed and running)

---

### Method 1: Quick Start via Docker Compose
This method spins up the frontend, backend gateway, PostgreSQL, and Redis containers in production configuration.

1. **Clone the repository and set environment variables:**
   ```bash
   git clone https://github.com/your-username/whatsapp-automation-saas.git
   cd whatsapp-automation-saas
   cp .env.example .env
   ```
2. **Build and start services:**
   ```bash
   docker compose up --build -d
   ```
3. **Verify running containers:**
   ```bash
   docker compose ps
   ```
4. **Access portals:**
   - Next.js Dashboard Frontend: `http://localhost:3000`
   - FastAPI Backend API Swagger Docs: `http://localhost:8080/docs`

---

### Method 2: Manual Local Setup (Development)

#### 1. Setup Backend Gateway (FastAPI)
1. Navigate to backend directory and create virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create local dev database schema:
   ```bash
   python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine)"
   ```
4. Run raw database update scripts (copies tags column formatting, etc.):
   ```bash
   python app/db/run_migration.py
   ```
5. Start the FastAPI gateway server:
   ```bash
   uvicorn app.main:app --port 8080 --reload
   ```

#### 2. Setup Node Webhook Service (Optional Fallback Webhook Listener)
1. Install Node modules:
   ```bash
   cd backend
   npm install
   ```
2. Create model schema mapping in local database:
   ```bash
   npx prisma db push
   ```
3. Run the development server (runs Express on port 8000):
   ```bash
   npm run dev
   ```

#### 3. Setup Next.js Dashboard Frontend
1. Navigate to the dashboard, copy settings, and install packages:
   ```bash
   cd ../dashboard
   npm install
   ```
2. Spin up the local Next.js client listener:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.

---

## Environment Variables

The platform relies on the following environment parameters. Create a `.env` file at the root level matching these names:

| Variable | Target Scope | Purpose | Required | Example |
| :--- | :--- | :--- | :---: | :--- |
| `API_V1_STR` | FastAPI Gateway | Base route path identifier for endpoints | Yes | `/api/v1` |
| `PROJECT_NAME` | FastAPI Gateway | Project Swagger document title | Yes | `WA-SaaS` |
| `SECRET_KEY` | FastAPI Gateway | Secure signature secret to sign JWT payloads | Yes | `replace_with_secure_sha256_hash_here` |
| `DATABASE_URL` | Gateway / Node | Connection path string pointing to datastore | Yes | `postgresql://postgres:password@localhost:5433/wa_automation` |
| `REDIS_URL` | Webhooks Node | Address point to Redis rate-limit database | Yes | `redis://localhost:6379` |
| `WHATSAPP_APP_SECRET` | Node / Python | Meta App Secret validating signature bytes | Yes | `acme_app_secret_abc123` |
| `WHATSAPP_VERIFY_TOKEN` | Node / Python | Secret handshake string matching Meta configuration | Yes | `acme_production_secure_handshake_token` |
| `PORT` | Webhooks Node | Run port address for Node microservice | No | `8000` |
| `NODE_ENV` | Webhooks Node | Environment flag toggling production constraints | No | `development` |
| `NEXT_PUBLIC_API_URL`| Next.js Client | Public domain point routing API gateway REST endpoints | Yes | `http://localhost:8080` |
| `NEXT_PUBLIC_WS_URL` | Next.js Client | Public domain point routing active live WS events | Yes | `ws://localhost:8080` |

---

## API Documentation

The FastAPI gateway automatically generates interactive documentation available at `/docs` (Swagger UI) or `/redoc` (ReDoc).

### Endpoint Registry

| Module | Method | Route | Description | Auth Required |
| :--- | :---: | :--- | :--- | :---: |
| **Authentication** | `POST` | `/api/v1/auth/signup` | Register a new user and auto-generate workspace | No |
| **Authentication** | `POST` | `/api/v1/auth/login` | Log in and retrieve Bearer JWT Access token | No |
| **Authentication** | `POST` | `/api/v1/auth/login-access-token` | Fetch token matching form requirements | No |
| **Workspace** | `POST` | `/api/v1/workspaces/` | Create a new tenant workspace | Yes |
| **Workspace** | `GET` | `/api/v1/workspaces/` | List all user workspaces | Yes |
| **Workspace** | `GET` | `/api/v1/workspaces/{id}` | Fetch workspace details | Yes |
| **Workspace** | `GET` | `/api/v1/workspaces/{id}/members` | List members and roles | Yes |
| **Workspace** | `POST` | `/api/v1/workspaces/{id}/invites` | Invite user into workspace | Yes |
| **WhatsApp Setup** | `POST` | `/api/whatsapp/connect` | Upsert Meta configuration credentials | Yes |
| **WhatsApp Setup** | `GET` | `/api/whatsapp/status` | Retrieve connection stats | Yes |
| **WhatsApp Setup** | `DELETE`| `/api/whatsapp/disconnect`| Disconnect Meta accounts | Yes |
| **WhatsApp Setup** | `GET` | `/api/whatsapp/messages` | List logged messages in a workspace | Yes |
| **WhatsApp Setup** | `GET` | `/api/whatsapp/conversations` | List conversation threads | Yes |
| **WhatsApp Setup** | `GET` | `/api/whatsapp/conversations/{id}/messages`| Fetch message history | Yes |
| **WhatsApp Setup** | `POST` | `/api/whatsapp/conversations/{id}/send` | Send outbound text reply via Meta API | Yes |
| **Automation** | `POST` | `/api/v1/workflows/` | Create automation pipeline | Yes |
| **Automation** | `GET` | `/api/v1/workflows/` | List active workflows | Yes |
| **Automation** | `GET` | `/api/v1/workflows/{id}` | Fetch workflow metadata | Yes |
| **Automation** | `GET` | `/api/v1/workflows/{id}/canvas` | Fetch React Flow JSON layout | Yes |
| **Automation** | `POST` | `/api/v1/workflows/{id}/canvas` | Save updated layout (triggers validation) | Yes |
| **Automation** | `GET` | `/api/v1/workflows/logs` | Fetch executed logs history | Yes |
| **Analytics** | `GET` | `/api/v1/analytics/overview` | Fetch overview KPIs | Yes |
| **Analytics** | `GET` | `/api/v1/analytics/messages` | Fetch volume distribution stats | Yes |
| **Analytics** | `GET` | `/api/v1/analytics/conversations`| Fetch session logs metrics | Yes |
| **Analytics** | `GET` | `/api/v1/analytics/workflows` | Fetch automation execution states | Yes |
| **Analytics** | `GET` | `/api/v1/analytics/performance` | Fetch latency averages and peak times | Yes |
| **Meta Webhook** | `GET` | `/webhook/meta` | Process verification handshake from Meta | No |
| **Meta Webhook** | `POST` | `/webhook/meta` | Ingest real-time inbound payloads and status receipts | No |

---

## Meta WhatsApp Cloud API Setup

Follow these steps to establish a connection with Meta:

### 1. Register Developer Account
1. Visit the [Meta for Developers Portal](https://developers.facebook.com) and create an app.
2. Select **Other** -> **Business** app type.
3. Add the **WhatsApp** product integration to your app.

### 2. Retrieve IDs and Setup Permanent Token
1. Open the API dashboard under WhatsApp sidebar controls to find your **Phone Number ID** and **WhatsApp Business Account ID**.
2. Set up a permanent System User Token using your [Facebook Business Manager](https://business.facebook.com) setting panels:
   - Navigate to **Users** -> **System Users**.
   - Create a system user, assign it the WhatsApp asset, and select the `whatsapp_business_messaging` scope to generate the access token.

### 3. Setup Webhook Configurations
In the App configuration portal, set up webhooks:
- **Callback URL**: `https://yourdomain.com/webhook/meta`
- **Verify Token**: Assign a unique verification string (e.g., `acme_production_secure_handshake_token`), matching `WHATSAPP_VERIFY_TOKEN` in your `.env` configuration.
- **Webhook Fields**: Click subscription settings and toggle `messages` to capture incoming messages and status receipts.

---

## WebSocket Architecture

The platform uses WebSockets to synchronize client dashboards in real time:

```
[Next.js Client Hook] 
   │
   ├── (Auth Handshake: JWT in query parameters)
   │
   └──► [FastAPI Gateway Router]
           │
           ├── (Authorize membership permissions)
           │
           └──► [Connection Registry Map]
                   │
                   ├── Workspace: /ws/conversations/{workspace_id} 
                   │      └── Updates lists, read badges, and preview texts.
                   │
                   └── Chat Window: /ws/chat/{conversation_id}
                          └── Updates outgoing/incoming states & delivery status.
```

- **Authentication**: Verified by passing the JWT as a query string parameter (`?token=<jwt>`). The socket handler rejects connection requests with a `1008 Policy Violation` if the user is unauthorized or does not belong to the target workspace.
- **Real-time Inbound Flow**: Inbound webhooks process messages, triggering the `EventBroadcaster` to marshal payload entities into typed JSON messages (e.g. `message_received`, `conversation_updated`). It pushes these updates to workspace channels in under 50ms.
- **Delivery Receipts**: Outbox message tracking statuses (`sent`, `delivered`, `read`, `failed`) sent from Meta webhook callbacks are immediately pushed to `/ws/chat/{conversation_id}` to update message delivery badges.

---

## Database Schema

```
+--------------------+            +---------------------+            +--------------------+
|       users        |            |      workspaces     |            |  workspace_members |
+--------------------+            +---------------------+            +--------------------+
| id (UUID, PK)      |<---\       | id (UUID, PK)       |<---\       | id (UUID, PK)      |
| email (Str)        |     \      | name (Str)          |     \      | workspace_id (FK)  |
| hashed_password    |      \     +---------------------+      \     | user_id (FK)       |
| full_name (Str)    |       \                                  \    | role (Enum)        |
+--------------------+        \                                  \   +--------------------+
                               \                                  \
+--------------------+          \ +---------------------+          \ +--------------------+
|    conversations   |           \|whatsapp_connections |           \|automation_workflows|
+--------------------+            +---------------------+            +--------------------+
| id (UUID, PK)      |            | id (UUID, PK)       |            | id (UUID, PK)      |
| workspace_id (FK)  |            | workspace_id (FK)   |            | workspace_id (FK)  |
| customer_phone     |            | business_account_id |            | name (Str)         |
| tags (JSON)        |            | phone_number_id     |            | canvas (JSON)      |
| assigned_to (FK) --/            +---------------------+            +--------------------+
+--------------------+
```

- **Workspace Isolation**: Enforced dynamically via workspace mapping columns (`workspace_id`) on all major models. Every API request validates that the authenticated user's ID exists in the `workspace_members` join table with write-access roles.

---

## Deployment

### Production Deployment Configuration

#### 1. Setup Docker Compose
Ensure the ports and restart definitions in [docker-compose.yml](file:///c:/Users/SAI%20ADITIYAA/Desktop/WP-AM/docker-compose.yml) match your infrastructure layout:
```bash
docker compose -f docker-compose.yml up -d
```

#### 2. Configure Nginx Reverse Proxy
Install Nginx and map traffic routing to forward requests to the Docker services:
```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

#### 3. Enable HTTPS (SSL Certificate)
Obtain a free SSL certificate from Let's Encrypt using Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.yourdomain.com
```

---

## Security Architecture

- **JWT Session Hashing**: Tokens carry dynamic claims, verifying signing keys on API paths.
- **Argon2 / BCrypt Storage**: Fast and secure hashing protection preventing database leakage.
- **Timing-Safe HMAC checks**: Webhook route parses and verifies the Meta signature header using `crypto.timingSafeEqual` in Node and PyJWT compare digest tools in Python, blocking timing-attack exploits.
- **SQL Injection Defense**: Standard queries are built exclusively using parameter-mapping query structures within SQLAlchemy and Prisma ORM client packages.
- **Cross-Site Scripting (XSS) Filter**: Raw texts are sanitized via Python's `html.escape` before processing.

---

## Testing

The codebase includes python tests validating core API components:

### Run Backend API Test Suite
1. Navigate to the backend directory and run unittest:
   ```bash
   cd backend
   venv/bin/python -m unittest discover -s app/tests
   ```
2. The testing suite processes:
   - `test_analytics.py`: Validates KPI date math, SQLite averages parsing, and message trends.
   - `test_automation.py`: Validates execution logic, bot-to-bot recursion loop checks, delay schedulers, and tag actions.
   - `test_webhook.py`: Validates webhook handshake challenge responses, raw signature validation blocks, and ingestion.
   - `test_workflow_interpreter.py`: Validates canvas compile steps, circular cycle check graphs, unreachable nodes, and error reporting.
   - `uat_test_scenario.py`: UAT scenario testing user registration, workspace creation, connection setup, webhook triggers, execution logs.

---

## Roadmap

- [x] Official Meta Cloud API Ingestion integration.
- [x] Collaborative WebSockets shared team inbox.
- [x] AST Graph visual layout builder.
- [x] Scheduled delay execution loop daemons.
- [x] Dialect-safe aggregated analytics dashboard.
- [ ] AI Smart Response Engine (OpenAI integration).
- [ ] WhatsApp Templates manager.
- [ ] Interactive Media message nodes support.
- [ ] Multi-number integration mappings.
- [ ] Mobile Inbox client layout wrapper.

---

## Troubleshooting & FAQ

### FAQ

#### Q: Why is my WebSocket disconnecting with code 1008?
- **A**: This indicates a policy violation. The connection query token (`?token=<jwt>`) is missing, expired, or the user does not have permission to access the target workspace. Verify your local token status.

#### Q: How can I change the database connection to SQLite?
- **A**: Set the `DATABASE_URL` environment variable to `"sqlite:///./wa_automation.db"`. The analytics queries will automatically fall back to SQLite-compatible date and hour grouping functions.

#### Q: How is the scheduler daemon executed?
- **A**: On server startup, the FastAPI app registers startup events that spin up `WorkflowSchedulerThread` as a daemon thread. It queries the database every 5s, checks for pending jobs that are due, and resumes execution workflows.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

---

## Author
Sai Aditiyaa R S

For inquiries, support, or security report submissions, contact saiaditiyaa07@gmail.com.
