import { createRoot } from 'react-dom/client';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const rootEl = document.getElementById('root');

// Render an always-on logger for early errors (before React fully mounts)
const earlyLogEl = document.createElement('div');
earlyLogEl.id = 'early-error-log';
earlyLogEl.style.position = 'fixed';
earlyLogEl.style.bottom = '8px';
earlyLogEl.style.left = '8px';
earlyLogEl.style.right = '8px';
earlyLogEl.style.zIndex = '99999';
earlyLogEl.style.color = '#fff';
earlyLogEl.style.fontSize = '12px';
earlyLogEl.style.fontFamily = 'monospace';
earlyLogEl.style.whiteSpace = 'pre-wrap';
earlyLogEl.style.background = 'rgba(0,0,0,0.7)';
earlyLogEl.style.padding = '8px';
earlyLogEl.style.borderRadius = '8px';
earlyLogEl.style.display = 'none';
document.body.appendChild(earlyLogEl);

function logEarly(msg: string) {
  earlyLogEl.textContent = msg;
  earlyLogEl.style.display = 'block';
}

window.addEventListener('error', (ev) => {
  const payload = [
    'ERR:',
    ev.message,
    ev.filename + ':' + ev.lineno + ':' + ev.colno,
    ev.error && ev.error.stack ? ev.error.stack : '',
  ].join('\n');
  logEarly(payload);
});

window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
  const reason = ev.reason || {};
  const payload = [
    'REJECTION:',
    reason.message || String(reason),
    reason.stack || '',
  ].join('\n');
  logEarly(payload);
});

if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );

  // Hide splash after first paint in native shells
  requestAnimationFrame(() => {
    SplashScreen.hide().catch(() => {
      /* ignore on web */
    });
  });
}
