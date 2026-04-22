import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Machine, Session, SetEntry } from '../types';
import { getMachine, touchMachine } from '../db/machines';
import { getOrCreateTodaysSession, listSessionsByMachine } from '../db/sessions';
import { addSet, deleteSet, listSetsBySession } from '../db/sets';
import { useAppStore } from '../store/useAppStore';
import { formatDate, formatKg } from '../lib/format';
import SetInput from './SetInput';
import { useBlobUrl } from './useBlobUrl';
import styles from './MachineDetail.module.css';

export default function MachineDetail() {
  const { id } = useParams<{ id: string }>();
  const refresh = useAppStore((s) => s.refreshMachines);

  const [machine, setMachine] = useState<Machine | null>(null);
  const [todaySession, setTodaySession] = useState<Session | null>(null);
  const [todaySets, setTodaySets] = useState<SetEntry[]>([]);
  const [previousSession, setPreviousSession] = useState<{ session: Session; sets: SetEntry[] } | null>(null);
  const photoUrl = useBlobUrl(machine?.photoBlob);

  const load = useCallback(async () => {
    if (!id) return;
    const m = await getMachine(id);
    if (!m) return;
    setMachine(m);

    const today = await getOrCreateTodaysSession(id);
    setTodaySession(today);
    setTodaySets(await listSetsBySession(today.id));

    const all = await listSessionsByMachine(id);
    const prior = all.find((s) => s.id !== today.id) ?? null;
    if (prior) {
      const sets = await listSetsBySession(prior.id);
      setPreviousSession({ session: prior, sets });
    } else {
      setPreviousSession(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!machine || !todaySession) {
    return <div className="empty">Lade …</div>;
  }

  const initialWeight = todaySets.at(-1)?.weightKg ?? previousSession?.sets.at(-1)?.weightKg ?? 20;
  const initialReps = todaySets.at(-1)?.reps ?? previousSession?.sets.at(-1)?.reps ?? 10;

  async function handleSave(weightKg: number, reps: number) {
    if (!machine || !todaySession) return;
    await addSet({ sessionId: todaySession.id, machineId: machine.id, weightKg, reps });
    await touchMachine(machine.id);
    await refresh();
    await load();
  }

  async function handleDeleteSet(setId: string) {
    await deleteSet(setId);
    await load();
  }

  return (
    <div className="stack">
      <div className={styles.hero}>
        {photoUrl && <img src={photoUrl} alt={machine.name} className={styles.photo} />}
        <div className={styles.heroOverlay}>
          <div className="chip">{machine.muscleGroup}</div>
          <h2 className={styles.title}>{machine.name}</h2>
        </div>
      </div>

      {machine.settings && (
        <div className="card">
          <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 4 }}>Einstellungen</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{machine.settings}</div>
        </div>
      )}

      {previousSession && (
        <div className="card">
          <div className={styles.sessionHeader}>
            <span>Letztes Mal · {formatDate(previousSession.session.date)}</span>
          </div>
          <ul className={styles.setList}>
            {previousSession.sets.map((s) => (
              <li key={s.id}>
                <span className={styles.setIndex}>#{s.setIndex}</span>
                <span>{formatKg(s.weightKg)}</span>
                <span>×&nbsp;{s.reps}</span>
              </li>
            ))}
            {previousSession.sets.length === 0 && (
              <li className={styles.setEmpty}>Keine Sätze erfasst.</li>
            )}
          </ul>
        </div>
      )}

      <div className="card">
        <div className={styles.sessionHeader}>
          <span>Heute · {formatDate(todaySession.date)}</span>
        </div>
        <ul className={styles.setList}>
          {todaySets.map((s) => (
            <li key={s.id}>
              <span className={styles.setIndex}>#{s.setIndex}</span>
              <span>{formatKg(s.weightKg)}</span>
              <span>×&nbsp;{s.reps}</span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginLeft: 'auto', minHeight: 32, padding: '4px 8px', color: 'var(--text-dim)' }}
                onClick={() => handleDeleteSet(s.id)}
                aria-label="Satz löschen"
              >
                ×
              </button>
            </li>
          ))}
          {todaySets.length === 0 && <li className={styles.setEmpty}>Noch kein Satz heute.</li>}
        </ul>
      </div>

      <SetInput initialWeightKg={initialWeight} initialReps={initialReps} onSave={handleSave} />

      <div className="row" style={{ gap: 8 }}>
        <Link to={`/geraet/${machine.id}/progress`} className="btn btn-block">
          Graph
        </Link>
        <Link to={`/geraet/${machine.id}/bearbeiten`} className="btn btn-block">
          Bearbeiten
        </Link>
      </div>
    </div>
  );
}
