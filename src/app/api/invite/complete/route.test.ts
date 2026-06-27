import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";

import { POST } from "./route";

const adminState = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: adminState.createSupabaseAdminClient,
}));

const createClientMock = vi.mocked(createClient);

type ProfileStatus = "invited" | "active" | "disabled";

interface MockClientOptions {
  userId?: string | null;
  profileStatus?: ProfileStatus;
  profileMissing?: boolean;
  profileError?: Error | null;
  updateUserError?: Error | null;
}

function createMockServerClient({
  userId = "recipient-profile-id",
  profileStatus = "invited",
  profileMissing = false,
  profileError = null,
  updateUserError = null,
}: MockClientOptions = {}) {
  const getClaims = vi.fn().mockResolvedValue(
    userId
      ? {
          data: { claims: { sub: userId } },
          error: null,
        }
      : {
          data: null,
          error: new Error("raw claims failure"),
        },
  );
  const updateUser = vi.fn().mockResolvedValue({ error: updateUserError });
  const profile =
    profileMissing || !userId
      ? null
      : {
          id: userId,
          display_name: "New user",
          status: profileStatus,
          organization_id: profileStatus === "active" ? "org-id" : null,
          team_id: profileStatus === "active" ? "team-id" : null,
          is_organization_admin: false,
        };
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
      updateUser,
    },
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>;

  return {
    client,
    getClaims,
    updateUser,
    from,
    select,
    eq,
    maybeSingle,
  };
}

function mockActivationResult(
  outcome: "activated" | "already_active" | "manager_unavailable" | "unavailable",
  activated: boolean,
) {
  adminState.rpc.mockResolvedValue({
    data: [
      {
        profile_id: "recipient-profile-id",
        app_role: "sales_executive",
        outcome,
        activated,
      },
    ],
    error: null,
  });
}

