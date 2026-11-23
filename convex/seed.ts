import type { GenericId } from "convex/values";
import type { TableNames } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { sampleHackathons } from "./sampleHackathons";

// Local deployments start empty, so every table needs sample data to develop against.
//
// RULE: add a table to convex/schema.ts -> add a seeder for it below. `seeders` is typed as
// Record<TableNames, Seeder>, so `pnpm typecheck` fails until every table has one.
//
// `pnpm dev` runs `seed:ensure` once at startup, before it starts watching. It only fills tables
// that are empty, so it is safe to run again. `pnpm seed` runs it by hand, `pnpm seed:reset`
// wipes and reseeds a local deployment (it refuses to run anywhere else). Both talk to the running
// deployment, so start `pnpm dev` first.
type Seeder = (ctx: MutationCtx) => Promise<boolean>;

export const seeders: Record<TableNames, Seeder> = {
  hackathons: async (ctx) => {
    for (const hackathon of sampleHackathons) {
      await ctx.db.insert("hackathons", { ...hackathon, isSample: true });
    }
    return true;
  },
  users: async () => false,
  teams: async (ctx) => {
    const hackathon = await ctx.db
      .query("hackathons")
      .withIndex("by_slug", (q) => q.eq("slug", "codigo-sin-fronteras"))
      .unique();
    if (!hackathon?.isSample) return false;
    for (const [name, description, rolesWanted] of [
      [
        "Punto de Encuentro",
        "Un mapa de comunidades de código abierto.",
        ["Frontend", "Diseño"],
      ],
      [
        "Ruta Abierta",
        "Una guía de contribuciones para principiantes.",
        ["Datos", "Backend"],
      ],
    ] as const) {
      const ownerId = await ctx.db.insert("users", {
        identityKey: `sample:${name}`,
        displayName: "Equipo de ejemplo",
      });
      const teamId = await ctx.db.insert("teams", {
        hackathonId: hackathon._id,
        ownerId,
        name,
        description,
        rolesWanted: [...rolesWanted],
        recruitingStatus: "recruiting",
      });
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: ownerId,
        joinedAt: Date.now(),
      });
    }
    return true;
  },
  teamMembers: async () => false,
  teamJoinRequests: async () => false,
};

const tables = Object.entries<Seeder>(seeders) as [TableNames, Seeder][];

// Seeds every table that has no documents yet and leaves the others alone.
export const ensure = internalMutation({
  args: {},
  handler: async (ctx) => {
    const seeded: TableNames[] = [];
    if (tables.length === 0) {
      console.log("seed: no tables configured");
      return { seeded };
    }
    for (const [table, seed] of tables) {
      if ((await ctx.db.query(table).first()) === null) {
        if (await seed(ctx)) seeded.push(table);
      }
    }
    console.log(
      seeded.length
        ? `seed: seeded ${seeded.join(", ")}`
        : "seed: every table already has data",
    );
    return { seeded };
  },
});

// Local deployments (`convex dev` anonymous or local) serve from the loopback address.
function isLocalDeployment() {
  const url = process.env.CONVEX_CLOUD_URL;
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(host);
  } catch {
    return false;
  }
}

// Deletes every document of every seeded table, then seeds again. Local deployments only.
// It runs in one transaction, so it suits seed-sized tables, not big ones. Everything is deleted
// first and seeded afterwards, in `seeders` order (list parents before children), so a seeder
// never sees leftover rows of a later table.
export const reset = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (!isLocalDeployment()) {
      throw new Error(
        "seed:reset only runs on a local deployment (CONVEX_CLOUD_URL must be localhost or 127.0.0.1)",
      );
    }
    for (const [table] of tables) {
      const rows: AsyncIterable<{ _id: GenericId<TableNames> }> =
        ctx.db.query(table);
      for await (const { _id } of rows) {
        await ctx.db.delete(table, _id);
      }
    }
    const reset: TableNames[] = [];
    for (const [table, seed] of tables) {
      await seed(ctx);
      reset.push(table);
    }
    console.log(`seed: reset ${reset.join(", ")}`);
    return { reset };
  },
});
