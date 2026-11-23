/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as hackathons from "../hackathons.js";
import type * as health from "../health.js";
import type * as jobs from "../jobs.js";
import type * as migrations from "../migrations.js";
import type * as presence from "../presence.js";
import type * as sampleHackathons from "../sampleHackathons.js";
import type * as seed from "../seed.js";
import type * as teams from "../teams.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  hackathons: typeof hackathons;
  health: typeof health;
  jobs: typeof jobs;
  migrations: typeof migrations;
  presence: typeof presence;
  sampleHackathons: typeof sampleHackathons;
  seed: typeof seed;
  teams: typeof teams;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  backgroundWork: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"backgroundWork">;
};
