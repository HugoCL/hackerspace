import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://gorgeous-stallion-3913.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      domain: "https://clerk.hackerspace.hugocastro.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
