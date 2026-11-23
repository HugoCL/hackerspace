import { expect, it } from "vitest";
import authConfig from "./auth.config";

it("trusts the Hackerspace Clerk dev and production issuers with the Convex audience", () => {
  expect(authConfig.providers).toEqual([
    {
      domain: "https://gorgeous-stallion-3913.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      domain: "https://clerk.hackerspace.hugocastro.dev",
      applicationID: "convex",
    },
  ]);
});
