import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";

// Use this file for every destructive schema change and every backfill:
//   1. make the schema accept old and new data (new field optional, old field optional),
//   2. write a migration below that moves the data,
//   3. push, then run `pnpm migrate` (runs everything in `runAll`, skips finished ones),
//   4. tighten the schema once all data matches. Convex refuses the push until it does.
// Docs: https://www.convex.dev/components/migrations
export const migrations = new Migrations<DataModel>(components.migrations);

// `convex run migrations:run '{"fn":"migrations:<name>"}'` runs one migration by name.
export const run = migrations.runner();

export const backfillSearchableRoles = migrations.define({
  table: "teams",
  migrateOne: (_ctx, team) => ({ searchableRoles: team.rolesWanted.join(" ") }),
});

// `pnpm migrate`: runs the listed migrations in order. Add new ones to this list.
export const runAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    await migrations.runSerially(ctx, [
      internal.migrations.backfillSearchableRoles,
    ]);
    return null;
  },
});
