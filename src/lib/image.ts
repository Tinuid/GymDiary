const WEBP_QUALITY = 0.82;
const THUMB_QUALITY = 0.75;

async function resizeToBlob(file: File | Blob, maxEdge: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  let blob: Blob | null = null;

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D-Kontext nicht verfügbar');
    ctx.drawImage(bitmap, 0, 0, w, h);
    blob = await canvas.convertToBlob({ type: 'image/webp', quality });
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D-Kontext nicht verfügbar');
    ctx.drawImage(bitmap, 0, 0, w, h);
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    );
  }
  bitmap.close?.();
  if (!blob) throw new Error('Bild konnte nicht encodiert werden');
  return blob;
}

export async function resizeToWebp(file: File | Blob, maxEdge = 800): Promise<Blob> {
  return resizeToBlob(file, maxEdge, WEBP_QUALITY);
}

export async function makeThumb(file: File | Blob, maxEdge = 240): Promise<Blob> {
  return resizeToBlob(file, maxEdge, THUMB_QUALITY);
}

export function blobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
