import { z } from 'zod';
import { isSafeExternalUrl, type ExternalLinkKind } from '../url';

/**
 * Esquema do conteúdo editável do residencial.
 *
 * Regra do projeto: campo sem informação confirmada pelo cliente fica `null`
 * (ou lista vazia) e a seção correspondente não é exibida. Nunca preencher
 * com texto ou dado inventado.
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
    .refine((v) => !hasControlChars(v), 'Contém caracteres de controle inválidos');

const externalUrl = (kind: ExternalLinkKind) =>
  z
    .string()
    .trim()
    .max(2048)
    .refine((v) => isSafeExternalUrl(v, kind), `URL inválida ou fora dos domínios permitidos (${kind})`);

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM');

const count = (max: number) => z.number().int().min(0).max(max);

/** Ícones permitidos nos diferenciais (subconjunto de components/ui/Icon.astro). */
export const HIGHLIGHT_ICONS = ['waves', 'map-pin', 'star', 'check', 'image'] as const;

/**
 * Grupos da narrativa da galeria, na ordem em que a história é contada.
 * Usados SÓ para ordenar — nunca exibidos como rótulo (não rotulamos cômodos
 * que não possam ser confirmados). Foto sem grupo vai para o fim, na ordem cadastrada.
 */
export const GALLERY_GROUPS = ['fachada', 'social', 'quartos', 'externa', 'detalhes'] as const;

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
      .regex(/^\/(?!\/)[\w\-./]+\.(jpe?g|png|webp|avif)$/i, 'Use um caminho local iniciado por "/" (jpg, png, webp ou avif)')
      .refine((v) => !v.includes('..'), 'Caminho inválido'),
    /** Texto alternativo descritivo do que se vê. Vazio apenas para imagem decorativa. */
    alt: z.string().trim().min(1, 'Descreva o conteúdo da foto; use alt vazio somente para imagens decorativas').max(200),
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
    location: z.object({
      beach: text(80),
      city: text(80),
      state: text(80),
      stateCode: z.string().regex(/^[A-Z]{2}$/),
      address: text(200).nullable(),
      mapsUrl: externalUrl('maps').nullable(),
    }),
    hero: z.object({
      title: text(120).nullable(),
      subtitle: text(240).nullable(),
      image: imageSchema.nullable(),
    }),
    about: z.object({
      title: text(120).nullable(),
      paragraphs: z.array(text(1200)).max(6),
    }),
    highlights: z
      .array(
        z
          .object({
            title: text(80),
            text: text(300),
            icon: z.enum(HIGHLIGHT_ICONS).nullable().default(null),
          })
          .strict(),
      )
      .max(8),
    gallery: z.array(imageSchema).max(60),
    practical: z.object({
      maxGuests: count(30).nullable(),
      bedrooms: count(20).nullable(),
      beds: count(40).nullable(),
      bathrooms: count(20).nullable(),
      areaM2: z.number().positive().max(2000).nullable(),
      checkIn: time.nullable(),
      checkOut: time.nullable(),
      amenities: z.array(text(80)).max(40),
      rules: z.array(text(200)).max(20),
    }),
    booking: z.object({
      booking: externalUrl('booking').nullable(),
      airbnb: externalUrl('airbnb').nullable(),
      decolar: externalUrl('decolar').nullable(),
    }),
    contact: z.object({
      instagram: externalUrl('instagram').nullable(),
      /** Somente dígitos com DDI, ex.: 5548999999999 */
      whatsapp: z.string().regex(/^\d{12,13}$/, 'Use apenas dígitos com DDI e DDD').nullable(),
      email: z.email().max(254).nullable(),
    }),
  })
  .strict();

export type Residencial = z.infer<typeof residencialSchema>;
export type Image = z.infer<typeof imageSchema>;
