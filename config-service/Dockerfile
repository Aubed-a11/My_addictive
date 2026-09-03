# IMPORTANT : ce Dockerfile est construit avec la RACINE du projet comme
# contexte de build (voir docker-compose.yml : build.context=. et
# build.dockerfile=config-service/Dockerfile), pas config-service/ seul,
# car il a besoin d'embarquer le dossier config-repo/ (sibling, pas enfant).
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY config-service/target/*.jar app.jar
# config-service lit sa configuration native depuis ce dossier (voir
# application.yml : native.search-locations=file:./config-repo).
COPY config-repo ./config-repo
EXPOSE 8888
ENTRYPOINT ["java", "-jar", "app.jar"]
