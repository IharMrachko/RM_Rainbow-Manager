import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService, AppLanguage } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';

interface MoreLink {
  titleKey: string;
  url: string;
  icon: string;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, RouterModule],
  selector: 'app-more',
  templateUrl: './more.page.html',
  styleUrls: ['./more.page.scss'],
})
export class MorePage {
  readonly links: MoreLink[] = [
    { titleKey: 'characteristicColors', url: '/main/characteristic-colors', icon: 'color-palette' },
    { titleKey: 'paletteDeterminant', url: '/main/palette-determinant', icon: 'brush' },
    { titleKey: 'cutPalette', url: '/main/cut-palette', icon: 'cut' },
    { titleKey: 'myPalette', url: '/main/my-palette', icon: 'water' },
    { titleKey: 'analysisByPhoto', url: '/tabs/palette', icon: 'camera' },
    { titleKey: 'pickColor', url: '/main/chroma', icon: 'eyedrop' },
    { titleKey: 'consultation', url: '/main/consultation', icon: 'chatbubbles' },
  ];

  constructor(
    readonly auth: AuthService,
    readonly theme: ThemeService,
    readonly language: LanguageService,
    private readonly router: Router,
  ) {}

  setLanguage(lang: AppLanguage): void {
    this.language.setLanguage(lang);
  }

  onThemeChange(isDark: boolean): void {
    this.theme.setDark(isDark);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/sign-in');
  }
}
