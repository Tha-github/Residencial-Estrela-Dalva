/** Campos editáveis do Residencial Estrela Dalva para o Top Site Admin Kit. */
import { SELF, type SiteSpec } from '../admin-kit/spec';
import { CONTENT_ICONS, GALLERY_GROUPS } from '../lib/content/schema';
import { themeKeys, themeLabels } from '../lib/theme';

const iconLabels: Record<string, string> = {
  users: 'Hóspedes', waves: 'Praia', bag: 'Comércio', layers: 'Ambientes', levels: 'Níveis',
  pot: 'Cozinha', snowflake: 'Ar-condicionado', fan: 'Ventilador', flame: 'Churrasqueira',
  washer: 'Lavanderia', sun: 'Sol', moon: 'Lua', walk: 'Caminhada', home: 'Casa', star: 'Estrela',
  check: 'Confirmação', 'map-pin': 'Localização',
};
const icons = CONTENT_ICONS.map((value) => ({ value, label: iconLabels[value] ?? value }));
const targetOptions = [
  { value: 'booking', label: 'Reservas' },
  { value: 'loft', label: 'Apresentação do loft' },
  { value: 'gallery', label: 'Fotos do loft' },
  { value: 'location', label: 'Localização' },
];
const photoGroups = GALLERY_GROUPS.map((value) => ({ value, label: ({ fachada: 'Fachada', integrado: 'Ambientes integrados', mezanino: 'Mezanino', cozinha: 'Cozinha', externa: 'Área externa', regiao: 'Região', detalhes: 'Detalhes' })[value] }));

