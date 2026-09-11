import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../features/auth/useAuth.js';
import { assignmentsApi } from '../features/assignments/assignments.api.js';
import { attendanceApi } from '../features/attendance/attendance.api.js';
import { coursesApi } from '../features/courses/courses.api.js';
import { useNotifications } from '../features/notifications/notification.context.js';
import { schedulesApi } from '../features/schedules/schedules.api.js';
import { calendarTimezone } from '../features/schedules/calendar.utils.js';

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: calendarTimezone, hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(name) {
  return name?.trim().split(/\s+/)[0] || 'there';
}

function formatDeadline(value) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: calendarTimezone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatWeekday() {
  return new Intl.DateTimeFormat('en-GB', { timeZone: calendarTimezone, weekday: 'long' }).format(new Date()).toUpperCase();
}

function StudentDashboard({ token, user, logout }) {
  const notifications = useNotifications();
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      coursesApi.list(token, controller.signal),
      assignmentsApi.my(token, controller.signal),
      schedulesApi.my(token, controller.signal),
      attendanceApi.summary(token, controller.signal),
    ]).then(([courseData, assignmentData, scheduleData, attendanceData]) => {
      setWorkspace({ courses: courseData.courses, assignments: assignmentData.assignments, schedules: scheduleData.schedules, summaries: attendanceData.summaries });
    }).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout(); else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, logout, revision]);

  const overview = useMemo(() => {
    if (!workspace) return null;
    const pending = workspace.assignments.filter((item) => item.status !== 'COMPLETED');
    const nextTask = [...pending].sort((left, right) => new Date(left.deadline) - new Date(right.deadline))[0];
    const completed = workspace.assignments.filter((item) => item.status === 'COMPLETED').length;
    const attendance = workspace.summaries.length ? Math.round(workspace.summaries.reduce((total, item) => total + item.percentage, 0) / workspace.summaries.length) : null;
    return { pending, nextTask, completed, attendance, todayClasses: workspace.schedules.filter((item) => item.dayOfWeek === formatWeekday()).sort((left, right) => left.startTime.localeCompare(right.startTime)) };
  }, [workspace]);

  return <section className="dashboard-view">
    <div className="dashboard-hero student-hero">
      <div><p className="eyebrow">Student workspace</p><h1>{greeting()}, {firstName(user.fullName)}.</h1><p>See what matters today, then move through your academic week with a clear plan.</p></div>
      <div className="dashboard-hero-aside"><span className="hero-label">Today</span><strong>{new Intl.DateTimeFormat('en-GB', { timeZone: calendarTimezone, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</strong><span>{notifications?.unreadCount ? `${notifications.unreadCount} unread update${notifications.unreadCount === 1 ? '' : 's'}` : 'Your workspace is up to date'}</span></div>
    </div>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></div> : !overview ? <p role="status">Preparing your academic overview…</p> : <>
      <div className="dashboard-stats" aria-label="Academic overview">
        <article><span>Enrolled courses</span><strong>{workspace.courses.length}</strong><small>Active this semester</small></article>
        <article><span>Pending tasks</span><strong>{overview.pending.length}</strong><small>{overview.pending.filter((item) => item.isOverdue).length ? 'Some need attention' : 'Keep your momentum'}</small></article>
        <article><span>Tasks completed</span><strong>{overview.completed}</strong><small>{workspace.assignments.length ? `${Math.round((overview.completed / workspace.assignments.length) * 100)}% of your workload` : 'No assignments yet'}</small></article>
        <article><span>Attendance average</span><strong>{overview.attendance === null ? '—' : `${overview.attendance}%`}</strong><small>{overview.attendance === null ? 'No closed sessions yet' : 'Across closed sessions'}</small></article>
      </div>
      <div className="dashboard-grid">
        <article className="dashboard-focus"><div className="section-kicker"><span>Focus next</span><Link to="/assignments">View all assignments</Link></div>{overview.nextTask ? <><p className="eyebrow">{overview.nextTask.courseCode} · {overview.nextTask.priorityLabel.toLowerCase()} priority</p><h2>{overview.nextTask.title}</h2><p>{overview.nextTask.description || 'Review the assignment details and make time for a first pass.'}</p><div className="focus-footer"><span>Due {formatDeadline(overview.nextTask.deadline)}</span><Link className="button-link" to="/assignments">Plan this task <span aria-hidden="true">→</span></Link></div></> : <><h2>Your task list is clear.</h2><p>New coursework from your lecturers will appear here as soon as it is published.</p><Link className="button-link" to="/courses">Browse your courses <span aria-hidden="true">→</span></Link></>}</article>
        <article className="dashboard-today"><div className="section-kicker"><span>Today’s timetable</span><Link to="/calendar">Open calendar</Link></div>{overview.todayClasses.length ? <ol>{overview.todayClasses.map((item) => <li key={item.scheduleId}><time>{item.startTime}</time><div><strong>{item.courseCode}</strong><span>{item.venue}</span></div><span className="schedule-duration">{item.endTime}</span></li>)}</ol> : <div className="quiet-note"><strong>No classes scheduled today.</strong><span>Use the space to make progress on your next task.</span></div>}</article>
      </div>
      <div className="dashboard-lower-grid">
        <article className="dashboard-courses"><div className="section-kicker"><span>Your courses</span><Link to="/courses">Course directory</Link></div>{workspace.courses.length ? <ul>{workspace.courses.slice(0, 4).map((course) => <li key={course.courseId}><Link to={`/courses/${course.courseId}`}><span>{course.courseCode}</span><strong>{course.courseTitle}</strong><small>{course.creditUnits} credits · {course.semester === 'FIRST' ? 'First' : 'Second'} semester</small></Link></li>)}</ul> : <div className="quiet-note"><strong>No courses yet.</strong><span>Your lecturer can enrol you using your registered email address.</span></div>}</article>
        <article className="dashboard-actions"><p className="eyebrow">Keep moving</p><h2>Open your academic tools</h2><div><Link to="/calendar">Weekly calendar <span aria-hidden="true">→</span></Link><Link to="/attendance">Attendance record <span aria-hidden="true">→</span></Link><Link to="/announcements">Course announcements <span aria-hidden="true">→</span></Link></div></article>
      </div>
    </>}
  </section>;
}

function LecturerDashboard({ token, user, logout }) {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    coursesApi.list(token, controller.signal).then((data) => setCourses(data.courses)).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout(); else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, logout, revision]);
  const totalCredits = courses?.reduce((total, course) => total + course.creditUnits, 0) ?? 0;
  return <section className="dashboard-view">
    <div className="dashboard-hero lecturer-hero"><div><p className="eyebrow">Teaching workspace</p><h1>{greeting()}, {firstName(user.fullName)}.</h1><p>Keep each course organised, communicate with students, and run your academic activity from one considered workspace.</p></div><div className="dashboard-hero-aside"><span className="hero-label">Teaching term</span><strong>{courses?.[0]?.academicSession || 'Current session'}</strong><span>{courses?.length || 0} active course{courses?.length === 1 ? '' : 's'} in your workspace</span></div></div>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></div> : !courses ? <p role="status">Preparing your teaching overview…</p> : <>
      <div className="dashboard-stats lecturer-stats"><article><span>Active courses</span><strong>{courses.length}</strong><small>Teaching this session</small></article><article><span>Credit units</span><strong>{totalCredits}</strong><small>Across active courses</small></article><article><span>Course workspace</span><strong>{courses.length ? 'Ready' : 'Start'}</strong><small>{courses.length ? 'Assignments, schedules and attendance' : 'Create your first course'}</small></article></div>
      <div className="dashboard-grid lecturer-grid"><article className="dashboard-focus"><div className="section-kicker"><span>Teaching at a glance</span><Link to="/courses">Manage courses</Link></div><h2>{courses.length ? 'Your course spaces are ready.' : 'Start with your first course.'}</h2><p>{courses.length ? 'Open a course to publish assignments, share announcements, build the timetable, enrol students, and run attendance sessions.' : 'Create a course, then use its workspace to bring coursework, announcements, schedules, and attendance together.'}</p><Link className="button-link" to="/courses">{courses.length ? 'Open course management' : 'Create a course'} <span aria-hidden="true">→</span></Link></article><article className="dashboard-actions"><p className="eyebrow">Teaching tools</p><h2>Build a clear course rhythm</h2><div><Link to="/courses">Publish coursework <span aria-hidden="true">→</span></Link><Link to="/courses">Set class schedules <span aria-hidden="true">→</span></Link><Link to="/courses">Open attendance <span aria-hidden="true">→</span></Link></div></article></div>
      <article className="dashboard-courses dashboard-course-directory"><div className="section-kicker"><span>Course directory</span><Link to="/courses">View all courses</Link></div>{courses.length ? <ul>{courses.map((course) => <li key={course.courseId}><Link to={`/courses/${course.courseId}`}><span>{course.courseCode}</span><strong>{course.courseTitle}</strong><small>{course.academicSession} · {course.semester === 'FIRST' ? 'First' : 'Second'} semester · {course.creditUnits} credits</small><b>Open workspace <span aria-hidden="true">→</span></b></Link></li>)}</ul> : <div className="quiet-note"><strong>No courses have been created.</strong><span>Set up your first course to begin publishing academic activity.</span></div>}</article>
    </>}
  </section>;
}

export function DashboardPage() {
  const { token, user, logout } = useAuth();
  if (user.role === 'STUDENT') return <StudentDashboard token={token} user={user} logout={logout} />;
  if (user.role === 'LECTURER') return <LecturerDashboard token={token} user={user} logout={logout} />;
  return <section className="state-panel"><p className="eyebrow">Acadence workspace</p><h1>Welcome, {firstName(user.fullName)}.</h1><p>Your account is active. Administrative workspace tools will appear here when they are available.</p></section>;
}
