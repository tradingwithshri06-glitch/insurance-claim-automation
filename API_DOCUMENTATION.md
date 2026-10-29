# InsurFlow — API Documentation

Comprehensive REST API reference for the **Insurance Claim Automation System**.

## Base URL
- Local Development: `http://localhost:5000/api`
- Content Type: `application/json` (except document upload which uses `multipart/form-data`)
- Authentication: Standard HTTP Bearer Token header:
  ```http
  Authorization: Bearer <jwt_token>
  ```

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Public Policyholder Registration
- **Endpoint**: `POST /api/auth/register`
- **Rate Limit**: 30 req / 15 min
- **Access**: Public
- **Security Control**: The `role` field is strictly ignored if passed; public accounts are unconditionally created as `Policyholder`.
- **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "Password123!",
    "phone": "+1 (555) 019-2831",
    "address": "123 Maple Street, City, State"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "message": "Account successfully registered.",
      "token": "eyJhbGciOi...",
      "user": {
        "id": "662f...",
        "fullName": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "Policyholder"
      }
    }
    ```
  - `400 Bad Request`: Field validation error (e.g. invalid email, short password)
  - `409 Conflict`: Email address already registered

### 1.2 User Login
- **Endpoint**: `POST /api/auth/login`
- **Rate Limit**: 30 req / 15 min
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "policyholder@insurance.demo",
    "password": "Password123!"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "token": "eyJhbGciOi...",
      "user": {
        "id": "662f...",
        "fullName": "Alex Morgan",
        "email": "policyholder@insurance.demo",
        "role": "Policyholder"
      }
    }
    ```
  - `401 Unauthorized`: Invalid credentials
  - `403 Forbidden`: Account suspended

### 1.3 Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated (Any active role)
- **Responses**:
  - `200 OK`: Returns current user details.

---

## 2. Policy Endpoints (`/api/policies`)

### 2.1 List Policies
- **Endpoint**: `GET /api/policies`
- **Access**: Authenticated
  - **Policyholder**: Returns only policies owned by the authenticated policyholder.
  - **Staff / Admin**: Returns all policies in the system.
- **Responses**:
  - `200 OK`: `{ "success": true, "count": 2, "policies": [...] }`

### 2.2 Get Single Policy
- **Endpoint**: `GET /api/policies/:id`
- **Access**: Policyholder (own policy only) or Staff / Admin
- **Responses**:
  - `200 OK`: Policy object
  - `403 Forbidden`: Attempting to access another policyholder's policy
  - `404 Not Found`: Policy not found

---

## 3. Claim Endpoints (`/api/claims`)

### 3.1 List Claims with Search and Filters
- **Endpoint**: `GET /api/claims`
- **Access**: Authenticated
  - **Policyholder**: Filter automatically locked to `{ policyholderId: req.user._id }`.
  - **Staff**: Full access to search across all policyholders.
