import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { assignmentsApi } from './assignments.api.js';
import { AssignmentForm } from './AssignmentForm.jsx';

export function CourseAssignments({ courseId }) {
  const { token, user, logout } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const lecturer = user.role === 'LECTURER';
  useEffect(() => {
    const controller = new AbortController();
    assignmentsApi.course(token, courseId, controller.signal).then((data) => setItems(data.assignments)).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout(); else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, courseId, revision, logout]);
  async function remove(item) {
    if (!window.confirm(`Delete assignment “${item.title}”?`)) return;
    setBusy(true);
    try { await assignmentsApi.remove(token, item.assignmentId); setRevision((value) => value + 1); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <section className="course-section"><div className="page-heading"><h2>Assignments</h2>{lecturer && !editing && <button onClick={() => setEditing({})}>New assignment</button>}</div>
    {editing && <AssignmentForm key={editing.assignmentId ?? 'new'} initial={editing} onCancel={() => setEditing(null)} onSave={async (data) => { if (editing.assignmentId) await assignmentsApi.update(token, editing.assignmentId, data); else await assignmentsApi.create(token, courseId, data); setEditing(null); setRevision((value) => value + 1); }} />}
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Retry assignments</button></div> : !items ? <p role="status">Loading assignments…</p> : !items.length ? <p className="empty-state">No assignments published.</p> : <ul className="task-list">{items.map((item) => <li key={item.assignmentId}><h3>{item.title}</h3><p className="assignment-description">{item.description}</p><p>Due {new Date(item.deadline).toLocaleString()} · Difficulty {item.difficultyRating}/5</p>{lecturer && <div className="actions"><button className="secondary" disabled={busy} onClick={() => setEditing(item)}>Edit assignment</button><button className="secondary" disabled={busy} onClick={() => remove(item)}>Delete assignment</button></div>}</li>)}</ul>}
  </section>;
}
