import { GALLERY_GROUPS, type Image } from './schema';

/**
 * Ordena a galeria para contar a história: fachada → áreas sociais → quartos →
 * área externa → detalhes. Ordenação estável: dentro do mesmo grupo vale a ordem
 * cadastrada; fotos sem grupo vão para o fim, na ordem cadastrada.
 */
export function sortGallery(images: Image[]): Image[] {
  const rank = (img: Image) => (img.group ? GALLERY_GROUPS.indexOf(img.group) : GALLERY_GROUPS.length);
  return images
    .map((img, index) => ({ img, index }))
    .sort((a, b) => rank(a.img) - rank(b.img) || a.index - b.index)
    .map(({ img }) => img);
}

/** Quantas fotos aparecem no mosaico (as demais ficam no lightbox). */
export const MOSAIC_SIZE = 5;
