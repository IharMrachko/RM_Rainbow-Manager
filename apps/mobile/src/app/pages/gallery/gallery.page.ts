import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, ScrollDetail } from '@ionic/angular';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { colorCards, Palette, palettesObj } from '@rainbow/shared';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  GalleryImage,
  GalleryQueryOptions,
  GalleryService,
} from '../../core/services/gallery.service';
import { AppMenuService } from '../../core/services/app-menu.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { FolderService, GalleryFolder } from '../../core/services/folder.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  FolderPickerSheetComponent,
  FolderPickerSheetData,
  FolderPickerSheetResult,
} from '../../shared/components/folder-picker-sheet.component';
import {
  GalleryCollageSheetComponent,
  GalleryCollageSheetData,
  GalleryCollageSheetResult,
} from '../../shared/components/gallery-collage-sheet.component';
import {
  GalleryFilterSheetComponent,
  GalleryFilterSheetData,
  GalleryFilterSheetResult,
} from '../../shared/components/gallery-filter-sheet.component';
import {
  GalleryViewerSheetComponent,
  GalleryViewerSheetData,
  GalleryViewerSheetResult,
} from '../../shared/components/gallery-viewer-sheet.component';
import {
  VirtualScrollGridComponent,
  VirtualScrollGridScrollEvent,
} from '../../shared/components/virtual-scroll-grid.component';

export interface GalleryFilterState {
  folderId: string | null;
  maskType: string | null;
  paletteType: string | null;
  coloristicType: string | null;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, RouterModule, FormsModule, VirtualScrollGridComponent],
  selector: 'app-gallery',
  templateUrl: './gallery.page.html',
  styleUrls: ['./gallery.page.scss'],
})
export class GalleryPage implements OnInit, OnDestroy {
  @ViewChild(VirtualScrollGridComponent) private virtualGrid?: VirtualScrollGridComponent<GalleryImage>;

  items: GalleryImage[] = [];
  total = 0;
  loading = true;
  loadingMore = false;
  hasMore = false;
  errorMessage = '';
  search = '';
  searchHidden = false;
  selectMode = false;
  paintSelecting = false;
  selectedIds = new Set<string>();
  filter: GalleryFilterState = {
    folderId: null,
    maskType: null,
    paletteType: null,
    coloristicType: null,
  };

  folders: GalleryFolder[] = [];
  readonly maskTypes = colorCards.map((c) => c.type);
  readonly paletteTypes = Object.keys(palettesObj) as Palette[];
  readonly coloristicTypes = ['mask', 'collage'] as const;
  /** ~2 columns on phones, more on wider screens (Vue uses 100px mobile / 250px desktop). */
  readonly gridMinColumnWidth = 160;
  readonly galleryItemKey = (item: GalleryImage) => item.id;

  get useVirtualGrid(): boolean {
    return !this.loading && this.items.length > 0;
  }

  private lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private searchRevealTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private lastScrollTop = 0;
  private readonly pageSize = 24;
  private readonly longPressMs = 420;
  private readonly moveCancelPx = 12;

  private activePointerId: number | null = null;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private paintMode: 'add' | 'remove' | null = null;
  private suppressNextClick = false;
  private paintedIds = new Set<string>();
  private pendingPaintItem: GalleryImage | null = null;

  constructor(
    private readonly gallery: GalleryService,
    private readonly foldersApi: FolderService,
    private readonly toasts: ToastService,
    private readonly confirm: ConfirmService,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly appMenu: AppMenuService,
    private readonly sheets: OverlaySheetService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  openAppMenu(): void {
    this.appMenu.open();
  }

  openStockLooks(): void {
    const queryParams = this.filter.paletteType
      ? { paletteType: this.filter.paletteType }
      : undefined;
    void this.router.navigate(['/tabs/stock-looks'], { queryParams });
  }

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
    return (
      !this.loading &&
      !this.errorMessage &&
      !this.items.length &&
      !this.search.trim() &&
      !this.hasActiveFilter
    );
  }

