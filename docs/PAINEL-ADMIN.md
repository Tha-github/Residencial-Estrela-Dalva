# Painel administrativo

## Situação no GitHub Pages

O destino de hospedagem é GitHub Pages, que publica somente HTML, CSS, JavaScript e arquivos estáticos. Ele não executa Pages Functions, APIs, D1/R2 ou autenticação de servidor. Por isso, o painel de edição autenticado não é publicado nem pode funcionar neste hosting.

A rota `/admin/` mostra um aviso informativo. Para atualizar o site, edite `src/data/residencial.json` e as fotos no próprio repositório GitHub, revise as alterações e envie um commit para `main`; o workflow valida, compila e publica o resultado. Não coloque dados privados nem segredos no repositório.

Os arquivos `functions/`, `migrations/` e `wrangler.toml` são código legado de uma proposta Cloudflare, não são implantados pelo workflow do GitHub Pages. O fluxo antigo com Access, D1, R2, tokens e deploy hook está inativo. Se for necessário um painel web de verdade, será preciso escolher um backend/serviço compatível e revalidar autenticação, armazenamento, privacidade e custos.

## Limites de edição pelo repositório

- Alterar textos e informações permitidas em `src/data/residencial.json`.
- Adicionar fotos reais em `src/assets/fotos/` e apontá-las no JSON com `alt` descritivo.
- Validar com `npm run validate` e fazer push para `main`.
- A estrutura de conteúdo passa pelo esquema Zod; o build falha para conteúdo inválido. O build de produção também bloqueia dados obrigatórios ainda pendentes.

Consulte [DEPLOY-GITHUB-PAGES.md](DEPLOY-GITHUB-PAGES.md) para publicar e [PENDENCIAS-CLIENTE.md](PENDENCIAS-CLIENTE.md) para dados que faltam.
