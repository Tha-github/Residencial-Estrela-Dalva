# 10 PROMPTS --- Residencial Estrela Dalva

Use os prompts na ordem, no mesmo repositório do projeto. Antes de cada
prompt, confira o resultado da etapa anterior. Não pule etapas.

## Prompt 1 --- Auditoria, descoberta e plano técnico

Você é um engenheiro de software sênior, arquiteto de soluções e diretor
de arte digital. Vamos desenvolver o site do **Residencial Estrela
Dalva**, seguindo integralmente o `CLAUDE.md`.

Antes de escrever código: 1. Inspecione todo o repositório, estrutura,
framework, dependências, scripts, hospedagem, arquivos existentes e
estado do Git. 2. Abra a prévia enviada pelo cliente:
https://restinga-previas.pages.dev/residencial-dalva/. Compare
hierarquia, composição, navegação, imagens e conteúdo. Se não estiver
acessível, registre isso e peça screenshots; não invente o que viu. 3.
Identifique quais dados do briefing estão confirmados e quais precisam
ser solicitados: fotos reais, descrição, capacidade, quartos, camas,
banheiros, comodidades, regras, check-in/out, links dos anúncios,
Instagram e contato. 4. Confirme o link de localização específico deste
residencial e verifique se corresponde ao empreendimento. 5. Determine
uma arquitetura compatível com a hospedagem e com o painel
administrativo seguro. Se for hosting estático, explique como será feita
autenticação e persistência privadas sem expor segredos no navegador. 6.
Não inclua Channel Manager, sincronização de calendário, bloqueio de
datas, tarifas dinâmicas nem motor de reservas; isso não está incluído
no escopo contratado. 7. Apresente plano de implementação, estrutura de
páginas/componentes, estratégia de conteúdo, SEO, performance,
segurança, testes e lista de pendências.

Nesta etapa, não faça uma reconstrução destrutiva nem instale
dependências sem justificativa. Se a estrutura estiver vazia, proponha a
base adequada. Entregue um relatório conciso e um plano em ordem de
execução.

## Prompt 2 --- Fundação do projeto e arquitetura

Com base na auditoria aprovada, implemente a fundação técnica do site de
**Residencial Estrela Dalva**.

Requisitos: - Preserve a stack existente quando for adequada; não migre
framework por preferência pessoal. - Organize componentes, páginas,
estilos, assets, dados e utilitários de forma clara. - Defina tokens de
design para cores, tipografia, espaçamento, largura de conteúdo, bordas
e breakpoints. - Configure scripts de desenvolvimento, build, lint,
typecheck e testes compatíveis com o projeto. - Configure tratamento de
erros e estados vazios/carregamento. - Separe conteúdo do empreendimento
de componentes visuais para facilitar manutenção. - Prepare configuração
por ambiente; `.env.example` pode conter nomes de variáveis, nunca
valores secretos. - Inclua documentação de instalação, execução local,
build e deploy. - Não crie ainda conteúdo fictício nem painel apenas
visual.

Rode os comandos disponíveis e corrija falhas introduzidas. Ao final,
mostre a árvore principal de arquivos, decisões arquiteturais e comandos
de validação.

## Prompt 3 --- Direção de arte e sistema visual premium

Atue como diretor de arte especializado em hospitalidade e turismo de
alto padrão. Crie a direção visual de **Residencial Estrela Dalva**.

A experiência deve ser sofisticada, acolhedora, contemporânea e
costeira, sem parecer template genérico ou cópia do Booking.com.

Faça: - Avalie a prévia de referência e identifique o que deve ser
mantido, elevado ou descartado. - Defina paleta refinada inspirada em
areia, mar, tons naturais e grafite, ajustada às fotos reais. - Escolha
tipografia legível com personalidade e poucos pesos. - Defina grid,
escala tipográfica, espaçamentos, botões, links, cards, galerias, ícones
e estados interativos. - Crie um hero fotográfico de alto impacto com
texto curto, nome do residencial, localização confirmada e CTA de
reserva. - Priorize fotografia real enviada pelo cliente. Até receber as
imagens, use placeholders claramente identificados apenas no ambiente de
desenvolvimento; nunca publique fotos genéricas como se fossem do
imóvel. - Projete mobile primeiro e depois expanda para desktop. - Use
animações discretas, respeitando `prefers-reduced-motion`.

Implemente o sistema visual e os componentes-base. Não avance com cores,
textos ou comodidades inventadas. Verifique contraste e consistência.

## Prompt 4 --- Construção da experiência pública e conteúdo

Implemente as páginas e seções públicas de **Residencial Estrela Dalva**
usando os dados confirmados e o sistema visual aprovado.

