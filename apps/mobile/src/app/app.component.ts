import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { initNativeChrome } from './core/init-native';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private readonly language: LanguageService,
    private readonly theme: ThemeService,
    private readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    void this.boot();
  }

  private async boot(): Promise<void> {
    void this.language.language;
    void this.theme.isDark;

    try {
      await Promise.race([
        this.auth.whenReady(),
        new Promise<void>((resolve) => setTimeout(resolve, 3500)),
      ]);
    } finally {
      // Prepare chrome under the native splash, then remove splash once.
      await initNativeChrome();
      if (Capacitor.isNativePlatform()) {
        try {
          await SplashScreen.hide({ fadeOutDuration: 0 });
        } catch {
          // ignore
        }
      }
    }
  }
}
