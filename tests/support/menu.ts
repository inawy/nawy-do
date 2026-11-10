import { fireEvent, screen, within } from '@testing-library/react';

/** Opens the «more» menu and picks an item. */
export function chooseFromMenu(name: string, role: 'menuitem' | 'menuitemradio' = 'menuitem') {
  fireEvent.click(screen.getByRole('button', { name: 'المزيد' }));
  fireEvent.click(screen.getByRole(role, { name }));
}

/** Opens the side menu and picks an item (a button such as «my data»). */
export function chooseFromDrawer(name: string) {
  fireEvent.click(screen.getByRole('button', { name: 'القائمة الجانبية' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name }));
}
