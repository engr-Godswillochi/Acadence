import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('confirmation dialog exposes modal semantics and keeps destructive actions explicit', async () => {
  const onConfirm = vi.fn();
  render(<ConfirmDialog title="Delete assignment" description="This cannot be undone." onConfirm={onConfirm} onClose={() => {}} />);
  const dialog = screen.getByRole('dialog');
  expect(dialog.getAttribute('aria-modal')).toBe('true');
  expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
  expect(screen.getByText('This cannot be undone.')).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(onConfirm).toHaveBeenCalledOnce();
});

test('confirmation dialog exposes a busy state and error without enabling close actions', () => {
  render(<ConfirmDialog title="Close attendance" onConfirm={() => {}} onClose={() => {}} busy error="Could not save." confirmLabel="Close session" />);
  const dialog = screen.getByRole('dialog');
  expect(dialog.getAttribute('aria-busy')).toBe('true');
  expect(screen.getByRole('alert').textContent).toContain('Could not save.');
  expect(screen.getByRole('button', { name: 'Close dialog' }).disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Working…' }).disabled).toBe(true);
});
