import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, UserCog } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';

export function AdminRegisterPage() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);

  if (auth.status === 'authenticated') {
    return <Navigate replace to="/dashboard" />;
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setDetails([]);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await auth.registerAdmin({
        email: form.get('email'),
        password: form.get('password'),
        secretCode: form.get('secretCode'),
      });
    } catch (failure) {
      setError(failure.message);
      setDetails(failure.details ?? []);
    } finally {
      setBusy(false);
    }
  }

  return <section className="auth-layout">
    <div className="auth-introduction">
      <h1>Set up campus control.</h1>
      <p>Create the administrator account used to manage approved devices and biometric records.</p>
      <div className="auth-points">
        <span><ShieldCheck size={17} aria-hidden="true" />Restricted administrator access</span>
        <span><UserCog size={17} aria-hidden="true" />Device and biometric management</span>
        <span><KeyRound size={17} aria-hidden="true" />Secret-protected account creation</span>
      </div>
    </div>
    <div className="auth-panel">
      <h2>Create administrator</h2>
      <p className="auth-lead">Use the private secret code issued for administrator provisioning.</p>
      {error && <div role="alert" className="form-error"><p>{error}</p>{details.length > 0 && <ul>{details.map((detail, index) => <li key={index}>{detail.field}: {detail.message}</li>)}</ul>}</div>}
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="admin-password-hint" /></label>
          <p id="admin-password-hint" className="form-hint">Use at least 8 characters.</p>
          <label>Secret code<input name="secretCode" type="password" autoComplete="off" required maxLength={256} /></label>
          <button className="button-full" type="submit">{busy ? 'Creating administrator…' : 'Create administrator'}</button>
        </fieldset>
      </form>
    </div>
  </section>;
}
