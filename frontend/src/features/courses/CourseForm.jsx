import { useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.jsx';

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
      setError([failure.message, ...(failure.details ?? []).map(detail => detail.message)].join(' '));
    } finally { setBusy(false); }
  }
  return <Dialog title={initial.courseId ? 'Edit course' : 'New course'} description="Add the essentials now. You can enrol students after saving." icon={BookOpen} onClose={onCancel} busy={busy}>
    <form className="course-dialog-form" onSubmit={submit}>
      <div className="dialog-fields">
        {error && <p role="alert" className="form-error">{error}</p>}
        <fieldset disabled={busy}>
          <label>Course title<input autoFocus name="courseTitle" placeholder="e.g. Software Engineering" required minLength={2} maxLength={160} defaultValue={initial.courseTitle} /></label>
          <div className="dialog-field-row">
            <label>Course code<input name="courseCode" placeholder="e.g. CSC 401" required minLength={2} maxLength={30} defaultValue={initial.courseCode} /></label>
            <label>Credit units<select name="creditUnits" defaultValue={initial.creditUnits ?? 3}>{[1, 2, 3, 4, 5, 6].map(value => <option key={value} value={value}>{value} {value === 1 ? 'unit' : 'units'}</option>)}</select></label>
          </div>
          <div className="dialog-subsection">
            <label>Academic session<input name="academicSession" placeholder="2026/2027" pattern="[0-9]{4}/[0-9]{4}" required defaultValue={initial.academicSession} /></label>
            <fieldset className="dialog-term"><legend>Semester</legend><div className="term-options">
              <label><input type="radio" name="semester" value="FIRST" defaultChecked={!initial.semester || initial.semester === 'FIRST'} />First semester</label>
              <label><input type="radio" name="semester" value="SECOND" defaultChecked={initial.semester === 'SECOND'} />Second semester</label>
            </div></fieldset>
          </div>
        </fieldset>
      </div>
      <footer className="dialog-actions"><button className="secondary" type="button" disabled={busy} onClick={onCancel}>Cancel</button><button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save course'}{!busy && <ArrowRight size={16} aria-hidden="true" />}</button></footer>
    </form>
  </Dialog>;
}
