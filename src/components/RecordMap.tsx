import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STATUS_STYLE } from './StatusBadge';
import { displayStatus } from '../utils/observations';
import type { FieldRecord } from '../types';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** OpenStreetMap with one marker per georeferenced record, coloured by status. */
const RecordMap: React.FC<{ records: FieldRecord[] }> = ({ records }) => {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView([20, 0], 1);
    // OSM tile usage policy requires visible attribution.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();
    const pts: L.LatLngExpression[] = [];
    for (const r of records) {
      if (r.latitude === null || r.longitude === null) continue;
      const status = STATUS_STYLE[displayStatus(r)];
      const ll: L.LatLngExpression = [r.latitude, r.longitude];
      pts.push(ll);
      if (r.coordinateUncertaintyInMeters) {
        L.circle(ll, { radius: r.coordinateUncertaintyInMeters, color: status.color, weight: 1, fillOpacity: 0.08, interactive: false }).addTo(group);
      }
      L.circleMarker(ll, { radius: 8, color: '#ffffff', weight: 2, fillColor: status.color, fillOpacity: 1 })
        .bindTooltip(`<i>${escapeHtml(r.scientificName)}</i><br>${escapeHtml(r.collectionNumber)} · ${status.label}`)
        .on('click', () => navigate(`/record/${r.id}`))
        .addTo(group);
    }
    if (pts.length === 1) m.setView(pts[0], 13);
    else if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [24, 24], maxZoom: 14 });
  }, [records, navigate]);

  return (
    <div>
      <div ref={el} className="h-64 w-full rounded-2xl overflow-hidden bg-gray-100 isolate" role="region" aria-label="Map of georeferenced records" />
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3" aria-label="Map legend">
        {(['UNVERIFIED', 'COMMUNITY_GRADE', 'RESEARCH_GRADE', 'FLAGGED'] as const).map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_STYLE[s].color }} aria-hidden="true" />
            {STATUS_STYLE[s].label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecordMap;
