/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { ScoutObservation } from "./scoutExtraction";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const ISSUER = "https://clerk.example.test";
const retrievedAt = Date.parse("2026-11-01T15:00:00Z");
const officialUrl = "https://www.hackatonvalpo.cl/2026/";

function observation(
  proposal: Partial<ScoutObservation["proposal"]> = {},
): ScoutObservation {
  const full = {
    title: "Hackatón Valparaíso 2026",
    officialUrl,
    startsOn: "2026-11-28",
    endsOn: "2026-11-29",
    location: "Valparaíso",
    rules: "Los equipos tienen entre dos y cinco personas.",
    ...proposal,
  };
  return {
    proposal: full,
    provenance: [
      { field: "title", sourceUrl: full.officialUrl, retrievedAt },
      {
        field: "startsOn",
        sourceUrl: full.officialUrl,
        retrievedAt,
        evidenceExcerpt: "28 y 29 de noviembre",
      },
    ],
  };
}

const completion = {
  modality: "inPerson" as const,
  organizer: "Comunidad Valpo",
  summary: "Dos días para construir prototipos con datos de la ciudad.",
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(retrievedAt));
  vi.stubEnv("SCOUT_REVIEWERS", ` ${ISSUER}|user_other , ${ISSUER}|user_10 `);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

function setup() {
  const t = convexTest(schema, modules);
  const as = (subject: string) =>
    t.withIdentity({
      subject,
      issuer: ISSUER,
      tokenIdentifier: `${ISSUER}|${subject}`,
      name: subject,
    });
  const record = async (...observations: ScoutObservation[]) => {
    await t.mutation(internal.scout.record, { observations });
    return t.run((ctx) => ctx.db.query("scoutCandidates").collect());
  };
  const hackathons = () => t.run((ctx) => ctx.db.query("hackathons").collect());
  return {
    t,
    reviewer: as("user_10"),
    // The reviewer's id starts with this one, so a substring match would let it in.
    outsider: as("user_1"),
    record,
    hackathons,
  };
}

it("lets only listed reviewers read the queue and decide", async () => {
  const { t, reviewer, outsider, record } = setup();
  const [candidate] = await record(observation());
  const candidateId = candidate._id;

  for (const viewer of [t, outsider]) {
    expect(await viewer.query(api.scoutReview.isReviewer, {})).toBe(false);
    await expect(viewer.query(api.scoutReview.queue, {})).rejects.toThrow(
      "No tienes acceso",
    );
    await expect(
      viewer.mutation(api.scoutReview.approve, { candidateId, completion }),
    ).rejects.toThrow("No tienes acceso");
    await expect(
      viewer.mutation(api.scoutReview.reject, { candidateId }),
    ).rejects.toThrow("No tienes acceso");
  }

  expect(await reviewer.query(api.scoutReview.isReviewer, {})).toBe(true);
  expect(await reviewer.query(api.scoutReview.queue, {})).toHaveLength(1);

  vi.stubEnv("SCOUT_REVIEWERS", undefined);
  expect(await reviewer.query(api.scoutReview.isReviewer, {})).toBe(false);
  await expect(reviewer.query(api.scoutReview.queue, {})).rejects.toThrow(
    "No tienes acceso",
  );
});

it("shows each pending candidate with its sources, missing fields and duplicates", async () => {
  const { t, reviewer, record } = setup();
  await t.mutation(internal.seed.ensure, {});
  await record(
    observation({ title: "Santiago Hacks 2027", startsOn: undefined }),
    observation({ officialUrl: "https://otra.cl/evento", organizer: "Otra" }),
  );
  vi.setSystemTime(new Date(retrievedAt + 1000));
  await record(observation({ startsOn: "2026-12-05", endsOn: undefined }));

  const queue = await reviewer.query(api.scoutReview.queue, {});

  expect(queue.map((item) => item.proposal.startsOn)).toEqual([
    "2026-12-05",
    "2026-11-28",
    undefined,
  ]);
  const [newest, other, sameTitleAsSample] = queue;
  expect(newest.missingRequired).toEqual(["modality", "organizer", "summary"]);
  expect(other.missingRequired).toEqual(["modality", "summary"]);
  expect(newest.provenance).toContainEqual({
    field: "startsOn",
    sourceUrl: officialUrl,
    retrievedAt,
    evidenceExcerpt: "28 y 29 de noviembre",
  });
  expect(newest.possibleDuplicateOf).toEqual({
    title: "Santiago Hacks 2027",
    officialUrl,
    dates: undefined,
  });
  expect(sameTitleAsSample.publishedMatch).toEqual({
    reason: "sameTitle",
    slug: "santiago-hacks",
    title: "Santiago Hacks 2027",
  });
  expect(other.publishedMatch).toBeNull();
});

