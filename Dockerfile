# dist는 CPU 종류와 무관한 정적 파일이다. 빌드는 러너 아키텍처에서 네이티브로 돌리고
# 최종 nginx 단계만 대상 플랫폼(arm64)으로 만든다 — QEMU 에뮬레이션 빌드는 수십 배 느리다.
FROM --platform=$BUILDPLATFORM node:24-alpine AS builder
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
