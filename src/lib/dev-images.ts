/**
 * Imagens de EXEMPLO (src/assets/dev) — importar SOMENTE em páginas de desenvolvimento.
 * Mantido separado de lib/images.ts para que essas imagens não sejam emitidas no build.
 */
import type { ImageMetadata } from 'astro';
import { registerImages } from './images';

export function registerDevImages(): void {
  registerImages(
    import.meta.glob<{ default: ImageMetadata }>('/src/assets/dev/*.jpg', {
      eager: true,
    }),
  );
}