Estrutura recomendada, ajustável ao material disponível: 1. Header com
nome/marca e navegação curta. 2. Hero com foto real, proposta de valor e
CTA. 3. Apresentação do residencial. 4. Galeria de imagens. 5.
Diferenciais confirmados: proximidade com o mar, localização na Praia
dos Ingleses e, quando aplicável a este imóvel, amplo terraço e pátio
externo. 6. Comodidades e informações práticas somente quando
confirmadas. 7. Localização com link do Maps validado. 8. Seção de
reservas com links externos individuais para Booking.com, Airbnb e
Decolar, após recebimento dos URLs corretos. 9. Contato/Instagram
somente com dados fornecidos. 10. Footer completo.

A experiência deve guiar o visitante para conhecer o imóvel e reservar
na plataforma de sua preferência. Deixe claro que a reserva é concluída
na plataforma externa. Não simule disponibilidade em tempo real, preços,
calendário ou checkout.

Escreva textos originais, objetivos e persuasivos, sem exageros,
promessas não comprovadas ou keyword stuffing. Se dados essenciais
faltarem, crie uma lista de pendências para o cliente em vez de
preencher por conta própria.

## Prompt 5 --- Galeria, mídia e experiência mobile

Aprimore a apresentação de imagens e a experiência responsiva de
**Residencial Estrela Dalva**.

-   Crie galeria elegante, com abertura ampliada/lightbox acessível,
    navegação por teclado e fechamento intuitivo.
-   Garanta que a ordem das fotos conte uma história:
    fachada/localização, áreas sociais, quartos, terraço/pátio e
    detalhes, conforme as fotos reais disponíveis.
-   Não rotule cômodos nem características que não possam ser
    identificados/confirmados.
-   Faça crop cuidadoso sem cortar elementos importantes.
-   Gere tamanhos responsivos e formatos modernos (AVIF/WebP com
    fallback, conforme stack).
-   Defina dimensões/aspect ratio para evitar CLS.
-   Lazy-load imagens fora da primeira dobra; não aplicar lazy-load à
    imagem principal LCP.
-   Teste mobile pequeno, mobile grande, tablet e desktop; botões e
    links devem ser confortáveis ao toque.
-   Garanta que textos não fiquem sobre áreas visualmente poluídas e que
    o CTA permaneça claro.
-   Respeite redução de movimento e acessibilidade.

Faça testes visuais e corrija overflow, cortes, saltos de layout e
problemas de navegação.

## Prompt 6 --- Painel administrativo seguro e limitado ao escopo

Implemente o painel administrativo contratado para **Residencial Estrela
Dalva**, respeitando o `CLAUDE.md` e a cláusula 3ª do contrato.

O painel é para editar conteúdo existente, não para gerir reservas.
Permita editar somente: - Títulos e textos predefinidos. - Imagem do
hero e fotos da galeria. - Textos dos diferenciais e informações
práticas confirmadas. - Link do Google Maps. - URLs externos de
Booking.com, Airbnb e Decolar. - Contato e Instagram, quando fornecidos.

Restrições: - Não permitir criar/remover páginas ou seções, mudar
layout, adicionar scripts/HTML, alterar componentes ou instalar
funcionalidades. - Autenticação real, autorização no backend e
persistência real. - Se usar BaaS, aplicar RLS/policies por usuário e
projeto; o proprietário só acessa este residencial. - Nunca usar segredo
privilegiado no frontend, senha hardcoded, login fake ou localStorage
como persistência de produção. - Upload com validação server-side de
tamanho, extensão, MIME e conteúdo; nome aleatório e armazenamento
privado/público conforme necessidade. - Sanitizar textos e validar URLs,
permitindo apenas protocolos https/http seguros e domínios esperados
para links de reserva/Maps. - Proteger sessão, limitar tentativas e
fornecer logout. - Interface com feedback de salvamento, erros, sessão
expirada e confirmação de alterações. - Documentar criação do primeiro
usuário e recuperação segura de acesso.

Se a hospedagem não suportar painel seguro por si só, integre serviço
externo compatível e documente os custos/limites necessários. Não finja
que um painel está protegido se a proteção só existir no frontend.

Não criar calendário de reservas, sincronização entre OTAs, tarifa
dinâmica ou Channel Manager.

## Prompt 7 --- SEO técnico, SEO local e indexação

Implemente SEO técnico completo para **Residencial Estrela Dalva**, sem
prometer ranking.

-   Title e meta description únicos, naturais e orientados a intenção de
    hospedagem.
-   Um H1 principal; headings em hierarquia lógica.
-   URL canônica e estável.
-   Open Graph e metadados sociais.
-   Sitemap XML e robots.txt corretos para o domínio de produção.
-   Schema.org apropriado ao tipo real de empreendimento, sem inventar
    preço, rating, review, endereço ou comodidades.
-   Alt text descritivo para fotos reais; alt vazio para imagens
    decorativas.
-   Links internos, links externos funcionais e textos âncora claros.
-   Conteúdo original que mencione naturalmente Residencial, Praia dos
    Ingleses, Florianópolis e Santa Catarina quando contextualizado.
