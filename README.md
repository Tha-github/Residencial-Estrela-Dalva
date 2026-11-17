# Residencial Estrela Dalva — site

Site institucional do Residencial Estrela Dalva (Praia dos Ingleses, Florianópolis/SC).
Apresenta o imóvel e direciona o visitante para reservar no Booking.com, Airbnb ou Decolar.
**Não** há motor de reservas, calendário, disponibilidade, tarifas nem Channel Manager.

Stack: [Astro 7](https://astro.build) (site estático) · TypeScript · Zod · Cloudflare Pages.
Decisões e justificativas: [docs/DECISOES.md](docs/DECISOES.md).
Informações pendentes do cliente: [docs/PENDENCIAS-CLIENTE.md](docs/PENDENCIAS-CLIENTE.md).
Avaliação de aceite, publicação, operação do painel e recuperação: [docs/AVALIACAO-FINAL.md](docs/AVALIACAO-FINAL.md).

## Requisitos

- Node.js **24** (ver `.nvmrc`; mínimo 24.16)
- npm 11+

## Instalação e execução local

```bash
npm ci                 # instala exatamente as versões do package-lock.json
cp .env.example .env   # opcional em dev; preencha PUBLIC_SITE_URL se quiser testar canonical
npm run dev            # http://localhost:4321
```

Em desenvolvimento, a página inicial mostra um aviso amarelo com os dados que ainda faltam.
Esse aviso **não** é gerado em build de preview/produção.

Prévia com todas as seções preenchidas por **dados de exemplo rotulados** (somente dev):
`http://localhost:4321/dev/previa/completa`. Use para revisar o layout enquanto o conteúdo real não chega.

Guia de estilo (somente dev): `http://localhost:4321/dev/estilo` — paleta, contraste calculado,
tipografia, botões, cards, ícones e hero. Direção de arte: [docs/DIRECAO-DE-ARTE.md](docs/DIRECAO-DE-ARTE.md).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o site estático em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run lint` | ESLint (TS + Astro) |
| `npm run typecheck` | `astro check` (tipos em `.ts` e `.astro`) |
| `npm run test` | Testes unitários (Vitest), incluindo contraste WCAG dos tokens |
| `npm run test:e2e` | Testes de navegador (Playwright): overflow, console, toque, menu, movimento reduzido. Na primeira vez: `npx playwright install chromium` |
| `npm run validate` | lint + typecheck + test + build — rode antes de todo deploy |

## Variáveis de ambiente

Veja `.env.example`. Nunca coloque segredos em variáveis `PUBLIC_*` (vão para o navegador).

| Variável | Obrigatória | Uso |
|---|---|---|
| `PUBLIC_SITE_URL` | Em produção | Domínio canônico (canonical, sitemap). O build de produção falha sem ela. |
| `PUBLIC_DEPLOY_ENV` | Não (padrão `development`) | `development`, `preview` ou `production`. Fora de `production` todas as páginas saem com `noindex`. |

Painel administrativo, configuração Cloudflare e recuperação de acesso: [docs/PAINEL-ADMIN.md](docs/PAINEL-ADMIN.md).
SEO, sitemap, robots e pendências do domínio: [docs/SEO.md](docs/SEO.md).

## Conteúdo

- Dados do imóvel: `src/data/residencial.json`, validados por `src/lib/content/schema.ts`.
- Campo sem confirmação do cliente fica `null` ou `[]` — a seção correspondente não aparece.
- Conteúdo inválido (URL fora dos domínios permitidos, horário mal formatado, campo desconhecido)
  **interrompe o build** com mensagem indicando o campo.
- Links aceitos: somente `https` e nos domínios de `src/lib/url.ts`.

## Fotos

1. Coloque os originais (JPG/PNG/WebP, alta resolução, sem marca d'água) em `src/assets/fotos/`.
2. Referencie no conteúdo com caminho a partir de `/fotos/`:

```json
"hero": { "image": { "src": "/fotos/fachada.jpg", "alt": "Fachada do residencial", "focus": "50% 40%" } },
"gallery": [
  { "src": "/fotos/sala-01.jpg", "alt": "Descrição do que se vê na foto", "group": "social" },
  { "src": "/fotos/detalhe-01.jpg", "alt": "…", "focus": "30% 60%", "caption": "Legenda opcional confirmada" }
]
```

| Campo | Uso |
|---|---|
| `alt` | Descrição do que **se vê** na foto (obrigatória para fotos com conteúdo) |
| `focus` | Ponto focal do recorte das miniaturas e do hero (`"x% y%"`, padrão centro). O lightbox mostra a foto inteira. |
| `group` | Ordem da narrativa: `fachada` → `social` → `quartos` → `externa` → `detalhes`. **Nunca exibido.** Sem grupo = fim, na ordem cadastrada. |
| `caption` | Legenda visível — só com informação confirmada |

O build gera AVIF + WebP + fallback em vários tamanhos, com `width`/`height` reais.
Uma imagem citada e ausente em `src/assets/fotos` interrompe o build.

**Imagens de exemplo** (só dev): `npm run dev:placeholders` gera `src/assets/dev/*.jpg`, usadas
apenas na prévia `/dev/previa/completa`. Não entram no build e o conteúdo real não pode referenciá-las.

## Build e deploy (Cloudflare Pages)

Configuração do projeto no painel do Cloudflare Pages:

| Campo | Valor |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| Variáveis (Production) | `NODE_VERSION=24`, `PUBLIC_DEPLOY_ENV=production`, `PUBLIC_SITE_URL=https://<domínio>` |
| Variáveis (Preview) | `NODE_VERSION=24`, `PUBLIC_DEPLOY_ENV=preview` |

Cabeçalhos HTTP com CSP e hashes dos scripts são gerados no postbuild em `dist/_headers`; as Pages Functions definem os cabeçalhos das próprias respostas. A página 404 (`dist/404.html`) é servida automaticamente pelo Pages.

Antes de publicar: `npm run validate` sem erros e itens obrigatórios de
[docs/PENDENCIAS-CLIENTE.md](docs/PENDENCIAS-CLIENTE.md) resolvidos.

**Trava de lançamento:** com `PUBLIC_DEPLOY_ENV=production`, o build **falha** e lista o que falta
se algum dado obrigatório estiver pendente (fotos, links de reserva, Maps, capacidade, horários…).
Para mostrar o site ao cliente antes disso, publique com `PUBLIC_DEPLOY_ENV=preview` — sai com `noindex`.

## Estrutura

```
src/
  data/residencial.json      conteúdo do imóvel (fonte única)
  lib/content/               esquema, carregamento e pendências do conteúdo
  lib/url.ts                 validação de links externos
  styles/                    tokens de design e estilos globais
  layouts/                   layout base (meta, noindex, canonical)
  components/                componentes (dev/: apenas desenvolvimento)
  pages/                     rotas (index, 404)
scripts/generate-security-headers.mjs  CSP e cabeçalhos do build estático
tests/unit/                  testes Vitest
docs/                        decisões e pendências
```
