import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import chroma from 'chroma-js';
import { AppMenuService } from '../../core/services/app-menu.service';
import { FolderService, GalleryFolder } from '../../core/services/folder.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from '../../shared/components/choice-sheet.component';
import { ColorAnalyzerComponent } from '../../shared/components/color-analyzer.component';
import {
  ColorReportSheetComponent,
  ColorReportSheetData,
  ColorReportSheetResult,
} from '../../shared/components/color-report-sheet.component';
import {
  ColorPickEvent,
  ImageColorPickerComponent,
} from '../../shared/components/image-color-picker.component';
import {
  MaskCameraModalComponent,
  MaskCameraResult,
  MaskCameraSheetData,
} from '../../shared/components/mask-camera-modal.component';

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    ImageColorPickerComponent,
    ColorAnalyzerComponent,
    IonButton,
    IonIcon,
  ],
  selector: 'app-chroma',
  templateUrl: './chroma.page.html',
  styleUrls: ['./chroma.page.scss'],
})
export class ChromaPage implements OnDestroy {
  image: HTMLImageElement | null = null;
  hex = '#D4F880';
  hue = 70;
  sat = 0.7;
  val = 0.75;
  lastPick: { nx: number; ny: number } | null = null;
  private folders: GalleryFolder[] = [];

  constructor(
    private readonly translate: TranslateService,
    private readonly appMenu: AppMenuService,
    private readonly sheets: OverlaySheetService,
    private readonly foldersApi: FolderService,
    private readonly toasts: ToastService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get canOpenReport(): boolean {
    return !!this.image && !!this.lastPick && chroma.valid(this.hex);
  }

  ngOnDestroy(): void {
    this.sheets.close();
  }

  openMenu(): void {
    this.appMenu.open();
  }

  onHex(hex: string): void {
    this.hex = hex;
    if (!chroma.valid(hex)) {
      return;
    }
    const [h, s, l] = chroma(hex).hsl();
    this.hue = h || 0;
    this.sat = s;
    this.val = l;
  }

  onColorPicked(event: ColorPickEvent): void {
    this.hex = event.hex;
    this.lastPick = { nx: event.nx, ny: event.ny };
    this.onHex(event.hex);
  }

  async openColorReport(): Promise<void> {
    if (!this.image || !this.lastPick || !chroma.valid(this.hex)) {
      return;
    }
    try {
      this.folders = await this.foldersApi.listMine();
    } catch {
      this.folders = [];
    }
    await this.sheets.open<
      ColorReportSheetComponent,
      ColorReportSheetData,
      ColorReportSheetResult
    >(
      ColorReportSheetComponent,
      {
        image: this.image,
        hex: this.hex,
        nx: this.lastPick.nx,
        ny: this.lastPick.ny,
        folders: this.folders,
      },
      {
        fullscreen: true,
        closeOnBackdrop: false,
        hasBackdrop: true,
        backdropClass: 'rm-cdk-backdrop',
      },
    );
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

  private async setImageFromUrl(url: string): Promise<void> {
    const img = await this.loadImage(url);
    this.image = img;
    this.lastPick = null;
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

  private isUserCancel(err: unknown): boolean {
    const message = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
    return message.includes('cancel') || message.includes('user denied');
  }

  private async toast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    await this.toasts.show(message, color);
  }
}
