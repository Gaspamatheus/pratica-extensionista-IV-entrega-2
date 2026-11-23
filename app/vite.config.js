import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Cor do topo do app; usada também na barra do sistema quando instalado.
const COR_TEMA = '#234f2b'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Em desenvolvimento o Vite repassa /api para a API Spring Boot (proxy).
  // Assim o front e a API ficam na mesma origem e o celular na mesma rede
  // consegue abrir o app pelo IP do computador sem esbarrar em CORS.
  const alvo = env.VITE_API_PROXY || 'http://localhost:8080'
  const proxy = { '/api': { target: alvo, changeOrigin: true } }
  // Endereços externos aceitos além de localhost/IP: túnel HTTPS para testar o PWA no celular
  const allowedHosts = ['.trycloudflare.com']

  return {
    plugins: [
      react(),
      VitePWA({
        // A versão nova só entra quando o usuário toca em "Atualizar" (components/AtualizacaoApp.jsx)
        registerType: 'prompt',
        includeAssets: ['icone.svg', 'apple-touch-icon-180x180.png'],
        manifest: {
          name: 'Gado de Corte: gestão do rebanho',
          short_name: 'Gado de Corte',
          description: 'Controle do rebanho de corte: animais, pesagens e sanidade, também sem internet.',
          lang: 'pt-BR',
          start_url: '/animais',
          scope: '/',
          display: 'standalone',
          background_color: '#f5f3ee',
          theme_color: COR_TEMA,
          categories: ['business', 'productivity'],
          icons: [
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ],
          // atalhos ao segurar o ícone do app (Android)
          shortcuts: [
            { name: 'Registrar pesagem', url: '/pesagens/nova', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
            { name: 'Registrar vacina', url: '/vacinas/nova', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] }
          ]
        },
        workbox: {
          // telas do app (HTML, JS, CSS, ícones) ficam no aparelho: o app abre sem internet
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/swagger/, /^\/v3\/api-docs/, /^\/actuator/],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Consultas à API: busca na rede e guarda a última resposta. Sem internet
              // (ou se a rede demorar mais de 5 s), mostra os últimos dados salvos.
              urlPattern: ({ url, request }) =>
                request.method === 'GET' && url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-dados', // o logout apaga este cache (src/api/auth.js)
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [200] }
              }
            }
          ]
        },
        // o service worker só roda no build (npm run build + npm run preview), não no npm run dev
        devOptions: { enabled: false }
      })
    ],
    server: { port: 5173, host: true, proxy, allowedHosts },
    preview: { port: 4173, host: true, proxy, allowedHosts },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
      css: false,
      // npm run test:coverage gera coverage/lcov.info, que a CI envia ao SonarCloud
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'lcov'],
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/**/*.test.{js,jsx}', 'src/test/**', 'src/main.jsx']
      }
    }
  }
})
