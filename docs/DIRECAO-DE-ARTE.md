# Direção de arte — Residencial Estrela Dalva

**Conceito: "a primeira luz em Ingleses".** A Estrela-d'Alva é o nome popular da estrela da manhã, a última que some no céu quando o dia nasce. O site usa essa ideia como assinatura discreta:
- o mar profundo, que vai clareando para a areia;
- um único toque de cor quente da aurora;
- uma pequena estrela de quatro pontas como marca.

O conceito vem do **nome** do residencial. Não é uma afirmação sobre o imóvel: não dizemos que há vista para o nascer do sol, por exemplo.

**Tom:** sofisticado, acolhedor, contemporâneo e costeiro. A referência é revista de viagem, não portal de reservas. Muito espaço em branco, fotografia grande e pouca decoração.

**Ver tudo implementado:** `npm run dev` e abrir `http://localhost:4321/dev/estilo`. Essa página só existe em desenvolvimento.

---

## 1. Avaliação da prévia do cliente

| O que fazer | Elemento | Por quê |
|---|---|---|
| **Manter** | Hierarquia geral: hero, apresentação, planta por andar, região, localização, FAQ e CTA final | A ordem é boa e guia para a decisão |
| **Manter** | Barra de CTA fixa no mobile | Ajuda a converter. Será reavaliada no Prompt 5 para não cobrir conteúdo. |
| **Manter** | Ideia da planta por andar (mezanino, térreo, área externa) | Explica bem um loft duplex, se o cliente confirmar os dados |
| **Elevar** | Hero | Na prévia é texto longo sobre fundo genérico. Aqui é foto real em tela cheia, nome em serifa grande, localização e um único CTA. |
| **Elevar** | Tipografia | Passa a ter um par com personalidade (serifa editorial e sans humanista), em vez de visual de template |
| **Elevar** | Fotografia | Fotos reais do imóvel com papel de protagonista. Fotos da região, se usadas, ficam em papel secundário e com crédito. |
| **Elevar** | Diferenciais | Cards sóbrios com ícone de linha, sem faixas repetidas |
| **Descartar** | Notas e depoimentos do Booking como peça visual central | Parecem cópia do Booking.com, os dados ficam desatualizados e dependem de autorização |
| **Descartar** | Formulário de datas e "consultar disponibilidade" | Sugere um motor de reservas, que está fora do escopo |
| **Descartar** | Linha do tempo "5h30 / 6h / 9h" | Apresenta como fato algo que depende da estação do ano |
| **Descartar** | Fotos carregadas da pasta do Ametista | Duplicam conteúdo e não são do imóvel |
| **Descartar** | Links `href="#"` | Botão sem destino real não é publicado |

## 2. Paleta

| Papel | Token | Hex | Origem |
|---|---|---|---|
| Fundo | `--sand-50` | `#fbf8f2` | Areia clara, quase branca |
| Seção alternada | `--sand-100` | `#f3ece0` | Areia |
| Bordas | `--sand-200` | `#e5d9c7` | Areia úmida |
| Decorativo | `--sand-400` | `#c8b497` | Areia seca. **Não usar em texto** (1,9:1). |
| Texto | `--graphite-900` | `#1e2225` | Grafite |
| Texto secundário | `--graphite-500` | `#5a6167` | Grafite claro |
| Títulos | `--sea-900` | `#10313a` | Mar profundo |
| Ação e links | `--sea-700` | `#1d5363` | Mar |
| Hover | `--sea-800` | `#163f4b` | Mar mais fundo |
| Fundo suave de ação | `--sea-100` | `#e0ebed` | Espuma |
| Assinatura | `--dawn-500` | `#b27a45` | Aurora. Só na estrela e em texto grande (3,4:1). |

**Contraste:** todos os pares de texto passam no nível AA. Os valores calculados aparecem em `/dev/estilo`, e o teste `tests/unit/contrast.test.ts` falha se algum par em uso cair abaixo do mínimo. Isso inclui o texto branco sobre o véu do hero, calculado no pior caso: foto totalmente branca.

**Pendente:** conferir a paleta contra as fotos reais. Se as fotos tiverem dominante quente (madeira, piso bege), ajustar `--sand-*` e `--dawn-500`. Se tiverem azul forte (a prévia cita um "sofá azul"), conferir se `--sea-700` combina ou briga com ele. Só os valores mudam: os nomes dos tokens ficam.

## 3. Tipografia

