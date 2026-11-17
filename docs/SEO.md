# SEO técnico e indexação

## Implementado

- A página inicial tem title específico para o residencial e intenção de hospedagem, description, canonical, Open Graph e Twitter Card. Todos usam a origem `PUBLIC_SITE_URL` e só aparecem com canonical disponível e página indexável.
- O H1 permanece o nome do residencial; os títulos das seções seguem em H2. A página 404 tem H1 próprio, `noindex` e sem canonical.
- O postbuild gera `robots.txt` e `sitemap.xml` somente para `PUBLIC_DEPLOY_ENV=production`. Produção permite crawling e aponta para o sitemap; desenvolvimento/preview escreve `Disallow: /` e remove sitemap para evitar indexação de prévias. O sitemap contém a URL canônica da única página pública; âncoras são seções, não páginas independentes.
- `LodgingBusiness` ([Schema.org](https://schema.org/LodgingBusiness)) em JSON-LD descreve apenas nome e URL. Não inclui endereço, preço, nota, reviews ou comodidades. Não foi usado o tipo Google Vacation Rental: além de depender de dados ainda não confirmados, a experiência exige elegibilidade e integração com o Hotel Center ([requisitos do Google](https://developers.google.com/search/docs/appearance/structured-data/vacation-rental)).
- Open Graph usa um card de marca PNG gerado no build, com nome e localização já presentes nos dados do projeto. O favicon é SVG. Não há manifest/PWA porque este site institucional não é um aplicativo instalável.
- As imagens reais usam o `alt` editável no conteúdo; ícones decorativos são ocultados da árvore acessível e imagens decorativas usam `alt=""`.
- Fontes são auto-hospedadas e não dependem de terceiros para renderizar conteúdo. Robots não bloqueia recursos em produção.

## Dependências para o lançamento

Definir `PUBLIC_SITE_URL` como apenas a origem HTTPS do domínio final, sem caminho, credenciais ou query; o gerador rejeita valores fora desse formato. Escolher `www` ou domínio raiz e configurar redirect permanente da variante não canônica e de HTTP para HTTPS no Cloudflare. Aprovar os textos de SEO e enviar fotos reais com descrições. Depois do deploy, validar status HTTP, redirects, canonical, robots, sitemap e JSON-LD no domínio final; esses itens não podem ser verificados enquanto o domínio e os dados de lançamento estiverem pendentes.
