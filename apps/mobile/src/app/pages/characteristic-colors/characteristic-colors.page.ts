import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  NgZone,
  OnDestroy,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { SegmentChangeEventDetail } from '@ionic/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { register } from 'swiper/element/bundle';
import { colorCards } from '@rainbow/shared';
import { AppMenuService } from '../../core/services/app-menu.service';
import { DeviceMediaService } from '../../core/services/device-media.service';
import { FolderService } from '../../core/services/folder.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from '../../shared/components/choice-sheet.component';
import {
  createDefaultEditorView,
  EditorCanvasComponent,
  EditorViewState,
} from '../../shared/components/editor-canvas.component';
import {
  GallerySaveSheetComponent,
  GallerySaveSheetData,
  GallerySaveSheetResult,
} from '../../shared/components/gallery-save-sheet.component';
import {
  MaskCameraModalComponent,
  MaskCameraResult,
  MaskCameraSheetData,
} from '../../shared/components/mask-camera-modal.component';

register();

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    EditorCanvasComponent,
    IonButton,
    IonChip,
    IonIcon,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-characteristic-colors',
  templateUrl: './characteristic-colors.page.html',
  styleUrls: ['./characteristic-colors.page.scss'],
})
export class CharacteristicColorsPage implements OnDestroy {
  @ViewChild('maskEditor') maskEditor?: EditorCanvasComponent;

  readonly cards = colorCards;
  tab: 'mask' | 'collage' = 'mask';
  selectedId = colorCards[0]?.id ?? 1;
  imageUrl: string | null = null;
  readonly frameThickness = 16;
  shareWithCollage = true;
  collageImageUrl: string | null = null;
  busy = false;
  isLoading: WritableSignal<boolean> = signal(false);
  /** Shared zoom/pan/rotate from mask → collage. */
  editorView: EditorViewState = createDefaultEditorView();

  constructor(
    private readonly translate: TranslateService,
    private readonly foldersApi: FolderService,
    private readonly appMenu: AppMenuService,
    private readonly deviceMedia: DeviceMediaService,
    private readonly sheets: OverlaySheetService,
    private readonly toasts: ToastService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.sheets.close();
  }

  get segments() {
    return this.cards.find((c) => c.id === this.selectedId)?.segments ?? [];
  }

  get activeImage(): string | null {
    if (this.tab === 'collage') {
      return this.collageImageUrl ?? this.imageUrl;
    }
    return this.imageUrl ?? this.collageImageUrl;
  }

  get hasPhoto(): boolean {
    return !!(this.imageUrl || this.collageImageUrl);
  }

  get canSave(): boolean {
    return this.hasPhoto && !this.busy;
  }

  openMenu(): void {
    this.appMenu.open();
  }

  select(id: number): void {
    this.selectedId = id;
  }

  onEditorViewChange(state: EditorViewState): void {
    this.editorView = state;
    this.cdr.detectChanges();
  }

  setTab(tab: 'mask' | 'collage'): void {
    this.tab = tab;
  }

