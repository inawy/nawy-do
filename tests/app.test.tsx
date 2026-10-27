import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from '@/app/App';

it('shows the product name and the prompt', () => {
  render(<App />);
  expect(screen.getByText('ناوي دو')).toBeTruthy();
  expect(screen.getByText('ناوي تعمل إيه؟')).toBeTruthy();
});
