import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GalleryService } from '../../core/services/gallery.service';
import { GalleryFolder } from '../../core/services/folder.service';
import { ToastService } from '../../core/services/toast.service';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
  OverlaySheetService,
} from '../../core/services/overlay-sheet.service';
import {
  FolderPickerSheetComponent,
  FolderPickerSheetData,
  FolderPickerSheetResult,
} from './folder-picker-sheet.component';

export interface GalleryCollageSheetData {
  images: string[];
  folders: GalleryFolder[];
  padding?: number;
}

export interface GalleryCollageSheetResult {
  saved: boolean;
}

interface LoadedImage {
  img: HTMLImageElement;
  width: number;
  height: number;
  aspectRatio: number;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  selector: 'app-gallery-collage-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-collage" role="dialog" aria-modal="true">
      <header class="rm-collage__bar">
        <button type="button" class="rm-collage__icon-btn" (click)="dismiss()" aria-label="close">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </button>
        <div class="rm-collage__title">{{ 'collage' | translate }}</div>
        <span class="rm-collage__spacer"></span>
      </header>

      <div #container class="rm-collage__stage">
        <canvas #canvas class="rm-collage__canvas"></canvas>
        @if (loading) {
          <div class="rm-collage__loader">
            <ion-spinner name="crescent"></ion-spinner>
          </div>
        }
      </div>

      <footer class="rm-collage__footer">
        <div class="rm-collage__badges">
          @if (folderId) {
            <span class="rm-collage__badge">{{ folderName }}</span>
          }
          <span class="rm-collage__badge">{{ 'collage' | translate }}</span>
        </div>

        <button type="button" class="rm-collage__field" (click)="openFolderPicker()">
          <span class="rm-collage__label">{{ 'folder' | translate }}</span>
          <span class="rm-collage__folder-value">
            <span>{{ folderName || ('all' | translate) }}</span>
            <ion-icon name="folder-outline"></ion-icon>
          </span>
        </button>

        <label class="rm-collage__field rm-collage__field--input">
          <span class="rm-collage__label">{{ 'noName' | translate }}</span>
          <input
            class="rm-collage__input"
            type="text"
            [(ngModel)]="title"
            [placeholder]="'noName' | translate"
          />
        </label>

