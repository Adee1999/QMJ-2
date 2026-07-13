const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.8;

// Файлды canvas арқылы сығып, base64 JPEG data URL-ге айналдырады.
// Бұл сурет өлшемін азайтып, backend-ке жіберілетін JSON көлемін шектейді.
export async function resizeImageToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas контекстін алу мүмкін болмады');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
