# FieldFlow AI project plan

## Status and purpose

FieldFlow AI is in the **portfolio polish phase**. Core role-based workspaces, Supabase-backed synthetic data, secure workflow RPCs, Manager Insights, Weekly Manager Report, automated tests, and GitHub Actions CI are implemented in this repository. Final portfolio work remains for responsive QA, accessibility QA, screenshots, Vercel deployment, and live smoke testing.

The product will be a portfolio-quality copilot for field sales and dealership operations. It will help sales executives organize customer visits and follow-up work while giving managers a clear view of team execution. AI will complement the workflow with on-demand weekly action recommendations rather than operating continuously in the background.

## User roles and permissions

The application has two fixed roles.

### `manager`

Managers can:

- Monitor performance for sales executives on their team.
- Track customer follow-ups and overdue work for their team.
- Review planned, completed, missed, pending, and cancelled visits.
- Compare territory and salesperson performance.
- Review team targets and progress.
- Generate on-demand Manager Insights and Weekly Manager Report output.

A manager must only access teams and related records they are authorized to manage.

### `sales_executive`

Sales executives can:

- View customers assigned to them.
- View assigned daily and scheduled customer visits.
- Complete their assigned visits with an outcome and notes.
- Complete assigned follow-ups and tasks.
- View their own KPIs, assigned customer coverage, and pending work.

A sales executive must only access records assigned to them or created within their permitted scope.

## Implemented MVP features

- Secure authentication and role-based navigation.
- Manager and Sales Executive dashboards backed by authorized live synthetic data.
- Synthetic customer, territory, team, assignment, visit, follow-up, task, and monthly target data.
- Manager-created visit plans, follow-ups, and tasks through secure RPCs.
- Sales Executive completion actions for assigned visits, follow-ups, and tasks through secure RPCs.
- Customer directory and customer detail pages.
- Dedicated Team Performance, Territories, and My Performance workspaces.
- KPI charts using Recharts.
- On-demand Manager Insights and Weekly Manager Report generation.
- Deterministic rules-based fallback for insights and reports when Gemini is unavailable or unconfigured.
- Responsive loading, empty, unavailable, error, and authorization states across the main workspaces.

Remaining portfolio items are final responsive QA, accessibility QA, recruiter screenshots, Vercel deployment, live smoke testing, and optional broader E2E/RLS integration coverage.

## Current verified implementation

Repository-verified complete areas:

- Authentication and role-based workspaces.
- Supabase schema, RLS policies, typed clients, synthetic seed data, and secure workflow RPCs.
- Manager and Sales Executive dashboards.
- Customers, Visits, Follow-ups, and Tasks workspaces.
- Manager-only Team Performance and Territories pages.
- Sales Executive-only My Performance page.
- Manager Insights and Weekly Manager Report with server-side Gemini support and deterministic fallback.
- Automated Vitest tests and GitHub Actions CI.

Still pending:

- Final responsive/mobile QA.
- Final accessibility QA.
- Recruiter screenshots.
- Vercel deployment.
- Live deployed smoke testing.
- Optional future E2E and RLS integration coverage.

## Database entities

| Entity | Responsibility |
| --- | --- |
| `profiles` | User identity, display information, and fixed application role |
| `teams` | Manager-owned sales teams |
| `territories` | Sales areas assigned to teams or sales executives |
| `customers` | Synthetic dealership or customer accounts and assignments |
| `visit_plans` | Planned daily or scheduled customer visits |
| `visits` | Visit execution, status, outcomes, and notes |
| `follow_ups` | Customer follow-up commitments and due dates |
| `tasks` | Action items associated with users or business records |
| `monthly_targets` | Monthly goals for a salesperson, team, or territory |
| `ai_insights` | Schema support for future stored AI-summary metadata; current insight/report UI generates on demand and does not persist output |

The schema, relationships, indexes, constraints, triggers, helper functions, RLS policies, synthetic seed data, and workflow RPCs are represented by migrations in `supabase/migrations`.

## Security rules

- Use synthetic demo data only. Do not store real customer, dealership, sales, employee, or personal data.
- Enable Supabase Row Level Security on every application table.
- Managers may read or change only data belonging to teams they manage.
- Sales executives may read or change only records assigned to them and operations allowed for their role.
- Treat hidden buttons and routes as user experience controls, not authorization.
- Enforce authorization in RLS policies and server-side checks.
- Validate all untrusted input before database or AI operations.
- Keep the Supabase service role key and Gemini API key server-side only.
- The Supabase publishable key may be exposed to the browser as designed, with RLS providing database protection.
- Never commit `.env.local` or secret values.
- Send Gemini only the minimum synthetic operational context required for a requested summary.
- Call Gemini only after an explicit user action through a secure server-side route.

## Free-tier and demo constraints

- Remain within the free tiers of Supabase, Gemini, Vercel, and GitHub.
- Avoid scheduled AI jobs, continuous AI generation, and uncontrolled retry loops.
- Avoid paid APIs, Google Maps, paid geocoding, SMS, WhatsApp, OTP services, live GPS tracking, and paid analytics.
- Avoid large file uploads and storage-heavy features.
- Prefer lightweight charts, bounded queries, pagination, and small synthetic datasets.
- Provide graceful fallbacks when a free-tier quota or external integration is unavailable.

## Technology stack

