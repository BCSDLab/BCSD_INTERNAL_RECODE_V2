FROM node:24-alpine AS builder
WORKDIR /app
ENV HUSKY=0
RUN npm install -g pnpm@10.33.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_HOMEPAGE_URL=https://bcsdlab.com
ENV VITE_HOMEPAGE_URL=$VITE_HOMEPAGE_URL
RUN pnpm build

FROM nginx:stable-alpine AS runner
ENV API_ORIGIN=http://bcsd-internal-api:8081
ENV NGINX_ENVSUBST_FILTER=API_ORIGIN
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1
