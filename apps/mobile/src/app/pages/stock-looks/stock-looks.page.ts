import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  bookmarkOutline,
  chevronForwardOutline,
  closeCircle,
  eyedrop,
  filterOutline,
  imagesOutline,
  menuOutline,
  openOutline,
  refreshOutline,
  searchOutline,
} from 'ionicons/icons';
import { Palette, palettesObj, palettesObjShort } from '@rainbow/shared';
import { AppMenuService } from '../../core/services/app-menu.service';
import { GalleryService } from '../../core/services/gallery.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import { StockLooksService } from '../../core/services/stock-looks.service';
import {
  StockLookItem,
  StockLooksCategory,
  StockLooksMode,
  StockLooksProvider,
} from '../../core/services/stock-looks.types';
import { ToastService } from '../../core/services/toast.service';
import {
  ColorPickerSheetComponent,
  ColorPickerSheetData,
  ColorPickerSheetResult,
} from '../../shared/components/color-picker-sheet.component';
import {
  StockLooksFilterSheetComponent,
  StockLooksFilterSheetData,
  StockLooksFilterSheetResult,
} from '../../shared/components/stock-looks-filter-sheet.component';
import { VirtualScrollGridComponent } from '../../shared/components/virtual-scroll-grid.component';

addIcons({
  bookmarkOutline,
  chevronForwardOutline,
  closeCircle,
  eyedrop,
  filterOutline,
  imagesOutline,
  menuOutline,
  openOutline,
  refreshOutline,
  searchOutline,
});

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonSpinner,
    IonInput,
    VirtualScrollGridComponent,
  ],
  selector: 'app-stock-looks',
  templateUrl: './stock-looks.page.html',
  styleUrls: ['./stock-looks.page.scss'],
})
export class StockLooksPage implements OnInit, OnDestroy {
  @ViewChild(VirtualScrollGridComponent) private virtualGrid?: VirtualScrollGridComponent<StockLookItem>;

  readonly paletteNames = Object.keys(palettesObj) as Palette[];
  readonly categories: StockLooksCategory[] = ['outfit', 'portrait', 'accessories'];
  readonly modes: StockLooksMode[] = ['palette', 'free'];
  readonly providers: StockLooksProvider[] = ['all', 'pexels', 'unsplash'];
  /** 1 col on phones, 2 from ~520px content width. */
  readonly gridMinColumnWidth = 240;
  /** Portrait media 3:4. */
  readonly gridMediaAspect = 3 / 4;
  /** Title, photographer, swatches, action row. */
  readonly gridMetaHeight = 132;
  readonly stockItemKey = (item: StockLookItem) => item.id;

  mode: StockLooksMode = 'palette';
  provider: StockLooksProvider = 'all';
  selectedPalette: Palette = this.paletteNames[0];
  selectedCategory: StockLooksCategory = 'outfit';
  freeQuery = '';
  freeColorHex = '';
  items: StockLookItem[] = [];
  loading = false;
  loadingMore = false;
  hasMore = false;
  currentPage = 1;
  usedMock = true;
  warningKey = '';
  querySummary = '';
  errorMessage = '';
  savingId: string | null = null;

