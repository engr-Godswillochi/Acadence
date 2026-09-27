import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Fingerprint,
  Link2,
  Megaphone,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { BrandMark } from '../components/brand/BrandMark.jsx';
import { useAuth } from '../features/auth/useAuth.js';
import { localDateKey, shiftWeek, weekDates } from '../features/schedules/calendar.utils.js';
import { formatAcademicDay } from '../utils/date.js';

const ROLES = [
  { key: 'STUDENT', label: 'Student' },
  { key: 'LECTURER', label: 'Lecturer' },
];

const WEEKS = 3;

// Illustrative content for the preview. The shape matches what each dashboard
// really renders; the records themselves are a worked example, and the panel says
// so rather than passing them off as a real account.
const STUDENT_WEEKS = [
  [
    { course: 'CS 214', title: 'Data Structures', kind: 'Assignment', day: 1, due: '23:59' },
    { course: 'PS 101', title: 'Introduction to Psychology', kind: 'Quiz', day: 3, due: '12:00' },
    { course: 'MA 202', title: 'Probability & Statistics', kind: 'Assignment', day: 4, due: '23:59' },
  ],
  [
    { course: 'CS 214', title: 'Data Structures', kind: 'Lab report', day: 2, due: '16:00' },
    { course: 'MA 202', title: 'Probability & Statistics', kind: 'Quiz', day: 4, due: '09:30' },
  ],
  [
    { course: 'PS 101', title: 'Introduction to Psychology', kind: 'Essay', day: 0, due: '23:59' },
    { course: 'CS 214', title: 'Data Structures', kind: 'Assignment', day: 2, due: '23:59' },
    { course: 'MA 202', title: 'Probability & Statistics', kind: 'Revision', day: 4, due: '18:00' },
  ],
];

const LECTURER_WEEK = [
  { day: 'Monday', start: '09:00', end: '10:30', course: 'CS 214', title: 'Data Structures', room: 'LT 4' },
  { day: 'Monday', start: '14:00', end: '16:00', course: 'CS 214', title: 'Data Structures', room: 'Lab 2' },
  { day: 'Tuesday', start: '11:00', end: '12:30', course: 'MA 202', title: 'Probability & Statistics', room: 'LT 1' },
  { day: 'Wednesday', start: '08:00', end: '09:30', course: 'PS 101', title: 'Introduction to Psychology', room: 'LT 7' },
  { day: 'Thursday', start: '10:00', end: '13:00', course: 'CS 214', title: 'Data Structures', room: 'Lab 2' },
  { day: 'Friday', start: '15:00', end: '16:30', course: 'MA 202', title: 'Probability & Statistics', room: 'LT 1' },
];

const FEATURES = [
  { icon: BookOpen, title: 'Course work stays with the course', body: 'Assignments, announcements, schedules and the class roster live together, so an update has one dependable place to be found.' },
  { icon: ClipboardCheck, title: 'Students see what needs attention', body: 'Pending work is ordered by deadline and shown beside the week’s classes, course notices and completed tasks.' },
  { icon: UsersRound, title: 'Lecturers run the class from one desk', body: 'Create a course, share its enrolment link, publish coursework, plan the timetable and follow attendance without switching tools.' },
  { icon: Fingerprint, title: 'Attendance remains an official record', body: 'Fingerprint devices submit presence to an open class session. Percentages use closed sessions, not browser check-ins.' },
];

const COURSE_FLOW = [
  { icon: Megaphone, title: 'A lecturer publishes once', body: 'The assignment, announcement or schedule change is attached to the course that owns it.' },
  { icon: Bell, title: 'Students see the same update', body: 'It appears in the course workspace, notification feed and the student’s relevant weekly view.' },
  { icon: ShieldCheck, title: 'The record stays accountable', body: 'Course membership, closed attendance sessions and timestamps keep the academic trail understandable.' },
];

const shortDay = (day) => day.slice(0, 3);

function dayNumber(isoDate) {
  return Number(isoDate.slice(8, 10));
}

