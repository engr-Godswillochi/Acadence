import { useAuth } from '../features/auth/useAuth.js';
import { GraduationCap, LogOut, Mail, UserRound } from 'lucide-react';

export function AccountPage() {
  const { user, logout } = useAuth();
  const role = user.role === 'STUDENT' ? 'Student' : user.role === 'LECTURER' ? 'Lecturer' : 'Administrator';
  return <section className="account-view"><header className="account-heading page-banner"><div><h1>Account</h1><p>Your academic identity and registered details.</p></div></header>
    <article className="account-profile"><div className="account-avatar" aria-hidden="true">{user.fullName.slice(0, 1)}</div><div className="account-person"><span><UserRound size={16} aria-hidden="true" />{role}</span><h2>{user.fullName}</h2></div><button className="secondary" onClick={logout}><LogOut size={16} aria-hidden="true" />Sign out</button><dl className="account-details"><div><dt><Mail size={15} aria-hidden="true" />Email address</dt><dd>{user.email}</dd></div>{user.matricNumber && <div><dt><GraduationCap size={15} aria-hidden="true" />Matric number</dt><dd>{user.matricNumber}</dd></div>}</dl></article>
  </section>;
}
