import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MUSCLE_GROUPS, type Machine, type MuscleGroup } from '../types';
import { createMachine, deleteMachine, getMachine, updateMachine } from '../db/machines';
import { useAppStore } from '../store/useAppStore';
import PhotoPicker, { type PhotoResult } from './PhotoPicker';

interface Props {
  mode: 'create' | 'edit';
}

export default function MachineForm({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const refresh = useAppStore((s) => s.refreshMachines);

  const [existing, setExisting] = useState<Machine | null>(null);
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Brust');
  const [settings, setSettings] = useState('');
  const [photo, setPhoto] = useState<PhotoResult | null>(null);
  const [initialPhotoUrl, setInitialPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let alive = true;
    let url: string | null = null;
    getMachine(id).then((m) => {
      if (!alive || !m) return;
      setExisting(m);
      setName(m.name);
      setMuscleGroup(m.muscleGroup);
      setSettings(m.settings);
      url = URL.createObjectURL(m.photoBlob);
      setInitialPhotoUrl(url);
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [mode, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Bitte einen Namen angeben');
      return;
    }
    if (mode === 'create' && !photo) {
      setError('Bitte ein Foto auswählen');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'create' && photo) {
        await createMachine({
          name: name.trim(),
          muscleGroup,
          settings: settings.trim(),
          photoBlob: photo.full,
          photoThumbBlob: photo.thumb,
        });
      } else if (mode === 'edit' && existing) {
        const updated: Machine = {
          ...existing,
          name: name.trim(),
          muscleGroup,
          settings: settings.trim(),
          photoBlob: photo?.full ?? existing.photoBlob,
          photoThumbBlob: photo?.thumb ?? existing.photoThumbBlob,
        };
        await updateMachine(updated);
      }
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    if (!confirm(`Gerät „${existing.name}" mitsamt allen Sätzen löschen?`)) return;
    await deleteMachine(existing.id);
    await refresh();
    navigate('/', { replace: true });
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <PhotoPicker initialPreviewUrl={initialPhotoUrl} onPicked={setPhoto} />

      <label className="stack" style={{ gap: 6 }}>
        <span>Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Beinpresse"
          autoFocus
        />
      </label>

      <label className="stack" style={{ gap: 6 }}>
        <span>Muskelgruppe</span>
        <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <label className="stack" style={{ gap: 6 }}>
        <span>Einstellungen (optional)</span>
        <textarea
          value={settings}
          onChange={(e) => setSettings(e.target.value)}
          placeholder="z. B. Sitz: 4, Lehne: 2"
          rows={3}
        />
      </label>

      {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}

      <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
        {saving ? 'Speichere …' : 'Speichern'}
      </button>

      {mode === 'edit' && existing && (
        <button type="button" className="btn btn-danger btn-block" onClick={handleDelete}>
          Gerät löschen
        </button>
      )}
    </form>
  );
}
