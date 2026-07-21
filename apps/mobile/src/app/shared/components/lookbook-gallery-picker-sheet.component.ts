import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { colorCards, Palette, palettesObj } from '@rainbow/shared';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { FolderService, GalleryFolder } from '../../core/services/folder.service';
import {
  GalleryImage,
  GalleryQueryOptions,
  GalleryService,
} from '../../core/services/gallery.service';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
  OverlaySheetService,
} from '../../core/services/overlay-sheet.service';
import {
  GalleryFilterSheetComponent,
  GalleryFilterSheetData,
  GalleryFilterSheetResult,
  GalleryFilterSheetState,
} from './gallery-filter-sheet.component';

export type LookbookGalleryPickerData = {
  /** Optional initial folder filter when picking images. */
  folderId?: string | null;
  /** Soft cap on how many photos can be selected (templates). */
  maxCount?: number;
};

export interface LookbookGalleryPickerResult {
  items: GalleryImage[];
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  selector: 'app-lookbook-gallery-picker-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-lb-pick" role="dialog" aria-modal="true">
      <header class="rm-lb-pick__bar">
        <button type="button" class="rm-lb-pick__icon" (click)="cancel()">
          <ion-icon name="close-outline"></ion-icon>
        </button>
        <div class="rm-lb-pick__title">{{ 'lookbookAddFromGallery' | translate }}</div>
        <button
          type="button"
          class="rm-lb-pick__icon rm-lb-pick__filter"
          [class.is-active]="hasActiveFilter"
          (click)="openFilter()"
          [attr.aria-label]="'filter' | translate"
        >
          <ion-icon name="filter"></ion-icon>
          @if (hasActiveFilter) {
            <span class="rm-lb-pick__badge">{{ activeFilterCount }}</span>
          }
        </button>
        <button type="button" class="rm-lb-pick__done" [disabled]="!selected.size" (click)="confirm()">
          {{ 'done' | translate }}
        </button>
      </header>

      <div class="rm-lb-pick__search">
        <ion-input
          class="rm-lb-pick__search-input"
          type="search"
          inputmode="search"
          enterkeyhint="search"
          fill="outline"
          mode="md"
          [clearInput]="true"
          [placeholder]="'search' | translate"
          [value]="search"
          (ionInput)="onSearchChange($any($event).detail.value)"
        >
          <ion-icon slot="start" name="search-outline" aria-hidden="true"></ion-icon>
        </ion-input>
      </div>

