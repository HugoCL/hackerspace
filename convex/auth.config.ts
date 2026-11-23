import type { AuthConfig } from "convex/server";

export default {
  providers: [
    // TODO: Configure the Hackerspace Clerk app once its Convex integration is active.
    // Paste your Clerk Frontend API URL as a literal: it is public, and Convex rejects
    // `process.env.CLERK_JWT_ISSUER_DOMAIN` here when the variable is not set on the deployment,
    // which stops `pnpm dev` on a local anonymous deployment.
    // https://docs.convex.dev/auth/clerk#configuring-dev-and-prod-instances
    // { domain: "https://<your-app>.clerk.accounts.dev", applicationID: "convex" },
  ],
} satisfies AuthConfig;
