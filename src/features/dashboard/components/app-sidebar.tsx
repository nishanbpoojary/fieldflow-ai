"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  managerNavigation,
  salesExecutiveNavigation,
} from "@/features/dashboard/data/demo-dashboard";
import type { AppRole } from "@/features/dashboard/types";

interface AppSidebarProps {
  role: AppRole;
  displayName: string;
  jobTitle?: string | null;
  isOrganizationAdmin?: boolean;
  activeItem?:
    | "overview"
    | "customers"
    | "visits"
    | "follow-ups"
    | "tasks"
    | "team-performance"
    | "territories"
    | "my-performance"
    | "admin-users"
    | "profile-settings";
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

const organizationAdminNavigationItem = {
  label: "Users",
  shortLabel: "US",
  active: false,
};

export const sidebarLayoutClassNames = {
  container:
    "bg-slate-950 text-slate-100 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:min-h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-hidden",
  header:
    "shrink-0 border-b border-white/10 px-5 py-5 lg:border-b-0 lg:px-6 lg:py-7",
  navigation:
    "fieldflow-sidebar-scroll px-3 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-4 lg:py-2",
  footer:
    "shrink-0 border-t border-white/10 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:mt-auto lg:p-4 lg:pb-[calc(1rem+env(safe-area-inset-bottom))]",
  accountCard: "overflow-hidden rounded-xl bg-white/5 p-3",
};

interface SidebarRouteMatchOptions {
  includeNested?: boolean;
}

function normalizeSidebarPathname(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

export function isSidebarRouteActive(
  pathname: string,
  href: string,
  options: SidebarRouteMatchOptions = {},
) {
  const currentPathname = normalizeSidebarPathname(pathname);
  const targetHref = normalizeSidebarPathname(href);

  if (targetHref === "/") {
    return currentPathname === "/";
  }

  if (options.includeNested) {
    return (
      currentPathname === targetHref ||
      currentPathname.startsWith(`${targetHref}/`)
    );
  }

  return currentPathname === targetHref;
}

export function getSidebarNavigation(
  role: AppRole,
  isOrganizationAdmin = false,
) {
  const baseNavigation =
    role === "manager" ? managerNavigation : salesExecutiveNavigation;

  if (!isOrganizationAdmin) {
    return baseNavigation;
  }

  return [...baseNavigation, organizationAdminNavigationItem];
}

export function getSidebarProfileSubtitle(
  role: AppRole,
  jobTitle?: string | null,
) {
  const normalizedJobTitle = jobTitle?.trim();

  return normalizedJobTitle ? normalizedJobTitle : roleProfiles[role].title;
}

export function AppSidebar({
  role,
  displayName,
  jobTitle,
  isOrganizationAdmin = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const profile = roleProfiles[role];
  const navigation = getSidebarNavigation(role, isOrganizationAdmin);
  const profileSubtitle = getSidebarProfileSubtitle(role, jobTitle);
  const isProfileSettingsActive = isSidebarRouteActive(
    pathname,
    "/settings/profile",
    { includeNested: true },
  );

  return (
    <aside className={sidebarLayoutClassNames.container}>
      <div className={sidebarLayoutClassNames.header}>
        <div className="flex items-center justify-between gap-3 lg:block">
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
              <p className="truncate text-xs text-slate-400">
                Operations copilot
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-200 lg:mt-5 lg:inline-flex lg:text-[11px]">
            {profile.badge}
          </span>
        </div>
      </div>

      <nav
        aria-label={profile.navigationLabel}
        className={sidebarLayoutClassNames.navigation}
      >
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
            const isMyPerformanceItem = item.label === "My Performance";
            const isAdminUsersItem = item.label === "Users";
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
                      : isTerritoryItem
                        ? "/territories"
                        : isAdminUsersItem
                          ? "/admin/users"
                          : "/my-performance";
            const supportsNestedMatch = isCustomerItem || isAdminUsersItem;
            const isActive = isSidebarRouteActive(pathname, itemHref, {
              includeNested: supportsNestedMatch,
            });
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
                      : isAdminUsersItem
                        ? "directory"
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
                isTerritoryItem ||
                isMyPerformanceItem ||
                isAdminUsersItem ? (
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

      <div className={sidebarLayoutClassNames.footer}>
        <div className={sidebarLayoutClassNames.accountCard}>
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-400">
            {profileSubtitle}
          </p>
          <Link
            href="/settings/profile"
            aria-current={isProfileSettingsActive ? "page" : undefined}
            aria-label="Open Profile Settings"
            className={`mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${
              isProfileSettingsActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-950/40"
                : "bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            Profile
          </Link>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
