import { useState } from 'react';

export function AnnouncementForm({ initial = {}, save, cancel }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try { await save({ title: form.get('title'), message: form.get('message') }); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <form className="announcement-form" onSubmit={submit}>{error && <p role="alert">{error}</p>}<fieldset disabled={busy}><label>Announcement title<input name="title" required maxLength={160} defaultValue={initial.title} /></label><label>Message<textarea name="message" required maxLength={10000} rows={6} defaultValue={initial.message} /></label><div className="actions"><button type="submit">{busy ? 'Saving…' : initial.announcementId ? 'Save changes' : 'Publish announcement'}</button><button type="button" className="secondary" onClick={cancel}>Cancel</button></div></fieldset></form>;
}
