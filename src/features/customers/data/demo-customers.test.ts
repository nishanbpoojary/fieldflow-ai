import { describe, expect, it } from "vitest";

import { resolveCustomerDemoRole } from "@/features/customers/data/demo-customers";

describe("resolveCustomerDemoRole", () => {
  it("keeps the default static customer helper output unchanged", () => {
    expect(resolveCustomerDemoRole(undefined)).toEqual({
      role: "manager",
      roleLabel: "Manager",
    });
  });

  it("keeps the Sales Executive static customer helper output unchanged", () => {
    expect(resolveCustomerDemoRole("sales_executive")).toEqual({
      role: "sales_executive",
      roleLabel: "Sales Executive",
    });
  });
});
