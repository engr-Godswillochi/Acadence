import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Fingerprint, Link2, LoaderCircle, Plus, Search, Trash2, UserRound, X } from 'lucide-react';

import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { adminApi } from '../features/admin/admin.api.js';
import { deviceConnection } from '../features/admin/admin.utils.js';
import { useAuth } from '../features/auth/useAuth.js';
import { formatAcademicDate } from '../utils/date.js';

const activeJobStatuses = new Set(['PENDING', 'CLAIMED']);

function EnrollmentForm({ token, devices, busy, error, onCancel, onStart }) {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState(null);
  const [searchError, setSearchError] = useState('');

  async function search(event) {
    event?.preventDefault();
    setSearchError('');
    try { setStudents((await adminApi.students(token, query)).students); }
    catch (failure) { setSearchError(failure.message); }
  }

  useEffect(() => {
    const controller = new AbortController();
    adminApi.students(token, '', controller.signal).then((data) => setStudents(data.students)).catch((failure) => {
      if (!controller.signal.aborted) setSearchError(failure.message);
    });
    return () => controller.abort();
  }, [token]);

  return <section className="admin-inline-form admin-enrollment-form" aria-labelledby="enrollment-form-title">
    <div className="admin-inline-form-heading"><div><h2 id="enrollment-form-title">Enrol a fingerprint</h2><p>Choose the student and an available device. Acadence assigns the sensor slot and saves the mapping only after the device confirms both scans.</p></div><button type="button" className="icon-button secondary" aria-label="Close enrolment form" disabled={busy} onClick={onCancel}><X size={17} aria-hidden="true" /></button></div>
    <form className="admin-student-search" onSubmit={search}><label htmlFor="admin-student-query">Find student</label><div><input id="admin-student-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, matric number, or email" maxLength={120} /><button className="secondary" type="submit"><Search size={16} aria-hidden="true" />Search</button></div></form>
    {searchError && <p className="form-error" role="alert">{searchError}</p>}
    <form onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const studentId = data.get('studentId');
      const deviceId = data.get('deviceId');
      const student = students.find((item) => item.userId === studentId);
      const device = devices.find((item) => item.deviceId === deviceId);
      onStart({ studentId, deviceId }, { student, device });
    }}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <fieldset disabled={busy || !students?.length || !devices.length}>
        <label>Student<select name="studentId" required defaultValue=""><option value="" disabled>{students === null ? 'Loading students…' : students.length ? 'Choose a student' : 'No students match this search'}</option>{students?.map((student) => <option key={student.userId} value={student.userId}>{student.fullName} · {student.matricNumber || student.email}{student.profileCount ? ` · ${student.profileCount} mapped` : ''}</option>)}</select></label>
        <label>Device<select name="deviceId" required defaultValue=""><option value="" disabled>{devices.length ? 'Choose an online idle device' : 'No devices are ready'}</option>{devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.deviceName}{device.location ? ` · ${device.location}` : ''}</option>)}</select></label>
        <div className="admin-form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit">{busy ? 'Starting…' : 'Start enrolment'}</button></div>
      </fieldset>
      {!devices.length && <p className="admin-form-hint">An authorized device must be online, idle, and reporting a ready fingerprint sensor.</p>}
    </form>
  </section>;
}

function jobPresentation(job) {
  if (job.status === 'PENDING') return { label: 'Waiting for device', tone: 'pending', Icon: LoaderCircle, message: `Waiting for ${job.deviceName} to receive the enrolment instruction.` };
  if (job.status === 'CLAIMED') return { label: 'Fingerprint capture', tone: 'active', Icon: Fingerprint, message: 'The device is ready. Ask the student to follow the OLED prompts and scan the same finger twice.' };
  if (job.status === 'COMPLETED') return { label: 'Enrolment complete', tone: 'success', Icon: CheckCircle2, message: 'The fingerprint template is stored on the device and the student mapping has been saved.' };
  if (job.status === 'FAILED') return { label: 'Enrolment failed', tone: 'danger', Icon: AlertTriangle, message: job.failureCode ? `The device reported ${job.failureCode.toLowerCase().replaceAll('_', ' ')}. Start a new enrolment to try again.` : 'The device could not complete fingerprint capture. Start a new enrolment to try again.' };
  if (job.status === 'EXPIRED') return { label: 'Enrolment expired', tone: 'warning', Icon: AlertTriangle, message: 'The device did not complete the enrolment before the job expired.' };
  return { label: 'Enrolment cancelled', tone: 'muted', Icon: X, message: 'No fingerprint mapping was created.' };
}

function EnrollmentProgress({ job, busy, error, onCancel, onClose }) {
  const presentation = jobPresentation(job);
  const Icon = presentation.Icon;
  const active = activeJobStatuses.has(job.status);
  return <section className={`admin-enrollment-progress is-${presentation.tone}`} aria-labelledby="enrollment-progress-title" aria-live="polite">
    <div className="admin-enrollment-status"><span className="admin-enrollment-icon" aria-hidden="true"><Icon size={22} /></span><div><span>{presentation.label}</span><h2 id="enrollment-progress-title">{job.studentName}</h2><p>{job.matricNumber || 'Student fingerprint enrolment'}</p></div></div>
    <div className="admin-enrollment-instruction"><p>{presentation.message}</p><dl><div><dt>Device</dt><dd>{job.deviceName}</dd></div><div><dt>Sensor slot</dt><dd>{job.sensorSlotId}</dd></div></dl></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="admin-enrollment-actions">{active ? <button type="button" className="secondary" disabled={busy} onClick={onCancel}>{busy ? 'Cancelling…' : 'Cancel enrolment'}</button> : <button type="button" onClick={onClose}>{job.status === 'COMPLETED' ? 'Done' : 'Try again'}</button>}</div>
  </section>;
}

