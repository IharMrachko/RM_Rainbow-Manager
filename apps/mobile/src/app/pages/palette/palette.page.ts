import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import chroma from 'chroma-js';
import { defaultPaletteCards, palettesObj } from '@rainbow/shared';
import { AppMenuService } from '../../core/services/app-menu.service';
import { DeviceMediaService } from '../../core/services/device-media.service';
import { FolderService } from '../../core/services/folder.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from '../../shared/components/choice-sheet.component';
import { EditorCanvasComponent } from '../../shared/components/editor-canvas.component';
import {
  GallerySaveSheetComponent,
  GallerySaveSheetData,
  GallerySaveSheetResult,
} from '../../shared/components/gallery-save-sheet.component';
import { ImageColorPickerComponent } from '../../shared/components/image-color-picker.component';
import {
  MaskCameraModalComponent,
  MaskCameraResult,
  MaskCameraSheetData,
} from '../../shared/components/mask-camera-modal.component';

interface AnalysisResultItem {
  name: string;
  segments: { color: string }[];
}

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    ImageColorPickerComponent,
    EditorCanvasComponent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  selector: 'app-palette',
  templateUrl: './palette.page.html',
  styleUrls: ['./palette.page.scss'],
})
export class PalettePage implements OnDestroy {
  @ViewChildren(EditorCanvasComponent) editors!: QueryList<EditorCanvasComponent>;

  image: HTMLImageElement | null = null;
  imageUrl: string | null = null;
  slots = defaultPaletteCards.map((c) => ({ ...c }));
  activeSlot = 0;
  showResults = false;
  results: AnalysisResultItem[] = [];
  visibleCount = 3;
  busyIndex: number | null = null;
  busyKind: 'device' | 'gallery' | null = null;

  private readonly weights = { l: 1.0, c: 1.0, h: 1.5 };
  private readonly tolerance = { l: 10, c: 20, h: 15 };
  private readonly emptyColor = '#fff';

  constructor(
    private readonly translate: TranslateService,
    private readonly appMenu: AppMenuService,
    private readonly sheets: OverlaySheetService,
    private readonly deviceMedia: DeviceMediaService,
    private readonly foldersApi: FolderService,
    private readonly toasts: ToastService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    this.sheets.close();
  }

  get canDefine(): boolean {
    return !!this.image && !!this.imageUrl && this.slots.every((s) => this.isSlotFilled(s.color));
  }

  get visibleResults(): AnalysisResultItem[] {
    return this.results.slice(0, this.visibleCount);
  }

  openMenu(): void {
    this.appMenu.open();
  }

  selectSlot(index: number): void {
    this.activeSlot = index;
  }

  isSlotFilled(color: string): boolean {
    const normalized = (color || '').trim().toLowerCase();
    return !!normalized && normalized !== '#fff' && normalized !== '#ffffff' && normalized !== 'white';
  }

  onHex(hex: string): void {
    if (!chroma.valid(hex)) {
      return;
    }
    this.slots[this.activeSlot] = { ...this.slots[this.activeSlot], color: hex };
    this.advanceToNextEmptySlot();
    this.cdr.detectChanges();
  }

