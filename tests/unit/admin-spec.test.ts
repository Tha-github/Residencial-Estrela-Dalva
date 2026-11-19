import { describe, expect, it } from 'vitest';
import { applyEdits, clone, EditError, imageSources, locate } from '../../src/admin-kit/spec';
import { estrelaDalvaSpec } from '../../src/admin-sites/estrela-dalva';
import { parseContent } from '../../src/lib/content/load';
import { contrast, defaultTheme, themeProblems } from '../../src/lib/theme';
import data from '../../src/data/residencial.json';

type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const current = (): Obj => clone(data) as Obj;
const apply = (edit: (content: Obj) => void) => {
  const input = current();
  edit(input);
  return applyEdits(current(), input, estrelaDalvaSpec) as Obj;
};

describe('painel do Estrela Dalva: lista branca de edição', () => {
  it('mantém o conteúdo ao salvar sem alterações', () => {
    expect(applyEdits(current(), current(), estrelaDalvaSpec)).toEqual(current());
  });

  it('edita textos e dados autorizados, mantendo o schema válido', () => {
    const next = apply((content) => {
      content.hero.title = 'Novo *título*';
      content.copy.locationTitle = 'Nova localização';
      content.faq[0].answer = 'Resposta atualizada.';
      content.booking.airbnb = 'https://www.airbnb.com.br/rooms/999';
    });
    expect(next.hero.title).toBe('Novo *título*');
    expect(parseContent(next).booking.airbnb).toBe('https://www.airbnb.com.br/rooms/999');
  });

  it('ignora identidade, ícones e campos que não fazem parte do painel', () => {
    const next = apply((content) => {
      content.property.unit = 'Outra unidade';
      content.features[0].icon = 'flame';
      content.newSection = { html: '<script>' };
    });
    expect(next.property.unit).toBe(current().property.unit);
    expect(next.features[0].icon).toBe(current().features[0].icon);
    expect(next.newSection).toBeUndefined();
  });

  it('mantém categorias e listas fixas; permite reorganizar a galeria', () => {
    expect(() => apply((content) => content.amenities.push({ title: 'Piscina', items: [] }))).toThrow(EditError);
    const next = apply((content) => content.gallery.reverse());
    expect(next.gallery[0].src).toBe(current().gallery.at(-1).src);
    expect(parseContent(next).gallery).toHaveLength(current().gallery.length);
  });

  it('valida fotos, URLs e contraste, e limita caminhos de erro ao descritor', () => {
    expect(imageSources(current(), estrelaDalvaSpec)).toContain(current().hero.image.src);
    expect(locate(estrelaDalvaSpec, 'faq.0.answer')).toMatchObject({ module: { id: 'duvidas' } });
    expect(() => parseContent({ ...current(), contact: { ...current().contact, email: '<svg>' } })).toThrow();
    expect(themeProblems(defaultTheme)).toEqual([]);
    expect(themeProblems({ ...defaultTheme, primary: '#ffffff' }).length).toBeGreaterThan(0);
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
});
