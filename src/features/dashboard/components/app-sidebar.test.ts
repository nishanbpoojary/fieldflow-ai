import { describe, expect, it } from "vitest";

import { getSidebarNavigation } from "@/features/dashboard/components/app-sidebar";

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
});
