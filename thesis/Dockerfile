
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q dependency:resolve

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd -r app && useradd -r -g app app
COPY --from=build /app/target/thesis-*.jar app.jar
RUN mkdir -p /app/uploads && chown -R app:app /app
USER app
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
