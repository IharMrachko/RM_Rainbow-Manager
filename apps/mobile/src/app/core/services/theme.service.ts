import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly darkSubject = new BehaviorSubject<boolean>(
    localStorage.getItem('theme') === 'dark',
  );
  readonly isDark$ = this.darkSubject.asObservable();

  constructor() {
    this.apply(this.darkSubject.value);
  }

  get isDark(): boolean {
    return this.darkSubject.value;
  }

  setDark(isDark: boolean): void {
    if (this.darkSubject.value === isDark) {
      return;
    }
    this.darkSubject.next(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.apply(isDark);
  }

  toggle(): void {
    this.setDark(!this.isDark);
  }

  private apply(isDark: boolean): void {
    // Same as Vue web: class on <html>
    document.documentElement.classList.toggle('dark', isDark);
    // Ionic class-based palette hook (if palette CSS is present)
    document.documentElement.classList.toggle('ion-palette-dark', isDark);
    document.body.classList.toggle('dark', isDark);
    void this.syncStatusBar(isDark);
  }

  private async syncStatusBar(isDark: boolean): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      await StatusBar.setBackgroundColor({ color: isDark ? '#12131a' : '#eef0f7' });
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch {
      // ignore
    }
  }
}
