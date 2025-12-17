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
earlyLogEl.style.maxHeight = '50vh';
earlyLogEl.style.overflow = 'auto';
earlyLogEl.style.display = 'none';
document.body.appendChild(earlyLogEl);

function logEarly(msg: string, append = false) {
  if (append && earlyLogEl.textContent) {
    earlyLogEl.textContent += '\n\n---\n' + msg;
  } else {
    earlyLogEl.textContent = msg;
  }
  earlyLogEl.style.display = 'block';
  // Also log to console for Xcode/Safari debug
  console.error('[EarlyError]', msg);
}

// Helper to serialize any error type safely
function serializeError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}\n${err.stack || ''}`;
  }
  if (typeof err === 'object' && err !== null) {
    try {
      const obj = err as Record<string, unknown>;
      // Try to extract common error properties
      if ('message' in obj && typeof obj.message === 'string') {
        return `${obj.message}\n${obj.stack || ''}`;
      }
      // Try JSON stringify
      const json = JSON.stringify(err, null, 2);
      if (json === '{}') {
        const props = Object.getOwnPropertyNames(err)
          .map((k) => `${k}: ${String(obj[k])}`)
          .join(', ');
        return `[Object] { ${props || 'empty'} }`;
      }
      return json;
    } catch {
      return `[Object] ${String(err)}`;
    }
  }
  return String(err);
}

// Log environment info for debugging
const envInfo = `Platform: ${navigator.userAgent}\nURL: ${window.location.href}\nAPI: ${import.meta.env.VITE_API_BASE_URL || 'localhost:8000 (default)'}`;
console.log('[AppInit]', envInfo);

window.addEventListener('error', (ev) => {
  const payload = [
    'ERR:',
    ev.message,
    ev.filename + ':' + ev.lineno + ':' + ev.colno,
    ev.error && ev.error.stack ? ev.error.stack : '',
  ].join('\n');
  logEarly(payload, true);
});

window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
  const reason = ev.reason || {};
  const payload = [
    'REJECTION:',
    reason.message || String(reason),
    reason.stack || '',
  ].join('\n');
  logEarly(payload, true);
});

if (rootEl) {
  try {
    console.log('[AppInit] Creating React root...');
    const root = createRoot(rootEl);
    console.log('[AppInit] Rendering App...');
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    console.log('[AppInit] Render called successfully');

    // Hide splash after first paint in native shells
    requestAnimationFrame(() => {
      SplashScreen.hide().catch(() => {
        /* ignore on web */
      });
    });
  } catch (e) {
    logEarly(`[RENDER CRASH]\n${serializeError(e)}`);
  }
} else {
  logEarly('[FATAL] No root element found!');
}
