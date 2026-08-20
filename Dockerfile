FROM node:20-alpine AS deps
WORKDIR /app
# corepack은 node:20 번들 버전이 최신 pnpm 서명을 검증하지 못하는 경우가 있어 직접 설치한다.
RUN npm install -g pnpm@10.33.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10.33.0
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG API_ORIGIN
ENV API_ORIGIN=$API_ORIGIN
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
