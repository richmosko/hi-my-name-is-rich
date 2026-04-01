# Stage 1: Build the Astro site
# Note: Coolify injects ARG declarations after FROM with values from
# the environment variables UI. We re-declare them here to ensure
# they're set as ENV (which RUN commands can read).
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

# Convert ARGs to ENVs so npm run build (Vite) can read them
ARG VITE_REMARK42_HOST
ARG VITE_VIKUNJA_HOST
ARG VITE_VIKUNJA_TOKEN
ARG PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
ENV VITE_REMARK42_HOST=${VITE_REMARK42_HOST}
ENV VITE_VIKUNJA_HOST=${VITE_VIKUNJA_HOST}
ENV VITE_VIKUNJA_TOKEN=${VITE_VIKUNJA_TOKEN}
ENV PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=${PUBLIC_KEYSTATIC_GITHUB_APP_SLUG}

RUN echo "Build env: VITE_REMARK42_HOST=$VITE_REMARK42_HOST" && npm run build

# Stage 2: Run with Node.js (Astro standalone server)
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
