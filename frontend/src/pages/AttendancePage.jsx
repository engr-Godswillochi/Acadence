import { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/useAuth.js';
import { attendanceApi } from '../features/attendance/attendance.api.js';

export function AttendancePage() {
  const { token, logout } = useAuth(); const [data, setData] = useState(null); const [error, setError] = useState(''); const [revision, setRevision] = useState(0);
  useEffect(() => { const controller = new AbortController(); Promise.all([attendanceApi.summary(token, controller.signal), attendanceApi.my(token, controller.signal)]).then(([summary, attendance]) => setData({ ...summary, ...attendance })).catch((failure) => { if (!controller.signal.aborted) { if (failure.status === 401) logout(); else setError(failure.message); } }); return () => controller.abort(); }, [token, logout, revision]);
  return <section><div className="page-heading"><div><p className="eyebrow">Official closed sessions</p><h1 className="page-title">Attendance</h1></div><button className="secondary" onClick={() => { setError(''); setRevision((value) => value + 1); }}>Refresh</button></div>
    {error ? <p role="alert">{error}</p> : !data ? <p role="status">Loading attendance…</p> : <><div className="attendance-summary">{data.summaries.map((item) => <article key={item.courseId}><p className="eyebrow">{item.courseCode}</p><h2>{item.percentage}%</h2><p>{item.attendedSessions} of {item.eligibleSessions} closed sessions</p></article>)}</div>{!data.summaries.length && <p className="empty-state">No closed attendance sessions yet.</p>}<h2>Session history</h2><ul className="task-list">{data.attendance.map((item) => <li key={item.sessionId}><h3>{item.courseCode}</h3><p>{new Date(item.openedAt).toLocaleString()}</p><strong>{item.recordedAt ? `Present · ${new Date(item.recordedAt).toLocaleTimeString()}` : item.status === 'ACTIVE' ? 'Session active' : 'Absent'}</strong></li>)}</ul></>}
  </section>;
}
