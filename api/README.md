# API: Gestão de Gado de Corte

Backend da entrega 2 da Prática Extensionista IV. API REST em **Spring Boot 3.5 + MySQL**, com login JWT,
seguindo a arquitetura MVC dos diagramas da entrega 1 (`controller`, `service`, `repository`, `entity`, `dto`, `security`).

## Como rodar

Requisitos: **Java 17 ou mais novo**. Não precisa instalar o Maven, o projeto traz o `mvnw`.

### Opção 1: com MySQL (padrão)

**1. Criar o banco.** Abra o MySQL Workbench, conecte como `root`, abra
[`database/gado_corte.sql`](database/gado_corte.sql) (*File > Open SQL Script*) e execute tudo (ícone do raio).
O script cria o banco `gado_corte`, as 5 tabelas, o usuário `gado_app` (senha `gado123`) só com acesso a esse
banco, os usuários de login e um rebanho de exemplo. Pode rodar de novo sem duplicar nada.

Pelo terminal também funciona: `mysql -u root -p < database/gado_corte.sql`

**2. Conectar a API.** A API já vem configurada para esse banco em `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/gado_corte?...
    username: gado_app
    password: gado123
```

Se o seu MySQL estiver em outra porta ou você quiser usar outro usuário, não precisa mexer no arquivo: defina as
variáveis `DB_URL`, `DB_USER` e `DB_PASSWORD` (no IntelliJ: *Run > Edit Configurations > Environment variables*,
por exemplo `DB_USER=root;DB_PASSWORD=suasenha`).

**3. Rodar.** Rode `GadoCorteApplication` no IntelliJ, ou pelo terminal:

```bash
# Windows
mvnw.cmd spring-boot:run
# Linux/macOS
./mvnw spring-boot:run
```

Quando aparecer `Started GadoCorteApplication`, abra http://localhost:8080/actuator/health. Se mostrar
`{"status":"UP"}`, a API está conectada ao banco.

Se der erro `Access denied for user 'gado_app'`, o script não foi executado ou a senha é outra.
Se der `Communications link failure`, o MySQL não está rodando ou está em outra porta.

### Opção 2: sem MySQL (banco H2 em memória)

```bash
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2
```

Os dados somem quando a API para. Bom para testar rápido.

### Opção 3: com Docker (API + MySQL + app)

Na raiz do repositório: `docker compose up -d --build`. O MySQL já sobe com este script aplicado e a API fica em
http://localhost:8080. Só o banco, para usar com a API rodando no IntelliJ: `docker compose up -d db`.
Detalhes em [`../doc/documentacao.html`](../doc/documentacao.html).

### No IntelliJ

Abra a pasta `api` como projeto, espere o Maven baixar as dependências e rode `GadoCorteApplication`.
Para o perfil H2, coloque `h2` em *Active profiles* na configuração de execução.

## Acesso

| O quê | Endereço |
|---|---|
| API | http://localhost:8080/api |
| Swagger (documentação e testes) | http://localhost:8080/swagger-ui.html |
| Health check | http://localhost:8080/actuator/health |

Usuários de login (criados pelo script SQL ou, se faltarem, pela própria API na primeira execução):

| Usuário | Senha | Perfil | Pode |
|---|---|---|---|
| `gerente` | `gerente123` | GERENTE | tudo |
| `funcionario` | `func123` | FUNCIONARIO | consultar, lançar pesagens e aplicações |

Se o banco estiver vazio, a API também cria o rebanho de exemplo com 4 animais (desligue com `SEED_DADOS_EXEMPLO=false`).

O arquivo [`requests.http`](requests.http) tem as principais chamadas prontas para rodar no IntelliJ.

## Endpoints

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | público | Login; devolve o token JWT |
| GET | `/api/auth/me` | logado | Usuário atual |
| GET | `/api/dashboard/resumo` | logado | Indicadores da tela inicial |
| GET | `/api/animais?status=&busca=` | logado | Lista e busca por brinco, nome ou lote |
| GET | `/api/animais/{id}` | logado | Detalhe com peso atual, GMD e carência |
| POST | `/api/animais` | gerente | Cadastra animal |
| PUT | `/api/animais/{id}` | gerente | Atualiza animal |
| DELETE | `/api/animais/{id}` | gerente | Exclui cadastro feito por engano |
| POST | `/api/animais/{id}/morte` | gerente | Registra morte |
| POST | `/api/animais/{id}/venda` | gerente | Vende (bloqueado em carência) |
| GET | `/api/animais/{id}/pesagens` | logado | Histórico de pesagens |
| GET | `/api/animais/{id}/aplicacoes` | logado | Histórico sanitário |
| GET / POST | `/api/pesagens` | logado | Últimas pesagens / nova pesagem |
| DELETE | `/api/pesagens/{id}` | gerente | Exclui pesagem |
| GET / POST | `/api/sanidade/aplicacoes` | logado | Últimas aplicações / nova aplicação |
| DELETE | `/api/sanidade/aplicacoes/{id}` | gerente | Exclui aplicação |
| GET | `/api/sanidade/carencias` | logado | Animais em carência hoje |
| GET | `/api/vendas` | logado | Histórico de vendas |

Todas as rotas, menos o login, pedem o cabeçalho `Authorization: Bearer <token>`.

## Regras de negócio

- **Carência sanitária:** cada aplicação guarda os dias de carência do produto. O dia da aplicação conta como o primeiro
  (30 dias a partir de 01/03 bloqueiam até 30/03). Animal em carência **não pode ser vendido**; a API responde 422
  com a data em que a venda fica liberada.
- **GMD (ganho médio diário):** (peso mais recente − peso inicial) ÷ dias entre as medições. O peso de entrada conta
  como a primeira medição.
- **Brinco único:** cadastro repetido responde 409.
- Pesagem, aplicação e venda só em animal **ativo** e nunca antes da data de entrada na fazenda.
- **Sincronização offline:** pesagens e aplicações aceitam um `idCliente` (UUID gerado pelo app). Se a fila do
  IndexedDB reenviar o mesmo lançamento, a API devolve o registro já gravado em vez de duplicar.
- Valor por arroba na venda calculado com 1 arroba = 15 kg de peso vivo.

## Erros

Todos os erros têm o mesmo formato, para o front mostrar a mensagem:

```json
{ "status": 422, "erro": "Unprocessable Entity",
  "mensagem": "O animal BR-003 está em carência até 17/12/2026 ...", "campos": {}, "timestamp": "..." }
```

Em erro de validação (400), `campos` traz a mensagem de cada campo inválido.

## Testes

```bash
mvnw.cmd verify
```

Roda os testes unitários (JUnit 5 + Mockito) e de integração (MockMvc + H2, com JWT de verdade) e gera a
cobertura do JaCoCo em `target/site/jacoco/index.html`, que a CI envia ao SonarCloud.

## Configuração (variáveis de ambiente)

| Variável | Padrão | Uso |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/gado_corte?...` | Conexão com o MySQL |
| `DB_USER` / `DB_PASSWORD` | `gado_app` / `gado123` | Credenciais do banco |
| `DDL_AUTO` | `update` | `validate` só confere se as tabelas batem com as entidades |
| `JWT_SECRET` | valor de desenvolvimento | Chave do JWT (mín. 32 caracteres). **Troque em produção** |
| `JWT_EXPIRACAO_HORAS` | `12` | Validade do token |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Origens do front liberadas |
| `SEED_DADOS_EXEMPLO` | `true` | Cria o rebanho de exemplo |
| `PORT` | `8080` | Porta da API |