export const estrelaDalvaSpec: SiteSpec = {
  siteName: 'Residencial Estrela Dalva',
  siteUrl: 'https://tha-github.github.io/Residencial-Estrela-Dalva/',
  contentPath: 'src/data/residencial.json',
  photosDir: 'src/assets/fotos',
  uploadsSubdir: 'uploads',
  imagePrefix: '/fotos/',
  modules: [
    {
      id: 'inicio', title: 'Página inicial e banner', icon: 'home',
      description: 'Edite o texto, a foto, os destaques e os botões do banner.',
      fields: [
        { key: 'hero.image', type: 'image', label: 'Foto principal do banner', optional: true },
        { key: 'hero.title', type: 'text', label: 'Título principal', max: 120, help: 'Coloque entre asteriscos o trecho que deve aparecer em itálico.' },
        { key: 'hero.subtitle', type: 'textarea', label: 'Descrição', max: 280, rows: 3 },
        { key: 'hero.primaryLabel', type: 'text', label: 'Texto do botão principal', max: 40 },
        { key: 'hero.primaryTarget', type: 'select', label: 'Destino do botão principal', options: targetOptions },
        { key: 'hero.secondaryLabel', type: 'text', label: 'Texto do segundo botão', max: 40 },
        { key: 'hero.secondaryTarget', type: 'select', label: 'Destino do segundo botão', options: targetOptions },
        { key: 'hero.highlights', type: 'list', label: 'Informações de destaque', mode: 'fixed', itemLabel: '{text}', item: [
          { key: 'icon', type: 'icon', label: 'Ícone', options: icons },
          { key: 'text', type: 'text', label: 'Texto', max: 60 },
        ] },
      ],
    },
    {
      id: 'loft', title: 'Apresentação do loft', icon: 'text', anchor: 'o-loft',
      description: 'Texto de apresentação e organização das fotos existentes.',
      fields: [
        { key: 'about.title', type: 'text', label: 'Título', max: 120 },
        { key: 'about.paragraphs', type: 'paragraphs', label: 'Descrição', max: 1200, maxItems: 6 },
        { key: 'features', type: 'list', label: 'Destaques da apresentação', mode: 'fixed', itemLabel: '{title}', item: [
          { key: 'title', type: 'text', label: 'Título', max: 80 },
          { key: 'text', type: 'textarea', label: 'Descrição', max: 200, rows: 2, optional: true },
        ] },
        { key: 'gallery', type: 'list', label: 'Fotos do loft', help: 'Reordene, substitua ou remova fotos. A ordem também é usada na galeria.', mode: 'editable', min: 0, max: 60, identity: 'src', itemLabel: '{alt}', newItem: { src: '', alt: '', group: 'detalhes', caption: null }, item: [
          { key: SELF, type: 'image', label: 'Foto' },
          { key: 'group', type: 'select', label: 'Categoria da foto', options: photoGroups },
          { key: 'caption', type: 'text', label: 'Legenda', max: 140, optional: true },
        ] },
        { key: 'copy.galleryTitle', type: 'text', label: 'Título da galeria', max: 120 },
      ],
    },
    {
      id: 'acomodacoes', title: 'Acomodações e capacidade', icon: 'home', anchor: 'acomodacao',
      description: 'Edite os textos das camas existentes e a capacidade máxima.',
      fields: [
        { key: 'practical.maxGuests', type: 'number', label: 'Capacidade máxima', min: 1, max: 4, suffix: 'pessoas' },
        { key: 'sleeping', type: 'list', label: 'Acomodações', mode: 'fixed', itemLabel: '{level}', item: [
          { key: 'level', type: 'text', label: 'Piso', max: 60 },
          { key: 'detail', type: 'text', label: 'Ambiente', max: 60, optional: true },
          { key: 'beds', type: 'list', label: 'Camas', mode: 'fixed', itemLabel: '{label}', item: [
            { key: 'type', type: 'select', label: 'Tipo', options: [{ value: 'casal', label: 'Cama de casal' }, { value: 'solteiro', label: 'Cama de solteiro' }, { value: 'sofa-cama', label: 'Sofá-cama' }] },
            { key: 'label', type: 'text', label: 'Descrição', max: 60 },
          ] },
        ] },
        { key: 'copy.sleepingTitle', type: 'text', label: 'Título da seção', max: 120 },
        { key: 'copy.sleepingIntro', type: 'textarea', label: 'Descrição da seção', max: 300, rows: 2 },
      ],
    },
    {
      id: 'comodidades', title: 'Estrutura e comodidades', icon: 'list', anchor: 'comodidades',
      description: 'Edite as categorias e os itens existentes, sem alterar a estrutura.',
      fields: [
        { key: 'copy.amenitiesTitle', type: 'text', label: 'Título da seção', max: 120 },
        { key: 'copy.amenitiesIntro', type: 'textarea', label: 'Descrição da seção', max: 300, rows: 2 },
        { key: 'amenities', type: 'list', label: 'Categorias e itens', mode: 'fixed', itemLabel: '{title}', item: [
          { key: 'title', type: 'text', label: 'Nome da categoria', max: 60 },
          { key: 'items', type: 'strings', label: 'Itens', mode: 'fixed', max: 60, itemLabel: 'Comodidade' },
        ] },
      ],
    },
    {
      id: 'localizacao', title: 'Localização e região', icon: 'pin', anchor: 'localizacao',
      description: 'Edite as distâncias, informações da região, endereço e link do mapa.',
      fields: [
        { key: 'copy.locationTitle', type: 'text', label: 'Título', max: 120 },
        { key: 'copy.locationIntro', type: 'textarea', label: 'Descrição', max: 400, rows: 3 },
        { key: 'distances', type: 'list', label: 'Distâncias aproximadas', mode: 'fixed', itemLabel: '{place}', item: [
          { key: 'place', type: 'text', label: 'Local', max: 80 },
          { key: 'meters', type: 'number', label: 'Distância', min: 1, max: 50000, suffix: 'metros' },
        ] },
        { key: 'location.nearby', type: 'strings', label: 'Informações sobre a região', mode: 'fixed', max: 40, itemLabel: 'Local ou serviço' },
        { key: 'location.address', type: 'text', label: 'Endereço', max: 200, optional: true },
        { key: 'location.mapsUrl', type: 'url', label: 'Link do Google Maps', optional: true },
      ],
    },
    {
      id: 'experiencia', title: 'Experiência de hospedagem', icon: 'sun', anchor: 'experiencia',
      description: 'Edite o texto e os momentos de experiência existentes.',
      fields: [
        { key: 'experience.title', type: 'text', label: 'Título', max: 120 },
        { key: 'experience.intro', type: 'textarea', label: 'Descrição', max: 400, rows: 3 },
        { key: 'experience.moments', type: 'list', label: 'Momentos', mode: 'fixed', itemLabel: '{title}', item: [
          { key: 'title', type: 'text', label: 'Título', max: 60 },
          { key: 'text', type: 'textarea', label: 'Descrição', max: 220, rows: 3 },
        ] },
      ],
    },
    {
      id: 'praticas', title: 'Informações práticas', icon: 'info', anchor: 'informacoes',
      description: 'Capacidade, horários de entrada e saída e regras existentes.',
      fields: [
        { key: 'practical.maxGuests', type: 'number', label: 'Capacidade máxima', min: 1, max: 4, suffix: 'pessoas' },
        { key: 'practical.checkIn', type: 'text', label: 'Check-in', max: 5 },
        { key: 'practical.checkOut', type: 'text', label: 'Check-out', max: 5 },
        { key: 'practical.rules', type: 'strings', label: 'Informações práticas', mode: 'fixed', max: 200, itemLabel: 'Informação' },
        { key: 'copy.practicalTitle', type: 'text', label: 'Título da seção', max: 120 },
      ],
    },
    {
      id: 'duvidas', title: 'Dúvidas frequentes', icon: 'help', anchor: 'duvidas',
      description: 'Edite as perguntas e respostas cadastradas.',
      fields: [
        { key: 'copy.faqTitle', type: 'text', label: 'Título da seção', max: 120 },
        { key: 'faq', type: 'list', label: 'Perguntas e respostas', mode: 'fixed', itemLabel: '{question}', item: [
          { key: 'question', type: 'text', label: 'Pergunta', max: 160 },
          { key: 'answer', type: 'textarea', label: 'Resposta', max: 600, rows: 3 },
        ] },
      ],
    },
    {
      id: 'reservas', title: 'Reservas e contatos', icon: 'calendar', anchor: 'reservas',
      description: 'Links de reserva e canais de contato do proprietário.',
      fields: [
        { key: 'copy.bookingTitle', type: 'text', label: 'Título da seção', max: 120 },
        { key: 'copy.bookingIntro', type: 'textarea', label: 'Descrição', max: 300, rows: 2 },
        { key: 'booking.booking', type: 'url', label: 'Link do Booking.com', optional: true },
        { key: 'booking.airbnb', type: 'url', label: 'Link do Airbnb', optional: true },
        { key: 'booking.buttonPrefix', type: 'text', label: 'Texto dos botões de reserva', max: 30 },
        { key: 'contact.whatsapp', type: 'whatsapp', label: 'WhatsApp', optional: true },
        { key: 'contact.whatsappMessage', type: 'textarea', label: 'Mensagem inicial do WhatsApp', max: 300, rows: 2, optional: true },
        { key: 'contact.email', type: 'email', label: 'E-mail de contato', optional: true },
      ],
    },
    {
      id: 'cores', title: 'Cores do site', icon: 'palette',
      description: 'Altere as cores autorizadas. Fontes, espaçamentos e layout permanecem iguais.',
      fields: themeKeys.map((key) => ({ key: `theme.${key}`, type: 'color' as const, label: themeLabels[key].label, help: themeLabels[key].help })),
    },
  ],
};
