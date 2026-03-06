# Kanban Task Board

A **Jira-style Kanban board** with Clerk authentication, AES-encrypted data at rest, JWKS-protected APIs, and user-scoped authorization. Built as a full-stack project with React + FastAPI + MongoDB.

---

## Tech Stack

| Layer        | Technology                     | Purpose                          |
|--------------|--------------------------------|----------------------------------|
| Frontend     | React 18 + Tailwind CSS (Vite) | UI, drag-and-drop board          |
| Backend      | Python 3.12 + FastAPI          | REST API, business logic         |
| Database     | MongoDB 8.x                    | Persistent task storage          |
| Auth         | Clerk (JWKS / JWT)             | Login, signup, token validation  |
| Encryption   | AES-256-CBC (PyCryptodome / CryptoJS) | End-to-end data encryption |
| Drag & Drop  | @dnd-kit                       | Kanban column drag-and-drop      |
| UI/UX        | Glassmorphism, gradients, animations | Modern polished interface   |
| Responsive   | Tailwind breakpoints + horizontal scroll | Mobile, tablet, desktop  |

---

## Project Structure

```
kanban-board/
├── .gitignore
├── README.md                         # This file — single source of truth
│
├── frontend/                         # React + Vite + Tailwind CSS
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # Dependencies & scripts
│   ├── vite.config.js                # Vite bundler config
│   ├── tailwind.config.js            # Tailwind CSS config
│   ├── postcss.config.js             # PostCSS config
│   ├── .env.example                  # Environment variable template
│   └── src/
│       ├── main.jsx                  # App entry — ClerkProvider + BrowserRouter
│       ├── App.jsx                   # Route definitions (login, dashboard)
│       ├── index.css                 # Tailwind base styles
│       ├── pages/
│       │   ├── LoginPage.jsx         # Clerk Sign-in / Sign-up page
│       │   └── DashboardPage.jsx     # Main page — fetches tasks, manages CRUD
│       ├── components/
│       │   ├── Layout.jsx            # Header bar with Clerk UserButton
│       │   ├── KanbanBoard.jsx       # DndContext + 3 columns + DragOverlay
│       │   ├── Column.jsx            # Droppable column (useDroppable)
│       │   ├── TaskCard.jsx          # Draggable task card (useSortable)
│       │   └── CreateTaskModal.jsx   # Modal form to create a new task
│       └── utils/
│           ├── auth.jsx              # Unified auth context (Clerk + Dev mode)
│           ├── api.js                # Authenticated fetch wrapper (Bearer token)
│           └── encryption.js         # AES-256-CBC encrypt/decrypt (CryptoJS)
│
├── backend/                          # Python FastAPI
│   ├── main.py                       # FastAPI app, CORS, route registration
│   ├── config.py                     # Env vars: MONGODB_URL, CLERK_JWKS_URL, etc.
│   ├── database.py                   # Motor async MongoDB client
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment variable template
│   ├── models/
│   │   └── task.py                   # Pydantic models: TaskCreate, TaskUpdate, TaskResponse
│   ├── routes/
│   │   └── tasks.py                  # CRUD endpoints: GET, POST, PUT, DELETE
│   ├── middleware/
│   │   └── auth.py                   # Clerk JWKS token verification + get_current_user
│   └── utils/
│       └── encryption.py             # AES-256-CBC encrypt/decrypt (PyCryptodome)
```

---

## How It Works — Architecture & Data Flow

### Authentication Flow

The app supports **two auth modes**, selected automatically by whether `VITE_CLERK_PUBLISHABLE_KEY` is configured:

**Production Mode (Clerk):**
```
User → Clerk Login UI → Clerk issues JWT → Frontend stores token
                                            ↓
Frontend attaches JWT in Authorization: Bearer <token> header
                                            ↓
FastAPI middleware extracts JWT → validates via Clerk JWKS endpoint
                                            ↓
                              Extracts user_id from "sub" claim
                              → passes to route handlers
```

