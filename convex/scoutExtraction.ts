import type { Infer } from "convex/values";
import { z } from "zod";
import type { scoutProposal, scoutProvenance } from "./schema";

// Pure parsing for Firecrawl search results. Firecrawl returns text written by third parties, so
// everything here treats it as data: validate at the boundary, keep only what the page backs.

export type ScoutProposal = Infer<typeof scoutProposal>;
export type ScoutProvenance = Infer<typeof scoutProvenance>;
export type ScoutObservation = {
  proposal: ScoutProposal;
  provenance: ScoutProvenance[];
  discoveredFromUrl?: string;
};

const MAX_EXCERPT = 280;
// A shorter quote would match almost any page and prove nothing.
const MIN_EVIDENCE = 12;

const httpUrl = z.url({ protocol: /^https?$/ }).max(2048);
const text = (max: number) => z.string().trim().min(1).max(max);
// A bad optional field is dropped; the rest of the result is still usable.
const optional = <T extends z.ZodType>(schema: T) =>
  schema
    .nullish()
    .catch(undefined)
    .transform((value) => value ?? undefined);

const extraction = z.object({
  isHackathon: z.literal(true),
  title: text(200),
  officialUrl: optional(httpUrl),
  organizer: optional(text(200)),
  modality: optional(z.enum(["inPerson", "hybrid", "virtual"])),
  startDate: optional(z.iso.date()),
  endDate: optional(z.iso.date()),
  city: optional(text(100)),
  country: optional(text(100)),
  summary: optional(text(600)),
  topics: optional(z.array(text(60)).max(10)),
  guidelines: optional(text(8000)),
  rules: optional(text(8000)),
  // Verbatim quotes from the page, keyed by the extraction field they support.
  evidence: optional(z.record(z.string(), z.string())),
});

const searchResult = z.object({
  url: httpUrl,
  markdown: optional(z.string()),
  json: z.unknown(),
});

const searchResponse = z.object({
  success: z.literal(true),
  data: z.object({ web: z.array(z.unknown()).default([]) }),
});

// The extraction request sent to Firecrawl. `evidence` and the field names must match `extraction`.
export const extractionPrompt =
  "Extract this hackathon's details. Use only what the page states; omit any field the page does not state and never guess. Dates are YYYY-MM-DD. For startDate, endDate, city, organizer, guidelines and rules, also put a short quote copied verbatim from the page into evidence under the same key.";

const string = { type: "string" } as const;
export const extractionSchema = {
  type: "object",
  properties: {
    isHackathon: { type: "boolean" },
    title: string,
    officialUrl: string,
    organizer: string,
    modality: { type: "string", enum: ["inPerson", "hybrid", "virtual"] },
    startDate: string,
    endDate: string,
    city: string,
    country: string,
    summary: string,
    topics: { type: "array", items: string },
    guidelines: string,
    rules: string,
    evidence: {
      type: "object",
      properties: {
        startDate: string,
        endDate: string,
        city: string,
        organizer: string,
        guidelines: string,
        rules: string,
      },
    },
  },
  required: ["isHackathon"],
};

export function normalizeUrl(raw: string): string | undefined {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
  const host = url.host.replace(/^www\./, "");
  return `https://${host}${url.pathname.replace(/\/+$/, "")}`;
}

export function canonicalEventKey(officialUrl: string, startsOn?: string) {
  return `${normalizeUrl(officialUrl) ?? officialUrl}#${startsOn ?? "undated"}`;
}

const squash = (value: string) =>
  value.normalize("NFKC").replace(/\s+/g, " ").trim();
const fold = (value: string) => squash(value).toLowerCase();

// Chile's local calendar day, as YYYY-MM-DD.
export function todayInChile(now: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
  }).format(now);
}

const isChile = (country: string | undefined) =>
  ["chile", "cl", "república de chile", "republica de chile"].includes(
    fold(country ?? ""),
  );

// The extractor must back a field with a quote that really appears on the page.
function excerptFinder(quotes: Record<string, string>, markdown: string) {
  const page = fold(markdown);
  return (key: string): string | undefined => {
    const quote = squash(quotes[key] ?? "");
    return fold(quote).length >= MIN_EVIDENCE && page.includes(fold(quote))
      ? quote.slice(0, MAX_EXCERPT)
      : undefined;
  };
}

// Turns one raw Firecrawl search result into an observation, or null when it should be skipped.
export function observationFromResult(
  raw: unknown,
  { retrievedAt, today }: { retrievedAt: number; today: string },
): ScoutObservation | null {
  const result = searchResult.safeParse(raw);
  if (!result.success || !result.data.json) return null;
  const found = extraction.safeParse(result.data.json);
  if (!found.success || !isChile(found.data.country)) return null;
  const { url: sourceUrl, markdown } = result.data;
  const data = found.data;

  const excerptFor = excerptFinder(data.evidence ?? {}, markdown ?? "");
  const guidelinesExcerpt = excerptFor("guidelines");
  const rulesExcerpt = excerptFor("rules");
  const proposal: ScoutProposal = {
    title: data.title,
    officialUrl: data.officialUrl ?? sourceUrl,
    organizer: data.organizer,
    modality: data.modality,
    startsOn: data.startDate,
    endsOn: data.endDate,
    location: data.city,
    summary: data.summary,
    topics: data.topics,
    guidelines: guidelinesExcerpt ? data.guidelines : undefined,
    rules: rulesExcerpt ? data.rules : undefined,
  };
  if ((proposal.endsOn ?? proposal.startsOn ?? today) < today) return null;

  const evidenceKey: Partial<Record<keyof ScoutProposal, string>> = {
    startsOn: "startDate",
    endsOn: "endDate",
    location: "city",
  };
  const provenance = (Object.keys(proposal) as (keyof ScoutProposal)[])
    .filter((field) => proposal[field] !== undefined)
    .map((field) => ({
      field,
      sourceUrl,
      retrievedAt,
      evidenceExcerpt: excerptFor(evidenceKey[field] ?? field),
    }));

  return {
    proposal,
    provenance,
    discoveredFromUrl:
      normalizeUrl(proposal.officialUrl) === normalizeUrl(sourceUrl)
        ? undefined
        : sourceUrl,
  };
}

// Parses a whole Firecrawl search body. Throws when the body is not a successful search response.
export function observationsFromSearch(
  body: unknown,
  context: { retrievedAt: number; today: string },
) {
  const { data } = searchResponse.parse(body);
  const observations = data.web.flatMap((raw) => {
    const observation = observationFromResult(raw, context);
    return observation ? [observation] : [];
  });
  return { observations, skipped: data.web.length - observations.length };
}
