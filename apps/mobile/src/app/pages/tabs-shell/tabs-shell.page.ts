import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
  MenuController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { AppMenuService } from '../../core/services/app-menu.service';
import { AppLanguage, LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';

interface NavItem {
  titleKey: string;
  url: string;
  icon: string;
}

interface TabItem {
  tab: string;
  titleKey: string;
  url: string;
  icon: string;
}

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonTabs,
    IonTabBar,
    IonTabButton,
  ],
  selector: 'app-tabs-shell',
  templateUrl: './tabs-shell.page.html',
  styleUrls: ['./tabs-shell.page.scss'],
})
export class TabsShellPage implements OnInit, OnDestroy {
  activeUrl = '';

  readonly tabs: TabItem[] = [
    {
      tab: 'characteristics',
      titleKey: 'tabCharacteristics',
      url: '/tabs/characteristics',
      icon: 'color-palette',
    },
    {
      tab: 'palette-determinant',
      titleKey: 'tabPicker',
      url: '/tabs/palette-determinant',
      icon: 'scan-outline',
    },
    {
      tab: 'palette',
      titleKey: 'tabAnalysis',
      url: '/tabs/palette',
      icon: 'camera-outline',
    },
    {
      tab: 'gallery',
      titleKey: 'gallery',
      url: '/tabs/gallery',
      icon: 'images',
    },
  ];

  readonly menuTools: NavItem[] = [
    { titleKey: 'characteristicColors', url: '/tabs/characteristics', icon: 'color-palette' },
    { titleKey: 'myPalette', url: '/tabs/my-palette', icon: 'color-palette' },
    { titleKey: 'paletteDeterminant', url: '/tabs/palette-determinant', icon: 'scan-outline' },
    { titleKey: 'analysisByPhoto', url: '/tabs/palette', icon: 'camera-outline' },
    { titleKey: 'cutPalette', url: '/tabs/cut', icon: 'cut' },
    { titleKey: 'pickColor', url: '/tabs/chroma', icon: 'eyedrop' },
    { titleKey: 'aiAgent', url: '/tabs/ai-agent', icon: 'chatbubble-ellipses-outline' },
    { titleKey: 'consultation', url: '/tabs/consultation', icon: 'help-circle-outline' },
  ];

  private subs = new Subscription();

  constructor(
    readonly theme: ThemeService,
    readonly language: LanguageService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly appMenu: AppMenuService,
    private readonly menuCtrl: MenuController,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.activeUrl = this.router.url;
  }

  ngOnInit(): void {
    this.subs.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => {
          this.activeUrl = e.urlAfterRedirects;
          this.appMenu.close();
          this.cdr.markForCheck();
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Bottom tabs only for the four primary sections. */
  get showTabBar(): boolean {
    const url = this.activeUrl.split('?')[0];
    return this.tabs.some((tab) => url === tab.url || url.startsWith(tab.url + '/'));
  }

  isMenuActive(url: string): boolean {
    return this.activeUrl === url || this.activeUrl.startsWith(url + '?');
  }

  async navigateMenu(url: string): Promise<void> {
    await this.menuCtrl.close(AppMenuService.menuId);
    await this.router.navigateByUrl(url);
  }

  setTheme(isDark: boolean): void {
    this.theme.setDark(isDark);
    this.cdr.detectChanges();
  }

  setLanguage(lang: AppLanguage): void {
    this.language.setLanguage(lang);
    this.cdr.detectChanges();
  }

  async logout(): Promise<void> {
    await this.menuCtrl.close(AppMenuService.menuId);
    await this.auth.logout();
    await this.router.navigateByUrl('/home');
  }
}
