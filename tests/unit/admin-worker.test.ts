import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { hashPassword } from '../../admin-worker/src/auth';
import { handle, type Env, type SiteAdapter } from '../../admin-worker/src/app';
import { checkImage, inspectImage } from '../../admin-worker/src/images';
import { estrelaDalvaSpec } from '../../src/admin-sites/estrela-dalva';
import { residencialSchema } from '../../src/lib/content/schema';
import data from '../../src/data/residencial.json';

/**
 * Worker do painel contra um GitHub FALSO em memória: login, sessão,
 * isolamento (CORS/origem), upload com recibo, publicação em um commit,
 * conflito e recusa de conteúdo inválido. Sem rede.
 */
const ORIGIN = 'https://tha-github.github.io';
const PASSWORD = 'senha-de-teste-123';
const REPO = 'Tha-github/Residencial-Estrela-Dalva';

const site: SiteAdapter = {
  id: 'residencial-estrela-dalva',
  spec: estrelaDalvaSpec,
  validate(content) {
    const r = residencialSchema.safeParse(content);
    return r.success
      ? []
      : r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  },
};

// ---------- GitHub falso ----------
interface FakeRepo {
  files: Map<string, string>; // caminho → conteúdo (texto ou base64 de binário)
  blobs: Map<string, string>;
  head: string;
  commits: { sha: string; message: string; changes: unknown[] }[];
  requests: { method: string; url: string; auth: string | null }[];
}
let repo: FakeRepo;
let n = 0;
const sha = () => (++n).toString(16).padStart(40, '0');

function fakeFetch(
  this: unknown,
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  // Como no runtime do Workers: fetch chamado como método de outro objeto falha.
  if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
  const url = new URL(String(input));
  const method = init.method ?? 'GET';
  const auth = new Headers(init.headers).get('Authorization');
  repo.requests.push({ method, url: url.pathname + url.search, auth });
  const base = `/repos/${REPO}`;
  const p = url.pathname.slice(base.length);
  const ok = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));
  if (auth !== 'Bearer gh-token-secreto') return ok({ message: 'Bad credentials' }, 401);

  if (method === 'GET' && p.startsWith('/contents/')) {
    const path = decodeURIComponent(p.slice('/contents/'.length));
    const file = repo.files.get(path);
    if (file === undefined) return ok({ message: 'Not Found' }, 404);
    if (new Headers(init.headers).get('Accept')?.includes('raw'))
      return Promise.resolve(new Response(Buffer.from(file, 'base64')));
    return ok({
      content: Buffer.from(file).toString('base64'),
      sha: `sha-${file.length}-${repo.head}`,
      encoding: 'base64',
    });
  }
  if (method === 'GET' && p.startsWith('/git/trees/'))
    return ok({
      truncated: false,
      tree: [...repo.files.keys()].map((path) => ({ path, type: 'blob' })),
    });
  if (method === 'POST' && p === '/git/blobs') {
    const s = sha();
    repo.blobs.set(s, JSON.parse(String(init.body)).content);
    return ok({ sha: s }, 201);
  }
  if (method === 'GET' && p.startsWith('/git/ref/heads/'))
    return ok({ object: { sha: repo.head } });
  if (method === 'GET' && p.startsWith('/git/commits/'))
    return ok({ tree: { sha: 'tree-' + repo.head } });
  if (method === 'POST' && p === '/git/trees') {
    const body = JSON.parse(String(init.body));
    (repo as unknown as { pending: unknown }).pending = body.tree;
    return ok({ sha: sha() }, 201);
  }
  if (method === 'POST' && p === '/git/commits') {
    const body = JSON.parse(String(init.body));
    if (body.parents[0] !== repo.head) return ok({ message: 'conflict' }, 409);
    const s = sha();
    const changes = (
      repo as unknown as { pending: { path: string; content?: string; sha?: string | null }[] }
    ).pending;
    repo.commits.push({ sha: s, message: body.message, changes });
    for (const c of changes) {
      if (c.content !== undefined) repo.files.set(c.path, c.content);
      else if (c.sha === null) repo.files.delete(c.path);
      else repo.files.set(c.path, repo.blobs.get(c.sha!)!);
    }
    return ok({ sha: s }, 201);
  }
  if (method === 'PATCH' && p.startsWith('/git/refs/heads/')) {
    repo.head = JSON.parse(String(init.body)).sha;
    return ok({});
  }
  if (method === 'GET' && p === '/actions/runs')
    return ok({
      workflow_runs: [
        {
          name: 'Deploy Astro site to GitHub Pages',
          status: 'completed',
          conclusion: 'success',
          html_url: '',
        },
      ],
    });
  return ok({ message: `rota falsa ausente: ${method} ${p}` }, 500);
}

