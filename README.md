# Ckouetchua-87342 — Multitenant Task Manager (Nx Monorepo)

A **multitenant task management system** built with **Nx**, **NestJS**, and **Angular**.

This project demonstrates:
- Organization-based multitenancy with hierarchy
- Role-based access control (RBAC) with inheritance
- JWT authentication with refresh tokens
- Shared frontend/backend contracts
- Swagger API documentation
- Seeded demo data for local testing
- Local and Docker-based development workflows

## 🚀 Run the Project (Local Development)

### Prerequisites
- Node.js (LTS recommended)
- npm
- Docker (optional)

### Install dependencies
```bash
npm install
```

### Run the API (NestJS)
```bash
npx nx serve api
```

### Run the dashboard (Angular)
```bash
npx nx serve dashboard
```

* Dashboard: `http://localhost:4200`
* Swagger documentation: `http://localhost:3000/swagger`

## 🧪 Tests

### Backend (API) — Jest + Supertest (e2e)
```bash
npx nx test api
npx nx run api:e2e
```

### Frontend(Dashboard) — Jest + Karma
```bash
npx nx test dashboard
npx nx run dashboard:test:karma
```

### Dashboard E2E — Cypress
```bash
nxp nx e2e dashboard-e2e
```

## 🔑 Seeded Demo Accounts (For Local Testing)

The API includes a **development seed file** that automatically populates the database with
organizations, users, and tasks when the API starts in development mode.

This allows you to immediately test:
- Multitenancy boundaries
- Parent → child organization visibility
- Role-based access control
- Permissions and audit logging
- UI behavior across different roles

### Demo Password
All seeded users share the same password:

```text
password123
```

### Organization Structure Created by the Seed

The seed creates multiple parent organizations, each with multiple child organizations.

Example:

* Alpha (Parent)
* Alpha A (Child)
* Alpha B (Child)
* Alpha C (Child)

* Beta (Parent)
* Beta A (Child)
* Beta B (Child)

* Gamma (Parent)
* Gamma A (Child)
* Gamma B (Child)

This structure is designed to make tenant boundaries and hierarchy behavior obvious when testing.

#### Recommended Accounts to Test Multitenancy

Alpha — Parent Admin (Model A)
```text
admin@alpha-parent.com
```
Role: `ADMIN`
Org: Alpha (Parent)
* Can see tasks from Alpha A, Alpha B, Alpha C
* Cannot see Beta or Gamma data

#### Alpha A — Child Organization
```text
owner@alpha-a.com   (OWNER)
admin@alpha-a.com   (ADMIN)
viewer@alpha-a.com  (VIEWER)
```


Behavior:
* All users only see Alpha A tasks
* OWNER and ADMIN can create/update/delete
* VIEWER is read-only

#### Alpha B — Child Organization
```text
owner@alpha-b.com
admin@alpha-b.com
viewer@alpha-b.com
```

Used to verify:

* Sibling org isolation
* Parent admin visibility vs child user isolation

#### Beta — Tenant Isolation
```text
admin@beta-parent.com
owner@beta-a.com
admin@beta-a.com
viewer@beta-a.com
```


Used to confirm:
* Beta users cannot see Alpha or Gamma data
* Tenant isolation is enforced at the API level

#### Gamma — Additional Tenant
```text
admin@gamma-parent.com
owner@gamma-a.com
admin@gamma-a.com
viewer@gamma-a.com
```

#### Seeded Tasks

Each child organization has multiple tasks with:
* Different statuses (TODO, IN_PROGRESS, DONE)
* Different categories (Work, Personal)
* Different due dates

This allows you to test:

* Task visibility by tenant

* Role-based write access

* Sorting and drag-and-drop behavior

* Dashboard filtering and grouping

* Where the Seed Lives

The seed logic is implemented in:
```bash
apps/api/src/app/dev-seed.ts
```


It runs automatically on API startup in development mode and is idempotent
(it will not reseed if data already exists).

To reset the seed:
1. Stop the API
2. Delete dev.sqlite
3. Restart the API

## 📦 Nx Monorepo Layout

This repository is an **Nx workspace** containing both the backend and frontend, plus shared libraries.

```text
apps/
  api/              NestJS backend (REST + Swagger + tenant scoping)
  dashboard/        Angular frontend (task board UI)
  dashboard-e2e/    Cypress end-to-end tests for the dashboard

libs/
  data/             Shared DTOs, enums, and interfaces (API ↔ UI contract)
  auth/             Shared RBAC logic (permissions, inheritance, decorators/guards)
```

## 🏗 Architecture Overview

The system is designed as a **tenant-aware, role-secured application** where all data access
is scoped by organization and enforced consistently across the API.

### Multitenancy Model (Model A – Hierarchical Orgs)

We use a **two-level organization hierarchy**:

