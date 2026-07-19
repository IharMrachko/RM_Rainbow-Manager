import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

export interface ConfirmSheetData {
  titleKey: string;
  messageKey: string;
  confirmKey?: string;
  cancelKey?: string;
  danger?: boolean;
}

export type ConfirmSheetResult = boolean | undefined;

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule],
  selector: 'app-confirm-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-confirm-sheet" role="dialog" aria-modal="true">
      <div class="rm-confirm-sheet__icon" [class.is-danger]="data.danger !== false">
        <ion-icon name="trash-outline"></ion-icon>
      </div>
      <h2>{{ data.titleKey | translate }}</h2>
      <p>{{ data.messageKey | translate }}</p>
      <div class="rm-confirm-sheet__actions">
        <button type="button" class="rm-confirm-sheet__cancel" (click)="cancel()">
          {{ (data.cancelKey || 'cancel') | translate }}
        </button>
        <button
          type="button"
          class="rm-confirm-sheet__ok"
          [class.is-danger]="data.danger !== false"
          (click)="ok()"
        >
          {{ (data.confirmKey || 'delete') | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      app-confirm-sheet {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }

      .rm-confirm-sheet {
        width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding: 22px 18px calc(16px + env(safe-area-inset-bottom, 0px));
        border-radius: 22px 22px 0 0;
        background: #fff;
        box-shadow: 0 16px 40px rgba(22, 24, 42, 0.22);
        text-align: center;
        color: #16182a;
      }

      .rm-confirm-sheet__icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 12px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: rgba(91, 110, 245, 0.12);
        color: #5b6ef5;
        font-size: 1.6rem;
      }

      .rm-confirm-sheet__icon.is-danger {
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
      }

      .rm-confirm-sheet h2 {
        margin: 0 0 8px;
        font-size: 1.15rem;
        font-weight: 700;
      }

      .rm-confirm-sheet p {
        margin: 0 0 18px;
        font-size: 0.95rem;
        line-height: 1.4;
        color: #5c6178;
      }

      .rm-confirm-sheet__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .rm-confirm-sheet__cancel,
      .rm-confirm-sheet__ok {
        min-height: 48px;
        border: 0;
        border-radius: 14px;
        font-size: 0.95rem;
        font-weight: 700;
      }

      .rm-confirm-sheet__cancel {
        background: #eef0f7;
        color: #16182a;
      }

      .rm-confirm-sheet__ok {
        background: #5b6ef5;
        color: #fff;
      }

      .rm-confirm-sheet__ok.is-danger {
        background: #ef4444;
      }
    `,
  ],
})
export class ConfirmSheetComponent {
  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: ConfirmSheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly sheetRef: OverlaySheetRef<ConfirmSheetResult>,
  ) {}

  ok(): void {
    this.sheetRef.close(true);
  }

  cancel(): void {
    this.sheetRef.close(false);
  }
}
