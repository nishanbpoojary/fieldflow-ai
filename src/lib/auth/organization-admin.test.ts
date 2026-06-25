import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";

import { getCurrentUser } from "./current-user";
import { getOrganizationAdmin } from "./organization-admin";

vi.mock("server-only", () => ({}), { virtual: true });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

type ClaimsResult = Awaited<
  ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getClaims"]>
>;

type ProfileRow = {
  id: string;
  display_name: string;
  job_title: string | null;
  role: "manager" | "sales_executive";
  team_id: string | null;
  status: "invited" | "active" | "disabled";
  organization_id: string | null;
  is_organization_admin: boolean;
};

type ProfileResult = {
  data: ProfileRow | null;
  error: Error | null;
};

const activeOrganizationAdminWithoutTeam: ProfileRow = {
  id: "organization-admin-id",
  display_name: "Priya Admin",
  job_title: "Operations Lead",
  role: "manager",
  team_id: null,
  status: "active",
  organization_id: "organization-id",
  is_organization_admin: true,
};

const activeOrganizationAdminWithTeam: ProfileRow = {
  ...activeOrganizationAdminWithoutTeam,
  team_id: "team-id",
};

const activeManager: ProfileRow = {
  id: "manager-id",
  display_name: "Arjun Rao",
  job_title: null,
  role: "manager",
  team_id: "team-id",
  status: "active",
  organization_id: "organization-id",
  is_organization_admin: false,
};

const activeSalesExecutive: ProfileRow = {
  id: "sales-id",
  display_name: "Maya Chen",
  job_title: "Sales Executive",
  role: "sales_executive",
  team_id: "team-id",
  status: "active",
  organization_id: "organization-id",
  is_organization_admin: false,
};

const createClientMock = vi.mocked(createClient);

function withProfile(profile: ProfileRow | null, userId = "organization-admin-id") {
  const claimsResult: ClaimsResult = {
    data: { claims: { sub: userId } },
    error: null,
  };
  const profileResult: ProfileResult = {
    data: profile,
    error: null,
  };
  const maybeSingle = vi.fn(async () => profileResult);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const supabase = {
    auth: {
      getClaims: vi.fn(async () => claimsResult),
    },
    from,
  };

  createClientMock.mockResolvedValue(
    supabase as unknown as Awaited<ReturnType<typeof createClient>>,
  );

  return { eq, select };
}

describe("getOrganizationAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves an active Organization Admin with organization_id and no team_id", async () => {
    const { eq, select } = withProfile(activeOrganizationAdminWithoutTeam);

    await expect(getOrganizationAdmin()).resolves.toEqual({
      id: "organization-admin-id",
      displayName: "Priya Admin",
      jobTitle: "Operations Lead",
      organizationId: "organization-id",
      role: "manager",
      teamId: null,
      isOrganizationAdmin: true,
    });
    expect(select).toHaveBeenCalledWith(
      "id, display_name, job_title, role, team_id, status, organization_id, is_organization_admin",
    );
    expect(eq).toHaveBeenCalledWith("id", "organization-admin-id");
  });

  it("resolves an active Organization Admin with a team_id", async () => {
    withProfile(activeOrganizationAdminWithTeam);

    await expect(getOrganizationAdmin()).resolves.toEqual({
      id: "organization-admin-id",
      displayName: "Priya Admin",
      jobTitle: "Operations Lead",
      organizationId: "organization-id",
      role: "manager",
      teamId: "team-id",
      isOrganizationAdmin: true,
    });
  });

  it("denies an active non-admin Manager", async () => {
    withProfile(activeManager, "manager-id");

    await expect(getOrganizationAdmin()).resolves.toBeNull();
  });

  it("denies an active non-admin Sales Executive", async () => {
    withProfile(activeSalesExecutive, "sales-id");

    await expect(getOrganizationAdmin()).resolves.toBeNull();
  });

  it("denies an invited Organization Admin", async () => {
    withProfile({
      ...activeOrganizationAdminWithoutTeam,
      status: "invited",
    });

    await expect(getOrganizationAdmin()).resolves.toBeNull();
  });

  it("denies a disabled Organization Admin", async () => {
    withProfile({
      ...activeOrganizationAdminWithoutTeam,
      status: "disabled",
    });

    await expect(getOrganizationAdmin()).resolves.toBeNull();
  });

  it("denies an Organization Admin without organization_id", async () => {
    withProfile({
      ...activeOrganizationAdminWithoutTeam,
      organization_id: null,
    });

    await expect(getOrganizationAdmin()).resolves.toBeNull();
  });

  it("denies users without a matching profile", async () => {
    withProfile(null);

    await expect(getOrganizationAdmin()).resolves.toBeNull();
  });

  it("does not make teamless Organization Admins eligible for normal workspaces", async () => {
    withProfile(activeOrganizationAdminWithoutTeam);

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
