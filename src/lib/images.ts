/**
 * Resolve imagens do conteúdo para arquivos em src/assets, processados pelo
 * astro:assets (AVIF/WebP + fallback, vários tamanhos, dimensões reais).
 *
 *   conteúdo "/fotos/sala-01.jpg"   →  src/assets/fotos/sala-01.jpg
 *   fixture  "/dev/exemplo-01.jpg"  →  src/assets/dev/exemplo-01.jpg  (só dev)
 *
 * Uma imagem citada no conteúdo e ausente em disco interrompe o build com
 * mensagem clara (em vez de publicar imagem quebrada).
 */
import type { ImageMetadata } from 'astro';

type Registry = Record<string, { default: ImageMetadata }>;

// Somente src/assets/fotos: um glob "eager" faz o Vite emitir TODOS os arquivos
// casados no build — por isso as imagens de exemplo (src/assets/dev) ficam fora
// e são registradas apenas pela prévia de desenvolvimento (lib/dev-images.ts).
const files: Registry = {
  ...import.meta.glob<{ default: ImageMetadata }>('/src/assets/fotos/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}', {
    eager: true,
  }),
};

/** Usado só pela prévia de desenvolvimento para disponibilizar as imagens de exemplo. */
export function registerImages(extra: Registry): void {
  Object.assign(files, extra);
}

export class MissingImageError extends Error {
  constructor(src: string) {
    super(`Imagem "${src}" citada no conteúdo não existe em src/assets${src}.`);
    this.name = 'MissingImageError';
  }
}

export function resolveImage(src: string): ImageMetadata {
  const file = files[`/src/assets${src}`];
  if (!file) throw new MissingImageError(src);
  return file.default;
}

/** Larguras geradas por papel da imagem (o Astro não amplia além do original). */
export const WIDTHS = {
  hero: [640, 960, 1280, 1600, 1920, 2560],
  feature: [480, 720, 960, 1280, 1600],
  thumb: [320, 480, 640, 800],
  lightbox: [960, 1440, 1920, 2400],
} as const;

/** Formatos modernos; o <img> final usa o formato original como fallback. */
export const FORMATS = ['avif', 'webp'] as const;
