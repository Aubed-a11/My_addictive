FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
# Images deja recuperees (pochettes d'album, etc.) : servent de contenu
# initial pour le volume Docker "uploads_media" (voir docker-compose.yml).
# Tout fichier ajoute plus tard directement sur le volume est conserve
# entre les redeploiements.
COPY uploads ./uploads
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
