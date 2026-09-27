import { formatAcademicDate } from '../../utils/date.js';
import { useEffect, useState } from 'react';
import { CalendarDays, ClipboardList, Gauge, Pencil, Plus, Trash2 } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { useAuth } from '../auth/useAuth.js';
import { assignmentsApi } from './assignments.api.js';
import { AssignmentForm } from './AssignmentForm.jsx';

export function CourseAssignments({ courseId }) {
  const { token, user, logout } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
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

  async function remove() {
    if (!removing) return;
    setBusy(true);
    setError('');
    try {
      await assignmentsApi.remove(token, removing.assignmentId);
      setRemoving(null);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function save(data) {
    if (editing.assignmentId) await assignmentsApi.update(token, editing.assignmentId, data);
    else await assignmentsApi.create(token, courseId, data);
    setEditing(null);
    setRevision((value) => value + 1);
  }

  return <section className="course-section course-assignment-workspace"><header className="course-workspace-section-heading"><div><h2>Assignments</h2><p>Published coursework and its submission dates.</p></div>{lecturer && !editing && <button onClick={() => setEditing({})}><Plus size={17} aria-hidden="true" />New assignment</button>}</header>
    {editing && <Dialog title={editing.assignmentId ? 'Edit assignment' : 'New assignment'} description="Set the coursework details students need before they begin." icon={ClipboardList} onClose={() => setEditing(null)} busy={busy}><AssignmentForm key={editing.assignmentId ?? 'new'} initial={editing} onCancel={() => setEditing(null)} onSave={save} /></Dialog>}
    {removing && <ConfirmDialog title="Delete assignment" description={`Delete “${removing.title}”? This removes the published coursework but does not change any student completion record.`} confirmLabel="Delete assignment" icon={Trash2} onConfirm={remove} onClose={() => { if (!busy) { setError(''); setRemoving(null); } }} busy={busy} error={error} />}
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Retry assignments</button></div> : !items ? <p className="course-section-loading" role="status">Loading assignments…</p> : !items.length ? <div className="course-section-empty"><ClipboardList size={23} aria-hidden="true" /><div><h3>No assignments published.</h3><p>{lecturer ? 'Create the first coursework item when its brief and deadline are ready.' : 'Your lecturer has not published coursework for this course yet.'}</p></div></div> : <div className="course-assignment-content"><ul className="course-assignment-list">{items.map((item) => <li key={item.assignmentId}><span className="course-assignment-icon"><ClipboardList size={19} aria-hidden="true" /></span><div className="course-assignment-main"><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}<div className="course-assignment-meta"><span><CalendarDays size={14} aria-hidden="true" />Due {formatAcademicDate(item.deadline)}</span><span><Gauge size={14} aria-hidden="true" />Difficulty {item.difficultyRating}/5</span></div>{lecturer && <div className="course-assignment-actions"><button className="secondary" disabled={busy} onClick={() => setEditing(item)}><Pencil size={15} aria-hidden="true" />Edit</button><button className="secondary course-assignment-delete" disabled={busy} onClick={() => { setError(''); setRemoving(item); }}><Trash2 size={15} aria-hidden="true" />Delete</button></div>}</div></li>)}</ul>{lecturer && <aside className="course-assignment-rail"><ClipboardList size={20} aria-hidden="true" /><h3>Student view</h3><p>Published coursework appears in each enrolled student’s assignment list.</p></aside>}</div>}
  </section>;
}
