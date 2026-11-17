# Pendências — informações do cliente

Itens necessários para publicar. Nenhum deles será preenchido por suposição.
Situação em 16/11/2026.

## Obrigatórios para o lançamento

- [ ] **Fotos reais do imóvel**, em alta resolução: fachada, sala, cozinha, quarto/mezanino, banheiro, terraço e detalhes
- [ ] **Foto principal para o topo do site** (hero)
- [ ] **Descrição do imóvel**, aprovada pelo cliente
- [ ] **Capacidade máxima de hóspedes.** A prévia diz 1 quarto com cama de casal e uma de solteiro, mas o formulário aceita até 4 adultos e 3 crianças.
- [ ] **Número de quartos, camas e banheiros**
- [ ] **Comodidades confirmadas**, incluindo se existe **pátio externo** além do terraço
- [ ] **Horários de check-in e check-out**
- [ ] **Links dos anúncios** no Booking.com, Airbnb e Decolar
- [ ] **Link do Google Maps do imóvel**, ou confirmação do pin. O CEP 88058-193 corresponde à "**Servidão** Maria Tomasia Cabral", e não à "Rua", como diz a prévia. As coordenadas da prévia caem nessa via, mas o número 31 não foi verificado.
- [ ] **Domínio definitivo**

## SEO — domínio e aprovações pendentes

- [ ] Confirmar o domínio HTTPS definitivo e a variante canônica (com ou sem `www`). O build de produção usa essa origem para canonical, Open Graph e sitemap; configurar redirect permanente da variante secundária e HTTP → HTTPS na hospedagem.
- [ ] Aprovar title e meta description da página inicial junto com os textos do residencial já listados abaixo.
- [ ] Enviar fotos reais e descrições do que aparece em cada imagem. Até lá, o compartilhamento social usa um card gráfico de marca, não uma foto do imóvel.
- [ ] Após publicação no domínio, conferir resposta HTTP 200/404, redirects, canonical, robots, sitemap, favicon e dados estruturados em ferramentas de inspeção dos crawlers. Isso depende do domínio ativo e do conteúdo mínimo confirmado.
- [ ] Se desejado, verificar o domínio no Google Search Console e enviar `sitemap.xml` após o lançamento.

O site não instala manifest/PWA: não é uma aplicação instalável e isso não ajuda a navegação institucional atual.

### Como enviar as fotos

- **Originais:** os arquivos do celular ou da câmera, sem compressão de WhatsApp, sem filtro, sem marca d'água e sem texto.
- **Foto do hero:** horizontal e luminosa. Ela precisa funcionar também cortada na vertical no celular.
- **O que fotografar:** fachada ou chegada, sala, cozinha, quarto ou mezanino, banheiro, terraço ou área externa e detalhes. Só os ambientes que existem de fato.
- **Para cada foto:** dizer o que aparece nela, para escrever a descrição acessível (alt). Indicar também se pode haver legenda.

## Opcionais (aparecem somente se fornecidos)

- [ ] Regras da casa
- [ ] Endereço completo para exibir no site
- [ ] Instagram
- [ ] WhatsApp, com DDI e DDD
- [ ] E-mail de contato

## Textos para aprovação do cliente

Escritos só com dados confirmados: nome, Praia dos Ingleses, Florianópolis/SC, proximidade com o mar e reserva por plataformas externas. O cliente pode aprovar ou substituir. Ficam em `src/data/residencial.json`.

- [ ] **Frase do topo (hero):** "Perto do mar, no norte da Ilha de Santa Catarina."
- [ ] **Apresentação:** título "Hospedagem na Praia dos Ingleses" e dois parágrafos.
- [ ] **Diferenciais:** "Perto do mar" e "Norte da Ilha".
  - Se o terraço e o pátio externo forem confirmados, entram como novos diferenciais.
  - Se a distância até a praia for confirmada (a prévia fala em 450 m), pode substituir o texto genérico "fica próxima".

## Decisões do cliente

- [ ] **WhatsApp:** usar só um botão de contato (recomendado) ou o formulário de datas da prévia? O formulário não pode prometer disponibilidade.
- [ ] **Avaliações do Booking:** autorizar a citação da nota com link para a fonte? Os depoimentos com nome de hóspede exigem cuidado.
- [ ] **Nomes dos anfitriões** (Marcelo e Ângela): autorizar exibição?
- [ ] **Informações a confirmar:**
  - "Recepção 24 horas" contradiz "chegada combinada com o anfitrião";
  - distâncias de 450 m até a praia e 38 km até o aeroporto.
