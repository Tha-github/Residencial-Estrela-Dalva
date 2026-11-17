# Decisões arquiteturais

Registro curto das decisões tomadas e por quê. Atualize ao mudar qualquer uma.

## D1 — Astro estático no GitHub Pages

- **Decisão:** site público gerado como HTML estático (Astro 7, `output: 'static'`) e publicado no GitHub Pages via Actions. Para este repositório de projeto, `base` usa `/Residencial-Estrela-Dalva`.
- **Por quê:** entrega simples, publicação atrelada à branch `main` e arquivos de origem visíveis no repositório. O provedor executa somente build estático; não executa as Functions/API do painel.
- **Alternativa considerada:** Next.js na Vercel (stack usada em outro projeto). Descartada por ser mais pesada que o necessário para uma página.

## D2 — Conteúdo separado da apresentação

- **Decisão:** o conteúdo fica em `src/data/residencial.json` e é validado por Zod (`src/lib/content/schema.ts`). Os componentes só recebem os dados já validados de `getContent()`.
- **Por quê:**
  - mantém um único ponto para trocar a fonte de dados no Prompt 6 (painel), sem alterar componentes;
  - o esquema `strict` impede que os dados criem seções, HTML ou campos que não existem no layout.
- **Regra:** dado não confirmado = `null` ou `[]`, e a seção correspondente fica oculta. Nada de conteúdo fictício.

## D3 — Erros, estados vazios e carregamento

- **Conteúdo inválido:** o build falha (`ContentValidationError`) com o caminho de cada campo, para que nada quebrado seja publicado.
- **Conteúdo ausente:**
  - no site público, a seção não é renderizada;
  - em desenvolvimento, um aviso lista as pendências (`components/dev/PendingContent.astro`). Nem o HTML nem o CSS desse aviso são emitidos em preview ou produção, o que foi verificado no build.
- **Rotas inexistentes:** `404.astro` com `noindex`.
- **Carregamento:** o site público é estático e não tem estados de carregamento. Estados de carregamento, salvamento e sessão expirada pertencem ao painel (Prompt 6).

## D4 — Ambientes

- **`PUBLIC_DEPLOY_ENV`** (`development`, `preview` ou `production`): fora de `production`, todas as páginas saem com `noindex, nofollow`. Isso evita indexar deploys de preview.
- **`PUBLIC_SITE_URL`:** obrigatório em produção. Sem ele, o build falha.
- **Segredos:** nunca em `PUBLIC_*` nem no repositório. Os do painel ficam nas variáveis secretas do Cloudflare e, para desenvolvimento local, em `.dev.vars` (ignorado pelo Git).

## D5 — Tokens de design

- **Tokens:** ficam em `src/styles/tokens.css` (cor, tipografia, espaçamento, larguras, bordas, movimento e alvo de toque).
- **Breakpoints:** documentados no CSS e espelhados em `src/styles/breakpoints.ts`, porque CSS não aceita `var()` em `@media`.
- **Valores provisórios:** paleta e fontes serão definidas no Prompt 3 a partir das fotos reais. Os nomes dos tokens não mudam.

## D6 — Links externos

- **Validação:** `src/lib/url.ts` só aceita `https`, sem credenciais embutidas e com host dentro de uma lista por tipo (Booking, Airbnb, Decolar, Maps, Instagram).
- **Reaproveitamento:** a mesma função será usada na validação server-side do painel.

## D7 — Dependências

- **Versões:** todas fixadas (`--save-exact`). A instalação local confere com `package-lock.json` (`npm ls --depth=0`). `npm audit` não conseguiu acessar `registry.npmjs.org` nesta revisão; o estado de advisories permanece desconhecido e deve ser verificado em ambiente com acesso ao registry.
- **TypeScript 6.0.x, e não 7.x:** `typescript-eslint` e `@astrojs/check` ainda não suportam o TypeScript 7.
- **Adiadas até haver uso real:**
  - `@astrojs/sitemap`: Prompt 7;
  - ~~Playwright~~: antecipado para o Prompt 3, para a verificação visual (overflow, toque, menu, movimento reduzido);
  - `wrangler` / `jose`: painel, no Prompt 6.

## D9 — Fontes auto-hospedadas (Prompt 3)

- **Como:** API de fontes do Astro com provider `local`, apontando para os `.woff2` dos pacotes `@fontsource/instrument-serif` e `@fontsource-variable/figtree` (versões fixas).
- **Por que não o provider `npm`:** com `remote: false`, no Astro 7.4.12, ele gera URLs `file://` que o leitor de fontes do Astro não lê, e o build falha.
- **Ganhos:** sem requisição a terceiros, com fallback métrico (menos CLS) e preload seletivo.

## D10 — Script inline do Header

- **Situação:** o menu mobile usa um script pequeno que o Astro inclui inline em toda página com `Header`, mesmo sem itens de navegação.
- **Implementado no Prompt 8:** o postbuild calcula o hash SHA-256 do script inline e gera a diretiva `script-src` em `dist/_headers`.