- **Newsreader** (mesma do Residencial Ametista): títulos, pesos 400/500 e itálico 400. O itálico dá ênfase a um trecho de cada título, como no Ametista. Ver D13 em DECISOES.md.
- **Figtree**: texto e interface. Fonte variável com pesos de 400 a 600, aberta, legível em tamanhos pequenos e com cobertura completa do português.
- **Hospedagem:** as fontes ficam no próprio site, a partir de pacotes npm com versão fixa. Não há chamada ao Google Fonts, o que ajuda na privacidade, na CSP e na performance. O Astro gera uma fonte de fallback com métricas ajustadas, o que reduz o CLS, e faz preload só do que aparece acima da dobra. São cerca de 62 KB no total.
- **Escala fluida:** de razão ~1,25 no mobile a ~1,33 no desktop (`--text-xs` … `--text-display`). Há um único H1 por página, o nome do residencial. H2 em serifa. H3 e H4 em sans 600.

## 4. Grid, espaço e layout

- **Grid:** 4 colunas no mobile, 8 a partir de 768px e 12 a partir de 1024px (`.grid`), com gap fluido.
- **Containers:** 72rem para o conteúdo, 88rem no modo largo e 64ch para texto corrido. As margens laterais variam de 1,25rem a 3rem.
- **Ritmo:** base de 4px (`--space-1` … `--space-10`). O espaço entre seções varia de 4rem a 8rem.
- **Breakpoints:** 480, 768, 1024 e 1280, sempre mobile first.

## 5. Componentes-base

Ficam em `src/components/`.

| Componente | Notas |
|---|---|
| `ui/Button` | Variantes `primary`, `secondary`, `on-image` e `quiet`. Altura mínima de 44px. Links externos abrem em nova aba com `rel="noopener noreferrer"` e avisam o leitor de tela. |
| `ui/Card` | Variantes `surface` e `outline`, com ícone opcional. A elevação no hover só aparece quando o card é clicável. |
| `ui/Section` | Eyebrow com a estrela, título obrigatório (`aria-labelledby`), introdução opcional e tom alternado |
| `ui/Icon` | 14 ícones de linha próprios (24px, traço 1,5, `currentColor`), mais a estrela da marca. Decorativos por padrão. |
| `layout/Header` | Fixo no topo, com marca, navegação curta e CTA. No mobile, sem JS a navegação vira uma linha rolável. Com JS vira menu recolhível (`aria-expanded`, Esc fecha e devolve o foco). |
| `sections/Hero` | Foto em tela cheia com véu escuro na base. **Sem foto real:** em produção usa o fundo de marca (mar e aurora), nunca uma foto genérica; em desenvolvimento usa um placeholder listrado e rotulado. Frase de destaque e subtítulo só aparecem se houver texto confirmado. O CTA de reserva só aparece se existir pelo menos um link de plataforma. |
| `dev/DevPlaceholder`, `dev/PendingContent` | Só em desenvolvimento. O build não emite nem HTML nem CSS deles, o que foi verificado. |

**A definir nos próximos prompts:**
- **Galeria:** grid com proporções fixas (`--ratio-*`) e lightbox acessível no Prompt 5.
- **Footer e seções de conteúdo:** Prompt 4.

## 6. Estados interativos

- **Foco:** anel de 3px em `--color-focus`, com afastamento de 3px. Em fundo escuro o anel é branco.
- **Hover:** links engrossam o sublinhado. Botões escurecem e a seta anda 3px. Cards clicáveis sobem 3px.
- **Active:** o botão desce 1px.
- **Seleção de texto:** fundo `--sea-100`.

## 7. Movimento

- **Entrada do hero:** sobe 12px e aparece em 700ms, em cascata.
- **Seções:** revelação suave ao rolar, via CSS scroll-driven animations, sem JavaScript. Em navegadores sem suporte, o conteúdo aparece normalmente.
- **`prefers-reduced-motion: reduce`:** zera as durações e desliga as animações de entrada. Isso tem teste E2E.
- **Impressão:** as animações são desligadas.

## 8. Fotografia (diretrizes para o cliente e para o Prompt 5)

- **Ordem da narrativa:** fachada ou chegada, sala, cozinha, mezanino ou quarto, banheiro, terraço ou área externa, detalhes. Só incluir os cômodos que as fotos realmente mostrarem.
- **Hero:** foto horizontal e luminosa, com área de céu ou parede neutra para o texto. Precisa funcionar também no recorte vertical de 4:5 do mobile.
- **Arquivos:** originais em alta resolução, sem filtros fortes, sem marca d'água e sem texto sobreposto.
- **Proibido:** foto genérica ou de banco de imagens apresentada como se fosse do imóvel.
