/**
 * Autenticação do painel (Web Crypto, sem dependências).
 *
 * - Senha: guardada SOMENTE como hash PBKDF2-SHA256 com sal aleatório, no
 *   secret ADMIN_PASSWORD_HASH ("pbkdf2-sha256$<iterações>$<sal>$<hash>").
 *   Gere com `npm run admin:hash-password`.
 * - Sessão: token assinado com HMAC-SHA256 (secret SESSION_SECRET) e
 *   validade curta. Sem estado no servidor; trocar SESSION_SECRET encerra
 *   todas as sessões.
 * - Comparações em tempo constante.
 */
const enc = new TextEncoder();

export const b64 = {
  encode(bytes: Uint8Array): string {
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s);
  },
  decode(text: string): Uint8Array<ArrayBuffer> {
    const s = atob(text);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  },
};
const b64url = {
  encode: (bytes: Uint8Array) =>
    b64.encode(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  decode: (text: string) =>
    b64.decode(text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4)),
};

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** Limite do Workers para PBKDF2. */
export const PBKDF2_ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string, iterations = PBKDF2_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, iterations);
  return `pbkdf2-sha256$${iterations}$${b64.encode(salt)}$${b64.encode(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, it, salt, hash] = stored.split('$');
  const iterations = Number(it);
  if (scheme !== 'pbkdf2-sha256' || !Number.isInteger(iterations) || !salt || !hash) return false;
  if (typeof password !== 'string' || password.length === 0 || password.length > 256) return false;
  const actual = await pbkdf2(password, b64.decode(salt), iterations);
  return timingSafeEqual(actual, b64.decode(hash));
}

async function hmacKey(secret: string) {
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET ausente ou curto (mín. 32)');
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function sign(secret: string, data: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(data));
  return b64url.encode(new Uint8Array(sig));
}

export async function verifySignature(secret: string, data: string, sig: string) {
  try {
    return await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      b64url.decode(sig),
      enc.encode(data),
    );
  } catch {
    return false;
  }
}

interface SessionPayload {
  sub: 'owner';
  site: string;
  iat: number;
  exp: number;
}

export async function createSession(secret: string, site: string, hours: number) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: 'owner', site, iat: now, exp: now + hours * 3600 };
  const data = b64url.encode(enc.encode(JSON.stringify(payload)));
  return { token: `${data}.${await sign(secret, `session.${data}`)}`, expiresAt: payload.exp };
}

export async function verifySession(secret: string, site: string, token: string | null) {
  if (!token) return false;
  const [data, sig, extra] = token.split('.');
  if (!data || !sig || extra !== undefined) return false;
  if (!(await verifySignature(secret, `session.${data}`, sig))) return false;
  try {
    const p = JSON.parse(new TextDecoder().decode(b64url.decode(data))) as SessionPayload;
    return p.sub === 'owner' && p.site === site && p.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
