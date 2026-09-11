import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';

export function AuthPage({ mode }) {
  const registering = mode === 'register';
  const auth = useAuth();
  const location = useLocation();
  const [role, setRole] = useState('STUDENT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  if (auth.status === 'authenticated') {
    const destination = location.state?.from;
    return <Navigate replace to={destination?.startsWith('/') && !destination.startsWith('//') && !['/login', '/register'].includes(destination) ? destination : '/dashboard'} />;
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setDetails([]);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const input = { email: form.get('email'), password: form.get('password') };
    if (registering) {
      input.fullName = form.get('fullName');
      input.role = role;
      const key = role === 'STUDENT' ? 'matricNumber' : 'staffNumber';
      if (form.get(key)) input[key] = form.get(key);
    }
    try { await auth[mode](input); }
    catch (failure) { setError(failure.message); setDetails(failure.details ?? []); }
    finally { setBusy(false); }
  }

  return <section className="auth-layout">
    <div className="auth-introduction"><p className="eyebrow">Acadence academic workspace</p><h1>Make room for focused academic work.</h1><p>Courses, deadlines, announcements, schedules, and attendance in one calm, dependable place.</p><div className="auth-points"><span>Coursework in context</span><span>Clear weekly planning</span><span>Personal progress records</span></div></div>
    <div className="auth-panel"><p className="eyebrow">{registering ? 'Join Acadence' : 'Sign in to your workspace'}</p><h2>{registering ? 'Create your account' : 'Welcome back'}</h2><p className="auth-lead">{registering ? 'Enter your academic details to set up your workspace.' : 'Use your academic email to access your workspace.'}</p>
      {error && <div role="alert" className="form-error"><p>{error}</p>{details.length > 0 && <ul>{details.map((detail, index) => <li key={index}>{detail.field}: {detail.message}</li>)}</ul>}</div>}
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {registering && <>
            <label>Full name<input name="fullName" autoComplete="name" required minLength={2} maxLength={100} /></label>
            <label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option value="STUDENT">Student</option><option value="LECTURER">Lecturer</option></select></label>
            {role === 'STUDENT' ? <label>Matric number<input name="matricNumber" key="matric" required maxLength={50} /></label> : <label>Staff number (optional)<input name="staffNumber" key="staff" maxLength={50} /></label>}
          </>}
          <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <label>Password<input name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={8} aria-describedby={registering ? 'password-hint' : undefined} /></label>
          {registering && <p id="password-hint" className="form-hint">Use at least 8 characters, up to 72 bytes.</p>}
          <button className="button-full" type="submit">{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button>
        </fieldset>
      </form>
      <p className="auth-switch">{registering ? 'Already registered?' : 'New to Acadence?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create an account'}</Link></p>
    </div>
  </section>;
}
