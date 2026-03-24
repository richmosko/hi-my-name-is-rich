# Stage 1: Build the static site
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_REMARK42_HOST
ARG VITE_VIKUNJA_HOST
ARG VITE_VIKUNJA_TOKEN
ENV VITE_REMARK42_HOST=$VITE_REMARK42_HOST
ENV VITE_VIKUNJA_HOST=$VITE_VIKUNJA_HOST
ENV VITE_VIKUNJA_TOKEN=$VITE_VIKUNJA_TOKEN
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
