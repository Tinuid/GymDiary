import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import styles from './RestTimer.module.css';

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close().catch(() => undefined);
  } catch {
    // ignore — audio playback is best-effort
  }
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function RestTimer() {
  const timer = useAppStore((s) => s.timer);
  const cancel = useAppStore((s) => s.cancelRestTimer);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer]);

  useEffect(() => {
    if (!timer) return;
    const remaining = timer.endsAt - now;
    if (remaining <= 0) {
      navigator.vibrate?.([200, 100, 200]);
      playBeep();
      cancel();
    }
  }, [timer, now, cancel]);

  if (!timer) return null;

  const remainingMs = Math.max(0, timer.endsAt - now);
  const remainingSec = remainingMs / 1000;
  const progress = 1 - remainingMs / (timer.total * 1000);

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <div className={styles.row}>
        <span className={styles.label}>Pause</span>
        <span className={styles.time}>{fmt(remainingSec)}</span>
        <button type="button" className={styles.cancel} onClick={cancel} aria-label="Pause beenden">
          Abbrechen
        </button>
      </div>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
      </div>
    </div>
  );
}
