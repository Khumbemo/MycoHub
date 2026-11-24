import { Link } from 'react-router-dom';
import { ClipboardList, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { methodById, samplingProtocol } from '../../utils/methods';
import { useSurveys } from '../../utils/surveys';
import { useLocalRecords } from '../../utils/observations';

const dateFmt = { day: 'numeric', month: 'short', year: 'numeric' };

export const SurveyCard = ({ survey, records }) => {
  const m = methodById(survey.method);
  const n = records.filter((r) => r.surveyId === survey.id).length;
  const done = survey.units.filter((u) => u.done).length;
  return (
    <Link
      to={`/surveys/${survey.id}`}
      className="block bg-white border border-gray-200 rounded-2xl p-4 hover:border-emerald-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase text-emerald-700">{m?.name ?? survey.method}</p>
          <h3 className="text-lg text-ink leading-tight truncate">{survey.name}</h3>
          <p className="text-xs text-gray-600 mt-0.5 truncate">
            {[survey.site.locality, new Date(survey.startedAt).toLocaleDateString(undefined, dateFmt)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" aria-hidden="true" />
      </div>
      <p className="text-[12px] text-gray-600 mt-2 line-clamp-2">{samplingProtocol(survey)}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] uppercase text-gray-600">
        {m?.unitNoun && (
          <span className="tabular-nums">
            {survey.method === 'substrate'
              ? `${survey.units.length} logs`
              : `${done}/${survey.units.length} ${m.unitNoun}s`}
          </span>
        )}
        {m?.counts && <span className="tabular-nums">{n} records</span>}
        <span className={survey.status === 'active' ? 'text-amber-800' : 'text-emerald-700'}>
          {survey.status === 'active' ? 'In progress' : 'Completed'}
        </span>
      </div>
    </Link>
  );
};

const SurveysPage = () => {
  const surveys = useSurveys();
  const records = useLocalRecords() ?? [];

  if (surveys === undefined) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const active = surveys.filter((s) => s.status === 'active');
  const completed = surveys.filter((s) => s.status !== 'active');

  return (
    <div className="pb-12 pt-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-end gap-4 mb-6 px-2">
        <div className="min-w-0">
          <h2 className="text-3xl text-ink leading-none">Surveys</h2>
          <p className="text-[10px] text-gray-500 uppercase mt-2">Sampling design and effort</p>
        </div>
        <Link
          to="/surveys/new"
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-xl flex items-center gap-2 flex-shrink-0 text-xs uppercase"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> New survey
        </Link>
      </div>

      {surveys.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <ClipboardList className="w-8 h-8 mx-auto text-emerald-700 mb-3" aria-hidden="true" />
          <h3 className="text-xl text-ink mb-2">No surveys yet</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-5">
            A survey records how you searched: quadrats, transects, plots, a timed search and so on. Records you make
            during a survey are linked to it, so richness and density can be compared fairly between sites and visits.
          </p>
          <Link
            to="/surveys/new"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-xl text-xs uppercase"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Start a survey
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section aria-labelledby="active-surveys">
              <h3 id="active-surveys" className="text-xs text-gray-500 uppercase ml-2 mb-3">
                In progress
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {active.map((s) => (
                  <SurveyCard key={s.id} survey={s} records={records} />
                ))}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section aria-labelledby="completed-surveys">
              <h3 id="completed-surveys" className="text-xs text-gray-500 uppercase ml-2 mb-3">
                Completed
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {completed.map((s) => (
                  <SurveyCard key={s.id} survey={s} records={records} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveysPage;
