import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { nextSession, startMinutes, weekSpan } from './teaching-week.js';

const session = (dayOfWeek, startTime, endTime = '11:00') => ({
  scheduleId: `${dayOfWeek}${startTime}`,
  courseId: 'course-1',
  dayOfWeek,
  startTime,
  endTime,
  venue: 'Room 1',
  courseCode: 'CSC401',
  courseTitle: 'Software Engineering',
});

// A Monday at 09:00 WAT, so "today" and "this week" are unambiguous.
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-28T08:00:00.000Z')); });
afterEach(() => { vi.useRealTimers(); });

test('a stored start time is read as minutes on the WAT clock', () => {
  expect(startMinutes('00:00')).toBe(0);
  expect(startMinutes('09:30')).toBe(570);
  expect(startMinutes('23:59')).toBe(1439);
});

test('the next class is the soonest one still to come', () => {
  const result = nextSession([session('Monday', '14:00'), session('Tuesday', '08:00')]);
  expect(result.item.dayOfWeek).toBe('Monday');
  expect(result.when).toBe('Today');
});

test('a class whose slot has already passed today rolls forward a week', () => {
  // 08:00 WAT has started by the time the desk is opened, so Monday's 08:00
  // class is next week and Wednesday is the real answer.
  const result = nextSession([session('Monday', '08:00'), session('Wednesday', '10:00')]);
  expect(result.item.dayOfWeek).toBe('Wednesday');
  expect(result.when).toBe('Wednesday');
});

test('the same weekday one week out is labelled as next week', () => {
  expect(nextSession([session('Monday', '08:00')]).when).toBe('Next Monday');
});

test('tomorrow is named rather than dated', () => {
  expect(nextSession([session('Tuesday', '09:00')]).when).toBe('Tomorrow');
});

test('a timetable with no classes has no next class', () => {
  expect(nextSession([])).toBeNull();
});

test('a day outside the week is ignored rather than mis-sorted', () => {
  expect(nextSession([{ ...session('Monday', '14:00'), dayOfWeek: 'Funday' }])).toBeNull();
});

test('the week runs Monday to Friday until a weekend class needs more room', () => {
  const workingWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const fullWeek = [...workingWeek, 'Saturday', 'Sunday'];
  expect(weekSpan([session('Monday', '09:00'), session('Wednesday', '09:00')])).toEqual(workingWeek);
  // A weekend class is never hidden behind a narrower grid.
  expect(weekSpan([session('Saturday', '09:00')])).toEqual([...workingWeek, 'Saturday']);
  expect(weekSpan([session('Sunday', '09:00')])).toEqual(fullWeek);
  expect(weekSpan([])).toEqual(workingWeek);
});
