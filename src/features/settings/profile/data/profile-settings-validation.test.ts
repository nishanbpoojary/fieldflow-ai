import { describe, expect, it } from "vitest";

import { validateProfileSettingsInput } from "@/features/settings/profile/data/profile-settings-validation";

describe("validateProfileSettingsInput", () => {
  it("normalizes display name and job title whitespace", () => {
    expect(
      validateProfileSettingsInput({
        displayName: "  Arjun   Rao  ",
        jobTitle: " Regional   Sales   Manager ",
      }),
    ).toEqual({
      success: true,
      values: {
        displayName: "Arjun Rao",
        jobTitle: "Regional Sales Manager",
      },
      errors: {},
    });
  });

  it("rejects an empty display name", () => {
    const result = validateProfileSettingsInput({
      displayName: "   ",
      jobTitle: "",
    });

    expect(result.success).toBe(false);
    expect(result.errors.displayName).toBe("Enter a display name.");
  });

  it("turns a blank job title into null", () => {
    expect(
      validateProfileSettingsInput({
        displayName: "Maya Chen",
        jobTitle: "   ",
      }),
    ).toMatchObject({
      success: true,
      values: {
        displayName: "Maya Chen",
        jobTitle: null,
      },
    });
  });

  it("rejects a one-character job title", () => {
    const result = validateProfileSettingsInput({
      displayName: "Maya Chen",
      jobTitle: "S",
    });

    expect(result.success).toBe(false);
    expect(result.errors.jobTitle).toBe(
      "Job title must be 2 to 80 characters when provided.",
    );
  });

  it("rejects an overlong display name", () => {
    const result = validateProfileSettingsInput({
      displayName: "A".repeat(121),
      jobTitle: "",
    });

    expect(result.success).toBe(false);
    expect(result.errors.displayName).toBe(
      "Display name must be 120 characters or fewer.",
    );
  });
});
