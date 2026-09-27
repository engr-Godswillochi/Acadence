import { useCallback, useEffect, useState } from 'react';
import { Activity, Check, Clock3, Fingerprint, Radio, ScanLine } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { formatAcademicDate, formatAcademicDateOnly, formatWatTime } from '../../utils/date.js';
import { useAuth } from '../auth/useAuth.js';
import { attendanceApi } from './attendance.api.js';

function SessionRegister({ session, token, onFailure }) {
  const [records, setRecords] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => attendanceApi.records(token, session.sessionId).then((data) => {
      if (!cancelled) setRecords(data.records);
    }).catch(onFailure);
    load();
    const timer = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [session.sessionId, token, onFailure]);

  if (!records) return <p className="course-section-loading" role="status">Loading live register…</p>;
  const present = records.filter((record) => record.recordedAt).length;
  return <section className="live-register" aria-live="polite">
    <header>
      <div><h3>Live register</h3><p>{present} of {records.length} students recorded</p></div>
      <span><Radio size={14} aria-hidden="true" />Live</span>
    </header>
    {!records.length ? <p className="course-section-empty">No students were enrolled when this session opened.</p> : <ol>{records.map((record) => <li key={record.studentId}>
      <span className={record.recordedAt ? 'record-mark is-present' : 'record-mark'}>{record.recordedAt ? <Check size={15} aria-hidden="true" /> : <Fingerprint size={15} aria-hidden="true" />}</span>
      <div><strong>{record.studentName}</strong>{record.matricNumber && <small>{record.matricNumber}</small>}</div>
      {record.recordedAt ? <time dateTime={record.recordedAt}>{formatWatTime(record.recordedAt)} WAT</time> : <span>Waiting</span>}
    </li>)}</ol>}
  </section>;
}

export function CourseAttendance({ courseId }) {
  const { token, user, logout } = useAuth();
  const [sessions, setSessions] = useState(null);
  const [devices, setDevices] = useState(null);
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  const [revision, setRevision] = useState(0);

  const report = useCallback((failure) => {
    if (failure?.status === 401) logout();
    else if (failure) setError(failure.message);
  }, [logout]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      attendanceApi.sessions(token, courseId, controller.signal),
      attendanceApi.devices(token, controller.signal),
    ]).then(([sessionData, deviceData]) => {
      setSessions(sessionData.sessions);
      setDevices(deviceData.devices);
      setDeviceId((current) => current || deviceData.devices[0]?.deviceId || '');
    }).catch((failure) => {
      if (!controller.signal.aborted) report(failure);
    });
    return () => controller.abort();
  }, [token, courseId, revision, report]);

  const active = sessions?.find((session) => session.status === 'ACTIVE');
  const closed = sessions?.filter((session) => session.status === 'CLOSED') ?? [];

  async function open() {
    if (!deviceId) {
      setError('Choose an active attendance device before opening the session.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await attendanceApi.open(token, courseId, { deviceId });
      setRevision((value) => value + 1);
    } catch (failure) {
      report(failure);
    } finally {
      setBusy(false);
    }
  }

  async function close() {
    if (!closing || !active) return;
    setBusy(true);
    setError('');
    try {
      await attendanceApi.close(token, active.sessionId);
      setClosing(false);
      setRevision((value) => value + 1);
    } catch (failure) {
      report(failure);
    } finally {
      setBusy(false);
    }
  }

  if (user.role !== 'LECTURER') return null;

  return <section className="course-section course-attendance-workspace">
    {closing && <ConfirmDialog title="Close attendance" description="Close this attendance session? The verified record will remain available in the course history." confirmLabel="Close session" icon={Activity} onConfirm={close} onClose={() => { if (!busy) { setError(''); setClosing(false); } }} busy={busy} error={error} />}
    <header className="course-workspace-section-heading">
      <div><h2>Attendance</h2><p>Verified fingerprint records use server time.</p></div>
      {active ? <button type="button" className="secondary" disabled={busy} onClick={() => { setError(''); setClosing(true); }}><Activity size={17} aria-hidden="true" />{busy ? 'Closing…' : 'Close attendance'}</button> : <button type="button" disabled={busy || !deviceId} onClick={open}><ScanLine size={17} aria-hidden="true" />{busy ? 'Opening…' : 'Open attendance'}</button>}
    </header>
    {error && !closing && <div role="alert"><p>{error}</p><button type="button" onClick={() => { setError(''); setRevision((value) => value + 1); }}>Retry attendance</button></div>}
    {!sessions || !devices ? (!error && !closing ? <p className="course-section-loading" role="status">Loading attendance…</p> : null) : active ? <>
      <div className="attendance-active-note"><Radio size={18} aria-hidden="true" /><p>Attendance is open. Students are added to the register after a verified scan.</p><time dateTime={active.openedAt}><Clock3 size={14} aria-hidden="true" />Opened {formatAcademicDate(active.openedAt)}</time></div>
      <SessionRegister session={active} token={token} onFailure={report} />
    </> : <div className="attendance-ready">
      <Fingerprint size={22} aria-hidden="true" />
      <div><h3>Ready to take attendance.</h3><p>Select an active device, then open the class register.</p></div>
      <label>Attendance device<select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}><option value="">Select active device</option>{devices.map((device) => <option value={device.deviceId} key={device.deviceId}>{device.deviceName}{device.location ? ` · ${device.location}` : ''}</option>)}</select></label>
      {!devices.length && <p className="course-section-empty">An administrator must register and activate a device before attendance can open.</p>}
    </div>}
    {closed.length > 0 && <section className="course-session-history">
      <header><h3>Recent sessions</h3><span>{closed.length} recorded</span></header>
      <ul>{closed.map((session) => <li key={session.sessionId}><Clock3 size={16} aria-hidden="true" /><div><strong>{formatAcademicDateOnly(session.openedAt)}</strong><small>{formatWatTime(session.openedAt)} WAT</small></div><span>{session.presentCount}/{session.eligibleCount} present</span></li>)}</ul>
    </section>}
  </section>;
}
