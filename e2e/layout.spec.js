// Runs on every form factor in playwright.config.js: phone, phone landscape,
// tablet and desktop. Checks the navigation pattern for each and that no page
// scrolls sideways.
import { expect, test } from '@playwright/test';
import { enterOffline, saveRecord } from './helpers';

const PAGES = ['', 'entry', 'community', 'research', 'species', 'chat', 'settings'];

const layoutFor = (project) =>
  ({ 'mobile-chromium': 'bottom', 'phone-landscape': 'rail', tablet: 'rail', desktop: 'sidebar' })[project];

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
});

const noSidewaysScroll = async (page) => {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, 'page must not scroll horizontally').toBeLessThanOrEqual(innerWidth);
};

test('the right navigation for the screen size', async ({ page }, testInfo) => {
  const layout = layoutFor(testInfo.project.name);
  await enterOffline(page);
  const navs = page.getByRole('navigation', { name: 'Main' });
  // Exactly one main navigation is shown at a time.
  await expect(navs).toHaveCount(1);
  const box = await navs.boundingBox();
  const vp = page.viewportSize();

  if (layout === 'bottom') {
    expect(box.y + box.height).toBeGreaterThan(vp.height - 120); // docked at the bottom
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  } else {
    expect(box.x).toBeLessThan(120); // down the left edge
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  }
  if (layout === 'sidebar') {
    // Full titles are shown next to the icons.
    await expect(page.getByRole('link', { name: 'Research Lab' })).toBeVisible();
    await expect(navs.getByText('Research Lab')).toBeVisible();
  }
});

test('navigating from the side or bottom bar', async ({ page }, testInfo) => {
  const layout = layoutFor(testInfo.project.name);
  await enterOffline(page);
  const link = layout === 'bottom' ? 'Labs' : 'Research Lab';
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: link }).click();
  await expect(page.getByRole('heading', { name: 'Research Lab' })).toBeVisible();
  await expect(page).toHaveURL(/#\/research$/);
});

test('no page scrolls sideways', async ({ page }) => {
  await enterOffline(page);
  await saveRecord(page, { number: 'L-1', name: 'Amanita muscaria', locality: 'Plot A', lat: '41.3', lon: '-74' });
  await saveRecord(page, { number: 'L-2', name: 'Boletus edulis', locality: 'Plot A' });
  for (const p of PAGES) {
    await page.goto('./#/' + p);
    await page.waitForTimeout(400);
    await noSidewaysScroll(page);
  }
  await page.goto('./#/community');
  await page
    .getByRole('link', { name: /Amanita muscaria/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Amanita muscaria' })).toBeVisible();
  await noSidewaysScroll(page);
});

test('the chat composer is on screen without scrolling', async ({ page }) => {
  await enterOffline(page);
  await page.goto('./#/chat');
  const composer = page.getByLabel('Message');
  await expect(composer).toBeVisible();
  const box = await composer.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);
  await composer.fill('spore print');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Spore print: remove the stem')).toBeVisible();
});

test('the field form uses two columns on wide screens', async ({ page }, testInfo) => {
  await enterOffline(page);
  await page.goto('./#/entry');
  const first = await page.getByRole('heading', { name: 'Collection Metadata' }).boundingBox();
  const later = await page.getByRole('heading', { name: 'Context & Reactions' }).boundingBox();
  if (testInfo.project.name === 'desktop') {
    expect(later.x).toBeGreaterThan(first.x + 200); // second column
  } else {
    expect(Math.abs(later.x - first.x)).toBeLessThan(2); // one column
  }
});

test('rotating a phone switches between the tab bar and the rail', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'phone-only scenario');
  await enterOffline(page);
  const nav = page.getByRole('navigation', { name: 'Main' });
  const { width, height } = page.viewportSize();

  await page.setViewportSize({ width: height, height: width }); // landscape
  await expect(nav).toHaveCount(1);
  await expect.poll(async () => (await nav.boundingBox()).x).toBeLessThan(120);
  await noSidewaysScroll(page);

  await page.setViewportSize({ width, height }); // back to portrait
  await expect
    .poll(async () => {
      const b = await nav.boundingBox();
      return b.y + b.height;
    })
    .toBeGreaterThan(height - 120);
});
