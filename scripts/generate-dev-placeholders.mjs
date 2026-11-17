/**
 * Gera imagens de EXEMPLO (JPEG) para a prévia de desenvolvimento.
 * Uso: node scripts/generate-dev-placeholders.mjs
 *
 * - Não são fotos: listras + rótulo "EXEMPLO", impossível confundir com o imóvel.
 * - Proporções variadas (paisagem, retrato, quadrada) para testar o crop.
 * - Um círculo "PONTO FOCAL" marca a área que o crop precisa preservar.
 * - Usadas só por src/data/dev-fixture.ts; nunca pelo conteúdo real.
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = new URL('../src/assets/dev/', import.meta.url);

const items = [
  // nome, largura, altura, cor, foco (x%, y%)
  ['exemplo-hero', 2400, 1600, '#1d5363', [70, 40]],
  ['exemplo-01', 1800, 1200, '#163f4b', [50, 50]],
  ['exemplo-02', 1200, 1600, '#5a6167', [50, 30]],
  ['exemplo-03', 1800, 1200, '#b27a45', [25, 60]],
  ['exemplo-04', 1600, 1600, '#394045', [50, 50]],
  ['exemplo-05', 1200, 1600, '#10313a', [50, 70]],
  ['exemplo-06', 1800, 1200, '#8a7356', [75, 45]],
  ['exemplo-07', 1800, 1200, '#2c4a52', [50, 50]],
];

await mkdir(OUT, { recursive: true });

for (const [name, w, h, color, [fx, fy]] of items) {
  const cx = (w * fx) / 100;
  const cy = (h * fy) / 100;
  const r = Math.min(w, h) * 0.12;
  const font = Math.round(Math.min(w, h) / 14);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="30" height="60" fill="rgba(255,255,255,0.07)"/></pattern></defs>
    <rect width="100%" height="100%" fill="${color}"/>
    <rect width="100%" height="100%" fill="url(#p)"/>
    <rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="none" stroke="#ffd36b" stroke-width="6" stroke-dasharray="24 16"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffd36b" stroke-width="8"/>
    <text x="${cx}" y="${cy + r + font * 1.2}" fill="#ffd36b" font-family="monospace" font-size="${font * 0.5}" text-anchor="middle">PONTO FOCAL</text>
    <text x="50%" y="${font * 2}" fill="#ffd36b" font-family="monospace" font-weight="bold" font-size="${font}" text-anchor="middle">EXEMPLO · ${name.replace('exemplo-', '').toUpperCase()}</text>
    <text x="50%" y="${h - font}" fill="#ffd36b" font-family="monospace" font-size="${font * 0.45}" text-anchor="middle">${w}×${h} · não é foto do imóvel</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 70, mozjpeg: true }).toFile(fileURLToPath(new URL(`${name}.jpg`, OUT)));
  console.log(`ok ${name}.jpg (${w}×${h})`);
}
