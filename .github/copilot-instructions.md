<!-- ExplanifyV2: Copilot Instructions for AI coding agents -->
# Explanify V2 — AI assistant guidance

Purpose
- Help an AI coding agent be productive quickly: architecture, key files, conventions, and dev workflows.

Big Picture (what to know first)
- Backend: Node + Express with Prisma for DB + an event bus and AI engines in `backend/src/ai/` (see `coordination-engine.js`, `explanation-engine.js`). Entry: `backend/src/server.js`.
- Frontend: Next.js App Router (TypeScript) in `frontend/` with modular `components/` and `app/` routes. UI logic lives under `frontend/components/` and domain hooks under `frontend/hooks/`.
- Data flow: Frontend calls REST endpoints (e.g. `/api/projects`, `/api/tasks`) implemented in `backend/src/modules/*` → services → repositories → Prisma schema `backend/prisma/schema.prisma`.

Key places to read
- Backend AI & events: `backend/src/ai/`, `backend/src/events/`, `backend/src/services/`.
- Projects & RBAC: `backend/src/modules/projects/` (routes, services, repositories) and `backend/prisma/schema.prisma` for relations (Organization, Team, User, Role).
- Project UI: `frontend/components/projects/`, `frontend/services/project.service.ts`, `frontend/hooks/use-projects.ts`.
- Prisma client: `backend/generated/prisma/client.ts` (use repositories to access DB; avoid ad hoc client usage).

Dev and run commands (local)
- Backend (dev): from `backend/` run `npm run dev` (uses `nodemon src/server.js`).
- Frontend (dev): from `frontend/` run `npm run dev` (Next.js app router, opens on :3000).

Project-specific conventions
- Keep controllers thin; place business logic in `services/` and DB access in `repositories`.
- Events are first-class: emit events from services, handle in `src/events/` (do not block HTTP requests on long AI work — enqueue or emit asynchronously).
- Use Zod for input validation in modules.
- File naming: `kebab-case.js/ts`, functions `camelCase`, events `PascalCase` strings.

RBAC, Projects, and UI guidance (concrete)
- When changing project creation UI: respect RBAC and backend ownership. Project Lead and Team are modeled in DB; always consult `backend/prisma/schema.prisma` and `backend/src/modules/projects/service.js` (or `.ts`) for required payload shape.
- Project creation API expects minimal, backend-completed fields. Do not add client-only fields that conflict with server defaults (Organization, Status, Health, Progress, createdBy, createdAt are set server-side).
- For Project Lead dropdown: query members for a team via `frontend/services/project.service.ts` API or existing team-members endpoint — default option should be `Unassigned` if none.
- Team IDs are generated server-side; UI should display them read-only (e.g. `Team ID: #4827`) and not allow manual editing.

AI Coordination compatibility
- Preserve structure for coordination engine: tasks include `isBlocked`, `blockingTasks`, and `coordinationReason`. When adding fields, ensure backward-compatible JSON shape for engines in `backend/src/ai/` and events in `backend/src/events/`.

Testing & debugging notes
- Backend: use `npm run dev` with `nodemon` to get live reloads. Keep `.env` up-to-date (`DATABASE_URL`, `JWT_SECRET`).
- Frontend: Next dev server supports hot reload. Use browser console and network tab to inspect API calls to `/api/projects` and `/api/tasks`.

What to avoid
- Don't add enterprise-style bulk config to the primary create forms; follow the compact UX approach in `frontend/components/tasks/CreateTask` for pattern and spacing.
- Don't hardcode Team IDs or bypass repository-level Prisma access.

If you modify or add endpoints
- Update `backend/src/routes/` to mount new routes.
- Add Zod input schemas and emit appropriate events from services so AI engines and event logs see changes.

If unclear or missing
- Open a PR with a short description and reference these files. Ask reviewers to pointer to the exact service/repository if unsure.

Questions? Ask me where to find a specific module (projects, teams, AI engine). Provide the file you plan to edit and I will outline exact integration points.
