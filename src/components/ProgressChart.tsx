import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Machine, SetEntry, Session } from '../types';
import { getMachine } from '../db/machines';
import { listSessionsByMachine } from '../db/sessions';
import { listSetsByMachine } from '../db/sets';
import { formatDateShort, formatKg } from '../lib/format';

type Range = '30' | '180' | 'all';

interface Point {
  date: number;
  label: string;
  maxKg: number;
  topSet: string;
}

export default function ProgressChart() {
  const { id } = useParams<{ id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [range, setRange] = useState<Range>('30');

  useEffect(() => {
    if (!id) return;
    getMachine(id).then((m) => m && setMachine(m));
    listSessionsByMachine(id).then(setSessions);
    listSetsByMachine(id).then(setSets);
  }, [id]);

  const points = useMemo<Point[]>(() => {
    const now = Date.now();
    const cutoff =
      range === '30'
        ? now - 30 * 24 * 60 * 60 * 1000
        : range === '180'
        ? now - 180 * 24 * 60 * 60 * 1000
        : 0;

    const bySession = new Map<string, SetEntry[]>();
    for (const s of sets) {
      const arr = bySession.get(s.sessionId) ?? [];
      arr.push(s);
      bySession.set(s.sessionId, arr);
    }

    const result: Point[] = [];
    for (const session of sessions) {
      if (session.date < cutoff) continue;
      const entries = bySession.get(session.id) ?? [];
      if (entries.length === 0) continue;
      const top = entries.reduce((a, b) => (a.weightKg >= b.weightKg ? a : b));
      result.push({
        date: session.date,
        label: formatDateShort(session.date),
        maxKg: top.weightKg,
        topSet: `${formatKg(top.weightKg)} × ${top.reps}`,
      });
    }
    return result.sort((a, b) => a.date - b.date);
  }, [sessions, sets, range]);

  return (
    <div className="stack">
      {machine && <h2 style={{ margin: 0 }}>{machine.name}</h2>}

      <div className="row" style={{ gap: 8 }}>
        <RangeBtn active={range === '30'} onClick={() => setRange('30')}>30 Tage</RangeBtn>
        <RangeBtn active={range === '180'} onClick={() => setRange('180')}>6 Monate</RangeBtn>
        <RangeBtn active={range === 'all'} onClick={() => setRange('all')}>Alles</RangeBtn>
      </div>

      {points.length === 0 ? (
        <div className="empty">Noch keine Daten für diesen Zeitraum.</div>
      ) : (
        <div className="card" style={{ padding: 12 }}>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="#2d3540" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#9aa3af" fontSize={12} tickMargin={6} />
                <YAxis stroke="#9aa3af" fontSize={12} width={46} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1f26',
                    border: '1px solid #2d3540',
                    borderRadius: 10,
                    color: '#f2f4f7',
                  }}
                  formatter={(value: number) => [formatKg(value), 'Max.']}
                  labelFormatter={(label) => `Datum: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="maxKg"
                  stroke="#f4a261"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f4a261' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: 13, marginTop: 8 }}>
            <span>Sessions: {points.length}</span>
            <span>Top: {formatKg(Math.max(...points.map((p) => p.maxKg)))}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RangeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`btn ${active ? 'btn-primary' : ''}`}
      onClick={onClick}
      style={{ flex: 1, minHeight: 40 }}
    >
      {children}
    </button>
  );
}
