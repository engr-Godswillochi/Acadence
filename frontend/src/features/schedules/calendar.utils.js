import { academicTimeZone, dateKeyFrom } from '../../utils/date.js';

export const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const calendarTimezone = academicTimeZone;
export function localDateKey(value) {
  return dateKeyFrom(value);
}
export function weekDates(dateKey) {
  // UTC arithmetic operates on calendar dates, not the browser's local timezone.
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return weekdays.map((day, index) => ({ day, date: new Date(date.getTime() + index * 86400000).toISOString().slice(0, 10) }));
}
export function shiftWeek(dateKey, direction) {
  return new Date(new Date(`${dateKey}T00:00:00Z`).getTime() + direction * 7 * 86400000).toISOString().slice(0, 10);
}
