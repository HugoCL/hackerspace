import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";

const presence = new Presence(components.presence);
const heartbeatMs = 5000;
const countLimit = 1000;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const viewerDetails = v.object({
  name: v.string(),
  image: v.optional(v.string()),
});

export const heartbeat = mutation({
  args: {
    hackathonId: v.id("hackathons"),
    sessionId: v.string(),
    visitorId: v.optional(v.string()),
  },
  returns: v.object({ roomToken: v.string(), sessionToken: v.string() }),
  handler: async (ctx, { hackathonId, sessionId, visitorId }) => {
    if (!uuid.test(sessionId)) {
      throw new Error("Invalid presence session");
    }
    if (!(await ctx.db.get("hackathons", hackathonId))) {
      throw new Error("Hackathon not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    const roomId = `hackathon:${hackathonId}`;
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
      const image = identity.pictureUrl;
      await presence.updateRoomUser(ctx, roomId, userId, {
        name: identity.name || identity.nickname || "Participante",
        ...(image && /^https:\/\//i.test(image) ? { image } : {}),
      });
    }
    return tokens;
  },
});

export const list = query({
  args: { roomToken: v.string() },
  returns: v.union(
    v.object({ count: v.number() }),
    v.object({ count: v.number(), viewers: v.array(viewerDetails) }),
  ),
  handler: async (ctx, { roomToken }) => {
    const online = (await presence.list(ctx, roomToken, countLimit + 1)).filter(
      ({ online }) => online,
    );
    const count = online.length;
    if (!(await ctx.auth.getUserIdentity())) return { count };

    const viewers = [];
    for (const { userId, data } of online) {
      if (!userId.startsWith("account:") || !data || typeof data !== "object")
        continue;
      if (!("name" in data) || typeof data.name !== "string") continue;
      const image =
        "image" in data && typeof data.image === "string"
          ? data.image
          : undefined;
      viewers.push({ name: data.name, ...(image ? { image } : {}) });
      if (viewers.length === 8) break;
    }
    return { count, viewers };
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: (ctx, { sessionToken }) => presence.disconnect(ctx, sessionToken),
});
