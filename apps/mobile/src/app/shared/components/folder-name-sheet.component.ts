import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

export interface FolderNameSheetData {
  mode: 'create' | 'edit';
  name?: string;
}

/** Resolves with trimmed name, or undefined if cancelled. */
export type FolderNameSheetResult = string | undefined;

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  selector: 'app-folder-name-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-fname" role="dialog" aria-modal="true">
      <header class="rm-fname__head">
        <h2>{{ (data.mode === 'edit' ? 'edit' : 'newFolder') | translate }}</h2>
        <button type="button" class="rm-fname__close" (click)="cancel()" aria-label="close">
          <ion-icon name="close"></ion-icon>
        </button>
      </header>

      <label class="rm-fname__field">
        <span class="rm-fname__label">{{ 'nameFolder' | translate }}</span>
        <input
          class="rm-fname__input"
          type="text"
          [(ngModel)]="name"
          [placeholder]="'nameFolder' | translate"
          autofocus
        />
      </label>

      <div class="rm-fname__actions">
        <ion-button expand="block" fill="outline" color="medium" (click)="cancel()">
          {{ 'cancel' | translate }}
        </ion-button>
        <ion-button expand="block" color="warning" [disabled]="!canSubmit" (click)="submit()">
          {{ 'ok' | translate }}
        </ion-button>
      </div>
    </div>
  `,
  styles: [
    `
      app-folder-name-sheet {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }

      .rm-fname {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
        padding: 16px 16px calc(14px + env(safe-area-inset-bottom, 0px));
        border-radius: 22px 22px 0 0;
        background: var(--rm-elevated, #fff);
        box-shadow: 0 16px 40px rgba(22, 24, 42, 0.22);
        color: var(--rm-ink, #16182a);
      }

      .rm-fname__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .rm-fname__head h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
      }

      .rm-fname__close {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 10px;
        background: var(--rm-surface, #eef0f7);
        color: inherit;
        font-size: 1.2rem;
      }

      .rm-fname__field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 58px;
        padding: 10px 14px;
        border-radius: 12px;
        background: #eef0f7;
        box-sizing: border-box;
      }

      .rm-fname__label {
        font-size: 0.78rem;
        font-weight: 600;
        color: #5c6178;
      }

      .rm-fname__input {
        width: 100%;
        border: 0;
        outline: none;
        background: transparent;
        color: #16182a;
        font-size: 0.98rem;
        font-weight: 650;
        padding: 0;
        margin: 0;
      }

      .rm-fname__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .rm-fname__actions ion-button {
        margin: 0;
        min-height: 46px;
        font-weight: 700;
        --border-radius: 14px;
      }
    `,
  ],
})
export class FolderNameSheetComponent {
  name = '';

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: FolderNameSheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly sheetRef: OverlaySheetRef<FolderNameSheetResult>,
  ) {
    this.name = data.name?.trim() ?? '';
  }

  get canSubmit(): boolean {
    return this.name.trim().length > 0;
  }

  cancel(): void {
    this.sheetRef.close(undefined);
  }

  submit(): void {
    const trimmed = this.name.trim();
    if (!trimmed) {
      return;
    }
    this.sheetRef.close(trimmed);
  }
}
