# Explanify V2 Backend Architecture

This backend is designed as a modular, AI-native SaaS platform with clean separation between API, domain logic, events, and AI coordination.

## Folder Structure (Purpose + Responsibility + Scalability)

```
src/
├── config/
├── modules/
├── services/
├── middleware/
├── ai/
├── events/
├── routes/
├── utils/
├── lib/
└── server.js
```

### `src/config/`
- **Purpose**: Centralized environment and configuration loading.
- **Responsibilities**: Env validation, runtime settings, feature flags.
- **Scalability role**: Enables consistent behavior across environments and microservices.

### `src/modules/`
- **Purpose**: Feature modules by domain boundary.
- **Responsibilities**: Routes, controllers, services, repositories per feature.
- **Scalability role**: Allows independent feature growth and easier team ownership.

### `src/services/`
- **Purpose**: Cross-cutting domain services.
- **Responsibilities**: Event logging, notification orchestration, coordination logic.
- **Scalability role**: Central place for reusable business logic used by modules.

### `src/middleware/`
- **Purpose**: Express middleware stack.
- **Responsibilities**: Auth, request IDs, error handling, validation.
- **Scalability role**: Consistent request processing across all modules.

### `src/ai/`
- **Purpose**: AI coordination engines and explainability logic.
- **Responsibilities**: Risk prediction, explanation generation, model orchestration.
- **Scalability role**: Keeps AI systems isolated and maintainable.

### `src/events/`
- **Purpose**: Event-driven workflow orchestration.
- **Responsibilities**: Event bus, event types, handlers, dispatchers.
- **Scalability role**: Enables async processing and future queue adoption.

### `src/routes/`
- **Purpose**: API route composition.
- **Responsibilities**: Mount module routers, health endpoints.
- **Scalability role**: Centralized API surface composition.

### `src/utils/`
- **Purpose**: Small helpers and shared utilities.
- **Responsibilities**: Async handlers, data transforms, shared logic.
- **Scalability role**: Prevents duplication across modules.

### `src/lib/`
- **Purpose**: SDKs and external clients.
- **Responsibilities**: Prisma client, OpenAI client, integrations SDKs.
- **Scalability role**: Encapsulates dependencies and allows easy swap.

### `src/server.js`
- **Purpose**: Runtime entrypoint.
- **Responsibilities**: Bootstraps HTTP server.
- **Scalability role**: Keeps infra bootstrapping minimal.

## Module Organization (MVP)
Each module uses a consistent structure:

```
modules/<feature>/
├── routes.js
├── controller.js
├── service.js
└── repository.js
```

MVP modules:
- `users`
- `organizations`
- `teams`
- `projects`
- `tasks`
- `ai-explanations`
- `notifications`

## Recommended Naming Conventions
- **Files**: `kebab-case.js`
- **Functions**: `camelCase`
- **Classes** (if needed): `PascalCase`
- **Events**: `PascalCase` string values (e.g., `TaskUpdated`)
- **Routes**: plural nouns (`/projects`, `/tasks`)
- **Env vars**: `UPPER_SNAKE_CASE`

## Express App Initialization Flow
1. Load env config and validate
2. Create Express instance
3. Register middleware
4. Register event handlers
5. Mount routes
6. Attach error handler
7. Start server

## Request Lifecycle Architecture
1. **Request enters** via `server.js` → `app.js`
2. **Middleware** runs (CORS, JSON parsing, request ID, auth)
3. **Routes** dispatch to module controllers
4. **Controllers** call services
5. **Services** orchestrate business logic and emit events
6. **Repositories** access Prisma data layer
7. **Responses** returned and errors handled centrally

## Event Processing Lifecycle
1. **Event emitted** from modules/services
2. **Event bus** receives event type + payload
3. **Handlers** trigger coordination + AI explanation processing
4. **Event log** persists audit trail
5. **Notifications** triggered based on risk/blocker signals

## AI Coordination Pipeline Overview
1. **Ingest project events** (task changes, dependencies, PR updates)
2. **Build dependency graph** and compute critical path
3. **Detect blockers** and idle/overloaded contributors
4. **Predict delays** and generate risk scores
5. **Generate explanations** with rationale and evidence
6. **Recommend actions** (reassign, split tasks, adjust scope)

## Best Practices (Express + Prisma)
- Keep controllers thin; move logic to services
- Use repositories as the only Prisma access point
- Validate inputs with Zod per module
- Use event-driven workflows for AI processing
- Keep AI calls async and decoupled
- Maintain an immutable event log

## Local Run
Requires `DATABASE_URL`, `JWT_SECRET`, and `PORT` in `.env`.

```powershell
npm run dev
```

## Future-Proofing
- Swap event bus with queue (BullMQ, Kafka, or RabbitMQ)
- Add integration modules under `src/modules/integrations/`
- Add read-optimized projections for dashboards
- Introduce workflow engine for recovery plans
