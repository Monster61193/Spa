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

## 1. Project Status: MVP + Sprint 1 (Backend Ready)

- **Current Phase:** Sprint 1 - Multi-service Appointments.
- **Backend:** Refactoring completed. `CitaServicio` introduced. Logic supports N items per appointment.
- **Frontend:** Pending update. `AppointmentForm` still selects a single service.
- **Database:** PostgreSQL schema migrated to 1:N relation for Appointments <-> Services.

## 2. Architecture & Rules (Ref: AGENTS.md)

- **Multi-tenancy:** strict usage of `X-Branch-Id`.
- **Code Style:** `snake_case` for logic, `PascalCase` for components. JSDoc required.
- **Resilience:** Graceful degradation (Mocks) if DB fails on read operations.

## 3. Plan of Action (Updated)

### Completed Tasks

- [x] **Backend:** Schema refactor (1:N Citas-Servicios).
- [x] **Backend:** Update `AppointmentsService` (agendar/cerrar) for multi-services.
- [x] **Backend:** Update `AppointmentsController` with Zod array validation.
- [x] **Testing:** Backend Unit tests adapted for nested service structure.

### Pending Tasks (Next Steps)

1.  **Frontend Refactor (Critical):**
    - [ ] Update `AppointmentForm.tsx` to handle an array of services (Dynamic inputs or Multi-select).
    - [ ] Update `use_appointments.ts` hook if response structure changed significantly.
    - [ ] Verify `AppointmentForm.spec.tsx`.
2.  **Documentation:**
    - [ ] Verify `context/api_contracts.md` reflects the new payload shape.

## 4. Technical Debt / Watchlist

- Ensure `ServicesService.catalogo` is performant if the list grows.
- Review `InventoryService` logic: currently, if _one_ material is missing, the whole transaction fails (Intended behavior for consistency).
