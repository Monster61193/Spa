# Gemini's Project Context for Danae Spa

This document serves as a central place for me (Gemini) to track my understanding of the Danae Spa project, my planned tasks, and the changes I've made.

## 1. Project Overview

- **Purpose:** A comprehensive Spa Management System.
- **Architecture:** Monorepo containing a separate frontend and backend.
- **Live Directory:** `/Users/monster/Documents/Git/Spa/danae_spa_context`

## 2. Backend

- **Technology:** NestJS on Node.js.
- **Language:** TypeScript.
- **Directory:** `danae_spa_context/backend`
- **Database ORM:** Prisma.
- **Schema:** `danae_spa_context/backend/prisma/schema.prisma`.
- **Database:** PostgreSQL.
- **Structure:** Modular, with features like `appointments`, `inventory`, `services`, `auth`.

## 3. Frontend

- **Technology:** React.
- **Language:** TypeScript (.tsx).
- **Directory:** `danae_spa_context/frontend`
- **Build Tool:** Vite.
- **Structure:** Component-based, likely using React hooks and Context for state management.
- **API Communication:** `danae_spa_context/frontend/src/api/api_client.ts`.

## 4. Plan of Action

1.  **Backend Evaluation:**

    - [ ] Install dependencies (`npm install`).
    - [ ] Run linter and fix issues.
    - [ ] Run build and fix compilation errors.
    - [ ] Analyze `schema.prisma` for improvements.
    - [ ] Review modules for bugs or potential enhancements (e.g., add validation, logging, better error handling).
    - [ ] Add missing unit or integration tests.

2.  **Frontend Evaluation:**

    - [ ] Install dependencies (`npm install`).
    - [ ] Run linter and fix issues.
    - [ ] Run build and fix compilation errors.
    - [ ] Review components for improvements (e.g., UX, accessibility, performance).
    - [ ] Add missing tests.

3.  **Documentation:**
    - [ ] Update READMEs if necessary.
    - [ ] Ensure `.env.example` files are clear.

## Contexto actualizado

# Gemini's Project Context for Danae Spa

## 1. Project Status: SPRINT 1 COMPLETED ✅

- **Current Phase:** Transitioning to **Sprint 2: Operational Management**.
- **Backend:** Fully supports 1:N relations (Appointments <-> Services) with transactional closing.
- **Frontend:** `AppointmentForm` refactored to "Service Cart" model with real-time totals.
- **Database:** Schema migrated (`citas_servicios` table created).

## 2. Architecture & Rules (Ref: AGENTS.md)

- **Multi-tenancy:** Strict usage of `X-Branch-Id` in headers.
- **Code Style:** `snake_case` logic, `PascalCase` components, strict JSDoc.
- **Testing:** E2E (Playwright) + Integration (Vitest) required for new features.

## 3. Roadmap Progress

### ✅ SPRINT 1: FLEXIBILITY (Multi-Service)

- [x] **DB:** Refactor `schema.prisma` (Explicit M:N relation `CitaServicio`).
- [x] **Backend:** Update `AppointmentsService.agendar` to accept `servicios_ids[]`.
- [x] **Backend:** Update `AppointmentsService.cerrar` to deduct stock for multiple items.
- [x] **Frontend:** Refactor `AppointmentForm` to support dynamic service addition (Cart Pattern).

### 🚀 SPRINT 2: OPERATIONAL CONTROL (Next Up)

**Objective:** Empower receptionists to manage active appointments before payment.

- [ ] **UI:** Create "Appointment Details" Modal (View/Edit).
- [ ] **Backend:** Endpoint `PATCH /appointments/:id/items` to modify services in an open appointment.
- [ ] **Frontend:** Add "Edit" button in the dashboard table.

## 4. Technical Debt / Watchlist

- **Performance:** Monitor `AppointmentsService.listar` query time as history grows (consider pagination).
- **Inventory:** Currently, stock validation blocks the sale (Strict Mode). Discuss "Negative Stock" override for Admins.

### Contexto actualizado

# Gemini's Project Context for Danae Spa

## 1. Project Status: SPRINT 2 COMPLETED ✅

- **Current Phase:** Entering **Sprint 2.5: Catalog Management (Services & Inventory)**.
- **Strategic Pivot:** Prioritizing CRUD capabilities (Create/Read/Update/Delete) for Services and Inventory before Finance. This ensures the system is autonomous and doesn't rely on database seeding.
- **Recent Achievements:**
  - Full Appointment Lifecycle (Create -> Edit -> Cancel -> Close).
  - Robust Frontend Architecture (IoC Pattern, Centralized CSS, Smart Modals).
  - 100% Integration Test Coverage for critical flows.

## 2. Architecture & Rules (Ref: AGENTS.md)

- **Frontend Pattern:** "Smart Components" (Logic) vs "Presentational Components" (UI).
- **Styling:** No inline styles. Use `App.css` or component-specific CSS files.
- **State Management:** `React Query` handles server state; `Context API` handles global app state (Auth, Branch, Theme).
- **Testing:** Vitest + Testing Library required for new features.

## 3. Roadmap Progress

### ✅ SPRINT 1: FLEXIBILITY (Multi-Service)

- [x] **DB:** Refactor `schema.prisma` (Explicit M:N relation `CitaServicio`).
- [x] **Frontend:** Service Cart model.

### ✅ SPRINT 2: OPERATIONAL CONTROL (Completed)

- [x] **UI:** "Appointment Details" Modal with Read/Edit modes.
- [x] **Backend:** `PATCH /appointments/:id/items` & `POST /appointments/:id/cancel`.
- [x] **Frontend:** "Smart Editing" (Pre-fill services logic).
- [x] **Frontend:** Cancellation flow with reason validation.
- [x] **Refactor:** Replaced native alerts with Modals and consolidated CSS.
- [x] **QA:** Integration tests for Edit, Cancel, and Close flows.

### 🚀 SPRINT 2.5: CATALOG MANAGEMENT (Current Focus)

**Objective:** Allow Admins to create and manage Services and Inventory via UI.

**Backend:**

- [ ] **Services:** Implement `POST /services` (Create) and `PATCH /services/:id` (Update prices/duration).
- [ ] **Inventory:** Implement `POST /inventory` (New Material) and `PATCH /inventory/:id` (Adjust Stock/Restock).

**Frontend:**

- [ ] **Inventory:** Add "+ Nuevo Material" button and "Editar/Ajustar Stock" modal in `InventoryTable`.
- [ ] **Services:** Create a new "Catálogo de Servicios" view/modal to list and add services.

### 🔮 SPRINT 3: FINANCE & PROMOTIONS (On Deck)

**Objective:** Handle money correctly (Advance payments) and drive sales.

- [ ] **DB:** Add `anticipo` logic.
- [ ] **Backend:** Validate `Promociones` logic.
- [ ] **Frontend:** Add "Anticipo" field in AppointmentForm.
- [ ] **Frontend:** Show active promotions in Dashboard.

## 4. Technical Debt / Watchlist

- **Performance:** Monitor `AppointmentsService.listar` query time (Add pagination in Sprint 3).
- **Security:** Ensure `BranchGuard` is applied to new Catalog endpoints.
