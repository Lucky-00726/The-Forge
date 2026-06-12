import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name:        'The Forge',
  slug:        'the-forge',
  version:     '1.0.0',
  orientation: 'portrait',
  icon:        './assets/icon.png',
  scheme:      'theforge',

  ios: {
    supportsTablet:   false,
    bundleIdentifier: 'com.theforge.app',
  },

  android: {
    adaptiveIcon: {
      foregroundImage:  './assets/adaptive-icon.png',
      backgroundColor:  '#101415',
    },
    package: 'com.theforge.app',
  },

  web: {
    bundler: 'metro',
    output:  'static',
  },

  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image:           './assets/splash.png',
        resizeMode:      'contain',
        backgroundColor: '#101415',
      },
    ],
    [
      'expo-secure-store',
      { configureAndroidBackup: true },
    ],
    [
      'expo-build-properties',
      {
        ios:     { deploymentTarget: '16.4' },
        android: { compileSdkVersion: 36, targetSdkVersion: 36 },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    // Accessed via process.env.EXPO_PUBLIC_* at runtime
    // Never put secrets here — only EXPO_PUBLIC_ prefixed vars
    extra: {
      eas: {
        projectId: '0ac045b5-4601-499d-99ed-927a8f09a6f2',
      },
    },
  },
};

export default config;