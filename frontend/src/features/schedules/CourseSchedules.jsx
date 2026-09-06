import { useEffect, useState } from 'react';
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
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    schedulesApi.course(token, courseId, controller.signal).then((data) => setItems(data.schedules)).catch((failure) => {
      if (!controller.signal.aborted) { if (failure.status === 401) logout(); else setError(failure.message); }
    });
    return () => controller.abort();
  }, [token, courseId, revision, logout]);
  async function remove(item) {
    if (!window.confirm(`Remove the ${item.dayOfWeek} class at ${item.startTime}?`)) return;
    setBusy(true);
    try { await schedulesApi.remove(token, item.scheduleId); setRevision((value) => value + 1); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  return <section className="course-section"><div className="page-heading"><h2>Weekly schedule</h2>{user.role === 'LECTURER' && !editing && <button onClick={() => setEditing({})}>Add class</button>}</div>
    <p>Recurring weekly · Africa/Lagos (WAT)</p>
    {editing && <ScheduleForm key={editing.scheduleId ?? 'new'} initial={editing} cancel={() => setEditing(null)} save={async (data) => {
      if (editing.scheduleId) await schedulesApi.update(token, editing.scheduleId, data); else await schedulesApi.create(token, courseId, data);
      setEditing(null); setRevision((value) => value + 1);
    }} />}
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Retry schedules</button></div> : !items ? <p role="status">Loading schedules…</p> : !items.length ? <p className="empty-state">No classes scheduled.</p> : <ul className="task-list">{[...items].sort((a, b) => weekdays.indexOf(a.dayOfWeek) - weekdays.indexOf(b.dayOfWeek) || a.startTime.localeCompare(b.startTime)).map((item) => <li key={item.scheduleId}><h3>{item.dayOfWeek} · {item.startTime}–{item.endTime}</h3><p>{item.venue}</p>{user.role === 'LECTURER' && <div className="actions"><button className="secondary" disabled={busy} onClick={() => setEditing(item)}>Edit class</button><button className="secondary" disabled={busy} onClick={() => remove(item)}>Remove class</button></div>}</li>)}</ul>}
  </section>;
}
