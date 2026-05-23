# Explanify V2 — Database Architecture (Prisma + PostgreSQL)

This schema supports an AI-native coordination platform with multi-org SaaS, event-driven workflows, and explainable AI outputs.

## Model Explanations

### User
- **Purpose**: Identity for a human collaborator.
- **Relationships**: Many `Membership`, `TeamMember`, `ProjectMember`, `Task` (assignee), `ProjectActivity` (actor), `Notification` (recipient).
- **AI relevance**: Links workload balancing, risk ownership, and accountability to real people.
- **Scalability role**: Core identity anchor across organizations and projects.

### Organization
- **Purpose**: Multi-tenant boundary.
- **Relationships**: Owns `Team`, `Project`, `Membership`, `EventLog`, `AIExplanation`, `Notification`.
- **AI relevance**: Keeps AI reasoning scoped to tenant.
- **Scalability role**: Enables SaaS growth with clean data isolation.

### Membership
- **Purpose**: User ↔ Organization membership with role.
- **Relationships**: Links `User` to `Organization`.
- **AI relevance**: Provides role context for recommendations.
- **Scalability role**: Supports multi-org users and role-based access.

### Team
- **Purpose**: Group of users within an org.
- **Relationships**: `TeamMember`, optional linkage to `Project`.
- **AI relevance**: Enables team workload balancing and risk distribution.
- **Scalability role**: Allows coordination on team boundaries.

### TeamMember
- **Purpose**: User ↔ Team role assignment.
- **Relationships**: Links `User` and `Team`.
- **AI relevance**: AI can tailor suggestions to team leads.
- **Scalability role**: Clean role management per team.

### Project
- **Purpose**: Unit of delivery within org.
- **Relationships**: `ProjectMember`, `Task`, `ProjectActivity`, `AIExplanation`.
- **AI relevance**: Central target for risk prediction and recovery planning.
- **Scalability role**: Supports many projects per org with status tracking.

### ProjectMember
- **Purpose**: User ↔ Project collaboration role.
- **Relationships**: Links `User` and `Project`.
- **AI relevance**: Enables role-aware recommendations.
- **Scalability role**: Prevents permission sprawl and supports large projects.

### Task
- **Purpose**: Atomic unit of work with scheduling metadata.
- **Relationships**: Belongs to `Project`, optional `User` (assignee), connects through `TaskDependency`.
- **AI relevance**: Input for critical path, blockers, and workload balancing.
- **Scalability role**: Core entity for coordination intelligence.

### TaskDependency
- **Purpose**: Directed dependency edge between tasks.
- **Relationships**: `fromTask` → `toTask`.
- **AI relevance**: Enables dependency intelligence and blocker detection.
- **Scalability role**: Supports large dependency graphs and critical path analysis.

### AIExplanation
- **Purpose**: Explainable AI outputs with evidence.
- **Relationships**: Links to `Organization`, optional `Project`/`Task`, optional `EventLog`.
- **AI relevance**: Stores rationale and evidence for decisions.
- **Scalability role**: Auditable and traceable AI for trust and compliance.

### ProjectActivity
- **Purpose**: Activity feed and audit trail.
- **Relationships**: Linked to `Organization`, `Project`, optional `User`.
- **AI relevance**: Feeds AI context and timeline reasoning.
- **Scalability role**: Durable event history for analytics.

### Notification
- **Purpose**: Delivery of actionable insights.
- **Relationships**: Linked to `Organization` and `User`.
- **AI relevance**: Surfaces AI recommendations at the right time.
- **Scalability role**: Allows growth of notification channels.

### EventLog
- **Purpose**: Immutable record of key system events.
- **Relationships**: Linked to `Organization`, optional `User`, related `AIExplanation`.
- **AI relevance**: Core evidence store for explainability.
- **Scalability role**: Enables event-driven processing and analytics.

## Scalability Considerations
- All models scoped by `orgId` to support multi-tenancy.
- Indexes on role/status, project and org boundaries for fast filtering.
- JSON payloads for extensible AI evidence and future integrations.
- Event log enables async processing and auditability.

## Future Integrations
- External mappings can be added via new models such as `IntegrationConnection`, `ExternalIssue`, `ExternalPR`, or `ExternalFile` linked to `Project` and `Task`.
