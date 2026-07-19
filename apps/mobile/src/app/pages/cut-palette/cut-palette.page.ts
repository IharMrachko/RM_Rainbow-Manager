import { ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Palette, palettesObjShort } from '@rainbow/shared';
import { AppMenuService } from '../../core/services/app-menu.service';
import { DeviceMediaService } from '../../core/services/device-media.service';
import { FolderService } from '../../core/services/folder.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from '../../shared/components/choice-sheet.component';
import { CutGridCanvasComponent } from '../../shared/components/cut-grid-canvas.component';
import {
  CutPaletteEditorModel,
  CutPaletteSettingsSheetComponent,
  CutPaletteSettingsSheetData,
} from '../../shared/components/cut-palette-settings-sheet.component';
import {
  GallerySaveSheetComponent,
  GallerySaveSheetData,
  GallerySaveSheetResult,
} from '../../shared/components/gallery-save-sheet.component';
import {
  SheetSelectComponent,
  SheetSelectOption,
} from '../../shared/components/sheet-select.component';

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    FormsModule,
    CutGridCanvasComponent,
    SheetSelectComponent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  selector: 'app-cut-palette',
  templateUrl: './cut-palette.page.html',
  styleUrls: ['./cut-palette.page.scss'],
})
export class CutPalettePage implements OnDestroy {
  @ViewChild(CutGridCanvasComponent) gridCanvas?: CutGridCanvasComponent;

  readonly paletteNames = Object.keys(palettesObjShort) as Palette[];
  step: 1 | 2 = 1;
  selected: Palette = this.paletteNames[0];
  selectedColors: string[] = [];

  readonly editor: CutPaletteEditorModel = {
    shape: 'square',
    columns: 4,
    rows: 4,
    elementSize: 48,
    spacing: 10,
    shadowBlur: 8,
    shadowOffsetY: 4,
    shadowOpacity: 35,
    rotation: 0,
    tab: 'shape',
  };

  busy = false;
  loading = false;
  settingsOpen = false;

  constructor(
    private readonly translate: TranslateService,
    private readonly appMenu: AppMenuService,
    private readonly sheets: OverlaySheetService,
    private readonly foldersApi: FolderService,
    private readonly deviceMedia: DeviceMediaService,
    private readonly toasts: ToastService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get colors(): string[] {
    return palettesObjShort[this.selected] ?? [];
  }

  get paletteOptions(): SheetSelectOption[] {
    return this.paletteNames.map((name) => ({
      value: name,
      label: this.translate.instant(name),
    }));
  }

  get canSave(): boolean {
    return this.step === 2 && this.selectedColors.length > 0 && !this.busy;
  }

  ngOnDestroy(): void {
    this.sheets.close();
  }

  openMenu(): void {
    this.appMenu.open();
  }

  onPaletteChange(value: string): void {
    if (!value || !(this.paletteNames as string[]).includes(value)) {
      return;
    }
    this.selectPalette(value as Palette);
  }

  selectPalette(name: Palette): void {
    this.selected = name;
    this.selectedColors = [];
  }

  toggleColor(color: string): void {
    if (this.selectedColors.includes(color)) {
      this.selectedColors = this.selectedColors.filter((c) => c !== color);
    } else {
      this.selectedColors = [...this.selectedColors, color];
    }
  }

  clear(): void {
    this.selectedColors = [];
  }

  goEdit(): void {
    if (!this.selectedColors.length) {
      return;
    }
    const count = this.selectedColors.length;
    this.editor.columns = Math.min(6, Math.max(2, Math.ceil(Math.sqrt(count))));
    this.editor.rows = Math.ceil(count / this.editor.columns);
    this.editor.tab = 'shape';
    this.step = 2;
  }

  back(): void {
    this.closeSettings();
    this.step = 1;
  }

  async toggleSettings(): Promise<void> {
    if (this.settingsOpen) {
      this.closeSettings();
      return;
    }
    this.settingsOpen = true;
    this.cdr.detectChanges();
    try {
      await this.sheets.open<
        CutPaletteSettingsSheetComponent,
        CutPaletteSettingsSheetData,
        void
      >(CutPaletteSettingsSheetComponent, {
        model: this.editor,
        onChange: () => this.cdr.detectChanges(),
      });
    } finally {
      this.settingsOpen = false;
      this.cdr.detectChanges();
    }
  }

  closeSettings(): void {
    if (!this.settingsOpen) {
      return;
    }
    this.sheets.close();
    this.settingsOpen = false;
  }

  async openSaveTarget(): Promise<void> {
    if (!this.canSave) {
      return;
    }
    this.closeSettings();
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

  private async saveToDevice(): Promise<void> {
    if (this.busy) {
      return;
    }
    this.setBusy(true);
    try {
      const canvas = this.exportCanvas();
      if (!canvas) {
        throw new Error('export failed');
      }
      await this.deviceMedia.saveCanvas(canvas, `cut-palette-${Date.now()}`);
      await this.toasts.show(this.translate.instant('successImage'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('saveError'), 'danger');
    } finally {
      this.setBusy(false);
    }
  }

  private async saveToGallery(): Promise<void> {
    if (this.busy) {
      return;
    }
    this.setBusy(true);
    try {
      const canvas = this.exportCanvas();
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
        maskType: this.selected.replace('Palette', ''),
        coloristicType: 'cut-palette',
        paletteType: this.selected,
      });
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('saveError'), 'danger');
    } finally {
      this.setBusy(false);
    }
  }

  private exportCanvas(): HTMLCanvasElement | null {
    const src = this.gridCanvas?.getCanvas();
    if (!src || !src.width || !src.height) {
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

  private setBusy(value: boolean): void {
    this.busy = value;
    this.loading = value;
    this.cdr.detectChanges();
  }
}
