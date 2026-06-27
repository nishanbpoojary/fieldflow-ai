import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";

import { getInviteRecipientAccess } from "./invite-recipient";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

interface MockInviteProfile {
  id: string;
  display_name: string;
  status: string;
  organization_id: string | null;
  team_id: string | null;
  is_organization_admin: boolean;
}

interface MockClientOptions {
  claimsSub?: unknown;
  claimsError?: Error | null;
  profile?: MockInviteProfile | null;
  profileError?: Error | null;
}

function createProfile(
  overrides: Partial<MockInviteProfile> = {},
): MockInviteProfile {
  return {
    id: "recipient-profile-id",
    display_name: "New teammate",
    status: "invited",
    organization_id: null,
    team_id: null,
    is_organization_admin: false,
    ...overrides,
  };
}

function mockServerClient(options: MockClientOptions = {}) {
  const claimsSub =
    "claimsSub" in options ? options.claimsSub : "recipient-profile-id";
  const claimsError = options.claimsError ?? null;
  const profile =
    "profile" in options ? options.profile : createProfile();
  const profileError = options.profileError ?? null;
  const getClaims = vi.fn().mockResolvedValue(
    claimsError
      ? {
          data: null,
          error: claimsError,
        }
      : {
          data: { claims: { sub: claimsSub } },
          error: null,
        },
  );
  const maybeSingle = vi.fn().mockResolvedValue({
    data: profile,
    error: profileError,
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const client = {
    auth: {
      getClaims,
    },
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>;

  createClientMock.mockResolvedValue(client);

  return { getClaims, from, select, eq, maybeSingle };
}

describe("getInviteRecipientAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a valid invited unassigned non-admin profile", async () => {
    const mocks = mockServerClient({
      profile: createProfile({
        status: "invited",
        organization_id: null,
        team_id: null,
        is_organization_admin: false,
      }),
    });

    await expect(getInviteRecipientAccess()).resolves.toEqual({
      status: "invited",
      id: "recipient-profile-id",
      displayName: "New teammate",
    });

    expect(mocks.getClaims).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.eq).toHaveBeenCalledWith("id", "recipient-profile-id");
  });

  it("resolves a valid active profile as active", async () => {
    mockServerClient({
      profile: createProfile({
        status: "active",
        organization_id: "organization-id",
        team_id: "team-id",
      }),
    });

    await expect(getInviteRecipientAccess()).resolves.toEqual({
      status: "active",
      id: "recipient-profile-id",
    });
  });

  it("returns unavailable for a disabled profile", async () => {
    mockServerClient({
      profile: createProfile({
        status: "disabled",
      }),
    });

    await expect(getInviteRecipientAccess()).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("returns unavailable for a missing profile", async () => {
    mockServerClient({
      profile: null,
    });

    await expect(getInviteRecipientAccess()).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("returns unavailable for a malformed profile status", async () => {
    mockServerClient({
      profile: createProfile({
        status: "suspended",
      }),
    });

    await expect(getInviteRecipientAccess()).resolves.toEqual({
      status: "unavailable",
    });
  });

  it.each([
    [
      "organization assignment",
      { organization_id: "organization-id" },
    ],
    ["team assignment", { team_id: "team-id" }],
    ["organization admin permission", { is_organization_admin: true }],
  ] as const)(
    "returns unavailable for an invited profile with unsafe %s",
    async (_caseName, overrides) => {
      mockServerClient({
        profile: createProfile({
          status: "invited",
          ...overrides,
        }),
      });

      await expect(getInviteRecipientAccess()).resolves.toEqual({
        status: "unavailable",
      });
    },
  );

  it.each([
    ["missing claim subject", undefined],
    ["non-string claim subject", 42],
  ] as const)("returns unauthenticated for %s", async (_caseName, claimsSub) => {
    const mocks = mockServerClient({
      claimsSub,
    });

    await expect(getInviteRecipientAccess()).resolves.toEqual({
      status: "unauthenticated",
    });

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns unauthenticated when verified claims fail", async () => {
    const mocks = mockServerClient({
      claimsError: new Error("raw claims failure"),
    });

    await expect(getInviteRecipientAccess()).resolves.toEqual({
      status: "unauthenticated",
    });

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns unavailable when the profile query fails", async () => {
    mockServerClient({
      profileError: new Error("raw profile failure"),
    });

    await expect(getInviteRecipientAccess()).resolves.toEqual({
      status: "unavailable",
    });
  });
});
