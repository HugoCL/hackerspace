import { paginationOptsValidator } from "convex/server";
import { ConvexError, type Infer, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { teamDetails } from "./schema";

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
  const rolesWanted = [
    ...new Set(details.rolesWanted.map((role) => role.trim()).filter(Boolean)),
  ];
  if (!name || name.length > 70)
    throw new ConvexError("Escribe un nombre de hasta 70 caracteres.");
  if (!description || description.length > 400)
    throw new ConvexError("Escribe una descripción de hasta 400 caracteres.");
  if (rolesWanted.length > 8 || rolesWanted.some((role) => role.length > 40)) {
    throw new ConvexError("Agrega hasta 8 roles de 40 caracteres cada uno.");
  }
  return {
    ...details,
    name,
    description,
    rolesWanted,
    searchableRoles: rolesWanted.join(" "),
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

async function latestRequest(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  requesterId: Id<"users">,
) {
  return ctx.db
    .query("teamJoinRequests")
    .withIndex("by_teamId_and_requesterId", (q) =>
      q.eq("teamId", teamId).eq("requesterId", requesterId),
    )
    .order("desc")
    .first();
}

export const list = query({
  args: {
    hackathonId: v.id("hackathons"),
    recruitingOnly: v.boolean(),
    role: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    { hackathonId, recruitingOnly, role, paginationOpts },
  ) => {
    const teams = ctx.db.query("teams");
    const roleSearch = role?.trim().slice(0, 40);
    const page = await (roleSearch
      ? teams.withSearchIndex("search_searchableRoles", (q) => {
          const search = q
            .search("searchableRoles", roleSearch)
            .eq("hackathonId", hackathonId);
          return recruitingOnly
            ? search.eq("recruitingStatus", "recruiting")
            : search;
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
        ({ _id, name, description, rolesWanted, recruitingStatus }) => ({
          _id,
          name,
          description,
          rolesWanted,
          recruitingStatus,
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
    if (!user) return { kind: "visitor" as const, requestStatus: null };
    if (team.ownerId === user._id) {
      const requests = await ctx.db
        .query("teamJoinRequests")
        .withIndex("by_teamId_and_status", (q) =>
          q.eq("teamId", teamId).eq("status", "pending"),
        )
        .take(25);
      return {
        kind: "owner" as const,
        requests: await Promise.all(
          requests.map(async ({ _id, requesterId }) => ({
            _id,
            displayName:
              (await ctx.db.get("users", requesterId))?.displayName ??
              "Participante",
          })),
        ),
      };
    }
    if (await membership(ctx, teamId, user._id))
      return { kind: "member" as const };
    const request = await latestRequest(ctx, teamId, user._id);
    return { kind: "visitor" as const, requestStatus: request?.status ?? null };
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

export const requestToJoin = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const identity = await requireIdentity(ctx);
    const team = await ctx.db.get("teams", teamId);
    if (!team) throw new ConvexError("No encontramos este equipo.");
    const requesterId = await ensureUser(ctx, identity);
    if (await membership(ctx, teamId, requesterId))
      throw new ConvexError("Ya eres parte de este equipo.");
    const latest = await latestRequest(ctx, teamId, requesterId);
    if (latest?.status === "pending") return latest._id;
    if (team.recruitingStatus !== "recruiting")
      throw new ConvexError("Este equipo ya no busca integrantes.");
    return ctx.db.insert("teamJoinRequests", {
      teamId,
      requesterId,
      status: "pending",
    });
  },
});

export const resolveRequest = mutation({
  args: {
    teamId: v.id("teams"),
    requestId: v.id("teamJoinRequests"),
    decision: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, { teamId, requestId, decision }) => {
    const team = await requireOwnedTeam(ctx, teamId);
    const request = await ctx.db.get("teamJoinRequests", requestId);
    if (!request || request.teamId !== teamId)
      throw new ConvexError("No encontramos esa solicitud.");
    if (request.status === decision) return;
    if (request.status !== "pending")
      throw new ConvexError("Esta solicitud ya se resolvió.");
    const now = Date.now();
    if (
      decision === "accepted" &&
      !(await membership(ctx, teamId, request.requesterId))
    ) {
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: request.requesterId,
        joinedAt: now,
      });
    }
    await ctx.db.patch("teamJoinRequests", requestId, {
      status: decision,
      decidedAt: now,
      decidedBy: team.ownerId,
    });
  },
});
