import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { ConvexError, type Infer, v } from "convex/values";
import { components } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { teamDetails } from "./schema";
import { legacyLookingFor, lookingForLimit, teamSearchText } from "./teamText";

async function findUser(ctx: QueryCtx | MutationCtx, identityKey: string) {
  return ctx.db
    .query("users")
    .withIndex("by_identityKey", (q) => q.eq("identityKey", identityKey))
    .unique();
}

async function requireIdentity(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Inicia sesión para continuar.");
  return identity;
}

async function ensureUser(
  ctx: MutationCtx,
  identity: Awaited<ReturnType<typeof requireIdentity>>,
) {
  const existing = await findUser(ctx, identity.tokenIdentifier);
  return (
    existing?._id ??
    ctx.db.insert("users", {
      identityKey: identity.tokenIdentifier,
      displayName: (identity.name || identity.nickname || "Participante").slice(
        0,
        80,
      ),
    })
  );
}

async function requireOwnedTeam(ctx: MutationCtx, teamId: Id<"teams">) {
  const identity = await requireIdentity(ctx);
  const owner = await findUser(ctx, identity.tokenIdentifier);
  const team = await ctx.db.get("teams", teamId);
  if (!team || team.ownerId !== owner?._id) {
    throw new ConvexError("Solo el titular puede gestionar este equipo.");
  }
  return team;
}

function normalizeDetails(details: Infer<typeof teamDetails>) {
  const name = details.name.trim();
  const description = details.description.trim();
  const lookingFor = details.lookingFor.trim();
  if (!name || name.length > 70)
    throw new ConvexError("Escribe un nombre de hasta 70 caracteres.");
  if (!description || description.length > 400)
    throw new ConvexError("Escribe una descripción de hasta 400 caracteres.");
  if (details.lookingFor.length > lookingForLimit) {
    throw new ConvexError(
      `Describe qué buscan en hasta ${lookingForLimit} caracteres.`,
    );
  }
  return {
    ...details,
    name,
    description,
    lookingFor,
    searchableText: teamSearchText(name, lookingFor),
  };
}

async function membership(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
) {
  return ctx.db
    .query("teamMembers")
    .withIndex("by_teamId_and_userId", (q) =>
      q.eq("teamId", teamId).eq("userId", userId),
    )
    .unique();
}

async function conversationFor(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  participantId: Id<"users">,
) {
  return ctx.db
    .query("teamConversations")
    .withIndex("by_teamId_and_participantId", (q) =>
      q.eq("teamId", teamId).eq("participantId", participantId),
    )
    .unique();
}

export const list = query({
  args: {
    hackathonId: v.id("hackathons"),
    recruitingOnly: v.boolean(),
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(
    teamDetails.extend({
      _id: v.id("teams"),
      memberCount: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (
    ctx,
    { hackathonId, recruitingOnly, search, paginationOpts },
  ) => {
    const teams = ctx.db.query("teams");
    const term = search?.trim().slice(0, lookingForLimit);
    const page = await (term
      ? teams.withSearchIndex("search_searchableText", (q) => {
          const matches = q
            .search("searchableText", term)
            .eq("hackathonId", hackathonId);
          return recruitingOnly
            ? matches.eq("recruitingStatus", "recruiting")
            : matches;
        })
      : (recruitingOnly
          ? teams.withIndex("by_hackathonId_and_recruitingStatus", (q) =>
              q
                .eq("hackathonId", hackathonId)
                .eq("recruitingStatus", "recruiting"),
            )
          : teams.withIndex("by_hackathonId", (q) =>
              q.eq("hackathonId", hackathonId),
            )
        ).order("desc")
    ).paginate(paginationOpts);
    return {
      ...page,
      page: page.page.map(
        ({
          _id,
          name,
          description,
          lookingFor,
          rolesWanted,
          recruitingStatus,
          memberCount,
        }) => ({
          _id,
          name,
          description,
          recruitingStatus,
          lookingFor: lookingFor ?? legacyLookingFor(rolesWanted).text,
          memberCount: memberCount ?? null,
        }),
      ),
    };
  },
});

export const summary = query({
  args: { hackathonId: v.id("hackathons") },
  handler: async (ctx, { hackathonId }) => {
    const [all, recruiting] = await Promise.all([
      ctx.db
        .query("teams")
        .withIndex("by_hackathonId", (q) => q.eq("hackathonId", hackathonId))
        .take(1001),
      ctx.db
        .query("teams")
        .withIndex("by_hackathonId_and_recruitingStatus", (q) =>
          q.eq("hackathonId", hackathonId).eq("recruitingStatus", "recruiting"),
        )
        .take(1001),
    ]);
    return { total: all.length, recruiting: recruiting.length };
  },
});

export const viewerState = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const team = await ctx.db.get("teams", teamId);
    if (!team) return null;
    const user = await findUser(ctx, identity.tokenIdentifier);
    if (!user)
      return {
        kind: "visitor" as const,
        conversationId: null,
        conversationCount: null,
      };
    const conversation = await conversationFor(ctx, teamId, user._id);
    const kind =
      team.ownerId === user._id
        ? "owner"
        : (await membership(ctx, teamId, user._id))
          ? "member"
          : "visitor";
    return {
      kind,
      conversationId: conversation?._id ?? null,
      conversationCount:
        kind === "owner"
          ? (
              await ctx.db
                .query("teamConversations")
                .withIndex("by_teamId_and_updatedAt", (q) =>
                  q.eq("teamId", teamId),
                )
                .take(1001)
            ).length
          : null,
    };
  },
});

export const create = mutation({
  args: { hackathonId: v.id("hackathons"), ...teamDetails.fields },
  handler: async (ctx, { hackathonId, ...details }) => {
    const identity = await requireIdentity(ctx);
    if (!(await ctx.db.get("hackathons", hackathonId)))
      throw new ConvexError("No encontramos esta hackathon.");
    const ownerId = await ensureUser(ctx, identity);
    const teamId = await ctx.db.insert("teams", {
      ...normalizeDetails(details),
      hackathonId,
      ownerId,
      memberCount: 1,
    });
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: ownerId,
      joinedAt: Date.now(),
    });
    return teamId;
  },
});

