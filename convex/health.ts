import { v } from "convex/values";
import { query } from "./_generated/server";

export const status = query({
  args: {},
  returns: v.literal("ok"),
  handler: () => "ok" as const,
});