  onTabChange(ev: CustomEvent<SegmentChangeEventDetail>): void {
    const value = ev.detail.value;
    if (value === 'mask' || value === 'collage') {
      this.setTab(value);
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

  async openSaveTarget(): Promise<void> {
    if (!this.ensureImage()) {
      return;
    }
    const target = await this.sheets.open<
      ChoiceSheetComponent<'app' | 'device'>,
      ChoiceSheetData<'app' | 'device'>,
      'app' | 'device'
    >(ChoiceSheetComponent, {
      titleKey: 'saveResult',
      options: [
        { value: 'app', labelKey: 'saveToAppGallery', icon: '☁️' },
        { value: 'device', labelKey: 'saveToDevice', icon: '💾' },
      ],
    });
    if (target === 'app') {
      await this.saveToGallery();
    } else if (target === 'device') {
      await this.saveToDevice();
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
        this.setImage(url);
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
        // continue — in-app camera may still prompt
      }
    }

    const result = await this.sheets.open<
      MaskCameraModalComponent,
      MaskCameraSheetData,
      MaskCameraResult
    >(
      MaskCameraModalComponent,
      {
        cards: this.cards,
        selectedId: this.selectedId,
        frameThickness: this.frameThickness,
      },
      { fullscreen: true, closeOnBackdrop: false }
    );

    if (!result) {
      return;
    }

    this.ngZone.run(() => {
      if (typeof result.selectedId === 'number') {
        this.selectedId = result.selectedId;
      }
      this.setImage(result.dataUrl);
      this.cdr.detectChanges();
    });
  }

  async saveToDevice(): Promise<void> {
    if (!this.ensureImage() || this.busy) {
      return;
    }
    this.setBusy(true);
    this.isLoading.set(true);
    try {
      const canvas = await this.exportActiveCanvas();
      if (!canvas) {
        throw new Error('export failed');
      }
      await this.deviceMedia.saveCanvas(canvas, `rainbow-${Date.now()}`);
      await this.toast(this.translate.instant('successImage'), 'success');
    } catch (err) {
      console.error(err);
      await this.toast(this.translate.instant('saveError'), 'danger');
    } finally {
      this.setBusy(false);
      this.isLoading.set(false);
    }
  }

  async saveToGallery(): Promise<void> {
    if (!this.ensureImage() || this.busy) {
      return;
    }
    this.setBusy(true);
    this.isLoading.set(true);
    try {
      const canvas = await this.exportActiveCanvas();
      if (!canvas) {
        throw new Error('export failed');
      }
      const folders = await this.foldersApi.listMine();
      const card = this.cards.find((c) => c.id === this.selectedId);
      this.setBusy(false);
      this.isLoading.set(false);
      await this.sheets.open<
        GallerySaveSheetComponent,
        GallerySaveSheetData,
        GallerySaveSheetResult
      >(GallerySaveSheetComponent, {
        canvas,
        previewUrl: canvas.toDataURL('image/png'),
        folders,
        maskType: card?.type ?? String(this.selectedId),
        coloristicType: this.tab,
      });
    } catch (err) {
      console.error(err);
      await this.toast(this.translate.instant('saveError'), 'danger');
    } finally {
      this.setBusy(false);
      this.isLoading.set(false);
    }
  }

  private async exportActiveCanvas(): Promise<HTMLCanvasElement | null> {
    if (this.tab === 'mask') {
      await this.maskEditor?.refresh();
      const src = this.maskEditor?.getCanvas();
      if (!src) {
        return null;
      }
      // clone — editor canvas may be reused/cleared
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
    return this.renderCollageCanvas();
  }

  private setImage(url: string): void {
    this.imageUrl = url;
    this.collageImageUrl = url;
    this.editorView = createDefaultEditorView();
    this.cdr.detectChanges();
  }

  private setBusy(value: boolean): void {
    this.busy = value;
    this.cdr.detectChanges();
  }

  private ensureImage(): boolean {
    if (this.imageUrl || this.collageImageUrl) {
      return true;
    }
    void this.toast(this.translate.instant('uploadImage'), 'warning');
    return false;
  }

  private async renderCollageCanvas(): Promise<HTMLCanvasElement | null> {
    const src = this.activeImage;
    if (!src) {
      return null;
    }
    const img = await this.loadImage(src);
    const cell = 480;
    const cols = 2;
    const rows = Math.ceil(this.cards.length / cols);
    const canvas = document.createElement('canvas');
    canvas.width = cols * cell;
    canvas.height = rows * cell;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.cards.forEach((card, index) => {
      const x = (index % cols) * cell;
      const y = Math.floor(index / cols) * cell;
      this.drawMaskedCell(ctx, img, x, y, cell, card.segments);
    });
    return canvas;
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

  private drawMaskedCell(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    size: number,
    segments: { color: string }[]
  ): void {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const radius = size / 2;
    const thickness = Math.max(4, (this.frameThickness / 100) * size);
    const innerDiameter = Math.max(8, size - thickness * 2);
    const view = this.editorView;
    const offsetScale = size / (view.baseSize || size || 1);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerDiameter / 2, 0, Math.PI * 2);
    ctx.clip();

    const coverScale = Math.max(innerDiameter / img.width, innerDiameter / img.height) * view.zoom;
    const dw = img.width * coverScale;
    const dh = img.height * coverScale;
    ctx.translate(cx + view.offsetX * offsetScale, cy + view.offsetY * offsetScale);
    ctx.rotate((view.rotation * Math.PI) / 180);
    ctx.scale(view.flipX, 1);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    const step = (Math.PI * 2) / Math.max(segments.length, 1);
    const startOffset = -Math.PI / 2;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'butt';
    segments.forEach((seg, i) => {
      ctx.beginPath();
      ctx.strokeStyle = seg.color;
      ctx.arc(cx, cy, radius - thickness / 2, i * step + startOffset, (i + 1) * step + startOffset);
      ctx.stroke();
    });
  }

  private isUserCancel(err: unknown): boolean {
    const message = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
    return message.includes('cancel') || message.includes('user denied');
  }

  private async toast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    await this.toasts.show(message, color);
  }
}
