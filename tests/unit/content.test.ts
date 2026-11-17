import { describe, expect, it } from 'vitest';
import raw from '../../src/data/residencial.json';
import { ContentValidationError, parseContent } from '../../src/lib/content/load';
import { getPendingItems } from '../../src/lib/content/pending';

const clone = () => structuredClone(raw) as Record<string, unknown> & typeof raw;

describe('conteúdo do residencial', () => {
  it('o arquivo de dados atual é válido', () => {
    expect(() => parseContent(raw)).not.toThrow();
  });

  it('rejeita link de reserva fora do domínio esperado', () => {
    const data = clone();
    (data.booking as Record<string, unknown>).booking = 'https://phishing.example/booking';
    expect(() => parseContent(data)).toThrow(ContentValidationError);
  });

  it('rejeita campos desconhecidos (não permite seções novas por dados)', () => {
    const data = { ...clone(), customHtml: '<script></script>' };
    expect(() => parseContent(data)).toThrow(ContentValidationError);
  });

  it('rejeita horário de check-in fora do formato HH:MM', () => {
    const data = clone();
    (data.practical as Record<string, unknown>).checkIn = '14h';
    expect(() => parseContent(data)).toThrow(/practical\.checkIn/);
  });

  it('rejeita WhatsApp com caracteres não numéricos', () => {
    const data = clone();
    (data.contact as Record<string, unknown>).whatsapp = '+55 (48) 99999-9999';
    expect(() => parseContent(data)).toThrow(/contact\.whatsapp/);
  });

  it('rejeita texto com caracteres de controle e aceita quebras de linha', () => {
    const bad = clone();
    (bad.about as Record<string, unknown>).paragraphs = ['texto\u0000oculto'];
    expect(() => parseContent(bad)).toThrow(/about\.paragraphs/);

    const ok = clone();
    (ok.about as Record<string, unknown>).paragraphs = ['linha 1\nlinha 2'];
    expect(() => parseContent(ok)).not.toThrow();
  });

  it('mensagem de erro aponta o caminho do campo', () => {
    const data = clone();
    (data.location as Record<string, unknown>).mapsUrl = 'https://www.google.com/search?q=x';
    try {
      parseContent(data);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      expect((err as ContentValidationError).issues.join()).toContain('location.mapsUrl');
    }
  });
});

describe('pendências', () => {
  it('lista os dados ainda não fornecidos', () => {
    const items = getPendingItems(parseContent(raw));
    const fields = items.map((i) => i.field);
    expect(fields).toContain('booking.booking');
    expect(fields).toContain('gallery');
    expect(fields).toContain('location.mapsUrl');
  });

  it('remove a pendência quando o dado é preenchido', () => {
    const data = clone();
    (data.booking as Record<string, unknown>).airbnb = 'https://www.airbnb.com.br/rooms/1';
    const fields = getPendingItems(parseContent(data)).map((i) => i.field);
    expect(fields).not.toContain('booking.airbnb');
  });
});
