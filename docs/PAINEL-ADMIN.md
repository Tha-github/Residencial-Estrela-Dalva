# Painel administrativo

O painel fica em `/admin/`. O HTML não contém senha nem segredo: o Cloudflare Access autentica o proprietário, e cada endpoint valida a assinatura RS256 do JWT, emissor, validade, audience e e-mail autorizado no servidor. A allowlist de e-mail do Access e `OWNER_EMAIL` precisam ser o mesmo endereço. A API altera apenas o registro fixo `estrela-dalva` no D1; o esquema estrito e as verificações de campos preservam a estrutura e bloqueiam mudanças ao nome e à localização-base. O R2 guarda as imagens com chaves UUID; os objetos são servidos pelo endpoint de mídia. A migração cria limite por IP com janela de um minuto para operações autenticadas e tentativas contra a API.

## Configuração de produção

1. Crie no Cloudflare um D1 chamado `residencial-estrela-dalva-content` e um bucket R2 privado chamado `residencial-estrela-dalva-media`. Substitua `database_id` em `wrangler.toml` pelo ID criado e aplique `migrations/0001_content.sql` (`wrangler d1 migrations apply ... --remote`).
2. Configure bindings `CONTENT` e `MEDIA` no projeto Pages e publique as Pages Functions incluídas em `functions/`.
3. Crie uma aplicação Cloudflare Access Self-hosted para `/admin/*` e `/api/admin/*` e `/api/media/upload`. A política deve permitir somente o e-mail do proprietário; use autenticação por código de e-mail ou IdP. Copie o Audience tag da aplicação.
4. Defina no ambiente Pages: `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `OWNER_EMAIL` e `DEPLOY_HOOK_URL`. O Access deve exigir login também para as Functions; elas verificam novamente o JWT.
5. Crie um deploy hook Pages para reconstruir o site após gravações. No ambiente de build, configure `CF_SYNC_CONTENT=1`, `CF_D1_DATABASE=residencial-estrela-dalva-content`, `CF_R2_BUCKET=residencial-estrela-dalva-media`, `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN`. O token é secreto, restrito à conta/projeto, D1 (leitura), R2 (leitura) e Pages (deploy). O script de prebuild usa Wrangler 4.164.0 via `npx` para sincronizar o conteúdo e as fotos ao pipeline Astro existente; o build Cloudflare precisa conseguir buscar o pacote no npm. Não coloque esse token nas variáveis `PUBLIC_*`.
6. Adicione regras Cloudflare Rate Limiting para `/api/admin/*` e `/api/media/upload` (por IP, com bloqueio temporário após excesso de requisições), e alertas para falhas de build. O login por e-mail do Access é o fluxo de primeiro acesso e recuperação: o proprietário solicita um novo código; um administrador da conta Cloudflare restaura a allowlist ou troca o IdP se perder o acesso à caixa postal. Não existe senha local para redefinir.

## Custos e limites

O painel não oferece gestão de reservas. Cloudflare Access Free costuma cobrir times pequenos, mas limites, disponibilidade regional e preços mudam: confirme a tabela vigente na conta antes de ativar. D1/R2 têm franquias e cobrança por uso, e cada salvamento dispara um build Pages, sujeito aos limites do plano. O upload aceita JPEG, PNG e WebP até 12 MB por arquivo. A publicação do site depende de build bem-sucedido; a gravação no D1 permanece salva se o deploy hook falhar, e o painel informa essa condição.

## Primeiro acesso e operação

Crie a aplicação Access e adicione o e-mail proprietário antes de compartilhar `/admin/`. O primeiro acesso é o mesmo fluxo de código por e-mail. O painel carrega o conteúdo atual do D1; salvar confirma a alteração e solicita o deploy. Mensagens indicam sessão expirada, erro de validação, falha no deploy ou sucesso. O botão Sair direciona ao logout do Cloudflare Access.

## Limites de implantação

As Functions, binding names, migração e fluxo de interface estão no repositório. O repositório não tem credenciais Cloudflare, ID real do D1, hostname de Access, e-mail do proprietário nem deploy hook; portanto, não é possível afirmar que produção está protegida ou que o painel está operacional até concluir os passos acima. O build estático continua exigindo dados mínimos confirmados já documentados no guia do projeto.