- **Parent organizations**
- **Child organizations**

Rules:

- Every **user** belongs to exactly one organization
- Every **task** belongs to exactly one organization
- Parent-org users can access their own org **and all child orgs**
- Child-org users can access **only their own org**
- No access is allowed across different parent org trees

This model matches common SaaS patterns where a parent company manages multiple teams
or departments.

---

### Tenant Resolution (Per Request)

Tenant scoping is enforced **at request time** via middleware:

1. The middleware reads the `Authorization` header
2. The JWT access token is verified
3. The user’s organization is loaded
4. A list of `accessibleOrgIds` is computed:
   - Child user → `[childOrgId]`
   - Parent user → `[parentOrgId, ...childOrgIds]`
5. The following objects are attached to the request:
   - `req.authUser`
   - `req.tenant`

All downstream services rely on this resolved context.

---

### Data Access Enforcement

All database queries are scoped using:

- `orgId IN accessibleOrgIds`

This guarantees:

- Hard tenant isolation
- No accidental cross-tenant data leaks
- Simple, consistent enforcement across services

The frontend never controls tenant scope — it is always enforced by the API.

---

### Separation of Concerns

- **Middleware**: authentication + tenant resolution
- **Guards**: permission enforcement
- **Services**: business logic + scoped queries
- **Controllers**: HTTP + DTO validation
- **Shared libs**: permissions, roles, DTOs

This separation keeps the system predictable and easy to reason about.

## 🔐 Roles, Permissions, and Access Control

Access control in the system is implemented using **role-based access control (RBAC)** with
**explicit permissions** and **role inheritance**.

### Roles

The system defines three roles:

- **OWNER**
- **ADMIN**
- **VIEWER**

Each user has exactly one role within their organization.

---

### Role Inheritance

Roles inherit permissions from lower roles:

```text
OWNDER -> ADMIN -> VIEWER
```


This means:

- OWNER has all ADMIN and VIEWER permissions
- ADMIN has all VIEWER permissions
- VIEWER has only read-level permissions

Inheritance is implemented centrally in `libs/auth` to ensure consistency.

---

### Permissions

Permissions are defined explicitly and mapped to roles. Examples include:

- `task:create`
- `task:read`
- `task:update`
- `task:delete`
- `audit:read`

Permissions are represented as enums in `libs/data` and shared across frontend and backend.

---

### Enforcement Strategy

Access control is enforced in multiple layers:

1. **Middleware**
   - Resolves user identity and tenant scope from JWT
   - Attaches `req.authUser` and `req.tenant`

2. **Permission Guard**
   - Reads required permissions via `@RequirePermission()`
   - Validates the user’s role against the permission matrix

3. **Service-Level Checks**
   - Enforces tenant scope using `accessibleOrgIds`
   - Prevents cross-tenant access even if permissions are valid

This layered approach ensures both **who** and **what** are validated for every request.

---

### Why This Design?

- Permissions are explicit and testable
- Roles can evolve without rewriting controllers
- Shared RBAC logic avoids duplication
- Tenant safety is guaranteed even if a guard is misused

## 🏢 Organization Hierarchy & Multitenancy Model

The system is designed around **strict multitenancy**, with support for **organization hierarchies**.
This allows parent organizations to manage or view data across child organizations while
preserving tenant isolation.

---

### Organization Structure

Organizations form a **two-level hierarchy**:

- **Parent Organization**
- **Child Organization(s)**

Each organization record includes:

- `id`
- `name`
- `parentOrgId` (nullable)

If `parentOrgId` is `NULL`, the org is a **parent**.
If `parentOrgId` is set, the org is a **child**.

---

### User-to-Organization Relationship

- Each user belongs to **exactly one organization**
- Users do **not** belong directly to parents and children simultaneously
- Parent access is inferred dynamically (not duplicated in the database)

Example:

- `admin@alpha-parent.com` belongs to **Alpha (Parent)**
- That admin can access **Alpha A**, **Alpha B**, **Alpha C**
- A child user (e.g. `owner@alpha-a.com`) can only access **Alpha A**

---

### Tenant Resolution Flow

Tenant resolution happens **before controllers are reached**:

1. **JWT is validated**
2. User’s `orgId` is extracted
3. Organization is loaded from the database
4. Accessible organizations are computed:
   - Child org → access to itself only
   - Parent org → access to itself + all children
5. Tenant context is attached to the request:
   ```ts
   req.tenant = {
     orgId,
     accessibleOrgIds,
     isParentOrg,
   }
    ```
This context is then reused across guards and services


#### Data Isolation Guarantee
All database queries that return tenant data:
* Are filtered using `orgId IN (:...accessibleOrgIds)`
* Never trust client-provided organization identifiers
* Always derive scope from the authenticated user

This ensures:
* No cross-tenant reads
* No cross-tenant writes
* No privilege escalation via API payloads

