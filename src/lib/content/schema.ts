import { z } from 'zod';
import { isSafeExternalUrl, type ExternalLinkKind } from '../url';
import { themeProblems, type Theme } from '../theme';

/**
 * Esquema do conteúdo editável do residencial.
 *
 * Regra do projeto: campo sem informação confirmada pelo proprietário fica
 * `null` (ou lista vazia) e o trecho correspondente não é exibido. Nunca
 * preencher com texto ou dado inventado.
 *
 * O modelo descreve um LOFT com mezanino: a acomodação é organizada por nível
 * (piso superior / inferior), não por quartos.
 */

// Texto simples: sem caracteres de controle (exceto tab e quebras de linha).
// O HTML é escapado pelo Astro na renderização.
function hasControlChars(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const allowed = code === 0x09 || code === 0x0a || code === 0x0d;
    if ((code < 0x20 && !allowed) || code === 0x7f) return true;
  }
  return false;
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
  .refine((v) => !/[<>]/.test(v), 'HTML não é permitido')
    .refine((v) => !hasControlChars(v), 'Contém caracteres de controle inválidos');

const externalUrl = (kind: ExternalLinkKind) =>
  z
    .string()
    .trim()
    .max(2048)
    .refine((v) => isSafeExternalUrl(v, kind), `URL inválida ou fora dos domínios permitidos (${kind})`);

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM');

/** Ícones que o conteúdo pode usar (subconjunto de components/ui/Icon.astro). */
export const CONTENT_ICONS = [
  'waves',
  'map-pin',
  'star',
  'check',
  'users',
  'levels',
  'layers',
  'pot',
  'snowflake',
  'fan',
  'flame',
  'washer',
  'sun',
  'moon',
  'walk',
  'bag',
  'home',
] as const;
const icon = z.enum(CONTENT_ICONS);

/**
 * Grupos de fotos. Servem para ordenar a galeria e para escolher a foto de
 * cada seção (ex.: a foto "mezanino" aparece na seção de acomodação).
 * Nunca são exibidos como rótulo.
 */
export const GALLERY_GROUPS = ['fachada', 'integrado', 'mezanino', 'cozinha', 'externa', 'regiao', 'detalhes'] as const;
export type GalleryGroup = (typeof GALLERY_GROUPS)[number];

/** Tipos de cama (definem o ícone exibido). */
export const BED_TYPES = ['casal', 'solteiro', 'sofa-cama'] as const;

export const imageSchema = z
  .object({
    /**
     * Arquivo em src/assets (ex.: "/fotos/sala-01.jpg" → src/assets/fotos/sala-01.jpg).
     * Sem protocolo, sem "..": bloqueia data:, javascript: e imagens de terceiros.
     * O build gera AVIF/WebP + fallback em vários tamanhos (lib/images.ts).
     */
    src: z
      .string()
      .trim()
      .max(300)
      .regex(/^\/(?!\/)[\p{L}\p{N}_\-./ ]+\.(jpe?g|png|webp|avif)$/iu, 'Use um caminho local iniciado por "/" (jpg, png, webp ou avif)')
      .refine((v) => !v.includes('..'), 'Caminho inválido'),
    /** Texto alternativo descritivo do que se vê. */
    alt: z.string().trim().min(1, 'Descreva o conteúdo da foto').max(200),
    /** Legenda visível opcional — só com informação confirmada. */
    caption: text(140).nullable().default(null),
    /** Ponto focal do recorte, "x% y%" (padrão: centro). */
    focus: z
      .string()
      .regex(/^(100|\d{1,2})% (100|\d{1,2})%$/, 'Use o formato "x% y%", ex.: "50% 30%"')
      .default('50% 50%'),
    group: z.enum(GALLERY_GROUPS).nullable().default(null),
    /** Opcionais: as dimensões reais são lidas do arquivo no build. */
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  })
  .strict();

