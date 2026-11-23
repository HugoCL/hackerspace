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

it("converts existing team roles to bounded, searchable free text", async () => {
  const t = convexTest(schema, modules);
  migrations.register(t);
  await t.mutation(internal.seed.ensure, {});
  const longRoles = [
    "Facilitar entrevistas con vecinas",
    "Organizar talleres en plazas",
    "Preparar un mapa de iniciativas",
    "Documentar testimonios e historias",
    "Conectar con radios comunitarias",
  ];
  const longTeamId = await t.run(async (ctx) => {
    const team = await ctx.db.query("teams").first();
    if (!team) throw new Error("Missing sample team");
    return ctx.db.insert("teams", {
      hackathonId: team.hackathonId,
      ownerId: team.ownerId,
      name: "Conversaciones",
      description: "Recopilar historias de barrios.",
      recruitingStatus: "recruiting",
      rolesWanted: longRoles,
    });
  });
  await t.run(async (ctx) => {
    const team = await ctx.db.query("teams").first();
    if (!team) throw new Error("Missing sample team");
    await ctx.db.patch("teams", team._id, {
      lookingFor: undefined,
      searchableText: undefined,
      rolesWanted: ["Frontend", "Diseño"],
      searchableRoles: "Frontend Diseño",
    });
  });

  await expect(t.mutation(internal.migrations.runAll, {})).resolves.toBeNull();
  const team = await t.run((ctx) => ctx.db.query("teams").first());
  expect(team?.lookingFor).toBe("Frontend, Diseño");
  expect(team?.searchableText).toBe(`${team?.name} Frontend, Diseño`);
  expect(team).not.toHaveProperty("rolesWanted");
  expect(team).not.toHaveProperty("searchableRoles");
  const longTeam = await t.run((ctx) => ctx.db.get("teams", longTeamId));
  expect(longTeam?.lookingFor?.length).toBeLessThanOrEqual(140);
  expect(longTeam?.lookingFor).toMatch(/…$/);
  expect(longTeam?.archivedRoles).toEqual(longRoles);
  expect(longTeam).not.toHaveProperty("rolesWanted");
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
