import { expect, test } from '@playwright/test';
import { enterOffline, saveRecord } from './helpers';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});

test('offline session survives a reload and can sign out', async ({ page }) => {
  await enterOffline(page);
  await expect(page.getByText('Offline', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Field Overview' })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('COLLECTOR', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Continue Offline' })).toBeVisible();
});

test('field form validates, saves and resets', async ({ page }) => {
  await enterOffline(page);
  await page.goto('./#/entry');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Some required fields');

  await page.fill('#latitude', '95');
  await page.fill('#collectionNumber', 'E2E-001');
  await page.fill('#scientificName', 'Amanita muscaria');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Decimal degrees, −90 to 90')).toBeVisible();

  await page.fill('#latitude', '-33.988');
  await page.fill('#longitude', '18.432');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved E2E-001 on this device');
  await expect(page.locator('#collectionNumber')).toHaveValue('');
});

test('text typed right after navigating is kept', async ({ page }) => {
  // Regression: the exiting page used to render the new route and lose input.
  await enterOffline(page);
  await page.getByRole('link', { name: 'Entry' }).click();
  await page.fill('#collectionNumber', 'FAST-1');
  await page.waitForTimeout(600);
  await expect(page.locator('#collectionNumber')).toHaveValue('FAST-1');
});

test('dashboard and lab metrics reflect saved records', async ({ page }) => {
  await enterOffline(page);
  await saveRecord(page, { number: 'D-1', name: 'Amanita muscaria', locality: 'Site A', lat: '41.378', lon: '-74.004' });
  await saveRecord(page, { number: 'D-2', name: 'Trametes versicolor', locality: 'Site B' });

  await page.goto('./#/');
  await expect(page.getByText('Total Obs').locator('..')).toContainText('2');
  await expect(page.getByText('1 of 2 have WGS84 coordinates')).toBeVisible();

  await page.goto('./#/research');
  // Two species, one record each: H' = ln 2 = 0.69, J' = 1.00
  await expect(page.getByText("Shannon Diversity H′").locator('..')).toContainText('0.69');
  await expect(page.getByText("Pielou Evenness J′").locator('..')).toContainText('1.00');
});

test('collectors can flag but not confirm identifications', async ({ page }) => {
  await enterOffline(page);
  await saveRecord(page, { number: 'R-1', name: 'Boletus edulis' });
  await page.goto('./#/community');
  await expect(page.getByRole('button', { name: 'Confirm ID' })).toBeDisabled();
  await page.getByRole('button', { name: 'Flag', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unflag' })).toBeVisible();
});

test('species search and safety-first assistant', async ({ page }) => {
  await enterOffline(page);
  await page.goto('./#/species');
  await page.fill('#species-search', 'death cap');
  await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Amanita phalloides']);
  await expect(page.getByText('Deadly: amatoxins')).toBeVisible();

  await page.goto('./#/chat');
  await page.getByLabel('Message').fill('Can I eat this?');
  await page.keyboard.press('Enter');
  await expect(page.getByText('cannot tell you whether a wild mushroom is edible')).toBeVisible();
});

test('Darwin Core CSV export', async ({ page }) => {
  await enterOffline(page);
  await saveRecord(page, { number: 'CSV-1', name: 'Pleurotus ostreatus', locality: 'Oak log, plot 3', lat: '51.5', lon: '-0.12' });
  await page.goto('./#/settings');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export Darwin Core CSV/ }).click(),
  ]);
  const fs = await import('node:fs');
  const csv = fs.readFileSync((await download.path())!, 'utf8');
  expect(csv.split('\n')[0]).toContain('scientificName,kingdom');
  expect(csv).toContain('Pleurotus ostreatus,Fungi');
  expect(csv).toContain('"Oak log, plot 3",51.5,-0.12,WGS84');
});

test('unknown routes redirect home', async ({ page }) => {
  await enterOffline(page);
  await page.goto('./#/does-not-exist');
  await expect(page).toHaveURL(/#\/$/);
});
