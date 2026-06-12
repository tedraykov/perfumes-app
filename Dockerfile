# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv
# (The builder-stage ENV values below are throwaway build-time placeholders, not
# real secrets — the stage is discarded — so the secrets-in-ENV check is skipped.)

# ---- Builder: compiles the SvelteKit app + worker bundle to ./build ----
# Alpine is fine here: only the pure-JS `build/` output is copied forward, so
# the builder's libc never reaches the runtime image.
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# SvelteKit's postbuild analyse step imports server modules, which read config
# via $env/dynamic/private at load time. These placeholders only satisfy the
# build — real values are injected at runtime by docker-compose, and this
# builder stage is discarded (only ./build is copied into the final image).
ENV DATABASE_URL="libsql://placeholder.invalid" \
    DATABASE_AUTH_TOKEN="placeholder" \
    ANTHROPIC_API_KEY="sk-placeholder" \
    REDIS_URL="redis://localhost:6379"
RUN pnpm build

# ---- Runner: Playwright image ships Chromium + all system libs + Node 22 ----
# Tag MUST match the installed `playwright` version so the preinstalled browsers
# under /ms-playwright are the ones playwright-extra expects at runtime.
FROM mcr.microsoft.com/playwright:v1.60.0-noble AS runner
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /app
ENV NODE_ENV=production

# Install prod-only deps. pnpm's onlyBuiltDependencies allowlist blocks
# playwright's postinstall, so no browser re-download happens — the image's
# preinstalled browsers are used instead.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Pure-JS build output: build/index.js (app server) and build/worker.js (worker).
COPY --from=builder /app/build ./build

# Logger writes to ./logs and Chromium needs a writable home; run unprivileged
# as the image's built-in pwuser so Chromium's sandbox works without --no-sandbox.
RUN mkdir -p /app/logs && chown -R pwuser:pwuser /app
USER pwuser

EXPOSE 3000
CMD ["node", "build/index.js"]
