import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonButton,
  IonIcon,
  IonRange,
  IonSpinner,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { AppMenuService } from '../../core/services/app-menu.service';
import { DeviceMediaService } from '../../core/services/device-media.service';
import { FolderService } from '../../core/services/folder.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import {
  PaletteTemplate,
  PaletteTemplateSegment,
} from '../../core/services/palette-template.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from '../../shared/components/choice-sheet.component';
import {
  ColorPickerSheetComponent,
  ColorPickerSheetData,
  ColorPickerSheetResult,
} from '../../shared/components/color-picker-sheet.component';
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
import {
  PaletteTemplateFormSheetComponent,
  PaletteTemplateFormSheetData,
  PaletteTemplateFormSheetResult,
} from '../../shared/components/palette-template-form-sheet.component';
import {
  PaletteTemplatesSheetComponent,
  PaletteTemplatesSheetData,
  PaletteTemplatesSheetResult,
} from '../../shared/components/palette-templates-sheet.component';

const DEFAULT_COLOR = '#EEEEEE';
const MARK_COLOR = '#E3E3E3';

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    FormsModule,
    EditorCanvasComponent,
    IonButton,
    IonIcon,
    IonRange,
    IonSpinner,
  ],
  selector: 'app-my-palette',
  templateUrl: './my-palette.page.html',
  styleUrls: ['./my-palette.page.scss'],
})
export class MyPalettePage implements OnDestroy {
  @ViewChild('maskEditor') maskEditor?: EditorCanvasComponent;

  segmentCount = 6;
  colors: string[] = Array.from({ length: 6 }, () => DEFAULT_COLOR);
  /** Colors shown on canvas (may temporarily mark active). */
  displayColors: string[] = [...this.colors];
  activeIndex = 0;
  imageUrl: string | null = null;
  frameThickness = 16;
  busy = false;
  loading = false;
  selectedTemplate: PaletteTemplate | null = null;
  editorView: EditorViewState = createDefaultEditorView();

  private pickerOpen = false;

