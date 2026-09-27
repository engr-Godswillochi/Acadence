import { LecturerDashboard } from './LecturerDashboard.jsx';
import { AdminDashboard } from './AdminDashboard.jsx';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Clock3, Fingerprint, Megaphone } from 'lucide-react';

import { useAuth } from '../features/auth/useAuth.js';
import { assignmentsApi } from '../features/assignments/assignments.api.js';
import { attendanceApi } from '../features/attendance/attendance.api.js';
import { coursesApi } from '../features/courses/courses.api.js';
import { useNotifications } from '../features/notifications/notification.context.js';
import { schedulesApi } from '../features/schedules/schedules.api.js';
import { academicHour, academicWeekday, compareDeadlines, formatAcademicDate, formatAcademicLongDate } from '../utils/date.js';

function greeting() {
  const hour = academicHour();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(name) {
  return name?.trim().split(/\s+/)[0] || 'there';
}

function formatDeadline(value) {
  return formatAcademicDate(value);
}

function formatWeekday() {
  return academicWeekday();
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
    const nextTask = [...pending].sort((left, right) => compareDeadlines(left.deadline, right.deadline))[0];
    const completed = workspace.assignments.filter((item) => item.status === 'COMPLETED').length;
    const attendance = workspace.summaries.length ? Math.round(workspace.summaries.reduce((total, item) => total + item.percentage, 0) / workspace.summaries.length) : null;
    return { pending, nextTask, completed, attendance, todayClasses: workspace.schedules.filter((item) => item.dayOfWeek === formatWeekday()).sort((left, right) => left.startTime.localeCompare(right.startTime)) };
  }, [workspace]);

  return <section className="dashboard-view">
    <header className="dashboard-intro student-intro">
      <div className="dashboard-intro-copy"><h1>{greeting()}, {firstName(user.fullName)}.</h1><p>Classes, deadlines, and attendance—at a glance.</p></div>
      <div className="student-day"><CalendarDays size={18} aria-hidden="true" /><time>{formatAcademicLongDate()}</time><Link to="/notifications">{notifications?.unreadCount ? `${notifications.unreadCount} unread` : 'Updates'} <ArrowRight size={14} aria-hidden="true" /></Link></div>
    </header>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></div> : !overview ? <p role="status">Preparing your academic overview…</p> : <>
      <dl className="student-snapshot" aria-label="Academic overview">
        <div><dt><BookOpen size={16} aria-hidden="true" />Courses</dt><dd>{workspace.courses.length}</dd><p>Active this semester</p></div>
        <div><dt><ClipboardList size={16} aria-hidden="true" />Tasks due</dt><dd>{overview.pending.length}</dd><p>{overview.pending.filter((item) => item.isOverdue).length ? `${overview.pending.filter((item) => item.isOverdue).length} overdue` : 'Nothing overdue'}</p></div>
        <div><dt><CheckCircle2 size={16} aria-hidden="true" />Completed</dt><dd>{overview.completed}</dd><p>{workspace.assignments.length ? `${Math.round((overview.completed / workspace.assignments.length) * 100)}% of assignments` : 'No assignments yet'}</p></div>
        <div><dt><Fingerprint size={16} aria-hidden="true" />Attendance</dt><dd>{overview.attendance === null ? '—' : `${overview.attendance}%`}</dd><p>{overview.attendance === null ? 'No closed sessions yet' : 'Across your courses'}</p></div>
      </dl>
      <div className="student-main-grid">
        <article className="deadline-note"><header><div><Clock3 size={18} aria-hidden="true" /><h2>Next deadline</h2></div><Link to="/assignments">All assignments <ArrowRight size={14} aria-hidden="true" /></Link></header>{overview.nextTask ? <><span className="deadline-course">{overview.nextTask.courseCode} · {overview.nextTask.priorityLabel.toLowerCase()} priority</span><h3>{overview.nextTask.title}</h3><p>{overview.nextTask.description || 'Open assignments to review this task.'}</p><footer><time>Due {formatDeadline(overview.nextTask.deadline)}</time><Link className="button-link" to={`/assignments?assignment=${encodeURIComponent(overview.nextTask.assignmentId)}`}>View assignment <ArrowRight size={16} aria-hidden="true" /></Link></footer></> : <><h3>All caught up.</h3><p>You have no pending assignments. New coursework will appear here.</p><Link className="button-link" to="/courses">View courses <ArrowRight size={16} aria-hidden="true" /></Link></>}</article>
        <section className="today-agenda"><header><div><CalendarDays size={18} aria-hidden="true" /><h2>Today’s timetable</h2></div><Link to="/calendar">Calendar <ArrowRight size={14} aria-hidden="true" /></Link></header>{overview.todayClasses.length ? <ol>{overview.todayClasses.map((item) => <li key={item.scheduleId}><time>{item.startTime}–{item.endTime}</time><div><strong>{item.courseCode}</strong><span>{item.venue}</span></div></li>)}</ol> : <div className="quiet-note"><strong>No classes today.</strong><span>Check your calendar for the rest of the week.</span></div>}</section>
      </div>
      <div className="student-lower-grid">
        <section className="course-register"><header><div><BookOpen size={18} aria-hidden="true" /><h2>Your courses</h2></div><Link to="/courses">Course directory <ArrowRight size={14} aria-hidden="true" /></Link></header>{workspace.courses.length ? <ul>{workspace.courses.slice(0, 4).map((course) => <li key={course.courseId}><Link to={`/courses/${course.courseId}`}><span>{course.courseCode}</span><strong>{course.courseTitle}</strong><small>{course.creditUnits} credits · {course.semester === 'FIRST' ? 'First' : 'Second'} semester</small><ArrowRight size={16} aria-hidden="true" /></Link></li>)}</ul> : <div className="quiet-note"><strong>No courses yet.</strong><span>Your lecturer can enrol you using your registered email address.</span></div>}</section>
        <aside className="week-links"><h2>For the week ahead.</h2><nav aria-label="Student workspace shortcuts"><Link to="/calendar"><CalendarDays size={17} aria-hidden="true" />Weekly calendar <ArrowRight size={15} aria-hidden="true" /></Link><Link to="/attendance"><Fingerprint size={17} aria-hidden="true" />Attendance record <ArrowRight size={15} aria-hidden="true" /></Link><Link to="/announcements"><Megaphone size={17} aria-hidden="true" />Announcements <ArrowRight size={15} aria-hidden="true" /></Link></nav></aside>
      </div>
    </>}
  </section>;
}

export function DashboardPage() {
  const { token, user, logout } = useAuth();
  if (user.role === 'STUDENT') return <StudentDashboard token={token} user={user} logout={logout} />;
  if (user.role === 'LECTURER') return <LecturerDashboard token={token} user={user} logout={logout} />;
  return <AdminDashboard />;
}
