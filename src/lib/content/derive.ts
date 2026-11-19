import type { GalleryGroup, Image, Residencial } from './schema';

export interface NavItem {
  href: string;
  label: string;
}

/** IDs das seções (âncoras estáveis — usadas em links internos). */
export const SECTION_IDS = {
  loft: 'o-loft',
  gallery: 'fotos',
  sleeping: 'acomodacao',
  amenities: 'comodidades',
  location: 'localizacao',
  experience: 'experiencia',
  practical: 'informacoes',
  booking: 'reservas',
  faq: 'duvidas',
} as const;

type PlatformId = 'booking' | 'airbnb' | 'decolar';

export interface BookingPlatform {
  id: PlatformId;
  name: string;
  /** Preposição + artigo: "no Airbnb", "na Decolar". */
  inName: string;
  /** "pelo Airbnb", "pela Decolar". */
  byName: string;
  /** null = link ainda não informado (só aparece como pendência na prévia). */
  url: string | null;
}

const PLATFORMS: Record<PlatformId, { name: string; feminine: boolean; primary: boolean }> = {
  booking: { name: 'Booking.com', feminine: false, primary: true },
  airbnb: { name: 'Airbnb', feminine: false, primary: true },
  decolar: { name: 'Decolar', feminine: true, primary: false },
};

function platform(id: PlatformId, url: string | null): BookingPlatform {
  const { name, feminine } = PLATFORMS[id];
  return { id, name, url, inName: `${feminine ? 'na' : 'no'} ${name}`, byName: `${feminine ? 'pela' : 'pelo'} ${name}` };
}

/** Plataformas com link confirmado, na ordem fixa Booking.com → Airbnb → Decolar. */
export function getBookingPlatforms(c: Residencial): BookingPlatform[] {
  return (Object.keys(PLATFORMS) as PlatformId[]).flatMap((id) => {
    const url = c.booking[id];
    return url ? [platform(id, url)] : [];
  });
}

/**
 * Plataformas a exibir na seção de reservas. Booking.com e Airbnb sempre
 * aparecem na prévia (como pendência quando sem link); Decolar só com link.
 */
export function getPlatformSlots(c: Residencial, clientPreview: boolean): BookingPlatform[] {
  return (Object.keys(PLATFORMS) as PlatformId[]).flatMap((id) => {
    const url = c.booking[id];
    if (url || (clientPreview && PLATFORMS[id].primary)) return [platform(id, url)];
    return [];
  });
}

