# Avaliação de entrega — hospedagem GitHub Pages

**Revisão:** 17/11/2026, após a falha do build do commit `7ad50d5`.  
**Causa confirmada:** Pages estava publicando diretamente da branch pelo Jekyll e tentou interpretar os arquivos Astro como YAML. O repositório não tinha workflow Astro.

## Checklist atualizado

| # | Critério | Estado | Evidência/limite |
|---|---|---|---|
| 1 | Qualidade visual | **PENDENTE** | O layout Astro é coerente e responsivo; comparação com a prévia original do cliente e avaliação de fotos reais ainda não são possíveis. |
| 2 | Clareza e reserva | **PENDENTE** | A página explica reserva externa; links Booking/Airbnb/Decolar faltam, então o CTA real é ocultado. |
| 3 | Fidelidade do conteúdo | **PENDENTE** | Não há dados de exemplo no conteúdo público, mas textos e dados operacionais ainda aguardam aprovação/fornecimento do cliente. |
| 4 | Responsividade | **APROVADO localmente** | Playwright cobriu 320, 390, 768 e 1440 px; os casos reportaram sem overflow nem erros de console. |
| 5 | Links oficiais e Maps | **PENDENTE** | URLs não fornecidas; fixtures E2E não são destinos reais. |
| 6 | Painel | **PENDENTE — incompatível com este host** | GitHub Pages é estático e não executa autenticação/API/storage. `/admin/` agora informa esse limite; edição é por commit no repositório. |
| 7 | Segurança | **PENDENTE** | Não há backend no hosting. CSP segue como meta HTML; GitHub Pages não recebe os headers HTTP definidos no antigo formato Cloudflare. `npm audit` não alcançou o registry e não permite concluir o estado de vulnerabilidades. |
| 8 | SEO | **PENDENTE** | Build do Pages fica em `preview`/noindex até aprovação dos dados. Canonical, domínio e indexação final dependem da decisão do cliente e configuração Pages. |
| 9 | Performance | **PENDENTE** | Ativos e imagens locais são otimizados no build; LCP/INP de campo e Lighthouse não foram medidos. |
| 10 | Acessibilidade/estabilidade | **PENDENTE** | Testes automatizados de teclado, foco, contraste de tokens, reduced motion e layout passam; falta revisão manual com leitor de tela e conteúdo/fotos finais. |
| 11 | Build/testes | **APROVADO local e no GitHub Actions** | `npm run validate` passou local com o base path do projeto e no run `44143395477`; build e deploy terminaram verdes. HTTP HEAD retornou 200 para `/`, `/admin/`, favicon, CSS, fontes e `/404.html`; a página servida tem `noindex` e não contém placeholders. |
| 12 | Documentação/entrega | **APROVADO documentalmente** | Instruções atuais em [DEPLOY-GITHUB-PAGES.md](DEPLOY-GITHUB-PAGES.md), [PAINEL-ADMIN.md](PAINEL-ADMIN.md) e [PENDENCIAS-CLIENTE.md](PENDENCIAS-CLIENTE.md). `CLAUDE.md` está vazio. |

## Como publicar e verificar

O workflow `.github/workflows/pages.yml` valida e compila o site para `dist`, envia o artefato e publica a branch `main` pelo ambiente `github-pages`. O build define `BASE_PATH=/Residencial-Estrela-Dalva` para que assets e links funcionem em:

`https://tha-github.github.io/Residencial-Estrela-Dalva/`

Em **Settings → Pages → Build and deployment**, a fonte agora está configurada como **GitHub Actions**. Run `44143395477` implantou com sucesso. Instruções completas: [DEPLOY-GITHUB-PAGES.md](DEPLOY-GITHUB-PAGES.md).

## Conteúdo e edição

Editar `src/data/residencial.json` e colocar fotos reais em `src/assets/fotos/`; preencher `alt`, conferir links e validar com `npm run validate`. O workflow está configurado como `preview`/noindex até os dados obrigatórios de [PENDENCIAS-CLIENTE.md](PENDENCIAS-CLIENTE.md) serem aprovados. Só então mudar o build para `production`.

O histórico GitHub serve como histórico e recuperação de versões do código/conteúdo. Não há backup separado do GitHub nem restauração testada. Fotos novas também devem ser commitadas no repositório; não há storage de uploads nesse host.

## Limitações explícitas

- O painel autenticado, upload via servidor, API, D1/R2 e funções Cloudflare não são executados nem implantados em GitHub Pages. Arquivos antigos dessas peças permanecem visíveis no repositório, identificados como legado.
- Headers HTTP HSTS, `X-Content-Type-Options`, `X-Frame-Options` e `Permissions-Policy` não podem ser definidos pelo arquivo `_headers` antigo nesse provedor. CSP e referrer policy vão como meta HTML, dentro dos limites do navegador.
- Ainda faltam dados do imóvel, domínio próprio se desejado, aprovação visual do cliente, medição de Core Web Vitals em produção e validação de links externos reais.
- **Não há Channel Manager, motor de reservas, calendário, sincronização de disponibilidade/reservas, gestão de tarifas ou pagamento.**
