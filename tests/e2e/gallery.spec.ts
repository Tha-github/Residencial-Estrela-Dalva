import { expect, test } from '@playwright/test';

const PAGE = '/dev/previa/completa';

test.describe('imagens e galeria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'networkidle' });
  });

  test('hero (LCP): sem lazy-load, prioridade alta, AVIF/WebP e dimensões', async ({ page }) => {
    const hero = await page.evaluate(() => {
      const img = document.querySelector<HTMLImageElement>('.hero__media img')!;
      const types = [...img.closest('picture')!.querySelectorAll('source')].map((s) => s.type);
      return {
        loading: img.getAttribute('loading'),
        priority: img.getAttribute('fetchpriority'),
        width: img.getAttribute('width'),
        height: img.getAttribute('height'),
        types,
        sizes: img.getAttribute('sizes'),
      };
    });
    expect(hero.loading).toBe('eager');
    expect(hero.priority).toBe('high');
    expect(Number(hero.width)).toBeGreaterThan(0);
    expect(Number(hero.height)).toBeGreaterThan(0);
    expect(hero.types).toEqual(['image/avif', 'image/webp']);
  });

  test('miniaturas: lazy-load, dimensões, formatos modernos e alt vazio no img (nome no link)', async ({ page }) => {
    const thumbs = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLImageElement>('.gallery img')].map((img) => ({
        loading: img.loading,
        hasSize: Number(img.getAttribute('width')) > 0 && Number(img.getAttribute('height')) > 0,
        alt: img.alt,
        types: [...img.closest('picture')!.querySelectorAll('source')].map((s) => s.type),
        linkLabel: img.closest('a')?.getAttribute('aria-label') ?? '',
      })),
    );
    expect(thumbs.length).toBe(7);
    for (const t of thumbs) {
      expect(t).toMatchObject({ loading: 'lazy', hasSize: true, alt: '', types: ['image/avif', 'image/webp'] });
      expect(t.linkLabel).toMatch(/^Ampliar foto \d+ de 7/);
    }
  });

  test('ordem narrativa: fachada primeiro, sem grupo por último', async ({ page }) => {
    const labels = await page.$$eval('.gallery a', (as) => as.map((a) => a.getAttribute('aria-label') ?? ''));
    expect(labels[0]).toContain('fachada');
    expect(labels.at(-1)).toContain('sem grupo');
  });

  test('mosaico mostra 5 e oferece "Ver todas as 7 fotos"', async ({ page }) => {
    const visible = await page.$$eval('.gallery__item', (els) =>
      els.filter((el) => (el as HTMLElement).offsetParent !== null).length,
    );
    expect(visible).toBe(5);
    await expect(page.getByRole('button', { name: 'Ver todas as 7 fotos' })).toBeVisible();
  });

  test('lightbox: abre, navega por teclado, anuncia posição, fecha com Esc e devolve o foco', async ({ page }) => {
    const second = page.locator('.gallery a[data-index="1"]');
    await second.click();
    const dialog = page.locator('dialog[data-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-counter]')).toHaveText('Foto 2 de 7');
    await expect(dialog.getByRole('button', { name: 'Fechar' })).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('[data-counter]')).toHaveText('Foto 3 de 7');
    await page.keyboard.press('End');
    await expect(dialog.locator('[data-counter]')).toHaveText('Foto 7 de 7');
    await page.keyboard.press('ArrowRight'); // volta ao início (circular)
    await expect(dialog.locator('[data-counter]')).toHaveText('Foto 1 de 7');
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('[data-counter]')).toHaveText('Foto 7 de 7');

    // Foto inteira, sem recorte; alt preenchido.
    const img = await dialog.locator('img').evaluate((el: HTMLImageElement) => ({
      fit: getComputedStyle(el).objectFit,
      alt: el.alt,
    }));
    expect(img.fit).toBe('contain');
    expect(img.alt).toContain('[exemplo]');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(second).toBeFocused();
  });

  test('lightbox: legenda só aparece quando informada', async ({ page }) => {
    const withCaption = page.locator('.gallery a', { hasText: 'Legenda opcional' });
    await withCaption.click();
    await expect(page.locator('[data-lb-caption]')).toHaveText('[exemplo] Legenda opcional confirmada');
    await page.getByRole('button', { name: 'Próxima foto' }).click();
    await expect(page.locator('[data-lb-caption]')).toHaveText('');
  });

  test('lightbox: clique no fundo fecha; botões de navegação ≥ 44px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.gallery a[data-index="0"]').click();
    const sizes = await page.$$eval('.lightbox__btn', (bs) => bs.map((b) => b.getBoundingClientRect().height));
    for (const h of sizes) expect(h).toBeGreaterThanOrEqual(44);
    await page.mouse.click(10, 300);
    await expect(page.locator('dialog[data-lightbox]')).toBeHidden();
  });

  test('"Ver todas" abre na primeira foto fora do mosaico', async ({ page }) => {
    await page.getByRole('button', { name: 'Ver todas as 7 fotos' }).click();
    await expect(page.locator('[data-counter]')).toHaveText('Foto 6 de 7');
  });

  test('lightbox trava a rolagem da página enquanto aberto', async ({ page }) => {
    await page.locator('.gallery a[data-index="0"]').click();
    await expect(page.locator('html')).toHaveClass(/is-lightbox-open/);
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveClass(/is-lightbox-open/);
  });
});