/** Link do WhatsApp com mensagem inicial opcional. */
export function whatsappUrl(digits: string, message?: string | null): string {
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Formata 5548999999999 → +55 (48) 99999-9999 (apenas para exibição). */
export function formatWhatsapp(digits: string): string {
  const m = /^(\d{2})(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
  return m ? `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}` : `+${digits}`;
}

/** mailto: com assunto pré-preenchido. */
export function mailtoUrl(email: string, subject?: string): string {
  return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
}

export function instagramHandle(url: string): string {
  const handle = new URL(url).pathname.split('/').filter(Boolean)[0];
  return handle ? `@${handle}` : 'Instagram';
}

/** "14:00" → "14h"; "14:30" → "14h30". */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
}

/** 450 → "450 m"; 1200 → "1,2 km". */
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

/** Número por extenso até 10 (para textos: "até quatro pessoas"). */
export function numberWord(n: number): string {
  const words = ['zero', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
  return words[n] ?? String(n);
}

/** Primeira foto de um grupo (ordem cadastrada) — usada nas seções. */
export function photoOf(c: Residencial, group: GalleryGroup): Image | null {
  return c.gallery.find((img) => img.group === group) ?? null;
}

export function hasDirectContact(c: Residencial): boolean {
  return Boolean(c.contact.whatsapp || c.contact.email);
}

export interface Visibility {
  loft: boolean;
  gallery: boolean;
  sleeping: boolean;
  amenities: boolean;
  location: boolean;
  experience: boolean;
  practical: boolean;
  booking: boolean;
  faq: boolean;
}

/** Quais seções têm dados suficientes para aparecer no site publicado. */
export function getVisibility(c: Residencial): Visibility {
  const p = c.practical;
  return {
    loft: c.about.paragraphs.length > 0 || c.features.length > 0,
    gallery: c.gallery.length > 0,
    sleeping: c.sleeping.length > 0,
    amenities: c.amenities.length > 0,
    location: c.distances.length > 0 || Boolean(c.location.mapsUrl || c.location.address),
    experience: c.experience.moments.length > 0,
    practical: [p.maxGuests, p.checkIn, p.checkOut].some((v) => v !== null) || hasDirectContact(c),
    booking: getBookingPlatforms(c).length > 0 || hasDirectContact(c),
    faq: getFaq(c).length > 0,
  };
}

/** Ordem fixa das seções na página. */
export const SECTION_ORDER = [
  'loft',
  'gallery',
  'sleeping',
  'amenities',
  'location',
  'experience',
  'practical',
  'booking',
  'faq',
] as const;
export type SectionKey = (typeof SECTION_ORDER)[number];
export type Tone = 'default' | 'alt' | 'inverse';

/**
 * Fundos das seções visíveis: a experiência é sempre a faixa escura; as demais
 * alternam areia clara / areia, para que duas vizinhas nunca tenham o mesmo fundo.
 */
export function getSectionTones(v: Visibility): Record<SectionKey, Tone> {
  let i = 0;
  const tones = {} as Record<SectionKey, Tone>;
  for (const key of SECTION_ORDER) {
    if (key === 'experience') {
      tones[key] = 'inverse';
      if (v[key]) i = 0; // depois da faixa escura, recomeça no fundo claro
      continue;
    }
    tones[key] = i % 2 === 0 ? 'default' : 'alt';
    if (v[key]) i++;
  }
  return tones;
}

/** Navegação curta: só seções visíveis, no máximo 5 itens. */
export function getNavItems(v: Visibility): NavItem[] {
  const items: Array<[boolean, NavItem]> = [
    [v.loft, { href: `#${SECTION_IDS.loft}`, label: 'O loft' }],
    [v.sleeping, { href: `#${SECTION_IDS.sleeping}`, label: 'Acomodação' }],
    [v.amenities, { href: `#${SECTION_IDS.amenities}`, label: 'Comodidades' }],
    [v.location, { href: `#${SECTION_IDS.location}`, label: 'Localização' }],
    [v.faq, { href: `#${SECTION_IDS.faq}`, label: 'Dúvidas' }],
  ];
  return items
    .filter(([show]) => show)
    .map(([, item]) => item)
    .slice(0, 5);
}

/** Destaques curtos do banner: capacidade e distâncias confirmadas. */
export function getHeroHighlights(c: Residencial): Array<{ icon: 'users' | 'waves' | 'bag'; text: string }> {
  const out: Array<{ icon: 'users' | 'waves' | 'bag'; text: string }> = [];
  if (c.practical.maxGuests) out.push({ icon: 'users', text: `Até ${c.practical.maxGuests} hóspedes` });
  for (const d of c.distances) {
    out.push({
      icon: d.kind === 'praia' ? 'waves' : 'bag',
      text: `${formatDistance(d.meters)} ${d.kind === 'praia' ? 'da praia' : `do ${d.place.replace(/\s+dos?\s+.*$/i, '')}`}`,
    });
  }
  return out;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Perguntas frequentes geradas SOMENTE a partir de dados confirmados.
 * Sem dado, sem pergunta — nada de políticas, taxas ou regras supostas.
 */
export function getFaq(c: Residencial): FaqItem[] {
  const faq: FaqItem[] = [];
  const { practical: p, property } = c;
  const loft = property.type.toLowerCase();

  if (p.maxGuests) {
    faq.push({
      question: `Quantas pessoas o ${loft} acomoda?`,
      answer: `Até ${numberWord(p.maxGuests)} ${p.maxGuests === 1 ? 'pessoa' : 'pessoas'}.`,
    });
  }

  if (c.sleeping.length > 0) {
    const parts = c.sleeping.map((lvl) => {
      const where = lvl.detail ? `${lvl.level.toLowerCase()} (${lvl.detail.toLowerCase()})` : lvl.level.toLowerCase();
      const beds = joinList(lvl.beds.map((b) => lowerFirst(b.label)));
      return `No ${where}: ${beds}.`;
    });
    faq.push({
      question: 'Como são distribuídas as camas?',
      answer: `${parts.join(' ')} É um ${loft} com mezanino, não há quartos separados.`,
    });
  }

  for (const d of c.distances) {
    faq.push({
      question: `Qual é a distância até ${d.kind === 'praia' ? 'a' : 'o'} ${d.place}?`,
      answer: `Aproximadamente ${d.meters} metros.`,
    });
  }

  if (p.checkIn) {
    faq.push({ question: 'Qual é o horário de check-in?', answer: `A partir das ${formatTime(p.checkIn)}.` });
  }
  if (p.checkOut) {
    faq.push({ question: 'Qual é o horário de check-out?', answer: `Até as ${formatTime(p.checkOut)}.` });
  }

  const kitchen = c.amenities.find((a) => /cozinha/i.test(a.title));
  if (kitchen) {
    faq.push({
      question: `O ${loft} possui cozinha equipada?`,
      answer: `Sim. ${joinList(kitchen.items.map((item, i) => (i === 0 ? item : lowerFirst(item))))}.`,
    });
  }

  const platforms = getBookingPlatforms(c).map((pl) => pl.name);
  const direct = [c.contact.whatsapp && 'WhatsApp', c.contact.email && 'e-mail'].filter(Boolean) as string[];
  if (platforms.length > 0 || direct.length > 0) {
    const options: string[] = [];
    if (platforms.length > 0) options.push(`pelas plataformas ${joinList(platforms)}`);
    if (direct.length > 0) options.push(`diretamente com o proprietário, por ${joinList(direct)}`);
    faq.push({
      question: 'Como posso fazer uma reserva?',
      answer: `Você pode reservar ${options.join(' ou ')}. As opções estão na seção de reservas.`,
    });
  }

  return faq;
}

/** ["a", "b", "c"] → "a, b e c". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
