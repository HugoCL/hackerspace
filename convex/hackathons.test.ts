/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import { localCalendarDate } from "../app/calendar-date";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

it("keeps an event listed through its final local calendar day", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.ensure, {});
  const today = localCalendarDate(new Date(2027, 2, 14, 23, 59));
  expect(today).toBe("2027-03-14");
  const events = await t.query(api.hackathons.list, { today });
  expect(events.map(({ slug }) => slug)).toContain("santiago-hacks");
});

it("reads upcoming and undated hackathons and resolves profiles by slug", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.ensure, {});
  const profile = await t.query(api.hackathons.bySlug, {
    slug: "santiago-hacks",
  });
  expect(profile).toMatchObject({
    title: "Santiago Hacks 2027",
    isSample: true,
  });
  await expect(
    t.query(api.hackathons.bySlug, { slug: "unknown" }),
  ).resolves.toBeNull();

  await t.run((ctx) =>
    ctx.db.insert("hackathons", {
      slug: "hybrid",
      title: "Hackathon híbrida",
      modality: "hybrid",
      summary: "Evento híbrido",
      organizer: "Comunidad",
      topics: [],
      isSample: false,
    }),
  );
  const events = await t.query(api.hackathons.list, { today: "2027-03-15" });
  expect(events.map(({ slug }) => slug)).toEqual([
    "hack-puerto",
    "codigo-sin-fronteras",
    "cordillera-lab",
    "hybrid",
  ]);
});
