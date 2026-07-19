import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmService } from '../../core/services/confirm.service';
import { FolderService, GalleryFolder } from '../../core/services/folder.service';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
  OverlaySheetService,
} from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from './choice-sheet.component';
import {
  FolderNameSheetComponent,
  FolderNameSheetData,
  FolderNameSheetResult,
} from './folder-name-sheet.component';

export interface FolderPickerSheetData {
  selectedId?: string;
  /** Show “no folder” clear action (save / assign). */
  allowClear?: boolean;
}

export interface FolderPickerSheetResult {
  /** Set when user confirms Choose / Clear. */
  chose: boolean;
  folder: GalleryFolder | null;
  folders: GalleryFolder[];
  changed: boolean;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  selector: 'app-folder-picker-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-fpick" role="dialog" aria-modal="true">
      <header class="rm-fpick__bar">
        <button type="button" class="rm-fpick__icon-btn" (click)="dismiss()" aria-label="close">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </button>
        <div class="rm-fpick__title">{{ 'folder' | translate }}</div>
        <button
          type="button"
          class="rm-fpick__icon-btn rm-fpick__icon-btn--accent"
          (click)="createFolder()"
          [attr.aria-label]="'newFolder' | translate"
        >
          <ion-icon name="add"></ion-icon>
        </button>
      </header>

      <div class="rm-fpick__body">
        <div class="rm-fpick__search">
          <ion-input
            class="rm-fpick__search-input"
            type="search"
            inputmode="search"
            enterkeyhint="search"
            fill="outline"
            mode="md"
            [clearInput]="true"
            [placeholder]="'search' | translate"
            [value]="query"
            (ionInput)="onQuery($event)"
          >
            <ion-icon slot="start" name="search-outline" aria-hidden="true"></ion-icon>
          </ion-input>
        </div>

