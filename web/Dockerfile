# Build from the repository root: docker build -f web/Dockerfile .
FROM node:26-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# The pnpm version named by "packageManager" in package.json.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install --global "$(node -p 'require("./package.json").packageManager')"
COPY api/package.json api/
COPY web web
RUN pnpm install --frozen-lockfile --filter web \
  && pnpm --filter web build

FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0
# The standalone server, plus the static files it does not copy itself.
COPY --from=build --chown=node:node /app/web/.next/standalone ./
COPY --from=build --chown=node:node /app/web/.next/static ./web/.next/static
USER node
CMD ["node", "web/server.js"]
