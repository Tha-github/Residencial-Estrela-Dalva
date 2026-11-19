/**
 * Validação de imagens enviadas pelo painel.
 * O tipo é detectado pela ASSINATURA do arquivo (não pelo nome nem pelo
 * MIME declarado) e as dimensões são lidas do cabeçalho, para recusar
 * arquivos disfarçados e imagens gigantes antes de chegarem ao build.
 */
export const MAX_BYTES = 8 * 1024 * 1024; // após a compressão feita no painel
export const MAX_PIXELS = 40_000_000;
export const MIN_SIDE = 200;

export type ImageKind = 'jpg' | 'png' | 'webp';

export interface ImageInfo {
  kind: ImageKind;
  width: number;
  height: number;
}

const u16be = (b: Uint8Array, i: number) => (b[i]! << 8) | b[i + 1]!;
const u32be = (b: Uint8Array, i: number) =>
  ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;
const u24le = (b: Uint8Array, i: number) => b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16);
const ascii = (b: Uint8Array, i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));

function jpegSize(b: Uint8Array): [number, number] | undefined {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return undefined;
    const marker = b[i + 1]!;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      i += 2;
      continue;
    }
    const len = u16be(b, i + 2);
    // SOF0–SOF15, exceto DHT (C4), JPG (C8) e DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return [u16be(b, i + 7), u16be(b, i + 5)];
    }
    i += 2 + len;
  }
  return undefined;
}

export function inspectImage(b: Uint8Array): ImageInfo | undefined {
  let kind: ImageKind | undefined;
  let size: [number, number] | undefined;
  if (b.length > 24 && b[0] === 0x89 && ascii(b, 1, 3) === 'PNG' && ascii(b, 12, 4) === 'IHDR') {
    kind = 'png';
    size = [u32be(b, 16), u32be(b, 20)];
  } else if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    kind = 'jpg';
    size = jpegSize(b);
  } else if (b.length > 30 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') {
    kind = 'webp';
    const chunk = ascii(b, 12, 4);
    if (chunk === 'VP8 ') size = [((b[27]! << 8) | b[26]!) & 0x3fff, ((b[29]! << 8) | b[28]!) & 0x3fff];
    else if (chunk === 'VP8L')
      size = [
        1 + (((b[22]! & 0x3f) << 8) | b[21]!),
        1 + (((b[24]! & 0x0f) << 10) | (b[23]! << 2) | ((b[22]! & 0xc0) >> 6)),
      ];
    else if (chunk === 'VP8X') size = [1 + u24le(b, 24), 1 + u24le(b, 27)];
  }
  if (!kind || !size || !size[0] || !size[1]) return undefined;
  return { kind, width: size[0]!, height: size[1]! };
}

export type ImageCheck = { ok: true; info: ImageInfo } | { ok: false; reason: string };

export function checkImage(bytes: Uint8Array): ImageCheck {
  if (bytes.length === 0) return { ok: false, reason: 'Arquivo vazio.' };
  if (bytes.length > MAX_BYTES) return { ok: false, reason: 'Imagem muito grande (máx. 8 MB).' };
  const info = inspectImage(bytes);
  if (!info) return { ok: false, reason: 'Formato não aceito. Envie JPG, PNG ou WEBP.' };
  if (info.width * info.height > MAX_PIXELS)
    return { ok: false, reason: 'Imagem com resolução exagerada (máx. 40 megapixels).' };
  if (Math.min(info.width, info.height) < MIN_SIDE)
    return { ok: false, reason: `Imagem pequena demais (mín. ${MIN_SIDE} px no menor lado).` };
  return { ok: true, info };
}
