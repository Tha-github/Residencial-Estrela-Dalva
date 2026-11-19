import { expect, test } from '@playwright/test';

test.describe('página real (dados confirmados)', () => {
  test('mostra as seções do loft; galeria só com fotos; plataformas só com link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    for (const id of ['o-loft', 'acomodacao', 'comodidades', 'localizacao', 'experiencia', 'informacoes', 'reservas', 'duvidas']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.locator('#fotos')).toHaveCount(0);
    // Sem links das plataformas cadastrados: nenhum link para Booking.com ou Airbnb.
    expect(await page.locator('a[href*="booking.com"], a[href*="airbnb."]').count()).toBe(0);
    // Nenhum link vazio.
    expect(await page.evaluate(() => document.querySelectorAll('a[href="#"], a:not([href])').length)).toBe(0);
  });

  test('acomodação deixa claro onde cada pessoa dorme', async ({ page }) => {
    await page.goto('/');
    const s = page.locator('#acomodacao');
        await expect(s).toContainText('Mezanino');
    await expect(s).toContainText('Uma cama de casal');
    await expect(s).toContainText('Uma cama de solteiro');
    await expect(s).toContainText('Piso inferior');
    await expect(s).toContainText('Um sofá-cama');
    await expect(s).toContainText('sem quartos separados');
  });

  test('reserva direta: WhatsApp com mensagem inicial e e-mail do proprietário', async ({ page }) => {
    await page.goto('/');
    const whatsapp = page.locator('#reservas a[href^="https://wa.me/5548999471321?text="]');
    await expect(whatsapp).toHaveCount(1);
    expect(decodeURIComponent((await whatsapp.getAttribute('href'))!.split('text=')[1]!)).toContain('Residencial Estrela Dalva');
    await expect(page.locator('#reservas a[href^="mailto:pereimamarcelo@gmail.com"]')).toHaveCount(1);
    // Só o conteúdo da página: a barra de ferramentas do Astro (dev) tem inputs no shadow DOM.
    await expect(page.locator('main input, main form')).toHaveCount(0);
  });

  test('banner leva às reservas e ao loft', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero').getByRole('link', { name: 'Consultar disponibilidade' })).toHaveAttribute('href', '#reservas');
    await expect(page.locator('.hero').getByRole('link', { name: 'Conhecer o loft' })).toHaveAttribute('href', '#o-loft');
  });
});

test.describe('prévia completa (dados de exemplo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/previa/completa', { waitUntil: 'networkidle' });
  });

  test('todos os links internos apontam para seções existentes', async ({ page }) => {
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
        .map((a) => a.getAttribute('href')!)
        .filter((href) => href.length > 1 && !document.getElementById(href.slice(1))),
    );
    expect(broken).toEqual([]);
  });

  test('links externos abrem em nova aba com rel seguro e aviso acessível', async ({ page }) => {
    const external = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')].map((a) => ({
        href: a.href,
        target: a.target,
        rel: a.rel,
        announces: a.textContent?.includes('abre em nova aba') ?? false,
      })),
    );
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link, link.href).toMatchObject({ target: '_blank', announces: true });
      expect(link.rel, link.href).toContain('noopener');
    }
  });

  test('reserva: um botão por plataforma e aviso de que a reserva é externa', async ({ page }) => {
    const section = page.locator('#reservas');
    await expect(section.getByRole('link', { name: /Reservar no Booking\.com/ })).toHaveAttribute(
      'href',
      /booking\.com/,
    );
    await expect(section.getByRole('link', { name: /Reservar no Airbnb/ })).toHaveAttribute('href', /airbnb\./);
    await expect(section.getByRole('link', { name: /Reservar na Decolar/ })).toHaveAttribute('href', /decolar\.com/);
    await expect(section).toContainText('não realiza reservas nem recebe pagamentos');
    // Sem simulação de disponibilidade, preço, calendário ou checkout.
    await expect(page.locator('input[type="date"], form')).toHaveCount(0);
  });

  test('hierarquia: um h1 e seções com h2 rotulando a região', async ({ page }) => {
    const info = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      unlabeled: [...document.querySelectorAll('main section')].filter((s) => {
        const id = s.getAttribute('aria-labelledby');
        return !id || !document.getElementById(id);
      }).length,
    }));
    expect(info).toEqual({ h1: 1, unlabeled: 0 });
  });

  test('mobile: barra de reserva some no topo (hero já tem CTA) e aparece ao rolar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('.booking-bar')).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await expect(page.locator('.booking-bar')).toBeVisible();
  });

  test('mobile + movimento reduzido: barra sempre visível', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.booking-bar')).toBeVisible();
  });

  test('mobile: barra de reserva fixa não cobre o fim do rodapé', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('.booking-bar')).toBeVisible();
    const [legalBottom, barTop] = await page.evaluate(() => [
      document.querySelector('.footer__legal')!.getBoundingClientRect().bottom,
      document.querySelector('.booking-bar')!.getBoundingClientRect().top,
    ]);
    expect(legalBottom).toBeLessThanOrEqual(barTop);
  });

  test('desktop: barra de reserva fixa não aparece', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.booking-bar')).toBeHidden();
  });
});
