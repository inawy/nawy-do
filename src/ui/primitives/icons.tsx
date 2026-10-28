// Small inline icon set (Material-style paths), so no icon package is needed (D-004: no new deps).
import type { ReactNode } from 'react';

function Svg({ children, filled = true }: { children: ReactNode; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const STAR =
  'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

export const PlusIcon = () => (
  <Svg>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </Svg>
);
export const StarIcon = ({ on }: { on: boolean }) => (
  <Svg filled={on}>
    <path d={STAR} />
  </Svg>
);
export const AllIcon = () => (
  <Svg>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" />
  </Svg>
);
export const StarredNavIcon = () => (
  <Svg>
    <path d={STAR} />
  </Svg>
);
export const CalendarIcon = () => (
  <Svg>
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" />
  </Svg>
);
export const ChevronIcon = () => (
  <Svg>
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
  </Svg>
);
export const TrashIcon = () => (
  <Svg>
    <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </Svg>
);
export const GripIcon = () => (
  <Svg>
    <path d="M9 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18 20a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
  </Svg>
);
export const CloseIcon = () => (
  <Svg>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </Svg>
);
