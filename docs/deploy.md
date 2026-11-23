# Deploy Hackerspace

## 1. Set up the domain and Clerk

- Add `hackerspace.hugocastro.dev` as a custom domain in Vercel. At the DNS provider for `hugocastro.dev`, add the record Vercel shows for that hostname.
- In the Clerk Dashboard, create a production instance for `hackerspace.hugocastro.dev`. Add the exact DNS records shown under **Domains**, including the Frontend API record, and wait for verification/TLS. If the dashboard gives a different Frontend API URL than `https://clerk.hackerspace.hugocastro.dev`, update the production issuer literal and test before deploying.
- Enable the [Convex integration](https://docs.convex.dev/auth/clerk) on the **production** Clerk instance; integrations are not copied from development. Verify the resulting session token has the configured issuer (`iss`), audience `convex` (`aud`), and the standard `name` and `picture` claims for a profile with both. Convex exposes those as `identity.name` and `identity.pictureUrl`. Configure any enabled social sign-in providers with production credentials.

## 2. Configure Vercel

Use the Next.js framework preset, Node.js 24 and the repository's pinned pnpm version. Set the **Build Command** in the Vercel project settings to:

```sh
npx convex deploy --cmd 'pnpm build'
```

Set variables by scope; do not reuse the production deploy key outside Production:

| Variable | Vercel Production | Vercel Preview (if enabled) | Local |
| --- | --- | --- | --- |
| `CONVEX_DEPLOY_KEY` | Convex **production** deploy key | Convex **preview** deploy key | Unset for anonymous mode; dev key for cloud dev |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production instance (`pk_live_…`) | Development instance (`pk_test_…`) | Development key or unset for keyless |
| `CLERK_SECRET_KEY` | Matching production key (`sk_live_…`) | Matching development key (`sk_test_…`) | Matching development key or unset for keyless |
| `NEXT_PUBLIC_CONVEX_URL` | Injected by `convex deploy` during the build | Same, for that preview deployment | Written by `pnpm dev` to `.env.local` |

Both Clerk issuers remain trusted by the shared Convex config. Review that trust boundary before exposing production; an identity from the dev issuer is distinct from a production Clerk account, but is still authenticated by Convex.

## 3. Release and load real events

1. Have a human approve and trigger the production release. The build command publishes the Convex schema and functions and builds Next.js; it does **not** run the dev startup or seed sample data. Do not run `pnpm seed` or `pnpm seed:reset` against production.
2. After deployment, a human must explicitly approve the migration for the named production Convex deployment. From a terminal selected to the correct Convex project, confirm the production target in the dashboard and run `pnpm migrate --prod`; check progress under **Functions / Logs** before making the release public.
3. With no events, the catalog shows an empty state. For the first real events, use the production Convex dashboard's **Data → hackathons** table. Add documents that match [the schema](../convex/schema.ts): a unique URL slug, title, modality, organizer, summary, topics, and `isSample: false`. Include the official URL and `endsOn` as `YYYY-MM-DD` when known so past events leave the upcoming catalog. Do not import the sample fixtures.
4. On the custom domain, check the catalog, a real event profile, and sign-in. With a second account, verify live presence and team chat before inviting users.
