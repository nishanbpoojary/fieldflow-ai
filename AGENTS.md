<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FieldFlow AI project rules

## Before implementation

- Read this file and `docs/project-plan.md` before every implementation task.
- Implement only the currently requested subtask. Do not begin later project phases early.
- Keep changes small, focused, and easy to review.
- Do not work directly on `main`. Use one feature branch per subtask.
- Do not commit, push, create pull requests, or delete files unless the user explicitly requests it.

## Product scope

FieldFlow AI is a portfolio-quality, role-based field sales and dealership operations copilot. Its fixed application roles are `manager` and `sales_executive`.

- Managers will monitor team performance, customer follow-ups, visits, overdue work, territories, and salesperson performance. They will be able to request AI-powered weekly action recommendations.
- Sales executives will manage assigned customers, daily visits, visit outcomes, follow-ups, personal KPIs, and pending work.

All product functionality described here is planned unless the repository already contains a working implementation.

## Architecture and code quality

- Use the Next.js App Router, TypeScript, and Tailwind CSS.
- Put future feature code under `src/features`.
- Put shared UI under `src/components`, shared utilities under `src/lib`, and domain types under `src/types`.
- Prefer Server Components. Add Client Components only when browser-side interactivity requires them.
- Use clean, strict TypeScript. Never use explicit `any`.
- Validate untrusted input at server boundaries.
- Run `npm run lint` and `npm run build` after meaningful code changes.

## Data and authorization

- Use synthetic demo data only. Never use real customer, dealership, sales, employee, or personal data.
- Future database tables must use Supabase Row Level Security (RLS).
- Managers may access only their team's data.
- Sales executives may access only records assigned to them.
- Hidden UI is not authorization. Enforce access through Supabase RLS and server-side checks.
- The Supabase anon key may be used in browser code when required.
- Never expose the Supabase service role key or Gemini API key in client-side code.
- Keep `.env.local` uncommitted.

## AI and free-tier limits

- Keep the project within the free tiers of Supabase, Gemini, Vercel, and GitHub.
- Call Gemini only on demand through a secure server-side route.
- Avoid uncontrolled AI calls, background polling, and unnecessary data sent to AI services.
- Do not add paid APIs, Google Maps, paid geocoding, SMS, WhatsApp, OTP services, live GPS tracking, paid analytics, or large uploads.