  get isNotFound(): boolean {
    return (
      !this.loading &&
      !this.errorMessage &&
      !this.items.length &&
      (!!this.search.trim() || this.hasActiveFilter)
    );
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  async ngOnInit(): Promise<void> {
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
    if (this.searchRevealTimer) {
      clearTimeout(this.searchRevealTimer);
    }
    this.clearLongPressTimer();
    this.detachPointerListeners();
    this.endPaint();
  }

  onSearchFocus(): void {
    this.showSearch();
  }

  onSearchChange(value: string | null | undefined): void {
    this.search = value ?? '';
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      void this.reload();
    }, 300);
  }

  async reload(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.lastDoc = null;
    this.hasMore = false;
    this.lastScrollTop = 0;
    this.showSearch();
    try {
      const page = await this.gallery.loadUserItems(this.buildOptions());
      this.items = page.items;
      this.lastDoc = page.lastDoc;
      this.total = page.total;
      this.hasMore = page.hasMore && !!page.lastDoc;
      this.pruneSelection();
    } catch (err) {
      console.error(err);
      this.items = [];
      this.total = 0;
      this.hasMore = false;
      this.errorMessage = this.translate.instant('galleryLoadError');
      await this.showToast(this.errorMessage, 'danger');
    } finally {
      this.loading = false;
      queueMicrotask(() => this.virtualGrid?.scrollToTop());
    }
  }

  onContentScroll(event?: CustomEvent<ScrollDetail>): void {
    // Virtual grid owns scrolling when the gallery list is shown.
    if (this.useVirtualGrid) {
      return;
    }
    if (this.paintSelecting) {
      return;
    }
    const scrollTop = event?.detail?.scrollTop ?? 0;
    this.updateSearchVisibility(scrollTop);
  }

  onVirtualGridScroll(event: VirtualScrollGridScrollEvent): void {
    if (this.paintSelecting) {
      return;
    }
    this.updateSearchVisibility(event.scrollTop);
  }

  onVirtualGridNearEnd(): void {
    void this.loadMore();
  }

  onContentScrollEnd(): void {
    if (this.useVirtualGrid) {
      return;
    }
    this.scheduleSearchReveal(120);
  }

  private updateSearchVisibility(scrollTop: number): void {
    const delta = scrollTop - this.lastScrollTop;
    const contentTallEnough = scrollTop > 8 || this.lastScrollTop > 8;

    if (!contentTallEnough) {
      this.showSearch();
      this.lastScrollTop = Math.max(0, scrollTop);
      return;
    }

    if (delta > 6 && scrollTop > 24) {
      if (!this.searchHidden) {
        this.searchHidden = true;
        this.cdr.markForCheck();
      }
      this.scheduleSearchReveal(450);
    } else if (delta < -6) {
      this.showSearch();
    }

    this.lastScrollTop = Math.max(0, scrollTop);
  }

  private scheduleSearchReveal(delayMs: number): void {
    if (this.searchRevealTimer) {
      clearTimeout(this.searchRevealTimer);
    }
    this.searchRevealTimer = setTimeout(() => this.showSearch(), delayMs);
  }

  private showSearch(): void {
    if (this.searchRevealTimer) {
      clearTimeout(this.searchRevealTimer);
      this.searchRevealTimer = null;
    }
    if (this.searchHidden) {
      this.searchHidden = false;
      this.cdr.markForCheck();
    }
  }

  async loadMore(event?: Event): Promise<void> {
    const target = event?.target as HTMLIonInfiniteScrollElement | undefined;
    if (this.loading || this.loadingMore || !this.hasMore || !this.lastDoc) {
      target?.complete();
      if (!this.loadingMore) {
        this.virtualGrid?.resetNearEndLatch();
      }
      return;
    }
    this.loadingMore = true;
    try {
      const page = await this.gallery.loadUserItems({
        ...this.buildOptions(),
        lastDoc: this.lastDoc,
      });
      this.items = [...this.items, ...page.items];
      this.lastDoc = page.lastDoc;
      this.total = page.total;
      this.hasMore = page.hasMore && !!page.lastDoc;
    } catch (err) {
      console.error(err);
      await this.showToast(this.translate.instant('galleryLoadError'), 'danger');
    } finally {
      this.loadingMore = false;
      target?.complete();
      this.virtualGrid?.resetNearEndLatch();
      this.cdr.markForCheck();
    }
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
      { fullscreen: false, closeOnBackdrop: true },
    );

    if (!result) {
      return;
    }
    this.filter = { ...result };
    await this.reload();
  }

  async openFolders(): Promise<void> {
    const result = await this.sheets.open<
      FolderPickerSheetComponent,
      FolderPickerSheetData,
      FolderPickerSheetResult
    >(
      FolderPickerSheetComponent,
      {
        selectedId: this.filter.folderId || undefined,
        allowClear: true,
      },
      { fullscreen: true, closeOnBackdrop: false },
    );
    if (!result) {
      return;
    }
    this.folders = result.folders;
    const filterFolderGone =
      !!this.filter.folderId && !this.folders.some((f) => f.id === this.filter.folderId);
    if (filterFolderGone) {
      this.filter = { ...this.filter, folderId: null };
      await this.reload();
      return;
    }
    if (result.chose) {
      const nextId = result.folder?.id ?? null;
      if (nextId !== this.filter.folderId) {
        this.filter = { ...this.filter, folderId: nextId };
        await this.reload();
      }
    }
  }

  toggleSelectMode(): void {
    if (this.selectMode) {
      this.exitSelectMode();
    } else {
      this.selectMode = true;
    }
  }

  exitSelectMode(): void {
    this.selectMode = false;
    this.selectedIds.clear();
    this.endPaint();
    this.clearLongPressTimer();
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.selectedIds = new Set(this.selectedIds);
  }

  toggleSelectAll(): void {
    if (this.selectedIds.size === this.items.length) {
      this.selectedIds.clear();
    } else {
      this.selectedIds = new Set(this.items.map((it) => it.id));
    }
  }

  onCellPointerDown(event: PointerEvent, item: GalleryImage): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    this.activePointerId = event.pointerId;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.suppressNextClick = false;
    this.pendingPaintItem = item;
    this.clearLongPressTimer();
    this.attachPointerListeners();

    if (this.selectMode) {
      // Wait: vertical move = scroll, lateral move = paint-select, tap = click toggle.
      return;
    }

    this.longPressTimer = setTimeout(() => {
      this.longPressTimer = null;
      this.selectMode = true;
      this.beginPaint(item);
      void navigator.vibrate?.(12);
      this.cdr.markForCheck();
    }, this.longPressMs);
  }

  private readonly onWindowPointerMove = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - this.pointerStartX;
    const dy = event.clientY - this.pointerStartY;
    const distance = Math.hypot(dx, dy);

    if (!this.selectMode && this.longPressTimer) {
      if (distance > this.moveCancelPx) {
        this.clearLongPressTimer();
        this.pendingPaintItem = null;
      }
      return;
    }

    if (this.selectMode && this.pendingPaintItem && !this.paintSelecting) {
      if (distance <= this.moveCancelPx) {
        return;
      }
      // Vertical-dominant gesture → let ion-content scroll.
      if (Math.abs(dy) > Math.abs(dx) + 2) {
        this.pendingPaintItem = null;
        return;
      }
      this.beginPaint(this.pendingPaintItem);
    }

    if (!this.paintSelecting || !this.paintMode) {
      return;
    }

    event.preventDefault();
    const id = this.galleryIdFromPoint(event.clientX, event.clientY);
    if (id) {
      this.applyPaint(id);
    }
  };

  private readonly onWindowPointerUp = (event: PointerEvent): void => {
    if (this.activePointerId !== null && this.activePointerId !== event.pointerId) {
      return;
    }
    this.clearLongPressTimer();
    this.pendingPaintItem = null;
    this.endPaint();
    this.detachPointerListeners();
    this.activePointerId = null;
  };

  private attachPointerListeners(): void {
    window.addEventListener('pointermove', this.onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerUp);
  }

  private detachPointerListeners(): void {
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onWindowPointerUp);
    window.removeEventListener('pointercancel', this.onWindowPointerUp);
  }

  async onCardClick(item: GalleryImage, index: number): Promise<void> {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }

    if (this.selectMode) {
      this.toggleId(item.id);
      return;
    }

    await this.openViewer(index);
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  async openCollage(): Promise<void> {
    if (!this.selectedIds.size) {
      return;
    }
    if (this.selectedIds.size > 6) {
      await this.showToast(this.translate.instant('maximumSelectedCollage'), 'warning');
      return;
    }

    const selected = this.items.filter((it) => this.selectedIds.has(it.id));
    const result = await this.sheets.open<
      GalleryCollageSheetComponent,
      GalleryCollageSheetData,
      GalleryCollageSheetResult
    >(
      GalleryCollageSheetComponent,
      {
        images: selected.map((it) => it.src),
        folders: this.folders,
        padding: 5,
      },
      {
        fullscreen: true,
        closeOnBackdrop: false,
        hasBackdrop: true,
        backdropClass: 'rm-cdk-backdrop',
      },
    );

    if (result?.saved) {
      await this.reload();
    }
  }

  private beginPaint(item: GalleryImage): void {
    this.paintSelecting = true;
    this.suppressNextClick = true;
    this.paintedIds.clear();
    this.paintMode = this.selectedIds.has(item.id) ? 'remove' : 'add';
    this.applyPaint(item.id);
  }

  private applyPaint(id: string): void {
    if (!this.paintMode || this.paintedIds.has(id)) {
      return;
    }
    this.paintedIds.add(id);
    if (this.paintMode === 'add') {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
    this.selectedIds = new Set(this.selectedIds);
    this.cdr.markForCheck();
  }

  private toggleId(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  private galleryIdFromPoint(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y);
    const cell = el?.closest('[data-gallery-id]') as HTMLElement | null;
    return cell?.dataset['galleryId'] ?? null;
  }

  private endPaint(): void {
    this.paintSelecting = false;
    this.paintMode = null;
    this.paintedIds.clear();
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private async openViewer(startIndex: number): Promise<void> {
    const result = await this.sheets.open<
      GalleryViewerSheetComponent,
      GalleryViewerSheetData,
      GalleryViewerSheetResult
    >(
      GalleryViewerSheetComponent,
      {
        items: this.items,
        startIndex,
        folders: this.folders,
        loadMore: async () => {
          await this.loadMore();
          return this.items;
        },
      },
      { fullscreen: true, closeOnBackdrop: false, hasBackdrop: true, backdropClass: 'rm-cdk-backdrop' },
    );

    if (!result) {
      return;
    }

    if (result.folders) {
      this.folders = result.folders;
      if (this.filter.folderId && !this.folders.some((f) => f.id === this.filter.folderId)) {
        this.filter = { ...this.filter, folderId: null };
        await this.reload();
        return;
      }
    }

    const deletedIds = result.deletedIds ?? [];
    if (result.items) {
      this.items = result.items;
    } else if (deletedIds.length) {
      const removed = new Set(deletedIds);
      this.items = this.items.filter((it) => !removed.has(it.id));
    }

    if (deletedIds.length) {
      this.total = Math.max(0, this.total - deletedIds.length);
      this.selectedIds = new Set([...this.selectedIds].filter((id) => !deletedIds.includes(id)));
      await this.showToast(
        this.translate.instant(
          deletedIds.length > 1 ? 'successDeleteImages' : 'successDeleteImage',
        ),
        'success',
      );
    }
  }

  async confirmDeleteSelected(): Promise<void> {
    if (!this.selectedIds.size) {
      return;
    }
    const ok = await this.confirm.danger('confirmDeleteImages');
    if (!ok) {
      return;
    }
    await this.deleteSelected();
  }

  private async deleteSelected(): Promise<void> {
    const ids = [...this.selectedIds];
    try {
      await this.gallery.deleteImages(ids);
      this.items = this.items.filter((it) => !ids.includes(it.id));
      this.total = Math.max(0, this.total - ids.length);
      this.exitSelectMode();
      this.cdr.markForCheck();
      await this.showToast(this.translate.instant('successDeleteImages'), 'success');
    } catch (err) {
      console.error(err);
      await this.showToast(this.translate.instant('galleryLoadError'), 'danger');
    }
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
    this.selectedIds = new Set([...this.selectedIds].filter((id) => ids.has(id)));
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning',
  ): Promise<void> {
    await this.toasts.show(message, color);
  }
}
