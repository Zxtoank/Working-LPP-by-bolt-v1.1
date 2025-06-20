import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.customory.locket',
  appName: 'Locket Photo Print',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    url: 'https://locket.customory.com/', // ← Replace with your actual URL
    cleartext: false // Allow HTTP? (false = HTTPS only)
  }
};

export default config;
