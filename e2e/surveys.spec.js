import { expect, test } from '@playwright/test';
import { enterOffline } from './helpers';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
});

test('a quadrat survey: design, sampling units, counted records, results and export', async ({ page }) => {
  await enterOffline(page);
  await page.goto('./#/surveys');
  await expect(page.getByRole('heading', { name: 'No surveys yet' })).toBeVisible();
  await page.getByRole('link', { name: 'New survey' }).click();

  // Design: 4 quadrats of 2 × 2 m on a grid in a 20 × 20 m plot
  await page.getByRole('radio', { name: /Quadrats/ }).click();
  await page.fill('#param-sideM', '2');
  await page.fill('#param-count', '4');
  await page.selectOption('#param-placement', 'systematic');
  await page.fill('#param-plotWidthM', '20');
  await page.fill('#param-plotLengthM', '20');
  await expect(page.getByTestId('protocol-preview')).toHaveText(
    'Quadrats, 2 × 2 m (n = 4), systematic grid placement in a 20 × 20 m plot; fruit bodies counted per quadrat',
  );
  // A layout that can't fit is refused
  await page.fill('#param-sideM', '30');
  await expect(page.getByRole('alert')).toContainText("don't fit");
  await expect(page.getByRole('button', { name: 'Start survey' })).toBeDisabled();
  await page.fill('#param-sideM', '2');

  await page.fill('#survey-name', 'Plot A autumn');
  await page.fill('#survey-site', 'Black Rock Forest');
  await page.fill('#survey-lat', '41.4');
  await page.fill('#survey-lng', '-74.0');
  await page.getByRole('button', { name: 'Start survey' }).click();

  await expect(page.getByRole('heading', { name: 'Plot A autumn' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Plot plan, 20 by 20 m, with 4 quadrats/ })).toBeVisible();

  // Search Q1 and Q2; record two species in Q1 and one in Q2
  await page.getByRole('checkbox', { name: 'Q1 searched' }).click();
  await page.getByRole('checkbox', { name: 'Q2 searched' }).click();
  await expect(page.getByRole('checkbox', { name: 'Q1 searched' })).toHaveAttribute('aria-checked', 'true');

  const addIn = async (unit, number, name, count) => {
    await page.getByRole('link', { name: `Add record in ${unit}` }).click();
    await expect(page.getByText('Recording in Plot A autumn')).toBeVisible();
    await expect(page.locator('#locality')).toHaveValue('Black Rock Forest');
    await expect(page.locator('#samplingUnitId')).toHaveValue(unit);
    await page.fill('#collectionNumber', number);
    await page.fill('#scientificName', name);
    await page.fill('#organismQuantity', String(count));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('status')).toContainText(`Saved ${number}`);
    await page.getByRole('link', { name: 'Back to survey' }).click();
  };
  await addIn('Q1', 'PA-1', 'Amanita muscaria', 3);
  await addIn('Q1', 'PA-2', 'Russula emetica', 2);
  await addIn('Q2', 'PA-3', 'Amanita muscaria', 1);

  // Results: 2 species, 6 fruit bodies in 8 m²
  const results = page.getByRole('region', { name: 'Results' });
  const stat = (label) =>
    results.locator('dt', { hasText: new RegExp(`^${label.replace(/[()²]/g, '.')}$`) }).locator('..');
  await expect(stat('Species')).toContainText('2');
  await expect(stat('Fruit bodies')).toContainText('6');
  await expect(stat('Area searched (m²)')).toContainText('8');
  await expect(stat('Fruit bodies per m²')).toContainText('0.75');
  await expect(results.getByRole('row', { name: /Amanita muscaria 2\/2 100%/ })).toBeVisible();

  await expect(page.getByTestId('methods-paragraph')).toContainText(
    '4 quadrats of 2 × 2 m (4 m² each), placed on a systematic grid within a 20 × 20 m study plot',
  );
  await expect(page.getByTestId('methods-paragraph')).toContainText('2 of 4 quadrats were completed.');

  // Darwin Core events export
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Events CSV' }).click();
  const csv = await (await download).createReadStream().then(async (s) => {
    let text = '';
    for await (const chunk of s) text += chunk;
    return text;
  });
  const lines = csv.trim().split('\n');
  expect(lines[0]).toContain('eventID,parentEventID,eventType,eventDate,samplingProtocol,sampleSizeValue');
  expect(lines).toHaveLength(4); // header, survey, 2 completed quadrats

  // Finishing keeps it; Research Lab compares it by method
  await page.getByRole('button', { name: 'Finish survey' }).click();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  await page.goto('./#/research');
  const compare = page.getByRole('region', { name: 'Surveys by method' });
  await expect(compare.getByRole('combobox')).toHaveValue('quadrat');
  await expect(compare.getByRole('row', { name: /Plot A autumn/ })).toContainText('8');
});

