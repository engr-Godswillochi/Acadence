import { useEffect, useMemo, useState } from 'react';
import { Fingerprint, Link2, Plus, Search, Trash2, UserRound, X } from 'lucide-react';

import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { adminApi } from '../features/admin/admin.api.js';
import { useAuth } from '../features/auth/useAuth.js';
import { formatAcademicDate } from '../utils/date.js';

function MappingForm({ token, devices, busy, error, onCancel, onSave }) {
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

  return <section className="admin-inline-form admin-mapping-form" aria-labelledby="mapping-form-title">
    <div className="admin-inline-form-heading"><div><h2 id="mapping-form-title">Save fingerprint mapping</h2><p>Enrol the fingerprint on the physical sensor first, then connect its slot to the student.</p></div><button type="button" className="icon-button secondary" aria-label="Close mapping form" disabled={busy} onClick={onCancel}><X size={17} aria-hidden="true" /></button></div>
    <form className="admin-student-search" onSubmit={search}><label htmlFor="admin-student-query">Find student</label><div><input id="admin-student-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, matric number, or email" maxLength={120} /><button className="secondary" type="submit"><Search size={16} aria-hidden="true" />Search</button></div></form>
    {searchError && <p className="form-error" role="alert">{searchError}</p>}
    <form onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      onSave({ studentId: data.get('studentId'), deviceId: data.get('deviceId'), sensorSlotId: Number(data.get('sensorSlotId')) });
    }}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <fieldset disabled={busy || !students?.length || !devices.length}>
        <label>Student<select name="studentId" required defaultValue=""><option value="" disabled>{students === null ? 'Loading students…' : students.length ? 'Choose a student' : 'No students match this search'}</option>{students?.map((student) => <option key={student.userId} value={student.userId}>{student.fullName} · {student.matricNumber || student.email}{student.profileCount ? ` · ${student.profileCount} mapped` : ''}</option>)}</select></label>
        <label>Device<select name="deviceId" required defaultValue=""><option value="" disabled>{devices.length ? 'Choose an active device' : 'No active devices available'}</option>{devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.deviceName}{device.location ? ` · ${device.location}` : ''}</option>)}</select></label>
        <label>Sensor slot ID<input name="sensorSlotId" type="number" inputMode="numeric" min="1" max="65535" required placeholder="e.g. 12" /></label>
        <div className="admin-form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit">{busy ? 'Saving…' : 'Save mapping'}</button></div>
      </fieldset>
    </form>
  </section>;
}

export function AdminBiometricsPage() {
  const { token, logout } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [mapping, setMapping] = useState(false);
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

  const activeDevices = useMemo(() => workspace?.devices.filter((device) => device.isActive) || [], [workspace]);

  async function save(input) {
    setBusy(true); setError('');
    try { await adminApi.enrol(token, input); setMapping(false); setRevision((value) => value + 1); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!removing) return;
    setBusy(true); setError('');
    try { await adminApi.removeProfile(token, removing.biometricProfileId); setRemoving(null); setRevision((value) => value + 1); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <section className="admin-page">
    <header className="page-banner admin-banner"><div><h1>Fingerprint mappings</h1><p>Connect each sensor slot to the student identity used for official attendance.</p></div><button onClick={() => { setMapping(true); setError(''); }}><Plus size={17} aria-hidden="true" />New mapping</button></header>
    {mapping && workspace && <MappingForm token={token} devices={activeDevices} busy={busy} error={error} onCancel={() => { setMapping(false); setError(''); }} onSave={save} />}
    {!mapping && error && <div className="admin-error" role="alert"><p>{error}</p><button className="secondary" onClick={() => setError('')}>Dismiss</button></div>}
    <section className="admin-register admin-profile-register">
      <header><div><Fingerprint size={19} aria-hidden="true" /><h2>Saved mappings</h2></div><span>{workspace?.profiles.length ?? 0} profiles</span></header>
      {!workspace ? <div className="admin-loading" role="status"><span /><p>Loading fingerprint mappings…</p></div> : workspace.profiles.length ? <ul>{workspace.profiles.map((profile) => <li key={profile.biometricProfileId}>
        <span className="admin-profile-mark"><UserRound size={18} aria-hidden="true" /></span>
        <div className="admin-profile-student"><strong>{profile.studentName}</strong><span>{profile.matricNumber || profile.studentEmail}</span></div>
        <div className="admin-profile-device"><strong>{profile.deviceName}</strong><span>Sensor slot {profile.sensorSlotId}</span></div>
        <time dateTime={profile.enrolledAt}>Mapped {formatAcademicDate(profile.enrolledAt)}</time>
        <button type="button" className="secondary danger-text" onClick={() => { setRemoving(profile); setError(''); }}><Trash2 size={15} aria-hidden="true" />Remove</button>
      </li>)}</ul> : <div className="admin-empty"><Link2 size={23} aria-hidden="true" /><div><strong>No fingerprint mappings saved.</strong><p>Enrol a fingerprint on an active device, then save its student and slot here.</p></div></div>}
    </section>
    {removing && <ConfirmDialog title="Remove fingerprint mapping" description={`Remove ${removing.studentName} from sensor slot ${removing.sensorSlotId} on “${removing.deviceName}”? This removes the server mapping; delete the stored template from the physical sensor separately.`} confirmLabel="Remove mapping" icon={Fingerprint} onConfirm={remove} onClose={() => { if (!busy) { setRemoving(null); setError(''); } }} busy={busy} error={error} />}
  </section>;
}
