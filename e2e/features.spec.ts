import { expect, test } from '@playwright/test';
import { enterOffline, saveRecord } from './helpers';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  // Keep tests offline and deterministic: no map tiles.
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
});

test('edit and delete a record', async ({ page }) => {
  await enterOffline(page);
  await saveRecord(page, { number: 'ED-1', name: 'Coprinus comatus', locality: 'Old meadow' });

  await page.goto('./#/');
  await page.getByRole('link', { name: /Coprinus comatus/ }).click();
  await expect(page.getByRole('heading', { name: 'Coprinus comatus' })).toBeVisible();

  await page.getByRole('link', { name: 'Edit' }).click();
  await expect(page.locator('#locality')).toHaveValue('Old meadow');
  await page.fill('#locality', 'New meadow');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Coprinus comatus' })).toBeVisible();
  await expect(page.getByText('New meadow')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('cannot be recovered')).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).last().click();
  await expect(page).toHaveURL(/#\/community$/);
  await expect(page.getByText('No records to review yet.')).toBeVisible();
});

test('spore measurements give a publication-style summary', async ({ page }) => {
  await enterOffline(page);
  await page.goto('./#/entry');
  await page.fill('#sporeMeasurements', '8 x 6, 10 x 7');
  await expect(page.getByText('8.0–10.0 × 6.0–7.0 µm, mean 9.0 × 6.5 µm, Q = 1.33–1.43, Qm = 1.38, n = 2')).toBeVisible();

  await page.fill('#collectionNumber', 'MIC-1');
  await page.fill('#scientificName', 'Amanita muscaria');
  await page.fill('#sporeMeasurements', '8 x 6, ten by seven');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Use length × width pairs')).toBeVisible();
});

test('GBIF name check resolves a synonym to the accepted name', async ({ page }) => {
  await page.route('https://api.gbif.org/v1/species/match**', (route) => route.fulfill({
    json: {
      usageKey: 5, acceptedUsageKey: 2524566, scientificName: 'Agaricus muscarius L.', rank: 'SPECIES',
      status: 'SYNONYM', confidence: 98, matchType: 'EXACT', kingdom: 'Fungi', phylum: 'Basidiomycota',
      class: 'Agaricomycetes', order: 'Agaricales', family: 'Amanitaceae', genus: 'Amanita',
    },
  }));
  await page.route('https://api.gbif.org/v1/species/2524566', (route) => route.fulfill({
    json: { key: 2524566, scientificName: 'Amanita muscaria (L.) Lam.' },
  }));

  await enterOffline(page);
  await page.goto('./#/entry');
  await page.fill('#scientificName', 'Agaricus muscarius');
  await page.getByRole('button', { name: 'Check name with GBIF' }).click();
  await expect(page.getByText('is a synonym')).toBeVisible();
  await page.getByRole('button', { name: 'Use “Amanita muscaria”' }).click();
  await expect(page.locator('#scientificName')).toHaveValue('Amanita muscaria');
});

test('research lab shows Chao1 and a rarefaction curve for a site', async ({ page }) => {
  await enterOffline(page);
  await saveRecord(page, { number: 'S-1', name: 'Amanita muscaria', locality: 'Plot A' });
  await saveRecord(page, { number: 'S-2', name: 'Boletus edulis', locality: 'Plot A' });
  await saveRecord(page, { number: 'S-3', name: 'Boletus edulis', locality: 'Plot B' });

  await page.goto('./#/research');
  await page.selectOption('#site', { label: 'Plot A (2)' });
  // Two singletons, no doubletons: S_chao1 = 2 + 2·1 / (2·1) = 3.0
  await expect(page.getByText('Chao1 Estimated Richness').locator('..')).toContainText('3.0');
  await expect(page.getByText('Sampled 67% of estimated species')).toBeVisible();
  await expect(page.getByRole('img', { name: /Rarefaction curve: 2 species observed in 2 records/ })).toBeVisible();
});

test('map appears for georeferenced records', async ({ page }) => {
  await enterOffline(page);
  await saveRecord(page, { number: 'M-1', name: 'Amanita muscaria', lat: '-33.988', lon: '18.432' });
  await page.goto('./#/');
  await expect(page.getByRole('region', { name: 'Map of georeferenced records' })).toBeVisible();
  await expect(page.locator('.leaflet-interactive')).toHaveCount(1);
  await expect(page.getByLabel('Map legend')).toContainText('Research grade');
});

test('dark mode can be chosen and is remembered', async ({ page }) => {
  await enterOffline(page);
  await page.goto('./#/settings');
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});
