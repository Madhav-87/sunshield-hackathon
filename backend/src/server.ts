import { createApp } from './app.js';
import { env } from './config/env.js';

// Developer B wires the real WeatherProvider here after integration.
const server = createApp().listen(env.PORT, () => {
  console.log(`SunShield listening on port ${env.PORT}`);
});
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 10_000);
  timeout.unref();
  server.close(error => { clearTimeout(timeout); process.exit(error ? 1 : 0); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
server.on('error', () => { console.error('SunShield failed to listen'); process.exitCode = 1; });
