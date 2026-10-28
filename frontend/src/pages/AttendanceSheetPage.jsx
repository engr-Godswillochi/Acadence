import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ClipboardList, Clock3, Download, Fingerprint, Radio, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { coursesApi } from '../features/courses/courses.api.js';
import { attendanceApi } from '../features/attendance/attendance.api.js';
import { attendanceSheetCsv } from '../features/attendance/attendanceSheet.utils.js';
import { formatAcademicDateOnly, formatWatTime } from '../utils/date.js';

const LIVE_REFRESH_MS = 5000;

function downloadCsv(course, session, records) {
  const blob = new Blob([attendanceSheetCsv(records)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${course.courseCode}-attendance-${session.openedAt.slice(0, 10)}.csv`.replace(/\s+/g, '');
  link.click();
  URL.revokeObjectURL(url);
}

export function AttendanceSheetPage() {
  const { id: courseId, sessionId } = useParams();
  const { token, logout } = useAuth();
  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const report = useCallback((failure) => {
    if (failure?.status === 401) logout();
    else if (failure) setError(failure.message);
  }, [logout]);

  const [course, setCourse] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    coursesApi.get(token, courseId, controller.signal).then((data) => setCourse(data.course)).catch((failure) => {
      if (!controller.signal.aborted) report(failure);
    });
    return () => controller.abort();
  }, [token, courseId, report]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      attendanceApi.session(token, sessionId, controller.signal),
      attendanceApi.records(token, sessionId, controller.signal),
    ]).then(([sessionData, recordData]) => {
      if (sessionData.session.courseId !== courseId) throw Object.assign(new Error('Attendance session not found for this course.'), { status: 404 });
      setSheet({ session: sessionData.session, records: recordData.records });
    }).catch((failure) => {
      if (!controller.signal.aborted) report(failure);
    });
    return () => controller.abort();
  }, [token, courseId, sessionId, revision, report]);

  const live = sheet?.session.status === 'ACTIVE';

  // While the session is open, keep the register and its status current; the
  // server closes expired sessions on read, so the same refresh ends the live view.
  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(() => setRevision((value) => value + 1), LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [live]);

  if (error) return <section className="course-workspace-page"><Link className="course-return" to={`/courses/${courseId}?section=attendance`}><ArrowLeft size={16} aria-hidden="true" />Back to attendance</Link><p role="alert">{error}</p><button type="button" onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></section>;
  if (!sheet || !course) return <p role="status">Loading attendance sheet…</p>;

  const { session, records } = sheet;
  const present = records.filter((record) => record.recordedAt).length;
  const absent = records.length - present;
  const rate = records.length ? Math.round((present / records.length) * 100) : 0;
  const missingLabel = live ? 'Waiting' : 'Absent';
  const needle = query.trim().toLowerCase();
  const visible = records.filter((record) => (filter === 'all' || (filter === 'present') === Boolean(record.recordedAt))
    && (!needle || record.studentName.toLowerCase().includes(needle) || record.matricNumber?.toLowerCase().includes(needle)));

  return <section className="course-workspace-page attendance-sheet-page">
    <Link className="course-return" to={`/courses/${courseId}?section=attendance`}><ArrowLeft size={16} aria-hidden="true" />{course.courseCode} attendance</Link>
    <header className="page-banner attendance-sheet-banner">
      <ClipboardList size={26} aria-hidden="true" />
      <div><span>{course.courseCode} · {course.courseTitle}</span><h1>Attendance sheet</h1><p>{formatAcademicDateOnly(session.openedAt)} · opened {formatWatTime(session.openedAt)} WAT · {live ? `closes ${formatWatTime(session.expiresAt)} WAT` : `closed ${formatWatTime(session.closedAt ?? session.expiresAt)} WAT`}</p></div>
      {live ? <strong className="sheet-state is-live"><Radio size={14} aria-hidden="true" />Live</strong> : <strong className="sheet-state">Closed</strong>}
    </header>

    <dl className="sheet-summary">
      <div><dt>Present</dt><dd>{present}</dd></div>
      <div><dt>{live ? 'Not yet recorded' : 'Absent'}</dt><dd>{absent}</dd></div>
      <div><dt>Enrolled at opening</dt><dd>{records.length}</dd></div>
      <div><dt>Attendance rate</dt><dd>{rate}%</dd></div>
    </dl>

    {live && <p className="sheet-live-note" aria-live="polite"><Radio size={15} aria-hidden="true" />Updates every few seconds as students scan. This sheet becomes the official record when the session closes.</p>}

    <div className="sheet-toolbar">
      <div className="sheet-filters" role="group" aria-label="Filter students">
        {[['all', `All (${records.length})`], ['present', `Present (${present})`], ['absent', `${missingLabel} (${absent})`]].map(([key, label]) => <button key={key} type="button" className={filter === key ? '' : 'secondary'} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      </div>
      <label className="sheet-search"><Search size={15} aria-hidden="true" /><input type="search" placeholder="Search name or matric number" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search students" /></label>
      <button type="button" className="secondary" onClick={() => setRevision((value) => value + 1)}><RefreshCw size={16} aria-hidden="true" />Refresh</button>
      <button type="button" className="secondary" disabled={!records.length} onClick={() => downloadCsv(course, session, records)}><Download size={16} aria-hidden="true" />Download CSV</button>
    </div>

    {!records.length ? <p className="course-section-empty">No students were enrolled when this session opened.</p> : <div className="sheet-table-wrap">
      <table className="attendance-sheet">
        <thead><tr><th scope="col">#</th><th scope="col">Student name</th><th scope="col">Matric number</th><th scope="col">Status</th><th scope="col">Time recorded</th></tr></thead>
        <tbody>
          {visible.map((record) => <tr key={record.studentId}>
            <td>{records.indexOf(record) + 1}</td>
            <th scope="row">{record.studentName}</th>
            <td>{record.matricNumber || '—'}</td>
            <td>{record.recordedAt ? <span className="sheet-status is-present"><Check size={13} aria-hidden="true" />Present</span> : <span className={live ? 'sheet-status is-waiting' : 'sheet-status is-absent'}>{live ? <Fingerprint size={13} aria-hidden="true" /> : null}{missingLabel}</span>}</td>
            <td>{record.recordedAt ? <time dateTime={record.recordedAt}><Clock3 size={13} aria-hidden="true" />{formatWatTime(record.recordedAt)} WAT</time> : '—'}</td>
          </tr>)}
          {!visible.length && <tr><td colSpan={5} className="sheet-no-match">No students match this view.</td></tr>}
        </tbody>
      </table>
    </div>}
  </section>;
}
