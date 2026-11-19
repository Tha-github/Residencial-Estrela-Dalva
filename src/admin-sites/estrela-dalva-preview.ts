/**
 * Prévias específicas do painel do Residencial Estrela Dalva (banner e cores).
 * Os demais módulos usam a prévia genérica do kit.
 */
import { richTitle } from '../admin-kit/client/app';
import { h } from '../admin-kit/client/fields';
import type { Module } from '../admin-kit/spec';
import { defaultTheme, themeProblems, themeTokens, type Theme } from '../lib/theme';

type Obj = Record<string, unknown>;

export function estrelaDalvaPreview(
  mod: Module,
  draft: Obj,
  photoUrl: (src: string) => Promise<string>,
): HTMLElement | null {
  const theme = { ...defaultTheme, ...((draft.theme as Partial<Theme>) ?? {}) };
  const t = themeTokens(theme);

  if (mod.id === 'inicio') {
    const hero = (draft.hero ?? {}) as Obj;
    const buttons = hero;
    const title = String(hero.title ?? draft.name ?? '');
    const banner = h(
      'div',
      { class: 'pv-hero' },
      h('p', { class: 'pv-hero__place' }, String(draft.name ?? '')),
      h('p', { class: 'pv-hero__title' }, richTitle(title)),
      h('p', { class: 'pv-hero__tagline' }, String(hero.subtitle ?? '')),
      h(
        'div',
        { class: 'pv-hero__btns' },
        h('span', { class: 'pv-hero__btn' }, String(buttons.primaryLabel ?? '')),
        h(
          'span',
          { class: 'pv-hero__btn pv-hero__btn--ghost' },
          String(buttons.secondaryLabel ?? ''),
        ),
      ),
    );
    if (hero.image && typeof hero.image === 'object' && 'src' in hero.image) {
      photoUrl(String((hero.image as Obj).src))
        .then((u) => banner.style.setProperty('--pv-bg', `url("${u}")`))
        .catch(() => {});
    }
    const facts = ((hero.highlights as Obj[]) ?? []).map((f) =>
      h('li', {}, String(f.text ?? '')),
    );
    return h('div', {}, banner, h('ul', { class: 'pv-facts' }, ...facts));
  }

  if (mod.id === 'cores') {
    const problems = themeProblems(theme);
    const sample = h(
      'div',
      { class: 'pv-theme', style: `background:${t['--sand-50']};color:${t['--graphite-900']}` },
      h('p', { class: 'pv__eyebrow', style: `color:${t['--terra-600']}` }, 'Sobretítulo'),
      h(
        'p',
        { class: 'pv-theme__title', style: `color:${t['--sea-700']}` },
        richTitle('Título da *seção*'),
      ),
      h(
        'p',
        { style: `color:${t['--graphite-600']}` },
        'Texto de apoio com a cor secundária do texto.',
      ),
      h('p', {}, 'Texto dos parágrafos do site.'),
      h('span', { class: 'pv-theme__btn', style: `background:${t['--sea-700']}` }, 'Botão'),
      h(
        'div',
        { class: 'pv-theme__band', style: `background:${t['--sea-900']};color:${t['--sand-50']}` },
        h('p', { class: 'pv__eyebrow', style: `color:${t['--terra-300']}` }, 'Faixa escura'),
        h(
          'p',
          { class: 'pv-theme__title', style: `color:${t['--sea-200']}` },
          richTitle('Título na *faixa escura*'),
        ),
        h('p', {}, 'Texto claro sobre a cor secundária.'),
      ),
    );
    const reset = h(
      'button',
      { type: 'button', class: 'btn btn--ghost' },
      'Restaurar cores originais',
    );
    reset.addEventListener('click', () => {
      if (!confirm('Voltar às cores originais do site?')) return;
      draft.theme = { ...defaultTheme };
      document.dispatchEvent(new CustomEvent('admin:rerender'));
    });
    return h(
      'div',
      {},
      sample,
      problems.length
        ? h(
            'div',
            { class: 'alert alert--error', role: 'alert' },
            h('strong', {}, 'Ajuste antes de publicar — o texto ficaria difícil de ler:'),
            h('ul', {}, ...problems.map((p) => h('li', {}, p))),
          )
        : h('p', { class: 'alert alert--ok' }, 'Combinação de cores com boa leitura.'),
      reset,
    );
  }
  return null;
}
