import { describe, expect, it } from 'vitest';
import raw from '../../src/data/residencial.json';
import { devFixture } from '../../src/data/dev-fixture';
import {
  formatWhatsapp,
  getBookingPlatforms,
  getKeyFacts,
  getNavItems,
  getSectionTones,
  getVisibility,
  instagramHandle,
  whatsappUrl,
} from '../../src/lib/content/derive';
import { parseContent } from '../../src/lib/content/load';
import { assertReadyForLaunch, LaunchBlockedError } from '../../src/lib/content/pending';

const real = parseContent(raw);
const full = parseContent(devFixture);

describe('visibilidade das seções', () => {
  it('conteúdo atual: mostra só o que está confirmado', () => {
    expect(getVisibility(real)).toEqual({
      about: true,
      gallery: false,
      highlights: true,
      practical: false,
      location: false,
      booking: false,
      contact: false,
    });
  });

  it('dados completos: todas as seções aparecem', () => {
    expect(Object.values(getVisibility(full)).every(Boolean)).toBe(true);
  });

  it('fundos alternam entre seções visíveis vizinhas', () => {
    expect(getSectionTones(getVisibility(real))).toMatchObject({ about: 'default', highlights: 'alt' });
    const tones = getSectionTones(getVisibility(full));
    expect(Object.values(tones)).toEqual(['default', 'alt', 'default', 'alt', 'default', 'alt', 'default']);
  });

  it('navegação lista só seções visíveis e tem no máximo 5 itens', () => {
    expect(getNavItems(getVisibility(real)).map((i) => i.href)).toEqual(['#o-residencial']);
    expect(getNavItems(getVisibility(full)).length).toBeLessThanOrEqual(5);
  });
});

describe('plataformas de reserva', () => {
  it('sem links, não há plataformas (nada de botão sem destino)', () => {
    expect(getBookingPlatforms(real)).toEqual([]);
  });

  it('ordem fixa e gramática correta (no Booking.com / na Decolar)', () => {
    const platforms = getBookingPlatforms(full);
    expect(platforms.map((p) => p.id)).toEqual(['booking', 'airbnb', 'decolar']);
    expect(platforms.map((p) => p.inName)).toEqual(['no Booking.com', 'no Airbnb', 'na Decolar']);
    expect(platforms[2]?.byName).toBe('pela Decolar');
  });

  it('inclui só as plataformas com link', () => {
    const one = parseContent({ ...raw, booking: { booking: null, airbnb: 'https://www.airbnb.com.br/rooms/1', decolar: null } });
    expect(getBookingPlatforms(one).map((p) => p.name)).toEqual(['Airbnb']);
  });
});

describe('formatação', () => {
  it('WhatsApp', () => {
    expect(whatsappUrl('5548999998888')).toBe('https://wa.me/5548999998888');
    expect(formatWhatsapp('5548999998888')).toBe('+55 (48) 99999-8888');
    expect(formatWhatsapp('554833334444')).toBe('+55 (48) 3333-4444');
  });

  it('Instagram', () => {
    expect(instagramHandle('https://www.instagram.com/residencial/')).toBe('@residencial');
  });

  it('fatos com singular/plural', () => {
    const one = parseContent({ ...raw, practical: { ...raw.practical, bedrooms: 1, bathrooms: 2 } });
    expect(getKeyFacts(one)).toEqual([
      { value: '1', label: 'quarto' },
      { value: '2', label: 'banheiros' },
    ]);
  });
});

describe('trava de lançamento', () => {
  it('bloqueia produção com dados obrigatórios pendentes', () => {
    expect(() => assertReadyForLaunch(real)).toThrow(LaunchBlockedError);
  });

  it('libera quando os obrigatórios estão preenchidos', () => {
    expect(() => assertReadyForLaunch(full)).not.toThrow();
  });
});

describe('esquema de imagens', () => {
  it.each(['data:image/png;base64,AAA', 'javascript:alert(1)', 'https://example.com/a.jpg', '//cdn.x/a.jpg', '/../etc/passwd'])(
    'rejeita src %s',
    (src) => {
      const data = { ...raw, gallery: [{ src, alt: 'x', width: 10, height: 10 }] };
      expect(() => parseContent(data)).toThrow();
    },
  );

  it('aceita caminho local', () => {
    const data = { ...raw, gallery: [{ src: '/fotos/sala-01.jpg', alt: 'Sala', width: 10, height: 10 }] };
    expect(() => parseContent(data)).not.toThrow();
  });
});