**Dev Mode (no Clerk key):**
```
User → Dev Login Page (enter any user ID) → Frontend generates unsigned JWT
                                              ↓
Frontend attaches JWT in Authorization: Bearer <token> header
                                              ↓
FastAPI middleware decodes JWT without signature verification (CLERK_JWKS_URL empty)
                                              ↓
                              Extracts user_id from "sub" claim
                              → passes to route handlers
```

> Dev mode is activated automatically when `VITE_CLERK_PUBLISHABLE_KEY` is missing or set to `pk_test_your_key_here`. The login page shows a yellow "Dev Mode" banner and lets you type any user ID to simulate different users.

### Task CRUD Flow (with encryption)
```
User creates task in UI
        ↓
Frontend sends POST /api/tasks/ with JSON body + Bearer token
        ↓
Backend auth middleware validates JWT, extracts user_id
        ↓
Backend encrypts title + description with AES-256-CBC
        ↓
Encrypted data stored in MongoDB (status/priority/user_id remain plaintext for queries)
        ↓
On read: Backend decrypts title + description → returns plaintext to authorized user
```

### Kanban Drag-and-Drop Flow
```
User drags TaskCard from "To Do" column to "In Progress" column
        ↓
@dnd-kit fires onDragEnd with source task ID + target column ID
        ↓
Frontend calls PUT /api/tasks/{id} with { "status": "in_progress" }
        ↓
Backend verifies ownership → updates status in MongoDB → returns updated task
```

### What Gets Encrypted vs. Plaintext

| Field         | Stored As   | Reason                                      |
|---------------|-------------|---------------------------------------------|
| `title`       | AES encrypted | Sensitive task content                     |
| `description` | AES encrypted | Sensitive task content                     |
| `status`      | Plaintext   | Needed for DB queries/filtering              |
| `priority`    | Plaintext   | Needed for DB queries/filtering              |
| `user_id`     | Plaintext   | Needed for authorization queries             |
| `created_at`  | Plaintext   | Metadata for sorting                         |
| `updated_at`  | Plaintext   | Metadata for sorting                         |

### Task Statuses (6 columns)

The Kanban board has 6 status columns, representing a full development workflow:

| Status        | Column Title  | Icon | Color    | Use Case                         |
|---------------|---------------|------|----------|----------------------------------|
| `backlog`     | Backlog       | 📋   | Slate    | Ideas and future tasks           |
| `todo`        | To Do         | 📝   | Blue     | Ready to start                   |
| `in_progress` | In Progress   | ⚡   | Amber    | Currently being worked on        |
| `review`      | Review        | 🔍   | Purple   | Awaiting code review / feedback  |
| `testing`     | Testing       | 🧪   | Cyan     | Being tested / QA                |
| `done`        | Done          | ✅   | Emerald  | Completed                        |

### Task Priorities (4 levels)

| Priority | Color    | Use Case              |
|----------|----------|-----------------------|
| `low`    | Emerald  | Nice-to-have tasks    |
| `medium` | Blue     | Normal priority       |
| `high`   | Orange   | Important tasks       |
| `urgent` | Red      | Critical / blockers   |

### Authorization Model

