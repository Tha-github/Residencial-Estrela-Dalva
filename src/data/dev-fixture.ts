/**
 * DADOS DE EXEMPLO — SOMENTE para a prévia de desenvolvimento (/dev/previa/completa).
 * Servem para revisar o layout com todas as seções preenchidas.
 * Nada aqui é informação do imóvel: textos levam "[exemplo]", números e links
 * são fictícios, e as imagens (src/assets/dev) são placeholders rotulados
 * "EXEMPLO", gerados por scripts/generate-dev-placeholders.mjs.
 * Nunca importar este arquivo em páginas públicas.
 */
import real from './residencial.json';

const ph = (n: string, alt: string, extra: Record<string, unknown> = {}) => ({
  src: `/dev/exemplo-${n}.jpg`,
  alt: `[exemplo] ${alt}`,
  ...extra,
});

export const devFixture = {
  ...real,
  hero: {
    title: '[exemplo] Frase curta de proposta de valor',
    subtitle: '[exemplo] Subtítulo opcional com uma informação concreta e confirmada.',
    image: ph('hero', 'foto do hero', { focus: '70% 40%' }),
  },
  about: {
    title: '[exemplo] Título da apresentação',
    paragraphs: [
      '[exemplo] Primeiro parágrafo de apresentação. Aqui entra a descrição aprovada pelo cliente, com o que torna o residencial uma boa escolha para a estadia.',
      '[exemplo] Segundo parágrafo, mais curto, com informações complementares confirmadas.',
    ],
  },
  // Cadastradas fora de ordem de propósito: a galeria ordena por grupo.
  gallery: [
    ph('03', 'foto 03 (grupo externa)', { group: 'externa', focus: '25% 60%' }),
    ph('01', 'foto 01 (grupo fachada)', { group: 'fachada' }),
    ph('02', 'foto 02 (grupo social, retrato)', { group: 'social', focus: '50% 30%' }),
    ph('04', 'foto 04 (grupo quartos, quadrada)', { group: 'quartos', caption: '[exemplo] Legenda opcional confirmada' }),
    ph('05', 'foto 05 (grupo social, retrato)', { group: 'social', focus: '50% 70%' }),
    ph('06', 'foto 06 (grupo detalhes)', { group: 'detalhes', focus: '75% 45%' }),
    ph('07', 'foto 07 (sem grupo)'),
  ],
  highlights: [
    { title: '[exemplo] Diferencial 1', text: '[exemplo] Texto curto e verificável sobre o diferencial.', icon: 'waves' },
    { title: '[exemplo] Diferencial 2', text: '[exemplo] Texto curto e verificável sobre o diferencial.', icon: 'map-pin' },
    { title: '[exemplo] Diferencial 3', text: '[exemplo] Texto curto e verificável sobre o diferencial.', icon: 'star' },
  ],
  practical: {
    maxGuests: 9,
    bedrooms: 9,
    beds: 9,
    bathrooms: 9,
    areaM2: 99,
    checkIn: '00:00',
    checkOut: '00:00',
    amenities: ['[exemplo] Comodidade A', '[exemplo] Comodidade B', '[exemplo] Comodidade C', '[exemplo] Comodidade D'],
    rules: ['[exemplo] Regra da casa 1', '[exemplo] Regra da casa 2'],
  },
  location: {
    ...real.location,
    address: '[exemplo] Endereço a confirmar',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=exemplo',
  },
  booking: {
    booking: 'https://www.booking.com/exemplo',
    airbnb: 'https://www.airbnb.com.br/exemplo',
    decolar: 'https://www.decolar.com/exemplo',
  },
  contact: {
    instagram: 'https://www.instagram.com/exemplo',
    whatsapp: '5500000000000',
    email: 'exemplo@example.com',
  },
};
