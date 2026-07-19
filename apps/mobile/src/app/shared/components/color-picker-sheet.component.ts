import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import chroma from 'chroma-js';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

export interface ColorPickerSheetData {
  hex: string;
}

export interface ColorPickerSheetResult {
  hex: string;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  selector: 'app-color-picker-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="rm-cpicker"
      role="dialog"
      aria-modal="true"
      (touchstart)="$event.stopPropagation()"
      (pointerdown)="$event.stopPropagation()"
    >
      <div class="rm-cpicker__handle"></div>
      <h2>{{ 'pickColor' | translate }}</h2>

      <div class="rm-cpicker__preview" [style.background]="hex">
        <span [style.color]="contrastText">{{ hex }}</span>
      </div>

      <div
        #svEl
        class="rm-cpicker__sv"
        [style.background]="svBackground"
        (pointerdown)="onSvDown($event)"
      >
        <div class="rm-cpicker__sv-white"></div>
        <div class="rm-cpicker__sv-black"></div>
        <div class="rm-cpicker__sv-cursor" [style.left.%]="sat * 100" [style.top.%]="(1 - val) * 100"></div>
      </div>

      <div #hueEl class="rm-cpicker__hue" (pointerdown)="onHueDown($event)">
        <div class="rm-cpicker__hue-cursor" [style.left.%]="(hue % 360) / 360 * 100"></div>
      </div>

      <ion-input
        class="rm-cpicker__hex"
        label="HEX"
        labelPlacement="stacked"
        fill="solid"
        [(ngModel)]="hexInput"
        (ionBlur)="onHexBlur()"
      ></ion-input>

      <div class="rm-cpicker__actions">
        <ion-button expand="block" fill="outline" color="medium" (click)="cancel()">
          {{ 'cancel' | translate }}
        </ion-button>
        <ion-button expand="block" color="primary" (click)="apply()">
          {{ 'apply' | translate }}
        </ion-button>
      </div>
    </div>
  `,
  styles: [
    `
      app-color-picker-sheet {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }

      .rm-cpicker {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 16px calc(14px + env(safe-area-inset-bottom, 0px));
        border-radius: 22px 22px 0 0;
        background: var(--rm-elevated, #fff);
        color: var(--rm-ink, #16182a);
        box-shadow: 0 16px 40px rgba(22, 24, 42, 0.22);
        touch-action: none;
        overscroll-behavior: contain;
      }

      .rm-cpicker__handle {
        width: 40px;
        height: 4px;
        border-radius: 999px;
        background: rgba(22, 24, 42, 0.16);
        margin: 0 auto 12px;
      }

      .rm-cpicker h2 {
        margin: 0 0 12px;
        font-size: 1.1rem;
        font-weight: 700;
        text-align: center;
      }

      .rm-cpicker__preview {
        height: 52px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        margin-bottom: 12px;
        border: 1px solid rgba(22, 24, 42, 0.08);
        font-weight: 800;
        letter-spacing: 0.02em;
      }

      .rm-cpicker__sv {
        position: relative;
        width: 100%;
        aspect-ratio: 1.4;
        max-height: 180px;
        border-radius: 12px;
        overflow: hidden;
        touch-action: none;
        margin-bottom: 12px;
      }

      .rm-cpicker__sv-white,
      .rm-cpicker__sv-black {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .rm-cpicker__sv-white {
        background: linear-gradient(to right, #fff, transparent);
      }

      .rm-cpicker__sv-black {
        background: linear-gradient(to top, #000, transparent);
      }

      .rm-cpicker__sv-cursor {
        position: absolute;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
        transform: translate(-50%, -50%);
        pointer-events: none;
      }

      .rm-cpicker__hue {
        position: relative;
        height: 22px;
        border-radius: 999px;
        margin-bottom: 12px;
        touch-action: none;
        background: linear-gradient(
          to right,
          #ff0000,
          #ffff00,
          #00ff00,
          #00ffff,
          #0000ff,
          #ff00ff,
          #ff0000
        );
      }

      .rm-cpicker__hue-cursor {
        position: absolute;
        top: 50%;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        border: 2px solid rgba(0, 0, 0, 0.25);
        transform: translate(-50%, -50%);
        pointer-events: none;
      }

      .rm-cpicker__hex {
        --background: var(--rm-surface-2, #eef0f7);
        --border-radius: 12px;
        margin-bottom: 12px;
      }

      .rm-cpicker__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .rm-cpicker__actions ion-button {
        margin: 0;
        min-height: 44px;
        font-weight: 700;
      }
    `,
  ],
})
export class ColorPickerSheetComponent implements OnDestroy {
  @ViewChild('svEl') private svEl?: ElementRef<HTMLElement>;
  @ViewChild('hueEl') private hueEl?: ElementRef<HTMLElement>;

  hex = '#D4F880';
  hexInput = '#D4F880';
  hue = 70;
  sat = 0.7;
  val = 0.75;

  private svActive = false;
  private hueActive = false;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) data: ColorPickerSheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly sheetRef: OverlaySheetRef<ColorPickerSheetResult>,
  ) {
    this.setFromHex(data.hex || '#D4F880');
  }

  get svBackground(): string {
    return chroma.hsv(this.hue, 1, 1).hex();
  }

  get contrastText(): string {
    try {
      return chroma(this.hex).luminance() > 0.45 ? '#16182a' : '#ffffff';
    } catch {
      return '#ffffff';
    }
  }

  ngOnDestroy(): void {
    this.detachListeners();
  }

  cancel(): void {
    this.sheetRef.close(undefined);
  }

  apply(): void {
    this.sheetRef.close({ hex: this.hex.toUpperCase() });
  }

  onHexBlur(): void {
    const value = (this.hexInput || '').trim();
    const normalized = value.startsWith('#') ? value : `#${value}`;
    if (chroma.valid(normalized)) {
      this.setFromHex(normalized);
    } else {
      this.hexInput = this.hex;
    }
  }

  onSvDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.svActive = true;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.handleSv(event.clientX, event.clientY);
  }

  onHueDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.hueActive = true;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.handleHue(event.clientX);
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.svActive && !this.hueActive) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (this.svActive) {
      this.handleSv(event.clientX, event.clientY);
    }
    if (this.hueActive) {
      this.handleHue(event.clientX);
    }
  }

  @HostListener('window:pointerup')
  onPointerUp(): void {
    this.svActive = false;
    this.hueActive = false;
  }

  private handleSv(clientX: number, clientY: number): void {
    const el = this.svEl?.nativeElement;
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(0, clientX - r.left), r.width);
    const y = Math.min(Math.max(0, clientY - r.top), r.height);
    this.sat = r.width ? x / r.width : 0;
    this.val = r.height ? 1 - y / r.height : 0;
    this.updateHexFromHsv();
  }

  private handleHue(clientX: number): void {
    const el = this.hueEl?.nativeElement;
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(0, clientX - r.left), r.width);
    this.hue = r.width ? (x / r.width) * 360 : 0;
    this.updateHexFromHsv();
  }

  private updateHexFromHsv(): void {
    this.hex = chroma.hsv(this.hue, this.sat, this.val).hex().toUpperCase();
    this.hexInput = this.hex;
  }

  private setFromHex(value: string): void {
    const c = chroma.valid(value) ? chroma(value) : chroma('#D4F880');
    const [h, s, v] = c.hsv();
    this.hue = Number.isFinite(h) ? h : 0;
    this.sat = Number.isFinite(s) ? s : 0;
    this.val = Number.isFinite(v) ? v : 0;
    this.hex = c.hex().toUpperCase();
    this.hexInput = this.hex;
  }

  private detachListeners(): void {
    this.svActive = false;
    this.hueActive = false;
  }
}
