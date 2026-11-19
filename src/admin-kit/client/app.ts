/**
 * Top Site Admin — interface do painel (padrão reutilizável).
 *
 * Fluxo: senha → conteúdo atual (via Worker, direto do GitHub) → edição por
 * módulos (somente campos do descritor) → prévia → confirmação → publicação
 * (um commit) → acompanhamento até o site ser atualizado.
 */
import { clone, getPath, locate, type Module, type SiteSpec } from '../spec';
import { Api, ApiError, type Upload } from './api';
import { h, renderField, type FieldContext } from './fields';
import { add, queue, whenVisible } from './dom';
import { icon } from './icons';
import { prepareImage } from './image';

type Obj = Record<string, unknown>;

export interface AdminOptions {
  spec: SiteSpec;
  apiBase: string;
  /**
   * Miniaturas geradas no build: caminho da foto → URL leve no próprio site.
   * Fotos ausentes aqui (recém-enviadas) caem no download pelo Worker.
   */
  thumbs?: Record<string, string>;
  /** Validação completa do conteúdo (schema do site), igual à do servidor. */
  validate(content: Obj): { path: string; message: string }[];
  /** Prévia específica de um módulo (opcional); devolve null para a genérica. */
  preview?(
    module: Module,
    draft: Obj,
    photoUrl: (src: string) => Promise<string>,
  ): HTMLElement | null;
}

interface State {
  original: Obj;
  draft: Obj;
  sha: string;
  photos: Set<string>;
  uploads: Map<string, Upload & { previewUrl: string }>;
  current: string;
  errors: { path: string; message: string }[];
}

const ERR_GENERIC = 'Algo deu errado. Tente novamente.';
const fingerprint = (mod: Module, content: Obj) =>
  JSON.stringify(mod.fields.map((f) => getPath(content, f.key)));

