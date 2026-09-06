import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { attendanceApi } from './attendance.api.js';

function SessionRegister({ session, token, onFailure }) {
  const [records, setRecords] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => attendanceApi.records(token, session.sessionId).then((data) => { if (!cancelled) setRecords(data.records); }).catch(onFailure);
    load(); const timer = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [session.sessionId, token, onFailure]);
  if (!records) return <p role="status">Loading live register…</p>;
  const present = records.filter((record) => record.recordedAt).length;
  return <div className="attendance-register"><h3>Live register · {present} / {records.length} present</h3>{!records.length ? <p className="empty-state">No students were enrolled when this session opened.</p> : <ol>{records.map((record) => <li key={record.studentId}><span>{record.studentName}{record.matricNumber ? ` · ${record.matricNumber}` : ''}</span><strong>{record.recordedAt ? new Date(record.recordedAt).toLocaleTimeString() : 'Absent'}</strong></li>)}</ol>}</div>;
}

export function CourseAttendance({ courseId }) {
  const { token, user, logout } = useAuth();
  const [sessions, setSessions] = useState(null); const [devices, setDevices] = useState(null); const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [revision, setRevision] = useState(0);
  const report = useCallback((failure) => { if (failure?.status === 401) logout(); else if (failure) setError(failure.message); }, [logout]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([attendanceApi.sessions(token, courseId, controller.signal), attendanceApi.devices(token, controller.signal)]).then(([sessionData, deviceData]) => { setSessions(sessionData.sessions); setDevices(deviceData.devices); setDeviceId((current) => current || deviceData.devices[0]?.deviceId || ''); }).catch((failure) => { if (!controller.signal.aborted) report(failure); });
    return () => controller.abort();
  }, [token, courseId, revision, report]);
  const active = sessions?.find((session) => session.status === 'ACTIVE');
  async function open() { if (!deviceId) { setError('No active attendance device is available.'); return; } setBusy(true); setError(''); try { await attendanceApi.open(token, courseId, { deviceId }); setRevision((value) => value + 1); } catch (failure) { report(failure); } finally { setBusy(false); } }
  async function close() { if (!window.confirm('Close this attendance session? This makes it part of the official summary.')) return; setBusy(true); setError(''); try { await attendanceApi.close(token, active.sessionId); setRevision((value) => value + 1); } catch (failure) { report(failure); } finally { setBusy(false); } }
  if (user.role !== 'LECTURER') return null;
  return <section className="course-section"><div className="page-heading"><div><h2>Attendance</h2><p>Records use server time after a verified device scan.</p></div>{active ? <button className="secondary" disabled={busy} onClick={close}>{busy ? 'Closing…' : 'Close attendance'}</button> : <button disabled={busy || !deviceId} onClick={open}>{busy ? 'Opening…' : 'Open attendance'}</button>}</div>
    {error && <div role="alert"><p>{error}</p><button className="secondary" onClick={() => { setError(''); setRevision((value) => value + 1); }}>Retry attendance</button></div>}
    {!sessions || !devices ? <p role="status">Loading attendance…</p> : active ? <><p className="attendance-status">Attendance active since {new Date(active.openedAt).toLocaleString()}.</p><SessionRegister session={active} token={token} onFailure={report} /></> : <><label className="attendance-device">Attendance device<select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}><option value="">Select active device</option>{devices.map((device) => <option value={device.deviceId} key={device.deviceId}>{device.deviceName}{device.location ? ` · ${device.location}` : ''}</option>)}</select></label>{!devices.length && <p className="empty-state">An administrator must register and activate a device before attendance can open.</p>}</>}
    {sessions?.filter((session) => session.status === 'CLOSED').length > 0 && <div className="attendance-history"><h3>Recent closed sessions</h3><ul>{sessions.filter((session) => session.status === 'CLOSED').map((session) => <li key={session.sessionId}>{new Date(session.openedAt).toLocaleString()} · {session.presentCount}/{session.eligibleCount} present</li>)}</ul></div>}
  </section>;
}
