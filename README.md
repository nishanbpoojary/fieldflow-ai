# FieldFlow AI

A planned role-based field sales and dealership operations copilot for managers and sales executives.

## The problem

Field sales teams often track customers, visits, follow-ups, targets, and team performance across disconnected spreadsheets and messages. FieldFlow AI is intended to bring that work into one focused application and provide on-demand operational recommendations.

## Intended users

- **Managers** will monitor team performance, visits, follow-ups, overdue work, territories, and salesperson performance.
- **Sales Executives** will manage assigned customers, daily visits, visit outcomes, follow-up tasks, and personal KPIs.

## Planned MVP

- Role-based manager and sales executive experiences
- Customer assignments and follow-up tracking
- Daily visit planning and visit status management
- Visit outcomes, notes, tasks, and monthly targets
- Manager and personal KPI dashboards
- Territory and salesperson comparisons
- On-demand AI weekly action recommendations
- Exportable operations summary

These features are planned and are not implemented yet.

## Planned technology stack

- Next.js App Router, TypeScript, and Tailwind CSS
- Supabase for PostgreSQL, authentication, and Row Level Security
- Gemini API for on-demand server-side summaries
- Recharts for dashboards
- Vercel for deployment and GitHub for repository hosting

## Project status

FieldFlow AI is currently in the **foundation/setup phase**. The repository contains the initial Next.js application and project documentation. Supabase, authentication, database migrations, charts, Gemini integration, and deployment are not implemented yet.

## Local development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Planned environment variables

These variables are not required during the current foundation phase:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY
```

The Gemini key must remain server-side. A future Supabase service role key, if one is ever necessary, must also remain server-side. `.env.local` must never be committed.

## Data and cost principles

- Use synthetic demo data only—never real customer, dealership, employee, sales, or personal data.
- Keep the project within the free tiers of its planned services.
- Avoid paid APIs, live location tracking, messaging services, paid maps, and large uploads.
- Enforce future authorization with server checks and Supabase RLS, not merely hidden UI.

## Roadmap

1. Project foundation and documentation
2. Static UI with typed synthetic demo data
3. Charts and core sales workflows
4. Supabase database, authentication, and RLS
5. Real Supabase data integration
6. Gemini operations summary and exportable report
7. Tests, screenshots, recruiter documentation, and Vercel deployment

See [`docs/project-plan.md`](docs/project-plan.md) for the detailed internal plan.
