import { useEffect, useState } from 'react';
import { coursesApi } from './courses.api.js';

export function EnrolmentPanel({ token, courseId }) {
  const [students, setStudents] = useState(null);
  const [revision, setRevision] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    coursesApi.students(token, courseId, controller.signal).then((data) => setStudents(data.students)).catch((failure) => { if (!controller.signal.aborted) setLoadError(failure.message); });
    return () => controller.abort();
  }, [token, courseId, revision]);
  async function change(work) {
    setBusy(true); setError('');
    try { await work(); setRevision((value) => value + 1); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <section className="enrolment-panel"><h2>Enrolled students</h2>
    <form onSubmit={(event) => { event.preventDefault(); change(async () => { await coursesApi.enrol(token, courseId, email); setEmail(''); }); }}>
      <fieldset disabled={busy}><label>Student email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><button type="submit">Enrol student</button></fieldset>
    </form>
    {error && <p role="alert" className="form-error">{error}</p>}
    {loadError ? <div role="alert"><p>{loadError}</p><button onClick={() => { setLoadError(''); setRevision((value) => value + 1); }}>Retry register</button></div> : !students ? <p role="status">Loading students…</p> : !students.length ? <p className="empty-state">No students enrolled.</p> : <div className="table-scroll"><table><thead><tr><th>Name</th><th>Matric number</th><th>Email</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{students.map((student) => <tr key={student.studentId}><td>{student.fullName}</td><td>{student.matricNumber}</td><td>{student.email}</td><td><button className="secondary" disabled={busy} onClick={() => { if (window.confirm(`Remove ${student.fullName} from this course?`)) change(() => coursesApi.remove(token, courseId, student.studentId)); }}>Remove</button></td></tr>)}</tbody></table></div>}
  </section>;
}