export function AdminBiometricsPage() {
  const { token, logout } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentJob, setEnrollmentJob] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([adminApi.devices(token, controller.signal), adminApi.profiles(token, controller.signal)])
      .then(([deviceData, profileData]) => setWorkspace({ devices: deviceData.devices, profiles: profileData.profiles }))
      .catch((failure) => {
        if (controller.signal.aborted) return;
        if (failure.status === 401) logout(); else setError(failure.message);
      });
    return () => controller.abort();
  }, [token, logout, revision]);

  const availableDevices = useMemo(() => workspace?.devices.filter((device) => deviceConnection(device).label === 'Online' && device.sensorReady && device.reportedMode === 'IDLE') || [], [workspace]);

  useEffect(() => {
    if (!enrollmentJob?.jobId || !activeJobStatuses.has(enrollmentJob.status)) return undefined;
    const controller = new AbortController();
    let stopped = false;
    let timer;
    async function poll() {
      try {
        const data = await adminApi.enrollmentJob(token, enrollmentJob.jobId, controller.signal);
        if (stopped) return;
        setEnrollmentJob((current) => ({ ...current, ...data.job }));
        if (data.job.status === 'COMPLETED') setRevision((value) => value + 1);
        else if (activeJobStatuses.has(data.job.status)) timer = window.setTimeout(poll, 1200);
      } catch (failure) {
        if (controller.signal.aborted) return;
        if (failure.status === 401) logout();
        else {
          setError(failure.message);
          timer = window.setTimeout(poll, 2000);
        }
      }
    }
    timer = window.setTimeout(poll, 800);
    return () => { stopped = true; controller.abort(); window.clearTimeout(timer); };
  }, [token, logout, enrollmentJob?.jobId, enrollmentJob?.status]);

  async function startEnrollment(input, selection) {
    setBusy(true); setError('');
    try {
      const data = await adminApi.startEnrollment(token, input);
      setEnrollmentJob({ ...data.job, studentName: selection.student?.fullName || 'Selected student', matricNumber: selection.student?.matricNumber || selection.student?.email || '', deviceName: selection.device?.deviceName || 'Selected device' });
      setEnrolling(false);
    }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function cancelEnrollment() {
    if (!enrollmentJob) return;
    setBusy(true); setError('');
    try {
      const data = await adminApi.cancelEnrollment(token, enrollmentJob.jobId);
      setEnrollmentJob((current) => ({ ...current, ...data.job }));
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  function closeEnrollment() {
    const retry = enrollmentJob?.status !== 'COMPLETED';
    setEnrollmentJob(null); setError(''); setEnrolling(retry);
    setRevision((value) => value + 1);
  }

  async function remove() {
    if (!removing) return;
    setBusy(true); setError('');
    try { await adminApi.removeProfile(token, removing.biometricProfileId); setRemoving(null); setRevision((value) => value + 1); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <section className="admin-page">
    <header className="page-banner admin-banner"><div><h1>Fingerprint enrolment</h1><p>Capture fingerprints on authorized devices and keep each student mapping verifiable.</p></div><button disabled={Boolean(enrollmentJob)} onClick={() => { setEnrolling(true); setError(''); }}><Plus size={17} aria-hidden="true" />Enrol fingerprint</button></header>
    {enrolling && workspace && <EnrollmentForm token={token} devices={availableDevices} busy={busy} error={error} onCancel={() => { setEnrolling(false); setError(''); }} onStart={startEnrollment} />}
    {enrollmentJob && <EnrollmentProgress job={enrollmentJob} busy={busy} error={error} onCancel={cancelEnrollment} onClose={closeEnrollment} />}
    {!enrolling && !enrollmentJob && error && <div className="admin-error" role="alert"><p>{error}</p><button className="secondary" onClick={() => setError('')}>Dismiss</button></div>}
    <section className="admin-register admin-profile-register">
      <header><div><Fingerprint size={19} aria-hidden="true" /><h2>Saved mappings</h2></div><span>{workspace?.profiles.length ?? 0} profiles</span></header>
      {!workspace ? <div className="admin-loading" role="status"><span /><p>Loading fingerprint mappings…</p></div> : workspace.profiles.length ? <ul>{workspace.profiles.map((profile) => <li key={profile.biometricProfileId}>
        <span className="admin-profile-mark"><UserRound size={18} aria-hidden="true" /></span>
        <div className="admin-profile-student"><strong>{profile.studentName}</strong><span>{profile.matricNumber || profile.studentEmail}</span></div>
        <div className="admin-profile-device"><strong>{profile.deviceName}</strong><span>Sensor slot {profile.sensorSlotId}</span></div>
        <time dateTime={profile.enrolledAt}>Mapped {formatAcademicDate(profile.enrolledAt)}</time>
        <button type="button" className="secondary danger-text" onClick={() => { setRemoving(profile); setError(''); }}><Trash2 size={15} aria-hidden="true" />Remove</button>
      </li>)}</ul> : <div className="admin-empty"><Link2 size={23} aria-hidden="true" /><div><strong>No fingerprint mappings saved.</strong><p>Start an enrolment with an online device. Acadence will add the mapping after the device confirms both scans.</p></div></div>}
    </section>
    {removing && <ConfirmDialog title="Remove fingerprint mapping" description={`Remove ${removing.studentName} from sensor slot ${removing.sensorSlotId} on “${removing.deviceName}”? This removes the server mapping; delete the stored template from the physical sensor separately.`} confirmLabel="Remove mapping" icon={Fingerprint} onConfirm={remove} onClose={() => { if (!busy) { setRemoving(null); setError(''); } }} busy={busy} error={error} />}
  </section>;
}
