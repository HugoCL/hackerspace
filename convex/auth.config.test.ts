import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each(["https://dev.clerk.example", "https://prod.clerk.example"])(
  "trusts only the configured Clerk issuer %s with the Convex audience",
  async (issuer) => {
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", issuer);
    const { default: authConfig } = await import("./auth.config");
    expect(authConfig.providers).toEqual([
      { domain: issuer, applicationID: "convex" },
    ]);
  },
);

it("explains how to configure a missing issuer", async () => {
  vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", undefined);
  await expect(import("./auth.config")).rejects.toThrow(
    "npx convex env set CLERK_JWT_ISSUER_DOMAIN",
  );
});
