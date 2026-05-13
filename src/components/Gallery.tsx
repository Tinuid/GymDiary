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
  const hideUsedToday = useAppStore((s) => s.hideUsedToday);
  const setHideUsedToday = useAppStore((s) => s.setHideUsedToday);
  const usedToday = useAppStore((s) => s.machineIdsUsedToday);
  const [tab, setTab] = useState<Tab>('Alle');
  const [search, setSearch] = useState('');

  const tabs: Tab[] = useMemo(() => {
    const present = new Set(machines.map((m) => m.muscleGroup));
    return ['Alle', ...MUSCLE_GROUPS.filter((g) => present.has(g))];
  }, [machines]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = machines
      .filter((m) => tab === 'Alle' || m.muscleGroup === tab)
      .filter((m) => !hideUsedToday || !usedToday.has(m.id))
      .filter((m) => q === '' || m.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  }, [machines, tab, search, hideUsedToday, usedToday]);

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
      <input
        type="search"
        placeholder="Gerät suchen …"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Gerät suchen"
      />

      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={hideUsedToday}
          onChange={(e) => setHideUsedToday(e.target.checked)}
          className={styles.checkbox}
        />
        <span>Heute benutzte ausblenden</span>
      </label>

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
        <div className="empty">Keine Geräte gefunden.</div>
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
