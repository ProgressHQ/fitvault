# FitVault

Pay-per-view exercise video platform. Coaches embed exercise demonstrations into training plans; athletes unlock and watch them inline. Certified contributors upload content and earn a revenue share.

**Stack:** Next.js 16 App Router · TypeScript 5 · PostgreSQL 16 · OpenPay SDK · S3 + CloudFront · Port 3002

---

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL 16 running locally
- `golang-migrate` CLI for running migrations
- The `excercises-blob/` repo cloned alongside this one (required for seeding)

### Setup

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL at minimum
make migrate                  # create schema in fitvault_db
make seed                     # load exercises from excercises-blob/excercises_en.json
npm run dev                   # http://localhost:3002
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL DSN, e.g. `postgres://app:app@localhost:5432/fitvault_db?sslmode=disable` |
| `FITVAULT_BASE_URL` | Yes | Public base URL used for checkout return URLs, e.g. `http://localhost:3002` |
| `CLOUDFRONT_BASE_URL` | No | CDN base URL for thumbnail/preview URLs. Omit in dev — placeholder `null` returned. |
| `CLOUDFRONT_KEY_PAIR_ID` | No | CloudFront signing key pair ID (RSA-SHA1 canned policy) |
| `CLOUDFRONT_PRIVATE_KEY` | No | CloudFront signing private key (PEM string) |
| `AWS_REGION` | No | Required for S3 presigned upload URLs (contributor pipeline) |
| `AWS_ACCESS_KEY_ID` | No | AWS credentials for S3 |
| `AWS_SECRET_ACCESS_KEY` | No | AWS credentials for S3 |
| `S3_BUCKET_NAME` | No | S3 bucket for video/thumbnail storage |
| `STRIPE_SECRET_KEY` | No | Activates `StripeProvider`. Leave unset to use `MockProvider` in dev. |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signature verification |

---

## Database

### Schema overview

| Table | Purpose |
|---|---|
| `fitvault_exercises` | Exercise catalogue. `name`, `description`, `instructions` are JSONB with per-language keys (`en`, `pl`). Status lifecycle: `DRAFT → PENDING_REVIEW → APPROVED`. |
| `fitvault_products` | Purchasable products: `SINGLE_VIDEO`, `BUNDLE`, `SUBSCRIPTION_MONTHLY`, `SUBSCRIPTION_ANNUAL`. |
| `user_video_unlocks` | Per-user, per-exercise purchase records. |
| `user_subscriptions` | Active subscription records with validity window. |
| `fitvault_contributors` | Verified contributor accounts with revenue share percentage (default 70%). |
| `contributor_earnings` | Per-unlock earnings ledger, grouped by period month. |
| `content_review_notes` | Admin review audit trail (`APPROVED`, `REJECTED`, `CHANGES_REQUESTED`). |

### Migrations

```bash
make migrate        # apply all pending migrations
make migrate-down   # roll back one step
```

### Seeding

Seeds the `fitvault_exercises` table from `../excercises-blob/excercises_en.json`. All seeded exercises are inserted with `status = 'APPROVED'` and are immediately visible via the API.

```bash
make seed
```

The seed script maps raw exercise fields to FitVault's schema:
- `level` → `BEGINNER / INTERMEDIATE / ADVANCED`
- `primaryMuscles` → normalised muscle group tags (`QUADS`, `BACK`, `CHEST`, …)
- `equipment` → normalised equipment tags (`BARBELL`, `DUMBBELL`, `BODYWEIGHT`, …)
- `force` → movement pattern (`PUSH`, `PULL`, `CARRY`)

---

## API routes

All routes are under `/api/`. User identity is forwarded via `x-user-id` and `x-user-role` request headers.

### Exercises

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/exercises` | List APPROVED exercises. Query: `q`, `muscle_groups`, `equipment`, `difficulty`, `movement_pattern`, `lang`, `cursor`, `limit`. |
| `GET` | `/api/exercises/:id` | Get exercise detail by ID. Query: `lang` (default `en`). |
| `GET` | `/api/exercises/:id/access` | Check athlete video access. Returns a signed CloudFront URL on success, `403` if no unlock/subscription, `404` if exercise not found. |
| `GET` | `/api/exercises/:id/download-url` | Returns a signed S3 URL for offline download (requires unlock). |

### Products & checkout

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List active products. |
| `POST` | `/api/checkout/video` | Initiate per-video purchase via OpenPay SDK. |
| `POST` | `/api/checkout/subscription` | Initiate subscription purchase. |
| `POST` | `/api/webhooks/payment` | Payment provider webhook — records unlock or subscription on success. |

### Contributor

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/contributor/upload-session` | Start a contributor upload: creates a `DRAFT` exercise row and returns an S3 presigned PUT URL. |
| `POST` | `/api/contributor/upload-session/:id/finalize` | Mark upload complete — moves exercise to `PENDING_REVIEW`. |
| `GET` | `/api/contributor/earnings` | Contributor earnings summary for the calling user. |

### Admin

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/exercises/pending` | List exercises in `PENDING_REVIEW`. Requires `x-user-role: ADMIN`. |
| `POST` | `/api/admin/exercises/:id/review` | Approve or reject a pending exercise. Body: `{ action, note }`. |

---

## Commands

```bash
npm run dev        # start dev server on :3002
npm run build      # production build
npm run seed       # seed exercises from excercises-blob/
npm run typecheck  # tsc --noEmit
make migrate       # apply DB migrations
make migrate-down  # roll back one migration
```

---

## Payments

FitVault uses [OpenPay SDK](../openpay-sdk/) for provider-neutral payment integration.

- **Dev / test:** `MockProvider` is active when `STRIPE_SECRET_KEY` is unset. All checkouts succeed immediately; no real money moves.
- **Production:** Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to activate `StripeProvider`.

OpenPay SDK packages are resolved via webpack aliases in `next.config.ts` — they are compiled directly from TypeScript source. Do not `npm install` them separately.
