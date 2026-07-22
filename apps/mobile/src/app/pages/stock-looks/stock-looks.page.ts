import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
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
} from 'ionicons/icons';
import { Palette, palettesObj, palettesObjShort } from '@rainbow/shared';
import { AppMenuService } from '../../core/services/app-menu.service';
import { GalleryService } from '../../core/services/gallery.service';
import { StockLooksService } from '../../core/services/stock-looks.service';
import {
  StockLookItem,
  StockLooksCategory,
} from '../../core/services/stock-looks.types';
import { ToastService } from '../../core/services/toast.service';

addIcons({
  bookmarkOutline,
  colorPaletteOutline,
  imagesOutline,
  menuOutline,
  openOutline,
  refreshOutline,
});

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonChip,
    IonSpinner,
  ],
  selector: 'app-stock-looks',
  templateUrl: './stock-looks.page.html',
  styleUrls: ['./stock-looks.page.scss'],
})
export class StockLooksPage implements OnInit {
  readonly paletteNames = Object.keys(palettesObj) as Palette[];
  readonly categories: StockLooksCategory[] = ['outfit', 'portrait', 'accessories'];

  selectedPalette: Palette = this.paletteNames[0];
  selectedCategory: StockLooksCategory = 'outfit';
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
    }
    void this.search();
  }

  get accentSwatches(): string[] {
    return (palettesObjShort[this.selectedPalette] ?? []).slice(0, 8);
  }

  get hasApiKey(): boolean {
    return this.stockLooks.hasApiKey;
  }

  openAppMenu(): void {
    void this.appMenu.open();
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

  async search(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    try {
      const result = await this.stockLooks.search({
        paletteType: this.selectedPalette,
        category: this.selectedCategory,
        perPage: 24,
      });
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
        paletteType: this.selectedPalette,
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
