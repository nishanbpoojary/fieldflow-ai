import { describe, expect, it } from "vitest";

import {
  getSidebarNavigation,
  getSidebarProfileSubtitle,
  isSidebarRouteActive,
  sidebarLayoutClassNames,
} from "@/features/dashboard/components/app-sidebar";

describe("getSidebarNavigation", () => {
  it("keeps the Manager workspace navigation unchanged for non-admin Managers", () => {
    expect(
      getSidebarNavigation("manager").map((item) => item.label),
    ).toEqual([
      "Overview",
      "Customers",
      "Visits",
      "Follow-ups",
      "Tasks",
      "Team Performance",
      "Territories",
    ]);
  });

  it("treats an omitted Organization Admin flag as false", () => {
    expect(
      getSidebarNavigation("manager", undefined).map((item) => item.label),
    ).not.toContain("Users");
  });

  it("keeps the Sales Executive workspace navigation unchanged for non-admin Sales Executives", () => {
    expect(
      getSidebarNavigation("sales_executive").map((item) => item.label),
    ).toEqual([
      "Overview",
      "My Customers",
      "Today's Visits",
      "Follow-ups",
      "Tasks",
      "My Performance",
    ]);
  });

  it("adds the Users directory only for trusted Organization Admin navigation", () => {
    expect(
      getSidebarNavigation("manager", true).map((item) => item.label),
    ).toContain("Users");
    expect(
      getSidebarNavigation("sales_executive", false).map((item) => item.label),
    ).not.toContain("Users");
  });

  it("falls back to the role subtitle when trusted job title is omitted", () => {
    expect(getSidebarProfileSubtitle("manager")).toBe(
      "Regional Sales Manager",
    );
    expect(getSidebarProfileSubtitle("sales_executive", null)).toBe(
      "Sales Executive - Metro North",
    );
  });

  it("shows a trusted job title when present", () => {
    expect(getSidebarProfileSubtitle("manager", "Operations Lead")).toBe(
      "Operations Lead",
    );
  });

  it("marks Overview active only at the root dashboard route", () => {
    expect(isSidebarRouteActive("/", "/")).toBe(true);
    expect(isSidebarRouteActive("/settings/profile", "/")).toBe(false);
    expect(isSidebarRouteActive("/customers", "/")).toBe(false);
  });

  it("keeps Profile Settings active for its own route family only", () => {
    expect(isSidebarRouteActive("/settings/profile", "/settings/profile")).toBe(
      true,
    );
    expect(
      isSidebarRouteActive("/settings/profile/extra", "/settings/profile", {
        includeNested: true,
      }),
    ).toBe(true);
    expect(isSidebarRouteActive("/settings/profile", "/")).toBe(false);
  });

  it("keeps Customers active on customer detail routes", () => {
    expect(
      isSidebarRouteActive("/customers/customer-123", "/customers", {
        includeNested: true,
      }),
    ).toBe(true);
  });

  it("supports nested Users routes without matching neighboring admin routes", () => {
    expect(
      isSidebarRouteActive("/admin/users", "/admin/users", {
        includeNested: true,
      }),
    ).toBe(true);
    expect(
      isSidebarRouteActive("/admin/users/invites", "/admin/users", {
        includeNested: true,
      }),
    ).toBe(true);
    expect(
      isSidebarRouteActive("/admin/teams", "/admin/users", {
        includeNested: true,
      }),
    ).toBe(false);
  });

  it("keeps desktop navigation independently scrollable above a fixed account footer", () => {
    expect(sidebarLayoutClassNames.container).toContain("lg:h-dvh");
    expect(sidebarLayoutClassNames.container).toContain("lg:overflow-hidden");
    expect(sidebarLayoutClassNames.header).toContain("shrink-0");
    expect(sidebarLayoutClassNames.navigation).toContain("lg:min-h-0");
    expect(sidebarLayoutClassNames.navigation).toContain("lg:flex-1");
    expect(sidebarLayoutClassNames.navigation).toContain("lg:overflow-y-auto");
    expect(sidebarLayoutClassNames.navigation).toContain(
      "fieldflow-sidebar-scroll",
    );
    expect(sidebarLayoutClassNames.footer).toContain("shrink-0");
    expect(sidebarLayoutClassNames.accountCard).toContain("overflow-hidden");
  });
});
