# ============================================
# STAGE 1 : Build Angular
# ============================================
FROM node:24-alpine AS build

WORKDIR /app

# 1. Copier les fichiers de dépendances d'abord (cache)
COPY package.json package-lock.json .npmrc ./

# 2. Installer les dépendances (layer cachée)
RUN npm ci --no-audit

# 3. Copier le code source
COPY . .

# 4. Build production (UNE SEULE image pour tous les envs)
RUN npm run build -- --configuration=production

# ============================================
# STAGE 2 : Servir avec NGINX
# ============================================
FROM nginx:alpine

# Copier la config NGINX personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage précédent
COPY --from=build /app/dist/deleevx/browser /usr/share/nginx/html

# Copier le script d'injection de config
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Variables d'environnement non sensibles (valeurs par défaut)
ENV API_URL=http://localhost:8080
ENV APP_ENV=production
# Les clés sensibles (GOOGLE_MAPS_API_KEY, GOOGLE_AUTH_CLIENT_ID, FIREBASE_*)
# sont injectées au runtime via docker run -e ou docker-compose environment:

# Port exposé
EXPOSE 80

# Le script génère config.json puis lance NGINX
ENTRYPOINT ["/docker-entrypoint.sh"]