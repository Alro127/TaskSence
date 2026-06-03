# Dependency stage
FROM eclipse-temurin:21-jdk-jammy AS dependencies

WORKDIR /build

COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY pom.xml .

RUN chmod +x ./mvnw && \
    ./mvnw dependency:go-offline -B

# Build stage
FROM dependencies AS build

COPY src src

RUN ./mvnw clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-jammy AS runtime

WORKDIR /app

COPY --from=build /build/target/tasksense-*.jar app.jar

RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
