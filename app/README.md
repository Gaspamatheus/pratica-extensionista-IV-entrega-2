# App: Gestão de Gado de Corte (front web)

Front da entrega 2 da Prática Extensionista IV, em **React 18 + Vite 5**, seguindo a arquitetura da entrega 1.
É **mobile first**: o layout base foi feito para o celular e se adapta para tablet e computador. Consome a API
Spring Boot da pasta [`../api`](../api) com login JWT.

É também um **PWA**: instala na tela inicial do celular, abre sem internet e guarda pesagens e vacinas lançadas
no campo sem sinal, enviando tudo sozinho quando a conexão volta.

Autor: Matheus Augusto

## Telas

| Tela | Rota | O que faz |
|---|---|---|
| Login | `/login` | Entra com usuário e senha; o token JWT fica guardado no navegador até expirar |
| Animais | `/animais` | Indicadores do rebanho, busca por brinco/nome/lote e filtro por situação |
| Detalhe do animal | `/animais/:id` | Dados, peso atual, GMD, aviso de carência, histórico sanitário e pesagens |
| Novo / editar animal | `/animais/novo`, `/animais/:id/editar` | Cadastro (somente gerente) |
| Pesagens | `/pesagens` | Últimas pesagens do rebanho (e as que ainda estão só no aparelho) |
| Registrar pesagem | `/pesagens/nova` | Funciona sem internet; depois de salvar fica pronto para o próximo animal (uso no curral) |
| Vacinas | `/vacinas` | Animais em carência (com dias que faltam) e últimas aplicações |
| Registrar vacina | `/vacinas/nova` | Vacina, vermífugo ou medicamento; sugere tipo e carência dos produtos mais comuns. Funciona sem internet |
| Pendências | `/pendencias` | Lançamentos guardados no aparelho: enviar agora, tentar de novo ou descartar |

O perfil **funcionário** consulta e registra pesagens e vacinas; botões de cadastrar, editar e excluir só aparecem para o
**gerente** (a API também bloqueia).

## Responsividade

| Largura | Layout |
|---|---|
| até 599px (celular) | Menu fixo embaixo, animais em cartões, vacinas em abas, botões com área de toque de 44px |
| 600px a 899px (tablet) | Cartões em 2 colunas, formulários em 2 colunas |
| 900px ou mais (computador) | Menu lateral, animais em tabela, listas de vacinas lado a lado |

Também segue o tema escuro do sistema e respeita a área segura do iPhone (notch).

## Como rodar

Requisitos: **Node.js 18 ou mais novo** e a API rodando em `http://localhost:8080`
(veja o [README da API](../api/README.md); o perfil `h2` dispensa o MySQL).

```bash
cd app
npm install
npm run dev
```

Abra http://localhost:5173 e entre com `gerente` / `gerente123` ou `funcionario` / `func123`.

**Testar no celular:** com o celular no mesmo Wi-Fi, abra o endereço `Network` que o Vite mostra no terminal
(algo como `http://192.168.0.10:5173`). Se o Windows perguntar, libere o Node no firewall.

### Como o front fala com a API

Em desenvolvimento o Vite repassa tudo que começa com `/api` para `http://localhost:8080` (proxy em
`vite.config.js`). Assim front e API ficam na mesma origem, sem problema de CORS, inclusive no celular.
Para publicar o front separado da API, defina `VITE_API_URL` (veja `.env.example`) e libere a origem do front
na variável `CORS_ORIGINS` da API.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 5173) |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve o `dist/` na porta 4173, também com o proxy para a API (é aqui que o PWA funciona) |
| `npm test` | Testes com Vitest + Testing Library (inclui a fila offline, com IndexedDB simulado) |
| `npm run test:coverage` | Testes com relatório de cobertura em `coverage/` (usado pelo SonarCloud na CI) |

## Estrutura

```
src/
  api/          cliente HTTP com JWT (client.js) e chamadas por recurso
  context/      sessão do usuário (AuthContext) e avisos rápidos (AvisoContext)
  components/   layout, rota protegida, campos, instalar app, aviso de versão nova, useFila
  pages/        telas (Login, Animais, AnimalDetalhe, AnimalForm, Pesagens, PesagemForm,
                Vacinas, VacinaForm, Pendencias)
  offline/      db.js (IndexedDB) e fila.js (fila offline e sincronização)
  util/         formatação de datas, pesos e rótulos
  estilos.css   CSS mobile first (sem framework)
public/         ícones do PWA em PNG (desenhos originais em SVG na pasta icones-fonte/)
```

## PWA (versão mobile)

### Como funciona

