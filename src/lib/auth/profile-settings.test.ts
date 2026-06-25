import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";

import { getCurrentUser } from "./current-user";
import { getProfileSettingsUser } from "./profile-settings";

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

const activeManager: ProfileRow = {
  id: "manager-id",
  display_name: "Arjun Rao",
  job_title: "Regional Sales Manager",
  role: "manager",
  team_id: "team-id",
  status: "active",
  organization_id: "organization-id",
  is_organization_admin: false,
};

const activeTeamlessOrganizationAdmin: ProfileRow = {
  id: "organization-admin-id",
  display_name: "Priya Admin",
  job_title: "Operations Lead",
  role: "manager",
  team_id: null,
  status: "active",
  organization_id: "organization-id",
  is_organization_admin: true,
};

const createClientMock = vi.mocked(createClient);

function withProfile(profile: ProfileRow | null, userId = "manager-id") {
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

describe("getProfileSettingsUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves an active normal workspace user", async () => {
    const { eq, select } = withProfile(activeManager);

    await expect(getProfileSettingsUser()).resolves.toEqual({
      id: "manager-id",
      displayName: "Arjun Rao",
      jobTitle: "Regional Sales Manager",
      role: "manager",
      teamId: "team-id",
      organizationId: "organization-id",
      isOrganizationAdmin: false,
    });
    expect(select).toHaveBeenCalledWith(
      "id, display_name, job_title, role, team_id, status, organization_id, is_organization_admin",
    );
    expect(eq).toHaveBeenCalledWith("id", "manager-id");
  });

  it("resolves a teamless active Organization Admin for profile settings", async () => {
    withProfile(activeTeamlessOrganizationAdmin, "organization-admin-id");

    await expect(getProfileSettingsUser()).resolves.toEqual({
      id: "organization-admin-id",
      displayName: "Priya Admin",
      jobTitle: "Operations Lead",
      role: "manager",
      teamId: null,
      organizationId: "organization-id",
      isOrganizationAdmin: true,
    });
  });

  it("denies invited users", async () => {
    withProfile({
      ...activeManager,
      status: "invited",
    });

    await expect(getProfileSettingsUser()).resolves.toBeNull();
  });

  it("denies disabled users", async () => {
    withProfile({
      ...activeManager,
      status: "disabled",
    });

    await expect(getProfileSettingsUser()).resolves.toBeNull();
  });

  it("denies users without a matching profile", async () => {
    withProfile(null);

    await expect(getProfileSettingsUser()).resolves.toBeNull();
  });

  it("denies users without organization membership", async () => {
    withProfile({
      ...activeManager,
      organization_id: null,
    });

    await expect(getProfileSettingsUser()).resolves.toBeNull();
  });

  it("does not weaken existing normal current-user team requirements", async () => {
    withProfile(activeTeamlessOrganizationAdmin, "organization-admin-id");

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
