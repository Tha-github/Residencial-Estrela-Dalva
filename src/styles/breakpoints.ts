/** Espelho dos breakpoints documentados em tokens.css (mobile first, min-width, px). */
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;