#### Why this model works well
* Simple schema (no join tables for hierarchy)
* Strong isolation by default
* Parent visibility without data duplication
* Easy to extend to deeper hierarchies later

This design balances security, clarity and scalability while keeping queries efficient.

## 🔐 Authentication, JWT & Access Control

The platform uses **JWT-based authentication** combined with **role-based access control (RBAC)** and
**tenant-aware scoping** to ensure security and correctness across organizations.

---

### Authentication Flow

1. User logs in via:
```text
POST /auth/login
```

2. Credentials are validated against stored password hashes
3. 2 tokens are issued:
- **Access Token** (short-lived)
- **Refresh Token** (long-lived)

Example login response:
```bash
{
"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Tokens are stored client-side and attached to requests via:
```text
Authorization: Bearer <accessToken>
```

No database lookup is required to determine:
- Organization
- Role
- Access scope

Every request (except public routes) passes through the `TenantContextMiddleware`

Responsibilities:
- Validate access token
- Resolve organization scope
- Attach tenant + user context to the request

#### Permission Guard

Controllers declare required permissions using decorators.

The `PermissionGuard`:

1. Reads required permission metadata
2. Extracts role from req.authUser
3. Evaluates permission via centralized RBAC logic
4. Throws 403 Forbidden if insufficient

This ensures:

* Controllers stay declarative
* Authorization logic is centralized
* Permissions are easy to audit and extend

#### Why This Design Is Strong

* No trust in client-supplied org data
* JWTs are self-contained and fast
* Middleware handles tenancy once
* Guards handle authorization consistently

This approach scales well and avoids common multitenancy security pitfalls.

## 🧩 Multitenancy & Organization Hierarchy

The system is **organization-first** and fully tenant-aware.

### Organization Model
- Organizations can be **parents** or **children**
- Users belong to exactly **one org**
- Parent org admins can access **all child org data**
- Child org users are strictly isolated

### Access Scope Resolution
At request time:
- Child org → access only its own `orgId`
- Parent org → access `[parentOrgId + all child orgIds]`

This scope is computed once in middleware and reused everywhere.

---

## 📦 Data Models (High Level)

### User
- `id`
- `email`
- `passwordHash`
- `orgId`
- `role`

### Organization
- `id`
- `name`
- `parentOrgId` (nullable)

### Task
- `id`
- `orgId`
- `createdByUserId`
- `title`
- `description`
- `category`
- `status` (`TODO | IN_PROGRESS | DONE`)
- `order`
- `dueDate`
- timestamps

All queries are always scoped by `orgId IN accessibleOrgIds`.

---

## 🌱 Database Seeding

A **development seed** runs automatically on app start.

What it creates:
- Multiple parent orgs (Alpha, Beta, Gamma)
- Multiple child orgs per parent
- Users for each org (OWNER / ADMIN / VIEWER)
- Tasks distributed across orgs

Why:
- Makes multitenancy easy to test
- No manual setup required
- Safe idempotent upserts

Credentials:
`password123`


---

## 📚 API Endpoints (Summary)

### Auth
- `POST /auth/login`
- `POST /auth/refresh`

### Tasks
- `GET /tasks`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`

*Audit Trails can be seen in the console - for simplicity sake*

They are usually of this format(sample audit trail):
```bash
 [AUDIT] {                                                                                                      
    id: '9053a887-3462-44c0-83e1-be9fdacacf20',                                                                  
    at: '2026-02-04T16:11:04.694Z',                                                                             
    userId: '21a169a5-f0c7-4dc0-a36e-432f5464b2cd',                                                              
    orgId: '6d77082e-dd0e-4de4-81be-28be712e6883',                                                               
    method: 'GET',                                                                                              
    path: '/tasks',
    action: 'GET /tasks',                                 
    allowed: true                                     
}      
```

All task endpoints are tenant-scoped automatically.

---

## 📖 Swagger / API Docs

Swagger is enabled in development.

Visit: `http://localhost:3000/swagger`

---

## 🧠 Shared Libraries

### `@ckouetchua-87342/data`
- DTOs
- Enums
- Shared models
- Permission definitions

### `@ckouetchua-87342/auth`
- Permission decorators
- RBAC logic
- Guards

Benefits:
- Single source of truth
- Backend & frontend stay in sync
- Safer refactors

---

## 🔮 Future Considerations

- Advanced role delegation per org
- Fine-grained permissions per resource
- CSRF protection for refresh tokens
- RBAC decision caching
- Auditing + activity logs
- Horizontal scaling with stateless auth

---

## ✅ Summary

This project demonstrates:
- Clean Nx monorepo architecture
- Real multitenancy (not just filtering)
- Secure JWT-based auth
- Centralized RBAC
- Scalable backend patterns

Built to grow without rewrites.