function createJsonRequest(body: unknown, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Origin")) {
    headers.set("Origin", "http://localhost");
  }

  return new Request("http://localhost/api/invite/complete", {
    method: "POST",
    ...init,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function readResponse(response: Response) {
  return (await response.json()) as { result?: string };
}

function expectNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe(
    "private, no-store, max-age=0, must-revalidate",
  );
}

describe("POST /api/invite/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminState.createSupabaseAdminClient.mockReturnValue({
      rpc: adminState.rpc,
    });
    mockActivationResult("activated", true);
  });

  it("rejects missing or wrong content type before Supabase work", async () => {
    const response = await POST(
      createJsonRequest(
        { displayName: "Maya Chen", password: "new-password" },
        {
          headers: {
            "Content-Type": "text/plain",
            Origin: "http://localhost",
          },
        },
      ),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(415);
    expect(body.result).toBe("invalid_request");
    expectNoStore(response);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON safely", async () => {
    const response = await POST(createJsonRequest("{"));
    const body = await readResponse(response);

    expect(response.status).toBe(400);
    expect(body.result).toBe("invalid_request");
    expectNoStore(response);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("rejects oversized requests before Supabase work", async () => {
    const response = await POST(
      createJsonRequest({
        displayName: "Maya Chen",
        password: "x".repeat(5000),
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(400);
    expect(body.result).toBe("invalid_request");
    expectNoStore(response);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests", async () => {
    const response = await POST(
      createJsonRequest(
        { displayName: "Maya Chen", password: "new-password" },
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://evil.example",
          },
        },
      ),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(403);
    expect(body.result).toBe("forbidden");
    expectNoStore(response);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("rejects requests without an Origin header", async () => {
    const response = await POST(
      new Request("http://localhost/api/invite/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: "Maya Chen",
          password: "new-password",
        }),
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(403);
    expect(body.result).toBe("forbidden");
    expectNoStore(response);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const mocks = createMockServerClient({ userId: null });
    createClientMock.mockResolvedValue(mocks.client);

    const response = await POST(
      createJsonRequest({
        displayName: "Maya Chen",
        password: "new-password",
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(401);
    expect(body.result).toBe("unauthenticated");
    expectNoStore(response);
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("rejects invalid display name and password shapes", async () => {
    const response = await POST(
      createJsonRequest({
        displayName: " ",
        password: " ",
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(400);
    expect(body.result).toBe("invalid_request");
    expectNoStore(response);
    expect(createClientMock).not.toHaveBeenCalled();
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("does not call activation when password update fails", async () => {
    const mocks = createMockServerClient({
      updateUserError: new Error("raw auth failure"),
    });
    createClientMock.mockResolvedValue(mocks.client);

    const response = await POST(
      createJsonRequest({
        displayName: "Maya Chen",
        password: "new-password",
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(503);
    expect(body.result).toBe("unavailable");
    expect(JSON.stringify(body)).not.toContain("raw auth failure");
    expectNoStore(response);
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "new-password" });
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
    expect(adminState.rpc).not.toHaveBeenCalled();
  });

  it("updates the password before calling the activation RPC on success", async () => {
    const mocks = createMockServerClient();
    createClientMock.mockResolvedValue(mocks.client);
    mockActivationResult("activated", true);

    const response = await POST(
      createJsonRequest({
        displayName: "  Maya   Chen  ",
        password: "new-password",
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(200);
    expect(body.result).toBe("activated");
    expectNoStore(response);
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "new-password" });
    expect(adminState.createSupabaseAdminClient).toHaveBeenCalledTimes(1);
    expect(adminState.rpc).toHaveBeenCalledWith(
      "accept_organization_invitation",
      {
        p_recipient_profile_id: "recipient-profile-id",
        p_display_name: "Maya Chen",
      },
    );
    expect(mocks.updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      adminState.rpc.mock.invocationCallOrder[0],
    );
  });

  it("treats already_active as safe idempotent success", async () => {
    const mocks = createMockServerClient({ profileStatus: "active" });
    createClientMock.mockResolvedValue(mocks.client);
    mockActivationResult("already_active", true);

    const response = await POST(
      createJsonRequest({
        displayName: "Maya Chen",
        password: "new-password",
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(200);
    expect(body.result).toBe("already_active");
    expectNoStore(response);
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(adminState.rpc).toHaveBeenCalledWith(
      "accept_organization_invitation",
      {
        p_recipient_profile_id: "recipient-profile-id",
        p_display_name: "Maya Chen",
      },
    );
  });

  it("maps manager_unavailable to a safe conflict response", async () => {
    const mocks = createMockServerClient();
    createClientMock.mockResolvedValue(mocks.client);
    mockActivationResult("manager_unavailable", false);

    const response = await POST(
      createJsonRequest({
        displayName: "Maya Chen",
        password: "new-password",
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(409);
    expect(body.result).toBe("manager_unavailable");
    expectNoStore(response);
  });

  it("maps unavailable or unknown RPC results to generic unavailable", async () => {
    const mocks = createMockServerClient();
    createClientMock.mockResolvedValue(mocks.client);
    adminState.rpc.mockResolvedValue({
      data: [
        {
          profile_id: null,
          app_role: null,
          outcome: "surprising_raw_state",
          activated: false,
        },
      ],
      error: null,
    });

    const response = await POST(
      createJsonRequest({
        displayName: "Maya Chen",
        password: "new-password",
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(503);
    expect(body.result).toBe("unavailable");
    expect(JSON.stringify(body)).not.toContain("surprising_raw_state");
    expectNoStore(response);
  });

  it("hides raw SQL or configuration failures", async () => {
    const mocks = createMockServerClient();
    createClientMock.mockResolvedValue(mocks.client);
    adminState.rpc.mockResolvedValue({
      data: null,
      error: new Error("raw SQL failure"),
    });

    const response = await POST(
      createJsonRequest({
        displayName: "Maya Chen",
        password: "new-password",
      }),
    );
    const body = await readResponse(response);

    expect(response.status).toBe(503);
    expect(body.result).toBe("unavailable");
    expect(JSON.stringify(body)).not.toContain("raw SQL failure");
    expectNoStore(response);
  });

  it("loads the Admin client only after the protected password step", async () => {
    const invalidResponse = await POST(
      createJsonRequest({
        displayName: "",
        password: "",
      }),
    );

    expect(invalidResponse.status).toBe(400);
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();

    const mocks = createMockServerClient();
    createClientMock.mockResolvedValue(mocks.client);

    const validResponse = await POST(
      createJsonRequest({
        displayName: "Maya Chen",
        password: "new-password",
      }),
    );

    expect(validResponse.status).toBe(200);
    expect(adminState.createSupabaseAdminClient).toHaveBeenCalledTimes(1);
  });
});
