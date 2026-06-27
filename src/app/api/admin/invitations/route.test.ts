import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getTrustedAppOrigin } from "@/lib/app-origin";
import { requireOrganizationAdmin } from "@/lib/auth/organization-admin";

import { POST } from "./route";

const adminState = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  inviteUserByEmail: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/organization-admin", () => ({
  requireOrganizationAdmin: vi.fn(),
}));

vi.mock("@/lib/app-origin", () => ({
  getTrustedAppOrigin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: adminState.createSupabaseAdminClient,
}));

const requireOrganizationAdminMock = vi.mocked(requireOrganizationAdmin);
const getTrustedAppOriginMock = vi.mocked(getTrustedAppOrigin);

const actorProfileId = "11111111-1111-4111-8111-111111111111";
const teamId = "123e4567-e89b-42d3-a456-426614174000";
const now = new Date("2026-06-27T00:00:00.000Z");
const expectedExpiresAt = "2026-07-04T00:00:00.000Z";

function mockOrganizationAdmin() {
  requireOrganizationAdminMock.mockResolvedValue({
    id: actorProfileId,
    displayName: "Nishan Poojary",
    jobTitle: "Operations Lead",
    organizationId: "22222222-2222-4222-8222-222222222222",
    role: "manager",
    teamId: null,
    isOrganizationAdmin: true,
  });
}

