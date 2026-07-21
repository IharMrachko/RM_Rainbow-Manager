import { Component, signal, WritableSignal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
})
export class SignInPage {
  loading: WritableSignal<boolean> = signal(false);
  loadingGoogle: WritableSignal<boolean> = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {}

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email, password);
      await this.router.navigateByUrl('/tabs/characteristics', { replaceUrl: true });
    } catch (err) {
      await this.toast.show(this.authErrorMessage(err), 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async google(): Promise<void> {
    if (this.loading()) {
      return;
    }
    this.loadingGoogle.set(true);
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigateByUrl('/tabs/characteristics', { replaceUrl: true });
    } catch (err) {
      await this.toast.show(this.authErrorMessage(err), 'danger');
    } finally {
      this.loadingGoogle.set(false);
    }
  }

  private authErrorMessage(err: unknown): string {
    const code = (err as { code?: string })?.code ?? '';
    const map: Record<string, string> = {
      'auth/invalid-credential': 'loginInvalidCredential',
      'auth/wrong-password': 'loginInvalidCredential',
      'auth/user-not-found': 'loginInvalidCredential',
      'auth/invalid-email': 'loginInvalidEmail',
      'auth/too-many-requests': 'loginTooMany',
      'auth/network-request-failed': 'loginNetwork',
      'auth/unauthorized-domain': 'loginUnauthorizedDomain',
      'auth/operation-not-supported-in-this-environment': 'googleSignInError',
      'auth/missing-id-token': 'googleSignInError',
      'auth/popup-closed-by-user': 'loginPopupClosed',
      'auth/popup-blocked': 'loginPopupBlocked',
    };
    const key = map[code];
    if (key) {
      return this.translate.instant(key);
    }
    return this.translate.instant('loginError');
  }
}
