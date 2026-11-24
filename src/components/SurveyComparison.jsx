import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { METHODS, methodById, seededRandom } from '../utils/methods';
import { analyseSurvey, useSurveys } from '../utils/surveys';
import { accumulationCurve } from '../utils/stats';

const fmt = (n, d = 1) =>
  n === null || n === undefined || !Number.isFinite(n) ? '—' : Number(n.toFixed(d)).toString();
const AREA_METHODS = ['quadrat', 'circular', 'transect'];

/**
 * Effort-standardised comparison of surveys that used the same method.
 * Different designs detect different parts of the community, so methods are
 * never pooled: the user picks one.
 */
const SurveyComparison = ({ records }) => {
  const surveys = useSurveys();
  const withCounts = useMemo(() => (surveys ?? []).filter((s) => methodById(s.method)?.counts), [surveys]);
  const methodsUsed = useMemo(
    () =>
      METHODS.filter((m) => withCounts.some((s) => s.method === m.id))
        .map((m) => ({ ...m, n: withCounts.filter((s) => s.method === m.id).length }))
        .sort((a, b) => b.n - a.n),
    [withCounts],
  );
  const [chosen, setChosen] = useState(null);
  const method = chosen && methodsUsed.some((m) => m.id === chosen) ? chosen : methodsUsed[0]?.id;

  const rows = useMemo(() => {
    const list = withCounts.filter((s) => s.method === method);
    const analysed = list.map((s) => ({
      survey: s,
      a: analyseSurvey(
        s,
        records.filter((r) => r.surveyId === s.id),
      ),
    }));
    // Richness at a common number of units: the smallest number any survey completed.
    const k = Math.min(...analysed.map(({ a }) => a.unitSets.length).filter((n) => n > 0));
    return {
      k: Number.isFinite(k) ? k : null,
      list: analysed.map(({ survey, a }) => ({
        survey,
        a,
        sAtK:
          Number.isFinite(k) && a.unitSets.length >= k
            ? accumulationCurve(a.unitSets, 200, seededRandom(survey.id))[k - 1].s
            : null,
      })),
    };
  }, [withCounts, method, records]);

  if (surveys === undefined) return null;
  if (methodsUsed.length === 0) {
    return (
      <section className="bg-white p-6 rounded-2xl border border-gray-100 mb-8">
        <h3 className="font-black text-gray-800 uppercase tracking-wider text-sm">Surveys by method</h3>
        <p className="text-sm text-gray-600 mt-2">
          To compare sites fairly, record how you searched.{' '}
          <Link to="/surveys/new" className="text-emerald-700 underline">
            Start a survey
          </Link>{' '}
          with quadrats, transects, plots or a timed search, and its records will be compared here by effort.
        </p>
      </section>
    );
  }

  const m = methodById(method);
  const area = AREA_METHODS.includes(method);
  const units = !!m.unitNoun;
  const timed = method === 'timed' || method === 'opportunistic';

  // Visits per site, and the months they span: one visit catches one fruiting flush.
  const bySite = new Map();
  for (const { survey } of rows.list) {
    const key = survey.site.locality.trim() || '(no site name)';
    const e = bySite.get(key) ?? { visits: 0, months: new Set() };
    e.visits++;
    e.months.add(survey.startedAt.slice(0, 7));
    bySite.set(key, e);
  }
  const single = [...bySite.entries()].filter(([, e]) => e.visits < 2).map(([k]) => k);

  return (
    <section className="bg-white p-6 rounded-2xl border border-gray-100 mb-8" aria-labelledby="by-method-h">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h3 id="by-method-h" className="font-black text-gray-800 uppercase tracking-wider text-sm">
            Surveys by method
          </h3>
          <p className="text-[11px] font-bold text-gray-500">
            Compared within one method: different designs detect different parts of the community.
          </p>
        </div>
        <div>
          <label htmlFor="compare-method" className="sr-only">
            Method
          </label>
          <select
            id="compare-method"
            value={method}
            onChange={(e) => setChosen(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-ink"
          >
            {methodsUsed.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} ({x.n})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-[10px] uppercase text-gray-600">
              <th className="py-2 pr-3 font-semibold">Survey</th>
              {units && <th className="py-2 pr-3 font-semibold text-right">{m.unitNoun}s</th>}
              {area && <th className="py-2 pr-3 font-semibold text-right">Area m²</th>}
              {timed && <th className="py-2 pr-3 font-semibold text-right">Person-h</th>}
              <th className="py-2 pr-3 font-semibold text-right">Species</th>
              {units && rows.k && (
                <th className="py-2 pr-3 font-semibold text-right" title="Mean species in k units, from random orders">
                  S at {rows.k}
                </th>
              )}
              {area && <th className="py-2 pr-3 font-semibold text-right">Fruit bodies/m²</th>}
              {timed && <th className="py-2 font-semibold text-right">Species/person-h</th>}
            </tr>
          </thead>
          <tbody>
            {rows.list.map(({ survey, a, sAtK }) => (
              <tr key={survey.id} className="border-t border-gray-100">
                <td className="py-2 pr-3">
                  <Link to={`/surveys/${survey.id}`} className="text-ink hover:text-emerald-700">
                    {survey.name}
                  </Link>
                  <span className="block text-[11px] text-gray-500">
                    {new Date(survey.startedAt).toLocaleDateString()}
                  </span>
                </td>
                {units && <td className="py-2 pr-3 text-right tabular-nums">{a.unitsDone}</td>}
                {area && <td className="py-2 pr-3 text-right tabular-nums">{fmt(a.areaM2, 0)}</td>}
                {timed && <td className="py-2 pr-3 text-right tabular-nums">{fmt(a.personHours, 2)}</td>}
                <td className="py-2 pr-3 text-right tabular-nums">{a.species}</td>
                {units && rows.k && <td className="py-2 pr-3 text-right tabular-nums">{fmt(sAtK, 1)}</td>}
                {area && <td className="py-2 pr-3 text-right tabular-nums">{fmt(a.densityPerM2, 2)}</td>}
                {timed && <td className="py-2 text-right tabular-nums">{fmt(a.speciesPerPersonHour, 2)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] font-medium text-gray-500 mt-3 leading-relaxed">
        {units && rows.k
          ? `"S at ${rows.k}" is the mean number of species in ${rows.k} ${m.unitNoun}${rows.k === 1 ? '' : 's'} (the fewest any survey completed), so surveys of different size can be compared. Species richness does not grow in proportion to area, so species per m² is not used.`
          : timed
            ? 'Species per person-hour standardises for search effort (catch per unit effort).'
            : ''}
        {single.length > 0 &&
          ` Visited once so far: ${single.join(', ')}. Repeat visits across seasons give a fuller inventory.`}
      </p>
    </section>
  );
};

export default SurveyComparison;
