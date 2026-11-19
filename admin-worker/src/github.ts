/**
 * Cliente mínimo da API do GitHub (REST), usado SOMENTE no Worker.
 * O token nunca sai daqui: não é logado, não é devolvido ao navegador.
 *
 * Publicação = UM commit com o conteúdo e as fotos novas (Git Data API):
 * blobs → árvore → commit → avanço da branch sem force (se a branch andou
 * no meio do caminho, o GitHub recusa e nada é sobrescrito).
 */
const API = 'https://api.github.com';

export class GitHubError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

export interface TreeChange {
  path: string;
  /** Conteúdo de texto (UTF-8) — cria o blob junto com a árvore. */
  content?: string;
  /** Blob já existente (ex.: foto enviada); `null` remove o arquivo. */
  sha?: string | null;
}

export class GitHub {
  private readonly fetcher: typeof fetch;

  constructor(
    private readonly token: string,
    private readonly repo: string,
    private readonly branch: string,
    fetcher: typeof fetch = fetch,
  ) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('GITHUB_REPO inválido');
    if (!/^[\w./-]+$/.test(branch)) throw new Error('GITHUB_BRANCH inválido');
    // Chamado como função solta: no runtime do Workers, `fetch` invocado como
    // método de outro objeto falha com "Illegal invocation".
    this.fetcher = (input, init) => fetcher(input, init);
  }

  private async req<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await this.fetcher(`${API}/repos/${this.repo}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'topsite-admin',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!res.ok) {
      let message = `GitHub respondeu ${res.status}`;
      try {
        const body = (await res.json()) as { message?: string };
        if (body.message) message += `: ${body.message}`;
      } catch {
        /* corpo vazio */
      }
      throw new GitHubError(res.status, message);
    }
    return (await res.json()) as T;
  }

  /** Arquivo de texto da branch: conteúdo + sha do blob (controle de versão). */
  async getText(path: string): Promise<{ text: string; sha: string }> {
    const file = await this.req<{ content: string; sha: string; encoding: string }>(
      `/contents/${encodePath(path)}?ref=${encodeURIComponent(this.branch)}`,
    );
    const bin = atob(file.content.replace(/\n/g, ''));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return { text: new TextDecoder().decode(bytes), sha: file.sha };
  }

  /** Arquivo binário (ex.: foto para pré-visualização no painel). */
  async getBytes(path: string): Promise<Uint8Array<ArrayBuffer>> {
    const res = await this.fetcher(
      `${API}/repos/${this.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(this.branch)}`,
      {
        headers: {
          Accept: 'application/vnd.github.raw+json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'topsite-admin',
        },
      },
    );
    if (!res.ok) throw new GitHubError(res.status, `Arquivo não encontrado (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  }

  /** Caminhos de arquivos sob `dir` (relativos a ele) na branch. */
  async listFiles(dir: string): Promise<Set<string>> {
    const prefix = dir.replace(/\/?$/, '/');
    const tree = await this.req<{ tree: { path: string; type: string }[]; truncated: boolean }>(
      `/git/trees/${encodeURIComponent(this.branch)}?recursive=1`,
    );
    if (tree.truncated) throw new GitHubError(500, 'Repositório grande demais para listar');
    return new Set(
      tree.tree
        .filter((e) => e.type === 'blob' && e.path.startsWith(prefix))
        .map((e) => e.path.slice(prefix.length)),
    );
  }

  async createBlob(base64: string): Promise<string> {
    const blob = await this.req<{ sha: string }>('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: base64, encoding: 'base64' }),
    });
    return blob.sha;
  }

  async headSha(): Promise<string> {
    const ref = await this.req<{ object: { sha: string } }>(
      `/git/ref/heads/${encodePath(this.branch)}`,
    );
    return ref.object.sha;
  }

  /** Cria UM commit com todas as mudanças e avança a branch (sem force). */
  async commit(changes: TreeChange[], message: string, parent: string): Promise<string> {
    const base = await this.req<{ tree: { sha: string } }>(`/git/commits/${parent}`);
    const tree = await this.req<{ sha: string }>('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: base.tree.sha,
        tree: changes.map((c) =>
          c.content !== undefined
            ? { path: c.path, mode: '100644', type: 'blob', content: c.content }
            : { path: c.path, mode: '100644', type: 'blob', sha: c.sha ?? null },
        ),
      }),
    });
    const commit = await this.req<{ sha: string }>('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message, tree: tree.sha, parents: [parent] }),
    });
    await this.req(`/git/refs/heads/${encodePath(this.branch)}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
    return commit.sha;
  }

  /** Execuções do GitHub Actions para um commit (publicação do site). */
  async runsFor(sha: string) {
    const data = await this.req<{
      workflow_runs: {
        name: string;
        status: string;
        conclusion: string | null;
        html_url: string;
      }[];
    }>(`/actions/runs?head_sha=${encodeURIComponent(sha)}&per_page=10`);
    return data.workflow_runs.map((r) => ({
      name: r.name,
      status: r.status,
      conclusion: r.conclusion,
    }));
  }
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');
