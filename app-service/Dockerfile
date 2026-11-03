FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
# La memoire est plafonnee par JAVA_TOOL_OPTIONS (docker-compose.override.yml).
ENTRYPOINT ["java", "-jar", "app.jar"]
