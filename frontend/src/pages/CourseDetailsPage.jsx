import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';
import { coursesApi } from '../features/courses/courses.api.js';
import { CourseForm } from '../features/courses/CourseForm.jsx';
import { EnrolmentPanel } from '../features/courses/EnrolmentPanel.jsx';
import { CourseAssignments } from '../features/assignments/CourseAssignments.jsx';
import { Announcements } from '../features/announcements/Announcements.jsx';

function CourseDetails({ id }) {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    coursesApi.get(token, id, controller.signal).then((data) => setCourse(data.course)).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout(); else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, id, revision, logout]);
  async function archive() {
    if (!window.confirm('Archive this course? It will leave active course lists and retain its records.')) return;
    setBusy(true);
    try { await coursesApi.archive(token, id); navigate('/courses'); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  if (error) return <section><Link to="/courses">Back to courses</Link><p role="alert">{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></section>;
  if (!course) return <p role="status">Loading course…</p>;
  const lecturer = user.role === 'LECTURER';
  return <section><Link to="/courses">Back to courses</Link><div className="page-heading"><div><p className="eyebrow">{course.courseCode}</p><h1 className="page-title">{course.courseTitle}</h1><p>{course.academicSession} · {course.semester === 'FIRST' ? 'First' : 'Second'} semester · {course.creditUnits} credits</p></div>{lecturer && <div className="actions"><button className="secondary" disabled={busy} onClick={() => setEditing(true)}>Edit course</button><button className="secondary" disabled={busy} onClick={archive}>Archive course</button></div>}</div>
    {editing && <CourseForm initial={course} onCancel={() => setEditing(false)} onSave={async (data) => { const result = await coursesApi.update(token, id, data); setCourse(result.course); setEditing(false); }} />}
    <CourseAssignments courseId={id} />
    <Announcements courseId={id} />
    {lecturer && <EnrolmentPanel token={token} courseId={id} />}
  </section>;
}

export function CourseDetailsPage() {
  const { id } = useParams();
  return <CourseDetails key={id} id={id} />;
}
