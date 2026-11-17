import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useShortcuts } from '@/ui/shell/useShortcuts';

afterEach(cleanup);

function Probe({ onNew = () => {}, onSearch = () => {} }) {
  useShortcuts({ onNew, onSearch });
  return (
    <div>
      <ul>
        {['a', 'b'].map((id) => (
          <li key={id} className="row">
            <input type="checkbox" className="circle" aria-label={`c-${id}`} />
            <button type="button" className="body" aria-label={`b-${id}`} />
            <button type="button" className="star" aria-label={`s-${id}`} />
            <button type="button" className="grip" aria-label={`g-${id}`} />
          </li>
        ))}
      </ul>
      <input aria-label="field" />
    </div>
  );
}

const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(window, { key, ...init });
const focused = () => document.activeElement?.getAttribute('aria-label');

describe('keyboard shortcuts', () => {
  it('N and / call their actions', () => {
    const onNew = vi.fn();
    const onSearch = vi.fn();
    render(<Probe onNew={onNew} onSearch={onSearch} />);
    press('n');
    press('/');
    expect([onNew.mock.calls.length, onSearch.mock.calls.length]).toEqual([1, 1]);
  });

  it('arrows move between rows on the same part, and stop at the ends', () => {
    const { getByLabelText } = render(<Probe />);
    getByLabelText('c-a').focus();
    press('ArrowDown');
    expect(focused()).toBe('c-b');
    press('ArrowDown');
    expect(focused()).toBe('c-b');
    getByLabelText('s-b').focus();
    press('ArrowUp');
    expect(focused()).toBe('s-a');
  });

  it('a part that is not one of the three falls back to the title button', () => {
    const { getByLabelText } = render(<Probe />);
    getByLabelText('b-a').focus();
    press('ArrowDown');
    expect(focused()).toBe('b-b');
  });

  it('leaves the arrows alone outside rows, on the drag handle and while typing', () => {
    const { getByLabelText } = render(<Probe />);
    press('ArrowDown');
    expect(focused()).toBe(null);
    getByLabelText('g-a').focus();
    press('ArrowDown');
    expect(focused()).toBe('g-a');
    getByLabelText('field').focus();
    press('ArrowDown');
    expect(focused()).toBe('field');
  });

  it('Ctrl+Z presses the undo of the toast; without one it does nothing', () => {
    render(<Probe />);
    expect(fireEvent.keyDown(window, { key: 'z', ctrlKey: true })).toBe(true);
    const toast = document.createElement('div');
    toast.className = 'toast';
    const undo = document.createElement('button');
    const clicked = vi.fn();
    undo.addEventListener('click', clicked);
    toast.append(undo);
    document.body.append(toast);
    expect(fireEvent.keyDown(window, { key: 'Z', metaKey: true })).toBe(false);
    expect(clicked).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(clicked).toHaveBeenCalledTimes(1);
    toast.remove();
  });

  it('does nothing while a sheet is open', () => {
    const onNew = vi.fn();
    render(<Probe onNew={onNew} />);
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.append(dialog);
    press('n');
    expect(onNew).not.toHaveBeenCalled();
    dialog.remove();
  });
});