- Every task is linked to a `user_id` (extracted from JWT `sub` claim)
- **GET /api/tasks/** → returns only tasks where `user_id` matches the caller
- **PUT /api/tasks/{id}** → 403 if caller's `user_id` ≠ task's `user_id`
- **DELETE /api/tasks/{id}** → 403 if caller's `user_id` ≠ task's `user_id`
- No user can see, edit, or delete another user's tasks

---

## Database Schema

MongoDB is schema-less, but this project uses a single collection with a consistent document structure.

**Database:** `kanban_board` (configurable via `DATABASE_NAME` env var)

**Collection:** `tasks`

### Document Structure (as stored in MongoDB)

```json
{
  "_id": ObjectId("669ae70406763bc2dbf6f6e2"),
  "title": "QVPdO80Wad3PhcnqK2nsYc...",          // AES-256-CBC encrypted, base64-encoded
  "description": "Vu79Etfk253qsmVx6Cc...",        // AES-256-CBC encrypted, base64-encoded
  "status": "todo",                                 // Plaintext: "backlog" | "todo" | "in_progress" | "review" | "testing" | "done"
  "priority": "medium",                             // Plaintext: "low" | "medium" | "high" | "urgent"
  "user_id": "user_2abc123XYZ",                    // Plaintext: Clerk user ID (from JWT "sub" claim)
  "created_at": "2026-03-06T14:30:00.000000+00:00", // ISO 8601 timestamp
  "updated_at": "2026-03-06T14:35:00.000000+00:00"  // ISO 8601 timestamp
}
```

### Field Reference

| Field         | Type     | Indexed | Encrypted | Description                                   |
|---------------|----------|---------|-----------|-----------------------------------------------|
| `_id`         | ObjectId | Yes (PK)| No       | MongoDB auto-generated primary key             |
| `title`       | String   | No      | **Yes**  | Task title — AES-CBC encrypted, base64 string  |
| `description` | String   | No      | **Yes**  | Task description — AES-CBC encrypted, base64   |
| `status`      | String   | No      | No       | Kanban column: `backlog`, `todo`, `in_progress`, `review`, `testing`, `done` |
| `priority`    | String   | No      | No       | Task priority: `low`, `medium`, `high`, `urgent`  |
| `user_id`     | String   | No      | No       | Owner's Clerk user ID (from JWT `sub` claim)   |
| `created_at`  | String   | No      | No       | ISO 8601 creation timestamp                    |
| `updated_at`  | String   | No      | No       | ISO 8601 last-modified timestamp               |

### Recommended Indexes (for production)

```javascript
// Run in mongosh against the kanban_board database:
db.tasks.createIndex({ "user_id": 1 })                    // Speed up per-user queries
db.tasks.createIndex({ "user_id": 1, "status": 1 })       // Speed up filtered queries
db.tasks.createIndex({ "user_id": 1, "created_at": -1 })  // Speed up sorted listings
```

> **Note:** MongoDB does not enforce a schema. The structure above is enforced by the Pydantic models in `backend/models/task.py` and the route logic in `backend/routes/tasks.py`.

### Encryption Format

Each encrypted field is stored as a base64 string with the following binary layout:

```
[ 16-byte random IV ][ AES-CBC ciphertext (PKCS7 padded) ]
       ↓                         ↓
   Prepended              Encrypted payload
       ↓                         ↓
              base64_encode(IV + ciphertext)
```

- **Encrypt:** Generate random 16-byte IV → AES-CBC encrypt with PKCS7 padding → prepend IV → base64 encode
- **Decrypt:** base64 decode → split first 16 bytes as IV → AES-CBC decrypt remaining bytes → remove PKCS7 padding

---

## Setup & Installation

### Prerequisites

| Tool        | Version  | Install Command                                     |
|-------------|----------|-----------------------------------------------------|
| Node.js     | 18+      | `winget install OpenJS.NodeJS.LTS`                  |
| Python      | 3.10+    | `winget install Python.Python.3.12`                 |
| MongoDB     | 7+       | `winget install MongoDB.Server`                     |
| Clerk       | —        | Sign up at https://clerk.com (free tier available)  |

### 1. Clone & Navigate

```bash
git clone <your-repo-url>
cd kanban-board
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create `backend/.env` from the template:
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=kanban_board
CLERK_JWKS_URL=https://<your-clerk-instance>.clerk.accounts.dev/.well-known/jwks.json
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
```

> **ENCRYPTION_KEY** must be exactly 32 hex characters (16 bytes = AES-128) or 64 hex characters (32 bytes = AES-256).

> **CLERK_JWKS_URL**: Leave empty for dev mode (tokens accepted without signature verification).

Start the server:
```bash
uvicorn main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/api/health` → `{"status":"ok"}`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local` from the template:
```bash
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:8000
VITE_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
```

> Get your publishable key from the Clerk dashboard → API Keys.

Start the dev server:
```bash
npm run dev
```

Open: http://localhost:5173

---

## API Reference

**Base URL:** `http://localhost:8000`

All `/api/tasks/*` endpoints require `Authorization: Bearer <clerk_jwt>` header.

### Health Check

| Method | Endpoint       | Auth | Description        |
|--------|----------------|------|--------------------|
| GET    | `/api/health`  | No   | Returns `{"status":"ok"}` |

### Tasks CRUD

| Method | Endpoint              | Auth | Description                                    |
|--------|-----------------------|------|------------------------------------------------|
| GET    | `/api/tasks/`         | Yes  | List all tasks for authenticated user          |
| GET    | `/api/tasks/?status=` | Yes  | Filter by status: `backlog`, `todo`, `in_progress`, `review`, `testing`, `done`|
| POST   | `/api/tasks/`         | Yes  | Create a new task (encrypted at rest)          |
| PUT    | `/api/tasks/{id}`     | Yes  | Update task (owner only, partial updates OK)   |
| DELETE | `/api/tasks/{id}`     | Yes  | Delete task (owner only)                       |

### Request/Response Schemas

**POST /api/tasks/** — Create Task
```json
{
  "title": "string (required, 1-200 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "backlog | todo | in_progress | review | testing | done (default: todo)",
  "priority": "low | medium | high | urgent (default: medium)"
}
```

**PUT /api/tasks/{id}** — Update Task (all fields optional)
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "todo | in_progress | done (optional)",
  "priority": "low | medium | high | urgent (optional)"
}
```

**Task Response Object**
```json
{
  "id": "MongoDB ObjectId string",
  "title": "Decrypted plaintext title",
  "description": "Decrypted plaintext description",
  "status": "backlog | todo | in_progress | review | testing | done",
  "priority": "low | medium | high | urgent",
  "user_id": "Clerk user ID (from JWT sub claim)",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

### Error Responses

| Status | Meaning                  | When                                              |
|--------|--------------------------|----------------------------------------------------|
| 400    | Bad Request              | Invalid task ID format                             |
| 401    | Unauthorized             | Missing/invalid/expired JWT token                  |
| 403    | Forbidden                | User trying to modify another user's task          |
| 404    | Not Found                | Task ID doesn't exist                              |
| 422    | Validation Error         | Missing required fields, invalid enum, bad JSON    |

---

## Tested Scenarios (47 tests — all passing)

### Previous Test Run (17 tests)

| #  | Test                                   | Result |
|----|----------------------------------------|--------|
| 1  | Health check returns `{"status":"ok"}` | ✅ PASS |
| 2  | GET tasks on empty DB returns `[]`     | ✅ PASS |
| 3  | Create task with status=todo           | ✅ PASS |
| 4  | Create task with status=in_progress    | ✅ PASS |
| 5  | Create task with status=done           | ✅ PASS |
| 6  | GET all tasks returns 3                | ✅ PASS |
| 7  | Filter by status=todo returns 1        | ✅ PASS |
| 8  | Update task title + status             | ✅ PASS |
| 9  | Unauthenticated request → 401          | ✅ PASS |
| 10 | Other user sees 0 tasks (isolation)    | ✅ PASS |
| 11 | Other user cannot update → 403         | ✅ PASS |
| 12 | Other user cannot delete → 403         | ✅ PASS |
| 13 | Owner deletes own task                 | ✅ PASS |
| 14 | Verify deletion (2 remaining)          | ✅ PASS |
| 15 | MongoDB stores encrypted data          | ✅ PASS |
| 16 | Frontend serves HTML (200)             | ✅ PASS |
| 17 | Frontend has correct entry point       | ✅ PASS |

### Complex Test Run (30 tests)

**Scenario 1: Multi-user Task Isolation (3 users, 6 tasks)**

| #  | Test                              | Result |
|----|-----------------------------------|--------|
| 18 | Alice sees exactly 3 tasks        | ✅ PASS |
| 19 | Bob sees exactly 2 tasks          | ✅ PASS |
| 20 | Charlie sees exactly 1 task       | ✅ PASS |

**Scenario 2: Status Filter Combinations**

| #  | Test                                 | Result |
|----|--------------------------------------|--------|
| 21 | Alice todo filter = 1                | ✅ PASS |
| 22 | Alice in_progress filter = 1         | ✅ PASS |
| 23 | Alice done filter = 1                | ✅ PASS |
| 24 | Correct task in todo filter          | ✅ PASS |
| 25 | Correct task in in_progress filter   | ✅ PASS |
| 26 | Bob todo filter = 1                  | ✅ PASS |
| 27 | Bob done filter = 1                  | ✅ PASS |
| 28 | Bob in_progress filter = 0           | ✅ PASS |

**Scenario 3: Cross-user Authorization**

| #  | Test                                  | Result |
|----|---------------------------------------|--------|
| 29 | Bob cannot update Alice's task → 403  | ✅ PASS |
| 30 | Charlie cannot delete Bob's task → 403| ✅ PASS |
| 31 | Alice cannot delete Bob's task → 403  | ✅ PASS |

**Scenario 4: Drag-and-Drop (status transitions)**

| #  | Test                                | Result |
|----|-------------------------------------|--------|
| 32 | Drag: todo → in_progress            | ✅ PASS |
| 33 | Drag: in_progress → done            | ✅ PASS |
| 34 | Reopen: done → todo                 | ✅ PASS |

**Scenario 5: Partial Updates**

| #  | Test                                     | Result |
|----|------------------------------------------|--------|
| 35 | Update only title → title changes        | ✅ PASS |
| 36 | Update only title → status unchanged     | ✅ PASS |
| 37 | Update only title → priority unchanged   | ✅ PASS |
| 38 | Update only priority → priority changes  | ✅ PASS |
| 39 | Update only priority → title unchanged   | ✅ PASS |

**Scenario 6: Edge Cases & Error Handling**

| #  | Test                               | Result |
|----|------------------------------------|--------|
| 40 | Invalid task ID format → 400       | ✅ PASS |
| 41 | Non-existent task ID → 404         | ✅ PASS |
| 42 | Delete non-existent task → 404     | ✅ PASS |
| 43 | No auth header → 401               | ✅ PASS |
| 44 | Malformed auth header → 401        | ✅ PASS |
| 45 | Empty bearer token → 401           | ✅ PASS |
| 46 | Invalid JSON body → 422            | ✅ PASS |
| 47 | Missing required title → 422       | ✅ PASS |
| 48 | Invalid status enum → 422          | ✅ PASS |

**Scenario 7: Rapid CRUD Cycle (Create→Read→Update→Delete→Verify)**

| #  | Test                               | Result |
|----|------------------------------------|--------|
| 49 | Create succeeds                    | ✅ PASS |
| 50 | Read finds created task            | ✅ PASS |
| 51 | Update all fields at once          | ✅ PASS |
| 52 | Delete succeeds                    | ✅ PASS |
| 53 | Verify task is gone after delete   | ✅ PASS |

**Scenario 8: Encryption Verification**

| #  | Test                                          | Result |
|----|-----------------------------------------------|--------|
| 54 | Title NOT stored as plaintext in MongoDB      | ✅ PASS |
| 55 | Description NOT stored as plaintext in MongoDB| ✅ PASS |
| 56 | Raw DB data looks like base64 ciphertext      | ✅ PASS |
| 57 | API returns decrypted title correctly          | ✅ PASS |
| 58 | API returns decrypted description correctly    | ✅ PASS |

### How to Run Tests (curl)

All tests can be run against the backend via curl. No test framework needed.

**Step 1: Ensure MongoDB is running and backend is started**

```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Step 2: Generate a test JWT token (dev mode — no Clerk account needed)**

```bash
# Requires PyJWT (already in requirements.txt)
python -c "import jwt; print(jwt.encode({'sub': 'test_user_123'}, 'secret', algorithm='HS256'))"
```

Save the output as `$TOKEN`. With `CLERK_JWKS_URL` left empty in `.env`, the backend accepts any JWT without signature verification.

**Step 3: Run the tests**

```bash
# Set your token (replace with actual output from step 2)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Health check
curl -s http://localhost:8000/api/health
# Expected: {"status":"ok"}

# Create a task
curl -s -X POST http://localhost:8000/api/tasks/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","description":"Details here","priority":"high","status":"todo"}'
# Expected: 201 with task JSON (save the "id" field)

# List all tasks
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/tasks/
# Expected: Array of tasks for this user

# Filter by status
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/tasks/?status=todo"
# Expected: Only tasks with status "todo"

# Update a task (replace TASK_ID with actual id)
curl -s -X PUT http://localhost:8000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
# Expected: 200 with updated task

# Delete a task
curl -s -X DELETE http://localhost:8000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"message":"Task deleted successfully"}

# Test unauthorized access (no token)
curl -s http://localhost:8000/api/tasks/
# Expected: {"detail":"Missing or invalid authorization header"} (401)

# Test cross-user authorization (generate a second token with different sub)
TOKEN2=$(python -c "import jwt; print(jwt.encode({'sub': 'other_user'}, 'secret', algorithm='HS256'))")
curl -s -X PUT http://localhost:8000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{"title":"hacked"}'
# Expected: {"detail":"Not authorized to update this task"} (403)

# Test invalid inputs
curl -s -X POST http://localhost:8000/api/tasks/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"no title"}'
# Expected: 422 (title is required)

curl -s -X PUT http://localhost:8000/api/tasks/not-a-valid-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"x"}'
# Expected: {"detail":"Invalid task ID"} (400)
```

**Step 4: Verify encryption in MongoDB (optional)**

```python
# Run with: python check_encryption.py
import pymongo
client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["kanban_board"]
for doc in db.tasks.find():
    print(f"title (raw): {doc['title'][:50]}...")  # Should be base64 gibberish, NOT plaintext
    print(f"status:      {doc['status']}")          # Should be plaintext
```

---

## Key Implementation Details

### Encryption (AES-256-CBC)

- **Backend** (`backend/utils/encryption.py`): Uses PyCryptodome. Generates random 16-byte IV per encryption, prepends IV to ciphertext, base64-encodes the result.
- **Frontend** (`frontend/src/utils/encryption.js`): Uses CryptoJS. Same IV-prepend scheme for interoperability.
- Both share the same `ENCRYPTION_KEY` (hex string in env vars).

### Auth Middleware (`backend/middleware/auth.py`)

- Extracts `Authorization: Bearer <token>` from request headers
- If `CLERK_JWKS_URL` is set: validates JWT signature via Clerk's JWKS endpoint (RS256)
- If `CLERK_JWKS_URL` is empty (dev mode): decodes JWT without signature verification
- Extracts `sub` claim as `user_id` for authorization

### Task Routes (`backend/routes/tasks.py`)

- All routes call `get_current_user(request)` to extract authenticated user
- `GET /api/tasks/` queries MongoDB with `{"user_id": current_user}`
- `PUT` and `DELETE` verify `existing_task.user_id == current_user` before modifying
- Sensitive fields (title, description) are encrypted before insert/update and decrypted on read

### Frontend Routing (`frontend/src/App.jsx`)

- `/login` → LoginPage (Clerk SignIn/SignUp in prod, dev login form in dev mode)
- `/dashboard` → DashboardPage (protected — redirects to `/login` if not signed in)
- `/*` → Redirects to `/dashboard`

### Unified Auth (`frontend/src/utils/auth.jsx`)

- `IS_DEV_MODE` — constant, `true` when `VITE_CLERK_PUBLISHABLE_KEY` is missing or placeholder
- `DevAuthProvider` — React context provider that manages sign-in state and generates unsigned JWTs
- `ClerkAuthBridge` — Wraps Clerk's `useAuth()` into the same unified `AuthContext`
- `useAppAuth()` — Single hook used by all components, returns `{ isSignedIn, getToken, userId, signOut }`
- In dev mode: login page shows a user ID input + "Sign In (Dev Mode)" button
- In prod: login page shows Clerk's `<SignIn />` / `<SignUp />` components

### Drag-and-Drop (`frontend/src/components/KanbanBoard.jsx`)

- Uses `@dnd-kit/core` DndContext with `closestCorners` collision detection
- Six droppable columns: `backlog`, `todo`, `in_progress`, `review`, `testing`, `done`
- On drop: determines target column, calls `PUT /api/tasks/{id}` with new status
- `DragOverlay` shows an elevated animated card while dragging
- Stats bar at top shows task count per column with color-coded badges

### UI/UX Design

- **Glassmorphism header** — frosted glass effect with `backdrop-filter: blur(12px)`
- **Gradient color scheme** — indigo/purple gradients for buttons, column headers, and accents
- **Smooth animations** — fade-in on task cards, lift animation on drag, pulse on status dots
- **Priority indicator** — colored bar at top of each card (emerald/blue/orange/red)
- **Delete on hover** — ✕ button appears only when hovering over a card (reduces clutter)
- **Modern typography** — Inter font with varied weights, uppercase labels, tight tracking

### Responsive Design

The board adapts to all screen sizes:

| Breakpoint   | Layout                                                           |
|--------------|------------------------------------------------------------------|
| **Mobile** (<640px) | Horizontal scroll with snap-to-column, full-width modal (bottom sheet), compact header |
| **Tablet** (640-1024px) | Horizontal scroll with larger columns, side-by-side priority/status in modal |
| **Desktop** (1024px+) | 6-column CSS grid, centered modal, full stats bar with labels |

Key responsive techniques:
- `kanban-scroll` class: horizontal scroll with `scroll-snap-type: x mandatory`
- `min-w-[260px]` on columns prevents them from shrinking too small
- `lg:grid lg:grid-cols-6` switches from flex scroll to grid at desktop
- Modal uses `items-end sm:items-center` (bottom sheet on mobile, centered on desktop)
- Header hides text logo on mobile, shows only icon
- Stats bar hides labels on mobile, shows icon + count only

---

## Running the Project

### Quick Start (both servers)

**Terminal 1 — Backend:**
```bash
cd backend
.venv\Scripts\activate          # Windows
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### Dev Mode — Test the Full UI Without Clerk

No Clerk account? No problem. The app auto-detects when no Clerk key is configured and switches to dev mode.

**Setup (one-time):**

1. Copy `frontend/.env.example` → `frontend/.env.local` (keep `VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here`)
2. Copy `backend/.env.example` → `backend/.env` (keep `CLERK_JWKS_URL=` empty)
3. Start both servers (see Quick Start above)

**Testing in the browser:**

1. Open **http://localhost:5173**
2. You'll be redirected to the **login page** with a yellow **"🛠️ Dev Mode"** banner
3. Default user ID is `dev_user_001` — click **"Sign In (Dev Mode)"**
4. You're now on the **Kanban board dashboard** with six columns:
   - 📋 **Backlog** | 📝 **To Do** | ⚡ **In Progress** | 🔍 **Review** | 🧪 **Testing** | ✅ **Done**
5. Click **"+ New Task"** — fill in title, description, priority, status → click **Create Task**
6. **Drag a task card** from one column to another (e.g., To Do → In Progress)
7. Click the **✕** on a task card to delete it
8. The header shows **"DEV: dev_user_001"** badge and a **Sign Out** button

**Testing multi-user isolation:**

1. Click **Sign Out** in the header
2. On the login page, change user ID to `dev_user_002`
3. Click **Sign In** — the board is **empty** (different user, no shared tasks)
4. Create tasks as `dev_user_002` — they are completely isolated from `dev_user_001`'s tasks

**Testing with Clerk (production mode):**

1. Create a Clerk account at https://clerk.com
2. Set `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...` in `frontend/.env.local`
3. Set `CLERK_JWKS_URL=https://your-instance.clerk.accounts.dev/.well-known/jwks.json` in `backend/.env`
4. Restart both servers
5. The login page will now show Clerk's sign-in/sign-up UI
6. Clerk handles authentication; the backend validates JWTs via JWKS

### API Docs (Swagger UI)

FastAPI auto-generates interactive API docs:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

You can test all endpoints directly from the Swagger UI (add your Bearer token via the "Authorize" button).

---

## Dependencies

### Backend (`requirements.txt`)

| Package        | Version | Purpose                          |
|----------------|---------|----------------------------------|
| fastapi        | 0.115.0 | Web framework                    |
| uvicorn        | 0.30.0  | ASGI server                      |
| motor          | 3.5.0   | Async MongoDB driver             |
| pymongo        | 4.8.0   | MongoDB driver (sync, used by motor) |
| python-dotenv  | 1.0.1   | Load .env files                  |
| pycryptodome   | 3.20.0  | AES encryption                   |
| PyJWT          | 2.9.0   | JWT decode + JWKS client         |
| cryptography   | 43.0.0  | Crypto primitives for PyJWT      |
| httpx          | 0.27.0  | HTTP client (for JWKS fetching)  |
| pydantic       | 2.9.0   | Data validation                  |

### Frontend (`package.json`)

| Package            | Purpose                            |
|--------------------|------------------------------------|
| react / react-dom  | UI framework                       |
| react-router-dom   | Client-side routing                |
| @clerk/clerk-react | Clerk auth SDK                     |
| @dnd-kit/core      | Drag-and-drop core                 |
| @dnd-kit/sortable  | Sortable items within columns      |
| @dnd-kit/utilities | CSS transform utilities            |
| crypto-js          | AES encryption (frontend)          |
| tailwindcss        | Utility-first CSS                  |
| vite               | Build tool / dev server            |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable          | Required | Default                      | Description                    |
|-------------------|----------|------------------------------|--------------------------------|
| `MONGODB_URL`     | No       | `mongodb://localhost:27017`  | MongoDB connection string      |
| `DATABASE_NAME`   | No       | `kanban_board`               | MongoDB database name          |
| `CLERK_JWKS_URL`  | No       | _(empty = dev mode)_         | Clerk JWKS URL for JWT verify  |
| `ENCRYPTION_KEY`  | No       | `0123456789abcdef...`        | 32-char hex key for AES        |

### Frontend (`frontend/.env.local`)

| Variable                      | Required | Default                 | Description                    |
|-------------------------------|----------|-------------------------|--------------------------------|
| `VITE_CLERK_PUBLISHABLE_KEY`  | Yes      | —                       | Clerk publishable API key      |
| `VITE_API_URL`                | No       | `http://localhost:8000` | Backend API base URL           |
| `VITE_ENCRYPTION_KEY`         | No       | `0123456789abcdef...`   | 32-char hex key for AES        |

---

## Future Improvements

- [ ] Add task assignment (assign tasks to other users)
- [ ] Add due dates and reminders
- [ ] Add task comments/activity log
- [ ] Add WebSocket for real-time board updates
- [ ] Add task search and sorting
- [ ] Add production Docker Compose setup
- [ ] Add unit tests (pytest for backend, Vitest for frontend)
- [ ] Add CI/CD pipeline (GitHub Actions)