| Area | Technology |
| --- | --- |
| Application | Next.js App Router |
| Language | TypeScript with no explicit `any` |
| Styling | Tailwind CSS |
| Database and authentication | Supabase PostgreSQL and Auth |
| Authorization | Supabase RLS plus server-side checks |
| AI | Gemini API through on-demand server-side routes with deterministic fallback |
| Charts | Recharts |
| Deployment | Vercel |
| Source hosting | GitHub |

The application currently uses this stack locally. Vercel deployment remains pending.

## Architecture guidance

Application code uses feature-based organization:

```text
src/
|-- app/
|-- components/
|-- features/
|-- lib/
`-- types/
```

Each feature should own its relevant components, validation, queries, actions, and types where practical. Server-only integrations must be clearly separated from code that can enter the browser bundle.

## Development workflow

1. Read `AGENTS.md` and this plan before beginning a task.
2. Select only the next approved subtask; do not begin later phases early.
3. Create one focused feature branch rather than working directly on `main`.
4. Make small, reviewable changes and avoid unrelated cleanup.
5. Run `npm run lint` and `npm run build` after meaningful code changes.
6. Review the diff for secrets, real data, accidental scope expansion, and generated files.
7. Open a focused pull request describing the change, verification, and known follow-up work.
8. Merge only after review and successful checks.

Codex must not create branches, commits, pushes, pull requests, or file deletions unless the user explicitly requests those actions.

## Project phases

### 1. Foundation

- Define product scope, roles, constraints, architecture, and delivery plan.
- Replace generic starter documentation with FieldFlow AI documentation.
- Establish contribution and agent rules.

Status: **complete**. Product scope, constraints, architecture guidance, and agent rules exist.

### 2. Static UI and demo data

- Build a responsive application shell and role-specific navigation.
- Create manager and sales executive screens with typed synthetic data.
- Establish reusable UI states and feature boundaries.

Status: **complete**. The application shell, role-specific navigation, and initial dashboard UI have been replaced by live authenticated workspaces.

### 3. Charts and product workflow

- Add Recharts KPI visualizations.
- Implement front-end visit planning, visit outcomes, follow-ups, tasks, and target workflows against demo data.
- Confirm the end-to-end user experience before backend integration.

Status: **complete**. Manager dashboard analytics use Recharts, and visit/follow-up/task workflows exist against live synthetic Supabase data.

### 4. Supabase database, authentication, and RLS

- Design migrations for the planned entities.
- Add Supabase authentication and role-aware sessions.
- Implement and verify RLS policies for managers and sales executives.
- Generate strongly typed database definitions.

Status: **complete**. Supabase clients, authentication flow, schema migrations, generated database types, RLS policies, synthetic seed data, and secure workflow RPCs are present.

### 5. Real Supabase data integration

- Replace demo repositories with authorized Supabase queries and mutations.
- Add validation, loading, empty, error, and permission states.
- Verify workflows with synthetic rows stored in Supabase.

Status: **complete**. Customers, visits, follow-ups, tasks, Manager dashboard, Sales Executive dashboard, Team Performance, Territories, and My Performance use authorized live data where implemented for their scope.

### 6. Gemini AI operations summary and exportable report

- Build an explicitly triggered, secure server-side Gemini operation.
- Summarize bounded synthetic KPI and workflow data.
- Present useful weekly action recommendations.
- Add an exportable operations report with a non-AI fallback where practical.

Status: **complete for the current portfolio scope**. Manager Insights and Weekly Manager Report are on-demand, server-side, Manager-only features with Gemini support and deterministic fallback. Current application code does not persist generated insight/report output.

### 7. Tests, recruiter README, screenshots, and Vercel deployment

- Add focused tests for authorization-sensitive and core business behavior.
- Polish recruiter-facing documentation and architecture notes.
- Capture representative screenshots using synthetic data.
- Configure and verify Vercel deployment without exposing secrets.

Status: **partial**. Vitest tests and GitHub Actions CI are implemented. Recruiter screenshots, Vercel deployment, and live smoke testing remain pending.

### 8. Dedicated comparison and performance workspaces

- Add a Manager-only Team Performance route with live team metrics.
- Add a Manager-only Territories route with live territory metrics.
- Add a Sales Executive-only My Performance route with live personal metrics.
- Keep direct navigation and query parameters from bypassing server-side role checks.

Status: **complete**. Dedicated Team Performance, Territories, and My Performance pages are implemented with deterministic rule tests.

### 9. Documentation and portfolio readiness

- Refresh README and project plan to match implemented functionality.
- Complete final responsive and accessibility QA.
- Add recruiter-facing screenshots.
- Deploy to Vercel and complete live smoke testing.

Status: **in progress**. Documentation is being refreshed. QA, screenshots, deployment, and live smoke testing remain pending.

## Definition of done

The portfolio project is complete when:

- Both fixed roles can complete their intended workflows with responsive, accessible UI.
- Manager and sales executive permissions are enforced by tested RLS policies and server checks.
- Every displayed record uses synthetic data.
- Core customer, visit, follow-up, task, target, and dashboard workflows persist through Supabase.
- KPI charts accurately represent authorized data.
- Gemini summaries run only on demand, keep secrets server-side, and handle errors and quotas safely.
- The operations report can be exported without exposing restricted data.
- TypeScript contains no explicit `any`, and lint, build, and relevant tests pass.
- No secrets are committed and `.env.local` remains ignored.
- The deployed Vercel application works within free-tier constraints.
- The README, screenshots, setup instructions, and architecture explanation accurately distinguish implemented functionality from future ideas.
