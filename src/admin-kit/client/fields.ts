/**
 * Componentes de campo do painel (DOM puro, sem frameworks, sem innerHTML).
 * Cada campo lê e grava diretamente no rascunho (objeto `obj` + `field.key`)
 * e avisa `ctx.changed()` a cada alteração.
 */
import { getPath, setPath, SELF, type Field, type ListField, type Option } from '../spec';
import { add, addFirst, whenVisible, type Kid } from './dom';
import { icon } from './icons';
import { ACCEPT, prepareImage } from './image';

type Obj = Record<string, unknown>;

export interface FieldContext {
  root: Obj;
  changed(): void;
  photoUrl(src: string): Promise<string>;
  uploadPhoto(
    file: File,
    onProgress: (ratio: number) => void,
  ): Promise<{ path: string; previewUrl: string }>;
  rerender(): void;
}

/* ---------------------------- utilitários ---------------------------- */

type Child = Kid;
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | undefined> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') el.className = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) add(el, c);
  return el;
}

let uid = 0;
const nextId = () => `f${++uid}`;

const read = (obj: Obj, key: string) => (key === SELF ? obj : getPath(obj, key));
const write = (obj: Obj, key: string, value: unknown) => {
  if (key === SELF) {
    if (value && typeof value === 'object') Object.assign(obj, value);
  } else setPath(obj, key, value);
};

function wrap(field: Field, control: Node, id: string, extra?: Child) {
  return h(
    'div',
    { class: 'fld', 'data-path': field.key },
    h(
      'label',
      { class: 'fld__label', for: id },
      field.label,
      field.optional ? h('span', { class: 'fld__opt' }, ' (opcional)') : null,
    ),
    field.help ? h('p', { class: 'fld__help', id: `${id}-help` }, field.help) : null,
    control,
    extra,
  );
}

function counter(input: HTMLInputElement | HTMLTextAreaElement, max: number) {
  const out = h('span', { class: 'fld__count', 'aria-live': 'polite' });
  const update = () => {
    out.textContent = `${input.value.length}/${max}`;
    out.classList.toggle('is-over', input.value.length > max);
  };
  input.addEventListener('input', update);
  update();
  return out;
}

/* ------------------------------ campos ------------------------------- */

function textField(
  field: Extract<Field, { type: 'text' | 'textarea' }>,
  obj: Obj,
  ctx: FieldContext,
) {
  const id = nextId();
  const value = (read(obj, field.key) as string | undefined) ?? '';
  const input =
    field.type === 'textarea'
      ? h('textarea', { id, rows: field.rows ?? 3, maxlength: field.max + 20, class: 'inp' })
      : h('input', {
          id,
          type: 'text',
          maxlength: field.max + 20,
          class: 'inp',
          placeholder: field.placeholder,
        });
  input.value = value;
  if (field.help) input.setAttribute('aria-describedby', `${id}-help`);
  input.addEventListener('input', () => {
    write(obj, field.key, input.value === '' && field.optional ? undefined : input.value);
    ctx.changed();
  });
  return wrap(field, input, id, counter(input, field.max));
}

function paragraphsField(
  field: Extract<Field, { type: 'paragraphs' }>,
  obj: Obj,
  ctx: FieldContext,
) {
  const id = nextId();
  const input = h('textarea', { id, rows: 8, class: 'inp' });
  input.value = ((read(obj, field.key) as string[] | undefined) ?? []).join('\n\n');
  input.addEventListener('input', () => {
    const parts = input.value
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean);
    write(obj, field.key, parts);
    ctx.changed();
  });
  return wrap(field, input, id);
}

