ARG ORIGIN="http://localhost:3000"
ARG SENTRY_AUTH_TOKEN
ARG REDIS_URL
ARG REDIS_TOKEN

FROM node:20-slim AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


FROM base AS build

ARG SENTRY_AUTH_TOKEN
ARG REDIS_URL
ARG REDIS_TOKEN

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

ENV ORIGIN=${ORIGIN}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV REDIS_URL=${REDIS_URL}
ENV REDIS_TOKEN=${REDIS_TOKEN}

RUN pnpm run build


FROM base AS prod-dependencies
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod


FROM node:20-slim AS final

WORKDIR /app
COPY --from=build /app/build /app
COPY --from=prod-dependencies /app/node_modules /app/node_modules
COPY package.json .

EXPOSE 3000
ENTRYPOINT ["node", "index.js"]