- **Query Parameters**:
  - `status`: `Submitted | Under Review | Needs Correction | Under Investigation | Approved | Rejected | Settlement Pending | Settled | Closed`
  - `category`: `Motor Insurance | Home & Property Insurance | ...`
  - `search`: Keywords matching reference or location
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "total": 6,
      "page": 1,
      "pages": 1,
      "claims": [...]
    }
    ```

### 3.2 Get Claim by ID
- **Endpoint**: `GET /api/claims/:id`
- **Access**: Policyholder (own claims strictly) or Staff / Admin
- **Privacy Enforcement**: Returns `403 Forbidden` if policyholder attempts to access a claim belonging to another user.
- **Responses**:
  - `200 OK`: Full populated claim object including timeline and settlement details
  - `403 Forbidden`: Access denied
  - `404 Not Found`: Record not found

### 3.3 Submit New Claim
- **Endpoint**: `POST /api/claims`
- **Access**: Policyholder, Administrator
- **Request Body**:
  ```json
  {
    "policyId": "662f...",
    "category": "Motor Insurance",
    "incidentDate": "2026-10-15",
    "incidentLocation": "Interstate 80 East, Sacramento, CA",
    "incidentDescription": "Rear bumper collision in slow-moving traffic.",
    "claimedAmount": 3450.00
  }
  ```
- **Validation**:
  - `policyId`: Must belong to authenticated user and be in `Active` status.
  - `incidentDate`: Cannot be in the future.
  - `claimedAmount`: Must be > 0.
- **Responses**:
  - `201 Created`: Newly created claim with status `Submitted` and reference `CLM-2026-XXXX`.

### 3.4 Workflow Status Transition
- **Endpoint**: `PATCH /api/claims/:id/status`
- **Access**: Role-restricted per state transition matrix
- **Request Body**:
  ```json
  {
    "status": "Under Review",
    "comment": "Assigned to claims officer desk for initial check."
  }
  ```
- **Validation**: Enforces state machine rules; rejects invalid transitions with `400 Bad Request`.

### 3.5 Request Missing Information
- **Endpoint**: `POST /api/claims/:id/request-info`
- **Access**: Claims Officer, Administrator
- **Allowed Pre-Status**: `Under Review`
- **Target Status**: `Needs Correction`
- **Request Body**:
  ```json
  {
    "missingInfoRequested": "Please provide an itemized repair estimate from an authorized garage."
  }
  ```

### 3.6 Flag for Fraud Risk Investigation
- **Endpoint**: `POST /api/claims/:id/flag`
- **Access**: Claims Officer, Investigator, Administrator
- **Allowed Pre-Status**: `Under Review`
- **Target Status**: `Under Investigation`
- **Request Body**:
  ```json
  {
    "reason": "Estimated repair costs exceed standard labor matrix by 60%."
  }
  ```
- **Note**: Does not auto-reject the claim; transfers to the Special Investigations workspace.

### 3.7 Submit Investigation Findings
- **Endpoint**: `POST /api/claims/:id/findings`
- **Access**: Investigator, Administrator
- **Allowed Pre-Status**: `Under Investigation`
- **Target Status**: `Under Review`
- **Request Body**:
  ```json
  {
    "findings": "Physical site visit confirmed alignment damage matches incident report.",
    "clearFlag": true
  }
  ```

### 3.8 Adjudication Decision (Approve or Reject)
- **Endpoint**: `POST /api/claims/:id/decision`
- **Access**: Approver, Administrator
- **Allowed Pre-Status**: `Under Review`
- **Request Body (Approve)**:
  ```json
  {
    "decision": "APPROVE",
    "approvedAmount": 2800.00,
    "decisionReason": "Approved per collision schedule minus $250 deductible."
  }
  ```
- **Request Body (Reject)**:
  ```json
  {
    "decision": "REJECT",
    "decisionReason": "Damage excluded under Section 4.2 racing exclusions."
  }
  ```
- **Responses**:
  - `200 OK`: Updated claim record. If approved, status transitions through `Approved` to `Settlement Pending`.

### 3.9 Settlement Update
- **Endpoint**: `PATCH /api/claims/:id/settlement`
- **Access**: Finance Staff, Administrator
- **Validation Rule**: A claim cannot be settled before approval. Attempting settlement on an unapproved claim returns `400 Bad Request`.
- **Request Body**:
  ```json
  {
    "status": "Paid",
    "transactionReference": "SIM-WIRE-20261028-99812",
    "paymentMethod": "Direct Deposit"
  }
  ```
- **Responses**:
  - `200 OK`: Transitions claim to `Settled` and logs financial disbursement.

---

## 4. Document Endpoints (`/api/documents`)

### 4.1 Secure Document Upload
- **Endpoint**: `POST /api/documents/upload`
- **Access**: Authenticated (Policyholder for own claims, or Staff)
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Binary file (PDF, PNG, JPG, JPEG, WEBP; max 5MB)
  - `claimId`: Associated Claim ID
  - `documentType`: Category of document
  - `notes`: Optional description
- **Storage**: Stored in a private, non-public directory using randomized UUID filenames.

### 4.2 List Claim Documents
- **Endpoint**: `GET /api/documents/claim/:claimId`
- **Access**: Authenticated (Policyholder for own claims, or Staff)
- **Responses**: `200 OK`: Array of document metadata.

### 4.3 Secure Document Download / Stream
- **Endpoint**: `GET /api/documents/:id/download`
- **Access**: Authenticated (Policyholder for own claims, or Staff)
- **Privacy Enforcement**: Prevents cross-user downloads with `403 Forbidden`.
- **Response**: File binary stream with `Content-Type` and `Content-Disposition`.

### 4.4 Verify Document
- **Endpoint**: `PATCH /api/documents/:id/verify`
- **Access**: Claims Officer, Administrator
- **Request Body**: `{ "isVerified": true, "notes": "Verified against state blotter" }`

---

## 5. Dashboard Endpoints (`/api/dashboard`)

### 5.1 Real Aggregated Metrics
- **Endpoint**: `GET /api/dashboard/stats`
- **Access**: Authenticated
  - **Policyholder**: Calculates totals and distributions scoped strictly to own claims.
  - **Staff / Admin**: Calculates system-wide metrics across all records.
- **Query Parameters**:
  - `category`: Optional insurance category filter
  - `startDate`, `endDate`: Optional date ranges
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "stats": {
        "totalClaims": 7,
        "submitted": 1,
        "underReview": 1,
        "needsCorrection": 1,
        "underInvestigation": 1,
        "approved": 0,
        "rejected": 1,
        "settlementPending": 1,
        "settled": 2,
        "awaitingSettlement": 1,
        "flaggedClaims": 1,
        "totalClaimedAmount": 47600,
        "totalSettledAmount": 1900,
        "recentActivity": [...]
      }
    }
    ```

---

## 6. Audit & Admin Endpoints (`/api/audit`, `/api/admin`)

### 6.1 Query Audit Logs
- **Endpoint**: `GET /api/audit`
- **Access**: Administrator
- **Query Parameters**: `action`, `resourceType`, `userEmail`, `page`, `limit`
- **Responses**: `200 OK`: Array of audit events.

### 6.2 Admin User Management
- **`GET /api/admin/users`**: List all users with pagination and role filters (Admin only).
- **`POST /api/admin/users`**: Create staff accounts with any role (Admin only).
- **`PATCH /api/admin/users/:id/role`**: Modify role or toggle status between Active and Suspended (Admin only).
- **`GET /api/admin/settings`**: System parameters and demonstration flags.

