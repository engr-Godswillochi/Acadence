import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Archive, ArrowLeft, BookOpen, CalendarDays, Pencil, Scale } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { coursesApi } from '../features/courses/courses.api.js';
import { CourseForm } from '../features/courses/CourseForm.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { EnrolmentPanel } from '../features/courses/EnrolmentPanel.jsx';
import { CourseAssignments } from '../features/assignments/CourseAssignments.jsx';
import { Announcements } from '../features/announcements/Announcements.jsx';
import { CourseAttendance } from '../features/attendance/CourseAttendance.jsx';
import { CourseSchedules } from '../features/schedules/CourseSchedules.jsx';

function CourseDetails({ id }) {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);
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
    if (!archiving) return;
    setBusy(true);
    setError('');
    try { await coursesApi.archive(token, id); navigate('/courses'); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  if (error && !archiving) return <section><Link to="/courses">Back to courses</Link><p role="alert">{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></section>;
  if (!course) return <p role="status">Loading course…</p>;
  const lecturer = user.role === 'LECTURER';
  const sections = [
    ['assignments', 'Assignments'],
    ['announcements', 'Announcements'],
    ['schedule', 'Schedule'],
    ...(lecturer ? [['attendance', 'Attendance'], ['students', 'Students']] : []),
  ];
  const requestedSection = searchParams.get('section');
  const activeSection = sections.some(([key]) => key === requestedSection) ? requestedSection : 'assignments';
  return <section className="course-workspace-page"><Link className="course-return" to="/courses"><ArrowLeft size={16} aria-hidden="true" />All courses</Link><header className="course-workspace-heading page-banner course-banner"><div className="course-title-mark"><BookOpen size={22} aria-hidden="true" /></div><div className="course-title-copy"><span>{course.courseCode}</span><h1>{course.courseTitle}</h1><dl><div><dt><CalendarDays size={14} aria-hidden="true" />Session</dt><dd>{course.academicSession} · {course.semester === 'FIRST' ? 'First' : 'Second'} semester</dd></div><div><dt><Scale size={14} aria-hidden="true" />Credit units</dt><dd>{course.creditUnits} {course.creditUnits === 1 ? 'unit' : 'units'}</dd></div></dl></div>{lecturer && <div className="course-heading-actions"><button className="secondary" disabled={busy} onClick={() => setEditing(true)}><Pencil size={16} aria-hidden="true" />Edit course</button><button className="secondary course-archive" disabled={busy} onClick={() => { setError(''); setArchiving(true); }}><Archive size={16} aria-hidden="true" />Archive</button></div>}</header>
    {archiving && <ConfirmDialog title="Archive course" description="Archive this course? It will leave active course lists and retain its records." confirmLabel="Archive course" icon={Archive} onConfirm={archive} onClose={() => { if (!busy) { setError(''); setArchiving(false); } }} busy={busy} error={error} />}
    {editing && <CourseForm initial={course} onCancel={() => setEditing(false)} onSave={async (data) => { const result = await coursesApi.update(token, id, data); setCourse(result.course); setEditing(false); }} />}
    <nav className="course-navigation" aria-label="Course sections">
      {sections.map(([key, label]) => <Link key={key} to={`?section=${key}`} aria-current={activeSection === key ? 'page' : undefined}>{label}</Link>)}
    </nav>
    <div className="course-workspace">
      {activeSection === 'assignments' && <CourseAssignments courseId={id} />}
      {activeSection === 'announcements' && <Announcements courseId={id} />}
      {activeSection === 'attendance' && lecturer && <CourseAttendance courseId={id} />}
      {activeSection === 'schedule' && <CourseSchedules courseId={id} />}
      {activeSection === 'students' && lecturer && <EnrolmentPanel token={token} courseId={id} />}
    </div>
  </section>;
}

export function CourseDetailsPage() {
  const { id } = useParams();
  return <CourseDetails key={id} id={id} />;
}
