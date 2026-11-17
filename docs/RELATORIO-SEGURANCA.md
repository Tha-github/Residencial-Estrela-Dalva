# Relatório de segurança — Residencial Estrela Dalva

**Revisão:** 17/11/2026. Escopo: código disponível no workspace, dependências instaladas e build local. Não houve acesso à conta Cloudflare, às configurações de produção ou a um domínio ativo. Este relatório não representa certificação de segurança.

## Achados, evidências e ações

| Risco | Evidência | Correção / situação |
|---|---|---|
| **Alto — proteção de produção depende de configuração externa** | O projeto não tem IDs reais do D1, secrets, aplicação/política Cloudflare Access nem deploy hook. A API valida JWT no servidor e restringe o e-mail e o registro D1, mas esses recursos não foram implantados nesta revisão. | Código da validação está em `functions/api/admin/_lib.ts`; passos e permissões mínimas em [PAINEL-ADMIN.md](PAINEL-ADMIN.md). Configurar Access para `/admin/*`, `/api/admin/*` e `/api/media/upload`; aplicar migrações/bindings e confirmar TLS e cookies/sessão do Access antes de afirmar que produção está protegida. |
| **Alto — vulnerabilidades de dependências não verificadas** | `npm audit` não alcançou `registry.npmjs.org` (erro no endpoint de auditoria). A saída não contém advisories; isso **não** significa que não existam vulnerabilidades. | `npm ls --depth=0` confirmou que as dependências instaladas correspondem às versões fixadas no manifesto. Repetir `npm audit` em ambiente com acesso ao registro e tratar advisories antes do deploy. Nenhuma atualização às cegas foi feita. |
| **Médio — CSP permite estilos inline** | Componentes Astro emitem `<style>` e atributos `style` para recorte/foco de imagens; `dist/_headers` mantém `style-src 'unsafe-inline'`. | `script-src` não permite `unsafe-inline` nem `unsafe-eval`: o postbuild calcula hashes SHA-256 dos scripts inline produzidos. CSP também define `object-src 'none'`, `base-uri`, `form-action`, `frame-ancestors` e `upgrade-insecure-requests`. Remover `unsafe-inline` de estilos requer migrar estilos e valores dinâmicos para uma estratégia compatível. |
| **Médio — inspeção de imagem não decodifica pixels no Worker** | O upload limita o corpo durante a leitura, extensão, MIME, assinatura/container, dimensões e área total; aceita JPEG/PNG/WebP. A validação do Worker verifica estrutura e limites, não decodifica completamente o fluxo comprimido. | Limite de 12 MB por arquivo e 40 MP; SVG, animação WebP/APNG, content-types divergentes e dimensões fora do limite são recusados. O pipeline Astro/Sharp também processa imagens no build. Para validação completa antes do armazenamento, integrar serviço de decodificação de imagens ou Cloudflare Images e revalidar custo/limites. |
| **Médio — limitação de tentativas usa D1** | A tabela `request_limits` mantém contadores por janela de um minuto e hash SHA-256 do IP de borda, com limites para API/upload; registros antigos são limpos periodicamente. | Implementado no backend. O hash é pseudonimização, não anonimização; o contador gera escrita D1 por requisição. Manter Access na frente dos endpoints, definir regra de rate limiting/WAF na conta Cloudflare e monitorar consumo/retensão. |
| **Baixo — imagens são públicas por necessidade** | O bucket R2 é privado, mas `/api/media/<UUID>` serve imagens com MIME validado, `nosniff`, CSP sandbox, filename aleatório e cache; a rota não oferece listagem nem escrita anônima. | Escrita exige Access, validação e rate limit. O conteúdo das fotos é público por natureza e o UUID reduz descoberta casual, sem ser controle de confidencialidade. |
| **Não verificado — histórico de commits** | `git status` mostrou os arquivos do workspace como não rastreados e `git log` não retornou commits. | Não foi possível auditar segredos em histórico recente. A busca no workspace encontrou somente `.env.example` entre nomes de arquivos de ambiente/chave e nenhum match dos padrões de alta confiança (chaves privadas, AWS access key e tokens comuns). Repetir varredura de histórico quando o repositório estiver commitado; essa busca não substitui Gitleaks/TruffleHog. |
| **Pendente do provedor — headers efetivamente enviados** | O build gera CSP com hashes, HSTS de um ano, `nosniff`, Referrer-Policy, frame deny e Permissions-Policy. A [documentação do Pages](https://developers.cloudflare.com/pages/configuration/headers/) esclarece que `_headers` só atende assets estáticos; Functions definem seus próprios headers no código. | Validado no arquivo `dist/_headers` e no código das Functions. O Astro preview local não simula `_headers`; confirmar headers na resposta do Pages após deploy. HSTS só é apropriado se o domínio estiver atendendo HTTPS. |

## Revisões adicionais

- `npm ls --depth=0`: todas as dependências diretas instaladas e fixadas; não encontrei pacote direto sem uso evidente. Fonts, Sharp, Astro, Zod, lint, typecheck e ferramentas de testes são referenciados pelo build/código/configuração.
- Busca por sinks de XSS: o conteúdo público passa pelo esquema Zod e é renderizado por expressões Astro escapadas. Links externos usam allowlists por tipo e HTTPS. O `set:html` do ícone usa apenas caminhos SVG constantes; JSON-LD é serializado de forma segura e escapa `<`.
- Escritas do painel exigem JWT válido do Cloudflare Access, e-mail autorizado, `Origin` de mesma origem, Content-Type JSON e validação completa do esquema. Não há segredo privilegiado no frontend. O logout delega ao Access.
- Cabeçalhos de sessão/cookies são geridos pelo Cloudflare Access e não foram inspecionados sem a conta. A aplicação não cria cookies próprios.
- Não há formulário público de reserva/contato. O site não coleta datas, disponibilidade nem pagamento; contato publicado só aparece quando fornecido.
- O build não contém source maps (`*.map`). As respostas da API não devolvem o conteúdo recebido em mensagens de erro e não há logging de tokens/PII no código revisado.
- A separação em nomes de projeto, banco e bucket está documentada, mas a segregação real entre contas/recursos e escopo do token Cloudflare depende da configuração do provedor.

## Validação executada

- `npm run lint` — passou.
- `npm run typecheck` — passou, sem erros/avisos.
- `npm test` — 5 arquivos e 64 testes passaram.
- Build estático em `preview` e `npm run seo:check` — passaram; inclui verificação de hashes CSP, um H1, robots/noindex e ativos SEO.
- Preview HTTP local: `/` retornou 200, `/robots.txt` 200 e rota inexistente 404. Isso não testa redirects, TLS, headers Cloudflare ou a política Access reais.
- Geração de `robots.txt`/sitemap em modo de produção foi exercitada com host de teste `seo-check.example`; esse host não foi gravado no site. O sitemap foi validado como XML bem formado. O HTML de produção e canonical final não puderam ser testados, pois domínio e conteúdo obrigatório seguem pendentes.
- `npm audit` — bloqueado por indisponibilidade do endpoint do registro npm. Nenhuma conclusão sobre vulnerabilidades pode ser tirada desse comando nesta execução.

## Revisão complementar — 17/11/2026

| Risco | Evidência | Correção / situação |
|---|---|---|
| **Médio — escrita D1 causada por chamadas anônimas** | Nas rotas de conteúdo, logout e upload, `rateLimit()` era executado antes de validar o JWT. Cada tentativa sem autenticação gravava/incrementava `request_limits` no D1, permitindo consumo desnecessário do banco. | Corrigido em `functions/api/admin/content.ts`, `functions/api/admin/logout.ts` e `functions/api/media/upload.ts`: origem (nas escritas) e JWT são verificados antes do contador D1. Chamadas sem autorização não acionam `rateLimit()`. |
| **Pendente — dependências e histórico** | `npm audit --json` voltou a falhar ao acessar `registry.npmjs.org`; `git log` informa que a branch ainda não tem commits. A busca local por nomes de arquivos de segredo retornou somente `.env.example`; o build tem zero arquivos `.map`. | Não foi possível consultar advisories nem auditar histórico. As buscas locais não substituem Gitleaks/TruffleHog. Repetir audit e varredura histórica em ambiente/repositório com acesso ao registro e commits. |
| **Pendente — produção Cloudflare** | Não há bindings/credenciais reais no workspace. | Política Access, secrets, TLS, cookies, headers servidos pelo provedor, regras WAF/rate limit e isolamento efetivo de D1/R2 permanecem por confirmar na conta Cloudflare, conforme [guia do painel](PAINEL-ADMIN.md). |

### Verificações desta revisão

- `npm run validate` — passou: lint, typecheck (61 arquivos, 0 erros/avisos), 64 testes unitários, build e `seo:check`.
- `npm run test:e2e` — os 41 casos reportados pelo Playwright passaram, incluindo quatro viewports, navegação por teclado, galeria, links, console e verificação de estabilidade. O runner foi interrompido após exibir todos os casos como `ok`, antes de imprimir o resumo final; por isso o código de saída final não foi obtido.
- Auditoria de arquivos: nenhum `.map` no build; nenhum arquivo de chave privada foi localizado. `git log` sem commits impede checagem de histórico. O build contém somente os ativos estáticos esperados e não inclui rotas `/dev/`.
- O painel real não foi exercitado ponta a ponta: faltam Access, D1, R2 e deploy hook configurados. As verificações de UI e autenticação em produção seguem pendentes.
