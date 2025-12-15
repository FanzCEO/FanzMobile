import { createRoot } from 'react-dom/client';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App.tsx';
import './index.css';

// Hide splash screen when app is ready
SplashScreen.hide().catch(() => {
  // Ignore errors on web - SplashScreen only works on native
});

createRoot(document.getElementById('root')!).render(<App />);
