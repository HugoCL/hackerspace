/// <reference types="vite/client" />
import rateLimiter from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const details = {
  name: "Equipo Aurora",
  description: "Creamos un mapa de rutas.",
  lookingFor: "Alguien que disfrute dibujar rutas y entrevistar vecinos.",
  recruitingStatus: "recruiting" as const,
};

async function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
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
    { _id: teamId, ...details, memberCount: 1 },
  ]);
  expect(await t.query(api.teams.summary, { hackathonId })).toEqual({
    total: 1,
    recruiting: 1,
  });
  expect(
    (await t.query(api.teams.list, { ...listArgs, search: "vecinos" })).page,
  ).toMatchObject([{ _id: teamId }]);
  expect(
    (await t.query(api.teams.list, { ...listArgs, search: "Aurora" })).page,
  ).toMatchObject([{ _id: teamId }]);
  expect(
    (await t.query(api.teams.list, { ...listArgs, search: "Backend" })).page,
  ).toEqual([]);
  await expect(
    outsider.mutation(api.teams.update, { teamId, ...details }),
  ).rejects.toThrow("Solo el titular");
  const tooLong = { ...details, lookingFor: "a".repeat(141) };
  await expect(
    owner.mutation(api.teams.create, { hackathonId, ...tooLong }),
  ).rejects.toThrow("hasta 140 caracteres");
  await expect(
    owner.mutation(api.teams.update, { teamId, ...tooLong }),
  ).rejects.toThrow("hasta 140 caracteres");
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
    outsider.mutation(api.teams.startConversation, { teamId, body: "Hola" }),
  ).rejects.toThrow("ya no busca");
  const members = await t.run((ctx) => ctx.db.query("teamMembers").collect());
  const team = await t.run((ctx) => ctx.db.get("teams", teamId));
  expect(members.filter((member) => member.teamId === teamId)).toMatchObject([
    { userId: team?.ownerId },
  ]);
});

