import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Cpu, Fingerprint, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { adminApi } from '../features/admin/admin.api.js';
import { countOnlineDevices, deviceConnection } from '../features/admin/admin.utils.js';
import { useAuth } from '../features/auth/useAuth.js';

export function AdminDashboard() {
  const { token, logout } = useAuth();
  const [workspace, setWorkspace] = useState(null);
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

  const overview = useMemo(() => workspace && ({
    active: workspace.devices.filter((device) => device.isActive).length,
    online: countOnlineDevices(workspace.devices),
    mappedStudents: new Set(workspace.profiles.map((profile) => profile.studentId)).size,
  }), [workspace]);

  return <section className="admin-page admin-overview-page">
    <header className="page-banner admin-banner"><div><h1>System administration</h1><p>Keep attendance devices trusted, connected, and mapped to the right students.</p></div><ShieldCheck size={36} aria-hidden="true" /></header>
    {error ? <div className="admin-error" role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></div> : !overview ? <div className="admin-loading" role="status"><span /><p>Checking device operations…</p></div> : <>
      <dl className="admin-summary" aria-label="Administration overview">
        <div><dt>Registered devices</dt><dd>{workspace.devices.length}</dd><span>{overview.active} active</span></div>
        <div><dt>Devices online</dt><dd>{overview.online}</dd><span>Seen in the last two minutes</span></div>
        <div><dt>Fingerprint profiles</dt><dd>{workspace.profiles.length}</dd><span>{overview.mappedStudents} students mapped</span></div>
      </dl>
      <div className="admin-overview-grid">
        <section className="admin-register">
          <header><div><Radio size={19} aria-hidden="true" /><h2>Device readiness</h2></div><Link to="/admin/devices">Manage devices <ArrowRight size={15} aria-hidden="true" /></Link></header>
          {workspace.devices.length ? <ul>{workspace.devices.slice(0, 5).map((device) => { const connection = deviceConnection(device); return <li key={device.deviceId}><span className={`admin-status-dot is-${connection.tone}`} aria-hidden="true" /><div><strong>{device.deviceName}</strong><small>{device.location || 'Location not set'}</small></div><span className={`status-chip is-${connection.tone}`}>{connection.label}</span></li>; })}</ul> : <div className="admin-empty"><Cpu size={22} aria-hidden="true" /><div><strong>No devices registered.</strong><p>Add the first attendance device before a lecturer opens a session.</p></div></div>}
        </section>
        <aside className="admin-next-actions">
          <h2>Operations</h2>
          <p>Device keys authenticate hardware. Fingerprint mappings connect the sensor’s numeric slot to one student account.</p>
          <nav aria-label="Administration shortcuts">
            <Link to="/admin/devices"><Cpu size={18} aria-hidden="true" /><span><strong>Device registry</strong><small>Register, disable, and rotate keys</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
            <Link to="/admin/biometrics"><Fingerprint size={18} aria-hidden="true" /><span><strong>Fingerprint mappings</strong><small>Connect students to sensor slots</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
          </nav>
        </aside>
      </div>
    </>}
  </section>;
}
