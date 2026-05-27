# CLAUDE.md — ppv-excercies-library

PPV Exercise Library: standalone Next.js 16 + TypeScript product (not a Trainely microservice).

## Stack

- **Framework:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4
- **Database:** PostgreSQL 16 (`video_library_db`), raw `pg` queries (no ORM)
- **Migrations:** `golang-migrate` — files live in `db/migrations/`
- **Payments:** OpenPay SDK (`../openpay-sdk/`) via webpack aliases (no build step); `MockProvider` in dev, `StripeProvider` when `STRIPE_SECRET_KEY` is set
- **Video delivery:** S3 (private) + CloudFront signed URLs (RSA-SHA1 canned policy, stdlib `crypto`)
- **Port:** 3002 (dev and container)

## Key conventions

- All REST routes are under `/api/` (e.g. `GET /api/exercises`). Web UI pages at the root.
- User identity comes from `x-user-id` and `x-user-role` headers forwarded by Trainely's Envoy. See `src/lib/auth.ts`.
- Multilingual content (`name`, `description`, `instructions`) stored as JSONB. Pass `?lang=en|pl`; fallback to `en`.
- OpenPay SDK packages are resolved via webpack `config.resolve.alias` in `next.config.ts` — they are **not** installed from npm. Do not run `pnpm build` in the SDK directory; Next.js compiles the source TypeScript directly.

## Commands

```bash
npm run dev          # start dev server (port 3002)
npm run build        # production build
npm run seed         # seed exercises from ../../excercises-blob/trainely_exercises.json
```

## Environment variables

See `.env.example`. Required at runtime:
- `DATABASE_URL` — PostgreSQL connection string for `video_library_db`
- `PPV_BASE_URL` — public base URL (e.g. `http://localhost:3002`)
- `CLOUDFRONT_BASE_URL`, `CLOUDFRONT_KEY_PAIR_ID`, `CLOUDFRONT_PRIVATE_KEY` — CDN signing (stub-safe; graceful fallback when absent)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — activates StripeProvider (mock used when absent)
- `AWS_REGION`, `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — S3 presigned URLs for offline download

## Design spec

`czarymary/docs/design/2026-05-27-ppv-exercise-library-design.md` (V1.2)
