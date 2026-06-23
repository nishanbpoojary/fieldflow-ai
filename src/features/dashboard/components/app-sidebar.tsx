import Link from "next/link";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  managerNavigation,
  salesExecutiveNavigation,
} from "@/features/dashboard/data/demo-dashboard";
import type { AppRole } from "@/features/dashboard/types";

interface AppSidebarProps {
  role: AppRole;
  displayName: string;
  activeItem?:
    | "overview"
    | "customers"
    | "visits"
    | "follow-ups"
    | "tasks"
    | "team-performance"
    | "territories";
}

const roleProfiles: Record<
  AppRole,
  { badge: string; title: string; navigationLabel: string }
> = {
  manager: {
    badge: "Manager",
    title: "Regional Sales Manager",
    navigationLabel: "Manager workspace",
  },
  sales_executive: {
    badge: "Sales executive",
    title: "Sales Executive - Metro North",
    navigationLabel: "Sales executive workspace",
  },
};

export function AppSidebar({
  role,
  displayName,
  activeItem = "overview",
}: AppSidebarProps) {
  const profile = roleProfiles[role];
  const navigation =
    role === "manager" ? managerNavigation : salesExecutiveNavigation;

  return (
    <aside className="bg-slate-950 text-slate-100 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5 lg:block lg:border-b-0 lg:px-6 lg:py-7">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-bold tracking-tight text-white shadow-lg shadow-blue-950/30"
          >
            FF
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-white">
              FieldFlow AI
            </p>
            <p className="truncate text-xs text-slate-400">Operations copilot</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-200 lg:mt-5 lg:inline-flex lg:text-[11px]">
          {profile.badge}
        </span>
      </div>

      <nav aria-label={profile.navigationLabel} className="px-3 py-4 lg:px-4 lg:py-2">
        <p className="hidden px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:block">
          Workspace
        </p>
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:block lg:space-y-1.5">
          {navigation.map((item) => {
            const isOverviewItem = item.label === "Overview";
            const isCustomerItem =
              item.label === "Customers" || item.label === "My Customers";
            const isVisitItem =
              item.label === "Visits" || item.label === "Today's Visits";
            const isFollowUpItem = item.label === "Follow-ups";
            const isTaskItem = item.label === "Tasks";
            const isTeamPerformanceItem = item.label === "Team Performance";
            const isTerritoryItem = item.label === "Territories";
            const isActive =
              activeItem === "customers"
                ? isCustomerItem
                : activeItem === "visits"
                  ? isVisitItem
                  : activeItem === "follow-ups"
                    ? isFollowUpItem
                    : activeItem === "tasks"
                      ? isTaskItem
                      : activeItem === "team-performance"
                        ? isTeamPerformanceItem
                        : activeItem === "territories"
                          ? isTerritoryItem
                          : item.active;
            const itemHref = isOverviewItem
              ? "/"
              : isCustomerItem
                ? "/customers"
                : isVisitItem
                  ? "/visits"
                  : isFollowUpItem
                    ? "/follow-ups"
                    : isTaskItem
                      ? "/tasks"
                      : isTeamPerformanceItem
                        ? "/team-performance"
                        : "/territories";
            const itemDestination = isOverviewItem
              ? "dashboard"
              : isCustomerItem
                ? "directory"
                : isVisitItem
                  ? "planner"
                  : isFollowUpItem
                    ? "tracker"
                    : isTaskItem
                      ? "board"
                      : "workspace";
            const itemClassName = `flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium lg:min-h-11 ${
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-950/40"
                : "text-slate-400"
            }`;
            const itemContent = (
              <>
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-bold ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-white/5 text-slate-500"
                  }`}
                >
                  {item.shortLabel}
                </span>
                <span className="min-w-0 whitespace-normal leading-4 lg:truncate lg:whitespace-nowrap">
                  {item.label}
                </span>
              </>
            );

            return (
              <li key={item.label}>
                {isOverviewItem ||
                isCustomerItem ||
                isVisitItem ||
                isFollowUpItem ||
                isTaskItem ||
                isTeamPerformanceItem ||
                isTerritoryItem ? (
                  <Link
                    href={itemHref}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`Open ${item.label} ${itemDestination}`}
                    className={`${itemClassName} transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300`}
                  >
                    {itemContent}
                  </Link>
                ) : (
                  <span
                    aria-current={isActive ? "page" : undefined}
                    className={itemClassName}
                  >
                    {itemContent}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-3.5">
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-400">{profile.title}</p>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
