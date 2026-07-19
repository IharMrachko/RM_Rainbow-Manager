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
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import chroma from 'chroma-js';
import { GalleryFolder } from '../../core/services/folder.service';
import { GalleryService } from '../../core/services/gallery.service';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
  OverlaySheetService,
} from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  FolderPickerSheetComponent,
  FolderPickerSheetData,
  FolderPickerSheetResult,
} from './folder-picker-sheet.component';

export interface ColorReportSheetData {
  image: HTMLImageElement;
  hex: string;
  nx: number;
  ny: number;
  folders: GalleryFolder[];
}

export interface ColorReportSheetResult {
  saved: boolean;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  selector: 'app-color-report-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-creport" role="dialog" aria-modal="true">
      <header class="rm-creport__bar">
        <button type="button" class="rm-creport__icon-btn" (click)="dismiss()" aria-label="close">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </button>
        <div class="rm-creport__title">{{ 'colorReport' | translate }}</div>
        <span class="rm-creport__spacer"></span>
      </header>

      <div #container class="rm-creport__stage">
        <canvas #canvas class="rm-creport__canvas"></canvas>
      </div>

      <footer class="rm-creport__footer" [class.is-collapsed]="!footerOpen">
        <button
          type="button"
          class="rm-creport__footer-toggle"
          (click)="toggleFooter()"
          [attr.aria-expanded]="footerOpen"
        >
          <div class="rm-creport__badges">
            @if (folderId) {
              <span class="rm-creport__badge">{{ folderName }}</span>
            }
            <span class="rm-creport__badge">{{ hex }}</span>
          </div>
          <ion-icon
            class="rm-creport__chevron"
            [class.is-open]="footerOpen"
            name="chevron-down-outline"
          ></ion-icon>
        </button>

