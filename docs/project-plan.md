# FieldFlow AI project plan

## Status and purpose

FieldFlow AI is in the **foundation/setup phase**. This document defines the planned product and delivery sequence. Unless explicitly marked as implemented, every feature, integration, entity, workflow, and deployment described below is planned work.

The product will be a portfolio-quality copilot for field sales and dealership operations. It will help sales executives organize customer visits and follow-up work while giving managers a clear view of team execution. AI will complement the workflow with on-demand weekly action recommendations rather than operating continuously in the background.

## User roles and permissions

The application has two fixed roles.

### `manager`

Managers will be able to:

- Monitor performance for sales executives on their team.
- Track customer follow-ups and overdue work for their team.
- Review planned, completed, missed, pending, and cancelled visits.
- Compare territory and salesperson performance.
- Review team targets and progress.
- Generate on-demand AI-powered weekly action recommendations.

A manager must only access teams and related records they are authorized to manage.

### `sales_executive`

Sales executives will be able to:

- View customers assigned to them.
- Plan daily customer visits.
- Mark visits as completed, missed, pending, or cancelled.
- Record visit outcomes and notes.
- Create and manage follow-up tasks.
- View their own KPIs, targets, and pending work.

A sales executive must only access records assigned to them or created within their permitted scope.

## Planned MVP features

- Secure authentication and role-based navigation.
- Manager and sales executive dashboards.
- Synthetic customer and assignment data.
- Daily visit planning and visit status tracking.
- Visit outcomes and notes.
- Follow-up and general task tracking with due dates.
- Monthly targets and progress indicators.
- Manager views for team, territory, and salesperson comparison.
- KPI charts using Recharts.
- On-demand Gemini weekly operations recommendations.
- An exportable operations report.
- Responsive loading, empty, error, and authorization states.

## Planned database entities

| Entity | Planned responsibility |
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
| `ai_insights` | Stored metadata and results for explicitly requested AI summaries |

The final schema, relationships, indexes, constraints, and RLS policies will be designed during the Supabase phase. No database migrations currently exist.

## Security rules

- Use synthetic demo data only. Do not store real customer, dealership, sales, employee, or personal data.
- Enable Supabase Row Level Security on every application table.
- Managers may read or change only data belonging to teams they manage.
- Sales executives may read or change only records assigned to them and operations allowed for their role.
- Treat hidden buttons and routes as user experience controls, not authorization.
- Enforce authorization in RLS policies and server-side checks.
- Validate all untrusted input before database or AI operations.
- Keep the Supabase service role key and Gemini API key server-side only.
- The Supabase anon key may be exposed to the browser as designed, with RLS providing database protection.
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

## Planned technology stack

| Area | Planned technology |
| --- | --- |
| Application | Next.js App Router |
| Language | TypeScript with no explicit `any` |
| Styling | Tailwind CSS |
| Database and authentication | Supabase PostgreSQL and Auth |
| Authorization | Supabase RLS plus server-side checks |
| AI | Gemini API through an on-demand server-side route |
| Charts | Recharts |
| Deployment | Vercel |
| Source hosting | GitHub |

Only the initial Next.js, TypeScript, and Tailwind setup currently exists. The other technologies remain planned.

## Architecture guidance

Future application code should use feature-based organization:

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

Status: **in progress**. Documentation is being established; no product functionality is implied.

### 2. Static UI and demo data

- Build a responsive application shell and role-specific navigation.
- Create manager and sales executive screens with typed synthetic data.
- Establish reusable UI states and feature boundaries.

Status: **planned**.

### 3. Charts and product workflow

- Add Recharts KPI visualizations.
- Implement front-end visit planning, visit outcomes, follow-ups, tasks, and target workflows against demo data.
- Confirm the end-to-end user experience before backend integration.

Status: **planned**.

### 4. Supabase database, authentication, and RLS

- Design migrations for the planned entities.
- Add Supabase authentication and role-aware sessions.
- Implement and verify RLS policies for managers and sales executives.
- Generate strongly typed database definitions.

Status: **planned**. Supabase, authentication, migrations, and RLS are not currently implemented.

### 5. Real Supabase data integration

- Replace demo repositories with authorized Supabase queries and mutations.
- Add validation, loading, empty, error, and permission states.
- Verify workflows with synthetic rows stored in Supabase.

Status: **planned**.

### 6. Gemini AI operations summary and exportable report

- Build an explicitly triggered, secure server-side Gemini operation.
- Summarize bounded synthetic KPI and workflow data.
- Present useful weekly action recommendations.
- Add an exportable operations report with a non-AI fallback where practical.

Status: **planned**. Gemini and report export are not currently implemented.

### 7. Tests, recruiter README, screenshots, and Vercel deployment

- Add focused tests for authorization-sensitive and core business behavior.
- Polish recruiter-facing documentation and architecture notes.
- Capture representative screenshots using synthetic data.
- Configure and verify Vercel deployment without exposing secrets.

Status: **planned**. Tests and deployment are not currently implemented.

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
