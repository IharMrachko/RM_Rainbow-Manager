import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

export interface ChoiceSheetOption<T = string> {
  value: T;
  labelKey: string;
  /** Emoji or plain text glyph */
  icon?: string;
  /** Ionic icon name, e.g. book-outline */
  ionIcon?: string;
  /**
   * Open the system file picker on tap (keeps the user gesture).
   * Sheet closes with `{ value, files }` after selection.
   */
  filePick?: {
    accept: string;
    multiple?: boolean;
  };
}

export interface ChoiceSheetData<T = string> {
  titleKey: string;
  options: ChoiceSheetOption<T>[];
  cancelKey?: string;
}

/** Normal option value, or file-pick payload. */
export type ChoiceSheetResult<T> = T | { value: T; files: File[] };

export function isChoiceSheetFiles<T>(
  result: ChoiceSheetResult<T> | null | undefined,
): result is { value: T; files: File[] } {
  return !!result && typeof result === 'object' && Array.isArray((result as { files?: unknown }).files);
}

@Component({
  standalone: true,
  imports: [TranslateModule, IonicModule],
  selector: 'app-choice-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-choice-sheet" role="dialog" aria-modal="true">
      <h2>{{ data.titleKey | translate }}</h2>
      @for (opt of data.options; track trackOpt($index, opt)) {
        @if (opt.filePick) {
          <label class="rm-choice-sheet__opt">
            <input
              type="file"
              hidden
              [attr.accept]="opt.filePick.accept"
              [multiple]="!!opt.filePick.multiple"
              (change)="onFilePicked(opt, $event)"
            />
            @if (opt.ionIcon || opt.icon) {
              <span class="rm-choice-sheet__icon">
                @if (opt.ionIcon) {
                  <ion-icon [name]="opt.ionIcon"></ion-icon>
                } @else {
                  {{ opt.icon }}
                }
              </span>
            }
            <span>{{ opt.labelKey | translate }}</span>
          </label>
        } @else {
          <button type="button" class="rm-choice-sheet__opt" (click)="choose(opt.value)">
            @if (opt.ionIcon || opt.icon) {
              <span class="rm-choice-sheet__icon">
                @if (opt.ionIcon) {
                  <ion-icon [name]="opt.ionIcon"></ion-icon>
                } @else {
                  {{ opt.icon }}
                }
              </span>
            }
            <span>{{ opt.labelKey | translate }}</span>
          </button>
        }
      }
      <button type="button" class="rm-choice-sheet__cancel" (click)="cancel()">
        {{ (data.cancelKey || 'cancel') | translate }}
      </button>
    </div>
  `,
  styles: [
    `
      app-choice-sheet {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }

      .rm-choice-sheet {
        display: block;
        width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding: 22px 18px calc(14px + env(safe-area-inset-bottom, 0px));
        border-radius: 22px 22px 0 0;
        background: var(--rm-elevated, #fff);
        box-shadow: 0 16px 40px rgba(22, 24, 42, 0.22);
        text-align: center;
      }

      .rm-choice-sheet h2 {
        margin: 0 0 16px;
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--rm-ink, #16182a);
      }

      .rm-choice-sheet__opt {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 52px;
        padding: 12px 16px;
        margin-bottom: 10px;
        border: 0;
        border-radius: 14px;
        background: var(--rm-surface-2, #f3f4f6);
        color: var(--rm-ink, #16182a);
        font-size: 1rem;
        font-weight: 600;
        text-align: left;
        box-sizing: border-box;
        cursor: pointer;
      }

      label.rm-choice-sheet__opt {
        margin-bottom: 10px;
      }

      .rm-choice-sheet__icon {
        flex: 0 0 40px;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(181, 118, 199, 0.16);
        color: #8a4fa0;
        font-size: 1.25rem;
      }

      .rm-choice-sheet__icon ion-icon {
        font-size: 1.3rem;
      }

      .rm-choice-sheet__cancel {
        width: 100%;
        min-height: 44px;
        margin-top: 4px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: #3b82f6;
        font-size: 1rem;
        font-weight: 700;
      }
    `,
  ],
})
export class ChoiceSheetComponent<T = string> {
  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: ChoiceSheetData<T>,
    @Inject(OVERLAY_SHEET_REF) private readonly sheetRef: OverlaySheetRef<ChoiceSheetResult<T>>,
  ) {}

  trackOpt(index: number, opt: ChoiceSheetOption<T>): string {
    return `${index}:${String(opt.value)}`;
  }

  choose(value: T): void {
    this.sheetRef.close(value);
  }

  onFilePicked(opt: ChoiceSheetOption<T>, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    this.sheetRef.close({ value: opt.value, files });
  }

  cancel(): void {
    this.sheetRef.close(undefined);
  }
}
