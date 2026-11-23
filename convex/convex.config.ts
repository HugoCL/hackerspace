import migrations from "@convex-dev/migrations/convex.config.js";
import presence from "@convex-dev/presence/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import workpool from "@convex-dev/workpool/convex.config.js";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  // Optional: Firecrawl answers anonymous requests with a lower rate limit.
  env: { FIRECRAWL_API_KEY: v.optional(v.string()) },
});
// Schema changes and backfills: see convex/migrations.ts.
app.use(migrations);
app.use(presence);
app.use(rateLimiter);
// Background jobs with bounded parallelism: see the example in convex/jobs.ts.
// Each `use` makes one pool, reachable as `components.<name>`.
app.use(workpool, { name: "backgroundWork" });

export default app;
