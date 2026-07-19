import { Injectable, NgZone } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

/**
 * Ionic toasts are appended under `ion-app`. CDK fullscreen sheets live in
 * `.cdk-overlay-container` (z-index 10000) as a body sibling, so they cover
 * anything inside `ion-app` regardless of the toast's own z-index.
 * After present we re-parent the toast onto `document.body` above CDK.
 */
const TOAST_ABOVE_CDK_Z = '30000';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private active: HTMLIonToastElement | null = null;

  constructor(
    private readonly toastCtrl: ToastController,
    private readonly ngZone: NgZone,
  ) {}

  async show(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'primary',
    duration = 2500,
  ): Promise<void> {
    await this.ngZone.run(async () => {
      if (this.active) {
        try {
          await this.active.dismiss();
        } catch {
          // already dismissed
        }
        this.active = null;
      }

      const toast = await this.toastCtrl.create({
        message,
        duration,
        color,
        position: 'top',
        buttons: [{ role: 'cancel', text: 'OK' }],
      });
      this.active = toast;
      void toast.onDidDismiss().then(() => {
        if (this.active === toast) {
          this.active = null;
        }
      });
      await toast.present();
      this.liftAboveCdk(toast);
    });
  }

  private liftAboveCdk(toast: HTMLIonToastElement): void {
    if (toast.parentElement !== document.body) {
      document.body.appendChild(toast);
    }
    toast.style.setProperty('z-index', TOAST_ABOVE_CDK_Z);
    toast.style.setProperty('position', 'fixed');
  }
}
