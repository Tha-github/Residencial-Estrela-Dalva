import initialContent from '../../../src/data/residencial.json';

export interface Env {
  CONTENT: D1Database;
  MEDIA: R2Bucket;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  OWNER_EMAIL: string;
  DEPLOY_HOOK_URL: string;
}

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};
export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });

async function accessClaims(request: Request, env: Env): Promise<Record<string, unknown> | null> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.OWNER_EMAIL) return null;
  try {
    const [a, b, sig] = token.split('.');
    if (!a || !b || !sig) return null;
    const decode = (s: string) => JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    const head = decode(a), claims = decode(b), now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (head.alg !== 'RS256' || !audiences.includes(env.ACCESS_AUD) || claims.iss !== `https://${env.ACCESS_TEAM_DOMAIN}` ||
      typeof claims.exp !== 'number' || claims.exp <= now || typeof claims.iat !== 'number' || claims.iat > now + 60 ||
      (typeof claims.nbf === 'number' && claims.nbf > now + 60) ||
      typeof claims.email !== 'string' || claims.email.toLowerCase() !== env.OWNER_EMAIL.toLowerCase()) return null;
    const resp = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) return null;
    const certs = await resp.json() as { public_keys?: Array<JsonWebKey & { kid?: string }> };
    const jwk = certs.public_keys?.find((key) => key.kid === head.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signature = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, new TextEncoder().encode(`${a}.${b}`)) ? claims : null;
  } catch { return null; }
}

export async function authorized(request: Request, env: Env): Promise<Response | null> {
  const claims = await accessClaims(request, env);
  if (!claims) return json({ error: 'Sessão expirada ou acesso não autorizado.' }, 401);
  return null;
}

export function sameOrigin(request: Request): boolean {
  const origin=request.headers.get('origin');
  return origin === new URL(request.url).origin;
}

export async function rateLimit(request: Request, env: Env, maximum: number): Promise<Response | null> {
  const ip=request.headers.get('cf-connecting-ip') || 'unknown';
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
  const key=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const windowStart=Math.floor(Date.now()/60_000);
  const db=env.CONTENT;
  await db.prepare('INSERT INTO request_limits(ip_hash,window_start,hits) VALUES(?,?,1) ON CONFLICT(ip_hash,window_start) DO UPDATE SET hits=hits+1').bind(key,windowStart).run();
  const row=await db.prepare('SELECT hits FROM request_limits WHERE ip_hash=? AND window_start=?').bind(key,windowStart).first<{hits:number}>();
  if(windowStart%60===0) await db.prepare('DELETE FROM request_limits WHERE window_start < ?').bind(windowStart-120).run();
  return row && row.hits>maximum ? json({error:'Muitas tentativas. Aguarde um minuto e tente novamente.'},429) : null;
}

export async function getContent(env: Env): Promise<unknown> {
  const row = await env.CONTENT.prepare('SELECT body FROM content WHERE id = ?').bind('estrela-dalva').first<{body:string}>();
  if (row) return JSON.parse(row.body);
  const body = initialContent;
  await env.CONTENT.prepare('INSERT OR IGNORE INTO content(id, body, updated_at) VALUES(?, ?, CURRENT_TIMESTAMP)').bind('estrela-dalva', JSON.stringify(body)).run();
  return body;
}
