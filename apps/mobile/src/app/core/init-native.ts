import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/** Keep WebView below the system status bar so header buttons stay tappable. */
export async function initNativeChrome(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.show();
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#eef0f7' });
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    // StatusBar plugin unavailable (e.g. web) — ignore
  }
}
