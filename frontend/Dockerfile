# syntax=docker/dockerfile:1

# ---------- Stage 1 : build ----------
FROM node:24-alpine AS builder

WORKDIR /workspace

# Les manifestes d'abord : cette couche ne change que si les dependances changent.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Puis les sources.
COPY . .
RUN npx ng build --configuration production

# ---------- Stage 2 : runtime ----------
# Variante non-root de nginx (utilisateur nginx, ecoute sur 8080).
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080
