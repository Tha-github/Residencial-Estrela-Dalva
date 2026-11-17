# Relatório de segurança — GitHub Pages

**Revisão:** 17/11/2026. Escopo atual: repositório público, build estático e workflow GitHub Pages. O commit anterior falhou porque Jekyll tentou interpretar `.astro`; esse log foi lido pelo `gh run view` e motivou o workflow Astro em `.github/workflows/pages.yml`. A correção precisa de um novo run para confirmar o deploy.

## Estado e ações

| Risco/estado | Evidência | Ação/situação |
|---|---|---|
| **Alto — backend antigo não existe no GitHub Pages** | Pages publica só o artefato estático; `functions/`, D1/R2, autenticação e uploads não são executados. | `/admin/` agora informa que a edição ocorre pelo repositório. Não inserir dados privados. Um painel com login requer hospedagem backend compatível; não há painel operacional neste host. |
| **Médio — cabeçalhos HTTP não são configuráveis pelo artefato** | `dist/_headers` é sintaxe específica de Cloudflare e não configura respostas GitHub Pages. | CSP e referrer policy são emitidos como meta HTML. HSTS, `X-Content-Type-Options`, `X-Frame-Options` e `Permissions-Policy` dependem do provedor e não foram confirmados por uma resposta real. HTTPS é responsabilidade do GitHub Pages. |
| **Pendente — dependências** | `npm audit` falhou ao acessar `registry.npmjs.org`; `npm ls --depth=0` confirma instalação compatível com lockfile, não ausência de advisories. | Repetir auditoria quando registry estiver acessível. Não alegar que não há vulnerabilidades. |
| **Pendente — histórico de segredos** | A busca local anterior não encontrou padrões de segredo de alta confiança; `.env` e `.dev.vars` são ignorados. O primeiro commit é `7ad50d5`; este relatório não substitui varredura Gitleaks/TruffleHog do histórico. | Fazer varredura do histórico e manter secrets fora do repo. Os arquivos Cloudflare legados não contêm credenciais reais conhecidas. |
| **Baixo — conteúdo e XSS** | JSON passa por Zod estrito; conteúdo Astro é escapado; links externos usam allowlists HTTPS; o ícone SVG usa paths constantes. | Mantidos. O painel backend legado tem validação adicional, mas não roda neste host. |
| **Pendente — deploy atual** | A execução que falhou era Jekyll sem workflow. | Workflow próprio Astro foi adicionado, com `npm run validate`, Node 24, artefato `dist` e deploy-pages. O resultado precisa ser verificado no Actions após o push e `Settings → Pages` deve usar `GitHub Actions`. |

## Configuração estática publicada

- O workflow compila com `PUBLIC_DEPLOY_ENV=preview`, que mantém `noindex` enquanto faltam dados de cliente e links oficiais.
- Astro aplica o `base` `/Residencial-Estrela-Dalva`; favicon, links internos e assets usam o prefixo da página de projeto.
- O workflow envia somente `dist/`; arquivos fonte permanecem visíveis no repositório público, enquanto `functions/` e migrações não são executados pelo Pages.
- Nenhum source map (`*.map`) deve ser publicado; verificar novamente no artefato do Actions.
- O repositório é intencionalmente público para que o código fique visível. Confirmar que todo conteúdo commitado é apropriado para publicação; não incluir dados privados do anfitrião/hóspedes.

## Verificações anteriores conservadas

- `npm run validate` passou após as correções de código anteriores: lint, Astro check, 64 testes unitários, build e SEO artifacts.
- Os 41 casos E2E exibiram `ok`, mas o processo não encerrou com resumo/código de saída.
- A revisão anterior corrigiu a ordem de autorização antes de `rateLimit()` nas Functions antigas para evitar escrita D1 de chamadas anônimas. Essas rotas não fazem parte do deploy GitHub Pages.

Este relatório não é certificação de segurança nem atesta cabeçalhos/configuração efetivos de produção.
