# InsurFlow — Enterprise Insurance Claim Automation System

> **Demonstration System Notice:**  
> InsurFlow is a full-stack general insurance claims management system built for educational demonstration and workflow automation. All policies, claims, fraud inquiries, and payment disbursements are simulated demonstration records. This application is not integrated with live insurance carriers, real banking networks, or external fraud registries.

---

## 1. Overview & Architecture

InsurFlow automates the entire lifecycle of insurance claims with strict server-side Role-Based Access Control (RBAC), multi-role approval gates, immutable audit logging, and private document storage.

### Technology Stack
- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons, Axios
- **Backend**: Node.js, Express, Mongoose, Multer, Helmet, CORS, Express-Rate-Limit, Express-Validator
- **Database**: MongoDB (Supports local `mongod`, MongoDB Atlas, or zero-config in-memory MongoDB via `mongodb-memory-server`)
- **Security**: JWT authentication, bcrypt password hashing (10 rounds), non-public file storage with randomized UUID filenames, and strict role guards
- **Testing**: Jest and Supertest (29 automated tests covering auth, RBAC, access isolation, upload limits, and workflow transitions)

---

## 2. User Roles & Access Control Model

Server-side role-based middleware (`authorizeRoles`) and database ownership checks ensure users cannot access or tamper with unauthorized resources:

| Role | Domain Scope & Permitted Actions |
| :--- | :--- |
| **Policyholder** | Register, view own active policies, submit claims, upload evidence, resubmit corrections, track timeline. Cannot approve claims or access other users' claims. |
| **Claims Officer** | Review submitted intake queue, inspect uploaded documents, verify receipts, request missing info (moves to *Needs Correction*), or flag for risk. |
| **Investigator** | Workspace for flagged claims (*Under Investigation*). Conducts site/estimate inquiries, records findings, and returns claim to *Under Review*. |
| **Approver** | Adjudicates reviewed claims. Issues formal approval with approved amount or rejection with policy exclusion reason. |
| **Finance Staff** | Manages disbursements (*Settlement Pending*). Transitions approved claims to *Settled* with transaction reference and payment method. |
| **Administrator** | System-wide visibility, user & role provisioning, system settings, and compliance audit trail inspection. |

---

## 3. Claim Lifecycle & State Machine

```
[Draft]
   ↓
[Submitted] (Policyholder submits with incident report)
   ↓
[Under Review] (Claims Officer commences intake verification)
   ↙           ↘
[Needs Correction]   [Under Investigation] (Fraud risk flag raised)
   ↘           ↙
[Under Review] (Adjuster findings or policyholder documents uploaded)
   ↓
[Approved]  OR  [Rejected] (Approver decision with reason)
   ↓
[Settlement Pending] (Queued for disbursement)
   ↓
[Settled] (Finance staff disburses payout with transaction reference)
   ↓
[Closed]
```

### Server-Enforced Rules
1. **No Settlement Before Approval:** Attempting to update settlement on a non-approved claim returns `400 Bad Request`.
2. **Strict Privacy Isolation:** Policyholder A accessing Policyholder B's claims or downloading documents returns `403 Forbidden`.
3. **No Public Privilege Escalation:** The public registration endpoint unconditionally forces the `Policyholder` role. Staff accounts must be created by an Administrator.
4. **Risk Flag Safeguard:** Flagging a claim for fraud risk only prompts deeper review in the Investigator workspace; it does not automatically reject the claim.

---

## 4. Final Project Structure

