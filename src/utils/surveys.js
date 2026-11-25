import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { localDb } from './db';
import {
  generateUnits,
  methodById,
  normaliseParams,
  personHours,
  sampleSize,
  surveySnapshot,
  unitAreaM2,
} from './methods';
import { speciesKey } from './stats';

// Surveys (sampling events) are kept on this device. Every linked record
// carries a snapshot of its survey's design, so synced records keep their
// methodology wherever they are read.

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Create a survey. Returns { id } or { error } if the layout can't be generated. */
export const createSurvey = async ({ userId, name, method, params, site, repeatOf = null, notes = '' }) => {
  const id = newId();
  const clean = normaliseParams(method, params);
  const { units, error } = generateUnits(method, clean, id);
  if (error) return { error };
  const now = new Date().toISOString();
  await localDb.surveys.add({
    id,
    userId,
    name: name.trim() || methodById(method)?.name || 'Survey',
    method,
    params: clean,
    site: {
      locality: site?.locality?.trim() ?? '',
      latitude: site?.latitude ?? null,
      longitude: site?.longitude ?? null,
    },
    units,
    timer: method === 'timed' ? { runningSince: null, elapsedMs: 0 } : null,
    status: 'active',
    startedAt: now,
    endedAt: null,
    repeatOf,
    notes,
    createdAt: now,
    updatedAt: now,
  });
  return { id };
};

/**
 * Change a survey and refresh the design snapshot on its linked records.
 * `change` gets the latest stored survey and returns the fields to update. The
 * read and write happen in one transaction, so quick taps (ticking several
 * units in a row) each build on the previous one instead of on what was on
 * screen, and no update is lost.
 */
export const updateSurvey = async (id, change) => {
  await localDb.transaction('rw', localDb.surveys, async () => {
    const current = await localDb.surveys.get(id);
    if (!current) return;
    const patch = typeof change === 'function' ? change(current) : change;
    if (patch) await localDb.surveys.update(id, { ...patch, updatedAt: new Date().toISOString() });
  });
  await refreshLinkedRecords(id);
};

const stopClock = (timer) =>
  timer?.runningSince != null
    ? { runningSince: null, elapsedMs: timer.elapsedMs + (Date.now() - timer.runningSince) }
    : timer;

export const finishSurvey = (survey) =>
  updateSurvey(survey.id, (s) => ({
    status: 'completed',
    endedAt: new Date().toISOString(),
    timer: stopClock(s.timer),
  }));

export const reopenSurvey = (survey) => updateSurvey(survey.id, { status: 'active', endedAt: null });

export const toggleUnitDone = (survey, unitId) =>
  updateSurvey(survey.id, (s) => ({
    units: s.units.map((u) => (u.id === unitId ? { ...u, done: !u.done } : u)),
  }));

/** Woody debris: add a log as a new sampling unit (marked examined). */
export const addLog = (survey, { decayClass, lengthM, diameterCm, note }) =>
  updateSurvey(survey.id, (s) => {
    const n = s.units.length + 1;
    const unit = {
      id: `L${n}-${Date.now().toString(36)}`,
      label: `L${n}`,
      done: true,
      meta: { decayClass, lengthM, diameterCm, note: note ?? '' },
    };
    return { units: [...s.units, unit] };
  });

export const startTimer = (survey) =>
  updateSurvey(survey.id, (s) =>
    s.timer?.runningSince ? null : { timer: { ...(s.timer ?? { elapsedMs: 0 }), runningSince: Date.now() } },
  );

export const pauseTimer = (survey) =>
  updateSurvey(survey.id, (s) => (s.timer?.runningSince ? { timer: stopClock(s.timer) } : null));

/** Delete a survey; its records stay, unlinked but with their design snapshot. */
export const deleteSurvey = async (id) => {
  await localDb.transaction('rw', localDb.surveys, localDb.observations, async () => {
    await localDb.surveys.delete(id);
    const linked = await localDb.observations.where('surveyId').equals(id).toArray();
    for (const r of linked) await localDb.observations.update(r.id, { surveyId: null });
  });
};

