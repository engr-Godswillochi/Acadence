import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <p className="eyebrow">404</p>
      <h1 id="not-found-title">This page is not available.</h1>
      <p>The requested route has not been added to Acadence.</p>
      <Link className="text-link" to="/">
        Return home
      </Link>
    </section>
  );
}
