ARG VARIANT=17
FROM maven:3.8-openjdk-17-slim AS build
LABEL mantainer="Leandro Pires Nunes"
WORKDIR /app
COPY . .
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/obracerta-backend-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 8080
CMD ["java", "-jar", "/app/app.jar"]