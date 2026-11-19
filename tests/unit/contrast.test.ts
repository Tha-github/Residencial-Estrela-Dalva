import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { blend, contrastRatio, hexToRgb, parseCssTokens, resolveHex } from '../../src/lib/color';
import { contrastPairs, decorativeOnly } from '../../src/styles/contrast-pairs';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = parseCssTokens(css);
const rgb = (name: string) => hexToRgb(resolveHex(name, tokens));

describe('utilitários de contraste', () => {
  it('calcula valores de referência WCAG', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
    expect(contrastRatio([255, 255, 255], [255, 255, 255])).toBeCloseTo(1, 5);
    // #767676 sobre branco é o clássico limite ~4.54
    expect(contrastRatio(hexToRgb('#767676'), [255, 255, 255])).toBeCloseTo(4.54, 1);
  });
});

describe('contraste dos tokens (WCAG 2.2 AA)', () => {
  for (const pair of contrastPairs.filter((p) => !decorativeOnly.has(p.fg))) {
    it(`${pair.usage}: ${pair.fg} sobre ${pair.bg} ≥ ${pair.min}`, () => {
      expect(contrastRatio(rgb(pair.fg), rgb(pair.bg))).toBeGreaterThanOrEqual(pair.min);
    });
  }

  // Pior caso: véu/vidro sobre uma foto totalmente branca.
  it.each(['--scrim-strong', '--glass-bg'])('texto branco sobre %s ≥ 4.5 mesmo com foto branca', (token) => {
    const alpha = Number(/\/\s*([\d.]+)\)/.exec(tokens.get(token) ?? '')?.[1]);
    const sea = (tokens.get('--sea-rgb') ?? '').split(/\s+/).map(Number) as [number, number, number];
    expect(alpha).toBeGreaterThan(0);
    const worstCase = blend(sea, alpha, [255, 255, 255]);
    expect(contrastRatio(rgb('--color-on-image'), worstCase)).toBeGreaterThanOrEqual(4.5);
  });
});
