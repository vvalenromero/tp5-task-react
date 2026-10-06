# Imagen de la API: JavaScript ESM plano, sin paso de build: el código corre tal cual.
FROM node:24-alpine

WORKDIR /app

# Primero las dependencias: esta capa queda en cache hasta que cambien los manifests.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY db ./db

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# server.js aplica las migraciones pendientes antes de escuchar.
CMD ["node", "src/server.js"]
