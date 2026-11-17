import { describe, expect, it } from 'vitest';
import raw from '../../src/data/residencial.json';
import { devFixture } from '../../src/data/dev-fixture';
import { sortGallery } from '../../src/lib/content/gallery';
import { assertNoDevImages, ContentValidationError, parseContent } from '../../src/lib/content/load';
import { imageSchema, type Image } from '../../src/lib/content/schema';

const img = (src: string, group: Image['group'] = null): Image => imageSchema.parse({ src, alt: src, group });

describe('ordem narrativa da galeria', () => {
  it('ordena fachada → social → quartos → externa → detalhes; sem grupo no fim', () => {
    const out = sortGallery([
      img('/a.jpg', 'detalhes'),
      img('/b.jpg'),
      img('/c.jpg', 'fachada'),
      img('/d.jpg', 'externa'),
      img('/e.jpg', 'social'),
      img('/f.jpg', 'quartos'),
    ]);
    expect(out.map((i) => i.src)).toEqual(['/c.jpg', '/e.jpg', '/f.jpg', '/d.jpg', '/a.jpg', '/b.jpg']);
  });

  it('é estável: dentro do grupo mantém a ordem cadastrada', () => {
    const out = sortGallery([img('/s2.jpg', 'social'), img('/s1.jpg', 'social'), img('/x.jpg'), img('/y.jpg')]);
    expect(out.map((i) => i.src)).toEqual(['/s2.jpg', '/s1.jpg', '/x.jpg', '/y.jpg']);
  });

  it('sem grupos, preserva exatamente a ordem cadastrada', () => {
    const list = [img('/3.jpg'), img('/1.jpg'), img('/2.jpg')];
    expect(sortGallery(list)).toEqual(list);
  });
});

describe('campos de imagem', () => {
  it('aplica padrões: foco no centro, sem legenda, sem grupo', () => {
    expect(imageSchema.parse({ src: '/fotos/a.jpg', alt: 'Sala' })).toMatchObject({
      focus: '50% 50%',
      caption: null,
      group: null,
    });
  });

  it.each(['50%', '50 50', '120% 10%', 'center'])('rejeita foco inválido "%s"', (focus) => {
    expect(() => imageSchema.parse({ src: '/fotos/a.jpg', alt: '', focus })).toThrow();
  });

  it('rejeita extensão que não é imagem', () => {
    expect(() => imageSchema.parse({ src: '/fotos/a.svg', alt: '' })).toThrow();
    expect(() => imageSchema.parse({ src: '/fotos/a.html', alt: '' })).toThrow();
  });

  it('rejeita grupo desconhecido', () => {
    expect(() => imageSchema.parse({ src: '/fotos/a.jpg', alt: '', group: 'piscina' })).toThrow();
  });
});

describe('separação entre exemplo e conteúdo real', () => {
  it('a fixture usa imagens de exemplo (válidas pelo esquema)', () => {
    expect(() => parseContent(devFixture)).not.toThrow();
  });

  it('o conteúdo real não pode apontar para imagens de exemplo', () => {
    expect(() => assertNoDevImages(parseContent(devFixture))).toThrow(ContentValidationError);
    expect(() => assertNoDevImages(parseContent(raw))).not.toThrow();
  });
});
