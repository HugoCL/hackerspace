/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

it("exposes the public connection status without a Clerk account", async () => {
  const t = convexTest(schema, modules);

  await expect(t.query(api.health.status, {})).resolves.toBe("ok");
});

it("can seed repeatedly without duplicating sample data", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(internal.seed.ensure, {})).resolves.toEqual({
    seeded: ["hackathons"],
  });
  await expect(t.mutation(internal.seed.ensure, {})).resolves.toEqual({
    seeded: [],
  });
});

it("can run an empty migration list", async () => {
  const t = convexTest(schema, modules);

  await expect(t.mutation(internal.migrations.runAll, {})).resolves.toBeNull();
});

it("can reset a local deployment", async () => {
  const t = convexTest(schema, modules);
  vi.stubEnv("CONVEX_CLOUD_URL", "http://127.0.0.1:3210");

  try {
    await expect(t.mutation(internal.seed.reset, {})).resolves.toEqual({
      reset: ["hackathons"],
    });
  } finally {
    vi.unstubAllEnvs();
  }
});
