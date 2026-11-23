/// <reference types="vite/client" />
import presence from "@convex-dev/presence/test";
import { convexTest } from "convex-test";
import { expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

async function setup() {
  const t = convexTest(schema, modules);
  presence.register(t);
  await t.mutation(internal.seed.ensure, {});
  const event = await t.query(api.hackathons.bySlug, {
    slug: "santiago-hacks",
  });
  const other = await t.query(api.hackathons.bySlug, { slug: "hack-puerto" });
  if (!event || !other) throw new Error("Missing sample hackathons");
  return { t, hackathonId: event._id, otherId: other._id };
}

it("counts visitors without exposing them and deduplicates tabs by verified account", async () => {
  vi.useFakeTimers();
  try {
    const { t, hackathonId, otherId } = await setup();
    const viewer = t.withIdentity({
      subject: "viewer",
      name: "Ana Morales",
      pictureUrl: "https://example.com/ana.png",
      email: "private@example.com",
    });
    const otherViewer = t.withIdentity({ subject: "other" });
    const sessionId = crypto.randomUUID();
    const args = { hackathonId, sessionId };
    const tabOne = await viewer.mutation(api.presence.heartbeat, args);
    const tabTwo = await viewer.mutation(api.presence.heartbeat, {
      ...args,
      sessionId: crypto.randomUUID(),
    });
    const visitorArgs = { ...args, visitorId: sessionId };
    const anonymous = await t.mutation(api.presence.heartbeat, visitorArgs);
    const reloaded = await t.mutation(api.presence.heartbeat, {
      ...visitorArgs,
      sessionId: crypto.randomUUID(),
    });
    const differentRoom = await t.mutation(api.presence.heartbeat, {
      ...visitorArgs,
      hackathonId: otherId,
    });

    await expect(
      t.mutation(api.presence.heartbeat, {
        ...args,
        sessionId: "account:viewer",
      }),
    ).rejects.toThrow("Invalid presence session");
    expect(anonymous.sessionToken).not.toBe(tabOne.sessionToken);
    expect(reloaded.sessionToken).not.toBe(anonymous.sessionToken);
    expect(anonymous.roomToken).toBe(tabOne.roomToken);
    const listArgs = { roomToken: tabOne.roomToken };
    await expect(t.query(api.presence.list, listArgs)).resolves.toEqual({
      count: 2,
    });
    await expect(
      otherViewer.query(api.presence.list, listArgs),
    ).resolves.toEqual({
      count: 2,
      viewers: [{ name: "Ana Morales", image: "https://example.com/ana.png" }],
    });
    await expect(
      t.query(api.presence.list, { roomToken: differentRoom.roomToken }),
    ).resolves.toEqual({ count: 1 });

    await t.mutation(api.presence.disconnect, {
      sessionToken: tabOne.sessionToken,
    });
    await expect(t.query(api.presence.list, listArgs)).resolves.toEqual({
      count: 2,
    });
    await t.mutation(api.presence.disconnect, {
      sessionToken: tabTwo.sessionToken,
    });
    await expect(
      otherViewer.query(api.presence.list, listArgs),
    ).resolves.toEqual({ count: 1, viewers: [] });
    await t.mutation(api.presence.disconnect, {
      sessionToken: anonymous.sessionToken,
    });
    await expect(t.query(api.presence.list, listArgs)).resolves.toEqual({
      count: 1,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
  } finally {
    vi.useRealTimers();
  }
});

it("stops counting a session that stops sending heartbeats", async () => {
  vi.useFakeTimers();
  try {
    const { t, hackathonId } = await setup();
    const { roomToken } = await t.mutation(api.presence.heartbeat, {
      hackathonId,
      sessionId: crypto.randomUUID(),
      visitorId: crypto.randomUUID(),
    });
    await expect(t.query(api.presence.list, { roomToken })).resolves.toEqual({
      count: 1,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    await expect(t.query(api.presence.list, { roomToken })).resolves.toEqual({
      count: 0,
    });
  } finally {
    vi.useRealTimers();
  }
});
