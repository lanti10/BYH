# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# BYH — Dockerfile per deploy self-host (Coolify, ecc.)
# Next.js 16 (standalone) + Prisma 7 (driver adapter pg → nessun binario nativo)
#
# ⚠️ Le variabili NEXT_PUBLIC_* servono AL MOMENTO DEL BUILD (finiscono nel bundle
#    del browser). In Coolify vanno impostate come "Build Variables" (build-time),
#    non solo come runtime. Le altre (DATABASE_URL, CLERK_SECRET_KEY, ecc.) servono
#    a runtime. Vedi DEPLOY.md.
# ─────────────────────────────────────────────────────────────────────────────

# ── 1. Dipendenze ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# Il postinstall esegue `prisma generate`, quindi servono schema e config
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ── 2. Build ─────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variabili pubbliche: DEVONO essere presenti qui (vengono "cotte" nel bundle client)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL \
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL \
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL \
    NEXT_TELEMETRY_DISABLED=1

# `npm run build` = prisma generate && next build (output: standalone)
RUN npm run build

# ── 3. Runtime ───────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Utente non-root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# File statici e server standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Sicurezza: assicura che il client Prisma generato sia presente nel bundle standalone
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000

# server.js è l'entrypoint generato dallo standalone di Next
CMD ["node", "server.js"]
