import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const modality = v.union(
  v.literal("inPerson"),
  v.literal("hybrid"),
  v.literal("virtual"),
);

const hackathons = defineTable({
  slug: v.string(),
  title: v.string(),
  modality,
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

// What the Scout proposes for a hackathon profile. Only title and officialUrl are required:
// anything the source did not back stays absent.
export const scoutProposal = v.object({
  title: v.string(),
  officialUrl: v.string(),
  organizer: v.optional(v.string()),
  modality: v.optional(modality),
  startsOn: v.optional(v.string()),
  endsOn: v.optional(v.string()),
  location: v.optional(v.string()),
  summary: v.optional(v.string()),
  topics: v.optional(v.array(v.string())),
  guidelines: v.optional(v.string()),
  rules: v.optional(v.string()),
});
export const scoutProvenance = v.object({
  field: v.union(
    v.literal("title"),
    v.literal("officialUrl"),
    v.literal("organizer"),
    v.literal("modality"),
    v.literal("startsOn"),
    v.literal("endsOn"),
    v.literal("location"),
    v.literal("summary"),
    v.literal("topics"),
    v.literal("guidelines"),
    v.literal("rules"),
  ),
  sourceUrl: v.string(),
  retrievedAt: v.number(),
  evidenceExcerpt: v.optional(v.string()),
});

export const teamDetails = v.object({
  name: v.string(),
  description: v.string(),
  lookingFor: v.string(),
  recruitingStatus: v.union(v.literal("recruiting"), v.literal("closed")),
});
export const joinRequestStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
);

export default defineSchema({
  hackathons,
  // Unreviewed Scout findings. Never read by the public catalog.
  scoutCandidates: defineTable({
    canonicalEventKey: v.string(),
    reviewStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    proposal: scoutProposal,
    provenance: v.array(scoutProvenance),
    discoveredFromUrl: v.optional(v.string()),
    // Another candidate with the same official URL but a different start date.
    possibleDuplicateOf: v.optional(v.id("scoutCandidates")),
    discoveredAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_canonicalEventKey", ["canonicalEventKey"])
    .index("by_reviewStatus_and_discoveredAt", [
      "reviewStatus",
      "discoveredAt",
    ]),
  users: defineTable({
    identityKey: v.string(),
    displayName: v.string(),
  }).index("by_identityKey", ["identityKey"]),
  teams: defineTable({
    hackathonId: v.id("hackathons"),
    ownerId: v.id("users"),
    ...teamDetails.omit("lookingFor").fields,
    lookingFor: v.optional(v.string()),
    memberCount: v.optional(v.number()),
    searchableText: v.optional(v.string()),
    rolesWanted: v.optional(v.array(v.string())),
    searchableRoles: v.optional(v.string()),
    archivedRoles: v.optional(v.array(v.string())),
  })
    .index("by_hackathonId_and_recruitingStatus", [
      "hackathonId",
      "recruitingStatus",
    ])
    .index("by_hackathonId", ["hackathonId"])
    .index("by_ownerId", ["ownerId"])
    .searchIndex("search_searchableText", {
      searchField: "searchableText",
      filterFields: ["hackathonId", "recruitingStatus"],
    }),
  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_teamId_and_userId", ["teamId", "userId"])
    .index("by_userId", ["userId"]),
  // Retained for existing data; conversations do not expose legacy requests.
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
  teamConversations: defineTable({
    teamId: v.id("teams"),
    participantId: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_teamId_and_participantId", ["teamId", "participantId"])
    .index("by_teamId_and_updatedAt", ["teamId", "updatedAt"]),
  teamMessages: defineTable({
    conversationId: v.id("teamConversations"),
    senderId: v.id("users"),
    body: v.string(),
  }).index("by_conversationId", ["conversationId"]),
});
