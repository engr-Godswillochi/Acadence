import { academicMinutes, academicWeekday } from '../../utils/date.js';
import { weekdays } from './calendar.utils.js';

const FULL_WEEK = 7;
const FRIDAY = 4;

// A stored start time is "HH:mm" on the WAT clock, so it can be weighed against
// now without ever building a real timestamp for a recurring class.
export function startMinutes(value) {
  const [hour, minute] = String(value ?? '').split(':');
  return Number(hour) * 60 + (Number.isFinite(Number(minute)) ? Number(minute) : 0);
}

function labelFor(days, dayOfWeek) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === FULL_WEEK) return `Next ${dayOfWeek}`;
  return dayOfWeek;
}

// The soonest class still to come. A slot that has already passed today rolls a
// whole week forward, so a lecturer at 4pm on Monday is pointed at the next
// session rather than at a class that finished hours ago.
export function nextSession(schedules, now = new Date()) {
  const today = weekdays.indexOf(academicWeekday(now));
  if (today < 0) return null;
  const minutes = academicMinutes(now);
  const sorted = schedules
    .filter((item) => weekdays.includes(item.dayOfWeek))
    .map((item) => {
      const offset = (weekdays.indexOf(item.dayOfWeek) - today + FULL_WEEK) % FULL_WEEK;
      return { item, days: offset === 0 && startMinutes(item.startTime) <= minutes ? FULL_WEEK : offset };
    })
    .sort((left, right) => (left.days - right.days) || (startMinutes(left.item.startTime) - startMinutes(right.item.startTime)));
  if (!sorted.length) return null;
  const { item, days } = sorted[0];
  return { item, days, when: labelFor(days, item.dayOfWeek) };
}

// Which day columns to draw. The grid always opens on Monday and always runs at
// least to Friday, widening only when a class genuinely falls on a weekend, so a
// Saturday session is never hidden behind a narrower grid.
export function weekSpan(schedules) {
  const lastUsed = weekdays
    .map((day, index) => (schedules.some((item) => item.dayOfWeek === day) ? index : -1))
    .filter((index) => index >= 0)
    .pop();
  return weekdays.slice(0, Math.max(FRIDAY, lastUsed ?? 0) + 1);
}
