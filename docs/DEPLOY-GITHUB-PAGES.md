# Deploy no GitHub Pages

## Endereço

O repositório `Tha-github/Residencial-Estrela-Dalva` é uma página de projeto:

`https://tha-github.github.io/Residencial-Estrela-Dalva/`

O projeto Astro usa `BASE_PATH=/Residencial-Estrela-Dalva`; o prefixo é aplicado a assets, favicon, marca e links internos.

## Ativar publicação

1. Abra **Settings → Pages** no repositório.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**. A configuração anterior publicava a branch com Jekyll e falhava tentando ler `.astro` como YAML.
3. Faça push na branch `main` ou execute manualmente o workflow **Build and deploy GitHub Pages** em **Actions**. O primeiro deploy desta configuração concluiu com sucesso no run `44143395477`.
4. O workflow instala Node 24 e dependências do lockfile, roda `npm run validate`, envia `dist/` como artefato e publica pelo ambiente `github-pages`.
5. Confira que os dois jobs (`build` e `deploy`) ficaram verdes e abra o endereço publicado. O primeiro deploy respondeu `200` em homepage, admin informativo, favicon, CSS e 404. URLs profundas, imagens e fontes devem usar o prefixo do repositório.

O workflow publica em `PUBLIC_DEPLOY_ENV=preview` e `noindex` enquanto faltarem dados e aprovações do cliente. Depois de completar [PENDENCIAS-CLIENTE.md](PENDENCIAS-CLIENTE.md), alterar o valor do workflow para `production`; nesse modo o build falha deliberadamente até conteúdo obrigatório e domínio HTTPS serem configurados.

## Atualizar textos e imagens

1. Edite `src/data/residencial.json` no GitHub ou localmente.
2. Adicione as fotos aprovadas em `src/assets/fotos/`, atualize referências e escreva `alt` fiel ao conteúdo da foto.
3. Rode `npm run validate`.
4. Commit e push para `main`; Actions valida e publica.

O repositório contém os arquivos da aplicação e é público. Não inclua credenciais, dados pessoais não autorizados ou informação privada. `.env` e `.dev.vars` são ignorados pelo Git; `.env.example` contém apenas nomes/valores vazios.

## O que esse hosting executa

GitHub Pages entrega arquivos estáticos. Ele não executa `functions/`, API, autenticação de servidor, D1, R2 ou upload. A rota `/admin/` informa a forma de edição disponível. As Functions e arquivos `wrangler.toml`/migrações permanecem visíveis como código legado, mas não fazem parte do artefato publicado.

GitHub Pages não aplica o arquivo Cloudflare `dist/_headers`. O pipeline inclui CSP e referrer policy como meta HTML, mas HSTS e demais headers HTTP não podem ser definidos por esse arquivo no Pages. Cache, compressão e HTTPS efetivos devem ser confirmados na hospedagem.

Consulte a [documentação Astro para GitHub Pages](https://docs.astro.build/en/guides/deploy/github/) e a [documentação GitHub para workflows Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