  constructor(
    private readonly translate: TranslateService,
    private readonly appMenu: AppMenuService,
    private readonly sheets: OverlaySheetService,
    private readonly foldersApi: FolderService,
    private readonly deviceMedia: DeviceMediaService,
    private readonly toasts: ToastService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get segments(): PaletteTemplateSegment[] {
    return this.displayColors.map((color) => ({ color }));
  }

  get hasPhoto(): boolean {
    return !!this.imageUrl;
  }

  get canSave(): boolean {
    return this.hasPhoto && !this.busy;
  }

  get isTemplateDirty(): boolean {
    if (!this.selectedTemplate) {
      return false;
    }
    const a = this.selectedTemplate.segments.map((s) => s.color.toUpperCase()).join('|');
    const b = this.colors.map((c) => c.toUpperCase()).join('|');
    return a !== b || this.selectedTemplate.segments.length !== this.colors.length;
  }

  ngOnDestroy(): void {
    this.sheets.close();
  }

  openMenu(): void {
    this.appMenu.open();
  }

  onCountChange(value: number | { lower: number; upper: number }): void {
    const count = Math.max(1, Math.min(12, Math.round(typeof value === 'number' ? value : value.lower)));
    this.segmentCount = count;
    if (this.selectedTemplate) {
      this.colors = Array.from({ length: count }, (_, i) => {
        return this.selectedTemplate!.segments[i]?.color ?? DEFAULT_COLOR;
      });
    } else if (this.colors.length < count) {
      while (this.colors.length < count) {
        this.colors.push(DEFAULT_COLOR);
      }
    } else {
      this.colors = this.colors.slice(0, count);
    }
    this.activeIndex = Math.min(this.activeIndex, count - 1);
    this.syncDisplay();
  }

  async onSegmentSelected(index: number): Promise<void> {
    await this.openPickerForIndex(index);
  }

  async onSwatchTap(index: number): Promise<void> {
    await this.openPickerForIndex(index);
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

  async addTemplate(): Promise<void> {
    const result = await this.sheets.open<
      PaletteTemplateFormSheetComponent,
      PaletteTemplateFormSheetData,
      PaletteTemplateFormSheetResult
    >(PaletteTemplateFormSheetComponent, {
      mode: 'create',
      segments: this.colors.map((color) => ({ color })),
    });
    if (result?.saved && result.template) {
      this.selectedTemplate = result.template;
      this.cdr.detectChanges();
    }
  }

  async updateTemplate(): Promise<void> {
    if (!this.selectedTemplate) {
      return;
    }
    const result = await this.sheets.open<
      PaletteTemplateFormSheetComponent,
      PaletteTemplateFormSheetData,
      PaletteTemplateFormSheetResult
    >(PaletteTemplateFormSheetComponent, {
      mode: 'update',
      templateId: this.selectedTemplate.id,
      name: this.selectedTemplate.name,
      segments: this.colors.map((color) => ({ color })),
    });
    if (result?.saved && result.template) {
      this.selectedTemplate = {
        ...this.selectedTemplate,
        name: result.template.name,
        segments: result.template.segments,
      };
      this.cdr.detectChanges();
    }
  }

  async openTemplates(): Promise<void> {
    const result = await this.sheets.open<
      PaletteTemplatesSheetComponent,
      PaletteTemplatesSheetData,
      PaletteTemplatesSheetResult
    >(
      PaletteTemplatesSheetComponent,
      { selectedId: this.selectedTemplate?.id },
      { fullscreen: true, closeOnBackdrop: false, hasBackdrop: true, backdropClass: 'rm-cdk-backdrop' },
    );
    if (result?.applied) {
      this.applyTemplate(result.applied);
    }
  }

  resetTemplate(): void {
    this.selectedTemplate = null;
    this.segmentCount = 1;
    this.colors = [DEFAULT_COLOR];
    this.activeIndex = 0;
    this.syncDisplay();
  }

  onEditorViewChange(state: EditorViewState): void {
    this.editorView = state;
    this.cdr.detectChanges();
  }

  private applyTemplate(template: PaletteTemplate): void {
    this.selectedTemplate = template;
    this.segmentCount = Math.max(1, Math.min(12, template.segments.length || 1));
    this.colors = Array.from({ length: this.segmentCount }, (_, i) => {
      return template.segments[i]?.color ?? DEFAULT_COLOR;
    });
    this.activeIndex = 0;
    this.syncDisplay();
    this.cdr.detectChanges();
  }

  private async openPickerForIndex(index: number): Promise<void> {
    if (this.pickerOpen || index < 0 || index >= this.colors.length) {
      return;
    }
    this.activeIndex = index;
    this.markActive();
    this.pickerOpen = true;
    try {
      const result = await this.sheets.open<
        ColorPickerSheetComponent,
        ColorPickerSheetData,
        ColorPickerSheetResult
      >(ColorPickerSheetComponent, { hex: this.colors[index] }, {
        closeOnBackdrop: true,
        hasBackdrop: true,
        backdropClass: 'rm-cdk-backdrop',
      });
      if (result?.hex) {
        this.colors = this.colors.map((c, i) => (i === index ? result.hex : c));
      }
    } finally {
      this.pickerOpen = false;
      this.syncDisplay();
      this.cdr.detectChanges();
    }
  }

  private markActive(): void {
    this.displayColors = this.colors.map((c, i) => (i === this.activeIndex ? MARK_COLOR : c));
    this.cdr.detectChanges();
  }

  private syncDisplay(): void {
    this.displayColors = [...this.colors];
  }

  private async pickPhoto(): Promise<void> {
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

  private async takePhoto(): Promise<void> {
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
        cards: [
          {
            id: 1,
            type: 'myPalette',
            segments: this.colors.map((color) => ({ color })),
          },
        ],
        selectedId: 1,
        frameThickness: this.frameThickness,
      },
      { fullscreen: true, closeOnBackdrop: false },
    );

    if (!result) {
      return;
    }

    this.ngZone.run(() => {
      this.setImage(result.dataUrl);
      this.cdr.detectChanges();
    });
  }

  private async saveToDevice(): Promise<void> {
    if (!this.ensureImage() || this.busy) {
      return;
    }
    this.setBusy(true);
    try {
      const canvas = await this.exportCanvas();
      if (!canvas) {
        throw new Error('export failed');
      }
      await this.deviceMedia.saveCanvas(canvas, `my-palette-${Date.now()}`);
      await this.toast(this.translate.instant('successImage'), 'success');
    } catch (err) {
      console.error(err);
      await this.toast(this.translate.instant('saveError'), 'danger');
    } finally {
      this.setBusy(false);
    }
  }

  private async saveToGallery(): Promise<void> {
    if (!this.ensureImage() || this.busy) {
      return;
    }
    this.setBusy(true);
    try {
      const canvas = await this.exportCanvas();
      if (!canvas) {
        throw new Error('export failed');
      }
      const folders = await this.foldersApi.listMine();
      this.setBusy(false);
      await this.sheets.open<
        GallerySaveSheetComponent,
        GallerySaveSheetData,
        GallerySaveSheetResult
      >(GallerySaveSheetComponent, {
        canvas,
        previewUrl: canvas.toDataURL('image/png'),
        folders,
        maskType: 'my-palette',
        coloristicType: 'mask',
      });
    } catch (err) {
      console.error(err);
      await this.toast(this.translate.instant('saveError'), 'danger');
    } finally {
      this.setBusy(false);
    }
  }

  private async exportCanvas(): Promise<HTMLCanvasElement | null> {
    this.syncDisplay();
    this.cdr.detectChanges();
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
    this.loading = value;
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
