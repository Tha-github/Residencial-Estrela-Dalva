# Painel administrativo — Residencial Estrela Dalva

O painel em `/admin/` segue o padrão Top Site Admin do Residencial Ametista. A interface é estática no GitHub Pages; autenticação, configuração inicial, upload e publicação passam por um Cloudflare Worker deste repositório.

## Configuração inicial pela tela

Na primeira visita, `/admin/` mostra o botão **Configurar chave secreta e senha**. O formulário pede o código de provisionamento do Worker, um token GitHub fine-grained, a chave de acesso escolhida pelo proprietário e uma senha. Os dados são enviados ao Worker por HTTPS. O token, a chave e o hash da senha são armazenados cifrados com AES-GCM no D1; o Worker nunca devolve o token ao navegador.

A configuração só pode ser feita uma vez. O código de provisionamento é guardado como secret no Worker e funciona como autorização para o cadastro inicial.

### Abrir localmente

Para ver a tela em `http://localhost:4321/admin/`, rode o Worker e o site em terminais separados:

```powershell
npm run admin:setup-secrets
```

Copie os três valores impressos para `admin-worker/.dev.vars` (arquivo local ignorado pelo Git). Depois rode a migração local e inicie o Worker:

```powershell
npx wrangler@4.164.0 d1 migrations apply estrela-dalva-admin-config --local --config admin-worker/wrangler.jsonc
npm run admin:dev
```

No segundo terminal, aponte o site para o Worker local e inicie o Astro:

```powershell
$env:PUBLIC_ADMIN_API_URL = "http://localhost:8787"
npm run dev
```

O botão aparece sem o Worker, mas o formulário só pode salvar quando a conexão local ou publicada estiver disponível.

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

### 1. Criar o banco D1

Na conta Cloudflare que hospedará o Worker, crie o banco:

```powershell
npx wrangler@4.164.0 d1 create estrela-dalva-admin-config
```

Copie o `database_id` retornado para `database_id` em `admin-worker/wrangler.jsonc`, substituindo o UUID zerado. Aplique a migração remota:

```powershell
npx wrangler@4.164.0 d1 migrations apply estrela-dalva-admin-config --remote --config admin-worker/wrangler.jsonc
```

### 2. Cadastrar secrets e publicar o Worker

Gere três valores privados e faça login na conta Cloudflare:

```powershell
npm run admin:setup-secrets
npx wrangler@4.164.0 login
npx wrangler@4.164.0 secret put PROVISIONING_KEY --config admin-worker/wrangler.jsonc
npx wrangler@4.164.0 secret put CONFIG_ENCRYPTION_KEY --config admin-worker/wrangler.jsonc
npx wrangler@4.164.0 secret put SESSION_SECRET --config admin-worker/wrangler.jsonc
npm run admin:deploy
```

O gerador imprime um código de provisionamento, uma chave AES-256 e uma chave de sessão. Cadastre cada valor com o comando correspondente e guarde o `PROVISIONING_KEY` em um gerenciador de senhas; ele será usado no formulário inicial de `/admin/`. Nunca coloque esses valores em arquivos versionados ou variáveis `PUBLIC_*`.

O deploy informa uma URL semelhante a `https://estrela-dalva-admin.<conta>.workers.dev`.

### 3. Conectar o GitHub Pages ao Worker

No repositório `Tha-github/Residencial-Estrela-Dalva`, abra **Settings → Secrets and variables → Actions → Variables** e crie `ADMIN_API_URL` com a URL HTTPS do Worker. O workflow `pages.yml` injeta essa variável como `PUBLIC_ADMIN_API_URL` no build. Execute **Actions → Build and deploy GitHub Pages → Run workflow**.

### 4. Abrir `/admin/` e concluir o cadastro

Crie um token GitHub fine-grained restrito somente ao repositório `Tha-github/Residencial-Estrela-Dalva`, com `Contents: Read and write` e `Actions: Read-only`. Abra `https://tha-github.github.io/Residencial-Estrela-Dalva/admin/`, clique em **Configurar chave secreta e senha** e informe:

- o `PROVISIONING_KEY` criado no passo 2;
- o token GitHub;
- uma chave de acesso de pelo menos 20 caracteres;
- uma senha de pelo menos 10 caracteres.

O Worker valida se o token tem acesso de escrita ao repositório e salva a configuração no D1 cifrada. Depois disso, o cadastro inicial fica bloqueado e a tela passa a pedir somente chave de acesso e senha.

## Operação e recuperação

- Cada publicação cria um commit com o conteúdo e as fotos novas; GitHub Actions publica o commit.
- Se o conteúdo mudar no GitHub enquanto o painel estiver aberto, o Worker recusa a publicação conflitante. Recarregue e reaplique a mudança.
- Para trocar ou recuperar a senha, chave ou token, remova a linha `estrela-dalva` da tabela `panel_config` no D1 e repita o cadastro pelo painel. O `PROVISIONING_KEY` continua necessário.
- Se o token GitHub expirar, gere outro com as mesmas permissões mínimas e faça novamente o cadastro inicial após remover a linha existente.
- Logs técnicos ficam no painel Cloudflare do Worker `estrela-dalva-admin`; não registre credenciais nos logs.

## Estado da integração

O código do painel, Worker, cadastro inicial, armazenamento cifrado, autenticação, upload, commit e publicação automática está pronto. Para o login funcionar no site publicado, a Top Site ainda precisa criar o D1, cadastrar os secrets, publicar o Worker e definir `ADMIN_API_URL` no GitHub Actions. Nenhuma senha ou token foi inventado ou incluído no projeto.