it("keeps messages private and lets only the owner add a member exactly once", async () => {
  const { t, owner, applicant, outsider, hackathonId } = await setup();
  const teamId = await owner.mutation(api.teams.create, {
    hackathonId,
    ...details,
  });
  const paginationOpts = { numItems: 10, cursor: null };
  await expect(
    t.mutation(api.teams.startConversation, { teamId, body: "Hola" }),
  ).rejects.toThrow("Inicia sesión");
  const conversationId = await applicant.mutation(api.teams.startConversation, {
    teamId,
    body: " Hola, ¿les falta frontend? ",
  });
  expect(
    await applicant.mutation(api.teams.startConversation, {
      teamId,
      body: "Puedo ayudar.",
    }),
  ).toBe(conversationId);
  expect(await t.query(api.teams.viewerState, { teamId })).toBeNull();
  expect(await outsider.query(api.teams.viewerState, { teamId })).toEqual({
    kind: "visitor",
    conversationId: null,
    conversationCount: null,
  });
  expect(await applicant.query(api.teams.viewerState, { teamId })).toEqual({
    kind: "visitor",
    conversationId,
    conversationCount: null,
  });
  expect(await owner.query(api.teams.viewerState, { teamId })).toEqual({
    kind: "owner",
    conversationId: null,
    conversationCount: 1,
  });
  const inbox = { teamId, paginationOpts };
  const history = { conversationId, paginationOpts };
  expect(await t.query(api.teams.conversationContact, { teamId })).toBeNull();
  expect(await outsider.query(api.teams.conversationContact, { teamId })).toBe(
    "Andrea",
  );
  expect(
    (await owner.query(api.teams.conversations, inbox)).page,
  ).toMatchObject([
    {
      _id: conversationId,
      displayName: "Bea",
      lastMessage: "Puedo ayudar.",
      lastMessageAt: expect.any(Number),
    },
  ]);
  expect((await outsider.query(api.teams.conversations, inbox)).page).toEqual(
    [],
  );
  expect((await applicant.query(api.teams.conversations, inbox)).page).toEqual(
    [],
  );
  expect(
    await outsider.query(api.teams.conversation, { conversationId }),
  ).toBeNull();
  expect((await t.query(api.teams.messages, history)).page).toEqual([]);
  expect((await outsider.query(api.teams.messages, history)).page).toEqual([]);
  await expect(
    outsider.mutation(api.teams.sendMessage, {
      conversationId,
      body: "Intruso",
    }),
  ).rejects.toThrow("No tienes acceso");
  expect((await owner.query(api.teams.messages, history)).page).toMatchObject([
    { displayName: "Bea", body: "Puedo ayudar.", isMine: false },
    { displayName: "Bea", body: "Hola, ¿les falta frontend?", isMine: false },
  ]);
  await owner.mutation(api.teams.sendMessage, {
    conversationId,
    body: "¡Conversemos!",
  });
  expect(
    (await applicant.query(api.teams.messages, history)).page[0],
  ).toMatchObject({
    displayName: "Andrea",
    body: "¡Conversemos!",
    isMine: false,
    _creationTime: expect.any(Number),
  });
  expect(
    (await owner.query(api.teams.messages, history)).page[0],
  ).toMatchObject({ isMine: true });
  expect(
    await applicant.query(api.teams.conversation, { conversationId }),
  ).toMatchObject({ displayName: "Andrea", canAdd: false, isMember: false });
  const resolution = { teamId, conversationId };
  await expect(
    outsider.mutation(api.teams.addParticipant, resolution),
  ).rejects.toThrow("Solo el titular");
  expect(
    await owner.query(api.teams.conversation, { conversationId }),
  ).toMatchObject({ displayName: "Bea", canAdd: true, isMember: false });
  await owner.mutation(api.teams.addParticipant, resolution);
  await owner.mutation(api.teams.addParticipant, resolution);
  expect(
    await owner.query(api.teams.conversation, { conversationId }),
  ).toMatchObject({ canAdd: false, isMember: true });
  expect(await applicant.query(api.teams.viewerState, { teamId })).toEqual({
    kind: "member",
    conversationId,
    conversationCount: null,
  });
  expect(
    (
      await t.query(api.teams.list, {
        hackathonId,
        recruitingOnly: false,
        paginationOpts,
      })
    ).page,
  ).toMatchObject([{ _id: teamId, memberCount: 2 }]);
  const other = await outsider.mutation(api.teams.startConversation, {
    teamId,
    body: "Hola equipo",
  });
  expect(
    await applicant.query(api.teams.conversation, { conversationId: other }),
  ).toMatchObject({ canAdd: false });
  await expect(
    applicant.mutation(api.teams.addParticipant, {
      teamId,
      conversationId: other,
    }),
  ).rejects.toThrow("Solo el titular");
  await applicant.mutation(api.teams.sendMessage, {
    conversationId: other,
    body: "Hola Carlos",
  });
  const members = await t.run((ctx) =>
    ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", teamId))
      .collect(),
  );
  expect(members).toHaveLength(2);
});

it("validates message length and limits messages per sender across teams", async () => {
  const { owner, applicant, outsider, hackathonId } = await setup();
  const teamId = await owner.mutation(api.teams.create, {
    hackathonId,
    ...details,
  });
  const otherTeamId = await owner.mutation(api.teams.create, {
    hackathonId,
    ...details,
  });
  for (const body of [" ", "x".repeat(1001)])
    await expect(
      applicant.mutation(api.teams.startConversation, { teamId, body }),
    ).rejects.toThrow("hasta 1000 caracteres");
  const conversationId = await applicant.mutation(api.teams.startConversation, {
    teamId,
    body: "Hola",
  });
  for (let index = 0; index < 7; index++)
    await applicant.mutation(api.teams.sendMessage, {
      conversationId,
      body: "Seguimiento",
    });
  await expect(
    applicant.mutation(api.teams.startConversation, {
      teamId: otherTeamId,
      body: "Hola",
    }),
  ).rejects.toThrow("Espera un momento");
  expect(
    await applicant.query(api.teams.viewerState, { teamId: otherTeamId }),
  ).toMatchObject({ conversationId: null });
  await expect(
    outsider.mutation(api.teams.startConversation, {
      teamId: otherTeamId,
      body: "Hola",
    }),
  ).resolves.toBeTruthy();
});