it("approving publishes a visible profile with provenance and links both records", async () => {
  const { reviewer, record, t } = setup();
  const [candidate] = await record(observation({ topics: ["Datos abiertos"] }));

  const approved = await reviewer.mutation(api.scoutReview.approve, {
    candidateId: candidate._id,
    completion,
  });

  expect(approved.slug).toBe("hackaton-valparaiso-2026");
  const profile = await t.query(api.hackathons.bySlug, { slug: approved.slug });
  expect(profile).toMatchObject({
    _id: approved.hackathonId,
    title: "Hackatón Valparaíso 2026",
    ...completion,
    dates: "28–29 nov 2026",
    endsOn: "2026-11-29",
    location: "Valparaíso",
    topics: ["Datos abiertos"],
    rules: "Los equipos tienen entre dos y cinco personas.",
    officialUrl,
    isSample: false,
    canonicalEventKey: candidate.canonicalEventKey,
    provenance: candidate.provenance,
  });
  expect(profile?.guidelines).toBeUndefined();
  const listed = await t.query(api.hackathons.list, { today: "2026-11-01" });
  expect(listed.map((event) => event._id)).toContain(approved.hackathonId);

  const decided = await t.run((ctx) =>
    ctx.db.get("scoutCandidates", candidate._id),
  );
  const reviewerUser = await t.run((ctx) =>
    ctx.db
      .query("users")
      .withIndex("by_identityKey", (q) =>
        q.eq("identityKey", `${ISSUER}|user_10`),
      )
      .unique(),
  );
  expect(decided).toMatchObject({
    reviewStatus: "approved",
    hackathonId: approved.hackathonId,
    reviewedBy: reviewerUser?._id,
    reviewedAt: expect.any(Number),
  });
  expect(await reviewer.query(api.scoutReview.queue, {})).toEqual([]);
});

it("creates one profile however many times an edition is approved", async () => {
  const { reviewer, record, hackathons, t } = setup();
  const [first] = await record(observation());
  const once = await reviewer.mutation(api.scoutReview.approve, {
    candidateId: first._id,
    completion,
  });

  const again = await reviewer.mutation(api.scoutReview.approve, {
    candidateId: first._id,
  });
  expect(again).toEqual(once);

  // A second candidate for the same edition, e.g. one inserted before the first was approved.
  const { _id, _creationTime, ...copy } = first;
  const second = await t.run((ctx) => ctx.db.insert("scoutCandidates", copy));
  const linked = await reviewer.mutation(api.scoutReview.approve, {
    candidateId: second,
  });

  expect(linked).toEqual(once);
  expect(await hackathons()).toHaveLength(1);
  expect(
    await t.run((ctx) => ctx.db.get("scoutCandidates", second)),
  ).toMatchObject({ reviewStatus: "approved", hackathonId: once.hackathonId });
});

it("refuses to approve while a required field is missing", async () => {
  const { reviewer, record, hackathons } = setup();
  const [candidate] = await record(observation());

  await expect(
    reviewer.mutation(api.scoutReview.approve, { candidateId: candidate._id }),
  ).rejects.toThrow("Completa antes de aprobar");
  await expect(
    reviewer.mutation(api.scoutReview.approve, {
      candidateId: candidate._id,
      completion: { ...completion, summary: "   " },
    }),
  ).rejects.toThrow("resumen");
  expect(await hackathons()).toEqual([]);
});

