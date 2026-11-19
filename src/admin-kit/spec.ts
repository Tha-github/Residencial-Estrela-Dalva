/**
 * Top Site Admin Kit — contrato dos campos editáveis (CMS fechado).
 *
 * Um site descreve, em `src/admin-sites/<site>.ts`, QUAIS campos do seu
 * arquivo de conteúdo o proprietário pode editar. O mesmo descritor:
 *  - monta a interface do painel (src/admin-kit/client);
 *  - é a lista branca do servidor (admin-worker): `applyEdits` copia do
 *    pedido SOMENTE os campos declarados, sobre o conteúdo atual do GitHub.
 *    Qualquer outra chave enviada é ignorada; listas fixas não mudam de
 *    tamanho; listas editáveis respeitam mínimo e máximo.
 *
 * Nada aqui aceita HTML: todo texto é texto puro (o schema do site ainda
 * rejeita "<" e ">").
 */

export interface Option {
  value: string;
  label: string;
}

interface Base {
  /** Caminho a partir do objeto pai (ex.: "sections.tour.title"). */
  key: string;
  label: string;
  help?: string;
  /** Campo opcional: vazio remove a chave do conteúdo. */
  optional?: boolean;
}

export type Field =
  | (Base & { type: 'text'; max: number; placeholder?: string })
  | (Base & { type: 'textarea'; max: number; rows?: number })
  /** Lista de parágrafos (string[]), um por linha em branco. */
  | (Base & { type: 'paragraphs'; max: number; maxItems: number })
  | (Base & { type: 'url'; placeholder?: string })
  | (Base & { type: 'email' })
  /** Link wa.me: o painel edita número + mensagem e monta o link. */
  | (Base & { type: 'whatsapp' })
  | (Base & { type: 'number'; min: number; max: number; step?: number; suffix?: string })
  | (Base & { type: 'select'; options?: Option[]; optionsFrom?: OptionsFrom })
  | (Base & { type: 'icon'; options: Option[] })
  | (Base & { type: 'color' })
  /** { src, alt, focus? } — foto existente ou enviada pelo painel. */
  | (Base & { type: 'image'; credit?: boolean })
  /** string[] */
  | (Base & {
      type: 'strings';
      max: number;
      mode: 'fixed' | 'editable';
      maxItems?: number;
      itemLabel: string;
    })
  | ListField;

/** Opções de um seletor vindas do próprio conteúdo (ex.: ambientes). */
export interface OptionsFrom {
  path: string;
  value: string;
  label: string;
}

export interface ListField extends Base {
  type: 'list';
  item: Field[];
  /**
   * fixed:    mesmo número de itens, mesma ordem (só edita o conteúdo).
   * sortable: mesmos itens, pode reordenar.
   * editable: pode reordenar, remover e adicionar (min/max).
   */
  mode: 'fixed' | 'sortable' | 'editable';
  min?: number;
  max?: number;
  /** Título de cada item no painel; "{chave}" é substituído pelo valor. */
  itemLabel: string;
  /** Chave que identifica um item (preserva campos não editáveis). */
  identity?: string;
  /** Item novo (modo editable). */
  newItem?: Record<string, unknown>;
}

export interface Module {
  id: string;
  title: string;
  /** Nome de ícone do painel (ver client/icons.ts). */
  icon: string;
  description: string;
  fields: Field[];
  /** Âncora da seção no site, para o link "ver no site". */
  anchor?: string;
}

export interface SiteSpec {
  siteName: string;
  /** Endereço público do site (link "Ver site"). */
  siteUrl: string;
  /** Arquivo de conteúdo no repositório. */
  contentPath: string;
  /** Pasta das fotos (raiz dos `src` de imagem). */
  photosDir: string;
  /** Subpasta (dentro de photosDir) onde o painel grava fotos novas. */
  uploadsSubdir: string;
  /** Prefixo público usado nas referências de imagem (ex.: /fotos/). */
  imagePrefix?: string;
  modules: Module[];
}

