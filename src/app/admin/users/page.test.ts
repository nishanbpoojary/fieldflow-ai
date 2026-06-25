import { describe, expect, it, vi } from "vitest";

import { getOrganizationUsersDirectory } from "@/features/admin/users/data/organization-users";
import { requireOrganizationAdmin } from "@/lib/auth/organization-admin";

import OrganizationUsersPage from "./page";

vi.mock("@/lib/auth/organization-admin", () => ({
  requireOrganizationAdmin: vi.fn(),
}));

vi.mock("@/features/admin/users/data/organization-users", () => ({
  getOrganizationUsersDirectory: vi.fn(),
}));

vi.mock(
  "@/features/admin/users/components/organization-users-workspace",
  () => ({
    OrganizationUsersWorkspace: vi.fn(() => null),
  }),
);

const requireOrganizationAdminMock = vi.mocked(requireOrganizationAdmin);
const getOrganizationUsersDirectoryMock = vi.mocked(
  getOrganizationUsersDirectory,
);

describe("OrganizationUsersPage", () => {
  it("denies route access before loading directory data when the admin guard fails", async () => {
    requireOrganizationAdminMock.mockRejectedValue(
      new Error("NEXT_REDIRECT"),
    );

    await expect(OrganizationUsersPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(getOrganizationUsersDirectoryMock).not.toHaveBeenCalled();
  });
});
