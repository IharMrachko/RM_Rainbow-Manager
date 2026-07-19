/// <reference types="@capacitor-firebase/authentication" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rainbow.manager',
  appName: 'Rainbow Manager',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Do NOT enable CapacitorHttp globally — it patches fetch/XHR and breaks Firestore.
    FirebaseAuthentication: {
      // Keep Firebase JS SDK as the source of truth for auth state.
      skipNativeAuth: true,
      providers: ['google.com'],
    },
    SplashScreen: {
      // Keep a single native splash until AppComponent hides it.
      launchAutoHide: false,
      launchFadeOutDuration: 0,
      backgroundColor: '#5b6ef5',
      androidSplashResourceName: 'rm_boot_splash',
      showSpinner: false,
    },
  },
};

export default config;
