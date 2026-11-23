import { type Infer, v } from "convex/values";
import { internal } from "./_generated/api";
import {
  env,
  internalAction,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import { pool } from "./jobs";
import { scoutProposal, scoutProvenance } from "./schema";
import {
  canonicalEventKey,
  extractionPrompt,
  extractionSchema,
  observationsFromSearch,
  todayInChile,
} from "./scoutExtraction";

// The Scout only covers Chile for now. The query asks Firecrawl for Chilean results and
// scoutExtraction rejects anything whose page says another country.
const CHILE_SEARCH = {
  queries: ["hackathon Chile", "hackatón Chile"],
  country: "CL",
  location: "Chile",
  limit: 10,
};

const observation = v.object({
  proposal: scoutProposal,
  provenance: v.array(scoutProvenance),
  discoveredFromUrl: v.optional(v.string()),
});

// Run it by hand with `npx convex run scout:start`. One search per query, at most
// `maxParallelism` at a time through the shared pool.
export const start = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const query of CHILE_SEARCH.queries) {
      await pool.enqueueAction(ctx, internal.scout.search, { query });
    }
    return CHILE_SEARCH.queries.length;
  },
});

const summary = v.object({
  ok: v.boolean(),
  found: v.number(),
  skipped: v.number(),
  inserted: v.number(),
  updated: v.number(),
  seen: v.number(),
  error: v.optional(v.string()),
});
type Summary = Infer<typeof summary>;
const failed = (error: string): Summary => ({
  ok: false,
  found: 0,
  skipped: 0,
  inserted: 0,
  updated: 0,
  seen: 0,
  error,
});

export const search = internalAction({
  args: { query: v.string() },
  returns: summary,
  handler: async (ctx, { query }): Promise<Summary> => {
    const retrievedAt = Date.now();
    try {
      const response = await fetch("https://api.firecrawl.dev/v2/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(env.FIRECRAWL_API_KEY && {
            Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
          }),
        },
        body: JSON.stringify({
          query,
          limit: CHILE_SEARCH.limit,
          country: CHILE_SEARCH.country,
          location: CHILE_SEARCH.location,
          scrapeOptions: {
            formats: [
              "markdown",
              {
                type: "json",
                prompt: extractionPrompt,
                schema: extractionSchema,
              },
            ],
          },
        }),
      });
      if (!response.ok)
        throw new Error(`Firecrawl answered ${response.status}`);
      const { observations, skipped } = observationsFromSearch(
        await response.json(),
        { retrievedAt, today: todayInChile(retrievedAt) },
      );
      const recorded: { inserted: number; updated: number; seen: number } =
        await ctx.runMutation(internal.scout.record, { observations });
      return { ok: true, found: observations.length, skipped, ...recorded };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`scout: search "${query}" failed: ${message}`);
      return failed(message);
    }
  },
});

// Finds the candidate for each observation's edition and records what it saw, in one transaction.
// A pending candidate takes the newer reading. A decided one (approved or rejected) only gets
// `lastSeenAt`. Nothing here touches `hackathons`.
export const record = internalMutation({
  args: { observations: v.array(observation) },
  handler: async (ctx, { observations }) => {
    const now = Date.now();
    const counts = { inserted: 0, updated: 0, seen: 0 };
    for (const { proposal, provenance, discoveredFromUrl } of observations) {
      const key = canonicalEventKey(proposal.officialUrl, proposal.startsOn);
      const existing = await ctx.db
        .query("scoutCandidates")
        .withIndex("by_canonicalEventKey", (q) =>
          q.eq("canonicalEventKey", key),
        )
        .first();
      if (!existing) {
        await ctx.db.insert("scoutCandidates", {
          canonicalEventKey: key,
          reviewStatus: "pending",
          proposal,
          provenance,
          discoveredFromUrl,
          possibleDuplicateOf: await sameUrlOtherEdition(ctx, key),
          discoveredAt: now,
          lastSeenAt: now,
        });
        counts.inserted++;
      } else if (existing.reviewStatus === "pending") {
        await ctx.db.patch(existing._id, {
          proposal,
          provenance,
          discoveredFromUrl,
          lastSeenAt: now,
        });
        counts.updated++;
      } else {
        await ctx.db.patch(existing._id, { lastSeenAt: now });
        counts.seen++;
      }
    }
    return counts;
  },
});

// Same official URL, different start date (or none): not merged, but linked for the reviewer.
async function sameUrlOtherEdition(ctx: MutationCtx, key: string) {
  const prefix = key.slice(0, key.lastIndexOf("#") + 1);
  const other = await ctx.db
    .query("scoutCandidates")
    .withIndex("by_canonicalEventKey", (q) =>
      q.gte("canonicalEventKey", prefix).lt("canonicalEventKey", `${prefix}￿`),
    )
    .first();
  return other?._id;
}