        @if (footerOpen) {
          <div class="rm-creport__footer-body">
            <button type="button" class="rm-creport__field" (click)="openFolderPicker()">
              <span class="rm-creport__label">{{ 'folder' | translate }}</span>
              <span class="rm-creport__folder-value">
                <span>{{ folderName || ('all' | translate) }}</span>
                <ion-icon name="folder-outline"></ion-icon>
              </span>
            </button>

            <label class="rm-creport__field rm-creport__field--input">
              <span class="rm-creport__label">{{ 'noName' | translate }}</span>
              <input
                class="rm-creport__input"
                type="text"
                [(ngModel)]="title"
                [placeholder]="'noName' | translate"
              />
            </label>

            <ion-button
              expand="block"
              color="warning"
              class="rm-creport__save"
              [disabled]="saving"
              (click)="save()"
            >
              @if (saving) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                {{ 'saveToGallery' | translate }}
              }
            </ion-button>
          </div>
        }
      </footer>
    </div>
  `,
  styles: [
    `
      .rm-creport {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: var(--rm-surface, #eef0f7);
        color: var(--rm-ink, #16182a);
      }

      .rm-creport__bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px;
        background: var(--rm-elevated, #fff);
        border-bottom: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }

      .rm-creport__title {
        flex: 1;
        font-weight: 650;
        font-size: 17px;
      }

      .rm-creport__icon-btn {
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

      .rm-creport__spacer {
        width: 40px;
      }

      .rm-creport__stage {
        position: relative;
        flex: 1;
        min-height: 220px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 12px;
        overflow: auto;
      }

      .rm-creport__canvas {
        max-width: 100%;
        height: auto;
        border-radius: 12px;
        box-shadow: 0 10px 28px rgba(22, 24, 42, 0.12);
        background: #fff;
      }

      .rm-creport__footer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px 14px calc(14px + env(safe-area-inset-bottom, 0px));
        background: var(--rm-elevated, #fff);
        border-top: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }

      .rm-creport__footer-toggle {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        margin: 0;
        padding: 2px 0;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: left;
      }

      .rm-creport__chevron {
        flex-shrink: 0;
        font-size: 1.25rem;
        color: var(--rm-muted, #8b90a5);
        transition: transform 160ms ease;
      }

      .rm-creport__chevron.is-open {
        transform: rotate(180deg);
      }

      .rm-creport__footer-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .rm-creport__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        flex: 1;
        min-width: 0;
      }

      .rm-creport__badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: #eef0f7;
        color: #5c6178;
        font-size: 0.78rem;
        font-weight: 650;
      }

      .rm-creport__field {
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

      .rm-creport__label {
        font-size: 0.78rem;
        font-weight: 600;
        color: #5c6178;
      }

      .rm-creport__folder-value {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 0.98rem;
        font-weight: 650;
      }

      .rm-creport__folder-value ion-icon {
        font-size: 1.15rem;
        color: #5c6178;
      }

      .rm-creport__input {
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

      .rm-creport__save {
        margin: 0;
        min-height: 48px;
        font-weight: 700;
        --border-radius: 14px;
      }
    `,
  ],
})
export class ColorReportSheetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', { static: true }) private containerRef!: ElementRef<HTMLElement>;

  title = '';
  folderId = '';
  saving = false;
  /** Save form (folder / title / button) — expanded by default. */
  footerOpen = true;
  readonly hex: string;
  private folders: GalleryFolder[];

  private resizeObserver: ResizeObserver | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: ColorReportSheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly sheetRef: OverlaySheetRef<ColorReportSheetResult>,
    private readonly gallery: GalleryService,
    private readonly sheets: OverlaySheetService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.hex = (data.hex || '#000000').toUpperCase();
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

  toggleFooter(): void {
    this.footerOpen = !this.footerOpen;
    this.cdr.detectChanges();
    // Stage height changes — redraw report canvas to fit.
    setTimeout(() => this.scheduleRender(), 40);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.render(), 40);
    this.resizeObserver = new ResizeObserver(() => this.scheduleRender());
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
    if (this.saving) {
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await this.gallery.saveImage({
        canvas: this.canvasRef.nativeElement,
        title: this.title.trim(),
        coloristicType: 'chroma',
        maskType: '',
        paletteType: '',
        folderId: this.folderId || '',
        path: `avatar/chroma-report-${Date.now()}.png`,
      });
      await this.toasts.show(this.translate.instant('successImage'), 'success');
      this.sheetRef.close({ saved: true });
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('saveError'), 'danger');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  private readonly onResize = (): void => this.scheduleRender();

  private scheduleRender(): void {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    this.resizeTimer = setTimeout(() => this.render(), 60);
  }

  private render(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    const img = this.data.image;
    if (!img?.naturalWidth) {
      return;
    }

    const maxW = Math.max(280, Math.min(container.clientWidth - 8, 720));
    const logicalW = Math.round(maxW);
    const pad = 16;
    const gap = 18;
    const contentW = logicalW - pad * 2;
    const photoH = Math.round(contentW * 0.78);
    const panelH = 290;
    const logicalH = pad + photoH + gap + panelH + pad;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
    canvas.style.width = `${logicalW}px`;
    canvas.style.height = `${logicalH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, logicalW, logicalH);
    ctx.strokeStyle = 'rgba(22, 24, 42, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, logicalW - 1, logicalH - 1);

    // Top: photo + pin
    const photoX = pad;
    const photoY = pad;
    const photoR = 14;
    this.roundRect(ctx, photoX, photoY, contentW, photoH, photoR);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(photoX, photoY, contentW, photoH);
    this.drawCoverImage(ctx, img, photoX, photoY, contentW, photoH);
    this.drawPin(ctx, photoX, photoY, contentW, photoH, this.data.nx, this.data.ny, this.hex);
    ctx.restore();

    // Bottom: color info
    this.drawColorPanel(ctx, pad, photoY + photoH + gap, contentW, panelH);
  }

  private drawCoverImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  private drawPin(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    nx: number,
    ny: number,
    hex: string,
  ): void {
    const img = this.data.image;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    const px = dx + nx * dw;
    const py = dy + ny * dh;

    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Teardrop pin tip
    ctx.beginPath();
    ctx.moveTo(px, py + 5);
    ctx.lineTo(px - 7, py + 22);
    ctx.lineTo(px + 7, py + 22);
    ctx.closePath();
    ctx.fillStyle = hex;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private drawColorPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const hex = chroma.valid(this.hex) ? this.hex : '#000000';
    const color = chroma(hex);
    const [hue, s, l] = color.hsl();
    const hh = hue || 0;
    const combos = [
      { label: 'Complement', color: chroma.hsl((hh + 180) % 360, s, l).hex() },
      { label: 'Analog -30', color: chroma.hsl((hh - 30 + 360) % 360, s, l).hex() },
      { label: 'Analog +30', color: chroma.hsl((hh + 30) % 360, s, l).hex() },
      { label: 'Triad 1', color: chroma.hsl((hh + 120) % 360, s, l).hex() },
      { label: 'Triad 2', color: chroma.hsl((hh + 240) % 360, s, l).hex() },
    ];
    const scale = chroma.scale([hex, chroma(hex).darken(2)]).mode('lab').colors(5);

    const mainTitle = this.translate.instant('mainColor');
    const comboTitle = this.translate.instant('combinations');
    const scaleTitle = this.translate.instant('scale');

    let cy = y;
    ctx.fillStyle = '#16182a';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mainTitle, x + w / 2, cy + 14);
    cy += 22;

    const mainH = 64;
    this.roundRect(ctx, x, cy, w, mainH, 12);
    ctx.fillStyle = hex;
    ctx.fill();
    ctx.fillStyle = this.contrastText(hex);
    ctx.font = '800 18px system-ui, sans-serif';
    ctx.fillText(hex.toUpperCase(), x + w / 2, cy + mainH / 2 + 6);
    cy += mainH + 14;

    this.drawDashedLine(ctx, x, cy, w);
    cy += 12;

    ctx.fillStyle = '#16182a';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.fillText(comboTitle, x + w / 2, cy + 12);
    cy += 20;

    const comboGap = 8;
    const comboW = (w - comboGap * (combos.length - 1)) / combos.length;
    const comboH = 52;
    combos.forEach((c, i) => {
      const cx = x + i * (comboW + comboGap);
      this.roundRect(ctx, cx, cy, comboW, comboH, 8);
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.fillStyle = this.contrastText(c.color);
      ctx.font = '700 9px system-ui, sans-serif';
      ctx.fillText(c.color.toUpperCase(), cx + comboW / 2, cy + comboH / 2 + 3);
      ctx.fillStyle = '#5c6178';
      ctx.font = '600 8px system-ui, sans-serif';
      const label = c.label.length > 10 ? c.label.slice(0, 9) + '…' : c.label;
      ctx.fillText(label, cx + comboW / 2, cy + comboH + 12);
    });
    cy += comboH + 24;

    this.drawDashedLine(ctx, x, cy, w);
    cy += 12;

    ctx.fillStyle = '#16182a';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.fillText(scaleTitle, x + w / 2, cy + 12);
    cy += 20;

    const scaleGap = 8;
    const scaleW = (w - scaleGap * (scale.length - 1)) / scale.length;
    const scaleH = 48;
    scale.forEach((c, i) => {
      const sx = x + i * (scaleW + scaleGap);
      this.roundRect(ctx, sx, cy, scaleW, scaleH, 8);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.fillStyle = this.contrastText(c);
      ctx.font = '700 9px system-ui, sans-serif';
      ctx.fillText(c.toUpperCase(), sx + scaleW / 2, cy + scaleH / 2 + 3);
    });
  }

  private drawDashedLine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(22, 24, 42, 0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.restore();
  }

  private contrastText(bg: string): string {
    try {
      return chroma(bg).luminance() > 0.45 ? '#16182a' : '#ffffff';
    } catch {
      return '#ffffff';
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}
