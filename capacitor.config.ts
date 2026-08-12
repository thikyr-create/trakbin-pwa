import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trakbin.app',
  appName: 'Trakbin',
  webDir: 'public/dummy', // TEMPORARY: WebView loads live URL, not bundled assets
  server: {
    url: 'https://trakbin.vercel.app', // Replace with your actual deployment URL
    cleartext: false, // HTTPS only in production
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false, // We control dismissal after auth + routing
      androidScaleType: 'CENTER_CROP',
      backgroundColor: '#064e3b', // emerald-950
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#064e3b',
      overlaysWebView: false, // RELIABLE LAYOUT FIRST — no edge-to-edge yet
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;