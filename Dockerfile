# --- STAGE 1: Build ---
FROM node:22-alpine3.22 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm ci

# # Copy source
# COPY tsconfig*.json ./
# COPY src ./src

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# --- STAGE 2: Production ---
FROM node:22-alpine3.22 AS runner

WORKDIR /app

# Copy dependencies from stage builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Env

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080


CMD ["node", "dist/main.js"]