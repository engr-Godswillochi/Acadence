import { compareDeadlines, formatAcademicDate } from '../utils/date.js';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownUp, CalendarDays, CheckCircle2, Circle, ClipboardCheck, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { assignmentsApi } from '../features/assignments/assignments.api.js';

const statusLabel = { ALL: 'All assignments', PENDING: 'To do', COMPLETED: 'Completed', OVERDUE: 'Overdue' };
const sortLabel = { PRIORITY: 'Priority', DEADLINE: 'Deadline', COURSE: 'Course', DIFFICULTY: 'Difficulty' };
const validStatuses = new Set(Object.keys(statusLabel));
const validSorts = new Set(Object.keys(sortLabel));

export function AssignmentsPage() {
  const { token, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedAssignment = searchParams.get('assignment');
  const requestedStatus = searchParams.get('status');
  const requestedCourse = searchParams.get('course');
  const requestedSort = searchParams.get('sort');
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const status = validStatuses.has(requestedStatus) ? requestedStatus : 'ALL';
  const courseId = requestedCourse || 'ALL';
  const sort = validSorts.has(requestedSort) ? requestedSort : 'PRIORITY';
  const [busy, setBusy] = useState(false);
  const taskElements = useRef(new Map());
  const selectedAssignmentActive = Boolean(requestedAssignment && tasks?.some((task) => task.assignmentId === requestedAssignment));
  const activeCourseId = selectedAssignmentActive ? 'ALL' : courseId;
  const activeStatus = selectedAssignmentActive ? 'ALL' : status;

  function updateQuery(name, value, defaultValue, clearSelection = true) {
    const next = new URLSearchParams(searchParams);
    if (value === defaultValue) next.delete(name); else next.set(name, value);
    if (clearSelection) next.delete('assignment');
    setSearchParams(next);
  }

  function clearAssignmentSelection() {
    const next = new URLSearchParams(searchParams);
    next.delete('assignment');
    setSearchParams(next);
  }

  useEffect(() => {
    const controller = new AbortController();
    assignmentsApi.my(token, controller.signal).then((data) => setTasks(data.assignments)).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout(); else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, revision, logout]);

  useEffect(() => {
    if (!selectedAssignmentActive) return;
    const target = taskElements.current.get(requestedAssignment);
    target?.focus?.({ preventScroll: true });
    target?.scrollIntoView?.({ block: 'center' });
  }, [requestedAssignment, selectedAssignmentActive]);

  async function toggle(task) {
    setBusy(true);
    setError('');
    try {
      await assignmentsApi.setStatus(token, task.assignmentId, task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED');
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  const visible = (tasks ?? []).filter((task) => (activeCourseId === 'ALL' || task.courseId === activeCourseId) && (activeStatus === 'ALL' || (activeStatus === 'OVERDUE' ? task.isOverdue : task.status === activeStatus && (activeStatus !== 'PENDING' || !task.isOverdue))));
  if (sort === 'DEADLINE') visible.sort((a, b) => compareDeadlines(a.deadline, b.deadline));
  if (sort === 'COURSE') visible.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  if (sort === 'DIFFICULTY') visible.sort((a, b) => b.difficultyRating - a.difficultyRating);
  const courses = [...new Map((tasks ?? []).map((task) => [task.courseId, task.courseCode]))];
  const hasRequestedAssignment = selectedAssignmentActive;
  const missingRequestedAssignment = Boolean(requestedAssignment && tasks && !selectedAssignmentActive);
  const emptyTitle = !tasks?.length ? 'No assignments yet.' : 'No assignments match this view.';
  const emptyCopy = !tasks?.length ? 'Your lecturer will publish coursework here when it is ready.' : 'Try another filter to see more work.';

  return <section className="assignments-workspace">
    <header className="assignments-heading page-banner"><div><h1>Assignments</h1><p>Keep track of what is due and mark work off as you complete it.</p></div>{tasks && <span aria-live="polite">{visible.length} of {tasks.length} {tasks.length === 1 ? 'assignment' : 'assignments'}</span>}</header>
    <div className="assignment-controls" aria-label="Assignment filters"><SlidersHorizontal size={18} aria-hidden="true" /><span className="assignment-filter-label">Filter assignments</span><label>Status<select value={activeStatus} onChange={(event) => updateQuery('status', event.target.value, 'ALL')}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Course<select value={activeCourseId} onChange={(event) => updateQuery('course', event.target.value, 'ALL')}><option value="ALL">All courses</option>{courses.map(([id, code]) => <option key={id} value={id}>{code}</option>)}</select></label><label><ArrowDownUp size={16} aria-hidden="true" />Sort by<select value={sort} onChange={(event) => updateQuery('sort', event.target.value, 'PRIORITY', false)}>{Object.entries(sortLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {hasRequestedAssignment && <p className="assignment-focus-note" role="status">Showing the selected assignment.</p>}
    {missingRequestedAssignment && <p className="assignment-focus-note assignment-focus-missing" role="status">That assignment is not available. <button type="button" className="text-link-inline" onClick={clearAssignmentSelection}>Clear selection</button></p>}
    {error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></div> : !tasks ? <p role="status">Loading assignments…</p> : !visible.length ? <div className="assignment-empty"><ClipboardCheck size={24} aria-hidden="true" /><div><h2>{emptyTitle}</h2><p>{emptyCopy}</p></div></div> : <>
      <ul className="assignment-register">{visible.map((task) => <li className={`${task.status === 'COMPLETED' ? 'is-completed' : task.isOverdue ? 'is-overdue' : ''}${hasRequestedAssignment && task.assignmentId === requestedAssignment ? ' is-focused' : ''}`} id={`assignment-${task.assignmentId}`} key={task.assignmentId} ref={(element) => { if (element) taskElements.current.set(task.assignmentId, element); else taskElements.current.delete(task.assignmentId); }} tabIndex={task.assignmentId === requestedAssignment ? -1 : undefined}>
        <button className="assignment-toggle" type="button" disabled={busy} aria-label={task.status === 'COMPLETED' ? 'Mark pending' : 'Mark completed'} title={task.status === 'COMPLETED' ? 'Mark pending' : 'Mark completed'} onClick={() => toggle(task)}>{task.status === 'COMPLETED' ? <CheckCircle2 size={22} aria-hidden="true" /> : <Circle size={22} aria-hidden="true" />}</button>
        <div className="assignment-main"><span className="assignment-course">{task.courseCode}</span><div className="assignment-title-row"><h2>{task.title}</h2><span className="assignment-state">{task.isOverdue && <TriangleAlert size={15} aria-hidden="true" />}{task.status === 'COMPLETED' ? 'Completed' : `${task.isOverdue ? 'Overdue · ' : ''}${task.priorityLabel} priority`}</span></div>{task.description && <p className="assignment-description">{task.description}</p>}<div className="assignment-meta"><span><CalendarDays size={15} aria-hidden="true" />Due {formatAcademicDate(task.deadline)}</span><span>Difficulty {task.difficultyRating}/5</span></div></div>
      </li>)}</ul>
      <footer className="assignment-record-note"><ClipboardCheck size={19} aria-hidden="true" /><p><strong>Personal task record.</strong> Marking work complete updates your own list, not the course grade.</p></footer>
    </>}
  </section>;
}
