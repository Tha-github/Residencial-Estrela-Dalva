import type { Residencial } from './schema';

export interface NavItem {
  href: string;
  label: string;
}

/** IDs das seções (âncoras estáveis — usadas em links internos e no painel). */
export const SECTION_IDS = {
  about: 'o-residencial',
  gallery: 'fotos',
  highlights: 'diferenciais',
  practical: 'informacoes',
  location: 'localizacao',
  booking: 'reservas',
  contact: 'contato',
} as const;

type PlatformId = 'booking' | 'airbnb' | 'decolar';

export interface BookingPlatform {
  id: PlatformId;
  name: string;
  /** Preposição + artigo: "no Airbnb", "na Decolar". */
  inName: string;
  /** "pelo Airbnb", "pela Decolar". */
  byName: string;
  url: string;
}

const PLATFORMS: Record<PlatformId, { name: string; feminine: boolean }> = {
  booking: { name: 'Booking.com', feminine: false },
  airbnb: { name: 'Airbnb', feminine: false },
  decolar: { name: 'Decolar', feminine: true },
};

/** Plataformas com link confirmado, na ordem fixa Booking.com → Airbnb → Decolar. */
export function getBookingPlatforms(c: Residencial): BookingPlatform[] {
  return (Object.keys(PLATFORMS) as PlatformId[]).flatMap((id) => {
    const url = c.booking[id];
    if (!url) return [];
    const { name, feminine } = PLATFORMS[id];
    return [{ id, name, url, inName: `${feminine ? 'na' : 'no'} ${name}`, byName: `${feminine ? 'pela' : 'pelo'} ${name}` }];
  });
}

export function whatsappUrl(digits: string): string {
  return `https://wa.me/${digits}`;
}

/** Formata 5548999999999 → +55 (48) 99999-9999 (apenas para exibição). */
export function formatWhatsapp(digits: string): string {
  const m = /^(\d{2})(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
  return m ? `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}` : `+${digits}`;
}

export function instagramHandle(url: string): string {
  const handle = new URL(url).pathname.split('/').filter(Boolean)[0];
  return handle ? `@${handle}` : 'Instagram';
}

export interface Visibility {
  about: boolean;
  gallery: boolean;
  highlights: boolean;
  practical: boolean;
  location: boolean;
  booking: boolean;
  contact: boolean;
}

/** Quais seções têm dados suficientes para aparecer. */
export function getVisibility(c: Residencial): Visibility {
  const p = c.practical;
  return {
    about: c.about.paragraphs.length > 0,
    gallery: c.gallery.length > 0,
    highlights: c.highlights.length > 0,
    practical:
      [p.maxGuests, p.bedrooms, p.beds, p.bathrooms, p.areaM2, p.checkIn, p.checkOut].some((v) => v !== null) ||
      p.amenities.length > 0 ||
      p.rules.length > 0,
    location: Boolean(c.location.mapsUrl || c.location.address),
    booking: getBookingPlatforms(c).length > 0,
    contact: Boolean(c.contact.instagram || c.contact.whatsapp || c.contact.email),
  };
}

/** Ordem fixa das seções na página. */
export const SECTION_ORDER = ['about', 'gallery', 'highlights', 'practical', 'location', 'booking', 'contact'] as const;
export type SectionKey = (typeof SECTION_ORDER)[number];

/**
 * Fundo alternado (areia clara / areia) entre as seções visíveis, para que duas
 * seções vizinhas nunca tenham o mesmo fundo, qualquer que seja o conteúdo disponível.
 */
export function getSectionTones(v: Visibility): Record<SectionKey, 'default' | 'alt'> {
  let i = 0;
  const tones = {} as Record<SectionKey, 'default' | 'alt'>;
  for (const key of SECTION_ORDER) {
    tones[key] = i % 2 === 0 ? 'default' : 'alt';
    if (v[key]) i++;
  }
  return tones;
}

/** Navegação curta: só seções visíveis, no máximo 5 itens. */
export function getNavItems(v: Visibility): NavItem[] {
  const items: Array<[boolean, NavItem]> = [
    [v.about, { href: `#${SECTION_IDS.about}`, label: 'O residencial' }],
    [v.gallery, { href: `#${SECTION_IDS.gallery}`, label: 'Fotos' }],
    [v.practical, { href: `#${SECTION_IDS.practical}`, label: 'Informações' }],
    [v.location, { href: `#${SECTION_IDS.location}`, label: 'Localização' }],
    [v.contact, { href: `#${SECTION_IDS.contact}`, label: 'Contato' }],
  ];
  return items.filter(([show]) => show).map(([, item]) => item);
}

/** Fatos numéricos confirmados, prontos para exibição. */
export function getKeyFacts(c: Residencial): Array<{ value: string; label: string }> {
  const p = c.practical;
  const facts: Array<{ value: string; label: string } | null> = [
    p.maxGuests !== null ? { value: String(p.maxGuests), label: p.maxGuests === 1 ? 'hóspede' : 'hóspedes' } : null,
    p.bedrooms !== null ? { value: String(p.bedrooms), label: p.bedrooms === 1 ? 'quarto' : 'quartos' } : null,
    p.beds !== null ? { value: String(p.beds), label: p.beds === 1 ? 'cama' : 'camas' } : null,
    p.bathrooms !== null ? { value: String(p.bathrooms), label: p.bathrooms === 1 ? 'banheiro' : 'banheiros' } : null,
    p.areaM2 !== null ? { value: `${p.areaM2.toLocaleString('pt-BR')} m²`, label: 'de área' } : null,
  ];
  return facts.filter((f): f is { value: string; label: string } => f !== null);
}
