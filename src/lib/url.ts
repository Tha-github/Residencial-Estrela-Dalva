/**
 * Validação de URLs externas (reservas, Maps, Instagram).
 * Regras: somente https, sem credenciais embutidas e host dentro da lista
 * permitida (o próprio domínio ou subdomínio dele).
 */

export const ALLOWED_HOSTS = {
  booking: ['booking.com'],
  airbnb: ['airbnb.com', 'airbnb.com.br'],
  decolar: ['decolar.com'],
  maps: ['google.com', 'google.com.br', 'maps.app.goo.gl', 'goo.gl'],
  instagram: ['instagram.com'],
} as const satisfies Record<string, readonly string[]>;

export type ExternalLinkKind = keyof typeof ALLOWED_HOSTS;

function hostMatches(hostname: string, allowed: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return allowed.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** Retorna a URL normalizada se for segura para o tipo informado; caso contrário, null. */
export function parseSafeExternalUrl(value: string, kind: ExternalLinkKind): URL | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (!hostMatches(url.hostname, ALLOWED_HOSTS[kind])) return null;
  // Links do Google precisam apontar para o Maps, não para qualquer página do google.com.
  if (kind === 'maps' && /(^|\.)google\.com(\.br)?$/i.test(url.hostname)) {
    const isMapsHost = /^maps\.google\.com(\.br)?$/i.test(url.hostname);
    if (!isMapsHost && !url.pathname.startsWith('/maps')) return null;
  }
  return url;
}

export function isSafeExternalUrl(value: string, kind: ExternalLinkKind): boolean {
  return parseSafeExternalUrl(value, kind) !== null;
}
