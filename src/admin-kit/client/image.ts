/**
 * Preparação da foto no navegador, antes do envio:
 *  - aceita somente JPG, JPEG, PNG e WEBP (até 25 MB no original);
 *  - reduz para no máximo 2400 px no maior lado e converte para WebP
 *    (JPEG se o navegador não gerar WebP), mantendo boa qualidade.
 * O servidor valida de novo (assinatura do arquivo e dimensões).
 */
export const ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ORIGINAL = 25 * 1024 * 1024;
const MAX_SIDE = 2400;
const MIN_SIDE = 200;

export interface PreparedImage {
  base64: string;
  previewUrl: string;
  width: number;
  height: number;
  bytes: number;
}

export function checkFile(file: File): string | undefined {
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (!TYPES.includes(file.type) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext))
    return 'Formato não aceito. Use JPG, PNG ou WEBP.';
  if (file.size > MAX_ORIGINAL) return 'Arquivo muito grande (máximo 25 MB).';
  return undefined;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const problem = checkFile(file);
  if (problem) throw new Error(problem);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Não foi possível abrir esta imagem. Tente outro arquivo.');
  }
  if (Math.min(bitmap.width, bitmap.height) < MIN_SIDE) {
    throw new Error(`Imagem pequena demais (mínimo ${MIN_SIDE} px no menor lado).`);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await toBlob(canvas, 'image/webp', 0.86);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.88);
  if (!blob) throw new Error('Não foi possível preparar a imagem.');

  const buffer = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buffer.length; i += 0x8000) {
    bin += String.fromCharCode(...buffer.subarray(i, i + 0x8000));
  }
  return {
    base64: btoa(bin),
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
    bytes: blob.size,
  };
}
