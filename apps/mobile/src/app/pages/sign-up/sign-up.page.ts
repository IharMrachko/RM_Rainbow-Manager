import { Component, signal, WritableSignal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
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
    IonSpinner,
  ],
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage {
  loading: WritableSignal<boolean> = signal(false);
  loadingGoogle: WritableSignal<boolean> = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {}

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading() || this.loadingGoogle()) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      await this.toast.show(this.translate.instant('registerError'), 'danger');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.signUp(email, password);
      await this.router.navigateByUrl('/tabs/characteristics', { replaceUrl: true });
    } catch {
      await this.toast.show(this.translate.instant('registerError'), 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async google(): Promise<void> {
    if (this.loading() || this.loadingGoogle()) {
      return;
    }
    this.loadingGoogle.set(true);
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigateByUrl('/tabs/characteristics', { replaceUrl: true });
    } catch {
      await this.toast.show(this.translate.instant('googleSignInError'), 'danger');
    } finally {
      this.loadingGoogle.set(false);
    }
  }
}
