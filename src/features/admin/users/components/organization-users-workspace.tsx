import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import type { OrganizationAdminContext } from "@/lib/auth/organization-admin";

import type {
  OrganizationUserRecord,
  OrganizationUsersDirectoryData,
  OrganizationUsersDirectoryResult,
  OrganizationUsersSummary,
} from "@/features/admin/users/types";

interface OrganizationUsersWorkspaceProps {
  organizationAdmin: OrganizationAdminContext;
  result: OrganizationUsersDirectoryResult;
}

const statusBadgeClasses: Record<OrganizationUserRecord["status"], string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  invited: "border-blue-200 bg-blue-50 text-blue-700",
  disabled: "border-slate-200 bg-slate-100 text-slate-600",
};

export function OrganizationUsersWorkspace({
  organizationAdmin,
  result,
}: OrganizationUsersWorkspaceProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <AppSidebar
        role={organizationAdmin.role}
        displayName="Organization Admin"
        activeItem="admin-users"
        isOrganizationAdmin={organizationAdmin.isOrganizationAdmin}
      />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
                  Organization Admin
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Read-only directory
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Organization Users
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Review active, invited, and disabled profile records for your
                authorized organization. This workspace does not expose Auth
                emails, passwords, tokens, or operational customer data.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Access scope
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                Current organization only
              </p>
            </div>
          </header>

          {result.status === "unavailable" ? (
            <OrganizationUsersState
              title="Organization users are temporarily unavailable"
              description="We could not load the authorized organization directory right now. Please refresh the page or try again shortly."
              tone="warning"
            />
          ) : (
            <OrganizationUsersContent data={result.data} />
          )}
        </div>
      </main>
    </div>
  );
}

function OrganizationUsersContent({
  data,
}: {
  data: OrganizationUsersDirectoryData;
}) {
  return (
    <div className="mt-6 space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white shadow-lg shadow-slate-300/50 sm:px-7 sm:py-7">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 size-64 rounded-full bg-blue-600/20 blur-3xl"
        />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            Organization directory
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {data.organizationName}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            A read-only view of profile status, application role, team
            assignment, and Organization Admin permission for this organization.
          </p>
        </div>
      </section>

      <section aria-labelledby="organization-user-summary-title">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Account summary
          </p>
          <h2
            id="organization-user-summary-title"
            className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
          >
            Organization profile status
          </h2>
        </div>
        <SummaryGrid summary={data.summary} />
      </section>

      <section
        aria-labelledby="organization-users-title"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
              Users
            </p>
            <h2
              id="organization-users-title"
              className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
            >
              Read-only user directory
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Displayed fields are limited to profile directory information
              needed for future organization administration.
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {data.users.length} {data.users.length === 1 ? "user" : "users"}
          </span>
        </div>

        {data.users.length === 0 ? (
          <OrganizationUsersState
            title="No organization users found"
            description="This organization does not currently have profile records to display."
            tone="empty"
          />
        ) : (
          <UserDirectory users={data.users} />
        )}
      </section>

      <footer className="flex flex-col gap-1 border-t border-slate-200 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>FieldFlow AI organization users</p>
        <p>Directory data is scoped to the authenticated Organization Admin.</p>
      </footer>
    </div>
  );
}

function SummaryGrid({ summary }: { summary: OrganizationUsersSummary }) {
  const cards = [
    {
      label: "Total Users",
      value: summary.totalUsers,
      detail: "Profiles in this organization",
    },
    {
      label: "Active",
      value: summary.activeUsers,
      detail: "Profiles eligible for app access",
    },
    {
      label: "Invited",
      value: summary.invitedUsers,
      detail: "Profiles awaiting onboarding",
    },
    {
      label: "Disabled",
      value: summary.disabledUsers,
      detail: "Profiles blocked from app access",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {card.label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {card.value.toLocaleString()}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{card.detail}</p>
        </article>
      ))}
    </div>
  );
}

function UserDirectory({ users }: { users: OrganizationUserRecord[] }) {
  return (
    <>
      <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <caption className="sr-only">
            Organization users with role, team, status, and Organization Admin
            permission
          </caption>
          <thead className="bg-slate-50">
            <tr>
              <TableHeader>Name</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Team</TableHeader>
              <TableHeader>Account Status</TableHeader>
              <TableHeader>Organization Admin</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user, index) => (
              <tr key={`${user.name}-${user.teamName}-${index}`}>
                <TableCell strong>{user.name}</TableCell>
                <TableCell>{user.roleLabel}</TableCell>
                <TableCell>{user.teamName}</TableCell>
                <TableCell>
                  <StatusBadge user={user} />
                </TableCell>
                <TableCell>
                  {user.isOrganizationAdmin ? (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      Organization Admin
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">No</span>
                  )}
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-3 md:hidden">
        {users.map((user, index) => (
          <article
            key={`${user.name}-${user.teamName}-${index}`}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            aria-label={`${user.name}, ${user.roleLabel}, ${user.statusLabel}`}
          >
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-950">
                  {user.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{user.roleLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge user={user} />
                {user.isOrganizationAdmin ? (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    Organization Admin
                  </span>
                ) : null}
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Team
                </dt>
                <dd className="mt-1 font-semibold text-slate-800">
                  {user.teamName}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}

function StatusBadge({ user }: { user: OrganizationUserRecord }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses[user.status]}`}
    >
      {user.statusLabel}
    </span>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500"
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`px-4 py-4 text-sm ${strong ? "font-semibold text-slate-900" : "text-slate-600"}`}
    >
      {children}
    </td>
  );
}

function OrganizationUsersState({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "empty" | "warning";
}) {
  return (
    <section
      className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm shadow-slate-200/60"
      role="status"
    >
      <span
        aria-hidden="true"
        className={`mx-auto grid size-11 place-items-center rounded-full text-sm font-bold ${
          tone === "warning"
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {tone === "warning" ? "!" : "0"}
      </span>
      <h2 className="mt-4 text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </section>
  );
}
