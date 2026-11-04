FROM maven:3.9-eclipse-temurin-21 AS build
LABEL maintainer="Leandro Pires Nunes"
WORKDIR /app
COPY . .
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/obracerta-backend-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 8080
# Ajustes para containers pequenos (ex.: 512 MB e fracao de CPU): heap proporcional ao
# limite do container, coletor serial (menos threads) e compilacao JIT so no nivel 1,
# que encurta a partida. Sobrescreva JAVA_TOOL_OPTIONS no ambiente se precisar.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
CMD ["java", "-jar", "/app/app.jar"]
