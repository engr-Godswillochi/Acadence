import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, ArrowRight, BookOpen, Plus } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { coursesApi } from '../features/courses/courses.api.js';
import { CourseForm } from '../features/courses/CourseForm.jsx';

function courseMeta(course) {
  return `${course.academicSession} · ${course.semester === 'FIRST' ? 'First' : 'Second'} semester · ${course.creditUnits} credits`;
}

export function CoursesPage() {
  const { token, user, logout } = useAuth();
  const lecturer = user.role === 'LECTURER';
  const [courses, setCourses] = useState(null);
  const [archivedCourses, setArchivedCourses] = useState(null);
  const [error, setError] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const archivedRequest = lecturer
      ? coursesApi.listArchived(token, controller.signal)
      : Promise.resolve({ courses: [] });
    Promise.all([coursesApi.list(token, controller.signal), archivedRequest])
      .then(([active, archived]) => {
        setCourses(active.courses);
        setArchivedCourses(archived.courses);
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        if (failure.status === 401) logout();
        else setError(failure.message);
      });
    return () => controller.abort();
  }, [token, revision, logout, lecturer]);

  async function unarchive(courseId) {
    setRestoring(courseId);
    setRestoreError('');
    try {
      const { course } = await coursesApi.unarchive(token, courseId);
      setArchivedCourses((items) => items.filter((item) => item.courseId !== courseId));
      setCourses((items) => [...items, course].sort((left, right) => left.courseCode.localeCompare(right.courseCode)));
    } catch (failure) {
      setRestoreError(failure.message);
    } finally {
      setRestoring('');
    }
  }

  return <section className="course-directory-page">
    <div className="course-directory-heading page-banner">
      <div>
        <h1>Courses</h1>
        <p>{lecturer ? 'The courses you teach, in one place.' : 'Your enrolled courses and their coursework.'}</p>
      </div>
      {lecturer && !creating && <button onClick={() => setCreating(true)}><Plus size={17} aria-hidden="true" />New course</button>}
    </div>

    {creating && <CourseForm onCancel={() => setCreating(false)} onSave={async (input) => {
      await coursesApi.create(token, input);
      setCreating(false);
      setRevision((value) => value + 1);
    }} />}

    {error
      ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></div>
      : !courses
        ? <p role="status">Loading courses…</p>
        : !courses.length
          ? <div className="course-directory-empty"><BookOpen size={24} aria-hidden="true" /><div><h2>No active courses.</h2><p>{lecturer ? 'Create a course or restore one from the archive below.' : 'You are not enrolled in any courses yet. Your lecturer can enrol you using your registered email address.'}</p></div></div>
          : <ul className="course-directory-list">{courses.map((course) => <li key={course.courseId}>
            <Link to={`/courses/${course.courseId}`}>
              <span className="directory-course-icon"><BookOpen size={20} aria-hidden="true" /></span>
              <span className="directory-course-code">{course.courseCode}</span>
              <span className="directory-course-title"><span className="directory-course-code-mobile">{course.courseCode}</span><strong>{course.courseTitle}</strong><small>{courseMeta(course)}</small></span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </li>)}</ul>}

    {lecturer && archivedCourses && <section className="archived-courses" aria-labelledby="archived-courses-heading">
      <header>
        <div><h2 id="archived-courses-heading">Archived courses</h2><p>Restore a course to return it to active course lists without losing its records.</p></div>
        <span>{archivedCourses.length}</span>
      </header>
      {restoreError && <p className="archived-courses-error" role="alert">{restoreError}</p>}
      {!archivedCourses.length
        ? <div className="archived-courses-empty"><Archive size={20} aria-hidden="true" /><p>No archived courses.</p></div>
        : <ul>{archivedCourses.map((course) => <li key={course.courseId}>
          <span className="archived-course-icon"><Archive size={18} aria-hidden="true" /></span>
          <span className="archived-course-copy"><strong>{course.courseCode} · {course.courseTitle}</strong><small>{courseMeta(course)}</small></span>
          <button className="secondary" type="button" disabled={Boolean(restoring)} onClick={() => unarchive(course.courseId)}>
            <ArchiveRestore size={16} aria-hidden="true" />{restoring === course.courseId ? 'Restoring…' : 'Unarchive'}
          </button>
        </li>)}</ul>}
    </section>}
  </section>;
}