test.describe('legibilidade do hero com foto', () => {
  // O texto precisa ficar inteiro sobre o véu forte (contraste testado no pior caso em
  // tests/unit/contrast.test.ts). O véu forte começa após o degradê (padding-top da faixa).
  for (const vp of [
    { width: 320, height: 640 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`texto do hero inteiro sobre o véu forte (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(PAGE, { waitUntil: 'networkidle' });
      const r = await page.evaluate(() => {
        const band = document.querySelector<HTMLElement>('.hero__band')!;
        const b = band.getBoundingClientRect();
        const c = document.querySelector('.hero__content')!.getBoundingClientRect();
        const hero = document.querySelector('.hero')!.getBoundingClientRect();
        return {
          strongStart: b.top + parseFloat(getComputedStyle(band).paddingTop),
          contentTop: c.top,
          contentBottom: c.bottom,
          bandBottom: b.bottom,
          heroBottom: hero.bottom,
        };
      });
      expect(r.contentTop).toBeGreaterThanOrEqual(r.strongStart - 0.5);
      expect(r.contentBottom).toBeLessThanOrEqual(r.bandBottom);
      expect(r.bandBottom).toBeLessThanOrEqual(r.heroBottom + 0.5);
    });
  }
});

test('lightbox: termina em estado "pronto" com a foto ocupando o palco', async ({ page }) => {
  await page.goto(PAGE, { waitUntil: 'networkidle' });
  await page.locator('.gallery a').first().click();
  const stage = page.locator('[data-stage]');
  await expect(stage).toHaveAttribute('data-state', 'ready', { timeout: 15_000 });
  await expect(stage).not.toHaveAttribute('aria-busy');
  const box = await stage.locator('img').boundingBox();
  expect(box!.width).toBeGreaterThan(100);
  expect(box!.height).toBeGreaterThan(100);
});

test.describe('estabilidade de layout', () => {
  for (const vp of [
    { width: 360, height: 740 },
    { width: 1440, height: 900 },
  ]) {
    test(`CLS ≈ 0 ao carregar e rolar (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.addInitScript(() => {
        (window as unknown as { __cls: number }).__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
            if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(PAGE, { waitUntil: 'networkidle' });
      for (let y = 0; y < 8; y++) {
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(120);
      }
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
      expect(cls).toBeLessThan(0.05);
    });
  }
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('todas as fotos ficam visíveis e cada miniatura é um link para a imagem ampliada', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'networkidle' });
    const items = await page.$$eval('.gallery__item', (els) =>
      els.filter((el) => (el as HTMLElement).offsetParent !== null).length,
    );
    expect(items).toBe(7);
    const href = await page.locator('.gallery a').first().getAttribute('href');
    // dev: /_image?...&f=webp · build: /_astro/....webp
    expect(href).toMatch(/\.webp|f=webp/);
    await expect(page.locator('[data-gallery-all]')).toBeHidden();
  });
});
