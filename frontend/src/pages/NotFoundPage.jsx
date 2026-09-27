import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <section className="not-found recovery-page" aria-labelledby="not-found-title">
      <Compass size={28} aria-hidden="true" />
      <h1 id="not-found-title">This page is not available.</h1>
      <p>The route you requested does not exist in this academic workspace.</p>
      <Link className="text-link" to="/">
        <ArrowLeft size={16} aria-hidden="true" />Return to workspace
      </Link>
    </section>
  );
}