| Parte | Onde | O que faz |
|---|---|---|
| Manifest | `vite.config.js` (gera `manifest.webmanifest`) | Nome, cores, ícones e atalhos "Registrar pesagem" e "Registrar vacina" ao segurar o ícone (Android) |
| Ícones | `public/` | 192 e 512 px, versão *maskable* para Android e `apple-touch-icon` para iPhone |
| Service worker | gerado pelo `vite-plugin-pwa` (Workbox) | Guarda as telas do app no aparelho (abre sem internet) e as últimas respostas da API |
| Fila offline | `src/offline/fila.js` + IndexedDB | Pesagens e vacinas lançadas sem conexão ficam no aparelho e são reenviadas depois |

**Estratégias do service worker**

- Telas do app (HTML, JS, CSS, ícones): *precache*. Ficam salvas na instalação e o app abre mesmo sem sinal.
- Consultas à API (`GET /api/...`): *Network First* com limite de 5 s. Com internet busca dados novos e guarda
  uma cópia; sem internet (ou com sinal muito fraco) mostra a última cópia. O login (`/api/auth`) nunca é guardado,
  e o botão Sair apaga essas cópias.
- Lançamentos (`POST`): não passam pelo cache, vão para a fila offline.

**Fila offline (IndexedDB)**

1. Ao salvar uma pesagem ou vacina, o app tenta enviar. Sem internet, ou com a API fora do ar, o lançamento fica
   guardado no IndexedDB e aparece como "aguardando envio" (faixa no topo, tela Pendências e no histórico do animal).
2. O reenvio é automático: quando a internet volta (evento `online`), quando o app volta para a tela e, enquanto
   houver pendências, a cada minuto (no campo o sinal oscila sem avisar). Também há o botão "Enviar agora".
3. Os itens são enviados na ordem em que foram lançados. Cada um leva um `idCliente` (UUID) gerado no aparelho;
   se o mesmo item chegar duas vezes, a API devolve o registro já gravado, sem duplicar.
4. Se a API recusar um item (por exemplo, o animal foi vendido nesse meio tempo), ele vai para "Não aceitos pelo
   servidor" com a mensagem da API, sem travar os outros. O usuário pode tentar de novo ou descartar.
5. A fila é feita no próprio app, e não com o *Background Sync* do service worker, porque o Safari do iPhone não
   suporta Background Sync. Assim funciona igual no Android e no iPhone.

**Versão nova:** quando sai uma versão nova do app, aparece a faixa "Há uma versão nova do app" com o botão
Atualizar. O app não recarrega sozinho para não perder um lançamento no meio.

### Testar no computador

O service worker só existe na versão de produção:

```bash
npm run build
npm run preview
```

Abra http://localhost:4173. No Chrome, *DevTools > Application* mostra o manifest, o service worker e o IndexedDB
(`gado-corte-offline`). Para simular o campo sem sinal, marque *Network > Offline*, lance uma pesagem e desmarque:
a faixa "aguardando envio" some quando a pesagem chega na API. O Chrome também mostra o ícone de instalar na
barra de endereço.

### Instalar no celular

O navegador só ativa o service worker e a instalação em **HTTPS** (ou em `localhost`). Pelo IP da rede local
(`http://192.168...`) o app abre, mas não instala nem funciona offline. Duas formas de testar:

**Android (Chrome), na mesma rede Wi-Fi**

1. No computador: `npm run build` e `npm run preview`, e anote o endereço `Network` (ex.: `http://192.168.0.10:4173`).
2. No celular, abra `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, cole esse endereço, ative e
   reinicie o Chrome.
3. Abra o endereço, faça login e toque em **Instalar** na faixa verde (ou menu ⋮ > *Instalar app*).

**Qualquer celular, inclusive iPhone (túnel HTTPS)**

1. Instale o `cloudflared` no Windows: `winget install --id Cloudflare.cloudflared`
2. Com a API e o `npm run preview` rodando: `cloudflared tunnel --url http://localhost:4173`
3. Ele mostra um endereço `https://...trycloudflare.com`. Abra no celular. A API vai junto, porque o preview
   repassa `/api` para a porta 8080.
4. Android: toque em **Instalar**. iPhone (Safari): **Compartilhar > Adicionar à Tela de Início**.

**Com Docker:** na raiz do repositório, `docker compose --profile tunel up -d` sobe o app no Nginx junto com a API, o MySQL e o túnel HTTPS, sem precisar do Node nem do cloudflared instalados. Veja o [README principal](../README.md) e a [documentação da infraestrutura](../doc/documentacao.html).

### Limites

- O primeiro login precisa de internet. Depois disso o app abre offline enquanto o token valer
  (`JWT_EXPIRACAO_HORAS` na API, 12 h por padrão).
- Cadastro, edição e exclusão de animais precisam de internet; só pesagens e vacinas entram na fila.
- A fila fica no navegador do aparelho: limpar os dados do site apaga o que ainda não foi enviado.
