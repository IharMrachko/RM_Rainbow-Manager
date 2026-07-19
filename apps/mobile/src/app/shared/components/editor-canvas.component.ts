import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeviceMediaService } from '../../core/services/device-media.service';
import { ToastService } from '../../core/services/toast.service';

type Drawable = HTMLImageElement | ImageBitmap;

interface ActivePointer {
  id: number;
  x: number;
  y: number;
}

/** Shared photo transform between mask editor and collage. */
export interface EditorViewState {
  zoom: number;
  rotation: number;
  flipX: number;
  offsetX: number;
  offsetY: number;
  /** Canvas size the offsets were measured against (for scaling). */
  baseSize: number;
}

export function createDefaultEditorView(baseSize = 360): EditorViewState {
  return {
    zoom: 1,
    rotation: 0,
    flipX: 1,
    offsetX: 0,
    offsetY: 0,
    baseSize,
  };
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule],
  selector: 'app-editor-canvas',
  template: `
    <div class="editor">
      <div class="editor__stage" #stage>
        <canvas
          #canvas
          [class.is-static]="!allowGestures"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
          (wheel)="onWheel($event)"
          (dblclick)="onDoubleClick($event)"
          (click)="onClick($event)"
        ></canvas>
      </div>

      @if (imageUrl && allowGestures) {
        <div class="editor__hint">
          {{ 'gestureHint' | translate }}
        </div>
      }

      @if (showControls && imageUrl) {
        <div class="editor__toolbar">
          <ion-button size="small" fill="outline" (click)="zoomMinus()">
            <ion-icon slot="icon-only" name="remove"></ion-icon>
          </ion-button>
          <ion-button size="small" fill="outline" (click)="zoomPlus()">
            <ion-icon slot="icon-only" name="add"></ion-icon>
          </ion-button>
          <ion-button size="small" fill="outline" (click)="rotate(-15)">
            <ion-icon slot="icon-only" class="icon-rotate-ccw" name="reload-outline"></ion-icon>
          </ion-button>
          <ion-button size="small" fill="outline" (click)="rotate(15)">
            <ion-icon slot="icon-only" name="refresh-outline"></ion-icon>
          </ion-button>
          <ion-button size="small" fill="outline" (click)="flipHorizontal()">
            <ion-icon slot="icon-only" name="swap-horizontal-outline"></ion-icon>
          </ion-button>
          <ion-button size="small" fill="outline" (click)="resetView()">
            <ion-icon slot="icon-only" name="scan-outline"></ion-icon>
          </ion-button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .editor {
        width: 100%;
      }
      .editor__stage {
        position: relative;
        width: 100%;
        max-width: 440px;
        margin: 0 auto;
        aspect-ratio: 1 / 1;
        border-radius: 0;
        overflow: visible;
        background: transparent;
      }
      canvas {
        position: absolute;
        inset: 0;
        width: 100% !important;
        height: 100% !important;
        display: block;
        touch-action: none;
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
      }
      /* Preview-only: let page scroll; do not capture touch. */
      canvas.is-static {
        touch-action: pan-y;
        cursor: default;
        pointer-events: none;
      }
      .editor__hint {
        text-align: center;
        font-size: 0.78rem;
        color: var(--rm-muted, #5c6178);
        margin: 8px 12px 4px;
        line-height: 1.35;
      }
      .editor__toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
        margin: 8px 0 4px;
      }
      .editor__toolbar ion-button {
        margin: 0;
        --padding-start: 8px;
        --padding-end: 8px;
        --color: var(--rm-ink, #16182a);
        --border-color: var(--rm-line, #c5cad6);
        --background: var(--rm-elevated, #fff);
      }
      .editor__toolbar ion-icon {
        font-size: 1.15rem;
      }
      .icon-rotate-ccw {
        transform: scaleX(-1);
      }
    `,
  ],
})
export class EditorCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('stage', { static: true }) stageRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() segments: { color: string }[] = [];
  @Input() imageUrl: string | null = null;
  @Input() frameThicknessPercent = 16;
  @Input() isMarkSegment = false;
  @Input() gapBetweenSegments = 0;
  /** Button toolbar: zoom / rotate / flip / reset. */
  @Input() showControls = true;
  /** Touch: pan, pinch-zoom, two-finger rotate. */
  @Input() allowGestures = true;
  /** Shared transform (mask ↔ collage). */
  @Input() viewState: EditorViewState | null = null;
  /** @deprecated use allowGestures */
  @Input() set allowPan(value: boolean) {
    this.allowGestures = value;
  }

  @Output() selectedSegment = new EventEmitter<number>();
  @Output() viewStateChange = new EventEmitter<EditorViewState>();

  saving = false;
  private suppressViewEmit = false;

  private image: Drawable | null = null;
  private size = 360;
  private zoom = 1;
  private rotation = 0;
  private flipX = 1;
  private offsetX = 0;
  private offsetY = 0;
  private pointers = new Map<number, ActivePointer>();
  private gestureMode: 'none' | 'pan' | 'pinch' = 'none';
  private lastPanX = 0;
  private lastPanY = 0;
  private pinchStartDist = 0;
  private pinchStartAngle = 0;
  private pinchStartZoom = 1;
  private pinchStartRotation = 0;
  private pinchStartMidX = 0;
  private pinchStartMidY = 0;
  private pinchStartOffsetX = 0;
  private pinchStartOffsetY = 0;
  private lastTapAt = 0;
  private ro: ResizeObserver | null = null;

  private readonly minZoom = 1;
  private readonly maxZoom = 5;

  constructor(
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
    private readonly deviceMedia: DeviceMediaService,
  ) {}

  ngAfterViewInit(): void {
    this.ro = new ResizeObserver(() => this.render());
    this.ro.observe(this.stageRef.nativeElement);
    void this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      if (this.viewState) {
        this.applyViewState(this.viewState, false);
      } else {
        this.resetView(false);
      }
      void this.loadImage().then(() => this.render());
      return;
    }
    // Collage (read-only) follows shared state; mask editor is the source of truth.
    if (changes['viewState'] && this.viewState && !this.allowGestures) {
      this.applyViewState(this.viewState, false);
      void this.render();
      return;
    }
    if (changes['segments'] || changes['frameThicknessPercent']) {
      void this.render();
    }
  }

  getViewState(): EditorViewState {
    return {
      zoom: this.zoom,
      rotation: this.rotation,
      flipX: this.flipX,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      baseSize: this.size || 360,
    };
  }

  applyViewState(state: EditorViewState, emit = false): void {
    this.suppressViewEmit = true;
    this.zoom = state.zoom;
    this.rotation = state.rotation;
    this.flipX = state.flipX;
    const base = state.baseSize || this.size || 360;
    const scale = (this.size || base) / base;
    this.offsetX = state.offsetX * scale;
    this.offsetY = state.offsetY * scale;
    this.suppressViewEmit = false;
    if (emit) {
      this.emitViewState();
    }
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
    this.disposeImage();
  }

  zoomPlus(): void {
    this.zoom = Math.min(this.zoom * 1.15, this.maxZoom);
    void this.render();
    this.emitViewState();
  }

  zoomMinus(): void {
    this.zoom = Math.max(this.zoom / 1.15, this.minZoom);
    void this.render();
    this.emitViewState();
  }

  rotate(deg: number): void {
    this.rotation += deg;
    void this.render();
    this.emitViewState();
  }

  flipHorizontal(): void {
    this.flipX *= -1;
    void this.render();
    this.emitViewState();
  }

  resetView(render = true): void {
    this.zoom = 1;
    this.rotation = 0;
    this.flipX = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.pointers.clear();
    this.gestureMode = 'none';
    if (render) {
      void this.render();
    }
    this.emitViewState();
  }

  async download(filename = 'rainbow-mask.png'): Promise<void> {
    if (!this.imageUrl || this.saving) {
      return;
    }
    this.saving = true;
    try {
      await this.render();
      const canvas = this.canvasRef.nativeElement;
      const base = filename.replace(/\.(png|jpe?g)$/i, '') || 'rainbow-mask';
      await this.deviceMedia.saveCanvas(canvas, base);
      void this.showToast(
        this.translate.instant(
          Capacitor.isNativePlatform() ? 'saveGallerySuccess' : 'saveSuccess',
        ),
        'success',
      );
    } catch (err) {
      console.error(err);
      void this.showToast(this.translate.instant('saveError'), 'danger');
    } finally {
      this.saving = false;
    }
  }

  toDataUrl(): string {
    return this.canvasRef.nativeElement.toDataURL('image/png');
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  async refresh(): Promise<void> {
    await this.render();
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.allowGestures || !this.imageUrl) {
      return;
    }
    event.preventDefault();
    this.pointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY });
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);

    if (this.pointers.size === 1) {
      this.gestureMode = 'pan';
      this.lastPanX = event.clientX;
      this.lastPanY = event.clientY;
      this.maybeDoubleTap(event);
    } else if (this.pointers.size >= 2) {
      this.beginPinch();
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.allowGestures || !this.pointers.has(event.pointerId)) {
      return;
    }
    event.preventDefault();
    this.pointers.set(event.pointerId, { id: event.pointerId, x: event.clientX, y: event.clientY });

    if (this.gestureMode === 'pinch' && this.pointers.size >= 2) {
      this.applyPinch();
      return;
    }

    if (this.gestureMode === 'pan' && this.pointers.size === 1) {
      const scale =
        this.size / Math.max(1, this.canvasRef.nativeElement.getBoundingClientRect().width);
      this.offsetX += (event.clientX - this.lastPanX) * scale;
      this.offsetY += (event.clientY - this.lastPanY) * scale;
      this.lastPanX = event.clientX;
      this.lastPanY = event.clientY;
      void this.render();
      this.emitViewState();
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
    } else if (this.pointers.size === 1) {
      const remaining = [...this.pointers.values()][0];
      this.gestureMode = 'pan';
      this.lastPanX = remaining.x;
      this.lastPanY = remaining.y;
    } else {
      this.gestureMode = 'none';
      this.emitViewState();
    }
  }

  onWheel(event: WheelEvent): void {
    if (!this.allowGestures || !this.imageUrl) {
      return;
    }
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
    void this.render();
    this.emitViewState();
  }

  onDoubleClick(event: MouseEvent): void {
    if (!this.allowGestures || !this.imageUrl) {
      return;
    }
    event.preventDefault();
    this.resetView();
  }

  onClick(event: MouseEvent): void {
    if (!this.isMarkSegment || !this.segments.length) {
      return;
    }
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.size;
    const y = ((event.clientY - rect.top) / rect.height) * this.size;
    const cx = this.size / 2;
    const cy = this.size / 2;
    const thickness = (this.size * this.frameThicknessPercent) / 100;
    const dist = Math.hypot(x - cx, y - cy);
    const inner = this.size / 2 - thickness;
    const outer = this.size / 2;
    if (dist < inner || dist > outer) {
      return;
    }
    let angle = Math.atan2(y - cy, x - cx);
    if (angle < 0) {
      angle += Math.PI * 2;
    }
    const startOffset = -Math.PI / 2;
    let relative = angle - startOffset;
    if (relative < 0) {
      relative += Math.PI * 2;
    }
    const idx = Math.floor((relative / (Math.PI * 2)) * this.segments.length) % this.segments.length;
    this.selectedSegment.emit(idx);
  }

  private maybeDoubleTap(event: PointerEvent): void {
    const now = event.timeStamp;
    if (now - this.lastTapAt < 280) {
      this.resetView();
      this.lastTapAt = 0;
      return;
    }
    this.lastTapAt = now;
  }

  private beginPinch(): void {
    const pts = [...this.pointers.values()].slice(0, 2);
    if (pts.length < 2) {
      return;
    }
    this.gestureMode = 'pinch';
    this.pinchStartDist = this.distance(pts[0], pts[1]);
    this.pinchStartAngle = this.angle(pts[0], pts[1]);
    this.pinchStartZoom = this.zoom;
    this.pinchStartRotation = this.rotation;
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
    const ang = this.angle(pts[0], pts[1]);
    const mid = this.midpoint(pts[0], pts[1]);
    const scale =
      this.size / Math.max(1, this.canvasRef.nativeElement.getBoundingClientRect().width);

    this.zoom = Math.min(
      this.maxZoom,
      Math.max(this.minZoom, this.pinchStartZoom * (dist / this.pinchStartDist)),
    );
    this.rotation = this.pinchStartRotation + ((ang - this.pinchStartAngle) * 180) / Math.PI;
    this.offsetX = this.pinchStartOffsetX + (mid.x - this.pinchStartMidX) * scale;
    this.offsetY = this.pinchStartOffsetY + (mid.y - this.pinchStartMidY) * scale;
    void this.render();
    this.emitViewState();
  }

  private emitViewState(): void {
    if (this.suppressViewEmit || (!this.allowGestures && !this.showControls)) {
      return;
    }
    this.viewStateChange.emit(this.getViewState());
  }

  private distance(a: ActivePointer, b: ActivePointer): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  private angle(a: ActivePointer, b: ActivePointer): number {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  private midpoint(a: ActivePointer, b: ActivePointer): { x: number; y: number } {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  private async loadImage(): Promise<void> {
    this.disposeImage();
    if (!this.imageUrl) {
      return;
    }

    try {
      const res = await fetch(this.imageUrl);
      const blob = await res.blob();
      if (typeof createImageBitmap === 'function') {
        try {
          this.image = await createImageBitmap(blob, {
            imageOrientation: 'from-image',
          } as ImageBitmapOptions);
          return;
        } catch {
          // fall through
        }
      }
      const img = new Image();
      img.decoding = 'async';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load error'));
        img.src = URL.createObjectURL(blob);
      });
      this.image = img;
    } catch (err) {
      console.error(err);
      this.image = null;
    }
  }

  private disposeImage(): void {
    if (this.image && 'close' in this.image) {
      try {
        (this.image as ImageBitmap).close();
      } catch {
        // ignore
      }
    }
    this.image = null;
  }

  private async render(): Promise<void> {
    const stage = this.stageRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const cssSize = Math.max(220, Math.round(stage.clientWidth || 320));
    if (this.size > 0 && this.size !== cssSize) {
      const scale = cssSize / this.size;
      this.offsetX *= scale;
      this.offsetY *= scale;
    }
    this.size = cssSize;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssSize * dpr);
    canvas.height = Math.round(cssSize * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Solid fill so Android WebView never shows black through transparent pixels.
    const pageBg =
      getComputedStyle(document.documentElement).getPropertyValue('--rm-surface').trim() ||
      '#eef0f7';
    ctx.fillStyle = pageBg;
    ctx.fillRect(0, 0, cssSize, cssSize);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    this.drawBaseImage(ctx);
    this.drawFrame(ctx);
  }

  private drawBaseImage(ctx: CanvasRenderingContext2D): void {
    const img = this.image;
    const radius = this.size / 2;
    const thickness = (this.size * this.frameThicknessPercent) / 100;
    const innerDiameter = Math.max(8, this.size - thickness * 2);

    if (!img) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(radius, radius, innerDiameter / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const iw = 'naturalWidth' in img ? img.naturalWidth || img.width : img.width;
    const ih = 'naturalHeight' in img ? img.naturalHeight || img.height : img.height;
    if (!iw || !ih) {
      return;
    }

    const coverScale = Math.max(innerDiameter / iw, innerDiameter / ih) * this.zoom;
    const dw = iw * coverScale;
    const dh = ih * coverScale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(radius, radius, innerDiameter / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.translate(radius + this.offsetX, radius + this.offsetY);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.flipX, 1);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  private drawFrame(ctx: CanvasRenderingContext2D): void {
    const segs = this.segments.length ? this.segments : [{ color: '#5b6ef5' }];
    const radius = this.size / 2;
    const thickness = (this.size * this.frameThicknessPercent) / 100;
    const step = (Math.PI * 2) / segs.length;
    const startOffset = -Math.PI / 2;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'butt';
    segs.forEach((seg, i) => {
      ctx.beginPath();
      ctx.strokeStyle = seg.color;
      const start = i * step + startOffset + this.gapBetweenSegments;
      const end = (i + 1) * step + startOffset - this.gapBetweenSegments;
      ctx.arc(radius, radius, radius - thickness / 2, start, end);
      ctx.stroke();
    });
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning',
  ): Promise<void> {
    await this.toasts.show(message, color);
  }
}
