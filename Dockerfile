# syntax=docker/dockerfile:1

# ---------- Stage 1 : build ----------
FROM gradle:9.8.1-jdk21 AS builder

ENV GRADLE_USER_HOME=/home/gradle/.gradle

WORKDIR /workspace

# Les fichiers de build d'abord : cette couche ne change que si les dependances changent.
COPY settings.gradle.kts build.gradle.kts ./

# Pre-telechargement des dependances pour profiter du cache Docker.
RUN --mount=type=cache,target=/home/gradle/.gradle \
    gradle --no-daemon dependencies --quiet || true

# Puis les sources.
COPY src ./src

RUN --mount=type=cache,target=/home/gradle/.gradle \
    gradle --no-daemon clean bootJar -x test

# Decoupage du jar Spring Boot en couches (jarmode tools, Boot 3.2+).
# Le dossier de destination doit etre vide : le jar reste dans build/libs.
RUN java -Djarmode=tools -jar build/libs/*.jar \
    extract --layers --launcher --destination /workspace/extracted

# ---------- Stage 2 : runtime ----------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Utilisateur non-root.
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copie couche par couche : les dependances (rarement modifiees) avant le code applicatif.
COPY --from=builder --chown=spring:spring /workspace/extracted/dependencies/ ./
COPY --from=builder --chown=spring:spring /workspace/extracted/spring-boot-loader/ ./
COPY --from=builder --chown=spring:spring /workspace/extracted/snapshot-dependencies/ ./
COPY --from=builder --chown=spring:spring /workspace/extracted/application/ ./

USER spring:spring

EXPOSE 8080

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