export function LandingPage() {
  const { user } = useAuth();
  const [role, setRole] = useState('STUDENT');
  const [weekOffset, setWeekOffset] = useState(0);
  const [day, setDay] = useState('Monday');
  const tabs = useRef({});

  // The stepper walks whole weeks forward from the current one, so the preview
  // always reads as a real calendar rather than a fixed mock-up.
  const weekKey = shiftWeek(localDateKey(new Date()), weekOffset);
  const days = weekDates(weekKey);
  const range = `${formatAcademicDay(days[0].date)} – ${formatAcademicDay(days[4].date)}`;
  const deadlines = STUDENT_WEEKS[weekOffset];
  const sessions = LECTURER_WEEK.filter((item) => item.day === day);
  const canStepBack = weekOffset > 0;
  const canStepForward = weekOffset < WEEKS - 1;

  function onTabKey(event, index) {
    const last = ROLES.length - 1;
    let next = null;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    const key = ROLES[next].key;
    setRole(key);
    tabs.current[key]?.focus();
  }

  return (
    <div className="landing">
      <a className="skip-link" href="#landing-main">Skip to content</a>

      <header className="landing-header">
        <Link className="brand landing-brand" to="/" aria-label="Acadence home">
          <BrandMark className="brand-mark" />
          <span className="brand-copy"><strong>Acadence</strong><small>Campus workspace</small></span>
        </Link>
        <nav className="landing-nav" aria-label="Account">
          <Link className="button-link secondary" to="/login">Sign in</Link>
          <Link className="button-link" to="/register">Create account</Link>
        </nav>
      </header>

      <main id="landing-main" className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1>Your academic week, finally in order.</h1>
            <p>
              Acadence brings assignments, class times, course announcements and official
              attendance into one dependable workspace. Students know what needs attention;
              lecturers know what the class sees.
            </p>
            <ul className="landing-hero-points" aria-label="Acadence at a glance">
              <li><ClipboardCheck size={17} aria-hidden="true" />Deadlines ordered by what is due next</li>
              <li><CalendarDays size={17} aria-hidden="true" />Classes and coursework in the same week</li>
              <li><Link2 size={17} aria-hidden="true" />Course enrolment through a lecturer’s link</li>
            </ul>
            <div className="landing-actions">
              {user
                ? <Link className="button-link" to="/dashboard">Open your dashboard <ArrowRight size={17} aria-hidden="true" /></Link>
                : <Link className="button-link" to="/register">Create your account <ArrowRight size={17} aria-hidden="true" /></Link>}
              {!user && <Link className="button-link secondary" to="/login">Sign in</Link>}
            </div>
            <p className="landing-standing">Designed around the Africa/Lagos academic week.</p>
          </div>

          <figure className="landing-hero-media">
            <img
              src="/images/campus-week.svg"
              alt="A visual academic week with course sessions, deadlines and announcements organised in one view."
            />
            <figcaption>
              <strong>One week. One dependable view.</strong>
              <span>Course activity stays connected instead of disappearing across separate tools.</span>
            </figcaption>
          </figure>
        </section>

        <section className="landing-preview-section" aria-labelledby="preview-heading">
          <div className="preview-intro">
            <h2 id="preview-heading">See the week before you sign up.</h2>
            <p>Choose a role and move through the weeks. This is a worked example, not a live account.</p>
          </div>

          <div className="landing-preview">

            <div className="preview-frame">
              <div className="preview-controls">
                <div className="preview-tabs" role="tablist" aria-label="Preview a role">
                  {ROLES.map((item, index) => (
                    <button
                      key={item.key}
                      ref={(node) => { tabs.current[item.key] = node; }}
                      type="button"
                      role="tab"
                      id={`preview-tab-${item.key.toLowerCase()}`}
                      aria-selected={role === item.key}
                      aria-controls={`preview-panel-${item.key.toLowerCase()}`}
                      tabIndex={role === item.key ? 0 : -1}
                      onClick={() => setRole(item.key)}
                      onKeyDown={(event) => onTabKey(event, index)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="preview-week-step" role="group" aria-label="Move between weeks">
                  <button type="button" onClick={() => setWeekOffset((value) => value - 1)} disabled={!canStepBack} aria-label="Previous week">
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <span aria-live="polite">Example week {weekOffset + 1} of {WEEKS}</span>
                  <button type="button" onClick={() => setWeekOffset((value) => value + 1)} disabled={!canStepForward} aria-label="Next week">
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className="preview-range">{range}</p>

              <div role="tabpanel" id="preview-panel-student" aria-labelledby="preview-tab-student" hidden={role !== 'STUDENT'} tabIndex={0}>
                {deadlines.length ? (
                  <ul className="preview-deadlines">
                    {deadlines.map((item) => (
                      <li key={`${item.course}-${item.kind}`}>
                        <span className="preview-when">{shortDay(days[item.day].day)} {dayNumber(days[item.day].date)}</span>
                        <span className="preview-what"><strong>{item.title}</strong><small>{item.course} · {item.kind}</small></span>
                        <span className="preview-due">Deadline (WAT)<strong>{item.due}</strong></span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="preview-empty">Nothing due this week.</p>}
                <p className="preview-foot">The first row is the next thing to hand in.</p>
              </div>

              <div role="tabpanel" id="preview-panel-lecturer" aria-labelledby="preview-tab-lecturer" hidden={role !== 'LECTURER'} tabIndex={0}>
                <div className="preview-days" role="group" aria-label="Choose a teaching day">
                  {days.slice(0, 5).map((item) => (
                    <button key={item.day} type="button" aria-pressed={day === item.day} onClick={() => setDay(item.day)}>
                      {shortDay(item.day)}<small>{dayNumber(item.date)}</small>
                    </button>
                  ))}
                </div>
                {sessions.length ? (
                  <ul className="preview-sessions">
                    {sessions.map((item) => (
                      <li key={`${item.course}-${item.start}`}>
                        <span className="preview-when">{item.start}–{item.end}</span>
                        <span className="preview-what"><strong>{item.title}</strong><small>{item.course} · {item.room}</small></span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="preview-empty">No classes scheduled on {day}.</p>}
                <p className="preview-foot">The teaching desk opens on the next class and the full recurring week.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-flow" aria-labelledby="flow-heading">
          <header>
            <h2 id="flow-heading">One update should reach the whole class.</h2>
            <p>Acadence keeps the academic trail connected from the lecturer’s course desk to the student’s week.</p>
          </header>
          <ol>
            {COURSE_FLOW.map((item) => (
              <li key={item.title}>
                <span aria-hidden="true"><item.icon size={21} /></span>
                <div><h3>{item.title}</h3><p>{item.body}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-features" aria-labelledby="features-heading">
          <header>
            <h2 id="features-heading">Built around the work that actually happens.</h2>
            <p>No prediction engine and no black box—just clear course information, transparent task ordering and attendance tied to real sessions.</p>
          </header>
          <ul>
            {FEATURES.map((item) => (
              <li key={item.title}>
                <span className="feature-icon" aria-hidden="true"><item.icon size={20} /></span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-cta">
          <div>
            <CheckCircle2 size={24} aria-hidden="true" />
            <h2>Start with the work already in front of you.</h2>
            <p>Create a student or lecturer account. Your dashboard will open on the courses, deadlines and class activity that belong to your role.</p>
          </div>
          <div className="landing-actions">
            {user
              ? <Link className="button-link" to="/dashboard">Open your dashboard <ArrowRight size={17} aria-hidden="true" /></Link>
              : <>
                <Link className="button-link" to="/register">Create your account <ArrowRight size={17} aria-hidden="true" /></Link>
                <Link className="button-link secondary" to="/login">Sign in</Link>
              </>}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span className="landing-footer-brand"><BrandMark className="brand-mark" /> Acadence</span>
        <p>Courses, coursework, teaching schedules and official attendance—kept together for the academic week.</p>
      </footer>
    </div>
  );
}
