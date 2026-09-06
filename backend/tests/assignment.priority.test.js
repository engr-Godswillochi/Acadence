import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateTask, orderTasks } from '../src/modules/assignments/assignment.priority.js';
import { assignmentUpdateSchema } from '../src/modules/assignments/assignment.validation.js';

const now = new Date('2026-09-06T12:00:00Z');
const base = { assignmentId: 'a', deadline: now.toISOString(), status: 'PENDING', difficultyRating: 5, creditUnits: 6 };
test('deadline boundary and completion determine overdue status', () => {
  assert.equal(calculateTask(base, now).isOverdue, false);
  assert.equal(calculateTask({ ...base, deadline: '2026-09-06T11:59:59Z' }, now).isOverdue, true);
  assert.equal(calculateTask({ ...base, status: 'COMPLETED', deadline: '2026-09-01T12:00:00Z' }, now).isOverdue, false);
});
test('priority uses the documented bounded weighted calculation', () => {
  assert.equal(calculateTask(base, now).priorityScore, 1);
  assert.equal(calculateTask({ ...base, deadline: '2026-09-13T12:00:00Z' }, now).priorityScore, 0.75);
  assert.equal(calculateTask({ ...base, deadline: '2026-09-20T12:00:00Z' }, now).priorityScore, 0.5);
  assert.equal(calculateTask({ ...base, deadline: '2027-01-01T12:00:00Z' }, now).priorityScore, 0.5);
});
test('pending tasks sort by priority ahead of completed tasks', () => {
  const ordered = orderTasks([{ ...base, assignmentId: 'complete', status: 'COMPLETED' }, { ...base, assignmentId: 'later', deadline: '2026-10-01T12:00:00Z' }, { ...base, assignmentId: 'urgent' }], now);
  assert.deepEqual(ordered.map((task) => task.assignmentId), ['urgent', 'later', 'complete']);
});
test('a partial assignment edit does not default away the description', () => {
  assert.deepEqual(assignmentUpdateSchema.parse({ title: 'Updated title' }), { title: 'Updated title' });
});
