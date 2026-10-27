// The single place that reads the system clock (D-005). Everything else receives `now`.
export const systemClock = (): number => Date.now();
