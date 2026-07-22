import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

export interface AiImagePreviewSheetData {
  src: string;
  titleKey?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

addIcons({ closeOutline });

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule],
  selector: 'app-ai-image-preview-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="ai-image-preview" role="dialog" aria-modal="true">
      <header class="ai-image-preview__bar">
        <button type="button" class="ai-image-preview__close" (click)="close()" aria-label="close">
          <ion-icon name="close-outline"></ion-icon>
        </button>
        <span>{{ (data.titleKey || 'aiImagePreview') | translate }}</span>
      </header>
      <div
        class="ai-image-preview__stage"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
        (pointercancel)="onPointerUp($event)"
        (wheel)="onWheel($event)"
        (dblclick)="onDoubleClick($event)"
        (click)="onStageClick($event)"
      >
        <img
          class="ai-image-preview__img"
          [src]="data.src"
          alt=""
          draggable="false"
          [style.transform]="imageTransform"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .ai-image-preview {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        background: #0b0c10;
        color: #f5f6fb;
        user-select: none;
        -webkit-user-select: none;
      }
      .ai-image-preview__bar {
        flex: 0 0 auto;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 52px;
        padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 8px;
        background: rgba(11, 12, 16, 0.92);
      }
      .ai-image-preview__bar span {
        flex: 1;
        min-width: 0;
        font-size: 15px;
        font-weight: 650;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ai-image-preview__close {
        flex: 0 0 auto;
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.08);
        color: inherit;
        font-size: 22px;
      }
      .ai-image-preview__stage {
        position: relative;
        flex: 1;
        min-height: 0;
        display: grid;
        place-items: center;
        overflow: hidden;
        padding: 12px 12px calc(16px + env(safe-area-inset-bottom, 0px));
        touch-action: none;
        cursor: grab;
      }
      .ai-image-preview__stage:active {
        cursor: grabbing;
      }
      .ai-image-preview__img {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 12px;
        background: #15171f;
        transform-origin: center center;
        will-change: transform;
        pointer-events: none;
      }
    `,
  ],
})
export class AiImagePreviewSheetComponent {
  scale = 1;
  offsetX = 0;
  offsetY = 0;

  private readonly pointers = new Map<number, { x: number; y: number }>();
  private mode: 'none' | 'pan' | 'pinch' = 'none';
  private panStartX = 0;
  private panStartY = 0;
  private panOriginX = 0;
  private panOriginY = 0;
  private pinchStartDist = 0;
  private pinchStartScale = 1;
  private pinchStartMidX = 0;
  private pinchStartMidY = 0;
  private pinchStartOffsetX = 0;
  private pinchStartOffsetY = 0;
  private moved = false;
  private suppressClick = false;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: AiImagePreviewSheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly ref: OverlaySheetRef<null>,
  ) {}

  get imageTransform(): string {
    return `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
  }

  close(): void {
    this.ref.close(null);
  }

  onStageClick(event: MouseEvent): void {
    if (this.suppressClick) {
      this.suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Close only when not zoomed and click is on empty stage (not after drag).
    if (this.scale <= MIN_SCALE + 0.01 && !this.moved) {
      this.close();
    }
  }

  onDoubleClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.suppressClick = true;
    if (this.scale > MIN_SCALE + 0.01) {
      this.resetView();
      return;
    }
    this.scale = 2.2;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    this.setScale(this.scale * factor);
  }

  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    this.moved = false;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);

    if (this.pointers.size >= 2) {
      this.beginPinch();
      return;
    }

    this.mode = 'pan';
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.panOriginX = this.offsetX;
    this.panOriginY = this.offsetY;
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    event.preventDefault();
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.mode === 'pinch' && this.pointers.size >= 2) {
      this.applyPinch();
      this.moved = true;
      return;
    }

    if (this.mode === 'pan' && this.pointers.size === 1 && this.scale > MIN_SCALE) {
      const dx = event.clientX - this.panStartX;
      const dy = event.clientY - this.panStartY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.moved = true;
      this.offsetX = this.panOriginX + dx;
      this.offsetY = this.panOriginY + dy;
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.delete(event.pointerId);
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    } catch {
      // ignore
    }

    if (this.pointers.size >= 2) {
      this.beginPinch();
      return;
    }

    if (this.pointers.size === 1) {
      const remaining = [...this.pointers.values()][0]!;
      this.mode = 'pan';
      this.panStartX = remaining.x;
      this.panStartY = remaining.y;
      this.panOriginX = this.offsetX;
      this.panOriginY = this.offsetY;
      return;
    }

    this.mode = 'none';
    if (this.moved) this.suppressClick = true;
  }

  private beginPinch(): void {
    const pts = [...this.pointers.values()].slice(0, 2);
    if (pts.length < 2) return;
    this.mode = 'pinch';
    this.pinchStartDist = this.distance(pts[0]!, pts[1]!);
    this.pinchStartScale = this.scale;
    const mid = this.midpoint(pts[0]!, pts[1]!);
    this.pinchStartMidX = mid.x;
    this.pinchStartMidY = mid.y;
    this.pinchStartOffsetX = this.offsetX;
    this.pinchStartOffsetY = this.offsetY;
  }

  private applyPinch(): void {
    const pts = [...this.pointers.values()].slice(0, 2);
    if (pts.length < 2 || this.pinchStartDist <= 0) return;
    const dist = this.distance(pts[0]!, pts[1]!);
    const mid = this.midpoint(pts[0]!, pts[1]!);
    const next = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, this.pinchStartScale * (dist / this.pinchStartDist)),
    );
    this.scale = next;
    this.offsetX = this.pinchStartOffsetX + (mid.x - this.pinchStartMidX);
    this.offsetY = this.pinchStartOffsetY + (mid.y - this.pinchStartMidY);
    if (this.scale <= MIN_SCALE + 0.001) {
      this.scale = MIN_SCALE;
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  private setScale(next: number): void {
    this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    if (this.scale <= MIN_SCALE + 0.001) {
      this.resetView();
    }
  }

  private resetView(): void {
    this.scale = MIN_SCALE;
    this.offsetX = 0;
    this.offsetY = 0;
    this.mode = 'none';
    this.pointers.clear();
  }

  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  private midpoint(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
}
