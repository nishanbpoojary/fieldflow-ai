import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";

import { GET } from "./route";

const adminImportState = vi.hoisted(() => ({
  imported: false,
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => {
  adminImportState.imported = true;

  return {
    createSupabaseAdminClient: adminImportState.createSupabaseAdminClient,
  };
});

const createClientMock = vi.mocked(createClient);

function createExchangeMock(error: Error | null = null) {
  return vi.fn().mockResolvedValue({ error });
}

async function callCallback(url: string) {
  return GET(new Request(url));
}

function expectNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe(
    "private, no-store, max-age=0, must-revalidate",
  );
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminImportState.imported = false;
  });

  it("redirects missing code to /login without calling Supabase", async () => {
    const response = await callCallback("http://localhost/auth/callback");

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost/login");
    expectNoStore(response);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("exchanges a valid code once and redirects to /invite/accept", async () => {
    const exchangeCodeForSession = createExchangeMock();

    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as Awaited<ReturnType<typeof createClient>>);

    const response = await callCallback(
      "http://localhost/auth/callback?code=valid-code",
    );

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(
      "http://localhost/invite/accept",
    );
    expectNoStore(response);
  });

  it("redirects failed exchanges to /login without exposing the Auth error", async () => {
    const exchangeCodeForSession = createExchangeMock(
      new Error("raw provider failure"),
    );

    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as Awaited<ReturnType<typeof createClient>>);

    const response = await callCallback(
      "http://localhost/auth/callback?code=bad-code",
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost/login");
    expect(response.headers.get("Location")).not.toContain(
      "raw provider failure",
    );
    expectNoStore(response);
  });

  it("ignores malicious redirect parameters after a successful exchange", async () => {
    const exchangeCodeForSession = createExchangeMock();

    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as Awaited<ReturnType<typeof createClient>>);

    const response = await callCallback(
      "http://localhost/auth/callback?code=valid-code&next=https%3A%2F%2Fevil.example%2Fsteal&redirect=/admin/users&returnTo=https%3A%2F%2Fevil.example&redirectTo=/territories",
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(
      "http://localhost/invite/accept",
    );
    expect(response.headers.get("Location")).not.toContain("evil.example");
    expectNoStore(response);
  });

  it("ignores malicious redirect parameters when the exchange fails", async () => {
    const exchangeCodeForSession = createExchangeMock(
      new Error("invalid code"),
    );

    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as Awaited<ReturnType<typeof createClient>>);

    const response = await callCallback(
      "http://localhost/auth/callback?code=bad-code&next=https%3A%2F%2Fevil.example%2Fsteal",
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("http://localhost/login");
    expect(response.headers.get("Location")).not.toContain("evil.example");
    expectNoStore(response);
  });

  it("does not import or call the Supabase Admin client", async () => {
    const exchangeCodeForSession = createExchangeMock();

    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as Awaited<ReturnType<typeof createClient>>);

    await callCallback("http://localhost/auth/callback?code=valid-code");

    expect(adminImportState.imported).toBe(false);
    expect(adminImportState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });
});
