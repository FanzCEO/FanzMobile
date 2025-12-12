import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fanz.mobile',
  appName: 'FanzMobile',
  webDir: 'dist',
  // No server.url = app runs from bundled dist folder (offline capable)
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#1a1a2e',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'FanzMobile',
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#1a1a2e',
  },
};

export default config;
