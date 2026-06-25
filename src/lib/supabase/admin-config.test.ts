import { describe, expect, it } from "vitest";

import { resolveSupabaseAdminClientConfig } from "./admin-config";

describe("resolveSupabaseAdminClientConfig", () => {
  it("rejects a missing Supabase URL", () => {
    expect(() =>
      resolveSupabaseAdminClientConfig({
        supabaseSecretKey: "dummy-secret-key",
      }),
    ).toThrow("Supabase Admin client configuration is unavailable.");
  });

  it("rejects a missing Supabase secret key", () => {
    expect(() =>
      resolveSupabaseAdminClientConfig({
        supabaseUrl: "https://example.supabase.co",
      }),
    ).toThrow("Supabase Admin client configuration is unavailable.");
  });

  it("rejects whitespace-only configuration values", () => {
    expect(() =>
      resolveSupabaseAdminClientConfig({
        supabaseUrl: "   ",
        supabaseSecretKey: "\t\n",
      }),
    ).toThrow("Supabase Admin client configuration is unavailable.");
  });

  it("returns trimmed explicit configuration values", () => {
    expect(
      resolveSupabaseAdminClientConfig({
        supabaseUrl: "  https://example.supabase.co  ",
        supabaseSecretKey: "  dummy-secret-key  ",
      }),
    ).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseSecretKey: "dummy-secret-key",
    });
  });
});
