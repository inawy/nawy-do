import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from '@/app/App';
import { prepareStorage } from '@/app/bootstrap';
import { updateSignal } from '@/app/updateSignal';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing');
// A safety copy of an older database first (never blocks for more than a moment), then render.
void prepareStorage()
  .catch(() => undefined)
  .then(() => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });

// Registered after the first render so it never delays it. A new version waits for the user.
const updateSW = registerSW({
  onNeedRefresh() {
    updateSignal.set(() => void updateSW(true));
  },
});
