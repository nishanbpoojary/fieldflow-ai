import { describe, expect, it } from "vitest";

import { resolveVisitDemoRole } from "@/features/visits/data/demo-visits";

describe("resolveVisitDemoRole", () => {
  it("keeps the default static visit helper output unchanged", () => {
    expect(resolveVisitDemoRole(undefined)).toEqual({
      role: "manager",
      roleLabel: "Manager",
    });
  });

  it("keeps the Sales Executive static visit helper output unchanged", () => {
    expect(resolveVisitDemoRole("sales_executive")).toEqual({
      role: "sales_executive",
      roleLabel: "Sales Executive",
    });
  });
});
