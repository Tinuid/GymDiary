import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export function formatKg(kg: number): string {
  return `${kg.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kg`;
}

export function formatDate(ts: number): string {
  return format(ts, 'dd.MM.yyyy', { locale: de });
}

export function formatDateShort(ts: number): string {
  return format(ts, 'dd.MM.', { locale: de });
}

export function formatRelative(ts: number): string {
  return formatDistanceToNow(ts, { locale: de, addSuffix: true });
}

export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}