export const update = mutation({
  args: { teamId: v.id("teams"), ...teamDetails.fields },
  handler: async (ctx, { teamId, ...details }) => {
    await requireOwnedTeam(ctx, teamId);
    await ctx.db.patch("teams", teamId, normalizeDetails(details));
  },
});

const messageLimits = new RateLimiter(components.rateLimiter, {
  message: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 8 },
});

async function viewer(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return identity ? findUser(ctx, identity.tokenIdentifier) : null;
}

async function canReadInbox(
  ctx: QueryCtx | MutationCtx,
  team: Doc<"teams">,
  userId: Id<"users">,
) {
  return (
    team.ownerId === userId || Boolean(await membership(ctx, team._id, userId))
  );
}

async function conversationAccess(
  ctx: QueryCtx | MutationCtx,
  conversationId: Id<"teamConversations">,
) {
  const user = await viewer(ctx);
  const conversation = await ctx.db.get("teamConversations", conversationId);
  if (!user || !conversation) return null;
  const team = await ctx.db.get("teams", conversation.teamId);
  if (
    !team ||
    (conversation.participantId !== user._id &&
      !(await canReadInbox(ctx, team, user._id)))
  )
    return null;
  return { conversation, team, user };
}

function messageBody(body: string) {
  const text = body.trim();
  if (!text || body.length > 1000)
    throw new ConvexError("Escribe un mensaje de hasta 1000 caracteres.");
  return text;
}

async function insertMessage(
  ctx: MutationCtx,
  conversationId: Id<"teamConversations">,
  senderId: Id<"users">,
  body: string,
) {
  if (!(await messageLimits.limit(ctx, "message", { key: senderId })).ok)
    throw new ConvexError("Espera un momento antes de enviar otro mensaje.");
  await ctx.db.insert("teamMessages", { conversationId, senderId, body });
  await ctx.db.patch("teamConversations", conversationId, {
    updatedAt: Date.now(),
  });
}

export const startConversation = mutation({
  args: { teamId: v.id("teams"), body: v.string() },
  handler: async (ctx, { teamId, body }) => {
    const identity = await requireIdentity(ctx);
    const text = messageBody(body);
    const team = await ctx.db.get("teams", teamId);
    if (!team) throw new ConvexError("No encontramos este equipo.");
    const participantId = await ensureUser(ctx, identity);
    const existing = await conversationFor(ctx, teamId, participantId);
    if (existing) {
      await insertMessage(ctx, existing._id, participantId, text);
      return existing._id;
    }
    if (await canReadInbox(ctx, team, participantId))
      throw new ConvexError("Ya eres parte de este equipo.");
    if (team.recruitingStatus !== "recruiting")
      throw new ConvexError("Este equipo ya no busca integrantes.");
    const conversationId = await ctx.db.insert("teamConversations", {
      teamId,
      participantId,
      updatedAt: Date.now(),
    });
    await insertMessage(ctx, conversationId, participantId, text);
    return conversationId;
  },
});

