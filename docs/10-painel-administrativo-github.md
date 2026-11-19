# Painel administrativo — Residencial Estrela Dalva

O painel em `/admin/` segue o padrão Top Site Admin do Residencial Ametista. A interface é estática no GitHub Pages; login, validação, upload e publicação são processados por um Cloudflare Worker exclusivo deste repositório.

```text
Proprietário → senha → Worker Estrela Dalva → GitHub API
                               │                    ├── commit em src/data/residencial.json
                               │                    ├── fotos em src/assets/fotos/uploads/
                               └── token de sessão  └── Actions publica no GitHub Pages
```

O token do GitHub e o hash da senha ficam como secrets do Worker. O navegador recebe apenas um token de sessão de oito horas. Não há conexão, credencial nem arquivo compartilhado com o Residencial Ametista.

## Módulos editáveis

- Página inicial: título, descrição, foto, destaques e textos/destinos dos botões.
- Apresentação: título, parágrafos, destaques e galeria reordenável.
- Acomodações: textos das camas existentes e capacidade (até quatro pessoas).
- Comodidades: títulos e itens das categorias existentes.
- Localização: título, descrição, distâncias, região, endereço e Google Maps.
- Experiência: título, descrição e momentos existentes.
- Informações práticas: capacidade, check-in, check-out e regras existentes.
- Dúvidas frequentes: perguntas e respostas atuais, sem adicionar ou remover itens.
- Reservas e contatos: Booking.com, Airbnb, WhatsApp, mensagem e e-mail.
- Cores: principal, secundária, destaque, fundo e texto; combinações abaixo de 4,5:1 são recusadas.

Listas fixas não podem ganhar nem perder itens. O painel não oferece HTML, código, CSS, tipografia ou estrutura de página. Fotos JPG/JPEG, PNG e WEBP são reduzidas no navegador; o Worker valida assinatura, dimensões e limite de 8 MB antes do commit.

## Configuração única da Top Site

### 1. Worker e secrets

O Worker já está configurado em `admin-worker/wrangler.jsonc` para o repositório `Tha-github/Residencial-Estrela-Dalva`, branch `main`, e origem pública `https://tha-github.github.io`.

Crie um token GitHub fine-grained restrito **somente** a `Tha-github/Residencial-Estrela-Dalva`, com `Contents: Read and write` e `Actions: Read-only`. Faça login na conta Cloudflare que hospedará o Worker e configure:

```powershell
npm run admin:hash-password
npx wrangler@4.164.0 login
npx wrangler@4.164.0 secret put GITHUB_TOKEN --config admin-worker/wrangler.jsonc
npx wrangler@4.164.0 secret put ADMIN_PASSWORD_HASH --config admin-worker/wrangler.jsonc
npx wrangler@4.164.0 secret put SESSION_SECRET --config admin-worker/wrangler.jsonc
npm run admin:deploy
```

O primeiro comando pede a senha do proprietário sem exibi-la e imprime `ADMIN_PASSWORD_HASH` e `SESSION_SECRET`. Grave cada valor com o `wrangler secret put` correspondente. Nunca salve a senha, o token GitHub ou os valores de sessão em arquivos versionados ou variáveis `PUBLIC_*`.

O deploy do Worker informa uma URL semelhante a `https://estrela-dalva-admin.<conta>.workers.dev`.

### 2. Ligar o GitHub Pages ao Worker

No repositório do Estrela Dalva, abra **Settings → Secrets and variables → Actions → Variables** e crie:

| Nome | Valor |
| --- | --- |
| `ADMIN_API_URL` | URL HTTPS do Worker publicada no passo anterior |

O workflow `pages.yml` injeta essa variável como `PUBLIC_ADMIN_API_URL` no build. Execute **Actions → Build and deploy GitHub Pages → Run workflow** para publicar a configuração. O painel ficará em `https://tha-github.github.io/Residencial-Estrela-Dalva/admin/`.

Sem `ADMIN_API_URL`, o endereço `/admin/` mostra que a configuração ainda está pendente e não tenta autenticar.

### 3. Conferência após configurar

1. Acesse `/admin/`; uma senha incorreta deve ser recusada.
2. Entre com a senha do proprietário e confirme que os módulos carregam.
3. Altere um texto, publique e confira o commit no repositório Estrela Dalva.
4. Aguarde o workflow Pages concluir e confirme a mudança no site.
5. Teste o upload de uma foto, reordenação, links e restauração das cores.

## Operação e recuperação

- Cada publicação cria um commit único de conteúdo e imagens. GitHub Actions publica o commit.
- Se alguém alterar o conteúdo no GitHub enquanto o painel está aberto, o Worker recusa a publicação conflitante; recarregue e reaplique a mudança.
- Se a senha for esquecida, gere novo hash com `npm run admin:hash-password` e substitua `ADMIN_PASSWORD_HASH`. Troque também `SESSION_SECRET` para invalidar sessões abertas.
- Se o token GitHub expirar, gere outro com as mesmas permissões mínimas e substitua o secret `GITHUB_TOKEN`.
- Logs técnicos ficam no painel Cloudflare do Worker `estrela-dalva-admin`; não registre credenciais nos logs.

## Estado da integração

O código do painel, Worker, autenticação, validação, upload, commit e publicação automática está pronto e coberto por testes locais com uma API GitHub simulada. A conexão real depende da Top Site criar o Worker e os secrets/variável acima. Nenhuma senha ou token foi inventado ou colocado no projeto.
