# Imagem da API (Spring Boot). Build em dois estágios:
# 1) compila com Maven + JDK 17;  2) roda só com o JRE 17 (imagem menor, sem código-fonte).

# ---------- estágio 1: build ----------
FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /build
# Baixa as dependências antes de copiar o código: se só o código mudar, o Docker reaproveita esta camada
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
# Os testes rodam na CI (GitHub Actions); aqui só empacota
RUN mvn -B -q package -DskipTests && cp target/gado-corte-api-*.jar app.jar

# ---------- estágio 2: execução ----------
FROM eclipse-temurin:17-jre
WORKDIR /app
# Não roda como root
RUN groupadd --system gado && useradd --system --gid gado gado
COPY --from=build /build/app.jar app.jar
USER gado
EXPOSE 8080
# Usa até 75% da memória do contêiner para o heap
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Duser.timezone=America/Sao_Paulo"
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fs http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