  define(): void {
    if (!this.canDefine || !this.imageUrl) {
      void this.toast(this.translate.instant('reminderPickColor'), 'warning');
      return;
    }

    const photoColors = this.slots.map((s) => s.color);
    this.results = Object.entries(palettesObj)
      .map(([name, palette]) => {
        const closestMap = photoColors.map((hex) => {
          let best = { distance: Infinity, hit: false };
          for (const p of palette) {
            const d = this.colorDistance(hex, p);
            if (d < best.distance) {
              best = { distance: d, hit: this.isWithinTolerance(hex, p) };
            }
          }
          return best;
        });
        const score =
          closestMap.reduce((sum, it) => sum + it.distance, 0) / Math.max(1, closestMap.length);
        const hits = closestMap.filter((it) => it.hit).length;
        return {
          name,
          score,
          hits,
          segments: palette.map((color) => ({ color })),
        };
      })
      .sort((a, b) => b.hits - a.hits || a.score - b.score)
      .map(({ name, segments }) => ({ name, segments }));

    this.visibleCount = Math.min(3, this.results.length);
    this.showResults = true;
    this.busyIndex = null;
    this.busyKind = null;
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      const host = document.querySelector('app-palette');
      host?.scrollTo?.({ top: 0 });
    });
  }

  closeResults(): void {
    this.showResults = false;
    this.busyIndex = null;
    this.busyKind = null;
  }

  seeMore(): void {
    this.visibleCount = this.results.length;
  }

  async saveToDevice(index: number): Promise<void> {
    if (this.busyIndex !== null) {
      return;
    }
    this.busyIndex = index;
    this.busyKind = 'device';
    try {
      const canvas = await this.exportCanvas(index);
      if (!canvas) {
        throw new Error('export failed');
      }
      const name = this.results[index]?.name ?? 'palette';
      await this.deviceMedia.saveCanvas(canvas, `analysis-${name}-${Date.now()}`);
      await this.toast(this.translate.instant('successImage'), 'success');
    } catch (err) {
      console.error(err);
      await this.toast(this.translate.instant('saveError'), 'danger');
    } finally {
      this.busyIndex = null;
      this.busyKind = null;
    }
  }

  async saveToGallery(index: number): Promise<void> {
    if (this.busyIndex !== null) {
      return;
    }
    this.busyIndex = index;
    this.busyKind = 'gallery';
    try {
      const canvas = await this.exportCanvas(index);
      if (!canvas) {
        throw new Error('export failed');
      }
      const folders = await this.foldersApi.listMine();
      const name = this.results[index]?.name ?? 'palette';
      this.busyIndex = null;
      this.busyKind = null;
      await this.sheets.open<
        GallerySaveSheetComponent,
        GallerySaveSheetData,
        GallerySaveSheetResult
      >(GallerySaveSheetComponent, {
        canvas,
        previewUrl: canvas.toDataURL('image/png'),
        folders,
        maskType: name,
        coloristicType: 'analysis-by-photo',
        paletteType: name,
      });
    } catch (err) {
      console.error(err);
      await this.toast(this.translate.instant('saveError'), 'danger');
    } finally {
      this.busyIndex = null;
      this.busyKind = null;
    }
  }

  async openSourcePicker(): Promise<void> {
    const source = await this.sheets.open<
      ChoiceSheetComponent<'gallery' | 'camera'>,
      ChoiceSheetData<'gallery' | 'camera'>,
      'gallery' | 'camera'
    >(ChoiceSheetComponent, {
      titleKey: 'chooseSource',
      options: [
        { value: 'gallery', labelKey: 'pickPhoto', icon: '🖼️' },
        { value: 'camera', labelKey: 'takePhoto', icon: '📷' },
      ],
    });
    if (source === 'gallery') {
      await this.pickPhoto();
    } else if (source === 'camera') {
      await this.takePhoto();
    }
  }

  async pickPhoto(): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        quality: 92,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
        width: 1600,
      });
      const url = photo.dataUrl || photo.webPath || null;
      if (url) {
        await this.setImageFromUrl(url);
      }
    } catch (err) {
      if (!this.isUserCancel(err)) {
        console.error(err);
        await this.toast(this.translate.instant('cameraError'), 'danger');
      }
    }
  }

  async takePhoto(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await Camera.requestPermissions({ permissions: ['camera'] });
        if (perm.camera !== 'granted') {
          await this.toast(this.translate.instant('cameraError'), 'danger');
          return;
        }
      } catch {
        // continue
      }
    }

    const result = await this.sheets.open<
      MaskCameraModalComponent,
      MaskCameraSheetData,
      MaskCameraResult
    >(
      MaskCameraModalComponent,
      {
        cards: [],
        selectedId: 0,
        frameThickness: 16,
      },
      { fullscreen: true, closeOnBackdrop: false },
    );

    if (!result) {
      return;
    }

    await this.ngZone.run(async () => {
      await this.setImageFromUrl(result.dataUrl);
      this.cdr.detectChanges();
    });
  }

  private async exportCanvas(index: number): Promise<HTMLCanvasElement | null> {
    const editor = this.editors?.get(index);
    if (!editor) {
      return null;
    }
    await editor.refresh();
    const src = editor.getCanvas();
    if (!src) {
      return null;
    }
    const clone = document.createElement('canvas');
    clone.width = src.width;
    clone.height = src.height;
    const ctx = clone.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.drawImage(src, 0, 0);
    return clone;
  }

  private advanceToNextEmptySlot(): void {
    const next = this.slots.findIndex(
      (s, i) => i > this.activeSlot && !this.isSlotFilled(s.color),
    );
    if (next >= 0) {
      this.activeSlot = next;
      return;
    }
    const firstEmpty = this.slots.findIndex((s) => !this.isSlotFilled(s.color));
    if (firstEmpty >= 0) {
      this.activeSlot = firstEmpty;
    }
  }

  private resetSlots(): void {
    this.slots = defaultPaletteCards.map((c) => ({ ...c, color: this.emptyColor }));
    this.activeSlot = 0;
    this.showResults = false;
    this.results = [];
  }

  private async setImageFromUrl(url: string): Promise<void> {
    const img = await this.loadImage(url);
    this.image = img;
    this.imageUrl = url;
    this.resetSlots();
    this.cdr.detectChanges();
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image load failed'));
      img.src = url;
    });
  }

  private hueDelta(h1: number, h2: number): number {
    return Math.abs(((h1 - h2 + 180) % 360) - 180);
  }

  private colorDistance(hexA: string, hexB: string): number {
    const [l1, c1, h1] = chroma(hexA).lch();
    const [l2, c2, h2] = chroma(hexB).lch();
    return (
      this.weights.l * Math.abs(l1 - l2) +
      this.weights.c * Math.abs(c1 - c2) +
      this.weights.h * this.hueDelta(h1, h2)
    );
  }

  private isWithinTolerance(hexA: string, hexB: string): boolean {
    const [l1, c1, h1] = chroma(hexA).lch();
    const [l2, c2, h2] = chroma(hexB).lch();
    return (
      Math.abs(l1 - l2) <= this.tolerance.l &&
      Math.abs(c1 - c2) <= this.tolerance.c &&
      this.hueDelta(h1, h2) <= this.tolerance.h
    );
  }

  private isUserCancel(err: unknown): boolean {
    const message = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
    return message.includes('cancel') || message.includes('user denied');
  }

  private async toast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    await this.toasts.show(message, color);
  }
}
