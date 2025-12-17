import type { CapacitorConfig } from '@capacitor/cli';

// Set USE_LIVE_RELOAD=true for development with live reload
const useLiveReload = process.env.USE_LIVE_RELOAD === 'true';

const config: CapacitorConfig = {
  appId: 'com.fanz.rentcrm',
  appName: 'WickedCRM',
  webDir: 'dist',
  // Only use server.url for live reload during development
  ...(useLiveReload && {
    server: {
      url: 'http://localhost:5173',
      cleartext: true,
    },
  }),
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
