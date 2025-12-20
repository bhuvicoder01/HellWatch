FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm i
RUN npm ci --include=optional
RUN npm rebuild lightningcss  # Pre-build Linux binaries

COPY . .
RUN npm run build

FROM node:20 AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
