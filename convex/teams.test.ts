/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const details = {
  name: "Equipo Aurora",
  description: "Creamos un mapa de rutas.",
  rolesWanted: ["Diseño", "Frontend"],
  recruitingStatus: "recruiting" as const,
};

async function setup() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.ensure, {});
  const event = await t.query(api.hackathons.bySlug, {
    slug: "santiago-hacks",
  });
  if (!event) throw new Error("Missing sample hackathon");
  return {
    t,
    hackathonId: event._id,
    owner: t.withIdentity({ subject: "owner", name: "Andrea" }),
    applicant: t.withIdentity({
      subject: "applicant",
      name: "Bea",
      email: "private@example.com",
    }),
    outsider: t.withIdentity({ subject: "outsider", name: "Carlos" }),
  };
}

it("lists teams publicly, filters recruiting teams, and only lets the owner edit", async () => {
  const { t, owner, outsider, hackathonId } = await setup();
  const listArgs = {
    hackathonId,
    recruitingOnly: true,
    paginationOpts: { numItems: 10, cursor: null },
  };
  await expect(
    t.mutation(api.teams.create, { hackathonId, ...details }),
  ).rejects.toThrow("Inicia sesión");
  expect((await t.query(api.teams.list, listArgs)).page).toEqual([]);

  const teamId = await owner.mutation(api.teams.create, {
    hackathonId,
    ...details,
  });
  expect((await t.query(api.teams.list, listArgs)).page).toEqual([
    { _id: teamId, ...details },
  ]);
  expect(await t.query(api.teams.summary, { hackathonId })).toEqual({
    total: 1,
    recruiting: 1,
  });
  expect(
    (await t.query(api.teams.list, { ...listArgs, role: "Frontend" })).page,
  ).toMatchObject([{ _id: teamId }]);
  expect(
    (await t.query(api.teams.list, { ...listArgs, role: "Backend" })).page,
  ).toEqual([]);
  await expect(
    outsider.mutation(api.teams.update, { teamId, ...details }),
  ).rejects.toThrow("Solo el titular");
  await owner.mutation(api.teams.update, {
    teamId,
    ...details,
    recruitingStatus: "closed",
  });
  expect((await t.query(api.teams.list, listArgs)).page).toEqual([]);
  expect(await t.query(api.teams.summary, { hackathonId })).toEqual({
    total: 1,
    recruiting: 0,
  });
  expect(
    (await t.query(api.teams.list, { ...listArgs, recruitingOnly: false }))
      .page,
  ).toMatchObject([{ _id: teamId }]);
  await expect(
    outsider.mutation(api.teams.requestToJoin, { teamId }),
  ).rejects.toThrow("ya no busca");
  const members = await t.run((ctx) => ctx.db.query("teamMembers").collect());
  const team = await t.run((ctx) => ctx.db.get("teams", teamId));
  expect(members.filter((member) => member.teamId === teamId)).toMatchObject([
    { userId: team?.ownerId },
  ]);
});

it("keeps requests private and accepts membership exactly once", async () => {
  const { t, owner, applicant, outsider, hackathonId } = await setup();
  const teamId = await owner.mutation(api.teams.create, {
    hackathonId,
    ...details,
  });
  const requestId = await applicant.mutation(api.teams.requestToJoin, {
    teamId,
  });
  expect(await applicant.mutation(api.teams.requestToJoin, { teamId })).toBe(
    requestId,
  );
  expect(await t.query(api.teams.viewerState, { teamId })).toBeNull();
  expect(await outsider.query(api.teams.viewerState, { teamId })).toEqual({
    kind: "visitor",
    requestStatus: null,
  });
  expect(await applicant.query(api.teams.viewerState, { teamId })).toEqual({
    kind: "visitor",
    requestStatus: "pending",
  });
  expect(await owner.query(api.teams.viewerState, { teamId })).toEqual({
    kind: "owner",
    requests: [{ _id: requestId, displayName: "Bea" }],
  });
  const resolution = { teamId, requestId, decision: "accepted" as const };
  await expect(
    outsider.mutation(api.teams.resolveRequest, resolution),
  ).rejects.toThrow("Solo el titular");
  await owner.mutation(api.teams.resolveRequest, resolution);
  await owner.mutation(api.teams.resolveRequest, resolution);
  expect(await applicant.query(api.teams.viewerState, { teamId })).toEqual({
    kind: "member",
  });
  await expect(
    applicant.mutation(api.teams.requestToJoin, { teamId }),
  ).rejects.toThrow("Ya eres parte");
  const members = await t.run((ctx) =>
    ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", teamId))
      .collect(),
  );
  expect(members).toHaveLength(2);
});

it("rejects a request without granting membership", async () => {
  const { t, owner, applicant, hackathonId } = await setup();
  const teamId = await owner.mutation(api.teams.create, {
    hackathonId,
    ...details,
  });
  const requestId = await applicant.mutation(api.teams.requestToJoin, {
    teamId,
  });
  await owner.mutation(api.teams.resolveRequest, {
    teamId,
    requestId,
    decision: "rejected",
  });
  expect(await applicant.query(api.teams.viewerState, { teamId })).toEqual({
    kind: "visitor",
    requestStatus: "rejected",
  });
  const members = await t.run((ctx) =>
    ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", teamId))
      .collect(),
  );
  expect(members).toHaveLength(1);
  const retry = await applicant.mutation(api.teams.requestToJoin, { teamId });
  expect(retry).not.toBe(requestId);
});
