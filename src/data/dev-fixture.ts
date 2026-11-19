/**
 * DADOS DE EXEMPLO — SOMENTE para a prévia de desenvolvimento (/dev/previa/completa).
 * Servem para revisar o layout com todas as seções e fotos preenchidas.
 * Nada aqui é informação nova do imóvel: as fotos são placeholders rotulados
 * "EXEMPLO" (src/assets/dev, gerados por scripts/generate-dev-placeholders.mjs)
 * e links/textos fictícios levam "[exemplo]" ou domínios de exemplo.
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
    ...real.hero,
    image: ph('hero', 'foto do banner', { focus: '70% 40%' }),
  },
  // Cadastradas fora de ordem de propósito: a galeria ordena por grupo.
  gallery: [
    ph('03', 'foto 03 (grupo externa)', { group: 'externa', focus: '25% 60%' }),
    ph('01', 'foto 01 (grupo fachada)', { group: 'fachada' }),
    ph('02', 'foto 02 (grupo integrado, retrato)', { group: 'integrado', focus: '50% 30%' }),
    ph('04', 'foto 04 (grupo mezanino, quadrada)', { group: 'mezanino', caption: '[exemplo] Legenda opcional confirmada' }),
    ph('05', 'foto 05 (grupo cozinha, retrato)', { group: 'cozinha', focus: '50% 70%' }),
    ph('06', 'foto 06 (grupo regiao)', { group: 'regiao', focus: '75% 45%' }),
    ph('07', 'foto 07 (sem grupo)'),
  ],
  practical: {
    ...real.practical,
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
    ...real.contact,
    instagram: 'https://www.instagram.com/exemplo',
  },
};
