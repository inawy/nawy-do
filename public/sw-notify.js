/* global self */
// Imported by the generated service worker: tapping a due-time notification opens the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients[0];
      return open ? open.focus() : self.clients.openWindow('./');
    }),
  );
});
