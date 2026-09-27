import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, ChevronRight, ClipboardList, Clock3, Fingerprint, Link2, MapPin, Plus, Scale } from 'lucide-react';
import { coursesApi } from '../features/courses/courses.api.js';
import { CourseForm } from '../features/courses/CourseForm.jsx';
import { useNotifications } from '../features/notifications/notification.context.js';
import { schedulesApi } from '../features/schedules/schedules.api.js';
import { nextSession, weekSpan } from '../features/schedules/teaching-week.js';
import { academicHour, academicWeekday, formatAcademicDateOnly } from '../utils/date.js';

function greeting() {
  const hour = academicHour();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(name) {
  return name?.trim().split(/\s+/)[0] || 'there';
}

function plural(count, singular, many) {
  return `${count} ${count === 1 ? singular : many}`;
}

// Everything here is counted from the courses the API actually returns, so the
// banner can never claim a load the lecturer does not carry.
function deskSummary(list) {
  if (!list.length) return 'No courses on your desk yet. Everything else follows your first course.';
  const credits = list.reduce((total, course) => total + Number(course.creditUnits || 0), 0);
  const sessions = [...new Set(list.map((course) => course.academicSession).filter(Boolean))].sort().reverse();
  const parts = [plural(list.length, 'course', 'courses')];
  if (credits) parts.push(plural(credits, 'credit unit', 'credit units'));
  if (sessions.length === 1) parts.push(`${sessions[0]} session`);
  else if (sessions.length > 1) parts.push(plural(sessions.length, 'session', 'sessions'));
  return `${parts.join(' · ')}.`;
}

export function LecturerDashboard({ token, user, logout }) {
  const notifications = useNotifications();
  const [courses, setCourses] = useState(null);
  const [schedules, setSchedules] = useState(null);
  const [error, setError] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    coursesApi.list(token, controller.signal).then(data => setCourses(data.courses)).catch(failure => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout(); else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, logout, revision]);

  // The timetable is fetched separately so a schedule failure never takes the
  // course list down with it — a lecturer can still reach their courses.
  useEffect(() => {
    const controller = new AbortController();
    schedulesApi.teaching(token, controller.signal).then(data => { setSchedules(data.schedules); setScheduleError(''); }).catch(failure => {
      if (controller.signal.aborted) return;
      setSchedules([]);
      setScheduleError(failure.message);
    });
    return () => controller.abort();
  }, [token, revision]);

  const week = useMemo(() => (schedules ? { upcoming: nextSession(schedules), days: weekSpan(schedules) } : null), [schedules]);
  const today = academicWeekday();
  const creditUnits = (courses ?? []).reduce((total, course) => total + Number(course.creditUnits || 0), 0);
  const teachingDays = new Set((schedules ?? []).map((item) => item.dayOfWeek)).size;

  return <section className={`teaching-desk${courses?.length === 0 ? ' is-empty' : ''}`}>
    <header className="dashboard-intro lecturer-intro">
      <div className="dashboard-intro-copy"><h1>{greeting()}, {firstName(user.fullName)}.</h1>{courses ? <p>{deskSummary(courses)}</p> : null}{courses?.length ? <ul className="desk-course-codes" aria-label="Courses on your desk">{courses.map((course) => <li key={course.courseId}>{course.courseCode}</li>)}</ul> : null}</div>
      <div className="desk-date"><CalendarDays size={18} aria-hidden="true" /><span>{formatAcademicDateOnly(new Date())}</span><Link to="/notifications">{notifications?.unreadCount ? `${notifications.unreadCount} unread` : 'Updates'} <ArrowRight size={14} aria-hidden="true" /></Link></div>
    </header>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision(value => value + 1); }}>Try again</button></div> : !courses ? <p role="status">Loading your courses…</p> : <>
      {courses.length > 0 && <dl className="desk-snapshot" aria-label="Teaching overview">
        <div><dt><BookOpen size={16} aria-hidden="true" />Courses</dt><dd>{courses.length}</dd><p>Active this semester</p></div>
        <div><dt><Clock3 size={16} aria-hidden="true" />Sessions</dt><dd>{schedules ? schedules.length : '—'}</dd><p>Classes per week</p></div>
        <div><dt><CalendarDays size={16} aria-hidden="true" />Teaching days</dt><dd>{schedules ? teachingDays : '—'}</dd><p>{teachingDays === 1 ? 'Day with classes' : 'Days with classes'}</p></div>
        <div><dt><Scale size={16} aria-hidden="true" />Credit units</dt><dd>{creditUnits}</dd><p>Across your courses</p></div>
      </dl>}
      {courses.length > 0 && <section className="desk-teaching-week" aria-labelledby="teaching-week-heading">
        <div className="desk-section-heading"><div><CalendarDays size={19} aria-hidden="true" /><h2 id="teaching-week-heading">Your teaching week</h2>{schedules?.length ? <span className="count-label">{schedules.length}</span> : null}</div>{week?.upcoming ? <p className="desk-week-upcoming"><Clock3 size={15} aria-hidden="true" />Next class {week.upcoming.when.toLowerCase()} at {week.upcoming.item.startTime}</p> : null}</div>
        {scheduleError ? <p role="alert" className="desk-week-note">{scheduleError} Retry from the navigation to try again.</p> : !schedules ? <p role="status" className="desk-week-note">Loading your timetable…</p> : !schedules.length ? <p className="desk-week-note">No class times yet. Open a course and add its timetable to see your week here.</p> : <>
          {week.upcoming && <article className="desk-next-class">
            <div className="desk-next-when"><p className="eyebrow">Next class</p><strong>{week.upcoming.when}</strong><time dateTime={week.upcoming.item.startTime}>{week.upcoming.item.startTime}–{week.upcoming.item.endTime} <i>WAT</i></time></div>
            <div className="desk-next-what"><p className="eyebrow">{week.upcoming.item.courseCode}</p><h3>{week.upcoming.item.courseTitle}</h3><p className="desk-next-venue"><MapPin size={14} aria-hidden="true" />{week.upcoming.item.venue}</p></div>
            <Link className="button-link" to={`/courses/${week.upcoming.item.courseId}?section=schedule`}>Open schedule <ArrowRight size={16} aria-hidden="true" /></Link>
          </article>}
          <div className="teaching-week" style={{ '--day-count': week.days.length }}>{week.days.map((day) => {
            const sessions = schedules.filter((item) => item.dayOfWeek === day);
            const isToday = day === today;
            return <section className={`teaching-day${isToday ? ' is-today' : ''}`} key={day}>
              <h3><span>{day.slice(0, 3)}</span>{isToday ? <em>Today</em> : null}</h3>
              {sessions.length ? sessions.map((item) => <article className="teaching-event" key={item.scheduleId}><span className="teaching-event-time">{item.startTime}–{item.endTime}</span><Link to={`/courses/${item.courseId}?section=schedule`}>{item.courseCode}</Link><p><MapPin size={13} aria-hidden="true" />{item.venue}</p></article>) : <p className="teaching-empty">No class</p>}
            </section>;
          })}</div>
        </>}
      </section>}
      {courses.length > 0 && <div className="desk-section-heading"><div><BookOpen size={19} aria-hidden="true" /><h2>My courses</h2><span className="count-label">{courses.length}</span></div>{!creating && <button onClick={() => setCreating(true)}><Plus size={17} aria-hidden="true" />New course</button>}</div>}
      {creating ? <CourseForm onCancel={() => setCreating(false)} onSave={async input => { await coursesApi.create(token, input); setCreating(false); setRevision(value => value + 1); }} /> : !courses.length ? <div className="course-onboarding">
        <div className="onboarding-copy"><h2>Start with your<br />first course.</h2><p>Bring your students, coursework, and class schedule together. Add your first course to get started.</p><button onClick={() => setCreating(true)}><Plus size={18} aria-hidden="true" />Create your first course</button><small>Just your course details. Everything else can follow.</small></div>
        <div className="onboarding-guide"><p className="guide-caption">YOUR COURSE, ORGANIZED</p><div className="guide-row"><span className="guide-icon"><BookOpen aria-hidden="true" /></span><div><strong>Make it yours</strong><p>Give your course a name and semester.</p></div><span className="guide-number">01</span></div><div className="guide-row"><span className="guide-icon"><Link2 aria-hidden="true" /></span><div><strong>Bring students in</strong><p>Share an enrolment link, or add them by email.</p></div><span className="guide-number">02</span></div><div className="guide-row"><span className="guide-icon"><CalendarDays aria-hidden="true" /></span><div><strong>Plan the week</strong><p>Add assignments and your class timetable.</p></div><span className="guide-number">03</span></div><div className="guide-footer"><Fingerprint size={18} aria-hidden="true" /><span>Fingerprint attendance, when your class is ready.</span></div></div>
      </div> : <div className="teaching-course-list">{courses.map(course => <article key={course.courseId}><div className="course-monogram" aria-hidden="true"><BookOpen size={24} /></div><div className="teaching-course-title"><span>{course.courseCode} <i>·</i> {course.creditUnits} credits</span><h3><Link to={`/courses/${course.courseId}`}>{course.courseTitle}</Link></h3><p>{course.academicSession} · {course.semester === 'FIRST' ? 'First' : 'Second'} semester</p></div><div className="course-shortcuts"><Link to={`/courses/${course.courseId}?section=assignments`}><ClipboardList size={17} aria-hidden="true" />Assignments</Link><Link to={`/courses/${course.courseId}?section=attendance`}><Fingerprint size={17} aria-hidden="true" />Attendance</Link></div><Link className="course-enter" aria-label={`Open ${course.courseTitle}`} to={`/courses/${course.courseId}`}><ArrowUpRight size={22} aria-hidden="true" /></Link></article>)}</div>}
      {courses.length > 0 && <div className="desk-footnote"><Link to="/courses">Course directory <ChevronRight size={15} aria-hidden="true" /></Link></div>}
    </>}
  </section>;
}