```
insurance-claim-automation/
├── package.json                   # Root orchestrator scripts
├── .gitignore                     # Git ignore rules
├── .env.example                   # Root environment placeholders
├── API_DOCUMENTATION.md           # Complete REST API specification
├── README.md                      # Setup & operations guide
│
├── server/
│   ├── package.json               # Backend dependencies & Jest setup
│   ├── .env.example               # Backend environment template
│   ├── .env                       # Backend local configuration
│   ├── uploads/                   # Private document storage (not publicly served)
│   │   └── .gitkeep
│   └── src/
│       ├── app.js                 # Express app configuration & middleware
│       ├── server.js              # HTTP server entry point
│       ├── seed.js                # Database seeder for demo accounts & claims
│       ├── config/
│       │   ├── config.js          # App constants, roles, and status definitions
│       │   └── db.js              # MongoDB connector with auto-memory fallback
│       ├── models/
│       │   ├── User.js            # User model with bcrypt hashing
│       │   ├── Policy.js          # Policy model with coverage limits
│       │   ├── Claim.js           # Claim model with timeline & settlement
│       │   ├── Document.js        # Document metadata model
│       │   ├── Notification.js    # In-app notifications
│       │   └── AuditLog.js        # Immutable compliance audit log
│       ├── middleware/
│       │   ├── auth.js            # JWT verification & active status check
│       │   ├── role.js            # Role-based authorization middleware
│       │   ├── upload.js          # Multer storage & MIME/size filter
│       │   ├── validate.js        # Express-validator error handler
│       │   ├── rateLimiter.js     # Rate limiting configurations
│       │   └── errorHandler.js    # Centralized JSON error handler
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── claimController.js
│       │   ├── policyController.js
│       │   ├── documentController.js
│       │   ├── settlementController.js
│       │   ├── notificationController.js
│       │   ├── auditController.js
│       │   ├── dashboardController.js
│       │   └── adminController.js
│       ├── routes/                # Express router mounts
│       ├── services/
│       │   ├── claimWorkflowService.js
│       │   ├── auditService.js
│       │   └── notificationService.js
│       ├── validators/            # Request body schemas
│       └── tests/                 # Automated test suites
│           ├── testHelper.js
│           ├── auth.test.js
│           ├── claims.test.js
│           ├── workflow.test.js
│           ├── documents.test.js
│           └── dashboard_audit.test.js
│
└── client/
    ├── package.json               # Frontend dependencies & scripts
    ├── vite.config.js             # Vite configuration with API proxy
    ├── tailwind.config.js         # Tailwind styling tokens
    ├── postcss.config.js
    ├── index.html                 # App shell
    └── src/
        ├── main.jsx               # React DOM entry
        ├── App.jsx                # Router & role-guarded routes
        ├── hooks/
        │   └── useAuth.jsx        # Authentication & permission context
        ├── services/
        │   ├── api.js             # Axios instance with JWT interceptors
        │   ├── authService.js
        │   ├── claimService.js
        │   ├── policyService.js
        │   ├── documentService.js
        │   ├── notificationService.js
        │   └── adminService.js
        ├── components/
        │   ├── Navbar.jsx         # Header with notification dropdown & role chip
        │   ├── Sidebar.jsx        # Role-adaptive side navigation
        │   ├── ClaimStatusBadge.jsx
        │   ├── StatCard.jsx
        │   ├── TimelineView.jsx   # Visual audit trail
        │   ├── DocumentViewer.jsx # Private file downloads & upload modal
        │   ├── Modal.jsx
        │   ├── Alert.jsx
        │   └── LoadingSpinner.jsx
        ├── layouts/
        │   ├── MainLayout.jsx
        │   └── AuthLayout.jsx
        └── pages/
            ├── LoginPage.jsx      # Includes 1-click demo login buttons
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx  # Role-tailored metrics & quick actions
            ├── ClaimsListPage.jsx # Search, status/category filter, pagination
            ├── NewClaimPage.jsx   # Multi-field claim & file submission form
            ├── ClaimDetailPage.jsx# Complete claim dossier with action modals
            ├── PoliciesPage.jsx   # Active policy list with vehicle specs
            ├── NotificationsPage.jsx
            ├── AuditLogsPage.jsx  # Administrator audit trail
            ├── AdminUsersPage.jsx # Staff provisioning & role management
            └── NotFoundPage.jsx
```

---

## 5. Prerequisites & Environment Setup

### Required Runtimes
- **Node.js**: v18.0.0 or higher (Tested on Node v26.12.1)
- **npm**: v9.0.0 or higher (Tested on npm v11.20.0)

### MongoDB Options
1. **Zero-Config In-Memory Mode (Default Fallback)**:  
   If you do not have a local MongoDB instance running, the server automatically boots an in-memory MongoDB daemon (`mongodb-memory-server`) when `USE_MEMORY_DB_FALLBACK=true` (set by default in `.env`).
2. **Local MongoDB**:  
   If MongoDB is installed locally on default port 27017:
   ```bash
   brew services start mongodb-community
   ```
3. **MongoDB Atlas**:  
   Set `MONGODB_URI` in `server/.env` to your Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/insurance_db?retryWrites=true&w=majority
   ```

---

## 6. Installation & Execution Commands

### Step 1: Install Dependencies
From the repository root:
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```
*(Or individually: `cd server && npm install`, `cd ../client && npm install`)*

