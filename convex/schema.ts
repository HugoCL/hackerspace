import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const hackathons = defineTable({
  slug: v.string(),
  title: v.string(),
  modality: v.union(
    v.literal("inPerson"),
    v.literal("hybrid"),
    v.literal("virtual"),
  ),
  dates: v.optional(v.string()),
  endsOn: v.optional(v.string()),
  location: v.optional(v.string()),
  organizer: v.string(),
  summary: v.string(),
  topics: v.array(v.string()),
  guidelines: v.optional(v.string()),
  rules: v.optional(v.string()),
  officialUrl: v.optional(v.string()),
  isSample: v.boolean(),
})
  .index("by_slug", ["slug"])
  .index("by_ends_on", ["endsOn"]);

export default defineSchema({ hackathons });
