import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  Inject,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { register } from 'swiper/element/bundle';
import { ConfirmService } from '../../core/services/confirm.service';
import { GalleryImage, GalleryService } from '../../core/services/gallery.service';
import { GalleryFolder } from '../../core/services/folder.service';
import { ToastService } from '../../core/services/toast.service';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
  OverlaySheetService,
} from '../../core/services/overlay-sheet.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from './choice-sheet.component';
import {
  FolderPickerSheetComponent,
  FolderPickerSheetData,
  FolderPickerSheetResult,
} from './folder-picker-sheet.component';
register();

export interface GalleryViewerSheetData {
  items: GalleryImage[];
  startIndex: number;
  folders: GalleryFolder[];
  loadMore?: () => Promise<GalleryImage[]>;
}

export interface GalleryViewerSheetResult {
  deletedIds?: string[];
  items?: GalleryImage[];
  folders?: GalleryFolder[];
  changed?: boolean;
  index: number;
}

type SwiperEl = HTMLElement & {
  swiper?: {
    activeIndex: number;
    slideTo: (index: number, speed?: number) => void;
    update: () => void;
  };
  initialize?: () => void;
};

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-gallery-viewer-sheet',
  template: `
    <div class="viewer">
      <header class="viewer__bar">
        <button type="button" class="viewer__icon-btn" (click)="dismiss()" aria-label="close">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </button>
        <div class="viewer__counter">{{ index + 1 }} / {{ items.length }}</div>
        <button type="button" class="viewer__icon-btn viewer__icon-btn--accent" (click)="openMenu()" aria-label="menu">
          <ion-icon name="ellipsis-vertical"></ion-icon>
        </button>
      </header>

      <div class="viewer__stage">
        <swiper-container
          #swiper
          class="viewer__swiper"
          init="false"
          (swiperslidechange)="onSlideChange($event)"
        >
          @for (item of items; track item.id) {
            <swiper-slide>
              <div class="viewer__slide">
                <img [src]="item.src" [alt]="item.title || 'gallery'" draggable="false" />
              </div>
            </swiper-slide>
          }
        </swiper-container>
      </div>

      <section class="viewer__info">
        @if (badges.length) {
          <div class="viewer__badges">
            @for (badge of badges; track badge) {
              <span class="viewer__badge">{{ badge }}</span>
            }
          </div>
        }

        @if (!editingTitle) {
          <button type="button" class="viewer__name" (click)="startEditTitle()">
            <ion-icon name="create-outline"></ion-icon>
            <span>{{ current?.title || ('noName' | translate) }}</span>
          </button>
        } @else {
          <div class="viewer__edit">
            <ion-input
              class="viewer__edit-input"
              fill="solid"
              [(ngModel)]="draftTitle"
              [placeholder]="'noName' | translate"
              (keyup.enter)="saveTitle()"
            ></ion-input>
            <button type="button" class="viewer__edit-save" (click)="saveTitle()">
              <ion-icon name="checkmark-outline"></ion-icon>
            </button>
            <button type="button" class="viewer__edit-cancel" (click)="cancelEditTitle()">
              <ion-icon name="close-outline"></ion-icon>
            </button>
          </div>
        }

        <button type="button" class="viewer__delete" (click)="deleteCurrent()">
          <ion-icon name="trash-outline"></ion-icon>
          <span>{{ 'delete' | translate }}</span>
        </button>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .viewer {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--rm-surface, #eef0f7);
        color: var(--rm-ink, #16182a);
        padding-top: env(safe-area-inset-top);
        box-sizing: border-box;
        font-family: var(--rm-font-body, Outfit, system-ui, sans-serif);
      }

      .viewer__bar {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: 48px 1fr 48px;
        align-items: center;
        gap: 8px;
        min-height: 52px;
        padding: 8px 12px;
        background: rgba(238, 240, 247, 0.92);
        backdrop-filter: blur(16px) saturate(1.2);
        -webkit-backdrop-filter: blur(16px) saturate(1.2);
        border-bottom: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }

      .viewer__counter {
        text-align: center;
        font-family: var(--rm-font-display, Syne, system-ui, sans-serif);
        font-size: 1rem;
        font-weight: 700;
        color: var(--rm-ink, #16182a);
      }

      .viewer__icon-btn {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 14px;
        background: var(--rm-elevated, #fff);
        color: var(--rm-ink, #16182a);
        box-shadow: 0 1px 0 var(--rm-line, rgba(22, 24, 42, 0.08)),
          0 6px 16px rgba(22, 24, 42, 0.06);
        display: grid;
        place-items: center;
        font-size: 1.25rem;
      }

      .viewer__icon-btn--accent {
        background: var(--ion-color-primary, #5b6ef5);
        color: #fff;
        box-shadow: 0 6px 16px rgba(91, 110, 245, 0.3);
      }

      .viewer__stage {
        flex: 1 1 auto;
        min-height: 0;
        position: relative;
        margin: 12px 16px 0;
        border-radius: var(--rm-radius-lg, 22px);
        background: var(--rm-elevated, #fff);
        border: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
        box-shadow: 0 1px 0 var(--rm-line, rgba(22, 24, 42, 0.08)),
          0 10px 28px rgba(22, 24, 42, 0.06);
        overflow: hidden;
      }

      .viewer__swiper {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .viewer__swiper::part(container),
      .viewer__swiper::part(wrapper) {
        height: 100%;
      }

      .viewer__swiper swiper-slide {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .viewer__slide {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        box-sizing: border-box;
      }

      .viewer__slide img {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        user-select: none;
        -webkit-user-drag: none;
        border-radius: 12px;
      }

      .viewer__info {
        flex: 0 0 auto;
        margin: 12px 16px calc(12px + env(safe-area-inset-bottom));
        padding: 16px;
        border-radius: var(--rm-radius-lg, 22px);
        background: var(--rm-elevated, #fff);
        border: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
        box-shadow: 0 1px 0 var(--rm-line, rgba(22, 24, 42, 0.08)),
          0 10px 28px rgba(22, 24, 42, 0.06);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 14px;
      }

      .viewer__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .viewer__badge {
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--rm-surface-2, #e4e7f2);
        color: var(--rm-ink, #16182a);
        font-size: 0.78rem;
        font-weight: 600;
      }

      .viewer__name {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 44px;
        border: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
        border-radius: 14px;
        background: var(--rm-surface, #eef0f7);
        color: var(--rm-ink, #16182a);
        padding: 10px 14px;
        text-align: left;
        font-family: var(--rm-font-display, Syne, system-ui, sans-serif);
        font-size: 1.02rem;
        font-weight: 700;
        box-sizing: border-box;
      }

      .viewer__name ion-icon {
        flex: 0 0 auto;
        font-size: 1.1rem;
        color: var(--ion-color-primary, #5b6ef5);
      }

      .viewer__name span {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .viewer__edit {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .viewer__edit-input {
        flex: 1 1 auto;
        min-width: 0;
        --background: var(--rm-surface, #eef0f7);
        --color: var(--rm-ink, #16182a);
        --placeholder-color: var(--rm-muted, #5c6178);
        --border-radius: 14px;
        --padding-start: 12px;
        min-height: 44px;
      }

      .viewer__edit-save,
      .viewer__edit-cancel {
        flex: 0 0 44px;
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 14px;
        display: grid;
        place-items: center;
        font-size: 1.2rem;
      }

      .viewer__edit-save {
        background: rgba(91, 110, 245, 0.14);
        color: var(--ion-color-primary, #5b6ef5);
      }

      .viewer__edit-cancel {
        background: var(--rm-surface-2, #e4e7f2);
        color: var(--rm-muted, #5c6178);
      }

      .viewer__delete {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: none;
        border-radius: 14px;
        min-height: 48px;
        padding: 12px 16px;
        background: var(--ion-color-danger, #e5484d);
        color: #fff;
        font-size: 0.95rem;
        font-weight: 600;
        box-shadow: 0 8px 20px rgba(229, 72, 77, 0.22);
      }

      .viewer__delete ion-icon {
        font-size: 1.15rem;
      }
    `,
  ],
})
export class GalleryViewerSheetComponent implements AfterViewInit {
  @ViewChild('swiper') private swiperRef?: ElementRef<SwiperEl>;

