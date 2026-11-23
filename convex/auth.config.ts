import type { AuthConfig } from "convex/server";

const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!domain) {
  throw new Error(
    "Set CLERK_JWT_ISSUER_DOMAIN on the target Convex deployment with `npx convex env set CLERK_JWT_ISSUER_DOMAIN <Clerk Frontend API URL>`.",
  );
}

export default {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
