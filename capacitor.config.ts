import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hpulse.app',
  appName: 'H-Pulse',
  webDir: 'dist',
  backgroundColor: '#080b12',
  loggingBehavior: 'production',
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    webContentsDebuggingEnabled: false,
  },
};

export default config;