  items: GalleryImage[];
  folders: GalleryFolder[];
  index: number;
  editingTitle = false;
  draftTitle = '';

  private loadingMore = false;
  private deletedIds = new Set<string>();
  private changed = false;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) private readonly data: GalleryViewerSheetData,
    @Inject(OVERLAY_SHEET_REF)
    private readonly sheetRef: OverlaySheetRef<GalleryViewerSheetResult>,
    private readonly cdr: ChangeDetectorRef,
    private readonly confirm: ConfirmService,
    private readonly sheets: OverlaySheetService,
    private readonly translate: TranslateService,
    private readonly gallery: GalleryService,
    private readonly toasts: ToastService,
  ) {
    this.items = data.items.map((it) => ({ ...it }));
    this.folders = data.folders ?? [];
    this.index = Math.min(Math.max(0, data.startIndex), Math.max(0, this.items.length - 1));
  }

  get current(): GalleryImage | null {
    return this.items[this.index] ?? null;
  }

  get badges(): string[] {
    const img = this.current;
    if (!img) {
      return [];
    }
    const list: string[] = [];
    const folder = this.folders.find((f) => f.id === img.folderId);
    if (folder?.name) {
      list.push(folder.name);
    }
    if (img.maskType) {
      list.push(this.translate.instant(img.maskType));
    }
    if (img.coloristicType) {
      list.push(this.translate.instant(img.coloristicType));
    }
    if (img.paletteType) {
      const shortKey = `${img.paletteType}Short`;
      const short = this.translate.instant(shortKey);
      list.push(short !== shortKey ? short : this.translate.instant(img.paletteType));
    }
    return list;
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initSwiper(), 0);
  }

  dismiss(): void {
    this.sheetRef.close({
      index: this.index,
      deletedIds: [...this.deletedIds],
      changed: this.changed || this.deletedIds.size > 0,
      items: this.items,
      folders: this.folders,
    });
  }

  startEditTitle(): void {
    this.draftTitle = this.current?.title ?? '';
    this.editingTitle = true;
  }

  cancelEditTitle(): void {
    this.editingTitle = false;
    this.draftTitle = '';
  }

  async saveTitle(): Promise<void> {
    const img = this.current;
    if (!img) {
      return;
    }
    const title = this.draftTitle.trim();
    if (title === (img.title || '')) {
      this.editingTitle = false;
      return;
    }
    try {
      await this.gallery.updateImage({ id: img.id, title });
      img.title = title;
      this.changed = true;
      this.editingTitle = false;
      this.cdr.detectChanges();
      await this.toasts.show(this.translate.instant('successUpdateImage'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('galleryLoadError'), 'danger');
    }
  }

  async openMenu(): Promise<void> {
    type ViewerAction = 'folder' | 'update' | 'copyLink';
    const action = await this.sheets.open<
      ChoiceSheetComponent<ViewerAction>,
      ChoiceSheetData<ViewerAction>,
      ViewerAction
    >(
      ChoiceSheetComponent,
      {
        titleKey: 'actions',
        options: [
          { value: 'folder', labelKey: 'addFolder', ionIcon: 'folder-outline' },
          { value: 'update', labelKey: 'update', ionIcon: 'refresh-outline' },
          { value: 'copyLink', labelKey: 'copyLink', ionIcon: 'link-outline' },
        ],
      },
      { stack: true, closeOnBackdrop: true },
    );

    if (action === 'folder') {
      await this.pickFolder();
    } else if (action === 'update') {
      await this.refreshCurrent();
    } else if (action === 'copyLink') {
      await this.copyLink();
    }
  }

  async pickFolder(): Promise<void> {
    const img = this.current;
    if (!img) {
      return;
    }
    const result = await this.sheets.open<
      FolderPickerSheetComponent,
      FolderPickerSheetData,
      FolderPickerSheetResult
    >(
      FolderPickerSheetComponent,
      {
        selectedId: img.folderId || undefined,
        allowClear: true,
      },
      { fullscreen: true, stack: true, closeOnBackdrop: false },
    );
    if (!result) {
      return;
    }
    this.folders = result.folders;
    this.cdr.markForCheck();
    if (result.chose) {
      await this.assignFolder(result.folder?.id ?? null);
    }
  }

  async refreshCurrent(): Promise<void> {
    const img = this.current;
    if (!img) {
      return;
    }
    try {
      await this.gallery.updateImage({
        id: img.id,
        title: img.title || '',
        coloristicType: img.coloristicType,
        maskType: img.maskType,
        paletteType: img.paletteType,
        folderId: img.folderId ?? null,
      });
      this.changed = true;
      await this.toasts.show(this.translate.instant('successUpdateImage'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('galleryLoadError'), 'danger');
    }
  }

  async copyLink(): Promise<void> {
    const src = this.current?.src;
    if (!src) {
      return;
    }
    try {
      await navigator.clipboard.writeText(src);
      await this.toasts.show(this.translate.instant('linkCopied'), 'success');
    } catch {
      await this.toasts.show(this.translate.instant('copyError'), 'danger');
    }
  }

  async deleteCurrent(): Promise<void> {
    const id = this.current?.id;
    if (!id) {
      return;
    }
    const ok = await this.confirm.danger('confirmDeleteImage');
    if (!ok) {
      return;
    }
    await this.removeById(id);
  }

  onSlideChange(event: Event): void {
    const swiper = (event.target as SwiperEl)?.swiper;
    if (!swiper) {
      return;
    }
    this.index = swiper.activeIndex;
    this.editingTitle = false;
    this.cdr.markForCheck();
    if (this.index >= this.items.length - 3) {
      void this.tryLoadMore();
    }
  }

  private async assignFolder(folderId: string | null): Promise<void> {
    const img = this.current;
    if (!img) {
      return;
    }
    try {
      await this.gallery.updateImage({
        id: img.id,
        title: img.title || '',
        coloristicType: img.coloristicType,
        maskType: img.maskType,
        paletteType: img.paletteType,
        folderId,
      });
      img.folderId = folderId || undefined;
      this.changed = true;
      this.cdr.markForCheck();
      await this.toasts.show(this.translate.instant('successUpdateImage'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('galleryLoadError'), 'danger');
    }
  }

  private async removeById(id: string): Promise<void> {
    try {
      await this.gallery.deleteImage(id);
      this.deletedIds.add(id);
      this.items = this.items.filter((it) => it.id !== id);
      if (!this.items.length) {
        this.dismiss();
        return;
      }
      this.index = Math.min(this.index, this.items.length - 1);
      this.editingTitle = false;
      this.cdr.detectChanges();
      queueMicrotask(() => {
        const swiper = this.swiperRef?.nativeElement?.swiper;
        swiper?.update();
        swiper?.slideTo(this.index, 0);
      });
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('galleryLoadError'), 'danger');
    }
  }

  private initSwiper(): void {
    const el = this.swiperRef?.nativeElement;
    if (!el) {
      return;
    }
    Object.assign(el, {
      slidesPerView: 1,
      spaceBetween: 0,
      initialSlide: this.index,
      speed: 280,
      resistanceRatio: 0.65,
    });
    if (!el.swiper) {
      el.initialize?.();
    } else {
      el.swiper.slideTo(this.index, 0);
      el.swiper.update();
    }
  }

  private async tryLoadMore(): Promise<void> {
    if (this.loadingMore || !this.data.loadMore) {
      return;
    }
    this.loadingMore = true;
    try {
      const next = await this.data.loadMore();
      if (next?.length) {
        const known = new Set(this.items.map((it) => it.id));
        const merged = [...this.items];
        for (const item of next) {
          if (!known.has(item.id) && !this.deletedIds.has(item.id)) {
            merged.push({ ...item });
          }
        }
        this.items = merged;
        this.cdr.detectChanges();
        queueMicrotask(() => this.swiperRef?.nativeElement?.swiper?.update());
      }
    } finally {
      this.loadingMore = false;
    }
  }
}
