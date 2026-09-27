import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { useAuth } from '../auth/useAuth.js';
import { schedulesApi } from './schedules.api.js';
import { ScheduleForm } from './ScheduleForm.jsx';
import { weekdays } from './calendar.utils.js';

export function CourseSchedules({ courseId }) {
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
    schedulesApi.course(token, courseId, controller.signal).then((data) => setItems(data.schedules)).catch((failure) => {
      if (!controller.signal.aborted) { if (failure.status === 401) logout(); else setError(failure.message); }
    });
    return () => controller.abort();
  }, [token, courseId, revision, logout]);
  async function remove() {
    if (!removing) return;
    setBusy(true);
    setError('');
    try {
      await schedulesApi.remove(token, removing.scheduleId);
      setRemoving(null);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(data) {
    if (editing.scheduleId) await schedulesApi.update(token, editing.scheduleId, data); else await schedulesApi.create(token, courseId, data);
    setEditing(null); setRevision((value) => value + 1);
  }
  const sorted = items && [...items].sort((a, b) => weekdays.indexOf(a.dayOfWeek) - weekdays.indexOf(b.dayOfWeek) || a.startTime.localeCompare(b.startTime));
  return <section className="course-section course-schedule-workspace"><header className="course-workspace-section-heading"><div><h2>Weekly schedule</h2><p>Recurring class times in Africa/Lagos (WAT).</p></div>{lecturer && !editing && <button onClick={() => setEditing({})}><Plus size={17} aria-hidden="true" />Add class</button>}</header>
    {editing && <Dialog title={editing.scheduleId ? 'Edit class' : 'Add class'} description="Set the weekly time and venue for this course." icon={CalendarDays} onClose={() => setEditing(null)} busy={busy}><ScheduleForm key={editing.scheduleId ?? 'new'} initial={editing} cancel={() => setEditing(null)} save={save} /></Dialog>}
    {removing && <ConfirmDialog title="Remove class" description={`Remove the ${removing.dayOfWeek} class at ${removing.startTime}?`} confirmLabel="Remove class" icon={Trash2} onConfirm={remove} onClose={() => { if (!busy) { setError(''); setRemoving(null); } }} busy={busy} error={error} />}
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Retry schedules</button></div> : !items ? <p className="course-section-loading" role="status">Loading schedule…</p> : !items.length ? <div className="course-section-empty"><CalendarDays size={23} aria-hidden="true" /><div><h3>No classes scheduled.</h3><p>{lecturer ? 'Add a weekly class time when the timetable is confirmed.' : 'Your lecturer has not added a recurring class time yet.'}</p></div></div> : <ul className="course-schedule-list">{sorted.map((item) => <li key={item.scheduleId}><div className="course-schedule-day"><CalendarDays size={17} aria-hidden="true" /><strong>{item.dayOfWeek}</strong></div><div className="course-schedule-details"><span><Clock3 size={15} aria-hidden="true" />{item.startTime}–{item.endTime}</span><span><MapPin size={15} aria-hidden="true" />{item.venue}</span></div>{lecturer && <div className="course-schedule-actions"><button className="secondary" disabled={busy} onClick={() => setEditing(item)}><Pencil size={15} aria-hidden="true" />Edit</button><button className="secondary course-assignment-delete" disabled={busy} onClick={() => { setError(''); setRemoving(item); }}><Trash2 size={15} aria-hidden="true" />Remove</button></div>}</li>)}</ul>}
  </section>;
}
