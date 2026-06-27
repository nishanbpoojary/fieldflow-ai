import { describe, expect, it } from "vitest";

import { validateInvitationRequestBody } from "./invitation-request-validation";

const validTeamId = "123e4567-e89b-42d3-a456-426614174000";

describe("validateInvitationRequestBody", () => {
  it("accepts and normalizes a minimal manager invitation request", () => {
    expect(
      validateInvitationRequestBody({
        email: "  MANAGER@example.COM ",
        role: "manager",
        teamId: ` ${validTeamId} `,
      }),
    ).toEqual({
      success: true,
      values: {
        email: "manager@example.com",
        role: "manager",
        teamId: validTeamId,
        jobTitle: null,
      },
    });
  });

  it("accepts and normalizes optional job title text", () => {
    expect(
      validateInvitationRequestBody({
        email: "maya@example.com",
        role: "sales_executive",
        teamId: validTeamId,
        jobTitle: " Senior   Sales   Executive ",
      }),
    ).toEqual({
      success: true,
      values: {
        email: "maya@example.com",
        role: "sales_executive",
        teamId: validTeamId,
        jobTitle: "Senior Sales Executive",
      },
    });
  });

  it.each([
    ["null", null],
    ["array", []],
    ["unexpected key", { email: "maya@example.com", role: "manager", teamId: validTeamId, redirectTo: "/" }],
    ["invalid email", { email: "not-email", role: "manager", teamId: validTeamId }],
    ["invalid role", { email: "maya@example.com", role: "admin", teamId: validTeamId }],
    ["invalid team id", { email: "maya@example.com", role: "manager", teamId: "team-id" }],
    ["one-character job title", { email: "maya@example.com", role: "manager", teamId: validTeamId, jobTitle: "A" }],
    ["overlong job title", { email: "maya@example.com", role: "manager", teamId: validTeamId, jobTitle: "x".repeat(81) }],
  ])("rejects %s", (_caseName, body) => {
    expect(validateInvitationRequestBody(body)).toEqual({ success: false });
  });
});
