import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";

const presence = new Presence(components.presence);
const heartbeatMs = 5000;
const countLimit = 1000;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const viewerDetails = v.object({
  name: v.string(),
  image: v.optional(v.string()),
});
const totals = { count: v.number(), visitors: v.number() };

function roomFor(hackathonId: Id<"hackathons">, signedIn: boolean) {
  return `hackathon:${hackathonId}:${signedIn ? "accounts" : "visitors"}`;
}

async function onlineVisitors(ctx: QueryCtx, hackathonId: Id<"hackathons">) {
  return (
    await presence.listRoom(
      ctx,
      roomFor(hackathonId, false),
      true,
      countLimit + 1,
    )
  ).length;
}

async function onlineAccounts(ctx: QueryCtx, hackathonId: Id<"hackathons">) {
  return presence.listRoom(
    ctx,
    roomFor(hackathonId, true),
    true,
    countLimit + 1,
  );
}

export const heartbeat = mutation({
  args: {
    hasProfileImage: v.optional(v.boolean()),
    hackathonId: v.id("hackathons"),
    sessionId: v.string(),
    visitorId: v.optional(v.string()),
  },
  returns: v.object({ roomToken: v.string(), sessionToken: v.string() }),
  handler: async (
    ctx,
    { hackathonId, hasProfileImage, sessionId, visitorId },
  ) => {
    if (!uuid.test(sessionId)) {
      throw new Error("Invalid presence session");
    }
    if (!(await ctx.db.get("hackathons", hackathonId))) {
      throw new Error("Hackathon not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    const roomId = roomFor(hackathonId, Boolean(identity));
    if (!identity && (!visitorId || !uuid.test(visitorId))) {
      throw new Error("Invalid anonymous visitor");
    }
    const userId = identity
      ? `account:${identity.tokenIdentifier}`
      : `visitor:${visitorId?.toLowerCase()}`;
    const tokens = await presence.heartbeat(
      ctx,
      roomId,
      userId,
      JSON.stringify([roomId, userId, sessionId]),
      heartbeatMs,
    );
    if (identity) {
      const image = hasProfileImage === false ? undefined : identity.pictureUrl;
      await presence.updateRoomUser(ctx, roomId, userId, {
        name: identity.name || identity.nickname || "Participante",
        ...(image && /^https:\/\//i.test(image) ? { image } : {}),
      });
    }
    return tokens;
  },
});

export const list = query({
  args: { hackathonId: v.id("hackathons"), roomToken: v.string() },
  returns: v.union(
    v.object(totals),
    v.object({ ...totals, viewers: v.array(viewerDetails) }),
  ),
  handler: async (ctx, { hackathonId, roomToken }) => {
    const [accounts, visitors, identity] = await Promise.all([
      onlineAccounts(ctx, hackathonId),
      onlineVisitors(ctx, hackathonId),
      ctx.auth.getUserIdentity(),
    ]);
    const count = accounts.length;
    if (!identity) return { count, visitors };

    const accountIds = new Set(accounts.map(({ userId }) => userId));
    const viewers = [];
    for (const { userId, online, data } of await presence.list(
      ctx,
      roomToken,
      8,
    )) {
      if (
        !online ||
        !accountIds.has(userId) ||
        !data ||
        typeof data !== "object"
      )
        continue;
      if (!("name" in data) || typeof data.name !== "string") continue;
      const image =
        "image" in data && typeof data.image === "string"
          ? data.image
          : undefined;
      viewers.push({ name: data.name, ...(image ? { image } : {}) });
    }
    return { count, visitors, viewers };
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: (ctx, { sessionToken }) => presence.disconnect(ctx, sessionToken),
});

export const count = query({
  args: { hackathonId: v.id("hackathons") },
  returns: v.object(totals),
  handler: async (ctx, { hackathonId }) => {
    const [accounts, visitors] = await Promise.all([
      onlineAccounts(ctx, hackathonId),
      onlineVisitors(ctx, hackathonId),
    ]);
    return { count: accounts.length, visitors };
  },
});