function simpleInput(
  field: Field,
  type: 'url' | 'email',
  obj: Obj,
  ctx: FieldContext,
  placeholder?: string,
) {
  const id = nextId();
  const input = h('input', {
    id,
    type,
    class: 'inp',
    placeholder,
    inputmode: type === 'email' ? 'email' : 'url',
  });
  input.value = (read(obj, field.key) as string | undefined) ?? '';
  input.addEventListener('input', () => {
    write(obj, field.key, input.value.trim() === '' ? undefined : input.value.trim());
    ctx.changed();
  });
  const extra =
    type === 'url'
      ? h(
          'a',
          {
            class: 'fld__test',
            href: input.value || '#',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          'Testar link',
          icon('external', 14),
        )
      : null;
  if (extra) input.addEventListener('input', () => extra.setAttribute('href', input.value || '#'));
  return wrap(field, input, id, extra);
}

/** WhatsApp: o proprietário digita número e mensagem; o link wa.me é montado aqui. */
function whatsappField(field: Field, obj: Obj, ctx: FieldContext) {
  const id = nextId();
  const current = (read(obj, field.key) as string | undefined) ?? '';
  let digits = '';
  let message = '';
  try {
    const u = new URL(current);
    digits = u.pathname.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    message = u.searchParams.get('text') ?? '';
  } catch {
    /* sem número ainda */
  }
  const phone = h('input', {
    id,
    type: 'tel',
    class: 'inp',
    placeholder: '(48) 99999-9999',
    inputmode: 'tel',
  });
  const fmt = (d: string) =>
    d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d;
  phone.value = fmt(digits);
  const msgId = nextId();
  const msg = h('textarea', { id: msgId, rows: 2, class: 'inp', maxlength: 300 });
  msg.value = message;
  const error = h('p', { class: 'fld__error', hidden: true });
  const update = () => {
    const d = phone.value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    const valid = /^\d{10,11}$/.test(d);
    error.hidden = valid || d === '';
    error.textContent = 'Informe DDD + número, ex.: (48) 99999-9999.';
    const text = msg.value.trim();
    write(
      obj,
      field.key,
      valid
        ? `https://wa.me/55${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`
        : d === ''
          ? undefined
          : current,
    );
    ctx.changed();
  };
  phone.addEventListener('input', update);
  phone.addEventListener(
    'blur',
    () => (phone.value = fmt(phone.value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''))),
  );
  msg.addEventListener('input', update);
  return h(
    'div',
    { class: 'fld', 'data-path': field.key },
    h('label', { class: 'fld__label', for: id }, `${field.label} — número com DDD`),
    phone,
    error,
    h(
      'label',
      { class: 'fld__label fld__label--sub', for: msgId },
      'Mensagem que já aparece escrita (opcional)',
    ),
    msg,
  );
}

function numberField(field: Extract<Field, { type: 'number' }>, obj: Obj, ctx: FieldContext) {
  const id = nextId();
  const input = h('input', {
    id,
    type: 'number',
    class: 'inp inp--num',
    min: field.min,
    max: field.max,
    step: field.step ?? 1,
    inputmode: 'numeric',
  });
  const v = read(obj, field.key);
  input.value = v === undefined ? '' : String(v);
  input.addEventListener('input', () => {
    write(obj, field.key, input.value === '' ? undefined : Number(input.value));
    ctx.changed();
  });
  const row = h(
    'div',
    { class: 'inp-row' },
    input,
    field.suffix ? h('span', { class: 'inp-suffix' }, field.suffix) : null,
  );
  return wrap(field, row, id);
}

function selectField(
  field: Extract<Field, { type: 'select' | 'icon' }>,
  obj: Obj,
  ctx: FieldContext,
) {
  const id = nextId();
  const options: Option[] =
    field.type === 'select' && field.optionsFrom
      ? ((getPath(ctx.root, field.optionsFrom.path) as Obj[] | undefined) ?? []).map((o) => ({
          value: String(getPath(o, field.optionsFrom!.value)),
          label: String(getPath(o, field.optionsFrom!.label)),
        }))
      : (field.options ?? []);
  const select = h('select', { id, class: 'inp' });
  if (field.optional) add(select, h('option', { value: '' }, '— Nenhum —'));
  for (const o of options) add(select, h('option', { value: o.value }, o.label));
  select.value = (read(obj, field.key) as string | undefined) ?? '';
  select.addEventListener('change', () => {
    write(obj, field.key, select.value === '' ? undefined : select.value);
    ctx.changed();
  });
  return wrap(field, select, id);
}

function colorField(field: Field, obj: Obj, ctx: FieldContext) {
  const id = nextId();
  const value = (read(obj, field.key) as string | undefined) ?? '#000000';
  const picker = h('input', { id, type: 'color', class: 'color__picker' });
  const hex = h('input', {
    type: 'text',
    class: 'inp color__hex',
    maxlength: 7,
    'aria-label': `${field.label} (código)`,
    spellcheck: 'false',
  });
  picker.value = value;
  hex.value = value;
  const set = (v: string) => {
    write(obj, field.key, v.toLowerCase());
    ctx.changed();
  };
  picker.addEventListener('input', () => {
    hex.value = picker.value;
    set(picker.value);
  });
  hex.addEventListener('input', () => {
    if (/^#[0-9a-f]{6}$/i.test(hex.value)) {
      picker.value = hex.value;
      set(hex.value);
    }
  });
  return wrap(field, h('div', { class: 'color' }, picker, hex), id);
}

