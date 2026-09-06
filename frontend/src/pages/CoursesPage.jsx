import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';
import { coursesApi } from '../features/courses/courses.api.js';
import { CourseForm } from '../features/courses/CourseForm.jsx';

export function CoursesPage() {
  const { token, user, logout } = useAuth();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    coursesApi.list(token, controller.signal).then((data) => setCourses(data.courses)).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout();
      else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, revision, logout]);
  const lecturer = user.role === 'LECTURER';
  return <section>
    <div className="page-heading"><div><p className="eyebrow">Academic workspace</p><h1 className="page-title">Courses</h1></div>{lecturer && !creating && <button onClick={() => setCreating(true)}>New course</button>}</div>
    {creating && <CourseForm onCancel={() => setCreating(false)} onSave={async (input) => { await coursesApi.create(token, input); setCreating(false); setRevision((value) => value + 1); }} />}
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></div> : !courses ? <p role="status">Loading courses…</p> : !courses.length ? <p className="empty-state">{lecturer ? 'No courses yet. Create a course to begin.' : 'You are not enrolled in any courses yet. Your lecturer can enrol you using your account email.'}</p> :
      <ul className="course-list">{courses.map((course) => <li key={course.courseId}><Link to={`/courses/${course.courseId}`}><strong>{course.courseCode}</strong><span>{course.courseTitle}</span><small>{course.academicSession} · {course.semester === 'FIRST' ? 'First' : 'Second'} semester · {course.creditUnits} credits</small></Link></li>)}</ul>}
  </section>;
}
