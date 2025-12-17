import type { CapacitorConfig } from '@capacitor/cli';

// Live reload configuration for Capacitor development
// Set USE_LIVE_RELOAD=true and optionally LIVE_RELOAD_URL to your machine's LAN IP
// Example: USE_LIVE_RELOAD=true LIVE_RELOAD_URL=http://192.168.5.240:5173 npx cap sync
const useLiveReload = process.env.USE_LIVE_RELOAD === 'true';
const liveReloadUrl = process.env.LIVE_RELOAD_URL || 'http://localhost:5173';

const config: CapacitorConfig = {
  // Use a unique bundle ID for development - change this to your own identifier
  appId: 'com.wyattcole.wickedcrm.dev',
  appName: 'WickedCRM',
  webDir: 'dist',
  // Only use server.url for live reload during development
  // For real device testing, set LIVE_RELOAD_URL to your dev machine's LAN IP
  ...(useLiveReload
    ? {
        server: {
          url: liveReloadUrl,
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#000000',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'WickedCRM'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default config;
