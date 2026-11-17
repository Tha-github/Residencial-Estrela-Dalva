/**
 * Utilitários de cor para verificar contraste WCAG 2.x a partir de tokens.css.
 * Usado pelos testes e pela página de estilo (dev).
 */

export type Rgb = [number, number, number];

/** Lê as custom properties do primeiro bloco :root do CSS. */
export function parseCssTokens(css: string): Map<string, string> {
  const root = /:root\s*\{([\s\S]*?)\n\}/.exec(css.replace(/\/\*[\s\S]*?\*\//g, ''));
  const tokens = new Map<string, string>();
  if (!root?.[1]) return tokens;
  for (const match of root[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name && value && !tokens.has(name)) tokens.set(name, value.trim());
  }
  return tokens;
}

/** Resolve um token (seguindo var()) até um hex. Lança erro se não for cor hex. */
export function resolveHex(name: string, tokens: Map<string, string>, depth = 0): string {
  if (depth > 10) throw new Error(`Referência circular em ${name}`);
  const value = tokens.get(name);
  if (!value) throw new Error(`Token não encontrado: ${name}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  if (ref?.[1]) return resolveHex(ref[1], tokens, depth + 1);
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    throw new Error(`Token ${name} não é cor hex: ${value}`);
  }
  return value.toLowerCase();
}

export function hexToRgb(hex: string): Rgb {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Cor resultante de `fg` com opacidade `alpha` sobre `bg`. */
export function blend(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return [0, 1, 2].map((i) => Math.round(fg[i]! * alpha + bg[i]! * (1 - alpha))) as Rgb;
}
