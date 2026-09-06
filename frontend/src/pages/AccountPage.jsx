import { useAuth } from '../features/auth/useAuth.js';

export function AccountPage() {
  const { user, logout } = useAuth();
  return <section className="auth-panel"><p className="eyebrow">Your account</p><h1>{user.fullName}</h1><p>{user.email}</p><p>{user.role === 'STUDENT' ? 'Student' : user.role === 'LECTURER' ? 'Lecturer' : 'Administrator'}</p>{user.matricNumber && <p>Matric number: {user.matricNumber}</p>}<button onClick={logout}>Sign out</button></section>;
}