        <button
          type="button"
          class="rm-collage__save"
          [disabled]="loading || saving || !data.images.length"
          (click)="save()"
        >
          @if (saving) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            {{ 'saveToGallery' | translate }}
          }
        </button>
      </footer>
    </div>
  `,
  styles: [
    `
      .rm-collage {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: var(--rm-surface, #eef0f7);
        color: var(--rm-ink, #16182a);
      }

      .rm-collage__bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px;
        background: var(--rm-elevated, #fff);
        border-bottom: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }

      .rm-collage__title {
        flex: 1;
        font-weight: 650;
        font-size: 17px;
      }

      .rm-collage__icon-btn {
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

      .rm-collage__spacer {
        width: 40px;
      }

      .rm-collage__stage {
        position: relative;
        flex: 1;
        min-height: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        overflow: hidden;
      }

      .rm-collage__canvas {
        max-width: 100%;
        max-height: 100%;
        border-radius: 12px;
        box-shadow: 0 10px 28px rgba(22, 24, 42, 0.12);
        background: #fff;
      }

      .rm-collage__loader {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(238, 240, 247, 0.55);
      }

      .rm-collage__footer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px 16px calc(16px + env(safe-area-inset-bottom, 0px));
        background: var(--rm-elevated, #fff);
        border-top: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }

      .rm-collage__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .rm-collage__badge {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(91, 110, 245, 0.12);
        color: #5b6ef5;
        font-weight: 600;
      }

      .rm-collage__field {
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
        color: #16182a;
        text-align: left;
        box-sizing: border-box;
      }

      .rm-collage__field--input {
        cursor: text;
      }

      .rm-collage__folder-value {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 0.98rem;
        font-weight: 650;
      }

      .rm-collage__folder-value ion-icon {
        font-size: 1.15rem;
        color: #5c6178;
      }

      .rm-collage__label {
        font-size: 0.78rem;
        font-weight: 600;
        color: #5c6178;
      }

      .rm-collage__input {
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

      .rm-collage__save {
        width: 100%;
        min-height: 48px;
        border: 0;
        border-radius: 14px;
        background: #5b6ef5;
        color: #fff;
        font-weight: 700;
        font-size: 0.98rem;
        display: grid;
        place-items: center;
      }

      .rm-collage__save:disabled {
        opacity: 0.55;
      }
    `,
  ],
})
export class GalleryCollageSheetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', { static: true }) private containerRef!: ElementRef<HTMLElement>;

  title = '';
  folderId = '';
  loading = true;
  saving = false;
  private folders: GalleryFolder[];

  private columns = 2;
  private rows = 1;
  private resizeObserver: ResizeObserver | null = null;
  private readonly padding: number;
  private readonly maxImages = 9;
  private cachedImages: LoadedImage[] | null = null;
  private creating = false;
  private loadFailed = false;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: GalleryCollageSheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly sheetRef: OverlaySheetRef<GalleryCollageSheetResult>,
    private readonly gallery: GalleryService,
    private readonly sheets: OverlaySheetService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.padding = data.padding ?? 5;
    this.folders = [...(data.folders ?? [])];
  }

  get folderName(): string {
    return this.folders.find((f) => f.id === this.folderId)?.name ?? '';
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
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    setTimeout(() => void this.createCollage(), 80);
    this.resizeObserver = new ResizeObserver(() => void this.createCollage());
    this.resizeObserver.observe(this.containerRef.nativeElement);
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.onResize);
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
  }

  dismiss(): void {
    this.sheetRef.close({ saved: false });
  }

  async save(): Promise<void> {
    if (this.saving || this.loading) {
      return;
    }
    this.saving = true;
    try {
      await this.gallery.saveImage({
        canvas: this.canvasRef.nativeElement,
        title: this.title.trim(),
        coloristicType: 'collage',
        maskType: '',
        paletteType: '',
        folderId: this.folderId || '',
        path: `avatar/collage-${Date.now()}.png`,
      });
      await this.toasts.show(this.translate.instant('successImage'), 'success');
      this.sheetRef.close({ saved: true });
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('collageLoadError'), 'danger');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  private readonly onResize = (): void => {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    this.resizeTimer = setTimeout(() => void this.createCollage(), 80);
  };

  private async createCollage(): Promise<void> {
    if (this.creating || this.loadFailed) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    const urls = this.data.images.slice(0, this.maxImages);
    if (!urls.length) {
      this.loading = false;
      return;
    }

    this.creating = true;
    this.loading = !this.cachedImages;
    this.cdr.markForCheck();

    try {
      if (!this.cachedImages) {
        this.cachedImages = await Promise.all(urls.map((url) => this.loadImage(url)));
      }
      const images = this.cachedImages;
      const grid = this.calculateGrid(images.length);
      this.columns = grid.columns;
      this.rows = grid.rows;

      const { width: displayWidth, height: displayHeight } = this.fitCanvasSize(container);
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      canvas.width = Math.max(1, Math.floor(displayWidth * dpr));
      canvas.height = Math.max(1, Math.floor(displayHeight * dpr));
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      const cellWidth = displayWidth / this.columns;
      const cellHeight = displayHeight / this.rows;

      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.columns; col++) {
          const index = row * this.columns + col;
          if (index >= images.length) {
            break;
          }
          const image = images[index];
          const paddedWidth = cellWidth - this.padding * 2;
          const paddedHeight = cellHeight - this.padding * 2;
          const paddedX = col * cellWidth + this.padding;
          const paddedY = row * cellHeight + this.padding;
          const draw = this.coverSize(image, paddedWidth, paddedHeight);
          ctx.drawImage(
            image.img,
            0,
            0,
            image.width,
            image.height,
            paddedX + draw.x,
            paddedY + draw.y,
            draw.width,
            draw.height,
          );
        }
      }
    } catch (err) {
      console.error(err);
      this.loadFailed = true;
      this.cachedImages = null;
      await this.toasts.show(this.translate.instant('collageLoadError'), 'danger');
    } finally {
      this.creating = false;
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private calculateGrid(count: number): { columns: number; rows: number } {
    const displayCount = Math.min(count, this.maxImages);
    if (displayCount <= 0) {
      return { columns: 1, rows: 1 };
    }
    // Mobile: max 2 columns (same as Vue gallery collage).
    const columns = Math.min(2, displayCount);
    const rows = Math.ceil(displayCount / columns);
    return { columns, rows };
  }

  private fitCanvasSize(container: HTMLElement): { width: number; height: number } {
    const rect = container.getBoundingClientRect();
    const maxWidth = Math.max(80, Math.floor(rect.width * 0.96));
    const maxHeight = Math.max(80, Math.floor(rect.height * 0.96));
    const aspectRatio = this.columns / this.rows;
    let width = maxWidth;
    let height = width / aspectRatio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    return {
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(height)),
    };
  }

  private coverSize(
    image: LoadedImage,
    cellWidth: number,
    cellHeight: number,
  ): { width: number; height: number; x: number; y: number } {
    const cellAspect = cellWidth / cellHeight;
    const imageAspect = image.aspectRatio;
    let width: number;
    let height: number;
    let x: number;
    let y: number;
    if (imageAspect > cellAspect) {
      width = cellWidth;
      height = cellWidth / imageAspect;
      x = 0;
      y = (cellHeight - height) / 2;
    } else {
      height = cellHeight;
      width = cellHeight * imageAspect;
      x = (cellWidth - width) / 2;
      y = 0;
    }
    return { width, height, x, y };
  }

  private async loadImage(url: string): Promise<LoadedImage> {
    const blob = await this.fetchImageBlob(url);
    const objectUrl = URL.createObjectURL(blob);
    try {
      const img = await this.decodeImage(objectUrl);
      return {
        img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / Math.max(1, img.naturalHeight),
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  private async fetchImageBlob(url: string): Promise<Blob> {
    // Use CapacitorHttp directly (not global fetch patch) so Firestore keeps working.
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.get({
        url,
        responseType: 'blob',
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP ${response.status}`);
      }
      return this.httpDataToBlob(response.data, response.headers);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.blob();
  }

  private httpDataToBlob(data: unknown, headers: Record<string, string>): Blob {
    const contentType =
      headers['Content-Type'] || headers['content-type'] || 'image/jpeg';

    if (data instanceof Blob) {
      return data;
    }
    if (typeof data === 'string') {
      const base64 = data.includes(',') ? data.split(',')[1]! : data;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: contentType });
    }
    if (data instanceof ArrayBuffer) {
      return new Blob([data], { type: contentType });
    }
    throw new Error('Unsupported image response');
  }

  private decodeImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = src;
    });
  }
}
