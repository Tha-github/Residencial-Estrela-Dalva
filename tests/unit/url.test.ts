import { describe, expect, it } from 'vitest';
import { isSafeExternalUrl } from '../../src/lib/url';

describe('isSafeExternalUrl', () => {
  it('aceita https nos domínios permitidos e subdomínios', () => {
    expect(isSafeExternalUrl('https://www.booking.com/hotel/br/x.html', 'booking')).toBe(true);
    expect(isSafeExternalUrl('https://www.airbnb.com.br/rooms/123', 'airbnb')).toBe(true);
    expect(isSafeExternalUrl('https://www.decolar.com/hoteis/h-1', 'decolar')).toBe(true);
    expect(isSafeExternalUrl('https://www.instagram.com/perfil', 'instagram')).toBe(true);
  });

  it('aceita links do Google Maps', () => {
    expect(
      isSafeExternalUrl('https://www.google.com/maps/dir/?api=1&destination=-27.43,-48.39', 'maps'),
    ).toBe(true);
    expect(isSafeExternalUrl('https://maps.app.goo.gl/abc123', 'maps')).toBe(true);
    expect(isSafeExternalUrl('https://maps.google.com/?q=x', 'maps')).toBe(true);
  });

  it('rejeita páginas do Google que não são Maps', () => {
    expect(isSafeExternalUrl('https://www.google.com/search?q=x', 'maps')).toBe(false);
  });

  it('rejeita protocolos inseguros ou perigosos', () => {
    expect(isSafeExternalUrl('http://www.booking.com/x', 'booking')).toBe(false);
    expect(isSafeExternalUrl('javascript:alert(1)', 'booking')).toBe(false);
    expect(isSafeExternalUrl('data:text/html,<script>', 'booking')).toBe(false);
  });

  it('rejeita domínios parecidos e credenciais embutidas', () => {
    expect(isSafeExternalUrl('https://booking.com.evil.io/x', 'booking')).toBe(false);
    expect(isSafeExternalUrl('https://evilbooking.com/x', 'booking')).toBe(false);
    expect(isSafeExternalUrl('https://user:pass@www.booking.com/x', 'booking')).toBe(false);
  });

  it('rejeita domínio de outro tipo de link', () => {
    expect(isSafeExternalUrl('https://www.airbnb.com/rooms/1', 'booking')).toBe(false);
  });

  it('rejeita texto que não é URL', () => {
    expect(isSafeExternalUrl('booking.com', 'booking')).toBe(false);
    expect(isSafeExternalUrl('', 'booking')).toBe(false);
  });
});
