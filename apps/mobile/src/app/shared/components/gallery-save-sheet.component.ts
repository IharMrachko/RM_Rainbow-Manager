import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GalleryFolder } from '../../core/services/folder.service';
import { GalleryService } from '../../core/services/gallery.service';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
  OverlaySheetService,
} from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  FolderPickerSheetComponent,
  FolderPickerSheetData,
  FolderPickerSheetResult,
} from './folder-picker-sheet.component';

export interface GallerySaveSheetData {
  canvas: HTMLCanvasElement;
  previewUrl: string;
  folders: GalleryFolder[];
  coloristicType?: string;
  maskType?: string;
  paletteType?: string;
}

export interface GallerySaveSheetResult {
  saved: boolean;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  selector: 'app-gallery-save-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-gsave" role="dialog" aria-modal="true">
      <header class="rm-gsave__head">
        <h2>{{ 'addSign' | translate }}</h2>
        <button type="button" class="rm-gsave__close" (click)="dismiss()" aria-label="close">
          <ion-icon name="close"></ion-icon>
        </button>
      </header>

      <div class="rm-gsave__preview">
        <img [src]="data.previewUrl" alt="" />
      </div>

      <div class="rm-gsave__badges">
        @if (folderId) {
          <span class="rm-gsave__badge">{{ folderName }}</span>
        }
        @if (data.coloristicType) {
          <span class="rm-gsave__badge">{{ data.coloristicType | translate }}</span>
        }
        @if (data.maskType) {
          <span class="rm-gsave__badge">{{ data.maskType | translate }}</span>
        }
        @if (data.paletteType) {
          <span class="rm-gsave__badge">{{ data.paletteType | translate }}</span>
        }
      </div>

      <button type="button" class="rm-gsave__folder" (click)="openFolderPicker()">
        <span class="rm-gsave__label">{{ 'folder' | translate }}</span>
        <span class="rm-gsave__folder-value">
          <span>{{ folderName || ('all' | translate) }}</span>
          <ion-icon name="folder-outline"></ion-icon>
        </span>
      </button>

      <label class="rm-gsave__field">
        <span class="rm-gsave__label">{{ 'noName' | translate }}</span>
        <input
          class="rm-gsave__input"
          type="text"
          [(ngModel)]="title"
          [placeholder]="'noName' | translate"
        />
      </label>

      <ion-button
        expand="block"
        color="warning"
        class="rm-gsave__save"
        [disabled]="saving"
        (click)="save()"
      >
        @if (saving) {
          <ion-spinner name="crescent"></ion-spinner>
        } @else {
          {{ 'saveToGallery' | translate }}
        }
      </ion-button>
    </div>
  `,
  styles: [
    `
      app-gallery-save-sheet {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }

      .rm-gsave {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        box-sizing: border-box;
        padding: 16px 16px calc(14px + env(safe-area-inset-bottom, 0px));
        border-radius: 22px 22px 0 0;
        background: var(--rm-elevated, #fff);
        box-shadow: 0 16px 40px rgba(22, 24, 42, 0.22);
        color: var(--rm-ink, #16182a);
      }

      .rm-gsave__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .rm-gsave__head h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
      }

      .rm-gsave__close {
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

      .rm-gsave__preview {
        display: flex;
        justify-content: center;
        max-height: 36vh;
        overflow: hidden;
        border-radius: 14px;
        background: var(--rm-surface, #eef0f7);
      }

      .rm-gsave__preview img {
        display: block;
        max-width: 100%;
        max-height: 36vh;
        width: auto;
        height: auto;
        object-fit: contain;
      }

      .rm-gsave__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .rm-gsave__badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: #eef0f7;
        color: #5c6178;
        font-size: 0.78rem;
        font-weight: 650;
      }

      .rm-gsave__folder {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 4px;
        min-height: 58px;
        padding: 10px 14px;
        border: 0;
        border-radius: 12px;
        background: #eef0f7;
        color: inherit;
        text-align: left;
        box-sizing: border-box;
      }

      .rm-gsave__folder-value {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 0.98rem;
        font-weight: 650;
        color: #16182a;
      }

      .rm-gsave__folder-value ion-icon {
        font-size: 1.15rem;
        color: #5c6178;
      }

      .rm-gsave__field {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 58px;
        padding: 10px 14px;
        border-radius: 12px;
        background: #eef0f7;
        box-sizing: border-box;
      }

      .rm-gsave__label {
        font-size: 0.78rem;
        font-weight: 600;
        color: #5c6178;
      }

      .rm-gsave__input {
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

      .rm-gsave__save {
        margin: 0;
        min-height: 48px;
        font-weight: 700;
        --border-radius: 14px;
      }
    `,
  ],
})
export class GallerySaveSheetComponent {
  title = '';
  folderId = '';
  saving = false;
  private folders: GalleryFolder[];

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: GallerySaveSheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly sheetRef: OverlaySheetRef<GallerySaveSheetResult>,
    private readonly gallery: GalleryService,
    private readonly sheets: OverlaySheetService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
  ) {
    this.folders = [...(data.folders ?? [])];
  }

  get folderName(): string {
    return this.folders.find((f) => f.id === this.folderId)?.name ?? '';
  }

  dismiss(): void {
    this.sheetRef.close({ saved: false });
  }

  async openFolderPicker(): Promise<void> {
    const result = await this.sheets.open<
      FolderPickerSheetComponent,
      FolderPickerSheetData,
      FolderPickerSheetResult
    >(
      FolderPickerSheetComponent,
      { selectedId: this.folderId || undefined, allowClear: true },
      { fullscreen: true, stack: true, closeOnBackdrop: false },
    );
    if (!result) {
      return;
    }
    this.folders = result.folders;
    if (result.chose) {
      this.folderId = result.folder?.id ?? '';
    } else if (this.folderId && !this.folders.some((f) => f.id === this.folderId)) {
      this.folderId = '';
    }
  }

  async save(): Promise<void> {
    if (this.saving || !this.data.canvas) {
      return;
    }
    this.saving = true;
    try {
      await this.gallery.saveImage({
        canvas: this.data.canvas,
        title: this.title.trim(),
        coloristicType: this.data.coloristicType ?? '',
        maskType: this.data.maskType ?? '',
        paletteType: this.data.paletteType ?? '',
        folderId: this.folderId || '',
      });
      await this.toasts.show(this.translate.instant('successImage'), 'success');
      this.sheetRef.close({ saved: true });
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('saveError'), 'danger');
      this.saving = false;
    }
  }
}
