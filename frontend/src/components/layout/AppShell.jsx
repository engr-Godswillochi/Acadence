import { Link, Outlet } from 'react-router-dom';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Acadence home">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span>Acadence</span>
        </Link>
        <span className="phase-label">Academic workspace</span>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
