import { describe, expect, it } from 'vitest';
import raw from '../../src/data/residencial.json';
import { devFixture } from '../../src/data/dev-fixture';
import {
  formatDistance,
  formatTime,
  formatWhatsapp,
  getBookingPlatforms,
  getFaq,
  getHeroHighlights,
  getNavItems,
  getPlatformSlots,
  getSectionTones,
  getVisibility,
  instagramHandle,
  joinList,
  mailtoUrl,
  photoOf,
  whatsappUrl,
} from '../../src/lib/content/derive';
import { parseContent } from '../../src/lib/content/load';
import { assertReadyForLaunch, LaunchBlockedError } from '../../src/lib/content/pending';

const real = parseContent(raw);
const full = parseContent(devFixture);

describe('visibilidade das seções', () => {
  it('conteúdo atual: mostra o que está confirmado; galeria só com fotos', () => {
    expect(getVisibility(real)).toEqual({
      loft: true,
      gallery: false,
      sleeping: true,
      amenities: true,
      location: true,
      experience: true,
      practical: true,
      booking: true, // contato direto já confirmado
      faq: true,
    });
  });

  it('dados completos: todas as seções aparecem', () => {
    expect(Object.values(getVisibility(full)).every(Boolean)).toBe(true);
  });

  it('fundos: experiência é a faixa escura; vizinhas claras nunca repetem o fundo', () => {
    const tones = getSectionTones(getVisibility(full));
    expect(tones.experience).toBe('inverse');
    const order = ['loft', 'gallery', 'sleeping', 'amenities', 'location'] as const;
    order.slice(1).forEach((key, i) => expect(tones[key]).not.toBe(tones[order[i]!]));
  });

  it('navegação lista só seções visíveis e tem no máximo 5 itens', () => {
    const nav = getNavItems(getVisibility(real));
    expect(nav.map((i) => i.href)).toEqual(['#o-loft', '#acomodacao', '#comodidades', '#localizacao', '#duvidas']);
    expect(getNavItems(getVisibility(full)).length).toBeLessThanOrEqual(5);
  });
});

describe('plataformas de reserva', () => {
  it('sem links, não há plataformas ativas (nada de botão sem destino)', () => {
    expect(getBookingPlatforms(real)).toEqual([]);
  });

  it('prévia: Booking.com e Airbnb aparecem como pendências, sem URL; Decolar não', () => {
    const slots = getPlatformSlots(real, true);
    expect(slots.map((s) => [s.id, s.url])).toEqual([
      ['booking', null],
      ['airbnb', null],
    ]);
    expect(getPlatformSlots(real, false)).toEqual([]);
  });

  it('ordem fixa e gramática correta (no Booking.com / na Decolar)', () => {
    const platforms = getBookingPlatforms(full);
    expect(platforms.map((p) => p.id)).toEqual(['booking', 'airbnb', 'decolar']);
    expect(platforms.map((p) => p.inName)).toEqual(['no Booking.com', 'no Airbnb', 'na Decolar']);
    expect(platforms[2]?.byName).toBe('pela Decolar');
  });
});

describe('formatação', () => {
  it('WhatsApp com mensagem inicial codificada', () => {
    expect(whatsappUrl('5548999471321')).toBe('https://wa.me/5548999471321');
    expect(whatsappUrl('5548999471321', 'Olá! Tudo bem?')).toBe(
      'https://wa.me/5548999471321?text=Ol%C3%A1!%20Tudo%20bem%3F',
    );
    expect(formatWhatsapp('5548999471321')).toBe('+55 (48) 99947-1321');
    expect(formatWhatsapp('554833334444')).toBe('+55 (48) 3333-4444');
  });

  it('e-mail com assunto', () => {
    expect(mailtoUrl('a@b.com')).toBe('mailto:a@b.com');
    expect(mailtoUrl('a@b.com', 'Olá você')).toBe('mailto:a@b.com?subject=Ol%C3%A1%20voc%C3%AA');
  });

  it('horários, distâncias e listas', () => {
    expect(formatTime('14:00')).toBe('14h');
    expect(formatTime('09:30')).toBe('9h30');
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(1200)).toBe('1,2 km');
    expect(joinList(['a', 'b', 'c'])).toBe('a, b e c');
    expect(joinList(['a'])).toBe('a');
  });

  it('Instagram', () => {
    expect(instagramHandle('https://www.instagram.com/residencial/')).toBe('@residencial');
  });

  it('destaques do banner vêm da capacidade e das distâncias', () => {
    expect(getHeroHighlights(real).map((h) => h.text)).toEqual([
      'Até 4 hóspedes',
      '450 m da praia',
      '200 m do Centrinho',
    ]);
  });

  it('foto por grupo: primeira cadastrada do grupo, ou null', () => {
    expect(photoOf(real, 'mezanino')).toBeNull();
    expect(photoOf(full, 'mezanino')?.src).toBe('/dev/exemplo-04.jpg');
  });
});

describe('perguntas frequentes', () => {
  const faq = getFaq(real);
  const answer = (q: RegExp) => faq.find((f) => q.test(f.question))?.answer;

  it('responde só com os dados confirmados', () => {
    expect(answer(/Quantas pessoas/)).toBe('Até quatro pessoas.');
    expect(answer(/camas/)).toContain('mezanino');
    expect(answer(/camas/)).toContain('sofá-cama');
    expect(answer(/camas/)).toContain('não há quartos separados');
    expect(answer(/Praia dos Ingleses/)).toBe('Aproximadamente 450 metros.');
    expect(answer(/Centrinho/)).toBe('Aproximadamente 200 metros.');
    expect(answer(/check-in/)).toBe('A partir das 14h.');
    expect(answer(/check-out/)).toBe('Até as 11h.');
    expect(answer(/cozinha/)).toContain('air fryer');
  });

  it('sem links de plataforma, reserva fala só do contato direto', () => {
    expect(answer(/reserva/)).toBe(
      'Você pode reservar diretamente com o proprietário, por WhatsApp e e-mail. As opções estão na seção de reservas.',
    );
    expect(getFaq(full).find((f) => /reserva/.test(f.question))?.answer).toContain('Booking.com, Airbnb e Decolar');
  });

  it('não inventa políticas: sem perguntas sobre cancelamento, animais, estacionamento ou taxas', () => {
    expect(faq.some((f) => /cancel|animal|pet|estacion|taxa|toalha|roupa de cama/i.test(f.question))).toBe(false);
  });

  it('dado ausente remove a pergunta', () => {
    const noTimes = parseContent({ ...raw, practical: { ...raw.practical, checkIn: null, checkOut: null } });
    expect(getFaq(noTimes).some((f) => /check-/.test(f.question))).toBe(false);
  });
});

describe('trava de lançamento', () => {
  it('bloqueia produção com dados obrigatórios pendentes (galeria e links das plataformas)', () => {
    try {
      assertReadyForLaunch(real);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(LaunchBlockedError);
      const fields = (err as LaunchBlockedError).items.map((i) => i.field);
      expect(fields).toEqual(['gallery', 'booking.booking', 'booking.airbnb']);
    }
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
