import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { User } from 'firebase/auth';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  globeOutline,
  logOutOutline,
  mailOutline,
  moonOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import {
  AccountPlanService,
  AccountUsageLimit,
} from '../../core/services/account-plan.service';
import { AppMenuService } from '../../core/services/app-menu.service';
import { AuthService } from '../../core/services/auth.service';
import { AppLanguage, LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import { userAvatarInitials } from '../../core/utils/user-avatar';

addIcons({
  chatbubbleEllipsesOutline,
  globeOutline,
  logOutOutline,
  mailOutline,
  moonOutline,
});

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonToggle,
    IonSegment,
    IonSegmentButton,
  ],
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
})
export class AccountPage implements OnInit, OnDestroy {
  user: User | null = null;
  readonly usageLimits: AccountUsageLimit[];
  private sub = new Subscription();

  constructor(
    readonly plans: AccountPlanService,
    readonly theme: ThemeService,
    readonly language: LanguageService,
    private readonly auth: AuthService,
    private readonly appMenu: AppMenuService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.usageLimits = this.plans.getUsageLimits();
  }

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    this.sub.add(
      this.auth.user$.subscribe((user) => {
        this.user = user;
        this.cdr.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get photoUrl(): string | null {
    return this.user?.photoURL?.trim() || null;
  }

  get displayName(): string {
    return this.user?.displayName?.trim() || this.user?.email?.split('@')[0] || '';
  }

  get email(): string {
    return this.user?.email?.trim() || '';
  }

  get initials(): string {
    return userAvatarInitials(this.user?.displayName, this.user?.email);
  }

  openAppMenu(): void {
    void this.appMenu.open();
  }

  usagePercent(limit: AccountUsageLimit): number {
    return this.plans.usagePercent(limit);
  }

  setTheme(isDark: boolean): void {
    this.theme.setDark(isDark);
    this.cdr.markForCheck();
  }

  setLanguage(lang: AppLanguage): void {
    this.language.setLanguage(lang);
    this.cdr.markForCheck();
  }

  openConsultation(): void {
    void this.router.navigateByUrl('/tabs/consultation');
  }

  openContacts(): void {
    void this.router.navigateByUrl('/contacts');
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/home');
  }
}
