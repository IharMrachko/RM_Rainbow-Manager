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
import { IonButton, IonChip, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { register } from 'swiper/element/bundle';
import { MaskCard, Palette, palettesObjShort } from '@rainbow/shared';
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
    IonSpinner,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-palette-determinant',
  templateUrl: './palette-determinant.page.html',
  styleUrls: ['./palette-determinant.page.scss'],
})
export class PaletteDeterminantPage implements OnDestroy {
  @ViewChild('maskEditor') maskEditor?: EditorCanvasComponent;

  readonly paletteNames = Object.keys(palettesObjShort) as Palette[];
  selected: Palette = this.paletteNames[0];
  imageUrl: string | null = null;
  readonly frameThickness = 16;
  busy = false;
  isLoading: WritableSignal<boolean> = signal(false);
  editorView: EditorViewState = createDefaultEditorView();

  constructor(
    private readonly translate: TranslateService,
    private readonly foldersApi: FolderService,
    private readonly appMenu: AppMenuService,
    private readonly deviceMedia: DeviceMediaService,
    private readonly sheets: OverlaySheetService,
    private readonly toasts: ToastService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    this.sheets.close();
  }

  get segments() {
    return (palettesObjShort[this.selected] ?? []).map((color) => ({ color }));
  }

  /** Mask cards for in-app camera overlay (same UX as CharacteristicColors). */
  get cameraCards(): MaskCard[] {
    return this.paletteNames.map((name, index) => ({
      id: index + 1,
      type: name,
      segments: (palettesObjShort[name] ?? []).map((color) => ({ color })),
    }));
  }

  get selectedCameraId(): number {
    const index = this.paletteNames.indexOf(this.selected);
    return index >= 0 ? index + 1 : 1;
  }

  get hasPhoto(): boolean {
    return !!this.imageUrl;
  }

  get canSave(): boolean {
    return this.hasPhoto && !this.busy;
  }

  openMenu(): void {
    this.appMenu.open();
  }

  select(name: Palette): void {
    this.selected = name;
  }

  shortName(name: string): string {
    return name.replace('Palette', '');
  }

  onEditorViewChange(state: EditorViewState): void {
    this.editorView = state;
    this.cdr.detectChanges();
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
        cards: this.cameraCards,
        selectedId: this.selectedCameraId,
        frameThickness: this.frameThickness,
      },
      { fullscreen: true, closeOnBackdrop: false },
    );

    if (!result) {
      return;
    }

    this.ngZone.run(() => {
      if (typeof result.selectedId === 'number') {
        const palette = this.paletteNames[result.selectedId - 1];
        if (palette) {
          this.selected = palette;
        }
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
      const canvas = await this.exportCanvas();
      if (!canvas) {
        throw new Error('export failed');
      }
      await this.deviceMedia.saveCanvas(canvas, `palette-${Date.now()}`);
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
      const canvas = await this.exportCanvas();
      if (!canvas) {
        throw new Error('export failed');
      }
      const folders = await this.foldersApi.listMine();
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
        maskType: this.shortName(this.selected),
        coloristicType: 'palette-determinant',
      });
    } catch (err) {
      console.error(err);
      await this.toast(this.translate.instant('saveError'), 'danger');
    } finally {
      this.setBusy(false);
      this.isLoading.set(false);
    }
  }

  private async exportCanvas(): Promise<HTMLCanvasElement | null> {
    await this.maskEditor?.refresh();
    const src = this.maskEditor?.getCanvas();
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

  private setImage(url: string): void {
    this.imageUrl = url;
    this.editorView = createDefaultEditorView();
    this.cdr.detectChanges();
  }

  private setBusy(value: boolean): void {
    this.busy = value;
    this.cdr.detectChanges();
  }

  private ensureImage(): boolean {
    if (this.imageUrl) {
      return true;
    }
    void this.toast(this.translate.instant('uploadImage'), 'warning');
    return false;
  }

  private isUserCancel(err: unknown): boolean {
    const message = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
    return message.includes('cancel') || message.includes('user denied');
  }

  private async toast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    await this.toasts.show(message, color);
  }
}
