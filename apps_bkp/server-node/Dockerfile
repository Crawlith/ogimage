FROM node:20-alpine AS base

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM base AS runner
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "apps/server-node/dist/index.js"]
