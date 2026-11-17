// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import { loadEnv } from 'vite';

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const env = loadEnv(mode, process.cwd(), '');

// unicode-range do subset "latin" (copiado do CSS oficial do Fontsource).
const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const deployEnv =env.PUBLIC_DEPLOY_ENV ?? 'development';
const siteUrl = env.PUBLIC_SITE_URL || undefined;

// Falha cedo: um build de produção sem domínio canônico geraria URLs erradas.
if (deployEnv === 'production' && !siteUrl) {
  throw new Error(
    '[config] PUBLIC_SITE_URL é obrigatório quando PUBLIC_DEPLOY_ENV=production. Veja .env.example.',
  );
}

/**
 * Páginas de desenvolvimento (guia de estilo e prévia com dados de exemplo).
 * Ficam fora de src/pages e só são registradas em `astro dev`: assim nem as
 * páginas nem os arquivos que elas importam (ex.: imagens de exemplo) entram no build.
 * @type {import('astro').AstroIntegration}
 */
const devOnlyRoutes = {
  name: 'dev-only-routes',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/dev/estilo', entrypoint: './src/dev-pages/estilo.astro' });
      injectRoute({ pattern: '/dev/previa/completa', entrypoint: './src/dev-pages/previa-completa.astro' });
    },
  },
};

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: siteUrl,
  integrations: [devOnlyRoutes],
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  // Fontes auto-hospedadas a partir de pacotes npm fixados (sem CDN em runtime
  // nem no build). Astro gera @font-face, preload e fallback métrico (menos CLS).
  // Provider `local` (e não `npm`): o `npm` com remote:false emite URLs file://
  // que o fetcher do Astro 7.4 não lê. Subset latin cobre todo o português.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Instrument Serif',
      cssVariable: '--font-display',
      fallbacks: ['Georgia', 'serif'],
      display: 'swap',
      options: {
        variants: [
          {
            src: ['@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            unicodeRange: [LATIN],
          },
          {
            src: ['@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2'],
            weight: 400,
            style: 'italic',
            unicodeRange: [LATIN],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Figtree',
      cssVariable: '--font-sans',
      fallbacks: ['system-ui', 'sans-serif'],
      display: 'swap',
      options: {
        variants: [
          {
            src: ['@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2'],
            weight: '400 600',
            style: 'normal',
            unicodeRange: [LATIN],
          },
        ],
      },
    },
  ],
  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        url: true,
      }),
      PUBLIC_DEPLOY_ENV: envField.enum({
        context: 'client',
        access: 'public',
        values: ['development', 'preview', 'production'],
        default: 'development',
      }),
    },
  },
});
