import { expect, test } from 'vitest';
import {
  academicDateTimeInputToIso,
  academicDateTimeInputValue,
  academicHour,
  academicWeekday,
  compareDeadlines,
  dateKeyFrom,
  formatAcademicDate,
  formatAcademicDateOnly,
  formatAcademicDay,
  formatAcademicLongDate,
  formatWatTime,
  parseDateKey,
} from './date.js';

test('assignment deadline inputs are converted from WAT wall time to ISO', () => {
  expect(academicDateTimeInputValue('2026-09-25T13:00:00.000Z')).toBe('2026-09-25T14:00');
  expect(academicDateTimeInputToIso('2026-09-25T14:00')).toBe('2026-09-25T13:00:00.000Z');
  expect(academicDateTimeInputToIso('2026-09-25T14:00:30')).toBe('2026-09-25T13:00:30.000Z');
});

test('date helpers reject impossible wall times and keep the WAT calendar day', () => {
  expect(academicDateTimeInputToIso('2026-02-29T14:00')).toBe('');
  expect(academicDateTimeInputToIso('2026-09-25T25:00')).toBe('');
  expect(dateKeyFrom('2026-09-25T23:30:00.000Z')).toBe('2026-09-26');
  expect(parseDateKey('2026-02-29')).toBe('');
  expect(parseDateKey('2024-02-29')).toBe('2024-02-29');
});

test('academic comparisons and labels use the same time basis', () => {
  expect(compareDeadlines('2026-09-25T13:00:00Z', '2026-09-25T12:00:00Z')).toBeGreaterThan(0);
  expect(academicHour('2026-09-25T00:30:00Z')).toBe(1);
  expect(formatAcademicDate('2026-09-25T13:00:00Z')).toContain('WAT');
});

test('clock labels fall back to the current WAT time when no value is given', () => {
  expect(Number.isInteger(academicHour())).toBe(true);
  expect(academicWeekday()).toBe(academicWeekday(new Date()));
  expect(formatAcademicLongDate()).toBe(formatAcademicLongDate(new Date()));
});

test('unusable values render as empty copy instead of throwing', () => {
  expect(formatAcademicDate('not-a-date')).toBe('');
  expect(formatAcademicDate('')).toBe('');
  expect(formatAcademicDateOnly('not-a-date')).toBe('');
  expect(formatAcademicLongDate('not-a-date')).toBe('');
  expect(formatAcademicDay('not-a-date')).toBe('');
  expect(academicWeekday('not-a-date')).toBe('');
  expect(formatWatTime('not-a-date')).toBe('');
  expect(Number.isInteger(academicHour('not-a-date'))).toBe(true);
});