/** Foto: prévia, troca (com processamento e progresso), texto alternativo. */
function imageField(field: Extract<Field, { type: 'image' }>, obj: Obj, ctx: FieldContext) {
  const id = nextId();
  const value = () => read(obj, field.key) as Obj | undefined;
  const img = h('img', { class: 'img__preview', alt: '' });
  const empty = h('div', { class: 'img__empty' }, icon('images', 28), h('span', {}, 'Sem foto'));
  const frame = h('div', { class: 'img__frame' }, img, empty);
  const status = h('p', { class: 'img__status', 'aria-live': 'polite' });
  const bar = h('progress', { class: 'img__progress', max: 1, value: 0, hidden: true });
  const file = h('input', { type: 'file', accept: ACCEPT, class: 'sr-only', id: `${id}-file` });
  const pick = h(
    'label',
    { class: 'btn btn--ghost', for: `${id}-file` },
    icon('upload', 16),
    value()?.src ? 'Trocar foto' : 'Escolher foto',
  );
  const altId = nextId();
  const alt = h('input', {
    id: altId,
    type: 'text',
    class: 'inp',
    maxlength: 250,
    placeholder: 'Ex.: Sala com sofá de couro e parede azul',
  });
  alt.value = (value()?.alt as string | undefined) ?? '';
  alt.addEventListener('input', () => {
    const v = value();
    if (v) {
      v.alt = alt.value;
      ctx.changed();
    }
  });

  const show = (src?: string) => {
    img.hidden = !src;
    empty.hidden = Boolean(src);
    if (src) {
      img.removeAttribute('src');
      frame.classList.add('is-loading');
      // Só baixa quando o campo aparece na tela (itens recolhidos não baixam).
      whenVisible(frame, () =>
        ctx
          .photoUrl(src)
          .then((url) => (img.src = url))
          .catch(() => (status.textContent = 'Não foi possível carregar a prévia.'))
          .finally(() => frame.classList.remove('is-loading')),
      );
    }
  };
  show(value()?.src as string | undefined);

  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    file.value = '';
    if (!f) return;
    status.textContent = 'Preparando a foto…';
    status.className = 'img__status';
    bar.hidden = false;
    bar.value = 0;
    try {
      const { path, previewUrl } = await ctx.uploadPhoto(f, (r) => {
        bar.value = r;
        status.textContent = `Enviando… ${Math.round(r * 100)}%`;
      });
      const next: Obj = { src: path, alt: alt.value };
      if (field.key === SELF) {
        delete obj.focus;
        Object.assign(obj, next);
      } else {
        // Foto nova: o crédito da anterior não vale mais.
        write(obj, field.key, next);
      }
      img.src = previewUrl;
      img.hidden = false;
      empty.hidden = true;
      pick.lastChild!.textContent = 'Trocar foto';
      status.textContent = 'Foto enviada. Ela entra no site quando você publicar.';
      status.className = 'img__status is-ok';
      if (!alt.value) {
        alt.focus();
        status.textContent += ' Descreva a foto no campo abaixo.';
      }
      ctx.changed();
    } catch (e) {
      status.textContent = e instanceof Error ? e.message : 'Falha no envio.';
      status.className = 'img__status is-error';
    } finally {
      bar.hidden = true;
    }
  });

  const credit =
    field.credit &&
    (() => {
      const cid = nextId();
      const c = h('input', { id: cid, type: 'text', class: 'inp', maxlength: 160 });
      c.value = (value()?.credit as string | undefined) ?? '';
      c.addEventListener('input', () => {
        const v = value();
        if (v) {
          if (c.value.trim()) v.credit = c.value;
          else delete v.credit;
          ctx.changed();
        }
      });
      return h(
        'div',
        {},
        h(
          'label',
          { class: 'fld__label fld__label--sub', for: cid },
          'Crédito da foto (autor e licença)',
        ),
        c,
      );
    })();

  const remove = field.optional
    ? h(
        'button',
        { type: 'button', class: 'btn btn--ghost btn--danger' },
        icon('trash', 16),
        'Remover foto',
      )
    : null;
  remove?.addEventListener('click', () => {
    write(obj, field.key, undefined);
    ctx.changed();
    ctx.rerender();
  });

  return h(
    'div',
    { class: 'fld fld--image', 'data-path': field.key },
    h(
      'span',
      { class: 'fld__label' },
      field.label,
      field.optional ? h('span', { class: 'fld__opt' }, ' (opcional)') : null,
    ),
    h(
      'div',
      { class: 'img' },
      frame,
      h(
        'div',
        { class: 'img__side' },
        h('div', { class: 'img__actions' }, file, pick, remove || null),
        h('p', { class: 'fld__help' }, 'JPG, PNG ou WEBP. A foto é ajustada automaticamente.'),
        bar,
        status,
        h(
          'label',
          { class: 'fld__label fld__label--sub', for: altId },
          'Descrição da foto (para acessibilidade e Google)',
        ),
        alt,
        credit || null,
      ),
    ),
  );
}

