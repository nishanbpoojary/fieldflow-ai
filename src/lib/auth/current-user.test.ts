import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";

import { getCurrentUser } from "./current-user";

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
  role: "manager" | "sales_executive";
  team_id: string | null;
  status: "invited" | "active" | "disabled";
  organization_id: string | null;
};

type ProfileResult = {
  data: ProfileRow | null;
  error: Error | null;
};

const activeManagerProfile: ProfileRow = {
  id: "manager-user-id",
  display_name: "Arjun Rao",
  role: "manager",
  team_id: "team-id",
  status: "active",
  organization_id: "organization-id",
};

const activeSalesExecutiveProfile: ProfileRow = {
  id: "sales-user-id",
  display_name: "Maya Chen",
  role: "sales_executive",
  team_id: "team-id",
  status: "active",
  organization_id: "organization-id",
};

const createClientMock = vi.mocked(createClient);

function withProfile(profile: ProfileRow | null, userId = "manager-user-id") {
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

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves an active Manager with organization and team assignment", async () => {
    const { eq, select } = withProfile(activeManagerProfile);

    await expect(getCurrentUser()).resolves.toEqual({
      id: "manager-user-id",
      displayName: "Arjun Rao",
      role: "manager",
      teamId: "team-id",
    });
    expect(select).toHaveBeenCalledWith(
      "id, display_name, role, team_id, status, organization_id",
    );
    expect(eq).toHaveBeenCalledWith("id", "manager-user-id");
  });

  it("resolves an active Sales Executive without weakening role behavior", async () => {
    withProfile(activeSalesExecutiveProfile, "sales-user-id");

    await expect(getCurrentUser()).resolves.toEqual({
      id: "sales-user-id",
      displayName: "Maya Chen",
      role: "sales_executive",
      teamId: "team-id",
    });
  });

  it("denies invited users", async () => {
    withProfile({
      ...activeSalesExecutiveProfile,
      status: "invited",
      organization_id: null,
      team_id: null,
    });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("denies disabled users", async () => {
    withProfile({
      ...activeSalesExecutiveProfile,
      status: "disabled",
    });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("denies users without a matching profile", async () => {
    withProfile(null);

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("denies active users without normal workspace assignment", async () => {
    withProfile({
      ...activeManagerProfile,
      team_id: null,
    });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("denies active users without organization membership", async () => {
    withProfile({
      ...activeManagerProfile,
      organization_id: null,
    });

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
