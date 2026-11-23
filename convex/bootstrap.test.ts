/// <reference types="vite/client" />
import migrations from "@convex-dev/migrations/test";
import { convexTest } from "convex-test";
import { expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

it("exposes the public connection status without a Clerk account", async () => {
  const t = convexTest(schema, modules);

  await expect(t.query(api.health.status, {})).resolves.toBe("ok");
});

it("can seed repeatedly without duplicating sample data", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(internal.seed.ensure, {})).resolves.toEqual({
    seeded: ["hackathons", "teams"],
  });
  await expect(t.mutation(internal.seed.ensure, {})).resolves.toEqual({
    seeded: [],
  });
});

it("backfills role search for existing teams", async () => {
  const t = convexTest(schema, modules);
  migrations.register(t);
  await t.mutation(internal.seed.ensure, {});
  await t.run(async (ctx) => {
    const team = await ctx.db.query("teams").first();
    if (!team) throw new Error("Missing sample team");
    await ctx.db.patch("teams", team._id, { searchableRoles: undefined });
  });

  await expect(t.mutation(internal.migrations.runAll, {})).resolves.toBeNull();
  const team = await t.run((ctx) => ctx.db.query("teams").first());
  expect(team?.searchableRoles).toBe(team?.rolesWanted.join(" "));
});

it("can reset a local deployment", async () => {
  const t = convexTest(schema, modules);
  vi.stubEnv("CONVEX_CLOUD_URL", "http://127.0.0.1:3210");

  try {
    await expect(t.mutation(internal.seed.reset, {})).resolves.toEqual({
      reset: [
        "hackathons",
        "users",
        "teams",
        "teamMembers",
        "teamJoinRequests",
        "teamConversations",
        "teamMessages",
      ],
    });
  } finally {
    vi.unstubAllEnvs();
  }
});
