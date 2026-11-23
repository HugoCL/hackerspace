/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import fixture from "../test-fixtures/firecrawl-search-chile.json";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

// A real Firecrawl response: one scraped event page and one result it could not scrape.
const [event, unscraped] = fixture.data.web;
const extracted = event.json as { rules: string };
const officialUrl = event.url;
const searchBody = (...web: unknown[]) => ({
  ...fixture,
  data: { web },
});
const withJson = (patch: Record<string, unknown>) => ({
  ...event,
  json: { ...extracted, ...patch },
});

function stubFirecrawl(body: unknown, status = 200) {
  const fetchMock = vi.fn(
    async () =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status,
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  // The fixture event is on 14 November 2026; pin "today" before it.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T15:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function setup() {
  const t = convexTest(schema, modules);
  const search = () =>
    t.action(internal.scout.search, { query: "hackathon Chile" });
  const candidates = () =>
    t.run((ctx) => ctx.db.query("scoutCandidates").collect());
  const hackathons = () => t.run((ctx) => ctx.db.query("hackathons").collect());
  return { t, search, candidates, hackathons };
}

it("stores a pending candidate with its official URL and per-field provenance", async () => {
  const { t, search, candidates } = setup();
  await t.mutation(internal.seed.ensure, {});
  const startQuote = "del 14 al 15 de noviembre de 2026";
  stubFirecrawl(
    searchBody(
      withJson({
        endDate: "2026-11-15",
        evidence: { startDate: startQuote, rules: extracted.rules },
      }),
      unscraped,
    ),
  );

  const result = await search();

  expect(result).toMatchObject({ ok: true, found: 1, skipped: 1, inserted: 1 });
  const [candidate] = await candidates();
  expect(candidate).toMatchObject({
    canonicalEventKey:
      "https://spaceappschallenge.org/2026/local-events/santiago-chile#2026-11-14",
    reviewStatus: "pending",
    proposal: {
      title: "2026 NASA Space Apps Challenge",
      officialUrl,
      startsOn: "2026-11-14",
      endsOn: "2026-11-15",
      location: "Santiago",
      rules: extracted.rules,
    },
  });
  expect(candidate.discoveredFromUrl).toBeUndefined();
  const retrievedAt = Date.parse("2026-11-01T15:00:00Z");
  expect(candidate.provenance).toContainEqual({
    field: "startsOn",
    sourceUrl: officialUrl,
    retrievedAt,
    evidenceExcerpt: startQuote,
  });
  expect(candidate.provenance).toContainEqual({
    field: "rules",
    sourceUrl: officialUrl,
    retrievedAt,
    evidenceExcerpt: extracted.rules,
  });
});

it("leaves rules and guidelines empty when the page does not back them", async () => {
  const { search, candidates } = setup();
  // The real response names rules but quotes nothing; the second variant quotes text absent from the page.
  stubFirecrawl(
    searchBody(
      event,
      withJson({
        title: "Otra edición",
        officialUrl: "https://example.cl/otra",
        guidelines: "Prohibido usar IA",
        evidence: {
          guidelines: "Prohibido usar IA en cualquier etapa del evento",
        },
      }),
    ),
  );

  await search();

  const rows = await candidates();
  expect(rows).toHaveLength(2);
  for (const { proposal, provenance } of rows) {
    expect(proposal.rules).toBeUndefined();
    expect(proposal.guidelines).toBeUndefined();
    expect(provenance.map((entry) => entry.field)).not.toContain("rules");
    expect(provenance.map((entry) => entry.field)).not.toContain("guidelines");
  }
});

it("records where an event was found when that differs from its official URL", async () => {
  const { search, candidates } = setup();
  stubFirecrawl(
    searchBody(withJson({ officialUrl: "https://spaceapps.cl/santiago/" })),
  );

  await search();

  const [candidate] = await candidates();
  expect(candidate.proposal.officialUrl).toBe("https://spaceapps.cl/santiago/");
  expect(candidate.discoveredFromUrl).toBe(officialUrl);
  expect(
    candidate.provenance.every((entry) => entry.sourceUrl === officialUrl),
  ).toBe(true);
});

it("stores the page's own rules passage, not the extractor's wording", async () => {
  const { search, candidates } = setup();
  stubFirecrawl(
    searchBody(
      withJson({
        rules: "Se prohíbe usar IA generativa.",
        evidence: { rules: extracted.rules },
      }),
    ),
  );

  await search();

  const [candidate] = await candidates();
  expect(candidate.proposal.rules).toBe(extracted.rules);
});

it("cites the page Firecrawl scraped after a redirect and keeps the search link", async () => {
  const { search, candidates } = setup();
  const searchUrl = "https://bit.ly/space-apps-santiago";
  stubFirecrawl(
    searchBody({
      ...event,
      url: searchUrl,
      metadata: { ...event.metadata, url: officialUrl },
    }),
  );
  await search();
  stubFirecrawl(searchBody(event));
  await search();

  const [candidate] = await candidates();
  expect(candidate.proposal.officialUrl).toBe(officialUrl);
  expect(candidate.discoveredFromUrl).toBe(searchUrl);
  expect(
    candidate.provenance.every((entry) => entry.sourceUrl === officialUrl),
  ).toBe(true);
});

it("updates a pending candidate on a new observation instead of duplicating it", async () => {
  const { search, candidates } = setup();
  stubFirecrawl(searchBody(event));
  await search();
  const [first] = await candidates();

  vi.setSystemTime(new Date("2026-11-02T15:00:00Z"));
  stubFirecrawl(searchBody(withJson({ city: "La Florida" })));
  const second = await search();

  expect(second).toMatchObject({ inserted: 0, updated: 1 });
  const rows = await candidates();
  expect(rows).toHaveLength(1);
  expect(rows[0].proposal.location).toBe("La Florida");
  expect(rows[0].discoveredAt).toBe(first.discoveredAt);
  expect(rows[0].lastSeenAt).toBeGreaterThan(first.lastSeenAt);
});

it("only refreshes lastSeenAt on a candidate a reviewer already decided", async () => {
  const { t, search, candidates } = setup();
  stubFirecrawl(searchBody(event));
  await search();
  const [pending] = await candidates();
  await t.run((ctx) =>
    ctx.db.patch("scoutCandidates", pending._id, { reviewStatus: "approved" }),
  );

  vi.setSystemTime(new Date("2026-11-02T15:00:00Z"));
  stubFirecrawl(
    searchBody(withJson({ title: "Cambiado", city: "Valparaíso" })),
  );
  const result = await search();

  expect(result).toMatchObject({ inserted: 0, updated: 0, seen: 1 });
  const [decided] = await candidates();
  expect(decided.reviewStatus).toBe("approved");
  expect(decided.proposal).toEqual(pending.proposal);
  expect(decided.provenance).toEqual(pending.provenance);
  expect(decided.lastSeenAt).toBeGreaterThan(pending.lastSeenAt);
});

it("keeps a doubtful match as its own pending candidate, linked to the other", async () => {
  const { search, candidates } = setup();
  stubFirecrawl(searchBody(event));
  await search();
  stubFirecrawl(searchBody(withJson({ startDate: "2026-12-05" })));
  await search();
  stubFirecrawl(searchBody(withJson({ startDate: null })));
  await search();

  const rows = await candidates();
  expect(rows.map((row) => row.reviewStatus)).toEqual([
    "pending",
    "pending",
    "pending",
  ]);
  expect(rows.map((row) => row.proposal.startsOn)).toEqual([
    "2026-11-14",
    "2026-12-05",
    undefined,
  ]);
  expect(rows[0].possibleDuplicateOf).toBeUndefined();
  expect(rows[1].possibleDuplicateOf).toBe(rows[0]._id);
  expect(rows[2].possibleDuplicateOf).toBe(rows[0]._id);
});

it.each([
  ["HTTP 500", () => stubFirecrawl({ success: false, error: "boom" }, 500)],
  ["success: false", () => stubFirecrawl({ success: false, error: "no" }, 200)],
  ["an unparseable body", () => stubFirecrawl("<html>gateway</html>")],
  [
    "a network error",
    () => {
      vi.stubGlobal("fetch", async () => {
        throw new Error("offline");
      });
    },
  ],
])(
  "reports a failed source on %s without writing anything",
  async (_name, stub) => {
    const { t, search, candidates, hackathons } = setup();
    await t.mutation(internal.seed.ensure, {});
    const before = await hackathons();
    stub();

    const result = await search();

    expect(result).toMatchObject({ ok: false, found: 0, inserted: 0 });
    expect(result.error).toBeTruthy();
    expect(await candidates()).toEqual([]);
    expect(await hackathons()).toEqual(before);
  },
);

it("never writes to the published catalog", async () => {
  const { t, search, candidates, hackathons } = setup();
  await t.mutation(internal.seed.ensure, {});
  const before = await hackathons();
  stubFirecrawl(searchBody(event));

  await search();

  expect(await candidates()).toHaveLength(1);
  expect(await hackathons()).toEqual(before);
});

it.each([
  ["another country", { country: "Argentina" }],
  ["no country", { country: null }],
  ["a non-hackathon page", { isHackathon: false }],
  ["a page with no title", { title: "" }],
  [
    "an event that already ended",
    { startDate: "2026-10-01", endDate: "2026-10-02" },
  ],
  [
    "an ended event dated with timestamps",
    { startDate: "2026-10-01T08:30:00", endDate: "2026-10-02T18:30:00" },
  ],
])("drops results with %s", async (_name, patch) => {
  const { search, candidates } = setup();
  stubFirecrawl(searchBody(withJson(patch)));

  await search();

  expect(await candidates()).toEqual([]);
});

it("ignores an unsafe official URL and keeps the page URL", async () => {
  const { search, candidates } = setup();
  stubFirecrawl(searchBody(withJson({ officialUrl: "javascript:alert(1)" })));

  await search();

  const [candidate] = await candidates();
  expect(candidate.proposal.officialUrl).toBe(officialUrl);
});

it("asks Firecrawl for Chile and sends the API key only when one is set", async () => {
  const { search } = setup();
  const fetchMock = stubFirecrawl(searchBody());
  await search();
  vi.stubEnv("FIRECRAWL_API_KEY", "fc-test");
  await search();

  const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
  const [url, anonymous] = calls[0];
  expect(url).toBe("https://api.firecrawl.dev/v2/search");
  expect(JSON.parse(anonymous.body as string)).toMatchObject({
    query: "hackathon Chile",
    country: "CL",
    location: "Chile",
    limit: 10,
  });
  expect(anonymous.headers).not.toHaveProperty("Authorization");
  expect(calls[1][1].headers).toHaveProperty("Authorization", "Bearer fc-test");
});