        @if (loading) {
          <div class="rm-fpick__loader">
            <ion-spinner name="crescent"></ion-spinner>
          </div>
        } @else if (!filtered.length) {
          <p class="rm-fpick__empty">{{ 'noFolders' | translate }}</p>
        } @else {
          <div class="rm-fpick__list">
            @for (folder of filtered; track folder.id) {
              <div
                class="rm-fpick__card"
                [class.is-selected]="selectedId === folder.id"
              >
                <button type="button" class="rm-fpick__card-main" (click)="select(folder)">
                  <ion-icon name="folder-outline"></ion-icon>
                  <strong>{{ folder.name }}</strong>
                </button>
                <button
                  type="button"
                  class="rm-fpick__menu"
                  (click)="openMenu(folder)"
                  aria-label="menu"
                >
                  <ion-icon name="ellipsis-vertical"></ion-icon>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <footer class="rm-fpick__footer">
        @if (data.allowClear) {
          <ion-button expand="block" fill="outline" color="medium" (click)="clear()">
            {{ 'all' | translate }}
          </ion-button>
        }
        <ion-button
          expand="block"
          color="warning"
          [disabled]="!selected"
          (click)="choose()"
        >
          {{ 'choose' | translate }}
        </ion-button>
      </footer>
    </div>
  `,
  styles: [
    `
      .rm-fpick {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: var(--rm-surface, #eef0f7);
        color: var(--rm-ink, #16182a);
      }

      .rm-fpick__bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px;
        background: var(--rm-elevated, #fff);
        border-bottom: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }

      .rm-fpick__title {
        flex: 1;
        font-weight: 650;
        font-size: 17px;
      }

      .rm-fpick__icon-btn {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: inherit;
        font-size: 22px;
      }

      .rm-fpick__icon-btn--accent {
        background: var(--ion-color-warning, #ffc409);
        color: #000;
      }

      .rm-fpick__icon-btn--accent ion-icon {
        color: #000;
        font-size: 28px;
      }

      .rm-fpick__body {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 8px 12px 12px;
      }

      .rm-fpick__search {
        margin-bottom: 10px;
      }

      .rm-fpick__search-input {
        width: 100%;
        max-width: 100%;
        min-height: 48px;
        --background: #fff;
        --color: #16182a;
        --placeholder-color: #5c6178;
        --placeholder-opacity: 1;
        --border-radius: 14px;
        --border-width: 1px;
        --border-color: rgba(22, 24, 42, 0.14);
        --padding-start: 12px;
        --padding-end: 8px;
        --highlight-color-focused: #f5a623;
        font-size: 15px;
        box-shadow: 0 2px 10px rgba(22, 24, 42, 0.06);
      }

      .rm-fpick__search-input ion-icon[slot='start'] {
        color: #5c6178;
        font-size: 20px;
        margin-inline-end: 6px;
      }

      .rm-fpick__loader,
      .rm-fpick__empty {
        display: grid;
        place-items: center;
        min-height: 160px;
        color: #5c6178;
        text-align: center;
        padding: 24px;
      }

      .rm-fpick__list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .rm-fpick__card {
        display: flex;
        align-items: stretch;
        gap: 4px;
        border-radius: 14px;
        background: var(--rm-elevated, #fff);
        border: 2px solid transparent;
        overflow: hidden;
      }

      .rm-fpick__card.is-selected {
        border-color: #2ecc71;
      }

      .rm-fpick__card-main {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 52px;
        padding: 10px 12px;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: left;
        font-size: 1rem;
      }

      .rm-fpick__card-main ion-icon {
        font-size: 1.35rem;
        color: #5c6178;
      }

      .rm-fpick__card-main strong {
        font-weight: 650;
      }

      .rm-fpick__menu {
        display: grid;
        place-items: center;
        width: 44px;
        border: 0;
        background: transparent;
        color: #5c6178;
        font-size: 1.15rem;
      }

      .rm-fpick__footer {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px));
        background: var(--rm-elevated, #fff);
        border-top: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }

      .rm-fpick__footer ion-button {
        margin: 0;
        min-height: 48px;
        font-weight: 700;
        --border-radius: 14px;
      }
    `,
  ],
})
export class FolderPickerSheetComponent implements OnInit {
  folders: GalleryFolder[] = [];
  filtered: GalleryFolder[] = [];
  selected: GalleryFolder | null = null;
  selectedId = '';
  query = '';
  loading = true;
  private changed = false;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: FolderPickerSheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly sheetRef: OverlaySheetRef<FolderPickerSheetResult>,
    private readonly foldersApi: FolderService,
    private readonly sheets: OverlaySheetService,
    private readonly confirm: ConfirmService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
  ) {
    this.selectedId = data.selectedId ?? '';
  }

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  onQuery(ev: CustomEvent): void {
    const value = ev.detail?.value;
    this.query = value == null ? '' : String(value);
    this.applyFilter();
  }

  select(folder: GalleryFolder): void {
    this.selected = folder;
    this.selectedId = folder.id;
  }

  dismiss(): void {
    this.sheetRef.close({
      chose: false,
      folder: this.selected,
      folders: this.folders,
      changed: this.changed,
    });
  }

  choose(): void {
    if (!this.selected) {
      return;
    }
    this.sheetRef.close({
      chose: true,
      folder: this.selected,
      folders: this.folders,
      changed: this.changed,
    });
  }

  clear(): void {
    this.selected = null;
    this.selectedId = '';
    this.sheetRef.close({
      chose: true,
      folder: null,
      folders: this.folders,
      changed: this.changed,
    });
  }

  async createFolder(): Promise<void> {
    const name = await this.sheets.open<
      FolderNameSheetComponent,
      FolderNameSheetData,
      FolderNameSheetResult
    >(
      FolderNameSheetComponent,
      { mode: 'create' },
      { stack: true, closeOnBackdrop: true },
    );
    if (!name) {
      return;
    }
    try {
      const created = await this.foldersApi.create(name);
      this.folders = [created, ...this.folders];
      this.changed = true;
      this.select(created);
      this.applyFilter();
      await this.toasts.show(this.translate.instant('successFolderCreate'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('galleryLoadError'), 'danger');
    }
  }

  async openMenu(folder: GalleryFolder): Promise<void> {
    const action = await this.sheets.open<
      ChoiceSheetComponent<'edit' | 'delete'>,
      ChoiceSheetData<'edit' | 'delete'>,
      'edit' | 'delete'
    >(
      ChoiceSheetComponent,
      {
        titleKey: 'actions',
        options: [
          { value: 'edit', labelKey: 'edit', icon: '✏️' },
          { value: 'delete', labelKey: 'delete', icon: '🗑️' },
        ],
      },
      { stack: true, closeOnBackdrop: true },
    );
    if (action === 'edit') {
      await this.renameFolder(folder);
    } else if (action === 'delete') {
      await this.deleteFolder(folder);
    }
  }

  private async renameFolder(folder: GalleryFolder): Promise<void> {
    const name = await this.sheets.open<
      FolderNameSheetComponent,
      FolderNameSheetData,
      FolderNameSheetResult
    >(
      FolderNameSheetComponent,
      { mode: 'edit', name: folder.name },
      { stack: true, closeOnBackdrop: true },
    );
    if (!name || name === folder.name) {
      return;
    }
    try {
      await this.foldersApi.rename(folder.id, name);
      folder.name = name;
      this.changed = true;
      this.applyFilter();
      await this.toasts.show(this.translate.instant('successUpdateFolder'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('galleryLoadError'), 'danger');
    }
  }

  private async deleteFolder(folder: GalleryFolder): Promise<void> {
    const ok = await this.confirm.danger('dywDelete', 'delete', 'delete', 'cancel');
    if (!ok) {
      return;
    }
    try {
      await this.foldersApi.remove(folder.id);
      this.folders = this.folders.filter((f) => f.id !== folder.id);
      if (this.selectedId === folder.id) {
        this.selected = null;
        this.selectedId = '';
      }
      this.changed = true;
      this.applyFilter();
      await this.toasts.show(this.translate.instant('successDeleteFolder'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('galleryLoadError'), 'danger');
    }
  }

  private async reload(): Promise<void> {
    this.loading = true;
    try {
      this.folders = await this.foldersApi.listMine();
      if (this.selectedId) {
        this.selected = this.folders.find((f) => f.id === this.selectedId) ?? null;
        if (!this.selected) {
          this.selectedId = '';
        }
      }
      this.applyFilter();
    } catch (err) {
      console.error(err);
      this.folders = [];
      this.filtered = [];
      await this.toasts.show(this.translate.instant('galleryLoadError'), 'danger');
    } finally {
      this.loading = false;
    }
  }

  private applyFilter(): void {
    const q = this.query.trim().toLowerCase();
    this.filtered = !q
      ? [...this.folders]
      : this.folders.filter((f) => f.name.toLowerCase().includes(q));
  }
}
