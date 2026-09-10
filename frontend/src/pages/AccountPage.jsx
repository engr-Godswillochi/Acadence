import { useAuth } from '../features/auth/useAuth.js';

export function AccountPage() {
  const { user, logout } = useAuth();
  const role = user.role === 'STUDENT' ? 'Student' : user.role === 'LECTURER' ? 'Lecturer' : 'Administrator';
  return <section className="account-view"><div className="page-heading"><div><p className="eyebrow">Your academic profile</p><h1 className="page-title">Account</h1><p className="page-intro">Keep your Acadence identity and academic details in one place.</p></div></div>
    <article className="account-card"><div className="account-avatar" aria-hidden="true">{user.fullName.slice(0, 1)}</div><div><h2>{user.fullName}</h2><p className="muted">{role}</p></div><dl className="account-details"><div><dt>Email address</dt><dd>{user.email}</dd></div>{user.matricNumber && <div><dt>Matric number</dt><dd>{user.matricNumber}</dd></div>}</dl><button className="secondary" onClick={logout}>Sign out</button></article>
  </section>;
}
