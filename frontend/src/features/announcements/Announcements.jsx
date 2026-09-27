import { formatAcademicDate } from '../../utils/date.js';
import { useEffect, useState } from 'react';
import { Bell, CalendarDays, EyeOff, Megaphone, Pencil, Plus, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { useAuth } from '../auth/useAuth.js';
import { announcementsApi } from './announcements.api.js';
import { AnnouncementForm } from './AnnouncementForm.jsx';

export function Announcements({ courseId }) {
  const { token, user, logout } = useAuth();
  const [items, setItems] = useState(null);
  const [hiddenItems, setHiddenItems] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [personalBusyId, setPersonalBusyId] = useState('');
  const lecturer = Boolean(courseId) && user.role === 'LECTURER';
  const canDismiss = user.role === 'STUDENT';
  const showHidden = !courseId && canDismiss;

  useEffect(() => {
    const controller = new AbortController();
    const hiddenRequest = showHidden
      ? announcementsApi.listHidden(token, controller.signal)
      : Promise.resolve({ announcements: [] });
    Promise.all([announcementsApi.list(token, courseId, controller.signal), hiddenRequest]).then(([visible, hidden]) => {
      setItems(visible.announcements);
      setHiddenItems(hidden.announcements);
    }).catch((failure) => {
      if (!controller.signal.aborted) {
        if (failure.status === 401) logout(); else setError(failure.message);
      }
    });
    return () => controller.abort();
  }, [token, courseId, revision, logout, showHidden]);

  async function dismiss(item) {
    setPersonalBusyId(item.announcementId);
    setActionError('');
    try {
      await announcementsApi.dismiss(token, item.announcementId);
      setItems((current) => current.filter((entry) => entry.announcementId !== item.announcementId));
      if (showHidden) setHiddenItems((current) => [item, ...current]);
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setPersonalBusyId('');
    }
  }

  async function restore(item) {
    setPersonalBusyId(item.announcementId);
    setActionError('');
    try {
      await announcementsApi.restore(token, item.announcementId);
      setHiddenItems((current) => current.filter((entry) => entry.announcementId !== item.announcementId));
      setItems((current) => [...current, item].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)));
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setPersonalBusyId('');
    }
  }

  async function remove() {
    if (!removing) return;
    setBusy(true);
    setActionError('');
    try {
      await announcementsApi.remove(token, removing.announcementId);
      setRemoving(null);
      setRevision((value) => value + 1);
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function save(data) {
    if (editing.announcementId) await announcementsApi.update(token, editing.announcementId, data);
    else await announcementsApi.create(token, courseId, data);
    setEditing(null);
    setRevision((value) => value + 1);
  }

  const heading = courseId ? 'Course bulletin' : 'Announcements';
  return <section className={courseId ? 'course-section bulletin-workspace bulletin-embedded' : 'bulletin-workspace'}>
    <header className={`bulletin-heading${courseId ? '' : ' page-banner'}`}>
      <div>
        <h1 className={courseId ? 'bulletin-course-title' : undefined}>{heading}</h1>
        <p>{courseId ? 'A dated record of notices published for this course.' : 'A single place to read the latest notices from your courses.'}</p>
      </div>
      {lecturer && !editing && <button onClick={() => setEditing({})}><Plus size={17} aria-hidden="true" />New announcement</button>}
    </header>
    {editing && <Dialog title={editing.announcementId ? 'Edit announcement' : 'New announcement'} description={editing.announcementId ? 'Update the notice. Students will see the revised version in this bulletin.' : 'Publish a clear, dated notice to everyone enrolled in this course.'} icon={Megaphone} onClose={() => setEditing(null)} busy={busy}>
      <AnnouncementForm key={editing.announcementId ?? 'new'} initial={editing} cancel={() => setEditing(null)} save={save} />
    </Dialog>}
    {removing && <ConfirmDialog title="Withdraw announcement" description={`Withdraw “${removing.title}”? It will be removed for everyone enrolled in this course.`} confirmLabel="Withdraw for everyone" icon={Trash2} onConfirm={remove} onClose={() => { if (!busy) { setActionError(''); setRemoving(null); } }} busy={busy} error={actionError} />}
    {actionError && !removing && <p className="bulletin-action-error" role="alert">{actionError}</p>}
    {error ? <div className="bulletin-error" role="alert"><Bell size={19} aria-hidden="true" /><div><strong>Announcements could not be loaded.</strong><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}><RefreshCw size={16} aria-hidden="true" />Retry announcements</button></div></div> : !items ? <p className="bulletin-loading" role="status">Loading announcements…</p> : !items.length ? <div className="bulletin-empty"><Megaphone size={24} aria-hidden="true" /><div><h2>No announcements yet.</h2><p>{lecturer ? 'Publish the first course notice when there is something students need to know.' : 'When your lecturers publish a course notice, it will appear here.'}</p></div></div> : <div className="bulletin-content">
      <article className="bulletin-current">
        <div className="bulletin-current-mark"><Megaphone size={22} aria-hidden="true" /></div>
        <div><span>{items[0].courseCode || 'Latest course notice'}</span><h2>{items[0].title}</h2><p>{items[0].message}</p><time><CalendarDays size={15} aria-hidden="true" />{formatAcademicDate(items[0].createdAt)}</time>{(lecturer || canDismiss) && <div className="bulletin-actions">{lecturer && <><button className="secondary" disabled={busy} onClick={() => setEditing(items[0])}><Pencil size={15} aria-hidden="true" />Edit</button><button className="secondary bulletin-delete" disabled={busy} onClick={() => { setActionError(''); setRemoving(items[0]); }}><Trash2 size={15} aria-hidden="true" />Withdraw for everyone</button></>}{canDismiss && <button className="secondary bulletin-dismiss" disabled={Boolean(personalBusyId)} onClick={() => dismiss(items[0])}><EyeOff size={15} aria-hidden="true" />{personalBusyId === items[0].announcementId ? 'Dismissing…' : 'Dismiss for me'}</button>}</div>}</div>
      </article>
      {items.length > 1 && <><div className="bulletin-archive-heading"><h2>Earlier notices</h2><span>{items.length - 1} previous</span></div><ul className="bulletin-list">{items.slice(1).map((item) => <li key={item.announcementId}><time><CalendarDays size={15} aria-hidden="true" />{formatAcademicDate(item.createdAt)}</time><div className="bulletin-entry"><span>{item.courseCode || 'Course notice'}</span><h3>{item.title}</h3><p>{item.message}</p>{(lecturer || canDismiss) && <div className="bulletin-actions">{lecturer && <><button className="secondary" disabled={busy} onClick={() => setEditing(item)}><Pencil size={15} aria-hidden="true" />Edit</button><button className="secondary bulletin-delete" disabled={busy} onClick={() => { setActionError(''); setRemoving(item); }}><Trash2 size={15} aria-hidden="true" />Withdraw for everyone</button></>}{canDismiss && <button className="secondary bulletin-dismiss" disabled={Boolean(personalBusyId)} onClick={() => dismiss(item)}><EyeOff size={15} aria-hidden="true" />{personalBusyId === item.announcementId ? 'Dismissing…' : 'Dismiss for me'}</button>}</div>}</div></li>)}</ul></>}
    </div>}
    {showHidden && hiddenItems && <section className="bulletin-hidden" aria-labelledby="hidden-notices-heading">
      <header><div><h2 id="hidden-notices-heading">Hidden notices</h2><p>Notices you dismiss stay here until you restore them.</p></div><span>{hiddenItems.length}</span></header>
      {!hiddenItems.length
        ? <p className="bulletin-hidden-empty">No hidden notices.</p>
        : <ul>{hiddenItems.map((item) => <li key={item.announcementId}><div><span>{item.courseCode || 'Course notice'}</span><strong>{item.title}</strong><small>{formatAcademicDate(item.createdAt)}</small></div><button className="secondary" disabled={Boolean(personalBusyId)} onClick={() => restore(item)}><RotateCcw size={15} aria-hidden="true" />{personalBusyId === item.announcementId ? 'Restoring…' : 'Restore'}</button></li>)}</ul>}
    </section>}
  </section>;
}