/* ------------------------------------------------------------------ */
/* Acesso por caminho                                                  */
/* ------------------------------------------------------------------ */

/** Chave especial: o próprio item da lista (ex.: lista de imagens). */
export const SELF = '$self';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

export function getPath(obj: unknown, path: string): unknown {
  if (path === SELF) return obj;
  return path.split('.').reduce<unknown>((acc, k) => (isObj(acc) ? acc[k] : undefined), obj);
}

export function setPath(obj: Obj, path: string, value: unknown): void {
  const keys = path.split('.');
  let cur: Obj = obj;
  for (const k of keys.slice(0, -1)) {
    if (!isObj(cur[k])) cur[k] = {};
    cur = cur[k] as Obj;
  }
  const last = keys.at(-1)!;
  if (value === undefined) delete cur[last];
  else cur[last] = value;
}

export const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

/* ------------------------------------------------------------------ */
/* Lista branca: aplica no conteúdo atual somente os campos permitidos */
/* ------------------------------------------------------------------ */

export class EditError extends Error {
  constructor(
    public readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = 'EditError';
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

function scalar(field: Field, value: unknown, path: string): unknown {
  switch (field.type) {
    case 'number': {
      if (value === '' || value === null || value === undefined) return undefined;
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) throw new EditError(path, 'Número inválido');
      return n;
    }
    case 'image': {
      if (!isObj(value)) return undefined;
      // Só src, alt e crédito vêm do painel. O ponto focal NÃO é editável:
      // é preservado do conteúdo atual quando a foto continua a mesma.
      const out: Obj = { src: str(value.src) ?? '', alt: (str(value.alt) ?? '').trim() };
      if (field.credit && str(value.credit)?.trim()) out.credit = str(value.credit)!.trim();
      return out;
    }
    default: {
      if (value === null || value === undefined) return undefined;
      if (typeof value !== 'string') throw new EditError(path, 'Valor inválido');
      const v = value.trim();
      return v === '' ? undefined : v;
    }
  }
}

function applyField(target: Obj, incoming: unknown, field: Field, prefix: string): void {
  const path = prefix ? `${prefix}.${field.key}` : field.key;
  const value = getPath(incoming, field.key);
  const current = getPath(target, field.key);

  if (field.type === 'list') {
    if (!Array.isArray(value)) throw new EditError(path, 'Lista inválida');
    const cur = Array.isArray(current) ? current : [];
    if (field.mode !== 'editable' && value.length !== cur.length) {
      throw new EditError(path, 'Não é permitido adicionar ou remover itens desta lista');
    }
    if (field.mode === 'editable') {
      if (field.min !== undefined && value.length < field.min)
        throw new EditError(path, `Mínimo de ${field.min} itens`);
      if (field.max !== undefined && value.length > field.max)
        throw new EditError(path, `Máximo de ${field.max} itens`);
    }
    const id = field.identity;
    const used = new Set<number>();
    const next = value.map((item, i) => {
      if (!isObj(item)) throw new EditError(`${path}.${i}`, 'Item inválido');
      // Base do item: preserva os campos NÃO editáveis do item correspondente.
      //  fixed → mesma posição; sortable → mesma identidade (ou posição);
      //  editable → mesma identidade (ou item novo).
      let base: unknown;
      const idx =
        id && field.mode !== 'fixed'
          ? cur.findIndex(
              (c, j) =>
                !used.has(j) &&
                getPath(c, id) !== undefined &&
                getPath(c, id) === getPath(item, id),
            )
          : -1;
      if (idx >= 0) used.add(idx);
      if (field.mode === 'fixed') base = cur[i];
      else if (field.mode === 'sortable') base = idx >= 0 ? cur[idx] : cur[i];
      else base = idx >= 0 ? cur[idx] : field.newItem;
      const out: Obj = isObj(base) ? clone(base) : {};
      for (const sub of field.item) {
        if (sub.key === SELF && sub.type === 'image') {
          // A foto é o próprio item: src/alt (e crédito) mesclados nele.
          const img = scalar(sub, item, `${path}.${i}`) as Obj | undefined;
          if (!img || !img.src) throw new EditError(`${path}.${i}`, 'Foto obrigatória');
          if (out.src !== img.src) delete out.focus; // ponto focal era da foto anterior
          delete out.credit;
          Object.assign(out, img);
        } else applyField(out, item, sub, `${path}.${i}`);
      }
      return out;
    });
    setPath(target, field.key, next);
    return;
  }

  if (field.type === 'strings' || field.type === 'paragraphs') {
    if (!Array.isArray(value) || value.some((s) => typeof s !== 'string'))
      throw new EditError(path, 'Lista de textos inválida');
    const cur = Array.isArray(current) ? current : [];
    const items = (value as string[]).map((s) => s.trim());
    if (field.type === 'strings' && field.mode === 'fixed' && items.length !== cur.length)
      throw new EditError(path, 'Não é permitido adicionar ou remover itens desta lista');
    const max = field.type === 'paragraphs' ? field.maxItems : (field.maxItems ?? cur.length);
    const kept = field.type === 'paragraphs' ? items.filter(Boolean) : items;
    if (kept.length > max) throw new EditError(path, `Máximo de ${max} itens`);
    setPath(target, field.key, kept);
    return;
  }

  const next = scalar(field, value, path);
  // Mesma foto: mantém o ponto focal atual (campo não editável).
  if (
    field.type === 'image' &&
    isObj(next) &&
    isObj(current) &&
    current.src === next.src &&
    current.focus
  )
    next.focus = current.focus;
  if (next === undefined && !field.optional && current !== undefined) {
    throw new EditError(path, 'Campo obrigatório');
  }
  setPath(target, field.key, next);
}

/**
 * Devolve um NOVO conteúdo = `current` + somente os campos permitidos de
 * `incoming`. Lança EditError (com caminho) se o pedido violar a estrutura.
 * A validação de formato (tamanhos, URLs, cores...) é do schema do site.
 */
export function applyEdits(current: unknown, incoming: unknown, spec: SiteSpec): Obj {
  if (!isObj(current) || !isObj(incoming)) throw new EditError('', 'Conteúdo inválido');
  const out = clone(current);
  for (const mod of spec.modules) for (const f of mod.fields) applyField(out, incoming, f, '');
  return out;
}

/** Todas as fontes de imagem (src) usadas pelos campos do descritor. */
export function imageSources(content: unknown, spec: SiteSpec): string[] {
  const found: string[] = [];
  const walk = (obj: unknown, fields: Field[]) => {
    for (const f of fields) {
      const v = getPath(obj, f.key);
      if (f.type === 'image' && isObj(v) && typeof v.src === 'string' && v.src) found.push(v.src);
      if (f.type === 'list' && Array.isArray(v)) v.forEach((item) => walk(item, f.item));
    }
  };
  for (const m of spec.modules) walk(content, m.fields);
  return found;
}

/** Localiza o campo (e o módulo) de um caminho de erro, ex.: "faq.2.answer". */
export function locate(
  spec: SiteSpec,
  path: string,
): { module: Module; label: string } | undefined {
  const parts = path.split('.');
  for (const module of spec.modules) {
    const hit = find(module.fields, parts);
    if (hit) return { module, label: hit };
  }
  // Erro de um grupo inteiro (ex.: "theme", contraste das cores): o módulo dono.
  for (const module of spec.modules) {
    if (path && module.fields.some((f) => f.key.startsWith(`${path}.`)))
      return { module, label: module.title };
  }
  return undefined;
}

function find(fields: Field[], parts: string[]): string | undefined {
  for (const f of fields) {
    const keys = f.key.split('.');
    if (keys.every((k, i) => parts[i] === k)) {
      const rest = parts.slice(keys.length);
      if (f.type === 'list' && rest.length > 1 && /^\d+$/.test(rest[0]!)) {
        const sub = find(f.item, rest.slice(1));
        return `${f.label} › item ${Number(rest[0]) + 1}${sub ? ` › ${sub}` : ''}`;
      }
      return f.label;
    }
  }
  return undefined;
}
