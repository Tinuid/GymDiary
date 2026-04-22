import { Link } from 'react-router-dom';
import type { Machine } from '../types';
import { useBlobUrl } from './useBlobUrl';
import styles from './MachineCard.module.css';

export default function MachineCard({ machine }: { machine: Machine }) {
  const url = useBlobUrl(machine.photoThumbBlob);
  return (
    <Link to={`/geraet/${machine.id}`} className={styles.card}>
      <div className={styles.thumbWrap}>
        {url ? <img src={url} alt="" className={styles.thumb} /> : <div className={styles.thumbPlaceholder} />}
      </div>
      <div className={styles.name}>{machine.name}</div>
    </Link>
  );
}