test('a timed search keeps time with pause and resume', async ({ page }) => {
  await page.clock.install();
  await enterOffline(page);
  await page.goto('./#/surveys/new');
  await page.getByRole('radio', { name: /Timed search/ }).click();
  await page.fill('#param-durationMin', '30');
  await page.fill('#param-observers', '2');
  await page.fill('#survey-name', 'Meadow timed');
  await page.getByRole('button', { name: 'Start survey' }).click();

  const timer = page.getByRole('region', { name: 'Search timer' });
  await timer.getByRole('button', { name: 'Start' }).click();
  await page.clock.runFor(10 * 60_000);
  await expect(timer.getByRole('status')).toHaveText('20:00 left of 30 min');
  await timer.getByRole('button', { name: 'Pause' }).click();
  await page.clock.runFor(5 * 60_000); // paused: not counted
  await expect(timer.getByRole('status')).toHaveText('20:00 left of 30 min');
  await expect(page.getByRole('region', { name: 'Design' })).toContainText('2 observers; 10 min; 0.33 person-hours');
});

test('a record can be linked to a survey and sampling unit from the form, as presence only', async ({ page }) => {
  await enterOffline(page);
  await page.goto('./#/surveys/new');
  await page.getByRole('radio', { name: /Circular plots/ }).click();
  await page.fill('#survey-name', 'Permanent plots');
  await page.getByRole('button', { name: 'Start survey' }).click();
  await expect(page.getByRole('heading', { name: 'Permanent plots' })).toBeVisible();

  await page.goto('./#/entry');
  await page.selectOption('#surveyId', { label: 'Permanent plots (Circular plots)' });
  await page.selectOption('#samplingUnitId', 'P2');
  await page.getByRole('radio', { name: 'Presence only' }).click();
  await expect(page.locator('#organismQuantity')).toHaveCount(0);
  await page.fill('#collectionNumber', 'PP-1');
  await page.fill('#scientificName', 'Mycena galericulata');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved PP-1');

  await page.goto('./#/surveys');
  await page.getByRole('link', { name: /Permanent plots/ }).click();
  await expect(page.getByRole('region', { name: /Records/ })).toContainText('P2');
  await expect(page.getByRole('region', { name: /Records/ })).toContainText('present');
});

test("editing a record whose survey isn't on this device keeps its survey link", async ({ page }) => {
  await enterOffline(page);
  await page.goto('./#/surveys/new');
  await page.getByRole('radio', { name: /Circular plots/ }).click();
  await page.fill('#survey-name', 'Remote plots');
  await page.getByRole('button', { name: 'Start survey' }).click();
  await page.getByRole('link', { name: 'Add record in P1', exact: true }).click();
  await page.fill('#collectionNumber', 'RP-1');
  await page.fill('#scientificName', 'Mycena galericulata');
  await page.fill('#organismQuantity', '2');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved RP-1');

  // Simulate a record synced from another device: its survey isn't stored here.
  const idb = (fn) =>
    page.evaluate(
      (src) =>
        new Promise((resolve, reject) => {
          const open = indexedDB.open('MycoHubDB');
          open.onerror = () => reject(open.error);
          open.onsuccess = () => new Function('db', 'resolve', src)(open.result, resolve);
        }),
      `(${fn})(db, resolve)`,
    );
  await idb(
    `(db, resolve) => { const tx = db.transaction('surveys', 'readwrite'); tx.objectStore('surveys').clear(); tx.oncomplete = () => resolve(); }`,
  );
  const recordId = await idb(
    `(db, resolve) => { const r = db.transaction('observations').objectStore('observations').getAll(); r.onsuccess = () => resolve(r.result[0].id); }`,
  );

  await page.goto(`./#/entry/${recordId}`);
  await page.reload(); // a fresh start, as on the other device
  await expect(page.locator('#surveyId')).toHaveValue(/.+/);
  await expect(page.locator('#surveyId option:checked')).toHaveText('Remote plots (not on this device)');
  await page.fill('#scientificName', 'Mycena polygramma');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#/record/${recordId}`));

  const stored = await idb(
    `(db, resolve) => { const r = db.transaction('observations').objectStore('observations').get('${recordId}'); r.onsuccess = () => resolve(r.result); }`,
  );
  expect(stored.scientificName).toBe('Mycena polygramma');
  expect(stored.surveyId).toBeTruthy();
  expect(stored.samplingUnitId).toBe('P1');
  expect(stored.survey.name).toBe('Remote plots');
  expect(stored.organismQuantity).toBe(2);
});
