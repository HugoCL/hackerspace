import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { legacyLookingFor, teamSearchText } from "./teamText";

// Use this file for every destructive schema change and every backfill:
//   1. make the schema accept old and new data (new field optional, old field optional),
//   2. write a migration below that moves the data,
//   3. push, then run `pnpm migrate` (runs everything in `runAll`, skips finished ones),
//   4. tighten the schema once all data matches. Convex refuses the push until it does.
// Docs: https://www.convex.dev/components/migrations
export const migrations = new Migrations<DataModel>(components.migrations);

// `convex run migrations:run '{"fn":"migrations:<name>"}'` runs one migration by name.
export const run = migrations.runner();

export const migrateTeamLookingFor = migrations.define({
  table: "teams",
  migrateOne: (_ctx, team) => {
    if (
      team.rolesWanted === undefined &&
      team.searchableRoles === undefined &&
      team.lookingFor !== undefined &&
      team.searchableText !== undefined
    )
      return;
    const legacy = legacyLookingFor(team.rolesWanted);
    const lookingFor = team.lookingFor ?? legacy.text;
    return {
      lookingFor,
      searchableText: teamSearchText(team.name, lookingFor),
      ...(legacy.truncated && team.rolesWanted
        ? { archivedRoles: team.rolesWanted }
        : {}),
      rolesWanted: undefined,
      searchableRoles: undefined,
    };
  },
});

export const backfillTeamMemberCount = migrations.define({
  table: "teams",
  batchSize: 1,
  migrateOne: async (ctx, team) => {
    if (team.memberCount !== undefined) return;
    let memberCount = 0;
    for await (const _member of ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", team._id))) {
      memberCount++;
    }
    return { memberCount };
  },
});

// `pnpm migrate`: runs the listed migrations in order. Add new ones to this list.
export const runAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    await migrations.runSerially(ctx, [
      internal.migrations.migrateTeamLookingFor,
      internal.migrations.backfillTeamMemberCount,
    ]);
    return null;
  },
});
