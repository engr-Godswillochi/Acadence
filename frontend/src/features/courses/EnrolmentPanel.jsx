import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2, Mail, RefreshCw, Trash2, UserPlus, Users } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { formatAcademicDateOnly } from '../../utils/date.js';
import { coursesApi } from './courses.api.js';

function shareUrl(token) {
  return `${window.location.origin}/enrol/${token}`;
}

export function EnrolmentPanel({ token, courseId }) {
  const [students, setStudents] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [revision, setRevision] = useState(0);
  const [removing, setRemoving] = useState(null);
  // The API answers "no live link" with a null token, so loading cannot share
  // that value without making the panel look permanently un-issued.
  const [share, setShare] = useState({ loaded: false, link: null, lifetimeDays: 0 });
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [copied, setCopied] = useState('');
  const [revoking, setRevoking] = useState(false);
  const linkField = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    coursesApi.students(token, courseId, controller.signal).then((data) => setStudents(data.students)).catch((failure) => {
      if (!controller.signal.aborted) setLoadError(failure.message);
    });
    return () => controller.abort();
  }, [token, courseId, revision]);

  useEffect(() => {
    const controller = new AbortController();
    coursesApi.enrolmentLink(token, courseId, controller.signal).then((data) => {
      setShare({ loaded: true, link: data.link, lifetimeDays: data.lifetimeDays });
      setLinkError('');
    }).catch((failure) => {
      if (!controller.signal.aborted) setLinkError(failure.message);
    });
    return () => controller.abort();
  }, [token, courseId, revision]);

  // An effect is the wrong tool here: only issuing or revoking can change the
  // token, and a "copied" note about a token that no longer exists is a lie.
  async function change(work) {
    setBusy(true);
    setActionError('');
    try {
      await work();
      setRevision((value) => value + 1);
      return true;
    } catch (failure) {
      setActionError(failure.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function changeLink(work) {
    setLinkBusy(true);
    setLinkError('');
    setCopied('');
    try {
      await work();
      setRevision((value) => value + 1);
    } catch (failure) {
      setLinkError(failure.message);
    } finally {
      setLinkBusy(false);
    }
  }

  async function remove() {
    if (!removing) return;
    if (await change(() => coursesApi.remove(token, courseId, removing.studentId))) setRemoving(null);
  }

  async function issue() {
    await changeLink(() => coursesApi.issueEnrolmentLink(token, courseId));
  }

  async function revoke() {
    await changeLink(() => coursesApi.revokeEnrolmentLink(token, courseId));
    setRevoking(false);
  }

  async function copyLink() {
    if (!share.link) return;
    try {
      await navigator.clipboard.writeText(shareUrl(share.link.token));
      setCopied('copied');
    } catch {
      // Clipboard access can be refused outright. Selecting the field still lets
      // the lecturer copy it by hand, so that is a usable answer rather than a dead end.
      linkField.current?.focus();
      linkField.current?.select();
      setCopied('selected');
    }
  }

  return <section className="course-section enrolment-workspace">
    {removing && <ConfirmDialog title="Remove student" description={`Remove ${removing.fullName} from this course? Their existing course records will be retained.`} confirmLabel="Remove student" icon={Trash2} onConfirm={remove} onClose={() => { if (!busy) { setActionError(''); setRemoving(null); } }} busy={busy} error={actionError} />}
    {revoking && <ConfirmDialog title="Revoke enrolment link" description="Revoke this link? Anyone holding it will no longer be able to enrol from it. Students already enrolled stay on the roster." confirmLabel="Revoke link" icon={Trash2} onConfirm={revoke} onClose={() => { if (!linkBusy) { setLinkError(''); setRevoking(false); } }} busy={linkBusy} error={linkError} />}
    <header className="course-workspace-section-heading">
      <div><div className="enrolment-title"><h2>Students</h2>{students && <span className="enrolment-count"><Users size={16} aria-hidden="true" />{students.length} enrolled</span>}</div><p>Manage the enrolled class list for this course.</p></div>
    </header>
    <section className="enrolment-share" aria-labelledby="enrolment-share-heading">
      <div className="enrolment-share-head">
        <span className="enrolment-share-mark" aria-hidden="true"><Link2 size={18} /></span>
        <div><h3 id="enrolment-share-heading">Enrolment link</h3><p>Students sign in and join this course themselves — no email address needed.</p></div>
        {share.lifetimeDays ? <span className="enrolment-share-lifetime">Expires after {share.lifetimeDays} days</span> : null}
      </div>
      {!share.loaded ? <p className="enrolment-share-empty" role="status">Checking for a live link…</p> : share.link ? <>
        <div className="enrolment-link-field">
          <input ref={linkField} readOnly value={shareUrl(share.link.token)} aria-label="Shareable enrolment link" onFocus={(event) => event.target.select()} />
          <button type="button" onClick={copyLink} disabled={linkBusy}>{copied === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copied === 'copied' ? 'Copied' : 'Copy link'}</button>
        </div>
        <p className="enrolment-share-meta">Live until {formatAcademicDateOnly(share.link.expiresAt)} · <a href={shareUrl(share.link.token)} target="_blank" rel="noreferrer">Open the link</a></p>
        {copied === 'selected' && <p className="enrolment-share-hint">Your browser would not allow automatic copying. The link is selected — press Ctrl+C to copy it.</p>}
        <div className="enrolment-share-actions">
          <button type="button" className="secondary" disabled={linkBusy} onClick={issue}><RefreshCw size={15} aria-hidden="true" />Replace link</button>
          <button type="button" className="secondary" disabled={linkBusy} onClick={() => { setLinkError(''); setRevoking(true); }}><Trash2 size={15} aria-hidden="true" />Revoke</button>
        </div>
      </> : <>
        <p className="enrolment-share-empty">No live link. Issue one and share it with your class; replace it whenever you need to.</p>
        <button type="button" disabled={linkBusy} onClick={issue}><Link2 size={16} aria-hidden="true" />{linkBusy ? 'Creating…' : 'Create enrolment link'}</button>
      </>}
      {linkError && !revoking && <p role="alert" className="form-error">{linkError}</p>}
    </section>
    <form className="enrolment-add" onSubmit={(event) => { event.preventDefault(); change(async () => { await coursesApi.enrol(token, courseId, email); setEmail(''); }); }}>
      <label><Mail size={16} aria-hidden="true" /><span>Student email</span><input type="email" required placeholder="student@university.edu" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <button type="submit" disabled={busy}><UserPlus size={16} aria-hidden="true" />{busy ? 'Adding…' : 'Enrol student'}</button>
    </form>
    {actionError && !removing && <p role="alert" className="form-error">{actionError}</p>}
    {loadError ? <div role="alert"><p>{loadError}</p><button type="button" onClick={() => { setLoadError(''); setRevision((value) => value + 1); }}>Retry register</button></div> : !students ? <p className="course-section-loading" role="status">Loading students…</p> : !students.length ? <p className="course-section-empty">No students enrolled.</p> : <ul className="enrolment-list">{students.map((student) => <li key={student.studentId}>
      <span className="enrolment-initial">{student.fullName?.[0] ?? 'S'}</span>
      <div><strong>{student.fullName}</strong><small><span>{student.matricNumber || 'Matric number not recorded'}</span><span>{student.email}</span></small></div>
      <button className="secondary enrolment-remove" disabled={busy} onClick={() => { setActionError(''); setRemoving(student); }}><Trash2 size={15} aria-hidden="true" />Remove</button>
    </li>)}</ul>}
  </section>;
}
