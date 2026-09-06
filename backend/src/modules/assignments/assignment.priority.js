const dayMs = 86400000;

export function calculateTask(assignment, now = new Date()) {
  const daysRemaining = (new Date(assignment.deadline).getTime() - now.getTime()) / dayMs;
  const isOverdue = assignment.status !== 'COMPLETED' && daysRemaining < 0;
  const urgency = Math.min(1, Math.max(0, 1 - daysRemaining / 14));
  const priorityScore = urgency * 0.5 + (assignment.difficultyRating / 5) * 0.3 + Math.min(assignment.creditUnits / 6, 1) * 0.2;
  return { ...assignment, daysRemaining, isOverdue, priorityScore,
    priorityLabel: priorityScore >= 0.75 ? 'URGENT' : priorityScore >= 0.5 ? 'HIGH' : priorityScore >= 0.25 ? 'MEDIUM' : 'LOW' };
}

export function orderTasks(assignments, now = new Date()) {
  return assignments.map((assignment) => calculateTask(assignment, now)).sort((a, b) =>
    Number(a.status === 'COMPLETED') - Number(b.status === 'COMPLETED') || b.priorityScore - a.priorityScore || new Date(a.deadline) - new Date(b.deadline) || a.assignmentId.localeCompare(b.assignmentId));
}
