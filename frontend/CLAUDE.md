@AGENTS.md
# Explanify Frontend Context

## Product
Explanify is an AI-native task and project management SaaS focused on:
- Explainable AI Scheduling
- AI Coordination Engine
- Dependency-aware task management
- Multi-tenant collaboration

The product is designed for:
- students
- startups
- teams
- organizations

Main differentiator:
The AI explains WHY tasks are blocked, prioritized, or coordinated.

---

# Frontend Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Lucide React
- Axios

---

# Design Language

Theme:
- futuristic
- premium SaaS
- glassmorphism
- neon accents
- smooth animations
- clean spacing
- rounded-2xl cards

Primary colors:
- Purple: #a855f7
- Blue: #3b82f6

Dark theme first.

Avoid:
- generic admin styles
- clutter
- outdated bootstrap look

UI inspiration:
- Linear
- Vercel
- Notion
- Raycast
- Motion
- Arc Browser

---

# Frontend Architecture

Use reusable component architecture.

Folders:
- app/
- components/
- components/layout/
- components/dashboard/
- components/tasks/
- components/projects/
- components/coordination/
- lib/
- services/
- hooks/

---

# Backend API

Backend runs on:
http://localhost:4000

Authentication:
JWT Bearer token

Main APIs:
- /api/auth
- /api/tasks
- /api/projects
- /api/organizations
- /api/dependencies

---

# AI Coordination Engine

Each task may include:
- isBlocked
- blockingTasks
- coordinationReason

Frontend must visually display:
- blocked states
- dependency chains
- AI coordination explanations

---

# Current Backend Features Completed

Completed backend phases:
1. Auth System
2. Organizations
3. Projects
4. Tasks CRUD
5. Task Dependencies
6. AI Coordination Engine

The frontend should integrate with these APIs.

---

# Frontend Priorities

Build in this order:
1. Layout system
2. Sidebar
3. Navbar
4. Dashboard
5. Task management UI
6. Coordination UI
7. Project pages
8. Calendar
9. AI explanation panels

---

# Coding Rules

- Use TypeScript
- Keep components modular
- Prefer server-safe architecture
- Use clean reusable UI
- Use Framer Motion sparingly but elegantly
- Avoid massive single-file components
- Keep state architecture scalable

---

# UX Rules

- Smooth animations
- Minimal but informative UI
- High readability
- Strong visual hierarchy
- Fast interactions
- Responsive design
- Mobile-friendly sidebar

---

# Important

Always maintain premium startup-quality UI and architecture.
Never generate low-quality admin-dashboard designs.