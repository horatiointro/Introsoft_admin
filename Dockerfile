# Build the frontend and bundled server in Linux so platform-specific packages
# (for example esbuild and Rollup) are installed for the image's architecture.
FROM node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c AS runtime
ENV NODE_ENV=development \
    ALTIL_ENVIRONMENT=development-test \
    PORT=3005
WORKDIR /app
RUN groupadd --system --gid 10001 altil \
    && useradd --system --uid 10001 --gid altil --home-dir /app --shell /usr/sbin/nologin altil \
    && mkdir -p /app/.altil-data \
    && chown -R altil:altil /app
COPY --from=production-dependencies --chown=altil:altil /app/node_modules ./node_modules
COPY --from=build --chown=altil:altil /app/dist ./dist
COPY --chown=altil:altil package.json ./package.json
COPY --chown=altil:altil migrations ./migrations
COPY --chown=altil:altil scripts/migrate.js ./scripts/migrate.js
COPY --chown=altil:altil scripts/provisionTestSuperAdmins.mjs ./scripts/provisionTestSuperAdmins.mjs
COPY --chown=altil:altil src/config/environmentContract.mjs ./src/config/environmentContract.mjs
COPY --chown=altil:altil src/security/testSuperAdminMfa.mjs ./src/security/testSuperAdminMfa.mjs
COPY --chown=altil:altil docs/legal ./docs/legal
USER altil
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3005/api/v1/health').then(async r => { const h = await r.json(); if (!r.ok || h.status !== 'HEALTHY' || h.databaseConnected !== true) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "dist/server.cjs"]
