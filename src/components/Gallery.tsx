import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { MUSCLE_GROUPS, type MuscleGroup } from '../types';
import MachineCard from './MachineCard';
import styles from './Gallery.module.css';

type Tab = 'Alle' | MuscleGroup;

export default function Gallery() {
  const machines = useAppStore((s) => s.machines);
  const loaded = useAppStore((s) => s.loaded);
  const [tab, setTab] = useState<Tab>('Alle');

  const tabs: Tab[] = useMemo(() => {
    const present = new Set(machines.map((m) => m.muscleGroup));
    return ['Alle', ...MUSCLE_GROUPS.filter((g) => present.has(g))];
  }, [machines]);

  const filtered = useMemo(() => {
    const list = tab === 'Alle' ? machines : machines.filter((m) => m.muscleGroup === tab);
    return [...list].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  }, [machines, tab]);

  if (loaded && machines.length === 0) {
    return (
      <div className="stack">
        <div className="empty">
          <p>Noch keine Geräte angelegt.</p>
          <Link to="/geraet/neu" className="btn btn-primary">
            Erstes Gerät anlegen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className={styles.tabs} role="tablist">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">Keine Geräte in dieser Gruppe.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((m) => (
            <MachineCard key={m.id} machine={m} />
          ))}
        </div>
      )}
    </div>
  );
}
