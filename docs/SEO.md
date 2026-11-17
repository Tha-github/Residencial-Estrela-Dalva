# SEO técnico e indexação

## Implementado

- A página inicial gera title, description, Open Graph, Twitter Card e JSON-LD `LodgingBusiness` sem preço, rating, reviews, endereço ou comodidades não confirmados.
- Em desenvolvimento e preview, as páginas recebem `noindex, nofollow`, `robots.txt` bloqueia indexação e o sitemap é omitido.
- O workflow atual publica em `preview` enquanto faltarem dados de lançamento; portanto o site pode ser visto pelo endereço direto, mas não é apresentado aos buscadores como produção.
- O pipeline de produção gera canonical, sitemap e robots para o domínio definitivo e falha sem conteúdo obrigatório e `PUBLIC_SITE_URL` válido.
- GitHub Pages publica este repositório como página de projeto em `https://tha-github.github.io/Residencial-Estrela-Dalva/`; o `base` Astro e os links internos respeitam o prefixo do repositório.

## Antes de indexar

1. Confirmar domínio definitivo e variante canônica (se houver domínio próprio).
2. Aprovar title, meta description e textos; inserir fotos e dados reais obrigatórios.
3. Alterar no workflow `PUBLIC_DEPLOY_ENV` de `preview` para `production` após cumprir os requisitos do build.
4. Após deploy, conferir canonical, robots, sitemap, schema, status HTTP e redirects no endereço público. O sitemap/canonical no root de `github.io` não substitui validação sob o caminho de projeto.

O controle de HTTPS e headers HTTP é limitado pelo provedor. A política CSP é também emitida como meta HTML; `HSTS`, `X-Content-Type-Options`, `X-Frame-Options` e `Permissions-Policy` não podem ser configurados por este projeto como headers HTTP do GitHub Pages.
