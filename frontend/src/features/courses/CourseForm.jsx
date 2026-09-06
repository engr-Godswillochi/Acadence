import { useState } from 'react';

export function CourseForm({ initial = {}, onSave, onCancel }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await onSave({ courseCode: form.get('courseCode'), courseTitle: form.get('courseTitle'), creditUnits: Number(form.get('creditUnits')), academicSession: form.get('academicSession'), semester: form.get('semester') });
    } catch (failure) {
      setError([failure.message, ...(failure.details ?? []).map((detail) => detail.message)].join(' '));
    } finally { setBusy(false); }
  }
  return <form className="course-form" onSubmit={submit}>
    <h2>{initial.courseId ? 'Edit course' : 'New course'}</h2>
    {error && <p role="alert" className="form-error">{error}</p>}
    <fieldset disabled={busy}>
      <label>Course code<input name="courseCode" required minLength={2} maxLength={30} defaultValue={initial.courseCode} /></label>
      <label>Course title<input name="courseTitle" required minLength={2} maxLength={160} defaultValue={initial.courseTitle} /></label>
      <div className="form-row">
        <label>Credit units<input name="creditUnits" type="number" min="1" max="6" required defaultValue={initial.creditUnits ?? 3} /></label>
        <label>Academic session<input name="academicSession" placeholder="2026/2027" pattern="[0-9]{4}/[0-9]{4}" required defaultValue={initial.academicSession} /></label>
      </div>
      <label>Semester<select name="semester" defaultValue={initial.semester ?? 'FIRST'}><option value="FIRST">First semester</option><option value="SECOND">Second semester</option></select></label>
      <div className="actions"><button type="submit">{busy ? 'Saving…' : 'Save course'}</button><button className="secondary" type="button" onClick={onCancel}>Cancel</button></div>
    </fieldset>
  </form>;
}
