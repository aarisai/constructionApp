import { Capacitor } from '@capacitor/core'

export async function syncNativeChrome(theme: 'light' | 'dark'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const { StatusBar, Style } = await import('@capacitor/status-bar')
  await StatusBar.setOverlaysWebView({ overlay: true })
  await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light })
}
