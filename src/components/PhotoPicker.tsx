import { useRef, useState } from 'react';
import { resizeToWebp, makeThumb } from '../lib/image';
import styles from './PhotoPicker.module.css';

export interface PhotoResult {
  full: Blob;
  thumb: Blob;
  previewUrl: string;
}

interface Props {
  initialPreviewUrl?: string | null;
  onPicked: (result: PhotoResult) => void;
}

export default function PhotoPicker({ initialPreviewUrl, onPicked }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const [full, thumb] = await Promise.all([resizeToWebp(file), makeThumb(file)]);
      const url = URL.createObjectURL(full);
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      onPicked({ full, thumb, previewUrl: url });
    } catch (err) {
      setError((err as Error).message || 'Bild konnte nicht verarbeitet werden');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.preview}>
        {previewUrl ? (
          <img src={previewUrl} alt="Vorschau" />
        ) : (
          <div className={styles.placeholder}>Kein Foto</div>
        )}
        {busy && <div className={styles.overlay}>Verarbeite …</div>}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="btn"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {previewUrl ? 'Foto ändern' : 'Foto auswählen'}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        hidden
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