function createJsonRequest(body: unknown, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  if (!headers.has("Origin")) {
    headers.set("Origin", "https://app.example");
  }

  return new Request("https://app.example/api/admin/invitations", {
    method: "POST",
    ...init,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function createValidBody(overrides: Record<string, unknown> = {}) {
  return {
    email: "maya@example.com",
    role: "sales_executive",
    teamId,
    ...overrides,
  };
}

function reserveRow(overrides: Record<string, unknown> = {}) {
  return {
    invitation_id: "33333333-3333-4333-8333-333333333333",
    invitation_status: "pending",
    outcome: "created",
    newly_created: true,
    resend_count: 0,
    last_sent_at: null,
    expires_at: expectedExpiresAt,
    ...overrides,
  };
}

function mockAdminClient() {
  adminState.createSupabaseAdminClient.mockReturnValue({
    auth: {
      admin: {
        inviteUserByEmail: adminState.inviteUserByEmail,
      },
    },
    rpc: adminState.rpc,
  });
  adminState.inviteUserByEmail.mockResolvedValue({
    data: {
      user: {
        id: "44444444-4444-4444-8444-444444444444",
      },
    },
    error: null,
  });
  adminState.rpc.mockImplementation((functionName: string) => {
    if (functionName === "reserve_organization_invitation") {
      return Promise.resolve({ data: [reserveRow()], error: null });
    }

    if (functionName === "mark_organization_invitation_sent") {
      return Promise.resolve({
        data: [
          reserveRow({
            invitation_status: "sent",
            outcome: "sent",
            newly_created: false,
          }),
        ],
        error: null,
      });
    }

    return Promise.resolve({
      data: null,
      error: new Error("unexpected rpc"),
    });
  });
}

async function readResult(response: Response) {
  return (await response.json()) as { result?: string };
}

function expectNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe(
    "private, no-store, max-age=0, must-revalidate",
  );
}

async function expectInvalidRequest(request: Request, expectedStatus = 400) {
  const response = await POST(request);

  expect(response.status).toBe(expectedStatus);
  await expect(readResult(response)).resolves.toEqual({
    result: "invalid_request",
  });
  expectNoStore(response);
  expect(requireOrganizationAdminMock).not.toHaveBeenCalled();
  expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
}

describe("POST /api/admin/invitations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.clearAllMocks();
    mockOrganizationAdmin();
    getTrustedAppOriginMock.mockReturnValue("https://trusted.example");
    mockAdminClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects missing or wrong content type before auth or Admin work", async () => {
    await expectInvalidRequest(
      createJsonRequest(createValidBody(), {
        headers: {
          "Content-Type": "text/plain",
          Origin: "https://app.example",
        },
      }),
      415,
    );
  });

  it.each([
    ["malformed JSON", "{"],
    ["array body", []],
    ["null body", null],
    ["unexpected keys", createValidBody({ redirectTo: "https://evil.example" })],
  ])("rejects %s safely", async (_caseName, body) => {
    await expectInvalidRequest(createJsonRequest(body));
  });

  it("rejects oversized requests before auth or Admin work", async () => {
    await expectInvalidRequest(
      createJsonRequest(createValidBody(), {
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "5000",
          Origin: "https://app.example",
        },
      }),
    );
  });

  it("rejects missing Origin and cross-origin requests", async () => {
    const missingOriginResponse = await POST(
      new Request("https://app.example/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createValidBody()),
      }),
    );

    expect(missingOriginResponse.status).toBe(403);
    await expect(readResult(missingOriginResponse)).resolves.toEqual({
      result: "forbidden",
    });
    expectNoStore(missingOriginResponse);

    const crossOriginResponse = await POST(
      createJsonRequest(createValidBody(), {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://evil.example",
        },
      }),
    );

    expect(crossOriginResponse.status).toBe(403);
    await expect(readResult(crossOriginResponse)).resolves.toEqual({
      result: "forbidden",
    });
    expectNoStore(crossOriginResponse);
    expect(requireOrganizationAdminMock).not.toHaveBeenCalled();
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid email", { email: "not-email" }],
    ["invalid role", { role: "organization_admin" }],
    ["invalid team ID", { teamId: "team-id" }],
    ["invalid job title", { jobTitle: "A" }],
  ])("rejects %s before auth or Admin work", async (_caseName, overrides) => {
    await expectInvalidRequest(createJsonRequest(createValidBody(overrides)));
  });

  it("returns forbidden when Organization Admin resolution fails", async () => {
    requireOrganizationAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT"));

    const response = await POST(createJsonRequest(createValidBody()));

    expect(response.status).toBe(403);
    await expect(readResult(response)).resolves.toEqual({
      result: "forbidden",
    });
    expectNoStore(response);
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("returns unavailable for missing trusted app origin without loading Admin client", async () => {
    getTrustedAppOriginMock.mockReturnValue(null);

    const response = await POST(createJsonRequest(createValidBody()));

    expect(response.status).toBe(503);
    await expect(readResult(response)).resolves.toEqual({
      result: "unavailable",
    });
    expectNoStore(response);
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("reserves with server-derived actor ID and 7-day expiry", async () => {
    const response = await POST(
      createJsonRequest(
        createValidBody({
          email: "  MAYA@example.COM ",
          jobTitle: " Field   Sales ",
        }),
      ),
    );

    expect(response.status).toBe(200);
    await expect(readResult(response)).resolves.toEqual({ result: "sent" });
    expect(adminState.rpc).toHaveBeenNthCalledWith(
      1,
      "reserve_organization_invitation",
      {
        p_actor_profile_id: actorProfileId,
        p_invited_email: "maya@example.com",
        p_target_role: "sales_executive",
        p_target_team_id: teamId,
        p_job_title: "Field Sales",
        p_expires_at: expectedExpiresAt,
      },
    );
  });

  it("uses only trusted APP_BASE_URL for the Auth callback redirect", async () => {
    const response = await POST(createJsonRequest(createValidBody()));

    expect(response.status).toBe(200);
    expect(adminState.inviteUserByEmail).toHaveBeenCalledWith(
      "maya@example.com",
      { redirectTo: "https://trusted.example/auth/callback" },
    );
  });

  it("sends a newly created pending invitation then marks it sent", async () => {
    const response = await POST(createJsonRequest(createValidBody()));

    expect(response.status).toBe(200);
    await expect(readResult(response)).resolves.toEqual({ result: "sent" });
    expect(adminState.inviteUserByEmail).toHaveBeenCalledTimes(1);
    expect(adminState.rpc).toHaveBeenNthCalledWith(
      2,
      "mark_organization_invitation_sent",
      {
        p_actor_profile_id: actorProfileId,
        p_invitation_id: "33333333-3333-4333-8333-333333333333",
      },
    );
  });

  it.each([
    ["sent", "already_invited"],
    ["pending", "delivery_state_unknown"],
    ["send_failed", "delivery_failed"],
  ] as const)(
    "does not send email for existing %s reservation",
    async (invitationStatus, expectedResult) => {
      adminState.rpc.mockResolvedValueOnce({
        data: [
          reserveRow({
            invitation_status: invitationStatus,
            outcome: "already_reserved",
            newly_created: false,
          }),
        ],
        error: null,
      });

      const response = await POST(createJsonRequest(createValidBody()));

      expect(response.status).toBe(200);
      await expect(readResult(response)).resolves.toEqual({
        result: expectedResult,
      });
      expect(adminState.inviteUserByEmail).not.toHaveBeenCalled();
      expect(adminState.rpc).toHaveBeenCalledTimes(1);
    },
  );

  it("returns delivery_state_unknown when Auth returns an error without marking sent or failed", async () => {
    adminState.inviteUserByEmail.mockResolvedValue({
      data: null,
      error: new Error("raw auth provider failure"),
    });

    const response = await POST(createJsonRequest(createValidBody()));
    const body = await readResult(response);

    expect(response.status).toBe(202);
    expect(body).toEqual({ result: "delivery_state_unknown" });
    expect(JSON.stringify(body)).not.toContain("raw auth provider failure");
    expect(adminState.rpc).toHaveBeenCalledTimes(1);
    expect(adminState.rpc).not.toHaveBeenCalledWith(
      "mark_organization_invitation_send_failed",
      expect.anything(),
    );
  });

  it("returns delivery_state_unknown when Auth throws without retrying", async () => {
    adminState.inviteUserByEmail.mockRejectedValue(
      new Error("raw thrown auth failure"),
    );

    const response = await POST(createJsonRequest(createValidBody()));

    expect(response.status).toBe(202);
    await expect(readResult(response)).resolves.toEqual({
      result: "delivery_state_unknown",
    });
    expect(adminState.inviteUserByEmail).toHaveBeenCalledTimes(1);
    expect(adminState.rpc).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["null data", { data: null, error: null }],
    ["missing user", { data: {}, error: null }],
    ["null user", { data: { user: null }, error: null }],
    ["blank user id", { data: { user: { id: "" } }, error: null }],
    ["whitespace-only user id", { data: { user: { id: "   " } }, error: null }],
    ["null result", null],
    ["primitive string result", "unexpected"],
    ["primitive number result", 42],
  ])(
    "returns delivery_state_unknown for malformed no-error Auth success: %s",
    async (_caseName, authResult) => {
      adminState.inviteUserByEmail.mockResolvedValue(authResult);

      const response = await POST(createJsonRequest(createValidBody()));
      const body = await readResult(response);

      expect(response.status).toBe(202);
      expect(body).toEqual({ result: "delivery_state_unknown" });
      expect(JSON.stringify(body)).not.toContain(JSON.stringify(authResult));
      expect(adminState.inviteUserByEmail).toHaveBeenCalledTimes(1);
      expect(adminState.rpc).toHaveBeenCalledTimes(1);
      expect(adminState.rpc).not.toHaveBeenCalledWith(
        "mark_organization_invitation_sent",
        expect.anything(),
      );
      expect(adminState.rpc).not.toHaveBeenCalledWith(
        "mark_organization_invitation_send_failed",
        expect.anything(),
      );
    },
  );

  it("returns delivery_state_unknown when mark-sent fails without marking send failed", async () => {
    adminState.rpc.mockImplementation((functionName: string) => {
      if (functionName === "reserve_organization_invitation") {
        return Promise.resolve({ data: [reserveRow()], error: null });
      }

      return Promise.resolve({
        data: null,
        error: new Error("raw mark sent failure"),
      });
    });

    const response = await POST(createJsonRequest(createValidBody()));

    expect(response.status).toBe(202);
    await expect(readResult(response)).resolves.toEqual({
      result: "delivery_state_unknown",
    });
    expect(adminState.inviteUserByEmail).toHaveBeenCalledTimes(1);
    expect(adminState.rpc).not.toHaveBeenCalledWith(
      "mark_organization_invitation_send_failed",
      expect.anything(),
    );
  });

  it("returns delivery_state_unknown when mark-sent data is malformed", async () => {
    adminState.rpc.mockImplementation((functionName: string) => {
      if (functionName === "reserve_organization_invitation") {
        return Promise.resolve({ data: [reserveRow()], error: null });
      }

      return Promise.resolve({
        data: [
          reserveRow({
            invitation_status: "sent",
            outcome: "unexpected_raw_state",
          }),
        ],
        error: null,
      });
    });

    const response = await POST(createJsonRequest(createValidBody()));

    expect(response.status).toBe(202);
    await expect(readResult(response)).resolves.toEqual({
      result: "delivery_state_unknown",
    });
  });

  it.each([
    ["invitation_manager_already_assigned", "manager_unavailable", 409],
    ["invitation_conflict", "conflict", 409],
    ["invitation_invalid_input", "invalid_request", 400],
    ["invitation_target_unavailable", "invalid_request", 400],
    ["invitation_actor_unavailable", "forbidden", 403],
    ["surprising_raw_database_error", "unavailable", 503],
  ] as const)(
    "maps reserve error %s to safe result %s",
    async (message, expectedResult, expectedStatus) => {
      adminState.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error(message),
      });

      const response = await POST(createJsonRequest(createValidBody()));
      const body = await readResult(response);

      expect(response.status).toBe(expectedStatus);
      expect(body).toEqual({ result: expectedResult });
      expect(JSON.stringify(body)).not.toContain(message);
      expect(adminState.inviteUserByEmail).not.toHaveBeenCalled();
    },
  );

  it("returns unavailable for Admin configuration or RPC throws", async () => {
    adminState.createSupabaseAdminClient.mockImplementation(() => {
      throw new Error("raw config failure");
    });

    const response = await POST(createJsonRequest(createValidBody()));

    expect(response.status).toBe(503);
    await expect(readResult(response)).resolves.toEqual({
      result: "unavailable",
    });
    expectNoStore(response);
  });

  it("returns unavailable for malformed reservation data", async () => {
    adminState.rpc.mockResolvedValueOnce({
      data: [{ outcome: "created", invitation_status: "pending" }],
      error: null,
    });

    const response = await POST(createJsonRequest(createValidBody()));

    expect(response.status).toBe(503);
    await expect(readResult(response)).resolves.toEqual({
      result: "unavailable",
    });
    expect(adminState.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("sets no-store cache policy on successful responses", async () => {
    const response = await POST(createJsonRequest(createValidBody()));

    expectNoStore(response);
  });
});
