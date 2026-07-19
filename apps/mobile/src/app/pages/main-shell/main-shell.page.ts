import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService, AppLanguage } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';

interface TabItem {
  titleKey: string;
  url: string;
  icon: string;
  match: string[];
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, RouterModule],
  selector: 'app-main-shell',
  templateUrl: './main-shell.page.html',
  styleUrls: ['./main-shell.page.scss'],
})
export class MainShellPage {
  activeUrl = '';

  readonly tabs: TabItem[] = [
    {
      titleKey: 'home',
      url: '/main/home',
      icon: 'home',
      match: ['/main/home'],
    },
    {
      titleKey: 'gallery',
      url: '/main/gallery',
      icon: 'images',
      match: ['/main/gallery'],
    },
    {
      titleKey: 'aiAgent',
      url: '/main/ai-agent',
      icon: 'flash',
      match: ['/main/ai-agent'],
    },
    {
      titleKey: 'more',
      url: '/main/more',
      icon: 'grid',
      match: ['/main/more'],
    },
  ];

  constructor(
    readonly auth: AuthService,
    readonly theme: ThemeService,
    readonly language: LanguageService,
    private readonly router: Router,
  ) {
    this.activeUrl = this.router.url;
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.activeUrl = e.urlAfterRedirects;
      });
  }

  isTabActive(tab: TabItem): boolean {
    if (tab.match.some((m) => this.activeUrl === m || this.activeUrl.startsWith(m + '?'))) {
      return true;
    }
    // Tools opened from Home still highlight Home
    if (tab.url === '/main/home') {
      const toolRoots = [
        '/main/characteristic-colors',
        '/main/palette-determinant',
        '/main/cut-palette',
        '/main/my-palette',
        '/main/palette',
        '/main/chroma',
        '/main/consultation',
      ];
      return toolRoots.some((p) => this.activeUrl.startsWith(p));
    }
    return false;
  }

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
