# SmartInvoice Pro — Backend API image.
# Build context must be the repository root (the backend shares the Prisma
# schema that lives in ../database).
FROM node:20-alpine AS base
WORKDIR /app

# Prisma needs OpenSSL on Alpine.
RUN apk add --no-cache openssl

# ----- Install dependencies (cached layer) -----
FROM base AS deps
COPY backend/package.json backend/package-lock.json ./backend/
COPY database/package.json database/package-lock.json ./database/
RUN cd backend && npm ci
RUN cd database && npm ci

# ----- Build / generate Prisma client -----
FROM base AS build
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/database/node_modules ./database/node_modules
COPY database ./database
COPY backend ./backend
# Generate the Prisma client into both packages' node_modules.
RUN cd database && npx prisma generate

# ----- Runtime -----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/backend ./backend
COPY --from=build /app/database ./database
RUN chmod +x backend/docker-entrypoint.sh
WORKDIR /app/backend
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