export const residencialSchema = z
  .object({
    name: text(80),
    /** Identificação da unidade. `reference` é a identificação adicional (não é endereço). */
    property: z
      .object({
        type: text(40),
        unit: text(60),
        reference: text(40).nullable(),
      })
      .strict(),
    location: z
      .object({
        neighborhood: text(80),
        beach: text(80),
        city: text(80),
        state: text(80),
        stateCode: z.string().regex(/^[A-Z]{2}$/),
        address: text(200).nullable().default(null),
        mapsUrl: externalUrl('maps').nullable().default(null),
        /** O que há por perto, informado pelo proprietário (ex.: mercados, farmácias). */
        nearby: z.array(text(40)).max(10),
      })
      .strict(),
    /** Distâncias aproximadas informadas pelo proprietário. */
    distances: z
      .array(
        z
          .object({
            place: text(80),
            meters: z.number().int().positive().max(50_000),
            kind: z.enum(['praia', 'comercio']),
          })
          .strict(),
      )
      .max(4),
    hero: z
      .object({
        title: text(120).nullable(),
        subtitle: text(280).nullable().default(null),
        image: imageSchema.nullable().default(null),
        primaryLabel: text(40),
        primaryTarget: z.enum(['booking', 'loft', 'gallery', 'location']),
        secondaryLabel: text(40),
        secondaryTarget: z.enum(['booking', 'loft', 'gallery', 'location']),
        highlights: z.array(z.object({ icon: z.enum(['users', 'waves', 'bag']), text: text(60) }).strict()).max(4),
      })
      .strict(),
    about: z
      .object({
        title: text(120).nullable().default(null),
        paragraphs: z.array(text(1200)).max(6),
      })
      .strict(),
    /** Destaques do loft (apresentação). */
    features: z
      .array(z.object({ title: text(80), text: text(200).nullable().default(null), icon }).strict())
      .max(8),
    /** Onde cada pessoa dorme, por nível do loft (de cima para baixo). */
    sleeping: z
      .array(
        z
          .object({
            level: text(60),
            detail: text(60).nullable().default(null),
            beds: z
              .array(z.object({ type: z.enum(BED_TYPES), label: text(60) }).strict())
              .min(1)
              .max(6),
          })
          .strict(),
      )
      .max(3),
    amenities: z
      .array(
        z
          .object({
            title: text(60),
            icon,
            items: z.array(text(60)).min(1).max(20),
          })
          .strict(),
      )
      .max(8),
    experience: z
      .object({
        title: text(120).nullable().default(null),
        intro: text(400).nullable().default(null),
        moments: z.array(z.object({ title: text(60), text: text(220), icon }).strict()).max(6),
      })
      .strict(),
    gallery: z.array(imageSchema).max(60),
    copy: z.object({
      galleryTitle: text(120),
      sleepingTitle: text(120),
      sleepingIntro: text(300),
      amenitiesTitle: text(120),
      amenitiesIntro: text(300),
      locationTitle: text(120),
      locationIntro: text(400),
      practicalTitle: text(120),
      faqTitle: text(120),
      bookingTitle: text(120),
      bookingIntro: text(300),
    }).strict(),
    faq: z.array(z.object({ question: text(160), answer: text(600) }).strict()).max(12),
    practical: z
      .object({
        maxGuests: z.number().int().min(1).max(30).nullable(),
        checkIn: time.nullable(),
        checkOut: time.nullable(),
        rules: z.array(text(200)).max(20),
      })
      .strict(),
    booking: z
      .object({
        booking: externalUrl('booking').nullable().default(null),
        airbnb: externalUrl('airbnb').nullable().default(null),
        decolar: externalUrl('decolar').nullable().default(null),
        buttonPrefix: text(30),
      })
      .strict(),
    contact: z
      .object({
        instagram: externalUrl('instagram').nullable().default(null),
        /** Somente dígitos com DDI, ex.: 5548999999999 */
        whatsapp: z.string().regex(/^\d{12,13}$/, 'Use apenas dígitos com DDI e DDD').nullable().default(null),
        /** Mensagem inicial do WhatsApp. */
        whatsappMessage: text(300).nullable().default(null),
        email: z.email().max(254).nullable().default(null),
      })
      .strict(),
    theme: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }).strict(),
  })
  .strict()
  .superRefine((content, ctx) => {
    for (const message of themeProblems(content.theme as Theme)) {
      ctx.addIssue({ code: 'custom', path: ['theme'], message });
    }
  });

export type Residencial = z.infer<typeof residencialSchema>;
export type Image = z.infer<typeof imageSchema>;
export type ContentIcon = (typeof CONTENT_ICONS)[number];
