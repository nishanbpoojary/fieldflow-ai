import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getInviteRecipientAccess } from "@/lib/auth/invite-recipient";

import InviteAcceptPage from "./page";

const navigationState = vi.hoisted(() => ({
  redirect: vi.fn((path: string): never => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

const adminState = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: navigationState.redirect,
  useRouter: () => ({
    replace: navigationState.replace,
    refresh: navigationState.refresh,
  }),
}));

vi.mock("@/lib/auth/invite-recipient", () => ({
  getInviteRecipientAccess: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: adminState.createSupabaseAdminClient,
}));

const getInviteRecipientAccessMock = vi.mocked(getInviteRecipientAccess);

describe("/invite/accept page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when no verified recipient claim exists", async () => {
    getInviteRecipientAccessMock.mockResolvedValue({
      status: "unauthenticated",
    });

    await expect(InviteAcceptPage()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(navigationState.redirect).toHaveBeenCalledWith("/login");
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("redirects active users to the workspace root", async () => {
    getInviteRecipientAccessMock.mockResolvedValue({
      status: "active",
      id: "active-profile-id",
    });

    await expect(InviteAcceptPage()).rejects.toThrow("NEXT_REDIRECT:/");

    expect(navigationState.redirect).toHaveBeenCalledWith("/");
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("renders the completion form for an invited recipient", async () => {
    getInviteRecipientAccessMock.mockResolvedValue({
      status: "invited",
      id: "recipient-profile-id",
      displayName: "New user",
    });

    const markup = renderToStaticMarkup(await InviteAcceptPage());

    expect(markup).toContain("Complete your account");
    expect(markup).toContain("Full name");
    expect(markup).toContain("New password");
    expect(markup).toContain("Confirm password");
    expect(markup).not.toContain("organization");
    expect(markup).not.toContain("target_team");
    expect(markup).not.toContain("invitation_id");
    expect(markup).not.toContain("manager");
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("renders a generic unavailable state for disabled or missing-profile states", async () => {
    getInviteRecipientAccessMock.mockResolvedValue({
      status: "unavailable",
    });

    const markup = renderToStaticMarkup(await InviteAcceptPage());

    expect(markup).toContain("Invitation completion unavailable");
    expect(markup).toContain("Return to sign in");
    expect(markup).not.toContain("Full name");
    expect(markup).not.toContain("New password");
    expect(markup).not.toContain("organization");
    expect(markup).not.toContain("team");
    expect(adminState.createSupabaseAdminClient).not.toHaveBeenCalled();
  });
});
