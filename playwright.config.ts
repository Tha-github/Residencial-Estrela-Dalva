import { defineConfig, devices } from '@playwright/test';

const PORT = 4329;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  // Em dev, AVIF/WebP são gerados sob demanda: muitos workers simultâneos
  // sobrecarregam o servidor e causam timeouts que não são defeitos do site.
  workers: 4,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
  },
  // Servidor de desenvolvimento: permite testar o guia de estilo (/dev/estilo),
  // que não existe no build. Testes do build de produção entram no Prompt 9.
  webServer: {
    command: `npx astro dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
