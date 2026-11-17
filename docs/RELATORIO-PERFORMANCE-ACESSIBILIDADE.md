# Relatório de performance, acessibilidade e testes

**Revisão:** 17/11/2026. Ambiente local de desenvolvimento e build estático. Não representa medições de usuários reais ou do domínio de produção.

## O que já está implementado

- Astro gera imagens responsivas em AVIF/WebP com fallback, dimensões explícitas e lazy loading nas miniaturas. A imagem do hero recebe prioridade alta e não usa lazy loading.
- Fontes Figtree e Instrument Serif são locais; não há requisição a CDN de fontes. Não há mapa incorporado nem scripts de terceiros. A localização usa link leve para Google Maps.
- CSS e JavaScript são servidos como ativos locais; o build continua gerando `_headers`, mas GitHub Pages não interpreta essa configuração Cloudflare. Cache e compressão dependem do GitHub Pages e não foram medidos em produção.
- Estilos definem foco visível, link para pular ao conteúdo, nomes acessíveis, alt textual para imagens, lightbox operável por teclado e regras para `prefers-reduced-motion`.

## Verificações e medições desta revisão

- `npm run validate`: passou (lint, typecheck, 64 testes unitários, build e validação SEO).
- Playwright: 41 casos mostrados como aprovados. Cobrem mobile 320/390, tablet 768 e desktop 1440; overflow, erros de console, links internos/externos, CTA de reserva, galeria, teclado, foco, movimento reduzido, carregamento da imagem hero e estabilidade de layout.
- Os testes de CLS em 360 px e 1440 px passaram com limite `< 0,05` durante carga e rolagem. `docs/DECISOES.md` registra baseline de 0,088 em 360 px antes da correção e resultado abaixo de 0,05 depois; a suíte atual só verifica o limite e não grava o valor posterior exato.
- Build atual: 14 arquivos, 231.652 bytes no total, incluindo HTML, fontes, CSS, imagens e metadados. É o tamanho descomprimido no disco, não o tamanho transferido pela rede.
- Não foi gerada medição Lighthouse/PageSpeed. LCP e INP numéricos não foram medidos. Sem domínio e fotos reais, uma pontuação local não representaria o conteúdo/hosting final.

## Pendências

- Medir LCP, INP e CLS no domínio publicado com fotos reais, em Lighthouse/PageSpeed e, após tráfego, dados de campo. Não há baseline anterior comparável nesta revisão.
- Validar compressão, cache e headers na resposta real do GitHub Pages.
- O painel backend atual não pode ser testado em GitHub Pages, pois o provedor é estático; `/admin/` informa que a edição ocorre via repositório.
- Os links externos foram conferidos quanto a URL e atributos seguros na prévia; não foi feita validação de disponibilidade dos serviços externos.
- O Playwright imprimiu os 41 casos como `ok`, mas o processo não apresentou resumo/código de saída final antes de ser interrompido. Registrar uma execução final com encerramento normal quando o ambiente E2E estiver disponível.

## Comparação antes/depois

Há baseline histórico de CLS 0,088 e critério posterior `<0,05` em 360 px, mas não o valor posterior exato nem bytes transferidos da rede. Não há medições anteriores de LCP/INP. A correção de segurança desta revisão mudou a ordem de autenticação/rate limit no backend; não altera a renderização pública. Nenhuma pontuação de performance foi inferida ou inventada.