function stringsField(field: Extract<Field, { type: 'strings' }>, obj: Obj, ctx: FieldContext) {
  const list = (read(obj, field.key) as string[] | undefined) ?? [];
  if (!Array.isArray(read(obj, field.key))) write(obj, field.key, list);
  const box = h('div', { class: 'strings' });
  const render = () => {
    box.replaceChildren();
    list.forEach((value, i) => {
      const id = nextId();
      const input = h('input', {
        id,
        type: 'text',
        class: 'inp',
        maxlength: field.max + 20,
        'aria-label': `${field.itemLabel} ${i + 1}`,
      });
      input.value = value;
      input.addEventListener('input', () => {
        list[i] = input.value;
        ctx.changed();
      });
      const row = h('div', { class: 'strings__row' }, input);
      if (field.mode === 'editable') {
        const del = h(
          'button',
          {
            type: 'button',
            class: 'icon-btn',
            'aria-label': `Remover ${field.itemLabel.toLowerCase()} ${i + 1}`,
          },
          icon('trash', 16),
        );
        del.addEventListener('click', () => {
          list.splice(i, 1);
          ctx.changed();
          render();
        });
        add(row, del);
      }
      add(box, row);
    });
    if (field.mode === 'editable' && list.length < (field.maxItems ?? 20)) {
      const addBtn = h(
        'button',
        { type: 'button', class: 'btn btn--ghost' },
        icon('plus', 16),
        `Adicionar ${field.itemLabel.toLowerCase()}`,
      );
      addBtn.addEventListener('click', () => {
        list.push('');
        ctx.changed();
        render();
        (box.querySelectorAll('input').item(list.length - 1) as HTMLInputElement | null)?.focus();
      });
      add(box, addBtn);
    }
    if (list.length === 0 && field.mode === 'editable')
      addFirst(box, h('p', { class: 'fld__help' }, 'Nenhum item ainda.'));
  };
  render();
  return h(
    'div',
    { class: 'fld', 'data-path': field.key },
    h('span', { class: 'fld__label' }, field.label),
    box,
  );
}

function itemTitle(field: ListField, item: Obj, i: number) {
  const t = field.itemLabel.replace(/\{([^}]+)\}/g, (_, k) =>
    String(getPath(item, k) ?? '').trim(),
  );
  // Sem texto (ex.: foto nova ainda sem descrição): "Item 3".
  return t && t !== field.itemLabel ? t : `Item ${i + 1}`;
}

