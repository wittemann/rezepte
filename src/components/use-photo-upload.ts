// Takes the photo of the last cooking mode step: shrinks it in the browser, sends it to the
// addPhoto action and keeps a preview to show while and after it uploads.
import { actions } from 'astro:actions';
import { useEffect, useState } from 'preact/hooks';
import { resizePhoto } from './resize-photo.ts';

export type PhotoStatus = 'none' | 'uploading' | 'saved' | 'failed';

export function usePhotoUpload(recipeId: string) {
  const [status, setStatus] = useState<PhotoStatus>('none');
  const [previewUrl, setPreviewUrl] = useState<string>();

  // The preview is an object URL, which holds the picture in memory until it is revoked
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  async function upload(file: File) {
    setStatus('uploading');
    try {
      const { blob, base64 } = await resizePhoto(file);
      setPreviewUrl(URL.createObjectURL(blob));
      const { error } = await actions.addPhoto({ id: recipeId, file: base64 });
      setStatus(error ? 'failed' : 'saved');
    } catch {
      setStatus('failed');
    }
  }

  return { status, previewUrl, upload };
}
