FROM node:26-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"


RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@11.5.3 --activate

WORKDIR /app

FROM base AS build

COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter web run build

FROM base AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=build /app/apps/web/.output/ ./.output
COPY --from=build /app/apps/web/drizzle/ ./drizzle

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
