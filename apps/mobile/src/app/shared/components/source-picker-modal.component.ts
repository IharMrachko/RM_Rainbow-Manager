import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

export type SourcePickerResult = 'gallery' | 'camera' | null;

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule],
  selector: 'app-source-picker-modal',
  template: `
    <div class="sheet">
      <h2>{{ 'chooseSource' | translate }}</h2>

      <button type="button" class="opt" (click)="choose('gallery')">
        <span class="opt__icon"><ion-icon name="images-outline"></ion-icon></span>
        <span>{{ 'pickPhoto' | translate }}</span>
      </button>

      <button type="button" class="opt" (click)="choose('camera')">
        <span class="opt__icon"><ion-icon name="camera-outline"></ion-icon></span>
        <span>{{ 'takePhoto' | translate }}</span>
      </button>

      <ion-button expand="block" fill="clear" color="primary" (click)="dismiss()">
        {{ 'cancel' | translate }}
      </ion-button>
    </div>
  `,
  styles: [
    `
      .sheet {
        padding: 22px 18px calc(14px + env(safe-area-inset-bottom));
        background: #fff;
        border-radius: 22px;
        text-align: center;
      }
      h2 {
        margin: 0 0 18px;
        font-size: 1.15rem;
        font-weight: 700;
        color: #1a1b26;
      }
      .opt {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        margin-bottom: 10px;
        border: none;
        border-radius: 14px;
        background: #f3f4f6;
        font-size: 1rem;
        font-weight: 600;
        color: #1a1b26;
      }
      .opt__icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(59, 130, 246, 0.12);
        color: #3b82f6;
        font-size: 1.35rem;
      }
    `,
  ],
})
export class SourcePickerModalComponent {
  constructor(private readonly modalCtrl: ModalController) {}

  choose(result: Exclude<SourcePickerResult, null>): void {
    void this.modalCtrl.dismiss(result, 'confirm');
  }

  dismiss(): void {
    void this.modalCtrl.dismiss(null, 'cancel');
  }
}
