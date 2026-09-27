export const academicTimeZone = 'Africa/Lagos';

const dateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: academicTimeZone,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const dateOnly = new Intl.DateTimeFormat('en-GB', {
  timeZone: academicTimeZone,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const longDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: academicTimeZone,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const dayAndMonth = new Intl.DateTimeFormat('en-GB', {
  timeZone: academicTimeZone,
  day: 'numeric',
  month: 'short',
});

const weekday = new Intl.DateTimeFormat('en-GB', {
  timeZone: academicTimeZone,
  weekday: 'long',
});

const timeOnly = new Intl.DateTimeFormat('en-GB', {
  timeZone: academicTimeZone,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const hourOnly = new Intl.DateTimeFormat('en-GB', {
  timeZone: academicTimeZone,
  hour: 'numeric',
  hourCycle: 'h23',
});

const dateKeyParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: academicTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const inputParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: academicTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Omitting a value means "now", which is what the clock-driven labels ask for.
// An unusable value resolves to null so a bad record renders empty instead of
// throwing a RangeError out of Intl and taking the page down with it.
function toDate(value) {
  if (value === undefined || value === null) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function partsFor(value) {
  return Object.fromEntries(inputParts.formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]));
}

function dateKeyPartsFor(value) {
  return Object.fromEntries(dateKeyParts.formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]));
}

function utcTimestamp(year, month, day, hour, minute, second = 0, millisecond = 0) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  return date;
}

function timezoneOffsetMilliseconds(value) {
  const parts = partsFor(value);
  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  ) + value.getUTCSeconds() * 1000 + value.getUTCMilliseconds() - value.getTime();
}

export function dateKeyFrom(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = dateKeyPartsFor(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function parseDateKey(value) {
  if (typeof value !== 'string') return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';
  const [, year, month, day] = match.map(Number);
  const candidate = utcTimestamp(year, month, day, 0, 0);
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return '';
  return value;
}

export function formatAcademicDate(value) {
  const date = toDate(value);
  return date ? `${dateTime.format(date)} WAT` : '';
}

export function formatAcademicDateOnly(value) {
  const date = toDate(value);
  return date ? dateOnly.format(date) : '';
}

export function formatAcademicLongDate(value) {
  const date = toDate(value);
  return date ? longDate.format(date) : '';
}

export function formatAcademicDay(value) {
  const date = toDate(value);
  return date ? dayAndMonth.format(date) : '';
}

export function academicWeekday(value) {
  const date = toDate(value);
  return date ? weekday.format(date) : '';
}

export function academicHour(value) {
  return Number(hourOnly.format(toDate(value) ?? new Date()));
}

// Minutes since midnight in WAT, for weighing a stored HH:mm class start against
// the clock. Same contract as academicHour: omitting the value means "now".
export function academicMinutes(value) {
  const [hour, minute] = timeOnly.format(toDate(value) ?? new Date()).split(':');
  return Number(hour) * 60 + Number(minute);
}

export function formatWatTime(value) {
  const date = toDate(value);
  return date ? timeOnly.format(date) : '';
}

export function compareDeadlines(left, right) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isNaN(leftTime)) return Number.isNaN(rightTime) ? 0 : 1;
  if (Number.isNaN(rightTime)) return -1;
  return leftTime - rightTime;
}

export function academicDateTimeInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = partsFor(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function academicDateTimeInputToIso(value) {
  if (typeof value !== 'string') return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!match) return '';
  const [, year, month, day, hour, minute, second = '0', fraction = '000'] = match;
  const candidate = utcTimestamp(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(fraction.padEnd(3, '0')),
  );
  if (
    candidate.getUTCFullYear() !== Number(year)
    || candidate.getUTCMonth() !== Number(month) - 1
    || candidate.getUTCDate() !== Number(day)
    || Number(hour) > 23
    || Number(minute) > 59
    || Number(second) > 59
  ) return '';
  const wallTime = candidate.getTime();
  const offset = timezoneOffsetMilliseconds(candidate);
  return new Date(wallTime - offset).toISOString();
}
