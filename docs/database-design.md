# Database Design (PostgreSQL + Prisma)

## Core Entities
- **Organization**: tenant boundary
- **User**: individual account
- **Membership**: user ↔ organization membership
- **Team**: team within org
- **TeamMember**: user ↔ team membership
- **Project**: project within org
- **ProjectMember**: user ↔ project membership
- **Task**: unit of work
- **TaskDependency**: directed dependency edge between tasks
- **EventLog**: immutable audit of important changes
- **AIExplanation**: explainable AI outputs linked to events or objects

## Relationship Overview
- Organization has many Users (via Membership)
- Organization has many Teams and Projects
- Team has many Users (via TeamMember)
- Project has many Users (via ProjectMember)
- Project has many Tasks
- Task has many Dependencies (as `fromTaskId` and `toTaskId`)

## Suggested Schema (Prisma-Style)
- `Organization(id, name, createdAt)`
- `User(id, email, name, createdAt)`
- `Membership(id, orgId, userId, role, createdAt)`
- `Team(id, orgId, name, createdAt)`
- `TeamMember(id, teamId, userId, role, createdAt)`
- `Project(id, orgId, teamId?, name, status, startDate?, dueDate?, createdAt)`
- `ProjectMember(id, projectId, userId, role, createdAt)`
- `Task(id, projectId, assigneeId?, title, status, priority, estimateHours?, dueDate?, createdAt)`
- `TaskDependency(id, fromTaskId, toTaskId, type, createdAt)`
- `EventLog(id, orgId, actorId?, entityType, entityId, eventType, payload, createdAt)`
- `AIExplanation(id, orgId, entityType, entityId, eventId?, summary, rationale, evidence, confidence, createdAt)`

## Minimal Indexing Strategy (MVP)
- `Membership(orgId, userId)` unique
- `TeamMember(teamId, userId)` unique
- `ProjectMember(projectId, userId)` unique
- `Task(projectId, status)`
- `TaskDependency(fromTaskId, toTaskId)` unique
- `EventLog(orgId, createdAt)`
- `AIExplanation(entityType, entityId)`

## Multi-Tenancy
All entities are scoped to `orgId` and enforced in API layer. This enables SaaS scaling with clean separation and future billing.
