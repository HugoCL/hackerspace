import type { UserIdentity } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  env,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { modality } from "./schema";
import { normalizeUrl, type ScoutProposal } from "./scoutExtraction";
import { ensureUser } from "./users";

// Human review of Scout candidates. Only accounts listed in SCOUT_REVIEWERS can read the queue or
// decide, and only an approval here creates a hackathon profile.

const QUEUE_LIMIT = 50;
const PUBLISHED_SCAN = 500;
const requiredFields = ["modality", "organizer", "summary"] as const;
type RequiredField = (typeof requiredFields)[number];
const completionLimits = { organizer: 200, summary: 600 };

async function reviewer(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const reviewers = new Set(
    (env.SCOUT_REVIEWERS ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
  return reviewers.has(identity.tokenIdentifier) ? identity : null;
}

async function requireReviewer(ctx: QueryCtx | MutationCtx) {
  const identity = await reviewer(ctx);
  if (!identity) throw new ConvexError("No tienes acceso a la revisión.");
  return identity;
}

const missingRequired = (proposal: Partial<ScoutProposal>) =>
  requiredFields.filter((field) => proposal[field] === undefined);

async function publishedEdition(
  ctx: QueryCtx | MutationCtx,
  canonicalEventKey: string,
) {
  return ctx.db
    .query("hackathons")
    .withIndex("by_canonicalEventKey", (q) =>
      q.eq("canonicalEventKey", canonicalEventKey),
    )
    .first();
}

const foldTitle = (title: string) =>
  title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

// Hand-added profiles have no canonicalEventKey, so the reviewer also gets a warning for the same
// official URL or the same title. It never blocks the approval.
async function publishedMatch(
  ctx: QueryCtx,
  candidate: Doc<"scoutCandidates">,
  published: Doc<"hackathons">[],
) {
  const sameEdition = await publishedEdition(ctx, candidate.canonicalEventKey);
  if (sameEdition) return { reason: "sameEdition" as const, ...sameEdition };
  const url = normalizeUrl(candidate.proposal.officialUrl);
  const sameUrl = published.find(
    (event) => event.officialUrl && normalizeUrl(event.officialUrl) === url,
  );
  if (sameUrl) return { reason: "sameUrl" as const, ...sameUrl };
  const title = foldTitle(candidate.proposal.title);
  const sameTitle = published.find((event) => foldTitle(event.title) === title);
  return sameTitle ? { reason: "sameTitle" as const, ...sameTitle } : null;
}

export const isReviewer = query({
  args: {},
  handler: async (ctx) => (await reviewer(ctx)) !== null,
});

export const queue = query({
  args: {},
  handler: async (ctx) => {
    await requireReviewer(ctx);
    const pending = await ctx.db
      .query("scoutCandidates")
      .withIndex("by_reviewStatus_and_discoveredAt", (q) =>
        q.eq("reviewStatus", "pending"),
      )
      .order("desc")
      .take(QUEUE_LIMIT);
    const published = await ctx.db.query("hackathons").take(PUBLISHED_SCAN);
    return Promise.all(
      pending.map(async (candidate) => {
        const other =
          candidate.possibleDuplicateOf &&
          (await ctx.db.get("scoutCandidates", candidate.possibleDuplicateOf));
        const match = await publishedMatch(ctx, candidate, published);
        return {
          _id: candidate._id,
          proposal: candidate.proposal,
          dates: displayDates(
            candidate.proposal.startsOn,
            candidate.proposal.endsOn,
          ),
          provenance: candidate.provenance,
          discoveredFromUrl: candidate.discoveredFromUrl,
          discoveredAt: candidate.discoveredAt,
          missingRequired: missingRequired(candidate.proposal),
          possibleDuplicateOf: other
            ? {
                title: other.proposal.title,
                officialUrl: other.proposal.officialUrl,
                dates: displayDates(
                  other.proposal.startsOn,
                  other.proposal.endsOn,
                ),
              }
            : null,
          publishedMatch: match && {
            reason: match.reason,
            slug: match.slug,
            title: match.title,
          },
        };
      }),
    );
  },
});

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// "13–14 mar 2027", "30 mar – 2 abr 2027", "10 abr 2027", like the sample profiles.
function displayDates(startsOn?: string, endsOn?: string) {
  if (!startsOn) return undefined;
  const day = (date: string) => {
    const [year, month, dayOfMonth] = date.split("-").map(Number);
    return { year, month: MONTHS[month - 1], day: dayOfMonth };
  };
  const start = day(startsOn);
  const end = endsOn && endsOn > startsOn ? day(endsOn) : undefined;
  if (!end) return `${start.day} ${start.month} ${start.year}`;
  if (start.year !== end.year)
    return `${start.day} ${start.month} ${start.year} – ${end.day} ${end.month} ${end.year}`;
  if (start.month !== end.month)
    return `${start.day} ${start.month} – ${end.day} ${end.month} ${end.year}`;
  return `${start.day}–${end.day} ${start.month} ${start.year}`;
}

function slugBase(title: string) {
  const slug = foldTitle(title)
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return slug || "hackathon";
}

async function uniqueSlug(ctx: MutationCtx, title: string) {
  const base = slugBase(title);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const taken = await ctx.db
      .query("hackathons")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!taken) return slug;
  }
}

