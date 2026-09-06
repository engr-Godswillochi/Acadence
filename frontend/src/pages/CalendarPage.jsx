import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';
import { schedulesApi } from '../features/schedules/schedules.api.js';
import { assignmentsApi } from '../features/assignments/assignments.api.js';
import { calendarTimezone, localDateKey, shiftWeek, weekDates } from '../features/schedules/calendar.utils.js';

export function CalendarPage() {
  const { token, logout } = useAuth();
  const [date, setDate] = useState(() => localDateKey(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([schedulesApi.my(token, controller.signal), assignmentsApi.my(token, controller.signal)]).then(([schedules, assignments]) => setData({ ...schedules, ...assignments })).catch((failure) => {
      if (!controller.signal.aborted) { if (failure.status === 401) logout(); else setError(failure.message); }
    });
    return () => controller.abort();
  }, [token, logout, revision]);
  const days = weekDates(date);
  return <section><div className="page-heading"><div><p className="eyebrow">Africa/Lagos (WAT)</p><h1 className="page-title">Academic calendar</h1></div><button className="secondary" onClick={() => { setError(''); setRevision((value) => value + 1); }}>Refresh calendar</button></div>
    <div className="actions"><button className="secondary" onClick={() => setDate(shiftWeek(date, -1))}>Previous week</button><button className="secondary" onClick={() => setDate(localDateKey(new Date()))}>This week</button><button className="secondary" onClick={() => setDate(shiftWeek(date, 1))}>Next week</button></div>
    <h2>{days[0].date} – {days[6].date}</h2>
    {error ? <p role="alert">{error} Use Refresh calendar to retry.</p> : !data ? <p role="status">Loading calendar…</p> : <div className="calendar-week">{days.map(({ day, date: dayDate }) => {
      const classes = data.schedules.filter((item) => item.dayOfWeek === day);
      const deadlines = data.assignments.filter((item) => localDateKey(item.deadline) === dayDate).sort((a, b) => a.deadline.localeCompare(b.deadline));
      return <section className="calendar-day" key={dayDate}><h3>{day} <time dateTime={dayDate}>{dayDate.slice(5)}</time></h3>{!classes.length && !deadlines.length && <p className="muted">No events</p>}
        {classes.map((item) => <article className="calendar-event" key={item.scheduleId}><p className="eyebrow">Class · {item.startTime}–{item.endTime}</p><Link to={`/courses/${item.courseId}`}>{item.courseCode}</Link><p>{item.venue}</p></article>)}
        {deadlines.map((item) => <article className="calendar-event deadline-event" key={item.assignmentId}><p className="eyebrow">Deadline · {new Date(item.deadline).toLocaleTimeString('en-GB', { timeZone: calendarTimezone, hour: '2-digit', minute: '2-digit' })}</p><Link to="/assignments">{item.title}</Link><p>{item.courseCode} · {item.status === 'COMPLETED' ? 'Completed' : 'Pending'}</p></article>)}
      </section>;
    })}</div>}
  </section>;
}
