import { useState } from 'react';
import { academicDateTimeInputToIso, academicDateTimeInputValue } from '../../utils/date.js';

export function AssignmentForm({ initial = {}, onSave, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const deadline = academicDateTimeInputToIso(form.get('deadline'));
      if (!deadline) throw new Error('Choose a valid deadline.');
      await onSave({ title: form.get('title'), description: form.get('description'), deadline, difficultyRating: Number(form.get('difficultyRating')) });
    } catch (failure) { setError([failure.message, ...(failure.details ?? []).map((detail) => detail.message)].join(' ')); }
    finally { setBusy(false); }
  }
  return <form className="assignment-form" onSubmit={submit}>{error && <p role="alert" className="form-error">{error}</p>}<fieldset disabled={busy}>
    <label>Title<input name="title" required maxLength={160} defaultValue={initial.title} /></label>
    <label>Description<textarea name="description" maxLength={10000} rows={5} defaultValue={initial.description} /></label>
    <label>Deadline (WAT)<input name="deadline" type="datetime-local" required aria-describedby="assignment-deadline-help" defaultValue={academicDateTimeInputValue(initial.deadline)} /></label>
    <small id="assignment-deadline-help" className="form-hint">Times are shown in Africa/Lagos time (WAT).</small>
    <label>Difficulty<select name="difficultyRating" defaultValue={initial.difficultyRating ?? 3}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} of 5</option>)}</select></label>
    <div className="actions"><button type="submit">{busy ? 'Saving…' : 'Save assignment'}</button><button type="button" className="secondary" onClick={onCancel}>Cancel</button></div>
  </fieldset></form>;
}
