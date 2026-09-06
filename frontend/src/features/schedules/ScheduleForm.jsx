import { useState } from 'react';
import { weekdays } from './calendar.utils.js';

export function ScheduleForm({ initial = {}, save, cancel }) {
  const [values, setValues] = useState({ dayOfWeek: initial.dayOfWeek ?? 'Monday', startTime: initial.startTime ?? '09:00', endTime: initial.endTime ?? '10:00', venue: initial.venue ?? '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const change = (event) => setValues({ ...values, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault(); setError('');
    if (values.startTime >= values.endTime) { setError('Start time must be before end time.'); return; }
    setBusy(true);
    try { await save(values); } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  return <form className="course-form" onSubmit={submit}>
    <label>Day<select name="dayOfWeek" value={values.dayOfWeek} onChange={change}>{weekdays.map((day) => <option key={day}>{day}</option>)}</select></label>
    <label>Start time<input required type="time" name="startTime" value={values.startTime} onChange={change} /></label>
    <label>End time<input required type="time" name="endTime" value={values.endTime} onChange={change} /></label>
    <label>Venue<input required maxLength={160} name="venue" value={values.venue} onChange={change} /></label>
    <p>Times are in Africa/Lagos (WAT).</p>
    {error && <p role="alert">{error}</p>}
    <div className="actions"><button disabled={busy}>{busy ? 'Saving…' : 'Save schedule'}</button><button type="button" className="secondary" disabled={busy} onClick={cancel}>Cancel</button></div>
  </form>;
}
