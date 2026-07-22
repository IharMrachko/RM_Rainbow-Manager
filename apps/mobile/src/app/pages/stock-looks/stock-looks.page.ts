import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonChip,
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
  colorPaletteOutline,
  imagesOutline,
  menuOutline,
  openOutline,
  refreshOutline,
  searchOutline,
} from 'ionicons/icons';
import { Palette, palettesObj, palettesObjShort } from '@rainbow/shared';
import { AppMenuService } from '../../core/services/app-menu.service';
import { GalleryService } from '../../core/services/gallery.service';
import { StockLooksService } from '../../core/services/stock-looks.service';
import {
  StockLookItem,
  StockLooksCategory,
  StockLooksMode,
} from '../../core/services/stock-looks.types';
import { ToastService } from '../../core/services/toast.service';

addIcons({
  bookmarkOutline,
  colorPaletteOutline,
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
    IonChip,
    IonSpinner,
    IonInput,
  ],
  selector: 'app-stock-looks',
  templateUrl: './stock-looks.page.html',
  styleUrls: ['./stock-looks.page.scss'],
})
export class StockLooksPage implements OnInit {
  readonly paletteNames = Object.keys(palettesObj) as Palette[];
  readonly categories: StockLooksCategory[] = ['outfit', 'portrait', 'accessories'];
  readonly modes: StockLooksMode[] = ['palette', 'free'];

  mode: StockLooksMode = 'palette';
  selectedPalette: Palette = this.paletteNames[0];
  selectedCategory: StockLooksCategory = 'outfit';
  freeQuery = '';
  items: StockLookItem[] = [];
  loading = false;
  usedMock = true;
  querySummary = '';
  errorMessage = '';
  savingId: string | null = null;

  constructor(
    private readonly stockLooks: StockLooksService,
    private readonly gallery: GalleryService,
    private readonly route: ActivatedRoute,
    private readonly appMenu: AppMenuService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

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

  get accentSwatches(): string[] {
    return (palettesObjShort[this.selectedPalette] ?? []).slice(0, 8);
  }

  get hasApiKey(): boolean {
    return this.stockLooks.hasApiKey;
  }

  get isFreeMode(): boolean {
    return this.mode === 'free';
  }

  openAppMenu(): void {
    void this.appMenu.open();
  }

  selectMode(mode: StockLooksMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.items = [];
    this.errorMessage = '';
    this.querySummary = '';
    if (mode === 'palette') {
      void this.search();
    } else {
      this.cdr.markForCheck();
    }
  }

  selectPalette(name: Palette): void {
    if (this.selectedPalette === name) return;
    this.selectedPalette = name;
    void this.search();
  }

  selectCategory(category: StockLooksCategory): void {
    if (this.selectedCategory === category) return;
    this.selectedCategory = category;
    void this.search();
  }

  onFreeQuerySubmit(): void {
    void this.search();
  }

  async search(): Promise<void> {
    if (this.mode === 'free' && !this.freeQuery.trim()) {
      this.items = [];
      this.errorMessage = '';
      this.querySummary = '';
      this.usedMock = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    try {
      const result = await this.stockLooks.search(
        this.mode === 'free'
          ? {
              mode: 'free',
              freeQuery: this.freeQuery.trim(),
              perPage: 24,
            }
          : {
              mode: 'palette',
              paletteType: this.selectedPalette,
              category: this.selectedCategory,
              perPage: 24,
            },
      );
      this.items = result.items;
      this.usedMock = result.usedMock;
      this.querySummary = result.querySummary;
    } catch {
      this.items = [];
      this.errorMessage = this.translate.instant('stockLooksError');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  matchLabelKey(label: StockLookItem['matchLabel']): string {
    if (label === 'excellent') return 'stockLooksMatchExcellent';
    if (label === 'good') return 'stockLooksMatchGood';
    return 'stockLooksMatchFair';
  }

  modeKey(mode: StockLooksMode): string {
    return mode === 'free' ? 'stockLooksModeFree' : 'stockLooksModePalette';
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
