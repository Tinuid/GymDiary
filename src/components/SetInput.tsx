import { useState } from 'react';
import styles from './SetInput.module.css';

interface Props {
  initialWeightKg: number;
  initialReps: number;
  onSave: (weightKg: number, reps: number) => Promise<void> | void;
}

export default function SetInput({ initialWeightKg, initialReps, onSave }: Props) {
  const [weight, setWeight] = useState(initialWeightKg);
  const [reps, setReps] = useState(initialReps);
  const [saving, setSaving] = useState(false);

  function bumpWeight(delta: number) {
    setWeight((w) => Math.max(0, Math.round((w + delta) * 10) / 10));
  }
  function bumpReps(delta: number) {
    setReps((r) => Math.max(0, r + delta));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(weight, reps);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <span className={styles.label}>Gewicht</span>
        <div className={styles.stepper}>
          <button type="button" className={styles.stepBtn} onClick={() => bumpWeight(-2.5)}>
            −
          </button>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value) || 0)}
            className={styles.value}
          />
          <button type="button" className={styles.stepBtn} onClick={() => bumpWeight(2.5)}>
            ＋
          </button>
        </div>
        <span className={styles.unit}>kg</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Wiederholungen</span>
        <div className={styles.stepper}>
          <button type="button" className={styles.stepBtn} onClick={() => bumpReps(-1)}>
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            value={reps}
            onChange={(e) => setReps(Math.max(0, Math.round(Number(e.target.value) || 0)))}
            className={styles.value}
          />
          <button type="button" className={styles.stepBtn} onClick={() => bumpReps(1)}>
            ＋
          </button>
        </div>
        <span className={styles.unit} />
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={handleSave}
        disabled={saving || reps === 0}
      >
        {saving ? 'Speichere …' : 'Satz speichern'}
      </button>
    </div>
  );
}
