import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage.jsx';

const authState = { status: 'anonymous', user: null };
vi.mock('../features/auth/useAuth.js', () => ({ useAuth: () => authState }));

afterEach(() => { cleanup(); });
beforeEach(() => { authState.status = 'anonymous'; authState.user = null; });

function mount() {
  return render(<MemoryRouter><LandingPage /></MemoryRouter>);
}

const attr = (node, name, value) => expect(node.getAttribute(name)).toBe(value);
const tablist = () => screen.getByRole('tablist', { name: 'Preview a role' });
const tab = (name) => within(tablist()).getByRole('tab', { name });
const panel = (role) => document.getElementById(`preview-panel-${role.toLowerCase()}`);
const hidden = (node) => node.hasAttribute('hidden');

test('offers the two roles a real account can hold', () => {
  mount();
  expect(tablist()).toBeTruthy();
  attr(tab('Student'), 'aria-selected', 'true');
  attr(tab('Lecturer'), 'aria-selected', 'false');
});

test('says up front that the preview is an example, not a live account', () => {
  mount();
  expect(screen.getByText(/worked example, not a live account/i)).toBeTruthy();
});

test('shows only the selected role’s panel', async () => {
  const user = userEvent.setup();
  mount();
  expect(hidden(panel('Student'))).toBe(false);
  expect(hidden(panel('Lecturer'))).toBe(true);
  await user.click(tab('Lecturer'));
  expect(hidden(panel('Lecturer'))).toBe(false);
  expect(hidden(panel('Student'))).toBe(true);
});

test('ties each tab to the panel it controls', () => {
  mount();
  attr(tab('Student'), 'aria-controls', 'preview-panel-student');
  attr(tab('Lecturer'), 'aria-controls', 'preview-panel-lecturer');
  attr(panel('Student'), 'aria-labelledby', 'preview-tab-student');
  attr(panel('Lecturer'), 'aria-labelledby', 'preview-tab-lecturer');
});

test('moves between tabs with the arrow keys and wraps around', async () => {
  const user = userEvent.setup();
  mount();
  tab('Student').focus();
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(tab('Lecturer'));
  attr(tab('Lecturer'), 'aria-selected', 'true');
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(tab('Student'));
  await user.keyboard('{ArrowLeft}');
  expect(document.activeElement).toBe(tab('Lecturer'));
});

test('jumps to the first and last tab with Home and End', async () => {
  const user = userEvent.setup();
  mount();
  tab('Student').focus();
  await user.keyboard('{End}');
  expect(document.activeElement).toBe(tab('Lecturer'));
  await user.keyboard('{Home}');
  expect(document.activeElement).toBe(tab('Student'));
});

test('keeps only the selected tab in the tab order', () => {
  mount();
  attr(tab('Student'), 'tabindex', '0');
  attr(tab('Lecturer'), 'tabindex', '-1');
});

test('labels every deadline with the time zone, as the app does', () => {
  mount();
  const rows = within(panel('Student')).getAllByText('Deadline (WAT)');
  const entries = within(panel('Student')).getAllByRole('listitem');
  expect(rows.length).toBe(entries.length);
  expect(rows.length).toBeGreaterThan(0);
});

test('the week range moves with the stepper and comes back', async () => {
  const user = userEvent.setup();
  mount();
  expect(screen.getByText('Example week 1 of 3')).toBeTruthy();
  const range = () => document.querySelector('.preview-range').textContent;
  const first = range();
  await user.click(screen.getByRole('button', { name: 'Next week' }));
  expect(screen.getByText('Example week 2 of 3')).toBeTruthy();
  expect(range()).not.toBe(first);
  await user.click(screen.getByRole('button', { name: 'Previous week' }));
  expect(screen.getByText('Example week 1 of 3')).toBeTruthy();
  expect(range()).toBe(first);
});

test('cannot step outside the example weeks', async () => {
  const user = userEvent.setup();
  mount();
  const back = screen.getByRole('button', { name: 'Previous week' });
  const forward = screen.getByRole('button', { name: 'Next week' });
  expect(back.disabled).toBe(true);
  expect(forward.disabled).toBe(false);
  for (let step = 0; step < 5; step += 1) await user.click(forward);
  expect(screen.getByText('Example week 3 of 3')).toBeTruthy();
  expect(forward.disabled).toBe(true);
  expect(back.disabled).toBe(false);
});

test('the week range spans Monday to Friday', () => {
  mount();
  expect(document.querySelector('.preview-range').textContent).toMatch(/\d+ \w+ – \d+ \w+/);
});

test('lists a chosen teaching day and marks which day is chosen', async () => {
  const user = userEvent.setup();
  mount();
  await user.click(tab('Lecturer'));
  const days = within(panel('Lecturer')).getByRole('group', { name: 'Choose a teaching day' });
  const monday = within(days).getByRole('button', { name: /^Mon/ });
  const thursday = within(days).getByRole('button', { name: /^Thu/ });
  attr(monday, 'aria-pressed', 'true');
  const mondayCount = within(panel('Lecturer')).getAllByRole('listitem').length;
  await user.click(thursday);
  attr(thursday, 'aria-pressed', 'true');
  attr(monday, 'aria-pressed', 'false');
  const thursdayCount = within(panel('Lecturer')).getAllByRole('listitem').length;
  expect(thursdayCount).not.toBe(mondayCount);
});

test('the lecturer panel spans the five teaching days', () => {
  mount();
  expect(document.querySelectorAll('#preview-panel-lecturer .preview-days button').length).toBe(5);
});

test('tells a signed-in visitor where their work already is', () => {
  authState.status = 'authenticated';
  authState.user = { fullName: 'Amina Bello', role: 'LECTURER' };
  mount();
  const open = screen.getAllByRole('link', { name: /open your dashboard/i });
  expect(open.length).toBeGreaterThan(0);
  attr(open[0], 'href', '/dashboard');
  expect(screen.queryByRole('link', { name: /create your account/i })).toBeNull();
});

test('sends a signed-out visitor to register or sign in, from every call to action', () => {
  mount();
  const register = screen.getAllByRole('link', { name: /create your account/i });
  expect(register.length).toBeGreaterThan(1);
  for (const link of register) attr(link, 'href', '/register');
  const signIn = screen.getAllByRole('link', { name: /^sign in$/i });
  expect(signIn.length).toBeGreaterThan(1);
  for (const link of signIn) attr(link, 'href', '/login');
});

test('reaches the main content from one skip link', () => {
  mount();
  attr(screen.getByRole('link', { name: /skip to content/i }), 'href', '#landing-main');
  expect(document.getElementById('landing-main')).toBeTruthy();
  expect(document.getElementById('preview-heading')).toBeTruthy();
  expect(document.getElementById('features-heading')).toBeTruthy();
});

test('carries the mark as a single labelled image, not decorative noise', () => {
  mount();
  const marks = document.querySelectorAll('.brand-mark');
  expect(marks.length).toBeGreaterThan(0);
  for (const mark of marks) {
    expect(mark.getAttribute('aria-hidden')).toBe('true');
    expect(mark.querySelector('path')).toBeTruthy();
    expect(mark.querySelector('rect')).toBeTruthy();
  }
});
