import type { Residencial } from './schema';

export interface PendingItem {
  field: string;
  label: string;
  /** Necessário antes de publicar em produção. */
  requiredForLaunch: boolean;
}

const isMissing = (v: unknown) => v === null || (Array.isArray(v) && v.length === 0);

/**
 * Lista o que ainda falta confirmar com o cliente.
 * Exibido apenas em desenvolvimento; nunca no site publicado.
 */
export function getPendingItems(c: Residencial): PendingItem[] {
  const checks: Array<[unknown, string, string, boolean]> = [
    [c.hero.image, 'hero.image', 'Foto real para o hero', true],
    [c.gallery, 'gallery', 'Fotos reais do imóvel', true],
    [c.about.paragraphs, 'about.paragraphs', 'Descrição do residencial', true],
    [c.practical.maxGuests, 'practical.maxGuests', 'Capacidade máxima de hóspedes', true],
    [c.practical.bedrooms, 'practical.bedrooms', 'Número de quartos', true],
    [c.practical.beds, 'practical.beds', 'Número de camas', true],
    [c.practical.bathrooms, 'practical.bathrooms', 'Número de banheiros', true],
    [c.practical.amenities, 'practical.amenities', 'Comodidades confirmadas', true],
    [c.practical.checkIn, 'practical.checkIn', 'Horário de check-in', true],
    [c.practical.checkOut, 'practical.checkOut', 'Horário de check-out', true],
    [c.practical.rules, 'practical.rules', 'Regras da casa', false],
    [c.location.mapsUrl, 'location.mapsUrl', 'Link do Google Maps do imóvel', true],
    [c.location.address, 'location.address', 'Endereço oficial confirmado', false],
    [c.booking.booking, 'booking.booking', 'Link do anúncio no Booking.com', true],
    [c.booking.airbnb, 'booking.airbnb', 'Link do anúncio no Airbnb', true],
    [c.booking.decolar, 'booking.decolar', 'Link do anúncio na Decolar', true],
    [c.contact.instagram, 'contact.instagram', 'Instagram', false],
    [c.contact.whatsapp, 'contact.whatsapp', 'WhatsApp', false],
    [c.contact.email, 'contact.email', 'E-mail de contato', false],
  ];

  return checks
    .filter(([value]) => isMissing(value))
    .map(([, field, label, requiredForLaunch]) => ({ field, label, requiredForLaunch }));
}

export class LaunchBlockedError extends Error {
  constructor(public readonly items: PendingItem[]) {
    super(
      'Build de produção bloqueado — dados obrigatórios pendentes (ver docs/PENDENCIAS-CLIENTE.md):\n' +
        items.map((i) => `  - ${i.label} (${i.field})`).join('\n') +
        '\nPara revisão com o cliente, use PUBLIC_DEPLOY_ENV=preview.',
    );
    this.name = 'LaunchBlockedError';
  }
}

/** Impede publicar em produção com dados obrigatórios faltando. */
export function assertReadyForLaunch(c: Residencial): void {
  const blocking = getPendingItems(c).filter((i) => i.requiredForLaunch);
  if (blocking.length > 0) throw new LaunchBlockedError(blocking);
}
