import { useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { BookOpen, CalendarDays, Fingerprint } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';

export function AuthPage({ mode }) {
  const registering = mode === 'register';
  const auth = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const [role, setRole] = useState(requestedRole === 'LECTURER' ? 'LECTURER' : 'STUDENT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const stateDestination = location.state?.from;
  const queryDestination = searchParams.get('redirect');
  const requestedDestination = stateDestination || queryDestination;
  const destination = typeof requestedDestination === 'string'
    && requestedDestination.startsWith('/')
    && !requestedDestination.startsWith('//')
    && !['/login', '/register'].includes(requestedDestination.split(/[?#]/)[0])
    ? requestedDestination
    : null;

  function switchHref(targetMode) {
    const params = new URLSearchParams();
    if (destination) params.set('redirect', destination);
    if (targetMode === 'register') {
      const nextRole = requestedRole === 'LECTURER'
        ? 'LECTURER'
        : destination?.startsWith('/enrol/')
          ? 'STUDENT'
          : null;
      if (nextRole) params.set('role', nextRole);
    }
    const query = params.toString();
    return `/${targetMode}${query ? `?${query}` : ''}`;
  }

  if (auth.status === 'authenticated') {
    return <Navigate replace to={destination || '/dashboard'} />;
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
    <div className="auth-introduction"><h1>Your academic day, together.</h1><p>Know what’s due, where to be, and how you’re doing. All your academic essentials, in Acadence.</p><div className="auth-points"><span><BookOpen size={17} aria-hidden="true" />Courses & assignments</span><span><CalendarDays size={17} aria-hidden="true" />Your weekly timetable</span><span><Fingerprint size={17} aria-hidden="true" />Attendance records</span></div></div>
    <div className="auth-panel"><h2>{registering ? 'Create your account' : 'Welcome back'}</h2><p className="auth-lead">{registering ? 'A few details, then you’re ready to begin.' : 'Sign in to pick up where you left off.'}</p>
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
          {registering && <p id="password-hint" className="form-hint">Use at least 8 characters.</p>}
          <button className="button-full" type="submit">{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</button>
        </fieldset>
      </form>
      <p className="auth-switch">{registering ? 'Already registered?' : 'New to Acadence?'} <Link to={switchHref(registering ? 'login' : 'register')}>{registering ? 'Sign in' : 'Create an account'}</Link></p>
    </div>
  </section>;
}
