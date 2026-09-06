import { useState } from 'react';

function localDeadline(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function AssignmentForm({ initial = {}, onSave, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      await onSave({ title: form.get('title'), description: form.get('description'), deadline: new Date(form.get('deadline')).toISOString(), difficultyRating: Number(form.get('difficultyRating')) });
    } catch (failure) { setError([failure.message, ...(failure.details ?? []).map((detail) => detail.message)].join(' ')); }
    finally { setBusy(false); }
  }
  return <form className="course-form" onSubmit={submit}><h3>{initial.assignmentId ? 'Edit assignment' : 'New assignment'}</h3>{error && <p role="alert" className="form-error">{error}</p>}<fieldset disabled={busy}>
    <label>Title<input name="title" required maxLength={160} defaultValue={initial.title} /></label>
    <label>Description<textarea name="description" maxLength={10000} rows={5} defaultValue={initial.description} /></label>
    <label>Deadline (your local time)<input name="deadline" type="datetime-local" required defaultValue={localDeadline(initial.deadline)} /></label>
    <label>Difficulty<select name="difficultyRating" defaultValue={initial.difficultyRating ?? 3}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} of 5</option>)}</select></label>
    <div className="actions"><button type="submit">{busy ? 'Saving…' : 'Save assignment'}</button><button type="button" className="secondary" onClick={onCancel}>Cancel</button></div>
  </fieldset></form>;
}
