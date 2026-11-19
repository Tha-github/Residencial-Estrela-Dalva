/**
 * Cliente do serviço intermediário (Worker). Guarda somente o token de
 * SESSÃO do painel (assinado pelo Worker, expira em horas) — nunca o token
 * do GitHub, que não sai do servidor.
 */
const KEY = 'topsite-admin-session';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

export interface ContentResponse {
  content: Record<string, unknown>;
  sha: string;
  photos: string[];
}

export interface Upload {
  path: string;
  blob: string;
  receipt: string;
}

export class Api {
  constructor(private readonly base: string) {}

  get token(): string | null {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  }

  private set token(value: string | null) {
    try {
      if (value) sessionStorage.setItem(KEY, value);
      else sessionStorage.removeItem(KEY);
    } catch {
      /* navegação privada: sessão só em memória nesta aba */
    }
    this.memory = value;
  }

  private memory: string | null = null;
  private auth(): string | null {
    return this.token ?? this.memory;
  }

  logout() {
    this.token = null;
  }

  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.base}${path}`, {
        ...init,
        headers: {
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(this.auth() ? { Authorization: `Bearer ${this.auth()}` } : {}),
        },
      });
    } catch {
      throw new ApiError(0, 'Sem conexão com o servidor do painel. Verifique a internet.');
    }
    if (res.status === 204) return undefined as T;
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      details?: { path: string; message: string }[];
    };
    if (!res.ok) {
      if (res.status === 401 && path !== '/api/login') this.token = null;
      throw new ApiError(res.status, body.error ?? `Erro ${res.status}`, body.details);
    }
    return body as T;
  }

  async login(password: string) {
    const r = await this.call<{ token: string; expiresAt: number }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    this.token = r.token;
  }

  setupStatus() {
    return this.call<{ configured: boolean }>('/api/setup/status');
  }

  setup(values: { provisioningCode: string; githubToken: string; password: string }) {
    return this.call<{ configured: boolean }>('/api/setup', {
      method: 'POST',
      body: JSON.stringify(values),
    });
  }

  async hasSession(): Promise<boolean> {
    if (!this.auth()) return false;
    try {
      await this.call('/api/session');
      return true;
    } catch {
      return false;
    }
  }

  content() {
    return this.call<ContentResponse>('/api/content');
  }

  publish(content: unknown, sha: string, uploads: Upload[]) {
    return this.call<{ commit: string }>('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ content, sha, uploads }),
    });
  }

  status(commit: string) {
    return this.call<{ state: 'queued' | 'running' | 'published' | 'failed' }>(
      `/api/status?commit=${commit}`,
    );
  }

  /** Foto do repositório (prévia), como URL local do navegador. */
  async photo(path: string): Promise<string> {
    const res = await fetch(`${this.base}/api/photo?path=${encodeURIComponent(path)}`, {
      headers: this.auth() ? { Authorization: `Bearer ${this.auth()}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, 'Foto indisponível');
    return URL.createObjectURL(await res.blob());
  }

  /** Envio de foto com progresso (XHR: o fetch não informa o upload). */
  upload(name: string, data: string, onProgress: (ratio: number) => void): Promise<Upload> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.base}/api/upload`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      const token = this.auth();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onerror = () => reject(new ApiError(0, 'Falha de conexão durante o envio.'));
      xhr.onload = () => {
        let body: { error?: string } & Partial<Upload> = {};
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          /* resposta vazia */
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as Upload);
        else {
          if (xhr.status === 401) this.token = null;
          reject(new ApiError(xhr.status, body.error ?? 'Não foi possível enviar a foto.'));
        }
      };
      xhr.send(JSON.stringify({ name, data }));
    });
  }
}
