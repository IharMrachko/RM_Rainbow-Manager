import { Component, Inject, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Palette } from '@rainbow/shared';
import { GalleryFolder } from '../../core/services/folder.service';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';
import { SheetSelectComponent, SheetSelectOption } from './sheet-select.component';

export interface GalleryFilterSheetState {
  folderId: string | null;
  maskType: string | null;
  paletteType: string | null;
  coloristicType: string | null;
}

export interface GalleryFilterSheetData {
  filter: GalleryFilterSheetState;
  folders: GalleryFolder[];
  maskTypes: string[];
  paletteTypes: Palette[];
  coloristicTypes: readonly string[];
}

export type GalleryFilterSheetResult = GalleryFilterSheetState | null;

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, SheetSelectComponent],
  selector: 'app-gallery-filter-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-filter-sheet" role="dialog" aria-modal="true">
      <header class="rm-filter-sheet__head">
        <h2>{{ 'filter' | translate }}</h2>
        <button type="button" class="rm-filter-sheet__close" (click)="cancel()" aria-label="close">
          <ion-icon name="close"></ion-icon>
        </button>
      </header>

      <div class="rm-filter-sheet__body">
        <app-sheet-select
          #folderSel
          [label]="'folder' | translate"
          [placeholder]="'all' | translate"
          [value]="folderId"
          [options]="folderOptions"
          (valueChange)="folderId = $event"
          (openedChange)="onOpened($event, folderSel)"
        ></app-sheet-select>

        <app-sheet-select
          #paletteSel
          [label]="'palette' | translate"
          [placeholder]="'all' | translate"
          [value]="paletteType"
          [options]="paletteOptions"
          (valueChange)="paletteType = $event"
          (openedChange)="onOpened($event, paletteSel)"
        ></app-sheet-select>

        <app-sheet-select
          #maskSel
          [label]="'mask' | translate"
          [placeholder]="'all' | translate"
          [value]="maskType"
          [options]="maskOptions"
          (valueChange)="maskType = $event"
          (openedChange)="onOpened($event, maskSel)"
        ></app-sheet-select>

        <app-sheet-select
          #typeSel
          [label]="'typeMasks' | translate"
          [placeholder]="'all' | translate"
          [value]="coloristicType"
          [options]="typeOptions"
          (valueChange)="coloristicType = $event"
          (openedChange)="onOpened($event, typeSel)"
        ></app-sheet-select>
      </div>

      <div class="rm-filter-sheet__actions">
        <button type="button" class="rm-filter-sheet__secondary" (click)="clear()">
          {{ 'clear' | translate }}
        </button>
        <button type="button" class="rm-filter-sheet__primary" (click)="apply()">
          {{ 'apply' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      app-gallery-filter-sheet {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }

      .rm-filter-sheet {
        width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding: 18px 16px calc(14px + env(safe-area-inset-bottom, 0px));
        border-radius: 22px 22px 0 0;
        background: #fff;
        box-shadow: 0 16px 40px rgba(22, 24, 42, 0.22);
        color: #16182a;
        font-family: var(--rm-font-body, Outfit, system-ui, sans-serif);
      }

      .rm-filter-sheet__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }

      .rm-filter-sheet__head h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
      }

      .rm-filter-sheet__close {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 12px;
        background: #eef0f7;
        color: #16182a;
        display: grid;
        place-items: center;
        font-size: 1.25rem;
      }

      .rm-filter-sheet__body {
        display: grid;
        gap: 10px;
      }

      .rm-filter-sheet__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 16px;
      }

      .rm-filter-sheet__secondary,
      .rm-filter-sheet__primary {
        min-height: 48px;
        border: none;
        border-radius: 14px;
        font-size: 0.95rem;
        font-weight: 700;
      }

      .rm-filter-sheet__secondary {
        background: #e4e7f2;
        color: #16182a;
      }

      .rm-filter-sheet__primary {
        background: #5b6ef5;
        color: #fff;
      }
    `,
  ],
})
export class GalleryFilterSheetComponent {
  @ViewChildren(SheetSelectComponent) private selects?: QueryList<SheetSelectComponent>;

  folderId = '';
  maskType = '';
  paletteType = '';
  coloristicType = '';

  readonly folderOptions: SheetSelectOption[];
  readonly paletteOptions: SheetSelectOption[];
  readonly maskOptions: SheetSelectOption[];
  readonly typeOptions: SheetSelectOption[];

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: GalleryFilterSheetData,
    @Inject(OVERLAY_SHEET_REF)
    private readonly sheetRef: OverlaySheetRef<GalleryFilterSheetResult>,
    private readonly translate: TranslateService,
  ) {
    this.folderId = data.filter.folderId ?? '';
    this.maskType = data.filter.maskType ?? '';
    this.paletteType = data.filter.paletteType ?? '';
    this.coloristicType = data.filter.coloristicType ?? '';

    const all = this.translate.instant('all');
    this.folderOptions = [
      { value: '', label: all },
      ...data.folders.map((f: GalleryFolder) => ({ value: f.id, label: f.name })),
    ];
    this.paletteOptions = [
      { value: '', label: all },
      ...data.paletteTypes.map((p: Palette) => ({
        value: p,
        label: this.translate.instant(p),
      })),
    ];
    this.maskOptions = [
      { value: '', label: all },
      ...data.maskTypes.map((m) => ({
        value: m,
        label: this.translate.instant(m),
      })),
    ];
    this.typeOptions = [
      { value: '', label: all },
      ...data.coloristicTypes.map((c) => ({
        value: c,
        label: this.translate.instant(c),
      })),
    ];
  }

  onOpened(open: boolean, source: SheetSelectComponent): void {
    if (!open || !this.selects) {
      return;
    }
    this.selects.forEach((sel) => {
      if (sel !== source) {
        sel.close();
      }
    });
  }

  clear(): void {
    this.folderId = '';
    this.maskType = '';
    this.paletteType = '';
    this.coloristicType = '';
    this.selects?.forEach((sel) => sel.close());
  }

  apply(): void {
    this.sheetRef.close({
      folderId: this.folderId || null,
      maskType: this.maskType || null,
      paletteType: this.paletteType || null,
      coloristicType: this.coloristicType || null,
    });
  }

  cancel(): void {
    this.sheetRef.close(null);
  }
}