  constructor(
    private readonly stockLooks: StockLooksService,
    private readonly gallery: GalleryService,
    private readonly route: ActivatedRoute,
    private readonly appMenu: AppMenuService,
    private readonly sheets: OverlaySheetService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get useVirtualGrid(): boolean {
    return !this.loading && !this.errorMessage && this.items.length > 0;
  }

  get accentSwatches(): string[] {
    return (palettesObjShort[this.selectedPalette] ?? []).slice(0, 6);
  }

  get hasPexelsKey(): boolean {
    return this.stockLooks.hasPexelsKey;
  }

  get hasUnsplashKey(): boolean {
    return this.stockLooks.hasUnsplashKey;
  }

  get isFreeMode(): boolean {
    return this.mode === 'free';
  }

  /** Non-default filters → badge on filter button. */
  get filterBadgeCount(): number {
    let n = 0;
    if (this.provider !== 'all') n += 1;
    if (!this.isFreeMode) {
      if (this.selectedCategory !== 'outfit') n += 1;
      // palette always set; count only when not first default if we want — skip, always show summary
    }
    return n;
  }

  get filterSummary(): string {
    if (this.isFreeMode) {
      return this.translate.instant(this.providerKey(this.provider));
    }
    const parts = [
      this.translate.instant(this.selectedPalette),
      this.translate.instant(this.categoryKey(this.selectedCategory)),
      this.translate.instant(this.providerKey(this.provider)),
    ];
    return parts.join(' · ');
  }

  ngOnInit(): void {
    const fromQuery = this.route.snapshot.queryParamMap.get('paletteType');
    if (fromQuery && this.paletteNames.includes(fromQuery as Palette)) {
      this.selectedPalette = fromQuery as Palette;
      this.mode = 'palette';
    }
    const mode = this.route.snapshot.queryParamMap.get('mode');
    if (mode === 'free' || mode === 'palette') {
      this.mode = mode;
    }
    if (this.mode === 'palette') {
      void this.search();
    }
  }

  ngOnDestroy(): void {
    this.sheets.close();
  }

  openAppMenu(): void {
    void this.appMenu.open();
  }

  selectMode(mode: StockLooksMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.items = [];
    this.hasMore = false;
    this.currentPage = 1;
    this.errorMessage = '';
    this.querySummary = '';
    this.warningKey = '';
    if (mode === 'palette') {
      void this.search();
    } else {
      this.cdr.markForCheck();
    }
  }

  async openFilter(): Promise<void> {
    const result = await this.sheets.open<
      StockLooksFilterSheetComponent,
      StockLooksFilterSheetData,
      StockLooksFilterSheetResult
    >(
      StockLooksFilterSheetComponent,
      {
        mode: this.mode,
        filter: {
          provider: this.provider,
          palette: this.selectedPalette,
          category: this.selectedCategory,
        },
        paletteNames: this.paletteNames,
        categories: this.categories,
        providers: this.providers,
        hasPexelsKey: this.hasPexelsKey,
        hasUnsplashKey: this.hasUnsplashKey,
      },
      { fullscreen: false, closeOnBackdrop: true, hasBackdrop: true, backdropClass: 'rm-cdk-backdrop' },
    );

    if (!result) return;

    const changed =
      result.provider !== this.provider ||
      result.palette !== this.selectedPalette ||
      result.category !== this.selectedCategory;

    this.provider = result.provider;
    this.selectedPalette = result.palette;
    this.selectedCategory = result.category;
    this.cdr.markForCheck();

    if (!changed) return;

    if (this.isFreeMode) {
      if (this.freeQuery.trim() || this.freeColorHex) {
        void this.search();
      }
      return;
    }
    void this.search();
  }

  onFreeQuerySubmit(): void {
    void this.search();
  }

  async openFreeColorPicker(): Promise<void> {
    const result = await this.sheets.open<
      ColorPickerSheetComponent,
      ColorPickerSheetData,
      ColorPickerSheetResult
    >(
      ColorPickerSheetComponent,
      { hex: this.freeColorHex || '#C48A8F' },
      {
        closeOnBackdrop: true,
        hasBackdrop: true,
        backdropClass: 'rm-cdk-backdrop',
      },
    );
    if (!result?.hex) return;
    this.freeColorHex = result.hex.trim().toUpperCase();
    this.cdr.markForCheck();
    if (this.freeQuery.trim() || this.freeColorHex) {
      void this.search();
    }
  }

  clearFreeColor(): void {
    this.freeColorHex = '';
    this.cdr.markForCheck();
    if (this.freeQuery.trim()) {
      void this.search();
    } else {
      this.items = [];
      this.querySummary = '';
    }
  }

  async search(): Promise<void> {
    if (this.mode === 'free' && !this.freeQuery.trim() && !this.freeColorHex) {
      this.items = [];
      this.errorMessage = '';
      this.querySummary = '';
      this.usedMock = false;
      this.warningKey = '';
      this.hasMore = false;
      this.currentPage = 1;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.loadingMore = false;
    this.currentPage = 1;
    this.errorMessage = '';
    this.cdr.markForCheck();
    try {
      const result = await this.stockLooks.search(this.buildSearchParams(1));
      this.items = result.items;
      this.usedMock = result.usedMock;
      this.querySummary = result.querySummary;
      this.warningKey = result.warningKey || '';
      this.hasMore = Boolean(result.hasMore) && !result.usedMock;
      this.currentPage = result.page ?? 1;
    } catch {
      this.items = [];
      this.usedMock = false;
      this.warningKey = '';
      this.hasMore = false;
      this.errorMessage = this.translate.instant('stockLooksError');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
      queueMicrotask(() => this.virtualGrid?.scrollToTop());
    }
  }

  onVirtualGridNearEnd(): void {
    void this.loadMore();
  }

  async loadMore(event?: Event): Promise<void> {
    const target = event?.target as HTMLIonInfiniteScrollElement | undefined;
    if (this.loading || this.loadingMore || !this.hasMore || this.usedMock) {
      target?.complete();
      if (!this.loadingMore) {
        this.virtualGrid?.resetNearEndLatch();
      }
      return;
    }

    this.loadingMore = true;
    this.cdr.markForCheck();
    try {
      const nextPage = this.currentPage + 1;
      const result = await this.stockLooks.search(this.buildSearchParams(nextPage));
      const existing = new Set(this.items.map((item) => item.id));
      const appended = result.items.filter((item) => !existing.has(item.id));
      this.items = [...this.items, ...appended];
      this.currentPage = result.page ?? nextPage;
      this.hasMore = Boolean(result.hasMore) && appended.length > 0;
      if (result.warningKey && !this.items.length) {
        this.warningKey = result.warningKey;
      }
    } catch {
      this.hasMore = false;
    } finally {
      this.loadingMore = false;
      target?.complete();
      this.virtualGrid?.resetNearEndLatch();
      this.cdr.markForCheck();
    }
  }

  private buildSearchParams(page: number) {
    return this.mode === 'free'
      ? {
          mode: 'free' as const,
          provider: this.provider,
          freeQuery: this.freeQuery.trim(),
          freeColorHex: this.freeColorHex || undefined,
          perPage: 24,
          page,
        }
      : {
          mode: 'palette' as const,
          provider: this.provider,
          paletteType: this.selectedPalette,
          category: this.selectedCategory,
          perPage: 24,
          page,
        };
  }

  matchLabelKey(label: StockLookItem['matchLabel']): string {
    if (label === 'excellent') return 'stockLooksMatchExcellent';
    if (label === 'good') return 'stockLooksMatchGood';
    return 'stockLooksMatchFair';
  }

  modeKey(mode: StockLooksMode): string {
    return mode === 'free' ? 'stockLooksModeFree' : 'stockLooksModePalette';
  }

  providerKey(provider: StockLooksProvider): string {
    if (provider === 'pexels') return 'stockLooksProviderPexels';
    if (provider === 'unsplash') return 'stockLooksProviderUnsplash';
    return 'stockLooksProviderAll';
  }

  sourceKey(source: StockLookItem['source']): string {
    if (source === 'unsplash') return 'stockLooksProviderUnsplash';
    if (source === 'pexels') return 'stockLooksProviderPexels';
    return 'stockLooksProviderMock';
  }

  categoryKey(category: StockLooksCategory): string {
    if (category === 'outfit') return 'stockLooksCategoryOutfit';
    if (category === 'portrait') return 'stockLooksCategoryPortrait';
    return 'stockLooksCategoryAccessories';
  }

  openSource(item: StockLookItem): void {
    window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
  }

  async saveToGallery(item: StockLookItem): Promise<void> {
    if (this.savingId) return;
    this.savingId = item.id;
    this.cdr.markForCheck();
    try {
      const canvas = await this.loadImageToCanvas(item.largeUrl || item.previewUrl);
      await this.gallery.saveImage({
        canvas,
        title: item.title,
        coloristicType: 'stock',
        paletteType: this.isFreeMode ? undefined : this.selectedPalette,
      });
      this.toasts.show(this.translate.instant('stockLooksSaved'));
    } catch {
      this.toasts.show(this.translate.instant('stockLooksSaveError'));
    } finally {
      this.savingId = null;
      this.cdr.markForCheck();
    }
  }

  private loadImageToCanvas(url: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error('image'));
      img.src = url;
    });
  }
}