-   Evite conteúdo duplicado com o outro residencial; cada site deve ter
    conteúdo próprio.
-   Verifique indexabilidade, canonical, status HTTP, redirects e
    ausência de `noindex` acidental.
-   Não bloquear recursos essenciais ao crawler.
-   Prepare favicon, manifest quando pertinente e compartilhamento
    social.

Use ferramentas disponíveis para validar sitemap, robots, metadados e
dados estruturados. Registre itens que dependam do domínio definitivo ou
de validação do cliente.

## Prompt 8 --- Segurança, privacidade e hardening

Faça uma revisão de segurança do site e painel de **Residencial Estrela
Dalva** e implemente correções.

Verifique: - Dependências vulneráveis e desnecessárias. - Segredos no
repositório, bundle, source maps públicos ou histórico recente. -
Autenticação, autorização e políticas de acesso. - Proteção de uploads e
storage. - XSS, injeção, URLs perigosas, CSRF quando aplicável e
validação de entrada no servidor. - Cookies/sessões e HTTPS. -
Cabeçalhos CSP, HSTS, Referrer-Policy, X-Content-Type-Options e
framing. - Mensagens de erro e logs sem dados sensíveis. - Rate limiting
ou controles equivalentes quando disponíveis. - Permissões mínimas e
separação entre este site e o outro residencial. - Formulários, se
existirem: coleta mínima, finalidade clara, validação e destino seguro.

Não declare "100% seguro". Diferencie o que foi testado, corrigido e o
que depende do provedor. Gere um relatório com risco, evidência,
correção e pendências. Rode auditorias disponíveis sem expor segredos.

## Prompt 9 --- Performance, acessibilidade e testes ponta a ponta

Otimize e teste **Residencial Estrela Dalva**.

Performance: - Medir e melhorar LCP, INP e CLS. - Otimizar imagens e
fontes. - Reduzir JavaScript, CSS e dependências. - Aplicar cache e
compressão compatíveis com hosting. - Evitar scripts de terceiros
desnecessários. - Não carregar mapa pesado automaticamente se um link
leve resolver. - Garantir carregamento rápido em conexão móvel.

Acessibilidade: - Navegação completa por teclado. - Foco visível. -
Labels e nomes acessíveis. - Contraste adequado. - Alt text correto. -
Galeria acessível. - Respeito a `prefers-reduced-motion`.

Testes: - Rodar build, lint, typecheck e testes. - Testar rotas, links
externos, Maps, CTA e galeria. - Testar painel: login, logout,
permissão, edição, upload, persistência, erros e sessão expirada. -
Testar em viewport mobile, tablet e desktop. - Verificar console,
network, 404, imagens quebradas e layout shift. - Se possível, rodar
Lighthouse/PageSpeed e registrar resultados reais; não inventar
pontuações.

Corrija os problemas encontrados e entregue relatório comparando
antes/depois quando houver medições.

## Prompt 10 --- Avaliação final, checklist de aceite e entrega

Faça uma auditoria final independente do site **Residencial Estrela
Dalva**, como se fosse um especialista externo contratado para aprovar a
entrega.

Avalie: 1. Qualidade visual e percepção premium em comparação com a
prévia do cliente. 2. Clareza da proposta de hospedagem e facilidade
para reservar. 3. Fidelidade de conteúdo e ausência de informações
inventadas. 4. Responsividade e experiência mobile. 5. Funcionamento dos
links Booking.com, Airbnb, Decolar e Google Maps. 6. Funcionamento real
do painel e limites de edição. 7. Segurança do frontend, backend,
autenticação, uploads e dados. 8. SEO técnico, indexação, metadados,
sitemap, robots e schema. 9. Performance, Core Web Vitals e imagens. 10.
Acessibilidade, compatibilidade e estabilidade. 11. Build, lint,
typecheck, testes e console sem erros críticos. 12. Documentação e
instruções de manutenção/deploy.

Classifique cada item como APROVADO, REPROVADO ou PENDENTE, com
evidência. Corrija todos os itens reprovados que estejam dentro do
escopo. Não esconda pendências que dependam do cliente, domínio ou
provedor.

Entregue: - Resumo executivo. - Checklist preenchido. - Lista de
informações ainda necessárias ao cliente. - Como publicar/deployar. -
Como criar/recuperar acesso ao painel. - Como editar textos e imagens. -
Variáveis de ambiente necessárias (nomes, sem valores secretos). -
Backups e procedimento de recuperação, se suportados. - Limitações
conhecidas. - Confirmação explícita de que não foi implementado Channel
Manager nem sincronização de reservas.

Só considere concluído quando os critérios de aceite do `CLAUDE.md`
forem atendidos ou as pendências estiverem claramente documentadas e
aprovadas.