      @if (loading) {
        <div class="rm-lb-pick__center"><ion-spinner></ion-spinner></div>
      } @else if (isEmptyGallery) {
        <div class="rm-lb-pick__center">{{ 'galleryEmpty' | translate }}</div>
      } @else if (isNotFound) {
        <div class="rm-lb-pick__center">{{ 'noResults' | translate }}</div>
      } @else {
        <div class="rm-lb-pick__grid" (scroll)="onGridScroll($event)">
          @for (item of items; track item.id) {
            <div
              class="rm-lb-pick__card"
              role="button"
              tabindex="0"
              [class.is-selected]="selected.has(item.id)"
              (click)="toggle(item.id)"
              (keydown.enter)="toggle(item.id)"
            >
              <img [src]="item.src" [alt]="item.title || ''" loading="lazy" />
              @if (selected.has(item.id)) {
                <span class="rm-lb-pick__check"><ion-icon name="checkmark-outline"></ion-icon></span>
              }
            </div>
          }
          @if (loadingMore) {
            <div class="rm-lb-pick__more"><ion-spinner name="crescent"></ion-spinner></div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .rm-lb-pick {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        background: var(--rm-surface, #eef0f7);
        color: var(--rm-ink, #16182a);
        box-sizing: border-box;
      }
      .rm-lb-pick *,
      .rm-lb-pick *::before,
      .rm-lb-pick *::after {
        box-sizing: border-box;
      }
      .rm-lb-pick__bar {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 0 0 auto;
        padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px;
        background: #fff;
        border-bottom: 1px solid rgba(22, 24, 42, 0.08);
      }
      .rm-lb-pick__title {
        flex: 1;
        font-weight: 650;
        min-width: 0;
      }
      .rm-lb-pick__icon,
      .rm-lb-pick__done {
        border: 0;
        background: transparent;
        color: inherit;
        font-weight: 700;
        min-height: 40px;
      }
      .rm-lb-pick__done:disabled {
        opacity: 0.4;
      }
      .rm-lb-pick__icon {
        position: relative;
        width: 40px;
        font-size: 22px;
        display: grid;
        place-items: center;
      }
      .rm-lb-pick__filter.is-active {
        color: #8a4fa0;
      }
      .rm-lb-pick__badge {
        position: absolute;
        top: 4px;
        right: 2px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 999px;
        background: #8a4fa0;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        line-height: 16px;
        text-align: center;
      }
      .rm-lb-pick__search {
        flex: 0 0 auto;
        padding: 10px 12px 0;
        background: var(--rm-surface, #eef0f7);
      }
      .rm-lb-pick__search-input {
        --background: #fff;
        --border-radius: 12px;
        --padding-start: 8px;
        --padding-end: 8px;
        --highlight-color-focused: #8a4fa0;
      }
      .rm-lb-pick__center {
        flex: 1;
        display: grid;
        place-items: center;
        color: #5c6178;
        padding: 24px;
        text-align: center;
      }
      .rm-lb-pick__grid {
        flex: 1 1 auto;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-auto-rows: auto;
        gap: 8px;
        padding: 12px;
        overflow-x: hidden;
        overflow-y: auto;
        align-content: start;
        -webkit-overflow-scrolling: touch;
      }
      .rm-lb-pick__card {
        position: relative;
        width: 100%;
        height: 0 !important;
        padding: 0 0 100% !important;
        margin: 0;
        border: 0;
        border-radius: 12px;
        overflow: hidden;
        background: #d8dae3;
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
      }
      .rm-lb-pick__card > img {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: none !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        object-fit: cover !important;
        object-position: center !important;
        display: block !important;
        float: none !important;
        pointer-events: none;
      }
      .rm-lb-pick__card.is-selected {
        box-shadow: inset 0 0 0 3px #b576c7;
      }
      .rm-lb-pick__check {
        position: absolute;
        top: 6px;
        right: 6px;
        z-index: 2;
        width: 24px;
        height: 24px;
        border-radius: 999px;
        background: #b576c7;
        color: #fff;
        display: grid;
        place-items: center;
        font-size: 14px;
      }
      .rm-lb-pick__more {
        grid-column: 1 / -1;
        display: grid;
        place-items: center;
        padding: 12px 0 20px;
      }
    `,
  ],
})
export class LookbookGalleryPickerSheetComponent implements OnInit, OnDestroy {
  private static readonly STORAGE_KEY = 'rm.lookbook.galleryPicker';
  private static remembered: {
    filter: GalleryFilterSheetState;
    search: string;
  } | null = null;

  items: GalleryImage[] = [];
  selected = new Set<string>();
  loading = true;
  loadingMore = false;
  hasMore = false;
  search = '';
  folders: GalleryFolder[] = [];
  filter: GalleryFilterSheetState = {
    folderId: null,
    maskType: null,
    paletteType: null,
    coloristicType: null,
  };

  readonly maskTypes = colorCards.map((c) => c.type);
  readonly paletteTypes = Object.keys(palettesObj) as Palette[];
  readonly coloristicTypes = ['mask', 'collage'] as const;

  private lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly pageSize = 48;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) private readonly data: LookbookGalleryPickerData,
    @Inject(OVERLAY_SHEET_REF)
    private readonly sheetRef: OverlaySheetRef<LookbookGalleryPickerResult | null>,
    private readonly gallery: GalleryService,
    private readonly foldersApi: FolderService,
    private readonly sheets: OverlaySheetService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get hasActiveFilter(): boolean {
    return this.activeFilterCount > 0;
  }

  get activeFilterCount(): number {
    let n = 0;
    if (this.filter.folderId) n += 1;
    if (this.filter.maskType) n += 1;
    if (this.filter.paletteType) n += 1;
    if (this.filter.coloristicType) n += 1;
    return n;
  }

  get isEmptyGallery(): boolean {
    return !this.loading && !this.items.length && !this.search.trim() && !this.hasActiveFilter;
  }

  get isNotFound(): boolean {
    return (
      !this.loading &&
      !this.items.length &&
      (!!this.search.trim() || this.hasActiveFilter)
    );
  }

  async ngOnInit(): Promise<void> {
    this.restoreRemembered();
    if (this.data?.folderId) {
      this.filter = { ...this.filter, folderId: this.data.folderId };
    }
    try {
      this.folders = await this.foldersApi.listMine();
    } catch {
      this.folders = [];
    }
    await this.reload();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.persistRemembered();
  }

  onSearchChange(value: string | null | undefined): void {
    this.search = value ?? '';
    this.persistRemembered();
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      void this.reload();
    }, 300);
  }

  async openFilter(): Promise<void> {
    const result = await this.sheets.open<
      GalleryFilterSheetComponent,
      GalleryFilterSheetData,
      GalleryFilterSheetResult
    >(
      GalleryFilterSheetComponent,
      {
        filter: { ...this.filter },
        folders: this.folders,
        maskTypes: this.maskTypes,
        paletteTypes: this.paletteTypes,
        coloristicTypes: this.coloristicTypes,
      },
      { fullscreen: false, closeOnBackdrop: true, stack: true },
    );
    if (!result) {
      return;
    }
    this.filter = { ...result };
    this.persistRemembered();
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading = true;
    this.lastDoc = null;
    this.hasMore = false;
    this.cdr.markForCheck();
    try {
      const page = await this.gallery.loadUserItems(this.buildOptions());
      this.items = page.items;
      this.lastDoc = page.lastDoc;
      this.hasMore = page.hasMore && !!page.lastDoc;
      this.pruneSelection();
    } catch (err) {
      console.error(err);
      this.items = [];
      this.hasMore = false;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async loadMore(): Promise<void> {
    if (!this.hasMore || this.loadingMore || !this.lastDoc) {
      return;
    }
    this.loadingMore = true;
    this.cdr.markForCheck();
    try {
      const page = await this.gallery.loadUserItems({
        ...this.buildOptions(),
        lastDoc: this.lastDoc,
      });
      this.items = [...this.items, ...page.items];
      this.lastDoc = page.lastDoc;
      this.hasMore = page.hasMore && !!page.lastDoc;
    } catch (err) {
      console.error(err);
    } finally {
      this.loadingMore = false;
      this.cdr.markForCheck();
    }
  }

  onGridScroll(ev: Event): void {
    const el = ev.target as HTMLElement | null;
    if (!el || !this.hasMore || this.loadingMore) {
      return;
    }
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      void this.loadMore();
    }
  }

  toggle(id: string): void {
    if (this.selected.has(id)) {
      this.selected.delete(id);
    } else {
      const max = this.data?.maxCount;
      if (typeof max === 'number' && max > 0 && this.selected.size >= max) {
        return;
      }
      this.selected.add(id);
    }
    this.selected = new Set(this.selected);
    this.cdr.markForCheck();
  }

  confirm(): void {
    this.sheetRef.close({ items: this.items.filter((it) => this.selected.has(it.id)) });
  }

  cancel(): void {
    this.sheetRef.close(null);
  }

  private buildOptions(): GalleryQueryOptions {
    return {
      title: this.search.trim() || undefined,
      pageSize: this.pageSize,
      maskType: this.filter.maskType,
      folderId: this.filter.folderId,
      paletteType: this.filter.paletteType,
      coloristicType: this.filter.coloristicType,
    };
  }

  private pruneSelection(): void {
    const ids = new Set(this.items.map((it) => it.id));
    this.selected = new Set([...this.selected].filter((id) => ids.has(id)));
  }

  private restoreRemembered(): void {
    const fromMemory = LookbookGalleryPickerSheetComponent.remembered;
    if (fromMemory) {
      this.filter = { ...fromMemory.filter };
      this.search = fromMemory.search || '';
      return;
    }
    try {
      const raw = localStorage.getItem(LookbookGalleryPickerSheetComponent.STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as {
        filter?: Partial<GalleryFilterSheetState>;
        search?: string;
      };
      this.filter = {
        folderId: parsed.filter?.folderId ?? null,
        maskType: parsed.filter?.maskType ?? null,
        paletteType: parsed.filter?.paletteType ?? null,
        coloristicType: parsed.filter?.coloristicType ?? null,
      };
      this.search = typeof parsed.search === 'string' ? parsed.search : '';
      LookbookGalleryPickerSheetComponent.remembered = {
        filter: { ...this.filter },
        search: this.search,
      };
    } catch {
      // ignore corrupt storage
    }
  }

  private persistRemembered(): void {
    const snapshot = {
      filter: { ...this.filter },
      search: this.search,
    };
    LookbookGalleryPickerSheetComponent.remembered = snapshot;
    try {
      localStorage.setItem(
        LookbookGalleryPickerSheetComponent.STORAGE_KEY,
        JSON.stringify(snapshot),
      );
    } catch {
      // ignore quota / private mode
    }
  }
}
