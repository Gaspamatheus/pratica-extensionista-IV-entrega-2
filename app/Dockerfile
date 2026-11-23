# Imagem do front (React + Vite + PWA). Build em dois estágios:
# 1) gera o build de produção com Node;  2) serve os arquivos estáticos com o Nginx,
#    que também repassa /api para o contêiner da API (mesma origem, sem CORS).

# ---------- estágio 1: build ----------
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Sem VITE_API_URL o app chama /api na mesma origem, que o Nginx repassa para a API
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- estágio 2: Nginx ----------
FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
