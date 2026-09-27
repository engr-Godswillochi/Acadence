import { useEffect, useState } from 'react';
import { Check, Clipboard, Cpu, KeyRound, MapPin, Pencil, Plus, Power, Radio, RotateCw, X } from 'lucide-react';

import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { adminApi } from '../features/admin/admin.api.js';
import { deviceConnection } from '../features/admin/admin.utils.js';
import { useAuth } from '../features/auth/useAuth.js';
import { formatAcademicDate } from '../utils/date.js';

function DeviceForm({ initial, busy, error, onCancel, onSave }) {
  return <form className="admin-inline-form" onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({ deviceName: data.get('deviceName'), location: data.get('location') || null });
  }}>
    <div className="admin-inline-form-heading"><div><h2>{initial?.deviceId ? 'Edit device' : 'Register device'}</h2><p>{initial?.deviceId ? 'Keep the hardware name and physical location current.' : 'The device key will be shown once after registration.'}</p></div><button type="button" className="icon-button secondary" aria-label="Close device form" disabled={busy} onClick={onCancel}><X size={17} aria-hidden="true" /></button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <fieldset disabled={busy}>
      <label>Device name<input name="deviceName" defaultValue={initial?.deviceName || ''} required maxLength={160} placeholder="e.g. Engineering lab entrance" /></label>
      <label>Location<input name="location" defaultValue={initial?.location || ''} maxLength={160} placeholder="Building or room" /></label>
      <div className="admin-form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit">{busy ? 'Saving…' : initial?.deviceId ? 'Save changes' : 'Register device'}</button></div>
    </fieldset>
  </form>;
}

export function AdminDevicesPage() {
  const { token, logout } = useAuth();
  const [devices, setDevices] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [keyReveal, setKeyReveal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    adminApi.devices(token, controller.signal).then((data) => setDevices(data.devices)).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout(); else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, logout, revision]);

  function refresh() { setRevision((value) => value + 1); }

  async function save(input) {
    setBusy(true); setError('');
    try {
      if (editing?.deviceId) await adminApi.updateDevice(token, editing.deviceId, input);
      else {
        const result = await adminApi.createDevice(token, input);
        setKeyReveal({ deviceName: result.device.deviceName, apiKey: result.apiKey });
      }
      setEditing(null); refresh();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function enable(device) {
    setBusy(true); setError('');
    try { await adminApi.updateDevice(token, device.deviceId, { isActive: true }); refresh(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function confirmAction() {
    if (!confirming) return;
    setBusy(true); setError('');
    try {
      if (confirming.kind === 'disable') await adminApi.updateDevice(token, confirming.device.deviceId, { isActive: false });
      else {
        const result = await adminApi.rotateDeviceKey(token, confirming.device.deviceId);
        setKeyReveal({ deviceName: result.device.deviceName, apiKey: result.apiKey });
      }
      setConfirming(null); refresh();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function copyKey() {
    try { await navigator.clipboard.writeText(keyReveal.apiKey); setCopied(true); }
    catch { setError('Copy failed. Select the device key and copy it manually.'); }
  }

  return <section className="admin-page">
    <header className="page-banner admin-banner"><div><h1>Attendance devices</h1><p>Register hardware, watch its connection state, and control the credential it uses.</p></div><button onClick={() => { setEditing({}); setError(''); }}><Plus size={17} aria-hidden="true" />Register device</button></header>
    {keyReveal && <section className="device-key-reveal" aria-labelledby="device-key-title"><div><KeyRound size={21} aria-hidden="true" /><div><h2 id="device-key-title">Save the key for {keyReveal.deviceName}</h2><p>This credential is shown once. Add it to the device configuration before closing this notice.</p></div></div><code>{keyReveal.apiKey}</code><div><button type="button" className="secondary" onClick={copyKey}>{copied ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}{copied ? 'Copied' : 'Copy key'}</button><button type="button" className="secondary" onClick={() => { setKeyReveal(null); setCopied(false); }}>I have saved it</button></div></section>}
    {editing && <DeviceForm initial={editing} busy={busy} error={error} onCancel={() => { setEditing(null); setError(''); }} onSave={save} />}
    {!editing && error && <div className="admin-error" role="alert"><p>{error}</p><button className="secondary" onClick={() => setError('')}>Dismiss</button></div>}
    <section className="admin-register admin-device-register">
      <header><div><Radio size={19} aria-hidden="true" /><h2>Device registry</h2></div><span>{devices?.length ?? 0} registered</span></header>
      {!devices ? <div className="admin-loading" role="status"><span /><p>Loading devices…</p></div> : devices.length ? <ul>{devices.map((device) => { const connection = deviceConnection(device); return <li key={device.deviceId}>
        <span className={`admin-status-dot is-${connection.tone}`} aria-hidden="true" />
        <div className="admin-device-identity"><strong>{device.deviceName}</strong><span><MapPin size={14} aria-hidden="true" />{device.location || 'Location not set'}</span></div>
        <div className="admin-device-connection"><span className={`status-chip is-${connection.tone}`}>{connection.label}</span><small>{device.lastSeenAt ? `Last seen ${formatAcademicDate(device.lastSeenAt)}` : 'Waiting for its first heartbeat'}</small></div>
        <div className="admin-row-actions"><button type="button" className="secondary" disabled={busy} onClick={() => { setEditing(device); setError(''); }}><Pencil size={15} aria-hidden="true" />Edit</button><button type="button" className="secondary" disabled={busy} onClick={() => setConfirming({ kind: 'rotate', device })}><RotateCw size={15} aria-hidden="true" />Rotate key</button>{device.isActive ? <button type="button" className="secondary" disabled={busy} onClick={() => setConfirming({ kind: 'disable', device })}><Power size={15} aria-hidden="true" />Disable</button> : <button type="button" disabled={busy} onClick={() => enable(device)}><Power size={15} aria-hidden="true" />Enable</button>}</div>
      </li>; })}</ul> : <div className="admin-empty"><Cpu size={23} aria-hidden="true" /><div><strong>No attendance devices yet.</strong><p>Register hardware to generate its one-time authentication key.</p></div></div>}
    </section>
    {confirming && <ConfirmDialog title={confirming.kind === 'rotate' ? 'Rotate device key' : 'Disable device'} description={confirming.kind === 'rotate' ? `Rotate the key for “${confirming.device.deviceName}”? Its current key will stop working immediately.` : `Disable “${confirming.device.deviceName}”? It will not be available for new attendance sessions.`} confirmLabel={confirming.kind === 'rotate' ? 'Rotate key' : 'Disable device'} icon={confirming.kind === 'rotate' ? KeyRound : Power} onConfirm={confirmAction} onClose={() => { if (!busy) { setConfirming(null); setError(''); } }} busy={busy} error={error} />}
  </section>;
}
