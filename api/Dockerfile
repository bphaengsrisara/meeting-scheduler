# Build from the repository root: docker build -f api/Dockerfile .
FROM node:26-slim AS build
WORKDIR /app
# The pnpm version named by "packageManager" in package.json.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install --global "$(node -p 'require("./package.json").packageManager')"
COPY web/package.json web/
COPY api api
# A folder with the API and its production dependencies only.
RUN pnpm install --frozen-lockfile --filter api \
  && pnpm --filter api deploy --prod /prod/api

FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /prod/api ./
USER node
# Node runs the TypeScript directly; the migrations run before the server.
CMD ["sh", "-c", "node src/db/migrate.ts && exec node src/index.ts"]
