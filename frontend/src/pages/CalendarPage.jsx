import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, MapPin, RefreshCw } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { schedulesApi } from '../features/schedules/schedules.api.js';
import { assignmentsApi } from '../features/assignments/assignments.api.js';
import { localDateKey, shiftWeek, weekDates } from '../features/schedules/calendar.utils.js';
import { formatAcademicDateOnly, formatAcademicDay, formatWatTime, parseDateKey } from '../utils/date.js';

export function CalendarPage() {
  const { token, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedWeek = searchParams.get('week');
  const date = parseDateKey(requestedWeek) || localDateKey(new Date());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  function updateWeek(value) {
    const next = new URLSearchParams(searchParams);
    next.set('week', value);
    setSearchParams(next);
  }

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([schedulesApi.my(token, controller.signal), assignmentsApi.my(token, controller.signal)]).then(([schedules, assignments]) => setData({ ...schedules, ...assignments })).catch((failure) => {
      if (!controller.signal.aborted) { if (failure.status === 401) logout(); else setError(failure.message); }
    });
    return () => controller.abort();
  }, [token, logout, revision]);
  const days = weekDates(date);
  return <section className="calendar-workspace"><header className="calendar-heading page-banner"><div><h1>Academic calendar</h1><p>Your classes and deadlines, shown in Africa/Lagos time.</p></div><button className="secondary" onClick={() => { setError(''); setRevision((value) => value + 1); }}><RefreshCw size={16} aria-hidden="true" />Refresh</button></header>
    <div className="calendar-toolbar"><div className="calendar-navigation"><button className="secondary" aria-label="Previous week" onClick={() => updateWeek(shiftWeek(date, -1))}><ChevronLeft size={17} aria-hidden="true" />Previous week</button><button type="button" className="calendar-today" onClick={() => updateWeek(localDateKey(new Date()))}><CalendarDays size={16} aria-hidden="true" />This week</button><button className="secondary" aria-label="Next week" onClick={() => updateWeek(shiftWeek(date, 1))}>Next week<ChevronRight size={17} aria-hidden="true" /></button></div><p className="calendar-range" aria-live="polite">{formatAcademicDateOnly(new Date(`${days[0].date}T12:00:00Z`))} <span aria-hidden="true">–</span> {formatAcademicDateOnly(new Date(`${days[6].date}T12:00:00Z`))}</p></div>
    {error ? <p role="alert">{error} Use Refresh calendar to retry.</p> : !data ? <p role="status">Loading calendar…</p> : <div className="calendar-week">{days.map(({ day, date: dayDate }) => {
      const classes = data.schedules.filter((item) => item.dayOfWeek === day);
      const deadlines = data.assignments.filter((item) => localDateKey(item.deadline) === dayDate).sort((a, b) => a.deadline.localeCompare(b.deadline));
      const today = dayDate === localDateKey(new Date());
      return <section className={`calendar-day${today ? ' is-today' : ''}`} key={dayDate}><h3><span>{day.slice(0, 3)}</span><time dateTime={dayDate}>{formatAcademicDay(new Date(`${dayDate}T12:00:00Z`))}</time></h3>{!classes.length && !deadlines.length && <p className="calendar-empty">No events planned</p>}
        {classes.map((item) => <article className="calendar-event class-event" key={item.scheduleId}><span className="calendar-event-time">{item.startTime}–{item.endTime}</span><Link to={`/courses/${item.courseId}`}>{item.courseCode}</Link><p><MapPin size={13} aria-hidden="true" />{item.venue}</p></article>)}
        {deadlines.map((item) => <article className="calendar-event deadline-event" key={item.assignmentId}><span className="calendar-event-time">Due {formatWatTime(item.deadline)} WAT</span><Link to={`/assignments?assignment=${encodeURIComponent(item.assignmentId)}`} aria-label={`Open assignment: ${item.title}`}>{item.title}</Link><p><ClipboardList size={13} aria-hidden="true" />{item.courseCode} {item.status === 'COMPLETED' ? 'completed' : 'pending'}</p></article>)}
      </section>;
    })}</div>}
  </section>;
}
