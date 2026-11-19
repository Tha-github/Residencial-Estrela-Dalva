/**
 * Cores editáveis pelo painel ("cores autorizadas"). Cada cor substitui um
 * token da paleta (src/styles/tokens.css); os tons derivados (hover, fundos
 * escuros, superfícies, texto secundário) são calculados aqui, em hex.
 *
 * Cor inalterada (= padrão) não gera nenhuma sobrescrita: o site continua
 * com os tons calibrados à mão em tokens.css.
 *
 * As regras de contraste (WCAG AA, 4,5:1) são aplicadas aos tokens finais,
 * inclusive os derivados — nenhuma combinação deixa texto ilegível. Usadas
 * pelo schema (build e Worker) e pelo painel (aviso imediato).
 */
export const themeKeys = ['primary', 'secondary', 'accent', 'background', 'text'] as const;
export type ThemeKey = (typeof themeKeys)[number];
export type Theme = Record<ThemeKey, string>;

export const defaultTheme: Theme = {
  primary: '#0f4f6d', // --sea-700: botões, links, títulos
  secondary: '#0b3346', // --sea-900: faixas escuras, rodapé
  accent: '#a24f28', // --terra-600: sobretítulos e detalhes
  background: '#faf7f2', // --sand-50: fundo da página
  text: '#1e2326', // --graphite-900: texto corrido
};

export const themeLabels: Record<ThemeKey, { label: string; help: string }> = {
  primary: { label: 'Cor principal', help: 'Botões, links e títulos.' },
  secondary: { label: 'Cor secundária', help: 'Faixas escuras (experiência, reservas) e rodapé.' },
  accent: { label: 'Cor de destaque', help: 'Sobretítulos, ícones e pequenos detalhes.' },
  background: { label: 'Cor de fundo', help: 'Fundo claro da página.' },
  text: { label: 'Cor dos textos', help: 'Texto dos parágrafos.' },
};

export const HEX = /^#[0-9a-f]{6}$/i;

/** Tokens originais (tokens.css) — usados quando a cor-base não mudou. */
const original = {
  primary: { '--sea-700': '#0f4f6d', '--sea-800': '#0c4058', '--sea-600': '#1a6488' },
  secondary: {
    '--sea-900': '#0b3346',
    '--sea-950': '#082636',
    '--sea-200': '#bcd5e1',
    '--sea-100': '#dbe9ef',
  },
  accent: {
    '--terra-600': '#a24f28',
    '--terra-700': '#8e4322',
    '--terra-500': '#c0673a',
    '--terra-300': '#e3a27c',
  },
  background: {
    '--sand-50': '#faf7f2',
    '--sand-100': '#f2ebe0',
    '--sand-200': '#e4d8c6',
    '--sand-300': '#cbb89c',
  },
  text: { '--graphite-900': '#1e2326', '--graphite-700': '#3a4044', '--graphite-600': '#50575c' },
} as const satisfies Record<ThemeKey, Record<string, string>>;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) =>
  `#${c
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
/** Mistura `hex` com `other` (pct% de other), como color-mix in srgb. */
export const mix = (hex: string, other: string, pct: number) => {
  const [a, b] = [rgb(hex), rgb(other)];
  return toHex(a.map((v, i) => v + (b[i]! - v) * (pct / 100)));
};

const isChanged = (theme: Theme, k: ThemeKey) =>
  theme[k].toLowerCase() !== defaultTheme[k].toLowerCase();

/** Todos os tokens de cor resultantes do tema (originais ou derivados). */
export function themeTokens(theme: Theme): Record<string, string> {
  const derived: Record<ThemeKey, () => Record<string, string>> = {
    primary: () => {
      const c = theme.primary;
      return {
        '--sea-700': c,
        '--sea-800': mix(c, '#000000', 18),
        '--sea-600': mix(c, '#ffffff', 14),
      };
    },
    secondary: () => {
      const c = theme.secondary;
      return {
        '--sea-900': c,
        '--sea-950': mix(c, '#000000', 28),
        '--sea-200': mix(c, '#ffffff', 74),
        '--sea-100': mix(c, '#ffffff', 86),
      };
    },
    accent: () => {
      const c = theme.accent;
      return {
        '--terra-600': c,
        '--terra-700': mix(c, '#000000', 14),
        '--terra-500': mix(c, '#ffffff', 18),
        '--terra-300': mix(c, '#ffffff', 45),
      };
    },
    background: () => {
      const c = theme.background;
      return {
        '--sand-50': c,
        '--sand-100': mix(c, '#7a5a2a', 5),
        '--sand-200': mix(c, '#7a5a2a', 13),
        '--sand-300': mix(c, '#7a5a2a', 30),
      };
    },
    text: () => {
      const c = theme.text;
      return {
        '--graphite-900': c,
        '--graphite-700': mix(c, '#ffffff', 14),
        '--graphite-600': mix(c, '#ffffff', 24),
      };
    },
  };
  return Object.assign(
    {},
    ...themeKeys.map((k) => (isChanged(theme, k) ? derived[k]() : { ...original[k] })),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const MIN = 4.5;

/** Combinações de texto reais do site que precisam de 4,5:1. */
const rules: [fg: string, bg: string, uso: string][] = [
  ['--graphite-900', '--sand-50', 'texto sobre o fundo'],
  ['--graphite-600', '--sand-50', 'texto secundário sobre o fundo'],
  ['--graphite-600', '--sand-100', 'texto secundário sobre as faixas claras'],
  ['--sea-700', '--sand-50', 'títulos e links sobre o fundo'],
  ['--sea-700', '--sand-100', 'títulos e links sobre as faixas claras'],
  ['#ffffff', '--sea-700', 'texto branco dos botões'],
  ['#ffffff', '--sea-800', 'texto branco dos botões (ao passar o mouse)'],
  ['--sand-50', '--sea-900', 'texto claro nas faixas escuras'],
  ['--sea-200', '--sea-900', 'títulos nas faixas escuras'],
  ['--terra-600', '--sand-50', 'sobretítulos sobre o fundo'],
  ['--terra-600', '--sand-100', 'sobretítulos sobre as faixas claras'],
  ['--terra-300', '--sea-900', 'sobretítulos nas faixas escuras'],
];

export function themeProblems(theme: Theme): string[] {
  if (!themeKeys.every((k) => HEX.test(theme[k] ?? ''))) return ['Cor inválida.'];
  const t = themeTokens(theme);
  const color = (v: string) => (v.startsWith('#') ? v : t[v]!);
  return rules.flatMap(([fg, bg, uso]) => {
    const ratio = contrast(color(fg), color(bg));
    return ratio < MIN
      ? [`Pouco contraste para ${uso}: ${ratio.toFixed(1)}:1 (mínimo ${MIN}:1).`]
      : [];
  });
}

/**
 * CSS que sobrescreve somente os tokens das cores alteradas. Todos os
 * valores são hex validados — seguros para embutir num <style>.
 */
export function themeCss(theme: Theme): string {
  if (!themeKeys.every((k) => HEX.test(theme[k] ?? ''))) return '';
  const changed = themeKeys.filter((k) => isChanged(theme, k));
  if (changed.length === 0) return '';
  const t = themeTokens(theme);
  const vars = changed.flatMap((k) => Object.keys(original[k]).map((name) => `${name}:${t[name]}`));
  return `:root{${vars.join(';')}}`;
}
