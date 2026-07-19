import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  Optional,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { MaskCard, MaskSegment } from '@rainbow/shared';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

export interface MaskCameraResult {
  dataUrl: string;
  selectedId: number;
}

export interface MaskCameraSheetData {
  cards: MaskCard[];
  selectedId: number;
  frameThickness?: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  selector: 'app-mask-camera-modal',
  template: `
    <div class="cam">
      <div class="cam__bar">
        <button type="button" class="cam__close" (click)="dismiss()">✕</button>
        <strong>{{ 'takePhoto' | translate }}</strong>
        <span class="cam__spacer"></span>
      </div>

      <div class="viewport" #viewport>
        <video #video autoplay playsinline muted [class.is-ready]="ready"></video>
        <canvas #overlay class="overlay" [class.is-ready]="ready"></canvas>
        @if ((loading || !ready) && !errorKey) {
          <div class="viewport__loader" aria-busy="true">
            <ion-spinner name="crescent"></ion-spinner>
          </div>
        }
      </div>

      @if (cards.length) {
        <div class="type-row">
          @for (card of cards; track card.id) {
            <button
              type="button"
              class="type-chip"
              [class.is-active]="card.id === selectedId"
              (click)="selectCard(card)"
            >
              <span class="type-chip__swatches">
                @for (seg of card.segments; track $index) {
                  <span class="type-chip__swatch" [style.background]="seg.color"></span>
                }
              </span>
              <span class="type-chip__label">{{ card.type | translate }}</span>
            </button>
          }
        </div>
      }

      <div class="footer">
        <button type="button" class="flip" (click)="flipCamera()" [disabled]="loading">
          🔄
        </button>

        <button type="button" class="shutter" (click)="capture()" [disabled]="loading || !ready">
          <span class="shutter__inner"></span>
        </button>

        @if (previewDataUrl) {
          <button type="button" class="preview" (click)="confirmPreview()" aria-label="confirm">
            <img [src]="previewDataUrl" alt="" />
          </button>
        } @else {
          <span class="footer__spacer"></span>
        }
      </div>

      @if (errorKey) {
        <div class="error">{{ errorKey | translate }}</div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: #0b0d10;
        color: #fff;
      }
      .cam {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .cam__bar {
        display: grid;
        grid-template-columns: 44px 1fr 44px;
        align-items: center;
        gap: 8px;
        min-height: 52px;
        padding: max(8px, env(safe-area-inset-top, 0px)) 12px 8px;
      }
      .cam__close {
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        font-size: 1.2rem;
      }
      .cam__bar strong {
        text-align: center;
        font-size: 1rem;
      }
      .cam__spacer {
        width: 44px;
      }
      .viewport {
        position: relative;
        flex: 1 1 auto;
        min-height: 240px;
        background: #000;
        overflow: hidden;
      }
      video,
      .overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      video.is-ready,
      .overlay.is-ready {
        opacity: 1;
      }
      .overlay {
        pointer-events: none;
        z-index: 2;
      }
      .viewport__loader {
        position: absolute;
        inset: 0;
        z-index: 3;
        display: grid;
        place-items: center;
        background: #0b0d10;
      }
      .viewport__loader ion-spinner {
        width: 40px;
        height: 40px;
        --color: #fff;
      }
      .type-row {
        display: flex;
        gap: 6px;
        padding: 8px 12px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .type-chip {
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        min-width: 72px;
        max-width: 110px;
        padding: 5px 6px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
      }
      .type-chip.is-active {
        border-color: #7dd3fc;
        background: rgba(125, 211, 252, 0.16);
      }
      .type-chip__swatches {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: center;
        gap: 2px;
        max-width: 100%;
        overflow: hidden;
      }
      .type-chip__swatch {
        flex: 0 0 auto;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        display: block;
      }
      .type-chip__label {
        font-size: 0.62rem;
        line-height: 1.15;
        opacity: 0.9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
      .footer {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 12px;
        padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
      }
      .flip {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        font-size: 1.25rem;
        justify-self: start;
      }
      .footer__spacer {
        width: 52px;
        height: 52px;
        justify-self: end;
      }
      .preview {
        width: 52px;
        height: 52px;
        padding: 0;
        border: 2px solid #fff;
        border-radius: 10px;
        overflow: hidden;
        background: #111;
        justify-self: end;
      }
      .preview img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .shutter {
        width: 74px;
        height: 74px;
        border-radius: 50%;
        border: 3px solid #fff;
        background: transparent;
        display: grid;
        place-items: center;
        padding: 0;
      }
      .shutter__inner {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: #fff;
      }
      .shutter:disabled,
      .flip:disabled {
        opacity: 0.45;
      }
      .error {
        color: #fca5a5;
        text-align: center;
        padding: 0 16px 16px;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class MaskCameraModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('overlay') overlayRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewport') viewportRef?: ElementRef<HTMLElement>;

  cards: MaskCard[] = [];
  selectedId = 0;
  frameThickness = 16;
  previewDataUrl: string | null = null;
  private previewSelectedId = 0;

  loading = true;
  ready = false;
  errorKey: string | null = null;

  private stream: MediaStream | null = null;
  private facing: 'user' | 'environment' = 'user';
  private resizeObs?: ResizeObserver;

  constructor(
    @Optional() @Inject(OVERLAY_SHEET_DATA) data: MaskCameraSheetData | null,
    @Optional()
    @Inject(OVERLAY_SHEET_REF)
    private readonly sheetRef: OverlaySheetRef<MaskCameraResult> | null,
  ) {
    if (data) {
      this.cards = data.cards ?? [];
      this.selectedId = data.selectedId ?? this.cards[0]?.id ?? 0;
      this.frameThickness = data.frameThickness ?? 16;
    }
  }

  get segments(): MaskSegment[] {
    return this.cards.find((c) => c.id === this.selectedId)?.segments ?? [];
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.selectedId && this.cards[0]) {
      this.selectedId = this.cards[0].id;
    }
    this.resizeObs = new ResizeObserver(() => this.drawOverlay());
    if (this.viewportRef?.nativeElement) {
      this.resizeObs.observe(this.viewportRef.nativeElement);
    }
    await this.ensurePermission();
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    this.stopCamera();
  }

  selectCard(card: MaskCard): void {
    this.selectedId = card.id;
    this.drawOverlay();
  }

  async flipCamera(): Promise<void> {
    this.facing = this.facing === 'user' ? 'environment' : 'user';
    await this.startCamera();
  }

  dismiss(): void {
    this.stopCamera();
    this.sheetRef?.close(undefined);
  }

  capture(): void {
    const video = this.videoRef?.nativeElement;
    if (!video?.videoWidth || !video.videoHeight) {
      return;
    }

    const outSize = 960;
    const out = document.createElement('canvas');
    out.width = outSize;
    out.height = outSize;
    const ctx = out.getContext('2d');
    if (!ctx) {
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const videoRatio = vw / vh;
    let sx = 0;
    let sy = 0;
    let sw = vw;
    let sh = vh;
    if (videoRatio > 1) {
      sw = Math.round(vh);
      sx = Math.round((vw - sw) * 0.5);
    } else {
      sh = Math.round(vw);
      sy = Math.round((vh - sh) * 0.5);
    }

    const zoom = 1.35;
    const newSw = Math.max(1, Math.round(sw / zoom));
    const newSh = Math.max(1, Math.round(sh / zoom));
    sx = Math.max(0, Math.min(vw - newSw, Math.round(sx + (sw - newSw) / 2)));
    sy = Math.max(0, Math.min(vh - newSh, Math.round(sy + (sh - newSh) / 2)));

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(video, sx, sy, newSw, newSh, 0, 0, outSize, outSize);

    this.previewDataUrl = out.toDataURL('image/jpeg', 0.92);
    this.previewSelectedId = this.selectedId;
  }

  confirmPreview(): void {
    if (!this.previewDataUrl) {
      return;
    }
    const dataUrl = this.previewDataUrl;
    const selectedId = this.previewSelectedId || this.selectedId;
    this.stopCamera();
    this.sheetRef?.close({ dataUrl, selectedId });
  }

  private async ensurePermission(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      const perm = await Camera.requestPermissions({ permissions: ['camera'] });
      if (perm.camera !== 'granted') {
        this.errorKey = 'cameraError';
      }
    } catch {
      // continue — getUserMedia may still prompt
    }
  }

  private async startCamera(): Promise<void> {
    this.loading = true;
    this.ready = false;
    this.errorKey = null;
    this.stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia unavailable');
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: this.facing,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      };

      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback: any camera
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      const video = this.videoRef?.nativeElement;
      if (!video) {
        return;
      }
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.srcObject = this.stream;
      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) {
          resolve();
          return;
        }
        const onLoaded = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          resolve();
        };
        video.addEventListener('loadedmetadata', onLoaded);
      });
      await video.play();
      this.ready = true;
      // redraw after layout settles
      requestAnimationFrame(() => this.drawOverlay());
    } catch (err) {
      console.error(err);
      this.errorKey = 'cameraError';
    } finally {
      this.loading = false;
    }
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    const video = this.videoRef?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }

  private drawOverlay(): void {
    const canvas = this.overlayRef?.nativeElement;
    const viewport = this.viewportRef?.nativeElement;
    if (!canvas || !viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = rect.height;
    if (!cssW || !cssH) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const physW = Math.round(cssW * dpr);
    const physH = Math.round(cssH * dpr);
    if (canvas.width !== physW || canvas.height !== physH) {
      canvas.width = physW;
      canvas.height = physH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const size = Math.min(cssW, cssH);
    const thickness = size * (this.frameThickness / 100);
    const padding = Math.max(8, size * 0.03);
    const cx = cssW / 2;
    const cy = cssH / 2;
    const radius = Math.max(20, size / 2 - padding - thickness / 2);
    const segments = this.segments;
    if (!segments.length) {
      return;
    }

    const step = (Math.PI * 2) / segments.length;
    const startOffset = -Math.PI / 2;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'butt';
    segments.forEach((seg, i) => {
      ctx.beginPath();
      ctx.strokeStyle = seg.color;
      ctx.arc(cx, cy, radius, i * step + startOffset, (i + 1) * step + startOffset);
      ctx.stroke();
    });
  }
}
