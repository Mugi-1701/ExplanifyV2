# System Architecture

## High-Level Product Architecture
Explanify V2 operates as an AI-native coordination layer that listens to project events, builds dependency intelligence, and delivers explainable recommendations through the tools teams already use.

**Primary Components**
- **Frontend (React + Vite)**: dashboards, project graph views, risk explanations, workload balancing insights
- **Backend API (Node.js + Express)**: modular services for auth, orgs, teams, projects, tasks, dependencies, and AI coordination
- **AI Coordination Service (OpenAI API)**: reasoning and explanation generation with traceable inputs
- **Event Bus**: internal pub/sub for task updates, dependency changes, and risk recalculations
- **Integration Layer**: GitHub, VS Code, Figma (MVP: GitHub + manual inputs)
- **Data Layer (PostgreSQL + Prisma)**: multi-tenant, auditable state with event logs

## Event-Driven System Design
- **Event Sources**: task updates, dependency changes, PR merges, issue status changes
- **Event Types**: `TaskCreated`, `TaskUpdated`, `DependencyAdded`, `BlockerDetected`, `RiskScoreUpdated`
- **Consumers**: coordination engine, notification service, AI reasoning pipeline
- **Benefits**: decoupled services, scalable processing, clear audit trail

## Backend Architecture (Modular SaaS)
- **Auth Service**: JWT auth, org-scoped permissions
- **Org & Team Service**: orgs, teams, memberships
- **Project Service**: projects, milestones, status health
- **Task & Dependency Service**: tasks, dependency graph, critical path
- **Coordination Service**: blocker detection, workload balancing, risk scoring
- **AI Explanation Service**: turns coordination outputs into explainable insights
- **Integration Service**: syncs data with external tools

## Scalability Priorities
- Stateless API nodes with horizontal scaling
- Async workers for AI tasks and heavy graph computations
- Read-optimized views for dashboards (materialized views later)
- Event log for analytics and explainability

## Clean Monorepo Architecture
```
EXPLANIFYV2/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── orgs/
│   │   │   ├── teams/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── dependencies/
│   │   │   ├── coordination/
│   │   │   ├── ai/
│   │   │   └── integrations/
│   │   ├── events/
│   │   ├── shared/
│   │   └── app.ts
│   └── prisma/
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/
├── docs/
```

## Future Integrations (Post-MVP)
- Linear, Jira, Notion, Slack
- IDE telemetry hooks (opt-in)
- Figma component dependency mapping
