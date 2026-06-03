# Dependency stage
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Build stage
FROM dependencies AS build

ARG VITE_API_BASE_URL=http://localhost/api/core/v1
ARG VITE_API_AGENT_BASE_URL=http://localhost/api/chat/v1
ARG VITE_WS_URL=ws://localhost/api/core/v1/ws
ARG VITE_GOOGLE_CLIENT_ID=

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
	VITE_API_AGENT_BASE_URL=${VITE_API_AGENT_BASE_URL} \
	VITE_WS_URL=${VITE_WS_URL} \
	VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

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
