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
  IonToolbar,
  MenuController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import {
  faBookOpen,
  faCamera,
  faEyeDropper,
  faFillDrip,
  faImages,
  faMicrochip,
  faPaintbrush,
  faRainbow,
  faScissors,
  faShirt,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { AppMenuService } from '../../core/services/app-menu.service';
import { AppLanguage, LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import {
  SheetSelectComponent,
  SheetSelectOption,
} from '../../shared/components/sheet-select.component';

interface NavItem {
  titleKey: string;
  url: string;
  iconPath: string;
  iconViewBox: string;
}

interface TabItem {
  tab: string;
  titleKey: string;
  url: string;
  iconPath: string;
  iconViewBox: string;
}

function menuIcon(definition: {
  icon: [number, number, unknown, unknown, string | string[]];
}): Pick<NavItem, 'iconPath' | 'iconViewBox'> {
  const [width, height, , , path] = definition.icon;
  return {
    iconPath: Array.isArray(path) ? path.join(' ') : path,
    iconViewBox: `0 0 ${width} ${height}`,
  };
}

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonTabs,
    IonTabBar,
    IonTabButton,
    SheetSelectComponent,
  ],
  selector: 'app-tabs-shell',
  templateUrl: './tabs-shell.page.html',
  styleUrls: ['./tabs-shell.page.scss'],
})
export class TabsShellPage implements OnInit, OnDestroy {
  activeUrl = '';
  readonly languageOptions: SheetSelectOption[] = [
    { value: 'ru', label: 'RU · Русский' },
    { value: 'en', label: 'EN · English' },
  ];

  readonly tabs: TabItem[] = [
    {
      tab: 'characteristics',
      titleKey: 'tabCharacteristics',
      url: '/tabs/characteristics',
      ...menuIcon(faRainbow),
    },
    {
      tab: 'palette-determinant',
      titleKey: 'tabPicker',
      url: '/tabs/palette-determinant',
      ...menuIcon(faPaintbrush),
    },
    {
      tab: 'palette',
      titleKey: 'tabAnalysis',
      url: '/tabs/palette',
      ...menuIcon(faCamera),
    },
    {
      tab: 'gallery',
      titleKey: 'gallery',
      url: '/tabs/gallery',
      ...menuIcon(faImages),
    },
  ];

  readonly menuTools: NavItem[] = [
    { titleKey: 'characteristicColors', url: '/tabs/characteristics', ...menuIcon(faRainbow) },
    { titleKey: 'paletteDeterminant', url: '/tabs/palette-determinant', ...menuIcon(faPaintbrush) },
    { titleKey: 'cutPalette', url: '/tabs/cut', ...menuIcon(faScissors) },
    { titleKey: 'myPalette', url: '/tabs/my-palette', ...menuIcon(faFillDrip) },
    { titleKey: 'analysisByPhoto', url: '/tabs/palette', ...menuIcon(faCamera) },
    { titleKey: 'pickColor', url: '/tabs/chroma', ...menuIcon(faEyeDropper) },
    { titleKey: 'aiAgent', url: '/tabs/ai-agent', ...menuIcon(faMicrochip) },
    { titleKey: 'gallery', url: '/tabs/gallery', ...menuIcon(faImages) },
    { titleKey: 'stockLooks', url: '/tabs/stock-looks', ...menuIcon(faShirt) },
    { titleKey: 'lookbook', url: '/tabs/lookbook', ...menuIcon(faBookOpen) },
    { titleKey: 'consultation', url: '/tabs/consultation', ...menuIcon(faUserTie) },
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
