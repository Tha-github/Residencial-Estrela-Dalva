# Pendências — informações e fotos do proprietário

Itens necessários para publicar. Nenhum deles será preenchido por suposição.
Situação em 19/11/2026.

Na prévia pública do GitHub Pages, o que falta aparece em quadros tracejados (fotos) ou como "Pendente de configuração" (links das plataformas). Esses marcadores servem apenas para revisão: não são links ativos nem afirmações sobre o imóvel. O site segue `noindex` até a aprovação e o preenchimento dos dados obrigatórios. O build de produção é bloqueado enquanto faltar algum item obrigatório.

## Já confirmado e publicado na prévia

- Loft — Apartamento 104, identificação adicional Nº 31 (não é exibida como endereço)
- Capacidade: até 4 pessoas. Mezanino com cama de casal e cama de solteiro; piso inferior com sofá-cama
- Distâncias aproximadas: 450 m da Praia dos Ingleses e 200 m do Centrinho dos Ingleses
- Por perto: mercados, restaurantes, bares, shopping e farmácias
- Comodidades: cozinha completa (fogão a gás, micro-ondas, air fryer, geladeira, sanduicheira, liquidificador, jarra elétrica, utensílios), ar-condicionado, ventilador, churrasqueira e máquina de lavar roupa
- Check-in a partir das 14h; check-out até as 11h
- Reserva direta: WhatsApp +55 (48) 99947-1321 (abre conversa com mensagem inicial) e e-mail pereimamarcelo@gmail.com

## Obrigatórios para o lançamento

- [x] **Foto principal do banner**: entregue (`src/assets/fotos/banner.png`, vista de praia com costão). Pendente apenas confirmar se é a Praia dos Ingleses; até lá, o texto alternativo descreve a cena sem nomear o local.
- [x] **Fotos do loft** adicionadas à galeria a partir da pasta `src/assets/fotos`:
  - vista geral mostrando os dois níveis
  - ambientes integrados do piso inferior (aparece na seção "O loft")
  - mezanino (aparece na seção "O loft")
  - cozinha
  - área externa com churrasqueira (aparece na seção "Experiência")
  - fachada ou chegada
  - banheiro e detalhes, se desejado
- [x] **Link do anúncio no Booking.com**
- [x] **Link do anúncio no Airbnb**
- [ ] **Domínio definitivo** (com ou sem `www`)

## Opcionais (aparecem somente se fornecidos)

- [x] **Foto da região** adicionada à galeria (`Calçadão Noturno dos Ingleses.png`).
- [x] **Link do Google Maps do imóvel** recebido e cadastrado.
- [ ] **Endereço completo** para exibir no site
- [ ] **Regras da casa**
- [ ] **Link do anúncio na Decolar**, se ainda existir
- [ ] **Instagram**

### Como enviar as fotos

- **Originais:** os arquivos do celular ou da câmera, sem compressão de WhatsApp, sem filtro, sem marca d'água e sem texto.
- **Para cada foto:** dizer o que aparece nela, para escrever a descrição acessível (alt).
- **Só ambientes que existem de fato.** Nenhuma foto de banco de imagens ou de outro imóvel (inclusive do Residencial Ametista) será usada.

## Textos para aprovação

Escritos só com dados confirmados. Ficam em `src/data/residencial.json`.

- [ ] Banner: "Seu refúgio em Florianópolis, pertinho de tudo." e a descrição do loft
- [ ] Apresentação: "Um loft pensado para aproveitar cada momento" e os destaques
- [ ] Experiência: os cinco momentos do dia (acordar, praia, Centrinho, descanso, churrasqueira)
- [ ] Perguntas frequentes cadastradas. O proprietário poderá editar as perguntas e respostas existentes pelo painel. Nenhuma política de cancelamento, animais, estacionamento, taxas, roupa de cama ou toalhas foi incluída.

## SEO após o domínio

- [ ] Conferir resposta HTTP 200/404, redirects, canonical, robots, sitemap, favicon e dados estruturados.
- [ ] Se desejado, verificar o domínio no Google Search Console e enviar `sitemap.xml`.
