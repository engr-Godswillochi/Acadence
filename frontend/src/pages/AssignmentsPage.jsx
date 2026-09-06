import { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/useAuth.js';
import { assignmentsApi } from '../features/assignments/assignments.api.js';

export function AssignmentsPage() {
  const { token, logout } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('ALL');
  const [courseId, setCourseId] = useState('ALL');
  const [sort, setSort] = useState('PRIORITY');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    assignmentsApi.my(token, controller.signal).then((data) => setTasks(data.assignments)).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) logout(); else setError(failure.message);
    });
    return () => controller.abort();
  }, [token, revision, logout]);
  async function toggle(task) {
    setBusy(true);
    try { await assignmentsApi.setStatus(token, task.assignmentId, task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'); setRevision((value) => value + 1); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  const visible = (tasks ?? []).filter((task) => (courseId === 'ALL' || task.courseId === courseId) && (status === 'ALL' || (status === 'OVERDUE' ? task.isOverdue : task.status === status && (status !== 'PENDING' || !task.isOverdue))));
  if (sort === 'DEADLINE') visible.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  if (sort === 'COURSE') visible.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  if (sort === 'DIFFICULTY') visible.sort((a, b) => b.difficultyRating - a.difficultyRating);
  const courses = [...new Map((tasks ?? []).map((task) => [task.courseId, task.courseCode]))];
  return <section><div className="page-heading"><div><p className="eyebrow">Your academic tasks</p><h1 className="page-title">Assignments</h1><p>Completion is your personal task record.</p></div></div>
    <div className="filters"><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{['ALL', 'PENDING', 'COMPLETED', 'OVERDUE'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Course<select value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="ALL">All courses</option>{courses.map(([id, code]) => <option key={id} value={id}>{code}</option>)}</select></label><label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}>{['PRIORITY', 'DEADLINE', 'COURSE', 'DIFFICULTY'].map((value) => <option key={value}>{value}</option>)}</select></label></div>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setRevision((value) => value + 1); }}>Try again</button></div> : !tasks ? <p role="status">Loading assignments…</p> : !visible.length ? <p className="empty-state">No assignments match this view.</p> : <ul className="task-list">{visible.map((task) => <li key={task.assignmentId}><p className="eyebrow">{task.courseCode}</p><h2>{task.title}</h2><p className="assignment-description">{task.description}</p><p>Due {new Date(task.deadline).toLocaleString()} · Difficulty {task.difficultyRating}/5</p><p>{task.status === 'COMPLETED' ? 'Completed' : `${task.isOverdue ? 'Overdue · ' : ''}${task.priorityLabel} priority`}</p><button disabled={busy} className="secondary" onClick={() => toggle(task)}>{task.status === 'COMPLETED' ? 'Mark pending' : 'Mark completed'}</button></li>)}</ul>}
  </section>;
}
