import { getDb } from './schema';

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  const value = (await db.get('meta', key)) as T | undefined;
  return value === undefined ? fallback : value;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  const db = await getDb();
  await db.put('meta', value, key);
}
