import { describe, expect, it, vi } from "vitest";

import { getTrustedAppOrigin, resolveTrustedAppOrigin } from "./app-origin";

vi.mock("server-only", () => ({}));

describe("resolveTrustedAppOrigin", () => {
  it("normalizes absolute http and https origins", () => {
    expect(resolveTrustedAppOrigin(" https://fieldflow.example ")).toBe(
      "https://fieldflow.example",
    );
    expect(resolveTrustedAppOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  it.each([
    ["missing", undefined],
    ["blank", " "],
    ["relative", "/dashboard"],
    ["unsupported protocol", "ftp://fieldflow.example"],
    ["credentials", "https://user:pass@fieldflow.example"],
    ["path", "https://fieldflow.example/app"],
    ["query", "https://fieldflow.example/?next=/admin"],
    ["fragment", "https://fieldflow.example/#token"],
  ])("rejects %s app origin", (_caseName, appBaseUrl) => {
    expect(resolveTrustedAppOrigin(appBaseUrl)).toBeNull();
  });
});

describe("getTrustedAppOrigin", () => {
  it("reads and validates APP_BASE_URL without exposing the value", () => {
    vi.stubEnv("APP_BASE_URL", "https://fieldflow.example");

    expect(getTrustedAppOrigin()).toBe("https://fieldflow.example");

    vi.unstubAllEnvs();
  });
});
