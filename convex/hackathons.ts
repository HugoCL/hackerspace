import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const upcoming = await ctx.db
      .query("hackathons")
      .withIndex("by_ends_on", (q) => q.gte("endsOn", today))
      .take(100);
    const undated = await ctx.db
      .query("hackathons")
      .withIndex("by_ends_on", (q) => q.eq("endsOn", undefined))
      .take(25);
    return [...upcoming, ...undated];
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("hackathons")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),
});
