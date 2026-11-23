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

export const teamDetails = v.object({
  name: v.string(),
  description: v.string(),
  rolesWanted: v.array(v.string()),
  recruitingStatus: v.union(v.literal("recruiting"), v.literal("closed")),
});
export const joinRequestStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
);

export default defineSchema({
  hackathons,
  users: defineTable({
    identityKey: v.string(),
    displayName: v.string(),
  }).index("by_identityKey", ["identityKey"]),
  teams: defineTable({
    hackathonId: v.id("hackathons"),
    ownerId: v.id("users"),
    ...teamDetails.fields,
    searchableRoles: v.optional(v.string()),
  })
    .index("by_hackathonId_and_recruitingStatus", [
      "hackathonId",
      "recruitingStatus",
    ])
    .index("by_hackathonId", ["hackathonId"])
    .index("by_ownerId", ["ownerId"])
    .searchIndex("search_searchableRoles", {
      searchField: "searchableRoles",
      filterFields: ["hackathonId", "recruitingStatus"],
    }),
  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_teamId_and_userId", ["teamId", "userId"])
    .index("by_userId", ["userId"]),
  teamJoinRequests: defineTable({
    teamId: v.id("teams"),
    requesterId: v.id("users"),
    status: joinRequestStatus,
    decidedAt: v.optional(v.number()),
    decidedBy: v.optional(v.id("users")),
  })
    .index("by_teamId_and_status", ["teamId", "status"])
    .index("by_teamId_and_requesterId", ["teamId", "requesterId"])
    .index("by_requesterId", ["requesterId"]),
});