export function startAdmin(root: HTMLElement, opts: AdminOptions) {
  const { spec } = opts;
  const api = new Api(opts.apiBase.replace(/\/$/, ''));
  let state: State | null = null;
  const photoCache = new Map<string, Promise<string>>();
  // As fotos do repositório são originais grandes: no máximo 3 downloads por vez.
  const limit = queue(3);

  const photoUrl = (src: string) => {
    const up = state?.uploads.get(src);
    if (up) return Promise.resolve(up.previewUrl);
    const thumb = opts.thumbs?.[src];
    if (thumb) return Promise.resolve(thumb);
    if (!photoCache.has(src)) {
      const p = limit(() => api.photo(src));
      p.catch(() => photoCache.delete(src));
      photoCache.set(src, p);
    }
    return photoCache.get(src)!;
  };

  const isDirty = (mod?: Module) =>
    !!state &&
    (mod ? [mod] : spec.modules).some(
      (m) => fingerprint(m, state!.original) !== fingerprint(m, state!.draft),
    );

  window.addEventListener('beforeunload', (e) => {
    if (isDirty()) {
      e.preventDefault();
    }
  });

  /* ------------------------------ login ------------------------------ */

  function showLogin(message?: string, reauth = false) {
    const id = 'admin-password';
    const input = h('input', {
      id,
      type: 'password',
      class: 'inp',
      autocomplete: 'current-password',
      required: true,
    });
    const error = h('p', { class: 'login__error', role: 'alert', hidden: !message }, message ?? '');
    const button = h('button', { type: 'submit', class: 'btn btn--primary btn--block' }, 'Entrar');
    const form = h(
      'form',
      { class: 'login__card' },
      h(
        'div',
        { class: 'login__brand' },
        h('span', { class: 'login__logo' }, icon('lock', 22)),
        h('span', {}, 'Top Site · Painel'),
      ),
      h('h1', { class: 'login__title' }, spec.siteName),
      h(
        'p',
        { class: 'login__lead' },
        reauth
          ? 'Sua sessão expirou. Entre de novo para continuar — suas alterações foram mantidas.'
          : 'Digite a senha para editar o conteúdo do site.',
      ),
      h('label', { class: 'fld__label', for: id }, 'Senha'),
      input,
      error,
      button,
    );
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      button.disabled = true;
      button.textContent = 'Entrando…';
      error.hidden = true;
      try {
        await api.login(input.value);
        if (reauth && state) showApp();
        else await load();
      } catch (err) {
        error.textContent = err instanceof ApiError ? err.message : ERR_GENERIC;
        error.hidden = false;
        input.select();
      } finally {
        button.disabled = false;
        button.textContent = 'Entrar';
      }
    });
    root.replaceChildren(h('main', { class: 'login' }, form));
    input.focus();
  }

  async function load() {
    root.replaceChildren(
      h(
        'div',
        { class: 'loading' },
        h('span', { class: 'spinner' }),
        'Carregando o conteúdo do site…',
      ),
    );
    try {
      const data = await api.content();
      state = {
        original: data.content,
        draft: clone(data.content),
        sha: data.sha,
        photos: new Set(data.photos),
        uploads: state?.uploads ?? new Map(),
        current: state?.current ?? spec.modules[0]!.id,
        errors: [],
      };
      showApp();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return showLogin(e.message);
      root.replaceChildren(
        h(
          'div',
          { class: 'loading' },
          h('p', { class: 'login__error' }, e instanceof ApiError ? e.message : ERR_GENERIC),
          retryButton(),
        ),
      );
    }
  }

  const retryButton = () => {
    const b = h('button', { type: 'button', class: 'btn btn--primary' }, 'Tentar novamente');
    b.addEventListener('click', () => void load());
    return b;
  };

  /* ------------------------------- app ------------------------------- */

  let refreshChrome = () => {};
  let rerenderCurrent = () => {};
  // Prévias específicas podem pedir para redesenhar o módulo (ex.: restaurar cores).
  document.addEventListener('admin:rerender', () => rerenderCurrent());

  function showApp() {
    if (!state) return;
    const s = state;
    const nav = h('nav', { class: 'side__nav', 'aria-label': 'Conteúdos do site' });
    const side = h(
      'aside',
      { class: 'side', id: 'admin-side' },
      h(
        'div',
        { class: 'side__brand' },
        h('span', { class: 'side__logo' }, 'TS'),
        h('div', {}, h('strong', {}, spec.siteName), h('span', {}, 'Painel do site')),
      ),
      nav,
    );
    const menuBtn = h(
      'button',
      {
        type: 'button',
        class: 'icon-btn top__menu',
        'aria-controls': 'admin-side',
        'aria-expanded': 'false',
        'aria-label': 'Abrir menu',
      },
      icon('menu'),
    );
    const status = h('span', { class: 'top__status', 'aria-live': 'polite' });
    const discard = h(
      'button',
      { type: 'button', class: 'btn btn--ghost' },
      icon('undo', 16),
      h('span', { class: 'hide-sm' }, 'Descartar'),
    );
    const publish = h(
      'button',
      { type: 'button', class: 'btn btn--primary' },
      icon('rocket', 16),
      'Publicar',
    );
    const logout = h(
      'button',
      { type: 'button', class: 'icon-btn', 'aria-label': 'Sair do painel', title: 'Sair' },
      icon('logout'),
    );
    const viewSite = h(
      'a',
      {
        class: 'btn btn--ghost hide-sm',
        href: spec.siteUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      icon('external', 16),
      'Ver site',
    );
    const top = h(
      'header',
      { class: 'top' },
      menuBtn,
      status,
      h('div', { class: 'top__actions' }, viewSite, discard, publish, logout),
    );
    const main = h('main', { class: 'main', id: 'admin-main', tabindex: -1 });
    const scrim = h('div', { class: 'side__scrim', hidden: true });
    root.replaceChildren(
      h('div', { class: 'shell' }, side, scrim, h('div', { class: 'content' }, top, main)),
    );

    const setMenu = (open: boolean) => {
      side.classList.toggle('is-open', open);
      scrim.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', () => setMenu(!side.classList.contains('is-open')));
    scrim.addEventListener('click', () => setMenu(false));

    refreshChrome = () => {
      nav.replaceChildren(
        ...spec.modules.map((m) => {
          const b = h(
            'button',
            {
              type: 'button',
              class: `side__item${m.id === s.current ? ' is-active' : ''}`,
              'aria-current': m.id === s.current ? 'page' : undefined,
            },
            icon(m.icon, 18),
            h('span', {}, m.title),
            isDirty(m)
              ? h('span', { class: 'side__dot', title: 'Alterações não publicadas' })
              : null,
          );
          b.addEventListener('click', () => {
            s.current = m.id;
            setMenu(false);
            renderModule();
            main.focus();
          });
          return b;
        }),
      );
      const dirty = isDirty();
      status.replaceChildren(
        dirty ? icon('alert', 16) : icon('check', 16),
        dirty ? 'Alterações não publicadas' : 'Tudo publicado',
      );
      status.className = `top__status ${dirty ? 'is-dirty' : 'is-clean'}`;
      publish.disabled = !dirty;
      discard.disabled = !dirty;
    };

    discard.addEventListener('click', () => {
      if (!confirm('Descartar todas as alterações não publicadas?')) return;
      s.draft = clone(s.original);
      s.errors = [];
      renderModule();
    });
    logout.addEventListener('click', () => {
      if (
        isDirty() &&
        !confirm('Há alterações não publicadas. Sair mesmo assim? Elas serão perdidas.')
      )
        return;
      api.logout();
      state = null;
      showLogin('Você saiu do painel.');
    });
    publish.addEventListener('click', () => void confirmPublish());

    let previewTimer = 0;
    const ctx = (mod: Module, previewBox: HTMLElement): FieldContext => ({
      root: s.draft,
      photoUrl,
      changed: () => {
        refreshChrome();
        clearTimeout(previewTimer);
        previewTimer = window.setTimeout(() => renderPreview(mod, previewBox), 250);
      },
      uploadPhoto: async (file, onProgress) => {
        const img = await prepareImage(file);
        const up = await api.upload(file.name, img.base64, onProgress).catch((e) => {
          if (e instanceof ApiError && e.status === 401) showLogin(e.message, true);
          throw e;
        });
        s.uploads.set(up.path, { ...up, previewUrl: img.previewUrl });
        return { path: up.path, previewUrl: img.previewUrl };
      },
      rerender: () => renderModule(),
    });

    function renderPreview(mod: Module, box: HTMLElement) {
      const custom = opts.preview?.(mod, s.draft, photoUrl);
      box.replaceChildren(
        h(
          'div',
          { class: 'preview__head' },
          h('span', {}, 'Prévia'),
          mod.anchor
            ? h(
                'a',
                {
                  href: `${spec.siteUrl}#${mod.anchor}`,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  class: 'preview__link',
                },
                'Ver no site',
                icon('external', 14),
              )
            : null,
        ),
        custom ?? genericPreview(mod, s.draft, photoUrl),
        h(
          'p',
          { class: 'preview__note' },
          'Prévia simplificada. O site completo é atualizado cerca de 2 minutos após publicar.',
        ),
      );
    }

    function renderModule() {
      const mod = spec.modules.find((m) => m.id === s.current) ?? spec.modules[0]!;
      const previewBox = h('div', { class: 'preview' });
      const form = h('div', { class: 'form' });
      const c = ctx(mod, previewBox);
      for (const f of mod.fields) add(form, renderField(f, s.draft, c));
      const errors = s.errors.length ? errorPanel() : null;
      main.replaceChildren(
        h('div', { class: 'main__head' }, h('h1', {}, mod.title), h('p', {}, mod.description)),
        errors ?? '',
        h(
          'div',
          { class: 'main__grid' },
          form,
          h('aside', { class: 'main__preview', 'aria-label': 'Prévia' }, previewBox),
        ),
      );
      markErrors(mod, form);
      renderPreview(mod, previewBox);
      refreshChrome();
    }

    function errorPanel() {
      const list = h('ul', {});
      for (const err of s.errors) {
        const hit = locate(spec, err.path);
        const b = h(
          'button',
          { type: 'button', class: 'link' },
          hit ? `${hit.module.title} › ${hit.label}` : 'Conteúdo',
          ': ',
          err.message,
        );
        b.addEventListener('click', () => {
          if (hit) s.current = hit.module.id;
          renderModule();
          main.querySelector('.has-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
        add(list, h('li', {}, b));
      }
      return h(
        'div',
        { class: 'alert alert--error', role: 'alert' },
        h('strong', {}, 'Não foi possível publicar. Revise:'),
        list,
      );
    }

    function markErrors(mod: Module, form: HTMLElement) {
      for (const err of s.errors) {
        // Campo do erro, ou todos os campos do grupo (ex.: "theme" → as 5 cores).
        const keys = mod.fields
          .map((f) => f.key)
          .filter(
            (k) =>
              err.path === k ||
              err.path.startsWith(`${k}.`) ||
              (err.path !== '' && k.startsWith(`${err.path}.`)),
          );
        for (const key of keys)
          form.querySelector(`[data-path="${CSS.escape(key)}"]`)?.classList.add('has-error');
      }
    }

    async function confirmPublish() {
      const changed = spec.modules.filter((m) => isDirty(m));
      const problems = opts.validate(s.draft);
      if (problems.length) {
        s.errors = problems;
        renderModule();
        return;
      }
      const dialog = h('dialog', { class: 'modal', 'aria-labelledby': 'pub-title' });
      const ok = h(
        'button',
        { type: 'button', class: 'btn btn--primary' },
        icon('rocket', 16),
        'Publicar agora',
      );
      const cancel = h('button', { type: 'button', class: 'btn btn--ghost' }, 'Cancelar');
      add(
        dialog,
        h('h2', { id: 'pub-title' }, 'Publicar alterações?'),
        h('p', {}, 'Estas partes do site serão atualizadas:'),
        h('ul', { class: 'modal__list' }, ...changed.map((m) => h('li', {}, m.title))),
        h('p', { class: 'fld__help' }, 'O site público é atualizado em cerca de 2 minutos.'),
        h('div', { class: 'modal__actions' }, cancel, ok),
      );
      add(document.body, dialog);
      dialog.showModal();
      cancel.addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => dialog.remove());
      ok.addEventListener('click', async () => {
        ok.disabled = true;
        cancel.disabled = true;
        ok.replaceChildren(h('span', { class: 'spinner spinner--sm' }), 'Publicando…');
        try {
          const used = JSON.stringify(s.draft);
          const uploads = [...s.uploads.values()]
            .filter((u) => used.includes(`"${u.path}"`))
            .map(({ path, blob, receipt }) => ({ path, blob, receipt }));
          const { commit } = await api.publish(s.draft, s.sha, uploads);
          dialog.close();
          s.errors = [];
          const fresh = await api.content();
          for (const [path, up] of s.uploads)
            if (fresh.photos.includes(path)) photoCache.set(path, Promise.resolve(up.previewUrl));
          s.original = fresh.content;
          s.draft = clone(fresh.content);
          s.sha = fresh.sha;
          s.photos = new Set(fresh.photos);
          s.uploads.clear();
          renderModule();
          trackDeploy(commit);
        } catch (e) {
          dialog.close();
          if (e instanceof ApiError && e.status === 401) return showLogin(e.message, true);
          if (e instanceof ApiError && e.details?.length) s.errors = e.details;
          else s.errors = [{ path: '', message: e instanceof ApiError ? e.message : ERR_GENERIC }];
          renderModule();
        }
      });
    }

    function trackDeploy(commit: string) {
      const box = h('div', { class: 'toast', role: 'status' });
      add(document.body, box);
      const set = (kind: string, text: string, done = false) => {
        box.className = `toast toast--${kind}`;
        box.replaceChildren(
          kind === 'busy'
            ? h('span', { class: 'spinner spinner--sm' })
            : icon(kind === 'ok' ? 'check' : 'alert', 18),
          h('span', {}, text),
        );
        if (done) {
          const close = h(
            'button',
            { type: 'button', class: 'icon-btn', 'aria-label': 'Fechar aviso' },
            icon('close', 16),
          );
          close.addEventListener('click', () => box.remove());
          add(box, close);
          if (kind === 'ok') setTimeout(() => box.remove(), 12000);
        }
      };
      set('busy', 'Alterações salvas. Atualizando o site…');
      const started = Date.now();
      const poll = async () => {
        try {
          const { state: st } = await api.status(commit);
          if (st === 'published') return set('ok', 'Pronto! O site já está atualizado.', true);
          if (st === 'failed')
            return set(
              'error',
              'As alterações foram salvas, mas a atualização do site falhou. Avise a Top Site.',
              true,
            );
        } catch {
          /* tenta de novo */
        }
        if (Date.now() - started > 10 * 60_000)
          return set(
            'error',
            'A atualização está demorando. Confira o site em alguns minutos.',
            true,
          );
        setTimeout(poll, 8000);
      };
      setTimeout(poll, 5000);
    }

    rerenderCurrent = renderModule;
    renderModule();
  }

  /* ------------------------------ início ------------------------------ */

  if (!opts.apiBase) {
    root.replaceChildren(
      h(
        'main',
        { class: 'login' },
        h(
          'div',
          { class: 'login__card' },
          h('h1', { class: 'login__title' }, spec.siteName),
          h(
            'p',
            { class: 'login__lead' },
            'O painel ainda não foi configurado. Fale com a Top Site.',
          ),
        ),
      ),
    );
    return;
  }
  void api.hasSession().then((ok) => (ok ? load() : showLogin()));
}

/* ------------------------- prévia genérica ------------------------- */

export function richTitle(text: string): HTMLElement {
  const el = h('span', {});
  text.split(/\*(.+?)\*/).forEach((part, i) => add(el, i % 2 ? h('em', {}, part) : part));
  return el;
}

function genericPreview(mod: Module, draft: Obj, photoUrl: (src: string) => Promise<string>) {
  const box = h('div', { class: 'pv' });
  const sec = mod.fields.find((f) => f.key.endsWith('.eyebrow'))?.key.replace(/\.eyebrow$/, '');
  if (sec) {
    const get = (k: string) => getPath(draft, `${sec}.${k}`) as string | undefined;
    add(
      box,
      h('p', { class: 'pv__eyebrow' }, get('eyebrow') ?? ''),
      h('h3', { class: 'pv__title' }, richTitle(get('title') ?? '')),
      get('lead') ? h('p', { class: 'pv__lead' }, get('lead')!) : null,
    );
  }
  for (const f of mod.fields) {
    const v = getPath(draft, f.key);
    if (f.type === 'image' && v && typeof v === 'object') add(box, thumbs([v as Obj], photoUrl));
    if (f.type === 'paragraphs' && Array.isArray(v))
      v.forEach((p) => add(box, h('p', { class: 'pv__text' }, String(p))));
    if (f.type === 'strings' && Array.isArray(v) && v.length)
      add(box, h('ul', { class: 'pv__list' }, ...v.map((s) => h('li', {}, String(s)))));
    if (f.type === 'list' && Array.isArray(v)) {
      const images = v
        .map((item) =>
          f.item.some((s) => s.key === '$self')
            ? item
            : f.item.find((s) => s.type === 'image')
              ? getPath(item, f.item.find((s) => s.type === 'image')!.key)
              : undefined,
        )
        .filter((x): x is Obj => !!x && typeof x === 'object' && 'src' in (x as Obj));
      const texts = f.item.filter((s) => s.type === 'text' || s.type === 'textarea');
      if (texts.length) {
        add(
          box,
          h(
            'ul',
            { class: 'pv__items' },
            ...v
              // Itens sem texto (ex.: foto sem legenda) não viram linha vazia.
              .filter((item) => String(getPath(item, texts[0]!.key) ?? '').trim())
              .slice(0, 8)
              .map((item) =>
                h(
                  'li',
                  {},
                  h('strong', {}, String(getPath(item, texts[0]!.key) ?? '')),
                  texts[1] ? h('span', {}, String(getPath(item, texts[1]!.key) ?? '')) : null,
                ),
              ),
          ),
        );
      }
      if (images.length) add(box, thumbs(images.slice(0, 9), photoUrl));
    }
  }
  return box;
}

function thumbs(images: Obj[], photoUrl: (src: string) => Promise<string>) {
  const grid = h('div', { class: 'pv__thumbs' });
  for (const im of images) {
    const img = h('img', { alt: String(im.alt ?? '') });
    const src = typeof im.src === 'string' ? im.src : '';
    // Só baixa quando a miniatura aparece na tela.
    if (src)
      whenVisible(img, () =>
        photoUrl(src)
          .then((u) => (img.src = u))
          .catch(() => {}),
      );
    add(grid, img);
  }
  return grid;
}
