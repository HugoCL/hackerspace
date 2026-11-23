import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function findUser(
  ctx: QueryCtx | MutationCtx,
  identityKey: string,
) {
  return ctx.db
    .query("users")
    .withIndex("by_identityKey", (q) => q.eq("identityKey", identityKey))
    .unique();
}

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Inicia sesión para continuar.");
  return identity;
}

export async function ensureUser(
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