export const sendMessage = mutation({
  args: { conversationId: v.id("teamConversations"), body: v.string() },
  handler: async (ctx, { conversationId, body }) => {
    const access = await conversationAccess(ctx, conversationId);
    if (!access) throw new ConvexError("No tienes acceso a esta conversación.");
    await insertMessage(
      ctx,
      conversationId,
      access.user._id,
      messageBody(body),
    );
  },
});

const emptyPage = { page: [], isDone: true, continueCursor: "" };

export const conversations = query({
  args: {
    teamId: v.id("teams"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { teamId, paginationOpts }) => {
    const user = await viewer(ctx);
    const team = await ctx.db.get("teams", teamId);
    if (!user || !team || !(await canReadInbox(ctx, team, user._id)))
      return emptyPage;
    const result = await ctx.db
      .query("teamConversations")
      .withIndex("by_teamId_and_updatedAt", (q) => q.eq("teamId", teamId))
      .order("desc")
      .paginate(paginationOpts);
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async ({ _id, participantId, updatedAt }) => {
          const [participant, lastMessage] = await Promise.all([
            ctx.db.get("users", participantId),
            ctx.db
              .query("teamMessages")
              .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", _id),
              )
              .order("desc")
              .first(),
          ]);
          return {
            _id,
            displayName: participant?.displayName ?? "Participante",
            lastMessage: lastMessage?.body ?? null,
            lastMessageAt: lastMessage?._creationTime ?? updatedAt,
          };
        }),
      ),
    };
  },
});

export const conversationContact = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    if (!(await ctx.auth.getUserIdentity())) return null;
    const team = await ctx.db.get("teams", teamId);
    if (!team || team.recruitingStatus !== "recruiting") return null;
    const owner = await ctx.db.get("users", team.ownerId);
    return owner?.displayName ?? team.name;
  },
});

export const conversation = query({
  args: { conversationId: v.id("teamConversations") },
  handler: async (ctx, { conversationId }) => {
    const access = await conversationAccess(ctx, conversationId);
    if (!access) return null;
    const { team, user, conversation } = access;
    const isOwner = team.ownerId === user._id;
    const contactId =
      user._id === conversation.participantId
        ? team.ownerId
        : conversation.participantId;
    const contact = contactId ? await ctx.db.get("users", contactId) : null;
    const isMember =
      isOwner &&
      !!(await membership(ctx, team._id, conversation.participantId));
    return {
      displayName:
        contact?.displayName ??
        (user._id === conversation.participantId ? team.name : "Participante"),
      canAdd: isOwner && !isMember,
      isMember,
    };
  },
});

export const messages = query({
  args: {
    conversationId: v.id("teamConversations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { conversationId, paginationOpts }) => {
    const access = await conversationAccess(ctx, conversationId);
    if (!access) return emptyPage;
    const result = await ctx.db
      .query("teamMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", conversationId),
      )
      .order("desc")
      .paginate(paginationOpts);
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async ({ _id, _creationTime, senderId, body }) => ({
          _id,
          _creationTime,
          senderId,
          isMine: senderId === access.user._id,
          body,
          displayName:
            senderId === access.user._id
              ? "Tú"
              : ((await ctx.db.get("users", senderId))?.displayName ??
                "Participante"),
        })),
      ),
    };
  },
});

export const addParticipant = mutation({
  args: { teamId: v.id("teams"), conversationId: v.id("teamConversations") },
  handler: async (ctx, { teamId, conversationId }) => {
    const team = await requireOwnedTeam(ctx, teamId);
    const conversation = await ctx.db.get("teamConversations", conversationId);
    if (!conversation || conversation.teamId !== teamId)
      throw new ConvexError("No encontramos esa conversación.");
    if (!(await membership(ctx, teamId, conversation.participantId))) {
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: conversation.participantId,
        joinedAt: Date.now(),
      });
      if (team.memberCount !== undefined) {
        await ctx.db.patch("teams", teamId, {
          memberCount: team.memberCount + 1,
        });
      }
    }
  },
});
