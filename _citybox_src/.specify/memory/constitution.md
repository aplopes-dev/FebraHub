<!--
Sync Impact Report:
- Version change: [CONSTITUTION_VERSION] -> 1.0.0
- Modified principles:
  - [PRINCIPLE_1_NAME] -> I. Docs-as-Code (Hierarchy of AGENTS.md)
  - [PRINCIPLE_2_NAME] -> II. Backend-Driven Search and Pagination
  - [PRINCIPLE_3_NAME] -> III. Single Package Manager (pnpm)
  - [PRINCIPLE_4_NAME] -> IV. Atomic Design and Shared UI Components
  - [PRINCIPLE_5_NAME] -> V. Tenant Isolation and Independent Database Schemas
- Added sections:
  - Additional Architecture & Stack Constraints
  - Development Workflow & Quality Gates
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: None
-->
# Citybox Platform Constitution

## Core Principles

### I. Docs-as-Code (Hierarchy of AGENTS.md)
Every module within the monorepo MUST maintain its own `AGENTS.md` file, which serves as the local source of truth for that scope. Any modifications to code, infrastructure, database schemas, or configurations MUST update the corresponding `AGENTS.md` file in the same operation (PR/commit). Structural or global modifications MUST also update the root `AGENTS.md` file.

### II. Backend-Driven Search and Pagination
All endpoints, queries, and UI components handling collections MUST execute search, pagination, and sorting on the backend (database query level using `skip`/`take`, `WHERE`, and `ORDER BY`). Loading full datasets for frontend-side filtering or slicing is strictly PROHIBITED. A debounce of 400ms via `useDebouncedSearch` MUST be applied to frontend searches, and TanStack `DataTable` components MUST utilize `manualPagination`.

### III. Single Package Manager (pnpm)
The monorepo strictly utilizes `pnpm@9.15.0` as the sole package manager. The use of other package managers (e.g., `npm`, `yarn`) is PROHIBITED to avoid lockfile divergence and build target inconsistencies.

### IV. Atomic Design and Shared UI Components
All user interface elements MUST import atomic primitives and compositions directly from the `@citybox/ui` package layers (`atoms`, `molecules`, `organisms`) using design system CSS variables (OKLCH or HSL scale). Creating local duplicates of shared component primitives or hardcoding color values in CSS/styles is PROHIBITED.

### V. Tenant Isolation and Independent Database Schemas
Database operations and configurations MUST strictly respect the tenant hierarchy (Platform -> Organization -> Store). There is no central database package; each API/app owns and is responsible for its own Prisma schema. Any schema modifications MUST be reviewed via the `database-reviewer` gate before implementation, and Postgres UUID v7 (`citybox_uuid_v7()`) MUST be used as the default ID type.

## Additional Architecture & Stack Constraints
- **Authentication**: Authentication MUST be managed via Keycloak SSO/OIDC, and authorization JWTs propagated using local guards in each NestJS API.
- **Messaging**: Inter-service event communication MUST use RabbitMQ complying with the CloudEvents 1.0 specification and implementing an outbox transactional pattern.
- **Framework and Engine Versions**: Backend services MUST use NestJS 11 (with versions pinned in workspace catalog configuration), and frontend apps MUST use Next.js 16 (App Router) + React 19 and Tailwind v4.

## Development Workflow & Quality Gates
- **Workflow Orchestration**: All new features and bug fixes MUST go through the `/feature` or `/bugfix` ECC flow (Plan -> TDD -> Code Review -> Gate Verification -> Security -> Delivery).
- **Gate Verification Loop**: Prior to PR submission or commit, code changes MUST pass the verification loop (`pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`).
- **No Commits without Approval**: Code changes MUST NOT be committed to git without explicit approval from the user.
- **Strict Linting Compliance**: Disabling TypeScript or ESLint checkers using `@ts-ignore` or `eslint-disable` annotations is PROHIBITED.

## Governance
The Constitution is the ultimate authority governing codebase structure and implementation standards. Any proposed amendment to this constitution MUST be documented, versioned, and require updating this file along with any dependent templates (`README.md`, templates under `.specify/templates/`). Version numbers MUST follow Semantic Versioning (MAJOR for principle redefinitions/removals, MINOR for additions, PATCH for refinements/formatting).

**Version**: 1.0.0 | **Ratified**: 2026-07-20 | **Last Amended**: 2026-07-20
