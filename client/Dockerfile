# Dependency stage
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Build stage
FROM dependencies AS build

COPY . .

RUN npm run build

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist
COPY package.json ./

RUN chown -R node:node /app

USER node

EXPOSE 5173

# For production, use serve; for development, use Vite
CMD ["serve", "-s", "dist", "-l", "5173"]
