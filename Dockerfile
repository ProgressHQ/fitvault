# Build stages use node:22-slim (Debian/glibc) so native binaries like esbuild work.
# The final runner uses Alpine for a smaller image.

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# OpenPay SDK source is resolved at build time via webpack aliases
COPY --from=openpay-sdk . /openpay-sdk
COPY . .
RUN npm run build
# Bundle seed.ts into a standalone CJS file using ncc (pure-JS, no native binary).
# esbuild is avoided here because Next.js ships an arch-specific esbuild binary
# that may not match the current build platform.
RUN npx --yes @vercel/ncc build scripts/seed.ts -o /tmp/seed-out \
    && mv /tmp/seed-out/index.js scripts/seed.js

# Pull golang-migrate binary from the official image (avoids github.com at build time)
FROM migrate/migrate:v4.18.1 AS migrate-dl

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
COPY --from=migrate-dl /usr/local/bin/migrate /usr/local/bin/migrate
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs db/migrations ./db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts/seed.js ./scripts/seed.js
# ncc rewrites readFileSync(join(__dirname, "../trainely_exercises.json")) to
# join(__dirname, "trainely_exercises.json"), so the external catalogue must
# live next to seed.js. The named context is the ProgressHQ/excercises-blob
# checkout; keeping it external avoids duplicating the 1.5 MB dataset here.
COPY --from=exercise-data --chown=nextjs:nodejs trainely_exercises.json ./scripts/trainely_exercises.json
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
USER nextjs
EXPOSE 3002
ENV HOSTNAME="0.0.0.0"
ENV PORT=3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget --spider --quiet http://127.0.0.1:3002/ || exit 1
CMD ["./docker-entrypoint.sh"]