function listField(field: ListField, obj: Obj, ctx: FieldContext) {
  const items = (read(obj, field.key) as Obj[] | undefined) ?? [];
  if (!Array.isArray(read(obj, field.key))) write(obj, field.key, items);
  const box = h('div', { class: 'list' });
  const open = new Set<Obj>([items[0]!]);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j]!, items[i]!];
    ctx.changed();
    render();
    (box.querySelectorAll<HTMLButtonElement>(`[data-move="${d}"]`)[j] ?? null)?.focus();
  };

  const render = () => {
    box.replaceChildren();
    items.forEach((item, i) => {
      const title = h('span', { class: 'list__title' }, itemTitle(field, item, i));
      const head = h(
        'summary',
        { class: 'list__head' },
        h('span', { class: 'list__num' }, String(i + 1)),
        title,
      );
      const tools = h('div', { class: 'list__tools' });
      if (field.mode !== 'fixed') {
        const up = h(
          'button',
          {
            type: 'button',
            class: 'icon-btn',
            'data-move': -1,
            'aria-label': `Mover ${title.textContent} para cima`,
            disabled: i === 0,
          },
          icon('up', 16),
        );
        const down = h(
          'button',
          {
            type: 'button',
            class: 'icon-btn',
            'data-move': 1,
            'aria-label': `Mover ${title.textContent} para baixo`,
            disabled: i === items.length - 1,
          },
          icon('down', 16),
        );
        up.addEventListener('click', () => move(i, -1));
        down.addEventListener('click', () => move(i, 1));
        add(tools, up, down);
      }
      if (field.mode === 'editable' && items.length > (field.min ?? 0)) {
        const del = h(
          'button',
          {
            type: 'button',
            class: 'icon-btn icon-btn--danger',
            'aria-label': `Excluir ${title.textContent}`,
          },
          icon('trash', 16),
        );
        del.addEventListener('click', () => {
          if (
            !confirm(
              `Excluir "${title.textContent}"? Você pode desfazer descartando as alterações antes de publicar.`,
            )
          )
            return;
          items.splice(i, 1);
          ctx.changed();
          render();
        });
        add(tools, del);
      }
      const body = h('div', { class: 'list__body' });
      for (const sub of field.item)
        add(
          body,
          renderField(sub, item, {
            ...ctx,
            changed: () => {
              title.textContent = itemTitle(field, item, i);
              ctx.changed();
            },
          }),
        );
      const details = h('details', { class: 'list__item', open: open.has(item) }, head, body);
      details.addEventListener('toggle', () => (details.open ? open.add(item) : open.delete(item)));
      add(box, h('div', { class: 'list__row' }, details, tools));
    });

    if (field.mode === 'editable' && items.length < (field.max ?? 99)) {
      const imageSub = field.item.find((s) => s.type === 'image' && s.key === SELF);
      if (imageSub) {
        // Lista de fotos: adicionar = escolher o arquivo já.
        const fid = nextId();
        const input = h('input', { type: 'file', accept: ACCEPT, class: 'sr-only', id: fid });
        const status = h('p', { class: 'img__status', 'aria-live': 'polite' });
        const bar = h('progress', { class: 'img__progress', max: 1, value: 0, hidden: true });
        input.addEventListener('change', async () => {
          const f = input.files?.[0];
          input.value = '';
          if (!f) return;
          bar.hidden = false;
          status.className = 'img__status';
          status.textContent = 'Preparando a foto…';
          try {
            const { path } = await ctx.uploadPhoto(f, (r) => {
              bar.value = r;
              status.textContent = `Enviando… ${Math.round(r * 100)}%`;
            });
            const item: Obj = { ...structuredClone(field.newItem ?? {}), src: path, alt: '' };
            items.push(item);
            open.add(item);
            ctx.changed();
            render();
            box.querySelector<HTMLElement>('.list__row:last-of-type input[type="text"]')?.focus();
          } catch (e) {
            status.textContent = e instanceof Error ? e.message : 'Falha no envio.';
            status.className = 'img__status is-error';
          } finally {
            bar.hidden = true;
          }
        });
        add(
          box,
          h(
            'div',
            { class: 'list__add' },
            input,
            h('label', { class: 'btn btn--ghost', for: fid }, icon('plus', 16), 'Adicionar foto'),
            h('span', { class: 'fld__help' }, `${items.length} de ${field.max}`),
            bar,
            status,
          ),
        );
      } else {
        const addBtn = h(
          'button',
          { type: 'button', class: 'btn btn--ghost' },
          icon('plus', 16),
          'Adicionar item',
        );
        addBtn.addEventListener('click', () => {
          const item = structuredClone(field.newItem ?? {}) as Obj;
          items.push(item);
          open.add(item);
          ctx.changed();
          render();
        });
        add(box, addBtn);
      }
    }
  };
  render();
  return h(
    'fieldset',
    { class: 'fld fld--list', 'data-path': field.key },
    h('legend', { class: 'fld__label' }, field.label),
    field.help ? h('p', { class: 'fld__help' }, field.help) : null,
    field.mode === 'fixed'
      ? h('p', { class: 'fld__help' }, 'Edite o conteúdo de cada item; a quantidade é fixa.')
      : null,
    box,
  );
}

export function renderField(field: Field, obj: Obj, ctx: FieldContext): HTMLElement {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return textField(field, obj, ctx);
    case 'paragraphs':
      return paragraphsField(field, obj, ctx);
    case 'url':
      return simpleInput(field, 'url', obj, ctx, field.placeholder);
    case 'email':
      return simpleInput(field, 'email', obj, ctx, 'nome@exemplo.com');
    case 'whatsapp':
      return whatsappField(field, obj, ctx);
    case 'number':
      return numberField(field, obj, ctx);
    case 'select':
    case 'icon':
      return selectField(field, obj, ctx);
    case 'color':
      return colorField(field, obj, ctx);
    case 'image':
      return imageField(field, obj, ctx);
    case 'strings':
      return stringsField(field, obj, ctx);
    case 'list':
      return listField(field, obj, ctx);
  }
}

export { prepareImage };
