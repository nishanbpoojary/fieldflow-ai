import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { OrganizationAdminContext } from "@/lib/auth/organization-admin";

import { OrganizationUsersWorkspace } from "@/features/admin/users/components/organization-users-workspace";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signOut: vi.fn(),
    },
  })),
}));

const organizationAdmin: OrganizationAdminContext = {
  id: "org-admin-profile-id",
  organizationId: "organization-id",
  role: "manager",
  teamId: null,
  displayName: "Nishan Poojary",
  jobTitle: "Software Developer",
  isOrganizationAdmin: true,
};

describe("OrganizationUsersWorkspace", () => {
  it("renders the Invite User form with authorized team options and keeps the directory visible", () => {
    const markup = renderToStaticMarkup(
      <OrganizationUsersWorkspace
        organizationAdmin={organizationAdmin}
        result={{
          status: "ready",
          data: {
            organizationName: "FieldFlow Demo Motors",
            inviteTeams: [
              {
                id: "11111111-1111-4111-8111-111111111111",
                name: "Metro North",
              },
              {
                id: "22222222-2222-4222-8222-222222222222",
                name: "Metro South",
              },
            ],
            summary: {
              totalUsers: 1,
              activeUsers: 1,
              invitedUsers: 0,
              disabledUsers: 0,
            },
            users: [
              {
                name: "Maya Chen",
                role: "sales_executive",
                roleLabel: "Sales Executive",
                status: "active",
                statusLabel: "Active",
                teamName: "Metro North",
                isOrganizationAdmin: false,
              },
            ],
          },
        }}
      />,
    );

    expect(markup).toContain("Send an organization invitation");
    expect(markup).toContain("Email address");
    expect(markup).toContain("Sales Executive");
    expect(markup).toContain("Manager");
    expect(markup).toContain("Metro North");
    expect(markup).toContain("Metro South");
    expect(markup).toContain("Read-only user directory");
    expect(markup).toContain("Maya Chen");
    expect(markup).not.toContain("organizationId");
    expect(markup).not.toContain("actorProfileId");
    expect(markup).not.toContain("invitation_id");
    expect(markup).not.toContain("redirectTo");
    expect(markup).not.toContain("expiresAt");
  });
});
