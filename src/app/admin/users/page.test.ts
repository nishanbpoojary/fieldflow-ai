import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const organizationAdmin = {
  id: "org-admin-profile-id",
  organizationId: "organization-id",
  role: "manager" as const,
  teamId: null,
  displayName: "Nishan Poojary",
  jobTitle: "Software Developer",
  isOrganizationAdmin: true,
};

describe("OrganizationUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies route access before loading directory data when the admin guard fails", async () => {
    requireOrganizationAdminMock.mockRejectedValue(
      new Error("NEXT_REDIRECT"),
    );

    await expect(OrganizationUsersPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(getOrganizationUsersDirectoryMock).not.toHaveBeenCalled();
  });

  it("loads the organization directory only after the Organization Admin guard succeeds", async () => {
    const result = {
      status: "ready" as const,
      data: {
        organizationName: "FieldFlow Demo Motors",
        inviteTeams: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Metro North",
          },
        ],
        summary: {
          totalUsers: 1,
          activeUsers: 1,
          invitedUsers: 0,
          disabledUsers: 0,
        },
        users: [],
      },
    };

    requireOrganizationAdminMock.mockResolvedValue(organizationAdmin);
    getOrganizationUsersDirectoryMock.mockResolvedValue(result);

    const element = await OrganizationUsersPage();

    expect(getOrganizationUsersDirectoryMock).toHaveBeenCalledWith(
      organizationAdmin,
    );
    expect(isValidElement(element)).toBe(true);
    expect(element.props).toEqual({
      organizationAdmin,
      result,
    });
  });
});
