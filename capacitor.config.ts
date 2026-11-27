import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.sankalpa.constructions',
  appName: 'Sankalpa',
  webDir: 'dist',
  backgroundColor: '#f6f3ee',
  ios: {
    contentInset: 'never',
    backgroundColor: '#f6f3ee',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#f6f3ee',
      launchAutoHide: true,
      launchShowDuration: 0,
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
    },
  },
}

export default config
