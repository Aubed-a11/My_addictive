# Etape 1 : construction du bundle statique avec Vite
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# VITE_API_BASE_URL doit pointer vers l'adresse PUBLIQUE de la gateway
# (domaine/HTTPS en production, pas un nom de service Docker interne : le
# navigateur de l'utilisateur appelle cette adresse directement, il n'est
# jamais a l'interieur du reseau Docker). Fourni au moment du build via
# --build-arg (voir docker-compose.yml).
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Etape 2 : image finale, juste Nginx servant les fichiers statiques generes
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
