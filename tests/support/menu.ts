import { fireEvent, screen } from '@testing-library/react';

/** Opens the «more» menu and picks an item. */
export function chooseFromMenu(name: string) {
  fireEvent.click(screen.getByRole('button', { name: 'المزيد' }));
  fireEvent.click(screen.getByRole('menuitem', { name }));
}