// ---------- utilitários ----------
let env: Env;
const ACCESS_KEY = 'chave-de-acesso-para-testes';
const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
  handle(
    new Request(`https://admin.example.workers.dev${path}`, {
      method,
      headers: {
        Origin: ORIGIN,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
    site,
    fakeFetch as typeof fetch,
  );

async function login() {
  const r = await call('POST', '/api/login', { accessKey: ACCESS_KEY, password: PASSWORD });
  return ((await r.json()) as { token: string }).token;
}

/** PNG 400×300 mínimo válido (cabeçalho suficiente para a validação). */
function png(w = 400, h = 300) {
  const b = Buffer.alloc(64);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'ascii');
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
}

beforeAll(async () => {
  env = {
    GITHUB_TOKEN: 'gh-token-secreto',
    ADMIN_ACCESS_KEY: ACCESS_KEY,
    ADMIN_PASSWORD_HASH: await hashPassword(PASSWORD, 1000),
    SESSION_SECRET: 'x'.repeat(48),
    GITHUB_REPO: REPO,
    GITHUB_BRANCH: 'main',
    ALLOWED_ORIGINS: ORIGIN,
  };
});

beforeEach(() => {
  repo = {
    files: new Map([[estrelaDalvaSpec.contentPath, `${JSON.stringify(data, null, 2)}\n`]]),
    blobs: new Map(),
    head: 'c'.repeat(40),
    commits: [],
    requests: [],
  };
  // Fotos existentes no repositório
  const used = JSON.stringify(data)
    .match(/"src":"([^"]+)"/g)!
    .map((m) => m.slice(7, -1));
  for (const src of used)
    repo.files.set(`${estrelaDalvaSpec.photosDir}/${src.replace(/^\/fotos\//, '')}`, png().toString('base64'));
});

describe('login e sessão', () => {
  it('senha errada → 401; certa → token; token nunca é o do GitHub', async () => {
    expect((await call('POST', '/api/login', { accessKey: ACCESS_KEY, password: 'errada' })).status).toBe(401);
    expect((await call('POST', '/api/login', { accessKey: 'chave-errada', password: PASSWORD })).status).toBe(401);
    const r = await call('POST', '/api/login', { accessKey: ACCESS_KEY, password: PASSWORD });
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(text).not.toContain('gh-token-secreto');
    expect(JSON.parse(text).token.split('.')).toHaveLength(2);
  });

  it('sem sessão (ou token adulterado) não acessa nada', async () => {
    for (const path of ['/api/content', '/api/session', '/api/status?commit=' + 'a'.repeat(40)]) {
      expect((await call('GET', path)).status).toBe(401);
    }
    const token = await login();
    const forged = token.slice(0, -2) + (token.endsWith('A') ? 'BB' : 'AA');
    expect(
      (await call('GET', '/api/content', undefined, { Authorization: `Bearer ${forged}` })).status,
    ).toBe(401);
    expect((await call('POST', '/api/publish', { content: data }, {})).status).toBe(401);
    expect(repo.commits).toHaveLength(0);
  });

  it('sessão expirada é recusada', async () => {
    const short = { ...env, SESSION_HOURS: '1' };
    const r = await handle(
      new Request('https://x/api/login', {
        method: 'POST',
        headers: { Origin: ORIGIN },
        body: JSON.stringify({ accessKey: ACCESS_KEY, password: PASSWORD }),
      }),
      short,
      site,
      fakeFetch as typeof fetch,
    );
    const { token } = (await r.json()) as { token: string };
    const realNow = Date.now;
    Date.now = () => realNow() + 2 * 3600 * 1000;
    try {
      expect(
        (await call('GET', '/api/session', undefined, { Authorization: `Bearer ${token}` })).status,
      ).toBe(401);
    } finally {
      Date.now = realNow;
    }
  });

  it('origem não autorizada é recusada (CORS)', async () => {
    const r = await call(
      'POST',
      '/api/login',
      { accessKey: ACCESS_KEY, password: PASSWORD },
      { Origin: 'https://evil.example' },
    );
    expect(r.status).toBe(403);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBeNull();
    const pre = await call('OPTIONS', '/api/login');
    expect(pre.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });
});

describe('conteúdo e publicação', () => {
  it('lê o conteúdo e as fotos pelo GitHub com o token do servidor', async () => {
    const token = await login();
    const r = await call('GET', '/api/content', undefined, { Authorization: `Bearer ${token}` });
    const body = (await r.json()) as { content: { name: string }; sha: string; photos: string[] };
    expect(body.content.name).toBe('Residencial Estrela Dalva');
    expect(body.photos).toContain('Sala Moderna com Cozinha Integrada.png');
    expect(repo.requests.every((q) => q.auth === 'Bearer gh-token-secreto')).toBe(true);
  });

  it('publica edição + foto nova em UM commit e persiste', async () => {
    const auth = { Authorization: `Bearer ${await login()}` };
    const { sha: base, content } = (await (
      await call('GET', '/api/content', undefined, auth)
    ).json()) as {
      sha: string;
      content: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    };
    const up = (await (
      await call(
        'POST',
        '/api/upload',
        { name: 'Minha Foto.png', data: png().toString('base64') },
        auth,
      )
    ).json()) as {
      path: string;
      blob: string;
      receipt: string;
    };
    expect(up.path).toMatch(/^\/fotos\/uploads\/\d{8}-[0-9a-f]{6}-minha-foto\.png$/);
    content.copy.locationTitle = 'Localização atualizada';
    content.hero.image = { src: up.path, alt: 'Nova foto do banner' };
    content.theme.primary = '#1d4ed8';
    const r = await call('POST', '/api/publish', { content, sha: base, uploads: [up] }, auth);
    expect(r.status).toBe(200);
    expect(repo.commits).toHaveLength(1);
    const paths = (repo.commits[0]!.changes as { path: string }[]).map((c) => c.path).sort();
    expect(paths).toEqual(
      [`${estrelaDalvaSpec.photosDir}/${up.path.replace(/^\/fotos\//, '')}`, estrelaDalvaSpec.contentPath].sort(),
    );
    // Persistência: o próximo carregamento já traz a versão nova
    const again = (await (await call('GET', '/api/content', undefined, auth)).json()) as {
      content: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      photos: string[];
    };
    expect(again.content.copy.locationTitle).toBe('Localização atualizada');
    expect(again.content.hero.image.src).toBe(up.path);
    expect(again.content.theme.primary).toBe('#1d4ed8');
    expect(again.photos).toContain(up.path.replace(/^\/fotos\//, ''));
    const status = (await (
      await call('GET', `/api/status?commit=${repo.head}`, undefined, auth)
    ).json()) as { state: string };
    expect(status.state).toBe('published');
  });

  it('recusa foto sem recibo válido (não dá para apontar um blob qualquer)', async () => {
    const auth = { Authorization: `Bearer ${await login()}` };
    const { sha: base, content } = (await (
      await call('GET', '/api/content', undefined, auth)
    ).json()) as { sha: string; content: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
    content.hero.image = { src: '/fotos/uploads/20261118-abcdef-x.png', alt: 'x' };
    const r = await call(
      'POST',
      '/api/publish',
      {
        content,
        sha: base,
        uploads: [
          { path: '/fotos/uploads/20261118-abcdef-x.png', blob: 'f'.repeat(40), receipt: 'forjado' },
        ],
      },
      auth,
    );
    expect(r.status).toBe(422);
    expect(repo.commits).toHaveLength(0);
  });

  it('recusa arquivos que não são imagem', async () => {
    const auth = { Authorization: `Bearer ${await login()}` };
    const fake = Buffer.from('<svg onload="alert(1)"></svg>').toString('base64');
    const r = await call('POST', '/api/upload', { name: 'x.png', data: fake }, auth);
    expect(r.status).toBe(422);
    expect(repo.blobs.size).toBe(0);
  });

  it('recusa conteúdo inválido e alterações estruturais, sem commit', async () => {
    const auth = { Authorization: `Bearer ${await login()}` };
    const { sha: base, content } = (await (
      await call('GET', '/api/content', undefined, auth)
    ).json()) as { sha: string; content: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
    const html = structuredClone(content);
    html.faq[0].question = '<img src=x onerror=alert(1)>';
    const r1 = await call('POST', '/api/publish', { content: html, sha: base, uploads: [] }, auth);
    expect(r1.status).toBe(422);
    expect(((await r1.json()) as { details: { path: string }[] }).details[0]!.path).toBe(
      'faq.0.question',
    );
    const extra = structuredClone(content);
    extra.faq.push({ question: 'Nova?', answer: 'Não' });
    expect(
      (await call('POST', '/api/publish', { content: extra, sha: base, uploads: [] }, auth)).status,
    ).toBe(422);
    const ugly = structuredClone(content);
    ugly.theme.background = '#111111';
    expect(
      (await call('POST', '/api/publish', { content: ugly, sha: base, uploads: [] }, auth)).status,
    ).toBe(422);
    const missing = structuredClone(content);
    missing.hero.image.src = '/fotos/nao-existe.png';
    expect(
      (await call('POST', '/api/publish', { content: missing, sha: base, uploads: [] }, auth))
        .status,
    ).toBe(422);
    expect(repo.commits).toHaveLength(0);
  });

  it('conflito: não sobrescreve se o conteúdo mudou desde que foi aberto', async () => {
    const auth = { Authorization: `Bearer ${await login()}` };
    const { content } = (await (await call('GET', '/api/content', undefined, auth)).json()) as {
      content: unknown;
    };
    const r = await call(
      'POST',
      '/api/publish',
      { content, sha: 'versao-antiga', uploads: [] },
      auth,
    );
    expect(r.status).toBe(409);
    expect(repo.commits).toHaveLength(0);
  });

  it('erro do GitHub não vaza detalhes nem o token', async () => {
    const auth = { Authorization: `Bearer ${await login()}` };
    const r = await handle(
      new Request('https://x/api/content', { headers: { Origin: ORIGIN, ...auth } }),
      { ...env, GITHUB_TOKEN: 'token-invalido' },
      site,
      fakeFetch as typeof fetch,
    );
    expect(r.status).toBe(502);
    const text = await r.text();
    expect(text).not.toContain('token');
    expect(text).not.toContain('Bad credentials');
  });
});

describe('validação de imagens', () => {
  it('reconhece PNG e lê as dimensões', () => {
    expect(inspectImage(png(1200, 800))).toEqual({ kind: 'png', width: 1200, height: 800 });
  });
  it('recusa gigante, minúscula e disfarçada', () => {
    expect(checkImage(png(10000, 10000))).toMatchObject({ ok: false });
    expect(checkImage(png(100, 80))).toMatchObject({ ok: false });
    expect(checkImage(new TextEncoder().encode('GIF89a......'))).toMatchObject({ ok: false });
  });
});
