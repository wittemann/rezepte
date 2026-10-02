// Shrinks a photo from the camera in the browser before the upload: phone photos are several MB,
// the app wants 1200 px (docs/decisions/0005-image-handling.md). Returns the JPEG as base64 text.
import { fitWithin, MAX_PHOTO_SIDE, PHOTO_JPEG_QUALITY } from '../lib/images/photo.ts';

export async function resizePhoto(file: File) {
  // 'from-image' turns the picture upright as the camera's rotation info says
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_PHOTO_SIDE);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', PHOTO_JPEG_QUALITY),
  );
  if (!blob) throw new Error('The photo could not be converted to JPEG');
  return { blob, base64: await toBase64(blob) };
}

async function toBase64(blob: Blob) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}