## D11 — Página pública orientada por dados (Prompt 4)

- **Composição:** `components/HomePage.astro` monta a página. Cada seção só é renderizada se `getVisibility()` (`lib/content/derive.ts`) encontrar dados.
- **Itens derivados da visibilidade:**
  - a navegação só lista seções existentes;
  - a alternância de fundo é recalculada a cada combinação de seções;
  - o CTA de reserva (no hero, no header e na barra mobile) só aparece com pelo menos um link de plataforma.
- **Reservas:** apenas links externos individuais, com aviso explícito de que a reserva e o pagamento acontecem na plataforma. O site não tem formulário, calendário, preço nem disponibilidade (há teste E2E para isso).
- **Localização:** link para o Google Maps em vez de mapa embutido, que seria pesado e traria cookies de terceiros.
- **Trava de lançamento:** `assertReadyForLaunch()` bloqueia o build de produção com dados obrigatórios pendentes.
- **Prévia de desenvolvimento:** `/dev/previa/completa` usa `src/data/dev-fixture.ts`, com dados `[exemplo]` e imagens SVG geradas só em desenvolvimento. Esses dados passam pelo mesmo esquema do conteúdo real.
- **Imagens:** o `src` só aceita caminho local (`/...`). URLs externas, `data:` e `..` são rejeitados.

## D12 — Imagens, galeria e mobile (Prompt 5)

- **Pipeline de imagens:** `src/assets/fotos` passa pelo `astro:assets` (sharp), que gera AVIF, WebP e o formato original como fallback, com `srcset`/`sizes` e dimensões reais (sem CLS).
  - O hero é a imagem LCP: `loading="eager"`, `fetchpriority="high"` e nenhum lazy-load.
  - As miniaturas usam lazy-load.
- **Painel (Prompt 6):** os uploads vão para o R2. Antes do build, um passo de sincronização copia as fotos publicadas para `src/assets/fotos`, e o pipeline continua o mesmo.
- **Recorte:** o ponto focal (`focus`) define o recorte do hero e das miniaturas. O lightbox usa `object-fit: contain`, sem recorte.
- **Ordem narrativa:** `group` serve só para ordenar (com ordenação estável) e nunca é exibido. A legenda só aparece se for informada.
- **Galeria e lightbox:**
  - mosaico de até 5 fotos com layout próprio para 1, 2, 3, 4 ou 5 fotos, sem buracos;
  - lightbox em `<dialog>` nativo: setas, Home/End, Esc, clique no fundo, deslizar no toque, contador em `aria-live`, foco devolvido, rolagem travada e estados de carregamento e erro;
  - sem JavaScript, cada miniatura vira um link para a imagem ampliada e todas as fotos ficam visíveis;
  - os dados de cada foto ficam em atributos `data-*` dos links. Tentei JSON com `set:text`, mas o Astro escapa as aspas e o parse quebra; `set:html` está proibido no lint.
- **Sem salto de layout ao carregar o JS:** os estados "com JavaScript" (menu mobile recolhido, mosaico com 5 fotos) usam `@media (scripting: enabled)` e já valem na primeira pintura. Registro da implementação documenta queda de CLS de 0,088 para abaixo de 0,05 em 360px; a suíte atual verifica apenas o limite `<0,05`, não grava o valor final exato.
- **Legibilidade do hero:** o véu acompanha o bloco de texto (`.hero__band`), com um degradê de 8rem (mobile) ou 12rem (desktop) e véu forte por trás de todo o texto. Um teste E2E confirma isso em 320, 390, 768 e 1440px.
- **Barra de reserva no mobile:** só aparece depois de rolar além do hero, que já tem o CTA, via scroll-driven animation. Com movimento reduzido ou sem suporte, fica sempre visível.
- **Páginas de desenvolvimento:** ficam em `src/dev-pages/` e são registradas por `injectRoute` apenas em `astro dev`. Antes estavam em `src/pages/` com `getStaticPaths` vazio, mas mesmo assim o módulo era empacotado e as imagens de exemplo acabavam no `dist` (verificado e corrigido).

## D8 — Painel administrativo (código legado não executado no GitHub Pages)

- **Banco e arquivos:** Cloudflare Pages Functions, com D1 para o conteúdo (versionado) e R2 para as imagens.
- **Login:** Cloudflare Access (código por e-mail, só o e-mail do proprietário), com validação do JWT do Access no servidor em cada requisição.
- **Publicação:** ao salvar, um deploy hook reconstrói o site estático.
- **Isolamento:** projeto, D1, R2 e Access separados do Residencial Ametista.

Os arquivos de Functions/D1/R2 permanecem visíveis no repositório como proposta anterior, mas não são empacotados nem funcionam no GitHub Pages. A rota `/admin/` explica a edição via repositório. Veja [docs/PAINEL-ADMIN.md](PAINEL-ADMIN.md).
