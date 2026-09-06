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
  return <form className="course-form" onSubmit={submit}><h3>{initial.announcementId ? 'Edit announcement' : 'New announcement'}</h3>{error && <p role="alert">{error}</p>}<fieldset disabled={busy}><label>Title<input name="title" required maxLength={160} defaultValue={initial.title} /></label><label>Message<textarea name="message" required maxLength={10000} rows={5} defaultValue={initial.message} /></label><div className="actions"><button type="submit">Publish announcement</button><button type="button" className="secondary" onClick={cancel}>Cancel</button></div></fieldset></form>;
}
