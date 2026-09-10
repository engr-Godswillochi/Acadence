import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { announcementsApi } from './announcements.api.js';
import { AnnouncementForm } from './AnnouncementForm.jsx';

export function Announcements({ courseId }) {
  const { token, user, logout } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const lecturer = Boolean(courseId) && user.role === 'LECTURER';
  useEffect(() => {
    const controller = new AbortController();
    announcementsApi.list(token, courseId, controller.signal).then((data) => setItems(data.announcements)).catch((failure) => { if (!controller.signal.aborted) { if (failure.status === 401) logout(); else setError(failure.message); } });
    return () => controller.abort();
  }, [token, courseId, revision, logout]);
  async function remove(item) {
    if (!window.confirm(`Delete announcement “${item.title}”?`)) return;
    setBusy(true);
    try { await announcementsApi.remove(token, item.announcementId); setRevision((value) => value + 1); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <section className={courseId ? 'course-section' : 'feature-page'}><div className="page-heading"><div>{courseId ? <h2>Announcements</h2> : <><p className="eyebrow">Course updates</p><h1 className="page-title">Announcements</h1><p className="page-intro">Keep up with notices from the courses in your academic workspace.</p></>}</div>{lecturer && !editing && <button onClick={() => setEditing({})}>New announcement</button>}</div>
    {editing && <AnnouncementForm key={editing.announcementId ?? 'new'} initial={editing} cancel={() => setEditing(null)} save={async (data) => { if (editing.announcementId) await announcementsApi.update(token, editing.announcementId, data); else await announcementsApi.create(token, courseId, data); setEditing(null); setRevision((value) => value + 1); }} />}
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Retry announcements</button></div> : !items ? <p role="status">Loading announcements…</p> : !items.length ? <p className="empty-state">No announcements published.</p> : <ul className="task-list">{items.map((item) => <li key={item.announcementId}>{item.courseCode && <p className="eyebrow">{item.courseCode}</p>}<h3>{item.title}</h3><p className="assignment-description">{item.message}</p><p>{new Date(item.createdAt).toLocaleString()}</p>{lecturer && <div className="actions"><button className="secondary" disabled={busy} onClick={() => setEditing(item)}>Edit announcement</button><button className="secondary" disabled={busy} onClick={() => remove(item)}>Delete announcement</button></div>}</li>)}</ul>}
  </section>;
}
