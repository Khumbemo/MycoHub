import { expect } from '@playwright/test';

/** Start an offline (device-only) session and land on the dashboard. */
export const enterOffline = async (page) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Continue Offline' }).click();
  await expect(page.getByRole('heading', { name: 'Field Overview' })).toBeVisible();
};

export const saveRecord = async (page, fields) => {
  await page.goto('./#/entry');
  await page.fill('#collectionNumber', fields.number);
  await page.fill('#scientificName', fields.name);
  if (fields.locality) await page.fill('#locality', fields.locality);
  if (fields.lat) await page.fill('#latitude', fields.lat);
  if (fields.lon) await page.fill('#longitude', fields.lon);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(`Saved ${fields.number}`);
};
