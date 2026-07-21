import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

export interface LookbookPdfPreviewData {
  title: string;
  pages: string[];
}

export type LookbookPdfPreviewResult = 'share' | 'save' | 'cancel';

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule],
  selector: 'app-lookbook-pdf-preview-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="lb-pdf-preview" role="dialog" aria-modal="true">
      <header class="lb-pdf-preview__head">
        <button
          type="button"
          class="lb-pdf-preview__icon-btn"
          (click)="dismiss('cancel')"
          aria-label="Close"
        >
          <ion-icon name="close-outline"></ion-icon>
        </button>
        <div class="lb-pdf-preview__titles">
          <div class="lb-pdf-preview__label">
            {{ 'lookbookPdfPreview' | translate }} · {{ data.pages.length }}
          </div>
          <div class="lb-pdf-preview__title">{{ data.title }}</div>
        </div>
        <div class="lb-pdf-preview__actions">
          <button
            type="button"
            class="lb-pdf-preview__icon-btn"
            (click)="dismiss('save')"
            [attr.aria-label]="'lookbookPdfSave' | translate"
          >
            <ion-icon name="download-outline"></ion-icon>
          </button>
          <button
            type="button"
            class="lb-pdf-preview__icon-btn lb-pdf-preview__icon-btn--primary"
            (click)="dismiss('share')"
            [attr.aria-label]="'lookbookPdfShare' | translate"
          >
            <ion-icon name="share-outline"></ion-icon>
          </button>
        </div>
      </header>

      <div class="lb-pdf-preview__stage">
        @if (!firstPageReady) {
          <div class="lb-pdf-preview__loading">
            <ion-spinner name="crescent"></ion-spinner>
            <span>{{ 'lookbookPdfLoading' | translate }}</span>
          </div>
        }
        @for (page of data.pages; track $index) {
          <figure class="lb-pdf-preview__page">
            <div class="lb-pdf-preview__frame" [class.is-ready]="isReady($index)">
              <div class="lb-pdf-preview__skeleton"></div>
              <img
                [src]="page"
                [alt]="'Page ' + ($index + 1)"
                (load)="markReady($index)"
                (error)="markReady($index)"
              />
            </div>
            <figcaption>{{ $index + 1 }}</figcaption>
          </figure>
        }
      </div>
    </div>
  `,
  styles: [
    `
      app-lookbook-pdf-preview-sheet {
        display: block;
        width: 100%;
        height: 100%;
      }

      .lb-pdf-preview {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: #1a1c28;
        color: #fff;
        box-sizing: border-box;
      }

      .lb-pdf-preview__head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: calc(8px + env(safe-area-inset-top, 0px)) 10px 8px;
        background: rgba(18, 20, 31, 0.96);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      .lb-pdf-preview__icon-btn {
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        display: grid;
        place-items: center;
      }

      .lb-pdf-preview__icon-btn--primary {
        background: #7b4b94;
        box-shadow: 0 4px 14px rgba(123, 75, 148, 0.35);
      }

      .lb-pdf-preview__icon-btn ion-icon {
        font-size: 20px;
      }

      .lb-pdf-preview__titles {
        flex: 1;
        min-width: 0;
      }

      .lb-pdf-preview__label {
        font-size: 0.72rem;
        opacity: 0.7;
        font-weight: 600;
      }

      .lb-pdf-preview__title {
        font-size: 0.9rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lb-pdf-preview__actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .lb-pdf-preview__stage {
        position: relative;
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 14px 16px 8px;
        -webkit-overflow-scrolling: touch;
      }

      .lb-pdf-preview__loading {
        position: absolute;
        z-index: 10;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: #1a1c28;
        color: rgba(255, 255, 255, 0.78);
        font-size: 0.82rem;
        font-weight: 600;
      }

      .lb-pdf-preview__loading ion-spinner {
        width: 34px;
        height: 34px;
        color: #b98acb;
      }

      .lb-pdf-preview__page {
        margin: 0 0 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }

      .lb-pdf-preview__page:last-child {
        margin-bottom: 4px;
      }

      .lb-pdf-preview__frame {
        position: relative;
        width: 100%;
        max-width: 420px;
        aspect-ratio: 794 / 1123;
        border-radius: 6px;
        background: #fff;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        overflow: hidden;
      }

      .lb-pdf-preview__page img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        opacity: 0;
        transition: opacity 180ms ease;
      }

      .lb-pdf-preview__frame.is-ready img {
        opacity: 1;
      }

      .lb-pdf-preview__skeleton {
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, #eef0f4 35%, #fafbfc 48%, #eef0f4 62%);
        background-size: 240% 100%;
        animation: lb-pdf-shimmer 1.15s linear infinite;
      }

      .lb-pdf-preview__frame.is-ready .lb-pdf-preview__skeleton {
        display: none;
      }

      .lb-pdf-preview__page figcaption {
        font-size: 0.72rem;
        font-weight: 600;
        opacity: 0.55;
        letter-spacing: 0.04em;
      }

      @keyframes lb-pdf-shimmer {
        from { background-position: 100% 0; }
        to { background-position: -100% 0; }
      }
    `,
  ],
})
export class LookbookPdfPreviewSheetComponent {
  private readonly readyPages = new Set<number>();
  firstPageReady = false;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: LookbookPdfPreviewData,
    @Inject(OVERLAY_SHEET_REF)
    private readonly sheetRef: OverlaySheetRef<LookbookPdfPreviewResult>,
  ) {}

  isReady(index: number): boolean {
    return this.readyPages.has(index);
  }

  markReady(index: number): void {
    this.readyPages.add(index);
    if (index === 0 || this.readyPages.size > 0) {
      this.firstPageReady = true;
    }
  }

  dismiss(result: LookbookPdfPreviewResult): void {
    this.sheetRef.close(result);
  }
}
