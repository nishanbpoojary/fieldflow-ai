import { describe, expect, it, vi } from "vitest";

import { ProfileSettingsWorkspace } from "@/features/settings/profile/components/profile-settings-workspace";
import { requireProfileSettingsUser } from "@/lib/auth/profile-settings";

import ProfileSettingsPage from "./page";

vi.mock("@/lib/auth/profile-settings", () => ({
  requireProfileSettingsUser: vi.fn(),
}));

vi.mock(
  "@/features/settings/profile/components/profile-settings-workspace",
  () => ({
    ProfileSettingsWorkspace: vi.fn(() => null),
  }),
);

const requireProfileSettingsUserMock = vi.mocked(requireProfileSettingsUser);
const ProfileSettingsWorkspaceMock = vi.mocked(ProfileSettingsWorkspace);

describe("ProfileSettingsPage", () => {
  it("does not render profile settings when the guard fails", async () => {
    requireProfileSettingsUserMock.mockRejectedValue(
      new Error("NEXT_REDIRECT"),
    );

    await expect(ProfileSettingsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(ProfileSettingsWorkspaceMock).not.toHaveBeenCalled();
  });
});
