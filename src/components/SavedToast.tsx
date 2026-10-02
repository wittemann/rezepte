// "Gespeichert" on the recipe page after the edit form saved it. The form redirects here with
// `?gespeichert`; the island shows the toast once and takes the marker out of the URL, so a
// reload or going back doesn't show it again.
import { useEffect, useState } from 'preact/hooks';
import Toast from './Toast.tsx';
import { TEXT } from './SavedToast.texts.ts';

export const SAVED_PARAM = 'gespeichert';

export default function SavedToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMessage(TEXT.saved);
    const url = new URL(location.href);
    url.searchParams.delete(SAVED_PARAM);
    history.replaceState(history.state, '', url);
  }, []);

  return <Toast message={message} onDone={() => setMessage(null)} />;
}
