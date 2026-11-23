# Gestão de Gado de Corte: aplicativo web e PWA para o controle do rebanho

**Autor:** Matheus Augusto

**Disciplina:** Prática Extensionista IV · Entrega 2

## Resumo

**Introdução:** em pequenas e médias propriedades de gado de corte, o controle do rebanho ainda é feito, em grande
parte, em cadernos e planilhas. Pesagens e vacinas são anotadas no curral, longe do escritório e muitas vezes sem
sinal de internet, e informações como o ganho de peso de cada animal ou o fim da carência de um medicamento acabam
se perdendo ou sendo calculadas à mão.

**Objetivo:** desenvolver um sistema de gestão de gado de corte, com API, aplicação web responsiva e versão mobile
instalável (PWA), que registre animais, pesagens e aplicações sanitárias, calcule automaticamente o ganho médio
diário (GMD) e a carência, impeça a venda de animais em carência e funcione também sem internet no campo.

**Metodologia:** a solução segue a arquitetura definida na entrega 1. O backend é uma API REST em Spring Boot 3.5
(Java 17) no padrão MVC, com MySQL 8.4, autenticação JWT e senhas em BCrypt, perfis de gerente e funcionário e
documentação Swagger. O front foi feito em React 18 com Vite, com layout *mobile first* que se adapta a celular,
tablet e computador. A versão PWA usa *service worker* (Workbox) para abrir o app sem conexão e uma fila no IndexedDB
que guarda pesagens e vacinas lançadas offline e as reenvia quando a rede volta, sem duplicar registros. A
infraestrutura é descrita em Docker Compose (MySQL, API e Nginx), com integração contínua no GitHub Actions (testes
JUnit e Vitest, teste dos contêineres e análise no SonarCloud) e entrega contínua de imagens Docker no GitHub
Container Registry.

**Resultados:** o sistema permite cadastrar o rebanho, registrar pesagens e aplicações pelo celular, mesmo sem
sinal, e consultar indicadores como animais ativos, peso médio, GMD e animais em carência. A API bloqueia a venda de
animais em carência e informa a data de liberação. Todo o ambiente sobe com um único comando
(`docker compose up`), e cada alteração no código é testada automaticamente antes de ser integrada.

**Conclusão:** o aplicativo leva o registro das informações para o local onde o trabalho acontece, reduz erros de
anotação e cálculo e apoia decisões de venda e manejo sanitário. A arquitetura em contêineres e o pipeline de CI/CD
facilitam a manutenção, a evolução e a publicação da solução.

**Palavras-chave:** pecuária de corte; gestão de rebanho; PWA; Spring Boot; React; Docker.

---

## Estrutura do repositório

| Pasta / arquivo | Conteúdo |
|---|---|
| [`api/`](api) | API REST em Spring Boot + MySQL ([README](api/README.md)) e script do banco em `api/database/gado_corte.sql` |
| [`app/`](app) | App React + Vite, responsivo e PWA com fila offline ([README](app/README.md)) |
| [`doc/`](doc) | Documentação da configuração da infraestrutura (contêineres, rede, segurança, CI/CD), em [HTML](doc/documentacao.html) e [PDF](doc/documentacao.pdf) |
| [`docker-compose.yml`](docker-compose.yml) | Sobe MySQL, API e app (Nginx), mais um túnel HTTPS opcional |
| [`.env.example`](.env.example) | Senhas, chave JWT e portas usadas pelo Compose |
| [`.github/workflows/`](.github/workflows) | CI (`ci.yml`) e CD (`cd.yml`) no GitHub Actions |
| [`sonar-project.properties`](sonar-project.properties) | Configuração da análise no SonarCloud |

## Como executar

Com o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado:

```bash
cp .env.example .env            # no Windows: copy .env.example .env
docker compose up -d --build
```

Em cerca de um minuto, abra **http://localhost** e entre com `gerente` / `gerente123` (tudo) ou
`funcionario` / `func123` (consulta e lançamentos).

| Endereço | O quê |
|---|---|
| http://localhost | App (web e PWA) |
| http://localhost/swagger-ui.html | Documentação interativa da API |
| http://localhost:8080/actuator/health | Saúde da API |

Para instalar o app no celular, que exige HTTPS, suba também o túnel:
`docker compose --profile tunel up -d` e veja o endereço `https://...trycloudflare.com` em `docker compose logs tunel`.

Para rodar sem Docker (IntelliJ e `npm run dev`), siga os READMEs de [`api/`](api/README.md) e [`app/`](app/README.md).
Os detalhes da infraestrutura estão em [`doc/documentacao.html`](doc/documentacao.html), também em
[PDF](doc/documentacao.pdf). Depois de editar o HTML, o PDF pode ser gerado de novo pelo Chrome:
abra o arquivo, *Ctrl+P* e *Salvar como PDF*.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Front e PWA | React 18, Vite 5, React Router 6, vite-plugin-pwa (Workbox), IndexedDB (idb), Vitest |
| API | Java 17, Spring Boot 3.5, Spring Security + JWT, Spring Data JPA, springdoc (Swagger), JUnit 5, Mockito |
| Banco | MySQL 8.4 (H2 nos testes) |
| Infraestrutura | Docker, Docker Compose, Nginx, Cloudflare Tunnel |
| DevOps | GitHub Actions, SonarCloud, GitHub Container Registry |