const completion = v.object({
  modality: v.optional(modality),
  organizer: v.optional(v.string()),
  summary: v.optional(v.string()),
});

function completedText(
  field: keyof typeof completionLimits,
  value: string | undefined,
) {
  const text = value?.trim();
  if (!text) return undefined;
  if (text.length > completionLimits[field]) {
    throw new ConvexError(
      `Escribe ${field === "organizer" ? "la organización" : "el resumen"} en hasta ${completionLimits[field]} caracteres.`,
    );
  }
  return text;
}

const fieldLabels: Record<RequiredField, string> = {
  modality: "modalidad",
  organizer: "organización",
  summary: "resumen",
};

async function publish(
  ctx: MutationCtx,
  candidate: Doc<"scoutCandidates">,
  filled: typeof completion.type = {},
) {
  const { proposal } = candidate;
  // A reviewer only fills what the Scout left empty, so the copied provenance never vouches for
  // text a person typed.
  const profile = {
    ...proposal,
    modality: proposal.modality ?? filled.modality,
    organizer:
      proposal.organizer ?? completedText("organizer", filled.organizer),
    summary: proposal.summary ?? completedText("summary", filled.summary),
  };
  const { modality, organizer, summary } = profile;
  if (!modality || !organizer || !summary) {
    const missing = missingRequired(profile).map((field) => fieldLabels[field]);
    throw new ConvexError(`Completa antes de aprobar: ${missing.join(", ")}.`);
  }
  return ctx.db.insert("hackathons", {
    slug: await uniqueSlug(ctx, proposal.title),
    title: proposal.title,
    modality,
    organizer,
    summary,
    topics: proposal.topics ?? [],
    guidelines: proposal.guidelines,
    rules: proposal.rules,
    officialUrl: proposal.officialUrl,
    location: proposal.location,
    dates: displayDates(proposal.startsOn, proposal.endsOn),
    // `list` treats a profile without endsOn as undated forever.
    endsOn: proposal.endsOn ?? proposal.startsOn,
    isSample: false,
    canonicalEventKey: candidate.canonicalEventKey,
    provenance: candidate.provenance,
  });
}

// The only way a candidate leaves `pending`.
async function decide(
  ctx: MutationCtx,
  candidateId: Id<"scoutCandidates">,
  identity: UserIdentity,
  outcome:
    | { reviewStatus: "approved"; hackathonId: Id<"hackathons"> }
    | { reviewStatus: "rejected" },
) {
  await ctx.db.patch("scoutCandidates", candidateId, {
    ...outcome,
    reviewedBy: await ensureUser(ctx, identity),
    reviewedAt: Date.now(),
  });
}

async function profileLink(ctx: MutationCtx, hackathonId: Id<"hackathons">) {
  const hackathon = await ctx.db.get("hackathons", hackathonId);
  if (!hackathon) throw new ConvexError("El perfil aprobado ya no existe.");
  return { hackathonId, slug: hackathon.slug };
}

async function existingCandidate(
  ctx: MutationCtx,
  candidateId: Id<"scoutCandidates">,
) {
  const candidate = await ctx.db.get("scoutCandidates", candidateId);
  if (!candidate) throw new ConvexError("Este candidato ya no existe.");
  return candidate;
}

export const approve = mutation({
  args: {
    candidateId: v.id("scoutCandidates"),
    completion: v.optional(completion),
  },
  handler: async (ctx, { candidateId, completion }) => {
    const identity = await requireReviewer(ctx);
    const candidate = await existingCandidate(ctx, candidateId);
    if (candidate.reviewStatus === "approved")
      return profileLink(ctx, candidate.hackathonId);
    if (candidate.reviewStatus === "rejected")
      throw new ConvexError("Este candidato ya fue rechazado.");
    const hackathonId =
      (await publishedEdition(ctx, candidate.canonicalEventKey))?._id ??
      (await publish(ctx, candidate, completion));
    await decide(ctx, candidateId, identity, {
      reviewStatus: "approved",
      hackathonId,
    });
    return profileLink(ctx, hackathonId);
  },
});

export const reject = mutation({
  args: { candidateId: v.id("scoutCandidates") },
  handler: async (ctx, { candidateId }) => {
    const identity = await requireReviewer(ctx);
    const candidate = await existingCandidate(ctx, candidateId);
    if (candidate.reviewStatus === "approved")
      throw new ConvexError("Este candidato ya fue aprobado.");
    if (candidate.reviewStatus === "pending")
      await decide(ctx, candidateId, identity, { reviewStatus: "rejected" });
    return null;
  },
});
