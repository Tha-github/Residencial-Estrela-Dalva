/**
 * Pares de cor usados no site e o contraste mínimo exigido (WCAG 2.2 AA).
 * 4.5 = texto normal · 3 = texto grande (≥24px, ou ≥18.66px em negrito) e componentes de UI.
 * Verificados em tests/unit/contrast.test.ts e exibidos na página de estilo (dev).
 */
export interface ContrastPair {
  fg: string;
  bg: string;
  min: 4.5 | 3;
  usage: string;
}

export const contrastPairs: ContrastPair[] = [
  { fg: '--color-text', bg: '--color-bg', min: 4.5, usage: 'Texto principal' },
  { fg: '--color-text', bg: '--color-surface-alt', min: 4.5, usage: 'Texto em seção alternada' },
  { fg: '--color-text-muted', bg: '--color-bg', min: 4.5, usage: 'Texto secundário' },
  { fg: '--color-text-muted', bg: '--color-surface', min: 4.5, usage: 'Texto secundário em card' },
  { fg: '--color-text-muted', bg: '--color-surface-alt', min: 4.5, usage: 'Texto secundário em seção alternada' },
  { fg: '--color-heading', bg: '--color-bg', min: 4.5, usage: 'Números e rótulos de destaque' },
  { fg: '--color-title', bg: '--color-bg', min: 4.5, usage: 'Títulos' },
  { fg: '--color-title', bg: '--color-surface-alt', min: 4.5, usage: 'Títulos em seção alternada' },
  { fg: '--color-eyebrow', bg: '--color-bg', min: 4.5, usage: 'Sobretítulo (terracota)' },
  { fg: '--color-eyebrow', bg: '--color-surface-alt', min: 4.5, usage: 'Sobretítulo em seção alternada' },
  { fg: '--color-accent', bg: '--color-bg', min: 4.5, usage: 'Links' },
  { fg: '--color-accent', bg: '--color-surface-alt', min: 4.5, usage: 'Links em seção alternada' },
  { fg: '--color-accent', bg: '--color-accent-soft', min: 4.5, usage: 'Texto em destaque suave' },
  { fg: '--color-accent-contrast', bg: '--color-accent', min: 4.5, usage: 'Botão primário' },
  { fg: '--color-accent-contrast', bg: '--color-accent-hover', min: 4.5, usage: 'Botão primário (hover)' },
  { fg: '--color-on-image', bg: '--sea-900', min: 4.5, usage: 'Texto no banner sem foto / rodapé' },
  { fg: '--color-inverse-muted', bg: '--color-inverse-bg', min: 4.5, usage: 'Texto secundário em faixa escura' },
  { fg: '--color-inverse-eyebrow', bg: '--color-inverse-bg', min: 4.5, usage: 'Sobretítulo em faixa escura' },
  { fg: '--color-highlight', bg: '--color-bg', min: 3, usage: 'Estrela decorativa / numerais grandes' },
  { fg: '--color-border-strong', bg: '--color-bg', min: 3, usage: 'Limite de controles' },
  { fg: '--color-focus', bg: '--color-bg', min: 3, usage: 'Anel de foco' },
  { fg: '--color-danger', bg: '--color-surface', min: 4.5, usage: 'Mensagens de erro' },
];

/** Pares que, por design, NÃO precisam atingir o mínimo (documentados, não testados como texto). */
export const decorativeOnly = new Set<string>();
