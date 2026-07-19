import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { IonButton, IonIcon, IonInput } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import chroma from 'chroma-js';
import { ToastService } from '../../core/services/toast.service';

@Component({
  standalone: true,
  imports: [IonInput, IonButton, IonIcon, TranslateModule],
  selector: 'app-color-analyzer',
  template: `
    <div class="analyzer">
      <div class="swatch" [style.background]="hex"></div>
      <div class="hex-row">
        <ion-input
          class="analyzer-input"
          label="HEX"
          labelPlacement="stacked"
          fill="solid"
          [value]="hex"
          readonly
        ></ion-input>
        <ion-button class="copy-btn" fill="solid" (click)="copyHex()" [disabled]="!hex">
          <ion-icon slot="icon-only" name="copy-outline"></ion-icon>
        </ion-button>
      </div>
      <ion-input
        class="analyzer-input"
        label="RGB"
        labelPlacement="stacked"
        fill="solid"
        [value]="rgbText"
        readonly
      ></ion-input>

      <h4>{{ 'combinations' | translate }}</h4>
      <div class="combo-row">
        @for (c of combos; track $index) {
          <div class="combo">
            <div class="combo-swatch" [style.background]="c.color"></div>
            <small>{{ c.label }}</small>
          </div>
        }
      </div>

      <h4>{{ 'scale' | translate }}</h4>
      <div class="scale-row">
        @for (c of scale; track $index) {
          <div class="scale-swatch" [style.background]="c"></div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .analyzer {
        background: var(--color-wrap-bg);
        border-radius: 16px;
        padding: 14px;
        box-shadow: 0 6px 20px rgba(65, 88, 208, 0.15);
      }
      .swatch {
        height: 72px;
        border-radius: 12px;
        margin-bottom: 8px;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .hex-row {
        display: flex;
        align-items: stretch;
        gap: 8px;
        margin-bottom: 8px;
      }
      .hex-row .analyzer-input {
        flex: 1;
        margin-bottom: 0;
      }
      .copy-btn {
        align-self: flex-end;
        margin: 0 0 2px;
        width: 44px;
        height: 44px;
        --border-radius: 12px;
        --padding-start: 0;
        --padding-end: 0;
      }
      .analyzer-input {
        --background: var(--rm-surface-2, #e4e7f2);
        --border-radius: 12px;
        margin-bottom: 8px;
        pointer-events: auto;
      }
      h4 {
        margin: 12px 0 8px;
        font-size: 13px;
      }
      .combo-row,
      .scale-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .combo {
        width: 64px;
        text-align: center;
      }
      .combo-swatch,
      .scale-swatch {
        height: 36px;
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .combo-swatch {
        width: 100%;
      }
      .scale-swatch {
        flex: 1;
        min-width: 40px;
      }
      small {
        font-size: 10px;
        color: var(--color-sub-text);
      }
    `,
  ],
})
export class ColorAnalyzerComponent implements OnChanges {
  @Input() hex = '#D4F880';
  @Output() hexChange = new EventEmitter<string>();

  rgbText = '';
  combos: { label: string; color: string }[] = [];
  scale: string[] = [];

  constructor(
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hex']) {
      this.refresh();
    }
  }

  async copyHex(): Promise<void> {
    const value = (this.hex || '').trim();
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value.toUpperCase());
      await this.toasts.show(this.translate.instant('colorCopied'), 'success');
    } catch {
      await this.toasts.show(this.translate.instant('copyError'), 'danger');
    }
  }

  private refresh(): void {
    const value = chroma.valid(this.hex) ? this.hex : '#000000';
    const color = chroma(value);
    const [r, g, b] = color.rgb();
    this.rgbText = `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;
    const [h, s, l] = color.hsl();
    const hue = h || 0;
    this.combos = [
      { label: 'Complement', color: chroma.hsl((hue + 180) % 360, s, l).hex() },
      { label: 'Analog -30', color: chroma.hsl((hue - 30 + 360) % 360, s, l).hex() },
      { label: 'Analog +30', color: chroma.hsl((hue + 30) % 360, s, l).hex() },
      { label: 'Triad 1', color: chroma.hsl((hue + 120) % 360, s, l).hex() },
      { label: 'Triad 2', color: chroma.hsl((hue + 240) % 360, s, l).hex() },
    ];
    this.scale = chroma.scale([value, chroma(value).darken(2)]).mode('lab').colors(5);
  }
}
