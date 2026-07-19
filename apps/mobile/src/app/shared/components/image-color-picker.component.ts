import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

const LOUPE_CSS = 96;
const LOUPE_ZOOM = 2.75;
const CHIP_H = 32;
const STACK_GAP = 6;
const FINGER_GAP = 56;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

interface ActivePointer {
  id: number;
  x: number;
  y: number;
}

/** Normalized pick point in natural image space (0..1). */
export interface ColorPickEvent {
  hex: string;
  nx: number;
  ny: number;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule],
  selector: 'app-image-color-picker',
  template: `
    <div class="picker-wrap">
      <div class="picker-stage">
        <canvas
          #canvas
          class="picker-canvas"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
          (wheel)="onWheel($event)"
        ></canvas>

        <div
          class="loupe-stack"
          [class.is-visible]="loupeVisible"
          [style.transform]="loupeTransform"
        >
          <div class="pick-chip">
            <span class="pick-chip__swatch" [style.background]="previewHex"></span>
            <span class="pick-chip__hex">{{ previewHex }}</span>
          </div>
          <canvas #loupe class="loupe" width="96" height="96"></canvas>
        </div>
      </div>

      @if (image) {
        <p class="picker-hint">{{ 'pickerGestureHint' | translate }}</p>
        <div class="picker-toolbar">
          <ion-button size="small" fill="outline" (click)="zoomMinus()">
            <ion-icon slot="icon-only" name="remove"></ion-icon>
          </ion-button>
          <ion-button size="small" fill="outline" (click)="zoomPlus()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
          <ion-button size="small" fill="outline" (click)="resetView()">
            <ion-icon slot="icon-only" name="scan-outline"></ion-icon>
          </ion-button>
        </div>
      }

      @if (showReplace) {
        <div class="picker-actions">
          <ion-button size="small" fill="outline" (click)="fileInput.click()">
            {{ 'replacePhoto' | translate }}
          </ion-button>
          <input #fileInput type="file" accept="image/*" hidden (change)="onFile($event)" />
        </div>
      }
    </div>
  `,
  styles: [
    `
      .picker-wrap {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        width: 100%;
      }
      .picker-stage {
        position: relative;
        width: 100%;
        max-width: 360px;
        margin: 0 auto;
      }
      .picker-canvas {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        height: auto;
        border-radius: 16px;
        touch-action: none;
        background: #111;
        box-shadow: 0 8px 24px rgba(65, 88, 208, 0.25);
      }
      .loupe-stack {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 4;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: ${STACK_GAP}px;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        will-change: transform;
      }
      .loupe-stack.is-visible {
        opacity: 1;
        visibility: visible;
      }
      .pick-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        height: ${CHIP_H}px;
        padding: 0 10px 0 6px;
        border-radius: 999px;
        background: rgba(20, 22, 30, 0.92);
        color: #fff;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.18);
      }
      .pick-chip__swatch {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid #fff;
        flex: 0 0 auto;
      }
      .pick-chip__hex {
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        font-variant-numeric: tabular-nums;
      }
      .loupe {
        width: ${LOUPE_CSS}px;
        height: ${LOUPE_CSS}px;
        border-radius: 50%;
        border: 3px solid #fff;
        box-shadow:
          0 0 0 1px rgba(0, 0, 0, 0.35),
          0 10px 24px rgba(0, 0, 0, 0.4);
        background: #111;
        image-rendering: pixelated;
      }
      .picker-hint {
        margin: 0;
        text-align: center;
        font-size: 0.75rem;
        color: var(--rm-muted, #8b90a5);
        line-height: 1.3;
      }
      .picker-toolbar {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
      .picker-actions {
        display: flex;
        justify-content: center;
      }
    `,
  ],
})
export class ImageColorPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('loupe') loupeRef?: ElementRef<HTMLCanvasElement>;
  @Input() image: HTMLImageElement | null = null;
  @Input() showReplace = true;
  @Output() selectedHex = new EventEmitter<string>();
  @Output() colorPicked = new EventEmitter<ColorPickEvent>();
  @Output() fileSelected = new EventEmitter<File>();

  loupeVisible = false;
  previewHex = '#000000';
  loupeTransform = 'translate(-9999px, -9999px)';

  private objectUrl: string | null = null;
  private samplePx = 0;
  private samplePy = 0;
  private pinNx: number | null = null;
  private pinNy: number | null = null;
  private resizeObs?: ResizeObserver;

  private zoom = 1;
  private offsetX = 0;
  private offsetY = 0;
  private cssSize = 360;

  private readonly pointers = new Map<number, ActivePointer>();
  private gestureMode: 'none' | 'pick' | 'pinch' = 'none';
  private pinchStartDist = 0;
  private pinchStartZoom = 1;
  private pinchStartMidX = 0;
  private pinchStartMidY = 0;
  private pinchStartOffsetX = 0;
  private pinchStartOffsetY = 0;

  ngAfterViewInit(): void {
    this.resizeObs = new ResizeObserver(() => this.draw());
    this.resizeObs.observe(this.canvasRef.nativeElement);
    this.draw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['image'] && this.image) {
      this.pinNx = null;
      this.pinNy = null;
      this.resetView(false);
      this.loupeVisible = false;
      setTimeout(() => this.draw(), 0);
    }
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.draw();
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
  }

  zoomPlus(): void {
    this.zoom = Math.min(MAX_ZOOM, this.zoom * 1.15);
    this.draw();
  }

  zoomMinus(): void {
    this.zoom = Math.max(MIN_ZOOM, this.zoom / 1.15);
    if (this.zoom <= MIN_ZOOM + 0.001) {
      this.zoom = MIN_ZOOM;
      this.offsetX = 0;
      this.offsetY = 0;
    }
    this.draw();
  }

  resetView(redraw = true): void {
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.loupeVisible = false;
    this.gestureMode = 'none';
    this.pointers.clear();
    if (redraw) {
      this.draw();
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.image) {
      return;
    }
    event.preventDefault();
    this.pointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY });
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);

    if (this.pointers.size >= 2) {
      this.loupeVisible = false;
      this.beginPinch();
      return;
    }

    this.gestureMode = 'pick';
    this.loupeVisible = true;
    this.pick(event);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) {
      return;
    }
    event.preventDefault();
    this.pointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY });

    if (this.gestureMode === 'pinch' && this.pointers.size >= 2) {
      this.applyPinch();
      return;
    }

    if (this.gestureMode === 'pick' && this.pointers.size === 1) {
      this.pick(event);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) {
      return;
    }
    this.pointers.delete(event.pointerId);
    try {
      (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    } catch {
      // ignore
    }

    if (this.pointers.size >= 2) {
      this.beginPinch();
      return;
    }

    if (this.pointers.size === 1) {
      // After pinch, remaining finger does not resume pick until next down.
      this.gestureMode = 'none';
      this.loupeVisible = false;
      return;
    }

    this.gestureMode = 'none';
    this.loupeVisible = false;
    this.draw();
  }

  onWheel(event: WheelEvent): void {
    if (!this.image) {
      return;
    }
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom * factor));
    if (this.zoom <= MIN_ZOOM + 0.001) {
      this.zoom = MIN_ZOOM;
      this.offsetX = 0;
      this.offsetY = 0;
    }
    this.draw();
  }

  private beginPinch(): void {
    const pts = [...this.pointers.values()].slice(0, 2);
    if (pts.length < 2) {
      return;
    }
    this.gestureMode = 'pinch';
    this.loupeVisible = false;
    this.pinchStartDist = this.distance(pts[0], pts[1]);
    this.pinchStartZoom = this.zoom;
    const mid = this.midpoint(pts[0], pts[1]);
    this.pinchStartMidX = mid.x;
    this.pinchStartMidY = mid.y;
    this.pinchStartOffsetX = this.offsetX;
    this.pinchStartOffsetY = this.offsetY;
  }

  private applyPinch(): void {
    const pts = [...this.pointers.values()].slice(0, 2);
    if (pts.length < 2 || this.pinchStartDist <= 0) {
      return;
    }

    const dist = this.distance(pts[0], pts[1]);
    const mid = this.midpoint(pts[0], pts[1]);
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const scale = this.cssSize / Math.max(1, rect.width);

    this.zoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, this.pinchStartZoom * (dist / this.pinchStartDist)),
    );
    this.offsetX = this.pinchStartOffsetX + (mid.x - this.pinchStartMidX) * scale;
    this.offsetY = this.pinchStartOffsetY + (mid.y - this.pinchStartMidY) * scale;

    if (this.zoom <= MIN_ZOOM + 0.001) {
      this.zoom = MIN_ZOOM;
    }

    this.draw();
  }

  private pick(event: PointerEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || !this.image) {
      return;
    }

    const xCss = event.clientX - rect.left;
    const yCss = event.clientY - rect.top;
    if (xCss < 0 || yCss < 0 || xCss > rect.width || yCss > rect.height) {
      return;
    }

    this.cssSize = Math.max(1, Math.round(canvas.clientWidth || rect.width));
    const drawX = xCss * (this.cssSize / Math.max(1, rect.width));
    const drawY = yCss * (this.cssSize / Math.max(1, rect.height));
    const mapped = this.mapDrawToImage(drawX, drawY);
    if (!mapped) {
      return;
    }

    // Sample without pin so marker ink does not tint the color.
    this.draw(false);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = Math.min(canvas.width - 1, Math.max(0, Math.floor(xCss * scaleX)));
    const py = Math.min(canvas.height - 1, Math.max(0, Math.floor(yCss * scaleY)));
    this.samplePx = px;
    this.samplePy = py;

    const pixel = ctx.getImageData(px, py, 1, 1).data;
    this.previewHex = this.rgbToHex(pixel[0], pixel[1], pixel[2]);
    this.pinNx = mapped.nx;
    this.pinNy = mapped.ny;
    this.draw(true);
    this.updateLoupePosition(xCss, yCss, rect.width, rect.height);
    this.renderLoupe();
    this.selectedHex.emit(this.previewHex);
    this.colorPicked.emit({ hex: this.previewHex, nx: mapped.nx, ny: mapped.ny });
  }

  private mapDrawToImage(drawX: number, drawY: number): { nx: number; ny: number } | null {
    const img = this.image;
    if (!img?.naturalWidth || !img.naturalHeight) {
      return null;
    }
    const cssSize = this.cssSize;
    const baseScale = Math.min(cssSize / img.naturalWidth, cssSize / img.naturalHeight);
    const w = img.naturalWidth * baseScale;
    const h = img.naturalHeight * baseScale;
    if (w <= 0 || h <= 0) {
      return null;
    }
    const zx = (drawX - cssSize / 2 - this.offsetX) / this.zoom;
    const zy = (drawY - cssSize / 2 - this.offsetY) / this.zoom;
    const nx = (zx + w / 2) / w;
    const ny = (zy + h / 2) / h;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) {
      return null;
    }
    return { nx, ny };
  }

  private updateLoupePosition(xCss: number, yCss: number, stageW: number, stageH: number): void {
    const stackW = Math.max(LOUPE_CSS, 120);
    const stackH = CHIP_H + STACK_GAP + LOUPE_CSS;

    let left = xCss - stackW / 2;
    let top = yCss - FINGER_GAP - stackH;

    if (top < 4) {
      top = yCss + 28;
    }

    left = Math.min(Math.max(4, left), Math.max(4, stageW - stackW - 4));
    top = Math.min(Math.max(4, top), Math.max(4, stageH - stackH - 4));

    this.loupeTransform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }

  private renderLoupe(): void {
    const source = this.canvasRef.nativeElement;
    const loupe = this.loupeRef?.nativeElement;
    if (!loupe || !source.width || !source.height) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const phys = Math.round(LOUPE_CSS * dpr);
    if (loupe.width !== phys || loupe.height !== phys) {
      loupe.width = phys;
      loupe.height = phys;
    }

    const ctx = loupe.getContext('2d');
    if (!ctx) {
      return;
    }

    const srcSize = Math.max(8, phys / LOUPE_ZOOM);
    let sx = this.samplePx - srcSize / 2;
    let sy = this.samplePy - srcSize / 2;
    sx = Math.min(Math.max(0, sx), source.width - srcSize);
    sy = Math.min(Math.max(0, sy), source.height - srcSize);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, phys, phys);
    ctx.drawImage(source, sx, sy, srcSize, srcSize, 0, 0, phys, phys);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const mid = phys / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = Math.max(1, dpr);
    ctx.beginPath();
    ctx.moveTo(mid, 0);
    ctx.lineTo(mid, phys);
    ctx.moveTo(0, mid);
    ctx.lineTo(phys, mid);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(mid, mid, 5 * dpr, 0, Math.PI * 2);
    ctx.stroke();
  }

  private draw(withPin = true): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !this.image) {
      return;
    }

    const cssSize = Math.max(
      1,
      Math.round(canvas.clientWidth || canvas.getBoundingClientRect().width || 360),
    );
    this.cssSize = cssSize;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const phys = Math.round(cssSize * dpr);

    if (canvas.width !== phys || canvas.height !== phys) {
      canvas.width = phys;
      canvas.height = phys;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssSize, cssSize);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, cssSize, cssSize);

    const img = this.image;
    const baseScale = Math.min(cssSize / img.naturalWidth, cssSize / img.naturalHeight);
    const w = img.naturalWidth * baseScale;
    const h = img.naturalHeight * baseScale;

    ctx.save();
    ctx.translate(cssSize / 2 + this.offsetX, cssSize / 2 + this.offsetY);
    ctx.scale(this.zoom, this.zoom);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);

    if (withPin && this.pinNx != null && this.pinNy != null) {
      const px = -w / 2 + this.pinNx * w;
      const py = -h / 2 + this.pinNy * h;
      const inv = 1 / Math.max(0.001, this.zoom);
      ctx.beginPath();
      ctx.arc(px, py, 13 * inv, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2.5 * inv;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 4.5 * inv, 0, Math.PI * 2);
      ctx.fillStyle = this.previewHex || '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5 * inv;
      ctx.stroke();
      // Pin stem
      ctx.beginPath();
      ctx.moveTo(px, py + 4.5 * inv);
      ctx.lineTo(px, py + 16 * inv);
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2 * inv;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, py + 16 * inv);
      ctx.lineTo(px - 5 * inv, py + 22 * inv);
      ctx.lineTo(px + 5 * inv, py + 22 * inv);
      ctx.closePath();
      ctx.fillStyle = this.previewHex || '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2 * inv;
      ctx.stroke();
    }
    ctx.restore();
  }

  private distance(a: ActivePointer, b: ActivePointer): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  private midpoint(a: ActivePointer, b: ActivePointer): { x: number; y: number } {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((v) => {
          const s = v.toString(16);
          return s.length === 1 ? '0' + s : s;
        })
        .join('')
    ).toUpperCase();
  }
}