/** Keep each linked record's snapshot in step with its survey (and queue it for sync). */
export const refreshLinkedRecords = async (surveyId) => {
  const survey = await localDb.surveys.get(surveyId);
  if (!survey) return;
  const snapshot = surveySnapshot(survey);
  const linked = await localDb.observations.where('surveyId').equals(surveyId).toArray();
  for (const r of linked) {
    const unit = survey.units.find((u) => u.id === r.samplingUnitId);
    const next = { survey: snapshot, samplingUnitLabel: unit?.label ?? r.samplingUnitLabel ?? null };
    if (JSON.stringify(next.survey) === JSON.stringify(r.survey) && next.samplingUnitLabel === r.samplingUnitLabel)
      continue;
    await localDb.observations.update(r.id, {
      ...next,
      dirty: r.synced ? true : r.dirty,
      syncAttempts: 0,
      nextSyncAt: 0,
    });
  }
};

/** Fields to store on a record linked to `survey` and `unitId`. */
export const linkFields = (survey, unitId) => {
  if (!survey) return { surveyId: null, samplingUnitId: null, samplingUnitLabel: null, survey: null };
  const unit = survey.units.find((u) => u.id === unitId);
  return {
    surveyId: survey.id,
    samplingUnitId: unit?.id ?? null,
    samplingUnitLabel: unit?.label ?? null,
    survey: surveySnapshot(survey),
  };
};

// ---------------------------------------------------------------------------
// Live queries
// ---------------------------------------------------------------------------

const useLive = (query, deps, initial) => {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setValue, error: () => setValue(initial) });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
};

/** All surveys on this device, newest first. undefined while loading. */
export const useSurveys = () => useLive(() => localDb.surveys.orderBy('startedAt').reverse().toArray(), [], undefined);

/** One survey; null if it doesn't exist, undefined while loading. */
export const useSurvey = (id) =>
  useLive(async () => (id ? ((await localDb.surveys.get(id)) ?? null) : null), [id], undefined);

export const useSurveyRecords = (id) =>
  useLive(() => (id ? localDb.observations.where('surveyId').equals(id).toArray() : []), [id], []);

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

/**
 * Effort-standardised summary of one survey and its records.
 * Only completed units are used for area-based measures.
 */
export const analyseSurvey = (survey, records) => {
  const m = methodById(survey.method);
  const p = normaliseParams(survey.method, survey.params);
  const species = new Set(records.map((r) => speciesKey(r.scientificName)).filter(Boolean));
  const counted = records.filter((r) => r.organismQuantityType === 'sporocarps' && Number.isFinite(r.organismQuantity));
  const fruitBodies = counted.reduce((a, r) => a + r.organismQuantity, 0);
  const doneUnits = (survey.units ?? []).filter((u) => u.done);

  const areaM2 = ['quadrat', 'circular', 'transect'].includes(survey.method)
    ? doneUnits.reduce((a, u) => a + unitAreaM2(survey.method, p, u), 0)
    : null;
  const hours = personHours(survey);

  // Species sets per completed unit, for frequency and accumulation.
  const unitSets = m?.unitNoun
    ? doneUnits.map(
        (u) =>
          new Set(
            records
              .filter((r) => r.samplingUnitId === u.id)
              .map((r) => speciesKey(r.scientificName))
              .filter(Boolean),
          ),
      )
    : [];

  return {
    species: species.size,
    records: records.length,
    fruitBodies: counted.length > 0 ? fruitBodies : null,
    unitsDone: doneUnits.length,
    unitsTotal: (survey.units ?? []).length,
    areaM2: areaM2 || null,
    personHours: hours,
    sampleSize: sampleSize(survey),
    speciesPer100m2: areaM2 ? (species.size / areaM2) * 100 : null,
    speciesPerPersonHour: hours ? species.size / hours : null,
    densityPerM2: areaM2 && counted.length > 0 ? fruitBodies / areaM2 : null,
    unitSets,
  };
};
