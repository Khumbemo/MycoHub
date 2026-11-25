import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Survey storage without the sync engine (no Firebase in unit tests).
vi.mock('./sync', () => ({ syncNow: async () => {} }));

const { localDb } = await import('./db');
const { addLog, createSurvey, finishSurvey, pauseTimer, startTimer, toggleUnitDone } = await import('./surveys');

const get = (id) => localDb.surveys.get(id);

beforeEach(async () => {
  await localDb.surveys.clear();
  await localDb.observations.clear();
});

describe('survey updates', () => {
  it('keeps every tick when units are tapped in quick succession', async () => {
    const { id } = await createSurvey({
      userId: 'u1',
      name: 'Q',
      method: 'quadrat',
      params: { placement: 'subjective' },
    });
    const stale = await get(id); // what the screen showed before the taps
    await Promise.all(['Q1', 'Q2', 'Q3', 'Q4'].map((u) => toggleUnitDone(stale, u)));
    const done = (await get(id)).units.filter((u) => u.done).map((u) => u.id);
    expect(done.sort()).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
  });

  it('untick then re-tick from the same screen state ends ticked', async () => {
    const { id } = await createSurvey({ userId: 'u1', name: 'Q', method: 'circular', params: { count: 2 } });
    await toggleUnitDone(await get(id), 'P1');
    const stale = await get(id);
    await toggleUnitDone(stale, 'P1');
    await toggleUnitDone(stale, 'P1');
    expect((await get(id)).units.find((u) => u.id === 'P1').done).toBe(true);
  });

  it('numbers logs added quickly without duplicates', async () => {
    const { id } = await createSurvey({ userId: 'u1', name: 'CWD', method: 'substrate', params: {} });
    const stale = await get(id);
    await Promise.all([1, 2, 3].map((c) => addLog(stale, { decayClass: c })));
    const labels = (await get(id)).units.map((u) => u.label);
    expect(labels).toEqual(['L1', 'L2', 'L3']);
  });

  it('a second Start does not restart the clock, and Finish stops it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-10-04T09:00:00Z'));
      const { id } = await createSurvey({ userId: 'u1', name: 'T', method: 'timed', params: {} });
      await startTimer(await get(id));
      vi.setSystemTime(new Date('2026-10-04T09:10:00Z'));
      await startTimer(await get(id)); // double tap
      vi.setSystemTime(new Date('2026-10-04T09:15:00Z'));
      await pauseTimer(await get(id));
      expect((await get(id)).timer).toEqual({ runningSince: null, elapsedMs: 15 * 60000 });
      await startTimer(await get(id));
      vi.setSystemTime(new Date('2026-10-04T09:20:00Z'));
      await finishSurvey(await get(id));
      const s = await get(id);
      expect(s.status).toBe('completed');
      expect(s.timer).toEqual({ runningSince: null, elapsedMs: 20 * 60000 });
    } finally {
      vi.useRealTimers();
    }
  });
});
