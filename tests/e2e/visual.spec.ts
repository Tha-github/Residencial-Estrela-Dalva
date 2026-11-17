import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile-320', width: 320, height: 640 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const pages = [
  { name: 'home', path: '/' },
  { name: 'completa', path: '/dev/previa/completa' },
  { name: 'estilo', path: '/dev/estilo' },
];

for (const vp of viewports) {
  for (const pg of pages) {
    test(`${pg.name} @ ${vp.name}: sem overflow horizontal nem erros de console`, async ({ page }, info) => {
      const errors: string[] = [];
      page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
      page.on('pageerror', (err) => errors.push(err.message));

      // Movimento reduzido: a captura de página inteira mostra o estado final das animações de revelar.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(pg.path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'largura de rolagem maior que a viewport').toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);

      // querySelectorAll não atravessa shadow DOM (ignora a dev toolbar do Astro).
      const h1Count = await page.evaluate(() => document.querySelectorAll('h1').length);
      expect(h1Count, 'a página deve ter exatamente um h1').toBe(1);

      await page.screenshot({
        path: info.outputPath(`${pg.name}-${vp.name}.png`),
        fullPage: true,
      });
    });
  }
}

test('alvos de toque dos controles têm ≥ 44px de altura', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Em dev o Vite injeta CSS via JS: medir só depois de estilos e fontes aplicados.
  await page.goto('/dev/estilo', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // document.querySelectorAll não atravessa shadow DOM (ignora a dev toolbar do Astro).
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('a.btn, button, .site-nav a, .brand')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ text: el.textContent?.trim().slice(0, 30), h: el.getBoundingClientRect().height }))
      .filter((r) => r.h < 44),
  );
  expect(small).toEqual([]);
});

test('cabeçalho fica no topo do documento e não sobrepõe o conteúdo', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const layout = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('[data-header]')!;
    const hero = document.querySelector<HTMLElement>('.hero')!;
    return {
      position: getComputedStyle(header).position,
      headerTop: header.getBoundingClientRect().top,
      heroTop: hero.getBoundingClientRect().top,
      headerBottom: header.getBoundingClientRect().bottom,
    };
  });
  expect(layout.position).toBe('relative');
  expect(layout.headerTop).toBe(0);
  expect(layout.heroTop).toBeGreaterThanOrEqual(layout.headerBottom);
});

test('prévia do cliente mostra espaços pendentes sem criar links falsos', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('status')).toContainText('Prévia para revisão');
  await expect(page.locator('#fotos')).toBeVisible();
  await expect(page.locator('#informacoes')).toContainText('Capacidade máxima de hóspedes');
  await expect(page.locator('#localizacao')).toContainText('Link do Google Maps');
  await expect(page.locator('#reservas')).toContainText('Booking.com');
  await expect(page.locator('#reservas')).toContainText('Airbnb');
  await expect(page.locator('#reservas')).toContainText('Decolar');
  await expect(page.locator('#reservas a')).toHaveCount(0);
  await expect(page.locator('#contato')).toContainText('WhatsApp, se desejado');
});

test('menu mobile abre, fecha com Esc e devolve o foco', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dev/estilo');
  const toggle = page.locator('[data-nav-toggle]');
  await expect(toggle).toBeVisible();
  await expect(page.locator('#site-nav')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#site-nav')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('com prefers-reduced-motion, o hero não anima', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const animation = await page.$eval('.hero__name', (el) => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
});
