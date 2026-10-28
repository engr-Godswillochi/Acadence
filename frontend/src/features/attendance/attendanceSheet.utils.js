import { formatWatTime } from '../../utils/date.js';

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function attendanceSheetCsv(records) {
  const rows = records.map((record, index) => [index + 1, record.studentName, record.matricNumber, record.recordedAt ? 'Present' : 'Absent', record.recordedAt ? `${formatWatTime(record.recordedAt)} WAT` : '']);
  return [['#', 'Student name', 'Matric number', 'Status', 'Time recorded'], ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}