### Step 2: Seed the Database
Populate the database with all 6 demonstration roles, active motor policies, and sample claims across varied workflow stages:
```bash
npm run seed
```
*(Or from the server folder: `node src/seed.js`)*

### Step 3: Run the Application

#### Option A: Run Server and Client Concurrently
In Terminal 1 (Backend API on `http://localhost:5000`):
```bash
npm run dev:server
```

In Terminal 2 (React Frontend on `http://localhost:5173`):
```bash
npm run dev:client
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 7. Demonstration Login Credentials

All demonstration accounts are seeded with the password: **`Password123!`**  
*(Note: The login page also provides one-click quick-fill buttons for each role).*

| Role | Seeded Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Policyholder** | `policyholder@insurance.demo` | `Password123!` | File claims against Tesla & Toyota policies, track status, view settlements. |
| **Policyholder 2** | `jordan@insurance.demo` | `Password123!` | Used for cross-user privacy testing (Home insurance policy). |
| **Claims Officer** | `officer@insurance.demo` | `Password123!` | Intake queue, review claims, request missing info, flag fraud risk. |
| **Investigator** | `investigator@insurance.demo` | `Password123!` | Investigate flagged claims, upload findings, clear or uphold risk. |
| **Approver** | `approver@insurance.demo` | `Password123!` | Review claims, issue approvals with payout amounts or rejections. |
| **Finance Staff** | `finance@insurance.demo` | `Password123!` | Settlements desk, disburse funds, assign transaction references. |
| **Administrator** | `admin@insurance.demo` | `Password123!` | Manage users and roles, inspect compliance audit logs. |

---

## 8. Automated Test Execution & Results

Automated tests are located in `server/src/tests/` and cover all functional, security, and workflow requirements:

```bash
# Run backend tests
npm run test:server
```

### Real Execution Results:
```text
PASS src/tests/workflow.test.js
  ✓ should allow Claims Officer to move claim from Submitted to Under Review (42 ms)
  ✓ should block Policyholder from attempting an approval action with 403 Forbidden (21 ms)
  ✓ should reject invalid workflow transitions (e.g. Submitted -> Settled) with 400 Bad Request (18 ms)
  ✓ should allow Claims Officer to request missing info and set status to Needs Correction (28 ms)
  ✓ should allow Approver to approve an Under Review claim and advance to Settlement Pending (35 ms)
  ✓ should allow Approver to reject an Under Review claim with reason (24 ms)
  ✓ should forbid settlement before approval with 400 Bad Request (19 ms)
  ✓ should allow Finance Staff to settle an approved claim to Paid (38 ms)

PASS src/tests/claims.test.js
  ✓ should successfully submit a claim with valid data (34 ms)
  ✓ should reject claim submission with invalid/missing data (16 ms)
  ✓ should reject claim submission if incident date is in the future (15 ms)
  ✓ should forbid policyholder from claiming against another user’s policy (19 ms)
  ✓ should prevent Policyholder B from viewing Policyholder A’s claim (Strict Privacy Isolation) (22 ms)
  ✓ should allow authorized staff (Claims Officer) to view any claim (21 ms)

PASS src/tests/documents.test.js
  ✓ should reject upload request when no file is provided (18 ms)
  ✓ should reject invalid file types (e.g. .sh or unapproved executables) (17 ms)
  ✓ should successfully upload a valid document (e.g. PDF) (36 ms)
  ✓ should prevent user from downloading documents from another user’s claim (20 ms)

PASS src/tests/auth.test.js
  ✓ should successfully register a new policyholder with valid data (95 ms)
  ✓ should reject registration with invalid email or short password (14 ms)
  ✓ should prevent privilege escalation: public registration role parameter is strictly Policyholder (78 ms)
  ✓ should reject duplicate email registration with 409 Conflict (84 ms)
  ✓ should successfully log in with valid credentials (79 ms)
  ✓ should reject login with invalid password (76 ms)
  ✓ should reject login with non-existent email (12 ms)
  ✓ should return authenticated user profile at /api/auth/me (18 ms)
  ✓ should reject /api/auth/me request without token with 401 Unauthorized (9 ms)

PASS src/tests/dashboard_audit.test.js
  ✓ should return real dashboard statistics dynamically calculated from database records (32 ms)
  ✓ should verify audit history records are created when sensitive actions occur (41 ms)

Test Suites: 5 passed, 5 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        5.791 s
```

---

## 9. Production Build

To produce an optimized production bundle of the React frontend:
```bash
npm run build:client
```
The compiled output is located in `client/dist/`.