it("keeps the Scout's value when a completion repeats a field it backed", async () => {
  const { reviewer, record, t } = setup();
  const [candidate] = await record(observation({ organizer: "Muni Valpo" }));

  const { slug } = await reviewer.mutation(api.scoutReview.approve, {
    candidateId: candidate._id,
    completion,
  });

  const profile = await t.query(api.hackathons.bySlug, { slug });
  expect(profile?.organizer).toBe("Muni Valpo");
});

it("suffixes the slug when another profile already uses it", async () => {
  const { reviewer, record } = setup();
  const candidates = await record(
    observation(),
    observation({ officialUrl: "https://otra.cl/valpo" }),
    observation({ officialUrl: "https://tercera.cl/valpo" }),
  );

  const slugs = [];
  for (const candidate of candidates) {
    const { slug } = await reviewer.mutation(api.scoutReview.approve, {
      candidateId: candidate._id,
      completion,
    });
    slugs.push(slug);
  }

  expect(slugs).toEqual([
    "hackaton-valparaiso-2026",
    "hackaton-valparaiso-2026-2",
    "hackaton-valparaiso-2026-3",
  ]);
});

it("writes the dates like the sample profiles", async () => {
  const { reviewer, record, t } = setup();
  const cases = [
    [{ startsOn: "2026-11-28", endsOn: undefined }, "28 nov 2026"],
    [{ startsOn: "2026-11-30", endsOn: "2026-12-02" }, "30 nov – 2 dic 2026"],
    [
      { startsOn: "2026-12-30", endsOn: "2027-01-02" },
      "30 dic 2026 – 2 ene 2027",
    ],
  ] as const;

  for (const [index, [dates, expected]] of cases.entries()) {
    const candidates = await record(
      observation({ ...dates, officialUrl: `https://evento${index}.cl` }),
    );
    const { slug } = await reviewer.mutation(api.scoutReview.approve, {
      candidateId: candidates[index]._id,
      completion,
    });
    const profile = await t.query(api.hackathons.bySlug, { slug });
    expect(profile?.dates).toBe(expected);
    expect(profile?.endsOn).toBe(dates.endsOn ?? dates.startsOn);
  }
});

it("rejecting records the decision without touching hackathons", async () => {
  const { reviewer, record, hackathons, t } = setup();
  await t.mutation(internal.seed.ensure, {});
  const before = await hackathons();
  const [candidate] = await record(observation());

  await reviewer.mutation(api.scoutReview.reject, {
    candidateId: candidate._id,
  });
  await reviewer.mutation(api.scoutReview.reject, {
    candidateId: candidate._id,
  });

  expect(await hackathons()).toEqual(before);
  expect(
    await t.run((ctx) => ctx.db.get("scoutCandidates", candidate._id)),
  ).toMatchObject({
    reviewStatus: "rejected",
    reviewedBy: expect.any(String),
    reviewedAt: expect.any(Number),
  });
  await expect(
    reviewer.mutation(api.scoutReview.approve, {
      candidateId: candidate._id,
      completion,
    }),
  ).rejects.toThrow("rechazado");
});

it("does not reject an approved candidate", async () => {
  const { reviewer, record } = setup();
  const [candidate] = await record(observation());
  await reviewer.mutation(api.scoutReview.approve, {
    candidateId: candidate._id,
    completion,
  });

  await expect(
    reviewer.mutation(api.scoutReview.reject, { candidateId: candidate._id }),
  ).rejects.toThrow("aprobado");
});

it("only bumps lastSeenAt when the Scout sees an approved candidate again", async () => {
  const { reviewer, record, t } = setup();
  const [candidate] = await record(observation());
  const { slug } = await reviewer.mutation(api.scoutReview.approve, {
    candidateId: candidate._id,
    completion,
  });
  const profile = await t.query(api.hackathons.bySlug, { slug });

  vi.setSystemTime(new Date(retrievedAt + 60_000));
  const [seen] = await record(observation({ title: "Cambiado" }));

  expect(seen).toMatchObject({
    reviewStatus: "approved",
    proposal: candidate.proposal,
    lastSeenAt: retrievedAt + 60_000,
  });
  expect(await t.query(api.hackathons.bySlug, { slug })).toEqual(profile);
});
